import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, checkModel, digestTree } from "../src/build.mjs";
import { acceptDelivery, publishDelivery } from "../src/delivery.mjs";
import {
  BIG_BANK_MODEL,
  minimalModel,
  pageModel,
  temporaryDirectory,
  writeModel,
} from "./fixtures/models.mjs";
import { repository } from "./fixtures/repository.mjs";

const workspace = (t) => temporaryDirectory(t, "archpub-delivery-");

const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const INDIGO = { "zh-CN": "靛蓝", en: "Indigo" };
/** 苏芳 sappan, one of the researched traditional palettes, given as a model's own. */
const SAPPAN = {
  ground: "#f6f1f1",
  ink: "#312124",
  dye: ["#e2c5cf", "#b38294", "#76475c"],
  accent: "#306751",
};

test("a delivery holds the print edition, its images, the page and a manifest of their digests", async (t) => {
  const root = await workspace(t);
  const out = path.join(root, "first");
  const built = await buildDelivery(BIG_BANK_MODEL, out);
  assert.deepEqual(built.views, ["containers-tiers", "containers-automatic"]);
  const manifest = await readJson(path.join(out, "manifest.json"));
  assert.equal(manifest.format, "architecture-publisher.delivery");
  assert.equal(manifest.version, 7);
  // Without a checkout no part has a strip, so the edition draws cards, in the default palette.
  const { marks, palette, names, bands } = manifest.style;
  assert.deepEqual([marks, palette, names, bands], ["card", "indigo", INDIGO, null]);
  assert.deepEqual(
    built.warnings.map(({ code }) => code),
    ["marks_fallback"],
  );
  assert.deepEqual([manifest.quality, manifest.media], ["showcase", ["edition", "page"]]);
  assert.equal(manifest.model.locale, "en");
  assert.equal(manifest.model.id, "big-bank");
  assert.equal(manifest.sources.state, "none");
  assert.deepEqual(Object.keys(manifest.supplies), [
    "fonts",
    "house",
    "opentype",
    "icons",
    "archify",
  ]);
  assert.deepEqual(
    manifest.artifacts.map(({ path: file }) => file),
    [
      "big-bank.html",
      "big-bank.pdf",
      "images/01-containers-tiers.png",
      "images/02-containers-automatic.png",
    ],
  );
  assert.deepEqual(manifest.artifacts, await digestTree(out, new Set(["manifest.json"])));
  // The edition is named for the work; each plate's image is named for its number and view.
  assert.deepEqual([manifest.edition.file, manifest.edition.pages], ["big-bank.pdf", 4]);
  assert.equal(manifest.page.file, "big-bank.html");
  // Neither of Big Bank's views has a summary, and both figures span the body.
  assert.deepEqual(
    manifest.plates.map(({ share, reading }) => [share, reading]),
    [
      [1, "none"],
      [1, "none"],
    ],
  );
  assert.deepEqual(
    manifest.plates.map(({ page, views, images }) => [page, views, images]),
    [
      [1, ["containers-tiers"], [{ width: 2400, file: "images/01-containers-tiers.png" }]],
      [2, ["containers-automatic"], [{ width: 2400, file: "images/02-containers-automatic.png" }]],
    ],
  );
  assert.deepEqual(
    manifest.views.map(({ plate }) => plate),
    [1, 2],
  );
  for (const plate of manifest.plates) {
    assert.equal(plate.measures.crossings, 0, plate.views[0]);
    // Balance is recorded, not required: a plate lists each gate it misses, or none.
    assert.ok(plate.misses === undefined || plate.misses.length > 0, plate.views[0]);
  }
  assert.equal(manifest.page.quality, "showcase");
  assert.deepEqual(
    manifest.page.diagrams.map(({ view }) => view),
    ["containers-tiers", "containers-automatic"],
  );
  for (const diagram of manifest.page.diagrams) {
    assert.ok(["grid", "archify"].includes(diagram.sides), diagram.view);
    assert.ok(Array.isArray(diagram.resided), diagram.view);
    assert.ok(Array.isArray(diagram.pinned), diagram.view);
    assert.equal(diagram.metrics.corridors, 0, diagram.view);
    for (const defect of ["tangles", "joins", "hugs", "mislabels", "doubles", "labels", "crowded"])
      assert.ok(Number.isInteger(diagram.metrics[defect]), `${diagram.view} ${defect}`);
  }
  // Every Big Bank tiered candidate misreads, which map-choice covers; the
  // other view reads as drawn.
  const automatic = manifest.page.diagrams[1].metrics;
  assert.equal(automatic.tangles + automatic.joins + automatic.hugs, 0);
  assert.deepEqual(manifest.page.withheld, []);
  // The evidence the drawings leave out stays in the manifest.
  const customer = manifest.evidence.components.find(({ id }) => id === "customer");
  assert.equal(customer.kind, "person");
  assert.equal(typeof customer.details, "object");
  assert.equal(manifest.evidence.relations.length, 10);
  assert.equal(built.artifacts, 4);
  // Without the checkout, the edition is dated when it is typeset; with SOURCE_DATE_EPOCH, two builds are the same
  // bytes.
  assert.equal(manifest.edition.dated, "typesetting");
  const second = path.join(root, "second");
  const third = path.join(root, "third");
  process.env.SOURCE_DATE_EPOCH = "1793918078";
  try {
    await buildDelivery(BIG_BANK_MODEL, second);
    await buildDelivery(BIG_BANK_MODEL, third);
  } finally {
    delete process.env.SOURCE_DATE_EPOCH;
  }
  assert.ok(
    (await fs.readFile(path.join(second, "manifest.json"))).equals(
      await fs.readFile(path.join(third, "manifest.json")),
    ),
  );
  const rebuilt = JSON.parse(await fs.readFile(path.join(second, "manifest.json"), "utf8"));
  assert.equal(rebuilt.edition.dated, "SOURCE_DATE_EPOCH");
  await assert.rejects(buildDelivery(BIG_BANK_MODEL, out), { code: "delivery_exists" });
});

test("a model of five views delivers five plates and five page diagrams", async (t) => {
  // Each view draws the whole page model, so each plate holds the same cards.
  const members = pageModel().components.map(({ id }) => id);
  const ids = ["first", "second", "third", "fourth", "fifth"];
  const views = ids.map((id, index) => ({
    id,
    title: `View ${index + 1}`,
    question: `What does view ${index + 1} show?`,
    members,
  }));
  const out = path.join(await workspace(t), "five");
  const built = await buildDelivery(await writeModel(t, pageModel({ views })), out, { png: [240] });
  assert.deepEqual(built.views, ids);
  const manifest = await readJson(path.join(out, "manifest.json"));
  assert.deepEqual(
    manifest.plates.map(({ views: shown }) => shown),
    ids.map((id) => [id]),
  );
  assert.deepEqual(
    manifest.page.diagrams.map(({ view }) => view),
    ids,
  );
});

test("check reports the plan without writing and invalid models leave no partial output", async (t) => {
  const root = await workspace(t);
  const checked = await checkModel(BIG_BANK_MODEL);
  assert.equal(checked.model.id, "big-bank");
  assert.deepEqual(checked.sources, { state: "none", count: 0 });
  assert.equal(checked.views.length, 2);
  const bad = await writeModel(
    t,
    minimalModel({ relations: [{ id: "x", from: "a", to: "zz", label: "y" }] }),
  );
  await assert.rejects(buildDelivery(bad, path.join(root, "never")), { code: "model_invalid" });
  // Strips are drawn from the files a checkout holds: a model that asks for them without one is refused.
  const strips = await writeModel(t, minimalModel({ edition: { marks: "strip" } }));
  await assert.rejects(checkModel(strips), { code: "marks_need_files" });
  await assert.rejects(buildDelivery(strips, path.join(root, "never")), {
    code: "marks_need_files",
  });
  assert.deepEqual(await fs.readdir(root), []);
});

test("files verified against the checkout are recorded and cited on the page at the model's revision", async (t) => {
  // The checkout has no origin remote: the page names the declared URL and revision.
  const { root: checkout, revision, git } = await repository(t);
  const url = "https://example.invalid/fixture.git";
  const { components, relations } = pageModel();
  const model = await writeModel(
    t,
    pageModel({
      repository: { name: "fixture", url, revision },
      edition: { palette: SAPPAN },
      components: components.map((component, index) =>
        index ? component : { ...component, files: ["src/"] },
      ),
      relations: relations.map((relation, index) =>
        index ? relation : { ...relation, files: ["src/main.mjs"] },
      ),
    }),
  );
  const out = path.join(await workspace(t), "linked");
  // The revision is tagged, so the edition names it as its release.
  git("tag", "v1.2.0");
  await buildDelivery(model, out, { repo: checkout });
  const manifest = await readJson(path.join(out, "manifest.json"));
  assert.equal(manifest.sources.state, "verified");
  assert.deepEqual([manifest.edition.release, manifest.edition.dated], ["v1.2.0", "commit"]);
  assert.match(manifest.edition.date, /^\d{4}-\d{2}-\d{2}$/u);
  // A cited file is recorded once, with its digest, its owner and the relations that cite it.
  assert.deepEqual(
    manifest.sources.records.map(({ path: file, owner, relations: citing, state }) => [
      file,
      owner,
      citing,
      state,
    ]),
    [["src/main.mjs", "client", ["r1"], "verified"]],
  );
  assert.match(manifest.sources.records[0].sha256, /^[0-9a-f]{64}$/u);
  // Each cited file keeps its size and the date of its last change at the pin, and the edition draws its parts from them.
  assert.equal(typeof manifest.sources.records[0].bytes, "number");
  // The change date is the commit's UTC day; the edition's date is the committer's own, which may differ by one.
  const changedAt = Number(git("log", "-1", "--format=%ct", "--", "src/main.mjs"));
  assert.equal(
    manifest.sources.records[0].changed,
    new Date(changedAt * 1000).toISOString().slice(0, 10),
  );
  // The edition draws strips by default, in the model's own palette, with the fixed bands dated by the pin's day as
  // its committer recorded it, the day the edition's foot prints.
  assert.deepEqual(manifest.style, {
    marks: "strip",
    palette: "custom",
    names: null,
    roles: SAPPAN,
    bands: {
      spans: [7 * 86400, 90 * 86400],
      reference: git("show", "-s", "--format=%cs", revision),
    },
  });
  assert.equal(manifest.page.quality, "showcase");
  assert.deepEqual(manifest.evidence.components[0].files, ["src/"]);
  assert.deepEqual(manifest.evidence.relations[0].files, ["src/main.mjs"]);
  const page = await fs.readFile(path.join(out, "page.html"), "utf8");
  assert.ok(page.includes(`"repository":{"url":"${url}","revision":"${revision}"}`));
  // A component's first file is the first file its first claim holds at the revision.
  assert.ok(page.includes('"sources":[{"id":"source-1","title":"Customer","path":"src/main.mjs"}'));
});

test("acceptance and publication require an unchanged delivery", async (t) => {
  const root = await workspace(t);
  const out = path.join(root, "delivery");
  await buildDelivery(await writeModel(t, pageModel()), out);
  await assert.rejects(acceptDelivery(out, { reviewer: " " }), {
    code: "acceptance_reviewer_missing",
  });
  await assert.rejects(publishDelivery(out, path.join(root, "published")), {
    code: "publish_unaccepted",
  });
  const accepted = await acceptDelivery(out, { reviewer: "Reviewer", note: "Looks right." });
  const record = await readJson(path.join(out, "acceptance.json"));
  assert.equal(record.manifest, accepted.manifest);
  assert.equal(record.note, "Looks right.");
  await assert.rejects(acceptDelivery(out, { reviewer: "Reviewer" }), {
    code: "acceptance_exists",
  });

  const published = await publishDelivery(out, path.join(root, "published"));
  assert.equal(published.copied, true);
  assert.equal(published.version, accepted.manifest.slice(0, 12));
  assert.deepEqual(await digestTree(published.target), await digestTree(out));
  assert.equal((await publishDelivery(out, path.join(root, "published"))).copied, false);
  await assert.rejects(publishDelivery(out, path.join(root, "published"), { version: "../up" }), {
    code: "publish_version_invalid",
  });
  await fs.writeFile(path.join(published.target, "extra.txt"), "foreign");
  await assert.rejects(publishDelivery(out, path.join(root, "published")), {
    code: "publish_conflict",
  });

  const [image] = await fs.readdir(path.join(out, "images"));
  await fs.writeFile(path.join(out, "images", image), "changed");
  await assert.rejects(
    acceptDelivery(out, { reviewer: "Reviewer" }),
    (error) =>
      error.code === "delivery_changed" &&
      error.problems[0].message.includes(`images/${image} changed`),
  );
  await fs.writeFile(path.join(out, "stray.txt"), "stray");
  await fs.rm(path.join(out, "page.html"));
  await assert.rejects(publishDelivery(out, path.join(root, "other")), (error) => {
    const messages = error.problems.map(({ message }) => message);
    return (
      error.code === "delivery_changed" &&
      messages.includes("page.html is missing") &&
      messages.includes("stray.txt is not in the manifest")
    );
  });
});

test("deliveries need their own manifest, acceptance and plain files", async (t) => {
  const root = await workspace(t);
  await assert.rejects(acceptDelivery(root, { reviewer: "Reviewer" }), {
    code: "delivery_manifest_missing",
  });
  await fs.writeFile(path.join(root, "manifest.json"), "{");
  await assert.rejects(acceptDelivery(root, { reviewer: "Reviewer" }), {
    code: "delivery_manifest_invalid",
  });
  await fs.writeFile(path.join(root, "manifest.json"), JSON.stringify({ format: "other" }));
  await assert.rejects(acceptDelivery(root, { reviewer: "Reviewer" }), {
    code: "delivery_manifest_invalid",
  });
  const out = path.join(root, "delivery");
  await buildDelivery(await writeModel(t, pageModel()), out);
  await fs.writeFile(
    path.join(out, "acceptance.json"),
    JSON.stringify({ manifest: "0".repeat(64) }),
  );
  await assert.rejects(publishDelivery(out, path.join(root, "published")), {
    code: "publish_unaccepted",
  });
  await fs.symlink("page.html", path.join(out, "alias.html"));
  await assert.rejects(digestTree(out), { code: "delivery_entry_invalid" });
});
