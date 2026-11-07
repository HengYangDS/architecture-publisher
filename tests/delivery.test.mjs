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

test("a delivery holds every poster, the page and a manifest of their digests", async (t) => {
  const root = await workspace(t);
  const out = path.join(root, "first");
  const built = await buildDelivery(BIG_BANK_MODEL, out);
  assert.deepEqual(built.views, ["containers-tiers", "containers-automatic"]);
  const manifest = await readJson(path.join(out, "manifest.json"));
  assert.equal(manifest.format, "architecture-publisher.delivery");
  assert.equal(manifest.version, 5);
  assert.deepEqual([manifest.quality, manifest.media], ["showcase", ["posters", "page"]]);
  assert.equal(manifest.model.locale, "en");
  assert.equal(manifest.model.id, "big-bank");
  assert.equal(manifest.sources.state, "none");
  assert.deepEqual(Object.keys(manifest.supplies), [
    "fonts",
    "house",
    "opentype",
    "icons",
    "resvg",
    "archify",
  ]);
  assert.deepEqual(
    manifest.artifacts.map(({ path: file }) => file),
    ["index.html", "page-1.png", "page-1.svg", "page-2.png", "page-2.svg"],
  );
  assert.deepEqual(manifest.artifacts, await digestTree(out, new Set(["manifest.json"])));
  // Poster files are named by page number, and each page lists its files and views.
  assert.deepEqual(
    manifest.posters.map(({ page, svg, png, views }) => [page, svg, png, views]),
    [
      [1, "page-1.svg", [{ width: 2400, file: "page-1.png" }], ["containers-tiers"]],
      [2, "page-2.svg", [{ width: 2400, file: "page-2.png" }], ["containers-automatic"]],
    ],
  );
  assert.deepEqual(
    manifest.views.map(({ poster }) => poster),
    [1, 2],
  );
  for (const poster of manifest.posters) {
    assert.equal(poster.measures.crossings, 0, poster.svg);
    // Balance is recorded, not required: Big Bank's first page is sparse since its limits grew.
    assert.ok(["balanced", "sparse"].includes(poster.admission), poster.svg);
    // A balanced page records no miss; a sparse one records each gate it misses.
    assert.equal(poster.misses === undefined, poster.admission === "balanced", poster.svg);
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
  assert.equal(built.artifacts, 5);
  const second = path.join(root, "second");
  await buildDelivery(BIG_BANK_MODEL, second);
  assert.ok(
    (await fs.readFile(path.join(out, "manifest.json"))).equals(
      await fs.readFile(path.join(second, "manifest.json")),
    ),
  );
  await assert.rejects(buildDelivery(BIG_BANK_MODEL, out), { code: "delivery_exists" });
});

test("a model of five views delivers five posters and five page diagrams", async (t) => {
  // Each view draws the whole page model, since fewer cards fill no poster page.
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
    manifest.posters.map(({ views: shown }) => shown),
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
  assert.deepEqual(await fs.readdir(root), []);
});

test("files verified against the checkout are recorded and cited on the page at the model's revision", async (t) => {
  // The checkout has no origin remote: the page names the declared URL and revision.
  const { root: checkout, revision } = await repository(t);
  const url = "https://example.invalid/fixture.git";
  const { components, relations } = pageModel();
  const model = await writeModel(
    t,
    pageModel({
      repository: { name: "fixture", url, revision },
      components: components.map((component, index) =>
        index ? component : { ...component, files: ["src/"] },
      ),
      relations: relations.map((relation, index) =>
        index ? relation : { ...relation, files: ["src/main.mjs"] },
      ),
    }),
  );
  const out = path.join(await workspace(t), "linked");
  await buildDelivery(model, out, { repo: checkout });
  const manifest = await readJson(path.join(out, "manifest.json"));
  assert.equal(manifest.sources.state, "verified");
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
  assert.equal(manifest.page.quality, "showcase");
  assert.deepEqual(manifest.evidence.components[0].files, ["src/"]);
  assert.deepEqual(manifest.evidence.relations[0].files, ["src/main.mjs"]);
  const page = await fs.readFile(path.join(out, "index.html"), "utf8");
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

  await fs.writeFile(path.join(out, "page-1.svg"), "<svg/>");
  await assert.rejects(
    acceptDelivery(out, { reviewer: "Reviewer" }),
    (error) =>
      error.code === "delivery_changed" && /page-1\.svg changed/u.test(error.problems[0].message),
  );
  await fs.writeFile(path.join(out, "stray.txt"), "stray");
  await fs.rm(path.join(out, "index.html"));
  await assert.rejects(publishDelivery(out, path.join(root, "other")), (error) => {
    const messages = error.problems.map(({ message }) => message);
    return (
      error.code === "delivery_changed" &&
      messages.includes("index.html is missing") &&
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
  await fs.symlink("index.html", path.join(out, "alias.html"));
  await assert.rejects(digestTree(out), { code: "delivery_entry_invalid" });
});
