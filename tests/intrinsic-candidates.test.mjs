import assert from "node:assert/strict";

import test from "node:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";

import { selected } from "./fixtures/elk-layout.mjs";

test("equivalent measured typography does not repeat the native layout workload", async (t) => {
  const coverage = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-layout-observation-"));
  t.after(async () => {
    await fs.rm(coverage, { recursive: true, force: true });
    await assert.rejects(fs.access(coverage), { code: "ENOENT" });
  });
  const script = String.raw`
    // Loader-rewritten bytes are a workload observer, not original-source coverage.
    // Native worker children still contribute their unchanged code independently.
    process.env.NODE_V8_COVERAGE = ${JSON.stringify(coverage)};
    import { registerHooks } from "node:module";
    registerHooks({ load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      if (!url.endsWith("/renderers/elk/layout.mjs")) return result;
      const source = String(result.source);
      const marker = "export async function layoutInteractivePages(";
      if (!source.includes(marker)) throw new Error("layout_observation_missing");
      return { ...result, source: source.replace(marker, "async function observedLayout(") +
        '\nexport async function layoutInteractivePages(pages, measure, options) {\n' +
        'process.stderr.write(JSON.stringify({event:"layout-request",pages,options}) + "\\n");\n' +
        'return observedLayout(pages, measure, options);\n}\n' };
    }});
    const { composeIntrinsicArchitecture } = await import(${JSON.stringify(
      new URL("../packages/publisher/renderers/archify/layout.mjs", import.meta.url).href,
    )});
    const scene = {
      schema: "architecture.interactive-scene/v1", id: "measured-reuse",
      title: "Selected source", subtitle: "Complete directed relationship",
      nodes: ["source", "target"].map(id => ({id,label:id,visualRole:"backend"})),
      groups: [], edges: [{id:"feeds",from:"source",to:"target",label:"feeds",visualRole:"default"}]
    };
    const before = structuredClone(scene);
    const result = await composeIntrinsicArchitecture(scene);
    process.stdout.write(JSON.stringify({scene:result.scene,unchanged:JSON.stringify(scene)===JSON.stringify(before)}));
  `;
  const environment = { ...process.env };
  delete environment.NODE_V8_COVERAGE;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    env: environment,
    encoding: "utf8",
    timeout: 60_000,
  });
  assert.equal(run.status, 0, run.stderr);
  const requests = run.stderr
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  assert.equal(requests.length, 1, "Identical measured input must be solved only once");
  const result = JSON.parse(run.stdout);
  assert(result.unchanged);
  assert.deepEqual(
    result.scene.nodes.map(({ id, label }) => ({ id, label })),
    [
      { id: "source", label: "source" },
      { id: "target", label: "target" },
    ],
  );
  assert.deepEqual(
    result.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    [{ id: "feeds", from: "source", to: "target", label: "feeds" }],
  );
  const records = await Promise.all(
    (await fs.readdir(coverage))
      .filter((name) => name.endsWith(".json"))
      .map(async (name) => JSON.parse(await fs.readFile(path.join(coverage, name), "utf8"))),
  );
  assert(records.length > 0, "the native coverage consumer must actually execute");
  const sourceUrl = new URL("../packages/publisher/renderers/elk/layout.mjs", import.meta.url).href;
  assert(
    !records.some(({ result }) => result.some(({ url }) => url === sourceUrl)),
    "The rewritten workload observer cannot claim coverage of unchanged production bytes",
  );
});

test("compact composition uses its measured width limit rather than repeating the wide candidate", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const input = {
    schema: "architecture.interactive-scene/v1",
    id: "compact-components",
    title: "Selected components",
    subtitle: "Independent subjects",
    nodes: Array.from({ length: 12 }, (_, index) => ({
      id: `component-${index}`,
      label: `Complete selected architecture component ${index}`,
      visualRole: "backend",
    })),
    groups: [],
    edges: [],
  };
  const before = structuredClone(input);
  const result = await composeIntrinsicArchitecture(input);
  assert.deepEqual(input, before);
  assert(result.scene.viewport.height <= marks.desktopReadingHeight);
  assert(result.scene.nodes.every(({ size }) => size.width < 280));
  for (const node of input.nodes) {
    const rows = result.nodeText.layouts[node.id].rows;
    assert.equal(
      rows
        .filter(({ field }) => field === "label")
        .map(({ text }) => text)
        .join(""),
      node.label,
    );
    assert(rows.every(({ fontSize }) => fontSize >= 12));
  }
});

test("a pure fork and join retain corresponding branches without a context-node prerequisite", async () => {
  const { repeatedBranches } = await import("../packages/publisher/renderers/elk/topology.mjs");
  const nodes = ["entry", "a-1", "a-2", "a-3", "b-1", "b-2", "b-3", "exit"].map((id) => ({
    id,
    label: id,
  }));
  const pairs = [
    ["entry", "a-1"],
    ["a-1", "a-2"],
    ["a-2", "a-3"],
    ["a-3", "exit"],
    ["entry", "b-1"],
    ["b-1", "b-2"],
    ["b-2", "b-3"],
    ["b-3", "exit"],
  ];
  const page = {
    nodes,
    relations: pairs.map(([source, target], index) => ({ id: `r-${index}`, source, target })),
  };
  const before = structuredClone(page);
  const branches = repeatedBranches(page);
  assert.deepEqual(
    branches.map(({ order }) => order),
    [
      ["a-1", "a-2", "a-3"],
      ["b-1", "b-2", "b-3"],
    ],
  );
  assert(branches.every(({ entry, exit }) => entry === "entry" && exit === "exit"));
  const { compositionDisruption } =
    await import("../packages/publisher/renderers/elk/placement.mjs");
  const positions = [
    [56, 192],
    [384, 64],
    [384, 192],
    [384, 320],
    [632, 64],
    [632, 192],
    [632, 320],
    [960, 192],
  ];
  assert.equal(
    compositionDisruption(page, {
      nodes: nodes.map((node, index) => ({
        ...node,
        x: positions[index][0],
        y: positions[index][1],
        width: 224,
        height: 96,
      })),
    }),
    0,
    "Branch introduction and join can use the available horizontal reading axis",
  );
  assert.deepEqual(page, before);
});

test("complete-frame selection retains feasible short titles in a directed source model", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "complete-source-model",
    title: "A source-bound model",
    subtitle: "Exact evidence and reading questions",
    typography: { minimumTextPx: 12 },
    groups: [],
    nodes: [
      ["source", "Source evidence", "intent · code · runtime · evidence"],
      ["adapter", "Loss-aware adapter", "loss-aware map · no authority"],
      ["bundle", "Source Bundle", "selected bytes · revision · provenance"],
      ["model", "Claim Model", "typed meaning · planes · conditions"],
      ["unknown", "Explicit uncertainty", "unknowns broaden obligations"],
      ["reader", "Reader contract", "audience · questions · in/out scope"],
    ].map(([id, label, detail]) => ({
      id,
      label,
      detail,
      figureKind: "operation",
      visualRole: "external",
    })),
    edges: [
      ["select", "source", "adapter", "selects"],
      ["map", "adapter", "bundle", "maps"],
      ["bind-source", "source", "bundle", "binds"],
      ["bind-model", "bundle", "model", "binds"],
      ["inform", "model", "reader", "informs"],
      ["broaden", "unknown", "reader", "broadens"],
    ].map(([id, from, to, label]) => ({ id, from, to, label, visualRole: "default" })),
  };
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  for (const { id, label } of scene.nodes) {
    const rows = result.nodeText.layouts[id].rows.filter((row) => row.field === "label");
    assert.deepEqual(
      rows.map(({ text }) => text),
      [label],
      `${id}: feasible complete title`,
    );
    assert(rows.every(({ fontSize }) => fontSize >= 12));
  }
  assert.deepEqual(scene, before);
  assert.deepEqual(
    result.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
});

test("intrinsic selection preserves complete short fields before saving canvas area", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const input = {
    schema: "architecture.interactive-scene/v1",
    id: "complete-reading",
    title: "A complete reading",
    subtitle: "Measured fields in a feedback system",
    typography: { minimumTextPx: 12 },
    groups: [],
    nodes: Array.from({ length: 6 }, (_, index) => ({
      id: `member-${index}`,
      label: "Exact source reference",
      detail: "Complete source-bound meaning",
      note: "Independent reader question",
      figureKind: "operation",
      visualRole: "external",
      semanticIds: [`model:entity:member-${index}`],
    })),
    edges: Array.from({ length: 6 }, (_, index) => ({
      id: `feedback-${index}`,
      from: `member-${index}`,
      to: `member-${(index + 1) % 6}`,
      label: "updates selected evidence",
      visualRole: "default",
    })),
    texts: [
      {
        id: "exact-occurrence",
        owner: "member-0",
        text: "Additional source occurrence",
        weight: "400",
        tone: "muted",
        anchor: "middle",
        visible: true,
        semanticIds: [],
      },
    ],
  };
  const before = structuredClone(input);
  const result = await composeIntrinsicArchitecture(input);
  for (const { id } of input.nodes) {
    const rows = result.nodeText.layouts[id].rows;
    for (const field of ["label", "detail", "note"]) {
      const lines = rows.filter((row) => row.field === field);
      assert.equal(lines.length, 1, `${id} ${field} should retain its feasible complete phrase`);
      assert.equal(lines[0].text, input.nodes.find((node) => node.id === id)[field]);
      assert(lines[0].fontSize >= 12);
    }
  }
  assert.equal(result.physical.texts["exact-occurrence"].lines.length, 1);
  for (const { id, label } of input.edges)
    assert.deepEqual(result.physical.edges[id].label.lines, [label]);
  assert.deepEqual(input, before);
});

test("intrinsic search qualifies each distinct native candidate once without losing alternatives", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: ["source", "target"].map((id) => ({ id, label: id })),
    relations: [{ id: "route", source: "source", target: "target" }],
  };
  const footprint = {
    width: 176,
    height: 64,
    label: { lines: [""], width: 0, height: 0, fontSize: 12, weight: "400", baselines: [] },
  };
  const before = structuredClone(input);
  const candidates = [];
  const result = await layoutInteractivePages([input], null, {
    nodeFootprints: [{ source: footprint, target: footprint }],
    relationFootprints: [{}],
    composeCandidate: (layout) => candidates.push(structuredClone(layout)),
  });
  const unique = new Set(candidates.map((layout) => JSON.stringify(layout)));
  assert.equal(
    candidates.length,
    unique.size,
    "Identical native input cannot add a search alternative",
  );
  assert(candidates.some(({ nodes }) => nodes[1].x > nodes[0].x));
  assert(candidates.some(({ nodes }) => nodes[1].y > nodes[0].y));
  assert(
    candidates.some(
      ({ bounds, nodes, groups, relations }) =>
        JSON.stringify({ bounds, nodes, groups, relations }) ===
        JSON.stringify({
          bounds: result.layouts[0].bounds,
          nodes: result.layouts[0].nodes,
          groups: result.layouts[0].groups,
          relations: result.layouts[0].relations,
        }),
    ),
  );
  assert.deepEqual(input, before);
});

test("intrinsic candidate selection applies the native renderer admission before choosing geometry", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: ["source", "target"].map((id) => ({ id, label: id })),
    relations: [{ id: "route", source: "source", target: "target" }],
  };
  const footprint = {
    width: 176,
    height: 64,
    label: { lines: [""], width: 0, height: 0, fontSize: 12, weight: "400", baselines: [] },
  };
  let checked = 0;
  const result = await layoutInteractivePages([input], null, {
    nodeFootprints: [{ source: footprint, target: footprint }],
    relationFootprints: [{}],
    readingWidth: 930,
    validateCandidate: (layout) => {
      checked++;
      const [source, target] = layout.nodes;
      if (target.y <= source.y || Math.abs(target.x - source.x) > 1)
        throw Object.assign(new Error("render_interactive_layout_infeasible"), {
          code: "render_interactive_layout_infeasible",
        });
    },
  });
  assert(checked > 0);
  assert(result.layouts[0].nodes[1].y > result.layouts[0].nodes[0].y);
});

test("bounded native layering preserves complete peer footprints at the desktop reading floor", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: Array.from({ length: 7 }, (_, index) => ({ id: `peer-${index}`, label: "Exact peer" })),
    relations: [
      [2, 1],
      [2, 5],
      [4, 5],
      [1, 3],
      [5, 3],
    ].map(([source, target], index) => ({
      id: `link-${index}`,
      source: `peer-${source}`,
      target: `peer-${target}`,
    })),
  };
  const label = {
    lines: ["Exact peer"],
    width: 280,
    height: 112,
    fontSize: 12,
    weight: "400",
    baselines: [
      { text: "Exact peer", x: 100, baseline: 60, box: { x: 100, y: 48, width: 70, height: 12 } },
    ],
  };
  const footprints = Object.fromEntries(
    input.nodes.map(({ id }) => [id, { width: 280, height: 112, label }]),
  );
  const before = structuredClone(input);
  const { layouts } = await layoutInteractivePages([input], null, {
    nodeFootprints: [footprints],
    relationFootprints: [{}],
    readingWidth: 930,
    minimumLabelSize: 12,
  });
  const graph = layouts[0];
  assert.deepEqual(input, before);
  assert(graph.bounds.width + marks.graphInset * 2 <= 930);
  assert.equal(graph.nodes.length, input.nodes.length);
  assert(graph.nodes.every(({ width, height }) => width === 280 && height === 112));
  assert(graph.nodes.every(({ label: plan }) => plan.fontSize === 12));
  assert.deepEqual(
    graph.relations.map(({ id, source, target }) => ({ id, source, target })),
    input.relations,
  );
});

test("fixed node ink must fit the reading aperture before route composition", async () => {
  const { layoutInteractivePages } = await selected();
  const input = {
    nodes: ["source", "target"].map((id) => ({ id, label: id })),
    relations: [{ id: "route", source: "source", target: "target" }],
  };
  const before = structuredClone(input);
  for (const [fontSize, readingContext] of [
    [12, "overview"],
    [24, "overview"],
    [12, "source"],
  ]) {
    const footprint = {
      width: 176,
      height: 64,
      label: { lines: [""], width: 0, height: 0, fontSize, weight: "400", baselines: [] },
    };
    const composedHeights = [];
    const result = await layoutInteractivePages([input], null, {
      nodeFootprints: [{ source: footprint, target: footprint }],
      relationFootprints: [{}],
      readingWidth: 900,
      readingViewport: { width: 900, height: 120 },
      minimumLabelSize: 12,
      readingContext,
      composeCandidate: ({ nodes }) => {
        const height =
          Math.max(...nodes.map(({ y, height }) => y + height)) -
          Math.min(...nodes.map(({ y }) => y));
        composedHeights.push(height);
        if (readingContext === "overview")
          assert(
            fontSize * Math.min(1, 120 / height) >= 12,
            "Routing cannot rescue a fixed node envelope below its text floor",
          );
      },
    });
    assert(result.layouts.length === 1);
    assert(composedHeights.length > 0);
    if (fontSize === 24 || readingContext === "source")
      assert(
        composedHeights.some((height) => height > 120),
        "Larger text and source-focused reading retain their legal layouts",
      );
  }
  assert.deepEqual(input, before);
});
