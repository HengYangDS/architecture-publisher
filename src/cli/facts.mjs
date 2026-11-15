import path from "node:path";

/**
 * The facts a report is made of and the words they share, for the module that draws a report and for a module
 * that composes one command's groups beside it.
 */

/**
 * A fact's state, one of the four a report marks, with its label and its value.
 * @typedef {"passed" | "attention" | "refused" | "noted"} State
 * @typedef {{ state: State, label: string, value: string }} Fact
 * @typedef {{ heading: string, facts: Fact[] }} Group
 */

/**
 * A path a command wrote or read, as a reader in the working directory would type it: relative when it lies inside
 * that directory, and as it is otherwise. A result keeps the whole path; a report prints the one that fits a line.
 * @param {string} file
 */
export function near(file) {
  const relative = path.relative(process.cwd(), file);
  return relative && !relative.startsWith("..") ? relative : file;
}

/** @param {State} state */
const fact =
  (state) =>
  /** @returns {Fact} */
  (/** @type {string} */ label, /** @type {string | number} */ value) => ({
    state,
    label,
    value: String(value),
  });
export const passed = fact("passed");
export const attention = fact("attention");
export const refused = fact("refused");
export const noted = fact("noted");

/** "1 view", "2 views". */
export const count = (number, noun) => `${number} ${noun}${number === 1 ? "" : "s"}`;

/** "a", "a and b", "a, b and c". */
export const series = (items) =>
  items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/**
 * The data a build would write, in the counts a check reports of it: the statements and how many of them name
 * files that were read at the pin, the facts, the evidence, the plates whose faces were held to their views and,
 * of a guide, how many of its figures' nodes and connections were matched to the model.
 * @param {{ statements: { components: number, relations: number, groups: number, cited: number,
 *   unchecked: number, uncited: number }, facts: number, evidence: { paths: number, ranges: number },
 *   faces: readonly object[], figures?: { matched: { nodes: number, connections: number },
 *     unmatched: { nodes: readonly object[], connections: readonly object[] } } }} data
 * @returns {Group}
 */
export function dataGroup({ statements, facts, evidence, faces, figures }) {
  const { components, relations, groups, cited, unchecked, uncited } = statements;
  const matched = (found, missed, noun) => `${found} of ${count(found + missed.length, noun)}`;
  return {
    heading: "Data",
    facts: [
      noted(
        "Statements",
        `${series([
          count(components, "component"),
          count(relations, "relation"),
          count(groups, "group"),
        ])}: ${cited} cited, ${unchecked} unchecked and ${uncited} uncited`,
      ),
      noted("Facts", count(facts, "fact")),
      noted(
        "Evidence",
        `${count(evidence.paths, "path")} with ${count(evidence.ranges, "cited range")}`,
      ),
      ...(faces.length
        ? [passed("Faces", `${count(faces.length, "plate")}, each its view's statements`)]
        : []),
      ...(figures
        ? [
            noted(
              "Guide figures",
              `${matched(figures.matched.nodes, figures.unmatched.nodes, "node")} and ${matched(
                figures.matched.connections,
                figures.unmatched.connections,
                "connection",
              )} matched to the model`,
            ),
          ]
        : []),
    ],
  };
}
