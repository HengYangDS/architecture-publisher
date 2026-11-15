import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { plateEntry, plateFace, plateFrame, plateScales } from "../src/pinned/face.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import {
  cardWork,
  differences,
  groupedWork,
  statementsOfFace,
  stripWork,
} from "./fixtures/pinned-face.mjs";
import { platesIn, stripOf, wiresOf } from "./fixtures/strips.mjs";

const house = JSON.parse(await fs.readFile(new URL("../src/house.json", import.meta.url), "utf8"));
const [strips, cards, grouped] = [await stripWork(), await cardWork(), await groupedWork()];

const relationOf = (face, id) => face.relations.find((relation) => relation.id === id);

test("a figure's report names every component, group and relation of its view and nothing else", () => {
  for (const { views, plates } of [strips, cards, grouped])
    for (const [index, plate] of plates.entries()) {
      const face = plateFace(plate.report);
      assert.deepEqual(differences(views[index], face), {}, `plate ${plate.views.join("+")}`);
      // Each statement is reported once.
      const { components, groups, relations } = statementsOfFace(face);
      for (const ids of [components, groups, relations])
        assert.equal(new Set(ids).size, ids.length);
    }
  const [overview] = grouped.plates;
  assert.deepEqual(statementsOfFace(plateFace(overview.report)).groups, ["pipeline"]);
});

test("a relation is written with its ends and its label, in the order the contract gives", () => {
  const face = plateFace(strips.plates[0].report);
  const composes = relationOf(face, "composes");
  assert.deepEqual(Object.keys(face), ["components", "groups", "relations"]);
  assert.deepEqual(Object.keys(composes), ["id", "from", "to", "text", "segments", "label"]);
  assert.deepEqual(
    [composes.from, composes.to, composes.text],
    ["builder", "composer", "builder —composes→ composer"],
  );
  assert.equal(composes.segments.length >= 1, true);
  for (const segment of composes.segments) assert.equal(segment.length >= 2, true);
  assert.deepEqual(Object.keys(composes.label), ["x", "y", "width", "height"]);
  // The face repeats no fact: an entry of a part holds its id and its box alone.
  for (const part of face.components) assert.deepEqual(Object.keys(part), ["id", "box"]);
});

test("an overview's line carries the relations it stands for, and no text", () => {
  const face = plateFace(grouped.plates[0].report);
  const intoSupplies = face.relations.find(({ to }) => to === "supplies");
  assert.deepEqual(
    [intoSupplies.from, intoSupplies.relations],
    ["pipeline", ["fonts", "icons", "faces", "stages"]],
  );
  assert.match(intoSupplies.id, /^overview-\d+$/u);
  assert.equal("text" in intoSupplies, false);
  // A line that stands for one relation still names it as the relation it stands for.
  const intoTypst = face.relations.find(({ to }) => to === "typst");
  assert.deepEqual([intoTypst.from, intoTypst.relations], ["pipeline", ["runs"]]);
});

test("relations that share a trunk each list it, then the branch of their own", async () => {
  const model = validateModel(
    minimalModel({
      components: [
        { id: "a", label: "Alpha" },
        { id: "b", label: "Beta" },
        { id: "c", label: "Gamma" },
      ],
      relations: [
        { id: "a-b", from: "a", to: "b", label: "calls" },
        { id: "a-c", from: "a", to: "c", label: "calls" },
      ],
    }),
  );
  const { plates } = await platesIn(model, undefined);
  const face = plateFace(plates[0].report);
  const [first, second] = [relationOf(face, "a-b"), relationOf(face, "a-c")];
  // The trunk out of Alpha and the bar it meets are stroked once for both; each branch is one relation's.
  assert.equal(plates[0].report.paths.length, 4);
  assert.deepEqual(
    plates[0].report.paths.map(({ relations }) => relations.map(({ id }) => id)),
    [["a-b", "a-c"], ["a-b", "a-c"], ["a-b"], ["a-c"]],
  );
  assert.equal(first.segments.length, 3);
  assert.deepEqual(first.segments.slice(0, 2), second.segments.slice(0, 2));
  assert.notDeepEqual(first.segments[2], second.segments[2]);
  const boxOf = (id) => face.components.find((part) => part.id === id).box;
  for (const [relation, id] of [
    [first, "b"],
    [second, "c"],
  ]) {
    const [x] = relation.segments[2].at(-1);
    const box = boxOf(id);
    assert.equal(x >= box.x && x <= box.x + box.width, true, `${relation.id} ends over ${id}`);
  }
  // One label is set for both, and each names its box.
  assert.notEqual(first.label, null);
  assert.deepEqual(first.label, second.label);
});

test("a path left out of a figure's report is found against the view's statement set", () => {
  const [plate] = strips.plates;
  const [view] = strips.views;
  const without = (id) => ({
    ...plate.report,
    paths: plate.report.paths.filter(({ relations }) => !relations.some((one) => one.id === id)),
  });
  assert.deepEqual(differences(view, plateFace(without("writes"))), {
    relations: { undrawn: ["writes"], unplanned: [] },
  });
  // A part left out, and one the view does not hold, are found the same way.
  const parts = plate.report.parts;
  const swapped = {
    ...plate.report,
    parts: [...parts.slice(1), { id: "stranger", box: parts[0].box }],
  };
  assert.deepEqual(differences(view, plateFace(swapped)), {
    components: { undrawn: [parts[0].id], unplanned: ["stranger"] },
  });
});

/** The corners a wire's path names: its first point, the control point of each rounded corner, and its last. */
const cornersOf = (points) =>
  points.filter((_, index) => index === 0 || index === points.length - 1 || index % 3 === 2);

test("the reported boxes and points are the numbers the plate's SVG writes", () => {
  const [plate] = cards.plates;
  const face = plateFace(plate.report);
  const numbers = (match) => {
    const [x, y, width, height] = match.slice(1, 5).map(Number);
    return { x, y, width, height };
  };
  const drawnCards = [
    ...plate.svg.matchAll(
      /<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)" [^>]*filter="url\(#lift\)"[^>]*\/>/gu,
    ),
  ].map(numbers);
  assert.equal(drawnCards.length, 6);
  assert.deepEqual(
    face.components.map(({ box }) => box),
    drawnCards,
  );
  // Each label's plate of paper is a rectangle with the corners of a label.
  const drawnLabels = [
    ...plate.svg.matchAll(
      /<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)" rx="6" [^>]*\/>/gu,
    ),
  ].map(numbers);
  assert.deepEqual(
    plate.report.labels.map(({ box }) => box),
    drawnLabels,
  );
  assert.equal(drawnLabels.length, face.relations.filter(({ label }) => label).length);
  for (const { label } of face.relations)
    assert.equal(
      drawnLabels.some((box) => JSON.stringify(box) === JSON.stringify(label)),
      true,
    );
  // Each stroked path is reported in the order drawn, by the corners its path names.
  for (const one of [plate, strips.plates[0], grouped.plates[0]]) {
    const wires = wiresOf(one.svg)
      .filter(({ points }) => points.length > 1)
      .map(({ points }) => cornersOf(points));
    assert.equal(wires.length > 0, true);
    assert.deepEqual(
      one.report.paths.map(({ points }) => points),
      wires,
    );
  }
});

test("a strip part's box is the rectangle its label, strip and caption are set in", () => {
  const [plate] = strips.plates;
  const face = plateFace(plate.report);
  assert.deepEqual(face.components.map(({ id }) => id).toSorted(), [
    "builder",
    "composer",
    "record",
    "supplies",
    "typst",
    "words",
  ]);
  for (const { id, box } of face.components) {
    const strip = stripOf(plate, id);
    const [first, last] = [strip[0], strip.at(-1)];
    const label = plate.runs.find(({ component }) => component === id);
    assert.equal(first.x, box.x, `${id}: the strip starts at the box's left edge`);
    // A run keeps the engine's own number, which the box rounds as the SVG does.
    assert.equal(
      Math.abs(label.x - box.x) < 0.06,
      true,
      `${id}: the label starts at the box's left edge`,
    );
    assert.equal(box.y < label.baseline && label.baseline < first.y, true);
    assert.equal(last.x + last.width <= box.x + box.width + 0.11, true);
    // The caption is the nearest line under the strip at the box's left edge: it stands inside the box.
    const [caption] = plate.runs
      .filter((run) => Math.abs(run.x - box.x) < 0.06 && run.baseline > first.y)
      .toSorted((a, b) => a.baseline - b.baseline);
    const foot = box.y + box.height;
    assert.equal(first.y + first.height < caption.baseline && caption.baseline <= foot, true, id);
  }
});

test("a face is built from a report alone: parts by kind, relations in the order stroked", () => {
  const box = { x: 1, y: 2, width: 3, height: 4 };
  const relation = { id: "a-b", from: "a", to: "b", label: "calls" };
  const line = { id: "overview-1", from: "g", to: "b", label: "x / y", relations: ["x", "y"] };
  const report = {
    parts: [
      { id: "g", group: true, box },
      { id: "a", box },
      { id: "b", box },
    ],
    paths: [
      {
        relations: [line],
        points: [
          [0, 0],
          [0, 9],
        ],
      },
      {
        relations: [relation],
        points: [
          [5, 0],
          [5, 9],
        ],
      },
      {
        relations: [line],
        points: [
          [0, 9],
          [7, 9],
        ],
      },
    ],
    labels: [{ relations: ["overview-1"], box }],
  };
  assert.deepEqual(plateFace(report), {
    components: [
      { id: "a", box },
      { id: "b", box },
    ],
    groups: [{ id: "g", box }],
    relations: [
      {
        id: "overview-1",
        from: "g",
        to: "b",
        relations: ["x", "y"],
        segments: [
          [
            [0, 0],
            [0, 9],
          ],
          [
            [0, 9],
            [7, 9],
          ],
        ],
        label: box,
      },
      {
        id: "a-b",
        from: "a",
        to: "b",
        text: "a —calls→ b",
        segments: [
          [
            [5, 0],
            [5, 9],
          ],
        ],
        label: null,
      },
    ],
  });
});

test("a plate's scales are the strips' one scale, and a plate of cards has none", () => {
  assert.deepEqual(plateScales({ longest: 360, scale: 122105 }), [
    { property: "owned-bytes", unit: "bytes", value: 122105, length: 360 },
  ]);
  // Cards record no length; strips of an edition whose parts own no file are drawn on no scale.
  assert.deepEqual(plateScales({ scale: 122105 }), []);
  assert.deepEqual(plateScales({ longest: 360, scale: null }), []);
});

test("a plate's frame is where the house class sets its figure, under a summary too", async () => {
  assert.deepEqual(plateFrame({ width: 2256, height: 1071, reading: "none" }, house), {
    x: 48,
    y: 112,
    width: 1504,
    height: 714,
    pixelsPerPoint: 1.5,
  });
  // A figure that gives up width to its reading keeps the body's height.
  assert.deepEqual(plateFrame({ width: 1805, height: 1071, reading: "set" }, house), {
    x: 48,
    y: 112,
    width: 1805 / 1.5,
    height: 714,
    pixelsPerPoint: 1.5,
  });
  // Under a summary set above it, the figure keeps the height it was composed in and stands on the body's bottom.
  assert.deepEqual(plateFrame({ width: 2256, height: 951, reading: "above" }, house), {
    x: 48,
    y: 826 - 634,
    width: 1504,
    height: 634,
    pixelsPerPoint: 1.5,
  });
  // The frame repeats the house class's arithmetic: these are the lines it repeats.
  const typ = await fs.readFile(new URL("../src/overview/house.typ", import.meta.url), "utf8");
  for (const line of [
    "#let _k = 1pt / _house.plate.pixelsPerPoint",
    "#let margin = _house.page.margin * 1pt",
    "  let width = p.figureWidth * _k",
    "  let height = if p.standfirst == none { (_e.bodyBottom - _e.bodyTop) * 1pt } else { p.figureHeight * _k }",
    "  let figure-top = if p.standfirst == none { _e.bodyTop * 1pt } else { _e.bodyBottom * 1pt - height }",
    "  place(top + left, dx: margin, dy: figure-top, figure(alt: p.alt, box(width: width, height: height, {",
  ])
    assert.equal(typ.includes(`\n${line}\n`), true, line);
  const record = await fs.readFile(new URL("../src/edition/record.mjs", import.meta.url), "utf8");
  assert.match(
    record,
    /standfirst: plate\.reading === "above" \? plate\.standfirst\.lines : null/u,
  );
});

test("a plate's entry holds what the build knows of it, and no key for what it does not", () => {
  const [plate] = grouped.plates;
  const images = [{ width: 2400, file: "images/01-overview.png" }];
  const scales = plateScales({ longest: 360, scale: 56000 });
  const entry = plateEntry(plate, { page: 3, images, house, scales });
  assert.deepEqual(Object.keys(entry), [
    "number",
    "views",
    "page",
    "images",
    "frame",
    "scales",
    "face",
  ]);
  assert.deepEqual(
    [entry.number, entry.views, entry.page, entry.images, entry.scales],
    [1, ["overview"], 3, images, scales],
  );
  assert.deepEqual(entry.frame, plateFrame(plate, house));
  assert.deepEqual(entry.face, plateFace(plate.report));
  // A check typesets no edition: the plate has a face, no image, and neither a page, a frame nor scales.
  const checked = plateEntry(plate);
  assert.deepEqual(Object.keys(checked), ["number", "views", "images", "face"]);
  assert.deepEqual(checked.images, []);
  // A build that knows a plate's page and frame writes them without the others.
  assert.deepEqual(Object.keys(plateEntry(plate, { page: 3, house })), [
    "number",
    "views",
    "page",
    "images",
    "frame",
    "face",
  ]);
  assert.deepEqual(Object.keys(plateEntry(plate, { images, scales: [] })), [
    "number",
    "views",
    "images",
    "scales",
    "face",
  ]);
  // Two entries of one plate are the same bytes.
  assert.equal(
    JSON.stringify(plateEntry(plate, { page: 3, images, house, scales })),
    JSON.stringify(entry),
  );
});
