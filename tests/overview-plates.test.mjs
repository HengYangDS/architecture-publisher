import assert from "node:assert/strict";
import test from "node:test";
import { checkModel } from "../src/build.mjs";
import { DEFAULT_LOCALE } from "../src/locale.mjs";
import { validateModel } from "../src/model/load.mjs";
import { checkOverview } from "../src/overview/typeset.mjs";
import { minimalModel, pageModel, writeModel } from "./fixtures/models.mjs";
import { groupedWork, typesetWork } from "./fixtures/pinned-face.mjs";

// The overview is the edition's map: one page that holds the whole, on which each step and block names the plate
// that enlarges it, by number and as a link. The owner, 2026-11-18: the overview's mission is one page of overview,
// the pages after it each expand one topic, and links that jump are needed. The model states, for a step or a
// block, the view it speaks of: a reference, never a position.

const VIEWS = [
  { id: "calls", title: "The call", question: "Who calls whom?", members: ["a", "b"] },
  { id: "answers", title: "The answer", question: "Who answers?", members: ["a", "b"] },
];

/** A statement whose first step, one station, one branch of a fork and first block name `view`; the rest name none. */
const statement = (view = "calls") => ({
  claim: "A claim",
  lead: "A lead.",
  course: {
    steps: [
      { id: "one", label: "One", view },
      { id: "two", label: "Two" },
      {
        id: "three",
        label: "Three",
        stations: [
          { id: "stop", label: "Stop", view },
          {
            branches: [
              { id: "left", label: "Left", view },
              { id: "right", label: "Right" },
            ],
          },
        ],
      },
    ],
  },
  blocks: [
    { title: "Terms", view, items: [["term", "its text"]] },
    { title: "Others", items: [["term", "its text"]] },
  ],
});

/** The statement with a spur at its first step that names `view` too. */
const withSpur = (/** @type {ReturnType<typeof statement>} */ stated, view = "calls") => ({
  ...stated,
  course: { ...stated.course, spurs: [{ at: "one", id: "aside", label: "Aside", view }] },
});

/** The problems a model is refused with, as code and path. */
function problemsOf(model) {
  try {
    validateModel(model);
  } catch (error) {
    return /** @type {any} */ (error).problems.map(({ code, path }) => [code, path]);
  }
  return [];
}

test("a step, a spur and a block name the view that enlarges them, and a view the model lacks is refused", () => {
  const stated = withSpur(statement());
  assert.deepEqual(
    validateModel(minimalModel({ views: VIEWS, overview: stated })).overview,
    stated,
  );
  const absent = withSpur(statement("absent"), "absent");
  assert.deepEqual(problemsOf(minimalModel({ views: VIEWS, overview: absent })), [
    ["model_reference_unknown", "/overview/course/steps/0/view"],
    ["model_reference_unknown", "/overview/course/steps/2/stations/0/view"],
    ["model_reference_unknown", "/overview/course/steps/2/stations/1/branches/0/view"],
    ["model_reference_unknown", "/overview/course/spurs/0/view"],
    ["model_reference_unknown", "/overview/blocks/0/view"],
  ]);
});

test("the page sets a plate's number after the name of each step, station, branch and block that names its view", async () => {
  const { boxes } = await checkOverview({
    modelBytes: Buffer.from(JSON.stringify(minimalModel({ views: VIEWS, overview: statement() }))),
    locale: DEFAULT_LOCALE,
    plates: { calls: "07", answers: "08" },
    revision: null,
    date: "2026-11-18",
  });
  const numbers = boxes.filter(({ text }) => text === "07");
  assert.equal(numbers.length, 4, "one number by the step, the station, the branch and the block");
  assert.ok(!boxes.some(({ text }) => text === "08"), "a view nothing names sets no number");
  for (const name of ["One", "Stop", "Left", "Terms"]) {
    const named = boxes.find(({ text }) => text === name);
    const number = numbers.find(
      (box) => box.x > named.x + named.w && box.x < named.x + named.w + 24,
    );
    assert.ok(number, `no number stands right after "${name}"`);
    // On the name's line: the number's box ends within the name's.
    assert.ok(
      number.y >= named.y && number.y + number.h <= named.y + named.h + 0.5,
      `the number by "${name}" is off its line`,
    );
  }
});

test("in the edition each number is a link to its plate's page", async () => {
  const work = await groupedWork();
  const [first, second] = work.plates.map((plate) => plate.views[0]);
  const count = (pdf, key) =>
    (pdf.toString("latin1").match(new RegExp(`/Dest\\(${key}\\)`, "gu")) ?? []).length;
  const stated = statement(second);
  stated.blocks[0].view = first;
  const plain = await typesetWork(work, {
    ...statement(),
    course: {
      steps: [
        { id: "one", label: "One" },
        { id: "two", label: "Two" },
      ],
    },
    blocks: [],
  });
  const linked = await typesetWork(work, stated);
  // The contents page links to every plate once; the overview adds a link for the step, the station and the branch,
  // and one for the block.
  assert.equal(count(linked.pdf, "plate-02") - count(plain.pdf, "plate-02"), 3);
  assert.equal(count(linked.pdf, "plate-01") - count(plain.pdf, "plate-01"), 1);
});

test("a check refuses a view that nothing on the overview names, at its path", async (t) => {
  const views = [
    {
      id: "front",
      title: "The front",
      question: "Who reaches the gateway?",
      members: ["client", "web", "gateway"],
    },
    {
      id: "back",
      title: "The back",
      question: "Where is an order kept?",
      members: ["gateway", "api", "db"],
    },
  ];
  const file = await writeModel(t, pageModel({ views, overview: statement("front") }));
  await assert.rejects(checkModel(file, { media: ["edition"] }), (error) => {
    assert.equal(/** @type {any} */ (error).code, "overview_view_unreached");
    assert.deepEqual(
      /** @type {any} */ (error).problems.map(({ path }) => path),
      ["/views/1"],
    );
    return true;
  });
  // The page alone sets no overview, and reaches its views by its own sections.
  await checkModel(file, { media: ["page"] });
});
