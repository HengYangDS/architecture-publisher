import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeInteractiveLayoutReply } from '../packages/publisher/renderers/elk/normalize.mjs';

const state = () => ({ spawnError: null, stderrBytes: 0, closed: { code: 0, signal: null } });
test('the owned layout reply requires one exact successful envelope and execution boundary', () => {
  for (const reason of ['closed', 'reply'])
    assert.deepEqual(
      decodeInteractiveLayoutReply('{"status":"ok","layouts":[]}', state(), reason),
      [],
    );
  for (const [reason, code] of [
    ['timeout', 'render_interactive_layout_execution_timeout'],
    ['overflow', 'render_interactive_layout_response_limit'],
    ['spawn-error', 'render_interactive_layout_execution_failed'],
    ['stderr', 'render_interactive_layout_execution_failed'],
  ])
    assert.throws(() => decodeInteractiveLayoutReply('', state(), reason), { code });
  for (const mutate of [
    (value) => {
      value.spawnError = new Error('spawn');
    },
    (value) => {
      value.stderrBytes = 1;
    },
    (value) => {
      value.closed = null;
    },
    (value) => {
      value.closed.code = 1;
    },
    (value) => {
      value.closed.signal = 'SIGKILL';
    },
  ]) {
    const invalid = state();
    mutate(invalid);
    assert.throws(
      () => decodeInteractiveLayoutReply('{"status":"ok","layouts":[]}', invalid, 'closed'),
      { code: 'render_interactive_layout_execution_failed' },
    );
  }
  for (const raw of [
    '{',
    '{}',
    '{"status":"ok","layouts":{}}',
    '{"status":"error","layouts":[]}',
    '{"status":"ok","layouts":[],"extra":true}',
  ])
    assert.throws(() => decodeInteractiveLayoutReply(raw, state(), 'reply'), {
      code: 'render_interactive_layout_response_invalid',
    });
});
