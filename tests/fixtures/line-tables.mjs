/** The product's table of line values, copies of it, and the invariants a table is held to. */
import assert from "node:assert/strict";
import { HOUSE } from "../../src/house.mjs";

/** The product's table: the `lines` section of the house tokens. */
export const TABLE = HOUSE.lines;

/**
 * The image widths the trials measured the table's values at, widest first: the drawing space's own, in which one
 * pixel is one pixel of the image, and two narrower. No plate is drawn by them; the reference page names them.
 */
export const WIDTHS = Object.freeze([2400, 1920, 960]);

/** The levels of a channel that the trials kept apart. */
const LEVELS = Object.freeze({ weight: 2 });

/**
 * The channel a row is read on, from what it holds: a pattern where it has a dash, a weight where it has a stroke
 * or a factor of the relation's, and a number where it has neither.
 */
export const channelOf = (row) => {
  if (row.dash) return "pattern";
  return "stroke" in row || "factor" in row ? "weight" : "number";
};

const copy = (change) => {
  const table = structuredClone(TABLE);
  change(table);
  return table;
};

/** A copy of the table with every weight heavier by one factor. */
export const heavier = (factor) =>
  copy(({ rows }) => {
    for (const row of Object.values(rows)) if ("stroke" in row) row.stroke *= factor;
  });

/** Deliberately broken tables, one for each invariant a test can fail on. */
export const BROKEN = Object.freeze({
  // A second row with the weight of emphasis: one value of one channel under two meanings.
  secondMeaning: copy(({ rows }) => {
    rows.echo = {
      ...rows.relation,
      meaning: "a relation that repeats another",
      stroke: rows.relation.stroke * rows.emphasis.factor,
    };
  }),
  // Emphasis at one and a half times the weight: too light to tell from a relation at 1920 px.
  faintEmphasis: copy(({ rows }) => {
    rows.emphasis.factor = 1.5;
  }),
  // Emphasis at the relation's weight: the channel no longer follows the hub.
  idleEmphasis: copy(({ rows }) => {
    rows.emphasis.factor = 1;
    rows.emphasis.arrow = 1;
  }),
  // Emphasis without a sample for the key: a figure draws a row its key does not hold.
  keylessEmphasis: copy(({ rows }) => {
    rows.emphasis.key = null;
  }),
  // No row for the boundary: a plate would need a weight from outside the table.
  noBoundary: copy(({ rows }) => {
    delete rows.boundary;
  }),
});

/** The value a row puts on its channel, as a reader meets it on a plate. */
export function valueOf(table, id) {
  const row = table.rows[id];
  const channel = channelOf(row);
  if (channel === "weight") return row.stroke ?? table.rows.relation.stroke * row.factor;
  return channel === "pattern" ? row.dash.join(" ") : channel;
}

/** One meaning for each value of a channel, and no more levels than the channel keeps apart. */
export function assertOneMeaning(table) {
  const ids = Object.keys(table.rows);
  const seen = new Map();
  for (const id of ids) {
    const value = `${channelOf(table.rows[id])} ${valueOf(table, id)}`;
    assert.ok(!seen.has(value), `rows ${seen.get(value)} and ${id} both draw ${value}`);
    seen.set(value, id);
  }
  for (const [channel, most] of Object.entries(LEVELS)) {
    const rows = ids.filter((id) => channelOf(table.rows[id]) === channel);
    assert.ok(rows.length <= most, `${channel} keeps ${most} levels apart: ${rows.join(", ")}`);
  }
}

/** A width as a plate writes it, free of the last bit of a product of two decimals. */
export const rounded = (value) => Math.round(value * 1e6) / 1e6;
