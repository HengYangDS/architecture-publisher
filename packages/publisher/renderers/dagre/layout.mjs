import { createContext, Script } from 'node:vm';
import { fail } from '../../src/protocol/values.mjs';
import { loadDagreSupply } from './supply.mjs';

const text = (value) => typeof value === 'string' && value.trim().length > 0;

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
  if (dagre.version !== supply.version) fail('render_static_layout_infeasible');
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
