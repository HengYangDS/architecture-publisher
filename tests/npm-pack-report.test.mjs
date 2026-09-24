import assert from 'node:assert/strict';
import test from 'node:test';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';

const record = {
  name: '@architecture-publisher/self-edition',
  filename: 'architecture-publisher-self-edition-0.3.0-alpha.3.tgz',
  files: [{ path: 'package.json' }],
};

test('one npm pack record accepts array and package-name envelopes', () => {
  assert.deepEqual(parseNpmPackRecord(JSON.stringify([record])), record);
  assert.deepEqual(parseNpmPackRecord(JSON.stringify({ [record.name]: record })), record);
});

test('npm pack report rejects ambiguous or malformed package records', () => {
  for (const value of [[], {}, [record, record], { wrong: record }, [null], [1]])
    assert.throws(() => parseNpmPackRecord(JSON.stringify(value)), /npm_pack_record_/u);
});
