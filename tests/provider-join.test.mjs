import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";
import {
  sha,
  editionProject,
  fixture,
  supplyEdition,
  prepareExecutableAlpha,
  materializeExecutableAlpha,
} from "./fixtures/provider-join.mjs";

test("direct and two declarative Providers join one selected-input lock", async (t) => {
  const f = await fixture(t);
  const first = await f.materialize();
  assert.equal(first.lock.sources.length, 3);
  assert.equal(first.lock.derived.length, 2);
  assert.equal(Object.hasOwn(first.lock.derived[0], "id"), false);
  assert.deepEqual(first.lock.derived.map((item) => item.derivedFrom[0].namespace).sort(), [
    "org.example/alpha",
    "org.example/beta",
  ]);
  assert.deepEqual(first.read("direct-local"), f.direct);
  assert.deepEqual(first.readSource("org.example/alpha"), f.providers.alpha.native);
  assert.deepEqual(first.readSource("org.example/beta"), f.providers.beta.native);
  assert.throws(() => first.read("model"), { code: "materialized_item_unknown" });
  assert(first.limits.includes("path-confinement-under-concurrent-mutation-unproved"));
  assert.equal(first.readEvidence.subjectLockSha256, first.lockSha256);
  assert.equal(first.invocations.length, 2);
  const alphaProjection = first.lock.derived.find(
    (item) => item.derivedFrom[0].namespace === "org.example/alpha",
  );
  assert.deepEqual(first.readDerived(alphaProjection), f.providers.alpha.projection);

  f.request.providers.reverse();
  f.providers.alpha.manifest.selected.native[0].id = "renamed-native";
  f.providers.alpha.manifest.selected.derived[0].derivedFrom = ["renamed-native"];
  f.providers.alpha.manifest.delivery.files[0].id = "renamed-native";
  const second = await f.materialize();
  assert.equal(second.lockSha256, first.lockSha256);
  assert.notDeepEqual(second.invocations, first.invocations);
});

test("passing v2 selection preserves an incumbent and grants no retirement authority", async (t) => {
  const f = await fixture(t);
  const incumbent = path.join(f.root, "providers/incumbent.json");
  await fs.writeFile(incumbent, '{"incumbent":true}\n');
  const { requestPath, digest } = await f.save();
  const protectedPaths = [
    incumbent,
    path.join(f.providers.alpha.directory, "provider.json"),
    path.join(f.providers.alpha.directory, "native.json"),
  ];
  const before = await Promise.all(protectedPaths.map((file) => fs.readFile(file)));
  const selected = await materializeBuildRequestInput(requestPath, digest);
  assert.equal(selected.invocations.length, 2);
  for (const field of ["retirement", "acceptance", "publication", "authorization"])
    assert.equal(Object.hasOwn(selected, field), false, field);
  for (const [index, file] of protectedPaths.entries())
    assert.deepEqual(await fs.readFile(file), before[index], file);
});

test("direct and Provider native delivery with the same meaning share lock identity", async (t) => {
  const f = await fixture(t);
  f.request.providers = [];
  f.project = editionProject(["org.example/direct"]);
  const direct = await f.materialize();

  f.request.sources = [];
  f.request.providers = [
    {
      id: "alpha-selection",
      manifest: f.providers.alpha.relativeManifest,
      sha256: "0".repeat(64),
    },
  ];
  await fs.writeFile(path.join(f.providers.alpha.directory, "native.json"), f.direct);
  f.providers.alpha.manifest.selected.native[0] = {
    ...f.providers.alpha.manifest.selected.native[0],
    namespace: "org.example/direct",
    claimant: "direct-maintainer",
    bytes: f.direct.length,
    sha256: sha(f.direct),
  };
  f.providers.alpha.manifest.selected.derived = [];
  f.providers.alpha.manifest.delivery.files.pop();
  const provider = await f.materialize();
  assert.equal(provider.lockSha256, direct.lockSha256);
  assert.notDeepEqual(provider.invocations, direct.invocations);
});

test("global selection rejects duplicate namespaces and conflicting Edition ownership", async (t) => {
  const f = await fixture(t);
  f.providers.alpha.manifest.selected.native[0].namespace = "org.example/direct";
  await assert.rejects(f.materialize(), { code: "materialized_source_namespace_duplicate" });

  f.providers.alpha.manifest.selected.native[0].namespace = "org.example/alpha";
  supplyEdition(f.providers.alpha, f.project);
  await assert.rejects(f.materialize(), { code: "materialized_edition_ambiguous" });

  f.request.edition = { kind: "provider", provider: "alpha-selection" };
  const selected = await f.materialize();
  assert.equal(selected.project.id, f.project.id);
  supplyEdition(f.providers.beta, f.project);
  await assert.rejects(f.materialize(), { code: "materialized_edition_ambiguous" });

  f.providers.beta.manifest.selected.edition = null;
  f.providers.beta.manifest.delivery.files.pop();
  f.providers.alpha.manifest.selected.edition = null;
  f.providers.alpha.manifest.delivery.files.pop();
  await assert.rejects(f.materialize(), { code: "materialized_provider_edition_missing" });
});

test("global join rejects duplicate or undeclared derived projection namespaces", async (t) => {
  const f = await fixture(t);
  f.providers.beta.manifest.selected.derived[0].namespace =
    f.providers.alpha.manifest.selected.derived[0].namespace;
  await assert.rejects(f.materialize(), {
    code: "materialized_derived_namespace_duplicate",
  });
  f.providers.beta.manifest.selected.derived[0].namespace = "org.example/beta/index";
  f.project.scope.projectionNamespaces = ["org.example/missing"];
  f.project.scope.selections[0].namespace = "org.example/missing";
  await assert.rejects(f.materialize(), {
    code: "materialized_edition_projections_mismatch",
  });
});

test("an Edition addresses only the selected derived projection it actually uses", async (t) => {
  const f = await fixture(t);
  f.project.scope.projectionNamespaces = ["org.example/alpha/index"];
  f.project.scope.selections[0].namespace = "org.example/alpha/index";
  const selected = await f.materialize();
  assert.deepEqual(selected.project.scope.projectionNamespaces, ["org.example/alpha/index"]);
  assert.equal(selected.lock.derived.length, 2);
});

test("Provider Edition cannot recover an unselected override from ambient files", async (t) => {
  const f = await fixture(t);
  f.request.edition = { kind: "provider", provider: "alpha-selection" };
  f.project.visualPolicy.override = "palette.json";
  supplyEdition(f.providers.alpha, f.project);
  await fs.writeFile(path.join(f.providers.alpha.directory, "palette.json"), '{"palette":"stone"}');
  await assert.rejects(f.materialize(), { code: "materialized_edition_resource_missing" });
});

test("selected Provider Edition resource bytes share direct identity", async (t) => {
  const f = await fixture(t);
  const palette = Buffer.from('{"palette":"stone"}\n');
  f.project.visualPolicy.override = "palette.json";
  await fs.writeFile(path.join(f.root, "edition/palette.json"), palette);
  const direct = await f.materialize();

  f.request.edition = { kind: "provider", provider: "alpha-selection" };
  const alpha = f.providers.alpha;
  supplyEdition(alpha, f.project);
  alpha.manifest.selected.edition.resources = [
    { ref: "palette.json", bytes: palette.length, sha256: sha(palette) },
  ];
  alpha.manifest.delivery.files.push({
    kind: "edition-resource",
    id: "palette.json",
    path: "assets/palette.json",
  });
  await fs.mkdir(path.join(alpha.directory, "assets"));
  await fs.writeFile(path.join(alpha.directory, "assets/palette.json"), palette);
  const supplied = await f.materialize();
  assert.equal(supplied.lockSha256, direct.lockSha256);
  assert.deepEqual(supplied.readEditionResource("palette.json"), palette);
  assert.equal(
    supplied.readEvidence.items.find(({ kind }) => kind === "edition-resource").method,
    "filesystem-read-sha256/v1",
  );
});

test("direct and Provider-supplied identical Edition bytes share identity", async (t) => {
  const f = await fixture(t);
  const direct = await f.materialize();
  f.request.edition = { kind: "provider", provider: "alpha-selection" };
  supplyEdition(f.providers.alpha, f.project);
  const supplied = await f.materialize();
  assert.equal(supplied.lockSha256, direct.lockSha256);
  assert.deepEqual(supplied.readEdition(), direct.readEdition());
  assert.equal(
    supplied.readEvidence.items.find(({ kind }) => kind === "edition").method,
    "filesystem-read-sha256/v1",
  );
});

test("global join rejects ambiguous derived meaning and false Edition metadata", async (t) => {
  const f = await fixture(t);
  const duplicate = { ...f.providers.alpha.manifest.selected.derived[0], id: "copy" };
  f.providers.alpha.manifest.selected.derived.push(duplicate);
  f.providers.alpha.manifest.delivery.files.push({
    kind: "derived",
    id: "copy",
    path: "copy.json",
  });
  await fs.writeFile(
    path.join(f.providers.alpha.directory, "copy.json"),
    f.providers.alpha.projection,
  );
  await assert.rejects(f.materialize(), { code: "edition_provider_v2_invalid" });

  f.providers.alpha.manifest.selected.derived.pop();
  f.providers.alpha.manifest.delivery.files.pop();
  f.request.edition = { kind: "provider", provider: "alpha-selection" };
  supplyEdition(f.providers.alpha, f.project);
  f.providers.alpha.manifest.selected.edition.editor = "false-editor";
  await assert.rejects(f.materialize(), {
    code: "materialized_provider_edition_identity_mismatch",
  });
});

test("invalid v2 Provider manifest returns a local, owner-unresolved diagnostic", async (t) => {
  const f = await fixture(t);
  f.providers.alpha.manifest.selected.derived[0].derivedFrom = ["missing"];
  const { requestPath, digest } = await f.save();
  const selected = f.request.providers[0];
  const nativePath = path.join(f.providers.alpha.directory, "native.json");
  const nativeBefore = sha(await fs.readFile(nativePath));
  const subject = {
    kind: "provider-manifest",
    selectionId: selected.id,
    sha256: selected.sha256,
  };

  await assert.rejects(materializeBuildRequestInput(requestPath, digest), (error) => {
    assert.equal(error.code, "edition_provider_v2_invalid");
    assert.equal(error.diagnostics?.length, 1);
    const [finding] = error.diagnostics;
    assert.equal(finding.predicate, "provider-manifest-schema");
    assert.deepEqual(finding.subject, subject);
    assert.deepEqual(finding.responsibility, {
      role: "provider-author",
      declaredOwner: null,
    });
    return true;
  });

  const output = path.join(f.root, "candidate");
  const cli = fileURLToPath(new URL("../packages/publisher/src/cli/main.mjs", import.meta.url));
  const result = spawnSync(
    process.execPath,
    [cli, "edition", "build", requestPath, "--sha256", digest, "--output", output],
    {
      cwd: f.root,
      env: { HOME: f.root, PATH: f.root, LANG: "C.UTF-8" },
      encoding: "utf8",
      timeout: 15_000,
    },
  );
  assert.equal(result.status, 1, result.stderr);
  const response = JSON.parse(result.stdout);
  assert.equal(response.error.code, "edition_provider_v2_invalid");
  assert.deepEqual(response.error.diagnostics[0].subject, subject);
  assert.equal(response.error.diagnostics[0].predicate, "provider-manifest-schema");
  assert.deepEqual(response.error.diagnostics[0].responsibility, {
    role: "provider-author",
    declaredOwner: null,
  });
  assert.equal(sha(await fs.readFile(nativePath)), nativeBefore);
  await assert.rejects(fs.stat(output), { code: "ENOENT" });
});

test("changed selected manifest bytes do not implicate the Provider author", async (t) => {
  const f = await fixture(t);
  const { requestPath, digest } = await f.save();
  await fs.appendFile(path.join(f.providers.alpha.directory, "provider.json"), " ");
  await assert.rejects(materializeBuildRequestInput(requestPath, digest), (error) => {
    assert.equal(error.code, "edition_provider_v2_manifest_digest_mismatch");
    assert.equal(error.diagnostics, undefined);
    return true;
  });
});

test("declarative delivery cannot consume an executable package root", async (t) => {
  const f = await fixture(t);
  f.request.providers[0].packageRoot = "providers/alpha";
  await assert.rejects(f.materialize(), { code: "materialized_provider_package_root_invalid" });
});

test("an unverified Provider VCS claim remains distinct from checked content", async (t) => {
  const f = await fixture(t);
  f.providers.alpha.manifest.selected.native[0].revision = {
    kind: "vcs",
    repository: "unavailable-repository",
    ref: "HEAD",
  };
  const result = await f.materialize();
  const alpha = result.lock.sources.find(({ namespace }) => namespace === "org.example/alpha");
  assert.equal(alpha.revision.kind, "vcs");
  assert.equal(alpha.revision.object, null);
  assert(result.limits.includes("vcs-provenance-unverified:org.example/alpha"));
});

test("Edition scope cannot omit a selected Provider source", async (t) => {
  const f = await fixture(t);
  f.project.scope.sourceNamespaces.pop();
  f.project.scope.selections.pop();
  await assert.rejects(f.materialize(), { code: "materialized_edition_sources_mismatch" });
});

test("mixed declarative and executable Providers share one selected-input identity", async (t) => {
  const f = await fixture(t);
  const declarative = await f.materialize();
  const alpha = await prepareExecutableAlpha(f);
  const mixed = await materializeExecutableAlpha(f);
  assert.equal(mixed.lockSha256, declarative.lockSha256);
  assert.notDeepEqual(mixed.invocations, declarative.invocations);
  assert.deepEqual(mixed.readSource("org.example/alpha"), alpha.native);
  assert.deepEqual(
    mixed.invocations.map(({ delivery }) => delivery),
    ["executable", "declarative"],
  );
  assert.equal(
    mixed.readEvidence.items.find(
      ({ kind, key }) => kind === "native" && key === "org.example/alpha",
    ).method,
    "provider-input-sha256/v2",
  );
  assert.equal(
    mixed.readEvidence.items.find(
      ({ kind, key }) => kind === "derived" && key === "alpha-selection/index",
    ).method,
    "provider-reply-sha256/v2",
  );

  const editionBytes = Buffer.from(JSON.stringify(f.project) + "\n");
  alpha.manifest.selected.edition = {
    id: f.project.id,
    editor: f.project.editor,
    bytes: editionBytes.length,
    sha256: sha(editionBytes),
    resources: [],
  };
  alpha.manifest.delivery.inputs.push({
    id: "authored-edition",
    path: "edition.json",
    mediaType: "application/json",
    bytes: editionBytes.length,
    sha256: sha(editionBytes),
  });
  alpha.manifest.delivery.editionInput = "authored-edition";
  f.request.edition = { kind: "provider", provider: "alpha-selection" };
  const executableEdition = await materializeExecutableAlpha(f);
  assert.equal(executableEdition.lockSha256, declarative.lockSha256);
  assert.notDeepEqual(executableEdition.invocations, declarative.invocations);
  assert.equal(
    executableEdition.readEvidence.items.find(({ kind }) => kind === "edition").method,
    "provider-input-sha256/v2",
  );
});

test("direct, declarative, and executable Edition resources share exact identity", async (t) => {
  const f = await fixture(t);
  const palette = Buffer.from('{"palette":"stone"}\n');
  f.project.visualPolicy.override = "palette.json";
  await fs.writeFile(path.join(f.root, "edition/palette.json"), palette);
  const direct = await f.materialize();

  const alpha = f.providers.alpha;
  f.request.edition = { kind: "provider", provider: "alpha-selection" };
  supplyEdition(alpha, f.project);
  alpha.manifest.selected.edition.resources = [
    { ref: "palette.json", bytes: palette.length, sha256: sha(palette) },
  ];
  alpha.manifest.delivery.files.push({
    kind: "edition-resource",
    id: "palette.json",
    path: "assets/palette.json",
  });
  await fs.mkdir(path.join(alpha.directory, "assets"));
  const selectedPalette = path.join(alpha.directory, "assets/palette.json");
  await fs.writeFile(selectedPalette, palette);
  const declarative = await f.materialize();
  assert.equal(declarative.lockSha256, direct.lockSha256);
  assert.notDeepEqual(declarative.invocations, direct.invocations);

  await prepareExecutableAlpha(f);
  const editionBytes = Buffer.from(JSON.stringify(f.project) + "\n");
  alpha.manifest.delivery.inputs.push(
    {
      id: "authored-edition",
      path: "edition.json",
      mediaType: "application/json",
      bytes: editionBytes.length,
      sha256: sha(editionBytes),
    },
    {
      id: "palette",
      path: "assets/palette.json",
      mediaType: "application/json",
      bytes: palette.length,
      sha256: sha(palette),
    },
  );
  alpha.manifest.delivery.editionInput = "authored-edition";
  alpha.manifest.delivery.editionResourceInputs = [{ ref: "palette.json", input: "palette" }];
  const executable = await materializeExecutableAlpha(f);
  assert.equal(executable.lockSha256, direct.lockSha256);
  assert.notDeepEqual(executable.invocations, direct.invocations);
  assert.notDeepEqual(executable.invocations, declarative.invocations);
  assert.deepEqual(executable.readEditionResource("palette.json"), palette);
  assert.equal(
    executable.readEvidence.items.find(({ kind }) => kind === "edition-resource").method,
    "provider-input-sha256/v2",
  );

  const changed = Buffer.from('{"palette":"slate"}\n');
  await fs.writeFile(selectedPalette, changed);
  alpha.manifest.selected.edition.resources[0].bytes = changed.length;
  alpha.manifest.selected.edition.resources[0].sha256 = sha(changed);
  const paletteInput = alpha.manifest.delivery.inputs.find(({ id }) => id === "palette");
  paletteInput.bytes = changed.length;
  paletteInput.sha256 = sha(changed);
  const different = await materializeExecutableAlpha(f);
  assert.notEqual(different.lockSha256, executable.lockSha256);
});
