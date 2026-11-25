import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, checkModel, digestTree } from "../src/build.mjs";
import { pinnedEdition } from "../src/projection.mjs";
import { parsedGuide } from "../src/map/guide-parse.mjs";
import { acceptDelivery, compareDeliveries, publishDelivery } from "../src/delivery.mjs";
import { editionFacts } from "../src/facts/edition.mjs";
import { archifyIds } from "../src/map/archify.mjs";
import { bindSources } from "../src/sources/bind.mjs";
import { json } from "./fixtures/command-line.mjs";
import { minimalModel, pageModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";
import { groupedWork } from "./fixtures/pinned-face.mjs";
import { README, repository } from "./fixtures/repository.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const DIAGRAM = "parts.architecture.json";

/** A guide beside a model: a draft that cites the checkout's read-me, and one diagram whose nodes cite files. */
const DRAFT = Buffer.from(
  [
    "# How does a request reach its store? {#guide}",
    "",
    "It passes the gate.[](source:readme)",
    "",
    "@meta locale=en",
    '@source readme title="Read me" path="README.md" lines=1:1',
    "",
    "## Which parts take part? {#p-parts}",
    "",
    `@diagram architecture id=parts-map source=${DIAGRAM}`,
    "",
    "- component `ghost`: a part the model lacks",
    "",
  ].join("\n"),
);
const FIGURE = {
  diagram_type: "architecture",
  components: [
    { id: "parts-client", label: "Client", sources: [{ path: "src/main.mjs", line: 1 }] },
    { id: "parts-readme", label: "Read me", sources: [{ path: "README.md" }] },
  ],
  connections: [{ id: "c1", from: "parts-client", to: "parts-readme" }],
};

/** The page model with its first component claiming `src/` and its first relation citing a file there. */
function citingModel(extra = {}) {
  const { components, relations } = pageModel();
  return pageModel({
    components: components.map((component, index) =>
      index ? component : { ...component, files: ["src/"] },
    ),
    relations: relations.map((relation, index) =>
      index ? relation : { ...relation, files: ["src/main.mjs"] },
    ),
    ...extra,
  });
}

/** Write a model with the guide beside it, and return the model's path. */
async function guidedModel(t, model) {
  const file = await writeModel(t, { ...model, guide: "guide/guide.archify.md" });
  const guide = path.join(path.dirname(file), "guide");
  await fs.mkdir(guide);
  await fs.writeFile(path.join(guide, "guide.archify.md"), DRAFT);
  await fs.writeFile(path.join(guide, DIAGRAM), JSON.stringify(FIGURE));
  return file;
}

test("a delivery holds the model, the data and the reader file, and its manifest names and seals them", async (t) => {
  const { root: checkout, revision } = await repository(t);
  const repositoryOf = { name: "fixture", url: "https://example.invalid/fixture.git", revision };
  const model = await guidedModel(t, citingModel({ repository: repositoryOf }));
  const root = await temporaryDirectory(t, "archpub-data-");
  const [out, again] = [path.join(root, "first"), path.join(root, "second")];
  const options = { repo: checkout, media: ["edition"], png: [240] };
  const built = await buildDelivery(model, out, options);
  await buildDelivery(model, again, options);
  const manifest = await readJson(path.join(out, "manifest.json"));
  // The three files stand at the top of the delivery, listed with their digests like every other file, the
  // plate's figure set alone among them.
  assert.deepEqual(
    manifest.artifacts.map(({ path: file }) => file),
    [
      "figures/01-architecture.png",
      "figures/01-architecture.svg",
      "images/01-architecture-240.png",
      "model.json",
      "page.json",
      "page.md",
      "page.pdf",
    ],
  );
  assert.deepEqual(manifest.artifacts, await digestTree(out, new Set(["manifest.json"])));
  assert.equal(built.artifacts, 7);
  // The delivered model is the bytes the build read, under the digest the manifest states for the model.
  const delivered = await fs.readFile(path.join(out, "model.json"));
  assert.ok(delivered.equals(await fs.readFile(model)));
  assert.equal(sha256(delivered), manifest.model.sha256);
  assert.equal(manifest.version, 9);
  assert.deepEqual(
    [manifest.model.file, manifest.data.file, manifest.reader.file],
    ["model.json", "page.json", "page.md"],
  );
  // The manifest keeps the binding's state and count; the records and the evidence stand once, in the data.
  assert.deepEqual(manifest.sources, { state: "verified", count: 1 });
  assert.equal("evidence" in manifest, false);
  const data = await readJson(path.join(out, "page.json"));
  assert.deepEqual(data.delivery, { format: manifest.format, version: 9 });
  assert.deepEqual(data.model, {
    file: "model.json",
    sha256: manifest.model.sha256,
    bytes: delivered.length,
    format: "architecture-publisher.model",
    version: 3,
  });
  // A path only the guide cites is read at the pin beside the binding's records.
  const where = (index) => `${DIAGRAM}/components/${index}/sources/0`;
  const [readme, main] = data.evidence;
  assert.deepEqual(
    data.evidence.map(({ path: file, state }) => [file, state]),
    [
      ["README.md", "verified"],
      ["src/main.mjs", "verified"],
    ],
  );
  assert.deepEqual(
    [readme.sha256, readme.bytes, readme.owner, readme.relations],
    [sha256(README), README.length, undefined, []],
  );
  assert.match(readme.changed, /^\d{4}-\d{2}-\d{2}$/u);
  assert.deepEqual(readme.ranges, [
    { lines: [1, 1], where: "@source readme" },
    { where: where(1) },
  ]);
  assert.deepEqual([main.owner, main.relations], ["client", ["r1"]]);
  assert.deepEqual(main.ranges, [{ lines: [1, 1], where: where(0) }]);
  // The guide's figures are matched by the owner of the file each node cites, counted and listed.
  assert.deepEqual(data.guide.figures.nodes, [
    { file: DIAGRAM, id: "parts-client", components: ["client"] },
  ]);
  assert.equal(data.guide.sha256, sha256(DRAFT));
  // No page was built, so no page verified the guide's sources.
  assert.equal(data.guide.sources, "declared");
  // A typeset plate carries its page in the PDF, its frame, its images and the two files of its figure set alone,
  // which the manifest records beside its images too and the reader file names on the view's line.
  const [plate] = data.plates;
  assert.ok(
    Number.isInteger(plate.page) && plate.page >= 1 && plate.page <= manifest.edition.pages,
  );
  assert.deepEqual(plate.images, [{ width: 240, file: "images/01-architecture-240.png" }]);
  assert.deepEqual(Object.keys(plate).slice(0, 5), [
    "number",
    "views",
    "page",
    "images",
    "figures",
  ]);
  const FIGURES = [
    { format: "png", file: "figures/01-architecture.png" },
    { format: "svg", file: "figures/01-architecture.svg" },
  ];
  assert.deepEqual(plate.figures, FIGURES);
  assert.deepEqual(manifest.plates[0].images, plate.images);
  assert.deepEqual(manifest.plates[0].figures, FIGURES);
  const page = await fs.readFile(path.join(out, "page.md"), "utf8");
  assert.ok(
    page.includes(
      "- view `architecture` · plate 1 · `images/01-architecture-240.png` · `figures/01-architecture.png` · `figures/01-architecture.svg`\n",
    ),
  );
  assert.match(page, /`page\.pdf`, `images\/`, `figures\/`, `manifest\.json`$/mu);
  assert.equal(plate.frame.pixelsPerPoint, 1.5);
  assert.deepEqual(data.media, ["edition"]);
  // The manifest states the data's counts, and the reader file's size and number of statements.
  const { components, relations, groups } = data.statements;
  assert.deepEqual(manifest.data.statements, {
    components: components.length,
    relations: relations.length,
    groups: groups.length,
    cited: 2,
    unchecked: 0,
    uncited: components.length + relations.length - 2,
  });
  assert.deepEqual(
    [manifest.data.facts, manifest.data.evidence],
    [data.facts.length, { paths: 2, ranges: 3 }],
  );
  assert.deepEqual(manifest.data.figures, {
    state: "verified",
    matched: { nodes: 1, connections: 0 },
    unmatched: {
      nodes: [{ file: DIAGRAM, id: "parts-readme" }],
      connections: [{ file: DIAGRAM, id: "c1", from: "parts-client", to: "parts-readme" }],
    },
  });
  const reader = await fs.readFile(path.join(out, "page.md"));
  assert.deepEqual(manifest.reader, {
    file: "page.md",
    bytes: reader.length,
    statements: components.length + relations.length + groups.length,
  });
  // The reader file states the data's digest and ends with the guide as prose, no line of its syntax left.
  assert.ok(reader.includes(sha256(await fs.readFile(path.join(out, "page.json")))));
  const text = reader.toString("utf8");
  assert.ok(text.includes("\n## The guide\n\n"));
  assert.ok(!/^@|\[\]\(|\{#/mu.test(text.slice(text.indexOf("\n## The guide\n"))));
  // Two builds of one state give the same bytes, file for file.
  for (const file of ["model.json", "page.json", "page.md", "manifest.json"])
    assert.ok(
      (await fs.readFile(path.join(out, file))).equals(await fs.readFile(path.join(again, file))),
      file,
    );
  // The comparison covers every file the manifests list, so the two builds wrote the same bytes of both figures.
  assert.equal((await compareDeliveries(out, again)).identical, true);
  // What verifies a delivery covers the three files with no change of its own: a comparison and an acceptance
  // refuse a delivery in which one of them changed.
  for (const file of ["model.json", "page.json", "page.md"]) {
    const kept = await fs.readFile(path.join(again, file));
    await fs.writeFile(path.join(again, file), "changed");
    const changed = (error) =>
      error.code === "delivery_changed" &&
      error.problems.some(({ message }) => message === `${file} changed`);
    await assert.rejects(compareDeliveries(out, again), changed);
    await assert.rejects(acceptDelivery(again, { reviewer: "Reviewer" }), changed);
    await fs.writeFile(path.join(again, file), kept);
  }
  // An accepted delivery is published with the three files, byte for byte.
  await acceptDelivery(out, { reviewer: "Reviewer" });
  const published = await publishDelivery(out, path.join(root, "published"));
  for (const file of ["model.json", "page.json", "page.md"])
    assert.ok(
      (await fs.readFile(path.join(published.target, file))).equals(
        await fs.readFile(path.join(out, file)),
      ),
      file,
    );
  // A delivery of an earlier release holds none of the three and still verifies: compared with this one, the
  // comparison lists the manifest and the three files it lacks, and no plate.
  for (const file of ["model.json", "page.json", "page.md"]) await fs.rm(path.join(again, file));
  const { data: counted, reader: read, ...earlier } = { ...manifest, version: 7 };
  earlier.artifacts = await digestTree(again, new Set(["manifest.json"]));
  await fs.writeFile(path.join(again, "manifest.json"), JSON.stringify(earlier));
  const compared = await compareDeliveries(again, out);
  assert.deepEqual([counted.file, read.file, compared.plates], ["page.json", "page.md", []]);
  assert.deepEqual(
    compared.files.map(({ path: file, first }) => [file, first === null]),
    [
      ["manifest.json", false],
      ["model.json", true],
      ["page.json", true],
      ["page.md", true],
    ],
  );
  // The commands take an earlier release's delivery as they did before this version: it is accepted and published
  // with nothing refused for its version, its manifest is not rewritten, and it gains none of the three files.
  const stated = await fs.readFile(path.join(again, "manifest.json"));
  const accepted = await json(["accept", again, "--reviewer", "Reviewer"]);
  assert.deepEqual(
    [accepted.exitCode, accepted.body.ok, accepted.body.manifest],
    [0, true, sha256(stated)],
  );
  const issued = await json(["publish", again, "--to", path.join(root, "published")]);
  assert.deepEqual([issued.exitCode, issued.body.ok, issued.body.copied], [0, true, true]);
  assert.notEqual(issued.body.target, published.target);
  assert.deepEqual(
    (await digestTree(issued.body.target)).map(({ path: file }) => file),
    [
      "acceptance.json",
      "colophon.pdf",
      "figures/01-architecture.png",
      "figures/01-architecture.svg",
      "images/01-architecture-240.png",
      "manifest.json",
      "page.pdf",
    ],
  );
  assert.ok((await fs.readFile(path.join(issued.body.target, "manifest.json"))).equals(stated));
  assert.equal(JSON.parse(stated.toString("utf8")).version, 7);
});

test("a model named `models` checks and builds, and its delivery holds the model, the data and the reader file apart", async (t) => {
  const model = await writeModel(t, minimalModel({ id: "models" }));
  const out = path.join(await temporaryDirectory(t, "archpub-data-"), "models");
  const options = { media: ["edition"], png: [240] };
  // The refusal is for the four ids that name a file of the delivery alike; `models` names none of them.
  assert.equal((await checkModel(model, options)).model.id, "models");
  await buildDelivery(model, out, options);
  const manifest = await readJson(path.join(out, "manifest.json"));
  assert.deepEqual(
    [manifest.model.file, manifest.data.file, manifest.reader.file],
    ["model.json", "models.json", "models.md"],
  );
  assert.deepEqual((await fs.readdir(out)).filter((name) => /^models?\./u.test(name)).sort(), [
    "model.json",
    "models.json",
    "models.md",
    "models.pdf",
  ]);
  assert.deepEqual(manifest.artifacts, await digestTree(out, new Set(["manifest.json"])));
  // Three files, each its own: the model as the build read it, the data that names it, and the reader file.
  const [read, data, reader] = await Promise.all(
    ["model.json", "models.json", "models.md"].map((file) => fs.readFile(path.join(out, file))),
  );
  assert.ok(read.equals(await fs.readFile(model)));
  const held = JSON.parse(data.toString("utf8"));
  assert.deepEqual([held.work.id, held.model.file], ["models", "model.json"]);
  assert.ok(reader.includes(sha256(data)));
  assert.equal(new Set([read, data, reader].map(sha256)).size, 3);
});

test("a delivery of the page alone holds the three files, and without a checkout no digest, size or date", async (t) => {
  const repositoryOf = { name: "fixture", revision: "0123456789abcdef0123456789abcdef01234567" };
  const root = await temporaryDirectory(t, "archpub-data-");
  const options = { media: ["page"] };
  const build = async (name, model) => {
    const out = path.join(root, name);
    await buildDelivery(await writeModel(t, model), out, options);
    return {
      out,
      manifest: await readJson(path.join(out, "manifest.json")),
      data: await readJson(path.join(out, "page.json")),
    };
  };
  const english = citingModel({ repository: repositoryOf });
  const { out, manifest, data } = await build("en", english);
  assert.deepEqual(
    manifest.artifacts.map(({ path: file }) => file),
    ["model.json", "page.html", "page.json", "page.md"],
  );
  assert.deepEqual(manifest.sources, { state: "unverified", count: 2 });
  // What a build did not measure is absent, and never a zero in its place.
  assert.deepEqual(Object.keys(data.pin), ["repository", "state"]);
  for (const row of data.evidence)
    assert.deepEqual(
      Object.keys(row).filter((key) => key !== "owner"),
      ["path", "state", "relations", "ranges"],
    );
  assert.deepEqual(
    data.evidence.map(({ path: file, state }) => [file, state]),
    [
      ["src/", "unverified"],
      ["src/main.mjs", "unverified"],
    ],
  );
  assert.equal(
    data.facts.some(({ property }) => ["owned-bytes", "pin-date"].includes(property)),
    false,
  );
  // No edition was typeset: the data holds no plate.
  assert.deepEqual([data.plates, data.media], [[], ["page"]]);
  assert.equal("guide" in data, false);
  assert.deepEqual(manifest.data.statements.unchecked, 2);
  // One statement differs: the model, the data, the reader file and the manifest differ with it.
  const relabelled = structuredClone(english);
  relabelled.relations[0].details = { via: ["a changed detail"] };
  const changed = await build("changed", relabelled);
  const compared = await compareDeliveries(out, changed.out);
  const differing = compared.files.map(({ path: file }) => file);
  for (const file of ["manifest.json", "model.json", "page.json", "page.md"])
    assert.ok(differing.includes(file), file);
  // The same work in a second language agrees in every id, fact and row of evidence, and differs in its texts.
  const chinese = await build("zh", {
    ...english,
    locale: "zh-CN",
    title: "页面",
    question: "请求如何到达存储？",
  });
  const ids = ({ statements, views }) => [
    ...Object.values(statements).map((list) => list.map(({ id }) => id)),
    views.map(({ id, components, groups, relations }) => [id, components, groups, relations]),
  ];
  assert.deepEqual(ids(chinese.data), ids(data));
  assert.deepEqual(chinese.data.facts, data.facts);
  assert.deepEqual(chinese.data.evidence, data.evidence);
  assert.deepEqual(chinese.data.catalogue, data.catalogue);
  assert.notEqual(chinese.data.work.title, data.work.title);
  assert.notDeepEqual(
    await fs.readFile(path.join(chinese.out, "page.md")),
    await fs.readFile(path.join(out, "page.md")),
  );
});

test("a model whose id would name two files of a delivery alike is refused by a check and a build", async (t) => {
  const root = await temporaryDirectory(t, "archpub-data-");
  for (const [id, shared] of [
    ["model", "model.json"],
    ["manifest", "manifest.json"],
    ["acceptance", "acceptance.json"],
    ["colophon", "colophon.pdf"],
  ]) {
    const model = await writeModel(t, minimalModel({ id }));
    const named = (error) =>
      error.code === "delivery_name_taken" &&
      error.message.includes(`\`${shared}\``) &&
      error.problems.length === 1 &&
      error.problems[0].path === "/id";
    await assert.rejects(checkModel(model), named, id);
    await assert.rejects(buildDelivery(model, path.join(root, id)), named, id);
  }
  assert.deepEqual(await fs.readdir(root), []);
});

test("a check reports the counts of the data a build would write", async (t) => {
  const { root: checkout, revision } = await repository(t);
  const repositoryOf = { name: "fixture", url: "https://example.invalid/fixture.git", revision };
  const model = await guidedModel(t, citingModel({ repository: repositoryOf }));
  const checked = await checkModel(model, { repo: checkout, media: ["edition"] });
  const { components, relations } = citingModel();
  assert.deepEqual(checked.data.statements, {
    components: components.length,
    relations: relations.length,
    groups: 0,
    cited: 2,
    unchecked: 0,
    uncited: components.length + relations.length - 2,
  });
  assert.deepEqual(checked.data.evidence, { paths: 2, ranges: 3 });
  assert.deepEqual(checked.data.faces, [
    { plate: 1, components: components.length, groups: 0, relations: relations.length },
  ]);
  assert.deepEqual(checked.data.figures.matched, { nodes: 1, connections: 0 });
  assert.ok(checked.data.facts > 0);
  // Without a checkout nothing is read at the pin: the statements that name files are unchecked, no figure matches.
  const unread = await checkModel(model, { media: ["edition"] });
  assert.deepEqual([unread.data.statements.cited, unread.data.statements.unchecked], [0, 2]);
  assert.deepEqual(
    [unread.data.figures.state, unread.data.figures.matched],
    ["unverified", { nodes: 0, connections: 0 }],
  );
  // A guide that is named and absent is refused, whichever media the build delivers.
  const lost = await writeModel(t, { ...citingModel(), guide: "guide/guide.archify.md" });
  await assert.rejects(checkModel(lost, { media: ["edition"] }), { code: "guide_missing" });
});

test("a pinned edition gathered before typesetting carries no page, and a face that lacks a relation refuses it", async () => {
  const work = await groupedWork();
  const binding = bindSources(work.model, null);
  const held = (plates) => ({
    loaded: { content: Buffer.from("{}"), sha256: "0".repeat(64), bytes: 2 },
    model: work.model,
    binding,
    facts: editionFacts(work.model, binding, null),
    views: work.views,
    plates,
    styleRecord: {},
    media: ["edition"],
    overview: null,
    guide: null,
    publisher: "0.0.0",
  });
  const whole = pinnedEdition(held(work.plates), [960]);
  // Nothing was typeset: no face carries a page.
  assert.deepEqual(
    whole.data.plates.map((plate) => "page" in plate),
    [false, false],
  );
  assert.deepEqual(
    pinnedEdition(held(work.plates), [960], [{ number: 2, page: 4 }]).data.plates[1].page,
    4,
  );
  // The drawing's report loses every stretch of one relation: the build is refused, and names the plate.
  const [first, ...rest] = work.plates;
  const victim = first.report.paths[0].relations[0].id;
  const paths = first.report.paths.filter(
    ({ relations }) => !relations.some(({ id }) => id === victim),
  );
  assert.throws(
    () => pinnedEdition(held([{ ...first, report: { ...first.report, paths } }, ...rest]), [960]),
    (error) => error.code === "data_face_differs" && error.problems[0].path === "/plates/1",
  );
  // An overview's page has images and no face; a file of the guide that holds no document is passed over. The
  // guide carries its draft's text and Archify's parse of it, as `guideOf` gives them.
  const guide = {
    text: DRAFT.toString("utf8"),
    document: await parsedGuide(DRAFT.toString("utf8")),
    entries: [
      { name: "guide.archify.md", bytes: DRAFT, sha256: sha256(DRAFT) },
      { name: "empty.json", bytes: Buffer.from("null"), sha256: sha256("null") },
    ],
    citations: [],
    read: new Map(),
  };
  const statement = {
    claim: "A claim.",
    lead: "A lead.",
    course: { steps: [{ id: "a", label: "A" }] },
  };
  const model = { ...work.model, overview: statement, guide: "guide/guide.archify.md" };
  const { data, reader } = pinnedEdition(
    { ...held(work.plates), model, overview: { statement: "5".repeat(64) }, guide },
    [3840, 960],
  );
  assert.deepEqual(data.overview, {
    statement: "5".repeat(64),
    images: [
      { width: 3840, file: "images/00-overview.png" },
      { width: 960, file: "images/00-overview-960.png" },
    ],
    face: false,
  });
  assert.deepEqual(data.guide.figures, {
    state: "unverified",
    nodes: [],
    connections: [],
    unmatched: { nodes: [], connections: [] },
  });
  // The reader file ends with the guide as prose, not its draft: its answer and a footnote, no line of its syntax.
  const read = reader.toString("utf8");
  assert.ok(read.includes("It passes the gate. [^1]"), read.slice(-600));
  assert.ok(!read.includes("@meta") && !read.includes("{#guide}") && !read.includes("](source:"));
  // The page the publisher generates is held to the data by what its diagrams' documents draw.
  const drawing = (view, extra = {}) => {
    const nodes = archifyIds(view.components.map(({ id }) => id));
    const lines = archifyIds(view.relations.map(({ id }) => id));
    const components = [...nodes.values()].map((id) => ({ id }));
    const connections = [...lines.values()].map((id) => ({ id }));
    return { view: view.id, nodes, document: { components, connections, ...extra } };
  };
  const paged = (page) => pinnedEdition({ ...held(work.plates), page }, [960]);
  assert.doesNotThrow(() => paged({ diagrams: work.views.map((view) => drawing(view)) }));
  for (const extra of [{ components: [{ id: "stranger" }] }, { connections: [{ id: "stranger" }] }])
    assert.throws(
      () => paged({ diagrams: [drawing(work.views[0], extra)] }),
      (error) =>
        error.code === "projection_fact_unknown" &&
        error.problems.length === 1 &&
        error.problems[0].message.includes("`stranger`"),
    );
  // A guide is its author's document: its figures are matched and listed, and never held to the model's ids.
  assert.doesNotThrow(() => paged({ kind: "guide" }));
});
