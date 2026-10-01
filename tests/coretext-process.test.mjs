import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

async function fixture(t, source) {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-coretext-process-'),
  );
  const program = path.join(scratch, 'compiler.mjs');
  await fs.writeFile(program, source);
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  return { scratch, program };
}
async function selectedStage(t, source, options = {}) {
  const fixtureValue = await fixture(t, source);
  const selected = {
    stage: 'compile',
    executable: process.execPath,
    args: [fixtureValue.program],
    env: { HOME: fixtureValue.scratch, PATH: fixtureValue.scratch },
    input: '',
    timeoutMs: 5000,
    maximumBytes: 65536,
    ...fixtureValue,
    ...options,
  };
  const api = await import('../packages/publisher/renderers/svg/coretext-process.mjs');
  return { selected, run: () => api.runCoreTextStage(selected) };
}
function live(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if (e.code === 'ESRCH') return false;
    throw e;
  }
}
test(
  'CoreText stage reclaims a selected compiler descendant before returning failure',
  { skip: process.platform === 'win32' },
  async (t) => {
    const stage = await selectedStage(
      t,
      `import {spawn} from 'node:child_process';import fs from 'node:fs';const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(process.argv[2],String(child.pid));child.unref();process.stderr.write('selected-compiler-diagnostic');process.exit(17);`,
    );
    const target = path.join(stage.selected.scratch, 'pid');
    stage.selected.args.push(target);
    t.after(async () => {
      if (
        await fs.access(target).then(
          () => true,
          () => false,
        )
      ) {
        const pid = Number(await fs.readFile(target, 'utf8'));
        if (live(pid)) process.kill(pid, 'SIGKILL');
      }
    });
    await assert.rejects(
      stage.run,
      (err) =>
        err.code === 'coretext_compile_failed' &&
        err.exitCode === 17 &&
        err.diagnostics === 'selected-compiler-diagnostic',
    );
    const pid = Number(await fs.readFile(target, 'utf8'));
    assert(
      !live(pid),
      'owned compiler descendant must be absent on return, before scratch cleanup',
    );
    await fs.rm(stage.selected.scratch, { recursive: true });
    await assert.rejects(fs.access(stage.selected.scratch), { code: 'ENOENT' });
  },
);

test('CoreText stage deadline retains observed diagnostics from an unresponsive child', async (t) => {
  const stage = await selectedStage(
    t,
    "import fs from 'node:fs';fs.writeFileSync(process.argv[2],'started');process.stderr.write('compiler entered');process.on('SIGTERM',()=>{});setInterval(()=>{},1000);",
    { timeoutMs: 5000 },
  );
  const started = path.join(stage.selected.scratch, 'started');
  stage.selected.args.push(started);
  let failure;
  try {
    await stage.run();
  } catch (error) {
    failure = error;
  }
  assert.equal(await fs.readFile(started, 'utf8'), 'started');
  assert.equal(failure?.code, 'coretext_compile_failed');
  assert.equal(failure?.processError, 'ETIMEDOUT');
  assert.equal(failure?.diagnostics, 'compiler entered');
});

test('CoreText compile stage preserves successful stderr without treating it as supervisor protocol', async (t) => {
  const stage = await selectedStage(
    t,
    "process.stderr.write('selected warning');process.stdout.write('compiled');",
  );
  const result = await stage.run();
  assert.equal(result.stdout, 'compiled');
  assert.equal(result.diagnostics, 'selected warning');
  assert.equal(result.exitCode, 0);
});

test('CoreText stages preserve selected completed stdin and nonzero process diagnostics', async (t) => {
  const stage = await selectedStage(
    t,
    "import fs from 'node:fs';process.stdout.write(fs.readFileSync(0,'utf8'));",
    { stage: 'execution', input: '{"fonts":[],"requests":[]}' },
  );
  const result = await stage.run();
  assert.equal(result.stdout, stage.selected.input);
  const failure = await selectedStage(t, "process.stderr.write('bad input');process.exit(19);", {
    stage: 'execution',
  });
  const rejected = await failure.run();
  assert.equal(rejected.exitCode, 19);
  assert.equal(rejected.diagnostics, 'bad input');
});

test('CoreText stages reject invalid bounds before any worker starts', async (t) => {
  const stage = await selectedStage(t, 'process.exit(0);');
  const { runCoreTextStage } =
    await import('../packages/publisher/renderers/svg/coretext-process.mjs');
  for (const value of [
    { stage: 'other' },
    { executable: 'relative' },
    { scratch: 'relative' },
    { args: [null] },
    { env: { HOME: null } },
    { timeoutMs: 120_001 },
    { maximumBytes: 16 * 1024 * 1024 + 1 },
    { input: 'x'.repeat(64 * 1024 * 1024 + 1) },
  ])
    await assert.rejects(runCoreTextStage({ ...stage.selected, ...value }), {
      code: 'coretext_stage_plan_invalid',
    });
  assert.deepEqual((await fs.readdir(stage.selected.scratch)).sort(), ['compiler.mjs']);
});

test('CoreText compiler output remains bounded and signal failures remain typed', async (t) => {
  const overflow = await selectedStage(t, "process.stdout.write('x'.repeat(4096));", {
    maximumBytes: 128,
  });
  await assert.rejects(
    overflow.run,
    (error) => error.code === 'coretext_compile_failed' && error.processError === 'ENOBUFS',
  );
  if (process.platform !== 'win32') {
    const signaled = await selectedStage(t, "process.kill(process.pid,'SIGKILL');");
    await assert.rejects(
      signaled.run,
      (error) => error.code === 'coretext_compile_failed' && error.signal === 'SIGKILL',
    );
  }
});

test('CoreText diagnostic tails are bounded without dropping child output', async (t) => {
  const stage = await selectedStage(
    t,
    "process.stderr.write('x'.repeat(6000)+'selected tail');process.stdout.write('compiled');",
  );
  const result = await stage.run();
  assert.equal(result.diagnostics.length, 4000);
  assert(result.diagnostics.endsWith('selected tail'));
  assert.equal(result.stdout, 'compiled');
});

test('CoreText compiler stderr overflow retains the existing stage byte limit', async (t) => {
  const stage = await selectedStage(t, "process.stderr.write('x'.repeat(4096));", {
    maximumBytes: 128,
  });
  await assert.rejects(
    stage.run,
    (error) => error.code === 'coretext_compile_failed' && error.processError === 'ENOBUFS',
  );
});

test('CoreText diagnostic observation errors do not replace the stage timeout', async (t) => {
  const stage = await selectedStage(t, 'setInterval(()=>{},1000);', { timeoutMs: 250 });
  const original = fs.readFile;
  fs.readFile = async (...args) => {
    if (String(args[0]).endsWith('coretext-stage-diagnostics.txt'))
      throw Object.assign(new Error('checkpoint inaccessible'), { code: 'EACCES' });
    return original(...args);
  };
  try {
    await assert.rejects(
      stage.run,
      (error) =>
        error.code === 'coretext_compile_failed' &&
        error.processError === 'ETIMEDOUT' &&
        error.diagnosticsObservation === 'unobserved:EACCES',
    );
  } finally {
    fs.readFile = original;
  }
});

test(
  'CoreText group uncertainty retains the primary failure and scratch',
  { skip: process.platform === 'win32' },
  async (t) => {
    const stage = await selectedStage(
      t,
      "process.stderr.write('primary diagnostics');process.exit(17);",
    );
    const original = process.kill;
    process.kill = function (pid, signal) {
      if (pid < 0 && signal === 0)
        throw Object.assign(new Error('group probe denied'), { code: 'EACCES' });
      return original(pid, signal);
    };
    try {
      await assert.rejects(
        stage.run,
        (error) =>
          error.code === 'coretext_stage_cleanup_failed' &&
          error.primaryFailure?.code === 'coretext_compile_failed' &&
          error.primaryFailure?.diagnostics === 'primary diagnostics' &&
          error.scratch === stage.selected.scratch,
      );
      assert((await fs.stat(stage.selected.scratch)).isDirectory());
    } finally {
      process.kill = original;
    }
  },
);
