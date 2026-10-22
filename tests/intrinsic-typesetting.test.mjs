import assert from "node:assert/strict";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import {
  architectureTextBudget,
  measureArchitectureLabels,
  measureArchitectureNodeText,
} from "../packages/publisher/renderers/archify/node-text.mjs";

test("single-line peers reserve equal type capacity independently of their visible glyph ink", async () => {
  const input = {
    nodes: ["Alpha", "Beta", "gjpq", "TTTT"].map((label, index) => ({
      id: `peer-${index}`,
      label,
      figureKind: "component",
      visualRole: "backend",
      icon: "lucide:box",
    })),
  };
  const original = structuredClone(input);
  const result = await measureArchitectureNodeText(
    input,
    architectureTextBudget(12),
    await loadBundledFonts(),
    createBundledTextMeasurer,
  );
  assert.deepEqual(input, original);
  assert.equal(
    new Set(input.nodes.map(({ id }) => result.sizes[id].height)).size,
    1,
    JSON.stringify(result.sizes),
  );
  assert.equal(new Set(input.nodes.map(({ id }) => result.layouts[id].rows[0].y)).size, 1);
  for (const { id, label } of input.nodes) {
    assert(result.layouts[id].valid);
    assert.deepEqual(
      result.layouts[id].rows.map(({ text }) => text),
      [label],
    );
  }
});

test("intrinsic reflow preserves exact content and font size at a bounded peer width", async () => {
  const input = {
    nodes: [
      {
        id: "a",
        label: "Source  owns the complete selected meaning",
        icon: "none",
        detail: "No geometric work is transferred upstream",
      },
    ],
  };
  const fonts = await loadBundledFonts();
  const budget = architectureTextBudget(12);
  const result = await measureArchitectureNodeText(
    input,
    budget,
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: 176 },
  );
  assert.equal(result.sizes.a.width, 176);
  for (const field of ["label", "detail"])
    assert.equal(
      result.layouts.a.rows
        .filter((row) => row.field === field)
        .map((row) => row.text)
        .join(""),
      input.nodes[0][field],
    );
  assert(result.layouts.a.rows.every((row) => row.fontSize >= 12));
  const labels = await measureArchitectureLabels(
    [{ id: "rel", text: "Each selected contribution has its own admission" }],
    budget,
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: 96 },
  );
  assert(labels.layouts.rel.width <= 112);
  assert.equal(
    labels.layouts.rel.lines.join(""),
    "Each selected contribution has its own admission",
  );
});

test("compact peer capacity retains a complete short headline before wrapping detail", async () => {
  const input = {
    nodes: [
      {
        id: "boundary",
        label: "Stable meaning",
        detail: "Preserve complete selected meaning while allocating a compact reading frame",
        icon: "lucide:package",
      },
    ],
  };
  const before = structuredClone(input);
  const result = await measureArchitectureNodeText(
    input,
    architectureTextBudget(12),
    await loadBundledFonts(),
    createBundledTextMeasurer,
    { preferredWidth: 176, maximumWidth: 280, alignColumns: true },
  );
  assert.deepEqual(input, before);
  assert.deepEqual(
    result.layouts.boundary.rows.filter(({ field }) => field === "label").map(({ text }) => text),
    [input.nodes[0].label],
  );
  assert(result.sizes.boundary.width <= 280);
  assert(result.layouts.boundary.rows.every(({ fontSize }) => fontSize >= 12));
});

test("intrinsic label wrapping preserves whole graphemes and exact spacing", async () => {
  const text = `A  ${"e\u0301".repeat(8)} B`;
  const measure = {
    candidateWidth: ({ text }) => [...text].length * 10,
    box: ({ text }) => ({ x: 0, y: -8, width: [...text].length * 10, height: 10 }),
    defaultFamily: "Fixture Sans",
    supply: { id: "fixture-font", sha256: "f".repeat(64) },
  };
  const result = await measureArchitectureLabels(
    [{ id: "label", text }],
    architectureTextBudget(12),
    {},
    async () => measure,
    { maximumWidth: 30 },
  );
  const boundaries = new Set(
    [...new Intl.Segmenter("und", { granularity: "grapheme" }).segment(text)].map(
      ({ index }) => index,
    ),
  );
  boundaries.add(text.length);
  let offset = 0;
  for (const row of result.layouts.label.lines) {
    offset += row.length;
    assert(boundaries.has(offset), `grapheme boundary at ${offset}`);
  }
  assert.equal(result.layouts.label.lines.join(""), text);
});

test("intrinsic line breaking balances whole words instead of leaving a short tail", async () => {
  const text = "aaaa bbb cc";
  const measure = {
    candidateWidth: ({ text }) => text.trim().length * 10,
    box: ({ text }) => ({ x: 0, y: -8, width: text.trim().length * 10, height: 10 }),
    defaultFamily: "Fixture Sans",
    supply: { id: "fixture-font", sha256: "f".repeat(64) },
  };
  const result = await measureArchitectureLabels(
    [{ id: "balanced", text }],
    architectureTextBudget(12),
    {},
    async () => measure,
    { maximumWidth: 80 },
  );
  assert.deepEqual(result.layouts.balanced.lines, ["aaaa ", "bbb cc"]);
  assert.equal(result.layouts.balanced.lines.join(""), text);
});

test("intrinsic line breaking keeps separators with their preceding phrase", async () => {
  const labels = ["/", "+", "|", "&", ":", ";"].map((separator, index) => ({
    id: `separator-${index}`,
    text: `aaaa ${separator} bbbb`,
  }));
  const measure = {
    candidateWidth: ({ text }) => text.trim().length * 10,
    box: ({ text }) => ({ x: 0, y: -8, width: text.trim().length * 10, height: 10 }),
    defaultFamily: "Fixture Sans",
    supply: { id: "fixture-font", sha256: "f".repeat(64) },
  };
  const result = await measureArchitectureLabels(
    labels,
    architectureTextBudget(12),
    {},
    async () => measure,
    { maximumWidth: 80 },
  );
  for (const label of labels) {
    const { lines } = result.layouts[label.id];
    assert.equal(lines.join(""), label.text);
    assert.equal(lines.length, 2);
    assert.equal(lines[1], "bbbb", "A separator cannot dangle at the next line start");
  }
});

test("intrinsic node width keeps indivisible words intact before compact composition", async () => {
  const input = {
    nodes: [
      {
        id: "ownership",
        label: "Repository-owned reality",
        detail: "Exact  source meaning",
        icon: "lucide:folder-git-2",
      },
    ],
  };
  const before = structuredClone(input);
  const result = await measureArchitectureNodeText(
    input,
    architectureTextBudget(12),
    await loadBundledFonts(),
    createBundledTextMeasurer,
    { preferredWidth: 176 },
  );
  assert.deepEqual(input, before);
  assert(result.layouts.ownership.valid);
  assert.deepEqual(
    result.layouts.ownership.rows.filter(({ field }) => field === "label").map(({ text }) => text),
    ["Repository-owned reality"],
    "A compact width preference cannot force a break inside a fitting word",
  );
  assert.equal(
    result.layouts.ownership.rows
      .filter(({ field }) => field === "detail")
      .map(({ text }) => text)
      .join(""),
    input.nodes[0].detail,
  );
});

test("intrinsic node typography shares an ink rail and title baseline with a stable reading rhythm", async () => {
  const input = {
    nodes: [
      {
        id: "complete",
        label: "Source-owned input boundary",
        detail: "Selected meaning stays source-owned",
        note: "Exact text remains intact",
        figureKind: "service",
        visualRole: "backend",
        icon: "lucide:server",
      },
      {
        id: "short",
        label: "Peer",
        figureKind: "service",
        visualRole: "backend",
        icon: "lucide:server",
      },
    ],
    texts: [
      { id: "first", owner: "complete", text: "First exact statement", weight: "400" },
      { id: "second", owner: "complete", text: "Second exact statement", weight: "400" },
    ],
  };
  const before = structuredClone(input);
  const budget = architectureTextBudget(12);
  const result = await measureArchitectureNodeText(
    input,
    budget,
    await loadBundledFonts(),
    createBundledTextMeasurer,
  );
  assert.deepEqual(input, before);
  const complete = result.layouts.complete;
  const short = result.layouts.short;
  const rail = budget.sigilInset + budget.sigilSize + Math.max(8, budget.minimum * 0.6) * 2;
  assert(complete.valid && short.valid);
  assert(result.sizes.complete.height > result.sizes.short.height);
  assert.equal(complete.rows[0].y, short.rows[0].y, "Peer titles must start on one baseline");
  for (const { rows } of [complete, short])
    for (const row of rows)
      assert(Math.abs(row.box.x - rail) < 0.01, "Every exact field must share the left ink rail");
  const titles = complete.rows.filter(({ field }) => field === "label");
  assert.deepEqual(
    titles.map(({ text }) => text),
    ["Source-owned ", "input boundary"],
  );
  const body = complete.rows.filter(({ field }) => field === "detail");
  const statementRows = complete.rows.filter(({ field }) => field === "statement");
  assert(body.length > 1);
  assert(
    statementRows[1].y - statementRows[0].y > body[1].y - body[0].y,
    "Separate statements need the same field separator as other distinct content blocks",
  );
  for (const field of ["label", "detail", "note"])
    assert.equal(
      complete.rows
        .filter((row) => row.field === field)
        .map(({ text }) => text)
        .join(""),
      input.nodes[0][field],
    );
  for (const statement of input.texts)
    assert.equal(
      complete.rows
        .filter(({ occurrence }) => occurrence === statement.id)
        .map(({ text }) => text)
        .join(""),
      statement.text,
    );
});

test("fixed ordinary geometry retains its authored centered text composition", async () => {
  const input = {
    nodes: [
      {
        id: "fixed",
        label: "Source-owned input boundary",
        detail: "Selected meaning stays source-owned",
        icon: "none",
        size: { width: 176, height: 192 },
      },
    ],
  };
  const result = await measureArchitectureNodeText(
    input,
    architectureTextBudget(12),
    await loadBundledFonts(),
    createBundledTextMeasurer,
  );
  const layout = result.layouts.fixed;
  assert(layout.valid);
  assert.deepEqual(result.sizes.fixed, input.nodes[0].size);
  for (const { box } of layout.rows) assert(Math.abs(box.x + box.width / 2 - 88) < 0.01);
  assert.deepEqual(
    layout.rows.filter(({ field }) => field === "label").map(({ text }) => text),
    ["Source-owned input ", "boundary"],
  );
});

test("intrinsic whitespace runs retain exact bytes and measurable ink without empty rows", async () => {
  const fonts = await loadBundledFonts();
  const labels = [
    `A${" ".repeat(30)}B`,
    `A${" ".repeat(30)}`,
    `${" ".repeat(30)}A`,
    `A${" ".repeat(30)}B${" ".repeat(30)}C`,
  ].map((text, index) => ({ id: `spacing-${index}`, text }));
  const result = await measureArchitectureLabels(
    labels,
    architectureTextBudget(12),
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: 30 },
  );
  for (const label of labels) {
    const plan = result.layouts[label.id];
    assert.equal(plan.lines.join(""), label.text);
    assert(plan.lines.every((line) => line.trim().length > 0));
    assert(plan.baselines.every(({ box }) => box.width > 0 && box.width <= 30));
    assert(plan.baselines.every(({ box }) => box.x >= 0 && box.x + box.width <= plan.width));
    assert(plan.baselines.every(({ box }) => box.y >= 0 && box.y + box.height <= plan.height));
  }
  const node = {
    id: "spacing-node",
    label: labels[0].text,
    detail: labels[1].text,
    note: labels[2].text,
    visualRole: "backend",
    icon: "none",
  };
  const statement = {
    id: "spacing-statement",
    owner: node.id,
    text: labels[3].text,
    weight: "400",
  };
  const nodes = await measureArchitectureNodeText(
    { nodes: [node], texts: [statement] },
    architectureTextBudget(12),
    fonts,
    createBundledTextMeasurer,
    { maximumWidth: 176 },
  );
  const layout = nodes.layouts[node.id];
  assert(layout.valid);
  for (const field of ["label", "detail", "note", "statement"]) {
    const rows = layout.rows.filter((row) => row.field === field);
    assert.equal(
      rows.map(({ text }) => text).join(""),
      field === "statement" ? statement.text : node[field],
    );
    assert(rows.every(({ text, box }) => text.trim().length > 0 && box.width > 0));
  }
});

test("intrinsic viewport measurement retains exact font line metrics separately from visible ink", async () => {
  const fonts = await loadBundledFonts();
  const request = {
    text: "serves",
    fontSize: 12,
    weight: "400",
    anchor: "middle",
    x: 100,
    baseline: 50,
  };
  const measure = await createBundledTextMeasurer(fonts, [request]);
  const ink = measure.box(request);
  const line = measure.lineMetrics(request);
  for (const [field, expected] of Object.entries({ ascent: 12.24, descent: 3.6 }))
    assert(Math.abs(line[field] - expected) < 0.001, field);
  assert(request.baseline - line.ascent < ink.y);
  assert(request.baseline + line.descent > ink.y + ink.height);
  assert.deepEqual(measure.box(request), ink);
});

test("intrinsic leading uses font capacity without repeating the node's outer inset", async () => {
  const input = {
    nodes: [
      {
        id: "body",
        label: "Meaning",
        detail: "Alpha\nBeta\ngjpq\nTTTT\nCoordination grants\nno permission",
        icon: "none",
      },
      { id: "fields", label: "Meaning", detail: "Alpha", note: "Beta", icon: "none" },
    ],
  };
  const original = structuredClone(input);
  const fonts = await loadBundledFonts();
  const result = await measureArchitectureNodeText(
    input,
    architectureTextBudget(12),
    fonts,
    createBundledTextMeasurer,
  );
  const rows = result.layouts.body.rows.filter(({ field }) => field === "detail");
  const measurer = await createBundledTextMeasurer(fonts);
  for (let index = 1; index < rows.length; index++) {
    const advance = rows[index].y - rows[index - 1].y;
    assert(
      advance >= 15.84 && advance <= 18,
      `A complete 12px font line needs 15.84px capacity, not a repeated perimeter inset: ${advance}`,
    );
    const prior = measurer.lineMetrics({
      ...rows[index - 1],
      text: rows[index - 1].paintText,
      x: 0,
      baseline: 0,
    });
    const next = measurer.lineMetrics({
      ...rows[index],
      text: rows[index].paintText,
      x: 0,
      baseline: 0,
    });
    assert(rows[index - 1].y + prior.descent <= rows[index].y - next.ascent);
    assert(
      rows[index - 1].box.y + rows[index - 1].box.height + 5 <= rows[index].box.y,
      "Compact leading must still reserve the complete painted-text clearance",
    );
  }
  const fields = result.layouts.fields.rows;
  assert(fields[2].y - fields[1].y > rows[1].y - rows[0].y);
  const inset = 8;
  assert(result.layouts.body.rows.every(({ box }) => box.y >= inset));
  assert(
    result.layouts.body.rows.every(
      ({ box }) => box.y + box.height <= result.sizes.body.height - inset,
    ),
  );
  assert.equal(rows.map(({ text }) => text).join(""), input.nodes[0].detail);
  assert(result.layouts.body.valid && result.layouts.fields.valid);
  assert.deepEqual(input, original);
});
