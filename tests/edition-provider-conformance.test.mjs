import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { runProviderConformance } from "./conformance/journeys/provider/run.mjs";
import { editionProviderPackageDigest } from "../packages/publisher/src/provider/index.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const evidence = new URL("../build/test-work/", import.meta.url);
const matrix = JSON.parse(
  await fs.readFile(
    new URL("./conformance/fixtures/provider-contract-matrix.json", import.meta.url),
  ),
);

async function copied(t, name) {
  await fs.mkdir(evidence, { recursive: true });
  const root = await fs.mkdtemp(new URL(`provider-conformance-${name}-`, evidence));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(new URL(`./fixtures/providers/${name}/`, import.meta.url), root, { recursive: true });
  const providerManifest = path.join(
    root,
    name === "declarative" ? "valid/provider.json" : "provider.json",
  );
  const manifest = JSON.parse(await fs.readFile(providerManifest, "utf8"));
  // Conformance verifies portability, not a two-second process-startup budget.
  manifest.limits.timeoutMs = 10_000;
  await fs.writeFile(providerManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  return {
    providerManifest,
    providerManifestSha256: sha(await fs.readFile(providerManifest)),
    ...(name === "executable" ? { providerPackageRoot: path.join(root, "package") } : {}),
  };
}

test("both delivery modes cross one non-authorizing conformance matrix", async (t) => {
  const reports = await Promise.all([
    runProviderConformance(await copied(t, "declarative")),
    runProviderConformance(await copied(t, "executable")),
  ]);
  for (const report of reports) {
    assert.deepEqual(
      report.predicates.map(({ id }) => id),
      matrix.predicates,
    );
    for (const predicate of report.predicates) {
      assert.equal(predicate.verdict, "pass");
      assert.equal(typeof predicate.evidence?.method, "string");
      assert(predicate.evidence.method.length > 0);
      assert(Array.isArray(predicate.evidence.observations));
      assert(predicate.evidence.observations.length > 0);
      assert(predicate.evidence.observations.every((value) => typeof value === "string"));
    }
    assert.deepEqual(report.authority, matrix.authority);
    assert.equal(report.verdict, "pass");
  }
  assert.deepEqual(reports.map(({ delivery }) => delivery).sort(), ["declarative", "executable"]);
});

test("executable relocation preserves the declared Publisher dependency", async (t) => {
  const selection = await copied(t, "executable");
  const packageFile = path.join(selection.providerPackageRoot, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageFile, "utf8"));
  const publisherPackage = JSON.parse(
    await fs.readFile(new URL("../packages/publisher/package.json", import.meta.url), "utf8"),
  );
  packageJson.dependencies = { "architecture-publisher": publisherPackage.version };
  const packageBytes = Buffer.from(`${JSON.stringify(packageJson, null, 2)}\n`);
  await fs.writeFile(packageFile, packageBytes);
  await fs.writeFile(
    path.join(selection.providerPackageRoot, "provider.mjs"),
    [
      "import { canonical } from 'architecture-publisher/semantics';",
      "",
      "export async function materializeEditionProvider(request) {",
      "  const input = request.inputs.find(({ id }) => id === 'source');",
      "  return JSON.parse(canonical(JSON.parse(Buffer.from(input.contentBase64, 'base64')))).reply;",
      "}",
      "",
    ].join("\n"),
  );
  const manifest = JSON.parse(await fs.readFile(selection.providerManifest, "utf8"));
  manifest.delivery.package.packageJsonSha256 = sha(packageBytes);
  manifest.delivery.package.contentSha256 = await editionProviderPackageDigest(
    selection.providerPackageRoot,
  );
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(selection.providerManifest, manifestBytes);
  selection.providerManifestSha256 = sha(manifestBytes);

  const report = await runProviderConformance(selection);
  assert.equal(report.verdict, "pass");
  assert.deepEqual(
    report.predicates.find(({ id }) => id === "dependency-direction").evidence.observations,
    ["modules:1", "externals:architecture-publisher/semantics"],
  );
});

test("dependency conformance rejects the exact forbidden executable import", async (t) => {
  for (const specifier of [
    "architecture-publisher/renderers/archify",
    "architecture-publisher/qualification",
    "architecture-publisher/publication",
    "simple-git",
    "../../../../../ethos/src/index.mjs",
  ]) {
    const selection = await copied(t, "executable");
    await fs.writeFile(
      path.join(selection.providerPackageRoot, "provider.mjs"),
      `import ${JSON.stringify(specifier)};\nexport function materializeEditionProvider() {}\n`,
    );
    await assert.rejects(runProviderConformance(selection), {
      code: "provider_conformance_dependency_direction",
      message: `provider_conformance_dependency_direction:${specifier}`,
    });
  }
});

test("dependency conformance rejects an undeclared Publisher import", async (t) => {
  const selection = await copied(t, "executable");
  await fs.writeFile(
    path.join(selection.providerPackageRoot, "provider.mjs"),
    "import { canonical } from 'architecture-publisher/semantics';\n" +
      "export function materializeEditionProvider() { return canonical; }\n",
  );
  const manifest = JSON.parse(await fs.readFile(selection.providerManifest, "utf8"));
  manifest.delivery.package.contentSha256 = await editionProviderPackageDigest(
    selection.providerPackageRoot,
  );
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(selection.providerManifest, manifestBytes);
  selection.providerManifestSha256 = sha(manifestBytes);

  await assert.rejects(runProviderConformance(selection), {
    code: "provider_conformance_dependency_direction",
    message: "provider_conformance_dependency_direction:architecture-publisher:undeclared",
  });
});

test("dependency conformance rejects declared packages outside the public contract", async (t) => {
  const selection = await copied(t, "executable");
  const packageFile = path.join(selection.providerPackageRoot, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageFile, "utf8"));
  packageJson.dependencies = { "left-pad": "1.3.0" };
  const packageBytes = Buffer.from(JSON.stringify(packageJson, null, 2) + "\n");
  await fs.writeFile(packageFile, packageBytes);
  await fs.writeFile(
    path.join(selection.providerPackageRoot, "provider.mjs"),
    "import leftPad from 'left-pad';\nexport function materializeEditionProvider() { return leftPad; }\n",
  );
  const manifest = JSON.parse(await fs.readFile(selection.providerManifest, "utf8"));
  manifest.delivery.package.packageJsonSha256 = sha(packageBytes);
  manifest.delivery.package.contentSha256 = await editionProviderPackageDigest(
    selection.providerPackageRoot,
  );
  const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
  await fs.writeFile(selection.providerManifest, manifestBytes);
  selection.providerManifestSha256 = sha(manifestBytes);
  await assert.rejects(runProviderConformance(selection), {
    code: "provider_conformance_dependency_direction",
    message: "provider_conformance_dependency_direction:left-pad",
  });
});
