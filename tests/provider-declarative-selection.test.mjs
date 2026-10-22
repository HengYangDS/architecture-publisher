import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as provider from "../packages/publisher/src/provider/declarative-selection.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-v2-files-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "inputs"));
  const native = Buffer.from("native model\n");
  const derived = Buffer.from('{"index":1}\n');
  const nativePath = path.join(root, "inputs/model.src");
  const derivedPath = path.join(root, "inputs/index.json");
  await fs.writeFile(nativePath, native);
  await fs.writeFile(derivedPath, derived);
  const manifest = {
    schema: "architecture.edition-provider/v2",
    provider: { id: "example-provider", revision: "1" },
    selected: {
      native: [
        {
          id: "model",
          namespace: "org.example/service",
          claimant: "source-maintainer",
          format: { id: "example/native", version: "1" },
          revision: { kind: "content", algorithm: "sha256" },
          bytes: native.length,
          sha256: sha(native),
        },
      ],
      derived: [
        {
          id: "index",
          namespace: "org.example/service-index",
          claimant: "adapter-maintainer",
          format: { id: "example/index", version: "1" },
          derivedFrom: ["model"],
          adapter: { id: "native-reader", version: "1", contentSha256: sha("adapter") },
          method: "extract/v1",
          bytes: derived.length,
          sha256: sha(derived),
        },
      ],
      edition: null,
    },
    delivery: {
      kind: "declarative",
      files: [
        { kind: "native", id: "model", path: "inputs/model.src" },
        { kind: "derived", id: "index", path: "inputs/index.json" },
      ],
    },
  };
  const manifestPath = path.join(root, "provider.json");
  const read = async (at = root) => {
    const bytes = Buffer.from(JSON.stringify(manifest) + "\n");
    await fs.writeFile(path.join(at, "provider.json"), bytes);
    return provider.readDeclarativeSelectedInputs(path.join(at, "provider.json"), sha(bytes));
  };
  return { root, native, derived, nativePath, derivedPath, manifest, manifestPath, read };
}

test("declarative Provider reads exact selected bytes and expands native ancestry", async (t) => {
  const f = await fixture(t);
  assert.equal(typeof provider.readDeclarativeSelectedInputs, "function");
  const result = await f.read();
  assert.equal(result.closure, "selected-provider-files-only");
  assert.equal(result.selected.native[0].namespace, "org.example/service");
  assert.equal(result.selected.native[0].claimant, "source-maintainer");
  assert.equal(result.selected.derived[0].claimant, "adapter-maintainer");
  assert.deepEqual(result.selected.derived[0].derivedFrom, [
    { id: "model", namespace: "org.example/service", sha256: sha(f.native) },
  ]);
  assert.equal(Object.hasOwn(result.selected.derived[0], "adapterVerification"), false);
  assert.deepEqual(result.limits, [
    "path-confinement-under-concurrent-mutation-unproved",
    "adapter-code-unverified:index",
  ]);
  assert.deepEqual(result.read("native", "model"), f.native);
  assert.deepEqual(result.read("derived", "index"), f.derived);
  const copy = result.read("native", "model");
  copy[0] = 0;
  assert.deepEqual(result.read("native", "model"), f.native);
  assert.equal(Object.hasOwn(result.selected, "provider"), false);
  assert.equal(Object.hasOwn(result.selected, "delivery"), false);
  assert.equal(result.invocation.provider.id, "example-provider");
  assert.equal(result.invocation.delivery, "declarative");
});

test("changed, absent, or linked selected files fail; unrelated files are not consumed", async (t) => {
  const f = await fixture(t);
  const first = await f.read();
  await fs.writeFile(path.join(f.root, "unselected.txt"), "ambient");
  const unchanged = await f.read();
  assert.deepEqual(unchanged.selected, first.selected);
  await fs.writeFile(f.nativePath, "native drift\n");
  await assert.rejects(f.read(), { code: "edition_provider_v2_member_digest_mismatch" });
  await fs.rm(f.nativePath);
  await assert.rejects(f.read(), { code: "ENOENT" });
  await fs.symlink(f.derivedPath, f.nativePath);
  await assert.rejects(f.read(), { code: "bundle_symlink_forbidden" });
});

test("exact declarative files relocate offline without changing selected contents", async (t) => {
  const f = await fixture(t);
  const first = await f.read();
  const relocated = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-v2-copy-"));
  t.after(() => fs.rm(relocated, { recursive: true, force: true }));
  await fs.cp(f.root, relocated, { recursive: true });
  const second = await f.read(relocated);
  assert.deepEqual(second.selected, first.selected);
  assert.deepEqual(second.read("native", "model"), first.read("native", "model"));
});

test("executable delivery is not silently interpreted as declarative files", async (t) => {
  const f = await fixture(t);
  f.manifest.delivery = {
    kind: "executable",
    package: {
      name: "@example/provider",
      version: "1",
      packageJsonSha256: sha("package-json"),
      contentSha256: sha("package"),
      entrypoint: "./provider",
    },
    inputs: [
      {
        id: "source",
        path: "inputs/model.src",
        mediaType: "text/plain",
        bytes: f.native.length,
        sha256: sha(f.native),
      },
    ],
    nativeInputs: [{ item: "model", input: "source" }],
    editionInput: null,
    editionResourceInputs: [],
  };
  await assert.rejects(f.read(), { code: "edition_provider_v2_delivery_unsupported" });
});

test("duplicate delivery keys cannot disguise two Provider modes", async (t) => {
  const f = await fixture(t);
  const raw = Buffer.from(
    JSON.stringify(f.manifest).replace("{", '{"delivery":{"kind":"executable"},') + "\n",
  );
  await fs.writeFile(f.manifestPath, raw);
  await assert.rejects(provider.readDeclarativeSelectedInputs(f.manifestPath, sha(raw)), {
    code: "edition_provider_v2_manifest_duplicate_key",
  });
});
