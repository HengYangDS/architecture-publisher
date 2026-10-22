import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  materializeDeclarativeProvider,
  readEditionProviderInput,
  resolveEditionProviderSelection,
} from "../packages/publisher/src/provider/index.mjs";
import { resolveProviderPath } from "../packages/publisher/src/provider/input.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fixtureRoot = new URL("./fixtures/providers/declarative/valid/", import.meta.url);
const evidence = new URL("../build/test-work/", import.meta.url);

async function copyFixture(t) {
  await fs.mkdir(evidence, { recursive: true });
  const root = await fs.mkdtemp(new URL("provider-declarative-", evidence));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(fixtureRoot, root, { recursive: true });
  return root;
}

async function selection(root) {
  const providerManifest = path.join(root, "provider.json");
  return {
    providerManifest,
    providerManifestSha256: sha(await fs.readFile(providerManifest)),
  };
}

async function rewriteProvider(root, mutate) {
  const file = path.join(root, "provider.json");
  const value = JSON.parse(await fs.readFile(file, "utf8"));
  mutate(value);
  await fs.writeFile(file, JSON.stringify(value, null, 2) + "\n");
  return selection(root);
}

test("provider input verifies the selected manifest before opening payloads", async (t) => {
  const root = await copyFixture(t);
  const selected = await selection(root);
  const input = await readEditionProviderInput(
    selected.providerManifest,
    selected.providerManifestSha256,
  );
  assert.equal(input.root, root);
  assert.equal(input.sha256, selected.providerManifestSha256);
  assert.equal(input.manifest.delivery.kind, "declarative");

  await fs.rm(path.join(root, "edition.json"));
  await fs.symlink("missing-edition.json", path.join(root, "edition.json"));
  await assert.rejects(readEditionProviderInput(selected.providerManifest, "0".repeat(64)), {
    code: "edition_provider_manifest_digest_mismatch",
  });
});

test("declarative provider materializes exact ordinary inputs", async (t) => {
  const root = await copyFixture(t);
  const selected = await selection(root);
  const provider = JSON.parse(await fs.readFile(selected.providerManifest, "utf8"));
  const result = await materializeDeclarativeProvider(selected);

  assert.deepEqual(Object.keys(result).sort(), [
    "edition",
    "editionDigest",
    "editionSha256",
    "evolution",
    "evolutionSha256",
    "receipt",
    "semanticDigest",
    "semanticMember",
    "sourceManifest",
    "sourceSha256",
  ]);
  assert.equal(result.sourceManifest, path.join(root, provider.delivery.sourceManifest));
  assert.equal(result.sourceSha256, provider.expected.sourceManifestSha256);
  assert.equal(result.semanticMember, provider.delivery.semanticMember);
  assert.equal(result.semanticDigest, provider.expected.claimModelDigest);
  assert.equal(result.edition, path.join(root, provider.delivery.edition));
  assert.equal(result.editionSha256, provider.delivery.editionSha256);
  assert.equal(result.editionDigest, provider.expected.editionDigest);
  assert.equal(result.evolution, null);
  assert.equal(result.evolutionSha256, null);
  assert.equal(result.receipt.delivery, "declarative");
  assert.deepEqual(result.receipt.provider, provider.provider);
  assert.deepEqual(result.receipt.subject, provider.subject);
  assert.deepEqual(result.receipt.materialized, provider.expected);
  assert.equal(result.receipt.producer.name, "architecture-publisher");
  const packageJson = JSON.parse(
    await fs.readFile(new URL("../packages/publisher/package.json", import.meta.url), "utf8"),
  );
  assert.equal(result.receipt.producer.version, packageJson.version);
  assert.equal(result.receipt.execution.kind, "declarative");
  assert.equal(result.receipt.execution.deterministic, true);
});

test("declarative provider validates an optional evolution input", async (t) => {
  const root = await copyFixture(t);
  const model = JSON.parse(await fs.readFile(path.join(root, "source/semantic.json"), "utf8"));
  const edition = JSON.parse(await fs.readFile(path.join(root, "edition.json"), "utf8"));
  const evolution = {
    before: { claimModel: model, editions: [edition] },
    after: { claimModel: model, editions: [edition] },
    correspondences: [],
  };
  const bytes = Buffer.from(JSON.stringify(evolution, null, 2) + "\n");
  await fs.writeFile(path.join(root, "evolution.json"), bytes);
  const selected = await rewriteProvider(root, (provider) => {
    provider.contracts.evolution = "architecture.edition-evolution-input/v1";
    provider.delivery.evolution = "evolution.json";
    provider.delivery.evolutionSha256 = sha(bytes);
    provider.expected.evolutionSha256 = sha(bytes);
  });
  const result = await materializeDeclarativeProvider(selected);
  assert.equal(result.evolution, path.join(root, "evolution.json"));
  assert.equal(result.evolutionSha256, sha(bytes));
});

for (const [scenario, mutate, code] of [
  [
    "changed byte",
    async (root) => fs.appendFile(path.join(root, "source/semantic.json"), " "),
    "member_size_mismatch",
  ],
  [
    "extra source file",
    async (root) => fs.writeFile(path.join(root, "source/unselected.json"), "{}\n"),
    "bundle_members_mismatch",
  ],
  [
    "escaping delivery path",
    async (root) =>
      rewriteProvider(root, (provider) => (provider.delivery.edition = "../edition.json")),
    "edition_provider_delivery_path_invalid",
  ],
  [
    "symlinked Edition",
    async (root) => {
      await fs.rm(path.join(root, "edition.json"));
      await fs.symlink("source/semantic.json", path.join(root, "edition.json"));
    },
    "bundle_symlink_forbidden",
  ],
]) {
  test(`declarative provider rejects ${scenario}`, async (t) => {
    const root = await copyFixture(t);
    const updated = await mutate(root);
    await assert.rejects(materializeDeclarativeProvider(updated ?? (await selection(root))), {
      code,
    });
  });
}

test("declarative provider rejects subject and materialized identity drift", async (t) => {
  const subjectRoot = await copyFixture(t);
  const subject = await rewriteProvider(subjectRoot, (provider) => {
    provider.subject.revision = "release-2";
  });
  await assert.rejects(materializeDeclarativeProvider(subject), {
    code: "edition_provider_subject_mismatch",
  });

  const identityRoot = await copyFixture(t);
  const identity = await rewriteProvider(identityRoot, (provider) => {
    provider.expected.editionDigest = "0".repeat(64);
  });
  await assert.rejects(materializeDeclarativeProvider(identity), {
    code: "edition_provider_edition_identity_mismatch",
  });
});

test("declarative provider rejects invalid selection and manifest bytes", async (t) => {
  await assert.rejects(materializeDeclarativeProvider({}), {
    code: "edition_provider_selection_invalid",
  });
  await assert.rejects(readEditionProviderInput("", "0".repeat(64)), {
    code: "edition_provider_manifest_path_required",
  });

  const root = await copyFixture(t);
  const providerManifest = path.join(root, "provider.json");
  await assert.rejects(readEditionProviderInput(providerManifest, "invalid"), {
    code: "edition_provider_manifest_digest_required",
  });
  await fs.writeFile(providerManifest, "{");
  await assert.rejects(readEditionProviderInput(providerManifest, sha(Buffer.from("{"))), {
    code: "edition_provider_manifest_json_invalid",
  });
});

test("Provider selection resolves only explicit portable files and bounded plan fields", () => {
  const root = path.resolve("selected-root");
  assert.throws(() => resolveEditionProviderSelection(path.join(root, "plan.json"), null), {
    code: "edition_candidate_plan_invalid",
  });
  assert.throws(
    () =>
      resolveEditionProviderSelection(path.join(root, "plan.json"), {
        providerManifest: "",
        providerManifestSha256: "a".repeat(64),
        output: "out",
      }),
    { code: "edition_candidate_plan_invalid" },
  );
  const selected = resolveEditionProviderSelection(path.join(root, "plan.json"), {
    providerManifest: "source/provider.json",
    providerManifestSha256: "a".repeat(64),
    output: "publication",
  });
  assert.equal(selected.providerManifest, path.join(root, "source/provider.json"));
  assert.equal(selected.output, path.join(root, "publication"));
  assert.equal(
    resolveProviderPath(root, "source/provider.json", "invalid"),
    selected.providerManifest,
  );
  assert.throws(() => resolveProviderPath(root, "../escape", "invalid"), { code: "invalid" });
});

test("declarative provider rejects non-declarative delivery and broken bindings", async (t) => {
  const executableRoot = await copyFixture(t);
  const executable = await rewriteProvider(executableRoot, (provider) => {
    provider.delivery = {
      kind: "executable",
      package: {
        name: "@example/provider",
        version: "1.0.0",
        packageJsonSha256: "a".repeat(64),
        contentSha256: "b".repeat(64),
        entrypoint: "./provider.mjs",
      },
      inputs: [],
    };
  });
  await assert.rejects(materializeDeclarativeProvider(executable), {
    code: "edition_provider_delivery_kind_invalid",
  });

  const missingSemanticRoot = await copyFixture(t);
  const missingSemantic = await rewriteProvider(missingSemanticRoot, (provider) => {
    provider.delivery.semanticMember = "missing.json";
  });
  await assert.rejects(materializeDeclarativeProvider(missingSemantic), {
    code: "edition_provider_semantic_member_missing",
  });

  const sourceIdentityRoot = await copyFixture(t);
  const sourceIdentity = await rewriteProvider(sourceIdentityRoot, (provider) => {
    provider.expected.sourceManifestSha256 = "0".repeat(64);
  });
  await assert.rejects(materializeDeclarativeProvider(sourceIdentity), {
    code: "edition_provider_source_identity_mismatch",
  });

  const editionSourceRoot = await copyFixture(t);
  const editionFile = path.join(editionSourceRoot, "edition.json");
  const edition = JSON.parse(await fs.readFile(editionFile, "utf8"));
  edition.source.manifestSha256 = "0".repeat(64);
  const editionBytes = Buffer.from(JSON.stringify(edition, null, 2) + "\n");
  await fs.writeFile(editionFile, editionBytes);
  const editionSource = await rewriteProvider(editionSourceRoot, (provider) => {
    provider.delivery.editionSha256 = sha(editionBytes);
  });
  await assert.rejects(materializeDeclarativeProvider(editionSource), {
    code: "edition_provider_edition_source_mismatch",
  });
});

test("declarative provider enforces its requested input bounds", async (t) => {
  const countRoot = await copyFixture(t);
  const count = await rewriteProvider(countRoot, (provider) => {
    provider.limits.inputs = 1;
  });
  await assert.rejects(materializeDeclarativeProvider(count), {
    code: "edition_provider_inputs_invalid",
  });

  const bytesRoot = await copyFixture(t);
  const bytes = await rewriteProvider(bytesRoot, (provider) => {
    provider.limits.inputBytes = 1;
  });
  await assert.rejects(materializeDeclarativeProvider(bytes), {
    code: "edition_provider_input_size_invalid",
  });
});
