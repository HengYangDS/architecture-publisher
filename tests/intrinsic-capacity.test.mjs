import assert from "node:assert/strict";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import {
  architectureTextBudget,
  measureArchitectureLabels,
  measureArchitectureNodeText,
  renderMeasuredNodeText,
} from "../packages/publisher/renderers/archify/node-text.mjs";

import { page, measurePages, selected } from "./fixtures/elk-layout.mjs";

test("intrinsic relationship footprints are compact and preserve exact label rows", async () => {
  const labels = [
    { id: "short", text: "new  Plan", weight: "400" },
    {
      id: "long",
      text: "Select a qualified successor without rewriting source meaning",
      weight: "400",
    },
  ];
  const before = structuredClone(labels);
  const measured = await measureArchitectureLabels(
    labels,
    architectureTextBudget(12),
    await loadBundledFonts(),
    createBundledTextMeasurer,
  );
  assert.deepEqual(labels, before);
  assert(measured.layouts.short.width < 110);
  assert(measured.layouts.short.height < 32);
  assert(measured.layouts.long.baselines.length > 1);
  for (const label of labels) {
    const layout = measured.layouts[label.id];
    assert.equal(layout.lines.join(""), label.text);
    assert(layout.baselines.every(({ box }) => box.x >= 5 && box.y >= 5));
    assert(layout.baselines.every(({ box }) => box.x + box.width <= layout.width - 5));
    assert(layout.baselines.every(({ box }) => box.y + box.height <= layout.height - 5));
  }
});

test("intrinsic grouped composition retains an independent statement outside semantic membership", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "grouped-statement",
    title: "Separate physical and semantic ownership",
    subtitle: "Exact declared memberships",
    typography: { minimumTextPx: 12 },
    nodes: ["alpha", "beta"].map((id) => ({ id, label: id, visualRole: "backend" })),
    edges: [{ id: "flow", from: "alpha", to: "beta", label: "selects", visualRole: "default" }],
    groups: [
      { id: "source", label: "Source", nodeIds: ["alpha"] },
      { id: "execution", label: "Execution", nodeIds: ["beta"] },
    ],
    texts: [
      {
        id: "context",
        text: "This statement has no semantic group",
        weight: "400",
        anchor: "middle",
        tone: "muted",
        visible: true,
        semanticIds: [],
      },
    ],
  };
  const before = structuredClone(scene);
  const composed = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, before);
  assert.deepEqual(
    composed.scene.groups.map(({ id, nodeIds }) => ({ id, nodeIds })),
    scene.groups.map(({ id, nodeIds }) => ({ id, nodeIds })),
  );
  assert.deepEqual(
    composed.scene.nodes.map(({ id }) => id),
    ["alpha", "beta"],
  );
  assert.equal(composed.scene.texts[0].text, scene.texts[0].text);
  assert.equal(composed.scene.texts[0].owner, undefined);
  const statement = composed.physical.texts.context;
  assert.equal(statement.lines.join(""), scene.texts[0].text);
  assert(statement.paintBox.width > 0 && statement.paintBox.height > 0);
  assert.equal(Object.keys(composed.physical.edges).length, 1);
});

test("measured physical allocations cannot supply semantic membership or relationship endpoints", async () => {
  const { layoutInteractivePages } = await selected();
  const page = {
    nodes: [{ id: "entity", label: "Entity" }],
    groups: [{ id: "owner", label: "Owner", nodeIds: ["entity"] }],
    allocations: [{ id: "statement", label: "Exact independent statement" }],
    relations: [],
  };
  const label = { lines: [""], width: 0, height: 0, fontSize: 12, weight: "400", baselines: [] };
  const options = {
    nodeFootprints: [
      {
        entity: { width: 176, height: 64, label },
        statement: { width: 176, height: 64, label },
      },
    ],
  };
  const composed = (await layoutInteractivePages([page], await measurePages([page]), options))
    .layouts[0];
  assert.deepEqual(
    composed.groups.map(({ id }) => id),
    ["owner"],
  );
  assert.equal(composed.nodes.find(({ id }) => id === "statement").groupId, null);
  assert.equal(composed.nodes.find(({ id }) => id === "entity").groupId, "owner");
  await assert.rejects(
    layoutInteractivePages(
      [{ ...page, groups: [{ id: "owner", label: "Owner", nodeIds: ["entity", "statement"] }] }],
      null,
      options,
    ),
    { code: "render_interactive_group_invalid" },
  );
  await assert.rejects(
    layoutInteractivePages(
      [{ ...page, relations: [{ id: "leak", source: "entity", target: "statement" }] }],
      null,
      options,
    ),
    { code: "render_interactive_layout_invalid" },
  );
  await assert.rejects(layoutInteractivePages([page]), {
    code: "render_interactive_layout_invalid",
  });
});

test("name-only nodes reserve one complete font line and icon without detail-card capacity", async () => {
  const input = {
    nodes: ["API", "Store"].map((label) => ({ id: label, label, icon: "lucide:box" })),
  };
  const before = structuredClone(input);
  const budget = architectureTextBudget(12);
  const fonts = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(fonts);
  const result = await measureArchitectureNodeText(input, budget, fonts, createBundledTextMeasurer);
  for (const { id, label } of input.nodes) {
    const layout = result.layouts[id];
    const size = result.sizes[id];
    assert(layout.valid);
    assert.deepEqual(
      layout.rows.map(({ text }) => text),
      [label],
    );
    const right = Math.max(...layout.rows.map(({ box }) => box.x + box.width));
    const lineBottom = (row) => {
      const line = measurer.lineMetrics({ ...row, text: row.paintText, x: 0, baseline: 0 });
      assert(row.y - line.ascent >= 8, "The complete line envelope clears the top inset");
      return Math.max(row.box.y + row.box.height, row.y + line.descent);
    };
    const bottom = Math.max(budget.sigilInset + budget.sigilSize, ...layout.rows.map(lineBottom));
    assert(
      size.width - right < 24,
      "Horizontal capacity covers insets, font advance and grid rounding",
    );
    assert(size.height - bottom >= 8, "The complete line envelope clears the bottom inset");
    assert(size.height - bottom < 16, "Capacity adds only the inset and less than one grid unit");
    assert(size.height >= budget.sigilInset + budget.sigilSize + 8);
    assert(layout.rows.every(({ fontSize }) => fontSize >= 12));
  }
  assert.deepEqual(input, before);
});

test("intrinsic node footprints include every exact field and glyph without source geometry", async () => {
  const input = {
    nodes: [
      {
        id: "first-source",
        label: "Source  owner",
        detail: "Native architecture facts and their exact relationships remain source-owned",
        note: "A".repeat(64),
        icon: "lucide:workflow",
      },
      {
        id: "second-source",
        label: "The same source in another occurrence",
        icon: "lucide:workflow",
      },
    ],
  };
  const before = structuredClone(input);
  const budget = { minimum: 12, primary: 14.4, sigilInset: 6, sigilSize: 18 };
  const result = await measureArchitectureNodeText(
    input,
    budget,
    await loadBundledFonts(),
    createBundledTextMeasurer,
  );
  assert.deepEqual(input, before);
  assert(result.sizes["first-source"].height > result.sizes["second-source"].height);
  for (const node of input.nodes) {
    const layout = result.layouts[node.id];
    const size = result.sizes[node.id];
    assert(layout.valid, `complete intrinsic capacity: ${node.id}`);
    assert(size.width >= 170 && size.width <= 280);
    assert(size.height >= budget.sigilInset + budget.sigilSize + 8 && size.height < 600);
    for (const field of ["label", "detail", "note"])
      assert.equal(
        layout.rows
          .filter((row) => row.field === field)
          .map((row) => row.text)
          .join(""),
        node[field] ?? "",
      );
    for (const { box } of layout.rows) {
      assert(box.x > budget.sigilInset + budget.sigilSize);
      assert(box.x + box.width < size.width);
      assert(box.y >= 0 && box.y + box.height < size.height);
    }
  }
});

test("the existing layout owner admits complete measured occurrence footprints without resizing them", async () => {
  const { layoutInteractivePages } = await selected();
  const input = page();
  const label = {
    lines: ["Alpha"],
    width: 100,
    height: 40,
    fontSize: 16,
    weight: "600",
    baselines: [
      { text: "Alpha", x: 10, baseline: 25, box: { x: 10, y: 10, width: 50, height: 15 } },
    ],
  };
  const footprints = Object.fromEntries(
    input.nodes.map(({ id }, index) => [id, { width: 200, height: 128 + index * 16, label }]),
  );
  const result = await layoutInteractivePages([input], await measurePages([input]), {
    nodeFootprints: [footprints],
    readingWidth: 930,
    minimumLabelSize: 12,
  });
  for (const node of result.layouts[0].nodes) {
    assert.equal(node.width, footprints[node.id].width);
    assert.equal(node.height, footprints[node.id].height);
  }
  assert.deepEqual(
    result.layouts[0].relations.map(({ id, source, target }) => ({ id, source, target })),
    input.relations.map(({ id, source, target }) => ({ id, source, target })),
  );
});

test("intrinsic node capacity is content-local and retains every exact owned statement", async () => {
  const input = {
    nodes: [
      {
        id: "first",
        label: "A complete source-owned operation with a long exact name",
        detail: "All selected obligations remain visible",
        figureKind: "service",
        visualRole: "backend",
        icon: "lucide:server",
      },
      {
        id: "second",
        label: "Peer",
        figureKind: "service",
        visualRole: "backend",
        icon: "lucide:server",
      },
      { id: "store", label: "Store", figureKind: "store", visualRole: "database", icon: "none" },
    ],
    texts: [
      { id: "first-statement", owner: "first", text: "An exact  owned statement", weight: "400" },
      {
        id: "second-statement",
        owner: "second",
        text: "A distinct statement",
        weight: "600",
        family: "JetBrains Mono",
      },
      { id: "unowned", text: "Not a node field", weight: "400" },
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
  assert(result.sizes.first.height > result.sizes.second.height);
  assert(result.sizes.store.width < result.sizes.first.width);
  assert(result.sizes.store.height < result.sizes.first.height);
  for (const node of input.nodes) {
    const layout = result.layouts[node.id];
    assert(layout.valid);
    const statements = input.texts.filter(({ owner }) => owner === node.id);
    for (const statement of statements) {
      const rows = layout.rows.filter(({ occurrence }) => occurrence === statement.id);
      assert.equal(rows.map(({ text }) => text).join(""), statement.text);
      assert(rows.every(({ field }) => field === "statement"));
      if (statement.family) assert(rows.every(({ family }) => family === statement.family));
    }
    assert(!layout.rows.some(({ occurrence }) => occurrence === "unowned"));
    for (const [index, row] of layout.rows.entries()) {
      assert(row.box.x >= 0 && row.box.x + row.box.width <= result.sizes[node.id].width);
      assert(row.box.y >= 0 && row.box.y + row.box.height <= result.sizes[node.id].height);
      if (index) {
        const previous = layout.rows[index - 1];
        const sameBlock = previous.field === row.field && previous.occurrence === row.occurrence;
        assert(
          row.box.y >= previous.box.y + previous.box.height + (sameBlock ? 5 : 7.2) - 0.01,
          "Line leading clears painted text; distinct fields retain a stronger separator",
        );
      }
    }
  }
});

test("figure classification and unrelated dense content cannot inflate another node capacity", async () => {
  const nodes = [
    {
      id: "one",
      label: "Accept meaning",
      detail: "Scope / exceptions / guarantees",
      icon: "none",
      figureKind: "carrier",
      visualRole: "external",
    },
    {
      id: "two",
      label: "Accept meaning",
      detail: "Scope / exceptions / guarantees",
      icon: "none",
      figureKind: "aggregate",
      visualRole: "external",
    },
    {
      id: "dense",
      label: "A distinct source record",
      detail: "Every exact condition remains selected and visible. ".repeat(12),
      icon: "none",
      figureKind: "carrier",
      visualRole: "external",
    },
  ];
  const input = { nodes };
  const before = structuredClone(input);
  const budget = architectureTextBudget(12);
  const fonts = await loadBundledFonts();
  const result = await measureArchitectureNodeText(input, budget, fonts, createBundledTextMeasurer);
  const isolated = await measureArchitectureNodeText(
    { nodes: nodes.slice(0, 2) },
    budget,
    fonts,
    createBundledTextMeasurer,
  );
  assert.deepEqual(result.sizes.one, result.sizes.two, "Semantic kind is not geometric prominence");
  assert.deepEqual(
    result.sizes.one,
    isolated.sizes.one,
    "A remote dense carrier must not propagate its height",
  );
  assert.deepEqual(result.sizes.two, isolated.sizes.two);
  assert(result.sizes.dense.height > result.sizes.one.height);
  assert.deepEqual(input, before);
});

test("measured typesetting refuses mixed geometry before loading font resources", async () => {
  const input = {
    nodes: [
      { id: "intrinsic", label: "Intrinsic", icon: "none" },
      { id: "fixed", label: "Fixed", icon: "none", size: { width: 176, height: 64 } },
    ],
  };
  const before = structuredClone(input);
  await assert.rejects(
    measureArchitectureNodeText(input, architectureTextBudget(12), {}, async () => {
      assert.fail("mixed geometry must refuse before accessing a font supply");
    }),
    { code: "render_node_text_geometry_mixed" },
  );
  assert.deepEqual(input, before);
});

test("measured typesetting refuses impossible glyph width and height without shortening text", async () => {
  const budget = architectureTextBudget(12);
  const measurer = (width, height) => ({
    candidateWidth: ({ text }) => text.length * width,
    lineMetrics: () => ({ ascent: 8, descent: Math.max(0, height - 8) }),
    box: ({ text }) => ({
      x: (-text.length * width) / 2,
      y: -8,
      width: text.length * width,
      height,
    }),
    defaultFamily: "Fixture Sans",
    supply: { id: "fixture-font", sha256: "f".repeat(64) },
  });
  for (const [width, height] of [
    [1000, 10],
    [10, 12001],
  ]) {
    const input = { nodes: [{ id: "node", label: "Exact", icon: "none" }] };
    const before = structuredClone(input);
    await assert.rejects(
      measureArchitectureNodeText(input, budget, {}, async () => measurer(width, height)),
      { code: "render_node_text_infeasible" },
    );
    assert.deepEqual(input, before);
  }
  for (const text of ["W", "   W"]) {
    const labels = [{ id: "label", text }];
    const before = structuredClone(labels);
    await assert.rejects(
      measureArchitectureLabels(labels, budget, {}, async () => measurer(10, 10), {
        maximumWidth: 2,
      }),
      { code: "render_node_text_infeasible" },
    );
    assert.deepEqual(labels, before);
  }
  for (const size of [
    { width: 4, height: 64 },
    { width: 176, height: 4 },
  ]) {
    const input = { nodes: [{ id: "node", label: "Exact", icon: "none", size }] };
    const before = structuredClone(input);
    const result = await measureArchitectureNodeText(input, budget, {}, async () =>
      measurer(10, 10),
    );
    assert.equal(result.layouts.node.valid, false);
    assert.deepEqual(input, before);
  }
});

test("measured node paint retains exact field offsets, escaping and independent statement ownership", () => {
  const row = (field, text, x, y) => ({
    field,
    text,
    paintText: text,
    painted: true,
    x,
    y,
    fontSize: 12,
    weight: "400",
  });
  const layout = {
    family: "Fixture Sans",
    rows: [
      row("label", "Source < owner", 42, 20),
      row("detail", "First  exact ", 40, 40),
      row("detail", "continuation", 48, 60),
      row("note", "Qualified & bounded", 46, 80),
      { ...row("statement", "Separately painted", 48, 100), occurrence: "statement" },
    ],
  };
  const before = structuredClone(layout);
  const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
  const painted = renderMeasuredNodeText(layout, { x: 10, y: 15 }, "t-accent", escape);
  assert.match(painted, /data-node-label="" x="52" y="35"/u);
  assert(painted.includes("Source &lt; owner"));
  assert(painted.includes('<tspan x="50" y="55">First  exact </tspan>'));
  assert(painted.includes('<tspan x="58" y="75">continuation</tspan>'));
  assert(painted.includes('data-detail="fine" x="56" y="95" class="t-accent"'));
  assert(painted.includes("Qualified &amp; bounded"));
  assert.equal((painted.match(/xml:space="preserve"/gu) ?? []).length, 3);
  assert(!painted.includes("Separately painted"));
  assert.equal(
    renderMeasuredNodeText({ ...layout, rows: [] }, { x: 0, y: 0 }, "t-accent", escape).trim(),
    "",
  );
  assert.deepEqual(layout, before);
});

test("cyclic reading uses connected folded rows rather than unrelated storage order", async () => {
  const { intrinsicPlacements, unpackGeometry } =
    await import("../packages/publisher/renderers/elk/placement.mjs");
  const { createRequire } = await import("node:module");
  const ELK = createRequire(import.meta.url)("elkjs/lib/elk.bundled.js");
  const labels = {
    lines: ["Complete subject"],
    width: 176,
    height: 64,
    fontSize: 12,
    weight: "400",
    baselines: [],
  };
  const page = {
    orderedFlow: false,
    groups: [],
    nodes: [0, 4, 2, 6, 1, 5, 3, 7].map((id) => ({
      id: `subject-${id}`,
      width: 224,
      height: 80,
      label: { ...labels, lines: [`Stage ${id}`] },
    })),
    relations: Array.from({ length: 8 }, (_, index) => ({
      id: `relationship-${index}`,
      source: `subject-${index}`,
      target: `subject-${(index + 1) % 8}`,
      label: { ...labels, lines: ["Progresses"], width: 80, height: 24 },
    })),
  };
  const before = structuredClone(page);
  const entry = intrinsicPlacements(page, 1346, undefined, { width: 1240, height: 574 })[1];
  const raw = await new ELK().layout(entry.graph);
  const geometry = unpackGeometry(raw, entry.containers, true);
  const byId = new Map(geometry.children.map((node) => [node.id, node]));
  const row = (ids) => ids.map((id) => byId.get(`subject-${id}`));
  const upper = row([0, 1, 2, 3]),
    lower = row([4, 5, 6, 7]);
  for (const peers of [upper, lower]) assert(peers.every(({ y }) => y === peers[0].y));
  assert(upper.every(({ x }, index) => !index || x > upper[index - 1].x));
  assert(lower.every(({ x }, index) => !index || x < lower[index - 1].x));
  assert.equal(upper.at(-1).x, lower[0].x, "The continuation turns into the adjacent row");
  assert(lower[0].y > upper[0].y);
  assert.deepEqual(page, before, "Physical folding does not mutate source identities or relations");
});
