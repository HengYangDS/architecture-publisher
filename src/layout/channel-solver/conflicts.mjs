/**
 * How the options chosen for one channel's wires meet: whether two would share
 * a vertical or crowd a label row, and where a vertical crosses a band or
 * another wire's jog.
 * @typedef {import("../channels.mjs").LabelBox} LabelBox
 */

/**
 * Whether a vertical passes the label row `at`, given the row its own wire's label or jog occupies: one from the
 * top passes the rows above its turn, one from the bottom those below, and one that turns in the far band or runs
 * through passes them all. The search asks this for every choice it tries, so no list of rows is made for it.
 */
function passesRow(vertical, row, at) {
  if (vertical.from === "top")
    return vertical.turn !== "upper" && (vertical.turn !== "row" || at < row);
  return vertical.turn !== "lower" && (vertical.turn !== "row" || at > row);
}

/** Whether `row` is one of a channel's `rows` label rows. */
const labelRow = (row, rows) => Number.isInteger(row) && row >= 0 && row < rows;

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
 * Two choices can meet only on the rows they stand on, so those two rows are
 * all that is looked at, however many the channel has.
 */
export function compatible(channel, chosen, index, choice, rows, spacing) {
  const wires = channel.wires;
  const near = (a, b, gap) => a.low - gap < b.high && b.low - gap < a.high;
  const boxOf = (i, option) => {
    const width = /** @type {LabelBox} */ (wires[i].label).width;
    return { low: option.label - width / 2, high: option.label + width / 2 };
  };
  const jogOf = (option) => ({ low: option.jog[0], high: option.jog[1] });
  /** Whether a vertical of `option` passes the row of another wire's label beside that label's box. */
  const passesBeside = (option, row, box) => {
    for (const vertical of option.verticals)
      if (
        passesRow(vertical, option.row, row) &&
        !(vertical.own && option.row === row) &&
        vertical.x > box.low - spacing.labelClear &&
        vertical.x < box.high + spacing.labelClear
      )
        return true;
    return false;
  };
  const mine = labelRow(choice.row, rows);
  for (const [j, other] of chosen) {
    if (coincident(choice, other)) return false;
    const mineBox = mine && choice.label !== undefined ? boxOf(index, choice) : null;
    const otherBox =
      labelRow(other.row, rows) && other.label !== undefined ? boxOf(j, other) : null;
    if (mine && choice.row === other.row) {
      const mineJog = choice.jog ? jogOf(choice) : null;
      const otherJog = other.jog ? jogOf(other) : null;
      if (mineBox && otherBox && near(mineBox, otherBox, spacing.labelGap)) return false;
      if (mineJog && otherBox && near(mineJog, otherBox, spacing.labelClear)) return false;
      if (otherJog && mineBox && near(otherJog, mineBox, spacing.labelClear)) return false;
      if (mineJog && otherJog && near(mineJog, otherJog, spacing.separation)) return false;
      if (spacing.join) {
        const [my, their] = [mineJog ?? mineBox, otherJog ?? otherBox];
        if (my && their && near(my, their, spacing.join)) return false;
      }
    }
    if (otherBox && passesBeside(choice, other.row, otherBox)) return false;
    if (mineBox && passesBeside(other, choice.row, mineBox)) return false;
  }
  return true;
}

export function rowCrossings(chosen, rows) {
  let crossings = 0;
  for (const [i, option] of chosen)
    for (const [j, other] of chosen) {
      if (i === j || !other.jog || !labelRow(other.row, rows)) continue;
      for (const vertical of option.verticals)
        if (
          passesRow(vertical, option.row, other.row) &&
          !(vertical.own && option.row === other.row)
        )
          if (vertical.x > other.jog[0] && vertical.x < other.jog[1]) crossings += 1;
    }
  return crossings;
}
