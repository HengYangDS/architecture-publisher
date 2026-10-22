import assert from "node:assert/strict";
import test from "node:test";
import { fromSources } from "@likec4/language-services/node";
import { importLikeC4NativeWithParser } from "../packages/publisher/src/semantics/native-likec4.mjs";
import { sha, selection, parserWith } from "./fixtures/native-import.mjs";

test("native import rejects malformed selected sources before parser execution", async () => {
  const invalidSelections = [
    [null, "native_likec4_selection_invalid"],
    [{ ...selection(), lock: { schema: "other", sources: [] } }, "native_likec4_selection_invalid"],
    [
      { ...selection(), lock: { schema: "architecture.materialized-input-lock/v1", sources: [] } },
      "native_likec4_sources_missing",
    ],
  ];
  for (const [selected, code] of invalidSelections)
    await assert.rejects(importLikeC4NativeWithParser(selected, fromSources), { code });

  const wrongVersion = selection();
  wrongVersion.lock.sources[0].format.version = "1";
  await assert.rejects(importLikeC4NativeWithParser(wrongVersion, fromSources), {
    code: "native_likec4_selection_invalid",
  });
  const wrongNamespace = selection();
  wrongNamespace.lock.sources[0].namespace = "";
  await assert.rejects(importLikeC4NativeWithParser(wrongNamespace, fromSources), {
    code: "native_likec4_selection_invalid",
  });
  const wrongDigest = selection();
  wrongDigest.lock.sources[0].sha256 = "invalid";
  await assert.rejects(importLikeC4NativeWithParser(wrongDigest, fromSources), {
    code: "native_likec4_selection_invalid",
  });
  const wrongBytes = selection();
  wrongBytes.readSource = () => "not bytes";
  await assert.rejects(importLikeC4NativeWithParser(wrongBytes, fromSources), {
    code: "native_likec4_digest_mismatch",
  });
  const invalidUtf8 = selection(new Map([["example/model", Buffer.from([0xff])]]));
  await assert.rejects(importLikeC4NativeWithParser(invalidUtf8, fromSources), {
    code: "native_likec4_utf8_invalid",
  });
  await assert.rejects(importLikeC4NativeWithParser(selection(), null), {
    code: "native_likec4_parser_required",
  });
  await assert.rejects(
    importLikeC4NativeWithParser(selection(), async () => {
      throw Error("upstream failure");
    }),
    { code: "native_likec4_parse_invalid" },
  );
});

test("native import rejects malformed upstream source locations", async () => {
  const invalidLocations = [
    [(location) => ({ ...location, uri: "%not-a-url" }), "native_likec4_source_reference_invalid"],
    [
      (location) => ({ ...location, uri: location.uri.replace("virtual:", "file:") }),
      "native_likec4_source_reference_invalid",
    ],
    [
      (location) => ({ ...location, uri: "virtual:/workspace/%XX.c4" }),
      "native_likec4_source_reference_invalid",
    ],
    [
      (location) => ({ ...location, uri: "virtual:/workspace/missing.c4" }),
      "native_likec4_source_reference_unselected",
    ],
    [
      (location) => ({ ...location, uri: "virtual:/external/model.c4" }),
      "native_likec4_source_reference_unselected",
    ],
    [(location) => ({ ...location, range: null }), "native_likec4_source_reference_invalid"],
    [
      (location) => ({
        ...location,
        range: { start: { line: 0, character: 2 }, end: { line: 0, character: 1 } },
      }),
      "native_likec4_source_reference_invalid",
    ],
    [
      (location) => ({
        ...location,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1000 } },
      }),
      "native_likec4_source_reference_invalid",
    ],
  ];
  for (const [rewrite, code] of invalidLocations)
    await assert.rejects(
      importLikeC4NativeWithParser(selection(), parserWith({ locate: rewrite })),
      {
        code,
      },
    );
});

test("native import refuses upstream model and view inconsistencies", async () => {
  const selectedView = (edit) => (items) =>
    items.map((view) => (view.id === "overview" ? edit(view) : view));
  const viewWith = (
    view,
    definition,
    members = () => view.nodes(),
    edges = () => view.edges(),
  ) => ({
    id: view.id,
    $view: { ...view.$view, ...definition },
    nodes: members,
    edges,
  });
  const invalidModels = [
    [
      {
        elements: (items) =>
          items.map((item, index) => (index ? item : { ...item, metadata: null })),
      },
      "native_likec4_metadata_invalid",
    ],
    [
      {
        elements: (items) =>
          items.map((item, index) =>
            index ? item : { ...item, metadata: { invalid: undefined } },
          ),
      },
      "native_likec4_metadata_invalid",
    ],
    [
      { locate: (location, query) => (query.element === "left" ? null : location) },
      "native_likec4_source_reference_missing",
    ],
    [
      { relations: (items) => items.map((item) => ({ ...item, source: { id: "ghost" } })) },
      "native_likec4_source_reference_missing",
    ],
    [
      { views: selectedView((view) => viewWith(view, { _type: "" })) },
      "native_likec4_view_type_invalid",
    ],
    [
      {
        locate: (location, query) =>
          query.view === "index"
            ? {
                uri: `virtual:/workspace/${sha("example/views")}.c4`,
                range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
              }
            : location,
      },
      "native_likec4_source_reference_invalid",
    ],
    [
      { views: selectedView((view) => viewWith(view, { sourcePath: 0 })) },
      "native_likec4_source_reference_invalid",
    ],
    [
      {
        views: selectedView((view) => viewWith(view, { sourcePath: `${sha("example/model")}.c4` })),
      },
      "native_likec4_source_reference_invalid",
    ],
    [
      {
        views: selectedView((view) =>
          viewWith(view, {}, () => [...view.nodes(), { id: "ghost", element: { id: "ghost" } }]),
        ),
      },
      "native_likec4_view_element_unselected",
    ],
    [
      {
        views: selectedView((view) =>
          viewWith(view, {}, () => [
            ...view.nodes(),
            { id: "unrepresentable", element: null, isGroup: () => false },
          ]),
        ),
      },
      "native_likec4_view_node_unrepresentable",
    ],
    [
      {
        views: selectedView((view) =>
          viewWith(
            view,
            {},
            () => view.nodes(),
            () => [{ relationships: () => [{ id: "ghost" }] }],
          ),
        ),
      },
      "native_likec4_view_relation_unselected",
    ],
  ];
  for (const [rewrite, code] of invalidModels)
    await assert.rejects(importLikeC4NativeWithParser(selection(), parserWith(rewrite)), { code });
});

test("native import bounds source bytes and refuses duplicate namespaces before parsing", async () => {
  const oversized = selection(new Map([["example/large", Buffer.alloc(32 * 1024 * 1024 + 1)]]));
  await assert.rejects(importLikeC4NativeWithParser(oversized, fromSources), {
    code: "native_likec4_size_exceeded",
  });

  const duplicate = selection();
  duplicate.lock.sources.push(structuredClone(duplicate.lock.sources[0]));
  await assert.rejects(importLikeC4NativeWithParser(duplicate, fromSources), {
    code: "native_likec4_selection_invalid",
  });
});

test("native import preserves absent display fields without inventing labels or types", async () => {
  const index = await importLikeC4NativeWithParser(
    selection(),
    parserWith({
      elements: (items) =>
        items.map((item) => ({ id: item.id, metadata: item.metadata, parent: item.parent })),
      relations: (items) =>
        items.map((item) => ({
          id: item.id,
          metadata: item.metadata,
          source: item.source,
          target: item.target,
          isBidirectional: item.isBidirectional,
        })),
    }),
  );
  assert.deepEqual(
    index.elements.map(({ kind, label }) => ({ kind, label })),
    [
      { kind: null, label: null },
      { kind: null, label: null },
    ],
  );
  assert.equal(index.relations[0].label, null);
  assert.equal(index.relations[0].kind, null);
  assert.equal(index.relations[0].direction, "forward");
  assert.equal(index.relations[0].origin.namespace, "example/model");
});
