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
 * The SHA-256 of what the small works drew before a drawing reported anything: recorded once from the source as
 * the queue item `fact-layer` left it, by the same fixture. The drawing gained a report beside what it draws, and
 * no shape, run or key may differ. The bytes of a PDF and of its images are those of one platform's Typst and
 * fonts, so no digest of them is held here: `archpub compare` of whole editions, before and after, holds them.
 */
const BEFORE = Object.freeze({
  "strips/01-architecture.svg": "7768f56bdc352255f968d4d630dfbfcfac3271702945268db2b4188d7f3d702c",
  "strips/01-architecture.runs": "c1d6ee2994b73b713405b7cab8e28f3c7998b3046ee6bb7a04b7a5e75311fa88",
  "strips/01-architecture.legend":
    "8d4ef71a69f693b88580f7b3bd744cf4016c6b489eaf38f4b1a81d7bb0b66aac",
  "cards/01-architecture.svg": "60d03a1f08f1e4bd52fe2072703f8ea5c42e183169a05fb68494c67fe73b70bb",
  "cards/01-architecture.runs": "a6a2ab9a9d5a8556603ff809d439cf73d037b004ec9859f17df31e17635d59a5",
  "cards/01-architecture.legend":
    "4a4ed2497ce4de2e0a0963164602437e6ffe1cbac295f6f5ebb47e9d4a8206f0",
  "grouped/01-overview.svg": "19faf6ba5258faaf057a07c12e4f87e4d292f76b88fd00012d049d919f4e4320",
  "grouped/01-overview.runs": "7075a3be0c3550944ed3efd1ae2cfd1dab528963e4108c83ce05d5326029f3db",
  "grouped/01-overview.legend": "75b20bb8593032715ab2c9b5bca66451d1c74ebf03da12b4c689a6fea12110eb",
  "grouped/02-pipeline.svg": "7768f56bdc352255f968d4d630dfbfcfac3271702945268db2b4188d7f3d702c",
  "grouped/02-pipeline.runs": "c1d6ee2994b73b713405b7cab8e28f3c7998b3046ee6bb7a04b7a5e75311fa88",
  "grouped/02-pipeline.legend": "8d4ef71a69f693b88580f7b3bd744cf4016c6b489eaf38f4b1a81d7bb0b66aac",
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
  // The supplies' strip starts with a file of the oldest band: its dye stands where the frame says it does.
  const [first] = stripOf(plate, "supplies");
  const { box } = face.components.find(({ id }) => id === "supplies");
  assert.equal(first.x, box.x);
  const inside = pixel(first.x + first.width / 2, first.y + first.height / 2);
  assert.equal(near(inside, rgb(INDIGO.dye.old)), true, `the strip's dye, not ${inside}`);
  // A little left of the part's box, and a little above its strip, the dye does not stand.
  for (const [x, y] of [
    [box.x - 5, first.y + first.height / 2],
    [first.x + first.width / 2, first.y - 5],
  ])
    assert.equal(near(pixel(x, y), rgb(INDIGO.dye.old)), false, `no dye at ${x}, ${y}`);
});
