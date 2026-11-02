import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, checkModel } from "../src/build.mjs";
import { checkBoxes } from "../src/overview/checks.mjs";
import { lintComposition } from "../src/overview/lint.mjs";
import {
  TYPST_VERSION,
  typesetOverview,
  typstProblems,
  typstVersion,
} from "../src/overview/typeset.mjs";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";
import { repository } from "./fixtures/repository.mjs";

/** A composition with the house masthead, a head, a model label, a definition list and the imprint. */
const lines = (...body) =>
  [
    '#import "/archpub/house.typ": *',
    "#show: overview",
    "#masthead([Minimal], [Two components and one call], [A model written to test the overview.])",
    "#head(48pt, 140pt, [The call])",
    ...body,
    "#imprint([Each element's source is in the interactive atlas.])",
  ].join("\n");
const COMPOSITION = lines(
  '#tx(48pt, 170pt, label-of("a"), weight: "semibold")',
  "#dl(48pt, 200pt, 90pt, 600pt, (([Alpha], [calls Beta]), ([Beta], [answers])))",
);

/** A model naming `overview.typ`, written beside it, and the model's path. */
async function composed(t, text = COMPOSITION, extra = {}) {
  const file = await writeModel(t, minimalModel({ overview: "overview.typ", ...extra }));
  await fs.writeFile(path.join(path.dirname(file), "overview.typ"), text);
  return file;
}

async function typeset(t, text, widths = [2400]) {
  const file = await composed(t, text);
  return typesetOverview({
    composition: path.join(path.dirname(file), "overview.typ"),
    modelBytes: await fs.readFile(file),
    revision: "a".repeat(40),
    date: "2026-11-02",
    widths,
  });
}

/**
 * The fixture overview's digests with Typst 0.15.1 and the bundled faces. Every CI platform must
 * reproduce them, so an overview is the same file wherever it is built.
 */
const DIGESTS = {
  svg: "64476bd128529da9681916d0b7f3f867496db81e31f8f937ad1b10de91588205",
  "overview-240.png": "d74e76bcec550c4c8e0d4f47d982d4bd24cf3601c2f40e1b36dcf8915aa0284c",
  "overview.png": "1e4c12042dd95ac0e875c2a387647541f94a8244bd739312fc0ba66a663ab62b",
};
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** A PNG's width from its header. */
const pngWidth = (bytes) => bytes.readUInt32BE(16);

/** The line of a composition that holds a fragment, counted from 1. */
const lineOf = (text, fragment) =>
  text.split("\n").findIndex((line) => line.includes(fragment)) + 1;

test("the overview typesets the same bytes twice, with a PNG at each width", async (t) => {
  const first = await typeset(t, COMPOSITION, [240, 2400]);
  const second = await typeset(t, COMPOSITION, [240, 2400]);
  assert.equal(first.typst, TYPST_VERSION);
  // The masthead and the imprint name the model, its revision and the revision's date.
  assert.ok(first.texts.includes(`As built at aaaaaaa · 2026-11-02`));
  assert.ok(
    first.texts.some((text) => text.startsWith("As built from Minimal at aaaaaaa, 2026-11-02. ")),
  );
  assert.ok(first.texts.includes("Alpha"));
  assert.ok(first.svg.equals(second.svg));
  assert.deepEqual(
    first.png.map(({ width, file, bytes }) => [width, file, pngWidth(bytes)]),
    [
      [240, "overview-240.png", 240],
      [2400, "overview.png", 2400],
    ],
  );
  first.png.forEach(({ bytes }, index) => assert.ok(bytes.equals(second.png[index].bytes)));
  assert.deepEqual(
    {
      svg: sha256(first.svg),
      ...Object.fromEntries(first.png.map(({ file, bytes }) => [file, sha256(bytes)])),
    },
    DIGESTS,
  );
  assert.match(first.svg.toString("utf8"), /^<svg /u);
});

test("text over text and text outside the live area are refused", async (t) => {
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
  const overlapping = lines("#tx(48pt, 300pt, [One note])", "#tx(52pt, 302pt, [Another note])");
  await assert.rejects(typeset(t, overlapping), { code: "overview_text_overlap" });
});

test("a component the model lacks and a size outside the house scale stop the page at their line", async (t) => {
  const unknown = lines('#tx(48pt, 300pt, label-of("missing"))');
  await assert.rejects(typeset(t, unknown), (error) => {
    assert.equal(error.code, "overview_reference_unknown");
    assert.equal(error.problems[0].path, `overview.typ:${lineOf(unknown, "missing")}`);
    assert.equal(error.problems[0].message, "missing");
    return true;
  });
  const sized = lines('#tx(48pt, 300pt, [Too large], size: "huge")');
  await assert.rejects(typeset(t, sized), (error) => {
    assert.equal(error.code, "overview_style_refused");
    assert.equal(error.problems[0].path, `overview.typ:${lineOf(sized, "huge")}`);
    return true;
  });
});

test("a face the house lacks is refused at the line before Typst runs", async (t) => {
  const faced = lines('#tx(48pt, 300pt, [Odd face], font: ("Comic Sans",))');
  await assert.rejects(typeset(t, faced), (error) => {
    assert.equal(error.code, "overview_style_refused");
    assert.equal(error.problems[0].path, `overview.typ:${lineOf(faced, "Comic")}`);
    return true;
  });
});

test("a character no bundled face draws is refused", async (t) => {
  await assert.rejects(typeset(t, lines("#tx(48pt, 300pt, [Ethiopic ሀ])")), (error) => {
    assert.equal(error.code, "overview_glyph_missing");
    assert.match(error.problems[0].message, /ሀ$/u);
    return true;
  });
});

test("a composition may not fetch packages or set type, colour or the page itself", () => {
  const refused = (text) => {
    try {
      lintComposition([{ file: "overview.typ", text }]);
      return null;
    } catch (error) {
      return [error.code, error.problems.map(({ path: where }) => where)];
    }
  };
  assert.equal(refused(COMPOSITION), null);
  assert.equal(
    refused("// text(size: 40pt) in a comment\n/* rgb(1, 2, 3) */ #tx(48pt, 100pt, [ok])"),
    null,
  );
  assert.deepEqual(refused('#import "@preview/cetz:0.4.0": *'), [
    "overview_import_refused",
    ["overview.typ:1"],
  ]);
  assert.deepEqual(refused("#tx(48pt, 100pt, [a])\n#text(size: 40pt)[big]"), [
    "overview_style_refused",
    ["overview.typ:2"],
  ]);
  for (const text of [
    "#set page(width: 10pt)",
    "#tx(0pt, 0pt, [x], fill: rgb(1, 2, 3))",
    '#tx(0pt, 0pt, [x], font: "Arial")',
    "#dl(0pt, 0pt, 1pt, 1pt, (), size: 9pt)",
    '#plugin("x.wasm")',
  ])
    assert.ok(refused(text), text);
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

test("the composition's directory may not hold the class's own directory or links", async (t) => {
  const file = await composed(t);
  await fs.mkdir(path.join(path.dirname(file), "archpub"));
  await assert.rejects(
    typesetOverview({
      composition: path.join(path.dirname(file), "overview.typ"),
      modelBytes: await fs.readFile(file),
      revision: null,
      date: null,
      widths: [2400],
    }),
    { code: "overview_composition_invalid" },
  );
});

test("a build delivers the overview a model names, and refuses one it does not", async (t) => {
  const file = await composed(t);
  const out = path.join(await temporaryDirectory(t, "archpub-overview-build-"), "delivery");
  const built = await buildDelivery(file, out, { media: ["overview"], png: [2400, 240] });
  assert.deepEqual(built.media, ["overview"]);
  assert.deepEqual((await fs.readdir(out)).sort(), [
    "manifest.json",
    "overview-240.png",
    "overview.png",
    "overview.svg",
  ]);
  const manifest = JSON.parse(await fs.readFile(path.join(out, "manifest.json"), "utf8"));
  assert.equal(manifest.overview.composition.path, "overview.typ");
  assert.equal(manifest.overview.typst, TYPST_VERSION);
  assert.match(manifest.overview.house, /^[0-9a-f]{64}$/u);
  assert.match(manifest.supplies.house, /^[0-9a-f]{64}$/u);
  const plain = await writeModel(t, minimalModel());
  await assert.rejects(buildDelivery(plain, `${out}-plain`, { media: ["overview"] }), {
    code: "overview_composition_missing",
  });
  const checked = await checkModel(file, { media: ["overview"] });
  assert.equal(checked.overview.typst, TYPST_VERSION);
  assert.equal(checked.overview.date, null);
});

test("with the checkout, the overview prints the revision's commit date", async (t) => {
  const { root, revision, git } = await repository(t);
  const file = await composed(t, COMPOSITION, { repository: { name: "fixture", revision } });
  const checked = await checkModel(file, { media: ["overview"], repo: root });
  assert.equal(checked.overview.date, git("show", "-s", "--format=%cs", revision).trim());
  assert.match(checked.overview.date, /^\d{4}-\d{2}-\d{2}$/u);
});
