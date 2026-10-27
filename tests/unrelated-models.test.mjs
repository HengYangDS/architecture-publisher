import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { checkModel } from "../packages/publisher/src/build.mjs";
import { BROWSER_USE_MODEL, CONTEXT_MODE_MODEL } from "./fixtures/models.mjs";

// Models of two repositories unrelated to this one, written outside them, keep the publisher
// general: every view is admitted without a crossing and the map's rows are wired.
for (const [file, views] of [
  [CONTEXT_MODE_MODEL, ["overview", "sandbox", "retrieval"]],
  [BROWSER_USE_MODEL, ["overview", "perception", "action"]],
]) {
  test(`the ${path.basename(file, ".json")} model is admitted in every view`, async () => {
    const checked = await checkModel(file);
    assert.equal(checked.sources.state, "unverified");
    assert.deepEqual(
      checked.views.map(({ id }) => id),
      views,
    );
    for (const view of checked.views) assert.equal(view.poster.crossings, 0, view.id);
  });
}
