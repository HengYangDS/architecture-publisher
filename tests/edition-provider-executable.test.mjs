import assert from "node:assert/strict";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  EDITION_PROVIDER_LIMITS,
  editionProviderPackageDigest,
  materializeExecutableProvider,
} from "../packages/publisher/src/provider/index.mjs";
import {
  materializeEditionProvider as fixtureEntrypoint,
  unselectedExport,
} from "./fixtures/providers/executable/package/provider.mjs";
import {
  sha,
  fixtureRoot,
  copyFixture,
  writeManifest,
  scratchNames,
  runDescendantCase,
} from "./fixtures/edition-provider-executable.mjs";

test("executable fixture exposes one selected and one deliberately unselected export", () => {
  assert.equal(typeof fixtureEntrypoint, "function");
  assert.equal(typeof unselectedExport, "function");
  assert.equal(globalThis.__providerExecuted, undefined);
});

test("shared executable fixture manifest binds its actual package bytes", async () => {
  const manifest = JSON.parse(await fs.readFile(new URL("provider.json", fixtureRoot), "utf8"));
  assert.equal(
    manifest.delivery.package.contentSha256,
    await editionProviderPackageDigest(await fs.realpath(new URL("package/", fixtureRoot))),
  );
});

test("executable provider runs only the selected export in a bounded child", async (t) => {
  const root = await copyFixture(t);
  const before = await scratchNames();
  const selection = await writeManifest(root);
  const result = await materializeExecutableProvider(selection, {
    verifyDeterminism: true,
  });
  assert.equal(result.receipt.delivery, "executable");
  assert.equal(result.receipt.execution.kind, "child-process");
  assert.equal(result.receipt.execution.deterministic, true);
  assert.equal(result.sourceSha256, result.receipt.materialized.sourceManifestSha256);
  assert.equal(result.semanticDigest, result.receipt.materialized.claimModelDigest);
  assert.equal(result.editionDigest, result.receipt.materialized.editionDigest);
  assert.deepEqual(
    result.receipt.inputs.map(({ id }) => id),
    ["provider-manifest", "provider-package", "source"],
  );
  assert.equal(
    result.receipt.inputs.find(({ id }) => id === "provider-package").sha256,
    JSON.parse(await fs.readFile(selection.providerManifest, "utf8")).delivery.package
      .contentSha256,
  );
  assert.equal(globalThis.__providerExecuted, undefined);
  assert.deepEqual(await scratchNames(), before);
});

test("executable provider reclaims an ordinary descendant after a valid reply", async (t) => {
  await runDescendantCase(t, "descendant-success");
});

test("executable provider reclaims an ordinary descendant after timeout", async (t) => {
  await runDescendantCase(t, "descendant-timeout", "edition_provider_timeout");
});

for (const [scenario, code, replyBytes] of [
  ["descendant-stderr", "edition_provider_stderr_invalid"],
  ["descendant-malformed", "edition_provider_response_invalid"],
  ["descendant-oversized", "edition_provider_reply_size_invalid", 1024],
  ["descendant-nonzero", "edition_provider_process_failed"],
]) {
  test(`executable provider reclaims an ordinary descendant after ${scenario}`, async (t) => {
    await runDescendantCase(t, scenario, code, { replyBytes });
  });
}

test("a delayed Worker stderr write cannot be lost behind its reply", async (t) => {
  await runDescendantCase(t, "descendant-delayed-stderr", "edition_provider_stderr_invalid");
});

test("abrupt worker loss never produces a passing Provider result", async (t) => {
  await runDescendantCase(
    t,
    "descendant-abrupt",
    process.platform === "win32"
      ? "edition_provider_cleanup_unproved"
      : "edition_provider_process_failed",
    { expectReclaimed: process.platform !== "win32" },
  );
});

test("executable provider selects exact package identity and public export", async (t) => {
  const nameRoot = await copyFixture(t);
  const name = await writeManifest(nameRoot);
  const nameManifest = JSON.parse(await fs.readFile(name.providerManifest, "utf8"));
  nameManifest.delivery.package.name = "@example/other-provider";
  await fs.writeFile(name.providerManifest, JSON.stringify(nameManifest, null, 2) + "\n");
  name.providerManifestSha256 = sha(await fs.readFile(name.providerManifest));
  await assert.rejects(materializeExecutableProvider(name), {
    code: "edition_provider_package_identity_mismatch",
  });

  const digestRoot = await copyFixture(t);
  const digestSelection = await writeManifest(digestRoot);
  await fs.appendFile(path.join(digestRoot, "package/package.json"), " ");
  await assert.rejects(materializeExecutableProvider(digestSelection), {
    code: "edition_provider_package_digest_mismatch",
  });

  const contentRoot = await copyFixture(t);
  const contentSelection = await writeManifest(contentRoot);
  await fs.appendFile(path.join(contentRoot, "package/provider.mjs"), "\n");
  await assert.rejects(materializeExecutableProvider(contentSelection), {
    code: "edition_provider_package_content_mismatch",
  });

  const escapeRoot = await copyFixture(t);
  const packageFile = path.join(escapeRoot, "package/package.json");
  const packageJson = JSON.parse(await fs.readFile(packageFile, "utf8"));
  packageJson.exports["./provider"] = "../outside.mjs";
  await fs.writeFile(packageFile, JSON.stringify(packageJson, null, 2) + "\n");
  const escape = await writeManifest(escapeRoot);
  await assert.rejects(materializeExecutableProvider(escape), {
    code: "edition_provider_entrypoint_invalid",
  });

  const symlinkRoot = await copyFixture(t);
  const linked = await writeManifest(symlinkRoot);
  const actualPackage = path.join(symlinkRoot, "actual-package");
  await fs.rename(path.join(symlinkRoot, "package"), actualPackage);
  await fs.symlink("actual-package", path.join(symlinkRoot, "package"));
  await assert.rejects(materializeExecutableProvider(linked), {
    code: "bundle_symlink_forbidden",
  });
});

test("executable provider rejects invalid options, roots, manifests, and exports", async (t) => {
  await assert.rejects(materializeExecutableProvider({}, { verifyDeterminism: false }), {
    code: "edition_provider_selection_invalid",
  });

  const optionsRoot = await copyFixture(t);
  const optionsSelection = await writeManifest(optionsRoot);
  await assert.rejects(materializeExecutableProvider(optionsSelection, {}), {
    code: "edition_provider_options_invalid",
  });
  await assert.rejects(
    materializeExecutableProvider(optionsSelection, { verifyDeterminism: "yes" }),
    { code: "edition_provider_options_invalid" },
  );

  const relativeRoot = await copyFixture(t);
  const relative = await writeManifest(relativeRoot);
  relative.providerPackageRoot = "package";
  await assert.rejects(materializeExecutableProvider(relative), {
    code: "edition_provider_package_root_required",
  });

  const fileRoot = await copyFixture(t);
  const fileSelection = await writeManifest(fileRoot);
  fileSelection.providerPackageRoot = path.join(fileRoot, "inputs/source.json");
  await assert.rejects(materializeExecutableProvider(fileSelection), {
    code: "edition_provider_package_root_invalid",
  });

  const invalidJsonRoot = await copyFixture(t);
  const invalidJson = await writeManifest(invalidJsonRoot);
  await fs.writeFile(path.join(invalidJsonRoot, "package/package.json"), "{");
  const invalidProvider = JSON.parse(await fs.readFile(invalidJson.providerManifest, "utf8"));
  invalidProvider.delivery.package.packageJsonSha256 = sha(Buffer.from("{"));
  invalidProvider.delivery.package.contentSha256 = await editionProviderPackageDigest(
    invalidJson.providerPackageRoot,
  );
  await fs.writeFile(invalidJson.providerManifest, JSON.stringify(invalidProvider, null, 2) + "\n");
  invalidJson.providerManifestSha256 = sha(await fs.readFile(invalidJson.providerManifest));
  await assert.rejects(materializeExecutableProvider(invalidJson), {
    code: "edition_provider_package_json_invalid",
  });

  const missingExportRoot = await copyFixture(t);
  const missingPackageFile = path.join(missingExportRoot, "package/package.json");
  const missingPackage = JSON.parse(await fs.readFile(missingPackageFile, "utf8"));
  missingPackage.exports = {};
  await fs.writeFile(missingPackageFile, JSON.stringify(missingPackage, null, 2) + "\n");
  await assert.rejects(materializeExecutableProvider(await writeManifest(missingExportRoot)), {
    code: "edition_provider_entrypoint_invalid",
  });

  const invalidTargetRoot = await copyFixture(t);
  const invalidTargetFile = path.join(invalidTargetRoot, "package/package.json");
  const invalidTargetPackage = JSON.parse(await fs.readFile(invalidTargetFile, "utf8"));
  invalidTargetPackage.exports["./provider"] = "./../outside.mjs";
  await fs.writeFile(invalidTargetFile, JSON.stringify(invalidTargetPackage, null, 2) + "\n");
  await assert.rejects(materializeExecutableProvider(await writeManifest(invalidTargetRoot)), {
    code: "edition_provider_entrypoint_invalid",
  });
});

test("executable provider reads only exact declared inputs", async (t) => {
  const changedRoot = await copyFixture(t);
  const changed = await writeManifest(changedRoot);
  const inputFile = path.join(changedRoot, "inputs/source.json");
  const bytes = await fs.readFile(inputFile);
  bytes[bytes.length - 2] = bytes[bytes.length - 2] === 0x20 ? 0x21 : 0x20;
  await fs.writeFile(inputFile, bytes);
  await assert.rejects(materializeExecutableProvider(changed), {
    code: "edition_provider_input_digest_mismatch",
  });

  const sizeRoot = await copyFixture(t);
  const size = await writeManifest(sizeRoot);
  await fs.appendFile(path.join(sizeRoot, "inputs/source.json"), " ");
  await assert.rejects(materializeExecutableProvider(size), {
    code: "edition_provider_input_size_mismatch",
  });

  const duplicateRoot = await copyFixture(t);
  const duplicate = await writeManifest(duplicateRoot);
  const manifest = JSON.parse(await fs.readFile(duplicate.providerManifest, "utf8"));
  manifest.delivery.inputs.push(structuredClone(manifest.delivery.inputs[0]));
  await fs.writeFile(duplicate.providerManifest, JSON.stringify(manifest, null, 2) + "\n");
  duplicate.providerManifestSha256 = sha(await fs.readFile(duplicate.providerManifest));
  await assert.rejects(materializeExecutableProvider(duplicate), {
    code: "edition_provider_input_duplicate",
  });
});

for (const [scenario, code] of [
  ["source-drift", "edition_provider_source_identity_mismatch"],
  ["edition-drift", "edition_provider_edition_identity_mismatch"],
  ["edition-source-drift", "edition_provider_edition_source_mismatch"],
  ["tamper-package", "edition_provider_package_content_mismatch"],
]) {
  test(`executable provider rejects ${scenario} after selected execution`, async (t) => {
    const root = await copyFixture(t);
    const before = await scratchNames();
    const selection = await writeManifest(root, {
      scenario,
      timeoutMs: EDITION_PROVIDER_LIMITS.timeoutMs,
      replyDelayMs: scenario === "edition-source-drift" ? 2_100 : undefined,
    });
    await assert.rejects(materializeExecutableProvider(selection), { code });
    assert.deepEqual(await scratchNames(), before);
  });
}

test("selected Provider package cannot contain ambient dependencies or linked members", async (t) => {
  const ambientRoot = await copyFixture(t);
  const ambient = await writeManifest(ambientRoot);
  await fs.mkdir(path.join(ambientRoot, "package/node_modules"));
  await assert.rejects(materializeExecutableProvider(ambient), {
    code: "edition_provider_package_content_invalid",
  });

  const linkedRoot = await copyFixture(t);
  const linked = await writeManifest(linkedRoot);
  await fs.symlink("provider.mjs", path.join(linkedRoot, "package/linked.mjs"));
  await assert.rejects(materializeExecutableProvider(linked), {
    code: "edition_provider_package_content_invalid",
  });
});

test("Provider package identity includes nested regular files and their changed bytes", async (t) => {
  const root = await copyFixture(t);
  const packageRoot = path.join(root, "package");
  const first = await editionProviderPackageDigest(packageRoot);
  const nested = path.join(packageRoot, "lib/helper.mjs");
  await fs.mkdir(path.dirname(nested));
  await fs.writeFile(nested, "export const value = 1;\n");
  const added = await editionProviderPackageDigest(packageRoot);
  assert.notEqual(added, first);
  await fs.writeFile(nested, "export const value = 2;\n");
  assert.notEqual(await editionProviderPackageDigest(packageRoot), added);
});

test("Provider package refuses a non-regular socket member", async (t) => {
  if (process.platform === "win32") {
    t.skip("Windows named pipes are not filesystem package members");
    return;
  }
  const packageRoot = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "ap-pkg-"));
  t.after(() => fs.rm(packageRoot, { recursive: true, force: true }));
  await fs.cp(new URL("./fixtures/providers/executable/package", import.meta.url), packageRoot, {
    recursive: true,
  });
  const socketPath = path.join(packageRoot, "provider.sock");
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(socketPath, resolve);
  });
  try {
    await assert.rejects(editionProviderPackageDigest(packageRoot), {
      code: "edition_provider_package_content_invalid",
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

for (const [scenario, code, options] of [
  ["exit", "edition_provider_process_failed", {}],
  [
    "signal",
    process.platform === "win32"
      ? "edition_provider_cleanup_unproved"
      : "edition_provider_process_failed",
    {},
  ],
  ["throw", "edition_provider_execution_failed", {}],
  ["nonzero-ok", "edition_provider_process_failed", {}],
  ["empty", "edition_provider_response_invalid", {}],
  ["malformed", "edition_provider_response_invalid", {}],
  ["oversized", "edition_provider_reply_size_invalid", { replyBytes: 1024 }],
  ["stderr", "edition_provider_stderr_invalid", {}],
  ["forbidden", "edition_provider_reply_fields_invalid", {}],
  ["subject-drift", "edition_provider_subject_mismatch", {}],
  ["large-reply", "edition_provider_reply_size_invalid", { replyBytes: 1024 }],
  ["timeout", "edition_provider_timeout", { timeoutMs: 100 }],
]) {
  test(`executable provider rejects ${scenario} without scratch residue`, async (t) => {
    const root = await copyFixture(t);
    const before = await scratchNames();
    const expected =
      scenario === "signal" && process.platform === "win32"
        ? {
            code,
            originalFailure: "edition_provider_process_failed",
            cleanupFailure: "edition_provider_cleanup_unproved",
          }
        : { code };
    await assert.rejects(
      materializeExecutableProvider(await writeManifest(root, { scenario, ...options })),
      expected,
    );
    assert.deepEqual(await scratchNames(), before);
  });
}

test("executable conformance rejects nondeterministic replies", async (t) => {
  const root = await copyFixture(t);
  await assert.rejects(
    materializeExecutableProvider(await writeManifest(root, { scenario: "nondeterministic" }), {
      verifyDeterminism: true,
    }),
    { code: "edition_provider_nondeterministic" },
  );
});

test("executable provider ignores a misleading adjacent checkout", async (t) => {
  const root = await copyFixture(t);
  const marker = path.join(root, "ambient-imported");
  const ambient = path.join(root, "node_modules/@example/architecture-edition-provider");
  await fs.mkdir(ambient, { recursive: true });
  await fs.writeFile(
    path.join(ambient, "package.json"),
    JSON.stringify({ name: "@example/architecture-edition-provider", type: "module" }),
  );
  await fs.writeFile(
    path.join(ambient, "provider.mjs"),
    `await import('node:fs/promises').then(fs => fs.writeFile(${JSON.stringify(marker)}, 'bad'));`,
  );
  await materializeExecutableProvider(await writeManifest(root));
  await assert.rejects(fs.access(marker), { code: "ENOENT" });
});
