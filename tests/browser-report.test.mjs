import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import {
  decodeBrowserReport,
  encodeBrowserReport,
} from '../migration/ethos/src/edition/browser-report.mjs';

const value = {
  observations: [
    {
      page: 'overview',
      measured: {
        texts: [{ text: 'Meaning', box: { x: 1.25, y: -2, width: 120 } }],
      },
    },
  ],
  findings: [],
  scope: 'observed only',
};

test('compressed reports preserve every measured value', () => {
  const encoded = encodeBrowserReport(value);
  assert.equal(encoded.name, 'report.json.gz');
  assert.deepEqual(decodeBrowserReport(encoded.name, encoded.content), value);
  assert.deepEqual(encodeBrowserReport(value), encoded);
});

test('immutable historical JSON uses the same value decoder', () => {
  assert.deepEqual(
    decodeBrowserReport('report.json', Buffer.from(JSON.stringify(value))),
    value,
  );
});

for (const [name, bytes] of [
  ['elsewhere/report.json', Buffer.from('{}')],
  ['report.json.gz', Buffer.from('{}')],
  ['report.json', gzipSync('{}')],
  ['report.json.gz', gzipSync('{')],
  ['report.json.gz', gzipSync(Buffer.from([0xff]))],
  ['report.json.gz', gzipSync('{}').subarray(0, 12)],
  ['report.json', Buffer.from('null')],
  ['report.json', Buffer.from('[]')],
]) {
  test(`rejects invalid report transport ${name}/${bytes.toString('hex').slice(0, 16)}`, () => {
    assert.throws(() => decodeBrowserReport(name, bytes), /browser_report_/);
  });
}

test('compressed expansion cannot bypass the existing 32 MiB member limit', () => {
  const bytes = gzipSync(' '.repeat(32 * 1024 * 1024) + '{}');
  assert.throws(
    () => decodeBrowserReport('report.json.gz', bytes),
    /browser_report_/,
  );
});

test('encoding rejects non-record reports and oversized JSON', () => {
  assert.throws(() => encodeBrowserReport(null), /browser_report_/);
  assert.throws(
    () => encodeBrowserReport({ text: 'x'.repeat(32 * 1024 * 1024) }),
    /browser_report_/,
  );
});
