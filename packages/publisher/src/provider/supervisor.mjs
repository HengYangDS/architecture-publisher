import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fail } from '../source/manifest.mjs';

const worker = fileURLToPath(new URL('./worker.mjs', import.meta.url));
const CLEANUP_MS = 5_000;

function exact(value, fields) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join('\n') === [...fields].sort().join('\n')
  );
}

function responseLimit(bytes) {
  return Math.ceil(bytes / 3) * 4 + 64 * 1024;
}

function workerEnvironment(scratch) {
  return {
    HOME: scratch,
    PATH: scratch,
    XDG_CONFIG_HOME: path.join(scratch, 'config'),
    XDG_CACHE_HOME: path.join(scratch, 'cache'),
    XDG_DATA_HOME: path.join(scratch, 'data'),
    TMPDIR: path.join(scratch, 'tmp'),
    TMP: path.join(scratch, 'tmp'),
    TEMP: path.join(scratch, 'tmp'),
    LANG: 'C.UTF-8',
    ...(process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}),
  };
}

export async function terminatePosixGroup(pid, signal = process.kill) {
  try {
    signal(-pid, 'SIGKILL');
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
    let workerAlive = false;
    try {
      signal(pid, 0);
      workerAlive = true;
    } catch (workerError) {
      if (workerError.code !== 'ESRCH') throw workerError;
    }
    if (workerAlive)
      throw new Error('selected worker remains alive without its process group', {
        cause: error,
      });
  }
}

export async function resolveWindowsTaskkill(systemRoot = process.env.SystemRoot) {
  if (!systemRoot || !path.isAbsolute(systemRoot)) fail('edition_provider_cleanup_unavailable');
  const tool = path.join(systemRoot, 'System32', 'taskkill.exe');
  try {
    if (!(await fs.stat(tool)).isFile()) fail('edition_provider_cleanup_unavailable');
  } catch {
    fail('edition_provider_cleanup_unavailable');
  }
  return tool;
}

function selectedWorkerPresent(child, state) {
  if (state.exited || child.exitCode !== null || child.signalCode !== null) return false;
  try {
    process.kill(child.pid, 0);
    return true;
  } catch {
    return false;
  }
}

function cleanupUnproved(cause) {
  return Object.assign(new Error('edition_provider_cleanup_unproved', { cause }), {
    code: 'edition_provider_cleanup_unproved',
  });
}

export async function terminateWindowsTree(tool, child, state) {
  if (!selectedWorkerPresent(child, state)) throw cleanupUnproved();
  try {
    await new Promise((resolve, reject) => {
      const terminator = spawn(tool, ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      const deadline = setTimeout(() => {
        terminator.kill('SIGKILL');
        reject(new Error('native tree cleanup exceeded its deadline'));
      }, CLEANUP_MS);
      terminator.once('error', (error) => {
        clearTimeout(deadline);
        reject(error);
      });
      terminator.once('close', (code) => {
        clearTimeout(deadline);
        if (code === 0) resolve();
        else reject(new Error(`native tree cleanup exited ${code}`));
      });
    });
  } catch (error) {
    if (!selectedWorkerPresent(child, state)) throw cleanupUnproved(error);
    throw error;
  }
}

function observe(child, maximumBytes, timeoutMs) {
  const state = {
    stdout: [],
    stdoutBytes: 0,
    stderrBytes: 0,
    exited: false,
    closed: null,
    spawnError: null,
  };
  let resolveTrigger;
  let resolveClosed;
  let selected = false;
  const trigger = new Promise((resolve) => {
    resolveTrigger = resolve;
  });
  const closed = new Promise((resolve) => {
    resolveClosed = resolve;
  });
  const deadline = setTimeout(() => select('timeout'), timeoutMs);

  function select(reason) {
    if (selected) return;
    selected = true;
    clearTimeout(deadline);
    resolveTrigger(reason);
  }

  child.stdout.on('data', (chunk) => {
    state.stdoutBytes += chunk.length;
    if (state.stdoutBytes < maximumBytes) state.stdout.push(chunk);
    if (state.stdoutBytes >= maximumBytes) select('overflow');
    else if (chunk.includes(0x0a)) select('reply');
  });
  child.stderr.on('data', (chunk) => {
    state.stderrBytes += chunk.length;
    select('stderr');
  });
  child.once('error', (error) => {
    state.spawnError = error;
    select('spawn-error');
  });
  child.once('exit', () => {
    state.exited = true;
  });
  child.once('close', (code, signal) => {
    state.closed = { code, signal };
    resolveClosed(state.closed);
    select('closed');
  });
  return { state, trigger, closed };
}

async function waitForClose(closed) {
  let deadline;
  try {
    return await Promise.race([
      closed,
      new Promise((resolve) => {
        deadline = setTimeout(() => resolve(null), CLEANUP_MS);
      }),
    ]);
  } finally {
    clearTimeout(deadline);
  }
}

function cleanupFailure(originalFailure, cause) {
  const code =
    cause?.code === 'edition_provider_cleanup_unproved'
      ? 'edition_provider_cleanup_unproved'
      : 'edition_provider_cleanup_failed';
  return Object.assign(new Error(code), {
    code,
    originalFailure,
    cleanupFailure: cause?.code ?? cause?.message ?? 'unobserved',
  });
}

function decodeReply(raw, state, reason, closedBeforeCleanup, validateReply) {
  if (reason === 'timeout') fail('edition_provider_timeout');
  if (reason === 'overflow' || state.stdoutBytes >= responseLimit(state.maximumReplyBytes))
    fail('edition_provider_reply_size_invalid');
  if (state.stderrBytes) fail('edition_provider_stderr_invalid');
  if (state.spawnError || (closedBeforeCleanup && reason === 'reply'))
    fail('edition_provider_process_failed');
  if (!raw)
    fail(
      state.closed?.code === 0
        ? 'edition_provider_response_invalid'
        : 'edition_provider_process_failed',
    );
  let envelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    fail('edition_provider_response_invalid');
  }
  if (exact(envelope, ['status', 'code']) && envelope.status === 'error') {
    if (typeof envelope.code !== 'string' || !/^edition_provider_[a-z0-9_]+$/u.test(envelope.code))
      fail('edition_provider_response_invalid');
    fail(envelope.code);
  }
  if (!exact(envelope, ['status', 'reply']) || envelope.status !== 'ok')
    fail('edition_provider_response_invalid');
  return validateReply(envelope.reply);
}

/** Run one selected Provider worker, then reclaim its owned process tree. */
export async function runProviderWorker({
  entrypoint,
  requestPath,
  scratch,
  limits,
  terminateTree = undefined,
  validateReply,
}) {
  if (typeof validateReply !== 'function') fail('edition_provider_reply_validator_required');
  const windowsTool =
    !terminateTree && process.platform === 'win32' ? await resolveWindowsTaskkill() : null;
  const handle = await fs.open(requestPath, 'r');
  let child;
  try {
    child = spawn(
      process.execPath,
      [worker, entrypoint, String(limits.timeoutMs + CLEANUP_MS + 1_000)],
      {
        cwd: scratch,
        env: workerEnvironment(scratch),
        stdio: [handle.fd, 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
        windowsHide: true,
      },
    );
    const observation = observe(child, responseLimit(limits.replyBytes), limits.timeoutMs);
    observation.state.maximumReplyBytes = limits.replyBytes;
    const reason = await observation.trigger;
    const closedBeforeCleanup = observation.state.closed !== null;
    let cleanupError;
    if (child.pid) {
      try {
        if (terminateTree) await terminateTree(child.pid);
        else if (windowsTool) await terminateWindowsTree(windowsTool, child, observation.state);
        else await terminatePosixGroup(child.pid);
      } catch (error) {
        cleanupError =
          error instanceof Error
            ? error
            : new Error('native tree cleanup rejected without an Error', { cause: error });
        child.kill('SIGKILL');
      }
    }
    const closed = await waitForClose(observation.closed);
    if (!closed) {
      child.kill('SIGKILL');
      cleanupError ??= new Error('selected worker did not close after cleanup');
    }
    const raw = Buffer.concat(observation.state.stdout).toString('utf8');
    let reply;
    try {
      reply = decodeReply(raw, observation.state, reason, closedBeforeCleanup, validateReply);
    } catch (error) {
      if (cleanupError) throw cleanupFailure(error.code ?? reason, cleanupError);
      throw error;
    }
    if (cleanupError) throw cleanupFailure(null, cleanupError);
    return { raw, reply };
  } finally {
    if (child && !child.killed && child.exitCode === null && child.signalCode === null)
      child.kill('SIGKILL');
    await handle.close();
  }
}
