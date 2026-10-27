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
  return { crossings, bends, defects };
}
