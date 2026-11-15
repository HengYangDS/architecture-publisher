import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, checkModel } from "../src/build.mjs";
import { editionRecord } from "../src/edition/record.mjs";
import { editionWordsOf } from "../src/edition/words.mjs";
import { editionFacts } from "../src/facts/edition.mjs";
import { validateModel } from "../src/model/load.mjs";
import { bindSources } from "../src/sources/bind.mjs";
import { commitDate, commitOf, commitTime, releaseOf } from "../src/sources/git.mjs";
import { editionStyle } from "../src/style.mjs";
import { minimalModel, pageModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";
import { repository } from "./fixtures/repository.mjs";
import { icons, platesIn } from "./fixtures/strips.mjs";

// The pin is read once, from the commit facts, before the edition's marks are chosen.

const URL = "https://example.invalid/fixture.git";
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));

/** Build the print edition of a model at a checkout and read its manifest. */
async function manifestOf(t, model, checkout) {
  const out = path.join(await temporaryDirectory(t, "archpub-pin-"), "delivery");
  await buildDelivery(await writeModel(t, model), out, { repo: checkout, media: ["edition"] });
  const manifest = await readJson(path.join(out, "manifest.json"));
  // The record of each file read at the pin stands in the data the manifest names.
  const { evidence } = await readJson(path.join(out, manifest.data.file));
  return { ...manifest, evidence };
}

test("a revision the checkout lacks is refused before the marks are chosen", async (t) => {
  const { root: checkout } = await repository(t);
  // The model claims and cites no file, so no file is bound at the revision; it asks for strips.
  const model = await writeModel(
    t,
    minimalModel({
      repository: { name: "fixture", url: URL, revision: "f".repeat(40) },
      edition: { marks: "strip" },
    }),
  );
  await assert.rejects(checkModel(model, { repo: checkout }), { code: "source_revision_unknown" });
});

test("an edition whose parts claim files is dated by the pin's commit in its key's record and its manifest", async (t) => {
  const { root: checkout, revision, git } = await repository(t);
  const date = git("show", "-s", "--format=%cs", revision);
  const { components } = pageModel();
  const manifest = await manifestOf(
    t,
    pageModel({
      repository: { name: "fixture", url: URL, revision },
      components: components.map((component, index) =>
        index ? component : { ...component, files: ["src/"] },
      ),
    }),
    checkout,
  );
  assert.equal(manifest.style.marks, "strip");
  // The key's commit date and the bands' spans, as the style records them.
  assert.deepEqual(manifest.style.bands, { spans: [7 * 86400, 90 * 86400], reference: date });
  assert.deepEqual(
    [manifest.edition.date, manifest.edition.dated, manifest.edition.release],
    [date, "commit", null],
  );
  // The one file was last changed by the pin's commit: its record names the commit's UTC day.
  const time = Number(git("show", "-s", "--format=%ct", revision));
  assert.deepEqual(
    manifest.evidence.map(({ path: file, changed }) => [file, changed]),
    [["src/main.mjs", new Date(time * 1000).toISOString().slice(0, 10)]],
  );
});

test("an edition whose model cites no file is dated by the pin's commit all the same, and draws cards", async (t) => {
  const { root: checkout, revision, git } = await repository(t);
  const date = git("show", "-s", "--format=%cs", revision);
  git("tag", "v0.3.0");
  const manifest = await manifestOf(
    t,
    pageModel({ repository: { name: "fixture", url: URL, revision } }),
    checkout,
  );
  assert.deepEqual([manifest.sources.state, manifest.style.marks], ["none", "card"]);
  assert.equal(manifest.style.bands, null);
  assert.deepEqual(
    [manifest.edition.date, manifest.edition.dated, manifest.edition.release],
    [date, "commit", "v0.3.0"],
  );
});

/** The model's layer at a checkout, from the pin's commit facts read once as the build reads them. */
function layerAt(model, checkout) {
  const commit = commitOf(checkout, model.repository.revision, "source_revision_unknown");
  return editionFacts(model, bindSources(model, checkout), {
    date: commitDate(checkout, commit),
    time: commitTime(checkout, commit),
    release: releaseOf(checkout, commit),
  });
}

/** The foot the edition's record words for a model from a layer. */
const footOf = (model, facts, plates) =>
  editionRecord({
    model,
    plates,
    icons,
    facts,
    modelSha256: "0".repeat(64),
    publisher: "0.14.0",
    typst: "0.15.1",
    overview: false,
    page: `${model.id}.html`,
    time: null,
  }).words.foot;

test("the key and the foot name the pin's date as its committer recorded it, with files claimed and with none", async (t) => {
  const { root: checkout, revision, git } = await repository(t);
  const date = git("show", "-s", "--format=%cs", revision);
  const { components } = pageModel();
  const claiming = validateModel(
    pageModel({
      repository: { name: "fixture", url: URL, revision },
      components: components.map((component, index) =>
        index ? component : { ...component, files: ["src/"] },
      ),
    }),
  );
  const facts = layerAt(claiming, checkout);
  const { style, record } = editionStyle(claiming, facts);
  assert.equal(record.bands.reference, date);
  const { plates } = await platesIn(claiming, style);
  const words = editionWordsOf(claiming.locale);
  // The key dates the bands of the one part that owns a file; the foot prints the same day beside the commit.
  const dated = plates.flatMap(({ legend }) => legend.filter(({ shape }) => shape === "reference"));
  assert.deepEqual([...new Set(dated.map((entry) => entry.date))], [date]);
  const short = revision.slice(0, 7);
  assert.equal(footOf(claiming, facts, plates), words.foot(claiming.title, null, short, date));
  // A model that claims and cites no file binds nothing at the checkout; its edition is dated all the same.
  const bare = validateModel(pageModel({ repository: { name: "fixture", url: URL, revision } }));
  const unbound = layerAt(bare, checkout);
  assert.equal(editionStyle(bare, unbound).style.name, "card");
  assert.equal(footOf(bare, unbound, []), words.foot(bare.title, null, short, date));
});
