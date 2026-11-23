import assert from "node:assert/strict";
import cp from "node:child_process";
import path from "node:path";
import { syncBuiltinESMExports } from "node:module";
import test from "node:test";
import { promisify } from "node:util";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";

/**
 * When the page's delivery and the edition's typesetting start and end, as the children Archify and Typst run. The
 * queue item `performance` asks for a build's two media made side by side; this holds the order, not a time.
 */
const runs = [];
const watch = (file, args, child) => {
  const [script, command, type] = Array.isArray(args) ? args : [];
  const what = String(script).endsWith(path.join("bin", "archify.mjs"))
    ? `${command} ${type}`
    : path.basename(String(file)) === "typst" && Array.isArray(args) && args[0] === "compile"
      ? "typst compile"
      : null;
  if (!what) return;
  const run = { what, start: performance.now(), end: Infinity };
  runs.push(run);
  child?.once?.("exit", () => (run.end = performance.now()));
};
const execFile = cp.execFile;
function watched(file, ...rest) {
  const child = execFile.call(this, file, ...rest);
  watch(file, rest[0], child);
  return child;
}
watched[promisify.custom] = (file, ...rest) => {
  const promise = execFile[promisify.custom](file, ...rest);
  watch(file, rest[0], promise.child);
  return promise;
};
cp.execFile = watched;
syncBuiltinESMExports();
const { buildDelivery } = await import("../src/build.mjs");

test("a build makes its page beside its edition: the edition is typeset while the page is delivered", async (t) => {
  // With no answers kept, so that Archify is asked for the page.
  const kept = process.env.ARCHPUB_ARCHIFY_ANSWERS;
  delete process.env.ARCHPUB_ARCHIFY_ANSWERS;
  t.after(() => {
    if (kept !== undefined) process.env.ARCHPUB_ARCHIFY_ANSWERS = kept;
  });
  const model = await writeModel(t, minimalModel());
  const out = path.join(await temporaryDirectory(t, "archpub-media-"), "built");
  await buildDelivery(model, out, { media: ["edition", "page"] });
  const page = runs.find(({ what }) => what === "finalize explainer");
  const typeset = runs.find(({ what }) => what === "typst compile");
  assert.ok(page && typeset, `the build ran ${runs.map(({ what }) => what).join(", ")}`);
  // Made one after the other, the page's delivery would end before the edition's typesetting began.
  assert.ok(typeset.start < page.end, "the edition waited for the page");
});
