import { keptAnswer, runArchify } from "./archify.mjs";
import { refuse } from "../refusal.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * The publisher's rows for a guide's dataflow and heights for a guide's sequence, which Archify draws only where the
 * author sets them (the queue item `page-figures`; `docs/research/page-figures.md`).
 *
 * A sequence's messages stand 48 apart from 160 down, as Archify's own draft shorthand sets them. A phase that frames
 * messages is the draft's inline `@sequence` with its `phase` rows, which Archify lays out itself.
 *
 * A dataflow's nodes keep their stages. Archify draws five rows; the nodes of each stage are ordered by the mean
 * place of their neighbours in the stages beside it, swept forward and back, and each stage takes one of the row
 * patterns Archify's own examples use for its number of nodes, the candidates nearest every stage's preferred
 * pattern first. Archify measures them in turn at the build's quality; the first that passes with every route
 * measure zero is drawn, else the first that passes. A dataflow with no candidate that passes is refused.
 */

/** The heights of a sequence's messages: the first, and the step between two. */
const SEQUENCE = Object.freeze({ first: 160, step: 48 });

/** The rows a stage of n nodes may take, n from 1 to 5, as Archify's examples place them; the first is preferred. */
const PATTERNS = Object.freeze([
  [[2], [1]],
  [
    [0, 2],
    [1, 3],
    [0, 4],
    [2, 4],
  ],
  [
    [0, 2, 4],
    [0, 1, 2],
    [2, 3, 4],
  ],
  [
    [0, 1, 3, 4],
    [0, 2, 3, 4],
    [0, 1, 2, 3],
  ],
  [[0, 1, 2, 3, 4]],
]);

/** The most candidates Archify measures for one dataflow. */
const MOST = 64;

/** The route measures of Archify's verdict, in the order the grid ranks them. */
const MEASURES = Object.freeze([
  "properCrossings",
  "resolvedCrossovers",
  "ambiguousCorridors",
  "arrowheadCollisions",
  "containerBorderRuns",
  "labelRouteClearanceIssues",
]);

/**
 * A sequence with the publisher's heights: each message 48 below the one before it from 160.
 * @param {any} document
 */
export function sequenceLayout(document) {
  return {
    ...document,
    messages: document.messages.map((/** @type {any} */ message, /** @type {number} */ index) => ({
      ...message,
      y: SEQUENCE.first + SEQUENCE.step * index,
    })),
  };
}

/**
 * The order of each stage's nodes: by the mean place of their neighbours in the stage before (forward) or after
 * (back), four sweeps each way from the document's order.
 * @param {ReadonlyArray<{ id: string, stage: number }>} nodes
 * @param {ReadonlyArray<{ from: string, to: string }>} flows
 * @returns {Map<number, string[]>}
 */
export function stageOrder(nodes, flows) {
  const stages = [...new Set(nodes.map(({ stage }) => stage))].sort((a, b) => a - b);
  const order = new Map(
    stages.map((stage) => [
      stage,
      nodes.filter((node) => node.stage === stage).map(({ id }) => id),
    ]),
  );
  const stageOf = new Map(nodes.map(({ id, stage }) => [id, stage]));
  const place = () => {
    const at = new Map();
    for (const ids of order.values())
      ids.forEach((id, index) => at.set(id, (index + 0.5) / ids.length));
    return at;
  };
  for (let sweep = 0; sweep < 8; sweep += 1) {
    const forward = sweep % 2 === 0;
    for (const stage of forward ? stages.slice(1) : stages.slice(0, -1).reverse()) {
      const at = place();
      const side = forward ? stages[stages.indexOf(stage) - 1] : stages[stages.indexOf(stage) + 1];
      const key = (/** @type {string} */ id) => {
        const near = flows.flatMap(({ from, to }) =>
          to === id && stageOf.get(from) === side
            ? [from]
            : from === id && stageOf.get(to) === side
              ? [to]
              : [],
        );
        return near.length
          ? near.reduce((sum, other) => sum + at.get(other), 0) / near.length
          : at.get(id);
      };
      const ids = /** @type {string[]} */ (order.get(stage));
      const keys = new Map(ids.map((id) => [id, key(id)]));
      ids.sort((a, b) => keys.get(a) - keys.get(b));
    }
  }
  return order;
}

/**
 * The candidates' rows, by node id: each stage takes one pattern for its number of nodes. Candidates come in order of
 * how far they stand from every stage's preferred pattern: the sum of the patterns' places in their lists, then the
 * later stages varied first; at most `MOST`, so every stage is varied before any candidate strays far.
 * @param {Map<number, string[]>} order
 * @returns {Array<Map<string, number>>}
 */
export function rowCandidates(order) {
  const stages = [...order.keys()].sort((a, b) => a - b);
  const choices = stages.map(
    (stage) => PATTERNS[/** @type {string[]} */ (order.get(stage)).length - 1] ?? [],
  );
  if (!stages.length || choices.some((patterns) => !patterns.length)) return [];
  /** @type {number[][]} */
  const picks = [];
  const most = choices.reduce((sum, patterns) => sum + patterns.length - 1, 0);
  // Every way of spending `distance` departures from the preferred patterns, the later stages first.
  const spend = (
    /** @type {number} */ distance,
    /** @type {number} */ at,
    /** @type {number[]} */ chosen,
  ) => {
    if (picks.length >= MOST) return;
    if (at === stages.length) {
      if (distance === 0) picks.push([...chosen]);
      return;
    }
    // The earlier stages keep their preferred patterns longest, so the later ones vary first.
    for (let index = 0; index < choices[at].length && index <= distance; index += 1) {
      chosen[at] = index;
      spend(distance - index, at + 1, chosen);
    }
  };
  // The cap may fall inside one distance; the candidates it keeps there leave the earliest stages' preferred patterns
  // alone longest, as every distance does, and by then each stage has been varied.
  for (let distance = 0; distance <= most && picks.length < MOST; distance += 1)
    spend(distance, 0, new Array(stages.length).fill(0));
  return picks.map((pick) => {
    const rows = new Map();
    stages.forEach((stage, at) =>
      /** @type {string[]} */ (order.get(stage)).forEach((id, index) =>
        rows.set(id, choices[at][pick[at]][index]),
      ),
    );
    return rows;
  });
}

/**
 * The dataflow laid out on the publisher's rows, or a refusal naming the file.
 * @param {any} document the author's document, sources included
 * @param {any} measurable the document as Archify measures it here, without sources and at the build's quality
 * @param {string} name the guide's file name
 * @param {string} quality
 */
export async function dataflowLayout(document, measurable, name, quality) {
  const order = stageOrder(document.nodes, document.flows ?? []);
  const crowded = [...order.entries()].filter(([, ids]) => ids.length > PATTERNS.length);
  if (crowded.length)
    refuse(
      "page_dataflow_too_tall",
      `The guide's dataflow ${name} has a stage of more than ${PATTERNS.length} nodes; Archify draws ${PATTERNS.length} rows.`,
      crowded.map(([stage, ids]) => ({
        code: "page_dataflow_too_tall",
        path: name,
        message: `stage ${stage}: ${ids.length} nodes`,
      })),
    );
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-rows-"));
  try {
    /** @type {{ rows: Map<string, number>, verdict: any } | null} */
    let passing = null;
    /** @type {any[]} */
    const refused = [];
    for (const rows of rowCandidates(order)) {
      const place = (/** @type {any} */ node) => ({ ...node, row: rows.get(node.id) });
      const verdict = await keptAnswer(
        ["rows-dataflow", quality, { ...measurable, nodes: measurable.nodes.map(place) }],
        async () => {
          const file = path.join(directory, "candidate.dataflow.json");
          await fs.writeFile(
            file,
            `${JSON.stringify({ ...measurable, nodes: measurable.nodes.map(place) }, null, 2)}\n`,
          );
          return (await runArchify(["validate", "dataflow", file, "--json", "--quality", quality]))
            .answer;
        },
        (answer) => answer?.ok === true && Boolean(answer.composition?.metrics),
      );
      const composition = verdict.composition ?? {};
      const passes =
        verdict.ok === true &&
        (verdict.checks ?? []).every((/** @type {any} */ { ok }) => ok) &&
        composition.status === "pass" &&
        !composition.summary?.errors &&
        !composition.summary?.warnings;
      if (!passes) {
        refused.push(verdict);
        continue;
      }
      const missing = MEASURES.filter((key) => typeof composition.metrics?.[key] !== "number");
      if (missing.length)
        refuse(
          "page_measures_missing",
          `Archify's answer lacks the route measures ${missing.join(", ")}; ` +
            "the vendored Archify does not match this publisher.",
        );
      passing ??= { rows, verdict };
      if (MEASURES.every((key) => composition.metrics[key] === 0)) {
        passing = { rows, verdict };
        break;
      }
    }
    if (!passing) {
      const problemsOf = (/** @type {any} */ verdict) =>
        verdict?.diagnostics?.length ? verdict.diagnostics : (verdict?.composition?.issues ?? []);
      // As the grid reports: the findings of the candidate Archify found least wrong, among those that name one.
      const named = refused.filter((verdict) => problemsOf(verdict).length);
      const [fewest] = [...(named.length ? named : refused)].sort(
        (a, b) => problemsOf(a).length - problemsOf(b).length,
      );
      const problems = problemsOf(fewest);
      refuse(
        "page_diagram_refused",
        `The guide's dataflow ${name} has no rows that pass Archify's ${quality} checks.`,
        problems.slice(0, 20).map((/** @type {any} */ issue) => ({
          code: String(issue.code ?? "archify"),
          path: name,
          message: String(issue.message ?? "").slice(0, 400),
        })),
      );
    }
    const { rows } = passing;
    return {
      ...document,
      nodes: document.nodes.map((/** @type {any} */ node) => ({ ...node, row: rows.get(node.id) })),
    };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
