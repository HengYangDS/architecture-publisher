/**
 * What a reader misreads in Archify's routes of one diagram, and where its
 * relation labels read as their own routes'. Archify lays out the routes and
 * places the labels; these measures find what it does not report, and a pin
 * moves a label it set in the wrong place.
 */

/** Archify's shortest route segment and shortest interior segment, in px. */
const SEGMENT = Object.freeze({ micro: 8, interior: 16 });
/**
 * Where routes stop reading as Archify draws them apart, in px. Archify spaces
 * the ends on one side of a card 14 px apart and runs a route between two cards
 * about 22 px from each. Two routes on one line with less than two interior
 * segments between them read as one route; a route nearer an edge than one and
 * a half shortest segments reads as a second outline; two ends on one side of a
 * card nearer than one and a half interior segments read as one doubled or
 * two-way arrow, and two routes that close for longer than four interior
 * segments read as one doubled line.
 */
const DEFECT = Object.freeze({
  join: 2 * SEGMENT.interior,
  along: 1.5 * SEGMENT.micro,
  crowd: 1.5 * SEGMENT.interior,
  double: 4 * SEGMENT.interior,
});

/** How far Archify sets a relation label beside its route, and its baseline below the label's top, in px. */
const LABEL = Object.freeze({ gap: 6, baseline: 10 });

/** The gap between two boxes, 0 where they touch or overlap. */
const gap = (a, b) =>
  Math.hypot(
    Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width)),
    Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height)),
  );

/** The box a route segment covers. */
const boxOf = ({ a, b }) => ({
  x: Math.min(a[0], b[0]),
  y: Math.min(a[1], b[1]),
  width: Math.abs(a[0] - b[0]),
  height: Math.abs(a[1] - b[1]),
});

/**
 * What a relation label may be read with on Archify's layout: the segments of
 * every route, by the connection they belong to, each connection's label box
 * and the edges of every boundary.
 * @param {any} layout Archify's layout of the diagram
 */
function labelScene(layout) {
  /** @type {Array<{ owner: number, a: number[], b: number[] }>} */
  const segments = layout.connections.flatMap(({ points }, owner) =>
    points.slice(1).map((point, index) => ({ owner, a: points[index], b: point })),
  );
  const anchor = ([x, y]) => `${x},${y}`;
  const byAnchor = new Map(layout.labels.map((label) => [anchor(label.labelAt), label]));
  /** @type {any[]} */
  const labels = layout.connections.map(({ labelAt }) => labelAt && byAnchor.get(anchor(labelAt)));
  const outlines = layout.boundaries.flatMap(({ x, y, width, height }) => [
    { x, y, width, height: 0 },
    { x, y: y + height, width, height: 0 },
    { x, y, width: 0, height },
    { x: x + width, y, width: 0, height },
  ]);
  /**
   * How near a box for the label of connection `owner` comes to its own route;
   * to another route, card or label, which a reader may take it for; to another
   * label alone; and to all of those and the outlines.
   * @param {number} owner
   * @param {{ x: number, y: number, width: number, height: number }} box
   */
  const distances = (owner, box) => {
    const nearest = (items) => Math.min(Infinity, ...items.map((item) => gap(box, item)));
    const label = nearest(labels.filter((item, index) => item && index !== owner));
    const taken = Math.min(
      label,
      nearest(segments.filter((segment) => segment.owner !== owner).map(boxOf)),
      nearest(layout.components),
    );
    return {
      own: nearest(segments.filter((segment) => segment.owner === owner).map(boxOf)),
      label,
      taken,
      other: Math.min(taken, nearest(outlines)),
    };
  };
  return { segments, labels, distances };
}

/** Where along a route segment a pinned label may stand: its middle first, then a quarter from either end. */
const ALONG = Object.freeze([0.5, 0.25, 0.75]);

/**
 * Where to pin the labels of `owners` so each reads as its own route's: beside
 * one of the route's segments, at its middle or a quarter from either end, on
 * either side, at the distance Archify keeps, wherever it is not taken for
 * anything else and lies farthest from everything else, when that is better
 * than where Archify set it. A label pinned earlier counts where it is pinned,
 * so labels that crowd one gap stand at different heights.
 * @param {any} layout Archify's layout of the diagram
 * @param {string[]} ids the diagram's connection ids, in Archify's order
 * @param {string[]} owners the ids of the connections whose labels to move
 * @returns {Map<string, number[]>} each moved label's anchor, by connection id
 */
export function clearLabels(layout, ids, owners) {
  const { segments, labels, distances } = labelScene(layout);
  /** @type {Map<string, number[]>} */
  const pins = new Map();
  for (const id of owners) {
    const owner = ids.indexOf(id);
    const box = labels[owner];
    if (!box) continue;
    // A place is better when its label is not taken for anything else, then
    // the farther it lies from everything else.
    const score = (place) => {
      const { own, label, taken, other } = distances(owner, place);
      return [taken > own && label >= SEGMENT.micro ? 1 : 0, other];
    };
    const better = (x, y) => x[0] > y[0] || (x[0] === y[0] && x[1] > y[1]);
    let best = { score: score(box), place: box };
    for (const { a, b } of segments.filter((segment) => segment.owner === owner)) {
      const corners = ALONG.flatMap((share) => {
        const [x, y] = [a[0] + share * (b[0] - a[0]), a[1] + share * (b[1] - a[1])];
        return Math.abs(a[0] - b[0]) < 0.5
          ? [x - LABEL.gap - box.width, x + LABEL.gap].map((left) => [left, y - box.height / 2])
          : [y - LABEL.gap - box.height, y + LABEL.gap].map((top) => [x - box.width / 2, top]);
      });
      for (const [left, top] of corners) {
        const place = { x: left, y: top, width: box.width, height: box.height };
        const value = score(place);
        if (better(value, best.score)) best = { score: value, place };
      }
    }
    if (best.place === box) continue;
    labels[owner] = best.place;
    pins.set(id, [
      Math.round(best.place.x + box.width / 2),
      Math.round(best.place.y + LABEL.baseline),
    ]);
  }
  return pins;
}

/**
 * What a reader misreads in Archify's routes of one diagram, and the
 * connections involved. Two routes read as one when they run side by side,
 * closer than Archify's shortest segment for longer than its shortest interior
 * segment, or when they line up, within that segment of one line, sharing a
 * stretch of it or ending less than two interior segments apart with no card
 * between them and no end in common. A route runs along an edge when it keeps
 * beside a card's or the boundary's edge for longer than an interior segment.
 * A relation label reads as another's when another route, a card or another
 * label is no farther from it than its own route, or another label is nearer
 * than Archify's shortest segment. Two routes are doubled when they
 * run side by side, closer than one and a half interior segments, for longer
 * than four. A label crowds when anything but its own route, an outline
 * included, comes within twice its own route's distance, or within the
 * shortest segment. Two route
 * ends crowd when they meet one side of a card close together.
 * @param {any} layout Archify's layout of the diagram
 * @param {string[]} ids the diagram's connection ids, in Archify's order
 */
export function routeDefects(layout, ids) {
  /** @type {number[][][]} */
  const routes = layout.connections.map(({ points }) => points);
  const { segments, labels, distances } = labelScene(layout);
  // The axis a segment keeps: 0 for a vertical one, 1 for a horizontal one.
  const axisOf = ({ a, b }) => [0, 1].find((axis) => Math.abs(a[axis] - b[axis]) < 0.5);
  const span = ({ a, b }, axis) => [a[axis], b[axis]].sort((p, q) => p - q);
  const same = (p, q) => Math.abs(p[0] - q[0]) < 0.5 && Math.abs(p[1] - q[1]) < 0.5;
  const ends = (owner) => [routes[owner][0], routes[owner][routes[owner].length - 1]];
  const shareEnd = (s, u) => ends(s).some((p) => ends(u).some((q) => same(p, q)));
  const cards = layout.components;
  // Whether a card stands on the line `at` between `from` and `to` along it.
  const cardBetween = (axis, at, from, to) =>
    cards.some(({ x, y, width, height }) => {
      const [across, along] =
        axis === 0
          ? [
              [x, x + width],
              [y, y + height],
            ]
          : [
              [y, y + height],
              [x, x + width],
            ];
      return at > across[0] && at < across[1] && along[0] < to && along[1] > from;
    });
  /** @type {Set<number>} */
  const misread = new Set();
  /** @type {Set<number>} */
  const doubled = new Set();
  let [tangles, joins, doubles] = [0, 0, 0];
  for (let i = 0; i < segments.length; i += 1)
    for (let j = i + 1; j < segments.length; j += 1) {
      const [s, u] = [segments[i], segments[j]];
      const axis = axisOf(s);
      if (s.owner === u.owner || axis === undefined || axisOf(u) !== axis) continue;
      const apart = Math.abs(s.a[axis] - u.a[axis]);
      const [p, q] = [span(s, 1 - axis), span(u, 1 - axis)];
      const overlap = Math.min(p[1], q[1]) - Math.max(p[0], q[0]);
      const side = apart >= 0.5 && apart < SEGMENT.micro && overlap > SEGMENT.interior;
      const lined =
        !side &&
        apart < SEGMENT.micro &&
        !shareEnd(s.owner, u.owner) &&
        ((apart < 0.5 && overlap > 0.5) ||
          (-overlap < DEFECT.join &&
            !cardBetween(axis, s.a[axis], Math.min(p[1], q[1]), Math.max(p[0], q[0]))));
      if (side) tangles += 1;
      if (lined) joins += 1;
      if (side || lined) misread.add(s.owner).add(u.owner);
      if (apart >= SEGMENT.micro && apart < DEFECT.crowd && overlap > DEFECT.double) {
        doubles += 1;
        doubled.add(s.owner).add(u.owner);
      }
    }
  const edges = [...cards, ...layout.boundaries].flatMap(({ x, y, width, height }) => [
    { axis: 1, at: y, from: x, to: x + width },
    { axis: 1, at: y + height, from: x, to: x + width },
    { axis: 0, at: x, from: y, to: y + height },
    { axis: 0, at: x + width, from: y, to: y + height },
  ]);
  /** @type {Set<number>} */
  const along = new Set();
  let hugs = 0;
  for (const segment of segments) {
    const axis = axisOf(segment);
    if (axis === undefined) continue;
    const [low, high] = span(segment, 1 - axis);
    for (const edge of edges)
      if (
        edge.axis === axis &&
        Math.abs(segment.a[axis] - edge.at) < DEFECT.along &&
        Math.min(high, edge.to) - Math.max(low, edge.from) > SEGMENT.interior
      ) {
        hugs += 1;
        along.add(segment.owner);
      }
  }
  /** @type {Map<string, Array<{ owner: number, at: number }>>} */
  const sides = new Map();
  routes.forEach((_, owner) => {
    for (const [px, py] of ends(owner))
      for (const { id, x, y, width, height } of cards) {
        const across = px >= x && px <= x + width;
        const down = py >= y && py <= y + height;
        const side =
          (across && Math.abs(py - y) < 0.5 && "top") ||
          (across && Math.abs(py - y - height) < 0.5 && "bottom") ||
          (down && Math.abs(px - x) < 0.5 && "left") ||
          (down && Math.abs(px - x - width) < 0.5 && "right");
        if (!side) continue;
        const key = `${id}:${side}`;
        sides.set(key, [
          ...(sides.get(key) ?? []),
          { owner, at: side === "top" || side === "bottom" ? px : py },
        ]);
      }
  });
  let crowded = 0;
  for (const list of sides.values())
    for (let i = 0; i < list.length; i += 1)
      for (let j = i + 1; j < list.length; j += 1) {
        const spacing = Math.abs(list[i].at - list[j].at);
        if (list[i].owner !== list[j].owner && spacing >= 0.5 && spacing < DEFECT.crowd)
          crowded += 1;
      }
  /** @type {Set<number>} */
  const mislabelled = new Set();
  /** @type {Set<number>} */
  const labelled = new Set();
  labels.forEach((box, owner) => {
    if (!box) return;
    const { own, label, taken, other } = distances(owner, box);
    if (taken <= own || label < SEGMENT.micro) mislabelled.add(owner);
    else if (other < Math.max(SEGMENT.micro, 2 * own)) labelled.add(owner);
  });
  const named = (owners) => [...owners].sort((a, b) => a - b).map((owner) => ids[owner]);
  return {
    tangles,
    joins,
    hugs,
    mislabels: mislabelled.size,
    doubles,
    labels: labelled.size,
    crowded,
    owners: {
      misread: named(misread),
      along: named(along),
      doubled: named(doubled),
      mislabelled: named(mislabelled),
      labelled: named(labelled),
    },
  };
}
