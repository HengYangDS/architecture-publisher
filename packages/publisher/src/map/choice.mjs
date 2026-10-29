import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { refuse } from "../refusal.mjs";
import { diagramCandidates, runArchify } from "./archify.mjs";

/**
 * The choice of each view's diagram on Archify's own routes. Archify validates
 * and measures every candidate; the routes it lays out are measured as well for
 * what a reader misreads and Archify does not report: two routes that read as
 * one, a route along an edge and route ends crowded on one side of a card. The
 * connections of a choice that still crosses or misreads take other sides.
 */

/** The shapes a diagram should take, width over height, and the narrowest it may take. */
const SHAPE = Object.freeze({ low: 1, high: 1.8, least: 0.7 });
/** The stretch Archify suggests a route stay within: its length over the distance it spans. */
const STRETCH = 1.35;
/** Archify's shortest route segment and shortest interior segment, in px. */
const SEGMENT = Object.freeze({ micro: 8, interior: 16 });
/**
 * Where routes stop reading as Archify draws them apart, in px. Archify spaces
 * the ends on one side of a card 14 px apart and runs a route between two cards
 * about 22 px from each. Two routes on one line with less than two interior
 * segments between them read as one route; a route nearer an edge than one and
 * a half shortest segments reads as a second outline; two ends on one side of a
 * card nearer than one and a half interior segments read as one doubled or
 * two-way arrow.
 */
const DEFECT = Object.freeze({
  join: 2 * SEGMENT.interior,
  along: 1.5 * SEGMENT.micro,
  crowd: 1.5 * SEGMENT.interior,
});
/**
 * A repair: the diagrams it starts from, the rounds it takes from each and the
 * most re-sided diagrams it measures for one view.
 */
const REPAIR = Object.freeze({ starts: 3, rounds: 2, budget: 96 });
const OUTWARD = Object.freeze({ top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] });
/**
 * Archify's reader at a 1440 px viewport sets a panel's preview beside its
 * steps only when the preview, cropped to its drawing with 6 px around it and
 * drawn wide enough for its smallest text to reach the 10.875 px reading
 * floor, leaves the steps 320 px of the 1246 px panel body and the 36 px gap
 * between them. Stacked above its steps instead, a preview leaves the steps a
 * narrow column under it and most of the panel blank. Its smallest text is a
 * 9-unit sublabel, or else the 11-unit label: a relation's 8-unit label counts
 * at 0.7 of its size, as Archify counts it.
 */
const BESIDE = Object.freeze({ floor: 10.875, room: 890, crop: 12, sublabel: 9, label: 11 });

/** Whether Archify's reader sets a diagram's preview beside its steps at 1440 px. */
export function besideSteps(drawing) {
  const smallest = drawing.sublabels ? BESIDE.sublabel : BESIDE.label;
  return Math.ceil(((drawing.width + BESIDE.crop) * BESIDE.floor) / smallest) + 2 <= BESIDE.room;
}

/** Candidates Archify measures at once. */
const CONCURRENCY = 4;
/** The route measures the choice ranks by; an Archify answer that passes carries each one. */
const MEASURES = Object.freeze([
  "properCrossings",
  "resolvedCrossovers",
  "routesOverSuggestedBends",
  "maxBends",
  "maxStretch",
  "ambiguousCorridors",
]);

/**
 * The route measures of a candidate that Archify passed. A measure Archify no
 * longer reports refuses the view, so it is never read as zero.
 * @param {any} composition Archify's composition verdict
 */
export function routeMetrics(composition) {
  const metrics = composition.metrics ?? {};
  const missing = MEASURES.filter((name) => typeof metrics[name] !== "number");
  if (missing.length)
    refuse(
      "page_measures_missing",
      `Archify's answer lacks the route measures ${missing.join(", ")}; ` +
        "the vendored Archify does not match this publisher.",
    );
  return {
    crossings: metrics.properCrossings + metrics.resolvedCrossovers,
    routesOverTwoBends: metrics.routesOverSuggestedBends,
    maxBends: metrics.maxBends,
    maxStretch: metrics.maxStretch,
    corridors: metrics.ambiguousCorridors,
  };
}

/**
 * What a reader misreads in Archify's routes of one diagram, and the
 * connections involved. Two routes read as one when they run side by side,
 * closer than Archify's shortest segment for longer than its shortest interior
 * segment, or when they line up, within that segment of one line, sharing a
 * stretch of it or ending less than two interior segments apart with no card
 * between them and no end in common. A route runs along an edge when it keeps
 * beside a card's or the boundary's edge for longer than an interior segment.
 * A relation label crowds when it comes nearer another route or a card than
 * Archify's shortest segment, where it reads as theirs. Two route ends crowd
 * when they meet one side of a card close together.
 * @param {any} layout Archify's layout of the diagram
 * @param {string[]} ids the diagram's connection ids, in Archify's order
 */
export function routeDefects(layout, ids) {
  /** @type {number[][][]} */
  const routes = layout.connections.map(({ points }) => points);
  const segments = routes.flatMap((points, owner) =>
    points.slice(1).map((point, index) => ({ owner, a: points[index], b: point })),
  );
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
  let [tangles, joins] = [0, 0];
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
    }
  const edges = [...cards, ...(layout.boundaries ?? [])].flatMap(({ x, y, width, height }) => [
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
  // The gap between two boxes, 0 where they touch or overlap.
  const gap = (a, b) =>
    Math.hypot(
      Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width)),
      Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height)),
    );
  const boxOf = ({ a, b }) => ({
    x: Math.min(a[0], b[0]),
    y: Math.min(a[1], b[1]),
    width: Math.abs(a[0] - b[0]),
    height: Math.abs(a[1] - b[1]),
  });
  const anchor = (at) => `${at?.[0]},${at?.[1]}`;
  const boxes = new Map((layout.labels ?? []).map((label) => [anchor(label.labelAt), label]));
  /** @type {Set<number>} */
  const labelled = new Set();
  layout.connections.forEach(({ labelAt }, owner) => {
    const box = labelAt && boxes.get(anchor(labelAt));
    if (!box) return;
    const near = (other) => gap(box, other) < SEGMENT.micro;
    if (
      segments.some((segment) => segment.owner !== owner && near(boxOf(segment))) ||
      cards.some(near)
    )
      labelled.add(owner);
  });
  const named = (owners) => [...owners].sort((a, b) => a - b).map((owner) => ids[owner]);
  return {
    tangles,
    joins,
    hugs,
    labels: labelled.size,
    crowded,
    misread: named(misread),
    along: named(along),
    labelled: named(labelled),
  };
}

/**
 * Archify's showcase verdict and route metrics for one candidate document, with
 * the route defects it does not report, and the connections a repair re-sides:
 * those whose routes cross, then those a reader misreads, those along an edge
 * and those whose labels crowd.
 * @param {string} file
 * @param {string[]} ids the document's connection ids
 */
async function measure(file, ids) {
  const validate = ["validate", "architecture", file, "--json", "--quality", "showcase"];
  const { answer } = await runArchify(validate);
  const composition = answer.composition ?? {};
  const passes =
    answer.ok === true &&
    (answer.checks ?? []).every(({ ok }) => ok) &&
    composition.status === "pass" &&
    !composition.summary?.errors &&
    !composition.summary?.warnings;
  const diagnostics = answer.diagnostics ?? composition.issues ?? [];
  // Only a candidate that passes is ranked.
  if (!passes) return { file, passes, diagnostics, faults: [], metrics: null };
  const metrics = routeMetrics(composition);
  const { answer: layout } = await runArchify([...validate, "--layout-json"]);
  if (!Array.isArray(layout.connections) || layout.connections.length !== ids.length)
    refuse(
      "page_measures_missing",
      "Archify's layout lacks the routes of its connections; " +
        "the vendored Archify does not match this publisher.",
    );
  const { misread, along, labelled, ...defects } = routeDefects(layout, ids);
  const crossing = (composition.routeReview?.crossings ?? []).flatMap(({ left, right }) => [
    left.id,
    right.id,
  ]);
  return {
    file,
    passes,
    diagnostics,
    faults: [...new Set([...crossing, ...misread, ...along, ...labelled])],
    metrics: { ...metrics, ...defects },
  };
}

/** How far a shape lies outside the band a diagram should take; Infinity below the narrowest it may take. */
function shapeDistance(width, height) {
  const ratio = width / height;
  if (ratio < SHAPE.least) return Infinity;
  return Math.max(0, SHAPE.low - ratio, ratio - SHAPE.high);
}

/**
 * The document with every connection side left to Archify, which plans the
 * sides of all connections together and can order ports that a side fixed by
 * the grid would cross.
 */
function archifySides(document) {
  return {
    ...document,
    connections: document.connections.map((connection) =>
      Object.fromEntries(
        Object.entries(connection).filter(([key]) => key !== "fromSide" && key !== "toSide"),
      ),
    ),
  };
}

/**
 * The document once for each other pair of sides one connection can take: its
 * sides left to Archify, or a side of each card that does not face away from
 * the other card.
 */
function resided(document, id) {
  const centre = new Map(
    document.components.map(({ id: node, pos, size }) => [
      node,
      [pos[0] + size[0] / 2, pos[1] + size[1] / 2],
    ]),
  );
  const connection = document.connections.find((item) => item.id === id);
  const [from, to] = [centre.get(connection.from), centre.get(connection.to)];
  const facing = (dx, dy) =>
    Object.entries(OUTWARD)
      .filter(([, [x, y]]) => x * dx + y * dy >= 0)
      .map(([side]) => side);
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]];
  const [bare] = archifySides({ connections: [connection] }).connections;
  return [
    bare,
    ...facing(dx, dy).flatMap((fromSide) =>
      facing(-dx, -dy).map((toSide) => ({ ...bare, fromSide, toSide })),
    ),
  ]
    .filter(
      (variant) => variant.fromSide !== connection.fromSide || variant.toSide !== connection.toSide,
    )
    .map((variant) => ({
      ...document,
      connections: document.connections.map((item) => (item.id === id ? variant : item)),
    }));
}

/** Measure documents on Archify's routes, a few at a time, each in its own file under `directory`. */
function measurer(directory) {
  let written = 0;
  return async (documents) => {
    const files = documents.map(() => path.join(directory, `${written++}.architecture.json`));
    const measured = new Array(documents.length);
    let next = 0;
    const worker = async () => {
      while (next < documents.length) {
        const index = next++;
        await fs.writeFile(files[index], `${JSON.stringify(documents[index], null, 2)}\n`);
        const ids = documents[index].connections.map(({ id }) => id);
        measured[index] = await measure(files[index], ids);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    return measured;
  };
}

// Routes a reader takes for one, or for a card's outline, state what the model
// does not, so they outrank a crossing, which a reader sees as two routes. A
// preview stacked above its steps leaves most of its panel blank; a route bent
// more than twice is harder to follow than a label set close to another route
// or card, and both are harder than ends crowded on one side of a card.
const rank = ({ metrics, width, height, drawing, index }) => [
  metrics.tangles + metrics.joins + metrics.hugs,
  metrics.crossings,
  besideSteps(drawing) ? 0 : 1,
  metrics.routesOverTwoBends,
  metrics.labels,
  metrics.crowded,
  Math.max(0, metrics.maxStretch - STRETCH),
  shapeDistance(width, height),
  index,
];

function compare(a, b) {
  const [x, y] = [rank(a), rank(b)];
  const at = x.findIndex((value, position) => value !== y[position]);
  return at < 0 ? 0 : x[at] - y[at];
}

/**
 * Change the sides of the connections whose routes cross, read as one, run
 * along an edge or carry a crowded label. From each diagram, each round
 * measures every such connection with each other pair of sides it can take, and
 * keeps the best change when it ranks the diagram higher, until no change helps
 * or the budget is spent.
 * @param {any[]} starts
 * @param {(documents: any[]) => Promise<any[]>} measureAll
 */
async function repair(starts, measureAll) {
  let budget = REPAIR.budget;
  const repaired = [];
  for (const start of starts) {
    let current = start;
    for (let round = 0; round < REPAIR.rounds && current.faults.length && budget; round += 1) {
      const changes = current.faults
        .flatMap((id) => resided(current.document, id).map((document) => ({ id, document })))
        .slice(0, budget);
      budget -= changes.length;
      const measured = (await measureAll(changes.map(({ document }) => document))).map(
        (result, index) => ({
          ...current,
          ...result,
          document: changes[index].document,
          resided: [...new Set([...current.resided, changes[index].id])],
        }),
      );
      const [next] = measured.filter(({ passes }) => passes).sort(compare);
      if (!next || compare(next, current) >= 0) break;
      current = next;
    }
    repaired.push(current);
  }
  return repaired;
}

/**
 * Lay out a view's candidate diagrams, measure each on Archify's own routes,
 * once with the grid's connection sides and once with every side left to
 * Archify, and choose among those that pass Archify's showcase checks: the
 * fewest routes a reader takes for one or that run along an edge, then the
 * fewest crossings, one the reader sets beside its steps, the fewest routes over
 * two bends, crowded labels and crowded route ends, the least stretch above
 * 1.35 and the shape nearest 1.0 to 1.8 times as wide as high. When the choice
 * still has a defect or stands above its steps, the best few, and the best few
 * beside their steps, are repaired by changing the sides of the connections
 * involved. A view with no candidate inside the shape bounds, or none that
 * passes, is refused.
 */
export async function chooseDiagram(model, view) {
  const candidates = diagramCandidates(model, view).filter(
    ({ width, height }) => shapeDistance(width, height) !== Infinity,
  );
  if (!candidates.length)
    refuse(
      "page_shape_refused",
      `View ${view.id} has no diagram at least ${SHAPE.least} times as wide as it is high. ` +
        "Split the view or declare fewer tiers.",
    );
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-diagrams-"));
  try {
    const measureAll = measurer(directory);
    // Archify plans the sides of all connections together and can order ports
    // that a side fixed by the grid would cross, so each candidate is measured
    // both ways.
    const documents = [
      ...candidates.map(({ document }) => ({ document, sides: "grid" })),
      ...candidates.map(({ document }) => ({ document: archifySides(document), sides: "archify" })),
    ];
    const measured = (await measureAll(documents.map(({ document }) => document))).map(
      (result, index) => ({
        ...candidates[index % candidates.length],
        document: documents[index].document,
        ...result,
        sides: documents[index].sides,
        resided: [],
        index,
      }),
    );
    const passing = measured.filter(({ passes }) => passes).sort(compare);
    if (!passing.length)
      return refuse(
        "page_diagram_refused",
        `View ${view.id} has no diagram that passes Archify's showcase checks.`,
        measured[0].diagnostics.slice(0, 20).map((issue) => ({
          code: String(issue.code ?? "archify"),
          path: `/views/${view.id}`,
          message: String(issue.message ?? "").slice(0, 400),
        })),
      );
    let [chosen] = passing;
    let tried = measured.length;
    if (chosen.faults.length || !besideSteps(chosen.drawing)) {
      const beside = passing.filter(({ drawing }) => besideSteps(drawing));
      const starts = [
        ...new Set([...passing.slice(0, REPAIR.starts), ...beside.slice(0, REPAIR.starts)]),
      ];
      const repaired = await repair(starts, async (changed) => {
        tried += changed.length;
        return measureAll(changed);
      });
      [chosen] = [chosen, ...repaired].sort(compare);
    }
    return {
      view: view.id,
      nodes: chosen.nodes,
      document: chosen.document,
      width: chosen.width,
      height: chosen.document.meta.viewBox[1],
      rows: chosen.rows,
      sides: chosen.sides,
      resided: chosen.resided,
      metrics: chosen.metrics,
      candidates: tried,
    };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
