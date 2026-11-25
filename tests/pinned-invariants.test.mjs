import assert from "node:assert/strict";
import test from "node:test";
import { CATALOGUE } from "../src/facts/catalogue.mjs";
import { editionFacts } from "../src/facts/edition.mjs";
import { MODEL_FORMAT, MODEL_VERSION, loadModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { editionData, serializeData } from "../src/pinned/data.mjs";
import { evidenceTable } from "../src/pinned/evidence.mjs";
import { requireFaces, requireProjections, requireReaderIds } from "../src/pinned/invariants.mjs";
import { readerFile, readerIds } from "../src/pinned/reader.mjs";
import { Refusal } from "../src/refusal.mjs";
import { bindSources } from "../src/sources/bind.mjs";
import { AIGW_MODEL, SELF_MODEL } from "./fixtures/models.mjs";
import {
  CITATIONS,
  DELIVERY,
  GUIDE,
  PUBLISHER,
  READ,
  sha256,
  shopBuild,
} from "./fixtures/pinned.mjs";

/** The shop's data and reader file as a build is about to deliver them. */
async function shop(locale = "en", options = {}) {
  const built = await shopBuild(locale, options);
  const verified = options.verified ?? true;
  const evidence = evidenceTable({
    records: built.binding.records,
    citations: CITATIONS,
    read: verified ? READ : new Map(),
  });
  const data = editionData({ ...built.input, evidence, guide: GUIDE });
  const text = readerFile(data, {
    sha256: sha256(serializeData(data)),
    guide: "The shop takes an order.\n",
  }).toString();
  return { ...built, evidence, data, text };
}

/** The refusal a call throws, held to its code; its message and its problems' messages as one text. */
function refusalOf(code, call) {
  try {
    call();
  } catch (error) {
    assert.ok(error instanceof Refusal, String(error));
    assert.equal(error.code, code);
    // Every problem says where it stands: a list of the model, a plate, the reader file or a page.
    for (const { path } of error.problems)
      assert.match(path, /^\/(?:(?:components|relations|groups|plates)\/[^/ ]+|reader|page)$/u);
    return [error.message, ...error.problems.map(({ message }) => message)].join("\n");
  }
  return assert.fail(`no refusal ${code}`);
}

test("the three invariants hold on what the writers write, in two languages, with and without a checkout", async () => {
  for (const locale of ["en", "zh-CN"])
    for (const verified of [true, false])
      for (const typeset of [true, false]) {
        const { model, data, text } = await shop(locale, { verified, typeset });
        requireReaderIds(model, text);
        requireFaces(data);
        requireProjections(data, [
          {
            projection: "page",
            components: ["sync", "bill"],
            groups: ["core"],
            relations: ["sync-bill"],
          },
        ]);
      }
});

test("a statement's line left out of the reader file is refused by its id and type", async () => {
  const { model, text } = await shop();
  const line =
    "- relation `sync-store`: sync —persists→ store · stated · files `src/store/store.go`, `src/sync/a.go`\n";
  assert.ok(text.includes(line));
  const message = refusalOf("reader_ids_differ", () =>
    requireReaderIds(model, text.replace(line, "")),
  );
  assert.match(message, /relation `sync-store`/u);
  assert.ok(!message.includes("`sync-bill`"));
  // The draft's own item, which stands after the guide's heading, refuses nothing; before it, it would.
  const moved = text.replace(
    "\n## Checking again\n",
    "\n- component `ghost`: moved\n\n## Checking again\n",
  );
  assert.match(
    refusalOf("reader_ids_differ", () => requireReaderIds(model, moved)),
    /component `ghost`/u,
  );
});

test("a component written as a relation is named under both types", async () => {
  const { model, text } = await shop();
  const wrong = text.replace("- component `store`: ", "- relation `store`: ");
  assert.notEqual(wrong, text);
  const message = refusalOf("reader_ids_differ", () => requireReaderIds(model, wrong));
  assert.match(message, /component `store`/u);
  assert.match(message, /relation `store`/u);
});

test("a statement's line written twice, or a later view that names an id the model lacks, is refused", async () => {
  const { model, text } = await shop();
  const line = "- component `audit`: Audit · stated\n";
  assert.match(
    refusalOf("reader_ids_differ", () => requireReaderIds(model, text.replace(line, line + line))),
    /component `audit`.*twice/u,
  );
  const named = text.replace(
    "- relation `sync-bill`\n",
    "- relation `sync-bill`\n- relation `phantom`\n",
  );
  assert.notEqual(named, text);
  assert.match(
    refusalOf("reader_ids_differ", () => requireReaderIds(model, named)),
    /relation `phantom`/u,
  );
});

/** The data with one plate's face changed. */
const withFace = (data, number, change) => ({
  ...data,
  plates: data.plates.map((plate) =>
    plate.number === number ? { ...plate, face: change(structuredClone(plate.face)) } : plate,
  ),
});

test("a relation the drawing left out is refused with the plate and the relation", async () => {
  const { data } = await shop();
  const broken = withFace(data, 2, (face) => ({
    ...face,
    relations: face.relations.filter(({ id }) => id !== "sync-store"),
  }));
  const message = refusalOf("data_face_differs", () => requireFaces(broken));
  assert.match(message, /plate 2/iu);
  assert.match(message, /relation `sync-store`/u);
  assert.ok(!message.includes("`bill-store`"));
  // An overview's line left out is missed as each relation it stands for.
  const overview = withFace(data, 1, (face) => ({ ...face, relations: face.relations.slice(1) }));
  const missed = refusalOf("data_face_differs", () => requireFaces(overview));
  assert.match(missed, /plate 1/iu);
  assert.match(missed, /relation `sync-bill`/u);
  assert.match(missed, /relation `store-bill`/u);
  // A check composes plates without a page, and compares them as a build does.
  const checked = await shop("en", { typeset: false });
  const unpaged = withFace(checked.data, 2, (face) => ({ ...face, groups: [{ id: "core" }] }));
  assert.match(
    refusalOf("data_face_differs", () => requireFaces(unpaged)),
    /group `core`/u,
  );
});

test("a part its view does not select is refused by name", async () => {
  const { data } = await shop();
  const broken = withFace(data, 1, (face) => ({
    ...face,
    components: [...face.components, { id: "audit", box: { x: 0, y: 0, width: 1, height: 1 } }],
  }));
  const message = refusalOf("data_face_differs", () => requireFaces(broken));
  assert.match(message, /plate 1/iu);
  assert.match(message, /component `audit`/u);
  // A plate of a view the plan does not hold draws nothing a view selects.
  const astray = { ...data, plates: [{ ...data.plates[0], views: ["nowhere"] }] };
  assert.match(
    refusalOf("data_face_differs", () => requireFaces(astray)),
    /draws the component `bill`.*draws the group `core`.*draws the relation `sync-bill`/su,
  );
});

test("a relation drawn the wrong way is refused by name", async () => {
  const { data } = await shop();
  const swapped = withFace(data, 2, (face) => ({
    ...face,
    relations: face.relations.map((relation) =>
      relation.id === "sync-store" ? { ...relation, text: "store —persists→ sync" } : relation,
    ),
  }));
  const message = refusalOf("data_face_differs", () => requireFaces(swapped));
  assert.match(message, /relation `sync-store`/u);
  assert.match(message, /store —persists→ sync/u);
  // A drawn relation the model lacks is named once, as one the view does not select.
  const unknown = withFace(data, 2, (face) => ({
    ...face,
    relations: [
      ...face.relations,
      { id: "ghost", from: "sync", to: "bill", text: "sync —x→ bill" },
    ],
  }));
  assert.match(
    refusalOf("data_face_differs", () => requireFaces(unknown)),
    /relation `ghost`/u,
  );
});

test("a plate that names a part, an end or a property the data lacks is refused with the plate", async () => {
  const { data } = await shop();
  const part = withFace(data, 1, (face) => ({
    ...face,
    components: [...face.components, { id: "ghost" }],
  }));
  const message = refusalOf("projection_fact_unknown", () => requireProjections(part));
  assert.match(message, /plate 1/iu);
  assert.match(message, /component `ghost`/u);
  const end = withFace(data, 2, (face) => ({
    ...face,
    groups: [{ id: "phantom" }],
    relations: [
      { ...face.relations[0], from: "nowhere" },
      { id: "overview-9", from: "sync", to: "bill", relations: ["lost"] },
    ],
  }));
  const ends = refusalOf("projection_fact_unknown", () => requireProjections(end));
  assert.match(ends, /group `phantom`/u);
  assert.match(ends, /`nowhere`/u);
  assert.match(ends, /relation `lost`/u);
  const scaled = {
    ...data,
    plates: data.plates.map((plate) => ({
      ...plate,
      scales: [{ property: "lines-of-code", unit: "lines", value: 9, length: 360 }],
    })),
  };
  assert.match(
    refusalOf("projection_fact_unknown", () => requireProjections(scaled)),
    /lines-of-code/u,
  );
  const unit = {
    ...data,
    plates: data.plates.map((plate) => ({
      ...plate,
      scales: [{ property: "owned-bytes", unit: "files", value: 9, length: 360 }],
    })),
  };
  assert.match(
    refusalOf("projection_fact_unknown", () => requireProjections(unit)),
    /owned-bytes/u,
  );
});

test("the reader file states every fact of the data, each by its property, value and unit", async () => {
  const { data, text } = await shop();
  const shown = (value, unit) =>
    Array.isArray(value)
      ? `${value.length} ${unit}`
      : typeof value === "number"
        ? `${value} ${unit}`
        : String(value);
  for (const { property, value, unit, of } of data.facts) {
    if (value === null || of.kind === "file") continue;
    assert.ok(
      text.includes(`\`${property}\` \`${shown(value, unit)}\``),
      `${of.kind} ${of.id ?? ""} ${property}`,
    );
  }
});

test("a generated page that draws a relation the data lacks is refused by name", async () => {
  const { data } = await shop();
  const page = {
    projection: "page",
    components: ["sync"],
    groups: [],
    relations: ["sync-store", "ghost"],
  };
  const message = refusalOf("projection_fact_unknown", () => requireProjections(data, [page]));
  assert.match(message, /page/u);
  assert.match(message, /relation `ghost`/u);
  assert.ok(!message.includes("`sync-store`"));
});

test("a key from a later release leaves every invariant as it was", async () => {
  const { model, data, text } = await shop();
  const later = {
    ...data,
    questions: [{ id: "q1", statements: ["sync"] }],
    evidence: data.evidence.map((row) => ({ ...row, lines: 120, strength: "strong" })),
    statements: { ...data.statements, texts: [{ id: "t1", text: "A written statement." }] },
  };
  requireReaderIds(model, text);
  requireFaces(later);
  requireProjections(later);
});

test("the models of two real works, read without a checkout, pass every invariant", async () => {
  for (const file of [AIGW_MODEL, SELF_MODEL]) {
    const loaded = await loadModel(file);
    const { model } = loaded;
    const views = await planViews(model, async (view) => ({
      fits: view.origin !== "complete" || !model.groups.length,
      width: 2400,
      height: 1350,
    }));
    const binding = bindSources(model, null);
    const layer = editionFacts(model, binding, null);
    const facts = [...layer.all(), ...views.flatMap((view) => layer.view(view).all())];
    const evidence = evidenceTable({ records: binding.records, citations: CITATIONS });
    const data = editionData({
      delivery: DELIVERY,
      publisher: PUBLISHER,
      model,
      file: {
        sha256: loaded.sha256,
        bytes: loaded.bytes,
        format: MODEL_FORMAT,
        version: MODEL_VERSION,
      },
      state: binding.state,
      views,
      plates: [],
      facts,
      catalogue: CATALOGUE,
      evidence,
      guide: GUIDE,
      media: ["page"],
    });
    const written = serializeData(data);
    const text = readerFile(data, { sha256: sha256(written), guide: null }).toString();
    requireReaderIds(model, text);
    requireFaces(data);
    requireProjections(data);
    const parsed = readerIds(text, model.locale);
    assert.deepEqual(
      [...parsed.stated.components].sort(),
      model.components.map(({ id }) => id).sort(),
    );
    assert.deepEqual(
      [...parsed.stated.relations].sort(),
      model.relations.map(({ id }) => id).sort(),
    );
    assert.deepEqual([...parsed.stated.groups].sort(), model.groups.map(({ id }) => id).sort());
    assert.equal(written, serializeData(JSON.parse(written)));
  }
});
