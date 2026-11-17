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
  statement.courses[0].pass.after = "elsewhere";
  statement.courses[0].aside.from = "elsewhere";
  assert.deepEqual(problemsOf(minimalModel({ overview: statement })), [
    ["model_reference_unknown", "/overview/course/steps/1/stations/1/part"],
    ["model_reference_unknown", "/overview/course/lines/0/to/0"],
    ["model_reference_unknown", "/overview/courses/0/pass/after"],
    ["model_reference_unknown", "/overview/courses/0/aside/from"],
  ]);
});

test("an overview states no position, size or type, and a step runs on two to four tracks", () => {
  const statement = everyBlock();
  Object.assign(statement.course.steps[0], { x: 48 });
  Object.assign(statement.facts[0], { width: 400 });
  statement.course.steps[1].tracks = 6;
  assert.deepEqual(problemsOf(minimalModel({ overview: statement })), [
    ["model_field_unknown", "/overview/course/steps/0/x"],
    ["model_overview_invalid", "/overview/course/steps/1/tracks"],
    ["model_field_unknown", "/overview/facts/0/width"],
  ]);
});

test("a step or a station is named by a label or by the part it is, and ids are not repeated", () => {
  const statement = everyBlock();
  delete statement.course.steps[0].label;
  statement.course.steps[1].stations[0].id = "ask";
  assert.deepEqual(problemsOf(minimalModel({ overview: statement })), [
    ["model_overview_invalid", "/overview/course/steps/0"],
    ["model_id_duplicate", "/overview/course/steps/1/stations/0/id"],
  ]);
});
