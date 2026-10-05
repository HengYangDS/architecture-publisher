import { fail } from '../../src/protocol/values.mjs';
import { editorialFraming } from '../../src/scene/framing.mjs';
import { renderFigureIcon } from '../icons/index.mjs';
import { composeFigureTypeLegend, figureIconLicenseMetadata } from './figure-types.mjs';
import { UNLINKED_RELATION_NOTE } from '../../src/scene/claim-relations.mjs';

const colors = {
  paper: '#f8f7f2',
  ink: '#24362e',
  muted: '#5c6d60',
  rule: '#bac8bb',
  source: '#617e69',
  editorial: '#a46f4c',
};
const margin = 56;
const nodeWidth = 142;
const nodeHeight = 50;
const rankGap = 142;
const roleGap = 152;
const nodeKey = ({ namespace, id }) => JSON.stringify([namespace, id]);
const sourceKey = ({ namespace, reference, sha256 }) =>
  JSON.stringify([namespace, reference, sha256]);
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const number = (value) => {
  if (!Number.isFinite(value) || Math.abs(value) > 10_000_000)
    fail('static_responsibility_geometry_invalid');
  return Number(value.toFixed(2));
};
const advance = (value, size) => [...value].length * size * 0.61;

function wrap(value, width, size, limit = 6) {
  if (typeof value !== 'string' || !value.trim() || width < size * 3)
    fail('static_responsibility_text_unrepresentable');
  const result = [];
  let current = '';
  for (const word of value.trim().split(/\s+/u)) {
    const joined = current ? `${current} ${word}` : word;
    if (advance(joined, size) <= width) {
      current = joined;
      continue;
    }
    if (current) result.push(current);
    if (advance(word, size) > width || result.length >= limit)
      fail('static_responsibility_text_unrepresentable');
    current = word;
  }
  if (current) result.push(current);
  if (result.length > limit) fail('static_responsibility_text_unrepresentable');
  return result;
}

function textLines(
  output,
  value,
  x,
  y,
  width,
  size,
  color,
  weight = 400,
  limit = 6,
  anchor = 'start',
) {
  const content = wrap(value, width, size, limit);
  for (const [index, line] of content.entries())
    output.push(
      `<text x="${number(x)}" y="${number(y + index * size * 1.43)}" text-anchor="${anchor}" fill="${color}" font-size="${size}" font-weight="${weight}">${escape(line)}</text>`,
    );
  return y + content.length * size * 1.43;
}

function selectedForm(scene) {
  const form = scene?.visualForm;
  if (
    scene?.schema !== 'architecture.edition-static-responsibility-scene/v1' ||
    scene.completeness !== 'unqualified-scene' ||
    form?.schema !== 'architecture.visual-form/v1' ||
    form.kind !== 'responsibility' ||
    !Array.isArray(form.roles) ||
    !form.roles.length ||
    form.roles.length > 6 ||
    !Array.isArray(form.handoffs) ||
    scene.groups?.length !== form.roles.length ||
    !Array.isArray(scene.nodes) ||
    !scene.nodes.length ||
    !Array.isArray(scene.relations) ||
    !Array.isArray(scene.sourceAssertionCarriers) ||
    !Array.isArray(scene.editorialAssertions) ||
    scene.questionIds?.length !== 1 ||
    scene.questions?.length !== 1 ||
    scene.questions[0].id !== scene.questionIds[0] ||
    !Array.isArray(scene.limitsByQuestion?.[scene.questionIds[0]])
  )
    fail('static_responsibility_scene_invalid');
  const groups = new Map(scene.groups.map((item) => [item.id, item]));
  const nodes = new Map(scene.nodes.map((item) => [nodeKey(item), item]));
  const editorial = new Map(scene.editorialAssertions.map((item) => [item.id, item]));
  const sources = new Map(scene.sourceAssertionCarriers.map((item) => [item.assertionId, item]));
  const claims = new Map(
    (scene.claimCards ?? []).map((card) => [
      sourceKey({ namespace: card.namespace, reference: card.id, sha256: card.sha256 }),
      card,
    ]),
  );
  if (groups.size !== scene.groups.length || nodes.size !== scene.nodes.length)
    fail('static_responsibility_identity_ambiguous');
  const basis = (id) => {
    const item = editorial.get(id);
    if (item) {
      if (item.kind !== 'editorial' || item.semanticStatus !== 'editor-attributed-unverified')
        fail('static_responsibility_basis_invalid');
      return {
        statement: item.statement,
        attribution: `Editorial judgment · ${item.proponent} · unverified`,
      };
    }
    const selected = sources.get(id);
    const ref = selected?.kind === 'claim' ? selected.claimRefs?.[0] : null;
    if (!ref || !claims.has(sourceKey(ref))) fail('static_responsibility_basis_invalid');
    return {
      statement: 'Selected source Claim; editorial interpretation',
      attribution: 'Source-attributed; interpretation not endorsed',
    };
  };
  const roles = form.roles.map(({ group, basis: id }) => {
    const selected = groups.get(group);
    if (!selected || selected.elements.length > 4)
      fail('static_responsibility_group_unrepresentable');
    return { group: selected, basis: basis(id) };
  });
  if (new Set(roles.map(({ group }) => group.id)).size !== groups.size)
    fail('static_responsibility_group_invalid');
  const roleByNode = new Map();
  for (const [index, { group }] of roles.entries())
    for (const member of group.elements) {
      const id = nodeKey(member);
      if (!nodes.has(id) || roleByNode.has(id)) fail('static_responsibility_group_invalid');
      roleByNode.set(id, index);
    }
  if (roleByNode.size !== nodes.size) fail('static_responsibility_group_invalid');
  const handoffs = form.handoffs.map(({ from, to, basis: id }) => {
    const first = roles.findIndex(({ group }) => group.id === from);
    const last = roles.findIndex(({ group }) => group.id === to);
    if (first < 0 || last < 0 || first === last) fail('static_responsibility_handoff_invalid');
    return { first, last, basis: basis(id) };
  });
  return { roles, nodes, roleByNode, handoffs };
}

function groupRanks(group, relations) {
  const order = group.elements.map(nodeKey);
  const pending = new Set(order);
  const rank = new Map(order.map((id) => [id, 0]));
  const parents = new Map(order.map((id) => [id, new Set()]));
  for (const relation of relations) parents.get(nodeKey(relation.to)).add(nodeKey(relation.from));
  while (pending.size) {
    const next = order.find(
      (id) => pending.has(id) && [...parents.get(id)].every((parent) => !pending.has(parent)),
    );
    if (!next) fail('static_responsibility_graph_unrepresentable');
    pending.delete(next);
    for (const relation of relations)
      if (nodeKey(relation.from) === next) {
        const target = nodeKey(relation.to);
        rank.set(target, Math.max(rank.get(target), rank.get(next) + 1));
      }
  }
  const buckets = new Map();
  for (const id of order) {
    const level = rank.get(id);
    buckets.set(level, [...(buckets.get(level) ?? []), id]);
  }
  if (buckets.size > 3 || [...buckets.values()].some((bucket) => bucket.length > 2))
    fail('static_responsibility_graph_unrepresentable');
  return buckets;
}

function layout(scene, roles, roleByNode) {
  const widths = roles.map(({ group }) => 210 + 60 * (group.elements.length - 1));
  const xs = widths.map(
    (_, index) => margin + widths.slice(0, index).reduce((a, b) => a + b, 0) + roleGap * index,
  );
  const width = margin * 2 + widths.reduce((a, b) => a + b, 0) + roleGap * (roles.length - 1);
  const internal = roles.map(() => []);
  const cross = [];
  const pairs = new Set();
  for (const relation of scene.relations) {
    const from = roleByNode.get(nodeKey(relation.from));
    const to = roleByNode.get(nodeKey(relation.to));
    if (from === undefined || to === undefined)
      fail('static_responsibility_relation_endpoint_missing');
    if (from === to) internal[from].push(relation);
    else {
      const pair = `${from}:${to}`;
      if (to !== from + 1 || pairs.has(pair)) fail('static_responsibility_graph_unrepresentable');
      pairs.add(pair);
      cross.push(relation);
    }
  }
  const buckets = roles.map(({ group }, index) => groupRanks(group, internal[index]));
  const highest = Math.max(0, ...buckets.flatMap((item) => [...item.keys()]));
  const positions = new Map();
  const graphTop = 265;
  for (const [roleIndex, levels] of buckets.entries()) {
    if (roles[roleIndex].group.elements.length === 1) continue;
    for (const [level, ids] of levels)
      for (const [at, id] of ids.entries())
        positions.set(id, {
          x: xs[roleIndex] + widths[roleIndex] / 2 + (at - (ids.length - 1) / 2) * 166,
          y: graphTop + level * rankGap,
        });
  }
  if (!positions.size)
    positions.set(nodeKey(roles[0].group.elements[0]), { x: xs[0] + widths[0] / 2, y: graphTop });
  for (let pass = 0; pass < roles.length; pass += 1)
    for (const relation of cross) {
      const first = nodeKey(relation.from);
      const last = nodeKey(relation.to);
      if (positions.has(first) && !positions.has(last)) {
        const role = roleByNode.get(last);
        positions.set(last, { x: xs[role] + widths[role] / 2, y: positions.get(first).y });
      } else if (positions.has(last) && !positions.has(first)) {
        const role = roleByNode.get(first);
        positions.set(first, { x: xs[role] + widths[role] / 2, y: positions.get(last).y });
      }
    }
  for (const [index, { group }] of roles.entries())
    for (const member of group.elements) {
      const id = nodeKey(member);
      if (!positions.has(id))
        positions.set(id, {
          x: xs[index] + widths[index] / 2,
          y: graphTop + (highest * rankGap) / 2,
        });
    }
  return {
    xs,
    widths,
    width,
    positions,
    graphTop,
    graphBottom: graphTop + highest * rankGap + nodeHeight,
  };
}

function sourceRelation(relation, position, roleByNode, geometry, output) {
  const first = geometry.positions.get(nodeKey(relation.from));
  const last = geometry.positions.get(nodeKey(relation.to));
  const internal = roleByNode.get(nodeKey(relation.from)) === roleByNode.get(nodeKey(relation.to));
  const start = internal
    ? [first.x, first.y + nodeHeight]
    : [first.x + nodeWidth / 2, first.y + nodeHeight / 2];
  const end = internal
    ? [last.x, last.y - 4]
    : [last.x - nodeWidth / 2 - 4, last.y + nodeHeight / 2];
  if (
    (internal && end[1] <= start[1]) ||
    (!internal && Math.abs(start[1] - end[1]) > nodeHeight / 2)
  )
    fail('static_responsibility_graph_unrepresentable');
  const label = relation.kind?.replaceAll('-', ' ') || 'source relation';
  if (advance(label, 11) > (internal ? 126 : roleGap + 26))
    fail('static_responsibility_relation_label_unrepresentable');
  const graphicId = `r-${position}`;
  const d = `M ${number(start[0])} ${number(start[1])} L ${number(end[0])} ${number(end[1])}`;
  const middleX = (start[0] + end[0]) / 2;
  const middleY = (start[1] + end[1]) / 2;
  const side = end[0] < start[0] ? -1 : 1;
  const labelX = internal ? middleX + side * 22 : middleX;
  const labelY = internal ? middleY + 4 : middleY - 10;
  const anchor = internal ? (side < 0 ? 'end' : 'start') : 'middle';
  output.push(
    `<g data-graphic-id="${graphicId}" data-source-relation="${graphicId}">`,
    `<path d="${d}" fill="none" stroke="${colors.source}" stroke-width="1.8" stroke-linecap="round" marker-end="url(#source-arrow)"${relation.direction === 'bidirectional' ? ' marker-start="url(#source-arrow)"' : ''}/>`,
    `<text x="${number(labelX)}" y="${number(labelY)}" text-anchor="${anchor}" fill="${colors.source}" font-size="11" font-weight="600">${escape(label)}</text>`,
    '</g>',
  );
  return {
    graphicId,
    source: {
      namespace: relation.origin.namespace,
      reference: relation.id,
      sha256: relation.origin.sha256,
    },
    path: d,
  };
}

/** Paint a selected responsibility map without borrowing interactive geometry or DOM. */
export function composeStaticResponsibilitySvg(scene, { icons } = {}) {
  const { roles, nodes, roleByNode, handoffs } = selectedForm(scene);
  const geometry = layout(scene, roles, roleByNode);
  const figureTypes = composeFigureTypeLegend(scene.nodes, icons, geometry.width - 2 * margin);
  const rasterWidth = scene.requestedWidth ?? 1800;
  if (!Number.isSafeInteger(rasterWidth) || rasterWidth < 320 || rasterWidth > 12_000)
    fail('static_responsibility_width_invalid');
  const body = [];
  let y = 68;
  y =
    textLines(body, scene.title, margin, y, geometry.width - 2 * margin, 30, colors.ink, 600, 2) +
    6;
  y =
    textLines(
      body,
      scene.questions[0].text,
      margin,
      y,
      geometry.width - 2 * margin,
      16,
      colors.ink,
      400,
      3,
    ) + 5;
  y =
    textLines(
      body,
      scene.summary,
      margin,
      y,
      geometry.width - 2 * margin,
      13,
      colors.muted,
      400,
      4,
    ) + 10;
  body.push(
    `<line x1="${margin}" y1="${number(y)}" x2="${geometry.width - margin}" y2="${number(y)}" stroke="${colors.ink}" stroke-width="1.5"/>`,
  );
  const roleRuleY =
    y +
    32 +
    (Math.max(
      ...roles.map(
        ({ group }, index) => wrap(group.label, geometry.widths[index] - 12, 16, 2).length,
      ),
    ) -
      1) *
      16 *
      1.43 +
    16;
  if (roleRuleY + 12 >= geometry.graphTop) fail('static_responsibility_header_unrepresentable');
  for (const [index, { group }] of roles.entries()) {
    const center = geometry.xs[index] + geometry.widths[index] / 2;
    textLines(
      body,
      group.label,
      center,
      y + 32,
      geometry.widths[index] - 12,
      16,
      colors.ink,
      600,
      2,
      'middle',
    );
    body.push(
      `<line data-role-rule="g-${index}" x1="${number(geometry.xs[index])}" y1="${number(roleRuleY)}" x2="${number(geometry.xs[index] + geometry.widths[index])}" y2="${number(roleRuleY)}" stroke="${colors.rule}"/>`,
    );
  }
  body.push(
    `<defs><marker id="source-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto-start-reverse" markerUnits="strokeWidth"><path d="M 0 0 L 7 3.5 L 0 7" fill="none" stroke="${colors.source}" stroke-width="1.2"/></marker><marker id="editorial-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 7 3.5 L 0 7" fill="none" stroke="${colors.editorial}" stroke-width="1.2"/></marker></defs>`,
  );
  const relationCarriers = scene.relations.map((relation, index) =>
    sourceRelation(relation, index, roleByNode, geometry, body),
  );
  const nodeCarriers = [];
  const groupCarriers = [];
  for (const [index, { group }] of roles.entries()) {
    const nodeIds = [];
    body.push(`<g data-graphic-id="g-${index}">`);
    for (const member of group.elements) {
      const node = nodes.get(nodeKey(member));
      const position = geometry.positions.get(nodeKey(member));
      const graphicId = `n-${nodeCarriers.length}`;
      const labels = wrap(node.label, nodeWidth - 46, 12, 2);
      body.push(
        `<g data-graphic-id="${graphicId}" color="${colors.source}">`,
        `<rect x="${number(position.x - nodeWidth / 2)}" y="${number(position.y)}" width="${nodeWidth}" height="${nodeHeight}" rx="7" fill="#fffefa" stroke="${colors.source}" stroke-width="1.4"/>`,
        renderFigureIcon(node.icon, icons, {
          x: position.x - nodeWidth / 2 + 12,
          y: position.y + (nodeHeight - 13) / 2,
          size: 13,
        }),
      );
      for (const [line, text] of labels.entries())
        body.push(
          `<text x="${number(position.x + 12)}" y="${number(position.y + 21 + line * 16)}" text-anchor="middle" fill="${colors.ink}" font-size="12" font-weight="600">${escape(text)}</text>`,
        );
      body.push('</g>');
      nodeCarriers.push({
        graphicId,
        source: { namespace: node.namespace, id: node.id, sha256: node.sha256 },
      });
      nodeIds.push(graphicId);
    }
    body.push('</g>');
    groupCarriers.push({
      graphicId: `g-${index}`,
      editorialId: group.id,
      label: group.label,
      nodeIds,
    });
  }
  y = Math.max(y + 70, geometry.graphBottom + 35);
  if (figureTypes) {
    body.push(`<g transform="translate(${margin} ${number(y - 18)})">${figureTypes.markup}</g>`);
    y += figureTypes.height + 18;
  }
  const roleNotes = roles.map(({ basis }, index) => {
    const out = [];
    const x = geometry.xs[index] + 4;
    let bottom =
      textLines(out, basis.statement, x, y, geometry.widths[index] - 8, 12, colors.ink, 400, 5) + 4;
    bottom = textLines(
      out,
      basis.attribution,
      x,
      bottom,
      geometry.widths[index] - 8,
      10,
      colors.muted,
      400,
      5,
    );
    return { out, bottom };
  });
  for (const note of roleNotes) body.push(...note.out);
  y = Math.max(...roleNotes.map(({ bottom }) => bottom)) + 21;
  for (const relation of scene.relations.filter((item) => item.label)) {
    const from = nodes.get(nodeKey(relation.from));
    const to = nodes.get(nodeKey(relation.to));
    y =
      textLines(
        body,
        `${from.label} → ${to.label} · ${relation.label}`,
        margin,
        y,
        geometry.width - 2 * margin,
        10,
        colors.muted,
        400,
        4,
      ) + 4;
  }
  for (const handoff of handoffs) {
    const start = geometry.xs[handoff.first] + geometry.widths[handoff.first] / 2;
    const end = geometry.xs[handoff.last] + geometry.widths[handoff.last] / 2;
    const middle = (start + end) / 2;
    const captionWidth = Math.min(geometry.width - 2 * margin, 760);
    y += 20;
    body.push(
      `<path d="M ${number(start)} ${number(y - 9)} L ${number(start)} ${number(y)} L ${number(end)} ${number(y)}" fill="none" stroke="${colors.editorial}" stroke-width="2" marker-end="url(#editorial-arrow)"/>`,
    );
    const labelBottom = textLines(
      body,
      `EDITORIAL HANDOFF · ${roles[handoff.first].group.label} → ${roles[handoff.last].group.label}`,
      middle,
      y + 26,
      captionWidth,
      10,
      colors.editorial,
      600,
      2,
      'middle',
    );
    y =
      textLines(
        body,
        handoff.basis.statement,
        middle,
        labelBottom + 9,
        captionWidth,
        12,
        colors.ink,
        400,
        4,
        'middle',
      ) + 3;
    y =
      textLines(
        body,
        handoff.basis.attribution,
        middle,
        y,
        captionWidth,
        10,
        colors.muted,
        400,
        3,
        'middle',
      ) + 12;
  }
  const linkedRelations = new Set(
    (scene.claimRelationLinks ?? []).map(({ relationAssertionId }) => relationAssertionId),
  );
  if (
    scene.claimCards !== undefined &&
    scene.relations.length &&
    scene.sourceAssertionCarriers.some(
      ({ assertionId, kind }) => kind === 'relation' && !linkedRelations.has(assertionId),
    )
  )
    y =
      textLines(
        body,
        UNLINKED_RELATION_NOTE,
        margin,
        y + 12,
        geometry.width - 2 * margin,
        10,
        colors.muted,
        400,
        3,
      ) + 8;
  const claimCarriers = [];
  if (scene.claimCards?.length) {
    y += 16;
    body.push(
      `<line x1="${margin}" y1="${number(y)}" x2="${geometry.width - margin}" y2="${number(y)}" stroke="${colors.rule}"/>`,
    );
    y += 27;
    body.push(
      `<text x="${margin}" y="${number(y)}" fill="${colors.editorial}" font-size="11" font-weight="600">SELECTED SOURCE CLAIMS</text>`,
    );
    y += 24;
    for (const card of scene.claimCards) {
      if (!Array.isArray(card.facts) || !card.facts.length)
        fail('static_responsibility_claim_invalid');
      const graphicId = `c-${claimCarriers.length}`;
      body.push(`<g data-graphic-id="${graphicId}">`);
      const claimAssertion = scene.sourceAssertionCarriers.find(
        ({ kind, claimRefs }) =>
          kind === 'claim' &&
          claimRefs?.some(
            (ref) =>
              sourceKey(ref) ===
              sourceKey({ namespace: card.namespace, reference: card.id, sha256: card.sha256 }),
          ),
      );
      const linked = scene.claimRelationLinks?.find(
        ({ claimAssertionId }) => claimAssertionId === claimAssertion?.assertionId,
      );
      const relationRef = scene.sourceAssertionCarriers.find(
        ({ assertionId }) => assertionId === linked?.relationAssertionId,
      )?.relationRefs?.[0];
      const relation = relationRef
        ? scene.relations.find(
            (item) =>
              sourceKey({
                namespace: item.origin.namespace,
                reference: item.id,
                sha256: item.origin.sha256,
              }) === sourceKey(relationRef),
          )
        : null;
      if (linked && !relation) fail('static_responsibility_claim_relation_invalid');
      const subjectLink = scene.claimSubjectLinks?.find(
        ({ claimAssertionId }) => claimAssertionId === claimAssertion?.assertionId,
      );
      const subject = subjectLink ? nodes.get(nodeKey(subjectLink.subject)) : null;
      if (subjectLink && (!subject || subject.sha256 !== subjectLink.subject.sha256))
        fail('static_responsibility_claim_relation_invalid');
      if (relation && subjectLink) fail('static_responsibility_claim_relation_invalid');
      const heading = relation
        ? `CLAIM ON ${nodes.get(nodeKey(relation.from)).label} → ${nodes.get(nodeKey(relation.to)).label}`
        : subject
          ? `CLAIM ON ${subject.label}`
          : null;
      if (heading) {
        y =
          textLines(body, heading, margin, y, geometry.width - 2 * margin, 12, colors.ink, 600, 2) +
          9;
      }
      const cellWidth = (geometry.width - 2 * margin - 36) / 3;
      for (let start = 0; start < card.facts.length; start += 3) {
        const cells = card.facts.slice(start, start + 3).map((fact, index) => {
          const out = [];
          const x = margin + index * (cellWidth + 18);
          let bottom = textLines(out, fact.label, x, y, cellWidth, 10, colors.muted, 600, 2) + 2;
          bottom = textLines(out, fact.value, x, bottom, cellWidth, 11, colors.ink, 400, 5) + 9;
          return { out, bottom };
        });
        for (const cell of cells) body.push(...cell.out);
        y = Math.max(...cells.map(({ bottom }) => bottom)) + 6;
      }
      body.push('</g>');
      claimCarriers.push({
        graphicId,
        source: { namespace: card.namespace, reference: card.id, sha256: card.sha256 },
      });
    }
  }
  const limits = scene.limitsByQuestion[scene.questionIds[0]];
  if (limits.length) {
    y += 10;
    body.push(
      `<line x1="${margin}" y1="${number(y)}" x2="${geometry.width - margin}" y2="${number(y)}" stroke="${colors.rule}"/>`,
    );
    for (const limit of limits)
      y =
        textLines(
          body,
          limit.reason,
          margin,
          y + 25,
          geometry.width - 2 * margin,
          11,
          colors.muted,
          400,
          4,
        ) + 4;
  }
  const framing = editorialFraming(scene.edition.editor);
  y =
    textLines(
      body,
      framing,
      margin,
      y + 25,
      geometry.width - 2 * margin,
      10,
      colors.muted,
      400,
      3,
    ) + 35;
  const height = Math.ceil(y);
  if (height > 6000) fail('static_responsibility_geometry_unrepresentable');
  const nodeGraphics = new Map(
    nodeCarriers.map(({ source, graphicId }) => [nodeKey(source), graphicId]),
  );
  const relationGraphics = new Map(
    relationCarriers.map(({ source, graphicId }) => [sourceKey(source), graphicId]),
  );
  const claimGraphics = new Map(
    claimCarriers.map(({ source, graphicId }) => [sourceKey(source), graphicId]),
  );
  const carriers = {
    nodes: nodeCarriers,
    relations: relationCarriers.map(({ graphicId, source }) => ({ graphicId, source })),
    ...(scene.claimCards === undefined ? {} : { claims: claimCarriers }),
    groups: groupCarriers,
    assertions: scene.sourceAssertionCarriers.map(
      ({ assertionId, nodeRefs, relationRefs, claimRefs }) => ({
        assertionId,
        nodeGraphicIds: nodeRefs.map((ref) => nodeGraphics.get(nodeKey(ref))),
        relationGraphicIds: relationRefs.map((ref) => relationGraphics.get(sourceKey(ref))),
        ...(scene.claimCards === undefined
          ? {}
          : { claimGraphicIds: (claimRefs ?? []).map((ref) => claimGraphics.get(sourceKey(ref))) }),
      }),
    ),
  };
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${geometry.width}" height="${height}" viewBox="0 0 ${geometry.width} ${height}" role="img" data-form="responsibility" aria-labelledby="responsibility-title responsibility-description" font-family="JetBrains Mono" font-weight="400">`,
    `<title id="responsibility-title">${escape(scene.title)}</title>`,
    `<desc id="responsibility-description">${escape(scene.questions[0].text)} ${escape(scene.summary)} ${escape(framing)}</desc>`,
    `<rect width="${geometry.width}" height="${height}" fill="${colors.paper}"/>`,
    ...body,
    ...(figureTypes ? [figureIconLicenseMetadata(icons)] : []),
    '</svg>',
    '',
  ].join('\n');
  return {
    bytes: Buffer.from(svg),
    rasterWidth,
    carriers,
    scene: {
      ...scene,
      layout: {
        width: geometry.width,
        height,
        nodes: [...geometry.positions].map(([id, position]) => ({ id, ...position })),
        relations: relationCarriers.map(({ graphicId, path }) => ({ graphicId, path })),
      },
    },
  };
}
