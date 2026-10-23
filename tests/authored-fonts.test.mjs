import assert from "node:assert/strict";

import fs from "node:fs/promises";

import path from "node:path";

import test from "node:test";

import { validateEditionProject } from "../packages/publisher/src/edition/authoring.mjs";

import { selectedEditionResources } from "../packages/publisher/src/edition/resources.mjs";

import { parseSelectedSceneRefinement } from "../packages/publisher/src/edition/refinement.mjs";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";

import { editionProviderPackageDigest } from "../packages/publisher/src/provider/index.mjs";

import { measureArchitectureTypography } from "../packages/publisher/renderers/archify/text.mjs";

import { meaningFor } from "./fixtures/authored-routes.mjs";

import { sha, selectedProject, fontInput } from "./fixtures/authored-fonts.mjs";

test("infeasible overview refusal preserves official native source reader aspect-ratio admission", async () => {
  const file = new URL(
    "../packages/publisher/renderers/archify/supply/renderers/shared/desktop-readability.mjs",
    import.meta.url,
  );
  const original = await fs.readFile(file);
  const scene = {
    viewport: { width: 600, height: 900 },
    typography: { minimumTextPx: 16 },
    nodes: [],
    edges: [],
  };
  const fonts = await loadBundledFonts();
  const measured = { layouts: {}, supplies: [] };
  await assert.rejects(measureArchitectureTypography(scene, fonts, measured), {
    code: "render_native_rejected",
  });
  const source = await measureArchitectureTypography(scene, fonts, measured, "source");
  assert.equal(source.budget.minimum, 16);
  assert.deepEqual(await fs.readFile(file), original);
  const native = await import(file.href);
  assert.equal(
    native.declaredWideReadabilityBudget({
      viewBoxWidth: 600,
      viewBoxHeight: 900,
      minimumSourceTextPx: 16,
      requestedMinimumTextPx: 16,
    }),
    null,
  );
});

test("Edition font selection binds exact face resources and attributed evidence", async () => {
  const value = selectedProject(await loadBundledFonts());
  assert.doesNotThrow(() => validateEditionProject(value));
  const duplicate = structuredClone(value);
  duplicate.visualPolicy.fonts.push(structuredClone(value.visualPolicy.fonts[0]));
  assert.throws(() => validateEditionProject(duplicate), { code: "edition_project_invalid" });
  const absent = structuredClone(value);
  absent.visualPolicy.fonts[0].distribution = [];
  assert.throws(() => validateEditionProject(absent), { code: "edition_project_invalid" });
  const variable = structuredClone(value);
  variable.visualPolicy.fonts[0].faces[0].weight = "400 700";
  assert.throws(() => validateEditionProject(variable), { code: "edition_project_invalid" });
  const repeatedWeight = structuredClone(value);
  repeatedWeight.visualPolicy.fonts[0].faces.push(
    structuredClone(repeatedWeight.visualPolicy.fonts[0].faces[0]),
  );
  assert.throws(() => validateEditionProject(repeatedWeight), { code: "edition_project_invalid" });
  const excessive = structuredClone(value);
  excessive.visualPolicy.fonts[0].distribution = Array.from({ length: 64 }, (_, index) => ({
    ref: `fonts/evidence-${index}.txt`,
    sha256: "a".repeat(64),
  }));
  assert.throws(() => validateEditionProject(excessive), { code: "edition_project_invalid" });
});

test("the shared Edition resource owner deduplicates exact pins and refuses conflicting identities", async () => {
  const project = selectedProject(await loadBundledFonts());
  const first = project.visualPolicy.fonts[0];
  const second = structuredClone(first);
  second.id = "second";
  project.visualPolicy.fonts.push(second);
  const resources = selectedEditionResources(project);
  assert.deepEqual(resources, [
    { ref: "refinement.json", sha256: null },
    ...first.faces.map(({ ref, sha256 }) => ({ ref, sha256 })),
    ...first.distribution,
  ]);
  for (const mutate of [
    (value) => (value.visualPolicy.fonts[1].id = first.id),
    (value) => value.visualPolicy.fonts[0].faces.push(structuredClone(first.faces[0])),
    (value) => (value.visualPolicy.fonts[1].faces[0].sha256 = "b".repeat(64)),
    (value) => (value.visualPolicy.fonts[1].faces[0].ref = "Fonts/400.ttf"),
    (value) => (value.visualPolicy.override = first.faces[0].ref),
  ]) {
    const changed = structuredClone(project);
    mutate(changed);
    assert.throws(() => selectedEditionResources(changed), { code: "edition_project_invalid" });
  }
  const excessive = structuredClone(project);
  excessive.visualPolicy.fonts[0].distribution = Array.from({ length: 64 }, (_, index) => ({
    ref: `fonts/evidence-${index}.txt`,
    sha256: "a".repeat(64),
  }));
  assert.throws(() => selectedEditionResources(excessive), { code: "edition_project_invalid" });
  assert.deepEqual(selectedEditionResources({ visualPolicy: { profile: "neutral" } }), []);
});

test("authored media select optional default and text-local fonts without widening neutral seams", () => {
  const value = {
    schema: "architecture.scene-refinement/v1",
    media: {
      static: meaningFor("static").refinement.media.static,
      interactive: meaningFor("interactive").refinement.media.interactive,
    },
  };
  value.media.static.font = "reading";
  value.media.interactive.font = "reading";
  value.media.static.scene.texts[0].font = "reading";
  value.media.static.scene.texts[0].weight = "500";
  value.media.interactive.pages[0].scene.texts[0].weight = "700";
  assert.doesNotThrow(() =>
    parseSelectedSceneRefinement(
      Buffer.from(JSON.stringify(value)),
      ["static", "interactive"],
      "a".repeat(64),
    ),
  );
  value.media.interactive = { kind: "neutral", font: "reading" };
  assert.throws(
    () =>
      parseSelectedSceneRefinement(
        Buffer.from(JSON.stringify(value)),
        ["static", "interactive"],
        "a".repeat(64),
      ),
    { code: "scene_refinement_invalid" },
  );
});

test("direct input materializes the exact font closure once and survives consumer relocation", async (t) => {
  const input = await fontInput(t);
  const selected = await input.materialize();
  assert.equal(selected.lock.edition.resources.length, 6);
  for (const [ref, bytes] of input.resources)
    assert.deepEqual(selected.readEditionResource(ref), bytes);
  const relocated = path.join(input.root, "relocated");
  await fs.mkdir(relocated);
  await fs.cp(path.join(input.root, "edition"), path.join(relocated, "edition"), {
    recursive: true,
  });
  await fs.cp(path.join(input.root, "sources"), path.join(relocated, "sources"), {
    recursive: true,
  });
  await fs.copyFile(
    path.join(input.root, "build-request.json"),
    path.join(relocated, "build-request.json"),
  );
  const bytes = await fs.readFile(path.join(relocated, "build-request.json"));
  const moved = await materializeBuildRequestInput(
    path.join(relocated, "build-request.json"),
    sha(bytes),
  );
  assert.equal(moved.lockSha256, selected.lockSha256);
});

test("a changed selected face pin is refused before semantic compilation", async (t) => {
  const input = await fontInput(t);
  await fs.appendFile(path.join(input.root, "edition/fonts/500.ttf"), "changed");
  await assert.rejects(input.materialize(), {
    code: "materialized_edition_resource_digest_mismatch",
  });
});

test("a missing selected distribution resource cannot be recovered from the bundled license", async (t) => {
  const input = await fontInput(t);
  await fs.unlink(path.join(input.root, "edition/fonts/OFL.txt"));
  await assert.rejects(input.materialize(), { code: "ENOENT" });
});

test("exact selected font closure is identical across direct declarative and executable delivery", async (t) => {
  const input = await fontInput(t);
  const direct = await input.materialize();
  const requestPath = path.join(input.root, "build-request.json");
  const request = JSON.parse(await fs.readFile(requestPath, "utf8"));
  const projectBytes = await fs.readFile(path.join(input.root, "edition/project.json"));
  const native = await fs.readFile(path.join(input.root, "sources/model.json"));
  const manifest = {
    schema: "architecture.edition-provider/v2",
    provider: { id: "font-input", revision: "1" },
    selected: {
      native: [
        {
          id: "model",
          namespace: "fixture/routes",
          claimant: "example:source",
          format: { id: "example/native-json", version: "1" },
          revision: { kind: "content", algorithm: "sha256" },
          bytes: native.length,
          sha256: sha(native),
        },
      ],
      derived: [],
      edition: {
        id: input.project.id,
        editor: input.project.editor,
        bytes: projectBytes.length,
        sha256: sha(projectBytes),
        resources: [...input.resources].map(([ref, content]) => ({
          ref,
          bytes: content.length,
          sha256: sha(content),
        })),
      },
    },
    delivery: {
      kind: "declarative",
      files: [
        { kind: "native", id: "model", path: "sources/model.json" },
        { kind: "edition", id: input.project.id, path: "edition/project.json" },
        ...[...input.resources.keys()].map((ref) => ({
          kind: "edition-resource",
          id: ref,
          path: `edition/${ref}`,
        })),
      ],
    },
  };
  request.edition = { kind: "provider", provider: "selected-font-input" };
  request.sources = [];
  request.providers = [
    { id: "selected-font-input", manifest: "provider.json", sha256: "a".repeat(64) },
  ];
  const save = async () => {
    const bytes = Buffer.from(JSON.stringify(manifest));
    await fs.writeFile(path.join(input.root, "provider.json"), bytes);
    request.providers[0].sha256 = sha(bytes);
    const requestBytes = Buffer.from(JSON.stringify(request));
    await fs.writeFile(requestPath, requestBytes);
    return sha(requestBytes);
  };
  const declarative = await materializeBuildRequestInput(requestPath, await save());
  assert.equal(declarative.lockSha256, direct.lockSha256);
  const packageRoot = path.join(input.root, "provider-package");
  await fs.mkdir(packageRoot);
  const packageJson = Buffer.from(
    JSON.stringify({
      name: "@fixture/font-provider",
      version: "1.0.0",
      type: "module",
      exports: { "./provider": "./provider.mjs" },
    }),
  );
  await fs.writeFile(path.join(packageRoot, "package.json"), packageJson);
  await fs.writeFile(
    path.join(packageRoot, "provider.mjs"),
    "export async function materializeEditionProvider() { return { schema: 'architecture.edition-provider-reply/v2', derived: [] }; }\n",
  );
  const resources = [...input.resources].map(([ref, content], index) => ({
    id: `resource-${index}`,
    ref,
    content,
  }));
  manifest.delivery = {
    kind: "executable",
    package: {
      name: "@fixture/font-provider",
      version: "1.0.0",
      packageJsonSha256: sha(packageJson),
      contentSha256: await editionProviderPackageDigest(packageRoot),
      entrypoint: "./provider",
    },
    inputs: [
      {
        id: "native",
        path: "sources/model.json",
        mediaType: "application/json",
        bytes: native.length,
        sha256: sha(native),
      },
      {
        id: "edition",
        path: "edition/project.json",
        mediaType: "application/json",
        bytes: projectBytes.length,
        sha256: sha(projectBytes),
      },
      ...resources.map(({ id, ref, content }) => ({
        id,
        path: `edition/${ref}`,
        mediaType: ref.endsWith(".ttf") ? "font/ttf" : "application/octet-stream",
        bytes: content.length,
        sha256: sha(content),
      })),
    ],
    nativeInputs: [{ item: "model", input: "native" }],
    editionInput: "edition",
    editionResourceInputs: resources.map(({ id, ref }) => ({ ref, input: id })),
  };
  request.providers[0].packageRoot = "provider-package";
  const digest = await save();
  const executable = await materializeBuildRequestInput(requestPath, digest, [
    { id: "selected-font-input", manifestSha256: request.providers[0].sha256 },
  ]);
  assert.equal(executable.lockSha256, direct.lockSha256);
  assert.notDeepEqual(executable.invocations, declarative.invocations);
  for (const [ref, bytes] of input.resources)
    assert.deepEqual(executable.readEditionResource(ref), bytes);
});

test("logical aliases and conflicting pins cannot create two font resource authorities", async () => {
  const value = selectedProject(await loadBundledFonts());
  value.visualPolicy.fonts[0].distribution.push({ ref: "fonts/OFL.txt", sha256: "b".repeat(64) });
  assert.throws(() => validateEditionProject(value), { code: "edition_project_invalid" });
  value.visualPolicy.fonts[0].distribution.pop();
  value.visualPolicy.fonts[0].faces[0].ref = "fonts/ofl.txt";
  assert.throws(() => validateEditionProject(value), { code: "edition_project_invalid" });
});
