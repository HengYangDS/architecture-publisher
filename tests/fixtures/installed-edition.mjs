import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnNativeSync, parseNpmPackRecord } from "./npm-pack-report.mjs";
import { claimModel } from "./claim-model.mjs";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

const publisher = fileURLToPath(new URL("../../packages/publisher/", import.meta.url));

export function child(command, args, cwd, environment, expectedStatus = 0) {
  const result = spawnNativeSync(command, args, {
    cwd,
    env: environment,
    input: "",
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, expectedStatus, result.stdout + result.stderr);
  return result.stdout;
}

export async function installNativeEdition({ t }) {
  const work = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-meaning-"));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const home = path.join(work, "home");
  const cache = path.join(work, "cache");
  const userConfig = path.join(work, "user.npmrc");
  const globalConfig = path.join(work, "global.npmrc");
  await fs.mkdir(home);
  await fs.writeFile(userConfig, "");
  await fs.writeFile(globalConfig, "");
  const npmEnvironment = {
    ...process.env,
    HOME: home,
    npm_config_userconfig: userConfig,
    npm_config_globalconfig: globalConfig,
    npm_config_cache: cache,
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_update_notifier: "false",
  };
  const packOutput = child(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", work],
    publisher,
    npmEnvironment,
  );
  const archive = path.join(work, parseNpmPackRecord(packOutput).filename);
  const consumer = path.join(work, "consumer");
  await fs.mkdir(consumer);
  child(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--offline",
      "--prefix",
      consumer,
      archive,
    ],
    consumer,
    npmEnvironment,
  );

  const inputs = path.join(consumer, "inputs");
  await fs.mkdir(path.join(inputs, "sources"), { recursive: true });
  await fs.mkdir(path.join(inputs, "edition"));
  const model = Buffer.from(
    "specification { element component }\nmodel { a = component 'A'\n b = component 'B'\n a -> b }\n",
  );
  const views = Buffer.from("views { view overview { include * } }\n");
  await fs.writeFile(path.join(inputs, "sources/model.c4"), model);
  await fs.writeFile(path.join(inputs, "sources/views.c4"), views);
  const namespaces = ["example/model", "example/views"];
  const project = {
    schema: "architecture.edition-project/v1",
    id: "installed-atlas",
    editor: "fixture-editor",
    title: "Installed architecture",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "shape", audience: "maintainer", text: "What is selected?" }],
    scope: {
      sourceNamespaces: namespaces,
      selections: [
        {
          id: "model",
          namespace: namespaces[0],
          kind: "reference",
          reference: "element:a",
          questions: ["shape"],
        },
        { id: "overview", namespace: namespaces[1], kind: "reference", reference: "view:overview" },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: "A selected source." },
    presentation: {
      static: { views: [{ id: "overview", questions: ["shape"] }], intent: "One overview." },
      interactive: { views: [{ id: "overview", questions: ["shape"] }], intent: "Explore." },
    },
    visualPolicy: { profile: "neutral", figureTypes: { component: "lucide:box" } },
  };
  await fs.writeFile(path.join(inputs, "edition/project.json"), JSON.stringify(project) + "\n");
  const request = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: [
      { id: "model", namespace: namespaces[0], path: "sources/model.c4", bytes: model },
      { id: "views", namespace: namespaces[1], path: "sources/views.c4", bytes: views },
    ].map(({ id, namespace, path: locator, bytes }) => ({
      id,
      namespace,
      format: { id: "likec4/dsl", version: "unversioned" },
      claimant: "fixture-maintainer",
      revision: { kind: "content", algorithm: "sha256" },
      input: { kind: "pin", path: locator, sha256: sha(bytes) },
    })),
    providers: [],
    media: ["static", "interactive"],
    toolchain: { profile: "portable" },
  };
  await fs.writeFile(path.join(inputs, "build-request.json"), JSON.stringify(request) + "\n");
  const script = `
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { materializeBuildRequestInput } from './node_modules/architecture-publisher/src/compiler/build-input.mjs';
import { compileEditionMeaning } from 'architecture-publisher/compiler';
import { importLikeC4Layout } from 'architecture-publisher/semantics';
import { composeInteractiveEditionScene, composeStaticEditionScene } from 'architecture-publisher/scene';
import { composeStaticSelectionLayout } from './node_modules/architecture-publisher/src/scene/static/selection.mjs';
import { composeStaticGeometry } from './node_modules/architecture-publisher/src/compiler/static-geometry.mjs';
import { composeStaticEditionSvg, loadFigureIconSupply } from 'architecture-publisher/renderers/svg';
const file = fileURLToPath(new URL('./inputs/build-request.json', import.meta.url));
try {
  const bytes = await fs.readFile(file);
  const digest = createHash('sha256').update(bytes).digest('hex');
  const selected = await materializeBuildRequestInput(file, digest);
  const meaning = await compileEditionMeaning(selected);
  const layout = await importLikeC4Layout({
    lock: selected.lock,
    readSource: selected.readSource,
    view: { namespace: 'example/views', id: 'overview' },
  });
  const selectedLayout = await composeStaticSelectionLayout(meaning, composeStaticGeometry);
  const staticScene = composeStaticEditionScene(meaning, selectedLayout);
  let unrelatedLayoutRefusal = null;
  try {
    composeStaticEditionScene(meaning, layout);
  } catch (error) {
    unrelatedLayoutRefusal = error.code;
  }
  const interactiveScene = composeInteractiveEditionScene(meaning);
  const staticSvg = composeStaticEditionSvg(staticScene, { icons: await loadFigureIconSupply() });
  console.log(JSON.stringify({
    status: 'ok', lock: selected.lockSha256, semantic: meaning.native.semanticDigest,
    parser: meaning.native.parserSupply.sha256,
    static: meaning.media.static.assertionIds,
    interactive: meaning.media.interactive.assertionIds,
    completeness: meaning.completeness,
    unrelatedLayoutRefusal,
    layout: {
      nodes: layout.nodes.map(({ id }) => id),
      relations: layout.edges.flatMap((edge) => edge.relations.map(({ reference }) => reference)),
      parser: layout.parserSupply.sha256,
    },
    scene: {
      completeness: staticScene.completeness,
      nodes: staticScene.nodes.map(({ id }) => id),
      relations: staticScene.edges.flatMap((edge) =>
        edge.relations.map(({ reference }) => reference)),
      bounds: staticScene.bounds,
    },
    svg: {
      sha256: createHash('sha256').update(staticSvg.bytes).digest('hex'),
      width: staticSvg.width,
      height: staticSvg.height,
      rasterWidth: staticSvg.rasterWidth,
    },
    interactiveScene: {
      completeness: interactiveScene.completeness,
      pages: interactiveScene.pages.map(({ id, questionIds, nodes, relations }) => ({
        id,
        questions: questionIds,
        nodes: nodes.map(({ id }) => id),
        relations: relations.map(({ id }) => id),
      })),
    },
  }));
} catch (error) {
  console.log(JSON.stringify({ status: 'error', code: error.code ?? 'unattributed' }));
  process.exitCode = 1;
}
`;
  await fs.writeFile(path.join(consumer, "run.mjs"), script);
  const nodeEnvironment = {
    HOME: home,
    PATH: "",
    NODE_PATH: "",
    NODE_OPTIONS: "",
    LANG: "C.UTF-8",
    ...(process.platform === "win32" && process.env.SystemRoot
      ? { SystemRoot: process.env.SystemRoot }
      : {}),
  };
  const run = (directory, expectedStatus = 0) =>
    JSON.parse(
      child(
        process.execPath,
        [path.join(directory, "run.mjs")],
        directory,
        nodeEnvironment,
        expectedStatus,
      ).trim(),
    );
  const first = run(consumer);
  assert.equal(first.status, "ok");
  assert.equal(first.completeness, "finite-unqualified-obligations");
  assert.deepEqual(first.static, ["model"]);
  assert.deepEqual(first.interactive, ["model"]);
  assert.deepEqual(first.layout.nodes, ["a", "b"]);
  assert.equal(first.layout.relations.length, 1);
  assert.equal(first.layout.parser, first.parser);
  assert.equal(first.unrelatedLayoutRefusal, "static_scene_input_invalid");
  assert.equal(first.scene.completeness, "unqualified-scene");
  assert.deepEqual(first.scene.nodes, ["a"]);
  assert.deepEqual(first.scene.relations, []);
  assert(first.scene.bounds.height > 0);
  assert.equal(first.svg.rasterWidth, 6000);
  assert(first.svg.width > first.scene.bounds.width, "the complete frame retains the source width");
  assert(first.svg.height > 0);
  assert.match(first.svg.sha256, /^[0-9a-f]{64}$/u);
  assert.equal(first.interactiveScene.completeness, "unqualified-scene");
  assert.deepEqual(first.interactiveScene.pages, [
    { id: "overview", questions: ["shape"], nodes: ["a"], relations: [] },
  ]);
  for (const value of [first.lock, first.semantic, first.parser])
    assert.match(value, /^[0-9a-f]{64}$/u);
  return { work, consumer, project, nodeEnvironment, run, first };
}

export async function verifyClaimEdition({ consumer, project, nodeEnvironment }) {
  const claimInputs = path.join(consumer, "claim-inputs");
  await fs.mkdir(path.join(claimInputs, "sources"), { recursive: true });
  await fs.mkdir(path.join(claimInputs, "edition"));
  const modelBytes = Buffer.from(JSON.stringify(claimModel()) + "\n");
  await fs.writeFile(path.join(claimInputs, "sources/model.json"), modelBytes);
  const claimProject = structuredClone(project);
  claimProject.id = "installed-claims";
  claimProject.scope.sourceNamespaces = ["example/claims"];
  claimProject.scope.selections = [
    {
      id: "claim",
      namespace: "example/claims",
      kind: "reference",
      reference: "claim:intended",
      questions: ["shape"],
    },
  ];
  await fs.writeFile(
    path.join(claimInputs, "edition/project.json"),
    JSON.stringify(claimProject) + "\n",
  );
  const claimRequest = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: [
      {
        id: "model",
        namespace: "example/claims",
        format: { id: "architecture.claim-model", version: "2" },
        claimant: "fixture-maintainer",
        revision: { kind: "content", algorithm: "sha256" },
        input: { kind: "pin", path: "sources/model.json", sha256: sha(modelBytes) },
      },
    ],
    providers: [],
    media: ["static", "interactive"],
    toolchain: { profile: "portable" },
  };
  await fs.writeFile(
    path.join(claimInputs, "build-request.json"),
    JSON.stringify(claimRequest) + "\n",
  );
  await fs.writeFile(
    path.join(consumer, "claim-run.mjs"),
    `import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { materializeBuildRequestInput } from './node_modules/architecture-publisher/src/compiler/build-input.mjs';
import { compileEditionMeaning, compileEditionCandidateInput } from 'architecture-publisher/compiler';
const file = fileURLToPath(new URL('./claim-inputs/build-request.json', import.meta.url));
try {
  const digest = createHash('sha256').update(await fs.readFile(file)).digest('hex');
  const selected = await materializeBuildRequestInput(file, digest);
  const meaning = await compileEditionMeaning(selected);
  const output = fileURLToPath(new URL('./claim-candidate', import.meta.url));
  const built = await compileEditionCandidateInput(file, digest, output);
  const candidate = JSON.parse(await fs.readFile(fileURLToPath(new URL('./claim-candidate/candidate.json', import.meta.url))));
  const svg = await fs.readFile(fileURLToPath(new URL('./claim-candidate/static/architecture.svg', import.meta.url)), 'utf8');
  const html = await fs.readFile(fileURLToPath(new URL('./claim-candidate/interactive/architecture.html', import.meta.url)), 'utf8');
  const data = JSON.parse(html.match(/<script id="architecture-interactive-data" type="application\\/json">([\\s\\S]*?)<\\/script>/u)[1]);
  const page = data.pages.overview;
  const painted = page.pieces.map((piece) => typeof piece === 'number' ? data.blocks[piece] : piece).join('');
  await fs.rm(output, { recursive: true, force: true });
  console.log(JSON.stringify({ status: 'ok', digest: meaning.native.semanticDigest,
    plane: meaning.native.selections[0].members.claims[0].plane,
    sourceClass: meaning.native.selections[0].sourceClass,
    candidateSha256: built.candidateSha256,
    semanticSupplies: candidate.input.semanticSupplies,
    media: Object.keys(candidate.media).sort(),
    visible: svg.includes('Condition: authorization: granted') && painted.includes('Condition: authorization: granted') }));
} catch (error) {
  console.log(JSON.stringify({ status: 'error', code: error.code ?? 'unattributed' }));
  process.exitCode = 1;
}
`,
  );
  const claimRun = (directory, expectedStatus = 0) =>
    JSON.parse(
      child(
        process.execPath,
        [path.join(directory, "claim-run.mjs")],
        directory,
        nodeEnvironment,
        expectedStatus,
      ).trim(),
    );
  const claimFirst = claimRun(consumer);
  assert.equal(claimFirst.status, "ok");
  assert.equal(claimFirst.plane, "intended");
  assert.equal(claimFirst.sourceClass, "native");
  assert.deepEqual(
    claimFirst.semanticSupplies.map(({ id }) => id),
    ["publisher-semantic-file-set"],
  );
  assert.deepEqual(claimFirst.media, ["interactive", "static"]);
  assert.equal(claimFirst.visible, true);
  assert.match(claimFirst.candidateSha256, /^[0-9a-f]{64}$/u);
  assert.match(claimFirst.digest, /^[0-9a-f]{64}$/u);
  return { modelBytes, claimProject, claimRequest, claimRun, claimFirst };
}
