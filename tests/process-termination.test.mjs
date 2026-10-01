import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { assertSelfInterrupted, selfInterruptionSource } from './fixtures/process-termination.mjs';

test('native interruption is observed at the selected boundary rather than inferred from exit code', () => {
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '--eval', `${selfInterruptionSource}interruptSelf();`],
    {
      encoding: 'utf8',
      timeout: 10_000,
    },
  );
  assertSelfInterrupted(result);
  assert.throws(() => assertSelfInterrupted({ ...result, stdout: '' }));
  assert.throws(() => assertSelfInterrupted({ ...result, stderr: 'runtime failure' }));
  assertSelfInterrupted(
    { error: undefined, stdout: result.stdout, stderr: '', signal: null, status: 1 },
    'win32',
  );
  assertSelfInterrupted(
    { error: undefined, stdout: result.stdout, stderr: '', signal: 'SIGKILL', status: null },
    'darwin',
  );
});
