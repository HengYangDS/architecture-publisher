import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, checkModel, digestTree } from "../packages/publisher/src/build.mjs";
import { acceptDelivery, publishDelivery } from "../packages/publisher/src/delivery.mjs";
import {
  BIG_BANK_MODEL,
  minimalModel,
  temporaryDirectory,
  writeModel,
} from "./fixtures/models.mjs";
import { repository } from "./fixtures/repository.mjs";

async function workspace(t) {
  const root = await temporaryDirectory("archpub-delivery-");
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));

test("a delivery holds every poster, the map and a manifest of their digests", async (t) => {
  const root = await workspace(t);
  const out = path.join(root, "first");
  const built = await buildDelivery(BIG_BANK_MODEL, out);
  assert.deepEqual(built.views, ["containers-tiers", "containers-automatic"]);
  const manifest = await readJson(path.join(out, "manifest.json"));
  assert.equal(manifest.format, "architecture-publisher.delivery");
  assert.equal(manifest.model.id, "big-bank");
  assert.equal(manifest.sources.state, "none");
  assert.deepEqual(Object.keys(manifest.supplies), ["fonts", "icons", "resvg", "archify"]);
  assert.deepEqual(
    manifest.artifacts.map(({ path: file }) => file),
    [
      "containers-automatic-6000.png",
      "containers-automatic.png",
      "containers-automatic.svg",
      "containers-tiers-6000.png",
      "containers-tiers.png",
      "containers-tiers.svg",
      "index.html",
    ],
  );
  assert.deepEqual(manifest.artifacts, await digestTree(out, new Set(["manifest.json"])));
  assert.equal(manifest.views[0].poster.crossings, 0);
  assert.deepEqual(manifest.map, { checks: 9, profile: "showcase", crossings: 0, corridors: 0 });
  assert.equal(built.artifacts, 7);
  const second = path.join(root, "second");
  await buildDelivery(BIG_BANK_MODEL, second);
  assert.ok(
    (await fs.readFile(path.join(out, "manifest.json"))).equals(
      await fs.readFile(path.join(second, "manifest.json")),
    ),
  );
  await assert.rejects(buildDelivery(BIG_BANK_MODEL, out), { code: "delivery_exists" });
});

test("check reports the plan without writing and invalid models leave no partial output", async (t) => {
  const root = await workspace(t);
  const checked = await checkModel(BIG_BANK_MODEL);
  assert.equal(checked.model.id, "big-bank");
  assert.deepEqual(checked.sources, { state: "none", count: 0 });
  assert.equal(checked.views.length, 2);
  const bad = await writeModel(
    minimalModel({ relations: [{ id: "x", from: "a", to: "zz", label: "y" }] }),
  );
  await assert.rejects(buildDelivery(bad, path.join(root, "never")), { code: "model_invalid" });
  assert.deepEqual(await fs.readdir(root), []);
});

test("a checkout whose origin is the model's repository links the map to its sources", async (t) => {
  const { root: checkout, git, revision } = await repository(t);
  const url = "https://example.invalid/fixture.git";
  git("remote", "add", "origin", url);
  const model = await writeModel(
    minimalModel({
      repository: { name: "fixture", url, revision },
      sources: { main: { path: "src/main.mjs" } },
      components: [
        { id: "a", label: "Alpha", sources: ["main"] },
        { id: "b", label: "Beta" },
      ],
    }),
  );
  const out = path.join(await workspace(t), "linked");
  await buildDelivery(model, out, { repo: checkout });
  const manifest = await readJson(path.join(out, "manifest.json"));
  assert.equal(manifest.sources.state, "verified");
  assert.equal(manifest.map.profile, "showcase");
  const map = await fs.readFile(path.join(out, "index.html"), "utf8");
  assert.ok(map.includes('[{"path":"src/main.mjs"}]'));
  assert.ok(map.includes('"linkMode":"local-only"'));
});

test("acceptance and publication require an unchanged delivery", async (t) => {
  const root = await workspace(t);
  const out = path.join(root, "delivery");
  await buildDelivery(await writeModel(minimalModel()), out);
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

  await fs.writeFile(path.join(out, "architecture.svg"), "<svg/>");
  await assert.rejects(
    acceptDelivery(out, { reviewer: "Reviewer" }),
    (error) =>
      error.code === "delivery_changed" &&
      /architecture\.svg changed/u.test(error.problems[0].message),
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
  await fs.writeFile(path.join(root, "manifest.json"), JSON.stringify({ format: "other" }));
  await assert.rejects(acceptDelivery(root, { reviewer: "Reviewer" }), {
    code: "delivery_manifest_invalid",
  });
  const out = path.join(root, "delivery");
  await buildDelivery(await writeModel(minimalModel()), out);
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
