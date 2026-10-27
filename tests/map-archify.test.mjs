import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  MAP_WIDTH,
  deliverMap,
  mapDocument,
  textUnits,
} from "../packages/publisher/src/map/archify.mjs";
import { loadModel, validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import {
  AIGW_MODEL,
  BIG_BANK_MODEL,
  graphModel,
  minimalModel,
  temporaryDirectory,
} from "./fixtures/models.mjs";

const fits = async () => ({ fits: true, width: 1800, height: 1000 });
const none = { state: "none", records: [] };

async function documentOf(file, binding = none) {
  const { model } = await loadModel(file);
  const views = await planViews(model, fits);
  return { model, document: mapDocument(model, views, binding) };
}

test("text units count full-width characters twice", () => {
  assert.equal(textUnits("abc"), 3);
  assert.equal(textUnits("网关"), 4);
  assert.equal(textUnits("ＡＢ"), 4);
});

test("the AIGW map is one architecture document with grid positions and native routing", async () => {
  const { model, document } = await documentOf(AIGW_MODEL);
  assert.equal(document.diagram_type, "architecture");
  assert.equal(document.meta.quality_profile, "showcase");
  const [width, height] = document.meta.viewBox;
  assert.equal(width, MAP_WIDTH);
  assert.ok(width / height < 1.55, "the reader would narrow a wider canvas");
  assert.equal(document.components.length, model.components.length);
  assert.equal(new Set(document.components.map(({ id }) => id)).size, model.components.length);
  const sizes = new Set(document.components.map(({ size }) => size.join("x")));
  assert.equal(sizes.size, 1);
  for (const connection of document.connections) {
    assert.ok(["top", "bottom", "left", "right"].includes(connection.fromSide));
    assert.equal(connection.route, undefined);
    assert.equal(connection.via, undefined);
  }
  assert.ok(document.meta.views.length <= 5);
  assert.deepEqual(
    document.cards.map(({ title }) => title),
    ["Question", "Scope, limits and attribution", "Components", "Relations"],
  );
  assert.equal(document.meta.repository, undefined);
});

test("inside components share one region unless their labels need the full card width", async () => {
  const model = validateModel(
    minimalModel({
      kinds: { user: { label: "user", category: "person" }, service: { label: "service" } },
      components: [
        { id: "user", label: "User", kind: "user" },
        { id: "api", label: "API", kind: "service" },
        { id: "db", label: "Store", kind: "service" },
      ],
      relations: [
        { id: "r1", from: "user", to: "api", label: "calls", status: "planned" },
        { id: "r2", from: "api", to: "db", label: "writes" },
      ],
    }),
  );
  const document = mapDocument(model, [], none);
  const [region] = document.boundaries;
  assert.equal(region.kind, "region");
  assert.deepEqual(region.wraps, ["api", "db"]);
  assert.equal(document.connections[0].variant, "dashed");
  assert.equal(document.connections[1].variant, undefined);
  // Big Bank's long external labels need full-width cards, so its map omits the region.
  const { document: bank } = await documentOf(BIG_BANK_MODEL);
  assert.equal(bank.boundaries, undefined);
  assert.equal(bank.components.find(({ id }) => id === "mainframe").type, "external");
});

test("map rows hold at most five, group rows wrap, and an unkept boundary is omitted", () => {
  const fan = (extra = {}) =>
    mapDocument(
      validateModel(
        graphModel(
          7,
          [2, 3, 4, 5, 6, 7].map((to) => [1, to, "notifies"]),
          extra,
        ),
      ),
      [],
      none,
    );
  const rowSizes = (document) =>
    [...Map.groupBy(document.components, ({ pos }) => pos[1]).values()].map((row) => row.length);
  assert.deepEqual(rowSizes(fan()), [2, 5]);
  const groups = [
    { id: "hub", label: "Hub", members: ["c1"] },
    { id: "leaves", label: "Leaves", members: ["c2", "c3", "c4", "c5", "c6", "c7"] },
  ];
  assert.deepEqual(rowSizes(fan({ groups })), [1, 3, 3]);
  const ids = (count) => Array.from({ length: count }, (_, index) => `c${index + 1}`);
  const outside = (extra = {}) =>
    validateModel(
      graphModel(
        8,
        [
          [1, 5],
          [2, 6],
          [3, 7],
          [4, 8],
        ],
        {
          kinds: { person: { label: "person", category: "person" }, service: { label: "service" } },
          components: ids(8).map((id, index) => ({
            id,
            label: `Component ${index + 1}`,
            kind: index < 3 ? "person" : "service",
          })),
          ...extra,
        },
      ),
    );
  // Derived rows keep a column clear beside the boundary for the three people.
  assert.deepEqual(mapDocument(outside(), [], none).boundaries?.[0].wraps, ids(8).slice(3));
  // Groups that put three people beside one service leave no such column, so the map omits it.
  const grouped = mapDocument(
    outside({
      groups: [
        { id: "top", label: "Top", members: ids(4) },
        { id: "bottom", label: "Bottom", members: ids(8).slice(4) },
      ],
    }),
    [],
    none,
  );
  assert.equal(grouped.boundaries, undefined);
  assert.equal(grouped.components.filter(({ type }) => type === "external").length, 3);
});

test("ids become valid and unique, relation labels are shared and sublabels are shortened", () => {
  const model = validateModel(
    minimalModel({
      components: [
        {
          id: "1st",
          label: "First",
          details: { purpose: "a long explanation of what this component does for everyone" },
        },
        { id: "a.b", label: "Dotted" },
        { id: "a_b", label: "Underscored" },
      ],
      relations: [
        { id: "1", from: "1st", to: "a.b", label: "feeds" },
        { id: "2", from: "1st", to: "a_b", label: "feeds" },
      ],
    }),
  );
  const document = mapDocument(model, [], none);
  assert.deepEqual(
    document.components.map(({ id }) => id),
    ["n-1st", "a_b", "a_b-2"],
  );
  assert.match(document.components[0].sublabel, / …$/u);
  assert.deepEqual(
    document.connections.map(({ id, label }) => [id, label ?? null]),
    [
      ["n-1", "feeds"],
      ["n-2", null],
    ],
  );
});

test("verified sources with a matching origin add native repository links", async () => {
  const model = validateModel(
    minimalModel({
      repository: {
        name: "fixture",
        revision: "a".repeat(40),
        url: "https://example.invalid/r.git",
      },
      sources: { main: { path: "src/main.mjs" }, readme: { path: "README.md" } },
      components: [
        { id: "a", label: "Alpha", sources: ["main", "readme"] },
        { id: "b", label: "Beta" },
      ],
    }),
  );
  const binding = {
    state: "verified",
    origin: true,
    records: [
      {
        id: "main",
        path: "src/main.mjs",
        declaredSha256: null,
        sha256: "b".repeat(64),
        state: "verified",
      },
      {
        id: "readme",
        path: "README.md",
        declaredSha256: null,
        sha256: "c".repeat(64),
        state: "verified",
      },
    ],
  };
  const document = mapDocument(model, [], binding);
  assert.equal(document.meta.repository.link_mode, "local-only");
  assert.deepEqual(document.components[0].sources, [
    { path: "src/main.mjs" },
    { path: "README.md" },
  ]);
  assert.equal(document.cards.at(-1).title, "Sources");
  assert.match(document.cards.at(-1).items[0], /sha256 b{64} \(verified\)/u);
});

test("labels too long for any map card are refused", () => {
  const model = validateModel(
    graphModel(6, [[1, 2]], {
      components: Array.from({ length: 6 }, (_, index) => ({
        id: `c${index + 1}`,
        label: `${"Extraordinarily ".repeat(3)}Long Component ${index + 1}`,
      })),
      views: [{ id: "row", members: ["c1", "c2", "c3", "c4", "c5", "c6"] }],
    }),
  );
  assert.throws(
    () => mapDocument(model, [], none),
    (error) => error.code === "map_label_too_long" && error.problems.length === 6,
  );
});

test("a model whose relations the map cannot wire is refused as the map's layout", () => {
  const edges = [1, 2, 3].flatMap((from) => [4, 5, 6].map((to) => [from, to, `asks ${from}${to}`]));
  const model = validateModel(graphModel(6, edges));
  assert.throws(
    () => mapDocument(model, [], none),
    (error) =>
      error.code === "map_layout_refused" &&
      error.problems.length === 9 &&
      error.problems.every(({ code }) => code === "layout_channel_unroutable"),
  );
});

test("a relation within a row too narrow for its label runs below the row, as the grid draws it", async (t) => {
  const model = validateModel(
    graphModel(
      7,
      [
        [1, 2],
        [1, 3],
        [1, 4],
        [1, 5],
        [1, 6],
        [5, 6, "resolves the element index"],
        [6, 7],
      ],
      {
        groups: [["c1"], ["c2", "c3", "c4", "c5", "c6"], ["c7"]].map((members, index) => ({
          id: `g${index}`,
          label: `G${index}`,
          members,
        })),
      },
    ),
  );
  const document = mapDocument(model, [], none);
  const sides = Object.fromEntries(
    document.connections.map(({ id, fromSide, toSide }) => [id, [fromSide, toSide]]),
  );
  assert.deepEqual(sides.r6, ["bottom", "bottom"]);
  const directory = await temporaryDirectory("archpub-map-");
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const { receipt } = await deliverMap(document, directory);
  assert.ok(receipt.checks > 0);
});

test("native Archify delivers the map deterministically and removes its working files", async (t) => {
  const { document } = await documentOf(BIG_BANK_MODEL);
  const outputs = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const directory = await temporaryDirectory("archpub-map-");
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    const delivered = await deliverMap(document, directory);
    assert.equal(delivered.output, path.join(directory, "index.html"));
    assert.match(delivered.supplySha256, /^[0-9a-f]{64}$/u);
    assert.ok(delivered.receipt.checks > 0);
    assert.deepEqual(await fs.readdir(directory), ["index.html"]);
    outputs.push(await fs.readFile(delivered.output));
  }
  assert.ok(outputs[0].equals(outputs[1]));
});

test("a relation that skips rows leaves its sides to Archify, which routes around the cards between", async (t) => {
  // Groups fix the rows, so the audit cannot move beside the chain.
  const model = validateModel(
    graphModel(
      4,
      [
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 4, "audits"],
      ],
      {
        groups: ["c1", "c2", "c3", "c4"].map((id) => ({ id: `g-${id}`, label: id, members: [id] })),
      },
    ),
  );
  const document = mapDocument(model, [], none);
  assert.deepEqual(
    document.connections.map(({ id, fromSide, toSide }) => [id, fromSide ?? null, toSide ?? null]),
    [
      ["r1", "bottom", "top"],
      ["r2", "bottom", "top"],
      ["r3", "bottom", "top"],
      ["r4", null, null],
    ],
  );
  const directory = await temporaryDirectory("archpub-map-");
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const { receipt } = await deliverMap(document, directory);
  assert.deepEqual([receipt.profile, receipt.crossings, receipt.corridors], ["showcase", 0, 0]);
});

test("a dense many-to-many map is delivered at standard quality with its route findings", async (t) => {
  // Three callers that each use the same three services: Archify merges some routes into corridors.
  const model = validateModel(
    graphModel(
      6,
      [1, 2, 3].flatMap((from) => [4, 5, 6].map((to) => [from, to])),
    ),
  );
  const directory = await temporaryDirectory("archpub-map-");
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const { receipt } = await deliverMap(mapDocument(model, [], none), directory);
  assert.equal(receipt.profile, "standard");
  assert.ok(receipt.corridors > 0);
  assert.deepEqual(await fs.readdir(directory), ["index.html"]);
});

test("documents Archify rejects are refused with its diagnostics", async (t) => {
  const { document } = await documentOf(BIG_BANK_MODEL);
  const directory = await temporaryDirectory("archpub-map-");
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const broken = { ...document, connections: [{ ...document.connections[0], to: "missing" }] };
  await assert.rejects(deliverMap(broken, directory), { code: "map_refused" });
});
