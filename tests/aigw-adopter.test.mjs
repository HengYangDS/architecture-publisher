import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseNpmPackRecord } from "./fixtures/npm-pack-report.mjs";
import {
  archivePackageSource,
  assertPackageSourceReplay,
  npmPackageIdentity,
} from "./fixtures/package-identity.mjs";
import { root, handoffPath, json, run } from "./fixtures/aigw-adopter.mjs";

test("Publisher retains only immutable AIGW source-ownership evidence", async (t) => {
  const handoff = await json(handoffPath);
  assert.equal(handoff.schema, "aigw.architecture-publisher-handoff/v3");
  assert.equal(handoff.publisher.package.name, "architecture-publisher");
  assert.deepEqual(handoff.publisher.successor, {
    state: "release-candidate",
    targetTag: "v0.3.0-alpha.1",
    source: {
      repository: "dig/research/human-agent-stewardship/architecture-publisher",
      commit: "7e82da7816e461f135076a6f984490d978a3a515",
      path: "packages/publisher",
      objectType: "tree",
      oid: "336d0e58058ba2b04b90208582bd4b3fb1f052f0",
    },
    package: {
      name: "architecture-publisher",
      version: "0.3.0-alpha.1",
      file: "architecture-publisher-0.3.0-alpha.1.tgz",
      archiveSha256: "c2707bcffc9ba0cea277cb3b6f4fb6f04f2755996781f92c035fa9cadb4dcc37",
      contentTarSha256: "6b0a925f85879ea7a576c5153849e2741d2e54fcd83bf068cfb5a473b8c7d682",
    },
    evidenceBoundary:
      "Exact source tree and reproducible package candidate; tag, Forge release, installation, and AIGW migration remain separate facts.",
  });
  assert.equal(handoff.aigw.source.editionPath, "docs/architecture/client-projection");
  assert.equal(handoff.aigw.governance.ownerState, "candidate");
  assert.deepEqual(handoff.aigw.governance.acceptedRefs, []);
  assert.equal(handoff.aigw.governance.remotePublication, "unproved");
  assert.deepEqual(handoff.aigw.providerMigration, {
    schema: "architecture.edition-provider-migration/v1",
    status: "proposed-not-authorized",
    mode: "declarative",
    targetRoot: "architecture/edition-provider",
    mutableInputs: ["README.md", "claim-model.json", "edition.json", "evolution.json"],
    immutableHistory: ["history/registry-v1-claim-model.json", "history/registry-v1-edition.json"],
    subject: "AIGW",
    producer: "Architecture Publisher",
    authorizationOwner: "AIGW",
    custodian: "AIGW release target",
    parity: "required-before-removal",
    relocation: "required-before-removal",
    rollback: "required-before-removal",
    baseline: "aigw.candidate",
    conformancePredicates: [
      "manifest-closure",
      "input-identity",
      "output-schema",
      "determinism",
      "relocation",
      "empty-configuration",
      "adjacent-checkout-immunity",
      "dependency-direction",
      "resource-bounds",
      "later-stage-rejection",
    ],
    removalCriteria: [
      "provider-conformance-pass",
      "candidate-parity-pass",
      "relocated-installed-pass",
      "rollback-rehearsed",
      "aigw-accepted",
    ],
    feedback: "non-authorizing-source-proposal",
    centralMutableOwner: "forbidden",
  });
  for (const value of [
    handoff.publisher.source.commit,
    handoff.publisher.source.oid,
    handoff.publisher.package.archiveSha256,
    handoff.publisher.package.contentTarSha256,
    handoff.publisher.successor.source.commit,
    handoff.publisher.successor.source.oid,
    handoff.publisher.successor.package.archiveSha256,
    handoff.publisher.successor.package.contentTarSha256,
    handoff.aigw.source.ownerCommit,
    handoff.aigw.source.ownerTree,
    handoff.aigw.source.editionTree,
    handoff.aigw.source.semanticRevision,
    ...Object.values(handoff.aigw.files),
    ...Object.values(handoff.aigw.candidate),
  ])
    if (typeof value === "string") assert.match(value, /^[0-9a-f]{40}$|^[0-9a-f]{64}$/u);

  await assert.rejects(fs.access(path.join(root, "migration/aigw")), { code: "ENOENT" });
  const tracked = run("git", ["ls-files"], { cwd: root }).trim().split("\n");
  assert.equal(
    tracked.some((file) => file.startsWith("migration/aigw/")),
    false,
  );

  const historical = await fs.mkdtemp(path.join(os.tmpdir(), "aigw-publisher-handoff-"));
  t.after(() => fs.rm(historical, { recursive: true, force: true }));
  const source = path.join(historical, "source");
  await fs.mkdir(source);
  const archived = archivePackageSource({
    repository: root,
    tree: `${handoff.publisher.source.commit}:${handoff.publisher.source.path}`,
  });
  const extracted = spawnSync("tar", ["-xf", "-", "-C", source], {
    input: archived,
    encoding: null,
  });
  assert.equal(extracted.status, 0, extracted.stderr?.toString());
  const packed = parseNpmPackRecord(
    run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", historical], {
      cwd: source,
    }),
  );
  assert.equal(packed.filename, handoff.publisher.package.file);
  if (process.platform !== "win32")
    assert.equal(
      npmPackageIdentity(await fs.readFile(path.join(historical, packed.filename)))
        .contentTarSha256,
      handoff.publisher.package.contentTarSha256,
    );
  const unpacked = spawnSync(
    "tar",
    ["-xzf", path.join(historical, packed.filename), "-C", historical],
    {
      encoding: "utf8",
      timeout: 30_000,
    },
  );
  assert.equal(unpacked.status, 0, unpacked.stderr);
  await assertPackageSourceReplay({
    repository: root,
    tree: handoff.publisher.source.oid,
    root: path.join(historical, "package"),
    files: packed.files.map(({ path: file }) => file),
  });
});
