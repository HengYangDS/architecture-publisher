import { fail } from '../../src/source/manifest.mjs';

const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationKey = ({ namespace, reference, sha256 }) =>
  JSON.stringify([namespace, reference, sha256]);
const claimKey = relationKey;
const advance = (value, size) => [...value].length * size * 0.61;
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function number(value) {
  if (!Number.isFinite(value) || Math.abs(value) > 10_000_000)
    fail('static_edition_geometry_invalid');
  return Number(value.toFixed(2));
}

function wrap(value, width, size, limit = 12) {
  if (typeof value !== 'string' || !value.trim()) fail('static_edition_text_unrepresentable');
  const lines = [];
  let current = '';
  for (const character of [...value.trim().replace(/\s+/gu, ' ')]) {
    if (advance(current + character, size) <= width) {
      current += character;
      continue;
    }
    if (!current) fail('static_edition_text_unrepresentable');
    const breakAt = Math.max(current.lastIndexOf(' ') + 1, current.lastIndexOf('-') + 1);
    if (breakAt > 0 && breakAt < current.length) {
      lines.push(current.slice(0, breakAt).trimEnd());
      current = current.slice(breakAt).trimStart() + character;
    } else {
      lines.push(current.trimEnd());
      current = character === ' ' ? '' : character;
    }
    if (advance(current, size) > width) fail('static_edition_text_unrepresentable');
  }
  if (current) lines.push(current);
  if (lines.length > limit) fail('static_edition_text_unrepresentable');
  return lines;
}

function textLines(output, content, x, y, width, size, color, weight = 400, limit = 12) {
  const lines = wrap(content, width, size, limit);
  for (const [index, line] of lines.entries())
    output.push(
      `<text x="${number(x)}" y="${number(y + index * size * 1.4)}" fill="${color}" font-size="${size}" font-weight="${weight}">${escape(line)}</text>`,
    );
  return y + lines.length * size * 1.4;
}

function boundsOf(scene) {
  if (!scene.nodes.length && !scene.edges.length && !scene.groups?.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x, y) => {
    number(x);
    number(y);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  for (const node of scene.nodes) {
    if (node.width <= 0 || node.height <= 0) fail('static_edition_geometry_invalid');
    include(node.x, node.y);
    include(node.x + node.width, node.y + node.height);
  }
  for (const edge of scene.edges) {
    if (!Array.isArray(edge.points) || edge.points.length < 2)
      fail('static_edition_geometry_invalid');
    for (const point of edge.points) {
      if (!Array.isArray(point) || point.length !== 2) fail('static_edition_geometry_invalid');
      include(point[0], point[1]);
    }
  }
  for (const group of scene.groups ?? []) {
    if (group.width <= 0 || group.height <= 0) fail('static_edition_geometry_invalid');
    include(group.x, group.y);
    include(group.x + group.width, group.y + group.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function namedSection(output, name, items, x, y, width) {
  if (!items.length) return y;
  y = textLines(output, name, x, y, width, 11, '#66736b', 600, 1) + 12;
  for (const item of items) {
    const attribute = item.graphicId ? ` data-graphic-id="${item.graphicId}"` : '';
    const rows = wrap(item.text, width, 15);
    for (const row of rows) {
      output.push(
        `<text${attribute} x="${number(x)}" y="${number(y)}" fill="#27352e" font-size="15">${escape(row)}</text>`,
      );
      y += 22;
    }
  }
  return y + 17;
}

function validateSourceCarriers(scene) {
  const nodes = new Set(scene.nodes.map(key));
  const relationEntries = scene.edges.flatMap(({ relations }) => relations);
  const relations = new Set(relationEntries.map(relationKey));
  const claims = new Set(
    (scene.claimCards ?? []).map(({ namespace, id, sha256 }) =>
      claimKey({ namespace, reference: id, sha256 }),
    ),
  );
  if (
    nodes.size !== scene.nodes.length ||
    relations.size !== relationEntries.length ||
    claims.size !== (scene.claimCards ?? []).length
  )
    fail('static_edition_carrier_ambiguous');
  const claimedNodes = new Set();
  const claimedRelations = new Set();
  const claimedClaims = new Set();
  const assertions = new Set();
  for (const carrier of scene.sourceAssertionCarriers) {
    if (
      typeof carrier?.assertionId !== 'string' ||
      !carrier.assertionId ||
      assertions.has(carrier.assertionId) ||
      !Array.isArray(carrier.nodeRefs) ||
      !Array.isArray(carrier.relationRefs) ||
      (carrier.claimRefs !== undefined && !Array.isArray(carrier.claimRefs)) ||
      (!carrier.nodeRefs.length && !carrier.relationRefs.length && !carrier.claimRefs?.length)
    )
      fail('static_edition_carrier_invalid');
    assertions.add(carrier.assertionId);
    for (const ref of carrier.nodeRefs) {
      if (!ref || typeof ref.namespace !== 'string' || typeof ref.id !== 'string')
        fail('static_edition_carrier_invalid');
      const identity = key(ref);
      if (!nodes.has(identity)) fail('static_edition_carrier_invalid');
      claimedNodes.add(identity);
    }
    for (const ref of carrier.relationRefs) {
      if (
        !ref ||
        typeof ref.namespace !== 'string' ||
        typeof ref.reference !== 'string' ||
        typeof ref.sha256 !== 'string'
      )
        fail('static_edition_carrier_invalid');
      const identity = relationKey(ref);
      if (!relations.has(identity)) fail('static_edition_carrier_invalid');
      claimedRelations.add(identity);
    }
    for (const ref of carrier.claimRefs ?? []) {
      if (
        !ref ||
        typeof ref.namespace !== 'string' ||
        typeof ref.reference !== 'string' ||
        typeof ref.sha256 !== 'string'
      )
        fail('static_edition_carrier_invalid');
      const identity = claimKey(ref);
      if (!claims.has(identity)) fail('static_edition_carrier_invalid');
      claimedClaims.add(identity);
    }
  }
  if (
    nodes.size !== claimedNodes.size ||
    relations.size !== claimedRelations.size ||
    claims.size !== claimedClaims.size
  )
    fail('static_edition_carrier_unclaimed');
}

/** Paint an unqualified, source-bound static Scene without acquiring meaning. */
export function composeStaticEditionSvg(scene) {
  if (
    scene?.schema !== 'architecture.edition-static-scene/v1' ||
    scene.completeness !== 'unqualified-scene' ||
    scene.visualPolicy?.profile !== 'neutral' ||
    (scene.visualPolicy.override !== undefined && scene.visualPolicy.override !== null) ||
    !Array.isArray(scene.nodes) ||
    !Array.isArray(scene.edges) ||
    (scene.groups !== undefined && !Array.isArray(scene.groups)) ||
    (scene.claimCards !== undefined && !Array.isArray(scene.claimCards)) ||
    scene.edges.some((edge) => !edge || !Array.isArray(edge.relations)) ||
    !Array.isArray(scene.questions) ||
    !Array.isArray(scene.sourceAssertionCarriers) ||
    !Array.isArray(scene.editorialAssertions) ||
    !Array.isArray(scene.limits) ||
    !scene.limitsByQuestion ||
    typeof scene.limitsByQuestion !== 'object' ||
    Array.isArray(scene.limitsByQuestion)
  )
    fail('static_edition_scene_invalid');
  if ((scene.claimCards ?? []).some((claim) => !claim || typeof claim !== 'object'))
    fail('static_edition_claim_invalid');
  if (!Array.isArray(scene.questionIds)) fail('static_edition_question_invalid');
  const questionIds = new Set(scene.questionIds);
  const questions = new Map(scene.questions.map((question) => [question?.id, question]));
  if (
    questionIds.size !== scene.questionIds.length ||
    questions.size !== scene.questions.length ||
    questionIds.size !== questions.size ||
    [...questionIds].some((id) => typeof id !== 'string' || !id || !questions.has(id)) ||
    Object.keys(scene.limitsByQuestion).length !== questionIds.size ||
    Object.keys(scene.limitsByQuestion).some((id) => !questionIds.has(id))
  )
    fail('static_edition_question_invalid');
  validateSourceCarriers(scene);
  const rasterWidth = scene.requestedWidth ?? 1800;
  if (!Number.isSafeInteger(rasterWidth) || rasterWidth < 320 || rasterWidth > 12000)
    fail('static_edition_width_invalid');
  const bounds = boundsOf(scene);
  if (JSON.stringify(bounds) !== JSON.stringify(scene.bounds))
    fail('static_edition_bounds_mismatch');
  const graphWidth = Math.max(640, Math.ceil((bounds?.width ?? 0) + 120));
  const notesWidth = 400;
  const gap = 54;
  const notesX = 60 + graphWidth + gap;
  const width = notesX + notesWidth + 60;
  if (width > 12_000) fail('static_edition_geometry_invalid');
  const header = [];
  let y = 76;
  y = textLines(header, scene.title, 60, y, width - 120, 34, '#21332a', 600, 3) + 8;
  y = textLines(header, scene.summary, 60, y, width - 120, 15, '#53645a', 400, 6) + 34;
  const graphTop = y;
  const graph = [];
  const labels = new Map(scene.nodes.map((node) => [key(node), node.label]));
  const nodeCarriers = [];
  const relationCarriers = [];
  for (const group of scene.groups ?? []) {
    const lines = wrap(group.label, group.width - 52, 14, 2);
    graph.push(
      `<rect x="${number(group.x)}" y="${number(group.y)}" width="${number(group.width)}" height="${number(group.height)}" rx="18" fill="#eef0e9" stroke="#c4ccc2" stroke-width="1.4"/>`,
    );
    for (const [index, line] of lines.entries())
      graph.push(
        `<text x="${number(group.x + 26)}" y="${number(group.y + 31 + index * 19)}" fill="#526158" font-size="14" font-weight="600">${escape(line)}</text>`,
      );
  }
  for (const edge of scene.edges) {
    if (!labels.has(key(edge.from)) || !labels.has(key(edge.to)))
      fail('static_edition_relation_endpoint_missing');
    const directions = new Set(edge.relations.map(({ direction }) => direction));
    if (directions.size !== 1 || !['forward', 'bidirectional'].includes([...directions][0]))
      fail('static_edition_direction_unrepresentable');
    const points = edge.points.map(([x, y]) => `${number(x)} ${number(y)}`);
    const start = directions.has('bidirectional') ? ' marker-start="url(#source-arrow)"' : '';
    graph.push(
      `<path d="M ${points.join(' L ')}" fill="none" stroke="#60786a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"${start} marker-end="url(#source-arrow)"/>`,
    );
  }
  for (const [position, node] of scene.nodes.entries()) {
    const x = number(node.x);
    const nodeY = number(node.y);
    const nodeWidth = number(node.width);
    const nodeHeight = number(node.height);
    if (nodeWidth < 96 || nodeHeight < 64) fail('static_edition_node_unrepresentable');
    const labelLines = wrap(node.label, nodeWidth - 28, 16, 2);
    const kindLines = node.kind === null ? [] : wrap(node.kind, nodeWidth - 28, 10, 1);
    if (kindLines.length && labelLines.length > 1 && nodeHeight < 86)
      fail('static_edition_node_unrepresentable');
    const graphicId = `n-${position}`;
    nodeCarriers.push({
      graphicId,
      source: { namespace: node.namespace, id: node.id, sha256: node.sha256 },
    });
    graph.push(
      `<g data-graphic-id="${graphicId}">`,
      `<rect x="${x}" y="${nodeY}" width="${nodeWidth}" height="${nodeHeight}" rx="12" fill="#fffefa" stroke="#84978a" stroke-width="1.6"/>`,
    );
    if (kindLines.length)
      graph.push(
        `<text x="${number(x + 16)}" y="${number(nodeY + 22)}" fill="#6a776d" font-size="10" font-weight="600">${escape(kindLines[0])}</text>`,
      );
    const baseline = nodeY + nodeHeight / 2 + (labelLines.length === 1 ? 7 : -1);
    for (const [index, label] of labelLines.entries())
      graph.push(
        `<text x="${number(x + 16)}" y="${number(baseline + index * 21)}" fill="#21332a" font-size="16" font-weight="600">${escape(label)}</text>`,
      );
    graph.push('</g>');
  }
  const claimPlate = [];
  const claimCarriers = [];
  let claimY = graphTop + 66;
  for (const [position, claim] of (scene.claimCards ?? []).entries()) {
    if (
      typeof claim?.namespace !== 'string' ||
      typeof claim.id !== 'string' ||
      typeof claim.sha256 !== 'string' ||
      !Array.isArray(claim.facts) ||
      !claim.facts.length
    )
      fail('static_edition_claim_invalid');
    const graphicId = `c-${position}`;
    claimCarriers.push({
      graphicId,
      source: { namespace: claim.namespace, reference: claim.id, sha256: claim.sha256 },
    });
    claimPlate.push(`<g data-graphic-id="${graphicId}">`);
    for (const fact of claim.facts) {
      if (typeof fact?.label !== 'string' || typeof fact.value !== 'string')
        fail('static_edition_claim_invalid');
      claimY =
        textLines(
          claimPlate,
          `${fact.label}: ${fact.value}`,
          74,
          claimY,
          graphWidth - 32,
          14,
          '#27352e',
          400,
          8,
        ) + 5;
    }
    claimPlate.push(
      `<line x1="74" y1="${number(claimY + 5)}" x2="${number(60 + graphWidth - 16)}" y2="${number(claimY + 5)}" stroke="#d3dbd1" stroke-width="1"/>`,
      '</g>',
    );
    claimY += 27;
  }
  y = graphTop + 28;
  const notes = [];
  y = namedSection(
    notes,
    'READER QUESTIONS',
    scene.questions.map(({ text }) => ({ text })),
    notesX,
    y,
    notesWidth,
  );
  const relationItems = scene.edges.flatMap((edge) =>
    edge.relations.map((relation) => {
      const qualifiers = [relation.label, relation.kind]
        .filter((value, index, all) => value && all.indexOf(value) === index)
        .join(' · ');
      const graphicId = `r-${relationCarriers.length}`;
      relationCarriers.push({
        graphicId,
        source: {
          namespace: relation.namespace,
          reference: relation.reference,
          sha256: relation.sha256,
        },
      });
      return {
        text: `${labels.get(key(edge.from))} ${relation.direction === 'bidirectional' ? '↔' : '→'} ${labels.get(key(edge.to))}${qualifiers ? ` · ${qualifiers}` : ''}`,
        graphicId,
      };
    }),
  );
  y = namedSection(notes, 'SOURCE RELATIONS', relationItems, notesX, y, notesWidth);
  y = namedSection(
    notes,
    'EDITORIAL ASSERTIONS',
    scene.editorialAssertions.map(({ statement }) => ({ text: statement })),
    notesX,
    y,
    notesWidth,
  );
  const scopeLimits = Object.values(scene.limitsByQuestion)
    .flat()
    .map(({ reason }) => ({ text: reason }));
  y = namedSection(notes, 'DECLARED LIMITS', scopeLimits, notesX, y, notesWidth);
  y = namedSection(
    notes,
    'METHOD LIMITS',
    scene.limits.map((text) => ({ text })),
    notesX,
    y,
    notesWidth,
  );
  const graphHeight = Math.max(
    300,
    (bounds?.height ?? 0) + 120,
    y - graphTop + 32,
    claimCarriers.length ? claimY - graphTop + 32 : 0,
  );
  const translateX = bounds ? 60 + (graphWidth - bounds.width) / 2 - bounds.x : 0;
  const translateY = bounds ? graphTop + 42 + (graphHeight - 42 - bounds.height) / 2 - bounds.y : 0;
  const height = Math.ceil(graphTop + graphHeight + 48);
  if (height > 12_000) fail('static_edition_geometry_invalid');
  const nodeGraphicIds = new Map(
    nodeCarriers.map(({ source, graphicId }) => [key(source), graphicId]),
  );
  const relationGraphicIds = new Map(
    relationCarriers.map(({ source, graphicId }) => [relationKey(source), graphicId]),
  );
  const claimGraphicIds = new Map(
    claimCarriers.map(({ source, graphicId }) => [claimKey(source), graphicId]),
  );
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="edition-title edition-description" font-family="JetBrains Mono" font-weight="400" font-style="normal">`,
    `<title id="edition-title">${escape(scene.title)}</title>`,
    `<desc id="edition-description">${escape(scene.summary)}</desc>`,
    `<rect width="${width}" height="${height}" fill="#f5f3ed"/>`,
    `<defs><marker id="source-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto-start-reverse"><path d="M 0 0 L 10 4 L 0 8 Z" fill="#60786a"/></marker></defs>`,
    `<line x1="60" y1="${number(graphTop - 18)}" x2="${width - 60}" y2="${number(graphTop - 18)}" stroke="#c4ccc2" stroke-width="1"/>`,
    `<line x1="${number(notesX - gap / 2)}" y1="${number(graphTop)}" x2="${number(notesX - gap / 2)}" y2="${number(height - 48)}" stroke="#d3dbd1" stroke-width="1"/>`,
    ...header,
    `<text x="60" y="${number(graphTop + 28)}" fill="#66736b" font-size="11" font-weight="600">${claimCarriers.length ? 'SOURCE CLAIMS' : 'SOURCE STRUCTURE'}</text>`,
    `<g transform="translate(${number(translateX)} ${number(translateY)})">`,
    ...graph,
    '</g>',
    ...claimPlate,
    ...notes,
    '</svg>',
    '',
  ];
  return {
    bytes: Buffer.from(lines.join('\n')),
    width,
    height,
    rasterWidth,
    carriers: {
      nodes: nodeCarriers,
      relations: relationCarriers,
      ...(scene.claimCards === undefined ? {} : { claims: claimCarriers }),
      assertions: scene.sourceAssertionCarriers.map(
        ({ assertionId, nodeRefs, relationRefs, claimRefs }) => ({
          assertionId,
          nodeGraphicIds: nodeRefs.map((ref) => nodeGraphicIds.get(key(ref))),
          relationGraphicIds: relationRefs.map((ref) => relationGraphicIds.get(relationKey(ref))),
          ...(scene.claimCards === undefined
            ? {}
            : {
                claimGraphicIds: (claimRefs ?? []).map((ref) => claimGraphicIds.get(claimKey(ref))),
              }),
        }),
      ),
    },
  };
}
