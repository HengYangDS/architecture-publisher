/**
 * The evidence table: every path a work rests on, written once. Its rows are the binding's records of the files
 * the model claims and cites, and the paths only the guide cites, which the build reads at the pin beside them. A
 * row says whether its path was read at the pin, who owns it, which relations cite it and which of its ranges the
 * guide cites. The table is gathered from what the build already read; the model and the guide gain no field.
 *
 * @typedef {{ path: string, sha256: string | null, bytes: number | null, changed: string | null,
 *   owner: string | null, relations: readonly string[], state: "verified" | "unverified" }} SourceRecord
 *   One record of the binding, as `bindSources` hands it over.
 * @typedef {{ where: string, path: string, lines: readonly [number, number] | null }} Citation
 *   One citation of the guide, as `guideCitations` reads it.
 * @typedef {{ sha256: string, bytes: number, changed: string }} Reading
 *   What the build read at the pin of a path only the guide cites.
 * @typedef {{ lines?: [number, number], where: string }} Range
 * @typedef {{ path: string, state: "verified" | "unverified", sha256?: string, bytes?: number, changed?: string,
 *   owner?: string, relations: string[], ranges: Range[] }} EvidenceRow
 */

/**
 * One row, its keys in the table's order. A digest, a size and a date stand only on a path read at the pin, and an
 * owner only where a component's claim holds the path.
 * @param {string} path
 * @param {{ sha256?: string | null, bytes?: number | null, changed?: string | null } | undefined} reading
 * @param {{ owner: string | null, relations: readonly string[] }} declared
 * @param {Range[]} ranges
 * @returns {EvidenceRow}
 */
function rowOf(path, reading, { owner, relations }, ranges) {
  return {
    path,
    ...(reading
      ? {
          state: /** @type {const} */ ("verified"),
          sha256: /** @type {string} */ (reading.sha256),
          bytes: /** @type {number} */ (reading.bytes),
          changed: /** @type {string} */ (reading.changed),
        }
      : { state: /** @type {const} */ ("unverified") }),
    ...(owner === null ? {} : { owner }),
    relations: [...relations],
    ranges,
  };
}

/** A path that no component owns and no relation cites: one only the guide cites. */
const UNCLAIMED = Object.freeze({ owner: null, relations: Object.freeze([]) });

/**
 * The evidence table, in path order. Each path stands once: a record of the binding with the state the binding
 * gave it, or a path only the guide cites, verified when the build read it at the pin. The ranges of a path stand
 * in the order the guide cites them, a citation of a whole file without lines.
 * @param {{ records: readonly SourceRecord[], citations?: readonly Citation[],
 *   read?: ReadonlyMap<string, Reading> }} sources
 * @returns {EvidenceRow[]}
 */
export function evidenceTable({ records, citations = [], read = new Map() }) {
  /** @type {Map<string, Range[]>} */
  const ranges = new Map();
  for (const { path, lines, where } of citations)
    ranges.set(path, [
      ...(ranges.get(path) ?? []),
      lines ? { lines: [lines[0], lines[1]], where } : { where },
    ]);
  const bound = new Map(records.map((record) => [record.path, record]));
  return [...new Set([...bound.keys(), ...ranges.keys()])].sort().map((path) => {
    const record = bound.get(path);
    const cited = ranges.get(path) ?? [];
    return record
      ? rowOf(path, record.state === "verified" ? record : undefined, record, cited)
      : rowOf(path, read.get(path), UNCLAIMED, cited);
  });
}
