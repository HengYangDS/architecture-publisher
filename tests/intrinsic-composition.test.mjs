import assert from "node:assert/strict";
import test from "node:test";
import ELK from "elkjs";
import { interactiveGraphMarks as marks } from "../packages/publisher/src/scene/marks.mjs";
import { composeIntrinsicArchitecture } from "../packages/publisher/renderers/archify/layout.mjs";
import {
  allocateCorrespondingFootprints,
  intrinsicPlacements,
  unpackGeometry,
} from "../packages/publisher/renderers/elk/placement.mjs";
import { parallelWorkScene, joinedWorkScene } from "./fixtures/intrinsic-composition.mjs";

test("connected layer peers share a top and measured capacity without semantic prominence", async () => {
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "connected-peer-capacity",
    title: "Source-bound workflow",
    subtitle: "Exact facts and selected dependencies",
    typography: { minimumTextPx: 12 },
    nodes: [
      { id: "start", label: "Selected input", figureKind: "carrier", visualRole: "external" },
      { id: "left", label: "Investigate", figureKind: "aggregate", visualRole: "external" },
      {
        id: "right",
        label: "Accept meaning",
        detail: "Scope / exceptions / guarantees",
        note: "Same Change; delivery stays open",
        figureKind: "carrier",
        visualRole: "external",
      },
      { id: "end", label: "Selected result", figureKind: "carrier", visualRole: "external" },
    ],
    groups: [
      { id: "flow", label: "Selected workflow", nodeIds: ["start", "left", "right", "end"] },
    ],
    edges: [
      { id: "start-left", from: "start", to: "left", label: "inspect", visualRole: "default" },
      { id: "start-right", from: "start", to: "right", label: "review", visualRole: "default" },
      { id: "left-end", from: "left", to: "end", label: "contribute", visualRole: "default" },
      { id: "right-end", from: "right", to: "end", label: "accept", visualRole: "default" },
    ],
  };
  const entry = ["input-0", "input-1", "input-2"];
  const exit = ["result-0", "result-1", "result-2"];
  for (const [index, id] of [...entry, ...exit].entries())
    scene.nodes.push({
      id,
      label: `Selected stage ${index}`,
      figureKind: "carrier",
      visualRole: "external",
    });
  for (const chain of [
    [...entry, "start"],
    ["end", ...exit],
  ])
    for (let index = 1; index < chain.length; index++)
      scene.edges.push({
        id: `${chain[index - 1]}-${chain[index]}`,
        from: chain[index - 1],
        to: chain[index],
        label: "advance",
        visualRole: "default",
      });
  scene.groups[0].nodeIds.push(...entry, ...exit);
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  const nodes = new Map(result.scene.nodes.map((node) => [node.id, node]));
  const left = nodes.get("left");
  const right = nodes.get("right");
  assert.equal(left.position.y, right.position.y, "Native layer peers must align at their top");
  assert.equal(left.size.height, right.size.height, "The actual row owns allocated height");
  assert.deepEqual(scene, before);
  assert.deepEqual(
    result.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
  for (const node of scene.nodes) {
    const layout = result.nodeText.layouts[node.id];
    assert(layout.valid);
    for (const field of ["label", "detail", "note"])
      assert.equal(
        layout.rows
          .filter((row) => row.field === field)
          .map(({ text }) => text)
          .join(""),
        node[field] ?? "",
      );
  }
});

test("shared endpoint capacity stays within its declared row and preserves unrelated paint", () => {
  const page = {
    nodes: ["entry", "short", "full", "foreign", "exit", "isolated"].map((id) => ({ id })),
    groups: [
      { id: "work", nodeIds: ["short", "full"] },
      { id: "outside", nodeIds: ["foreign", "isolated"] },
      { id: "boundary", nodeIds: ["entry", "exit"] },
    ],
    relations: ["short", "full", "foreign"].flatMap((id) => [
      { source: "entry", target: id },
      { source: id, target: "exit" },
    ]),
  };
  const sizes = Object.fromEntries(
    [
      ["entry", 40],
      ["short", 40],
      ["full", 96],
      ["foreign", 160],
      ["exit", 56],
      ["isolated", 208],
    ].map(([id, height]) => [id, { width: 224, height }]),
  );
  const before = structuredClone(sizes);
  const allocated = allocateCorrespondingFootprints(page, sizes);
  assert.equal(allocated.short.height, 96);
  assert.equal(allocated.full.height, 96);
  for (const id of ["entry", "foreign", "exit", "isolated"])
    assert.deepEqual(allocated[id], before[id]);
  assert.deepEqual(sizes, before);
});

test("corresponding allocation leaves non-text paint under its own measured owner", () => {
  const { scene, branches } = parallelWorkScene();
  const sizes = Object.fromEntries(
    scene.nodes.map((node) => [node.id, { width: 224, height: 80 }]),
  );
  delete sizes[branches[1][0]];
  sizes[branches[1][1]].height = 120;
  const before = structuredClone(sizes);
  const allocated = allocateCorrespondingFootprints(
    {
      nodes: scene.nodes,
      relations: scene.edges.map((edge) => ({ source: edge.from, target: edge.to })),
    },
    sizes,
  );
  assert.deepEqual(sizes, before);
  assert.equal(Object.hasOwn(allocated, branches[1][0]), false);
  assert.deepEqual(
    branches.map((branch) => allocated[branch[1]].height),
    [120, 120, 120],
  );
  assert.deepEqual(allocated[branches[0][0]], before[branches[0][0]]);
});

test("intrinsic structural candidates replace a redundant packing within the native batch bound", () => {
  const { scene } = parallelWorkScene();
  const page = {
    nodes: scene.nodes.map((node) => ({
      ...node,
      width: 224,
      height: 96,
      label: { lines: [node.label], width: 180, height: 24 },
    })),
    relations: scene.edges.map((edge) => ({
      ...edge,
      source: edge.from,
      target: edge.to,
      label: edge.label ? { lines: [edge.label], width: 104, height: 24 } : null,
    })),
    groups: [],
  };
  const candidates = intrinsicPlacements(page, 1346, (remainder) => ({
    id: "root",
    children: remainder.nodes,
    edges: [],
  }));
  assert.equal(candidates.length, 2);
  assert.equal(candidates.filter(({ containers }) => containers.length > 0).length, 2);
  assert.equal(candidates.filter(({ containers }) => containers.length === 0).length, 0);
});

test("native serial branch placement aligns the complete measured column without port-driven staggering", async () => {
  const { scene } = parallelWorkScene();
  const page = {
    nodes: scene.nodes.map((node, index) => ({
      ...node,
      width: 176,
      height: 64 + (index % 3) * 16,
      label: { lines: [node.label], width: 140, height: 24 },
    })),
    relations: scene.edges.map((edge) => ({
      ...edge,
      source: edge.from,
      target: edge.to,
      label: { lines: [edge.label], width: 112, height: 20 },
    })),
    groups: [],
  };
  const placement = intrinsicPlacements(page, 1346, (remainder) => ({
    id: "root",
    children: remainder.nodes,
    edges: [],
  }))[1];
  const stack = [placement.graph];
  let branch;
  while (stack.length) {
    const node = stack.pop();
    if (node.id.startsWith("archpub:branch:")) {
      branch = node;
      break;
    }
    stack.push(...(node.children ?? []));
  }
  const before = structuredClone(branch);
  const result = await new ELK().layout(structuredClone(branch));
  assert.deepEqual(branch, before);
  assert.equal(new Set(result.children.map(({ x }) => x)).size, 1);
  const order = result.children.toSorted((left, right) => left.y - right.y);
  assert.deepEqual(
    order.map(({ id }) => id),
    branch.children.map(({ id }) => id),
  );
  assert(
    order.slice(1).every((node, index) => node.y >= order[index].y + order[index].height + 24),
  );
});

test("shared entry placement preserves its directed stages instead of packing by proximity", () => {
  const { scene } = joinedWorkScene();
  for (const id of ["inquiry", "meaning", "recheck", "repair"]) scene.nodes.push({ id, label: id });
  for (const [from, to] of [
    ["inquiry", "meaning"],
    ["meaning", "entry"],
    ["recheck", "entry"],
    ["repair", "entry"],
  ])
    scene.edges.push({ id: `prepare-${from}-${to}`, from, to, label: "prepare" });
  const page = {
    nodes: scene.nodes.map((node) => ({
      ...node,
      width: 224,
      height: 96,
      label: { lines: [node.label], width: 180, height: 24 },
    })),
    relations: scene.edges.map((edge) => ({
      ...edge,
      source: edge.from,
      target: edge.to,
      label: { lines: [edge.label], width: 140, height: 20 },
    })),
    groups: [],
  };
  const graphFor = (remainder) => ({
    id: "root",
    children: remainder.nodes,
    edges: remainder.relations.map(({ id, source, target }) => ({
      id,
      sources: [source],
      targets: [target],
    })),
    layoutOptions: { "elk.algorithm": "layered" },
  });
  const candidate = intrinsicPlacements(page, 1346, graphFor)[0];
  const stack = [candidate.graph];
  let introduction;
  while (stack.length) {
    const graph = stack.pop();
    if (graph.children?.some(({ id }) => id === "entry")) introduction = graph;
    stack.push(...(graph.children ?? []));
  }
  assert.equal(introduction.layoutOptions["elk.algorithm"], "layered");
  assert.deepEqual(introduction.edges.map(({ id }) => id).sort(), [
    "prepare-inquiry-meaning",
    "prepare-meaning-entry",
    "prepare-recheck-entry",
    "prepare-repair-entry",
  ]);
});

test("private placement flattening retains the native route and complete label allocation together", () => {
  const raw = {
    id: "root",
    width: 600,
    height: 480,
    children: [
      {
        id: "parallel",
        x: 32,
        y: 64,
        children: [
          {
            id: "branch",
            x: 24,
            y: 16,
            children: [{ id: "source", x: 20, y: 20, width: 100, height: 64 }],
            edges: [
              {
                id: "edge",
                sources: ["source"],
                targets: ["target"],
                labels: [
                  {
                    id: "edge-label",
                    text: "Exact  selected\nrelationship",
                    x: 130,
                    y: 44,
                    width: 88,
                    height: 40,
                  },
                ],
                sections: [
                  {
                    id: "section",
                    incomingShape: "source",
                    outgoingShape: "target",
                    startPoint: { x: 120, y: 52 },
                    endPoint: { x: 244, y: 112 },
                    bendPoints: [{ x: 244, y: 52 }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  raw.edges = [{ ...structuredClone(raw.children[0].children[0].edges[0]), id: "root-handoff" }];
  const before = structuredClone(raw);
  const flat = unpackGeometry(raw, ["branch"], true);
  assert.equal(flat.edges.length, 2, "Root and nested native routing must remain complete");
  assert.deepEqual(flat.edges[0], { ...raw.edges[0], container: "root" });
  const edge = flat.edges[1];
  assert.deepEqual(edge.sources, ["source"]);
  assert.deepEqual(edge.targets, ["target"]);
  assert.deepEqual(edge.labels[0], {
    ...raw.children[0].children[0].edges[0].labels[0],
    x: 186,
    y: 124,
  });
  assert.deepEqual(edge.sections[0].startPoint, { x: 176, y: 132 });
  assert.deepEqual(edge.sections[0].endPoint, { x: 300, y: 192 });
  assert.deepEqual(edge.sections[0].bendPoints, [{ x: 300, y: 132 }]);
  assert.equal(edge.container, "root");
  assert.deepEqual(raw, before);
});

test("intrinsic native branch placement reserves every complete measured edge label", () => {
  const { scene } = parallelWorkScene();
  const page = {
    nodes: scene.nodes.map((node) => ({
      ...node,
      width: 176,
      height: 96,
      label: { lines: [node.label], width: 140, height: 24 },
    })),
    relations: scene.edges.map((edge) => ({
      ...edge,
      source: edge.from,
      target: edge.to,
      label: { lines: [edge.label, "Exact  selected relationship"], width: 112, height: 40 },
    })),
    groups: [],
  };
  page.relations[0].label.height = 64;
  const before = structuredClone(page);
  const placements = intrinsicPlacements(page, 1346, (remainder) => ({
    id: "root",
    children: remainder.nodes,
    edges: [],
  }));
  assert.equal(placements.length, 2, "Measured label capacity stays within the native batch");
  const branches = [];
  const visit = (node) => {
    if (node.id.startsWith("archpub:branch:")) branches.push(node);
    for (const child of node.children ?? []) visit(child);
  };
  visit(placements[0].graph);
  assert.equal(branches.length, 3);
  for (const branch of branches)
    for (const edge of branch.edges) {
      const selected = page.relations.find(({ id }) => id === edge.id);
      assert.deepEqual(edge.sources, [selected.source]);
      assert.deepEqual(edge.targets, [selected.target]);
      assert.equal(
        edge.labels?.length,
        1,
        "Native placement must see the full edge-label capacity",
      );
      const [label] = edge.labels;
      assert.equal(label.text, selected.label.lines.join("\n"));
      assert.equal(label.width, selected.label.width);
      assert.equal(label.height, selected.label.height);
    }
  branches.length = 0;
  visit(placements[1].graph);
  const expectedGap = Math.ceil(
    Math.max(
      marks.readingGap,
      ...page.relations.map(
        ({ label }) => label.height + 2 * (marks.textClearance + marks.selectedRouteStroke / 2),
      ),
    ),
  );
  assert.equal(branches.length, 3);
  for (const branch of branches) {
    assert.equal(branch.layoutOptions["elk.algorithm"], "rectpacking");
    assert.equal(Number(branch.layoutOptions["elk.spacing.nodeNode"]), expectedGap);
    assert.equal(branch.children.length, 8);
  }
  assert.deepEqual(page, before);
});

test("compact shared result placement retains the full measured relationship capacity", () => {
  const { scene } = parallelWorkScene();
  const page = {
    nodes: scene.nodes.map((node) => ({
      ...node,
      width: 176,
      height: 96,
      label: { lines: [node.label], width: 140, height: 24 },
    })),
    relations: scene.edges.map((edge) => ({
      ...edge,
      source: edge.from,
      target: edge.to,
      label: { lines: [edge.label, "Exact  selected relationship"], width: 112, height: 40 },
    })),
    groups: [],
  };
  const before = structuredClone(page);
  const placement = intrinsicPlacements(page, 1346, (remainder) => ({
    id: "root",
    children: remainder.nodes,
    edges: remainder.relations.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
      ...(edge.label
        ? {
            labels: [
              {
                text: edge.label.lines.join("\n"),
                width: edge.label.width,
                height: edge.label.height,
              },
            ],
          }
        : {}),
    })),
  }))[0];
  const shared = placement.graph.children.find(({ id }) => id === "archpub:remainder");
  assert(shared.edges.length > 0);
  for (const edge of shared.edges) {
    const selected = page.relations.find(({ id }) => id === edge.id);
    assert.equal(
      edge.labels?.length,
      1,
      "The complete result flow needs its measured labels before placement",
    );
    assert.equal(edge.labels[0].text, selected.label.lines.join("\n"));
    assert.equal(edge.labels[0].width, selected.label.width);
    assert.equal(edge.labels[0].height, selected.label.height);
  }
  assert.deepEqual(page, before);
});

test("intrinsic branch composition separates context from the shared result flow", () => {
  const { scene } = parallelWorkScene();
  const contextIds = ["coordinator", "inputs", "mode"];
  const page = {
    nodes: scene.nodes.map((node) => ({
      ...node,
      width: 224,
      height: 96,
      label: { lines: [node.label], width: 180, height: 24 },
    })),
    relations: scene.edges.map((edge) => ({
      ...edge,
      source: edge.from,
      target: edge.to,
      label: { lines: [edge.label], width: 140, height: 20 },
    })),
    groups: [],
  };
  const before = structuredClone(page);
  const placement = intrinsicPlacements(page, 1346, (remainder) => ({
    id: "root",
    children: remainder.nodes,
    edges: remainder.relations.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
      ...(edge.label ? { labels: [edge.label] } : {}),
    })),
  }))[1];
  const context = placement.graph.children.find((unit) =>
    unit.children?.some(({ id }) => id === contextIds[0]),
  );
  assert.deepEqual(
    context.children.map(({ id }) => id).sort(),
    contextIds.toSorted(),
    "Unconnected context must not be packed into the contribution result flow",
  );
  assert.equal(placement.graph.children[0], context);
  const resultFlow = placement.graph.children.find((unit) =>
    unit.children?.some(({ id }) => id === "selection"),
  );
  assert(resultFlow.children.every(({ id }) => !contextIds.includes(id)));
  for (const edge of resultFlow.edges)
    assert.deepEqual(
      edge.labels,
      [page.relations.find(({ id }) => id === edge.id).label],
      "Native result-flow placement retains each complete caption",
    );
  assert.deepEqual(page, before);
});
