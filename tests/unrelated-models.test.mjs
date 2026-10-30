import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { checkModel } from "../packages/publisher/src/build.mjs";
import { BROWSER_USE_MODEL, CONTEXT_MODE_MODEL } from "./fixtures/models.mjs";

// Models of two repositories unrelated to this one, written outside them, keep the publisher
// general: every view is admitted and printed on a balanced page whose wires do not cross.
// browser-use's perception and action pages still turn a wire beside a card it does not
// connect, and its action page runs two wires alongside.
for (const [file, views, routes] of [
  [CONTEXT_MODE_MODEL, ["overview", "sandbox", "retrieval"], [0, 0, 0]],
  [BROWSER_USE_MODEL, ["overview", "perception", "action"], [0, 1, 3]],
]) {
  test(`the ${path.basename(file, ".json")} model is admitted in every view`, async () => {
    const checked = await checkModel(file);
    assert.equal(checked.sources.state, "unverified");
    assert.deepEqual(
      checked.views.map(({ id }) => id),
      views,
    );
    for (const view of checked.views) assert.ok(view.poster, `${view.id} has no page`);
    for (const poster of checked.posters) assert.equal(poster.measures.crossings, 0, poster.id);
    assert.deepEqual(
      checked.posters.map(({ measures }) => measures.routes),
      routes,
    );
  });
}
