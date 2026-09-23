import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const worker = fileURLToPath(
  new URL('../packages/publisher/src/provider/worker.mjs', import.meta.url),
);
const provider = fileURLToPath(
  new URL('./fixtures/providers/executable/package/provider.mjs', import.meta.url),
);
const source = new URL('./fixtures/providers/executable/inputs/source.json', import.meta.url);
const evidence = new URL('../build/test-work/', import.meta.url);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

async function waitForExit(pid) {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    if (!alive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return !alive(pid);
}

async function requestFile(scratch, scenario = undefined) {
  for (const name of ['config', 'cache', 'data', 'tmp']) await fs.mkdir(path.join(scratch, name));
  let bytes = await fs.readFile(source);
  const selected = JSON.parse(bytes);
  if (scenario) {
    selected.scenario = scenario;
    bytes = Buffer.from(JSON.stringify(selected));
  }
  const input = {
    schema: 'architecture.edition-provider-request/v1',
    provider: { id: 'fixture-executable-provider', revision: '1.0.0' },
    subject: {
      id: selected.reply.source.id,
      revision: selected.reply.source.revision,
    },
    inputs: [
      {
        id: 'source',
        mediaType: 'application/json',
        bytes: bytes.length,
        sha256: sha(bytes),
        contentBase64: bytes.toString('base64'),
      },
    ],
  };
  const requestPath = path.join(scratch, 'request.json');
  await fs.writeFile(requestPath, JSON.stringify(input));
  return requestPath;
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
  };
}

test('unreclaimed Provider worker stays available for cleanup, then self-expires', async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL('provider-worker-lifetime-', evidence));
  let request;
  let child;
  try {
    const requestPath = await requestFile(scratch);
    request = await fs.open(requestPath, 'r');
    child = spawn(process.execPath, [worker, provider, '500'], {
      cwd: scratch,
      env: workerEnvironment(scratch),
      stdio: [request.fd, 'pipe', 'pipe'],
      windowsHide: true,
    });
    let output = '';
    await new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error('worker reply deadline')), 2_000);
      const done = () => {
        clearTimeout(deadline);
        resolve();
      };
      child.stdout.on('data', (chunk) => {
        output += chunk;
        if (output.includes('\n')) done();
      });
      child.once('close', done);
    });
    assert.equal(JSON.parse(output.trim()).status, 'ok');
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(alive(child.pid), true, 'worker exited before its owner could reclaim the tree');
    assert.equal(output.endsWith('\n'), true, 'worker reply is not framed');
    assert.equal(await waitForExit(child.pid), true, 'worker lacks a self-expiring deadline');
  } finally {
    if (child && alive(child.pid)) child.kill('SIGKILL');
    await request?.close();
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test('worker self-deadline survives synchronous Provider code', async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL('provider-worker-blocked-', evidence));
  let request;
  let child;
  try {
    const requestPath = await requestFile(scratch, 'blocked-event-loop');
    request = await fs.open(requestPath, 'r');
    child = spawn(process.execPath, [worker, provider, '500'], {
      cwd: scratch,
      env: workerEnvironment(scratch),
      stdio: [request.fd, 'ignore', 'ignore'],
      windowsHide: true,
    });
    assert.equal(
      await waitForExit(child.pid),
      true,
      'synchronous Provider code blocked the worker self-deadline',
    );
  } finally {
    if (child && alive(child.pid)) child.kill('SIGKILL');
    await request?.close();
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test('unavailable tree cleanup cannot admit a valid Provider reply', async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL('provider-cleanup-unavailable-', evidence));
  let selectedPid;
  try {
    const requestPath = await requestFile(scratch);
    const { runProviderWorker } = await import('../packages/publisher/src/provider/supervisor.mjs');
    await assert.rejects(
      runProviderWorker({
        entrypoint: provider,
        requestPath,
        scratch,
        limits: { timeoutMs: 1_000, replyBytes: 2 * 1024 * 1024 },
        terminateTree: async (pid) => {
          selectedPid = pid;
          throw new Error('simulated native cleanup failure');
        },
      }),
      { code: 'edition_provider_cleanup_failed' },
    );
    assert.equal(Number.isSafeInteger(selectedPid), true);
    assert.equal(await waitForExit(selectedPid), true, 'worker survived cleanup failure');
  } finally {
    if (selectedPid && alive(selectedPid)) process.kill(selectedPid, 'SIGKILL');
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test('unproved tree cleanup remains distinct from ordinary cleanup failure', async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL('provider-cleanup-unproved-', evidence));
  let selectedPid;
  try {
    const requestPath = await requestFile(scratch);
    const { runProviderWorker } = await import('../packages/publisher/src/provider/supervisor.mjs');
    await assert.rejects(
      runProviderWorker({
        entrypoint: provider,
        requestPath,
        scratch,
        limits: { timeoutMs: 1_000, replyBytes: 2 * 1024 * 1024 },
        terminateTree: async (pid) => {
          selectedPid = pid;
          process.kill(pid, 'SIGKILL');
          throw Object.assign(new Error('selected root exited before tree cleanup'), {
            code: 'edition_provider_cleanup_unproved',
          });
        },
      }),
      { code: 'edition_provider_cleanup_unproved' },
    );
    assert.equal(await waitForExit(selectedPid), true);
  } finally {
    if (selectedPid && alive(selectedPid)) process.kill(selectedPid, 'SIGKILL');
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test('a rejected reply and failed cleanup retain both precise causes', async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL('provider-dual-failure-', evidence));
  let selectedPid;
  try {
    const requestPath = await requestFile(scratch, 'malformed');
    const { runProviderWorker } = await import('../packages/publisher/src/provider/supervisor.mjs');
    await assert.rejects(
      runProviderWorker({
        entrypoint: provider,
        requestPath,
        scratch,
        limits: { timeoutMs: 1_000, replyBytes: 2 * 1024 * 1024 },
        terminateTree: async (pid) => {
          selectedPid = pid;
          throw new Error('simulated native cleanup failure');
        },
      }),
      {
        code: 'edition_provider_cleanup_failed',
        originalFailure: 'edition_provider_response_invalid',
        cleanupFailure: 'simulated native cleanup failure',
      },
    );
    assert.equal(await waitForExit(selectedPid), true);
  } finally {
    if (selectedPid && alive(selectedPid)) process.kill(selectedPid, 'SIGKILL');
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test('a cleanup rejection without an Error never admits the Provider reply', async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL('provider-empty-cleanup-error-', evidence));
  let selectedPid;
  try {
    const requestPath = await requestFile(scratch);
    const { runProviderWorker } = await import('../packages/publisher/src/provider/supervisor.mjs');
    await assert.rejects(
      runProviderWorker({
        entrypoint: provider,
        requestPath,
        scratch,
        limits: { timeoutMs: 1_000, replyBytes: 2 * 1024 * 1024 },
        terminateTree: async (pid) => {
          selectedPid = pid;
          throw undefined;
        },
      }),
      { code: 'edition_provider_cleanup_failed' },
    );
    assert.equal(await waitForExit(selectedPid), true);
  } finally {
    if (selectedPid && alive(selectedPid)) process.kill(selectedPid, 'SIGKILL');
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test('POSIX group loss cannot pass while the selected worker is still present', async () => {
  const { terminatePosixGroup } = await import('../packages/publisher/src/provider/supervisor.mjs');
  const calls = [];
  const signal = (target, kind) => {
    calls.push([target, kind]);
    if (target < 0) throw Object.assign(new Error('group absent'), { code: 'ESRCH' });
  };
  await assert.rejects(terminatePosixGroup(4242, signal), {
    message: 'selected worker remains alive without its process group',
  });
  assert.deepEqual(calls, [
    [-4242, 'SIGKILL'],
    [4242, 0],
  ]);
});

test('POSIX cleanup distinguishes an absent tree from unexpected signal failures', async () => {
  const { terminatePosixGroup } = await import('../packages/publisher/src/provider/supervisor.mjs');
  await terminatePosixGroup(4242, () => {
    throw Object.assign(new Error('already absent'), { code: 'ESRCH' });
  });
  await assert.rejects(
    terminatePosixGroup(4242, (target) => {
      throw Object.assign(new Error('permission denied'), {
        code: target < 0 ? 'ESRCH' : 'EPERM',
      });
    }),
    { code: 'EPERM' },
  );
  await assert.rejects(
    terminatePosixGroup(4242, () => {
      throw Object.assign(new Error('group signal denied'), { code: 'EPERM' });
    }),
    { code: 'EPERM' },
  );
});

test(
  'tree terminator scopes a native-tool invocation to the selected PID',
  {
    skip: process.platform === 'win32',
  },
  async () => {
    await fs.mkdir(evidence, { recursive: true });
    const scratch = await fs.mkdtemp(new URL('provider-native-tool-', evidence));
    const tool = path.join(scratch, 'taskkill.exe');
    const marker = path.join(scratch, 'invocation');
    let selected;
    let sentinel;
    try {
      await fs.writeFile(
        tool,
        `#!/bin/sh\nprintf '%s\\n' "$*" > ${JSON.stringify(marker)}\n` +
          '[ "$1" = /PID ] && [ "$3" = /T ] && [ "$4" = /F ] || exit 7\n' +
          'kill -KILL "$2"\n',
      );
      await fs.chmod(tool, 0o700);
      selected = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: 'ignore',
      });
      sentinel = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: 'ignore',
      });
      const { terminateWindowsTree } =
        await import('../packages/publisher/src/provider/supervisor.mjs');
      await terminateWindowsTree(tool, selected, { exited: false });
      assert.equal(await waitForExit(selected.pid), true);
      assert.equal(alive(sentinel.pid), true, 'unrelated process was killed');
      assert.equal(await fs.readFile(marker, 'utf8'), `/PID ${selected.pid} /T /F\n`);
    } finally {
      if (selected && alive(selected.pid)) selected.kill('SIGKILL');
      if (sentinel && alive(sentinel.pid)) sentinel.kill('SIGKILL');
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test(
  'tree terminator never invokes a native tool after the root exits',
  {
    skip: process.platform === 'win32',
  },
  async () => {
    await fs.mkdir(evidence, { recursive: true });
    const scratch = await fs.mkdtemp(new URL('provider-root-gone-', evidence));
    const tool = path.join(scratch, 'taskkill.exe');
    const marker = path.join(scratch, 'invoked');
    const selected = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      stdio: 'ignore',
    });
    const completed = spawn(process.execPath, ['-e', 'process.exit(0)'], {
      stdio: 'ignore',
    });
    const completedClosed = new Promise((resolve) => completed.once('close', resolve));
    try {
      await fs.writeFile(tool, `#!/bin/sh\ntouch ${JSON.stringify(marker)}\n`);
      await fs.chmod(tool, 0o700);
      const selectedClosed = new Promise((resolve) => selected.once('close', resolve));
      selected.kill('SIGKILL');
      await selectedClosed;
      await completedClosed;
      const { terminateWindowsTree } =
        await import('../packages/publisher/src/provider/supervisor.mjs');
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: true }), {
        code: 'edition_provider_cleanup_unproved',
      });
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: false }), {
        code: 'edition_provider_cleanup_unproved',
      });
      await assert.rejects(terminateWindowsTree(tool, completed, { exited: false }), {
        code: 'edition_provider_cleanup_unproved',
      });
      await assert.rejects(
        terminateWindowsTree(
          tool,
          { pid: selected.pid, exitCode: null, signalCode: null },
          { exited: false },
        ),
        { code: 'edition_provider_cleanup_unproved' },
      );
      await assert.rejects(fs.access(marker), { code: 'ENOENT' });
    } finally {
      if (alive(selected.pid)) selected.kill('SIGKILL');
      if (alive(completed.pid)) completed.kill('SIGKILL');
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test('native tool resolution rejects missing candidates before execution', async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'provider-tool-resolution-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const { resolveWindowsTaskkill } =
    await import('../packages/publisher/src/provider/supervisor.mjs');
  await assert.rejects(resolveWindowsTaskkill(''), {
    code: 'edition_provider_cleanup_unavailable',
  });
  await assert.rejects(resolveWindowsTaskkill('relative-system-root'), {
    code: 'edition_provider_cleanup_unavailable',
  });
  await assert.rejects(resolveWindowsTaskkill(scratch), {
    code: 'edition_provider_cleanup_unavailable',
  });
  const system32 = path.join(scratch, 'System32');
  await fs.mkdir(system32);
  const tool = path.join(system32, 'taskkill.exe');
  await fs.mkdir(tool);
  await assert.rejects(resolveWindowsTaskkill(scratch), {
    code: 'edition_provider_cleanup_unavailable',
  });
  await fs.rmdir(tool);
  await fs.writeFile(tool, '');
  assert.equal(await resolveWindowsTaskkill(scratch), tool);
});

test(
  'native tree tool spawn failure rejects cleanup while the selected root survives',
  { skip: process.platform === 'win32' },
  async () => {
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), 'provider-tool-spawn-error-'),
    );
    const selected = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      stdio: 'ignore',
    });
    try {
      const { terminateWindowsTree } =
        await import('../packages/publisher/src/provider/supervisor.mjs');
      await assert.rejects(
        terminateWindowsTree(path.join(scratch, 'missing-taskkill.exe'), selected, {
          exited: false,
        }),
        { code: 'ENOENT' },
      );
      assert.equal(alive(selected.pid), true);
    } finally {
      if (alive(selected.pid)) selected.kill('SIGKILL');
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test(
  'native tool failure after root loss reports cleanup as unproved',
  { skip: process.platform === 'win32' },
  async () => {
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), 'provider-tool-root-race-'),
    );
    const tool = path.join(scratch, 'taskkill.exe');
    const selected = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      stdio: 'ignore',
    });
    try {
      await fs.writeFile(tool, '#!/bin/sh\nkill -KILL "$2"\nsleep 1\nexit 7\n');
      await fs.chmod(tool, 0o700);
      const { terminateWindowsTree } =
        await import('../packages/publisher/src/provider/supervisor.mjs');
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: false }), {
        code: 'edition_provider_cleanup_unproved',
      });
      assert.equal(await waitForExit(selected.pid), true);
    } finally {
      if (alive(selected.pid)) selected.kill('SIGKILL');
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test(
  'native tree tool nonzero exit cannot claim cleanup',
  { skip: process.platform === 'win32' },
  async () => {
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), 'provider-tool-failure-'),
    );
    const tool = path.join(scratch, 'taskkill.exe');
    const selected = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      stdio: 'ignore',
    });
    try {
      await fs.writeFile(tool, '#!/bin/sh\nexit 7\n');
      await fs.chmod(tool, 0o700);
      const { terminateWindowsTree } =
        await import('../packages/publisher/src/provider/supervisor.mjs');
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: false }), {
        message: 'native tree cleanup exited 7',
      });
      assert.equal(alive(selected.pid), true);
    } finally {
      if (alive(selected.pid)) selected.kill('SIGKILL');
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test(
  'native tree tool deadline kills the tool and rejects cleanup',
  {
    skip: process.platform === 'win32',
  },
  async () => {
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), 'provider-tool-timeout-'),
    );
    const tool = path.join(scratch, 'taskkill.exe');
    const marker = path.join(scratch, 'tool.pid');
    const selected = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      stdio: 'ignore',
    });
    let toolPid;
    try {
      await fs.writeFile(tool, `#!/bin/sh\necho $$ > ${JSON.stringify(marker)}\nexec sleep 30\n`);
      await fs.chmod(tool, 0o700);
      const { terminateWindowsTree } =
        await import('../packages/publisher/src/provider/supervisor.mjs');
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: false }), {
        message: 'native tree cleanup exceeded its deadline',
      });
      toolPid = Number(await fs.readFile(marker, 'utf8'));
      assert.equal(await waitForExit(toolPid), true, 'timed-out native tool survived');
    } finally {
      if (toolPid && alive(toolPid)) process.kill(toolPid, 'SIGKILL');
      if (alive(selected.pid)) selected.kill('SIGKILL');
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);
