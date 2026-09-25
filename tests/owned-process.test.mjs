import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { runOwnedProcess } from '../packages/publisher/src/runtime/process-tree.mjs';

async function fixture(t, workerSource) {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-owned-'));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const worker = path.join(scratch, 'worker.mjs');
  const requestPath = path.join(scratch, 'request.json');
  await fs.writeFile(worker, workerSource);
  await fs.writeFile(requestPath, '{}');
  return { worker, requestPath, scratch };
}

test('neutral owned process validates one reply after bounded tree cleanup', async (t) => {
  const selected = await fixture(
    t,
    "import fs from 'node:fs'; const request = fs.readFileSync(0, 'utf8'); process.stdout.write(JSON.stringify({ status: 'ok', request, home: process.env.HOME, path: process.env.PATH }) + '\\n'); setInterval(() => {}, 1000);",
  );
  const result = await runOwnedProcess({
    ...selected,
    args: [],
    timeoutMs: 2_000,
    maximumBytes: 1024,
    failurePrefix: 'native_likec4',
    decode(raw, state, reason) {
      assert.equal(reason, 'reply');
      assert.equal(state.stderrBytes, 0);
      return JSON.parse(raw);
    },
  });
  assert.deepEqual(result, {
    status: 'ok',
    request: '{}',
    home: selected.scratch,
    path: selected.scratch,
  });
});

test('neutral owned process withholds success on timeout or unproved cleanup', async (t) => {
  const waiting = await fixture(t, 'setInterval(() => {}, 1000);');
  await assert.rejects(
    runOwnedProcess({
      ...waiting,
      args: [],
      timeoutMs: 80,
      maximumBytes: 1024,
      failurePrefix: 'native_likec4',
      decode(_raw, _state, reason) {
        assert.equal(reason, 'timeout');
        throw Object.assign(new Error('native_likec4_timeout'), { code: 'native_likec4_timeout' });
      },
    }),
    { code: 'native_likec4_timeout' },
  );

  const responding = await fixture(
    t,
    'process.stdout.write(\'{"status":"ok"}\\n\'); setInterval(() => {}, 1000);',
  );
  await assert.rejects(
    runOwnedProcess({
      ...responding,
      args: [],
      timeoutMs: 2_000,
      maximumBytes: 1024,
      failurePrefix: 'native_likec4',
      terminateTree: async () => {
        throw Object.assign(new Error('cleanup unavailable'), {
          code: 'native_likec4_cleanup_unproved',
        });
      },
      decode: () => ({ status: 'ok' }),
    }),
    { code: 'native_likec4_cleanup_unproved' },
  );
});

test('owned worker keeps inherited input available while explicit Node permissions deny ambient reads', async (t) => {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 13) || (major === 23 && minor < 5)) {
    t.skip('stable Node Permission Model requires Node 22.13 or newer');
    return;
  }
  const selected = await fixture(
    t,
    "import fs from 'node:fs'; let denied = false; try { fs.readFileSync(process.argv[2]); } catch (error) { denied = error.code === 'ERR_ACCESS_DENIED'; } process.stdout.write(JSON.stringify({ denied, request: fs.readFileSync(0, 'utf8') }) + '\\n'); setInterval(() => {}, 1000);",
  );
  const ambient = path.join(selected.scratch, 'ambient.txt');
  await fs.writeFile(ambient, 'unselected');
  const result = await runOwnedProcess({
    ...selected,
    nodeFlags: ['--permission', `--allow-fs-read=${selected.worker}`],
    args: [ambient],
    timeoutMs: 2_000,
    maximumBytes: 1024,
    failurePrefix: 'native_likec4',
    decode(raw, _state, reason) {
      assert.equal(reason, 'reply');
      return JSON.parse(raw);
    },
  });
  assert.deepEqual(result, { denied: true, request: '{}' });
});
