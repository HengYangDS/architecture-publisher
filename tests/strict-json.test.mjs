import assert from "node:assert/strict";
import test from "node:test";
import { parseStrictJson } from "../packages/publisher/src/protocol/json.mjs";

const invalid = "test_json_invalid";
const duplicate = "test_json_duplicate_key";
const parse = (text) => parseStrictJson(Buffer.from(text), invalid, duplicate);

test("strict JSON rejects duplicate object keys at any depth", () => {
  for (const text of [
    '{"mode":"executable","mode":"declarative"}',
    '{"selected":{"native":[],"native":[]}}',
    '[{"id":"first"},{"id":"second","id":"third"}]',
  ]) {
    assert.throws(() => parse(text), { code: duplicate });
  }
});

test("strict JSON decodes escaped keys before checking ambiguity", () => {
  assert.throws(() => parse('{"delivery":1,"deliv\\u0065ry":2}'), { code: duplicate });
  assert.throws(() => parse('{"😀":1,"\\ud83d\\ude00":2}'), { code: duplicate });
});

test("strict JSON accepts formatting, arrays, and repeated names in distinct objects", () => {
  assert.deepEqual(parse(' {\n  "first": {"id": 1},\n  "second": [{"id": 2}]\n}\n'), {
    first: { id: 1 },
    second: [{ id: 2 }],
  });
});

test("strict JSON preserves invalid syntax and UTF-8 diagnostics", () => {
  assert.throws(() => parse('{"missing":'), { code: invalid });
  assert.throws(() => parseStrictJson(Buffer.from([0xff]), invalid, duplicate), {
    code: invalid,
  });
});
