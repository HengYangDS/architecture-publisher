import assert from 'node:assert/strict';

export const selfInterruptionSource =
  "import {writeSync} from 'node:fs';function interruptSelf(){writeSync(1,'selected-interruption-boundary\\n');process.kill(process.pid,'SIGKILL');}";

export function assertSelfInterrupted(result, platform = process.platform) {
  assert.equal(result.error, undefined);
  assert.equal(result.stdout, 'selected-interruption-boundary\n', result.stderr);
  assert.equal(result.stderr, '');
  if (platform === 'win32') {
    assert.equal(result.signal, null);
    assert.equal(result.status, 1);
  } else {
    assert.equal(result.signal, 'SIGKILL');
    assert.equal(result.status, null);
  }
}
