import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { readSourceBundle } from "../packages/publisher/src/source/bundle.mjs";
import { validateEditionProject } from "../packages/publisher/src/edition/authoring.mjs";
import { validateClaimModel } from "../packages/publisher/src/semantics/document.mjs";
import { root, sha256, encode, request } from "./fixtures/self-edition.mjs";

test("self preparation selects one direct Project instead of a legacy Edition authority", async (t) => {
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-project-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const output = path.join(parent, "prepared");
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const prepared = await prepareArchitecturePublisherEdition(await request(output));
  assert.equal(prepared.project, path.join(output, "build-input/edition/project.json"));
  assert.equal(prepared.projectSha256, sha256(await fs.readFile(prepared.project)));
  assert.equal(prepared.edition, undefined);
  assert.equal(prepared.plan, undefined);
  await assert.rejects(fs.stat(path.join(output, "edition.json")), { code: "ENOENT" });
  await assert.rejects(fs.stat(path.join(output, "plan.json")), { code: "ENOENT" });
  const project = JSON.parse(await fs.readFile(prepared.project, "utf8"));
  assert.deepEqual(project.presentation.static.views[0].questions, ["system-map"]);
  assert.equal(
    project.scope.selections.filter(
      ({ reference, questions }) =>
        reference.startsWith("claim:") && questions.includes("system-map"),
    ).length,
    0,
  );
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);
  const model = validateClaimModel(
    JSON.parse(bundle.members.find(({ path: name }) => name === "semantic.json").content),
  );
  assert.equal(model.entities.edition.label, "Edition Project");
  assert.deepEqual(model.entities.edition.provenance, ["self-project-owner"]);
  assert.equal(model.claims["role-edition"].condition.schema, "architecture.edition-project/v1");
  assert.deepEqual(model.claims["role-build-request"].condition, {
    schema: "architecture.build-request/v1",
    selection: "direct-model-and-project",
    output: "caller-selected",
  });
  assert.equal(Object.hasOwn(model.relations, "bundle-selects-build"), false);
  assert.equal(model.claims["flow-claims-select-build"].condition.member, "model.json");
  assert.equal(model.claims["flow-edition-selects-build"].condition.identity, "project-bytes");
  assert.equal(
    model.claims["role-evolution-inputs"].condition.schema,
    "architecture.semantic-compare-input/v3",
  );
  assert.equal(Object.hasOwn(model.sources, "edition-contract"), false);
});

test("self preparation reports the selected core package version without a duplicate Edition", async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-version-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const selected = JSON.parse(
    await fs.readFile(path.join(root, "packages/publisher/package.json"), "utf8"),
  );
  selected.version = "0.3.0-alpha.99";
  const bytes = encode(selected);
  const selectedPath = path.join(parent, "selected-package.json");
  await fs.writeFile(selectedPath, bytes);
  const input = await request(path.join(parent, "prepared"));
  input.sources["core-package"] = { path: selectedPath, sha256: sha256(bytes) };
  const prepared = await prepareArchitecturePublisherEdition(input);
  assert.equal(prepared.selectedCoreVersion, "0.3.0-alpha.99");
  assert.equal(prepared.edition, undefined);
});

test("self-authored interactive pages refuse missing or extra semantic carriers", async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const { composeArchitecturePublisherInteractiveScene } =
    await import("../editions/self/src/edition/interactive-scene.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-interactive-admission-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await prepareArchitecturePublisherEdition(
    await request(path.join(parent, "prepared")),
  );
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);
  const model = validateClaimModel(
    JSON.parse(bundle.members.find(({ path: name }) => name === "semantic.json").content),
  );
  const project = validateEditionProject(JSON.parse(await fs.readFile(prepared.project, "utf8")));
  const { architecturePublisherInteractiveScenes } =
    await import("../editions/self/src/edition/interactive-scenes.mjs");
  const catalog = architecturePublisherInteractiveScenes();
  const viewFor = (id) => {
    const authored = catalog[id];
    return {
      id,
      label: authored.label,
      purpose: authored.purpose,
      ...structuredClone(authored.composition),
    };
  };
  const overview = viewFor("overview");
  const composed = composeArchitecturePublisherInteractiveScene(model, project, overview);
  assert(composed.nodes.length > 0);
  for (const id of Object.keys(catalog)) {
    const input = composeArchitecturePublisherInteractiveScene(model, project, viewFor(id));
    assert.equal(Object.hasOwn(input, "viewport"), false, `${id}: internal desktop composition`);
    for (const node of input.nodes) {
      assert.equal(Object.hasOwn(node, "position"), false, `${id}: internal node placement`);
      assert.equal(Object.hasOwn(node, "size"), false, `${id}: internal glyph measurement`);
    }
    for (const edge of input.edges)
      assert.equal(
        ["route", "fromSide", "toSide", "waypoints", "labelPlacement"].some((field) =>
          Object.hasOwn(edge, field),
        ),
        false,
        `${id}: native route ownership`,
      );
  }

  assert.throws(
    () =>
      composeArchitecturePublisherInteractiveScene(model, project, { ...overview, id: "other" }),
    { code: "self_interactive_layout_missing" },
  );
  const missingGroup = structuredClone(overview);
  missingGroup.groups.pop();
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, project, missingGroup), {
    code: "self_interactive_group_missing",
  });
  const missingRelation = structuredClone(overview);
  const selectedRelation = composed.edges[0].semanticIds[0].slice("relation:".length);
  missingRelation.relations = missingRelation.relations.filter(({ id }) => id !== selectedRelation);
  assert.throws(
    () => composeArchitecturePublisherInteractiveScene(model, project, missingRelation),
    { code: "self_interactive_relation_invalid" },
  );
  const extraGroup = structuredClone(overview);
  extraGroup.groups.push({ id: "not-authored", label: "Not selected", entities: [] });
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, project, extraGroup), {
    code: "self_interactive_group_coverage_invalid",
  });
  const unrepresented = structuredClone(overview);
  unrepresented.relations.push({ id: selectedRelation });
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, project, unrepresented), {
    code: "self_interactive_relation_coverage_invalid",
  });
  const semantics = viewFor("semantics");
  semantics.groups = semantics.groups.filter(({ id }) => id !== "sources");
  assert.throws(() => composeArchitecturePublisherInteractiveScene(model, project, semantics), {
    code: "self_interactive_edge_endpoint_missing",
  });
});

test("self Edition preparation rejects malformed selected inputs before output effects", async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-admission-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const output = path.join(parent, "prepared");
  const baseline = await request(output);
  for (const [name, mutate, code] of [
    ["missing input", () => null, "self_input_invalid"],
    [
      "foreign source owner",
      (input) => ((input.source.id = "foreign"), input),
      "self_input_invalid",
    ],
    [
      "unselected source key",
      (input) => ((input.sources.unknown = input.sources["core-package"]), input),
      "self_input_invalid",
    ],
    [
      "relative source path",
      (input) => ((input.sources["core-package"].path = "package.json"), input),
      "self_source_invalid",
    ],
    [
      "invalid source digest",
      (input) => ((input.sources["core-package"].sha256 = "unbound"), input),
      "self_source_invalid",
    ],
    [
      "relative output",
      (input) => ((input.output = "prepared"), input),
      "self_output_path_invalid",
    ],
  ]) {
    const invalid = mutate(structuredClone(baseline));
    await assert.rejects(prepareArchitecturePublisherEdition(invalid), { code }, name);
    await assert.rejects(fs.access(output), { code: "ENOENT" });
  }

  const parentFile = path.join(parent, "not-a-directory");
  await fs.writeFile(parentFile, "foreign bytes");
  await assert.rejects(
    prepareArchitecturePublisherEdition({ ...baseline, output: path.join(parentFile, "prepared") }),
    { code: "self_output_parent_invalid" },
  );
  assert.equal(await fs.readFile(parentFile, "utf8"), "foreign bytes");

  const alteredSource = path.join(parent, "altered-package.json");
  await fs.writeFile(alteredSource, '{"not":"the selected package"}\n');
  const changed = structuredClone(baseline);
  changed.sources["core-package"].path = alteredSource;
  await assert.rejects(prepareArchitecturePublisherEdition(changed), {
    code: "self_source_digest_mismatch",
  });
  await assert.rejects(fs.access(output), { code: "ENOENT" });
});

test("self Edition rejects a selected core package with foreign product identity", async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-foreign-package-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const bytes = encode({ name: "foreign-publisher", version: "0.3.0-alpha.2" });
  const selectedPath = path.join(parent, "foreign-package.json");
  await fs.writeFile(selectedPath, bytes);
  const input = await request(path.join(parent, "prepared"));
  input.sources["core-package"] = { path: selectedPath, sha256: sha256(bytes) };
  await assert.rejects(prepareArchitecturePublisherEdition(input), {
    code: "self_core_package_invalid",
  });
});

test("self Edition rejects duplicate core-package identity before output", async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-duplicate-package-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const selected = JSON.parse(
    await fs.readFile(path.join(root, "packages/publisher/package.json"), "utf8"),
  );
  const bytes = Buffer.from(
    JSON.stringify(selected).replace('"name":', '"name":"foreign-publisher","name":') + "\n",
  );
  const selectedPath = path.join(parent, "duplicate-package.json");
  await fs.writeFile(selectedPath, bytes);
  const output = path.join(parent, "prepared");
  const input = await request(output);
  input.sources["core-package"] = { path: selectedPath, sha256: sha256(bytes) };
  await assert.rejects(prepareArchitecturePublisherEdition(input), {
    code: "self_core_package_json_duplicate_key",
  });
  await assert.rejects(fs.access(output), { code: "ENOENT" });
});

test("self Edition rejects duplicate selected typography facts before output", async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-duplicate-metrics-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const original = await fs.readFile(
    path.join(root, "editions/self/src/edition/static/authoring/metrics.json"),
    "utf8",
  );
  const bytes = Buffer.from(original.replace('"schema":', '"schema":"forged-metrics","schema":'));
  assert.notEqual(bytes.toString(), original);
  const selectedPath = path.join(parent, "duplicate-metrics.json");
  await fs.writeFile(selectedPath, bytes);
  const output = path.join(parent, "prepared");
  const input = await request(output);
  input.sources["self-static-metrics"] = { path: selectedPath, sha256: sha256(bytes) };
  await assert.rejects(prepareArchitecturePublisherEdition(input), {
    code: "self_refinement_metric_json_duplicate_key",
  });
  await assert.rejects(fs.access(output), { code: "ENOENT" });
});

test("self Edition input rejects duplicate output authority before effects", async (t) => {
  const { prepareArchitecturePublisherEditionInput } =
    await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-duplicate-input-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const output = path.join(parent, "prepared");
  const input = await request(output);
  const bytes = Buffer.from(
    JSON.stringify(input).replace('"output":', '"output":"elsewhere","output":') + "\n",
  );
  const inputFile = path.join(parent, "duplicate-input.json");
  await fs.writeFile(inputFile, bytes);
  await assert.rejects(prepareArchitecturePublisherEditionInput(inputFile), {
    code: "self_input_json_duplicate_key",
  });
  await assert.rejects(fs.access(output), { code: "ENOENT" });
});

test("the self-publication entry canonicalizes an absent output below a filesystem alias", async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-alias-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const physical = path.join(parent, "physical");
  const alias = path.join(parent, "alias");
  await fs.mkdir(physical);
  await fs.symlink(physical, alias, "dir");
  const prepared = await prepareArchitecturePublisherEdition(
    await request(path.join(alias, "prepared")),
  );
  assert.equal(
    prepared.project,
    path.join(physical, "prepared", "build-input", "edition", "project.json"),
  );
  assert.equal(path.dirname(prepared.sourceManifest), path.join(physical, "prepared", "source"));
});

test("prepared output admission never replaces a concurrently created destination", async (t) => {
  const { installPreparedOutput } = await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-race-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const staged = path.join(parent, "staged"),
    destination = path.join(parent, "prepared"),
    marker = path.join(destination, "foreign-marker");
  await fs.mkdir(staged);
  await fs.writeFile(path.join(staged, "edition.json"), "owned staged bytes");
  await fs.mkdir(destination);
  await fs.writeFile(marker, "foreign bytes");
  await assert.rejects(installPreparedOutput(staged, destination), {
    code: "self_output_exists",
  });
  assert.equal(await fs.readFile(marker, "utf8"), "foreign bytes");
  assert.equal(await fs.readFile(path.join(staged, "edition.json"), "utf8"), "owned staged bytes");
});

test("prepared output installation never replaces a member arriving after reservation", async (t) => {
  const { installPreparedOutput } = await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-member-race-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const staged = path.join(parent, "staged"),
    destination = path.join(parent, "prepared"),
    marker = path.join(destination, "edition.json");
  await fs.mkdir(staged);
  await fs.writeFile(path.join(staged, "edition.json"), "owned staged bytes");
  let injected = false;
  await assert.rejects(
    installPreparedOutput(staged, destination, async () => {
      injected = true;
      await fs.writeFile(marker, "foreign bytes", { flag: "wx" });
    }),
    { code: "self_output_member_exists" },
  );
  assert.equal(injected, true);
  assert.equal(await fs.readFile(marker, "utf8"), "foreign bytes");
  assert.equal(await fs.readFile(path.join(staged, "edition.json"), "utf8"), "owned staged bytes");
});

test("prepared output installation never replaces a nested member arriving during copy", async (t) => {
  const { installPreparedOutput } = await import("../editions/self/src/edition/prepare.mjs");
  const scratch = path.join(root, "build/test-work");
  await fs.mkdir(scratch, { recursive: true });
  const parent = await fs.mkdtemp(path.join(scratch, "publisher-self-nested-race-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const staged = path.join(parent, "staged"),
    destination = path.join(parent, "prepared"),
    marker = path.join(destination, "source", "semantic.json");
  await fs.mkdir(path.join(staged, "source"), { recursive: true });
  await fs.writeFile(path.join(staged, "source", "semantic.json"), "owned staged bytes");
  await assert.rejects(
    installPreparedOutput(staged, destination, async (event) => {
      if (event?.phase !== "directory-reserved" || event.path !== "source") return;
      await fs.writeFile(marker, "foreign bytes", { flag: "wx" });
    }),
    { code: "self_output_member_exists" },
  );
  assert.equal(await fs.readFile(marker, "utf8"), "foreign bytes");
  assert.equal(
    await fs.readFile(path.join(staged, "source", "semantic.json"), "utf8"),
    "owned staged bytes",
  );
});
