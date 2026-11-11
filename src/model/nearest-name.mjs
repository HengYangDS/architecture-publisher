/**
 * The edits that turn one word into another: insertions, deletions, substitutions and swaps of two
 * neighbouring letters, each counted once (optimal string alignment).
 * @param {string} from
 * @param {string} to
 */
function edits(from, to) {
  const rows = Array.from({ length: from.length + 1 }, (_, i) =>
    Array.from({ length: to.length + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= from.length; i += 1)
    for (let j = 1; j <= to.length; j += 1) {
      const cost = from[i - 1] === to[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && from[i - 1] === to[j - 2] && from[i - 2] === to[j - 1])
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  return rows[from.length][to.length];
}

/**
 * The name a misspelt word most likely meant: the nearest of `names`, when it is at most a third
 * of that name's length away; otherwise null. Ties go to the earlier name.
 * @param {string} word
 * @param {readonly string[]} names
 */
function nearestName(word, names) {
  /** @type {string | null} */
  let best = null;
  let distance = Infinity;
  for (const name of names) {
    const away = edits(word, name);
    if (away * 3 <= name.length && away < distance) [best, distance] = [name, away];
  }
  return best;
}

/**
 * The message for a field the model format does not have, naming the nearest of the fields the
 * object may hold.
 * @param {string} key
 * @param {...readonly string[]} fields
 */
export const unknownField = (key, ...fields) => {
  const near = nearestName(key, fields.flat());
  return near ? `is not a model field; did you mean ${near}?` : "is not a model field";
};
