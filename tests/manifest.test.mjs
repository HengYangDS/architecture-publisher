import assert from "node:assert/strict";
import test from "node:test";
import { PNG_WIDTHS, plateSummary } from "../src/manifest.mjs";

test("a plate's record names its images and its figure's two files, lists the balance gates it misses, and holds no such key when it misses none", () => {
  const plate = {
    page: 3,
    views: ["request-path", "failures"],
    share: 0.62,
    reading: "beside",
    composition: { columns: 3, rows: 2 },
    measures: { ink: 0.41 },
    misses: [],
  };
  assert.deepEqual(PNG_WIDTHS, [3840]);
  const balanced = plateSummary(plate, [PNG_WIDTHS[0], 2400, 960]);
  assert.deepEqual(Object.keys(balanced), [
    "page",
    "views",
    "share",
    "reading",
    "images",
    "figures",
    "composition",
    "measures",
  ]);
  // The default width names the plate's image plainly, and every other width by its number.
  assert.deepEqual(balanced.images, [
    { width: 3840, file: "images/03-request-path+failures.png" },
    { width: 2400, file: "images/03-request-path+failures-2400.png" },
    { width: 960, file: "images/03-request-path+failures-960.png" },
  ]);
  // The figure set alone is two files whatever the widths, named as the plate's page is.
  assert.deepEqual(balanced.figures, [
    { format: "png", file: "figures/03-request-path+failures.png" },
    { format: "svg", file: "figures/03-request-path+failures.svg" },
  ]);
  const misses = [{ measure: "figure-share", value: 0.3, limit: 0.5 }];
  const missing = plateSummary({ ...plate, misses }, [960]);
  assert.deepEqual(Object.keys(missing), [...Object.keys(balanced), "misses"]);
  assert.deepEqual(missing.misses, misses);
});
