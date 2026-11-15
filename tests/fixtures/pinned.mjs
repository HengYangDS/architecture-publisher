import { createHash } from "node:crypto";
import { CATALOGUE } from "../../src/facts/catalogue.mjs";
import { editionFacts } from "../../src/facts/edition.mjs";
import { MODEL_FORMAT, MODEL_VERSION, validateModel } from "../../src/model/load.mjs";
import { planViews } from "../../src/plan/views.mjs";
import { minimalModel } from "./models.mjs";

/**
 * A small work for the tests of the pinned edition: a shop whose core group holds two parts, one part beside it
 * and one part no view selects, in English or in Chinese with the same ids. Its views are the plan's own, its
 * facts the layer's own, and its binding, plates and guide are written by hand as the build would hand them over.
 */

export const REVISION = "0123456789abcdef0123456789abcdef01234567";
const DAY = 86400;
const COMMIT = Object.freeze({
  date: "2026-11-10",
  time: Date.UTC(2026, 10, 10) / 1000,
  release: "v1.2.0",
});
export const DELIVERY = Object.freeze({ format: "architecture-publisher.delivery", version: 8 });
export const PUBLISHER = Object.freeze({ name: "architecture-publisher", version: "0.15.0" });

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** The work's model, validated as the build validates it. */
export function shopModel(locale = "en", extra = {}) {
  const t = (en, zh) => (locale === "en" ? en : zh);
  return validateModel(
    minimalModel({
      id: "shop",
      locale,
      title: t("Shop", "商店"),
      question: t("How does the shop take an order?", "商店如何接单？"),
      summary: t("Orders are taken, stored and billed.", "订单被接收、保存并计费。"),
      scope: t("The services of the shop.", "商店的各项服务。"),
      limits: [t("No mobile client.", "不含移动端。")],
      editors: [{ name: "Ada" }],
      license: "MIT",
      repository: { name: "shop", url: "https://example.com/shop.git", revision: REVISION },
      coverage: {
        include: ["src/"],
        exclude: [
          { path: "**/*_test.go", reason: t("Tests are not architecture.", "测试不属于架构。") },
        ],
      },
      guide: "guide/guide.archify.md",
      kinds: { authority: { label: t("authority", "权威"), category: "database" } },
      components: [
        {
          id: "sync",
          label: t("Synchronization", "同步"),
          details: { [t("converges", "收敛")]: [t("selections", "选择"), t("files", "文件")] },
          files: ["src/sync/"],
        },
        {
          id: "store",
          label: t("Configuration store", "配置库"),
          kind: "authority",
          status: "planned",
          files: ["src/store/store.go"],
        },
        { id: "bill", label: t("Billing", "计费") },
        { id: "audit", label: t("Audit", "审计") },
      ],
      relations: [
        {
          id: "sync-store",
          from: "sync",
          to: "store",
          label: t("persists", "持久化"),
          files: ["src/store/store.go", "src/sync/a.go"],
        },
        {
          id: "sync-bill",
          from: "sync",
          to: "bill",
          label: t("charges", "计费"),
          details: { [t("via", "经由")]: t("queue", "队列") },
        },
        { id: "store-bill", from: "store", to: "bill", label: t("invoices", "开票") },
        {
          id: "bill-store",
          from: "bill",
          to: "store",
          label: t("reads", "读取"),
          files: ["src/store/store.go"],
        },
      ],
      groups: [{ id: "core", label: t("Core", "核心"), members: ["sync", "store"] }],
      ...extra,
    }),
  );
}

/**
 * The plan's views of a model whose complete view does not fit: its overview, whose first line stands for two
 * relations, and one view for each group. `audit` is given no relation, so only the overview's plan could select
 * it; the tests that need a statement in no view drop it from the overview.
 */
async function plannedViews(model) {
  const views = await planViews(model, async (view) => ({
    fits: view.origin !== "complete",
    width: 2400,
    height: 1350,
  }));
  return views.map((view) =>
    view.origin === "overview"
      ? { ...view, components: view.components.filter(({ id }) => id !== "audit") }
      : view,
  );
}

/** The files of the shop at its pin: path, bytes, and days from its last change to the pin. */
const FILES = Object.freeze([
  ["src/store/store.go", 1000, 3],
  ["src/sync/a.go", 2000, 30],
  ["src/sync/b.go", 1000, 400],
]);

const utcDate = (time) => new Date(time * 1000).toISOString().slice(0, 10);

/** The binding as `bindSources` hands it over: read at the pin, or declared without a checkout. */
export function bindingOf(model, verified = true) {
  const cited = (path) =>
    model.relations.filter(({ files }) => files.includes(path)).map(({ id }) => id);
  if (!verified) {
    const paths = [
      ...new Set([...model.components, ...model.relations].flatMap(({ files }) => files)),
    ];
    return {
      state: "unverified",
      records: paths.sort().map((path) => ({
        path,
        sha256: null,
        bytes: null,
        changed: null,
        owner: model.components.find(({ files }) => files.includes(path))?.id ?? null,
        relations: cited(path),
        state: "unverified",
      })),
      owned: new Map(
        model.components.map(({ id, files }) => [
          id,
          files.filter((claim) => !claim.endsWith("/")),
        ]),
      ),
      times: new Map(),
    };
  }
  const owner = (path) => (path.startsWith("src/sync/") ? "sync" : "store");
  return {
    state: "verified",
    records: FILES.map(([path, bytes, days]) => ({
      path,
      sha256: sha256(path),
      bytes,
      changed: utcDate(COMMIT.time - days * DAY),
      owner: owner(path),
      relations: cited(path),
      state: "verified",
    })),
    owned: new Map(
      model.components.map(({ id }) => [
        id,
        FILES.map(([path]) => path).filter((path) => owner(path) === id),
      ]),
    ),
    times: new Map(FILES.map(([path, , days]) => [path, COMMIT.time - days * DAY])),
  };
}

/** Every fact of the layer for a model and its planned views: the edition's, then each view's. */
function layerFacts(model, binding, views) {
  const facts = editionFacts(model, binding, binding.state === "verified" ? COMMIT : null);
  return [...facts.all(), ...views.flatMap((view) => facts.view(view).all())];
}

/** The guide's draft, with a list item shaped like a statement the model lacks. */
export const DRAFT = Buffer.from(
  [
    "@meta title=Shop",
    '@source readme-what title="What it is" path="README.md" lines=3:6',
    '@source store-commit title="Commit" path="src/store/store.go" lines=10:20',
    "@diagram source=parts.architecture.json",
    "",
    "# How does the shop take an order? {#guide}",
    "",
    "- component `ghost`: a part the model lacks",
    "",
  ].join("\n"),
);

/** The guide's one diagram document: nodes with ids of their own that cite files. */
export const DIAGRAM = Object.freeze({
  diagram_type: "architecture",
  components: [
    { id: "parts-sync", label: "Sync", sources: [{ path: "src/sync/a.go", line: 5, end_line: 9 }] },
    { id: "parts-store", label: "Store", sources: [{ path: "src/store/store.go" }] },
    { id: "parts-readme", label: "Read me", sources: [{ path: "README.md", line: 1 }] },
    { id: "parts-cloud", label: "Cloud" },
  ],
  connections: [
    { id: "persists", from: "parts-sync", to: "parts-store", label: "persists" },
    { id: "explains", from: "parts-readme", to: "parts-store", label: "explains" },
    { id: "hosts", from: "parts-cloud", to: "parts-sync" },
  ],
  boundaries: [{ kind: "region", label: "Shop", wraps: ["parts-sync", "parts-store"] }],
});

/** The guide's citations, as `guideCitations` reads them from the draft and the diagram. */
export const CITATIONS = Object.freeze([
  { where: "@source readme-what", path: "README.md", lines: [3, 6] },
  { where: "@source store-commit", path: "src/store/store.go", lines: [10, 20] },
  { where: "parts.architecture.json/components/0/sources/0", path: "src/sync/a.go", lines: [5, 9] },
  {
    where: "parts.architecture.json/components/1/sources/0",
    path: "src/store/store.go",
    lines: null,
  },
  { where: "parts.architecture.json/components/2/sources/0", path: "README.md", lines: [1, 1] },
]);

/** What the build read at the pin of the paths only the guide cites. */
export const READ = new Map([
  ["README.md", { sha256: sha256("README.md"), bytes: 120, changed: "2026-11-01" }],
]);

/** The guide's record, as `guideSummary` gives it. */
export const GUIDE = Object.freeze({
  path: "guide/guide.archify.md",
  sha256: sha256(DRAFT),
  files: [{ name: "parts.architecture.json", sha256: sha256(JSON.stringify(DIAGRAM)) }],
  writing: "strict",
  sources: "verified",
});

const box = (x, y) => ({ x, y, width: 240, height: 96 });
const text = (model, id) => {
  const { from, to, label } = model.relations.find((relation) => relation.id === id);
  return `${from} —${label}→ ${to}`;
};

/**
 * The plates' entries as the drawing reports them, one for each view, in the shape the two parts agreed on. A
 * typeset edition gives each its page, frame and scales; a check gives none of the three.
 */
function platesOf(model, views, typeset = true) {
  return views.map((view, index) => ({
    number: index + 1,
    views: [view.id],
    ...(typeset ? { page: index + 3 } : {}),
    images: [{ width: 2400, file: `images/0${index + 1}-${view.id}.png` }],
    ...(typeset
      ? {
          frame: { x: 48, y: 112, width: 1504, height: 714, pixelsPerPoint: 1.5 },
          scales: [{ property: "owned-bytes", unit: "bytes", value: 4000, length: 360 }],
        }
      : {}),
    face: {
      components: view.components
        .filter(({ group }) => !group)
        .map(({ id }, at) => ({ id, box: box(120 + 300 * at, 80) })),
      groups: view.components
        .filter(({ group }) => group)
        .map(({ id }, at) => ({ id, box: box(120 + 300 * at, 300) })),
      relations: view.relations.map((relation, at) => ({
        id: relation.id,
        from: relation.from,
        to: relation.to,
        ...(relation.relations
          ? { relations: [...relation.relations] }
          : { text: text(model, relation.id) }),
        segments: [
          [
            [0, 10 * at],
            [0, 10 * at + 10],
          ],
        ],
        label: relation.relations ? null : { x: 4, y: 10 * at, width: 60, height: 14 },
      })),
    },
  }));
}

/** The values a build hands the writer of the data, for one language, with or without a checkout. */
export async function shopBuild(locale = "en", { verified = true, typeset = true } = {}) {
  const model = shopModel(locale);
  const views = await plannedViews(model);
  const binding = bindingOf(model, verified);
  const content = Buffer.from(`${JSON.stringify({ id: model.id, locale })}\n`);
  return {
    model,
    views,
    binding,
    input: {
      delivery: DELIVERY,
      publisher: PUBLISHER,
      model,
      file: {
        sha256: sha256(content),
        bytes: content.length,
        format: MODEL_FORMAT,
        version: MODEL_VERSION,
      },
      state: binding.state,
      views,
      plates: platesOf(model, views, typeset),
      facts: layerFacts(model, binding, views),
      catalogue: CATALOGUE,
      media: ["edition", "page"],
    },
  };
}
