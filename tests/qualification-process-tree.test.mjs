import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const boundaryUrl = new URL(
  '../packages/publisher/src/qualification/process-boundary.mjs',
  import.meta.url,
);
const processTreeUrl = new URL(
  '../packages/publisher/src/runtime/process-tree.mjs',
  import.meta.url,
);

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

async function exited(pid) {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    if (!alive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return !alive(pid);
}

async function optionalPid(file) {
  try {
    return Number(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

test('whole-invocation timeout reclaims registered nested groups and leaves unrelated processes', async (t) => {
  if (process.platform === 'win32') {
    t.skip('POSIX process-group counterexample; native Windows tree test is separate');
    return;
  }
  const boundary = await import(boundaryUrl).catch(() => null);
  assert.equal(typeof boundary?.runBoundedQualification, 'function');
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-qual-tree-'));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  for (const name of ['config', 'cache', 'data', 'tmp']) await fs.mkdir(path.join(scratch, name));
  const marker = path.join(scratch, 'nested.pid');
  const nested = path.join(scratch, 'nested.mjs');
  const outer = path.join(scratch, 'outer.mjs');
  const requestPath = path.join(scratch, 'request.json');
  await fs.writeFile(
    nested,
    `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, String(process.pid)); setInterval(() => {}, 1000);`,
  );
  await fs.writeFile(
    outer,
    `import fs from 'node:fs';
     import { runOwnedProcess } from ${JSON.stringify(processTreeUrl.href)};
     import { withQualificationOwnership } from ${JSON.stringify(boundaryUrl.href)};
     const request = JSON.parse(fs.readFileSync(0, 'utf8'));
     await withQualificationOwnership(() => runOwnedProcess({
       worker: request.nested,
       args: [],
       requestPath: request.requestPath,
       scratch: request.scratch,
       timeoutMs: 30_000,
       maximumBytes: 1024,
       failurePrefix: 'nested_test',
       decode: (raw) => JSON.parse(raw),
     }));`,
  );
  await fs.writeFile(requestPath, JSON.stringify({ nested, requestPath, scratch }));
  const sentinel = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
  });
  let nestedPid;
  try {
    await assert.rejects(
      boundary.runBoundedQualification({
        worker: outer,
        requestPath,
        scratch,
        timeoutMs: 1_000,
        maximumBytes: 1024,
        decode: (raw) => JSON.parse(raw),
      }),
      { code: 'qualification_timeout' },
    );
    nestedPid = Number(await fs.readFile(marker, 'utf8'));
    assert(Number.isSafeInteger(nestedPid));
    assert.equal(await exited(nestedPid), true, 'registered nested group survived timeout');
    assert.equal(alive(sentinel.pid), true, 'unrelated sentinel was terminated');
  } finally {
    nestedPid ||= await optionalPid(marker);
    if (nestedPid && alive(nestedPid)) process.kill(nestedPid, 'SIGKILL');
    if (alive(sentinel.pid)) sentinel.kill('SIGKILL');
  }
});

test('normal nested cleanup releases ownership before a qualification reply', async (t) => {
  const { runBoundedQualification } = await import(boundaryUrl);
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-qual-ok-'));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  for (const name of ['config', 'cache', 'data', 'tmp']) await fs.mkdir(path.join(scratch, name));
  const nested = path.join(scratch, 'nested.mjs');
  const outer = path.join(scratch, 'outer.mjs');
  const requestPath = path.join(scratch, 'request.json');
  await fs.writeFile(
    nested,
    `process.stdout.write('{"status":"ok"}\\n'); setInterval(() => {}, 1000);`,
  );
  await fs.writeFile(
    outer,
    `import fs from 'node:fs';
     import { runOwnedProcess } from ${JSON.stringify(processTreeUrl.href)};
     import { withQualificationOwnership } from ${JSON.stringify(boundaryUrl.href)};
     const request = JSON.parse(fs.readFileSync(0, 'utf8'));
     const result = await withQualificationOwnership(() => runOwnedProcess({
       worker: request.nested,
       args: [],
       requestPath: request.requestPath,
       scratch: request.scratch,
       timeoutMs: 2_000,
       maximumBytes: 1024,
       failurePrefix: 'nested_test',
       decode: (raw) => JSON.parse(raw),
     }));
     process.stdout.write(JSON.stringify(result) + '\\n');
     setInterval(() => {}, 1000);`,
  );
  await fs.writeFile(requestPath, JSON.stringify({ nested, requestPath, scratch }));
  assert.deepEqual(
    await runBoundedQualification({
      worker: outer,
      requestPath,
      scratch,
      timeoutMs: 3_000,
      maximumBytes: 1024,
      decode: (raw) => JSON.parse(raw),
    }),
    { status: 'ok' },
  );
});

test('an early reply cannot pass while a registered nested group remains live', async (t) => {
  if (process.platform === 'win32') {
    t.skip('POSIX process-group counterexample; native Windows tree test is separate');
    return;
  }
  const { runBoundedQualification } = await import(boundaryUrl);
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-qual-early-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const marker = path.join(scratch, 'nested.pid');
  const outer = path.join(scratch, 'outer.mjs');
  const requestPath = path.join(scratch, 'request.json');
  await fs.writeFile(requestPath, '{}');
  await fs.writeFile(
    outer,
    `import { spawn } from 'node:child_process';
     import fs from 'node:fs';
     const nested = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
       detached: true, stdio: 'ignore',
     });
     fs.writeFileSync(${JSON.stringify(marker)}, String(nested.pid));
     process.once('message', () => {
       process.stdout.write('{"status":"ok"}\\n');
       setInterval(() => {}, 1000);
     });
     process.send({ kind: 'qualification-ownership-event', action: 'register', id: 1, pid: nested.pid });`,
  );
  let nestedPid;
  try {
    await assert.rejects(
      runBoundedQualification({
        worker: outer,
        requestPath,
        scratch,
        timeoutMs: 2_000,
        maximumBytes: 1024,
        decode: (raw) => JSON.parse(raw),
      }),
      { code: 'qualification_ownership_unreleased' },
    );
    nestedPid = Number(await fs.readFile(marker, 'utf8'));
    assert.equal(await exited(nestedPid), true);
  } finally {
    nestedPid ||= await optionalPid(marker);
    if (nestedPid && alive(nestedPid)) process.kill(nestedPid, 'SIGKILL');
  }
});

test('a malformed ownership message cannot borrow a passing worker reply', async (t) => {
  const { runBoundedQualification } = await import(boundaryUrl);
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-qual-bad-'));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const outer = path.join(scratch, 'outer.mjs');
  const requestPath = path.join(scratch, 'request.json');
  await fs.writeFile(requestPath, '{}');
  await fs.writeFile(
    outer,
    `process.send({ kind: 'qualification-ownership-event', action: 'register', id: 1, pid: 42, extra: true });
     process.stdout.write('{"status":"ok"}\\n');
     setInterval(() => {}, 1000);`,
  );
  await assert.rejects(
    runBoundedQualification({
      worker: outer,
      requestPath,
      scratch,
      timeoutMs: 2_000,
      maximumBytes: 1024,
      decode: (raw) => JSON.parse(raw),
    }),
    { code: 'qualification_ownership_protocol_invalid' },
  );
});

for (const [name, event] of [
  ['a worker registering its own PID', "{ action: 'register', pid: process.pid }"],
  ['an unregistered worker release', "{ action: 'release', pid: process.pid }"],
])
  test(`${name} cannot borrow a passing reply`, async (t) => {
    const { runBoundedQualification } = await import(boundaryUrl);
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), 'archpub-qual-rejected-event-'),
    );
    t.after(() => fs.rm(scratch, { recursive: true, force: true }));
    const outer = path.join(scratch, 'outer.mjs');
    const requestPath = path.join(scratch, 'request.json');
    await fs.writeFile(requestPath, '{}');
    await fs.writeFile(
      outer,
      `process.once('message', ({ accepted }) => {
        if (accepted) throw new Error('invalid event accepted');
        process.stdout.write('{"status":"ok"}\\n');
        setInterval(() => {}, 1000);
      });
      process.send({ kind: 'qualification-ownership-event', id: 1, ...${event} });`,
    );
    await assert.rejects(
      runBoundedQualification({
        worker: outer,
        requestPath,
        scratch,
        timeoutMs: 2_000,
        maximumBytes: 1024,
        decode: (raw) => JSON.parse(raw),
      }),
      { code: 'qualification_ownership_protocol_invalid' },
    );
  });

test('qualification cannot accept stderr beside an otherwise valid worker reply', async (t) => {
  const { runBoundedQualification } = await import(boundaryUrl);
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-qual-stderr-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const outer = path.join(scratch, 'outer.mjs');
  const requestPath = path.join(scratch, 'request.json');
  await fs.writeFile(requestPath, '{}');
  await fs.writeFile(
    outer,
    `process.stderr.write('unexpected worker output');
     process.stdout.write('{"status":"ok"}\\n');
     setInterval(() => {}, 1000);`,
  );
  await assert.rejects(
    runBoundedQualification({
      worker: outer,
      requestPath,
      scratch,
      timeoutMs: 2_000,
      maximumBytes: 1024,
      decode: (raw) => JSON.parse(raw),
    }),
    { code: 'qualification_worker_failed' },
  );
});

test('qualification rejects invalid invocation and unavailable ownership before effects', async () => {
  const { invokeQualificationWorker, withQualificationOwnership } = await import(boundaryUrl);
  for (const [operation, executionChoice, policyChoice] of [
    ['unknown', [], null],
    ['input', null, null],
    ['replay', [], {}],
  ])
    await assert.rejects(invokeQualificationWorker(operation, {}, executionChoice, policyChoice), {
      code: 'qualification_invocation_invalid',
    });
  await assert.rejects(
    withQualificationOwnership(async () => {}),
    {
      code: 'qualification_owner_unavailable',
    },
  );
});

test('qualification ownership ignores malformed and unsolicited acknowledgements', async () => {
  const { withQualificationOwnership } = await import(boundaryUrl);
  const originalSend = process.send;
  const originalConnected = process.connected;
  process.send = () => {};
  process.connected = true;
  try {
    const result = await withQualificationOwnership(async () => {
      process.emit('message', { kind: 'other', id: 1, accepted: true });
      process.emit('message', { kind: 'qualification-ownership-ack', id: 999, accepted: true });
      return 'no authority was minted';
    });
    assert.equal(result, 'no authority was minted');
  } finally {
    process.send = originalSend;
    process.connected = originalConnected;
  }
});

test('independent parent deadline preempts a blocked qualification event loop', async (t) => {
  const { runBoundedQualification } = await import(boundaryUrl);
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-qual-blocked-'),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const marker = path.join(scratch, 'started');
  const outer = path.join(scratch, 'outer.mjs');
  const requestPath = path.join(scratch, 'request.json');
  await fs.writeFile(requestPath, '{}');
  await fs.writeFile(
    outer,
    `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, 'started'); while (true) {}`,
  );
  const started = Date.now();
  await assert.rejects(
    runBoundedQualification({
      worker: outer,
      requestPath,
      scratch,
      timeoutMs: 1_000,
      maximumBytes: 1024,
      decode: (raw) => JSON.parse(raw),
    }),
    { code: 'qualification_timeout' },
  );
  assert.equal(await fs.readFile(marker, 'utf8'), 'started');
  assert(Date.now() - started < 3_000, 'blocked worker delayed the independent parent');
});
