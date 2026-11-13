/**
 * Pair kerning read from a face's own GPOS table: what its `kern` feature adds to the advance of two glyphs set
 * side by side, as a shaper applies it. The font reader the engine measures with does not read extension lookups,
 * where Source Sans 3 and Source Serif 4 keep their pair adjustments, so the engine reads them here.
 *
 * The house faces give a value to the first glyph of a pair alone, so each glyph is the first of the next pair and
 * a run's kerning is the sum over its pairs. Lookups of other kinds are not read: Source Serif 4's feature names
 * one more, which closes up the interpunct of a Catalan `l·l`, and the engine measures that the wider.
 */

/** The bit of a value format that names an advance along the line. */
const X_ADVANCE = 0x0004;
/** The lookup types read: a pair adjustment, and the extension that wraps one. */
const PAIR = 2;
const EXTENSION = 9;

/**
 * The size in bytes of a value record: two for each field its format names.
 * @param {number} format
 */
function sizeOf(format) {
  let size = 0;
  for (let bits = format & 0xff; bits; bits >>= 1) size += 2 * (bits & 1);
  return size;
}

/**
 * A coverage table: the index of each glyph it covers.
 * @param {DataView} view
 * @param {number} at
 * @returns {Map<number, number>}
 */
function coverageOf(view, at) {
  const index = new Map();
  const listed = view.getUint16(at) === 1;
  for (let i = 0; i < view.getUint16(at + 2); i += 1) {
    if (listed) {
      index.set(view.getUint16(at + 4 + 2 * i), i);
      continue;
    }
    const record = at + 4 + 6 * i;
    const [start, end, first] = [0, 2, 4].map((field) => view.getUint16(record + field));
    for (let glyph = start; glyph <= end; glyph += 1) index.set(glyph, first + glyph - start);
  }
  return index;
}

/**
 * A class definition: the class of each glyph it names. A glyph it does not name is of class 0.
 * @param {DataView} view
 * @param {number} at
 * @returns {Map<number, number>}
 */
function classesOf(view, at) {
  const classes = new Map();
  if (view.getUint16(at) === 1) {
    const start = view.getUint16(at + 2);
    for (let i = 0; i < view.getUint16(at + 4); i += 1)
      classes.set(start + i, view.getUint16(at + 6 + 2 * i));
    return classes;
  }
  for (let i = 0; i < view.getUint16(at + 2); i += 1) {
    const record = at + 4 + 6 * i;
    const [start, end, value] = [0, 2, 4].map((field) => view.getUint16(record + field));
    for (let glyph = start; glyph <= end; glyph += 1) classes.set(glyph, value);
  }
  return classes;
}

/**
 * One pair adjustment subtable: the advance it adds between two glyphs, or null where it does not position them.
 * @param {DataView} view
 * @param {number} at
 * @returns {(left: number, right: number) => number | null}
 */
function pairsOf(view, at) {
  const covered = coverageOf(view, at + view.getUint16(at + 2));
  const [first, second] = [view.getUint16(at + 4), view.getUint16(at + 6)];
  const record = sizeOf(first) + sizeOf(second);
  // What a record's two values add to the line: the first glyph's advance, and the second's where it has one. A
  // value's advance follows its placements.
  const advance = (/** @type {number} */ where) =>
    (first & X_ADVANCE ? view.getInt16(where + sizeOf(first & (X_ADVANCE - 1))) : 0) +
    (second & X_ADVANCE
      ? view.getInt16(where + sizeOf(first) + sizeOf(second & (X_ADVANCE - 1)))
      : 0);
  if (view.getUint16(at) === 1) {
    const sets = Array.from({ length: view.getUint16(at + 8) }, (_, i) => {
      const set = at + view.getUint16(at + 10 + 2 * i);
      const pairs = new Map();
      for (let j = 0; j < view.getUint16(set); j += 1) {
        const pair = set + 2 + j * (2 + record);
        pairs.set(view.getUint16(pair), advance(pair + 2));
      }
      return pairs;
    });
    return (left, right) => sets[covered.get(left) ?? -1]?.get(right) ?? null;
  }
  const leftClass = classesOf(view, at + view.getUint16(at + 8));
  const rightClass = classesOf(view, at + view.getUint16(at + 10));
  const [rows, columns] = [view.getUint16(at + 12), view.getUint16(at + 14)];
  return (left, right) => {
    if (!covered.has(left)) return null;
    const [row, column] = [leftClass.get(left) ?? 0, rightClass.get(right) ?? 0];
    return row < rows && column < columns
      ? advance(at + 16 + (row * columns + column) * record)
      : null;
  };
}

/**
 * The pair kerning of a face: the lookups of the `kern` feature in the default language of its Latin script, or of
 * its default script, each applied with its first subtable that positions the pair.
 * @param {ArrayBuffer} buffer the face's file
 * @returns {(left: number, right: number) => number} what the face adds, in font units, to the advance of two glyphs
 */
export function kerningOf(buffer) {
  const view = new DataView(buffer);
  const tagAt = (/** @type {number} */ at) =>
    String.fromCharCode(...[0, 1, 2, 3].map((byte) => view.getUint8(at + byte)));
  let gpos = -1;
  for (let i = 0; i < view.getUint16(4); i += 1)
    if (tagAt(12 + 16 * i) === "GPOS") gpos = view.getUint32(20 + 16 * i);
  if (gpos < 0) return () => 0;
  const [scripts, features, lookups] = [4, 6, 8].map(
    (field) => gpos + view.getUint16(gpos + field),
  );
  /** @type {Map<string, number>} */
  const scriptAt = new Map();
  for (let i = 0; i < view.getUint16(scripts); i += 1) {
    const record = scripts + 2 + 6 * i;
    scriptAt.set(tagAt(record), scripts + view.getUint16(record + 4));
  }
  const script = scriptAt.get("latn") ?? scriptAt.get("DFLT");
  if (script === undefined || !view.getUint16(script)) return () => 0;
  const system = script + view.getUint16(script);
  /** @type {Set<number>} */
  const wanted = new Set();
  for (let i = 0; i < view.getUint16(system + 4); i += 1) {
    const record = features + 2 + 6 * view.getUint16(system + 6 + 2 * i);
    if (tagAt(record) !== "kern") continue;
    const feature = features + view.getUint16(record + 4);
    for (let j = 0; j < view.getUint16(feature + 2); j += 1)
      wanted.add(view.getUint16(feature + 4 + 2 * j));
  }
  const subtables = [...wanted]
    .sort((a, b) => a - b)
    .map((index) => {
      const lookup = lookups + view.getUint16(lookups + 2 + 2 * index);
      const type = view.getUint16(lookup);
      return Array.from({ length: view.getUint16(lookup + 4) }, (_, i) => {
        const at = lookup + view.getUint16(lookup + 6 + 2 * i);
        if (type === PAIR) return pairsOf(view, at);
        return type === EXTENSION && view.getUint16(at + 2) === PAIR
          ? pairsOf(view, at + view.getUint32(at + 4))
          : null;
      }).flatMap((pairs) => (pairs ? [pairs] : []));
    });
  /** @type {Map<number, number>} */
  const known = new Map();
  return (left, right) => {
    const key = left * 65536 + right;
    let total = known.get(key);
    if (total === undefined) {
      total = 0;
      for (const lookup of subtables) {
        const found = lookup.map((pairs) => pairs(left, right)).find((advance) => advance !== null);
        total += found ?? 0;
      }
      known.set(key, total);
    }
    return total;
  };
}
