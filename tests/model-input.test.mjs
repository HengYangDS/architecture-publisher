import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  CATEGORIES,
  MAXIMUM_VIEWS,
  loadModel,
  validateModel,
} from "../packages/publisher/src/model/load.mjs";
import { AIGW_MODEL, minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";

/** The refusal's problems as `code path` lines. */
function problemsOf(model, options) {
  try {
    validateModel(model, options);
  } catch (error) {
    assert.equal(error.code, "model_invalid");
    return error.problems.map(({ code, path: where }) => `${code} ${where}`);
  }
  assert.fail("the model was accepted");
}

test("a minimal model normalizes with defaults", () => {
  const model = validateModel(minimalModel());
  assert.equal(model.summary, null);
  assert.deepEqual(model.limits, []);
  assert.equal(model.repository, null);
  assert.deepEqual(model.kinds, []);
  assert.deepEqual(model.components[0], {
    id: "a",
    label: "Alpha",
    details: [],
    status: null,
    sources: [],
    kind: null,
  });
  assert.equal(model.views, null);
  assert.ok(Object.isFrozen(model.components[0]));
});

test("kinds keep declared order, then first appearance, with default categories", () => {
  const model = validateModel(
    minimalModel({
      kinds: {
        store: { label: "Store", category: "database", icon: "database" },
        unused: { label: "Unused" },
      },
      components: [
        { id: "a", label: "Alpha", kind: "service" },
        { id: "b", label: "Beta", kind: "store", details: { owns: ["x", "y"], role: "z" } },
      ],
    }),
  );
  assert.deepEqual(model.kinds, [
    { id: "store", label: "Store", category: "database", icon: "database" },
    { id: "service", label: "service", category: "backend", icon: null },
  ]);
  assert.deepEqual(model.components[1].details, [
    ["owns", ["x", "y"]],
    ["role", ["z"]],
  ]);
  assert.equal(CATEGORIES.length, 8);
});

test("every problem is reported with its path in one refusal", () => {
  const problems = problemsOf(
    minimalModel({
      extra: true,
      components: [
        { id: "a", label: "Alpha" },
        { id: "a", label: " " },
      ],
      relations: [
        { id: "r", from: "a", to: "missing", label: "calls" },
        { id: "s", from: "a", to: "a", label: "loops" },
      ],
    }),
  );
  assert.deepEqual(problems, [
    "model_field_unknown /extra",
    "model_text_invalid /components/1/label",
    "model_id_duplicate /components/1/id",
    "model_endpoint_unknown /relations/0/to",
    "model_relation_self /relations/1",
  ]);
});

test("top-level fields, repository and limits are validated", () => {
  const problems = problemsOf({
    ...minimalModel(),
    format: "other",
    version: 2,
    id: "Bad Id",
    limits: "none",
    repository: { name: "x", revision: "abc", extra: 1 },
  });
  assert.deepEqual(problems, [
    "model_format_unsupported /format",
    "model_version_unsupported /version",
    "model_id_invalid /id",
    "model_limits_invalid /limits",
    "model_field_unknown /repository/extra",
    "model_revision_invalid /repository/revision",
  ]);
  assert.deepEqual(problemsOf([]), ["model_object_required "]);
  assert.deepEqual(problemsOf(minimalModel({ limits: ["ok", ""] })), [
    "model_text_invalid /limits/1",
  ]);
});

test("kinds, sources, details, statuses and references are validated", () => {
  const problems = problemsOf(
    minimalModel({
      kinds: { k: { category: "planet", icon: "no-such-icon", size: 1 }, "Bad Kind": {} },
      sources: { s: { path: "../outside", sha256: "XYZ", note: "" }, t: "text" },
      components: [
        {
          id: "a",
          label: "Alpha",
          kind: "k",
          details: { 12: "x", ok: [] },
          status: "gone",
          sources: ["s", "s", "nope"],
        },
        { id: "b", label: "Beta", details: "flat" },
      ],
      relations: { not: "a list" },
    }),
    { icon: (name) => name === "database" },
  );
  assert.deepEqual(problems, [
    "model_field_unknown /kinds/k/size",
    "model_category_invalid /kinds/k/category",
    "model_icon_unknown /kinds/k/icon",
    "model_id_invalid /kinds/Bad Kind",
    "model_source_path_invalid /sources/s/path",
    "model_digest_invalid /sources/s/sha256",
    "model_text_invalid /sources/s/note",
    "model_object_required /sources/t",
    "model_detail_name_invalid /components/0/details/12",
    "model_detail_invalid /components/0/details/ok",
    "model_status_invalid /components/0/status",
    "model_reference_duplicate /components/0/sources/1",
    "model_reference_unknown /components/0/sources/2",
    "model_details_invalid /components/1/details",
    "model_list_invalid /relations",
  ]);
  assert.deepEqual(problemsOf(minimalModel({ kinds: [] })), ["model_object_required /kinds"]);
  assert.deepEqual(problemsOf(minimalModel({ components: [], relations: [] })), [
    "model_list_invalid /components",
  ]);
});

test("groups may not overlap or reuse component ids", () => {
  const problems = problemsOf(
    minimalModel({
      groups: [
        { id: "g", label: "G", members: ["a"] },
        { id: "a", label: "H", members: ["a", "missing"] },
        { id: "e", label: "E", members: [] },
        "bad",
      ],
    }),
  );
  assert.deepEqual(problems, [
    "model_group_id_conflict /groups/1/id",
    "model_reference_unknown /groups/1/members/1",
    "model_group_overlap /groups/1/members/0",
    "model_references_invalid /groups/2/members",
    "model_object_required /groups/3",
  ]);
});

test("views declare tiers or members, at most four", () => {
  const plain = (count) =>
    minimalModel({
      views: Array.from({ length: count }, (_, index) => ({ id: `v${index}`, members: ["a"] })),
    });
  assert.equal(validateModel(plain(4)).views.length, 4);
  assert.deepEqual(problemsOf(plain(5)), ["model_views_exceeded /views"]);
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
    "model_views_exceeded /views",
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
    await fs.readFile(
      new URL("../packages/publisher/src/model/schema.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(schema.properties.views.maxItems, MAXIMUM_VIEWS);
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

test("model files are read, bounded and digested", async (t) => {
  const loaded = await loadModel(AIGW_MODEL);
  assert.equal(loaded.model.id, "aigw-client-projection");
  assert.match(loaded.sha256, /^[0-9a-f]{64}$/u);
  assert.equal(loaded.bytes, (await fs.stat(AIGW_MODEL)).size);
  await assert.rejects(loadModel(path.join(await temporaryDirectory(t), "absent.json")), {
    code: "model_unreadable",
  });
  await assert.rejects(loadModel(await writeModel(t, "{ not json")), {
    code: "model_json_invalid",
  });
  await assert.rejects(loadModel(await writeModel(t, " ".repeat(4 * 1024 * 1024 + 1))), {
    code: "model_too_large",
  });
});
