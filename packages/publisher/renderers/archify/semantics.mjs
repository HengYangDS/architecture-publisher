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

function occurrenceWording() {
  return {
    'viewer.finder.title': 'Find in this figure',
    'viewer.finder.close': 'Close figure finder',
    'viewer.finder.search': 'Search figure occurrences',
    'viewer.finder.results': 'Figure occurrences',
    'viewer.finder.empty': 'No matching figure occurrences',
    'viewer.finder.noun.nodes': 'figure occurrences',
    'viewer.outline.title': 'Figure index',
    'viewer.lens.title': 'Compare figure kinds',
    'viewer.lens.instruction':
      'Choose up to two figure kinds. Highlighting preserves the drawing; exact relationship queries are unavailable.',
    'viewer.lens.choose': 'Choose a kind to highlight its figure occurrences.',
    'viewer.lens.kinds': 'Figure kinds',
    'viewer.guide.fact.node.one': '{count} figure occurrence',
    'viewer.guide.fact.node.other': '{count} figure occurrences',
    'viewer.guide.facts': '{nodes} · Relationship queries unavailable',
    'viewer.finder.link.one': 'Relations unavailable',
    'viewer.finder.link.other': 'Relations unavailable',
    'viewer.finder.result.focus.one': 'Focus {label}, figure occurrence; relations unavailable',
    'viewer.finder.result.focus.other': 'Focus {label}, figure occurrence; relations unavailable',
    'viewer.finder.status.empty': 'No matching figure occurrences',
    'viewer.finder.status.count.one': '{count} matching figure occurrence',
    'viewer.finder.status.count.other': '{count} matching figure occurrences',
    'viewer.lens.kind.count.one': '{label}, {count} figure occurrence',
    'viewer.lens.kind.count.other': '{label}, {count} figure occurrences',
    'viewer.lens.node.one': '{count} {label} figure occurrence',
    'viewer.lens.node.other': '{count} {label} figure occurrences',
    'viewer.lens.single': '{nodes} · Relationship queries unavailable',
    'viewer.lens.compare.one': '{first} and {second} figure occurrences · Relations unavailable',
    'viewer.lens.compare.other': '{first} and {second} figure occurrences · Relations unavailable',
    'viewer.intent.summary': '{label}, figure occurrence; relations unavailable',
    'viewer.radar.fullMap': '{count} figure occurrences · Viewport overview',
    'viewer.radar.nodes': 'Figure occurrences',
    'viewer.focus.selectedNodes': '{count} selected figure occurrences',
  };
}

async function adaptReaderCatalog(native, limited) {
  const file = path.join(native, 'renderers/shared/i18n.mjs');
  const source = await fs.readFile(file, 'utf8');
  const seam = 'for (const [key, messages] of Object.entries(MESSAGE_PAIRS)) {';
  if (source.split(seam).length !== 2) fail('render_exploration_seam_invalid');
  const wording = {
    'viewer.lens.instruction':
      'Choose up to two figure kinds. One highlights its declared relationships; two compare only direct authored relationships.',
    'viewer.lens.legend.inspect.one': 'Inspect {label}',
    'viewer.lens.legend.inspect.other': 'Inspect {label}',
    ...(limited ? occurrenceWording() : {}),
  };
  const declaration = JSON.stringify(wording).replaceAll('<', '\\u003c');
  await fs.writeFile(
    file,
    source.replace(
      seam,
      `
for (const [key, message] of Object.entries(${declaration})) {
  if (!Object.hasOwn(MESSAGE_PAIRS, key)) throw Error('render_exploration_seam_invalid');
  MESSAGE_PAIRS[key] = [message, MESSAGE_PAIRS[key][1]];
}
${seam}`,
    ),
  );
}

async function adaptLegendBridge(native) {
  const legendFile = path.join(native, 'renderers/shared/legend.mjs');
  const legendSource = await fs.readFile(legendFile, 'utf8');
  const metrics = [
    ['const DEFAULT_FONT_SIZE = 8;', 'const DEFAULT_FONT_SIZE = 10;'],
    ['const INTERACTIVE_BADGE_ALLOWANCE = 21;', 'const INTERACTIVE_BADGE_ALLOWANCE = 0;'],
    [
      'const renderedFontSize = measured.fontSize < 8 ? measured.fontSize + 0.5 : measured.fontSize + 2;',
      'const renderedFontSize = measured.fontSize;',
    ],
  ];
  let legend = legendSource;
  for (const [original, replacement] of metrics) {
    if (legend.split(original).length !== 2) fail('render_exploration_seam_invalid');
    legend = legend.replace(original, replacement);
  }
  await fs.writeFile(legendFile, legend);
  const file = path.join(native, 'assets/template.html');
  let source = await fs.readFile(file, 'utf8');
  const geometryStart = '      function legendSourceBounds(entry) {';
  const geometryEnd = '      function layoutLegendBridge() {';
  const start = source.indexOf(geometryStart);
  const end = source.indexOf(geometryEnd, start);
  const badgeStart = "          var badge = document.createElementNS(namespace, 'g');";
  const badgeEnd = '          if (!fact || !count) {';
  if (
    start < 0 ||
    end < 0 ||
    source.split(geometryStart).length !== 2 ||
    source.split(geometryEnd).length !== 2 ||
    source.split(badgeStart).length !== 2 ||
    source.split(badgeEnd).length !== 2
  )
    fail('render_exploration_seam_invalid');
  source =
    source.slice(0, start) +
    `      function legendSourceBounds(entry) {
        var bounds = null;
        Array.prototype.forEach.call(entry.children, function (child) {
          if (child.hasAttribute('data-legend-bridge-runtime')) return;
          var box;
          try { box = child.getBBox(); } catch (_) { return; }
          if (!box || !Number.isFinite(box.x) || !Number.isFinite(box.y)) return;
          var matrix = entry.getCTM().inverse().multiply(child.getCTM());
          var corners = [[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]].map(function (position) {
            var point = svg.createSVGPoint(); point.x = position[0]; point.y = position[1];
            return point.matrixTransform(matrix);
          });
          var next = {left:Math.min.apply(null,corners.map(function(p){return p.x;})),top:Math.min.apply(null,corners.map(function(p){return p.y;})),right:Math.max.apply(null,corners.map(function(p){return p.x;})),bottom:Math.max.apply(null,corners.map(function(p){return p.y;}))};
          if (!bounds) bounds = next;
          else { bounds.left=Math.min(bounds.left,next.left);bounds.top=Math.min(bounds.top,next.top);bounds.right=Math.max(bounds.right,next.right);bounds.bottom=Math.max(bounds.bottom,next.bottom); }
        });
        return bounds;
      }
      function layoutLegendEntry(entry) {
        var bounds = legendSourceBounds(entry);
        var hit = entry.querySelector('[data-legend-hit]');
        if (!bounds || !hit) return false;
        hit.setAttribute('x', (bounds.left-5).toFixed(2));
        hit.setAttribute('y', ((bounds.top+bounds.bottom)/2-12).toFixed(2));
        hit.setAttribute('width', Math.max(24,bounds.right-bounds.left+10).toFixed(2));
        hit.setAttribute('height', '24'); hit.setAttribute('rx', '4');
        return true;
      }
` +
    source.slice(end);
  const badge = source.indexOf(badgeStart);
  source = source.slice(0, badge) + source.slice(source.indexOf(badgeEnd, badge));
  await fs.writeFile(file, source);
}

function occurrenceReader(template) {
  const patches = [
    [
      '      function renderRelationshipLens(id, byId) {',
      `      function renderRelationshipLens(id, byId) {
        if (html.hasAttribute('data-native-query-limit')) {
          renderPassport(id, byId[id]);
          summary.textContent = 'Figure occurrence · Relationship queries unavailable';
          relationsBtn.hidden = true;
          relationshipList.textContent = '';
          return;
        }`,
    ],
    [
      '      function applyReachability(direction, options) {',
      '      function applyReachability(direction, options) {\n        if (html.hasAttribute("data-native-query-limit")) return false;',
    ],
    [
      '      function begin(options) {',
      '      function begin(options) {\n        if (html.hasAttribute("data-native-query-limit")) return false;',
    ],
    [
      '      function relationshipCount() {',
      '      function relationshipCount() {\n        if (html.hasAttribute("data-native-query-limit")) return null;',
    ],
    [
      '<button class="diagram-guide-action" type="button" data-guide-action="route"',
      '<button class="diagram-guide-action" type="button" data-guide-action="route" disabled',
    ],
  ];
  for (const [original, replacement] of patches) {
    if (template.split(original).length !== 2) fail('render_exploration_seam_invalid');
    template = template.replace(original, replacement);
  }
  return template;
}

/** Preserve checked graphic occurrences; admit traversal only with complete logical membership. */
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
  const iconPaint = 'renderSemanticSigil(c.type, { icon: c.icon, x: c.x + 6, y: c.y + 6 })';
  const endPaint = '      </svg>`;';
  if (
    [nodePaint, labelPaint, iconPaint, endPaint].some(
      (needle) => source.split(needle).length !== 2,
    ) ||
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
  const label = publicationGraph.limits.length ? node.label : member.label;
  const passport = {kind:member.kind, sublabel:node.sublabel};
  let markup = renderComponent(node).replace(/<g [^>]*>/, opening => {
      const paint = opening.replace(/ (?:id|data-node-[a-z-]+|tabindex|role|aria-(?:label|pressed))="[^"]*"/g, '');
    const action = focusNodeAttrs(member.id,label,passport,arch.meta.locale);
    return paint.slice(0,-1)+' data-inspect-id="'+esc(member.id)+'" data-inspect-label="'+esc(member.label)+'" '+action+'>';
  });
  markup = markup.replace(/<title>[\\s\\S]*?<\\/title>/, focusNodeTitle(label,passport));
  return markup;
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
const publicationKindIcons = new Map();
const publicationComponents = new Map(arch.components.map(node => [node.id,node]));
for (const member of publicationGraph.nodes) {
  const node = publicationComponents.get(member.id);
  if (node.primitives || node.type === 'paint') continue;
  const glyph = renderSemanticSigil(member.kind,{icon:node.icon,x:0,y:0});
  const selected = glyph.match(/data-semantic-sigil="([^"]+)"/)?.[1];
  if (!selected || (publicationKindIcons.has(member.kind) && publicationKindIcons.get(member.kind) !== selected))
    throw Error('figure_type_glyph_conflict');
  publicationKindIcons.set(member.kind,selected);
}
const publicationKinds = [...publicationKindIcons.keys()];
arch.meta.legend = {mode:'auto'};
`;
  source = source.replace(seam, adaptation + '\n' + seam);
  source = source
    .replace(nodePaint, "${[...components.values()].map(publicationNode).join('\\n\\n')}")
    .replace(
      iconPaint,
      'renderSemanticSigil(publicationGraph.nodes.find(member => member.id === c.id)?.kind ?? c.type, { icon: c.icon, x: c.x + 6, y: c.y + 6 })',
    )
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
  const legendStart = 'const LEGEND_CATALOG = [';
  const legendEnd = '\n\n// ---- Measure components';
  const start = source.indexOf(legendStart);
  const end = source.indexOf(legendEnd, start);
  if (start < 0 || end < 0 || source.split(legendStart).length !== 2)
    fail('render_exploration_seam_invalid');
  source =
    source.slice(0, start) +
    'const LEGEND_CATALOG = [...publicationKindIcons].map(([kind,icon]) => ({kind,label:kind,icon,swatchWidth:11,swatchGap:8}));' +
    source.slice(end);
  const presentKinds = 'new Set([...components.values()].map((component) => component.type))';
  const swatch =
    'renderSwatch: (entry) => `<rect x="${entry.x}" y="${entry.baseline - 9}" width="16" height="10" rx="2.5" class="${componentFill[entry.kind] || \'c-external\'}" stroke-width="1"/>`';
  if (source.split(presentKinds).length !== 2 || source.split(swatch).length !== 2)
    fail('render_exploration_seam_invalid');
  source = source
    .replace(presentKinds, 'new Set(publicationKinds)')
    .replace(
      swatch,
      'renderSwatch: (entry) => renderSemanticSigil(entry.kind,{icon:entry.icon,x:entry.x,y:entry.baseline-9})',
    );
  await fs.writeFile(file, source);
  await adaptLegendBridge(native);
  await adaptReaderCatalog(native, graph.limits.length > 0);
  if (!graph.limits.length) return;
  const templateFile = path.join(native, 'assets/template.html');
  const template = occurrenceReader(await fs.readFile(templateFile, 'utf8'));
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
        `<style>html[data-native-query-limit] #btn-route-probe,html[data-native-query-limit] #focus-reach,html[data-native-query-limit] [data-guide-action="route"]{display:none!important}.publication-query-limit{color:var(--text-muted);font-size:.75rem;line-height:1.5;margin:1rem 0;flex:none}</style></head>`,
      )
      .replace(
        containerEnd,
        '    <p class="publication-query-limit" role="note">Find and Lens read figure occurrences. Exact relationship queries are unavailable; Inspect retains the selected source facts.</p>\n' +
          containerEnd,
      ),
  );
}
