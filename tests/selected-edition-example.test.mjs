import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readSourceBundle } from "../packages/publisher/src/source/bundle.mjs";
import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";
import { compileEditionMeaning } from "../packages/publisher/src/compiler/meaning.mjs";
import { composeStaticSelectionLayout } from "../packages/publisher/src/scene/static/selection.mjs";
import { composeStaticEditionScene } from "../packages/publisher/src/scene/static/edition.mjs";
import { composeStaticGeometry } from "../packages/publisher/src/compiler/static-geometry.mjs";

const source = fileURLToPath(new URL("../examples/selected-edition/", import.meta.url));
const cli = fileURLToPath(new URL("../packages/publisher/src/cli/main.mjs", import.meta.url));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const inputFiles = ["build-request.json", "edition/project.json", "model.c4", "views.c4"];

async function inputSnapshot(root) {
  return {
    files: await Promise.all(
      inputFiles.map(async (name) => [name, sha(await fs.readFile(path.join(root, name)))]),
    ),
    rootEntries: (await fs.readdir(root)).sort(),
    editionEntries: (await fs.readdir(path.join(root, "edition"))).sort(),
  };
}

test("one default overview composes distinct native scopes without losing shared identity or attribution", async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-scopes-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const root = path.join(scratch, "input");
  await fs.cp(source, root, { recursive: true });
  await fs.writeFile(
    path.join(root, "model.c4"),
    "specification { element component }\nmodel {\n alpha = component 'Alpha'\n beta = component 'Beta'\n gamma = component 'Gamma'\n alpha -> beta\n beta -> gamma\n}\n",
  );
  await fs.writeFile(
    path.join(root, "views.c4"),
    "views { view ingress { include alpha,beta }\n view egress { include beta,gamma } }\n",
  );
  const projectFile = path.join(root, "edition/project.json");
  const project = JSON.parse(await fs.readFile(projectFile, "utf8"));
  project.questions = [
    { id: "entry", audience: "maintainer", text: "How does the request enter?" },
    { id: "exit", audience: "maintainer", text: "Where does the request go next?" },
  ];
  project.scope.selections = [
    {
      id: "ingress",
      namespace: "example/views",
      kind: "reference",
      reference: "view:ingress",
      questions: ["entry"],
    },
    {
      id: "egress",
      namespace: "example/views",
      kind: "reference",
      reference: "view:egress",
      questions: ["exit"],
    },
  ];
  delete project.presentation;
  delete project.visualPolicy;
  delete project.narrative;
  await fs.writeFile(projectFile, JSON.stringify(project) + "\n");
  const requestFile = path.join(root, "build-request.json");
  const request = JSON.parse(await fs.readFile(requestFile, "utf8"));
  for (const item of request.sources) item.input = { kind: "locator", path: item.input.path };
  delete request.providers;
  delete request.toolchain;
  await fs.writeFile(requestFile, JSON.stringify(request) + "\n");
  const digest = sha(await fs.readFile(requestFile));
  const before = await inputSnapshot(root);
  const output = path.join(scratch, "candidate");
  const built = spawnSync(
    process.execPath,
    [cli, "edition", "build", requestFile, "--sha256", digest, "--output", output],
    {
      cwd: root,
      env: { HOME: root, PATH: root, LANG: "C.UTF-8" },
      encoding: "utf8",
      timeout: 45_000,
    },
  );
  assert.equal(built.status, 0, built.stdout + built.stderr);
  const result = JSON.parse(built.stdout);
  const bundle = await readSourceBundle(result.manifestPath, result.manifestSha256);
  const member = (name) => bundle.members.find(({ path: file }) => file === name).content;
  assert.equal(member("static/architecture.png").readUInt32BE(16), 6000);
  for (const name of ["static/architecture.svg", "interactive/architecture.html"]) {
    const text = member(name).toString("utf8");
    for (const label of ["Alpha", "Beta", "Gamma", ...project.questions.map(({ text }) => text)])
      assert(text.includes(label), `${name} omits ${label}`);
    if (name.endsWith(".svg")) assert.doesNotMatch(text, /undefined/u);
  }
  assert.equal(JSON.parse(member("candidate.json")).qualification, "unqualified");
  const selected = await materializeBuildRequestInput(requestFile, digest);
  const meaning = await compileEditionMeaning(selected);
  assert.deepEqual(meaning.media.static.views[0].questionIds, ["entry", "exit"]);
  assert.equal(meaning.media.static.views.length, 1);
  assert.equal(meaning.media.interactive.views.length, 1);
  const layout = await composeStaticSelectionLayout(meaning, composeStaticGeometry);
  const scene = composeStaticEditionScene(meaning, layout);
  assert.deepEqual(scene.nodes.map(({ id }) => id).sort(), ["alpha", "beta", "gamma"]);
  assert.equal(scene.edges.length, 2);
  assert.deepEqual(
    scene.sourceAssertionCarriers.map(({ selectionId, nodeRefs, relationRefs }) => ({
      selectionId,
      nodes: nodeRefs.map(({ id }) => id).sort(),
      relationCount: relationRefs.length,
    })),
    [
      { selectionId: "ingress", nodes: ["alpha", "beta"], relationCount: 1 },
      { selectionId: "egress", nodes: ["beta", "gamma"], relationCount: 1 },
    ],
  );
  assert.deepEqual(await inputSnapshot(root), before);
});

test("an independent Edition builds after relocation without writing selected sources", async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-example-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const sourceBefore = await inputSnapshot(source);
  const example = JSON.parse(await fs.readFile(path.join(source, "edition/project.json")));
  assert.equal(
    example.presentation,
    undefined,
    "the normal example must use intrinsic media defaults",
  );
  assert.equal(
    example.visualPolicy,
    undefined,
    "the normal example must not require an icon catalog",
  );
  const results = [];
  for (const name of ["first", "relocated"]) {
    const root = path.join(scratch, name);
    await fs.cp(source, root, { recursive: true });
    const projectFile = path.join(root, "edition/project.json");
    const project = JSON.parse(await fs.readFile(projectFile, "utf8"));
    project.editor = "independent-editor";
    project.title = "Example maintainers officially endorse this Edition";
    project.narrative.summary = "An official source-approved architecture.";
    await fs.writeFile(projectFile, JSON.stringify(project, null, 2) + "\n");
    const inputBefore = await inputSnapshot(root);
    const request = path.join(root, "build-request.json");
    const digest = sha(await fs.readFile(request));
    const output = path.join(scratch, `${name}-candidate`);
    const built = spawnSync(
      process.execPath,
      [cli, "edition", "build", request, "--sha256", digest, "--output", output],
      {
        cwd: root,
        env: { HOME: root, PATH: root, LANG: "C.UTF-8" },
        encoding: "utf8",
        timeout: 30_000,
      },
    );
    assert.equal(built.status, 0, built.stdout + built.stderr);
    const result = JSON.parse(built.stdout);
    const bundle = await readSourceBundle(result.manifestPath, result.manifestSha256);
    assert.deepEqual(
      new Set(bundle.members.map(({ path: member }) => member)),
      new Set([
        "candidate.json",
        "input-lock.json",
        "static/architecture.svg",
        "static/architecture.png",
        "interactive/architecture.html",
      ]),
    );
    const candidate = JSON.parse(
      bundle.members.find(({ path: member }) => member === "candidate.json").content,
    );
    assert.equal(
      bundle.members
        .find(({ path: member }) => member === "static/architecture.png")
        .content.readUInt32BE(16),
      6000,
    );
    const lock = JSON.parse(
      bundle.members.find(({ path: member }) => member === "input-lock.json").content,
    );
    assert.equal(candidate.qualification, "unqualified");
    assert.deepEqual(Object.keys(candidate.media).sort(), ["interactive", "static"]);
    assert.equal(lock.edition.editor, "independent-editor");
    assert.deepEqual(
      lock.sources.map(({ claimant }) => claimant),
      ["example-maintainer", "example-maintainer"],
    );
    const staticSvg = bundle.members
      .find(({ path: member }) => member === "static/architecture.svg")
      .content.toString("utf8");
    const interactiveHtml = bundle.members
      .find(({ path: member }) => member === "interactive/architecture.html")
      .content.toString("utf8");
    assert.match(
      staticSvg,
      /<text[^>]*>Editorial framing by independent-editor · source endorsement not evidenced here<\/text>/u,
    );
    assert.match(
      interactiveHtml,
      /<[^>]+class="editorial-framing"[^>]*>Editorial framing by independent-editor · source endorsement not evidenced here<\//u,
    );
    assert.deepEqual(await inputSnapshot(root), inputBefore);
    results.push(result.manifestSha256);
  }
  assert.equal(results[0], results[1]);
  assert.deepEqual(await inputSnapshot(source), sourceBefore);
});

test("viewless native input builds both media with intrinsic defaults and preserves exact locks", async (t) => {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-defaults-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const root = path.join(scratch, "input");
  await fs.cp(source, root, { recursive: true });
  await fs.rm(path.join(root, "views.c4"));
  const projectFile = path.join(root, "edition/project.json");
  const project = JSON.parse(await fs.readFile(projectFile, "utf8"));
  project.scope.sourceNamespaces = ["example/model"];
  project.scope.selections = [
    {
      id: "connection",
      namespace: "example/model",
      kind: "reference",
      reference: "relation:4:8",
      questions: ["flow"],
    },
  ];
  delete project.presentation;
  delete project.visualPolicy;
  delete project.omissions;
  delete project.scope.limits;
  delete project.narrative;
  await fs.writeFile(projectFile, JSON.stringify(project) + "\n");
  const requestFile = path.join(root, "build-request.json");
  const request = JSON.parse(await fs.readFile(requestFile, "utf8"));
  request.sources = request.sources.filter(({ id }) => id === "model");
  request.sources[0].input = { kind: "locator", path: "model.c4" };
  delete request.providers;
  delete request.toolchain;
  await fs.writeFile(requestFile, JSON.stringify(request) + "\n");
  const requestDigest = sha(await fs.readFile(requestFile));
  const selectedFiles = ["model.c4", "edition/project.json", "build-request.json"];
  const snapshot = async () =>
    Promise.all(
      selectedFiles.map(async (file) => [file, sha(await fs.readFile(path.join(root, file)))]),
    );
  const before = await snapshot();
  const build = async (input, output) => {
    const run = spawnSync(
      process.execPath,
      [
        cli,
        "edition",
        "build",
        path.join(input, "build-request.json"),
        "--sha256",
        requestDigest,
        "--output",
        output,
      ],
      {
        cwd: input,
        env: { HOME: input, PATH: input, LANG: "C.UTF-8" },
        encoding: "utf8",
        timeout: 30_000,
      },
    );
    assert.equal(run.status, 0, run.stdout + run.stderr);
    const result = JSON.parse(run.stdout);
    return readSourceBundle(result.manifestPath, result.manifestSha256);
  };
  const output = path.join(scratch, "first");
  const first = await build(root, output);
  const firstLock = first.members.find(({ path: file }) => file === "input-lock.json").content;
  const firstCandidate = JSON.parse(
    first.members.find(({ path: file }) => file === "candidate.json").content,
  );
  assert.equal(firstCandidate.qualification, "unqualified");
  assert.deepEqual(Object.keys(firstCandidate.media).sort(), ["interactive", "static"]);
  assert.equal(
    first.members
      .find(({ path: file }) => file === "static/architecture.png")
      .content.readUInt32BE(16),
    6000,
  );
  const svg = first.members
    .find(({ path: file }) => file === "static/architecture.svg")
    .content.toString("utf8");
  assert(svg.includes("Alpha") && svg.includes("Beta"));
  assert.match(svg, /lucide:circle/u);
  assert.doesNotMatch(svg, /undefined|One source-bound view of two connected components\./u);
  assert.match(
    first.members
      .find(({ path: file }) => file === "interactive/architecture.html")
      .content.toString("utf8"),
    /Alpha/u,
  );
  assert.deepEqual(await snapshot(), before);
  const relocated = path.join(scratch, "relocated");
  await fs.cp(root, relocated, { recursive: true });
  const again = await build(relocated, path.join(scratch, "again"));
  assert.deepEqual(
    again.members.map(({ path: file, content }) => [file, sha(content)]),
    first.members.map(({ path: file, content }) => [file, sha(content)]),
  );
  const modelFile = path.join(root, "model.c4");
  await fs.writeFile(
    modelFile,
    (await fs.readFile(modelFile, "utf8")).replace("'Alpha'", "'Changed alpha'"),
  );
  const updated = await build(root, path.join(scratch, "updated"));
  const updatedLock = updated.members.find(({ path: file }) => file === "input-lock.json").content;
  assert.notEqual(sha(firstLock), sha(updatedLock));
  assert.deepEqual(await fs.readFile(path.join(output, "input-lock.json")), firstLock);
  assert.equal(
    JSON.parse(updated.members.find(({ path: file }) => file === "candidate.json").content)
      .qualification,
    "unqualified",
  );
});
