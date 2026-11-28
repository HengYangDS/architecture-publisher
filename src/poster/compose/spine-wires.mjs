import { ROUTE, insideLength, measureRoutes } from "../../layout/measure.mjs";
import { headingOf, labelClearance, middleOf, pairOf } from "./free.mjs";
import { CORNER, nearestX } from "./spine-fold.mjs";

/**
 * The spine's wires, routed on its fold (`spine-fold.mjs`), and their labels. Every wire runs upright and across,
 * never at a slant. The line runs straight along each row, and at each turn out of its row's end at the frame's side,
 * down beside the rows with an arrowhead just below the turn, and into the next row's first station from that side. A
 * branch's wire leaves its station's top or foot straight into the branch, or bends once into the branch's side. A
 * rung runs straight down, bent once, or bent twice across the gap between its rows; an arch bends twice, over or
 * under its row. Any wire that would pass through a card it does not join, or run along another relation's line, takes
 * the way upright and across that passes no card and runs along no line, with the fewest route defects by the
 * layout's measure, then the fewest crossings, then the fewest bends: a branch's wire bent once at most, a rung's
 * twice. A layout where the line or an arch would pass a card, or where a wire finds no such way, is not drawn.
 */

/**
 * The ways a wire may run from one card to another upright and across, fewest bends first: straight down where the
 * cards overlap across, or straight across where they overlap down; bent once, out of the first card's top or foot
 * into the second's side, or out of the first's side into the second's top or foot; and bent twice, out of the first
 * card's top or foot, across at each height `across` names between the two, and into the second's top or foot. A wire
 * leaves a top or foot at its port where one is set, else, or failing that, at the corner nearest the other card or
 * at the middle.
 * @param {{ x: number, y: number, width: number, height: number }} a the source's card
 * @param {{ x: number, y: number, width: number, height: number }} b the target's card
 * @param {{ from?: number, to?: number }} port where the wire leaves the source's top or foot and enters the target's,
 *   where its ports are set
 * @param {number[]} across
 */
function orthogonalRoutes(a, b, port, across) {
  const [ma, mb] = [middleOf(a), middleOf(b)];
  const apart = b.y >= a.y + a.height || b.y + b.height <= a.y;
  const beside = b.x >= a.x + a.width || b.x + b.width <= a.x;
  const down = mb[1] > ma[1];
  const [edgeA, edgeB] = down ? [a.y + a.height, b.y] : [a.y, b.y + b.height];
  const placesOn = (box, other, set) => [
    ...new Set([set, nearestX(box, other), middleOf(box)[0]].filter((x) => x !== undefined)),
  ];
  const outs = placesOn(a, b, port.from);
  const intos = placesOn(b, a, port.to);
  /** @type {number[][][]} */
  const routes = [];
  const xs = [Math.max(a.x, b.x) + CORNER, Math.min(a.x + a.width, b.x + b.width) - CORNER];
  if (apart && xs[0] <= xs[1]) {
    const x = outs[0] >= xs[0] && outs[0] <= xs[1] ? outs[0] : (xs[0] + xs[1]) / 2;
    routes.push([
      [x, edgeA],
      [x, edgeB],
    ]);
  }
  const ys = [
    Math.max(a.y, b.y) + CORNER / 2,
    Math.min(a.y + a.height, b.y + b.height) - CORNER / 2,
  ];
  if (beside && ys[0] <= ys[1]) {
    const y = (ys[0] + ys[1]) / 2;
    const right = mb[0] > ma[0];
    routes.push([
      [right ? a.x + a.width : a.x, y],
      [right ? b.x : b.x + b.width, y],
    ]);
  }
  for (const out of outs)
    if ((mb[1] < a.y || mb[1] > a.y + a.height) && (out < b.x || out > b.x + b.width))
      routes.push([
        [out, down ? a.y + a.height : a.y],
        [out, mb[1]],
        [out < b.x ? b.x : b.x + b.width, mb[1]],
      ]);
  for (const into of intos)
    if ((ma[1] < b.y || ma[1] > b.y + b.height) && (into < a.x || into > a.x + a.width))
      routes.push([
        [into < a.x ? a.x : a.x + a.width, ma[1]],
        [into, ma[1]],
        [into, ma[1] < b.y ? b.y : b.y + b.height],
      ]);
  if (apart)
    for (const y of across)
      for (const out of outs)
        for (const into of intos)
          if (
            Math.abs(out - into) >= 0.5 &&
            y > Math.min(edgeA, edgeB) + 1 &&
            y < Math.max(edgeA, edgeB) - 1
          )
            routes.push([
              [out, edgeA],
              [out, y],
              [into, y],
              [into, edgeB],
            ]);
  return routes;
}

/**
 * Ports on one edge of a card, `gap` apart within [low, high]: a pinned port where it is pinned, the others as near
 * as they can stand to what they want; spread evenly where they do not fit.
 * @param {Array<{ want: number, pinned?: boolean }>} entries in the order of their wants
 * @param {number} gap
 * @param {number} low
 * @param {number} high
 */
function portsOn(entries, gap, low, high) {
  const at = entries.map(({ want }) => Math.min(high, Math.max(low, want)));
  for (let index = 1; index < at.length; index += 1)
    if (!entries[index].pinned) at[index] = Math.max(at[index], at[index - 1] + gap);
  for (let index = at.length - 2; index >= 0; index -= 1)
    if (!entries[index].pinned) at[index] = Math.min(at[index], at[index + 1] - gap);
  const fits = at.every(
    (x, index) => x >= low - 0.5 && x <= high + 0.5 && (!index || x - at[index - 1] >= gap - 0.5),
  );
  return fits
    ? at
    : entries.map(({ want, pinned }, index) =>
        pinned ? want : low + ((high - low) * (index + 1)) / (entries.length + 1),
      );
}

/** A path's stretches, each from one of its points to the next. */
const stretchesOf = (/** @type {number[][]} */ points) =>
  points.slice(1).map((q, index) => [points[index], q]);
const flat = (/** @type {number[][]} */ [p, q]) => Math.abs(p[1] - q[1]) < 0.5;
const upright = (/** @type {number[][]} */ [p, q]) => Math.abs(p[0] - q[0]) < 0.5;
const within = (value, a, b) => value > Math.min(a, b) + 0.5 && value < Math.max(a, b) - 0.5;

/** Whether a stretch across and a stretch down cross. */
const crossing = (s1, s2) => {
  if (flat(s1) === flat(s2)) return false;
  const [h, v] = flat(s1) ? [s1, s2] : [s2, s1];
  return within(v[0][0], h[0][0], h[1][0]) && within(h[0][1], v[0][1], v[1][1]);
};

/**
 * Whether two stretches run along each other as the layout's measure reads wires: closer than a wire's separation, or
 * within `ROUTE.alongside` for longer than `ROUTE.run`.
 */
const alongside = (s1, s2) => {
  const overlapOn = (k) =>
    Math.min(Math.max(s1[0][k], s1[1][k]), Math.max(s2[0][k], s2[1][k])) -
    Math.max(Math.min(s1[0][k], s1[1][k]), Math.min(s2[0][k], s2[1][k]));
  const close = (apart, along) =>
    (apart < ROUTE.parallel - 0.5 && along > 0.5) || (apart < ROUTE.alongside && along > ROUTE.run);
  if (flat(s1) && flat(s2)) return close(Math.abs(s1[0][1] - s2[0][1]), overlapOn(0));
  if (upright(s1) && upright(s2)) return close(Math.abs(s1[0][0] - s2[0][0]), overlapOn(1));
  return false;
};

/**
 * The spine's wires and labels on its fold, as the grid's layout has them (its cards, the paths and arrows of its
 * relations, their labels and the boundary); or the fault that stops it (`FAULTS`). The wires the fold makes the
 * line's own (`line`) are drawn as the view's heavy line; the arrowhead under each turn marks the way the line reads.
 * A turn keeps its place as the line does, whichever way its relation runs.
 * @param {NonNullable<ReturnType<typeof import("./free.mjs").cardsAt>>} cards
 * @param {import("./spine-fold.mjs").Fold} fold
 * @param {{ width: number, height: number }} field
 * @returns {{ fault: string } | { cards: Map<string, import("./spine-fold.mjs").Box>, paths: any[], arrows: any[],
 *   labels: any[], boundary: import("./spine-fold.mjs").Fold["boundary"], arrow: number, unplaced: string[] }}
 */
export function wireSpine(cards, fold, field) {
  const { metrics, label } = cards;
  const { spacing, wire } = metrics;
  const { boxes, rows, rowAt, stationRow, at, pairs, turns, lanes, wires, wrapped, boundary, tab } =
    fold;
  const box = (/** @type {string} */ id) =>
    /** @type {{ x: number, y: number, width: number, height: number }} */ (boxes.get(id));

  // Ports on the cards' top and foot: a wire that leaves an edge stands as near the other end as the others leave
  // room, `separation` apart; a vertical rung, or a branch's straight wire on the line, is pinned to one x on both.
  /** @type {Map<string, Array<{ w: any, end: "from" | "to", want: number, pinned?: boolean }>>} */
  const edges = new Map();
  const attach = (/** @type {string} */ id, /** @type {string} */ edge, entry) => {
    const key = `${id}|${edge}`;
    edges.set(key, [...(edges.get(key) ?? []), entry]);
  };
  const facing = (/** @type {string} */ id, /** @type {string} */ other) =>
    box(other).y < box(id).y ? "top" : "bottom";
  const edgeY = (/** @type {string} */ id, /** @type {string} */ other) =>
    facing(id, other) === "top" ? box(id).y : box(id).y + box(id).height;
  /** @type {Map<any, { from?: number, to?: number }>} */
  const ports = new Map(wires.map((w) => [w, {}]));
  /** The rungs between stations that do not overlap, which bend between them. */
  const bent = new Set();
  for (const w of wires) {
    const { from, to } = w.relation;
    const [a, b] = [box(from), box(to)];
    if (w.kind === "edge" || w.kind === "rung") {
      const overlap = [
        Math.max(a.x, b.x) + CORNER,
        Math.min(a.x + a.width, b.x + b.width) - CORNER,
      ];
      if (overlap[1] >= overlap[0]) {
        const x = (overlap[0] + overlap[1]) / 2;
        const pinned = w.kind !== "edge" || w.line;
        attach(from, facing(from, to), { w, end: "from", want: x, pinned });
        attach(to, facing(to, from), { w, end: "to", want: x, pinned });
      } else if (w.kind === "edge") {
        // A branch beside its station: the station's port toward it, the branch's port under that.
        const [station, far] = at.has(from) ? ["from", "to"] : ["to", "from"];
        const [sb, bb] = station === "from" ? [a, b] : [b, a];
        const want = nearestX(sb, bb);
        attach(w.relation[station], facing(w.relation[station], w.relation[far]), {
          w,
          end: station,
          want,
        });
        attach(w.relation[far], facing(w.relation[far], w.relation[station]), {
          w,
          end: far,
          want: Math.min(bb.x + bb.width - CORNER, Math.max(bb.x + CORNER, want)),
        });
      } else {
        // A rung between stations that do not overlap: each end's port at its corner nearest the other station.
        bent.add(w);
        attach(from, facing(from, to), { w, end: "from", want: nearestX(a, b) });
        attach(to, facing(to, from), { w, end: "to", want: nearestX(b, a) });
      }
    } else if (w.kind === "arch") {
      const edge = lanes[0].side === "up" ? "top" : "bottom";
      attach(from, edge, { w, end: "from", want: b.x > a.x ? a.x + a.width : a.x });
      attach(to, edge, { w, end: "to", want: a.x > b.x ? b.x + b.width : b.x });
    }
  }
  for (const [key, entries] of edges) {
    const card = box(key.split("|")[0]);
    const sorted = [...entries].sort((p, q) => p.want - q.want);
    const xs = portsOn(sorted, spacing.separation, card.x + CORNER, card.x + card.width - CORNER);
    sorted.forEach((entry, index) => {
      /** @type {any} */ (ports.get(entry.w))[entry.end] = xs[index];
    });
  }

  // The lines' points, from the relation's source to its target.
  /** @type {Array<{ relations: any[], x: number, y: number, direction: string }>} */
  const turnHeads = [];
  for (const w of wires) {
    const { from, to } = w.relation;
    const [a, b] = [box(from), box(to)];
    const group = /** @type {any[]} */ (pairs.get(pairOf(w.relation)));
    const offset = (group.indexOf(w.relation) - (group.length - 1) / 2) * spacing.separation;
    const port = /** @type {any} */ (ports.get(w));
    if (w.kind === "path") {
      const lineY = middleOf(a)[1] + offset;
      w.points =
        a.x < b.x
          ? [
              [a.x + a.width, lineY],
              [b.x, lineY],
            ]
          : [
              [a.x, lineY],
              [b.x + b.width, lineY],
            ];
    } else if (w.kind === "turn") {
      const downward = stationRow(from) < stationRow(to);
      // The turns stand in the order of the rows they leave.
      const t = turns[Math.min(stationRow(from), stationRow(to))];
      const [upper, lower] = downward ? [a, b] : [b, a];
      const x = t.x + (t.side === "right" ? offset : -offset);
      const [y0, y1] = [middleOf(upper)[1] + offset, middleOf(lower)[1] + offset];
      const side = (card) => (t.side === "right" ? card.x + card.width : card.x);
      const route = [
        [side(upper), y0],
        [x, y0],
        [x, y1],
        [side(lower), y1],
      ];
      w.points = downward ? route : route.toReversed();
      if (downward)
        turnHeads.push({
          relations: [w.relation],
          x,
          y: upper.y + upper.height + spacing.arrowStub + wire.arrow,
          direction: "down",
        });
    } else if (w.kind === "arch") {
      const laneY = lanes[0].y;
      w.points = [
        [port.from, edgeY(from, to)],
        [port.from, laneY],
        [port.to, laneY],
        [port.to, edgeY(to, from)],
      ];
    } else if (w.kind === "rung" && !bent.has(w)) {
      w.points = [
        [port.from, edgeY(from, to)],
        [port.to, edgeY(to, from)],
      ];
    } else if (w.kind === "edge") {
      const [s, f, sEnd, fEnd] = at.has(from) ? [from, to, "from", "to"] : [to, from, "to", "from"];
      const [p, q] = [port[sEnd], port[fEnd]];
      const [y0, y1] = [edgeY(s, f), edgeY(f, s)];
      const branch = box(f);
      const middle = branch.y + branch.height / 2;
      /** @type {number[][]} */
      let points;
      // Straight down from the station into the branch, or bent once into the branch's side.
      if (Math.abs(q - p) < 0.5 || (!w.line && p >= branch.x && p <= branch.x + branch.width))
        points = [
          [p, y0],
          [p, y1],
        ];
      else if (p < branch.x || p > branch.x + branch.width)
        points = [
          [p, y0],
          [p, middle],
          [p < branch.x ? branch.x : branch.x + branch.width, middle],
        ];
      else return { fault: "lines" };
      w.points = sEnd === "from" ? points : points.toReversed();
    }
  }

  // Every other wire, and any that would pass through a card it does not join or run along another's line, takes
  // the best way upright and across; the line keeps its place, and an arch its lane.
  const passes = (/** @type {number[][]} */ points, /** @type {string[]} */ joined) =>
    stretchesOf(points).some(([p, q]) =>
      [...boxes].some(
        ([id, card]) =>
          !joined.includes(id) &&
          insideLength(p, q, {
            x: card.x + 1,
            y: card.y + 1,
            width: card.width - 2,
            height: card.height - 2,
          }) > 1,
      ),
    );
  const othersOf = (w) =>
    wires.filter((one) => one !== w && one.points.length).flatMap((one) => stretchesOf(one.points));
  const runsAlong = (w, points) => {
    const others = othersOf(w);
    return stretchesOf(points).some((one) => others.some((other) => alongside(one, other)));
  };
  // The heights a rung may cross at: in each gap between the rows it joins, its middle, then a wire's separation and
  // more above and below it, an arrowhead's stub clear of the rows, so two rungs across one gap run apart.
  const acrossOf = (w) => {
    const [i, j] = [rowAt(w.relation.from), rowAt(w.relation.to)].sort((x, z) => x - z);
    return rows.slice(i, j).flatMap((one, k) => {
      const [low, high] = [
        one.top + one.height + spacing.arrowStub,
        rows[i + k + 1].top - spacing.arrowStub,
      ];
      return [0, 1, -1, 2, -2, 3, -3]
        .map((step) => (low + high) / 2 + step * spacing.separation)
        .filter((y) => y >= low && y <= high);
    });
  };
  const chosen = (w) => {
    const joined = [w.relation.from, w.relation.to];
    const most = w.kind === "rung" ? 2 : 1;
    const others = othersOf(w);
    // The measure's own route defects of the way among the wires already set: wires a reader takes for one, a turn
    // beside a card it does not join.
    const set = wires
      .filter((one) => one !== w && one.points.length)
      .map((one) => ({ relations: [one.relation], points: one.points }));
    const defectsOf = (points) =>
      measureRoutes({
        cards: boxes,
        paths: [...set, { relations: [w.relation], points }],
        labels: [],
      }).filter(({ relations: named }) => named.split(" ").includes(w.relation.id)).length;
    const port = /** @type {{ from?: number, to?: number }} */ (ports.get(w));
    const ways = orthogonalRoutes(box(joined[0]), box(joined[1]), port, most > 1 ? acrossOf(w) : [])
      .filter(
        (points) => points.length - 2 <= most && !passes(points, joined) && !runsAlong(w, points),
      )
      .map((points) => ({
        points,
        defects: defectsOf(points),
        crossings: stretchesOf(points).reduce(
          (total, one) => total + others.filter((other) => crossing(one, other)).length,
          0,
        ),
      }));
    ways.sort(
      (x, z) =>
        x.defects - z.defects || x.crossings - z.crossings || x.points.length - z.points.length,
    );
    return ways[0]?.points ?? null;
  };
  for (const w of wires) {
    if (w.kind === "path") continue;
    const joined = [w.relation.from, w.relation.to];
    const held = w.line || w.kind === "turn";
    if (w.points.length && !passes(w.points, joined) && (held || !runsAlong(w, w.points))) continue;
    if (held || w.kind === "arch") return { fault: "lines" };
    const points = chosen(w);
    if (!points) return { fault: "lines" };
    w.points = points;
  }
  if (wires.some((w) => stretchesOf(w.points).some((one) => !flat(one) && !upright(one))))
    return { fault: "lines" };
  const paths = wires.map(({ relation, points, line }) => ({
    relations: [relation],
    points,
    line,
  }));
  const arrows = [
    ...wires.map(({ relation, points, line }) => {
      const [before, end] = points.slice(-2);
      return {
        relations: [relation],
        x: end[0],
        y: end[1],
        direction: headingOf(before, end),
        line,
      };
    }),
    ...turnHeads.map((head) => ({ ...head, line: true })),
  ];

  // The labels, each where `labelClearance` admits it and clear of the turns' arrowheads and the boundary's name: the
  // path's first, then the turns, the branches and the rest. A label on the line takes its wrapping across, or a
  // narrower one; a turn's stands on its upright; any other tries narrower wrappings in turn. The longest stretch is
  // tried first, but a branch's wire bent at 90° sets its label on its upright, in the gap it crosses, where a label
  // also keeps that gap from lying blank across the figure.
  /** @type {any[]} */
  const labels = [];
  /** @type {string[]} */
  const unplaced = [];
  const heads = turnHeads.map(({ x, y }) => ({
    x: x - wire.arrow,
    y: y - 2 * wire.arrow,
    width: 2 * wire.arrow,
    height: 2 * wire.arrow,
  }));
  const placed = labelClearance(field, spacing, {
    marks: [...boxes.values(), ...heads, ...(tab ? [tab] : [])],
    lines: wires,
    boundary,
    labels,
  });
  const order = ["path", "turn", "edge", "rung", "arch", "free"];
  const shares = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.12, 0.88];
  for (const { relation, points, kind } of [...wires].sort(
    (x, y) => order.indexOf(x.kind) - order.indexOf(y.kind),
  )) {
    if (!relation.label) continue;
    const { maximumLabel: most } = wire;
    const wrappings =
      kind === "path"
        ? [wrapped.get(relation) ?? label(relation), label(relation, most / 2)]
        : kind === "turn"
          ? [label(relation, most / 2)]
          : [
              label(relation),
              label(relation, (2 * most) / 3),
              label(relation, most / 2),
              label(relation, 0),
            ];
    const across = (/** @type {number[][]} */ stretch) =>
      kind === "edge" && upright(stretch) ? 0 : 1;
    const length = (/** @type {number[][]} */ [p, q]) => Math.hypot(q[0] - p[0], q[1] - p[1]);
    const stretches = stretchesOf(points).sort(
      (x, y) => across(x) - across(y) || length(y) - length(x),
    );
    // On its wire; then, for a wire that runs beside another between the same two parts, as a reply beside the line
    // does, off it on either side, so that neither label lies over the other's wire.
    const paired = /** @type {any[]} */ (pairs.get(pairOf(relation))).length > 1;
    const sides = paired && (kind === "path" || kind === "turn") ? [0, -1, 1] : [0];
    const candidates = sides.flatMap((side) =>
      wrappings.flatMap((wrapping) =>
        stretches.flatMap(([p, q]) => {
          const off =
            side * ((upright([p, q]) ? wrapping.width : wrapping.height) / 2 + spacing.labelClear);
          return shares.map((share) => ({
            x: p[0] + (q[0] - p[0]) * share - wrapping.width / 2 + (upright([p, q]) ? off : 0),
            y: p[1] + (q[1] - p[1]) * share - wrapping.height / 2 + (upright([p, q]) ? 0 : off),
            width: wrapping.width,
            height: wrapping.height,
            lines: wrapping.lines,
          }));
        }),
      ),
    );
    const found = candidates.find((candidate) => placed(candidate, relation, points));
    if (!found) unplaced.push(relation.id);
    labels.push({ relations: [relation], ...(found ?? candidates[0]) });
  }
  return { cards: boxes, paths, arrows, labels, boundary, arrow: wire.arrow, unplaced };
}
