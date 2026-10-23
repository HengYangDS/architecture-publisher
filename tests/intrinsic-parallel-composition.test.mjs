import assert from "node:assert/strict";
import test from "node:test";
import { composeIntrinsicArchitecture } from "../packages/publisher/renderers/archify/layout.mjs";
import { compositionDisruption } from "../packages/publisher/renderers/elk/placement.mjs";
import {
  parallelWorkScene,
  assertParallelSourceComposition,
  joinedWorkScene,
} from "./fixtures/intrinsic-composition.mjs";

test("corresponding independent inputs prefer a shared top or left over a staggered stack", () => {
  const { scene, branches } = parallelWorkScene();
  const page = {
    nodes: scene.nodes,
    relations: scene.edges.map(({ from, to, ...edge }) => ({
      ...edge,
      source: from,
      target: to,
    })),
    groups: [],
  };
  const offsets = [
    [0, 200],
    [0, 300],
    [0, 420],
    [224, 420],
    [112, 520],
    [0, 620],
    [224, 620],
    [0, 720],
  ];
  const layout = {
    nodes: scene.nodes.map(({ id }, index) => {
      const branch = branches.findIndex((members) => members.includes(id));
      const role = branch < 0 ? -1 : branches[branch].indexOf(id);
      return {
        id,
        x: branch < 0 ? (index % 3) * 240 : branch * 600 + offsets[role][0],
        y: branch < 0 ? (index < 3 ? 0 : 900) : offsets[role][1],
        width: 176,
        height: 64,
      };
    }),
  };
  const before = structuredClone(page);
  assert.equal(compositionDisruption(page, layout), 0);
  const staggered = structuredClone(layout);
  for (const branch of branches) staggered.nodes.find(({ id }) => id === branch[3]).y += 100;
  assert(
    compositionDisruption(page, staggered) > compositionDisruption(page, layout),
    "Matching input subtrees cannot appear misaligned merely because a serial envelope is smaller",
  );
  assert.deepEqual(page, before);
});

test("source composition keeps exact parallel branches together on corresponding rows", async () => {
  const { scene, branches } = parallelWorkScene();
  const result = await assertParallelSourceComposition(scene, branches);
  assert(result.scene.viewport.height > 574);
});

test("parallel tree inputs use a shared native layer when their measured footprints fit", async () => {
  const { scene, branches } = parallelWorkScene();
  const result = await assertParallelSourceComposition(scene, branches);
  const nodes = new Map(result.scene.nodes.map((node) => [node.id, node]));
  for (const branch of branches) {
    const base = nodes.get(branch[2]);
    const lease = nodes.get(branch[3]);
    const work = nodes.get(branch[4]);
    const down =
      Math.max(base.position.y + base.size.height, lease.position.y + lease.size.height) <=
      work.position.y;
    const right =
      Math.max(base.position.x + base.size.width, lease.position.x + lease.size.width) <=
      work.position.x;
    assert(
      (down && base.position.y === lease.position.y) ||
        (right && base.position.x === lease.position.x),
      "Independent inputs share a layer before their work node, not a serial column along its flow",
    );
    assert(
      base.position.x + base.size.width + 24 <= lease.position.x ||
        lease.position.x + lease.size.width + 24 <= base.position.x ||
        base.position.y + base.size.height + 24 <= lease.position.y ||
        lease.position.y + lease.size.height + 24 <= base.position.y,
      "Native layer peers retain the declared visual separation",
    );
  }
  assert(result.scene.viewport.height <= 1800);
});

test("source branch composition avoids an unbounded serial stack in the complete routed diagram", async () => {
  const { scene } = parallelWorkScene();
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene, null, undefined, "source");
  assert.deepEqual(scene, before);
  assert(result.scene.viewport.width <= 1346);
  assert(
    result.scene.viewport.height <= 1800,
    `The complete representative diagram must fit its 1800px reading envelope, not ${result.scene.viewport.height}px`,
  );
  assert.deepEqual(
    result.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
  assert(Object.values(result.nodeText.layouts).every(({ valid }) => valid));
});

test("complete stage assessment rejects a reversed introduction despite aligned parallel roles", () => {
  const { scene, paths } = joinedWorkScene();
  const page = {
    nodes: scene.nodes,
    relations: scene.edges.map(({ from, to, ...edge }) => ({
      ...edge,
      source: from,
      target: to,
    })),
    groups: [],
  };
  const parallel = new Set(paths.flat());
  const context = new Set(["coordinator", "inputs", "mode"]);
  const layout = {
    nodes: scene.nodes.map(({ id }, index) => {
      const branch = paths.findIndex((ids) => ids.includes(id));
      const role = branch < 0 ? -1 : paths[branch].indexOf(id);
      return {
        id,
        x: parallel.has(id) ? branch * 240 : (index % 3) * 240,
        y: context.has(id) ? 0 : id === "entry" ? 100 : role >= 0 ? 200 + role * 100 : 600,
        width: 176,
        height: 64,
      };
    }),
  };
  const before = structuredClone(page);
  assert.equal(compositionDisruption(page, layout), 0);
  const reversed = structuredClone(layout);
  for (const node of reversed.nodes) if (context.has(node.id) || node.id === "entry") node.y = 800;
  assert(
    compositionDisruption(page, reversed) > 0,
    "Aligned parallel roles cannot conceal an introduction placed after execution and results",
  );
  const prematureResult = structuredClone(layout);
  prematureResult.nodes.find(({ id }) => id === "selection").y = 100;
  assert(
    compositionDisruption(page, prematureResult) > 0,
    "The shared result must follow every corresponding contribution",
  );
  const besideContributions = structuredClone(prematureResult);
  besideContributions.nodes.find(({ id }) => id === "selection").x = 1_000;
  assert(
    compositionDisruption(page, besideContributions) > 0,
    "Moving the shared result beside the branches cannot conceal premature result reading",
  );
  assert.deepEqual(page, before);
});

test("parallel paths between common entry and result keep corresponding roles together", async () => {
  const { scene, paths } = joinedWorkScene();
  const result = await assertParallelSourceComposition(scene, paths);
  const byId = new Map(result.scene.nodes.map((node) => [node.id, node]));
  const entry = byId.get("entry");
  const exit = byId.get("selection");
  const pathNodes = paths.flatMap((members) => members.map((id) => byId.get(id)));
  assert(
    entry.position.y + entry.size.height <= Math.min(...pathNodes.map((node) => node.position.y)),
    "A common entry must precede the complete parallel region",
  );
  assert(
    exit.position.y >= Math.max(...pathNodes.map((node) => node.position.y + node.size.height)),
    "A common result must follow the complete parallel region",
  );
});

test("shared fork and join placement is assessed against the complete parallel envelope", () => {
  const paths = [
    ["a-start", "a-middle", "a-end"],
    ["b-start", "b-middle", "b-end"],
  ];
  const page = {
    nodes: ["entry", ...paths.flat(), "exit"].map((id) => ({ id })),
    groups: [],
    relations: paths.flatMap((ids) =>
      ["entry", ...ids, "exit"].slice(1).map((target, index) => ({
        id: `${ids[0]}-${index}`,
        source: ["entry", ...ids][index],
        target,
      })),
    ),
  };
  const layout = {
    nodes: page.nodes.map(({ id }) => {
      const branch = paths.findIndex((ids) => ids.includes(id));
      const role = branch < 0 ? -1 : paths[branch].indexOf(id);
      return {
        id,
        x: branch < 0 ? (id === "entry" ? 0 : 800) : 200 + role * 200,
        y: branch < 0 ? 72 : branch * 144,
        width: 120,
        height: 80,
      };
    }),
  };
  const staggered = structuredClone(layout);
  staggered.nodes.find(({ id }) => id === "entry").y = 0;
  staggered.nodes.find(({ id }) => id === "exit").y = 144;
  assert.equal(compositionDisruption(page, layout), 0);
  assert(
    compositionDisruption(page, staggered) > compositionDisruption(page, layout),
    "Aligned branch rows cannot conceal staggered shared endpoints",
  );
});

test("a complete fork and join centers its shared endpoints beside the parallel region", async () => {
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "parallel-delivery",
    title: "Independent delivery paths",
    subtitle: "One selection, two complete paths, one result",
    typography: { minimumTextPx: 12 },
    groups: [],
    nodes: [
      ["selection", "Selected input", "Exact facts and reading choices"],
      ["a-plan", "First composition", "Independent scene"],
      ["a-engine", "First renderer", "Selected native engine"],
      ["a-output", "First artifact", "Independent output bytes"],
      ["b-plan", "Second composition", "Independent scene"],
      ["b-engine", "Second renderer", "Selected native engine"],
      ["b-output", "Second artifact", "Independent output bytes"],
      ["result", "Combined result", "Exact inputs and sibling bytes"],
    ].map(([id, label, detail]) => ({ id, label, detail, visualRole: "external" })),
    edges: [
      ["selection", "a-plan", "authors"],
      ["selection", "b-plan", "authors"],
      ["a-plan", "a-engine", "feeds"],
      ["b-plan", "b-engine", "feeds"],
      ["a-engine", "a-output", "renders"],
      ["b-engine", "b-output", "renders"],
      ["a-output", "result", "bundles"],
      ["b-output", "result", "bundles"],
    ].map(([from, to, label], index) => ({
      id: `relationship-${index}`,
      from,
      to,
      label,
      visualRole: "default",
    })),
  };
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  const nodes = new Map(result.scene.nodes.map((node) => [node.id, node]));
  const entry = nodes.get("selection");
  const exit = nodes.get("result");
  const branches = ["a-plan", "a-engine", "a-output", "b-plan", "b-engine", "b-output"].map((id) =>
    nodes.get(id),
  );
  const left = Math.min(...branches.map(({ position }) => position.x));
  const right = Math.max(...branches.map(({ position, size }) => position.x + size.width));
  const top = Math.min(...branches.map(({ position }) => position.y));
  const bottom = Math.max(...branches.map(({ position, size }) => position.y + size.height));
  const center = (node, axis, extent) => node.position[axis] + node.size[extent] / 2;
  const horizontal =
    entry.position.x + entry.size.width < left &&
    exit.position.x > right &&
    Math.abs(center(entry, "y", "height") - (top + bottom) / 2) <= 24 &&
    Math.abs(center(exit, "y", "height") - (top + bottom) / 2) <= 24;
  const vertical =
    entry.position.y + entry.size.height < top &&
    exit.position.y > bottom &&
    Math.abs(center(entry, "x", "width") - (left + right) / 2) <= 24 &&
    Math.abs(center(exit, "x", "width") - (left + right) / 2) <= 24;
  assert(
    horizontal || vertical,
    "A fork and join must center the shared endpoints around its complete parallel region, not stack both against one edge",
  );
  assert.deepEqual(scene, before);
  assert.deepEqual(
    result.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
  assert.deepEqual(result.scene.groups, []);
});

test("measured context and entry flow share an orderly introduction before parallel work", async () => {
  const { scene, paths } = joinedWorkScene();
  const figure = (id, label, detail = "") => ({
    id,
    label,
    ...(detail ? { detail } : {}),
    figureKind: "carrier",
    visualRole: "external",
  });
  const contextIds = ["coordinator", "inputs", "mode", "source", "local", "tools", "subject"];
  const entryIds = ["entry", "inquiry", "meaning", "recheck", "model"];
  scene.nodes.push(
    figure("source", "Source ownership", "Exact selected meaning and evidence"),
    figure("local", "Independent local effects", "Each resource admits its own action"),
    figure("tools", "Native skills and tools", "Selected by a bounded plan"),
    figure("subject", "One shared runtime", "Every worktree retains the same rules"),
    figure("inquiry", "Investigate current scope"),
    figure("meaning", "Accept meaning", "Scope / exceptions / guarantees"),
    figure("recheck", "Re-observe current state"),
    figure("model", "Resolve model gaps", "Block / counterexample / recompile"),
  );
  for (const [from, to, label] of [
    ["inquiry", "meaning", "align"],
    ["meaning", "entry", "accepted intent"],
    ["model", "entry", "repair"],
    ["candidate", "recheck", "uncertain outcome"],
    ["recheck", "entry", "fresh facts"],
  ])
    scene.edges.push({ id: `introduction-${from}-${to}`, from, to, label, visualRole: "default" });
  const result = await assertParallelSourceComposition(scene, paths);
  const nodes = new Map(result.scene.nodes.map((node) => [node.id, node]));
  const envelope = (ids) => {
    const members = ids.map((id) => nodes.get(id));
    return {
      left: Math.min(...members.map(({ position }) => position.x)),
      right: Math.max(...members.map(({ position, size }) => position.x + size.width)),
      top: Math.min(...members.map(({ position }) => position.y)),
      bottom: Math.max(...members.map(({ position, size }) => position.y + size.height)),
    };
  };
  const context = envelope(contextIds);
  const entry = envelope(entryIds);
  assert(
    Math.min(context.bottom, entry.bottom) > Math.max(context.top, entry.top),
    "Measured context and entry flow must share introductory height when both fit the desktop width",
  );
  assert(
    context.right + 24 <= entry.left || entry.right + 24 <= context.left,
    "The two introduction regions must remain distinct rather than interleaving their members",
  );
  assert(
    Math.max(context.bottom, entry.bottom) < envelope(paths.flat()).top,
    "The complete introduction must precede the corresponding parallel roles",
  );
});

test("parallel rows allocate unequal exact text without changing another structural role", async () => {
  const { scene, branches } = parallelWorkScene();
  scene.nodes.find(({ id }) => id === branches[1][4]).note =
    "Refresh stale selected inputs and retain exact evidence before the next owned action";
  const result = await assertParallelSourceComposition(scene, branches);
  const byId = new Map(result.scene.nodes.map((node) => [node.id, node]));
  assert(
    byId.get(branches[1][3]).size.height < byId.get(branches[1][4]).size.height,
    "An unrelated short input cannot inherit the height of a longer workspace statement",
  );
});

test("parallel composition does not depend on input IDs or declaration order", async () => {
  const { scene, branches } = parallelWorkScene();
  const reference = await assertParallelSourceComposition(scene, branches);
  const renamed = new Map(scene.nodes.map((node, index) => [node.id, `subject-${index * 17 + 3}`]));
  const renamedEdges = new Map();
  scene.nodes = scene.nodes.reverse().map((node) => ({ ...node, id: renamed.get(node.id) }));
  scene.edges = scene.edges.reverse().map((edge, index) => {
    const id = `edge-${index * 13 + 7}`;
    renamedEdges.set(edge.id, id);
    return { ...edge, id, from: renamed.get(edge.from), to: renamed.get(edge.to) };
  });
  const reordered = await assertParallelSourceComposition(
    scene,
    branches.map((branch) => branch.map((id) => renamed.get(id))),
  );
  const nodes = new Map(reordered.scene.nodes.map((node) => [node.id, node]));
  for (const node of reference.scene.nodes) {
    const twin = nodes.get(renamed.get(node.id));
    assert.deepEqual([twin.position, twin.size], [node.position, node.size]);
  }
  const edges = new Map(reordered.scene.edges.map((edge) => [edge.id, edge]));
  for (const edge of reference.scene.edges) {
    const twin = edges.get(renamedEdges.get(edge.id));
    assert.deepEqual({ ...twin, id: edge.id, from: edge.from, to: edge.to }, edge);
  }
  assert.deepEqual(reordered.scene.viewport, reference.scene.viewport);
});

test("a fork and join retain readable phrases instead of selecting the shortest fractured frame", async () => {
  const { composeIntrinsicArchitecture } =
    await import("../packages/publisher/renderers/archify/layout.mjs");
  const input = {
    schema: "architecture.interactive-scene/v1",
    id: "paired-delivery",
    title: "Independent delivery paths",
    subtitle: "Exact sources and distinct outputs",
    typography: { minimumTextPx: 12 },
    groups: [],
    nodes: [
      ["entry", "Authorship and compilation", "reader questions · Build Request"],
      ["left-plan", "Static scene", "one-frame causal composition"],
      ["left-engine", "Static renderer", "scene to SVG and PNG bytes"],
      ["left-output", "SVG and 6000px PNG", "independent static delivery"],
      ["right-plan", "Interactive scenes", "overview · mechanisms · exploration"],
      ["right-engine", "Interactive renderer", "scene to standalone HTML"],
      ["right-output", "Standalone interactive HTML", "independent interactive delivery"],
      ["result", "Edition Candidate", "source · meaning · scenes · bytes"],
    ].map(([id, label, detail]) => ({ id, label, detail, visualRole: "external" })),
    edges: [
      ["entry", "left-plan", "authors · compiles"],
      ["entry", "right-plan", "authors · compiles"],
      ["left-plan", "left-engine", "feeds"],
      ["right-plan", "right-engine", "feeds"],
      ["left-engine", "left-output", "renders"],
      ["right-engine", "right-output", "renders"],
      ["left-output", "result", "bundles"],
      ["right-output", "result", "bundles"],
    ].map(([from, to, label], index) => ({
      id: `relationship-${index}`,
      from,
      to,
      label,
      visualRole: "default",
    })),
  };
  const before = structuredClone(input);
  const result = await composeIntrinsicArchitecture(input);
  for (const id of ["left-engine", "right-engine", "result"]) {
    const rows = result.nodeText.layouts[id].rows.filter(({ field }) => field === "label");
    assert.deepEqual(
      rows.map(({ text }) => text),
      [input.nodes.find((node) => node.id === id).label],
      "A feasible complete phrase is not sacrificed solely to reduce frame height",
    );
  }
  for (const node of input.nodes)
    for (const field of ["label", "detail"]) {
      const rows = result.nodeText.layouts[node.id].rows.filter((row) => row.field === field);
      assert.equal(rows.map(({ text }) => text).join(""), node[field]);
      assert(rows.every(({ fontSize }) => fontSize >= 12));
    }
  assert.deepEqual(input, before);
});
