import assert from "node:assert/strict";
import test from "node:test";
import { inlined } from "../src/edition/typeset.mjs";
import { HOUSE } from "../src/poster/tokens.mjs";
import { cardWork, groupedWork, stripWork, typesetWork } from "./fixtures/pinned-face.mjs";
import { readPng } from "./fixtures/png.mjs";
import { arrowsOf, gapsOf, rectsOf, wiresOf } from "./fixtures/strips.mjs";

// A view's figure is used outside its edition: in a slide, a document, a chat. So nothing in a figure is painted in
// the colour of the page it happens to stand on, and a delivery holds each figure and its key alone, on no ground.

const [strips, cards, grouped] = [await stripWork(), await cardWork(), await groupedWork()];
const works = [strips, cards, grouped];
const paperOf = (work) => (work.style?.tokens ?? HOUSE).palette.paper;

/** A plate's lines: what stands in the one group that the labels' boxes clip. */
function linesOf(svg) {
  const open = '<g clip-path="url(#figure-gaps)">';
  const start = svg.indexOf(open);
  assert.equal(svg.split(open).length, 2, "one group of lines");
  return svg.slice(start, svg.indexOf("</g>", start));
}

test("a figure paints nothing in its page's colour: a line is broken where a label stands, by a gap and no patch", () => {
  for (const work of works)
    for (const plate of work.plates) {
      const name = plate.views.join("+");
      assert.deepEqual(
        rectsOf(plate.svg).filter(({ fill }) => fill === paperOf(work)),
        [],
        `${name}: a rectangle of the paper's colour`,
      );
      // One gap for each relation's label, with a label's corners, and one for the boundary's name where it is drawn.
      const gaps = gapsOf(plate.svg);
      assert.deepEqual(
        gaps
          .filter(({ radius }) => radius === 6)
          .map(({ x, y, width, height }) => ({ x, y, width, height })),
        plate.report.labels.map(({ box }) => box),
        `${name}: the labels' gaps`,
      );
      assert.equal(
        gaps.filter(({ radius }) => radius === 7).length,
        plate.svg.includes("stroke-dasharray") ? 1 : 0,
      );
      assert.equal(gaps.length > 0, true, `${name}: no gap at all`);
    }
});

test("every wire and arrowhead of a figure is drawn within the clipped group, and no card is", () => {
  for (const work of works)
    for (const plate of work.plates) {
      const lines = linesOf(plate.svg);
      const routed = (svg) => wiresOf(svg).filter(({ points }) => points.length > 1);
      assert.equal(routed(lines).length, routed(plate.svg).length);
      assert.equal(routed(lines).length > 0, true);
      assert.equal(arrowsOf(lines).length, arrowsOf(plate.svg).length);
      assert.equal(lines.includes('filter="url(#lift)"'), false);
    }
});

test("an SVG's nested image becomes the document it holds, of the image's size and under its transform", () => {
  const figure =
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="-5 0 30 20"><path d="M0 0H9"/></svg>';
  const typst =
    '<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
    `<g><image transform="matrix(1 0 0 1 2 3)" xlink:href="data:image/svg+xml;base64,${Buffer.from(figure).toString("base64")}" ` +
    'width="15" height="10" preserveAspectRatio="none"/></g><use xlink:href="#g1"/></svg>';
  const whole = inlined(typst);
  assert.equal(whole.includes("data:"), false);
  assert.equal(whole.includes("<image"), false);
  assert.match(
    whole,
    /<g transform="matrix\(1 0 0 1 2 3\)"><svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="15" height="10" viewBox="-5 0 30 20" preserveAspectRatio="none"><path d="M0 0H9"\/><\/svg><\/g>/u,
  );
  // What is no nested SVG image is left as it is.
  const raster = '<svg><image xlink:href="data:image/png;base64,AAAA" width="1" height="1"/></svg>';
  assert.equal(inlined(raster), raster);
});

test("a delivery's figures stand alone on no ground, one PNG and one SVG a plate, with a wire broken under its label", async () => {
  const width = 3200;
  const density = width / HOUSE.page.width;
  const { figures } = await typesetWork(strips, null, [width], true);
  const [plate] = strips.plates;
  const name = `01-${plate.views.join("+")}`;
  assert.deepEqual(
    figures.map(({ file }) => file),
    [`figures/${name}.png`, `figures/${name}.svg`],
  );
  const image = readPng(figures[0].bytes);
  assert.equal(image.channels, 4);
  // A place of the figure, in its own px, on the picture: the figure stands at the pad from the corner.
  const pad = HOUSE.plate.alonePad;
  const at = (x, y) => [
    Math.round(((x - plate.extent.x) / HOUSE.plate.pixelsPerPoint + pad) * density),
    Math.round(((y - plate.extent.y) / HOUSE.plate.pixelsPerPoint + pad) * density),
  ];
  const alpha = ([x, y]) => image.pixels[(y * image.width + x) * 4 + 3];
  // The most opaque of the five pixels across a level line at a place: a line two pixels wide may fall between two.
  const across = ([x, y]) => Math.max(...[-2, -1, 0, 1, 2].map((dy) => alpha([x, y + dy])));
  assert.equal(alpha([1, 1]), 0, "the corner stands on no ground");
  assert.equal(
    image.width,
    Math.ceil((plate.extent.width / HOUSE.plate.pixelsPerPoint + 2 * pad) * density - 0.001),
  );
  const [card] = plate.report.parts;
  assert.equal(
    alpha(at(card.box.x + card.box.width / 2, card.box.y + card.box.height - 3)),
    255,
    "a card is opaque",
  );
  // A stretch of a wire that passes through its label's box: drawn before the box and after it, and not within it.
  let read = 0;
  for (const { box } of plate.report.labels)
    for (const { points } of plate.report.paths)
      for (let index = 1; index < points.length; index += 1) {
        const [[x1, y1], [x2, y2]] = [points[index - 1], points[index]];
        const level = y1 === y2 && y1 > box.y + 4 && y1 < box.y + box.height - 4;
        if (!level || Math.min(x1, x2) > box.x - 12 || Math.max(x1, x2) < box.x + box.width + 12)
          continue;
        assert.equal(across(at(box.x - 8, y1)), 255, "the wire before its label");
        assert.equal(across(at(box.x + box.width + 8, y1)), 255, "the wire after its label");
        // Just inside the box's edge, where the label's own text has not begun.
        assert.equal(across(at(box.x + 3, y1)), 0, "no wire and no patch under the label");
        read += 1;
      }
  assert.equal(read > 0, true, "the plate has a level wire through a label to read");
  // The SVG is one document of shapes: no data URI, no image, no live text, and no id twice.
  const svg = figures[1].bytes.toString("utf8");
  for (const absent of ["data:", "<image", "<text"])
    assert.equal(svg.includes(absent), false, absent);
  const ids = [...svg.matchAll(/ id="([^"]+)"/gu)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(svg.includes('clip-path="url(#figure-gaps)"'), true);
});
