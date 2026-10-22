import assert from "node:assert/strict";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import {
  architectureTextBudget,
  measureArchitectureLabels,
  measureArchitectureNodeText,
} from "../packages/publisher/renderers/archify/node-text.mjs";

test("logical source lines preserve exact ranges while reserving blank rows without ink", async () => {
  const text = "  First\tline\r\n\r\nSecond line  \n";
  const fonts = await loadBundledFonts();
  const node = { id: "source", label: "Meaning", detail: text, icon: "none" };
  const before = structuredClone(node);
  const result = await measureArchitectureNodeText(
    { nodes: [node] },
    architectureTextBudget(12),
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: 176 },
  );
  assert.deepEqual(node, before);
  assert(result.layouts.source.valid);
  const rows = result.layouts.source.rows.filter(({ field }) => field === "detail");
  assert.equal(rows.map(({ text }) => text).join(""), text);
  let offset = 0;
  for (const row of rows) {
    assert.equal(row.sourceStart, offset);
    assert.equal(row.text, text.slice(row.sourceStart, row.sourceEnd));
    assert.doesNotMatch(row.paintText, /[\r\n\t]/u);
    offset = row.sourceEnd;
    if (!row.painted) assert.equal(row.box.width * row.box.height, 0);
  }
  assert.equal(offset, text.length);
  assert(rows.some(({ painted }) => !painted));
  assert(rows.some(({ paintText }) => paintText.includes("First    line")));
  const compact = await measureArchitectureNodeText(
    { nodes: [{ ...node, detail: "  First    line\nSecond line  " }] },
    architectureTextBudget(12),
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: 176 },
  );
  assert(result.sizes.source.height > compact.sizes.source.height);
  const labels = await measureArchitectureLabels(
    [{ id: "declaration", text }],
    architectureTextBudget(12),
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: 176 },
  );
  const label = labels.layouts.declaration;
  assert.equal(label.lines.join(""), text);
  assert(label.baselines.every(({ painted, box }) => painted && box.width > 0));
  assert(label.baselines.every(({ paintText }) => !/[\r\n\t]/u.test(paintText)));
});

test("logical layout never weakens the strict single-line ink measurer", async () => {
  const measure = await createBundledTextMeasurer(await loadBundledFonts());
  for (const text of ["First\nsecond", "First\tsecond", "First\r\nsecond"])
    assert.throws(
      () =>
        measure.candidateWidth({
          text,
          fontSize: 12,
          weight: "400",
          anchor: "middle",
          x: 0,
          baseline: 0,
        }),
      { code: "authored_canvas_text_profile_unsupported" },
    );
});

test("complete long logical lines wrap before entering bounded single-line measurement", async () => {
  const text = "Keep the exact selected source declaration. ".repeat(110);
  assert(text.length > 4096);
  const fonts = await loadBundledFonts();
  const result = await measureArchitectureLabels(
    [
      { id: "long-declaration", text },
      { id: "absent-label", text: "" },
    ],
    architectureTextBudget(12),
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: 176 },
  );
  assert.equal(result.layouts["long-declaration"].lines.join(""), text);
  assert(
    result.layouts["long-declaration"].baselines.every(({ paintText }) => paintText.length <= 4096),
  );
  assert.equal(result.layouts["absent-label"].height, 0);
  const node = await measureArchitectureNodeText(
    { nodes: [{ id: "source", label: "Meaning", detail: text, icon: "none" }] },
    architectureTextBudget(12),
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: 176 },
  );
  assert(node.layouts.source.valid);
  assert.equal(
    node.layouts.source.rows
      .filter(({ field }) => field === "detail")
      .map(({ text }) => text)
      .join(""),
    text,
  );
});
