import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { refuse } from "../refusal.mjs";
import { candidateAnswer, diagramCandidates, stopSignal } from "./archify.mjs";
import { clearLabels, routeDefects } from "./routes.mjs";

/**
 * The choice of each view's diagram on Archify's own routes. Archify validates
 * and measures every candidate; the routes it lays out are measured as well for
 * what a reader misreads and Archify does not report: two routes that read as
 * one, a route along an edge, a label not clearly nearer its own route than
 * something else, two routes doubled side by side, a label set close to another
 * route, card, outline or label, and route ends crowded on one side of a card.
 * The connections of a choice that still has such a defect take other sides.
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
/** The rounds of pins, each on the best few diagrams the round before pinned. */
const PIN = Object.freeze({ rounds: 3 });
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

/** The parts of Archify's layout the route defects, the pins and the drawing read. */
const LAYOUT = Object.freeze(["viewBox", "components", "boundaries", "connections", "labels"]);

/** Whether Archify's answer is a whole layout of a document of `connections` connections. */
const laidOut = (layout, connections) =>
  LAYOUT.every((part) => Array.isArray(layout?.[part])) &&
  layout.connections.length === connections;

/** Whether Archify's answer is a verdict it reached: a refusal or a failed run is none, and is asked again. */
const verdict = (/** @type {any} */ answer) => answer?.ok === true;

/**
 * Archify's layout of a candidate that Archify passed. A layout without its
 * canvas, cards, boundaries, labels or the route of each connection refuses
 * the view, as a missing route measure does.
 * @param {any} layout Archify's layout answer
 * @param {number} connections the document's connection count
 */
export function routeLayout(layout, connections) {
  if (!laidOut(layout, connections))
    refuse(
      "page_measures_missing",
      "Archify's layout lacks the canvas, cards, boundaries, labels or routes of its connections; " +
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
  const answer = await candidateAnswer(file, document, { layout: false, whole: verdict });
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
  const laid = await candidateAnswer(file, document, {
    layout: true,
    whole: (kept) => laidOut(kept, ids.length),
  });
  const layout = routeLayout(laid, ids.length);
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
  if (width === undefined || height === undefined) return 0;
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
 * the other card. A card stands where the document places it, or, in a document
 * that leaves its places to Archify, where Archify's layout of it set the card.
 * @param {any} document
 * @param {string} id
 * @param {any} layout Archify's layout of the document
 */
function resided(document, id, layout) {
  const placed = document.components.every(({ pos, size }) => pos && size);
  const centre = new Map(
    placed
      ? document.components.map(({ id: node, pos, size }) => [
          node,
          [pos[0] + size[0] / 2, pos[1] + size[1] / 2],
        ])
      : layout.components.map(({ id: node, x, y, width, height }) => [
          node,
          [x + width / 2, y + height / 2],
        ]),
  );
  const connection = document.connections.find((item) => item.id === id);
  const [from, to] = [centre.get(connection.from), centre.get(connection.to)];
  // A card Archify's layout does not hold gives the connection no other sides to try.
  if (!from || !to) return [];
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

/**
 * Archify's layout of a document whatever its verdict, or null when Archify
 * lays none of it out. A label set where Archify anchors it may collide, which
 * Archify reports and still lays out.
 * @param {string} file
 * @param {any} document the document written to `file`
 */
async function layoutOf(file, document) {
  const whole = (/** @type {any} */ kept) => laidOut(kept, document.connections.length);
  const answer = await candidateAnswer(file, document, { layout: true, whole });
  return whole(answer) ? answer : null;
}

/**
 * The answers to the documents measured or laid out in this process, by their
 * content. The vendored Archify is verified and answers one document one way,
 * so a candidate that another view, repair or build of this process has
 * measured is not measured again.
 */
const KNOWN = Object.freeze({ measured: new Map(), laid: new Map() });

/**
 * A question of this process's answers: the signal that stops the work that asked it, if any, and its answer.
 * @typedef {{ signal: AbortSignal | undefined, answer: Promise<any> }} Question
 */

/**
 * Measure documents on Archify's routes, or only lay them out, a few at a
 * time, each in its own file under `directory`.
 * @param {string} directory
 */
function measurer(directory) {
  let written = 0;
  /**
   * @param {Map<string, Question>} known
   * @param {(file: string, document: any) => Promise<any>} answer
   * @returns {(documents: any[]) => Promise<any[]>}
   */
  const each = (known, answer) => {
    /**
     * A document's answer, asked once a process. A question that ends without an answer, as a stopped run does, is
     * not kept, and a question of work since stopped is not read by other work: it asks again.
     * @param {any} document
     * @returns {Promise<any>}
     */
    const once = (document) => {
      const key = JSON.stringify(document);
      const held = known.get(key);
      if (held && !held.signal?.aborted) return held.answer;
      const file = path.join(directory, `${written++}.architecture.json`);
      /** @type {Question} */
      const entry = {
        signal: stopSignal(),
        answer: fs
          .writeFile(file, `${JSON.stringify(document, null, 2)}\n`)
          .then(() => answer(file, document))
          .catch((error) => {
            if (known.get(key) === entry) known.delete(key);
            throw error;
          }),
      };
      known.set(key, entry);
      return entry.answer;
    };
    return async (documents) => {
      const answers = new Array(documents.length);
      let next = 0;
      const worker = async () => {
        while (next < documents.length) {
          const index = next++;
          answers[index] = await once(documents[index]);
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
      return answers;
    };
  };
  return { measureAll: each(KNOWN.measured, measure), layoutAll: each(KNOWN.laid, layoutOf) };
}

/**
 * The document with the labels of the given connections moved by their
 * offsets from where Archify anchors them.
 * @param {any} document
 * @param {Array<[string, number[]]>} offsets each label's offset, by connection id
 */
function offsetLabels(document, offsets) {
  const byId = new Map(offsets);
  return {
    ...document,
    connections: document.connections.map((item) => {
      const offset = byId.get(item.id);
      return offset ? { ...item, labelDx: offset[0], labelDy: offset[1] } : item;
    }),
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
  labels ? metrics.mislabels : 0,
  besideSteps(drawing) ? 0 : 1,
  metrics.doubles,
  metrics.routesOverTwoBends,
  labels ? metrics.labels : 0,
  metrics.crowded,
  Math.max(0, metrics.maxStretch - STRETCH),
  shapeDistance(width, height),
  index,
];

/**
 * Below zero where `a` ranks before `b`, above where after, by the measures above in their order.
 * @param {any} a
 * @param {any} b
 * @param {boolean} [labels] whether the labels count
 */
export function compare(a, b, labels = true) {
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
        .flatMap((id) =>
          resided(current.document, id, current.layout).map((document) => ({ id, document })),
        )
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
 * The labels to pin on each diagram whose labels still read as another's or
 * crowd, each set with the labels pinned on it before: those read as another's
 * alone, when there are any, and with those that only crowd.
 * @template {{ mislabelled: string[], relabel: string[], pinned: string[] }} Start
 * @param {Start[]} starts
 * @returns {Array<{ start: Start, owners: string[] }>}
 */
export function pinSets(starts) {
  return starts
    .filter(({ relabel }) => relabel.length)
    .flatMap((start) =>
      (start.mislabelled.length ? [start.mislabelled, start.relabel] : [start.relabel]).map(
        (owners) => ({ start, owners: [...new Set([...start.pinned, ...owners])] }),
      ),
    );
}

/**
 * Lay out a view's candidate diagrams, measure each on Archify's own routes,
 * once with the grid's connection sides and once with every side left to
 * Archify, and choose among those that pass Archify's showcase checks: the
 * fewest routes a reader takes for one or that run along an edge, then the
 * fewest crossings, the fewest labels read as another's, one the reader sets
 * beside its steps, the fewest doubled routes and routes over two bends,
 * crowded labels and crowded route ends, the least stretch above 1.35 and the
 * shape nearest 1.0 to 1.8 times as wide as high. When the best stands above
 * its steps, rows of two narrow enough to stand beside them are measured as
 * well. When the choice still has a defect or stands above its steps, the best
 * few, and the best few beside their steps, are repaired by changing the sides
 * of the connections involved. When the choice still has a label read as
 * another's or crowded, the labels of the best few by their routes alone are
 * pinned clear beside their own routes, each by an offset from where Archify
 * anchors it, in up to three rounds: each pins anew the labels the round before
 * left read as another's or crowded, on the best few diagrams it pinned. A view
 * with no candidate inside the shape bounds, or none that passes at the build's
 * quality, is refused.
 * @param {any} model
 * @param {any} view
 * @param {"showcase" | "standard"} [quality]
 */
export async function chooseDiagram(model, view, quality = "showcase") {
  const inShape = ({ width, height }) => shapeDistance(width, height) !== Infinity;
  const candidates = diagramCandidates(model, view, quality).filter(inShape);
  if (!candidates.length)
    refuse(
      "page_shape_refused",
      `View ${view.id} has no diagram at least ${SHAPE.least} times as wide as it is high. ` +
        "Split the view or declare fewer tiers.",
    );
  const chosen = await chooseAmong(candidates, {
    path: `/views/${view.id}`,
    name: `View ${view.id}`,
    quality,
    narrow: () => diagramCandidates(model, view, quality, { beside: true }).filter(inShape),
  });
  return { view: view.id, ...chosen };
}

/**
 * Measure candidate diagrams of one figure on Archify's own routes and choose among them, as `chooseDiagram`
 * says: each once with its connection sides and once with every side left to Archify, then the narrow ones where
 * the best stands above its steps, the repair of the best few and the pins of their labels. A candidate's width and
 * height rank its shape; a candidate without them, as Archify's own layout has, is ranked on its routes alone.
 * @param {Array<{ document: any, width?: number, height?: number, nodes?: any, rows?: any }>} candidates
 * @param {{ path: string, name: string, quality: string, narrow?: () => any[] }} subject the figure's path and
 *   name in a refusal, the build's quality, and the narrow candidates to measure where the best stands above its
 *   steps
 */
export async function chooseAmong(candidates, { path: at, name, quality, narrow = () => [] }) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-diagrams-"));
  try {
    const { measureAll, layoutAll } = measurer(directory);
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
    // When the best diagram stands above its steps, rows of two narrow enough to
    // stand beside them are measured as well.
    if (passing.length && !besideSteps(passing[0].drawing)) {
      const narrower = narrow();
      const more = [
        ...narrower.map(({ document }) => ({ document, sides: "grid" })),
        ...narrower.map(({ document }) => ({ document: archifySides(document), sides: "archify" })),
      ];
      const results = await measureAll(more.map(({ document }) => document));
      measured.push(
        ...results.map((result, index) => ({
          ...narrower[index % narrower.length],
          document: more[index].document,
          ...result,
          sides: more[index].sides,
          resided: [],
          pinned: [],
          index: measured.length + index,
        })),
      );
      passing.splice(0, passing.length, ...measured.filter(({ passes }) => passes).sort(compare));
    }
    if (!passing.length)
      return refuse(
        "page_diagram_refused",
        `${name} has no diagram that passes Archify's ${quality} checks.`,
        measured[0].diagnostics.slice(0, 20).map((issue) => ({
          code: String(issue.code ?? "archify"),
          path: at,
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
    // Archify can take another course for a route whose label has a place of
    // its own, so each set of labels is pinned on the layout in which they
    // stand where Archify anchors them; and Archify runs other routes around a
    // pinned label, so the labels read as another's are pinned alone as well
    // as with those that only crowd. A pin can leave another label read as
    // another's or crowded, so each round pins those anew, with the labels
    // pinned before, on the best few diagrams the last round pinned.
    let starts = [...pool].sort(byRoutes).slice(0, REPAIR.starts);
    const seen = new Set();
    for (let round = 0; round < PIN.rounds && chosen.relabel.length; round += 1) {
      const sets = pinSets(starts);
      const anchored = await layoutAll(
        sets.map(({ start, owners }) =>
          offsetLabels(
            start.document,
            owners.map((id) => [id, [0, 0]]),
          ),
        ),
      );
      const documents = sets.flatMap(({ start, owners }, index) => {
        const layout = anchored[index];
        if (!layout) return [];
        const ids = start.document.connections.map(({ id }) => id);
        const moved = clearLabels(layout, ids, owners);
        if (!moved.size) return [];
        // A label already clear where Archify anchors it is pinned there.
        const document = offsetLabels(
          start.document,
          owners.map((id) => [id, moved.get(id) ?? [0, 0]]),
        );
        const key = JSON.stringify(document.connections);
        if (seen.has(key)) return [];
        seen.add(key);
        return [{ start, document, pinned: owners }];
      });
      if (!documents.length) break;
      tried += documents.length;
      const pinned = (await measureAll(documents.map(({ document }) => document)))
        .map((result, index) => ({
          ...documents[index].start,
          ...result,
          document: documents[index].document,
          pinned: documents[index].pinned,
        }))
        .filter(({ passes }) => passes);
      [chosen] = [chosen, ...pinned].sort(compare);
      starts = pinned.sort(byRoutes).slice(0, REPAIR.starts);
    }
    return {
      nodes: chosen.nodes,
      document: chosen.document,
      width: chosen.width,
      height: chosen.document.meta.viewBox?.[1] ?? chosen.height,
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
