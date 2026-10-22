import { fail } from "../../src/protocol/values.mjs";
import { editorialFraming } from "../../src/scene/framing.mjs";
import { renderFigureIcon } from "../icons/index.mjs";
import { composeFigureTypeLegend, figureIconLicenseMetadata } from "./figure-types.mjs";
import { UNLINKED_RELATION_NOTE } from "../../src/scene/claim-relations.mjs";
import { colors, escape, number, advance, wrap, textLines } from "./responsibility-text.mjs";
import { margin, nodeWidth, nodeHeight, roleGap, layout } from "./responsibility-layout.mjs";
import { nodeKey, sourceKey, selectedForm } from "./responsibility-contract.mjs";
import { staticBodyGeometry } from "./edition-claims.mjs";
import { selectMeasuredComposition } from "./composition.mjs";
import { paintResponsibilityClaims } from "./responsibility-claims.mjs";

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
    fail("static_responsibility_graph_unrepresentable");
  const label = relation.kind?.replaceAll("-", " ") || "source relation";
  if (advance(label, 11) > (internal ? 126 : roleGap + 26))
    fail("static_responsibility_relation_label_unrepresentable");
  const graphicId = `r-${position}`;
  const d = `M ${number(start[0])} ${number(start[1])} L ${number(end[0])} ${number(end[1])}`;
  const middleX = (start[0] + end[0]) / 2;
  const middleY = (start[1] + end[1]) / 2;
  const side = end[0] < start[0] ? -1 : 1;
  const labelX = internal ? middleX + side * 22 : middleX;
  const labelY = internal ? middleY + 4 : middleY - 10;
  const anchor = internal ? (side < 0 ? "end" : "start") : "middle";
  output.push(
    `<g data-graphic-id="${graphicId}" data-source-relation="${graphicId}">`,
    `<path d="${d}" fill="none" stroke="${colors.source}" stroke-width="1.8" stroke-linecap="round" marker-end="url(#source-arrow)"${relation.direction === "bidirectional" ? ' marker-start="url(#source-arrow)"' : ""}/>`,
    `<text x="${number(labelX)}" y="${number(labelY)}" text-anchor="${anchor}" fill="${colors.source}" font-size="11" font-weight="600">${escape(label)}</text>`,
    "</g>",
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

function paintResponsibility(scene, icons, form, arrangement = {}) {
  const { roles, nodes, roleByNode, handoffs } = form;
  const geometry = layout(scene, roles, roleByNode, arrangement);
  const sourceWidth = arrangement.beside ? geometry.graphWidth : geometry.width;
  const figureTypes = composeFigureTypeLegend(scene.nodes, icons, sourceWidth - 2 * margin);
  const rasterWidth = scene.requestedWidth ?? 1800;
  if (!Number.isSafeInteger(rasterWidth) || rasterWidth < 320 || rasterWidth > 12_000)
    fail("static_responsibility_width_invalid");
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
  if (scene.summary !== undefined)
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
  if (roleRuleY + 12 >= geometry.graphTop) fail("static_responsibility_header_unrepresentable");
  const claimTop = y + 32;
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
      "middle",
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
      body.push("</g>");
      nodeCarriers.push({
        graphicId,
        source: { namespace: node.namespace, id: node.id, sha256: node.sha256 },
      });
      nodeIds.push(graphicId);
    }
    body.push("</g>");
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
        sourceWidth - 2 * margin,
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
    const captionWidth = Math.min(sourceWidth - 2 * margin, 760);
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
      "middle",
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
        "middle",
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
        "middle",
      ) + 12;
  }
  const linkedRelations = new Set(
    (scene.claimRelationLinks ?? []).map(({ relationAssertionId }) => relationAssertionId),
  );
  if (
    scene.claimCards !== undefined &&
    scene.relations.length &&
    scene.sourceAssertionCarriers.some(
      ({ assertionId, kind }) => kind === "relation" && !linkedRelations.has(assertionId),
    )
  )
    y =
      textLines(
        body,
        UNLINKED_RELATION_NOTE,
        margin,
        y + 12,
        sourceWidth - 2 * margin,
        10,
        colors.muted,
        400,
        3,
      ) + 8;
  let claimCarriers = [];
  if (scene.claimCards?.length) {
    const x = arrangement.beside ? sourceWidth - margin + 42 : margin;
    const top = arrangement.beside ? claimTop : y + 43;
    if (!arrangement.beside)
      body.push(
        `<line x1="${margin}" y1="${number(y + 16)}" x2="${geometry.width - margin}" y2="${number(y + 16)}" stroke="${colors.rule}"/>`,
      );
    body.push(
      `<text x="${number(x)}" y="${number(top)}" fill="${colors.editorial}" font-size="11" font-weight="600">SELECTED SOURCE CLAIMS</text>`,
    );
    const { columns } = staticBodyGeometry(null, scene.claimCards);
    const claims = paintResponsibilityClaims(scene, nodes, {
      x,
      y: top + 24,
      width: geometry.width - margin - x,
      columns,
    });
    body.push(claims.markup);
    claimCarriers = claims.carriers;
    if (arrangement.beside)
      body.push(
        `<line x1="${number(x - 21)}" y1="${number(top - 16)}" x2="${number(x - 21)}" y2="${number(Math.max(y, claims.bottom))}" stroke="${colors.rule}"/>`,
      );
    y = arrangement.beside ? Math.max(y, claims.bottom) : claims.bottom;
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
  if (height > 6000) fail("static_responsibility_geometry_unrepresentable");
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
    `<desc id="responsibility-description">${escape(scene.questions[0].text)} ${scene.summary === undefined ? "" : escape(scene.summary)} ${escape(framing)}</desc>`,
    `<rect width="${geometry.width}" height="${height}" fill="${colors.paper}"/>`,
    ...body,
    ...(figureTypes ? [figureIconLicenseMetadata(icons)] : []),
    "</svg>",
    "",
  ].join("\n");
  return {
    width: geometry.width,
    height,
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

/** Arrange complete selected content without borrowing interactive geometry or DOM. */
export function composeStaticResponsibilitySvg(scene, { icons } = {}) {
  const form = selectedForm(scene);
  const geometry = layout(scene, form.roles, form.roleByNode);
  const candidates = [{}];
  if (scene.claimCards?.length) {
    const { columns, width } = staticBodyGeometry(null, scene.claimCards);
    for (let claimWidth = columns * 320 + (columns - 1) * 24; claimWidth <= width; claimWidth += 32)
      candidates.push({ beside: true, width: geometry.graphWidth + 42 + claimWidth });
  }
  const result = selectMeasuredComposition(
    candidates,
    (arrangement) => paintResponsibility(scene, icons, form, arrangement),
    [
      "static_responsibility_text_unrepresentable",
      "static_responsibility_header_unrepresentable",
      "static_responsibility_geometry_unrepresentable",
    ],
  );
  return {
    bytes: result.bytes,
    rasterWidth: result.rasterWidth,
    carriers: result.carriers,
    scene: result.scene,
  };
}
