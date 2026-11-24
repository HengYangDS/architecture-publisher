import assert from "node:assert/strict";
import cp, { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";

/**
 * How often Archify's command line is started, counted in this process: a count of work, the same on every
 * machine. The publisher's modules bind `execFile` when they load, so the counter stands before they are imported.
 */
let runs = 0;
const execFile = cp.execFile;
const archify = (args) =>
  Array.isArray(args) && String(args[0]).endsWith(path.join("bin", "archify.mjs"));
function counted(file, ...rest) {
  if (archify(rest[0])) runs += 1;
  return execFile.call(this, file, ...rest);
}
counted[promisify.custom] = (file, ...rest) => {
  if (archify(rest[0])) runs += 1;
  return execFile[promisify.custom](file, ...rest);
};
cp.execFile = counted;
syncBuiltinESMExports();
const { candidateAnswer, keptAnswer, telling } = await import("../src/map/archify.mjs");
const { chooseDiagram } = await import("../src/map/choice.mjs");
const { validateModel } = await import("../src/model/load.mjs");
const { planViews } = await import("../src/plan/views.mjs");
const { explainerPage, pageParts } = await import("../src/map/explainer.mjs");

const VARIABLE = "ARCHPUB_ARCHIFY_ANSWERS";
const MAIN = fileURLToPath(new URL("../src/cli/main.mjs", import.meta.url));
/** What the choice of a diagram takes for a whole answer of each kind. */
const VERDICT = { layout: false, whole: (answer) => answer?.ok === true };
const LAYOUT = { layout: true, whole: (answer) => Array.isArray(answer?.connections) };

const parts = (label, to = "api") => ({
  schema_version: 1,
  diagram_type: "architecture",
  meta: { title: "The shop", output: "parts.html", quality_profile: "showcase", locale: "en" },
  components: [
    { id: "web", type: "frontend", label, pos: [40, 40], size: [180, 68] },
    { id: "api", type: "backend", label: "Service", pos: [340, 40], size: [180, 68] },
  ],
  connections: [{ id: "calls", from: "web", to, label: "calls" }],
});

/** Name a directory for answers for one test, and give the variable back as it was. */
function named(t, store) {
  const before = process.env[VARIABLE];
  t.after(() => {
    if (before === undefined) delete process.env[VARIABLE];
    else process.env[VARIABLE] = before;
  });
  if (store === null) delete process.env[VARIABLE];
  else process.env[VARIABLE] = store;
}

/** Ask for one document's answer from a file of its own, and count the runs the question starts. */
async function ask(directory, name, document, kind = VERDICT) {
  const file = path.join(directory, name);
  await fs.writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
  const before = runs;
  const answer = await candidateAnswer(file, document, kind);
  return { answer, asked: runs - before };
}

test("an answer is kept by what it answers, wherever the document lies", async (t) => {
  const directory = await temporaryDirectory(t, "archpub-answers-");
  // A directory that does not exist yet is made.
  const store = path.join(directory, "not", "yet");
  named(t, store);
  const first = await ask(directory, "a.architecture.json", parts("Front end"));
  assert.equal(first.asked, 1);
  assert.equal(first.answer.ok, true);
  assert.equal((await fs.readdir(store)).length, 1);
  // The same document in another file is the same question.
  const again = await ask(directory, "b.architecture.json", parts("Front end"));
  assert.equal(again.asked, 0);
  assert.deepEqual(again.answer, first.answer);
  // Its layout is another question, and so is another document.
  const laid = await ask(directory, "a.architecture.json", parts("Front end"), LAYOUT);
  assert.equal(laid.asked, 1);
  assert.equal(laid.answer.connections.length, 1);
  assert.equal((await ask(directory, "b.architecture.json", parts("Front end"), LAYOUT)).asked, 0);
  assert.equal((await ask(directory, "c.architecture.json", parts("Shop window"))).asked, 1);
  assert.equal((await fs.readdir(store)).length, 3);
});

test("only a whole answer is kept or read", async (t) => {
  const directory = await temporaryDirectory(t, "archpub-answers-");
  const store = path.join(directory, "kept");
  named(t, store);
  // Archify refuses a relation to a part the document lacks, and says so as JSON: asked each time, kept nowhere.
  const refused = parts("Front end", "nowhere");
  for (const round of [1, 2]) {
    const { answer, asked } = await ask(directory, "refused.architecture.json", refused);
    assert.deepEqual([round, asked, answer.ok], [round, 1, false]);
  }
  assert.deepEqual(await fs.readdir(store), []);
  // A file in an answer's place that is no whole answer is asked again and replaced.
  const whole = await ask(directory, "a.architecture.json", parts("Front end"));
  const [kept] = await fs.readdir(store);
  for (const content of [
    "{",
    "null",
    "{}",
    '{"ok":false,"diagnostics":[{"code":"internal/unclassified"}]}',
  ]) {
    await fs.writeFile(path.join(store, kept), content);
    const { answer, asked } = await ask(directory, "a.architecture.json", parts("Front end"));
    assert.deepEqual([content, asked], [content, 1]);
    assert.deepEqual(answer, whole.answer);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(store, kept), "utf8")), whole.answer);
  }
  assert.deepEqual(await fs.readdir(store), [kept]);
});

test("a path that cannot be a directory refuses before Archify is asked, and without the variable nothing is kept", async (t) => {
  const directory = await temporaryDirectory(t, "archpub-answers-");
  // A file stands where the directory is named.
  const taken = path.join(directory, "taken");
  await fs.writeFile(taken, "");
  named(t, taken);
  const before = runs;
  await assert.rejects(ask(directory, "a.architecture.json", parts("Front end")), {
    code: "answers_unkept",
    message: /ARCHPUB_ARCHIFY_ANSWERS/u,
  });
  assert.equal(runs, before);
  assert.equal(await fs.readFile(taken, "utf8"), "");

  delete process.env[VARIABLE];
  assert.equal((await ask(directory, "a.architecture.json", parts("Front end"))).asked, 1);
  assert.equal((await ask(directory, "a.architecture.json", parts("Front end"))).asked, 1);
  assert.deepEqual((await fs.readdir(directory)).sort(), ["a.architecture.json", "taken"]);
});

test("an answer that cannot be written is not kept, and the question is answered all the same", async (t) => {
  const directory = await temporaryDirectory(t, "archpub-answers-");
  const store = path.join(directory, "kept");
  named(t, store);
  const first = await ask(directory, "a.architecture.json", parts("Front end"));
  const [kept] = await fs.readdir(store);
  // A directory stands in the answer's place: it cannot be read as an answer, and no file can be moved onto it.
  await fs.rm(path.join(store, kept));
  await fs.mkdir(path.join(store, kept));
  for (const round of [1, 2]) {
    const { answer, asked } = await ask(directory, "a.architecture.json", parts("Front end"));
    assert.deepEqual([round, asked], [round, 1]);
    assert.deepEqual(answer, first.answer);
    // Nothing is left beside it.
    assert.deepEqual(await fs.readdir(store), [kept]);
  }
});

test("the choice of a view's diagram reads kept answers and chooses the same", async (t) => {
  const directory = await temporaryDirectory(t, "archpub-answers-");
  const store = path.join(directory, "kept");
  const model = validateModel(minimalModel());
  const [view] = await planViews(model, async () => ({ fits: true, width: 2400, height: 1350 }));
  // Each import of the choice under another address is a module of its own, which remembers nothing of the
  // others: what one process and the next would be.
  const choice = (address) =>
    import(new URL(`../src/map/choice.mjs?${address}`, import.meta.url).href);
  const chosenBy = async (address) => {
    const before = runs;
    const chosen = await (await choice(address)).chooseDiagram(model, view);
    return { chosen, asked: runs - before };
  };
  named(t, store);
  const first = await chosenBy("first");
  assert.ok(first.asked > 0);
  assert.ok((await fs.readdir(store)).length > 0);
  const second = await chosenBy("second");
  assert.equal(second.asked, 0);
  assert.deepEqual(second.chosen, first.chosen);
  // A refusal in an answer's place is no answer to the choice either: every question is asked again, and the
  // choice is the same.
  for (const name of await fs.readdir(store))
    await fs.writeFile(path.join(store, name), '{"ok":false,"diagnostics":[]}');
  const third = await chosenBy("third");
  assert.equal(third.asked, first.asked);
  assert.deepEqual(third.chosen, first.chosen);
  delete process.env[VARIABLE];
  const fourth = await chosenBy("fourth");
  assert.equal(fourth.asked, first.asked);
  assert.deepEqual(fourth.chosen, first.chosen);
});

test("a build with answers kept delivers what a build without them delivers", async (t) => {
  const model = await writeModel(t, minimalModel());
  const root = await temporaryDirectory(t, "archpub-answers-build-");
  const store = path.join(root, "kept");
  const build = (name, environment) => {
    const env = { ...process.env, NO_COLOR: "1", ...environment };
    if (!environment[VARIABLE]) delete env[VARIABLE];
    const out = path.join(root, name);
    const done = spawnSync(
      process.execPath,
      [MAIN, "build", model, "--media", "page", "--out", out],
      {
        encoding: "utf8",
        env,
        timeout: 300_000,
      },
    );
    assert.equal(done.status, 0, done.stderr);
    return out;
  };
  const artifacts = async (out) =>
    JSON.parse(await fs.readFile(path.join(out, "manifest.json"), "utf8")).artifacts;
  const without = await artifacts(build("without", {}));
  assert.deepEqual(await artifacts(build("cold", { [VARIABLE]: store })), without);
  // A kept answer that is read is not written again: every file is the one the cold build wrote.
  const written = async () =>
    Promise.all(
      (await fs.readdir(store))
        .sort()
        .map(async (name) => [name, (await fs.stat(path.join(store, name))).mtimeMs]),
    );
  const kept = await written();
  assert.ok(kept.length > 0);
  assert.deepEqual(await artifacts(build("warm", { [VARIABLE]: store })), without);
  assert.deepEqual(await written(), kept);
});

test("a generated page's delivery is kept by what it depends on, and the same page asks Archify nothing again", async (t) => {
  const directory = await temporaryDirectory(t, "archpub-answers-");
  named(t, path.join(directory, "kept"));
  const model = validateModel(minimalModel());
  const views = await planViews(model, async () => ({ fits: true, width: 2400, height: 1350 }));
  const before = runs;
  const first = await explainerPage(model, views, { deliver: "minimal.html" });
  const asked = runs - before;
  const again = await explainerPage(model, views, { deliver: "minimal.html" });
  assert.ok(asked > 0, "the first page asked Archify nothing");
  assert.equal(runs - before - asked, 0, "the same page asked Archify again");
  assert.deepEqual(again.delivered.bytes, first.delivered.bytes);
  assert.deepEqual(again.delivered.receipt, first.delivered.receipt);
});

test("a kept page is kept under the digest of the module that forms its verdict, and another digest asks again", async (t) => {
  // The publisher's own verdict on a page, the receipt it keeps and Archify's fixed arguments are formed in
  // `explainer.mjs`: a page kept by another version of it is asked again (the review of 2026-11-24).
  const directory = await temporaryDirectory(t, "archpub-answers-");
  named(t, path.join(directory, "kept"));
  const model = validateModel(minimalModel());
  const views = await planViews(model, async () => ({ fits: true, width: 2400, height: 1350 }));
  const page = await explainerPage(model, views, { deliver: "minimal.html" });
  const parts = await pageParts(page, "minimal.html");
  const source = await fs.readFile(new URL("../src/map/explainer.mjs", import.meta.url));
  assert.equal(parts[0], createHash("sha256").update(source).digest("hex"));
  const whole = (answer) => typeof answer?.bytes === "string";
  let asked = 0;
  const ask = async () => {
    asked += 1;
    return {};
  };
  await keptAnswer(parts, ask, whole);
  assert.equal(asked, 0, "the page kept under its own parts was asked again");
  await keptAnswer(["0".repeat(64), ...parts.slice(1)], ask, whole);
  assert.equal(asked, 1, "a page kept by another verdict was read");
});

test("a page stopped while its candidates are measured keeps none of their answers, and the next page measures them", async (t) => {
  // A plan made again stops its page and at once starts the page that replaces it, which asks for the same
  // documents while the stopped page's runs are still ending (the reviews of the Change, 2026-11-24): a stopped run
  // is thrown, never an answer, and a question of stopped work is not read by the next page, which asks again.
  named(t, null);
  const model = validateModel(
    minimalModel({
      components: [
        { id: "a", label: "Stopped alpha" },
        { id: "b", label: "Stopped beta" },
      ],
    }),
  );
  const [view] = await planViews(model, async () => ({ fits: true, width: 2400, height: 1350 }));
  const stop = new AbortController();
  /** @type {() => void} */
  let begun = () => {};
  const running = new Promise((resolve) => {
    begun = () => resolve(undefined);
  });
  const stopped = telling(begun, stop.signal, () => chooseDiagram(model, view));
  stopped.catch(() => {});
  await running;
  stop.abort();
  const next = telling(
    () => {},
    new AbortController().signal,
    () => chooseDiagram(model, view),
  );
  await assert.rejects(stopped, { code: "archify_stopped" });
  assert.ok((await next).metrics, "the next page chose no diagram");
});
