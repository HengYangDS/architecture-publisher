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

/**
 * How far Archify sets a relation label beside its route, its baseline below
 * the label's top, and how far above its route Archify anchors a label it is
 * given no place for, in px.
 */
const LABEL = Object.freeze({ gap: 6, baseline: 10, rise: 10 });
/**
 * How far everything but its own route keeps from a label that reads clearly
 * as its route's: two and a half times as far as its own route, and no nearer
 * than Archify's shortest interior segment.
 */
const CLEAR = Object.freeze({ ratio: 2.5, least: SEGMENT.interior });
/**
 * How far a reader carries a route's segment on past its corner, two and a half
 * interior segments, and how near that line a label lies on it: a label the
 * line runs into reads as that route's, as if the route went on to it.
 */
const LINE = Object.freeze({ reach: 2.5 * SEGMENT.interior, slack: 2 });

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
 * Whether two relations from one card share their label, which the diagram sets
 * once, on one of them: they leave the card at one point and only one of them
 * carries the label.
 * @param {any} layout Archify's layout of the diagram
 * @param {number} s
 * @param {number} u
 */
function fan(layout, s, u) {
  const [p, q] = [layout.connections[s], layout.connections[u]];
  const [a, b] = [p.points[0], q.points[0]];
  return (
    p.from === q.from &&
    (!p.label || !q.label) &&
    Math.abs(a[0] - b[0]) < 0.5 &&
    Math.abs(a[1] - b[1]) < 0.5
  );
}

/**
 * What a relation label may be read with on Archify's layout: the segments of
 * every route, by the connection they belong to, each segment carried on past
 * its corners, each connection's label box and the edges of every boundary.
 * @param {any} layout Archify's layout of the diagram
 */
function labelScene(layout) {
  /** @type {Array<{ owner: number, a: number[], b: number[] }>} */
  const segments = layout.connections.flatMap(({ points }, owner) =>
    points.slice(1).map((point, index) => ({ owner, a: points[index], b: point })),
  );
  /** @type {Array<{ owner: number, a: number[], b: number[] }>} */
  const lines = layout.connections.flatMap(({ points }, owner) =>
    points.slice(1, -1).flatMap((corner, index) =>
      [points[index], points[index + 2]].flatMap((from) => {
        const length = Math.hypot(corner[0] - from[0], corner[1] - from[1]);
        if (!length) return [];
        const on = LINE.reach / length;
        const b = [corner[0] + on * (corner[0] - from[0]), corner[1] + on * (corner[1] - from[1])];
        return [{ owner, a: corner, b }];
      }),
    ),
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
   * label alone; and to all of those, the outlines and the lines other routes
   * carry on past their corners, a box on such a line lying at none.
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
    const online = lines.some(
      (line) =>
        line.owner !== owner &&
        !fan(layout, owner, line.owner) &&
        gap(box, boxOf(line)) < LINE.slack,
    );
    return {
      own: nearest(segments.filter((segment) => segment.owner === owner).map(boxOf)),
      label,
      taken,
      other: online ? 0 : Math.min(taken, nearest(outlines)),
    };
  };
  return { segments, labels, distances };
}

/** Where along a route segment a pinned label may stand: its middle first, then a quarter from either end. */
const ALONG = Object.freeze([0.5, 0.25, 0.75]);

/** Whether a label stands clear of everything but its own route, by its distances. */
const clear = ({ own, other }) => other >= Math.max(CLEAR.least, CLEAR.ratio * own);

/**
 * Where Archify anchors a label it is given no place for: above the middle of
 * the route's second segment, or of a route of one segment at the height where
 * it starts.
 * @param {number[][]} points the route
 */
function defaultAnchor(points) {
  const [a, b] = points.length === 2 ? points : points.slice(1, 3);
  const y = points.length === 2 ? a[1] : (a[1] + b[1]) / 2;
  return [(a[0] + b[0]) / 2, y - LABEL.rise];
}

/**
 * Where to pin the labels of `owners` so each reads as its own route's: on one
 * of the route's segments, or beside it at the distance Archify keeps, at its
 * middle or a quarter from either end, inside the canvas, wherever it is not
 * taken for anything else and lies farthest from everything else, when that is
 * better than where Archify set it. On a segment the label masks its route, as Archify's own
 * labels do, where the segment runs on past the label by a shortest segment at
 * either end. A label pinned earlier counts where it is pinned, so labels that
 * crowd one gap stand at different heights. A pin is an offset from the anchor
 * Archify sets the label at by default, not an anchor of its own: Archify
 * leaves the ends of a route whose label has its own anchor out of spreading
 * the ends on one side of a card, so they can meet another route's.
 * @param {any} layout Archify's layout of the diagram
 * @param {string[]} ids the diagram's connection ids, in Archify's order
 * @param {string[]} owners the ids of the connections whose labels to move
 * @returns {Map<string, number[]>} each moved label's offset, by connection id
 */
export function clearLabels(layout, ids, owners) {
  const { segments, labels, distances } = labelScene(layout);
  const [width, height] = layout.viewBox;
  const inside = ({ x, y, width: wide, height: high }) =>
    x >= 0 && y >= 0 && x + wide <= width && y + high <= height;
  /** @type {Map<string, number[]>} */
  const pins = new Map();
  for (const id of owners) {
    const owner = ids.indexOf(id);
    const box = labels[owner];
    if (!box) continue;
    // A place is better when its label is not taken for anything else, then
    // when it stands clear, then the farther it lies from everything else.
    const score = (place) => {
      const distance = distances(owner, place);
      const { own, label, taken, other } = distance;
      return [taken > own && label >= SEGMENT.micro ? 1 : 0, clear(distance) ? 1 : 0, other];
    };
    const better = (x, y) => {
      const at = x.findIndex((value, index) => value !== y[index]);
      return at >= 0 && x[at] > y[at];
    };
    let best = { score: score(box), place: box };
    for (const { a, b } of segments.filter((segment) => segment.owner === owner)) {
      const vertical = Math.abs(a[0] - b[0]) < 0.5;
      const length = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const runs = length >= (vertical ? box.height : box.width) + 2 * SEGMENT.micro;
      const corners = ALONG.flatMap((share) => {
        const [x, y] = [a[0] + share * (b[0] - a[0]), a[1] + share * (b[1] - a[1])];
        const beside = vertical
          ? [x - LABEL.gap - box.width, x + LABEL.gap].map((left) => [left, y - box.height / 2])
          : [y - LABEL.gap - box.height, y + LABEL.gap].map((top) => [x - box.width / 2, top]);
        return runs ? [[x - box.width / 2, y - box.height / 2], ...beside] : beside;
      });
      for (const [left, top] of corners) {
        const place = { x: left, y: top, width: box.width, height: box.height };
        if (!inside(place)) continue;
        const value = score(place);
        if (better(value, best.score)) best = { score: value, place };
      }
    }
    if (best.place === box) continue;
    labels[owner] = best.place;
    const [x, y] = defaultAnchor(layout.connections[owner].points);
    pins.set(id, [
      Math.round(best.place.x + box.width / 2 - x),
      Math.round(best.place.y + LABEL.baseline - y),
    ]);
  }
  return pins;
}

/**
 * What a reader misreads in Archify's routes of one diagram, and the
 * connections involved. Two routes read as one when they run side by side,
 * closer than Archify's shortest segment for longer than its shortest interior
 * segment, when they line up, within that segment of one line, sharing a
 * stretch of it or ending less than two interior segments apart with no card
 * between them, or when they end at one point. Only the routes of one label
 * fan out of one point: relations from one card that share their label, which
 * the diagram labels once. A route runs along an edge when it keeps beside a
 * card's or the boundary's edge for longer than an interior segment. A
 * relation label reads as another's when another route, a card or another
 * label is no farther from it than its own route, or another label is nearer
 * than Archify's shortest segment. Two routes are doubled when they run side
 * by side, closer than one and a half interior segments, for longer than four.
 * A label crowds when anything but its own route, an outline included, comes
 * within two and a half times its own route's distance, or within the
 * shortest interior segment, or when another route's segment carried on past
 * its corner runs into it. Two route ends crowd when they meet one side of a
 * card close together.
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
  const ends = (owner) => [routes[owner][0], routes[owner][routes[owner].length - 1]];
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
  // Pairs of routes already read as one, by their owners.
  const together = new Set();
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
        !fan(layout, s.owner, u.owner) &&
        ((apart < 0.5 && overlap > 0.5) ||
          (-overlap < DEFECT.join &&
            !cardBetween(axis, s.a[axis], Math.min(p[1], q[1]), Math.max(p[0], q[0]))));
      if (side) tangles += 1;
      if (lined) joins += 1;
      if (side || lined) {
        misread.add(s.owner).add(u.owner);
        together.add(`${s.owner}:${u.owner}`).add(`${u.owner}:${s.owner}`);
      }
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
        const [p, q] = [list[i].owner, list[j].owner];
        if (p === q) continue;
        const spacing = Math.abs(list[i].at - list[j].at);
        if (spacing < 0.5) {
          // Two routes into one point read as one, unless one label fans out of it.
          if (!fan(layout, p, q) && !together.has(`${p}:${q}`)) {
            joins += 1;
            misread.add(p).add(q);
          }
        } else if (spacing < DEFECT.crowd) crowded += 1;
      }
  /** @type {Set<number>} */
  const mislabelled = new Set();
  /** @type {Set<number>} */
  const labelled = new Set();
  labels.forEach((box, owner) => {
    if (!box) return;
    const distance = distances(owner, box);
    if (distance.taken <= distance.own || distance.label < SEGMENT.micro) mislabelled.add(owner);
    else if (!clear(distance)) labelled.add(owner);
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
