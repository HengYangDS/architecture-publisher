import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { browserLifetime } from './fixtures/browser-lifetime.mjs';

const scenario = fileURLToPath(
  new URL('./fixtures/browser-lifetime-scenario.mjs', import.meta.url),
);

for (const outcome of ['reject', 'resolve', 'parent-failure'])
  test(`browser lifetime closes a parent before draining its ${outcome} acquisition`, () => {
    const environment = { ...process.env };
    delete environment.NODE_TEST_CONTEXT;
    const output = execFileSync(
      process.execPath,
      ['--test', '--test-isolation=none', scenario, `--dependent-${outcome}`],
      {
        env: environment,
        encoding: 'utf8',
        timeout: 10_000,
        killSignal: 'SIGKILL',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    assert.match(output, /PARENT_CLOSED/u);
    assert.match(output, /PENDING_OWNERSHIP_DRAINED/u);
    assert.match(output, /fail 0/u);
  });

for (const failAfterConnection of [false, true])
  test(`browser lifetime drains active HTTP on ${failAfterConnection ? 'failure' : 'success'}`, () => {
    const environment = { ...process.env };
    delete environment.NODE_TEST_CONTEXT;
    const args = ['--test', '--test-isolation=none', scenario];
    if (failAfterConnection) args.push('--fail');
    const options = {
      env: environment,
      encoding: 'utf8',
      timeout: 10_000,
      killSignal: 'SIGKILL',
      stdio: ['ignore', 'pipe', 'pipe'],
    };
    if (failAfterConnection) {
      assert.throws(
        () => execFileSync(process.execPath, args, options),
        (error) => error.status === 1 && /INTENTIONAL_ASSERTION_FAILURE/u.test(error.stdout),
      );
    } else {
      const output = execFileSync(process.execPath, args, options);
      assert.match(output, /ACTIVE_REQUEST_REACHED/u);
      assert.match(output, /pass 1/u);
      assert.match(output, /fail 0/u);
    }
  });

test('native lifetime releases dependants first and does not skip cleanup after an error', async () => {
  let dispose;
  const lifetime = browserLifetime({ after: (callback) => (dispose = callback) });
  const closed = [];
  const failed = new Error('browser closure failed');
  for (const name of ['server', 'browser', 'context'])
    lifetime.use({
      [Symbol.asyncDispose]: async () => {
        closed.push(name);
        if (name === 'browser') throw failed;
      },
    });
  await assert.rejects(dispose, (error) => error === failed);
  assert.deepEqual(closed, ['context', 'browser', 'server']);
  await dispose();
  assert.equal(closed.length, 3);
});

test('browser lifetime drains a real resource acquired after the native test deadline', () => {
  const environment = { ...process.env };
  delete environment.NODE_TEST_CONTEXT;
  assert.throws(
    () =>
      execFileSync(process.execPath, ['--test', '--test-isolation=none', scenario, '--late'], {
        env: environment,
        encoding: 'utf8',
        timeout: 2_000,
        killSignal: 'SIGKILL',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    (error) => {
      assert.equal(error.status, 1, 'an expired test must terminate instead of leaking its server');
      assert.match(error.stdout, /LATE_SERVER_ACQUIRED/u);
      assert.match(error.stdout, /test timed out after 20ms/u);
      assert.doesNotMatch(error.stdout, /EXPIRED_RESOURCE_RETURNED/u);
      return true;
    },
  );
});

test('pending acquisition remains owned and cannot return after lifetime disposal', async () => {
  let dispose;
  const lifetime = browserLifetime({ after: (callback) => (dispose = callback) });
  const acquired = Promise.withResolvers();
  const started = Promise.withResolvers();
  let released = 0;
  const resource = { [Symbol.asyncDispose]: async () => (released += 1) };
  const pending = lifetime.acquire(() => {
    started.resolve();
    return acquired.promise;
  });
  const refused = assert.rejects(pending, /Browser lifetime has ended/u);
  await started.promise;
  const draining = dispose();
  acquired.resolve(resource);
  await Promise.all([refused, draining]);
  assert.equal(released, 1);
  await assert.rejects(
    lifetime.acquire(() => {
      throw new Error('expired lifetime started an acquisition');
    }),
    /Browser lifetime has ended/u,
  );
  await dispose();
  assert.equal(released, 1);
});

test('acquisition preserves native sync disposal and empty-resource semantics', async () => {
  let dispose;
  const lifetime = browserLifetime({ after: (callback) => (dispose = callback) });
  let released = 0;
  const resource = { [Symbol.dispose]: () => (released += 1) };
  assert.equal(await lifetime.acquire(() => resource), resource);
  assert.equal(await lifetime.acquire(() => null), null);
  assert.equal(await lifetime.acquire(() => undefined), undefined);
  await dispose();
  assert.equal(released, 1);
  await dispose();
  assert.equal(released, 1);
});

test('failed acquisition keeps its original failure without inventing a cleanup resource', async () => {
  let dispose;
  const lifetime = browserLifetime({ after: (callback) => (dispose = callback) });
  const failed = new Error('native acquisition refused');
  await assert.rejects(
    lifetime.acquire(() => Promise.reject(failed)),
    (error) => error === failed,
  );
  await dispose();
});

test('an aborted native test cannot start a new browser acquisition', async () => {
  const stopped = new Error('native test deadline reached');
  const lifetime = browserLifetime({ after() {}, signal: AbortSignal.abort(stopped) });
  await assert.rejects(
    lifetime.acquire(() => {
      throw new Error('aborted test started an acquisition');
    }),
    (error) => error === stopped,
  );
});

test('lifetime disposal cancels a queued factory before it acquires any resource', async () => {
  let dispose;
  const lifetime = browserLifetime({ after: (callback) => (dispose = callback) });
  const pending = lifetime.acquire(() => {
    throw new Error('closed lifetime started a queued acquisition');
  });
  const refused = assert.rejects(pending, /Browser lifetime has ended/u);
  await Promise.all([dispose(), refused]);
});
