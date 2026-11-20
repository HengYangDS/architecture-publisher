import assert from "node:assert/strict";
import fs from "node:fs/promises";
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
import { readPng } from "./fixtures/png.mjs";
import { INDIGO, stripOf } from "./fixtures/strips.mjs";

const house = JSON.parse(await fs.readFile(new URL("../src/house.json", import.meta.url), "utf8"));
const works = { strips: await stripWork(), cards: await cardWork(), grouped: await groupedWork() };
const typeset = await typesetWork(works.grouped);

/**
 * The SHA-256 of what the small works draw: recorded from the source, by the same fixture. The runs are those
 * recorded when every part became one card, with its strip where it owns files, its kind's icon in its caption and
 * no kind in its key. The shapes and the keys were recorded anew when a gap in a line became a hole of the lines'
 * clip path and the key's entries a bound and a unit: each plate's shapes lost the rounded rectangles of the
 * paper's colour under its labels and its boundary's name and gained the clip path, with a hole for each, and the
 * group it clips; each key kept its entries and their samples, took the new words and set the entry of the commit
 * before the bands, with its form that states no date. The keys were recorded once more when the commit's entry
 * came to say what its bands measure. A drawing reports what it draws beside it, and no shape,
 * run or key may differ. The bytes of a PDF and of its images are those of one platform's Typst and fonts, so no
 * digest of them is held here: `archpub compare` of whole editions, before and after, holds them.
 */
const BEFORE = Object.freeze({
  "strips/01-architecture.svg": "95fe865c34e03bcf7bd07900eb9bedfc0d29d6186d3da458363202643fcd5e4a",
  "strips/01-architecture.runs": "7a494de11e2c15804fe3b90c2bee0389cfc05a34b091a1f8a40606b40b5b4a2f",
  "strips/01-architecture.legend":
    "6dcc1e499f1678301160a7f50b7ada8c8c4e9b678c3390f37dca111a94c57b79",
  "cards/01-architecture.svg": "ec237cf53ae1f66e2b68570946865d5b1f5b9350ab7d5eacb167d9ca26ddccbf",
  "cards/01-architecture.runs": "aa367ce1ac80634b6ae91ab20f46505cfa303f0e96f163127749ce6efb66fec6",
  "cards/01-architecture.legend":
    "1987865c915ebec6910a993eb4b7cd8a9eb1020d662f8fef0ac3c446cf968ce5",
  "grouped/01-overview.svg": "4f8e8ea642ec9a74e31be5b3240823078e92a2a367b3dabaee3f1d4dd3a01697",
  "grouped/01-overview.runs": "9f279b8d02ae1a5b74babcdb31720e5b1cc2e65a98dd32e6c84a58ca16ce6a0b",
  "grouped/01-overview.legend": "a9337644cd8f3f2a7c1897a5ca8afec6627f333118cde4756eb8e7167e9181d0",
  "grouped/02-pipeline.svg": "36a60612a7f0ecd533dc8bfa7ab3603ee6c3ec0fc88affd23aee4afddde2d05d",
  "grouped/02-pipeline.runs": "7a494de11e2c15804fe3b90c2bee0389cfc05a34b091a1f8a40606b40b5b4a2f",
  "grouped/02-pipeline.legend": "80fc8e22bbd998355f9d48d665224226589751a808b1ccd96e6cbb53359ba991",
});

test("a drawing that reports what it drew draws the same bytes: shapes, runs and keys", () => {
  const drawn = Object.entries(digestsOf(works, { work: "grouped", ...typeset })).filter(
    ([name]) => !/\.(?:pdf|png)$/u.test(name),
  );
  assert.deepEqual(Object.fromEntries(drawn), BEFORE);
});

test("the typeset edition hands back each plate's page in the PDF, counted from 1", () => {
  // A title page and the contents stand before the first plate, and the index after the last; the edition has no
  // overview page.
  assert.deepEqual(typeset.platePages, [
    { number: 1, page: 3 },
    { number: 2, page: 4 },
  ]);
  assert.equal(typeset.pages, 5);
});

test("an overview's page moves every plate one page on and is no plate itself", async () => {
  // The overview a model states, drawn by the publisher: a claim, a lead and a course of two steps.
  const withOverview = await typesetWork(works.grouped, {
    claim: "What turns the views into the print edition?",
    lead: "A small work.",
    course: {
      steps: [
        { id: "model", label: "The model" },
        { id: "edition", label: "The edition" },
      ],
    },
  });
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
