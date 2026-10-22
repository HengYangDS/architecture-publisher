import assert from "node:assert/strict";
import { composeIntrinsicArchitecture } from "../../packages/publisher/renderers/archify/layout.mjs";

export function parallelWorkScene() {
  const figure = (id, label, detail = "", note = "") => ({
    id,
    label,
    ...(detail ? { detail } : {}),
    ...(note ? { note } : {}),
    figureKind: "carrier",
    visualRole: "external",
  });
  const roles = ["permit", "actor", "base", "lease", "work", "tree", "proof", "prewrite"];
  const branches = ["a", "b", "c"].map((suffix) => roles.map((role) => `${role}-${suffix}`));
  const contexts = [
    figure("coordinator", "Shared coordinator", "Coordination grants no permission"),
    figure("inputs", "Fresh selected inputs", "Every branch admits its own scope and result"),
    figure("mode", "Choose contributions", "Compatible many; competitive zero or one"),
  ];
  const nodes = [
    ...contexts,
    ...branches.flatMap(([permit, actor, base, lease, work, tree, proof, prewrite], index) => [
      figure(permit, `Permit ${index}`, "Only its own qualified result admits execution"),
      figure(actor, `Executor ${index}`, "Scoped execution"),
      figure(base, `Revision ${index}`, "Exact candidate reference and revision"),
      figure(lease, `Lease ${index}`),
      figure(work, `Workspace ${index}`, "Own plan and current lease", "Refresh stale inputs"),
      figure(tree, `Worktree ${index}`),
      figure(proof, `Evidence ${index}`, "Executed against the exact revision"),
      figure(prewrite, `Write check ${index}`, "Own workspace and lease", "Fresh before writes"),
    ]),
    figure("selection", "Select contributions", "Prove the selected combination"),
    figure("object", "Selected object", "Exact qualified combination"),
    figure("candidate", "Serial integration", "One local compare-and-swap attempt"),
    figure("accepted", "Accepted result", "Separate local admission and integration"),
    figure("claim", "Observed result", "Observation does not grant permission"),
    figure("retained", "Retain findings", "All-drop preserves useful results"),
    figure("exit", "Owned exit", "Quiesce and preserve unique work"),
    figure("learning", "Challenge assumptions", "No silent authority change"),
  ];
  const edges = [];
  const connect = (from, to, label = "selected relationship") =>
    edges.push({ id: `relation-${edges.length}`, from, to, label, visualRole: "default" });
  for (const [permit, actor, base, lease, work, tree, proof, prewrite] of branches) {
    connect(permit, actor, "own admission");
    connect(actor, work, "execute");
    connect(base, work, "selected revision");
    connect(lease, work, "current lease");
    connect(work, tree, "coordinates");
    connect(work, proof, "prove");
    connect(tree, prewrite, "bind exact worktree");
    connect(work, "selection", "offer results");
  }
  connect("selection", "object", "prove combination");
  connect("object", "candidate", "own admission");
  connect("selection", "retained", "findings, not integration");
  connect("candidate", "accepted");
  connect("candidate", "claim", "observe and attest");
  connect("retained", "exit");
  connect("claim", "exit", "result and fresh authority");
  connect("retained", "learning", "revisit assumptions");
  return {
    branches,
    scene: {
      schema: "architecture.interactive-scene/v1",
      id: "parallel-work",
      title: "Parallel work with local integration",
      subtitle: "Exact selected roles and relationships",
      typography: { minimumTextPx: 12 },
      nodes,
      edges,
      groups: [],
    },
  };
}

export async function assertParallelComposition(scene, branches) {
  const before = structuredClone(scene);
  const result = await composeIntrinsicArchitecture(scene);
  assert.deepEqual(scene, before);
  assert.deepEqual(
    result.scene.nodes.map((node) => {
      const meaning = { ...node };
      delete meaning.position;
      delete meaning.size;
      return meaning;
    }),
    scene.nodes,
  );
  assert.deepEqual(
    result.scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
    scene.edges.map(({ id, from, to, label }) => ({ id, from, to, label })),
  );
  const byId = new Map(result.scene.nodes.map((node) => [node.id, node]));
  const connected = new Set(scene.edges.flatMap(({ from, to }) => [from, to]));
  const context = scene.nodes.filter(({ id }) => !connected.has(id)).map(({ id }) => byId.get(id));
  assert(
    Math.max(...context.map(({ position, size }) => position.y + size.height)) <
      Math.min(...branches.flatMap((branch) => branch.map((id) => byId.get(id).position.y))),
    "Selected context must form a reading stage before the parallel contributions",
  );
  for (let role = 0; role < branches[0].length; role++) {
    const peers = branches.map((branch) => byId.get(branch[role]));
    assert.deepEqual(
      peers.map(({ size }) => size),
      peers.map(() => peers[0].size),
    );
  }
  const envelopes = branches.map((branch) => {
    const members = branch.map((id) => byId.get(id));
    return {
      left: Math.min(...members.map(({ position }) => position.x)),
      right: Math.max(...members.map(({ position, size }) => position.x + size.width)),
      top: Math.min(...members.map(({ position }) => position.y)),
      bottom: Math.max(...members.map(({ position, size }) => position.y + size.height)),
    };
  });
  const columns = envelopes.toSorted((left, right) => left.left - right.left);
  const rows = envelopes.toSorted((left, right) => left.top - right.top);
  assert(
    columns.slice(1).every((box, index) => box.left - columns[index].right >= 24) ||
      rows.slice(1).every((box, index) => box.top - rows[index].bottom >= 24),
    "Complete repeated branches must occupy separate aligned rows or columns, never interleave",
  );
  const origins = branches.map((branch) => byId.get(branch[0]).position);
  for (let role = 0; role < branches[0].length; role++) {
    const offsets = branches.map((branch, index) => {
      const { position } = byId.get(branch[role]);
      return [position.x - origins[index].x, position.y - origins[index].y];
    });
    assert.deepEqual(
      offsets,
      offsets.map(() => offsets[0]),
    );
  }
  assert(result.scene.viewport.width <= 1346);
  assert(Object.values(result.nodeText.layouts).every(({ valid }) => valid));
  return result;
}

export function joinedWorkScene() {
  const { scene, branches } = parallelWorkScene();
  const paths = branches.map((branch) => [branch[0], branch[1], branch[4]]);
  const branchIds = new Set(branches.flat());
  const selected = new Set(paths.flat());
  scene.nodes = scene.nodes.filter(({ id }) => !branchIds.has(id) || selected.has(id));
  scene.nodes.push({
    id: "entry",
    label: "Dispatch selected work",
    detail: "Each independent path retains its own admission",
    figureKind: "carrier",
    visualRole: "external",
  });
  scene.edges = scene.edges.filter(({ from, to }) => !branchIds.has(from) && !branchIds.has(to));
  for (const [permit, actor, work] of paths)
    for (const [from, to, label] of [
      ["entry", permit, "prepare"],
      [permit, actor, "own admission"],
      [actor, work, "execute"],
      [work, "selection", "offer results"],
    ])
      scene.edges.push({ id: `joined-${from}-${to}`, from, to, label, visualRole: "default" });
  return { scene, paths };
}
