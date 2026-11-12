import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { minimalModel, problemsOf } from "./fixtures/models.mjs";

test("views declare tiers or members, as many as the author wants", () => {
  const plain = (count) =>
    minimalModel({
      views: Array.from({ length: count }, (_, index) => ({ id: `v${index}`, members: ["a"] })),
    });
  assert.equal(validateModel(plain(4)).views.length, 4);
  assert.equal(validateModel(plain(9)).views.length, 9);
  const groups = [{ id: "g", label: "G", members: ["a", "b"] }];
  const problems = problemsOf(
    minimalModel({
      groups,
      views: [
        { id: "v1", members: ["a"], tiers: ["g"] },
        { id: "v2" },
        { id: "v3", tiers: [] },
        { id: "v4", tiers: ["g", "g", "missing", { id: "t", label: "T", members: ["zz"] }] },
        { id: "v5", members: [] },
        { id: "v6", members: ["a"], title: "" },
      ],
    }),
  );
  assert.deepEqual(problems, [
    "model_view_shape_invalid /views/0",
    "model_view_shape_invalid /views/1",
    "model_references_invalid /views/2/tiers",
    "model_id_duplicate /views/3/tiers/1",
    "model_reference_unknown /views/3/tiers/2",
    "model_reference_unknown /views/3/tiers/3/members/0",
    "model_references_invalid /views/4/members",
    "model_text_invalid /views/5/title",
  ]);
});

test("the published schema allows the views the loader admits", async () => {
  const schema = JSON.parse(
    await fs.readFile(new URL("../src/model/schema.json", import.meta.url), "utf8"),
  );
  assert.equal(schema.properties.views.maxItems, undefined);
  assert.deepEqual(Object.keys(schema.properties.coverage.properties), ["include", "exclude"]);
  assert.deepEqual(schema.properties.version, { const: 3 });
  assert.equal(schema.properties.sources, undefined);
  for (const element of ["components", "relations"]) {
    const { properties } = schema.properties[element].items;
    assert.equal(properties.sources, undefined, element);
    assert.ok(properties.files, element);
  }
});

test("a component may sit in only one tier of a view", () => {
  const problems = problemsOf(
    minimalModel({
      groups: [{ id: "g", label: "G", members: ["a"] }],
      views: [{ id: "v", tiers: ["g", { id: "t", label: "T", members: ["a", "b"] }] }],
    }),
  );
  assert.deepEqual(problems, ["model_tier_overlap /views/0/tiers/1"]);
  // A tier overlap is reported with the model's other problems, in one refusal.
  assert.deepEqual(
    problemsOf(
      minimalModel({
        extra: true,
        groups: [{ id: "g", label: "G", members: ["a"] }],
        views: [
          { id: "v", tiers: ["g", { id: "t", label: "T", members: ["a", "b"] }] },
          { id: "w", tiers: ["missing"] },
        ],
      }),
    ),
    [
      "model_field_unknown /extra",
      "model_reference_unknown /views/1/tiers/0",
      "model_tier_overlap /views/0/tiers/1",
    ],
  );
});

test("declared views resolve their tiers", () => {
  const model = validateModel(
    minimalModel({
      groups: [{ id: "g", label: "G", members: ["a"] }],
      views: [
        { id: "v", question: "Q?", tiers: ["g", { id: "t", label: "T", members: ["b"] }] },
        { id: "w", members: ["a", "b"] },
      ],
    }),
  );
  assert.deepEqual(model.views[0].tiers, [
    { id: "g", label: "G", members: ["a"] },
    { id: "t", label: "T", members: ["b"] },
  ]);
  assert.deepEqual(model.views[1], {
    id: "w",
    title: null,
    question: null,
    summary: null,
    tiers: null,
    members: ["a", "b"],
  });
});
