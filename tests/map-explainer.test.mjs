import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { diagramCandidates } from "../src/map/archify.mjs";
import {
  deliverExplainer,
  explainerDraft,
  explainerPage,
  sensitiveSources,
} from "../src/map/explainer.mjs";
import { validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { graphModel, minimalModel, temporaryDirectory } from "./fixtures/models.mjs";

const fits = async () => ({ fits: true, width: 2400, height: 1350 });
/** A model's views as the plan derives them, every view admitted. */
const viewsOf = (model) => planViews(model, fits);
const firstView = async (model) => (await viewsOf(model))[0];

/**
 * A model with two views over a repository, one of whose files lies under a
 * `secrets` directory, which Archify will not cite on a page.
 */
const shopInput = () =>
  minimalModel({
    id: "shop",
    summary: "Orders flow from the web to the store.",
    scope: "Checkout only",
    limits: ["Payments are out of scope.", "不含退款"],
    editors: [{ name: "the shop team" }],
    repository: {
      name: "shop",
      url: "https://example.invalid/shop.git",
      revision: "a".repeat(40),
    },
    components: [
      {
        id: "web",
        label: "Web | front *end*",
        details: { serves: "pages", owns: ["cart", "sessions"] },
        files: ["internal/secrets/store.go", "src/main.go"],
      },
      { id: "store", label: "Store", files: ["src/store.go"] },
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

test("the page lists its panels beside the conclusion while Archify's reasons hold them", async () => {
  const listed = async (count) => {
    const views = Array.from({ length: count }, (_, index) => ({
      id: `v${index + 1}`,
      question: `What does view ${index + 1} show?`,
      members: ["web", "store"],
    }));
    const model = validateModel({ ...shopInput(), views });
    const planned = await viewsOf(model);
    const diagrams = planned.map((view) => diagramCandidates(model, view)[0]);
    return [...explainerDraft(model, planned, diagrams).draft.matchAll(/^- \[/gmu)].length;
  };
  assert.equal(await listed(4), 4);
  assert.equal(await listed(5), 0);
});

test("the page draft answers the model's question view by view and cites files at the revision", async () => {
  const model = shop();
  const views = await viewsOf(model);
  const diagrams = views.map((view) => diagramCandidates(model, view)[0]);
  const secret = "internal/secrets/store.go";
  const { draft, files, cited } = explainerDraft(model, views, diagrams, new Set([secret]));
  const steps = (view) => [
    `@steps id=steps-${view}`,
    `| step-${view}-web | Web \\| front \\*end\\* | serves: pages; owns: cart, sessions[](source:source-1) | diagram-${view} | web |`,
    // A component without details names the file it is cited from.
    `| step-${view}-store | Store | [src/store.go](source:source-2) | diagram-${view} | store |`,
  ];
  assert.equal(
    draft,
    [
      "# What is minimal? {#page-shop}",
      "",
      "Orders flow from the web to the store.",
      "",
      "- [What does the web do?](block:view-web)",
      "- [Where do orders go?](block:view-store)",
      "",
      '@answer scope="Checkout only. Payments are out of scope. 不含退款。 Edited by the shop team."',
      `@meta locale=en repo_url="https://example.invalid/shop.git" repo_revision=${"a".repeat(40)}`,
      // A file is listed under the component that owns it, numbered as the page cites it.
      '@source source-1 title="Web | front *end*" path="src/main.go"',
      '@source source-2 title="Store" path="src/store.go"',
      "",
      "## What does the web do? {#view-web}",
      "",
      // A view without a title of its own is named by its question.
      '@diagram architecture id=diagram-web source=diagram-web.architecture.json title="What does the web do?"',
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
  assert.deepEqual(cited, ["src/main.go", "src/store.go"]);
  // Without a withheld file each component cites its first; without a repository URL, none.
  assert.deepEqual(explainerDraft(model, views, diagrams).cited, [secret, "src/store.go"]);
  // A component's first file is the first its binding resolved, such as the first file of a directory.
  const owned = new Map([
    ["web", ["src/web/a.go", "src/web/b.go"]],
    ["store", []],
  ]);
  assert.deepEqual(explainerDraft(model, views, diagrams, new Set(), owned).cited, [
    "src/web/a.go",
  ]);
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

test("a page withholds a file Archify will not cite and cites the component's next one", async () => {
  const { model, page } = await shopPageOnce();
  const secret = "internal/secrets/store.go";
  assert.deepEqual(page.withheld, [secret]);
  assert.doesNotMatch(page.draft, /internal\/secrets/u);
  assert.equal(
    page.draft,
    explainerDraft(model, await viewsOf(model), page.diagrams, new Set([secret])).draft,
  );
  assert.deepEqual(
    page.diagrams.map(({ view, file }) => [view, file]),
    [
      ["web", "diagram-web.architecture.json"],
      ["store", "diagram-store.architecture.json"],
    ],
  );
});

test("only a finding that names a source the draft cites withholds it", () => {
  const finding = (index) => ({
    code: "explainer/secret-path",
    subject: { path: `/sources/${index}/path` },
  });
  const other = { code: "explainer/other", subject: { path: "/sources/0/path" } };
  assert.deepEqual(sensitiveSources({ diagnostics: [finding(0), finding(5), other] }, ["secret"]), [
    "secret",
  ]);
  // A finding past the cited sources names none, so the page is refused rather than retried.
  assert.deepEqual(sensitiveSources({ diagnostics: [finding(5)] }, ["secret"]), []);
});

test("native Archify delivers the page deterministically and leaves only index.html", async (t) => {
  const { page } = await shopPageOnce();
  const outputs = [];
  // The second delivery runs under the caller's Archify variables, which would
  // hand Archify a prepared page that does not exist and another quality.
  const callers = [
    {},
    { ARCHIFY_EXPLAINER_PREPARED: "missing.json", ARCHIFY_QUALITY_PROFILE: "standard" },
  ];
  for (const variables of callers) {
    const directory = await temporaryDirectory(t, "archpub-page-");
    Object.assign(process.env, variables);
    const delivered = await deliverExplainer(page, directory).finally(() => {
      for (const name of Object.keys(variables)) delete process.env[name];
    });
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
  const directory = await temporaryDirectory(t, "archpub-page-");
  await assert.rejects(deliverExplainer(broken, directory), { code: "page_refused" });
  assert.deepEqual(await fs.readdir(directory), []);
});
