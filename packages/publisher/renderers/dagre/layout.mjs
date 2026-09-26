import { createContext, Script } from 'node:vm';
import { fail } from '../../src/source/manifest.mjs';
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
}

function composeOrientation(page, runtime, rankdir) {
  const { context, dagre, layoutScript } = runtime;
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({ rankdir, ranksep: 50, nodesep: 24, edgesep: 12, marginx: 20, marginy: 20 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const node of page.nodes) graph.setNode(node.id, { ...nodeSize });
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
    page.nodes.map(({ id }) => {
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
  return { bounds: { width, height }, positions };
}

/** Compute disposable geometry from selected public page data and pinned bytes. */
export async function layoutInteractivePages(pages) {
  if (!Array.isArray(pages) || !pages.length) fail('render_interactive_layout_invalid');
  for (const page of pages) checkedPage(page);
  const supply = await loadDagreSupply();
  const context = createContext(
    { structuredClone },
    { codeGeneration: { strings: false, wasm: false } },
  );
  new Script(supply.script.toString('utf8'), { filename: 'dagre-supply.js' }).runInContext(
    context,
    {
      timeout: 1000,
    },
  );
  const dagre = context.dagre;
  if (dagre.version !== supply.version) fail('render_interactive_layout_infeasible');
  const runtime = { context, dagre, layoutScript: new Script('dagre.layout(graph)') };
  return {
    layouts: pages.map((page) =>
      page.nodes.length
        ? {
            rightward: composeOrientation(page, runtime, 'LR'),
            downward: composeOrientation(page, runtime, 'TB'),
          }
        : null,
    ),
    supplySha256: supply.manifestSha256,
    license: supply.license,
  };
}
