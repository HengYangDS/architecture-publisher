import assert from 'node:assert/strict';

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import { claimModel } from './fixtures/claim-model.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const publisher = fileURLToPath(new URL('../packages/publisher/', import.meta.url));

function child(command, args, cwd, environment, expectedStatus = 0) {
  const result = spawnNativeSync(command, args, {
    cwd,
    env: environment,
    input: '',
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
    windowsHide: true,
  });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, expectedStatus, result.stdout + result.stderr);
  return result.stdout;
}

test('offline installed Edition meaning, Scenes, and Candidate survive relocation and refuse changed pins', async (t) => {
  const work = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-meaning-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const home = path.join(work, 'home');
  const cache = path.join(work, 'cache');
  const userConfig = path.join(work, 'user.npmrc');
  const globalConfig = path.join(work, 'global.npmrc');
  await fs.mkdir(home);
  await fs.writeFile(userConfig, '');
  await fs.writeFile(globalConfig, '');
  const npmEnvironment = {
    ...process.env,
    HOME: home,
    npm_config_userconfig: userConfig,
    npm_config_globalconfig: globalConfig,
    npm_config_cache: cache,
    npm_config_audit: 'false',
    npm_config_fund: 'false',
    npm_config_update_notifier: 'false',
  };
  const packOutput = child(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', work],
    publisher,
    npmEnvironment,
  );
  const archive = path.join(work, parseNpmPackRecord(packOutput).filename);
  const consumer = path.join(work, 'consumer');
  await fs.mkdir(consumer);
  child(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--offline',
      '--prefix',
      consumer,
      archive,
    ],
    consumer,
    npmEnvironment,
  );

  const inputs = path.join(consumer, 'inputs');
  await fs.mkdir(path.join(inputs, 'sources'), { recursive: true });
  await fs.mkdir(path.join(inputs, 'edition'));
  const model = Buffer.from(
    "specification { element component }\nmodel { a = component 'A'\n b = component 'B'\n a -> b }\n",
  );
  const views = Buffer.from('views { view overview { include * } }\n');
  await fs.writeFile(path.join(inputs, 'sources/model.c4'), model);
  await fs.writeFile(path.join(inputs, 'sources/views.c4'), views);
  const namespaces = ['example/model', 'example/views'];
  const project = {
    schema: 'architecture.edition-project/v1',
    id: 'installed-atlas',
    editor: 'fixture-editor',
    title: 'Installed architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is selected?' }],
    scope: {
      sourceNamespaces: namespaces,
      selections: [
        {
          id: 'model',
          namespace: namespaces[0],
          kind: 'reference',
          reference: 'element:a',
          questions: ['shape'],
        },
        { id: 'overview', namespace: namespaces[1], kind: 'reference', reference: 'view:overview' },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: 'A selected source.' },
    presentation: {
      static: { views: [{ id: 'overview', questions: ['shape'] }], intent: 'One overview.' },
      interactive: { views: [{ id: 'overview', questions: ['shape'] }], intent: 'Explore.' },
    },
    visualPolicy: { profile: 'neutral' },
  };
  await fs.writeFile(path.join(inputs, 'edition/project.json'), JSON.stringify(project) + '\n');
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      { id: 'model', namespace: namespaces[0], path: 'sources/model.c4', bytes: model },
      { id: 'views', namespace: namespaces[1], path: 'sources/views.c4', bytes: views },
    ].map(({ id, namespace, path: locator, bytes }) => ({
      id,
      namespace,
      format: { id: 'likec4/dsl', version: 'unversioned' },
      claimant: 'fixture-maintainer',
      revision: { kind: 'content', algorithm: 'sha256' },
      input: { kind: 'pin', path: locator, sha256: sha(bytes) },
    })),
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
  await fs.writeFile(path.join(inputs, 'build-request.json'), JSON.stringify(request) + '\n');
  const script = `
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { materializeBuildRequestInput } from './node_modules/architecture-publisher/src/compiler/build-input.mjs';
import { compileEditionMeaning } from 'architecture-publisher/compiler';
import { importLikeC4Layout } from 'architecture-publisher/semantics';
import { composeInteractiveEditionScene, composeStaticEditionScene } from 'architecture-publisher/scene';
import { composeStaticEditionSvg } from 'architecture-publisher/renderers/svg';
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
  const staticScene = composeStaticEditionScene(meaning, layout);
  const interactiveScene = composeInteractiveEditionScene(meaning);
  const staticSvg = composeStaticEditionSvg(staticScene);
  console.log(JSON.stringify({
    status: 'ok', lock: selected.lockSha256, semantic: meaning.native.semanticDigest,
    parser: meaning.native.parserSupply.sha256,
    static: meaning.media.static.assertionIds,
    interactive: meaning.media.interactive.assertionIds,
    completeness: meaning.completeness,
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
  await fs.writeFile(path.join(consumer, 'run.mjs'), script);
  const nodeEnvironment = {
    HOME: home,
    PATH: '',
    NODE_PATH: '',
    NODE_OPTIONS: '',
    LANG: 'C.UTF-8',
    ...(process.platform === 'win32' && process.env.SystemRoot
      ? { SystemRoot: process.env.SystemRoot }
      : {}),
  };
  const run = (directory, expectedStatus = 0) =>
    JSON.parse(
      child(
        process.execPath,
        [path.join(directory, 'run.mjs')],
        directory,
        nodeEnvironment,
        expectedStatus,
      ).trim(),
    );
  const first = run(consumer);
  assert.equal(first.status, 'ok');
  assert.equal(first.completeness, 'finite-unqualified-obligations');
  assert.deepEqual(first.static, ['model']);
  assert.deepEqual(first.interactive, ['model']);
  assert.deepEqual(first.layout.nodes, ['a', 'b']);
  assert.equal(first.layout.relations.length, 1);
  assert.equal(first.layout.parser, first.parser);
  assert.equal(first.scene.completeness, 'unqualified-scene');
  assert.deepEqual(first.scene.nodes, ['a']);
  assert.deepEqual(first.scene.relations, []);
  assert(first.scene.bounds.height > 0);
  assert.equal(first.svg.rasterWidth, 1800);
  assert(first.svg.width >= 880);
  assert(first.svg.height > 0);
  assert.match(first.svg.sha256, /^[0-9a-f]{64}$/u);
  assert.equal(first.interactiveScene.completeness, 'unqualified-scene');
  assert.deepEqual(first.interactiveScene.pages, [
    { id: 'overview', questions: ['shape'], nodes: ['a'], relations: [] },
  ]);
  for (const value of [first.lock, first.semantic, first.parser])
    assert.match(value, /^[0-9a-f]{64}$/u);

  const claimInputs = path.join(consumer, 'claim-inputs');
  await fs.mkdir(path.join(claimInputs, 'sources'), { recursive: true });
  await fs.mkdir(path.join(claimInputs, 'edition'));
  const modelBytes = Buffer.from(JSON.stringify(claimModel()) + '\n');
  await fs.writeFile(path.join(claimInputs, 'sources/model.json'), modelBytes);
  const claimProject = structuredClone(project);
  claimProject.id = 'installed-claims';
  claimProject.scope.sourceNamespaces = ['example/claims'];
  claimProject.scope.selections = [
    {
      id: 'claim',
      namespace: 'example/claims',
      kind: 'reference',
      reference: 'claim:intended',
      questions: ['shape'],
    },
  ];
  await fs.writeFile(
    path.join(claimInputs, 'edition/project.json'),
    JSON.stringify(claimProject) + '\n',
  );
  const claimRequest = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      {
        id: 'model',
        namespace: 'example/claims',
        format: { id: 'architecture.claim-model', version: '2' },
        claimant: 'fixture-maintainer',
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'pin', path: 'sources/model.json', sha256: sha(modelBytes) },
      },
    ],
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
  await fs.writeFile(
    path.join(claimInputs, 'build-request.json'),
    JSON.stringify(claimRequest) + '\n',
  );
  await fs.writeFile(
    path.join(consumer, 'claim-run.mjs'),
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
  await fs.rm(output, { recursive: true, force: true });
  console.log(JSON.stringify({ status: 'ok', digest: meaning.native.semanticDigest,
    plane: meaning.native.selections[0].members.claims[0].plane,
    sourceClass: meaning.native.selections[0].sourceClass,
    candidateSha256: built.candidateSha256,
    semanticSupplies: candidate.input.semanticSupplies,
    media: Object.keys(candidate.media).sort(),
    visible: svg.includes('Condition: authorization: granted') && html.includes('<dd>authorization: granted</dd>') }));
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
        [path.join(directory, 'claim-run.mjs')],
        directory,
        nodeEnvironment,
        expectedStatus,
      ).trim(),
    );
  const claimFirst = claimRun(consumer);
  assert.equal(claimFirst.status, 'ok');
  assert.equal(claimFirst.plane, 'intended');
  assert.equal(claimFirst.sourceClass, 'native');
  assert.deepEqual(
    claimFirst.semanticSupplies.map(({ id }) => id),
    ['publisher-semantic-file-set'],
  );
  assert.deepEqual(claimFirst.media, ['interactive', 'static']);
  assert.equal(claimFirst.visible, true);
  assert.match(claimFirst.candidateSha256, /^[0-9a-f]{64}$/u);
  assert.match(claimFirst.digest, /^[0-9a-f]{64}$/u);

  const occurrenceInputs = path.join(consumer, 'occurrence-inputs');
  await fs.mkdir(path.join(occurrenceInputs, 'edition'), { recursive: true });
  await fs.mkdir(path.join(occurrenceInputs, 'sources'));
  await fs.writeFile(path.join(occurrenceInputs, 'sources/model.json'), modelBytes);
  const occurrenceProject = structuredClone(claimProject);
  occurrenceProject.id = 'installed-occurrences';
  occurrenceProject.scope.selections = [
    ['entity', 'client'],
    ['entity', 'server'],
    ['relation', 'request'],
    ['claim', 'intended'],
    ['claim', 'observed'],
  ].map(([kind, id]) => ({
    id: `${kind}-${id}`,
    namespace: 'example/claims',
    kind: 'reference',
    reference: `${kind}:${id}`,
    questions: ['shape'],
  }));
  occurrenceProject.visualPolicy.override = 'refinement.json';
  await fs.writeFile(
    path.join(occurrenceInputs, 'edition/project.json'),
    JSON.stringify(occurrenceProject) + '\n',
  );
  const occurrenceRequest = { ...claimRequest, media: ['interactive'] };
  await fs.writeFile(
    path.join(occurrenceInputs, 'build-request.json'),
    JSON.stringify(occurrenceRequest) + '\n',
  );
  const semantic = (kind, id) => JSON.stringify(['example/claims', kind, id]);
  const occurrenceNode = (id, entity, x) => ({
    id,
    position: { x, y: 160 },
    size: { width: 160, height: 80 },
    semanticIds: [semantic('entity', entity)],
    primitives: [
      {
        kind: 'rect',
        box: { x: 0, y: 0, width: 160, height: 80 },
        fill: 'paper',
        stroke: 'ink',
        strokeWidth: 2,
      },
    ],
  });
  const occurrenceEdge = (id, from) => ({
    id,
    from,
    to: 'server',
    label: 'Source request',
    visualRole: 'default',
    fromSide: 'right',
    toSide: 'left',
    route: 'auto',
    semanticIds: [semantic('relation', 'request')],
  });
  await fs.writeFile(
    path.join(occurrenceInputs, 'edition/refinement.json'),
    JSON.stringify({
      schema: 'architecture.scene-refinement/v1',
      media: {
        interactive: {
          kind: 'authored-architecture',
          pages: [
            {
              id: 'overview',
              label: 'Repeated concepts',
              purpose: 'overview',
              scene: {
                schema: 'architecture.interactive-scene/v1',
                id: 'overview',
                title: occurrenceProject.title,
                subtitle: 'Repeated concepts',
                viewport: { width: 1000, height: 500 },
                groups: [],
                nodes: [
                  occurrenceNode('client-a', 'client', 40),
                  occurrenceNode('client-b', 'client', 320),
                  occurrenceNode('server', 'server', 720),
                ],
                edges: [
                  occurrenceEdge('request-a', 'client-a'),
                  occurrenceEdge('request-b', 'client-b'),
                ],
              },
            },
          ],
        },
      },
    }) + '\n',
  );
  await fs.writeFile(
    path.join(consumer, 'occurrence-run.mjs'),
    `
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compileEditionCandidateInput } from 'architecture-publisher/compiler';
const request = fileURLToPath(new URL('./occurrence-inputs/build-request.json', import.meta.url));
const output = fileURLToPath(new URL('./occurrence-candidate', import.meta.url));
const digest = createHash('sha256').update(await fs.readFile(request)).digest('hex');
const built = await compileEditionCandidateInput(request, digest, output);
const html = await fs.readFile(new URL('./occurrence-candidate/interactive/architecture.html', import.meta.url), 'utf8');
const work = JSON.parse(html.match(/<script id="architecture-interactive-data" type="application\\/json">([\\s\\S]*?)<\\/script>/u)[1]);
const page = work.pages.overview;
const painted = page.pieces.map((piece) => typeof piece === 'number' ? work.blocks[piece] : piece).join('');
if (!painted.includes('data-inspect-id="client-a"') || painted.includes('data-node-id="client-a"') || !painted.includes('stroke-linejoin="round"')) throw Error('installed_primitive_identity_invalid');
await fs.rm(output, { recursive: true });
console.log(JSON.stringify({ status: built.status, candidateSha256: built.candidateSha256,
  subjects: Object.keys(page.subjectSources),
  references: page.facts.map(({ reference, graphicId }) => ({ reference, graphicId })),
  selectedClaims: page.facts.filter(({ reference }) => JSON.parse(reference)[1] === 'claim').length }));
`,
  );
  const occurrenceRun = (directory) =>
    JSON.parse(
      child(
        process.execPath,
        [path.join(directory, 'occurrence-run.mjs')],
        directory,
        nodeEnvironment,
      ).trim(),
    );
  const occurrenceFirst = occurrenceRun(consumer);
  assert.equal(occurrenceFirst.status, 'built');
  assert.equal(occurrenceFirst.subjects.length, 5);
  assert.equal(occurrenceFirst.selectedClaims, 4);
  assert.equal(occurrenceFirst.references.length, 9);
  assert.equal(new Set(occurrenceFirst.references.map(({ reference }) => reference)).size, 5);

  const statementInputs = path.join(consumer, 'statement-inputs');
  await fs.mkdir(path.join(statementInputs, 'edition'), { recursive: true });
  await fs.mkdir(path.join(statementInputs, 'sources'));
  const statementModel = claimModel();
  statementModel.claims.published.dependsOn = [];
  statementModel.claims['second-statement'] = {
    ...structuredClone(statementModel.claims.published),
    value: { text: 'The client retains the selected intent.' },
  };
  const statementBytes = Buffer.from(JSON.stringify(statementModel));
  await fs.writeFile(path.join(statementInputs, 'sources/model.json'), statementBytes);
  const statementProject = structuredClone(claimProject);
  statementProject.id = 'installed-statements';
  statementProject.scope.selections = ['published', 'second-statement'].map((id) => ({
    id: `claim-${id}`,
    namespace: 'example/claims',
    kind: 'reference',
    reference: `claim:${id}`,
    questions: ['shape'],
  }));
  statementProject.questions.push({
    id: 'editorial',
    audience: 'maintainer',
    text: 'What is editorial judgment?',
  });
  statementProject.editorialAssertions = [
    {
      id: 'editorial-choice',
      statement: 'This Edition attributes source and editorial statements separately.',
      proponent: 'fixture-editor',
      basis: ['claim-published'],
      questions: ['editorial'],
    },
  ];
  statementProject.presentation.interactive.views = [
    { id: 'overview', questions: ['shape'] },
    { id: 'editorial', questions: ['editorial'] },
  ];
  statementProject.presentation.static = {
    views: [{ id: 'overview', questions: ['shape', 'editorial'] }],
    intent: 'Read source and editorial statements in one independent frame.',
    width: 1800,
  };
  statementProject.visualPolicy.override = 'refinement.json';
  await fs.writeFile(
    path.join(statementInputs, 'edition/project.json'),
    JSON.stringify(statementProject) + '\n',
  );
  const statementRequest = { ...claimRequest, media: ['static', 'interactive'] };
  statementRequest.sources = [
    {
      ...claimRequest.sources[0],
      input: { kind: 'pin', path: 'sources/model.json', sha256: sha(statementBytes) },
    },
  ];
  await fs.writeFile(
    path.join(statementInputs, 'build-request.json'),
    JSON.stringify(statementRequest) + '\n',
  );
  const statementRefinement = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      interactive: {
        kind: 'authored-architecture',
        pages: [
          {
            id: 'overview',
            label: 'Source statements',
            purpose: 'overview',
            scene: {
              schema: 'architecture.interactive-scene/v1',
              id: 'overview',
              title: statementProject.title,
              subtitle: 'Source statements',
              viewport: { width: 1000, height: 500 },
              nodes: [],
              groups: [],
              edges: [],
              texts: ['published', 'second-statement'].map((id, index) => ({
                id: `statement-${id}`,
                text: index === 0 ? "Literal $$ $& $' $`" : statementModel.claims[id].value.text,
                fontSize: 16,
                weight: '400',
                anchor: 'start',
                tone: 'ink',
                x: 60,
                baseline: 140 + index * 70,
                visible: true,
                semanticIds: [semantic('claim', id)],
                box: { x: 60, y: 124 + index * 70, width: 300, height: 16 },
              })),
              requiredSemanticIds: ['published', 'second-statement'].map((id) =>
                semantic('claim', id),
              ),
            },
          },
          {
            id: 'editorial',
            label: 'Editorial judgment',
            purpose: 'mechanism',
            scene: {
              schema: 'architecture.interactive-scene/v1',
              id: 'editorial',
              title: statementProject.title,
              subtitle: 'Editorial judgment',
              viewport: { width: 1000, height: 500 },
              nodes: [],
              groups: [],
              edges: [],
              texts: [
                {
                  id: 'editorial-text',
                  text: statementProject.editorialAssertions[0].statement,
                  fontSize: 16,
                  weight: '600',
                  anchor: 'start',
                  tone: 'ink',
                  x: 60,
                  baseline: 140,
                  visible: true,
                  semanticIds: [
                    JSON.stringify([statementProject.id, 'editorial', 'editorial-choice']),
                  ],
                  box: { x: 60, y: 124, width: 500, height: 16 },
                },
              ],
              requiredSemanticIds: [
                JSON.stringify([statementProject.id, 'editorial', 'editorial-choice']),
              ],
            },
          },
        ],
      },
    },
  };
  statementRefinement.media.static = {
    kind: 'authored-canvas',
    scene: {
      schema: 'architecture.authored-static-scene/v1',
      title: statementProject.title,
      subtitle: 'Source and editorial statements',
      width: 1000,
      height: 500,
      referenceWidth: 1000,
      spine: [],
      paint: { paper: '#f3f0e8', ink: '#26362f' },
      nodes: [],
      edges: [],
      decorations: [],
      texts: [
        ...structuredClone(statementRefinement.media.interactive.pages[0].scene.texts),
        {
          ...structuredClone(statementRefinement.media.interactive.pages[1].scene.texts[0]),
          baseline: 310,
        },
      ],
      requiredSemanticIds: [
        ...statementRefinement.media.interactive.pages[0].scene.requiredSemanticIds,
        ...statementRefinement.media.interactive.pages[1].scene.requiredSemanticIds,
      ],
    },
  };
  const adornment = {
    id: 'editorial-marker',
    semanticIds: [],
    adornment: true,
    primitives: [
      {
        kind: 'circle',
        center: { x: 10, y: 10 },
        radius: 8,
        fill: 'ink',
        stroke: null,
        strokeWidth: 0,
      },
    ],
  };
  statementRefinement.media.static.scene.nodes.push({
    ...adornment,
    box: { x: 760, y: 380, width: 20, height: 20 },
  });
  statementRefinement.media.interactive.pages[0].scene.nodes.push({
    ...adornment,
    position: { x: 760, y: 380 },
    size: { width: 20, height: 20 },
  });
  await fs.writeFile(
    path.join(consumer, 'statement-run.mjs'),
    `
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createBundledTextMeasurer } from './node_modules/architecture-publisher/renderers/resvg/measurement.mjs';
import { loadBundledFonts } from 'architecture-publisher/renderers/fonts';
const root=fileURLToPath(new URL('./statement-inputs/',import.meta.url));
const refinement=${JSON.stringify(statementRefinement)};
const measurer=await createBundledTextMeasurer(await loadBundledFonts(), [...refinement.media.interactive.pages.flatMap(page=>page.scene.texts),...refinement.media.static.scene.texts]);
for(const page of refinement.media.interactive.pages)for(const text of page.scene.texts)text.box=measurer.box(text);
for(const text of refinement.media.static.scene.texts)text.box=measurer.box(text);
await fs.writeFile(root+'edition/refinement.json',JSON.stringify(refinement)+'\\n');
const request=await fs.readFile(root+'build-request.json');
console.log(createHash('sha256').update(request).digest('hex'));
`,
  );
  const statementDigest = child(
    process.execPath,
    [path.join(consumer, 'statement-run.mjs')],
    consumer,
    nodeEnvironment,
  ).trim();
  const statementCandidate = path.join(consumer, 'statement-candidate');
  child(
    process.execPath,
    [
      path.join(consumer, 'node_modules/architecture-publisher/src/cli/main.mjs'),
      'edition',
      'build',
      path.join(statementInputs, 'build-request.json'),
      '--sha256',
      statementDigest,
      '--output',
      statementCandidate,
    ],
    consumer,
    nodeEnvironment,
  );
  const statementHtml = await fs.readFile(
    path.join(statementCandidate, 'interactive/architecture.html'),
    'utf8',
  );
  const statementWork = JSON.parse(
    statementHtml.match(
      /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
    )[1],
  );
  assert.deepEqual(statementWork.order, ['overview', 'editorial']);
  assert.equal(
    statementWork.pages.overview.facts.filter(
      ({ reference }) => JSON.parse(reference)[1] === 'claim',
    ).length,
    2,
  );
  assert.deepEqual(statementWork.pages.editorial.sourceIds, []);
  assert.equal(
    statementWork.pages.editorial.facts[0].editionSha256,
    statementWork.build.editionSha256,
  );
  const statementOutput = statementWork.pages.overview.pieces
    .map((piece) => (typeof piece === 'number' ? statementWork.blocks[piece] : piece))
    .join('');
  assert(
    statementOutput.includes("Literal $$ $&amp; $' $`"),
    'Installed public CLI preserves exact dollar text',
  );
  const statementSvg = await fs.readFile(
    path.join(statementCandidate, 'static/architecture.svg'),
    'utf8',
  );
  const statementPng = await fs.readFile(path.join(statementCandidate, 'static/architecture.png'));
  assert(statementSvg.includes("Literal $$ $&amp; $' $`"));
  assert(statementSvg.includes('data-graphic-id="text:editorial-text"'));
  assert.equal(statementPng.readUInt32BE(16), 1800);
  assert.equal(/<circle\b[^>]*data-graphic-id="node:/u.test(statementSvg), false);
  assert(statementSvg.includes('data-graphic-id="node:editorial-marker" aria-hidden="true"'));
  assert.equal(statementOutput.includes('data-node-id="editorial-marker"'), false);
  assert.equal(
    statementWork.pages.overview.facts.some(({ graphicId }) => graphicId === 'editorial-marker'),
    false,
  );

  const relocated = path.join(work, 'relocated');
  await fs.cp(consumer, relocated, { recursive: true });
  await fs.rm(consumer, { recursive: true, force: true });
  assert.deepEqual(run(relocated), first);
  assert.deepEqual(claimRun(relocated), claimFirst);
  assert.deepEqual(occurrenceRun(relocated), occurrenceFirst);
  await fs.appendFile(path.join(relocated, 'claim-inputs/sources/model.json'), '\n');
  assert.deepEqual(claimRun(relocated, 1), {
    status: 'error',
    code: 'materialized_pin_mismatch',
  });
  await fs.appendFile(path.join(relocated, 'inputs/sources/model.c4'), '\n');
  assert.deepEqual(run(relocated, 1), { status: 'error', code: 'materialized_pin_mismatch' });
});
