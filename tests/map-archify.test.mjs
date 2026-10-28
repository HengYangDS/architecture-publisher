import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  DIAGRAM_WIDTHS,
  archifyIds,
  chooseDiagram,
  diagramCandidates,
  textUnits,
} from "../packages/publisher/src/map/archify.mjs";
import {
  deliverExplainer,
  explainerDraft,
  explainerPage,
} from "../packages/publisher/src/map/explainer.mjs";
import { loadModel, validateModel } from "../packages/publisher/src/model/load.mjs";
import { planViews } from "../packages/publisher/src/plan/views.mjs";
import {
  AIGW_MODEL,
  BIG_BANK_MODEL,
  graphModel,
  minimalModel,
  temporaryDirectory,
} from "./fixtures/models.mjs";

const fits = async () => ({ fits: true, width: 2400, height: 1350 });
/** A model's views as the plan derives them, every view admitted. */
const viewsOf = (model) => planViews(model, fits);
const firstView = async (model) => (await viewsOf(model))[0];
/** Each connection's sides by relation id, null where Archify chooses. */
const sidesOf = (document) =>
  Object.fromEntries(
    document.connections.map(({ id, fromSide, toSide }) => [
      id,
      [fromSide ?? null, toSide ?? null],
    ]),
  );
/** Inline tiers, one row each, so a test fixes the rows. */
const tiers = (...rows) =>
  rows.map((members, index) => ({ id: `t${index}`, label: `T${index}`, members }));

/**
 * A model with two views over a repository, one of whose sources lies under a
 * `secrets` directory, which Archify will not cite on a page.
 */
const shopInput = () =>
  minimalModel({
    id: "shop",
    summary: "Orders flow from the web to the store.",
    scope: "Checkout only",
    limits: ["Payments are out of scope.", "不含退款"],
    attribution: "the shop team",
    repository: {
      name: "shop",
      url: "https://example.invalid/shop.git",
      revision: "a".repeat(40),
    },
    sources: {
      secret: { path: "internal/secrets/store.go" },
      main: { path: "src/main.go" },
    },
    components: [
      {
        id: "web",
        label: "Web | front *end*",
        details: { serves: "pages" },
        sources: ["secret", "main"],
      },
      { id: "store", label: "Store", sources: ["main"] },
    ],
    relations: [{ id: "r", from: "web", to: "store", label: "writes" }],
    views: [
      { id: "web", question: "What does the web do?", members: ["web", "store"] },
      { id: "store", title: "Store", question: "Where do orders go?", members: ["store", "web"] },
    ],
  });
const shop = () => validateModel(shopInput());

let shopPage = null;
/** The shop's page, chosen and validated by Archify once for the tests that deliver it. */
const shopPageOnce = () => {
  shopPage ??= (async () => {
    const model = shop();
    return { model, page: await explainerPage(model, await viewsOf(model)) };
  })();
  return shopPage;
};

test("text units count full-width characters twice", () => {
  assert.equal(textUnits("abc"), 3);
  assert.equal(textUnits("网关"), 4);
  assert.equal(textUnits("ＡＢ"), 4);
});

test("ids become valid and unique, relation labels are shared and sublabels are shortened", async () => {
  assert.deepEqual([...archifyIds(["1st", "a.b", "a_b"]).values()], ["n-1st", "a_b", "a_b-2"]);
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
  const [{ document }] = diagramCandidates(model, await firstView(model));
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

test("every AIGW view has native architecture candidates on the grid, without kind tags", async () => {
  const { model } = await loadModel(AIGW_MODEL);
  const views = await viewsOf(model);
  assert.equal(views.length, 4);
  for (const view of views) {
    const candidates = diagramCandidates(model, view);
    assert.ok(candidates.length > 0, view.id);
    assert.equal(
      new Set(candidates.map(({ document }) => JSON.stringify(document))).size,
      candidates.length,
    );
    for (const { width, rows, nodes, document } of candidates) {
      assert.ok(DIAGRAM_WIDTHS.includes(width), `${width}`);
      assert.ok(Math.max(...rows) <= 5, JSON.stringify(rows));
      assert.equal(document.diagram_type, "architecture");
      assert.equal(document.meta.quality_profile, "showcase");
      const [canvas, height] = document.meta.viewBox;
      assert.equal(canvas, width);
      assert.ok(canvas / height < 1.55, "the reader would narrow a wider canvas");
      assert.equal(document.components.length, view.components.length);
      assert.equal(nodes.size, view.components.length);
      assert.equal(new Set(document.components.map(({ size }) => size.join("x"))).size, 1);
      // A kind tag is drawn below Archify's reading floor and would make the page shrink the preview.
      for (const component of document.components) assert.equal(component.tag, undefined);
      for (const connection of document.connections) {
        assert.equal(connection.route, undefined);
        assert.equal(connection.via, undefined);
      }
    }
  }
});

test("inside components share one region and planned relations are dashed", async () => {
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
  const [{ document }] = diagramCandidates(model, await firstView(model));
  const [region] = document.boundaries;
  assert.equal(region.kind, "region");
  assert.deepEqual(region.wraps, ["api", "db"]);
  assert.equal(document.connections[0].variant, "dashed");
  assert.equal(document.connections[1].variant, undefined);
});

test("cards are as wide as the longest label needs, so a long label takes a spare column's room", async () => {
  // "Personal Banking Customer" needs 173 units at Archify's label size; a spare
  // column for routing once narrowed every card of its view to 166.
  const { model } = await loadModel(BIG_BANK_MODEL);
  for (const view of await viewsOf(model))
    for (const { document } of diagramCandidates(model, view))
      for (const { size } of document.components) assert.ok(size[0] >= 173, `${size[0]}`);
});

test("labels longer than the widest card are refused", async () => {
  const model = validateModel(
    graphModel(6, [[1, 2]], {
      components: Array.from({ length: 6 }, (_, index) => ({
        id: `c${index + 1}`,
        label: `${"Extraordinarily ".repeat(3)}Long Component ${index + 1}`,
      })),
      views: [{ id: "row", members: ["c1", "c2", "c3", "c4", "c5", "c6"] }],
    }),
  );
  const view = await firstView(model);
  assert.throws(
    () => diagramCandidates(model, view),
    (error) => error.code === "map_label_too_long" && error.problems.length === 6,
  );
});

test("rows hold at most five and are also wrapped at four and three, the widest diagram first", async () => {
  const model = validateModel(
    graphModel(
      7,
      [2, 3, 4, 5, 6, 7].map((to) => [1, to, "notifies"]),
    ),
  );
  const candidates = diagramCandidates(model, await firstView(model));
  for (const { rows } of candidates) assert.ok(Math.max(...rows) <= 5, JSON.stringify(rows));
  assert.ok(candidates.some(({ rows }) => Math.max(...rows) === 5));
  assert.ok(candidates.some(({ rows }) => Math.max(...rows) === 3));
  const widths = candidates.map(({ width }) => width);
  assert.deepEqual(
    widths,
    [...widths].sort((a, b) => b - a),
  );
});

test("a candidate whose boundary cannot be placed omits it and keeps outside components external", async () => {
  const ids = Array.from({ length: 8 }, (_, index) => `c${index + 1}`);
  const model = validateModel(
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
        components: ids.map((id, index) => ({
          id,
          label: `Component ${index + 1}`,
          kind: index < 3 ? "person" : "service",
        })),
      },
    ),
  );
  const candidates = diagramCandidates(model, await firstView(model));
  const bounded = candidates.find(({ document }) => document.boundaries);
  assert.deepEqual(bounded?.document.boundaries[0].wraps, ids.slice(3));
  const unbounded = candidates.find(({ document }) => !document.boundaries);
  assert.ok(unbounded);
  assert.equal(unbounded.document.components.filter(({ type }) => type === "external").length, 3);
});

test("a view whose relations the grid cannot wire is refused as the view's layout", async () => {
  const edges = [1, 2, 3].flatMap((from) => [4, 5, 6].map((to) => [from, to, `asks ${from}${to}`]));
  const model = validateModel(graphModel(6, edges));
  const view = await firstView(model);
  assert.throws(
    () => diagramCandidates(model, view),
    (error) =>
      error.code === "map_layout_refused" &&
      error.problems.length === 9 &&
      error.problems.every(({ code }) => code === "layout_channel_unroutable"),
  );
});

test("a relation within a row too narrow for its label runs below the row, as the grid draws it", async () => {
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
      { views: [{ id: "fan", tiers: tiers(["c1"], ["c2", "c3", "c4", "c5", "c6"], ["c7"]) }] },
    ),
  );
  const [first] = diagramCandidates(model, await firstView(model));
  assert.deepEqual(first.rows, [1, 5, 1]);
  assert.deepEqual(sidesOf(first.document).r6, ["bottom", "bottom"]);
});

test("a relation that skips rows leaves its sides to Archify, which routes it around the cards between", async () => {
  const model = validateModel(
    graphModel(
      4,
      [
        [1, 2],
        [2, 3],
        [3, 4],
        [1, 4, "audits"],
      ],
      { views: [{ id: "chain", tiers: tiers(["c1"], ["c2"], ["c3"], ["c4"]) }] },
    ),
  );
  const view = await firstView(model);
  assert.deepEqual(sidesOf(diagramCandidates(model, view)[0].document), {
    r1: ["bottom", "top"],
    r2: ["bottom", "top"],
    r3: ["bottom", "top"],
    r4: [null, null],
  });
  const chosen = await chooseDiagram(model, view);
  assert.deepEqual([chosen.metrics.crossings, chosen.metrics.corridors], [0, 0]);
});

test("a relation that passes cards in its row leaves its sides to Archify as well", async () => {
  const model = validateModel(
    graphModel(
      4,
      [
        [1, 2],
        [2, 3],
        [3, 4],
        [2, 4, "audits"],
      ],
      { views: [{ id: "row", tiers: tiers(["c1"], ["c2", "c3", "c4"]) }] },
    ),
  );
  const view = await firstView(model);
  assert.deepEqual(sidesOf(diagramCandidates(model, view)[0].document), {
    r1: ["bottom", "top"],
    r2: ["right", "left"],
    r3: ["right", "left"],
    r4: [null, null],
  });
  const chosen = await chooseDiagram(model, view);
  assert.deepEqual([chosen.metrics.crossings, chosen.metrics.corridors], [0, 0]);
});

test("Archify chooses every side when the grid's sides cross on its routes", async () => {
  // Big Bank's tiered view crosses eight times when Archify routes the grid's
  // sides around the e-mail system's reply to the customer.
  const { model } = await loadModel(BIG_BANK_MODEL);
  const [tiered] = await viewsOf(model);
  const chosen = await chooseDiagram(model, tiered);
  assert.equal(chosen.sides, "archify");
  assert.ok(chosen.metrics.crossings <= 1, `${chosen.metrics.crossings} crossings`);
  assert.ok(chosen.candidates > diagramCandidates(model, tiered).length);
});

test("a dense view is drawn with its crossings measured, not refused", async () => {
  // Three callers that each use the same three services: two rows of three
  // cannot draw these nine relations with fewer than nine crossings.
  const model = validateModel(
    graphModel(
      6,
      [1, 2, 3].flatMap((from) => [4, 5, 6].map((to) => [from, to])),
    ),
  );
  const chosen = await chooseDiagram(model, await firstView(model));
  assert.deepEqual(chosen.rows, [3, 3]);
  assert.ok(chosen.metrics.crossings >= 9, `${chosen.metrics.crossings} crossings`);
});

test("the page draft answers the model's question view by view and cites sources at the revision", async () => {
  const model = shop();
  const views = await viewsOf(model);
  const diagrams = views.map((view) => diagramCandidates(model, view)[0]);
  const { draft, files, cited } = explainerDraft(model, views, diagrams, new Set(["secret"]));
  const steps = (view) => [
    `@steps id=steps-${view}`,
    `| step-${view}-web | Web \\| front \\*end\\* | serves: pages[](source:source-main) | diagram-${view} | web |`,
    `| step-${view}-store | Store | [](source:source-main) | diagram-${view} | store |`,
  ];
  assert.equal(
    draft,
    [
      "# What is minimal? {#page-shop}",
      "",
      "Orders flow from the web to the store.",
      "",
      '@answer scope="Checkout only. Payments are out of scope. 不含退款。 Model by the shop team."',
      `@meta locale=en repo_url="https://example.invalid/shop.git" repo_revision=${"a".repeat(40)}`,
      '@source source-main title="src/main.go" path="src/main.go"',
      "",
      "## What does the web do? {#view-web}",
      "",
      '@diagram architecture id=diagram-web source=diagram-web.architecture.json title="Minimal"',
      "",
      ...steps("web"),
      "",
      "## Where do orders go? {#view-store}",
      "",
      '@diagram architecture id=diagram-store source=diagram-store.architecture.json title="Store"',
      "",
      ...steps("store"),
      "",
    ].join("\n"),
  );
  assert.deepEqual(files, ["diagram-web.architecture.json", "diagram-store.architecture.json"]);
  assert.deepEqual(cited, ["main"]);
  // Without a withheld source each component cites its first; without a repository URL, none.
  assert.deepEqual(explainerDraft(model, views, diagrams).cited, ["secret", "main"]);
  // Steps follow the diagram's rows from the top, left to right, not the model's order.
  const fanned = validateModel(
    graphModel(3, [
      [3, 1],
      [3, 2],
    ]),
  );
  const fan = await firstView(fanned);
  const [drawn] = diagramCandidates(fanned, fan);
  const stepped = [
    ...explainerDraft(fanned, [fan], [drawn]).draft.matchAll(/^\| step-\S+ \| ([^|]+) \|/gmu),
  ].map(([, label]) => label.trim());
  const rows = [...drawn.document.components]
    .sort((a, b) => a.pos[1] - b.pos[1] || a.pos[0] - b.pos[0])
    .map(({ label }) => label);
  assert.deepEqual(stepped, rows);
  assert.equal(stepped[0], "Component 3");
  // A view that asks the model's own question is titled with its title instead.
  const asked = validateModel({
    ...shopInput(),
    views: [
      { id: "all", title: "Everything", question: "What is minimal?", members: ["web", "store"] },
    ],
  });
  const [all] = await viewsOf(asked);
  const overview = explainerDraft(asked, [all], [diagramCandidates(asked, all)[0]]).draft;
  assert.match(overview, /^## Everything \{#view-all\}$/mu);
  assert.equal(overview.match(/What is minimal\?/gu)?.length, 1);
  const local = validateModel({
    ...shopInput(),
    repository: { name: "shop", revision: "a".repeat(40) },
  });
  const plain = explainerDraft(local, views, diagrams);
  assert.deepEqual(plain.cited, []);
  assert.doesNotMatch(plain.draft, /source:|@source|repo_url/u);
});

test("a page withholds a source Archify will not cite and cites the component's next one", async () => {
  const { model, page } = await shopPageOnce();
  assert.deepEqual(page.withheld, ["secret"]);
  assert.doesNotMatch(page.draft, /internal\/secrets/u);
  assert.equal(
    page.draft,
    explainerDraft(model, await viewsOf(model), page.diagrams, new Set(["secret"])).draft,
  );
  assert.deepEqual(
    page.diagrams.map(({ view, file }) => [view, file]),
    [
      ["web", "diagram-web.architecture.json"],
      ["store", "diagram-store.architecture.json"],
    ],
  );
});

test("native Archify delivers the page deterministically and leaves only index.html", async (t) => {
  const { page } = await shopPageOnce();
  const outputs = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const directory = await temporaryDirectory("archpub-page-");
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    const delivered = await deliverExplainer(page, directory);
    assert.equal(delivered.output, path.join(directory, "index.html"));
    assert.match(delivered.supplySha256, /^[0-9a-f]{64}$/u);
    assert.equal(delivered.receipt.quality, "showcase");
    assert.deepEqual(await fs.readdir(directory), ["index.html"]);
    outputs.push(await fs.readFile(delivered.output));
  }
  assert.ok(outputs[0].equals(outputs[1]));
});

test("a page Archify rejects is refused with its diagnostics and leaves nothing behind", async (t) => {
  const { page } = await shopPageOnce();
  const [first, ...rest] = page.diagrams;
  const broken = {
    ...page,
    diagrams: [
      {
        ...first,
        document: {
          ...first.document,
          connections: [{ ...first.document.connections[0], to: "missing" }],
        },
      },
      ...rest,
    ],
  };
  const directory = await temporaryDirectory("archpub-page-");
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await assert.rejects(deliverExplainer(broken, directory), { code: "page_refused" });
  assert.deepEqual(await fs.readdir(directory), []);
});
