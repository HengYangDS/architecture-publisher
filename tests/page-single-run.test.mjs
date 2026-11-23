import assert from "node:assert/strict";
import cp from "node:child_process";
import fs from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { guideWork } from "./fixtures/guide-work.mjs";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";
import { MAIN } from "./fixtures/repository.mjs";

/**
 * What a build and a check ask of Archify for the page, counted as the runs of its command line this process
 * starts: a count of work, the same on every machine. The publisher's modules bind `execFile` when they load, so
 * the counter stands before they are imported.
 */
const runs = [];
const note = (args) => {
  const [script, command, type] = Array.isArray(args) ? args : [];
  if (String(script).endsWith(path.join("bin", "archify.mjs"))) runs.push(`${command} ${type}`);
};
const execFile = cp.execFile;
function counted(file, ...rest) {
  note(rest[0]);
  return execFile.call(this, file, ...rest);
}
counted[promisify.custom] = (file, ...rest) => {
  note(rest[0]);
  return execFile[promisify.custom](file, ...rest);
};
cp.execFile = counted;
syncBuiltinESMExports();
const { buildDelivery, checkModel } = await import("../src/build.mjs");

/**
 * The runs on the page itself that `work` starts, with no answers kept, so that every run is asked; a diagram's own
 * measurement is another question.
 */
async function pageRuns(work) {
  const kept = process.env.ARCHPUB_ARCHIFY_ANSWERS;
  delete process.env.ARCHPUB_ARCHIFY_ANSWERS;
  runs.length = 0;
  try {
    await work();
  } finally {
    if (kept !== undefined) process.env.ARCHPUB_ARCHIFY_ANSWERS = kept;
  }
  return runs.filter((run) => run.endsWith(" explainer"));
}

const PASSED = { validate: "pass", deliver: "pass", check: "pass", "browser-check": "not-run" };
const manifestOf = async (out) =>
  JSON.parse(await fs.readFile(path.join(out, "manifest.json"), "utf8"));

test("a build asks Archify for its page once, and a check validates it once", async (t) => {
  const model = await writeModel(t, minimalModel());
  const root = await temporaryDirectory(t, "archpub-page-runs-");
  const out = path.join(root, "built");
  assert.deepEqual(await pageRuns(() => buildDelivery(model, out, { media: ["page"] })), [
    "finalize explainer",
  ]);
  assert.deepEqual((await manifestOf(out)).page.gates, PASSED);
  assert.deepEqual(await pageRuns(() => checkModel(model, { media: ["page"] })), [
    "validate explainer",
  ]);
});

test("a build asks once for a guide, and the page holds the lines it cites from the checkout", async (t) => {
  const work = await guideWork(t);
  const out = path.join(work.root, "built");
  const options = { repo: work.source.root, media: ["page"] };
  assert.deepEqual(await pageRuns(() => buildDelivery(work.model, out, options)), [
    "finalize explainer",
  ]);
  const { page } = await manifestOf(out);
  assert.deepEqual(page.gates, PASSED);
  assert.equal(page.guide.sources, "verified");
  // The one run read the cited line at the revision: the page holds it.
  assert.ok((await fs.readFile(path.join(out, "minimal.html"), "utf8")).includes(MAIN.trim()));
  assert.deepEqual(await pageRuns(() => checkModel(work.model, options)), ["validate explainer"]);
});

test("a page Archify refuses is validated on its own: a file is withheld, and a build ends as a check ends", async (t) => {
  // A file under `secrets`, which Archify will not cite: the delivery is refused, the validation names the file,
  // and the page is delivered without it.
  const model = await writeModel(
    t,
    minimalModel({
      repository: {
        name: "shop",
        url: "https://example.invalid/shop.git",
        revision: "a".repeat(40),
      },
      components: [
        { id: "web", label: "Web", files: ["internal/secrets/store.go", "src/main.go"] },
        { id: "store", label: "Store", files: ["src/store.go"] },
      ],
      relations: [{ id: "r", from: "web", to: "store", label: "writes" }],
      views: [{ id: "web", question: "What does the web do?", members: ["web", "store"] }],
    }),
  );
  const root = await temporaryDirectory(t, "archpub-page-runs-");
  const out = path.join(root, "withheld");
  assert.deepEqual(await pageRuns(() => buildDelivery(model, out, { media: ["page"] })), [
    "finalize explainer",
    "validate explainer",
    "finalize explainer",
  ]);
  const { page } = await manifestOf(out);
  assert.deepEqual(page.withheld, ["internal/secrets/store.go"]);
  assert.deepEqual(page.gates, PASSED);

  // A guide with a sentence too long: the build ends as a check ends, with the finding by its code, after the
  // refused delivery and one validation, and writes nothing.
  const long = await guideWork(t, {
    sentence:
      "The service is one module that the front end calls for every request it sends, and it answers every one of those requests from the code it holds at the pinned revision of its repository.",
  });
  const options = { repo: long.source.root, media: ["page"] };
  const refusal = { code: "page_refused", message: /explainer\/writing-sentence-length/u };
  const built = path.join(long.root, "built");
  runs.length = 0;
  await assert.rejects(buildDelivery(long.model, built, options), refusal);
  assert.deepEqual(
    runs.filter((run) => run.endsWith(" explainer")),
    ["finalize explainer", "validate explainer"],
  );
  await assert.rejects(checkModel(long.model, options), refusal);
  await assert.rejects(fs.stat(built), { code: "ENOENT" });
});
