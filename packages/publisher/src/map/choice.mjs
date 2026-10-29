import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { refuse } from "../refusal.mjs";
import { diagramCandidates, runArchify } from "./archify.mjs";

/**
 * The choice of each view's diagram on Archify's own routes. Archify validates
 * and measures every candidate; the routes it resolves are also measured for
 * routes that run side by side, which Archify does not report, and the
 * connections of a choice that still crosses take other sides.
 */

/** The shapes a diagram should take, width over height, and the narrowest it may take. */
const SHAPE = Object.freeze({ low: 1, high: 1.8, least: 0.7 });
/** The stretch Archify suggests a route stay within: its length over the distance it spans. */
const STRETCH = 1.35;
/** Archify's shortest route segment and shortest interior segment, in px. */
const SEGMENT = Object.freeze({ micro: 8, interior: 16 });
/**
 * A crossing repair: the diagrams it starts from, the rounds it takes from each
 * and the most re-sided diagrams it measures for one view.
 */
const REPAIR = Object.freeze({ starts: 3, rounds: 2, budget: 64 });
const OUTWARD = Object.freeze({ top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] });
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
 * Archify's showcase verdict and route metrics for one candidate document, and
 * the pairs of connections whose routes cross.
 */
async function measure(file) {
  const { answer } = await runArchify([
    "validate",
    "architecture",
    file,
    "--json",
    "--quality",
    "showcase",
  ]);
  const composition = answer.composition ?? {};
  const passes =
    answer.ok === true &&
    (answer.checks ?? []).every(({ ok }) => ok) &&
    composition.status === "pass" &&
    !composition.summary?.errors &&
    !composition.summary?.warnings;
  return {
    file,
    passes,
    diagnostics: answer.diagnostics ?? composition.issues ?? [],
    pairs: (composition.routeReview?.crossings ?? []).map(({ left, right }) => [left.id, right.id]),
    // Only a candidate that passes is ranked.
    metrics: passes ? routeMetrics(composition) : null,
  };
}

/**
 * Pairs of route segments that run side by side closer than Archify's shortest
 * segment for longer than its shortest interior segment, which a reader takes
 * for one route. Archify measures crossings and shared corridors, not this.
 */
async function tangles(file) {
  const { answer } = await runArchify([
    "validate",
    "architecture",
    file,
    "--json",
    "--quality",
    "showcase",
    "--layout-json",
  ]);
  if (!Array.isArray(answer.connections))
    refuse(
      "page_measures_missing",
      "Archify's layout lacks the routes of its connections; " +
        "the vendored Archify does not match this publisher.",
    );
  const segments = answer.connections.flatMap(({ points }, owner) =>
    points.slice(1).map((point, index) => ({ owner, a: points[index], b: point })),
  );
  const along = (segment, axis) => [segment.a[axis], segment.b[axis]].sort((p, q) => p - q);
  let found = 0;
  for (let i = 0; i < segments.length; i += 1)
    for (let j = i + 1; j < segments.length; j += 1) {
      const [s, u] = [segments[i], segments[j]];
      // The axis both segments keep: x for vertical segments, y for horizontal ones.
      const axis = [0, 1].find((index) =>
        [s, u].every(({ a, b }) => Math.abs(a[index] - b[index]) < 0.5),
      );
      if (s.owner === u.owner || axis === undefined) continue;
      const apart = Math.abs(s.a[axis] - u.a[axis]);
      const [p, q] = [along(s, 1 - axis), along(u, 1 - axis)];
      const overlap = Math.min(p[1], q[1]) - Math.max(p[0], q[0]);
      if (apart >= 0.5 && apart < SEGMENT.micro && overlap > SEGMENT.interior) found += 1;
    }
  return found;
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
        measured[index] = await measure(files[index]);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    return measured;
  };
}

const rank = ({ metrics, width, height, index }) => [
  metrics.crossings,
  metrics.routesOverTwoBends,
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
 * Up to `count` of the measured diagrams that pass, in rank order, leaving out
 * any whose routes run side by side; when every one does, the first of them.
 */
async function untangled(measured, count) {
  const ranked = measured.filter(({ passes }) => passes).sort(compare);
  const kept = [];
  for (const diagram of ranked) {
    if (kept.length === count) break;
    diagram.tangles ??= await tangles(diagram.file);
    if (!diagram.tangles) kept.push(diagram);
  }
  return kept.length ? kept : ranked.slice(0, 1);
}

/**
 * Change the sides of connections whose routes Archify finds crossing. From
 * each diagram, each round measures every crossing connection with each other
 * pair of sides it can take, and keeps the best change that ranks higher and
 * runs no routes side by side, until no change helps or the budget is spent.
 * @param {any[]} starts
 * @param {(documents: any[]) => Promise<any[]>} measureAll
 */
async function repair(starts, measureAll) {
  let budget = REPAIR.budget;
  const repaired = [];
  for (const start of starts) {
    let current = start;
    for (let round = 0; round < REPAIR.rounds && current.metrics.crossings && budget; round += 1) {
      const changes = [...new Set(current.pairs.flat())]
        .flatMap((id) => resided(current.document, id).map((document) => ({ id, document })))
        .slice(0, budget);
      budget -= changes.length;
      const measured = (await measureAll(changes.map(({ document }) => document))).map(
        (result, index) => ({
          ...current,
          ...result,
          document: changes[index].document,
          resided: [...new Set([...current.resided, changes[index].id])],
          tangles: undefined,
        }),
      );
      let next = null;
      for (const diagram of measured.filter(({ passes }) => passes).sort(compare)) {
        if (compare(diagram, current) >= 0) break;
        diagram.tangles = await tangles(diagram.file);
        if (!diagram.tangles) {
          next = diagram;
          break;
        }
      }
      if (!next) break;
      current = next;
    }
    repaired.push(current);
  }
  return repaired;
}

/**
 * Lay out a view's candidate diagrams, measure each on Archify's own routes and
 * choose: among those that pass Archify's showcase checks and run no routes
 * side by side, the fewest crossings, then the fewest routes over two bends,
 * then the least stretch above 1.35, then the shape nearest 1.0 to 1.8 times as
 * wide as high. The candidates keep the grid's connection sides; when none of
 * them is free of crossings and routes over two bends, each is measured again
 * with every side left to Archify, and the choice is made from both. When the
 * choice still crosses, the best few are repaired by changing the sides of the
 * connections that cross. A view with no candidate inside the shape bounds, or
 * none that passes, is refused.
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
    const sided = (await measureAll(candidates.map(({ document }) => document))).map(
      (result, index) => ({ ...candidates[index], ...result, sides: "grid", resided: [], index }),
    );
    let measured = sided;
    let [chosen] = await untangled(measured, 1);
    if (!chosen || chosen.metrics.crossings > 0 || chosen.metrics.routesOverTwoBends > 0) {
      const documents = candidates.map(({ document }) => archifySides(document));
      const freed = (await measureAll(documents)).map((result, index) => ({
        ...candidates[index],
        document: documents[index],
        ...result,
        sides: "archify",
        resided: [],
        index: candidates.length + index,
      }));
      measured = [...sided, ...freed];
      [chosen] = await untangled(measured, 1);
    }
    if (!chosen)
      return refuse(
        "page_diagram_refused",
        `View ${view.id} has no diagram that passes Archify's showcase checks.`,
        sided[0].diagnostics.slice(0, 20).map((issue) => ({
          code: String(issue.code ?? "archify"),
          path: `/views/${view.id}`,
          message: String(issue.message ?? "").slice(0, 400),
        })),
      );
    let tried = measured.length;
    if (chosen.metrics.crossings > 0) {
      const starts = await untangled(measured, REPAIR.starts);
      const repaired = await repair(starts, async (documents) => {
        tried += documents.length;
        return measureAll(documents);
      });
      // A repaired diagram runs no routes side by side; the choice may, when every candidate did.
      [chosen] = [chosen, ...repaired].sort((a, b) => a.tangles - b.tangles || compare(a, b));
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
      metrics: { ...chosen.metrics, tangles: chosen.tangles },
      candidates: tried,
    };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
