import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { CATEGORIES, loadModel, validateModel } from "../src/model/load.mjs";
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
    files: [],
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
    version: 3,
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
  // A model's id names its directory when it is published, on any file system.
  for (const id of ["con", "nul.json", "lpt1", "shop."])
    assert.deepEqual(problemsOf(minimalModel({ id })), ["model_id_unportable /id"], id);
  for (const id of ["console", "auxiliary", "com", "shop.v2"])
    assert.equal(validateModel(minimalModel({ id })).id, id);
});

test("kinds, details, statuses and references are validated", () => {
  const problems = problemsOf(
    minimalModel({
      kinds: { k: { category: "planet", icon: "no-such-icon", size: 1 }, "Bad Kind": {} },
      components: [
        {
          id: "a",
          label: "Alpha",
          kind: "k",
          details: { 12: "x", ok: [] },
          status: "gone",
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
    "model_detail_name_invalid /components/0/details/12",
    "model_detail_invalid /components/0/details/ok",
    "model_status_invalid /components/0/status",
    "model_details_invalid /components/1/details",
    "model_list_invalid /relations",
  ]);
  assert.deepEqual(problemsOf(minimalModel({ kinds: [] })), ["model_object_required /kinds"]);
  assert.deepEqual(problemsOf(minimalModel({ components: [], relations: [] })), [
    "model_list_invalid /components",
  ]);
});

test("components claim files by path and relations cite files", () => {
  const model = validateModel(
    minimalModel({
      components: [
        { id: "a", label: "Alpha", files: ["src/model/", "README.md"] },
        { id: "b", label: "Beta" },
      ],
      relations: [{ id: "a-b", from: "a", to: "b", label: "calls", files: ["src/model/load.mjs"] }],
    }),
  );
  assert.deepEqual(model.components[0].files, ["src/model/", "README.md"]);
  assert.deepEqual(model.components[1].files, []);
  assert.deepEqual(model.relations[0].files, ["src/model/load.mjs"]);
  assert.equal("sources" in model, false);
  assert.deepEqual(
    problemsOf(
      minimalModel({
        components: [
          {
            id: "a",
            label: "Alpha",
            files: ["src/model/", "src/*.mjs", "../up", "src/model/", "a//b"],
          },
          { id: "b", label: "Beta", files: ["src/model/", 3] },
        ],
        relations: [
          {
            id: "a-b",
            from: "a",
            to: "b",
            label: "calls",
            files: ["src/model/", "x.mjs", "x.mjs", "src/[ab].mjs"],
          },
        ],
      }),
    ),
    [
      "model_file_glob /components/0/files/1",
      "model_file_path_invalid /components/0/files/2",
      "model_file_duplicate /components/0/files/3",
      "model_file_path_invalid /components/0/files/4",
      "model_file_claimed_twice /components/1/files/0",
      "model_file_path_invalid /components/1/files/1",
      "model_relation_file_directory /relations/0/files/0",
      "model_file_duplicate /relations/0/files/2",
      "model_file_glob /relations/0/files/3",
    ],
  );
  assert.deepEqual(
    problemsOf(
      minimalModel({
        components: [
          { id: "a", label: "Alpha", files: "src/" },
          { id: "b", label: "Beta", sources: ["s"] },
        ],
      }),
    ),
    ["model_files_invalid /components/0/files", "model_field_unknown /components/1/sources"],
  );
});

test("a version 1 model is refused with the command that converts it", () => {
  for (const model of [minimalModel({ version: 1 }), minimalModel({ version: 1, sources: {} })]) {
    assert.throws(
      () => validateModel(model),
      (error) =>
        error.code === "model_invalid" &&
        error.problems.length === 1 &&
        error.problems[0].code === "model_version_unsupported" &&
        error.problems[0].path === "/version" &&
        error.problems[0].message.includes("archpub migrate"),
    );
  }
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
  assert.deepEqual(schema.properties.version, { const: 2 });
  assert.equal(schema.properties.sources, undefined);
  for (const element of ["components", "relations"]) {
    const { properties } = schema.properties[element].items;
    assert.equal(properties.sources, undefined, element);
    assert.ok(properties.files, element);
  }
});

test("a coverage scope declares included paths and excluded paths with reasons", () => {
  const coverage = {
    include: ["src/", "README.md"],
    exclude: [{ path: "src/vendor/", reason: "Vendored code." }],
  };
  assert.deepEqual(validateModel(minimalModel({ coverage })).coverage, coverage);
  assert.equal(validateModel(minimalModel()).coverage, null);
  assert.deepEqual(validateModel(minimalModel({ coverage: {} })).coverage, {
    include: null,
    exclude: [],
  });
  assert.deepEqual(
    problemsOf(
      minimalModel({
        coverage: {
          include: ["src/", "/etc/", "src/", "a//b/"],
          exclude: [{ path: "src/vendor/" }, { path: "../up/", reason: "Up." }, "src/"],
          scope: "all",
        },
      }),
    ),
    [
      "model_field_unknown /coverage/scope",
      "model_coverage_path_invalid /coverage/include/1",
      "model_coverage_path_duplicate /coverage/include/2",
      "model_coverage_path_invalid /coverage/include/3",
      "model_field_required /coverage/exclude/0/reason",
      "model_coverage_path_invalid /coverage/exclude/1/path",
      "model_object_required /coverage/exclude/2",
    ],
  );
  assert.deepEqual(problemsOf(minimalModel({ coverage: { include: [] } })), [
    "model_coverage_invalid /coverage/include",
  ]);
});

test("a coverage path may be a glob within the repository", () => {
  const coverage = {
    include: ["internal/", "cmd/**/*.go"],
    exclude: [
      { path: "**/*_test.go", reason: "Tests beside the code." },
      { path: "src/gen-?/[ab]*", reason: "Generated output." },
    ],
  };
  assert.deepEqual(validateModel(minimalModel({ coverage })).coverage, coverage);
  assert.deepEqual(
    problemsOf(
      minimalModel({ coverage: { include: ["/**/*.go", "../*.go", "a/**/../b/*", "**//*.go"] } }),
    ),
    [
      "model_coverage_path_invalid /coverage/include/0",
      "model_coverage_path_invalid /coverage/include/1",
      "model_coverage_path_invalid /coverage/include/2",
      "model_coverage_path_invalid /coverage/include/3",
    ],
  );
});

test("an overview names a Typst composition within the model's directory", async () => {
  assert.equal(validateModel(minimalModel({ overview: "overview.typ" })).overview, "overview.typ");
  assert.equal(validateModel(minimalModel({ overview: "pages/a.typ" })).overview, "pages/a.typ");
  assert.equal(validateModel(minimalModel()).overview, null);
  for (const overview of ["/overview.typ", "../overview.typ", "a/../b.typ", "overview.svg", "", 3])
    assert.deepEqual(problemsOf(minimalModel({ overview })), ["model_overview_invalid /overview"]);
  const schema = JSON.parse(
    await fs.readFile(new URL("../src/model/schema.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(schema.properties.overview.allOf, [
    { $ref: "#/$defs/path" },
    { pattern: "\\.typ$" },
  ]);
});

test("a guide names an Archify explainer draft within the model's directory", async () => {
  const guide = "guide/guide.archify.md";
  assert.equal(validateModel(minimalModel({ guide })).guide, guide);
  assert.equal(validateModel(minimalModel({ guide: "a.archify.md" })).guide, "a.archify.md");
  assert.equal(validateModel(minimalModel()).guide, null);
  for (const value of [
    "/a.archify.md",
    "../a.archify.md",
    "a/../b.archify.md",
    "guide.md",
    ".archify.md",
    "",
    3,
  ])
    assert.deepEqual(problemsOf(minimalModel({ guide: value })), ["model_guide_invalid /guide"]);
  const schema = JSON.parse(
    await fs.readFile(new URL("../src/model/schema.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(schema.properties.guide.allOf, [
    { $ref: "#/$defs/path" },
    { pattern: "[^/]\\.archify\\.md$" },
  ]);
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
