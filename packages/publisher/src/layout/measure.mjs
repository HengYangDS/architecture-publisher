/**
 * Neatness measurements of one laid-out view. Every value is computed from the
 * geometry itself, so a defect cannot hide behind the algorithm that made it.
 */

const owner = (relations) => relations.map(({ id }) => id).join(",");

function segmentsOf(paths) {
  return paths.flatMap(({ relations, points }) =>
    points
      .slice(1)
      .map((point, index) => ({ owner: owner(relations), a: points[index], b: point })),
  );
}

const span = (segment) => ({
  x1: Math.min(segment.a[0], segment.b[0]),
  x2: Math.max(segment.a[0], segment.b[0]),
  y1: Math.min(segment.a[1], segment.b[1]),
  y2: Math.max(segment.a[1], segment.b[1]),
});
const vertical = (segment) => Math.abs(segment.a[0] - segment.b[0]) < 0.5;
const horizontal = (segment) => Math.abs(segment.a[1] - segment.b[1]) < 0.5;
const overlaps = (a, b, tolerance = 0.5) =>
  a.x < b.x + b.width - tolerance &&
  b.x < a.x + a.width - tolerance &&
  a.y < b.y + b.height - tolerance &&
  b.y < a.y + a.height - tolerance;

/**
 * @param {{ cards: Map<string, { x: number, y: number, width: number, height: number }>,
 *   paths: Array<{ relations: Array<{ id: string }>, points: number[][] }>,
 *   labels: Array<{ relations: Array<{ id: string }>, x: number, y: number, width: number, height: number }>,
 *   arrows?: Array<{ relations: Array<{ id: string }>, x: number, y: number }>,
 *   arrow?: number,
 *   boundary: { x: number, y: number, width: number, height: number } | null }} geometry
 */
export function measureLayout(geometry) {
  const segments = segmentsOf(geometry.paths);
  const defects = [];
  let crossings = 0;
  for (const segment of segments)
    if (!vertical(segment) && !horizontal(segment))
      defects.push({
        code: "layout_wire_diagonal",
        relations: segment.owner,
        message: "a wire segment is neither horizontal nor vertical",
      });
  for (let i = 0; i < segments.length; i += 1)
    for (let j = i + 1; j < segments.length; j += 1) {
      const [s, u] = [segments[i], segments[j]];
      if (s.owner === u.owner) continue;
      const [a, b] = [span(s), span(u)];
      if (vertical(s) !== vertical(u)) {
        const [v, h] = vertical(s) ? [a, b] : [b, a];
        if (v.x1 > h.x1 + 0.5 && v.x1 < h.x2 - 0.5 && h.y1 > v.y1 + 0.5 && h.y1 < v.y2 - 0.5)
          crossings += 1;
      } else if (
        vertical(s) &&
        Math.abs(a.x1 - b.x1) < 0.5 &&
        Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 0.5
      )
        defects.push({
          code: "layout_wire_shared",
          relations: `${s.owner} ${u.owner}`,
          message: "two relations share a vertical segment",
        });
      else if (
        horizontal(s) &&
        Math.abs(a.y1 - b.y1) < 0.5 &&
        Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 0.5
      )
        defects.push({
          code: "layout_wire_shared",
          relations: `${s.owner} ${u.owner}`,
          message: "two relations share a horizontal segment",
        });
    }
  const cards = [...geometry.cards].map(([id, card]) => ({ id, ...card }));
  for (const segment of segments) {
    const box = span(segment);
    for (const card of cards)
      if (
        box.x1 > card.x + 1 &&
        box.x2 < card.x + card.width - 1 &&
        box.y1 < card.y + card.height - 1 &&
        box.y2 > card.y + 1
      )
        defects.push({
          code: "layout_wire_through_card",
          relations: segment.owner,
          card: card.id,
          message: `a wire passes through ${card.id}`,
        });
  }
  const labels = geometry.labels;
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i];
    const name = owner(label.relations);
    for (let j = i + 1; j < labels.length; j += 1)
      if (overlaps(label, labels[j]))
        defects.push({
          code: "layout_label_collision",
          relations: `${name} ${owner(labels[j].relations)}`,
          message: "two relation labels overlap",
        });
    for (const card of cards)
      if (overlaps(label, card))
        defects.push({
          code: "layout_label_collision",
          relations: name,
          card: card.id,
          message: `a label overlaps ${card.id}`,
        });
    for (const segment of segments) {
      if (segment.owner === name) continue;
      const box = span(segment);
      if (
        overlaps(label, {
          x: box.x1 - 0.5,
          y: box.y1 - 0.5,
          width: box.x2 - box.x1 + 1,
          height: box.y2 - box.y1 + 1,
        })
      )
        defects.push({
          code: "layout_label_collision",
          relations: `${name} ${segment.owner}`,
          message: "a label covers another relation's wire",
        });
    }
    const frame = geometry.boundary;
    if (frame) {
      const edges = [
        { x: frame.x, y: frame.y, width: frame.width, height: 1 },
        { x: frame.x, y: frame.y + frame.height - 1, width: frame.width, height: 1 },
        { x: frame.x, y: frame.y, width: 1, height: frame.height },
        { x: frame.x + frame.width - 1, y: frame.y, width: 1, height: frame.height },
      ];
      if (edges.some((edge) => overlaps(label, edge, 0)))
        defects.push({
          code: "layout_label_collision",
          relations: name,
          message: "a label crosses the system boundary",
        });
    }
  }
  const bends = geometry.paths.reduce((sum, { points }) => sum + points.length - 2, 0);
  return { crossings, bends, defects, routes: routeDefects(geometry, segments) };
}

/**
 * The spacing below which wiring misreads although no two wires cross: two
 * parallel wires closer than `parallel` read as one, and so do two closer than
 * `alongside` for longer than `run`; a wire that stops less than `join` short
 * of another in line with it reads as continuing it, and one that turns less
 * than `join` beside a card it does not connect reads as leaving that card;
 * two arrowheads closer than two heads read as one, and a relation label
 * closer than `label` to another relation's wire reads as that wire's label.
 * Layout spacing keeps them, so the measure only finds what the spacing could
 * not.
 */
export const ROUTE = Object.freeze({
  parallel: 24,
  alongside: 40,
  run: 96,
  join: 48,
  label: 16,
  heads: 2,
});

/**
 * Route defects of one layout: wires a reader takes for one, a wire that seems
 * to continue another or to leave a card it does not connect, arrowheads that
 * run together and labels set against another relation's wire. A layout is
 * chosen without them as it is without crossings.
 * @param {{ cards: Map<string, { x: number, y: number, width: number, height: number }>,
 *   paths: Array<{ relations: Array<{ id: string, from?: string, to?: string }>, points: number[][] }>,
 *   labels: Array<{ relations: Array<{ id: string }>, x: number, y: number, width: number, height: number }>,
 *   arrows?: Array<{ relations: Array<{ id: string }>, x: number, y: number }>,
 *   arrow?: number }} geometry `arrow` is the length of one arrowhead
 * @param {ReturnType<typeof segmentsOf>} segments
 * @returns {Array<{ code: string, relations: string, at: number[], apart?: number[] }>}
 *   `at` is a point of the layout where the defect lies, and `apart` how far a
 *   label stands from the other wire across and down
 */
function routeDefects(geometry, segments) {
  const found = [];
  for (let i = 0; i < segments.length; i += 1)
    for (let j = i + 1; j < segments.length; j += 1) {
      const [s, u] = [segments[i], segments[j]];
      if (s.owner === u.owner || vertical(s) !== vertical(u)) continue;
      const [a, b] = [span(s), span(u)];
      // Across the wires, and along them: positive overlap, negative gap.
      const [apart, along] = vertical(s)
        ? [Math.abs(a.x1 - b.x1), Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1)]
        : [Math.abs(a.y1 - b.y1), Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)];
      const at = [
        (Math.max(a.x1, b.x1) + Math.min(a.x2, b.x2)) / 2,
        (Math.max(a.y1, b.y1) + Math.min(a.y2, b.y2)) / 2,
      ];
      const relations = `${s.owner} ${u.owner}`;
      if (apart >= 0.5 && apart < ROUTE.parallel && along > 0.5)
        found.push({ code: "route_wires_close", relations, at });
      else if (apart < 0.5 && along <= 0.5 && along > -ROUTE.join)
        found.push({ code: "route_wire_continued", relations, at });
      else if (apart >= 0.5 && apart < ROUTE.alongside && along > ROUTE.run)
        found.push({ code: "route_wires_alongside", relations, at });
    }
  // A turn beside a card's edge, within its span, reads as the wire leaving
  // that card when the wire does not connect it.
  for (const { relations, points } of geometry.paths) {
    const connected = new Set(relations.flatMap(({ from, to }) => [from, to]));
    for (const [x, y] of points.slice(1, -1))
      for (const [id, card] of geometry.cards) {
        if (connected.has(id)) continue;
        const across =
          x > card.x + 0.5 && x < card.x + card.width - 0.5
            ? Math.max(card.y - y, y - card.y - card.height)
            : y > card.y + 0.5 && y < card.y + card.height - 0.5
              ? Math.max(card.x - x, x - card.x - card.width)
              : Infinity;
        if (across > 0 && across < ROUTE.join)
          found.push({
            code: "route_turn_by_card",
            relations: `${owner(relations)} ${id}`,
            at: [x, y],
          });
      }
  }
  const arrows = geometry.arrows ?? [];
  for (let i = 0; i < arrows.length; i += 1)
    for (let j = i + 1; j < arrows.length; j += 1) {
      const [p, q] = [arrows[i], arrows[j]];
      if (owner(p.relations) === owner(q.relations)) continue;
      if (Math.hypot(p.x - q.x, p.y - q.y) < ROUTE.heads * (geometry.arrow ?? 0))
        found.push({
          code: "route_arrows_close",
          relations: `${owner(p.relations)} ${owner(q.relations)}`,
          at: [(p.x + q.x) / 2, (p.y + q.y) / 2],
        });
    }
  for (const label of geometry.labels) {
    const name = owner(label.relations);
    const near = {
      x: label.x - ROUTE.label,
      y: label.y - ROUTE.label,
      width: label.width + 2 * ROUTE.label,
      height: label.height + 2 * ROUTE.label,
    };
    for (const segment of segments) {
      if (segment.owner === name) continue;
      const box = span(segment);
      if (
        overlaps(near, {
          x: box.x1 - 0.5,
          y: box.y1 - 0.5,
          width: box.x2 - box.x1 + 1,
          height: box.y2 - box.y1 + 1,
        })
      ) {
        found.push({
          code: "route_label_near_wire",
          relations: `${name} ${segment.owner}`,
          at: [label.x + label.width / 2, label.y + label.height / 2],
          apart: [
            Math.max(0, box.x1 - label.x - label.width, label.x - box.x2),
            Math.max(0, box.y1 - label.y - label.height, label.y - box.y2),
          ],
        });
        break;
      }
    }
  }
  return found;
}
