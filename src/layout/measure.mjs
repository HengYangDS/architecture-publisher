/**
 * Neatness measurements of one laid-out view. Every value is computed from the
 * geometry itself, so a defect cannot hide behind the algorithm that made it.
 * A wire runs across and down on the grid and at any slant in a radial figure;
 * each is measured along its own line by the same spacings, so the two
 * compositions are measured alike.
 */

const owner = (relations) => relations.map(({ id }) => id).join(",");

/** Whether a stretch runs at a slant, neither across nor down: only a figure drawn off the grid draws one. */
export const slanted = (p, q) => Math.abs(q[0] - p[0]) >= 0.5 && Math.abs(q[1] - p[1]) >= 0.5;

/**
 * The share along a stretch p→q at which it meets the stretch r→s, and the share along r→s, or null where they are
 * parallel.
 */
function meet(p, q, r, s) {
  const [dx, dy, ex, ey] = [q[0] - p[0], q[1] - p[1], s[0] - r[0], s[1] - r[1]];
  const den = dx * ey - dy * ex;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((r[0] - p[0]) * ey - (r[1] - p[1]) * ex) / den;
  const u = ((r[0] - p[0]) * dy - (r[1] - p[1]) * dx) / den;
  return [t, u];
}

/** Whether two stretches at any slant cross away from their ends: more than half a px inside each. */
function stretchesCross(p, q, r, s) {
  const at = meet(p, q, r, s);
  if (!at) return false;
  const [t, u] = at;
  const [a, b] = [Math.hypot(q[0] - p[0], q[1] - p[1]), Math.hypot(s[0] - r[0], s[1] - r[1])];
  return t * a > 0.5 && (1 - t) * a > 0.5 && u * b > 0.5 && (1 - u) * b > 0.5;
}

/**
 * How long a stretch at any slant runs inside a box, by clipping it to the box (Liang-Barsky).
 * @param {number[]} p
 * @param {number[]} q
 * @param {{ x: number, y: number, width: number, height: number }} box
 */
export function insideLength(p, q, box) {
  const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
  let [low, high] = [0, 1];
  const edges = [
    [-dx, p[0] - box.x],
    [dx, box.x + box.width - p[0]],
    [-dy, p[1] - box.y],
    [dy, box.y + box.height - p[1]],
  ];
  for (const [step, room] of edges) {
    if (Math.abs(step) < 1e-12) {
      if (room < 0) return 0;
      continue;
    }
    const share = room / step;
    if (step < 0) low = Math.max(low, share);
    else high = Math.min(high, share);
    if (low > high) return 0;
  }
  return (high - low) * Math.hypot(dx, dy);
}

/**
 * A layout's wires as segments. What a segment is of itself is worked out here, once: whose it is, where it
 * reaches (`x1` to `x2`, `y1` to `y2`) and whether it runs down or across. The measures ask these of every pair of
 * segments, and a channel's search measures every assignment it completes.
 */
function segmentsOf(paths) {
  const segments = [];
  for (const { relations, points } of paths) {
    const name = owner(relations);
    for (let index = 1; index < points.length; index += 1) {
      const [a, b] = [points[index - 1], points[index]];
      const [ax, ay, bx, by] = [a[0], a[1], b[0], b[1]];
      segments.push({
        owner: name,
        relations,
        a,
        b,
        x1: Math.min(ax, bx),
        x2: Math.max(ax, bx),
        y1: Math.min(ay, by),
        y2: Math.max(ay, by),
        vertical: Math.abs(ax - bx) < 0.5,
        horizontal: Math.abs(ay - by) < 0.5,
        slanted: slanted(a, b),
      });
    }
  }
  return segments;
}

const overlaps = (a, b, tolerance = 0.5) =>
  a.x < b.x + b.width - tolerance &&
  b.x < a.x + a.width - tolerance &&
  a.y < b.y + b.height - tolerance &&
  b.y < a.y + a.height - tolerance;

/** A box shrunk by `by` px on every side. */
const inset = (box, by) => ({
  x: box.x + by,
  y: box.y + by,
  width: box.width - 2 * by,
  height: box.height - 2 * by,
});

/** Whether two segments of which one runs at a slant lie on one line over more than half a px: one wire to a reader. */
function inLine(a, b) {
  const length = Math.hypot(a.b[0] - a.a[0], a.b[1] - a.a[1]);
  if (length < 0.5) return false;
  const [ux, uy] = [(a.b[0] - a.a[0]) / length, (a.b[1] - a.a[1]) / length];
  const off = (point) => Math.abs((point[1] - a.a[1]) * ux - (point[0] - a.a[0]) * uy);
  if (off(b.a) > 0.5 || off(b.b) > 0.5) return false;
  const along = (point) => (point[0] - a.a[0]) * ux + (point[1] - a.a[1]) * uy;
  const [low, high] = [along(b.a), along(b.b)].sort((x, y) => x - y);
  return Math.min(length, high) - Math.max(0, low) > 0.5;
}

/**
 * A layout's crossings, bends, defects and route defects. A wire at a slant is a defect of the grid's layout, whose
 * wires run across and down; a composition that draws its wires at any slant says so with `slanting`, and its wires
 * are held to the same defects along their own lines.
 * @param {{ cards: Map<string, { x: number, y: number, width: number, height: number }>,
 *   paths: Array<{ relations: Array<{ id: string }>, points: number[][] }>,
 *   labels: Array<{ relations: Array<{ id: string }>, x: number, y: number, width: number, height: number }>,
 *   arrows?: Array<{ relations: Array<{ id: string }>, x: number, y: number }>,
 *   arrow?: number,
 *   boundary: { x: number, y: number, width: number, height: number } | null }} geometry
 * @param {{ slanting?: boolean }} [options]
 */
export function measureLayout(geometry, { slanting = false } = {}) {
  const segments = segmentsOf(geometry.paths);
  const defects = [];
  let crossings = 0;
  if (!slanting)
    for (const segment of segments)
      if (segment.slanted)
        defects.push({
          code: "layout_wire_diagonal",
          relations: segment.owner,
          message: "a wire segment is neither horizontal nor vertical",
        });
  for (let i = 0; i < segments.length; i += 1)
    for (let j = i + 1; j < segments.length; j += 1) {
      const [a, b] = [segments[i], segments[j]];
      if (a.owner === b.owner) continue;
      if (a.slanted || b.slanted) {
        if (stretchesCross(a.a, a.b, b.a, b.b)) crossings += 1;
        else if (inLine(a, b))
          defects.push({
            code: "layout_wire_shared",
            relations: `${a.owner} ${b.owner}`,
            message: "two relations share a slanted segment",
          });
      } else if (a.vertical !== b.vertical) {
        const [v, h] = a.vertical ? [a, b] : [b, a];
        if (v.x1 > h.x1 + 0.5 && v.x1 < h.x2 - 0.5 && h.y1 > v.y1 + 0.5 && h.y1 < v.y2 - 0.5)
          crossings += 1;
      } else if (
        a.vertical &&
        Math.abs(a.x1 - b.x1) < 0.5 &&
        Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 0.5
      )
        defects.push({
          code: "layout_wire_shared",
          relations: `${a.owner} ${b.owner}`,
          message: "two relations share a vertical segment",
        });
      else if (
        a.horizontal &&
        Math.abs(a.y1 - b.y1) < 0.5 &&
        Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 0.5
      )
        defects.push({
          code: "layout_wire_shared",
          relations: `${a.owner} ${b.owner}`,
          message: "two relations share a horizontal segment",
        });
    }
  const cards = [...geometry.cards].map(([id, card]) => ({ id, ...card }));
  for (const box of segments) {
    for (const card of cards)
      if (
        box.slanted
          ? insideLength(box.a, box.b, inset(card, 1)) > 1
          : box.x1 > card.x + 1 &&
            box.x2 < card.x + card.width - 1 &&
            box.y1 < card.y + card.height - 1 &&
            box.y2 > card.y + 1
      )
        defects.push({
          code: "layout_wire_through_card",
          relations: box.owner,
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
    for (const box of segments) {
      if (box.owner === name) continue;
      if (
        box.slanted
          ? insideLength(box.a, box.b, inset(label, 0.5)) > 0
          : overlaps(label, {
              x: box.x1 - 0.5,
              y: box.y1 - 0.5,
              width: box.x2 - box.x1 + 1,
              height: box.y2 - box.y1 + 1,
            })
      )
        defects.push({
          code: "layout_label_collision",
          relations: `${name} ${box.owner}`,
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
 * Route defects of part of a layout, such as one channel and the cards beside
 * it, by the same measure as the whole. Given a limit, the measure stops once
 * it has found that many: the first of those it finds without one. A limit is a
 * whole number of at least 1, or Infinity for the whole count; the search passes
 * no other.
 * @param {Parameters<typeof routeDefects>[0]} geometry
 * @param {number} [limit]
 */
export function measureRoutes(geometry, limit = Infinity) {
  return routeDefects(geometry, segmentsOf(geometry.paths), limit);
}

/**
 * The spacing below which wiring misreads although no two wires cross: two
 * parallel wires closer than `parallel` read as one, and so do two closer than
 * `alongside` for longer than `run` or that hook past each other; a wire that
 * stops less than `join` short of another in line with it reads as continuing
 * it, and so does a run that stops less than `jump` short of another's where a
 * third relation's wire crosses the line between them, as one line jumping
 * that wire; one that turns less than `join` beside a card it does not connect
 * reads as leaving that card; two arrowheads closer than two heads read as
 * one, and a relation label closer than `label` to another relation's wire
 * reads as that wire's label. Layout spacing keeps them, so the measure only
 * finds what the spacing could not.
 */
export const ROUTE = Object.freeze({
  parallel: 24,
  alongside: 40,
  run: 96,
  join: 48,
  jump: 400,
  label: 16,
  heads: 2,
});

/**
 * Two wires of which one runs at a slant run the same way when the sine of the angle between them is at most this:
 * about 3°, within which the gap between two wires that run alongside changes by less than 5 px in 96.
 */
const SAME_WAY = 0.05;

/**
 * Two overlapping spans that each start inside the other: wires that hook
 * past each other, as opposed to one running inside the other's length.
 */
const staggered = ([a1, a2, b1, b2]) =>
  (a1 < b1 - 0.5 && b1 < a2 - 0.5 && a2 < b2 - 0.5) ||
  (b1 < a1 - 0.5 && a1 < b2 - 0.5 && b2 < a2 - 0.5);

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
 * @param {number} [limit] the most defects to find: the measure stops there
 * @returns {Array<{ kind: string, relations: string, at: number[], apart?: number[] }>}
 *   `kind` names the defect, a measure that ranks candidate layouts and no
 *   refusal's code; `at` is a point of the layout where the defect lies, and
 *   `apart` how far a label stands from the other wire across and down
 */
function routeDefects(geometry, segments, limit = Infinity) {
  const found = [];
  /** Adds a defect, and says whether as many are found as were asked for. */
  const add = (defect) => found.push(defect) >= limit;
  // Two relations from one card or into one card read as its fan when in line.
  const fan = (s, u) =>
    s.relations.some((p) =>
      u.relations.some((q) => (p.to && p.to === q.to) || (p.from && p.from === q.from)),
    );
  // A third relation's vertical across the line between two horizontals in
  // line, within the gap between them, where the two are no fan: read as one
  // line, they join cards that no relation joins.
  const bridged = (a, b) =>
    a.horizontal &&
    !fan(a, b) &&
    segments.some(
      (c) =>
        c.owner !== a.owner &&
        c.owner !== b.owner &&
        c.vertical &&
        c.x1 > Math.min(a.x2, b.x2) &&
        c.x1 < Math.max(a.x1, b.x1) &&
        c.y1 < a.y1 &&
        c.y2 > a.y1,
    );
  // What two segments of different relations that run the same way make of one another, if anything.
  const between = (a, b) => {
    // Across the wires, and along them: positive overlap, negative gap.
    const apart = a.vertical ? Math.abs(a.x1 - b.x1) : Math.abs(a.y1 - b.y1);
    const along = a.vertical
      ? Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1)
      : Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
    if (apart >= 0.5 && apart < ROUTE.parallel && along > 0.5) return "route_wires_close";
    if (apart < 0.5 && along <= 0.5 && along > -ROUTE.join) return "route_wire_continued";
    if (apart < 0.5 && along > -ROUTE.jump && bridged(a, b)) return "route_wire_jumps";
    if (apart >= 0.5 && apart < ROUTE.alongside && along > ROUTE.run)
      return "route_wires_alongside";
    if (
      apart >= 0.5 &&
      apart < ROUTE.alongside &&
      along > 0.5 &&
      staggered(a.vertical ? [a.y1, a.y2, b.y1, b.y2] : [a.x1, a.x2, b.x1, b.x2])
    )
      return "route_wires_interlock";
    return null;
  };
  // Two wires of which one runs at a slant: the same reading as `between`, along and across the first wire's line,
  // when they run the same way; a third relation's wire across the gap between two in line bridges them.
  const slantedBetween = (a, b) => {
    const length = Math.hypot(a.b[0] - a.a[0], a.b[1] - a.a[1]);
    if (length < 0.5) return null;
    const [ux, uy] = [(a.b[0] - a.a[0]) / length, (a.b[1] - a.a[1]) / length];
    const [vx, vy] = [b.b[0] - b.a[0], b.b[1] - b.a[1]];
    const other = Math.hypot(vx, vy);
    if (other < 0.5 || Math.abs(ux * vy - uy * vx) / other > SAME_WAY) return null;
    const across = (point) => (point[1] - a.a[1]) * ux - (point[0] - a.a[0]) * uy;
    const at = (point) => (point[0] - a.a[0]) * ux + (point[1] - a.a[1]) * uy;
    const [near, far] = [across(b.a), across(b.b)];
    // Two that cross each other's line cross, and are counted as crossing where they do.
    if (near * far < 0 && Math.abs(near) >= 0.5 && Math.abs(far) >= 0.5) return null;
    const apart = Math.min(Math.abs(near), Math.abs(far));
    const [b1, b2] = [at(b.a), at(b.b)].sort((x, y) => x - y);
    const along = Math.min(length, b2) - Math.max(0, b1);
    if (apart >= 0.5 && apart < ROUTE.parallel && along > 0.5) return "route_wires_close";
    if (apart < 0.5 && along <= 0.5 && along > -ROUTE.join) return "route_wire_continued";
    if (apart < 0.5 && along > -ROUTE.jump) {
      const ends = [a.a, a.b].flatMap((p) => [b.a, b.b].map((q) => [p, q]));
      const [p, q] = ends.sort(
        ([p1, q1], [p2, q2]) =>
          Math.hypot(p1[0] - q1[0], p1[1] - q1[1]) - Math.hypot(p2[0] - q2[0], p2[1] - q2[1]),
      )[0];
      if (
        !fan(a, b) &&
        segments.some(
          (c) => c.owner !== a.owner && c.owner !== b.owner && stretchesCross(p, q, c.a, c.b),
        )
      )
        return "route_wire_jumps";
    }
    if (apart >= 0.5 && apart < ROUTE.alongside && along > ROUTE.run)
      return "route_wires_alongside";
    if (apart >= 0.5 && apart < ROUTE.alongside && along > 0.5 && staggered([0, length, b1, b2]))
      return "route_wires_interlock";
    return null;
  };
  for (let i = 0; i < segments.length; i += 1) {
    const a = segments[i];
    for (let j = i + 1; j < segments.length; j += 1) {
      const b = segments[j];
      if (a.owner === b.owner) continue;
      if (!a.slanted && !b.slanted && a.vertical !== b.vertical) continue;
      const kind = a.slanted || b.slanted ? slantedBetween(a, b) : between(a, b);
      if (
        kind &&
        add({
          kind,
          relations: `${a.owner} ${b.owner}`,
          at: [
            (Math.max(a.x1, b.x1) + Math.min(a.x2, b.x2)) / 2,
            (Math.max(a.y1, b.y1) + Math.min(a.y2, b.y2)) / 2,
          ],
        })
      )
        return found;
    }
  }
  // A turn beside a card's edge, within its span, reads as the wire leaving
  // that card when the wire does not connect it.
  const cards = [...geometry.cards];
  for (const { relations, points } of geometry.paths) {
    const connects = (id) => relations.some(({ from, to }) => from === id || to === id);
    for (const [x, y] of points.slice(1, -1))
      for (const [id, card] of cards) {
        const across =
          x > card.x + 0.5 && x < card.x + card.width - 0.5
            ? Math.max(card.y - y, y - card.y - card.height)
            : y > card.y + 0.5 && y < card.y + card.height - 0.5
              ? Math.max(card.x - x, x - card.x - card.width)
              : Infinity;
        if (
          across > 0 &&
          across < ROUTE.join &&
          !connects(id) &&
          add({ kind: "route_turn_by_card", relations: `${owner(relations)} ${id}`, at: [x, y] })
        )
          return found;
      }
  }
  const arrows = geometry.arrows ?? [];
  for (let i = 0; i < arrows.length; i += 1)
    for (let j = i + 1; j < arrows.length; j += 1) {
      const [p, q] = [arrows[i], arrows[j]];
      if (owner(p.relations) === owner(q.relations)) continue;
      if (
        Math.hypot(p.x - q.x, p.y - q.y) < ROUTE.heads * (geometry.arrow ?? 0) &&
        add({
          kind: "route_arrows_close",
          relations: `${owner(p.relations)} ${owner(q.relations)}`,
          at: [(p.x + q.x) / 2, (p.y + q.y) / 2],
        })
      )
        return found;
    }
  for (const label of geometry.labels) {
    const name = owner(label.relations);
    const near = {
      x: label.x - ROUTE.label,
      y: label.y - ROUTE.label,
      width: label.width + 2 * ROUTE.label,
      height: label.height + 2 * ROUTE.label,
    };
    for (const box of segments) {
      if (box.owner === name) continue;
      if (
        box.slanted
          ? insideLength(box.a, box.b, near) > 0
          : overlaps(near, {
              x: box.x1 - 0.5,
              y: box.y1 - 0.5,
              width: box.x2 - box.x1 + 1,
              height: box.y2 - box.y1 + 1,
            })
      ) {
        const enough = add({
          kind: "route_label_near_wire",
          relations: `${name} ${box.owner}`,
          at: [label.x + label.width / 2, label.y + label.height / 2],
          apart: [
            Math.max(0, box.x1 - label.x - label.width, label.x - box.x2),
            Math.max(0, box.y1 - label.y - label.height, label.y - box.y2),
          ],
        });
        if (enough) return found;
        break;
      }
    }
  }
  // A label on its own wire's horizontal run, set just above or below another
  // relation's turn and over it, reads as the label of the wire that turns
  // there.
  for (const label of geometry.labels) {
    const name = owner(label.relations);
    const inside = (y) => y > label.y && y < label.y + label.height;
    const jog = segments.some(
      (segment) =>
        segment.owner === name &&
        ((segment.horizontal &&
          inside(segment.a[1]) &&
          segment.x1 < label.x + label.width &&
          segment.x2 > label.x) ||
          // A label set on its own wire at a slant, as a radial figure sets it.
          (segment.slanted && insideLength(segment.a, segment.b, label) > 0.5)),
    );
    if (!jog) continue;
    const turn = geometry.paths.find(
      ({ relations, points }) =>
        owner(relations) !== name &&
        points.slice(1, -1).some(([x, y]) => {
          const across = Math.max(label.y - y, y - label.y - label.height);
          return (
            x > label.x - ROUTE.label &&
            x < label.x + label.width + ROUTE.label &&
            across > 0 &&
            across < ROUTE.join
          );
        }),
    );
    if (
      turn &&
      add({
        kind: "route_label_over_turn",
        relations: `${name} ${owner(turn.relations)}`,
        at: [label.x + label.width / 2, label.y + label.height / 2],
      })
    )
      return found;
  }
  return found;
}
