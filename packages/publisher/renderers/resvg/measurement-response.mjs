import { fail, hasExactFields } from '../../src/protocol/values.mjs';

export function decodeMeasurement(raw, state, reason, count) {
  if (reason === 'timeout') fail('authored_canvas_measurement_execution_timeout');
  if (reason === 'overflow') fail('authored_canvas_measurement_response_limit');
  if (
    !['closed', 'reply'].includes(reason) ||
    state.spawnError ||
    state.stderrBytes ||
    (reason === 'closed' && (!state.closed || state.closed.code !== 0 || state.closed.signal))
  )
    fail('authored_canvas_measurement_execution_failed');
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    fail('authored_canvas_measurement_response_invalid');
  }
  if (hasExactFields(value, ['status', 'code']) && value.status === 'error') {
    if (typeof value.code !== 'string' || !/^[a-z][a-z0-9_]{0,127}$/u.test(value.code))
      fail('authored_canvas_measurement_response_invalid');
    fail(value.code);
  }
  if (
    !hasExactFields(value, ['status', 'boxes']) ||
    value.status !== 'measured' ||
    !Array.isArray(value.boxes) ||
    value.boxes.length !== count * 4 ||
    value.boxes.some((number) => !Number.isFinite(number))
  )
    fail('authored_canvas_measurement_response_invalid');
  return value.boxes;
}
