import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { plateEntry } from "../src/pinned/face.mjs";
import {
  IMAGE_WIDTH,
  cardWork,
  digestsOf,
  groupedWork,
  stripWork,
  typesetWork,
} from "./fixtures/pinned-face.mjs";
import { temporaryDirectory } from "./fixtures/models.mjs";
import { readPng } from "./fixtures/png.mjs";
import { INDIGO, stripOf } from "./fixtures/strips.mjs";

const house = JSON.parse(await fs.readFile(new URL("../src/house.json", import.meta.url), "utf8"));
const works = { strips: await stripWork(), cards: await cardWork(), grouped: await groupedWork() };
const typeset = await typesetWork(works.grouped);

/**
 * The SHA-256 of what the small works draw: recorded once from the source, by the same fixture, when every part
 * became one card, with its strip where it owns files, its kind's icon in its caption and no kind in its key. A
 * drawing reports what it draws beside it, and no shape, run or key may differ. The bytes of a PDF and of its
 * images are those of one platform's Typst and fonts, so no digest of them is held here: `archpub compare` of
 * whole editions, before and after, holds them.
 */
const BEFORE = Object.freeze({
  "strips/01-architecture.svg": "1c396eec1ce1f1a224a970a701ac76e6dd153c27d0df68dbd944aba29ef4dc5e",
  "strips/01-architecture.runs": "7a494de11e2c15804fe3b90c2bee0389cfc05a34b091a1f8a40606b40b5b4a2f",
  "strips/01-architecture.legend":
    "19958dc661158600e9c32721bf21057b4c449f7f71eb498eaca8e42e33c79ac5",
  "cards/01-architecture.svg": "d1ba9b691c0ce13d5bef9770f58ab3bbd01f87f2831865cb280ba8488e208b44",
  "cards/01-architecture.runs": "aa367ce1ac80634b6ae91ab20f46505cfa303f0e96f163127749ce6efb66fec6",
  "cards/01-architecture.legend":
    "94d7fe87bc178be13a4cc84d870e3e21cbe9b9578d1814f1ad465f8fbab5e453",
  "grouped/01-overview.svg": "97eec2f2b9f973066ba439e770f86c5d40c2c33eff296c724a5a6fec8016e6fd",
  "grouped/01-overview.runs": "9f279b8d02ae1a5b74babcdb31720e5b1cc2e65a98dd32e6c84a58ca16ce6a0b",
  "grouped/01-overview.legend": "4c4d68e0c981d421f82a49a10080569923eb9de9ed95733842b2bcf81b85f3a7",
  "grouped/02-pipeline.svg": "0cca1791a1542921f8ae994ddff9324f7058e1c0036323cdd3a9a310e57f181f",
  "grouped/02-pipeline.runs": "7a494de11e2c15804fe3b90c2bee0389cfc05a34b091a1f8a40606b40b5b4a2f",
  "grouped/02-pipeline.legend": "c5c474d3662262de72de2795867060fdd9afa60dc220158efccbfa31cb494fc2",
});

test("a drawing that reports what it drew draws the same bytes: shapes, runs and keys", () => {
  const drawn = Object.entries(digestsOf(works, { work: "grouped", ...typeset })).filter(
    ([name]) => !/\.(?:pdf|png)$/u.test(name),
  );
  assert.deepEqual(Object.fromEntries(drawn), BEFORE);
});

test("the typeset edition hands back each plate's page in the PDF, counted from 1", () => {
  // A title page and the contents stand before the first plate; the edition has no overview page.
  assert.deepEqual(typeset.platePages, [
    { number: 1, page: 3 },
    { number: 2, page: 4 },
  ]);
  assert.equal(typeset.pages, 4);
});

test("an overview's page moves every plate one page on and is no plate itself", async (t) => {
  const composition = path.join(await temporaryDirectory(t), "overview.typ");
  await fs.writeFile(
    composition,
    [
      '#import "/archpub/house.typ": *',
      "#show: overview",
      "#masthead([The print edition], [What turns the views into the print edition?], [A small work.])",
      "#head(48pt, 140pt, [The builder])",
      '#tx(48pt, 170pt, label-of("builder"), weight: "semibold")',
      "#imprint([Each element's source is in the interactive atlas.])",
    ].join("\n"),
  );
  const withOverview = await typesetWork(works.grouped, composition);
  assert.deepEqual(withOverview.platePages, [
    { number: 1, page: 4 },
    { number: 2, page: 5 },
  ]);
  assert.deepEqual(
    withOverview.png.map(({ file }) => file),
    [
      `images/00-overview-${IMAGE_WIDTH}.png`,
      `images/01-overview-${IMAGE_WIDTH}.png`,
      `images/02-pipeline-${IMAGE_WIDTH}.png`,
    ],
  );
});

test("a plate's frame and scale place an element of its face on the plate's image", () => {
  const plate = works.grouped.plates[1];
  const { frame, face } = plateEntry(plate, { house });
  const image = readPng(typeset.png.find(({ file }) => file.includes("02-pipeline")).bytes);
  assert.equal(image.width, IMAGE_WIDTH);
  const pixel = (x, y) => {
    // Drawing space to page points by the frame, and points to pixels by the image's width over the page's.
    const scale = image.width / house.page.width;
    const column = Math.round((frame.x + x / frame.pixelsPerPoint) * scale);
    const row = Math.round((frame.y + y / frame.pixelsPerPoint) * scale);
    const at = (row * image.width + column) * image.channels;
    return [...image.pixels.subarray(at, at + 3)];
  };
  const rgb = (hex) => [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  const near = (a, b) => a.every((value, index) => Math.abs(value - b[index]) <= 3);
  // The supplies' strip starts with a file of the oldest band, one padding inside the part's box: its dye stands
  // where the frame says it does.
  const [first] = stripOf(plate, "supplies");
  const { box } = face.components.find(({ id }) => id === "supplies");
  assert.ok(first.x > box.x && first.x - box.x <= 24, `${first.x} in a box from ${box.x}`);
  const inside = pixel(first.x + first.width / 2, first.y + first.height / 2);
  assert.equal(near(inside, rgb(INDIGO.dye.old)), true, `the strip's dye, not ${inside}`);
  // A little left of the part's box, and a little above its strip, the dye does not stand.
  for (const [x, y] of [
    [box.x - 5, first.y + first.height / 2],
    [first.x + first.width / 2, first.y - 5],
  ])
    assert.equal(near(pixel(x, y), rgb(INDIGO.dye.old)), false, `no dye at ${x}, ${y}`);
});
