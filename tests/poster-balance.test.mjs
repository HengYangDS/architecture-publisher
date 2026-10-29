import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { DARKNESS, balanceOf, darkness } from "../packages/publisher/src/poster/balance.mjs";
import { gateFailures } from "../packages/publisher/src/poster/compose.mjs";
import { LIVE } from "../packages/publisher/src/poster/page.mjs";
import { POSTER } from "../packages/publisher/src/poster/tokens.mjs";

const judged = JSON.parse(
  await fs.readFile(new URL("./fixtures/balance-pages.json", import.meta.url), "utf8"),
);

/** One fixture rectangle as the ink a page measures. */
const ink = ([x, y, width, height, mass, weight]) => ({
  x,
  y,
  width,
  height,
  kind: mass ? "mass" : "stroke",
  weight,
});
const text = (x, y, width, height) => ({ x, y, width, height, kind: "mass", weight: 0.35 });
const wire = (x, y, width, height) => ({ x, y, width, height, kind: "stroke", weight: 0.4 });

test("every page the review rejected fails a gate and every page it accepted passes them all", () => {
  const rejectedBy = {
    "aigw/authority": ["emptyShare", "blankBand"],
    "ethos/intent": ["blankBand"],
    "self/overview": ["holes"],
  };
  for (const page of judged.pages) {
    const name = `${page.edition}/${page.page}`;
    const fails = gateFailures(balanceOf(page.rects.map(ink), LIVE)).map(({ measure }) => measure);
    assert.deepEqual(fails, page.verdict === "rejected" ? rejectedBy[name] : [], name);
  }
  assert.equal(judged.pages.filter(({ verdict }) => verdict === "rejected").length, 3);
  assert.equal(judged.pages.filter(({ verdict }) => verdict === "accepted").length, 4);
});

test("darkness runs from the paper to black", () => {
  assert.equal(darkness(POSTER.color.paper), 0);
  assert.equal(darkness("#000000"), 1);
  assert.ok(darkness(POSTER.color.ink) > darkness(POSTER.color.muted));
  assert.ok(DARKNESS.text > DARKNESS.card);
});

test("a page set edge to edge with text is balanced", () => {
  const lines = [];
  for (let y = LIVE.y; y + 24 <= LIVE.y + LIVE.height; y += 48)
    lines.push(text(LIVE.x, y, LIVE.width, 24));
  const measured = balanceOf(lines, LIVE);
  // The 24 px gaps between lines, and the paper below the last line.
  assert.ok(measured.band.height <= 48, String(measured.band.height));
  assert.equal(measured.holes, 0);
  assert.ok(measured.emptyShare < 0.05, String(measured.emptyShare));
  assert.ok(Math.hypot(...measured.centroid) < 0.02, String(measured.centroid));
  assert.deepEqual(gateFailures(measured), []);
});

test("a wire across a blank band leaves the band blank but divides the largest blank rectangle", () => {
  const top = text(LIVE.x, LIVE.y, LIVE.width, 336);
  const bottom = text(LIVE.x, 704, LIVE.width, LIVE.y + LIVE.height - 704);
  const open = balanceOf([top, bottom], LIVE);
  assert.deepEqual(open.band, { height: 304, y: 400 });
  assert.deepEqual(open.emptyRectangle, [LIVE.x, 400, LIVE.width, 304]);
  const crossed = balanceOf([top, bottom, wire(1200, 400, 2, 304)], LIVE);
  assert.deepEqual(crossed.band, open.band);
  assert.ok(crossed.emptyShare < open.emptyShare / 1.9, `${crossed.emptyShare} ${open.emptyShare}`);
  assert.deepEqual(
    gateFailures(crossed).map(({ measure }) => measure),
    ["emptyShare", "blankBand"],
  );
});

test("holes are the empty squares of the page at least 240 px on a side", () => {
  /** The live area filled with text around one empty square of `side` px. */
  const around = (side) => {
    const [x, y] = [1000, 504];
    return [
      text(LIVE.x, LIVE.y, LIVE.width, y - LIVE.y),
      text(LIVE.x, y + side, LIVE.width, LIVE.y + LIVE.height - y - side),
      text(LIVE.x, y, x - LIVE.x, side),
      text(x + side, y, LIVE.x + LIVE.width - x - side, side),
    ];
  };
  const hole = balanceOf(around(320), LIVE);
  // A 40 × 40 cell square out of 284 × 153 cells.
  assert.equal(hole.holes, 0.037);
  assert.deepEqual(hole.emptyRectangle, [1000, 504, 320, 320]);
  assert.equal(balanceOf(around(200), LIVE).holes, 0);
});

test("ink wholly off the page covers no cell of it", () => {
  // Left of the page in its first row of cells, and above the page.
  const measured = balanceOf([text(-80, 0, 40, 6), text(LIVE.x, -40, 200, 20)], LIVE);
  assert.equal(measured.emptyShare, 1);
  assert.equal(measured.holes, 1);
  assert.deepEqual(measured.centroid, [0, 0]);
});

test("the centre of gravity weighs each element by how dark it prints", () => {
  const half = LIVE.width / 4;
  const left = text(LIVE.x, LIVE.y, half, LIVE.height);
  const right = { ...left, x: LIVE.x + LIVE.width - half, weight: DARKNESS.card };
  const [across, down] = balanceOf([left, right], LIVE).centroid;
  assert.ok(across < -0.25, String(across));
  assert.equal(down, 0);
  const even = balanceOf([left, { ...right, weight: left.weight }], LIVE).centroid;
  assert.deepEqual(
    even.map((value) => Math.abs(value)),
    [0, 0],
  );
});
