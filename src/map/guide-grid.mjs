import { keptAnswer, runArchify } from "./archify.mjs";
import { refuse } from "../refusal.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * The publisher's grid for a guide's entity-relationship and class diagrams, which Archify does not lay out: each
 * entity or type a row and a column. The candidates follow a walk of the relationships, from the most connected item
 * through each one's neighbours by their degree, at two to four columns. A domain (an entity's `tag`) must fill a
 * solid rectangle of cells, so a domain of n members takes one run of one row where n fits, or n/k full rows where k
 * columns divide n; a column count that can hold neither is no candidate. Archify measures every candidate at the
 * build's quality, passing as the chooser's candidates pass; the first by its route measures is drawn, the fewest
 * columns among equals. A domain that no column count can hold, or no grid that passes, is refused.
 */

/** The kinds the grid lays out, by the list that holds their items. */
export const GRID_KINDS = Object.freeze({ erd: "entities", class: "types" });

/** The route measures of Archify's verdict the candidates are ranked by, in order. */
const MEASURES = Object.freeze([
  "properCrossings",
  "resolvedCrossovers",
  "ambiguousCorridors",
  "arrowheadCollisions",
  "containerBorderRuns",
  "labelRouteClearanceIssues",
]);

/** Column counts tried, the least first. */
const COLUMNS = Object.freeze([2, 3, 4]);

/**
 * The items in a walk of the relationships: from the most connected, each one's neighbours by their degree; an item
 * no relationship reaches follows in its document order.
 * @param {string[]} ids
 * @param {ReadonlyArray<{ from: string, to: string }>} edges
 */
function walk(ids, edges) {
  const degree = new Map(ids.map((id) => [id, 0]));
  const near = new Map(ids.map((id) => /** @type {[string, string[]]} */ ([id, []])));
  for (const { from, to } of edges) {
    if (!near.has(from) || !near.has(to)) continue;
    degree.set(from, /** @type {number} */ (degree.get(from)) + 1);
    degree.set(to, /** @type {number} */ (degree.get(to)) + 1);
    near.get(from)?.push(to);
    near.get(to)?.push(from);
  }
  const byDegree = (/** @type {string} */ a, /** @type {string} */ b) =>
    /** @type {number} */ (degree.get(b)) - /** @type {number} */ (degree.get(a)) ||
    ids.indexOf(a) - ids.indexOf(b);
  const seen = new Set();
  const order = [];
  for (const start of [...ids].sort(byDegree)) {
    if (seen.has(start)) continue;
    const queue = [start];
    seen.add(start);
    while (queue.length) {
      const id = /** @type {string} */ (queue.shift());
      order.push(id);
      for (const next of [.../** @type {string[]} */ (near.get(id))].sort(byDegree))
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
    }
  }
  return order;
}

/**
 * The cells of one candidate at `columns` columns, by item id, or null where a domain cannot fill a rectangle.
 * @param {string[]} order the items in the walk's order
 * @param {Map<string, string | undefined>} tagOf
 * @param {number} columns
 * @returns {Map<string, [number, number]> | null}
 */
export function gridCells(order, tagOf, columns) {
  /** @type {string[][]} */
  const groups = [];
  const byTag = new Map();
  for (const id of order) {
    const tag = tagOf.get(id);
    if (!tag) groups.push([id]);
    else if (byTag.has(tag)) byTag.get(tag).push(id);
    else {
      const group = [id];
      byTag.set(tag, group);
      groups.push(group);
    }
  }
  const cells = new Map();
  /** @type {number[]} each row's used cells */
  const rows = [];
  for (const group of groups) {
    if (group.length <= columns) {
      let row = rows.findIndex((used) => columns - used >= group.length);
      if (row < 0) row = rows.push(0) - 1;
      group.forEach((id, index) => cells.set(id, [row, rows[row] + index]));
      rows[row] += group.length;
    } else {
      if (group.length % columns) return null;
      const first = rows.length;
      for (let index = 0; index < group.length; index += 1) {
        if (index % columns === 0) rows.push(columns);
        cells.set(group[index], [first + Math.floor(index / columns), index % columns]);
      }
    }
  }
  return cells;
}

/**
 * Archify's verdict on one candidate, kept between processes as a candidate's answer is.
 * @param {string} kind
 * @param {any} document
 * @param {string} directory
 * @param {string} quality
 */
async function verdictOf(kind, document, directory, quality) {
  return keptAnswer(
    [`grid-${kind}`, quality, document],
    async () => {
      const file = path.join(directory, `candidate.${kind}.json`);
      await fs.writeFile(file, `${JSON.stringify(document, null, 2)}\n`);
      return (await runArchify(["validate", kind, file, "--json", "--quality", quality])).answer;
    },
    (answer) => answer?.ok === true && Boolean(answer.composition?.metrics),
  );
}

/**
 * The document laid out by the publisher's grid, with each item's row and column, or a refusal naming the file when
 * no candidate passes at the build's quality.
 * @param {"erd" | "class"} kind
 * @param {any} document the author's document, sources included
 * @param {any} measurable the document as Archify measures it here, without sources and at the build's quality
 * @param {string} name the guide's file name
 * @param {string} quality
 */
export async function gridLayout(kind, document, measurable, name, quality) {
  const list = GRID_KINDS[kind];
  const ids = document[list].map((/** @type {any} */ { id }) => id);
  const order = walk(ids, document.relationships ?? []);
  const tagOf = new Map(
    document[list].map((/** @type {any} */ { id, tag }) => [
      id,
      typeof tag === "string" && tag ? tag : undefined,
    ]),
  );
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-grid-"));
  try {
    const measured = [];
    for (const columns of COLUMNS.filter((count) => count <= Math.max(2, ids.length))) {
      const cells = gridCells(order, tagOf, columns);
      if (!cells) continue;
      const place = (/** @type {any} */ item) => {
        const [row, col] = /** @type {[number, number]} */ (cells.get(item.id));
        return { ...item, row, col };
      };
      const layout = { mode: "grid" };
      const verdict = await verdictOf(
        kind,
        { ...measurable, layout, [list]: measurable[list].map(place) },
        directory,
        quality,
      );
      const composition = verdict.composition ?? {};
      const passes =
        verdict.ok === true &&
        (verdict.checks ?? []).every((/** @type {any} */ { ok }) => ok) &&
        composition.status === "pass" &&
        !composition.summary?.errors &&
        !composition.summary?.warnings;
      const missing = passes
        ? MEASURES.filter((key) => typeof composition.metrics?.[key] !== "number")
        : [];
      if (missing.length)
        refuse(
          "page_measures_missing",
          `Archify's answer lacks the route measures ${missing.join(", ")}; ` +
            "the vendored Archify does not match this publisher.",
        );
      measured.push({
        passes,
        rank: passes ? MEASURES.map((key) => composition.metrics[key]) : [],
        verdict,
        drawn: { ...document, layout, [list]: document[list].map(place) },
      });
    }
    const passing = measured
      .filter(({ passes }) => passes)
      .sort((a, b) => {
        const at = a.rank.findIndex((value, index) => value !== b.rank[index]);
        return at < 0 ? 0 : a.rank[at] - b.rank[at];
      });
    if (!measured.length)
      refuse(
        "page_diagram_unplaceable",
        `The guide's diagram ${name} has a domain that fills no rectangle of two to four columns: ` +
          "split the domain or drop its tag.",
        [...new Set(tagOf.values())]
          .filter((tag) => tag !== undefined)
          .map((tag) => ({
            code: "page_diagram_unplaceable",
            path: name,
            message: `domain "${tag}"`,
          })),
      );
    if (!passing.length) {
      const problems = (/** @type {any} */ { verdict }) =>
        verdict.diagnostics?.length ? verdict.diagnostics : (verdict.composition?.issues ?? []);
      const [fewest] = [...measured].sort((a, b) => problems(a).length - problems(b).length);
      refuse(
        "page_diagram_refused",
        `The guide's diagram ${name} has no grid that passes Archify's ${quality} checks.`,
        problems(fewest)
          .slice(0, 20)
          .map((/** @type {any} */ issue) => ({
            code: String(issue.code ?? "archify"),
            path: name,
            message: String(issue.message ?? "").slice(0, 400),
          })),
      );
    }
    return passing[0].drawn;
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
