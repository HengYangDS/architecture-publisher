import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { BAD_MODELS } from "./fixtures/bad-models.mjs";
import EXPECTED from "./fixtures/model-problems.json" with { type: "json" };

// The model's problems are a contract an author and an agent act on: each bad model is refused with the codes,
// paths, messages and order it had before the loader read its vocabulary from the schema (the queue item
// `derived-references`). A change to a problem shows here, model by model.

/** The refusal of one model, as the record holds it. */
function refusalOf(model) {
  try {
    validateModel(structuredClone(model));
    return { code: null, problems: [] };
  } catch (error) {
    return {
      code: error.code,
      problems: (error.problems ?? []).map(({ code, path, message }) => ({ code, path, message })),
    };
  }
}

test("every bad model is refused as it was, problem for problem", () => {
  assert.deepEqual(Object.keys(BAD_MODELS), Object.keys(EXPECTED));
  for (const [name, model] of Object.entries(BAD_MODELS))
    assert.deepEqual(refusalOf(model), EXPECTED[name], name);
});
