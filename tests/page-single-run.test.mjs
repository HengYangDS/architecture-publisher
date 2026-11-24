import assert from "node:assert/strict";
import cp from "node:child_process";
import fs from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { promisify } from "node:util";
import { guideWork } from "./fixtures/guide-work.mjs";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";
import { everyBlock } from "./fixtures/overview-statements.mjs";
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
/** How long a run on the page itself waits before it starts, where a test holds the page open; none otherwise. */
let held = 0;
counted[promisify.custom] = (file, ...rest) => {
  note(rest[0]);
  const run = () => execFile[promisify.custom](file, ...rest);
  const [script, , type] = Array.isArray(rest[0]) ? rest[0] : [];
  const page = String(script).endsWith(path.join("bin", "archify.mjs")) && type === "explainer";
  return held && page ? sleep(held).then(run) : run();
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

test("a check lays its plates out once the page's first run of Archify has begun, not after its candidates", async (t) => {
  // A generated page measures its candidate diagrams before its own run: the plates' layout waits for the first
  // run of the page's work, of any kind, and the rest goes on beside it (the review of 2026-11-24). Its parts are
  // named for this test, so no earlier test of this process has measured its candidates.
  const model = await writeModel(
    t,
    minimalModel({
      components: [
        { id: "a", label: "Early alpha" },
        { id: "b", label: "Early beta" },
      ],
    }),
  );
  /** The runs begun when the plates were laid out, each time they were. */
  const seen = [];
  await pageRuns(() =>
    checkModel(model, {}, (step) => {
      if (step === "laying out the plates") seen.push([...runs]);
    }),
  );
  assert.ok(seen.length > 0, "the plates were laid out");
  for (const begun of seen) {
    assert.ok(begun.length > 0, "the layout began before any run of the page");
    assert.deepEqual(
      begun.filter((run) => run.endsWith(" explainer")),
      [],
      "the layout waited for the page's own run",
    );
  }
});

test("a check refused after its page began reports once the page's work has ended", async (t) => {
  // An overview no bundled face draws is refused after the plates' layout, while the page's work goes on, held
  // open by a delay before each run on the page itself: the refusal stops the page and is told once its work has
  // ended, so it leaves no run and no work file behind. The tests of this file run one at a time, so TMPDIR and
  // the delay are this test's alone while it runs.
  const model = await writeModel(
    t,
    minimalModel({ overview: { ...everyBlock(), claim: "Ethiopic ሀ" } }),
  );
  const temporary = await temporaryDirectory(t, "archpub-settled-");
  const before = process.env.TMPDIR;
  process.env.TMPDIR = temporary;
  held = 3000;
  try {
    await assert.rejects(
      pageRuns(() => checkModel(model)),
      { code: "overview_glyph_missing" },
    );
  } finally {
    held = 0;
    if (before === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = before;
  }
  // Every run counted is the page's, a candidate's or its own: the check starts no other.
  assert.ok(runs.length > 0, "the page's work began before the refusal");
  assert.deepEqual(
    (await fs.readdir(temporary)).filter((name) => /^archpub-(page|diagrams)-/u.test(name)),
    [],
  );
});
