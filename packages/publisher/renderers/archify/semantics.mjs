import fs from 'node:fs/promises';
import path from 'node:path';
import { fail, hasExactFields } from '../../src/protocol/values.mjs';

function validatedExploration(value, scene) {
  const nodes = scene.nodes.filter((node) => !node.adornment);
  if (
    !hasExactFields(value, ['nodes', 'relations', 'limits']) ||
    !Array.isArray(value.nodes) ||
    value.nodes.length !== nodes.length ||
    !Array.isArray(value.relations) ||
    !Array.isArray(value.limits) ||
    value.limits.some(
      (limit) =>
        ![
          'nonbijective-source-membership',
          'nonunique-relation-carrier',
          'nonbijective-relation-membership',
          'undrawable-source-relation',
        ].includes(limit),
    ) ||
    (value.limits.length && value.relations.length)
  )
    fail('render_exploration_invalid');
  const ids = new Set();
  for (const node of value.nodes) {
    if (
      !hasExactFields(node, ['id', 'label', 'kind']) ||
      ids.has(node.id) ||
      !nodes.some((candidate) => candidate.id === node.id) ||
      typeof node.label !== 'string' ||
      !node.label.trim() ||
      typeof node.kind !== 'string' ||
      !node.kind.trim()
    )
      fail('render_exploration_invalid');
    ids.add(node.id);
  }
  const relations = new Set();
  for (const relation of value.relations) {
    if (
      !hasExactFields(
        relation,
        ['id', 'reference', 'from', 'to', 'label'],
        [relation.edgeId ? 'edgeId' : 'routeId'],
      ) ||
      typeof relation.reference !== 'string' ||
      relations.has(relation.reference) ||
      !ids.has(relation.from) ||
      !ids.has(relation.to) ||
      typeof relation.label !== 'string' ||
      !relation.label.trim()
    )
      fail('render_exploration_invalid');
    relations.add(relation.reference);
    if (relation.edgeId) {
      const edge = scene.edges.find((edge) => edge.id === relation.edgeId && !edge.adornment);
      if (
        !edge ||
        relation.id !== edge.id ||
        edge.from !== relation.from ||
        edge.to !== relation.to ||
        edge.semanticIds?.length !== 1 ||
        edge.semanticIds[0] !== relation.reference
      )
        fail('render_exploration_invalid');
    } else {
      const route = scene.routes?.find((route) => route.id === relation.routeId);
      if (
        !route ||
        relation.id !== route.id ||
        route.reference !== relation.reference ||
        route.source !== relation.from ||
        route.target !== relation.to
      )
        fail('render_exploration_invalid');
    }
  }
  return value;
}

/** Adapt checked logical membership; drawing contacts remain inspection sites only. */
export async function adaptArchitectureExploration(native, scene, value) {
  if (value === undefined) return;
  const graph = validatedExploration(value, scene);
  const file = path.join(native, 'renderers/architecture/render-architecture.mjs');
  let source = await fs.readFile(file, 'utf8');
  const nodePaint = "${[...components.values()].map(renderComponent).join('\\n\\n')}";
  const edgePaint =
    "${asArray(arch.connections).map((connection, index) => renderConnectionPath(connection, index)).join('\\n')}";
  const originalEdgePaint = "${asArray(arch.connections).map(renderConnectionPath).join('\\n')}";
  const labelPaint = "${asArray(arch.connections).map(renderConnectionLabel).join('\\n')}";
  const endPaint = '      </svg>`;';
  if (
    [nodePaint, labelPaint, endPaint].some((needle) => source.split(needle).length !== 2) ||
    (!source.includes(edgePaint) && !source.includes(originalEdgePaint))
  )
    fail('render_exploration_seam_invalid');
  const declaration = JSON.stringify(graph).replaceAll('<', '\\u003c');
  const seam = 'const grid = gridLayout(arch);';
  if (source.split(seam).length !== 2) fail('render_exploration_seam_invalid');
  const adaptation = `
const publicationGraph = ${declaration};
function publicationNode(node) {
  const member = publicationGraph.nodes.find(member => member.id === node.id);
  if (!member) return renderComponent(node);
  return renderComponent(node).replace(/<g [^>]*>/, opening => {
    const paint = opening.replace(/ (?:id|data-node-[a-z-]+|tabindex|role|aria-(?:label|pressed))="[^"]*"/g, '');
    const action = publicationGraph.limits.length
      ? 'id="graphic-'+esc(member.id)+'" tabindex="0" role="button" aria-label="'+esc('Inspect '+member.label)+'"'
      : focusNodeAttrs(member.id,member.label,{kind:member.kind},arch.meta.locale);
    return paint.slice(0,-1)+' data-inspect-id="'+esc(member.id)+'" data-inspect-label="'+esc(member.label)+'" '+action+'>';
  });
}
function publicationEdge(connection, index, afterComponents) {
  const markup = renderConnectionPath(connection, index, afterComponents);
  return markup.replace(/ data-edge-(?:from|to|key|label)="[^"]*"/g,'');
}
function publicationLabel(connection, index) {
  return renderConnectionLabel(connection,index).replace(/ data-edge-(?:from|to|key|label)="[^"]*"/g,'');
}
function publicationRelations() {
  return publicationGraph.relations.map(relation => {
    let points;
    if (relation.routeId) {
      const route = archPublicationRoutes.find(route => route.id === relation.routeId);
      points = route.traversals.flatMap((traversal,index) => {
        const edge = literalSegments.get(traversal.edge);
        const ordered = traversal.direction === 'reverse' ? edge.points.slice().reverse() : edge.points;
        return index ? ordered.slice(1) : ordered;
      });
      points = points.map(point => [point.x,point.y]);
    } else {
      points = pathFor(asArray(arch.connections).find(connection => connection.id === relation.edgeId)).points;
    }
    const d = points.map(([x,y],index) => (index ? 'L ' : 'M ')+x+' '+y).join(' ');
    return '<path '+focusEdgeAttrs(relation.from,relation.to,relation.label,relation.reference,relation.id)+' d="'+d+'" fill="none" stroke="none" pointer-events="none" aria-hidden="true" data-logical-relation="true"/>';
  }).join('\\n');
}
const archPublicationRoutes = ${JSON.stringify(scene.routes ?? []).replaceAll('<', '\\u003c')};
`;
  source = source.replace(seam, adaptation + '\n' + seam);
  source = source
    .replace(nodePaint, "${[...components.values()].map(publicationNode).join('\\n\\n')}")
    .replace(
      source.includes(edgePaint) ? edgePaint : originalEdgePaint,
      "${asArray(arch.connections).map((connection,index) => publicationEdge(connection,index)).join('\\n')}",
    )
    .replace(
      "${asArray(arch.connections).map((connection, index) => renderConnectionPath(connection, index, true)).join('\\n')}",
      "${asArray(arch.connections).map((connection,index) => publicationEdge(connection,index,true)).join('\\n')}",
    )
    .replace(labelPaint, "${asArray(arch.connections).map(publicationLabel).join('\\n')}")
    .replace(endPaint, '${publicationRelations()}\\n' + endPaint);
  await fs.writeFile(file, source);
  if (!graph.limits.length) return;
  const templateFile = path.join(native, 'assets/template.html');
  const template = await fs.readFile(templateFile, 'utf8');
  const containerEnd = '  </div>\n\n  <script>';
  if (template.split(containerEnd).length !== 2) fail('render_exploration_seam_invalid');
  await fs.writeFile(
    templateFile,
    template
      .replace(
        '<head>',
        '<head>\n<script>document.documentElement.setAttribute("data-native-query-limit",' +
          JSON.stringify(graph.limits.join(' ')) +
          ')</script>',
      )
      .replace(
        '</head>',
        `<style>html[data-native-query-limit] #btn-route-probe,html[data-native-query-limit] #btn-semantic-lens,html[data-native-query-limit] #focus-reach,html[data-native-query-limit] [data-guide-action="route"],html[data-native-query-limit] [data-guide-action="lens"]{display:none!important}.publication-query-limit{color:var(--text-muted);font-size:.75rem;line-height:1.5;margin:1rem 0;flex:none}</style></head>`,
      )
      .replace(
        containerEnd,
        '    <p class="publication-query-limit" role="note">This figure groups or repeats selected source members. Exact graph queries are unavailable; Inspect retains the selected facts.</p>\n' +
          containerEnd,
      ),
  );
}
