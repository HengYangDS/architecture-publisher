import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { everyBlock } from "./fixtures/overview-statements.mjs";

// A model states its overview as blocks without positions, and the publisher draws the page from that alone. A
// composition placed by coordinates is retired: the owner ruled on 2026-11-17 that nothing is placed by hand.

/** The problems a model is refused with, as code and path. */
function problemsOf(model) {
  try {
    validateModel(model);
  } catch (error) {
    return /** @type {any} */ (error).problems.map(({ code, path }) => [code, path]);
  }
  return [];
}

test("a model states an overview of every kind of block and keeps it", () => {
  const statement = everyBlock();
  const model = validateModel(minimalModel({ overview: statement }));
  assert.deepEqual(model.overview, statement);
});

test("a composition named in overview is refused as retired", () => {
  assert.deepEqual(problemsOf(minimalModel({ overview: "overview.typ" })), [
    ["model_overview_composition_retired", "/overview"],
  ]);
});

test("an overview names only parts, steps and stations that exist", () => {
  const statement = everyBlock();
  statement.course.steps[1].stations[1].part = "c";
  statement.course.lines[0].to = ["nowhere"];
  statement.blocks[0].pass.after = "elsewhere";
  statement.blocks[0].aside.from = "elsewhere";
  assert.deepEqual(problemsOf(minimalModel({ overview: statement })), [
    ["model_reference_unknown", "/overview/course/steps/1/stations/1/part"],
    ["model_reference_unknown", "/overview/course/lines/0/to/0"],
    ["model_reference_unknown", "/overview/blocks/0/pass/after"],
    ["model_reference_unknown", "/overview/blocks/0/aside/from"],
  ]);
});

test("an overview states no position, size or type, and a stretch runs on two to four tracks", () => {
  const statement = everyBlock();
  Object.assign(statement.course.steps[0], { x: 48 });
  Object.assign(statement.blocks[1], { width: 400 });
  statement.course.parallel[0].tracks = 6;
  assert.deepEqual(problemsOf(minimalModel({ overview: statement })), [
    ["model_field_unknown", "/overview/course/steps/0/x"],
    ["model_overview_invalid", "/overview/course/parallel/0/tracks"],
    ["model_field_unknown", "/overview/blocks/1/width"],
  ]);
});

test("a fork holds two branches or more, and a stretch's tracks are a count or their names", () => {
  const statement = everyBlock();
  statement.course.steps[2].stations[0].branches.pop();
  statement.course.parallel[0].tracks = ["only"];
  assert.deepEqual(problemsOf(minimalModel({ overview: statement })), [
    ["model_list_invalid", "/overview/course/steps/2/stations/0/branches"],
    ["model_overview_invalid", "/overview/course/parallel/0/tracks"],
  ]);
});

test("a step or a station is named by a label or by the part it is, and ids are not repeated", () => {
  const statement = everyBlock();
  delete statement.course.steps[0].label;
  // The stretch on tracks starts at the station renamed here; it is not what this test is about.
  delete statement.course.parallel;
  statement.course.steps[1].stations[0].id = "ask";
  assert.deepEqual(problemsOf(minimalModel({ overview: statement })), [
    ["model_overview_invalid", "/overview/course/steps/0"],
    ["model_id_duplicate", "/overview/course/steps/1/stations/0/id"],
  ]);
});

test("a line goes between points of a course: a station, a branch or a step without stations", () => {
  const statement = everyBlock();
  // A step that holds stations is a run of them, not a point a line can start or end at.
  statement.course.lines[0].from = "work";
  statement.course.lines[0].to = ["log", "keep"];
  assert.deepEqual(problemsOf(minimalModel({ overview: statement })), [
    ["model_overview_invalid", "/overview/course/lines/0/from"],
    ["model_overview_invalid", "/overview/course/lines/0/to/1"],
  ]);
});

test("a stretch on parallel tracks runs forward between stations of the course, holds no fork and overlaps none", () => {
  const backward = everyBlock();
  backward.course.parallel = [{ from: "answer", to: "check", tracks: 2 }];
  const fork = everyBlock();
  fork.course.parallel = [{ from: "answer", to: "done", tracks: 2 }];
  const overlap = everyBlock();
  overlap.course.parallel = [
    { from: "check", to: "call", tracks: 2 },
    { from: "call", to: "answer", tracks: 3 },
  ];
  const run = everyBlock();
  run.course.parallel = [{ from: "work", to: "nowhere", tracks: 2 }];
  assert.deepEqual(
    [backward, fork, overlap, run].map((statement) =>
      problemsOf(minimalModel({ overview: statement })),
    ),
    [
      [["model_overview_invalid", "/overview/course/parallel/0/to"]],
      [["model_overview_invalid", "/overview/course/parallel/0"]],
      [["model_overview_invalid", "/overview/course/parallel/1"]],
      [
        ["model_overview_invalid", "/overview/course/parallel/0/from"],
        ["model_reference_unknown", "/overview/course/parallel/0/to"],
      ],
    ],
  );
});

test("a spur leaves a point of the course, and a line may start or end at it", () => {
  const atRun = everyBlock();
  atRun.course.spurs[0].at = "work";
  const atBranch = everyBlock();
  atBranch.course.spurs[0].at = "log";
  const nowhere = everyBlock();
  nowhere.course.spurs[0].at = "nowhere";
  const named = everyBlock();
  named.course.lines.push({
    from: "import",
    to: ["check"],
    label: "an imported request is checked",
  });
  assert.deepEqual(
    [atRun, atBranch, nowhere, named].map((statement) =>
      problemsOf(minimalModel({ overview: statement })),
    ),
    [
      [["model_overview_invalid", "/overview/course/spurs/0/at"]],
      [["model_overview_invalid", "/overview/course/spurs/0/at"]],
      [["model_reference_unknown", "/overview/course/spurs/0/at"]],
      [],
    ],
  );
});

test("a label on the course stands after a station or a step without stations, and before another point", () => {
  const cases = [
    ["done", "model_overview_invalid"],
    ["log", "model_overview_invalid"],
    ["nowhere", "model_reference_unknown"],
  ];
  assert.deepEqual(
    cases.map(([after]) => {
      const statement = everyBlock();
      statement.course.passes[0].after = after;
      return problemsOf(minimalModel({ overview: statement }));
    }),
    cases.map(([, code]) => [[code, "/overview/course/passes/0/after"]]),
  );
});
