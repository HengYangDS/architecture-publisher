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
  "strips/01-architecture.svg": "0a06d5286f145d27de38a49a34878267efad92dc68a81feeb42c1372a3d024e4",
  "strips/01-architecture.runs": "195d70abb1299baba96fc5f94e4459e8fc623eefae372eeb3d0b5499d1014ac7",
  "strips/01-architecture.legend":
    "b3c45a6ab68fae178d76b8098aa7f5f7831bd2897aacc4284cb855b050177dc8",
  "cards/01-architecture.svg": "d1ba9b691c0ce13d5bef9770f58ab3bbd01f87f2831865cb280ba8488e208b44",
  "cards/01-architecture.runs": "aa367ce1ac80634b6ae91ab20f46505cfa303f0e96f163127749ce6efb66fec6",
  "cards/01-architecture.legend":
    "94d7fe87bc178be13a4cc84d870e3e21cbe9b9578d1814f1ad465f8fbab5e453",
  "grouped/01-overview.svg": "e2b5d7ebea9d996526d1a76e07c5716b175852b4d8792ab474f469a4b00d6a4c",
  "grouped/01-overview.runs": "98e0e4c6c34564bd3edb1b7e68f737d26177247caa4ca32c03e27c4bf85e2aea",
  "grouped/01-overview.legend": "375182de1536a06c23199b29dfeaca0332398b1391162c2849fde3fb59ef52ac",
  "grouped/02-pipeline.svg": "4e3c18d8342a2fbf8bd38cf3b293375aec842be43d41aa74e0953187727724b4",
  "grouped/02-pipeline.runs": "195d70abb1299baba96fc5f94e4459e8fc623eefae372eeb3d0b5499d1014ac7",
  "grouped/02-pipeline.legend": "b15496312a08f5e1f54f8de79aabd952c2fa25f1910b4bcf32cfe882f97db963",
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
