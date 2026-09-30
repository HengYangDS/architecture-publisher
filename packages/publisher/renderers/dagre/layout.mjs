import { createContext, Script } from 'node:vm';
import { fail } from '../../src/protocol/values.mjs';
import { loadDagreSupply } from './supply.mjs';

const nodeSize = { width: 170, height: 64 };
const text = (value) => typeof value === 'string' && value.trim().length > 0;

function checkedPage(page) {
  if (
    !page ||
    !Array.isArray(page.nodes) ||
    !Array.isArray(page.relations) ||
    page.nodes.length > 512 ||
    page.relations.length > 2048
  )
    fail('render_interactive_layout_invalid');
  const nodes = new Set();
  for (const node of page.nodes) {
    if (!text(node?.id) || !text(node.label) || nodes.has(node.id))
      fail('render_interactive_layout_invalid');
    nodes.add(node.id);
  }
  const relations = new Set();
  for (const relation of page.relations) {
    if (
      !text(relation?.id) ||
      relations.has(relation.id) ||
      !nodes.has(relation.source) ||
      !nodes.has(relation.target)
    )
      fail('render_interactive_layout_invalid');
    relations.add(relation.id);
  }
  if (page.groups === undefined) return;
  if (!Array.isArray(page.groups) || !page.groups.length) fail('render_interactive_group_invalid');
  const groups = new Set();
  const members = new Set();
  for (const group of page.groups) {
    if (
      !text(group?.id) ||
      !text(group.label) ||
      nodes.has(group.id) ||
      groups.has(group.id) ||
      !Array.isArray(group.nodeIds) ||
      !group.nodeIds.length
    )
      fail('render_interactive_group_invalid');
    groups.add(group.id);
    for (const id of group.nodeIds) {
      if (!nodes.has(id) || members.has(id)) fail('render_interactive_group_invalid');
      members.add(id);
    }
  }
  if (members.size !== nodes.size) fail('render_interactive_group_invalid');
}

function composeOrientation(page, runtime, rankdir) {
  const { context, dagre, layoutScript } = runtime;
  const grouped = page.groups !== undefined;
  const graph = new dagre.graphlib.Graph({ multigraph: true, compound: grouped });
  graph.setGraph({
    rankdir,
    ranksep: 50,
    nodesep: grouped ? 64 : 24,
    edgesep: 12,
    marginx: 20,
    marginy: 20,
  });
  graph.setDefaultEdgeLabel(() => ({}));
  if (grouped) for (const group of page.groups) graph.setNode(group.id, { width: 0, height: 0 });
  for (const node of page.nodes) graph.setNode(node.id, { ...nodeSize });
  if (grouped)
    for (const group of page.groups) for (const id of group.nodeIds) graph.setParent(id, group.id);
  for (const relation of page.relations)
    graph.setEdge(relation.source, relation.target, {}, relation.id);
  try {
    context.graph = graph;
    layoutScript.runInContext(context, { timeout: 5000 });
  } catch (cause) {
    throw Object.assign(new Error('render_interactive_layout_infeasible', { cause }), {
      code: 'render_interactive_layout_infeasible',
    });
  } finally {
    delete context.graph;
  }
  const { width, height } = graph.graph();
  const positions = Object.fromEntries(
    [...page.nodes, ...(page.groups ?? [])].map(({ id }) => {
      const { x, y } = graph.node(id) ?? {};
      if (!Number.isFinite(x) || !Number.isFinite(y)) fail('render_interactive_layout_infeasible');
      return [id, { x, y }];
    }),
  );
  if (![width, height].every((value) => Number.isFinite(value) && value > 0))
    fail('render_interactive_layout_infeasible');
  for (const [index, left] of page.nodes.entries())
    for (const right of page.nodes.slice(index + 1)) {
      const a = positions[left.id],
        b = positions[right.id];
      if (Math.abs(a.x - b.x) < nodeSize.width + 2 && Math.abs(a.y - b.y) < nodeSize.height + 2)
        fail('render_interactive_layout_infeasible');
    }
  const groups = page.groups?.map(({ id }) => {
    const box = graph.node(id);
    if (
      !box ||
      ![box.x, box.y, box.width, box.height].every(Number.isFinite) ||
      box.width <= 0 ||
      box.height <= 0
    )
      fail('render_interactive_layout_infeasible');
    return {
      id,
      x: box.x - box.width / 2,
      y: box.y - box.height / 2,
      width: box.width,
      height: box.height,
    };
  });
  if (groups)
    for (const group of groups) {
      const members = page.groups.find(({ id }) => id === group.id).nodeIds;
      for (const id of members) {
        const node = positions[id];
        if (
          node.x - nodeSize.width / 2 < group.x ||
          node.x + nodeSize.width / 2 > group.x + group.width ||
          node.y - nodeSize.height / 2 < group.y ||
          node.y + nodeSize.height / 2 > group.y + group.height
        )
          fail('render_interactive_layout_infeasible');
      }
    }
  return { bounds: { width, height }, positions, ...(groups ? { groups } : {}) };
}

async function selectedRuntime() {
  const supply = await loadDagreSupply();
  const context = createContext(
    { structuredClone },
    { codeGeneration: { strings: false, wasm: false } },
  );
  new Script(supply.script.toString('utf8'), { filename: 'dagre-supply.js' }).runInContext(
    context,
    { timeout: 1000 },
  );
  const dagre = context.dagre;
  if (dagre.version !== supply.version) fail('render_interactive_layout_infeasible');
  return {
    supply,
    context,
    dagre,
    layoutScript: new Script('dagre.layout(graph)'),
  };
}

/** Use the already pinned Dagre supply for source-neutral flat static coordinates. */
export async function layoutStaticGraph(input, { alignment = 'balanced' } = {}) {
  if (
    !input ||
    !['balanced', 'regular'].includes(alignment) ||
    !Array.isArray(input.nodes) ||
    !input.nodes.length ||
    input.nodes.length > 512 ||
    !Array.isArray(input.relations) ||
    input.relations.length > 2048
  )
    fail('render_static_layout_invalid');
  const ids = new Set();
  for (const node of input.nodes) {
    if (
      !text(node?.id) ||
      ids.has(node.id) ||
      ![node.width, node.height].every(
        (value) => Number.isFinite(value) && value > 0 && value <= 1024,
      )
    )
      fail('render_static_layout_invalid');
    ids.add(node.id);
  }
  const relations = new Set();
  for (const relation of input.relations) {
    if (
      !text(relation?.id) ||
      relations.has(relation.id) ||
      !ids.has(relation.source) ||
      !ids.has(relation.target) ||
      ![relation.width, relation.height].every(
        (value) => Number.isFinite(value) && value >= 0 && value <= 1024,
      )
    )
      fail('render_static_layout_invalid');
    relations.add(relation.id);
  }
  const runtime = await selectedRuntime();
  const graph = new runtime.dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({
    rankdir: 'LR',
    ...(alignment === 'regular' ? { align: 'DR' } : {}),
    ranksep: 70,
    nodesep: alignment === 'regular' ? 32 : 34,
    edgesep: 16,
    marginx: 20,
    marginy: 20,
  });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const node of input.nodes)
    graph.setNode(node.id, { width: node.width, height: node.height });
  for (const relation of input.relations)
    graph.setEdge(
      relation.source,
      relation.target,
      { width: relation.width, height: relation.height },
      relation.id,
    );
  try {
    runtime.context.graph = graph;
    runtime.layoutScript.runInContext(runtime.context, { timeout: 5000 });
  } catch (cause) {
    throw Object.assign(new Error('render_static_layout_infeasible', { cause }), {
      code: 'render_static_layout_infeasible',
    });
  } finally {
    delete runtime.context.graph;
  }
  const { width, height } = graph.graph();
  if (![width, height].every((value) => Number.isFinite(value) && value > 0 && value <= 100_000))
    fail('render_static_layout_infeasible');
  const nodes = input.nodes.map(({ id }) => {
    const { x, y, width: w, height: h } = graph.node(id);
    return { id, x, y, width: w, height: h };
  });
  const edges = input.relations.map(({ id, source, target }) => {
    const edge = graph.edge({ v: source, w: target, name: id });
    return {
      id,
      x: edge.x ?? null,
      y: edge.y ?? null,
      points: Array.from(edge.points, ({ x, y }) => ({ x, y })),
    };
  });
  if (
    nodes.some(({ x, y, width: w, height: h }) => ![x, y, w, h].every(Number.isFinite)) ||
    edges.some(
      ({ points }) =>
        !Array.isArray(points) ||
        points.length < 2 ||
        points.some(({ x, y }) => ![x, y].every(Number.isFinite)),
    )
  )
    fail('render_static_layout_infeasible');
  return { width, height, nodes, edges, supplySha256: runtime.supply.manifestSha256 };
}

/** Compute disposable geometry from selected public page data and pinned bytes. */
export async function layoutInteractivePages(pages) {
  if (!Array.isArray(pages) || !pages.length) fail('render_interactive_layout_invalid');
  for (const page of pages) checkedPage(page);
  const runtime = await selectedRuntime();
  return {
    layouts: pages.map((page) =>
      page.nodes.length ? composeOrientation(page, runtime, 'LR') : null,
    ),
    supplySha256: runtime.supply.manifestSha256,
    license: runtime.supply.license,
  };
}
