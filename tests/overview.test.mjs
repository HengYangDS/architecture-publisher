import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, checkModel } from "../src/build.mjs";
import { checkBoxes } from "../src/overview/checks.mjs";
import { TYPST_VERSION } from "../src/names.mjs";
import { checkOverview, typstProblems, typstVersion } from "../src/overview/typeset.mjs";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";
import { everyBlock } from "./fixtures/overview-statements.mjs";
import { repository } from "./fixtures/repository.mjs";

/** A model stating the overview of every kind of block, written to a file, and the file's path. */
const stated = (t, extra = {}) => writeModel(t, minimalModel({ overview: everyBlock(), ...extra }));

/** The overview drawn alone from a statement, at a revision and its date. */
function typeset(statement = everyBlock()) {
  return checkOverview({
    modelBytes: Buffer.from(JSON.stringify(minimalModel({ overview: statement }))),
    revision: "a".repeat(40),
    date: "2026-11-02",
  });
}

/**
 * The fixture overview's page image with Typst 0.15.1 and the bundled faces. Every CI platform must reproduce it,
 * so an overview is the same image wherever it is built.
 */
const OVERVIEW_PNG = "1913ff496e931829d4afd95cbe03c30e52846b3dfd3e7b618042b7da76a79681";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** A PNG's width from its header. */
const pngWidth = (bytes) => bytes.readUInt32BE(16);

test("the overview is read with its revision and date, the same twice", async () => {
  const first = await typeset();
  const second = await typeset();
  assert.equal(first.typst, TYPST_VERSION);
  // The masthead and the imprint name the model, its revision and the revision's date.
  assert.ok(first.texts.includes(`As built at aaaaaaa · 2026-11-02`));
  assert.ok(
    first.texts.some((text) => text.startsWith("As built from Minimal at aaaaaaa, 2026-11-02. ")),
  );
  assert.ok(first.texts.includes("Alpha"));
  assert.deepEqual(first.texts, second.texts);
});

test("text over text and text outside the live area are refused", () => {
  const box = (x, y, text) => ({ x, y, w: 100, h: 12, size: 12.5, text });
  assert.doesNotThrow(() => checkBoxes([box(48, 100, "a"), box(48, 116, "b")]));
  assert.throws(
    () => checkBoxes([box(48, 100, "a"), box(60, 104, "b")]),
    (error) => {
      assert.equal(error.code, "overview_text_overlap");
      assert.match(error.problems[0].message, /"a" at 48,100 pt overlaps "b" at 60,104 pt/u);
      return true;
    },
  );
  assert.throws(
    () => checkBoxes([box(10, 100, "left"), box(1500, 895, "low")]),
    (error) => {
      assert.equal(error.code, "overview_text_outside");
      assert.equal(error.problems.length, 2);
      return true;
    },
  );
});

test("a character no bundled face draws is refused", async () => {
  await assert.rejects(typeset({ ...everyBlock(), claim: "Ethiopic ሀ" }), (error) => {
    assert.equal(error.code, "overview_glyph_missing");
    assert.match(error.problems[0].message, /ሀ$/u);
    return true;
  });
});

test("Typst's diagnostics name the composition's line, not the class's", () => {
  const stderr = [
    "error: panicked with: overview_reference_unknown: missing",
    "   ┌─ archpub/house.typ:39:24",
    "   │",
    "  while calling `label-of` at overview.typ:7:16",
    "warning: unknown font family: arial",
    "   ┌─ overview.typ:9:3",
  ].join("\n");
  assert.deepEqual(typstProblems(stderr), [
    { code: "overview_reference_unknown", path: "overview.typ:7", message: "missing" },
    {
      code: "overview_typst_warning",
      path: "overview.typ:9",
      message: "unknown font family: arial",
    },
  ]);
});

test("diagnostics name the composition's line wherever Typst reports the staged files", () => {
  const stderr = (root, separator) =>
    [
      "error: panicked with: overview_reference_unknown: missing",
      `   ┌─ ${[root, "archpub", "house.typ"].join(separator)}:39:24`,
      `  while calling \`label-of\` at ${[root, "overview.typ"].join(separator)}:7:16`,
    ].join("\n");
  const own = (text, roots) => typstProblems(text, roots)[0].path;
  // Windows: the absolute verbatim path of the staged files.
  const windows = "C:\\CI\\tmp\\archpub-overview-x";
  assert.equal(own(stderr(`\\\\?\\${windows}`, "\\"), [windows]), "overview.typ:7");
  // A temporary directory reported by its resolved path.
  const temporary = ["/var/t/archpub-overview-y", "/private/var/t/archpub-overview-y"];
  assert.equal(own(stderr(temporary[1], "/"), temporary), "overview.typ:7");
  // Linux and macOS: paths relative to Typst's working directory, the staged root.
  assert.equal(own(stderr(".", "/").replaceAll("./", ""), temporary), "overview.typ:7");
});

test("the overview needs the pinned Typst", async () => {
  await assert.rejects(typstVersion(path.join("absent", "typst")), {
    code: "overview_typst_missing",
  });
  await assert.rejects(typstVersion(process.execPath), (error) => {
    assert.equal(error.code, "overview_typst_version");
    assert.match(error.message, /0\.15\.1/u);
    return true;
  });
});

test("the edition needs the pinned Typst before it writes anything, and the page does not", async (t) => {
  const file = await stated(t);
  const root = await temporaryDirectory(t, "archpub-overview-typst-");
  const saved = process.env.PATH;
  // A path with Node and no Typst.
  process.env.PATH = path.dirname(process.execPath);
  try {
    await assert.rejects(buildDelivery(file, path.join(root, "edition")), {
      code: "edition_typst_missing",
    });
    assert.deepEqual(await fs.readdir(root), []);
    const built = await buildDelivery(file, path.join(root, "page"), { media: ["page"] });
    assert.deepEqual(built.media, ["page"]);
  } finally {
    process.env.PATH = saved;
  }
});

test("a build draws the overview a model states in the edition, the same bytes twice", async (t) => {
  const file = await stated(t);
  const out = path.join(await temporaryDirectory(t, "archpub-overview-build-"), "delivery");
  const built = await buildDelivery(file, out, { media: ["edition"], png: [2400, 3840, 6000] });
  assert.deepEqual(built.media, ["edition"]);
  const images = (await fs.readdir(path.join(out, "images"))).sort();
  // The image named without its width is the one at the default width, 3840 px.
  assert.deepEqual(
    images.filter((name) => name.startsWith("00-")),
    ["00-overview-2400.png", "00-overview-6000.png", "00-overview.png"],
  );
  assert.equal(pngWidth(await fs.readFile(path.join(out, "images", "00-overview.png"))), 3840);
  const image = await fs.readFile(path.join(out, "images", "00-overview-2400.png"));
  assert.equal(pngWidth(image), 2400);
  const wide = await fs.readFile(path.join(out, "images", "00-overview-6000.png"));
  assert.equal(pngWidth(wide), 6000);
  assert.equal(sha256(image), OVERVIEW_PNG);
  const again = path.join(path.dirname(out), "again");
  await buildDelivery(file, again, { media: ["edition"], png: [2400, 6000] });
  assert.ok(image.equals(await fs.readFile(path.join(again, "images", "00-overview-2400.png"))));
  assert.ok(wide.equals(await fs.readFile(path.join(again, "images", "00-overview-6000.png"))));
  const manifest = JSON.parse(await fs.readFile(path.join(out, "manifest.json"), "utf8"));
  assert.match(manifest.overview.statement.sha256, /^[0-9a-f]{64}$/u);
  assert.equal(manifest.overview.typst, TYPST_VERSION);
  assert.match(manifest.overview.house, /^[0-9a-f]{64}$/u);
  assert.match(manifest.supplies.house, /^[0-9a-f]{64}$/u);
  const checked = await checkModel(file, { media: ["edition"] });
  assert.equal(checked.overview.typst, TYPST_VERSION);
  assert.equal(checked.overview.date, null);
});

test("with the checkout, the overview prints the revision's commit date", async (t) => {
  const { root, revision, git } = await repository(t);
  const file = await stated(t, { repository: { name: "fixture", revision } });
  const checked = await checkModel(file, { media: ["edition"], repo: root });
  assert.equal(checked.overview.date, git("show", "-s", "--format=%cs", revision).trim());
  assert.match(checked.overview.date, /^\d{4}-\d{2}-\d{2}$/u);
});
