import assert from "node:assert/strict";
import test from "node:test";
import { PNG_WIDTHS, plateSummary } from "../src/manifest.mjs";

test("a plate's record lists the balance gates it misses, and holds no such key when it misses none", () => {
  const plate = {
    page: 3,
    views: ["request-path", "failures"],
    share: 0.62,
    reading: "beside",
    composition: { columns: 3, rows: 2 },
    measures: { ink: 0.41 },
    misses: [],
  };
  const balanced = plateSummary(plate, [PNG_WIDTHS[0], 960]);
  assert.deepEqual(Object.keys(balanced), [
    "page",
    "views",
    "share",
    "reading",
    "images",
    "composition",
    "measures",
  ]);
  // The default width names the plate's image plainly, and every other width by its number.
  assert.deepEqual(balanced.images, [
    { width: 2400, file: "images/03-request-path+failures.png" },
    { width: 960, file: "images/03-request-path+failures-960.png" },
  ]);
  const misses = [{ measure: "figure-share", value: 0.3, limit: 0.5 }];
  const missing = plateSummary({ ...plate, misses }, [960]);
  assert.deepEqual(Object.keys(missing), [...Object.keys(balanced), "misses"]);
  assert.deepEqual(missing.misses, misses);
});
