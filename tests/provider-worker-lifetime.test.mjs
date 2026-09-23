import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
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

async function requestFile(scratch) {
  for (const name of ['config', 'cache', 'data', 'tmp']) await fs.mkdir(path.join(scratch, name));
  const bytes = await fs.readFile(source);
  const selected = JSON.parse(bytes);
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
      env: {
        HOME: scratch,
        PATH: scratch,
        XDG_CONFIG_HOME: path.join(scratch, 'config'),
        XDG_CACHE_HOME: path.join(scratch, 'cache'),
        XDG_DATA_HOME: path.join(scratch, 'data'),
        TMPDIR: path.join(scratch, 'tmp'),
        TMP: path.join(scratch, 'tmp'),
        TEMP: path.join(scratch, 'tmp'),
        LANG: 'C.UTF-8',
      },
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
