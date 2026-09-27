import { fail } from '../../src/source/manifest.mjs';
import { factorCommonClaimContext } from '../../src/scene/claim-card.mjs';
import {
  SOURCE_REPORTED_TOPOLOGY_NOTE,
  UNLINKED_RELATION_NOTE,
} from '../../src/scene/claim-relations.mjs';

const key = ({ namespace, id }) => JSON.stringify([namespace, id]);
const relationKey = ({ namespace, reference, sha256 }) =>
  JSON.stringify([namespace, reference, sha256]);
const claimKey = relationKey;
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const advance = (value, size) => [...value].length * size * 0.61;
const groupTitleBaseline = 31;
const groupTitleLeading = 19;
const groupTitleClearance = 17;
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function factorClaimFacts(cards) {
  for (const claim of cards) {
    if (
      !text(claim?.namespace) ||
      !text(claim.id) ||
      !text(claim.sha256) ||
      !Array.isArray(claim.facts) ||
      !claim.facts.length ||
      claim.facts.some((fact) => !text(fact?.label) || !text(fact.value)) ||
      new Set(claim.facts.map(({ label }) => label)).size !== claim.facts.length
    )
      fail('static_edition_claim_invalid');
  }
  return factorCommonClaimContext(cards);
}

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

export { escape as escapeStaticText, wrap as wrapStaticText };

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
    const caption = checkedRelationCaption(edge);
    if (caption) {
      const box = caption.box;
      include(box.x, box.y);
      include(box.x + box.w, box.y + box.h);
    }
  }
  for (const group of scene.groups ?? []) {
    if (group.width <= 0 || group.height <= 0) fail('static_edition_geometry_invalid');
    include(group.x, group.y);
    include(group.x + group.width, group.y + group.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function segmentHitsBox(from, to, box) {
  let lower = 0;
  let upper = 1;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  for (const [p, q] of [
    [-dx, from[0] - box.x],
    [dx, box.x + box.width - from[0]],
    [-dy, from[1] - box.y],
    [dy, box.y + box.height - from[1]],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const ratio = q / p;
    if (p < 0) lower = Math.max(lower, ratio);
    else upper = Math.min(upper, ratio);
    if (lower > upper) return false;
  }
  return true;
}

function headingOverlapsCaption(heading, caption) {
  const clearance = 3;
  return (
    heading.x < caption.x + caption.w + clearance &&
    heading.x + heading.width + clearance > caption.x &&
    heading.y < caption.y + caption.h + clearance &&
    heading.y + heading.height + clearance > caption.y
  );
}

function groupHeadingX(group, lines, edges) {
  const textWidth = Math.max(...lines.map((line) => advance(line, 14))) + 12;
  const left = group.x + 26;
  const right = group.x + group.width - 26 - textWidth;
  if (right < left) fail('static_edition_group_heading_collision');
  const boxY = group.y + 13;
  const boxHeight = groupTitleBaseline + (lines.length - 1) * groupTitleLeading + 4 - 13;
  const positions = [left, right, (left + right) / 2];
  for (let x = left + 20; x < right; x += 20) positions.push(x);
  for (const x of positions) {
    const box = { x: x - 3, y: boxY - 3, width: textWidth + 6, height: boxHeight + 6 };
    if (
      edges.some(
        ({ points, caption }) =>
          points.slice(1).some((point, index) => segmentHitsBox(points[index], point, box)) ||
          (caption && headingOverlapsCaption(box, caption.box)),
      )
    )
      continue;
    return x;
  }
  fail('static_edition_group_heading_collision');
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

function linkedClaims(scene) {
  const relationLinks = scene.claimRelationLinks ?? [];
  const subjectLinks = scene.claimSubjectLinks ?? [];
  if (
    !Array.isArray(relationLinks) ||
    !Array.isArray(subjectLinks) ||
    relationLinks.length + subjectLinks.length !== scene.claimCards.length
  )
    fail('static_edition_claim_relation_invalid');
  const assertions = new Map(
    scene.sourceAssertionCarriers.map((carrier) => [carrier.assertionId, carrier]),
  );
  const relations = new Set(scene.edges.flatMap((edge) => edge.relations.map(relationKey)));
  const links = new Map();
  for (const link of relationLinks) {
    if (!link || typeof link !== 'object' || Array.isArray(link))
      fail('static_edition_claim_relation_invalid');
    const { claimAssertionId, relationAssertionId } = link;
    const claim = assertions.get(claimAssertionId);
    const relation = assertions.get(relationAssertionId);
    if (
      claim?.kind !== 'claim' ||
      relation?.kind !== 'relation' ||
      claim.claimRefs?.length !== 1 ||
      relation.relationRefs?.length !== 1 ||
      links.has(claimKey(claim.claimRefs[0])) ||
      !relations.has(relationKey(relation.relationRefs[0]))
    )
      fail('static_edition_claim_relation_invalid');
    links.set(claimKey(claim.claimRefs[0]), relationKey(relation.relationRefs[0]));
  }
  const subjects = new Map();
  for (const link of subjectLinks) {
    if (!link || typeof link !== 'object' || Array.isArray(link))
      fail('static_edition_claim_relation_invalid');
    const claim = assertions.get(link.claimAssertionId);
    const identity = claim?.claimRefs?.length === 1 ? claimKey(claim.claimRefs[0]) : null;
    if (
      claim?.kind !== 'claim' ||
      !identity ||
      links.has(identity) ||
      subjects.has(identity) ||
      !text(link.subject?.namespace) ||
      !text(link.subject?.id) ||
      !text(link.subject?.sha256) ||
      link.subject.namespace !== claim.claimRefs[0].namespace ||
      link.subject.sha256 !== claim.claimRefs[0].sha256
    )
      fail('static_edition_claim_relation_invalid');
    subjects.set(identity, link.subject);
  }
  if (
    links.size + subjects.size !== scene.claimCards.length ||
    scene.claimCards.some(
      ({ namespace, id, sha256 }) =>
        !links.has(claimKey({ namespace, reference: id, sha256 })) &&
        !subjects.has(claimKey({ namespace, reference: id, sha256 })),
    )
  )
    fail('static_edition_claim_relation_invalid');
  return { relations: links, subjects };
}

function validateStaticScene(scene) {
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
  const mixed = Boolean(
    (scene.nodes.length || scene.edges.length || scene.groups?.length) && scene.claimCards?.length,
  );
  if (!mixed && (scene.claimRelationLinks !== undefined || scene.claimSubjectLinks !== undefined))
    fail('static_edition_claim_relation_invalid');
  if (
    scene.editorialAssertions.some(
      (item) =>
        item?.kind !== 'editorial' ||
        item.semanticStatus !== 'editor-attributed-unverified' ||
        !text(item.statement) ||
        !text(item.proponent),
    )
  )
    fail('static_edition_editorial_invalid');
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
  return mixed;
}

function checkedRelationCaption(edge) {
  const caption = edge.caption;
  if (caption === undefined) return null;
  if (!caption || typeof caption !== 'object' || Array.isArray(caption))
    fail('static_edition_relation_caption_invalid');
  const box = caption.box;
  const point = caption.point;
  if (
    edge.relations.length !== 1 ||
    typeof edge.relations[0]?.kind !== 'string' ||
    caption.text !== edge.relations[0].kind.replaceAll('-', ' ') ||
    !Array.isArray(point) ||
    point.length !== 2 ||
    !point.every(Number.isFinite) ||
    !box ||
    ![box.x, box.y, box.w, box.h].every(Number.isFinite) ||
    box.w <= 0 ||
    box.h <= 0 ||
    point[0] - advance(caption.text, 14) / 2 < box.x ||
    point[0] + advance(caption.text, 14) / 2 > box.x + box.w ||
    point[1] - 14 < box.y ||
    point[1] + 4 > box.y + box.h
  )
    fail('static_edition_relation_caption_invalid');
  return caption;
}

/** Paint an unqualified, source-bound static Scene without acquiring meaning. */
export function composeStaticEditionSvg(scene, options = {}) {
  const idPrefix = options.idPrefix ?? '';
  const fragment = options.fragment === true;
  if (
    Object.keys(options).some((key) => !['idPrefix', 'fragment'].includes(key)) ||
    typeof idPrefix !== 'string' ||
    !/^[a-z0-9-]*$/u.test(idPrefix) ||
    (options.fragment !== undefined && typeof options.fragment !== 'boolean')
  )
    fail('static_edition_render_options_invalid');
  const mixed = validateStaticScene(scene);
  const claimLinks = mixed ? linkedClaims(scene) : null;
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
  const relationCarriers = scene.edges
    .flatMap(({ relations }) => relations)
    .map((relation, index) => ({
      graphicId: `${idPrefix}r-${index}`,
      source: {
        namespace: relation.namespace,
        reference: relation.reference,
        sha256: relation.sha256,
      },
    }));
  for (const group of scene.groups ?? []) {
    const lines = wrap(group.label, group.width - 52, 14, 2);
    const headerBottom =
      group.y + groupTitleBaseline + (lines.length - 1) * groupTitleLeading + groupTitleClearance;
    if (
      headerBottom >= group.y + group.height ||
      scene.nodes.some(
        (node) =>
          node.x < group.x + group.width &&
          node.x + node.width > group.x &&
          node.y < headerBottom &&
          node.y + node.height > group.y,
      )
    )
      fail('static_edition_group_heading_collision');
    const headingX = groupHeadingX(group, lines, scene.edges);
    graph.push(
      `<rect x="${number(group.x)}" y="${number(group.y)}" width="${number(group.width)}" height="${number(group.height)}" rx="18" fill="#eef0e9"/>`,
    );
    for (const [index, line] of lines.entries())
      graph.push(
        `<text x="${number(headingX)}" y="${number(group.y + groupTitleBaseline + index * groupTitleLeading)}" fill="#526158" font-size="14" font-weight="600">${escape(line)}</text>`,
      );
  }
  let relationOffset = 0;
  for (const edge of scene.edges) {
    if (!labels.has(key(edge.from)) || !labels.has(key(edge.to)))
      fail('static_edition_relation_endpoint_missing');
    const caption = checkedRelationCaption(edge);
    const directions = new Set(edge.relations.map(({ direction }) => direction));
    if (directions.size !== 1 || !['forward', 'bidirectional'].includes([...directions][0]))
      fail('static_edition_direction_unrepresentable');
    const points = edge.points.map(([x, y]) => `${number(x)} ${number(y)}`);
    const start = directions.has('bidirectional')
      ? ` marker-start="url(#${idPrefix}source-arrow)"`
      : '';
    const carrierOnGraph = caption && edge.relations[0].label === null;
    if (carrierOnGraph)
      graph.push(`<g data-graphic-id="${relationCarriers[relationOffset].graphicId}">`);
    graph.push(
      `<path d="M ${points.join(' L ')}" fill="none" stroke="#60786a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"${start} marker-end="url(#${idPrefix}source-arrow)"/>`,
    );
    if (caption)
      graph.push(
        `<text x="${number(caption.point[0])}" y="${number(caption.point[1])}" text-anchor="middle" fill="#526158" font-size="14" font-weight="600">${escape(caption.text)}</text>`,
      );
    if (carrierOnGraph) graph.push('</g>');
    relationOffset += edge.relations.length;
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
    const graphicId = `${idPrefix}n-${position}`;
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
  y = graphTop + 28;
  const notes = [];
  if (!fragment)
    y = namedSection(
      notes,
      'READER QUESTIONS',
      scene.questions.map(({ text }) => ({ text })),
      notesX,
      y,
      notesWidth,
    );
  let relationIndex = 0;
  const relationItems = scene.edges.flatMap((edge) =>
    edge.relations.flatMap((relation) => {
      const graphicId = relationCarriers[relationIndex++].graphicId;
      if (edge.caption && relation.label === null) return [];
      const qualifiers = [relation.label, ...(edge.caption ? [] : [relation.kind])]
        .filter((value, index, all) => value && all.indexOf(value) === index)
        .join(' · ');
      return [
        {
          text: `${mixed ? `${String(relationIndex).padStart(2, '0')} · ` : ''}${labels.get(key(edge.from))} ${relation.direction === 'bidirectional' ? '↔' : '→'} ${labels.get(key(edge.to))}${qualifiers ? ` · ${qualifiers}` : ''}`,
          graphicId,
        },
      ];
    }),
  );
  const relationOnly =
    scene.claimCards !== undefined && scene.claimCards.length === 0 && scene.edges.length > 0;
  const linkedRelationIds = new Set(
    (scene.claimRelationLinks ?? []).map(({ relationAssertionId }) => relationAssertionId),
  );
  const unlinkedRelation =
    scene.claimCards !== undefined &&
    scene.sourceAssertionCarriers.some(
      ({ assertionId, kind }) => kind === 'relation' && !linkedRelationIds.has(assertionId),
    );
  y = namedSection(
    notes,
    'SOURCE STATUS',
    unlinkedRelation
      ? [{ text: relationOnly ? SOURCE_REPORTED_TOPOLOGY_NOTE : UNLINKED_RELATION_NOTE }]
      : [],
    notesX,
    y,
    notesWidth,
  );
  y = namedSection(notes, 'SOURCE RELATIONS', relationItems, notesX, y, notesWidth);
  y = namedSection(
    notes,
    'EDITORIAL ASSERTIONS',
    scene.editorialAssertions.map(({ statement, proponent }) => ({
      text: `${statement} · Editorial judgment · ${proponent} · unverified`,
    })),
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
  const structureHeight = Math.max(300, (bounds?.height ?? 0) + 120);
  const notesHeight = y - graphTop + 32;
  const claimCards = scene.claimCards ?? [];
  const { common, commonLabels } = factorClaimFacts(claimCards);
  const paintClaims = (placement) => {
    const claimSectionY =
      graphTop +
      (placement === 'side' ? structureHeight : Math.max(structureHeight, notesHeight)) +
      34;
    const claimPlate = [];
    const claimCarriers = [];
    const claimX = mixed ? 60 : 74;
    const claimWidth = mixed && placement === 'footer' ? width - 120 : graphWidth - 32;
    let claimY = mixed ? claimSectionY : graphTop + 66;
    let denseSingleColumnCards = 0;
    if (mixed && !fragment)
      claimY =
        textLines(claimPlate, 'SOURCE CLAIMS', claimX, claimY, claimWidth, 11, '#66736b', 600, 1) +
        18;
    if (common.length) {
      claimY =
        textLines(
          claimPlate,
          'COMMON TO ALL SELECTED CLAIMS',
          claimX,
          claimY,
          claimWidth,
          11,
          '#66736b',
          600,
          2,
        ) + 8;
      for (const { label, value } of common)
        claimY =
          textLines(
            claimPlate,
            `${label}: ${value}`,
            claimX,
            claimY,
            claimWidth,
            14,
            '#27352e',
            400,
            8,
          ) + 5;
      claimPlate.push(
        `<line x1="${claimX}" y1="${number(claimY + 5)}" x2="${number(mixed ? claimX + claimWidth : 60 + graphWidth - 16)}" y2="${number(claimY + 5)}" stroke="#aebbb0" stroke-width="1"/>`,
      );
      claimY += 27;
    }
    if (mixed) {
      const relationPositions = new Map(
        scene.edges
          .flatMap((edge) => edge.relations)
          .map((relation, index) => [relationKey(relation), index]),
      );
      const positionFor = (claim) => {
        const identity = claimKey({
          namespace: claim.namespace,
          reference: claim.id,
          sha256: claim.sha256,
        });
        const relationIdentity = claimLinks.relations.get(identity);
        if (relationIdentity === undefined && claimLinks.subjects.has(identity))
          return relationPositions.size;
        const position = relationPositions.get(relationIdentity);
        if (position === undefined) fail('static_edition_claim_relation_invalid');
        return position;
      };
      const orderedClaims = [...claimCards].sort(
        (left, right) => positionFor(left) - positionFor(right),
      );
      const columns = Math.min(
        claimCards.length,
        Math.max(1, Math.floor((claimWidth + 24) / (480 + 24))),
      );
      const cardWidth = columns === 1 ? claimWidth : (claimWidth - (columns - 1) * 24) / columns;
      for (let row = 0; row < claimCards.length; row += columns) {
        let rowBottom = claimY;
        for (let column = 0; column < columns && row + column < claimCards.length; column += 1) {
          const claim = orderedClaims[row + column];
          const graphicId = `${idPrefix}c-${row + column}`;
          const relationPosition = positionFor(claim);
          const x =
            columns === 1 && placement === 'footer'
              ? (width - cardWidth) / 2
              : claimX + column * (cardWidth + 24);
          const content = [];
          let cardY = claimY + 32;
          cardY =
            textLines(
              content,
              claimLinks.subjects.has(
                claimKey({ namespace: claim.namespace, reference: claim.id, sha256: claim.sha256 }),
              )
                ? 'ON SOURCE ENTITY'
                : `ON SOURCE RELATION ${String(relationPosition + 1).padStart(2, '0')}`,
              x + 16,
              cardY,
              cardWidth - 32,
              11,
              '#66736b',
              600,
              2,
            ) + 13;
          const facts = claim.facts.filter(({ label }) => !commonLabels.has(label));
          const twoColumn = cardWidth >= 900 && facts.length >= 6;
          if (facts.length >= 6 && !twoColumn) denseSingleColumnCards += 1;
          const columnWidth = twoColumn ? (cardWidth - 60) / 2 : cardWidth - 32;
          const columnY = [cardY, cardY];
          const split = Math.ceil(facts.length / 2);
          for (const [index, fact] of facts.entries()) {
            const column = twoColumn && index >= split ? 1 : 0;
            columnY[column] =
              textLines(
                content,
                `${fact.label}: ${fact.value}`,
                x + 16 + column * (columnWidth + 28),
                columnY[column],
                columnWidth,
                14,
                '#27352e',
                400,
                8,
              ) + 5;
          }
          cardY = Math.max(...columnY);
          const bottom = cardY + 16;
          claimPlate.push(
            `<g data-graphic-id="${graphicId}">`,
            `<rect x="${number(x)}" y="${number(claimY)}" width="${number(cardWidth)}" height="${number(bottom - claimY)}" rx="12" fill="#fffefa" stroke="#c4ccc2" stroke-width="1"/>`,
            ...content,
            '</g>',
          );
          claimCarriers.push({
            graphicId,
            source: { namespace: claim.namespace, reference: claim.id, sha256: claim.sha256 },
          });
          rowBottom = Math.max(rowBottom, bottom);
        }
        claimY = rowBottom + 24;
      }
    } else {
      for (const [position, claim] of claimCards.entries()) {
        const graphicId = `${idPrefix}c-${position}`;
        claimCarriers.push({
          graphicId,
          source: { namespace: claim.namespace, reference: claim.id, sha256: claim.sha256 },
        });
        claimPlate.push(`<g data-graphic-id="${graphicId}">`);
        for (const fact of claim.facts) {
          if (commonLabels.has(fact.label)) continue;
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
    }
    return {
      claimSectionY,
      claimPlate,
      claimCarriers,
      claimY,
      claimX,
      claimWidth,
      denseSingleColumnCards,
    };
  };
  const heightFor = ({ claimCarriers, claimY }) =>
    Math.max(structureHeight, notesHeight, claimCarriers.length ? claimY - graphTop + 32 : 0);
  const attemptClaims = (placement) => {
    try {
      return paintClaims(placement);
    } catch (error) {
      if (error?.code === 'static_edition_text_unrepresentable') return null;
      throw error;
    }
  };
  const footer = attemptClaims('footer');
  const side = mixed ? attemptClaims('side') : null;
  if (!footer && !side) fail('static_edition_text_unrepresentable');
  const useSide =
    !fragment &&
    side &&
    (!footer ||
      (side.denseSingleColumnCards <= footer.denseSingleColumnCards &&
        heightFor(side) < heightFor(footer)));
  const chosen = useSide ? side : footer;
  if (!chosen) fail('static_edition_text_unrepresentable');
  const { claimSectionY, claimPlate, claimCarriers } = chosen;
  const contentHeight = heightFor(chosen);
  const translateX = bounds ? 60 + (graphWidth - bounds.width) / 2 - bounds.x : 0;
  const translateY = bounds
    ? mixed
      ? graphTop + 42 - bounds.y
      : graphTop + 42 + (contentHeight - 42 - bounds.height) / 2 - bounds.y
    : 0;
  const height = Math.ceil(graphTop + contentHeight + 48);
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
  const bodyPrelude = [
    `<defs><marker id="${idPrefix}source-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto-start-reverse"><path d="M 0 0 L 10 4 L 0 8 Z" fill="#60786a"/></marker></defs>`,
    `<line x1="60" y1="${number(graphTop - 18)}" x2="${width - 60}" y2="${number(graphTop - 18)}" stroke="#c4ccc2" stroke-width="1"/>`,
    `<line x1="${number(notesX - gap / 2)}" y1="${number(graphTop)}" x2="${number(notesX - gap / 2)}" y2="${number(mixed && !useSide ? graphTop + Math.max(structureHeight, notesHeight) - 18 : height - 48)}" stroke="#d3dbd1" stroke-width="1"/>`,
    ...(mixed
      ? [
          `<line x1="60" y1="${number(claimSectionY - 24)}" x2="${number(useSide ? 60 + graphWidth - 32 : width - 60)}" y2="${number(claimSectionY - 24)}" stroke="#c4ccc2" stroke-width="1"/>`,
        ]
      : []),
  ];
  const bodyContent = [
    `<text x="60" y="${number(graphTop + 28)}" fill="#66736b" font-size="11" font-weight="600">${claimCarriers.length && !mixed ? 'SOURCE CLAIMS' : 'SOURCE STRUCTURE'}</text>`,
    `<g transform="translate(${number(translateX)} ${number(translateY)})">`,
    ...graph,
    '</g>',
    ...claimPlate,
    ...notes,
  ];
  const carriers = {
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
  };
  if (fragment) {
    return {
      parts: {
        graph: graph.join('\n'),
        bounds,
        relations: relationItems,
        claim:
          claimCarriers.length > 0
            ? {
                markup: claimPlate.join('\n'),
                x: chosen.claimX,
                y: mixed ? chosen.claimSectionY : graphTop + 66,
                width: chosen.claimWidth,
                height: chosen.claimY - (mixed ? chosen.claimSectionY : graphTop + 66),
              }
            : null,
      },
      rasterWidth,
      carriers,
    };
  }
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="edition-title edition-description" font-family="JetBrains Mono" font-weight="400" font-style="normal">`,
    `<title id="edition-title">${escape(scene.title)}</title>`,
    `<desc id="edition-description">${escape(scene.summary)}</desc>`,
    `<rect width="${width}" height="${height}" fill="#f5f3ed"/>`,
    ...bodyPrelude,
    ...header,
    ...bodyContent,
    '</svg>',
    '',
  ];
  return {
    bytes: Buffer.from(lines.join('\n')),
    width,
    height,
    rasterWidth,
    carriers,
  };
}
