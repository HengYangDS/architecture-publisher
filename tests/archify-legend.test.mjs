import assert from "node:assert/strict";
import test from "node:test";
import {
  alignedLegendFootprint,
  applyArchitectureTypeLabels,
  intrinsicArchitectureFrame,
  measureArchitectureLegend,
} from "../packages/publisher/renderers/archify/legend.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { architectureTextBudget } from "../packages/publisher/renderers/archify/node-text.mjs";
import { composeIntrinsicArchitecture } from "../packages/publisher/renderers/archify/layout.mjs";
import { renderArchitectureSvg } from "../packages/publisher/renderers/archify/assembly-svg.mjs";
import { loadFigureIconSupply } from "../packages/publisher/renderers/icons/index.mjs";
import {
  deriveFigureTypeCatalog,
  resolveFigureTypes,
} from "../packages/publisher/src/scene/figure-types.mjs";
import { assembleArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { parallelWorkScene, joinedWorkScene } from "./fixtures/intrinsic-composition.mjs";

test("parallel work retains meaningful roles and one shared icon per Legend type", async () => {
  const { scene, branches } = parallelWorkScene();
  const pages = [scene, joinedWorkScene().scene];
  const before = structuredClone(pages);
  const roles = {
    actor: ["coordinator", ...branches.map((branch) => branch[1])],
    authority: branches.flatMap((branch) => [branch[0], branch[3]]),
    decision: ["mode", "selection", ...branches.map((branch) => branch[7])],
    evidence: ["retained", ...branches.map((branch) => branch[6])],
    input: ["inputs", ...branches.map((branch) => branch[2])],
    operation: ["candidate", "exit", "learning", "entry"],
    result: ["object", "accepted", "claim"],
    workspace: branches.flatMap((branch) => [branch[4], branch[5]]),
  };
  const expected = new Map(
    Object.entries(roles).flatMap(([kind, ids]) => ids.map((id) => [id, kind])),
  );
  const icons = await loadFigureIconSupply();
  const catalog = deriveFigureTypeCatalog(pages, undefined, icons);
  assert.deepEqual(Object.keys(catalog), Object.keys(roles));
  const resolved = resolveFigureTypes(pages, catalog);
  for (const page of resolved)
    for (const node of page.nodes) {
      assert.equal(node.figureKind, expected.get(node.id), node.id);
      assert.equal(node.icon, catalog[node.figureKind]);
    }
  assert.equal(
    new Set(Object.values(catalog).map((icon) => icons.icons[icon].sha256)).size,
    Object.keys(roles).length,
  );
  const fonts = await loadBundledFonts();
  const measured = await measureArchitectureLegend(resolved[0], architectureTextBudget(12), fonts);
  const assembled = await assembleArchitectureScene(resolved[0], {
    fontSupply: fonts,
    readingContext: "source",
  });
  const html = assembled.bytes.toString("utf8");
  const legend = [...html.matchAll(/<g\b[^>]*data-legend-kind="([^"]+)"[^>]*>(.*?)<\/g>/gsu)];
  assert.deepEqual(
    legend.map(([, kind]) => kind),
    measured.entries.map(({ kind }) => kind),
  );
  for (const [, kind, body] of legend) {
    assert(body.includes(`data-semantic-sigil="${catalog[kind]}"`));
    assert.equal(
      html.split(`data-semantic-sigil="${catalog[kind]}"`).length - 1,
      resolved[0].nodes.filter((node) => node.figureKind === kind).length + 1,
    );
  }
  assert.deepEqual(pages, before);
});

test("an absent Legend consumes no title font or phantom type", async () => {
  const fonts = await loadBundledFonts();
  fonts.fonts = fonts.fonts.filter(({ weight }) => Number(weight) === 400);
  const result = await measureArchitectureLegend(
    { nodes: [{ id: "mark", primitives: [] }] },
    architectureTextBudget(12),
    fonts,
    { nodes: [{ id: "mark", kind: "paint" }] },
  );
  assert.deepEqual(result.entries, []);
  assert.equal(result.title, null);
});

test("ordinary composition measures the same fallback type Legend that the painter uses", async () => {
  const fonts = await loadBundledFonts();
  const scene = {
    nodes: [
      { id: "actor", label: "Runtime owner", figureKind: "actor", figureLabel: "Runtime owner" },
      { id: "source", label: "Selected source", visualRole: "external" },
      { id: "decoration", adornment: true, figureKind: "decoration" },
      { id: "paint", primitives: [], figureKind: "paint" },
    ],
  };
  const measured = await measureArchitectureLegend(scene, architectureTextBudget(12), fonts);
  assert.deepEqual(
    measured.entries.map(({ kind, label }) => ({ kind, label })),
    [
      { kind: "actor", label: "Runtime owner" },
      { kind: "external", label: "external" },
    ],
  );
  assert(measured.spacing.height > 0);
});

test("complete frames include exact type width and candidate-dependent Legend rows", async () => {
  const fonts = await loadBundledFonts();
  const labels = ["Source material", "Claim meaning", "Editorial project", "Publication effect"];
  const scene = {
    nodes: labels.map((figureLabel, index) => ({
      id: `role-${index}`,
      figureKind: `role-${index}`,
      figureLabel,
    })),
  };
  const measured = await measureArchitectureLegend(scene, architectureTextBudget(12), fonts);
  const narrow = intrinsicArchitectureFrame({ width: 280, height: 240 }, 8, measured);
  const wide = intrinsicArchitectureFrame({ width: 900, height: 240 }, 8, measured);
  assert(narrow.legend.footprint.rowCount > wide.legend.footprint.rowCount);
  for (const frame of [narrow, wide]) {
    assert.deepEqual(
      frame.legend.footprint.rows.flat().map(({ kind }) => kind),
      measured.entries.map(({ kind }) => kind),
    );
    assert(frame.legend.top >= 248 + measured.spacing.contentGap);
    assert(
      frame.legend.footprint.rows.every(
        (row) =>
          row.reduce((sum, { columnWidth }) => sum + columnWidth, 0) +
            (row.length - 1) * measured.spacing.columnGap <=
          frame.viewport.width - 80,
      ),
    );
  }
  const exact = {
    nodes: [{ id: "source", figureKind: "source", figureLabel: labels.join(" / ") }],
  };
  const long = await measureArchitectureLegend(exact, architectureTextBudget(12), fonts);
  const frame = intrinsicArchitectureFrame({ width: 280, height: 240 }, 8, long);
  assert(frame.viewport.width >= Math.ceil(long.entries[0].width + 80));
});

test("intrinsic Legend reservation and painter use the same complete measured bands", async () => {
  const fonts = await loadBundledFonts();
  const labels = ["Source", "Meaning", "Editorial project", "Publication", "Typography"];
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "legend-bands",
    title: "Publication",
    subtitle: "Shared type vocabulary",
    nodes: labels.map((label, index) => ({
      id: `type-${index}`,
      label,
      figureKind: `type-${index}`,
      figureLabel: label,
      visualRole: "external",
    })),
    edges: [],
    groups: [],
  };
  const exploration = {
    nodes: scene.nodes.map(({ id, figureKind: kind }) => ({ id, kind })),
    relations: [],
    limits: [],
  };
  const layout = await composeIntrinsicArchitecture(scene, fonts, exploration);
  const paintedScene = {
    ...layout.scene,
    nodes: layout.scene.nodes.map((node, index) => ({
      ...node,
      icon: ["lucide:files", "lucide:network", "lucide:notebook-pen", "lucide:send", "lucide:cpu"][
        index
      ],
    })),
  };
  const { svg } = await renderArchitectureSvg(paintedScene, {
    fonts,
    icons: await loadFigureIconSupply(),
    exploration,
    physical: layout.physical,
    nodeText: layout.nodeText,
    interaction: "presentation",
  });
  const measured = await measureArchitectureLegend(
    scene,
    architectureTextBudget(12),
    fonts,
    exploration,
  );
  const { spacing, title } = measured;
  const footprint = alignedLegendFootprint(measured.entries, {
    width: layout.scene.viewport.width - 80,
    itemGap: spacing.columnGap,
    lineGap: spacing.rowAdvance,
  });
  const top =
    layout.scene.viewport.height - spacing.bottomInset - spacing.height - footprint.extraHeight;
  const titleY = Number(svg.match(/<g class="legend"[^>]*><text[^>]* y="([^"]+)"/u)[1]);
  assert(Math.abs(titleY + title.box.y - top) < 0.01);
  const graphBottom = Math.max(
    ...layout.scene.nodes.map(({ position, size }) => position.y + size.height),
  );
  assert(top - graphBottom >= spacing.contentGap);
  const positions = [
    ...svg.matchAll(
      /data-legend-kind="([^"]+)"[^>]*data-legend-x="([^"]+)" data-legend-baseline="([^"]+)"/gu,
    ),
  ];
  assert.deepEqual(
    positions.map(([, kind]) => kind),
    measured.entries.map(({ kind }) => kind),
  );
  let index = 0;
  for (const [rowIndex, row] of footprint.rows.entries()) {
    let x = 40;
    for (const entry of row) {
      assert.equal(Number(positions[index][2]), x);
      assert.equal(
        Number(positions[index++][3]),
        top + spacing.firstBaseline + rowIndex * spacing.rowAdvance,
      );
      x += entry.columnWidth + spacing.columnGap;
    }
  }
});

test("Legend measures title, centred icons and shared row bands with typographic clearance", async () => {
  const fonts = await loadBundledFonts();
  for (const minimum of [12, 18]) {
    const budget = architectureTextBudget(minimum);
    const labels = ["Source", "Meaning", "Editorial project", "Publication", "Typography"];
    const scene = {
      nodes: labels.map((figureLabel, index) => ({ id: String(index), figureLabel })),
    };
    const exploration = {
      nodes: labels.map((_, index) => ({ id: String(index), kind: String(index) })),
    };
    const measured = await measureArchitectureLegend(scene, budget, fonts, exploration);
    assert(measured.entries.every(({ swatchGap }) => swatchGap >= minimum));
    const { spacing, title } = measured;
    assert.equal(spacing.titleBaseline + title.box.y, 0);
    const titleBottom = spacing.titleBaseline + title.box.y + title.box.height;
    const top = Math.min(...measured.entries.map(({ top }) => top));
    const bottom = Math.max(...measured.entries.map(({ bottom }) => bottom));
    assert(spacing.firstBaseline + top - titleBottom >= minimum);
    assert(spacing.rowAdvance + top - bottom >= minimum);
    assert.equal(spacing.height, spacing.firstBaseline + bottom);
    assert(spacing.columnGap >= minimum * 2);
    assert(spacing.contentGap >= minimum * 2);
    const inkTop = Math.min(...measured.entries.map(({ box }) => box.y));
    const inkBottom = Math.max(...measured.entries.map(({ box }) => box.y + box.height));
    for (const entry of measured.entries) {
      assert.equal(entry.family, title.family);
      assert.equal(entry.swatchY, measured.entries[0].swatchY);
      assert(Math.abs(entry.swatchY + budget.sigilSize / 2 - (inkTop + inkBottom) / 2) < 0.01);
    }
    const footprint = alignedLegendFootprint(measured.entries, {
      width: 420,
      itemGap: spacing.columnGap,
      lineGap: spacing.rowAdvance,
    });
    assert(footprint.rowCount > 1);
    assert.equal(footprint.extraHeight, (footprint.rowCount - 1) * spacing.rowAdvance);
    const lastBottom = spacing.firstBaseline + footprint.extraHeight + bottom;
    assert.equal(lastBottom, spacing.height + footprint.extraHeight);
  }
});

test("Legend reserves native interaction bounds around exact reader-facing ink", async () => {
  const fonts = await loadBundledFonts();
  const label = "Execution contract";
  const budget = { minimum: 14, sigilSize: 21, sigilInset: 7 };
  const scene = { nodes: [{ id: "combined", figureKind: "contract", figureLabel: label }] };
  const exploration = { nodes: [{ id: "combined", kind: "contract" }] };
  const result = await measureArchitectureLegend(scene, budget, fonts, exploration);
  const request = {
    text: label,
    fontSize: budget.minimum,
    weight: result.entries[0].weight,
    anchor: "start",
    x: 0,
    baseline: 0,
  };
  const measure = await createBundledTextMeasurer(fonts, [request]);
  const ink = measure.box(request);
  assert.equal(result.entries[0].kind, "contract");
  assert.equal(result.entries[0].label, label);
  assert.equal(
    result.entries[0].width,
    Math.ceil(
      budget.sigilSize +
        Math.max(budget.sigilInset, budget.minimum) +
        Math.max(0, -ink.x) +
        ink.x +
        ink.width,
    ) + 26,
  );
  assert(result.entries[0].width > 150);
});

test("measured legend rows use shared balanced columns without reordering source kinds", () => {
  const entries = [90, 76, 76, 90, 90, 142, 112, 84, 106, 100, 98, 98].map((width, index) => ({
    kind: String(index),
    label: String(index),
    width,
  }));
  const result = alignedLegendFootprint(entries, { width: 1100, itemGap: 22, lineGap: 32 });
  assert.equal(result.rowCount, 2);
  assert.deepEqual(
    result.rows.map((row) => row.map(({ kind }) => kind)),
    [
      ["0", "1", "2", "3", "4", "5"],
      ["6", "7", "8", "9", "10", "11"],
    ],
  );
  assert.deepEqual(
    result.rows[0].map(({ columnWidth }) => columnWidth),
    [142, 142, 142, 142, 142, 142],
  );
  assert.deepEqual(
    result.rows[1].map(({ columnWidth }) => columnWidth),
    [142, 142, 142, 142, 142, 142],
  );
  assert.equal(result.extraHeight, 32);
});

test("Legend wraps onto equal column rails rather than compressing individual columns", () => {
  const entries = [99, 92, 178, 156, 120, 135, 113, 120].map((width, index) => ({
    kind: String(index),
    label: String(index),
    width,
  }));
  const regular = alignedLegendFootprint(entries, { width: 929, itemGap: 24 });
  assert.equal(regular.rowCount, 2);
  for (const row of regular.rows)
    assert.deepEqual(
      row.map(({ columnWidth }) => columnWidth),
      [178, 178, 178, 178],
    );
  const constrained = alignedLegendFootprint(entries, { width: 750, itemGap: 24 });
  assert.equal(constrained.rowCount, 3);
  assert.deepEqual(
    constrained.rows.map((row) => row.map(({ columnWidth }) => columnWidth)),
    [
      [178, 178, 178],
      [178, 178, 178],
      [178, 178],
    ],
  );
  assert.deepEqual(
    constrained.rows.flat().map(({ kind }) => kind),
    entries.map(({ kind }) => kind),
  );
});

test("painted Legend icons retain equal rails when unequal label widths require wrapping", async () => {
  const fonts = await loadBundledFonts();
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "regular-legend",
    title: "Selected roles",
    subtitle: "One type key",
    viewport: { width: 620, height: 400 },
    nodes: ["Source", "Publication effect", "Meaning", "Editorial project", "Renderer"].map(
      (label, index) => ({
        id: `role-${index}`,
        label,
        figureKind: `role-${index}`,
        figureLabel: label,
        visualRole: "external",
        position: { x: 40, y: 20 + index * 24 },
        size: { width: 320, height: 20 },
        icon: [
          "lucide:files",
          "lucide:send",
          "lucide:network",
          "lucide:notebook-pen",
          "lucide:cpu",
        ][index],
      }),
    ),
    edges: [],
    groups: [],
  };
  const exploration = {
    nodes: scene.nodes.map(({ id, figureKind: kind }) => ({ id, kind })),
    relations: [],
    limits: [],
  };
  const measured = await measureArchitectureLegend(
    scene,
    architectureTextBudget(12),
    fonts,
    exploration,
  );
  const frame = intrinsicArchitectureFrame({ width: 604, height: 180 }, 8, measured);
  const footprint = frame.legend.footprint;
  const widths = new Set(footprint.rows.flat().map(({ columnWidth }) => columnWidth));
  assert.equal(widths.size, 1, "Every type key uses one measured rail width");
  assert.equal(footprint.rowCount, 3);
  const result = await renderArchitectureSvg(
    { ...scene, viewport: frame.viewport },
    {
      fonts,
      icons: await loadFigureIconSupply(),
      exploration,
      physical: { legend: frame.legend, groups: [], edges: {}, texts: {} },
      interaction: "presentation",
    },
  );
  const positions = [
    ...result.svg.matchAll(
      /data-legend-kind="([^"]+)"[^>]*data-legend-x="([^"]+)" data-legend-baseline="([^"]+)"/gu,
    ),
  ];
  assert.equal(positions.length, 5);
  assert.deepEqual(
    positions.map(([, kind]) => kind),
    ["role-0", "role-1", "role-2", "role-3", "role-4"],
  );
  assert.equal(Number(positions[0][2]), Number(positions[2][2]));
  assert.equal(Number(positions[1][2]), Number(positions[3][2]));
  assert.equal(Number(positions[4][2]), Number(positions[0][2]));
  assert.equal(Number(positions[0][3]), Number(positions[1][3]));
  assert.equal(Number(positions[2][3]), Number(positions[3][3]));
  assert.equal(
    Number(positions[2][3]) - Number(positions[0][3]),
    Number(positions[4][3]) - Number(positions[2][3]),
  );
});

test("legend footprint retains complete widths for empty, short and over-wide keys", () => {
  assert.deepEqual(alignedLegendFootprint([], { width: 100 }), {
    measured: [],
    rows: [],
    rowCount: 0,
    minWidth: 0,
    extraHeight: 0,
  });
  const one = alignedLegendFootprint([{ kind: "one", label: "one", width: 160 }], { width: 100 });
  assert.equal(one.minWidth, 160);
  assert.equal(one.rowCount, 1);
  assert.equal(one.rows[0][0].width, 160);
  const uneven = alignedLegendFootprint(
    [70, 180, 40, 90, 60].map((width, index) => ({
      kind: String(index),
      label: String(index),
      width,
    })),
    { width: 360, itemGap: 20, lineGap: 32 },
  );
  assert.deepEqual(
    uneven.rows.flat().map(({ kind }) => kind),
    ["0", "1", "2", "3", "4"],
  );
  assert(
    uneven.rows.every(
      (row) =>
        row.reduce((sum, entry) => sum + entry.columnWidth, 0) + 20 * (row.length - 1) <= 360,
    ),
  );
});

test("reader labels update native data while preserving every executable script", () => {
  const executable = '<script id="native-reader">const text = "<Grouped>";</script>';
  const original = Buffer.from(
    executable +
      '<script type="application/json" id="archify-i18n-data">' +
      JSON.stringify({ messages: { "viewer.kind.aggregate": "Aggregate", retained: "Original" } }) +
      "</script>",
  );
  const scene = {
    nodes: [{ figureKind: "aggregate", figureLabel: "Grouped <source> objects" }],
  };
  const result = applyArchitectureTypeLabels(original, scene).toString();
  assert(result.startsWith(executable));
  const data = JSON.parse(result.match(/id="archify-i18n-data">([\s\S]*?)<\/script>/u)[1]);
  assert.deepEqual(data.messages, {
    "viewer.kind.aggregate": "Grouped <source> objects",
    retained: "Original",
  });
  assert(!result.slice(executable.length).includes("<source>"));
  assert.equal(original.toString().slice(0, executable.length), executable);
});

test("absent reader labels preserve exact native bytes without inventing a data carrier", () => {
  const bytes = Buffer.from("<main>Unmodified native artifact</main>");
  assert.equal(applyArchitectureTypeLabels(bytes, { nodes: [{ figureKind: "component" }] }), bytes);
  assert.equal(
    applyArchitectureTypeLabels(bytes, {
      nodes: [{ figureKind: "aggregate", figureLabel: "Ignored decoration", adornment: true }],
    }),
    bytes,
  );
});

test("reader labels refuse missing, ambiguous and malformed native data carriers", () => {
  const scene = { nodes: [{ figureKind: "aggregate", figureLabel: "Grouped source objects" }] };
  const carrier = (text) => '<script id="archify-i18n-data">' + text + "</script>";
  for (const text of [
    "<main>No carrier</main>",
    carrier("{}") + carrier("{}"),
    carrier("{"),
    carrier("null"),
    carrier('{"messages":[]}'),
    carrier('{"messages":null}'),
    carrier("{}"),
  ])
    assert.throws(() => applyArchitectureTypeLabels(Buffer.from(text), scene), {
      code: "render_type_label_carrier_invalid",
    });
});
