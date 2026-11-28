import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { gateFailures } from "../src/poster/compose/gates.mjs";
import { tree, writer } from "./fixtures/references-writer.mjs";

// The sentences the reference writer writes from measures the code states as constants of its own modules
// (tools/docs/references/measures.mjs), and a palette's dye steps, one per age band: each sentence written again when
// its source changes, and a source that lacks what a sentence prints, or a count it cannot say, refused by name. The
// reports a check prints in the documents are examples of a run, which no writer runs; their limits are held to the
// gates here.

const root = path.resolve(import.meta.dirname, "..");

test("the writer writes a palette's colours, the strip's lengths, the age bands, the trials' widths, the balance gates and the cards a row holds from their sources", async () => {
  const dir = await tree();
  /** Rewrite a file of the tree. @param {string} file @param {(text: string) => string} change */
  const edit = async (file, change) => {
    const target = path.join(dir, file);
    const before = await fs.readFile(target, "utf8");
    const after = change(before);
    assert.notEqual(after, before, file);
    await fs.writeFile(target, after);
  };
  try {
    await edit("src/model/schema.json", (text) => {
      const schema = JSON.parse(text);
      schema.properties.edition.properties.palette.oneOf[1].required.push("accent");
      return `${JSON.stringify(schema, null, 2)}\n`;
    });
    await edit("src/poster/strip.mjs", (text) =>
      text.replace("Object.freeze([320, 208])", "Object.freeze([320, 264, 208])"),
    );
    await edit("src/facts/ages.mjs", (text) => text.replace("90 * DAY", "14 * DAY"));
    await edit("tests/fixtures/line-tables.mjs", (text) =>
      text.replace("[2400, 1920, 960]", "[2400, 1200]"),
    );
    await edit("src/poster/compose/gates.mjs", (text) =>
      text
        .replace("emptyShare: 0.12,", "emptyShare: 0.15,")
        .replace("Object.freeze([0.12, 0.12])", "Object.freeze([0.12, 0.1])"),
    );
    await edit("src/poster/balance.mjs", (text) => text.replace("HOLE = 240;", "HOLE = 256;"));
    await edit("src/layout/rows.mjs", (text) => text.replace("ROW_LIMIT = 6;", "ROW_LIMIT = 7;"));
    const refused = await writer("--check", dir);
    assert.equal(refused.code, 1);
    for (const file of [
      "docs/reference/model.md",
      "docs/reference/lines.md",
      "docs/reference/operations.md",
      "skills/architecture-publisher/SKILL.md",
    ])
      assert.match(refused.stderr, new RegExp(`references_drift: ${file}: run`, "u"));
    assert.equal((await writer("--write", dir)).code, 0);
    const read = (/** @type {string} */ file) => fs.readFile(path.join(dir, file), "utf8");
    const model = await read("docs/reference/model.md");
    for (const sentence of [
      "A palette of your own names a ground, an ink, three dye steps, one per age band, from new to old and an accent:",
      "The largest part is 320 px long; a strip is never shortened to fit its column, so an edition one of whose views cannot hold its strips draws them all at the longest its views hold of 264 or 208 px.",
      "Every edition sorts its files into the same three age bands, counted back from the pin's commit: changed within a week, over a week and within two weeks, and earlier; the key names the middle band by both bounds.",
    ])
      assert.ok(model.includes(`\n\n${sentence}\n\n`), sentence);
    const rows =
      "\n\nWhere a plate is drawn in rows of cards, a tier's row holds at most six cards and a row of a view of `members` at most seven.\n\n";
    assert.ok(model.includes(rows));
    assert.ok((await read("skills/architecture-publisher/SKILL.md")).includes(rows));
    assert.ok(
      (await read("docs/reference/operations.md")).includes(
        "\n\nEach plate is measured against four balance gates over the body: its largest blank rectangle covers at most 15 percent of it, no blank band 96 px or taller runs across it, at most 40 percent of it lies in empty squares of 256 px or more, and its centre of mass lies within 12 percent of the centre across and 10 percent down.\n\n",
      ),
    );
    assert.ok(
      (await read("docs/reference/lines.md")).includes(
        "\n\nValues are in the plate's drawing space, in which one pixel is one pixel of an image 2400 px wide and 0.5 px of one 1200 px wide: the two widths the trials measured at.\n\n",
      ),
    );
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("the writer stops on a module that lacks a constant it prints, or states a gate it cannot say, naming it", async () => {
  for (const [file, from, to, refusal] of [
    [
      "src/poster/strip.mjs",
      "STRIP_LENGTHS",
      "LENGTHS",
      /references_set_missing: src\/poster\/strip\.mjs exports no STRIP_LENGTHS/u,
    ],
    [
      "src/poster/strip.mjs",
      "Object.freeze([320, 208])",
      "Object.freeze([320])",
      /references_set_missing: src\/poster\/strip\.mjs states no shorter length in STRIP_LENGTHS/u,
    ],
    [
      "src/facts/ages.mjs",
      "{ spans:",
      "{ bounds:",
      /references_set_missing: src\/facts\/ages\.mjs states no spans of BANDS/u,
    ],
    [
      "tests/fixtures/line-tables.mjs",
      "WIDTHS",
      "SIZES",
      /references_set_missing: tests\/fixtures\/line-tables\.mjs exports no WIDTHS/u,
    ],
    [
      "src/poster/compose/gates.mjs",
      "export const GATES",
      "const GATES",
      /references_set_missing: src\/poster\/compose\/gates\.mjs exports no GATES/u,
    ],
    [
      "src/poster/compose/gates.mjs",
      "holes: 0.4,",
      "holes: Number.NaN,",
      /references_set_missing: src\/poster\/compose\/gates\.mjs states no holes in GATES/u,
    ],
    [
      "src/poster/compose/gates.mjs",
      "Object.freeze([0.12, 0.12])",
      "Object.freeze([0.12])",
      /references_set_missing: src\/poster\/compose\/gates\.mjs states no bound across and down in centroid of GATES/u,
    ],
    [
      "src/poster/compose/gates.mjs",
      "holes: 0.4,",
      "holes: 0.4, crowding: 0.5,",
      /references_gate_unnamed: src\/poster\/compose\/gates\.mjs states the gate crowding, which the sentence does not say/u,
    ],
    [
      "src/poster/balance.mjs",
      "export const HOLE",
      "const HOLE",
      /references_set_missing: src\/poster\/balance\.mjs exports no HOLE/u,
    ],
    [
      "src/layout/rows.mjs",
      "export const LABELLED_ROW_LIMIT",
      "const LABELLED_ROW_LIMIT",
      /references_set_missing: src\/layout\/rows\.mjs exports no LABELLED_ROW_LIMIT/u,
    ],
  ]) {
    const dir = await tree();
    try {
      const target = path.join(dir, file);
      const before = await fs.readFile(target, "utf8");
      assert.ok(before.includes(from), file);
      await fs.writeFile(target, before.replaceAll(from, to));
      const refused = await writer("--check", dir);
      assert.equal(refused.code, 1, file);
      assert.match(refused.stderr, refusal);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
});

test("the writer stops where the age bands are not three or a palette's dye steps are not one per band, naming the counts", async () => {
  for (const [spans, steps, refusal] of [
    [
      "[7 * DAY, 30 * DAY, 90 * DAY]",
      3,
      /references_dye_unmatched: the schema fixes 3 steps of a palette's dye and BANDS gives 4 age bands/u,
    ],
    [
      "[7 * DAY, 30 * DAY, 90 * DAY]",
      4,
      /references_bands_unnamed: src\/facts\/ages\.mjs gives 4 age bands; the sentence names three/u,
    ],
  ]) {
    const dir = await tree();
    try {
      const ages = path.join(dir, "src/facts/ages.mjs");
      await fs.writeFile(
        ages,
        (await fs.readFile(ages, "utf8")).replace("[7 * DAY, 90 * DAY]", String(spans)),
      );
      const file = path.join(dir, "src/model/schema.json");
      const schema = JSON.parse(await fs.readFile(file, "utf8"));
      const dye = schema.properties.edition.properties.palette.oneOf[1].properties.dye;
      dye.minItems = dye.maxItems = steps;
      await fs.writeFile(file, JSON.stringify(schema));
      const refused = await writer("--check", dir);
      assert.equal(refused.code, 1);
      assert.match(refused.stderr, refusal);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
});

test("the reports of a check the documents show name each balance gate's limit as the gates state it", async () => {
  // A page that misses every gate, so that each names its measure and its limit.
  const limits = new Map(
    gateFailures({
      emptyShare: 1,
      emptyRectangle: [0, 0, 0, 0],
      band: { height: Infinity, y: 0 },
      holes: 1,
      centroid: [1, 1],
    }).map(({ measure, limit }) => [measure, limit]),
  );
  // How many limits each document's reports print: a report reworded out of the pattern below is then missed loudly.
  for (const [file, count] of [
    ["docs/reference/command-line.md", 3],
    ["docs/tutorial.md", 3],
  ]) {
    const text = await fs.readFile(path.join(root, file), "utf8");
    // A report continues a long value on its next line, under the guide.
    const named = [...text.matchAll(/(\w+) [\d.]+\s(?:│\s+)?\(limit ([\d.]+)/gu)];
    assert.equal(named.length, count, file);
    for (const [, measure, limit] of named)
      assert.equal(Number(limit), limits.get(measure), `${file}: ${measure}`);
  }
});
