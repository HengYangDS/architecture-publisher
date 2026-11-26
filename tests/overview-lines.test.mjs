import assert from "node:assert/strict";
import test from "node:test";
import { checkLines } from "../src/overview/checks.mjs";

// The overview's text stands clear of every line and mark the page draws: a line over a word, as a fork's bar once
// ran through a branch's name, is refused before the page is set. The checks of text against text and of the live
// area are the other half (`checkBoxes`).

/** A text's box, as the drawing reads it back: its glyphs' extent in points. */
const box = (x, y, w, h, text) => ({ x, y, w, h, size: 12, text });
/** A line through the given points, of the given width in points. */
const line = (w, ...points) => ({ kind: "line", w, points });

test("a line across a text is refused, naming the text and the line", () => {
  assert.throws(
    () => checkLines([box(100, 100, 80, 12, "Log")], [line(1.6, [90, 106], [300, 106])], []),
    (error) => {
      assert.equal(/** @type {any} */ (error).code, "overview_text_over_line");
      assert.match(
        /** @type {any} */ (error).problems[0].message,
        /^"Log" at 100,100 pt lies under a line/u,
      );
      return true;
    },
  );
});

test("a line beside a text, one that stops short of it and a ring clear of it pass", () => {
  assert.doesNotThrow(() =>
    checkLines(
      [box(100, 100, 80, 12, "Log")],
      [
        line(1.6, [90, 96], [300, 96]),
        line(1.6, [60, 106], [98, 106]),
        line(1.15, [95, 80], [95, 140]),
      ],
      [{ kind: "ring", x: 92, y: 106, r: 4, w: 1.7 }],
    ),
  );
});

test("a ring over a text is refused", () => {
  assert.throws(
    () =>
      checkLines(
        [box(100, 100, 80, 12, "Log")],
        [],
        [{ kind: "ring", x: 104, y: 106, r: 4, w: 1.7 }],
      ),
    (error) => /** @type {any} */ (error).code === "overview_text_over_line",
  );
});

test("a line crossing a text on a slant is refused", () => {
  assert.throws(
    () => checkLines([box(100, 100, 80, 12, "Log")], [line(1.6, [80, 80], [200, 130])], []),
    (error) => /** @type {any} */ (error).code === "overview_text_over_line",
  );
});
