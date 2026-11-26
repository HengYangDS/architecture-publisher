import assert from "node:assert/strict";
import test from "node:test";
import { CATALOGUE } from "../src/facts/catalogue.mjs";
import { Refusal } from "../src/refusal.mjs";
import { dataCounts, editionData, serializeData } from "../src/pinned/data.mjs";
import { evidenceTable } from "../src/pinned/evidence.mjs";
import { statedKeys } from "./fixtures/data-format.mjs";
import { CITATIONS, GUIDE, READ, REVISION, shopBuild } from "./fixtures/pinned.mjs";

const FIGURES = Object.freeze({
  state: "verified",
  nodes: [{ file: "parts.architecture.json", id: "parts-sync", components: ["sync"] }],
  connections: [],
  unmatched: { nodes: [{ file: "parts.architecture.json", id: "parts-cloud" }], connections: [] },
});

/** The data of the shop as a build with a guide writes it. */
async function shopData(locale = "en", options = {}, extra = {}) {
  const built = await shopBuild(locale, options);
  const verified = options.verified ?? true;
  const evidence = evidenceTable({
    records: built.binding.records,
    citations: CITATIONS,
    read: verified ? READ : new Map(),
  });
  const guide = { ...GUIDE, sources: verified ? "verified" : "declared", figures: FIGURES };
  const input = { ...built.input, evidence, guide, ...extra };
  return { ...built, input, data: editionData(input) };
}

const byId = (list, id) => list.find((entry) => entry.id === id);
const isSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);

test("the data holds its members in one order, and only those the build holds", async () => {
  const { data, input } = await shopData();
  // The data reference states the members in their order; this build holds every one but the overview.
  const stated = await statedKeys("Member");
  assert.deepEqual(
    Object.keys(data),
    stated.filter((member) => member !== "overview"),
  );
  assert.deepEqual(data.delivery, { format: "architecture-publisher.delivery", version: 9 });
  assert.deepEqual(data.publisher, { name: "architecture-publisher", version: "0.15.0" });
  assert.deepEqual(data.model, { file: "model.json", ...input.file });
  assert.deepEqual(Object.keys(data.model), ["file", "sha256", "bytes", "format", "version"]);
  assert.deepEqual(data.media, ["edition", "page"]);
  // A model without a guide has no such member; the overview, drawn from the model's statement, stands before the
  // plates under its statement's digest, without a face.
  const overview = {
    statement: "5".repeat(64),
    images: [{ width: 3840, file: "images/00-overview.png" }],
  };
  const other = editionData({ ...input, guide: null, overview });
  assert.deepEqual(
    Object.keys(other),
    stated.filter((member) => member !== "guide"),
  );
  assert.deepEqual(other.overview, { ...overview, face: false });
});

test("the work is the model's own, and a field the model does not state is absent", async () => {
  const { data, input } = await shopData();
  assert.deepEqual(data.work, {
    id: "shop",
    locale: "en",
    title: "Shop",
    question: "How does the shop take an order?",
    summary: "Orders are taken, stored and billed.",
    scope: "The services of the shop.",
    limits: ["No mobile client."],
    editors: [{ name: "Ada" }],
    license: "MIT",
    coverage: {
      include: ["src/"],
      exclude: [{ path: "**/*_test.go", reason: "Tests are not architecture." }],
    },
  });
  const bare = {
    ...input.model,
    summary: null,
    scope: null,
    limits: [],
    editors: [{ name: "Ada", url: "https://example.com/ada" }],
    license: null,
    coverage: { include: null, exclude: [] },
    repository: null,
  };
  const { work, pin } = editionData({ ...input, model: bare, state: "none" });
  assert.deepEqual(work, {
    id: "shop",
    locale: "en",
    title: "Shop",
    question: "How does the shop take an order?",
    limits: [],
    editors: [{ name: "Ada", url: "https://example.com/ada" }],
    coverage: { exclude: [] },
  });
  assert.deepEqual(pin, { state: "none", date: "2026-11-10", release: "v1.2.0" });
  assert.ok(!("coverage" in editionData({ ...input, model: { ...bare, coverage: null } }).work));
});

test("the pin states its date and release when they were measured, and never otherwise", async () => {
  const pinned = await shopData();
  assert.deepEqual(pinned.data.pin, {
    repository: { name: "shop", url: "https://example.com/shop.git", revision: REVISION },
    state: "verified",
    date: "2026-11-10",
    release: "v1.2.0",
  });
  const unpinned = await shopData("en", { verified: false });
  assert.deepEqual(unpinned.data.pin, {
    repository: { name: "shop", url: "https://example.com/shop.git", revision: REVISION },
    state: "unverified",
  });
  // A pin that no release is tagged at: the layer holds that fact, and the pin names no release.
  const untagged = pinned.input.facts.map((fact) =>
    fact.property === "pin-release" ? { ...fact, value: null } : fact,
  );
  const { pin, facts } = editionData({ ...pinned.input, facts: untagged });
  assert.deepEqual(Object.keys(pin), ["repository", "state", "date"]);
  assert.deepEqual(
    facts.find(({ property }) => property === "pin-release"),
    {
      property: "pin-release",
      of: { kind: "edition" },
      value: null,
      unit: "release",
      origin: "measured",
      from: "pin",
    },
  );
});

test("each planned view names the ids it selects, an overview's line counting as the relations it stands for", async () => {
  const { data, input } = await shopData();
  assert.deepEqual(data.views, [
    {
      id: "overview",
      title: "Shop",
      question: "How does the shop take an order?",
      origin: "overview",
      components: ["bill"],
      groups: ["core"],
      relations: ["sync-bill", "store-bill", "bill-store"],
      plate: 1,
    },
    {
      id: "core",
      title: "Core",
      question: "How does the shop take an order?",
      origin: "group",
      components: ["sync", "store", "bill"],
      groups: [],
      relations: ["sync-store", "sync-bill", "store-bill", "bill-store"],
      plate: 2,
    },
  ]);
  // A view's summary and tiers are written when the plan holds them; a build of the page alone names no plate.
  const tiers = [{ id: "front", label: "Front", members: ["sync"] }];
  const declared = { ...input.views[1], summary: "How the core persists.", tiers };
  const [view] = editionData({ ...input, views: [declared], plates: [] }).views;
  assert.deepEqual(Object.keys(view), [
    "id",
    "title",
    "question",
    "summary",
    "origin",
    "tiers",
    "components",
    "groups",
    "relations",
  ]);
  assert.deepEqual(view.tiers, tiers);
  // A view without a question of its own has none written.
  const unasked = editionData({ ...input, views: [{ ...input.views[1], question: null }] });
  assert.ok(!("question" in unasked.views[0]));
});

test("every statement of the model stands once, as stated, a relation with its text", async () => {
  const { data } = await shopData();
  assert.deepEqual(
    data.statements.components.map(({ id }) => id),
    ["sync", "store", "bill", "audit"],
  );
  assert.deepEqual(byId(data.statements.components, "sync"), {
    id: "sync",
    label: "Synchronization",
    details: { converges: ["selections", "files"] },
    files: ["src/sync/"],
    origin: "stated",
  });
  assert.deepEqual(byId(data.statements.components, "store"), {
    id: "store",
    label: "Configuration store",
    kind: "authority",
    status: "planned",
    details: {},
    files: ["src/store/store.go"],
    origin: "stated",
  });
  assert.deepEqual(byId(data.statements.relations, "sync-store"), {
    id: "sync-store",
    from: "sync",
    to: "store",
    label: "persists",
    text: "sync —persists→ store",
    details: {},
    files: ["src/store/store.go", "src/sync/a.go"],
    origin: "stated",
  });
  assert.deepEqual(data.statements.groups, [
    { id: "core", label: "Core", members: ["sync", "store"], origin: "stated" },
  ]);
  // A statement no view selects is held, and no view's list names it.
  assert.ok(byId(data.statements.components, "audit"));
  assert.ok(data.views.every(({ components }) => !components.includes("audit")));
  for (const list of Object.values(data.statements))
    for (const statement of list) assert.equal(statement.origin, "stated", statement.id);
});

test("the data's facts and catalogue are the layer's, both ways, each fact once", async () => {
  const { data, input } = await shopData();
  const written = (fact) => {
    const { from, ...rest } = fact;
    return from === null ? rest : fact;
  };
  assert.deepEqual(data.facts, input.facts.map(written));
  assert.equal(data.facts.length, input.facts.length);
  for (const fact of input.facts) assert.ok(data.facts.some((one) => isSame(one, written(fact))));
  assert.deepEqual(
    data.catalogue.map(({ property }) => property),
    CATALOGUE.map(({ property }) => property),
  );
  assert.deepEqual(data.catalogue[1], {
    property: "owned-bytes",
    of: ["part", "group"],
    unit: "bytes",
    origin: "measured",
    from: "pin",
  });
  assert.deepEqual(
    data.catalogue.find(({ property }) => property === "file-age-band").spans,
    [604800, 7776000],
  );
  // A part's bytes, measured at the pin.
  assert.deepEqual(
    data.facts.find(({ property, of }) => property === "owned-bytes" && of.id === "sync"),
    {
      property: "owned-bytes",
      of: { kind: "part", id: "sync" },
      value: 3000,
      unit: "bytes",
      origin: "measured",
      from: "pin",
    },
  );
  // A fact the layer hands over twice, as a relation in two views is, stands once.
  const twice = editionData({ ...input, facts: [...input.facts, ...input.facts] });
  assert.deepEqual(twice.facts, data.facts);
});

test("without a checkout the data holds what the model alone gives, and no zero in place of a measure", async () => {
  const { data } = await shopData("en", { verified: false });
  const properties = new Set(data.facts.map(({ property }) => property));
  assert.deepEqual([...properties].sort(), ["cited-files", "files-read", "hub", "owned-files"]);
  const owned = data.facts.find(
    ({ property, of }) => property === "owned-files" && of.id === "store",
  );
  assert.deepEqual(owned, {
    property: "owned-files",
    of: { kind: "part", id: "store" },
    value: ["src/store/store.go"],
    unit: "paths",
    origin: "stated",
  });
  assert.equal(data.facts.find(({ of }) => of.id === "sync-store").value, 2);
  assert.ok(data.evidence.every((row) => row.state === "unverified" && !("sha256" in row)));
});

test("a fact of a property the catalogue does not list is refused by name", async () => {
  const { input } = await shopData();
  const beside = {
    property: "lines-of-code",
    of: { kind: "part", id: "sync" },
    value: 9,
    unit: "lines",
    origin: "measured",
    from: "pin",
  };
  assert.throws(
    () => editionData({ ...input, facts: [...input.facts, beside] }),
    (error) => {
      assert.ok(error instanceof Refusal);
      assert.equal(error.code, "projection_fact_unknown");
      assert.match(error.message, /lines-of-code/u);
      return true;
    },
  );
});

test("the evidence and the guide's record stand as they were handed over", async () => {
  const { data, input } = await shopData();
  assert.deepEqual(data.evidence, input.evidence);
  assert.deepEqual(data.guide, {
    path: GUIDE.path,
    sha256: GUIDE.sha256,
    files: GUIDE.files,
    sources: "verified",
    figures: FIGURES,
  });
  // A guide whose figures were not matched has no such key.
  const { guide } = editionData({ ...input, guide: GUIDE });
  assert.deepEqual(Object.keys(guide), ["path", "sha256", "files", "sources"]);
});

test("the plates stand by number with their keys in one order, and a check's plates have no page", async () => {
  const { data, input } = await shopData();
  assert.deepEqual(data.plates, input.plates);
  const shuffled = [...input.plates].reverse().map(({ face, images, ...rest }) => ({
    face: { relations: face.relations, groups: face.groups, components: face.components },
    ...rest,
    images,
  }));
  const again = editionData({ ...input, plates: shuffled }).plates;
  assert.equal(JSON.stringify(again), JSON.stringify(input.plates));
  assert.deepEqual(Object.keys(again[0]), [
    "number",
    "views",
    "page",
    "images",
    "figures",
    "frame",
    "scales",
    "face",
  ]);
  assert.deepEqual(again[0].figures, [
    { format: "png", file: "figures/01-overview.png" },
    { format: "svg", file: "figures/01-overview.svg" },
  ]);
  const checked = await shopData("en", { typeset: false });
  assert.deepEqual(Object.keys(checked.data.plates[0]), ["number", "views", "images", "face"]);
  // A build of the page alone holds every statement, fact and row of evidence, and an empty list of plates.
  const paged = editionData({ ...input, plates: [], media: ["page"] });
  assert.deepEqual(paged.plates, []);
  assert.deepEqual(paged.statements, data.statements);
  assert.deepEqual(paged.facts, data.facts);
  assert.deepEqual(paged.evidence, data.evidence);
  assert.ok(paged.views.every((view) => !("plate" in view)));
  // A caller that holds no plates may leave the member out: the data is the one of an empty list.
  assert.deepEqual(editionData({ ...input, plates: undefined, media: ["page"] }), paged);
});

test("the data is written as JSON with a two-space indent and one final newline, the same bytes twice", async () => {
  const first = await shopData();
  const second = await shopData();
  const text = serializeData(first.data);
  assert.equal(text, serializeData(second.data));
  assert.equal(text, `${JSON.stringify(first.data, null, 2)}\n`);
  // Nothing held is lost in writing: no key stands with an undefined value.
  assert.deepEqual(JSON.parse(text), first.data);
  assert.ok(!/\/Users\/|\/home\/|[A-Z]:\\\\/u.test(text));
  assert.ok(!/"(?:time|written|built|timestamp)"/u.test(text));
});

test("two languages of one work agree in every id, fact and row of evidence, and differ in texts", async () => {
  const { data: en } = await shopData("en");
  const { data: zh } = await shopData("zh-CN");
  assert.deepEqual(zh.facts, en.facts);
  assert.deepEqual(zh.evidence, en.evidence);
  assert.deepEqual(zh.catalogue, en.catalogue);
  assert.deepEqual(zh.pin, en.pin);
  const ids = (data) => ({
    statements: Object.fromEntries(
      Object.entries(data.statements).map(([type, list]) => [type, list.map(({ id }) => id)]),
    ),
    files: data.statements.components.map(({ files }) => files),
    views: data.views.map(({ id, components, groups, relations, plate }) => ({
      id,
      components,
      groups,
      relations,
      plate,
    })),
    faces: data.plates.map(({ number, face }) => ({
      number,
      components: face.components,
      groups: face.groups,
      relations: face.relations.map(({ id, from, to, segments }) => ({ id, from, to, segments })),
    })),
  });
  assert.deepEqual(ids(zh), ids(en));
  assert.equal(zh.work.locale, "zh-CN");
  assert.notEqual(zh.work.title, en.work.title);
  assert.equal(byId(zh.statements.relations, "sync-store").text, "sync —持久化→ store");
});

test("the counts a check reports are taken from the data", async () => {
  const { data } = await shopData();
  assert.deepEqual(dataCounts(data), {
    statements: { components: 4, relations: 4, groups: 1, cited: 4, unchecked: 0, uncited: 4 },
    facts: data.facts.length,
    evidence: { paths: 4, ranges: 5 },
    faces: [
      // An overview's line counts as the relations it stands for.
      { plate: 1, components: 1, groups: 1, relations: 3 },
      { plate: 2, components: 3, groups: 0, relations: 4 },
    ],
    figures: {
      state: "verified",
      matched: { nodes: 1, connections: 0 },
      unmatched: FIGURES.unmatched,
    },
  });
  // Without a checkout the statements that name files are unchecked; without a guide no figure is counted.
  const unpinned = await shopData("en", { verified: false }, { guide: null });
  const counts = dataCounts(unpinned.data);
  assert.deepEqual(counts.statements, {
    components: 4,
    relations: 4,
    groups: 1,
    cited: 0,
    unchecked: 4,
    uncited: 4,
  });
  assert.ok(!("figures" in counts));
});
