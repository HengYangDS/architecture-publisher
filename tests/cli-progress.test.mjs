import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildDelivery, checkModel } from "../src/build.mjs";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";

const MAIN = fileURLToPath(new URL("../src/cli/main.mjs", import.meta.url));
const TERMINAL = new URL("./fixtures/terminal-stderr.mjs", import.meta.url).href;

/** The steps a check of both media passes, in order, and the ones a build adds. */
const CHECK_STEPS = [
  "reading the model",
  "verifying files",
  "planning views",
  "laying out the plates",
  "preparing the page",
];
const BUILD_STEPS = [...CHECK_STEPS, "typesetting the edition", "delivering the page"];

/** Run the executable with standard error as a pipe, or as what answers as a terminal. */
function archpub(args, { terminal }) {
  // Clack draws each step as it is reached only outside CI, and the bytes are compared without colour.
  const env = { ...process.env, NO_COLOR: "1" };
  delete env.CI;
  delete env.FORCE_COLOR;
  return spawnSync(process.execPath, [...(terminal ? ["--import", TERMINAL] : []), MAIN, ...args], {
    encoding: "utf8",
    env,
    timeout: 300_000,
  });
}

test("a check and a build name each step they reach to a listener, and return what they return without one", async (t) => {
  const model = await writeModel(t, minimalModel());
  const steps = [];
  const checked = await checkModel(model, {}, (step) => steps.push(step));
  assert.deepEqual(steps, CHECK_STEPS);
  assert.deepEqual(checked, await checkModel(model));
  // A check of the page alone lays out no plate, and one of the edition alone prepares no page.
  const only = async (media) => {
    const reached = [];
    await checkModel(model, { media: [media] }, (step) => reached.push(step));
    return reached;
  };
  assert.deepEqual(await only("page"), CHECK_STEPS.toSpliced(3, 1));
  assert.deepEqual(await only("edition"), CHECK_STEPS.slice(0, 4));

  const root = await temporaryDirectory(t, "archpub-progress-");
  const built = [];
  // The builds are made for their steps: their images are small.
  const small = { png: [240] };
  const listened = await buildDelivery(model, path.join(root, "listened"), small, (step) =>
    built.push(step),
  );
  assert.deepEqual(built, BUILD_STEPS);
  const plain = await buildDelivery(model, path.join(root, "plain"), small);
  assert.deepEqual({ ...listened, out: "" }, { ...plain, out: "" });
  // A build names the steps of the media it delivers alone.
  const delivering = async (media) => {
    const reached = [];
    await buildDelivery(model, path.join(root, media), { ...small, media: [media] }, (step) =>
      reached.push(step),
    );
    return reached.slice(3);
  };
  assert.deepEqual(await delivering("page"), ["preparing the page", "delivering the page"]);
  assert.deepEqual(await delivering("edition"), [
    "laying out the plates",
    "typesetting the edition",
  ]);
});

test("a command on a terminal draws its steps on standard error, and standard output holds the same bytes", async (t) => {
  const model = await writeModel(t, minimalModel());
  const piped = archpub(["check", model], { terminal: false });
  assert.equal(piped.status, 0, piped.stderr);
  assert.equal(piped.stderr, "");
  const drawn = archpub(["check", model], { terminal: true });
  assert.equal(drawn.status, 0, drawn.stderr);
  assert.equal(drawn.stdout, piped.stdout);
  for (const step of CHECK_STEPS) assert.ok(drawn.stderr.includes(step), step);
  assert.match(drawn.stderr, /archpub check: 5 steps done\n$/u);

  // With --json nothing is drawn, on a terminal or off it.
  const machine = archpub(["check", model, "--json"], { terminal: true });
  assert.equal(machine.stderr, "");
  assert.equal(machine.stdout, archpub(["check", model, "--json"], { terminal: false }).stdout);

  // A refused model stops the steps where it was refused, and the refusal is the same bytes.
  const invalid = await writeModel(
    t,
    minimalModel({ relations: [{ id: "x", from: "a", to: "a", label: "y" }] }),
  );
  const refused = archpub(["check", invalid], { terminal: true });
  assert.equal(refused.status, 1);
  assert.ok(refused.stderr.includes("reading the model"));
  assert.ok(!refused.stderr.includes("verifying files"));
  assert.match(refused.stderr, /archpub check: stopped/u);
  assert.equal(refused.stdout, archpub(["check", invalid], { terminal: false }).stdout);

  // A command without steps draws nothing, and a usage error neither.
  for (const args of [["skill"], ["chek", model]])
    assert.equal(archpub(args, { terminal: true }).stderr, "", args[0]);
});

test("a build piped to a file holds no progress, and its standard output equals that of a run on a terminal", async (t) => {
  const model = await writeModel(t, minimalModel());
  const out = path.join(await temporaryDirectory(t, "archpub-progress-"), "delivery");
  const drawn = archpub(["build", model, "--out", out, "--png", "240"], { terminal: true });
  assert.equal(drawn.status, 0, drawn.stderr);
  for (const step of BUILD_STEPS) assert.ok(drawn.stderr.includes(step), step);
  assert.match(drawn.stderr, /archpub build: 7 steps done\n$/u);
  await fs.rm(out, { recursive: true });
  const piped = archpub(["build", model, "--out", out, "--png", "240"], { terminal: false });
  assert.equal(piped.status, 0, piped.stderr);
  assert.equal(piped.stderr, "");
  assert.equal(piped.stdout, drawn.stdout);
});
