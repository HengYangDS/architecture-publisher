/**
 * How the options chosen for one channel's wires meet: whether two would share
 * a vertical or crowd a label row, and where a vertical crosses a band or
 * another wire's jog.
 * @typedef {import("../channels.mjs").LabelBox} LabelBox
 */

/** Label rows a vertical passes, given the row its own wire's label or jog occupies. */
function rowsPassed(vertical, row, rows) {
  const all = [...Array(rows).keys()];
  if (vertical.from === "top")
    return vertical.turn === "upper"
      ? []
      : vertical.turn === "row"
        ? all.filter((k) => k < row)
        : all;
  return vertical.turn === "lower"
    ? []
    : vertical.turn === "row"
      ? all.filter((k) => k > row)
      : all;
}

export function crossesBand(vertical, band) {
  if (band === "upper") return vertical.from === "top" && vertical.turn !== "upper";
  return (
    (vertical.from === "bottom" && (vertical.turn === "row" || vertical.turn === "upper")) ||
    (vertical.from === "top" && vertical.turn === "through")
  );
}

/** Where a vertical turns, from the channel top down: upper band, label rows, lower band, through. */
const ZONE = Object.freeze({ upper: 0, row: 1, lower: 2, through: 3 });

/**
 * Whether two wires' verticals at one x would share a segment. A vertical from
 * the top must turn above one from the bottom; within one band the track
 * assignment orders them, so only turns in different zones or rows are decided here.
 */
function coincident(choice, other) {
  for (const a of choice.verticals)
    for (const b of other.verticals) {
      if (Math.abs(a.x - b.x) >= 1) continue;
      if (a.turn === "through" || b.turn === "through" || a.from === b.from) return true;
      const [top, topOption, bottom, bottomOption] =
        a.from === "top" ? [a, choice, b, other] : [b, other, a, choice];
      const [above, below] = [ZONE[top.turn], ZONE[bottom.turn]];
      if (above > below) return true;
      if (above === ZONE.row && below === ZONE.row && topOption.row >= bottomOption.row)
        return true;
    }
  return false;
}

/**
 * Whether `choice` for wire `index` fits the choices already made on its label
 * rows: labels keep `labelGap` from each other and `labelClear` from another
 * wire's jog or vertical, and jogs on one row keep `separation` apart. Where the
 * medium sets `join`, two wires' marks on one row, a jog or a label, keep it
 * apart: they share one line, and closer a reader continues one into the other.
 */
export function compatible(channel, chosen, index, choice, rows, spacing) {
  const wires = channel.wires;
  const near = (a, b, gap) => a.low - gap < b.high && b.low - gap < a.high;
  const boxOf = (i, option) => {
    const width = /** @type {LabelBox} */ (wires[i].label).width;
    return { low: option.label - width / 2, high: option.label + width / 2 };
  };
  const mark = (i, option, row) =>
    option.row !== row
      ? null
      : option.jog
        ? { low: option.jog[0], high: option.jog[1] }
        : option.label !== undefined
          ? boxOf(i, option)
          : null;
  for (const [j, other] of chosen) {
    if (coincident(choice, other)) return false;
    for (let row = 0; row < rows; row += 1) {
      const mineBox =
        choice.label !== undefined && choice.row === row ? boxOf(index, choice) : null;
      const otherBox = other.label !== undefined && other.row === row ? boxOf(j, other) : null;
      const mineJog =
        choice.jog && choice.row === row ? { low: choice.jog[0], high: choice.jog[1] } : null;
      const otherJog =
        other.jog && other.row === row ? { low: other.jog[0], high: other.jog[1] } : null;
      if (mineBox && otherBox && near(mineBox, otherBox, spacing.labelGap)) return false;
      if (mineJog && otherBox && near(mineJog, otherBox, spacing.labelClear)) return false;
      if (otherJog && mineBox && near(otherJog, mineBox, spacing.labelClear)) return false;
      if (mineJog && otherJog && near(mineJog, otherJog, spacing.separation)) return false;
      if (spacing.join) {
        const [mine, theirs] = [mark(index, choice, row), mark(j, other, row)];
        if (mine && theirs && near(mine, theirs, spacing.join)) return false;
      }
      const passes = (option, at) =>
        option.verticals.filter(
          (vertical) =>
            rowsPassed(vertical, option.row, rows).includes(at) &&
            !(vertical.own && option.row === at),
        );
      const beside = (vertical, box) =>
        vertical.x > box.low - spacing.labelClear && vertical.x < box.high + spacing.labelClear;
      for (const vertical of passes(choice, row))
        if (otherBox && beside(vertical, otherBox)) return false;
      for (const vertical of passes(other, row))
        if (mineBox && beside(vertical, mineBox)) return false;
    }
  }
  return true;
}

export function rowCrossings(chosen, rows) {
  let crossings = 0;
  for (const [i, option] of chosen)
    for (const [j, other] of chosen) {
      if (i === j || !other.jog) continue;
      for (const vertical of option.verticals)
        if (
          rowsPassed(vertical, option.row, rows).includes(other.row) &&
          !(vertical.own && option.row === other.row)
        )
          if (vertical.x > other.jog[0] && vertical.x < other.jog[1]) crossings += 1;
    }
  return crossings;
}
