import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { refuse } from "../refusal.mjs";
import { diagramCandidates, runArchify } from "./archify.mjs";
import { clearLabels, routeDefects } from "./routes.mjs";

/**
 * The choice of each view's diagram on Archify's own routes. Archify validates
 * and measures every candidate; the routes it lays out are measured as well for
 * what a reader misreads and Archify does not report: two routes that read as
 * one, a route along an edge, a label nearer something else than its own route,
 * two routes doubled side by side, a label set close to another route, card,
 * outline or label, and route ends crowded on one side of a card. The
 * connections of a choice that still has such a defect take other sides.
 */

/** The shapes a diagram should take, width over height, and the narrowest it may take. */
const SHAPE = Object.freeze({ low: 1, high: 1.8, least: 0.7 });
/** The stretch Archify suggests a route stay within: its length over the distance it spans. */
const STRETCH = 1.35;
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
 * 9-unit sublabel or boundary label, or else the 11-unit label: a relation's
 * 8-unit label counts at 0.7 of its size, as Archify counts it.
 */
const BESIDE = Object.freeze({ floor: 10.875, room: 890, crop: 12, small: 9, label: 11 });

/**
 * The drawing Archify's reader crops a preview to, on Archify's own layout: its
 * cards, boundaries, routes and relation labels, which can reach past the cards,
 * and the size of its smallest text.
 * @param {any} layout Archify's layout of the diagram
 * @param {any} document the diagram's document
 */
export function drawingOf(layout, document) {
  const boxes = [...layout.components, ...layout.boundaries, ...layout.labels];
  const xs = [
    ...boxes.flatMap(({ x, width }) => [x, x + width]),
    ...layout.connections.flatMap(({ points }) => points.map(([x]) => x)),
  ];
  const small =
    layout.boundaries.length > 0 || document.components.some((item) => "sublabel" in item);
  return {
    width: Math.max(...xs) - Math.min(...xs),
    smallest: small ? BESIDE.small : BESIDE.label,
  };
}

/** Whether Archify's reader sets a diagram's preview beside its steps at 1440 px. */
export function besideSteps(drawing) {
  return (
    Math.ceil(((drawing.width + BESIDE.crop) * BESIDE.floor) / drawing.smallest) + 2 <= BESIDE.room
  );
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

/** The parts of Archify's layout the route defects and the drawing read. */
const LAYOUT = Object.freeze(["components", "boundaries", "connections", "labels"]);

/**
 * Archify's layout of a candidate that Archify passed. A layout without its
 * cards, boundaries, labels or the route of each connection refuses the view,
 * as a missing route measure does.
 * @param {any} layout Archify's layout answer
 * @param {number} connections the document's connection count
 */
export function routeLayout(layout, connections) {
  const complete =
    LAYOUT.every((part) => Array.isArray(layout[part])) &&
    layout.connections.length === connections;
  if (!complete)
    refuse(
      "page_measures_missing",
      "Archify's layout lacks the cards, boundaries, labels or routes of its connections; " +
        "the vendored Archify does not match this publisher.",
    );
  return layout;
}

/**
 * Archify's showcase verdict and route metrics for one candidate document, with
 * the route defects it does not report, the drawing its preview is cropped to,
 * the connections a repair re-sides — those whose routes cross, read as one or
 * run along an edge, then those whose labels are read as another's or crowd —
 * and those whose labels a pin may move. Doubled routes are only ranked: they
 * mostly fan out of one card, where other sides rarely part them.
 * @param {string} file
 * @param {any} document the document written to `file`
 */
async function measure(file, document) {
  const ids = document.connections.map(({ id }) => id);
  const quality = document.meta.quality_profile;
  const validate = ["validate", "architecture", file, "--json", "--quality", quality];
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
  const laid = await runArchify([...validate, "--layout-json"]);
  const layout = routeLayout(laid.answer, ids.length);
  const { owners, ...defects } = routeDefects(layout, ids);
  const crossing = (composition.routeReview?.crossings ?? []).flatMap(({ left, right }) => [
    left.id,
    right.id,
  ]);
  return {
    file,
    passes,
    diagnostics,
    faults: [
      ...new Set([
        ...crossing,
        ...owners.misread,
        ...owners.along,
        ...owners.mislabelled,
        ...owners.labelled,
      ]),
    ],
    mislabelled: owners.mislabelled,
    relabel: [...new Set([...owners.mislabelled, ...owners.labelled])],
    layout,
    metrics: { ...metrics, ...defects },
    drawing: drawingOf(layout, document),
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
        measured[index] = await measure(files[index], documents[index]);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    return measured;
  };
}

// Routes a reader takes for one, or for a card's outline, state what the model
// does not, so they outrank a crossing, which a reader sees as two routes. A
// preview stacked above its steps leaves most of its panel blank. A label read
// as another relation's or a card's states what the model does not as well,
// but a pin moves most such labels clear, so it ranks after the layout of the
// page, and before two routes doubled into one line; a route bent more than
// twice is harder to follow than a label set close to something else, and both
// are harder than ends crowded on one side of a card.
// Ranked by its routes alone, a diagram counts no label: a label in the wrong
// place can be pinned beside its own route.
const rank = ({ metrics, width, height, drawing, index }, labels = true) => [
  metrics.tangles + metrics.joins + metrics.hugs,
  metrics.crossings,
  besideSteps(drawing) ? 0 : 1,
  labels ? metrics.mislabels : 0,
  metrics.doubles,
  metrics.routesOverTwoBends,
  labels ? metrics.labels : 0,
  metrics.crowded,
  Math.max(0, metrics.maxStretch - STRETCH),
  shapeDistance(width, height),
  index,
];

function compare(a, b, labels = true) {
  const [x, y] = [rank(a, labels), rank(b, labels)];
  const at = x.findIndex((value, position) => value !== y[position]);
  return at < 0 ? 0 : x[at] - y[at];
}

const byRoutes = (a, b) => compare(a, b, false);

/**
 * Change the sides of the connections whose routes cross, read as one or run
 * along an edge, or whose labels are read as another's or crowd. From each
 * diagram, each round measures every such connection with each other pair of
 * sides it can take, and keeps the best change when it ranks the diagram
 * higher, until no change helps or the budget is spent.
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
 * fewest crossings, one the reader sets beside its steps, the fewest labels read
 * as another's, doubled routes and routes over two bends, crowded labels and
 * crowded route ends, the least stretch above
 * 1.35 and the shape nearest 1.0 to 1.8 times as wide as high. When the choice
 * still has a defect or stands above its steps, the best few, and the best few
 * beside their steps, are repaired by changing the sides of the connections
 * involved. When the choice still has a label read as another's or crowded,
 * the labels of the best few by their routes alone are pinned clear beside
 * their own routes. A view with no candidate inside the shape bounds, or none
 * that passes at the build's quality, is refused.
 * @param {any} model
 * @param {any} view
 * @param {"showcase" | "standard"} [quality]
 */
export async function chooseDiagram(model, view, quality = "showcase") {
  const candidates = diagramCandidates(model, view, quality).filter(
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
        pinned: [],
        index,
      }),
    );
    const passing = measured.filter(({ passes }) => passes).sort(compare);
    if (!passing.length)
      return refuse(
        "page_diagram_refused",
        `View ${view.id} has no diagram that passes Archify's ${quality} checks.`,
        measured[0].diagnostics.slice(0, 20).map((issue) => ({
          code: String(issue.code ?? "archify"),
          path: `/views/${view.id}`,
          message: String(issue.message ?? "").slice(0, 400),
        })),
      );
    let tried = measured.length;
    let pool = passing;
    if (passing[0].faults.length || !besideSteps(passing[0].drawing)) {
      const beside = passing.filter(({ drawing }) => besideSteps(drawing));
      const starts = [
        ...new Set([...passing.slice(0, REPAIR.starts), ...beside.slice(0, REPAIR.starts)]),
      ];
      const repaired = await repair(starts, async (changed) => {
        tried += changed.length;
        return measureAll(changed);
      });
      pool = [...passing, ...repaired];
    }
    let [chosen] = [...pool].sort(compare);
    if (chosen.relabel.length) {
      // Pinning a label moves Archify's routes around it, so the labels read as
      // another's are pinned alone as well as with those that only crowd.
      const starts = [...pool]
        .sort(byRoutes)
        .slice(0, REPAIR.starts)
        .flatMap((start) => {
          const ids = start.document.connections.map(({ id }) => id);
          const sets = start.mislabelled.length
            ? [start.mislabelled, start.relabel]
            : [start.relabel];
          const seen = new Set();
          return sets.flatMap((owners) => {
            const pins = clearLabels(start.layout, ids, owners);
            const key = JSON.stringify([...pins]);
            if (!pins.size || seen.has(key)) return [];
            seen.add(key);
            const document = {
              ...start.document,
              connections: start.document.connections.map((item) =>
                pins.has(item.id) ? { ...item, labelAt: pins.get(item.id) } : item,
              ),
            };
            return [{ start, document, pinned: [...pins.keys()] }];
          });
        });
      tried += starts.length;
      const pinned = (await measureAll(starts.map(({ document }) => document))).map(
        (result, index) => ({
          ...starts[index].start,
          ...result,
          document: starts[index].document,
          pinned: starts[index].pinned,
        }),
      );
      [chosen] = [chosen, ...pinned.filter(({ passes }) => passes)].sort(compare);
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
      pinned: chosen.pinned,
      beside: besideSteps(chosen.drawing),
      metrics: chosen.metrics,
      candidates: tried,
    };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
