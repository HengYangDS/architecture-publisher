import assert from "node:assert/strict";
import test from "node:test";
import { width } from "../tools/test/suite.mjs";

test("the suite runs as many files at once as the machine's cores carry, two at least and four at most", () => {
  // The guests of 2026-11-23 have four and eight cores, the host eighteen.
  assert.deepEqual([1, 4, 8, 10, 18, 64].map(width), [2, 2, 3, 4, 4, 4]);
});
