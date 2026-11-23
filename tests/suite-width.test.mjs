import assert from "node:assert/strict";
import test from "node:test";
import { coresOf, width } from "../tools/test/suite.mjs";

test("the suite runs as many files at once as the machine's cores carry, two at least and four at most", () => {
  // The guests of 2026-11-23 have four and eight cores, the host eighteen.
  assert.deepEqual([1, 4, 8, 10, 18, 64].map(width), [2, 2, 3, 4, 4, 4]);
});

test("under the host's queue the suite takes the share ETHOS gives the run, never more than the machine", () => {
  // One slot leaves an admitted run 14 of the host's 18 cores, two slots 7.
  assert.equal(width(coresOf(18, "14")), 4);
  assert.equal(width(coresOf(18, "7")), 2);
  assert.equal(coresOf(4, "14"), 4);
  for (const cap of [undefined, "", "none", "0", "-3"]) assert.equal(coresOf(18, cap), 18);
});
