import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import {
  inspectRgbaPngCanvas,
  inspectRgbaPngElements,
} from '../packages/publisher/src/qualification/static/png.mjs';
import { installCoreAndSelf } from './fixtures/installed-packages.mjs';
import {
  SELF_ENTITY_IDS,
  SELF_RELATION_IDS,
} from '../editions/self/src/edition/model.mjs';
import { composeArchitecturePublisherFlagship } from '../editions/self/src/edition/static/composition.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const selectedSources = Object.freeze({
  'product-contract': 'docs/product-contract.md',
  'edition-contract': 'docs/edition-contract.md',
  'active-design': 'openspec/changes/architecture-publisher-0-2/design.md',
  'core-package': 'packages/publisher/package.json',
  'self-prepare-owner':
    'editions/self/src/edition/prepare.mjs',
  'self-model-owner':
    'editions/self/src/edition/model.mjs',
  'self-static-scene-owner':
    'editions/self/src/edition/static-scene.mjs',
  'self-static-composition-owner':
    'editions/self/src/edition/static/composition.mjs',
  'self-static-compiler-owner':
    'editions/self/src/edition/static/scene.mjs',
  'self-static-svg-owner':
    'editions/self/src/edition/static/svg.mjs',
  'self-static-flagship-owner':
    'editions/self/src/edition/static-flagship.mjs',
  'self-static-metrics':
    'editions/self/src/edition/static/authoring/metrics.json',
  'self-interactive-scene-owner':
    'editions/self/src/edition/interactive-scenes.mjs',
  'self-interactive-composition-owner':
    'editions/self/src/edition/interactive-scene.mjs',
  'self-interactive-atlas-owner': 'editions/self/src/edition/atlas.mjs',
  'source-owner': 'packages/publisher/src/source/write.mjs',
  'claim-owner': 'packages/publisher/src/semantics/document.mjs',
  'evolution-owner': 'packages/publisher/src/edition/evolution.mjs',
  'compiler-owner': 'packages/publisher/src/compiler/edition.mjs',
  'interactive-renderer-owner':
    'packages/publisher/renderers/archify/index.mjs',
  'qualification-owner': 'packages/publisher/src/qualification/contract.mjs',
  'publication-owner': 'packages/publisher/src/publication/files.mjs',
  'installed-test-owner': 'tests/self-hosted-adopter.test.mjs',
});

async function prepare(output) {
  const { prepareArchitecturePublisherEdition } = await import(
    '../editions/self/src/edition/prepare.mjs'
  );
  const sources = {};
  for (const [id, relative] of Object.entries(selectedSources)) {
    const file = path.join(root, relative), bytes = await fs.readFile(file);
    sources[id] = { path: file, sha256: sha256(bytes) };
  }
  return prepareArchitecturePublisherEdition({
    schema: 'architecture.publisher-self-input/v1',
    source: { id: 'architecture-publisher', revision: 'flagship-test' },
    sources,
    output,
  });
}

async function build(t) {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'publisher-flagship-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const prepared = await prepare(path.join(directory, 'prepared'));
  const plan = {
    sourceManifest: prepared.sourceManifest,
    sourceSha256: prepared.sourceSha256,
    edition: prepared.edition,
    editionSha256: prepared.editionSha256,
    output: path.join(directory, 'static'),
  };
  const { renderArchitecturePublisherFlagship } = await import(
    '../editions/self/src/edition/static-flagship.mjs'
  );
  return {
    directory,
    plan,
    result: await renderArchitecturePublisherFlagship(plan),
  };
}

test('the self flagship emits a complete restrained 6000px static Edition', async (t) => {
  const { plan, result } = await build(t),
    bundle = await readSourceBundle(
      result.output.manifestPath,
      result.output.manifestSha256,
    ),
    members = new Map(bundle.members.map((member) => [member.path, member.content])),
    scene = JSON.parse(members.get('scene.json')),
    coverage = JSON.parse(members.get('coverage.json')),
    checks = JSON.parse(members.get('checks.json')),
    svg = members.get('architecture-publisher.svg').toString('utf8'),
    png = members.get('architecture-publisher-6000.png');

  assert.deepEqual([...members.keys()].sort(), [
    'FONT-LICENSE.txt',
    'architecture-publisher-6000.png',
    'architecture-publisher.svg',
    'checks.json',
    'coverage.json',
    'scene.json',
  ]);
  assert.equal(png.readUInt32BE(16), 6000);
  assert.equal(png.readUInt32BE(20), 3375);
  assert.match(svg, /width="1600" height="900" viewBox="0 0 1600 900"/);
  assert.match(svg, /Architecture Publisher/);
  assert.match(svg, /Meaning becomes a trustworthy Architecture Edition/);
  assert.match(svg, /@font-face/);
  assert.match(svg, /data:font\/ttf;base64,/);
  assert.doesNotMatch(svg, /archify|plate\d+|template|debug|v0\.2/i);
  assert.doesNotMatch(svg, /#181611|#211e18/);

  assert.equal(scene.schema, 'architecture.publisher-static-scene/v1');
  assert.deepEqual(
    scene.spine,
    [
      'source-field',
      'semantic-contract',
      'editorial-contract',
      'independent-scenes',
      'exact-media',
      'qualification',
      'acceptance',
      'authorization',
      'recoverable-publication',
      'consumers-feedback',
    ],
  );
  const feedback = scene.edges.find((edge) => edge.id === 'feedback-return');
  assert.deepEqual(
    {
      source: feedback?.source,
      target: feedback?.target,
      kind: feedback?.kind,
      points: feedback?.points,
    },
    {
      source: 'feedback-return-start',
      target: 'feedback-return-end',
      kind: 'feedback',
      points: [
        { x: 1483, y: 430 },
        { x: 117, y: 430 },
      ],
    },
  );
  assert.match(svg, /marker-end="url\(#arrow-feedback\)"/);
  const metrics = JSON.parse(
      await fs.readFile(
        path.join(
          root,
          'editions/self/src/edition/static/authoring/metrics.json',
        ),
        'utf8',
      ),
    ),
    expectedMetrics = composeArchitecturePublisherFlagship().labels.map(
      ({ text, size, weight }) => JSON.stringify([text, size, weight]),
    );
  assert.deepEqual(
    metrics.records.map(([key]) => key).sort(),
    expectedMetrics.sort(),
  );
  assert.deepEqual(coverage.entities, [...SELF_ENTITY_IDS].sort());
  assert.deepEqual(coverage.relations, [...SELF_RELATION_IDS].sort());
  assert.deepEqual(coverage.missingEntities, []);
  assert.deepEqual(coverage.missingRelations, []);
  assert.deepEqual(coverage.duplicateEntities, []);
  assert.deepEqual(coverage.duplicateRelations, []);
  assert.deepEqual(checks.geometry.failures, []);
  assert.deepEqual(checks.emittedEdges.failures, []);
  assert.deepEqual(checks.canvas.failures, []);
  assert.deepEqual(checks.rasterCanvas.failures, []);
  assert.deepEqual(checks.rasterElements.failures, []);
  assert.equal(checks.canvas.width, 1600);
  assert.equal(checks.canvas.height, 900);
  assert.equal(checks.canvas.occupiedEnvelopeFraction > 0.65, true);
  assert.equal(checks.rasterCanvas.width, 6000);
  assert.equal(checks.rasterCanvas.height, 3375);
  assert.equal(checks.rasterCanvas.inkPixels > 0, true);
  assert.equal(checks.rasterCanvas.envelopeFraction >= 0.65, true);
  assert.equal(
    Math.max(
      checks.rasterCanvas.centerOffset.x,
      checks.rasterCanvas.centerOffset.y,
    ) <= 0.05,
    true,
  );
  assert.equal(
    checks.rasterElements.regions.length,
    scene.texts.filter((label) => label.visible && label.text.trim()).length +
      scene.nodes.length +
      scene.edges.length * 2 +
      scene.decorations.length,
  );
  assert.equal(
    checks.rasterElements.regions.every((region) => region.inkPixels > 0),
    true,
  );
  assert.equal(checks.rasterElements.unassignedInkPixels, 0);
  assert.equal(result.status, 'rendered');
  assert.equal(result.staticWidth, 6000);
  assert.equal(result.staticHeight, 3375);
  assert.deepEqual(result.supplies.map(({ id }) => id), [
    'font-supply',
    'raster-supply',
    'self-static-runtime',
  ]);
  assert(result.supplies.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)));
  assert.equal(result.qualification, 'not-performed');
  assert.equal(result.humanAcceptance, 'not-performed');
  assert.equal(result.publication, 'not-performed');
  assert.equal(result.editionSha256, plan.editionSha256);
});

test('the self flagship preserves an occupied destination', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'publisher-flagship-existing-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const prepared = await prepare(path.join(directory, 'prepared')),
    output = path.join(directory, 'static');
  await fs.mkdir(output);
  await fs.writeFile(path.join(output, 'foreign'), 'owned elsewhere');
  const { renderArchitecturePublisherFlagship } = await import(
    '../editions/self/src/edition/static-flagship.mjs'
  );
  await assert.rejects(
    renderArchitecturePublisherFlagship({
      sourceManifest: prepared.sourceManifest,
      sourceSha256: prepared.sourceSha256,
      edition: prepared.edition,
      editionSha256: prepared.editionSha256,
      output,
    }),
    { code: 'output_exists' },
  );
  assert.equal(
    await fs.readFile(path.join(output, 'foreign'), 'utf8'),
    'owned elsewhere',
  );
});

test('the self flagship rejects a source bundle that does not bind its executing composition', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'publisher-flagship-runtime-drift-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const prepared = await prepare(path.join(directory, 'prepared')),
    source = await readSourceBundle(
      prepared.sourceManifest,
      prepared.sourceSha256,
    ),
    members = source.members.map((member) => ({
      path: member.path,
      content: Buffer.from(member.content),
    })),
    selected = members.find(
      ({ path: name }) => name === 'sources/self-static-composition-owner.source',
    );
  selected.content = Buffer.concat([selected.content, Buffer.from('\n')]);
  const { writeSourceBundle } = await import(
      '../packages/publisher/src/source/write.mjs'
    ),
    changed = await writeSourceBundle(
      path.join(directory, 'changed-source'),
      source.source,
      members,
    ),
    edition = JSON.parse(await fs.readFile(prepared.edition, 'utf8'));
  edition.source.manifestSha256 = changed.manifestSha256;
  const changedEdition = path.join(directory, 'changed-edition.json'),
    changedEditionBytes = Buffer.from(JSON.stringify(edition, null, 2) + '\n');
  await fs.writeFile(changedEdition, changedEditionBytes);
  const { renderArchitecturePublisherFlagship } = await import(
    '../editions/self/src/edition/static-flagship.mjs'
  );
  await assert.rejects(
    renderArchitecturePublisherFlagship({
      sourceManifest: changed.manifestPath,
      sourceSha256: changed.manifestSha256,
      edition: changedEdition,
      editionSha256: sha256(changedEditionBytes),
      output: path.join(directory, 'static'),
    }),
    { code: 'self_flagship_runtime_source_mismatch' },
  );
});

test('the self flagship rejects an Edition whose selected composition digest drifted', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'publisher-flagship-edition-drift-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const prepared = await prepare(path.join(directory, 'prepared')),
    edition = JSON.parse(await fs.readFile(prepared.edition, 'utf8'));
  edition.scenes.static.authoredInputSha256 = '0'.repeat(64);
  const changedEdition = path.join(directory, 'changed-edition.json'),
    changedEditionBytes = Buffer.from(JSON.stringify(edition, null, 2) + '\n');
  await fs.writeFile(changedEdition, changedEditionBytes);
  const { renderArchitecturePublisherFlagship } = await import(
    '../editions/self/src/edition/static-flagship.mjs'
  );
  await assert.rejects(
    renderArchitecturePublisherFlagship({
      sourceManifest: prepared.sourceManifest,
      sourceSha256: prepared.sourceSha256,
      edition: changedEdition,
      editionSha256: sha256(changedEditionBytes),
      output: path.join(directory, 'static'),
    }),
    { code: 'self_flagship_scene_mismatch' },
  );
});

test('the self flagship rejects static scene declarations not consumed by the renderer', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'publisher-flagship-scene-drift-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const prepared = await prepare(path.join(directory, 'prepared')),
    edition = JSON.parse(await fs.readFile(prepared.edition, 'utf8'));
  edition.scenes.static.composition.groups[0].label = 'Changed but valid group';
  const changedEdition = path.join(directory, 'changed-edition.json'),
    changedEditionBytes = Buffer.from(JSON.stringify(edition, null, 2) + '\n');
  await fs.writeFile(changedEdition, changedEditionBytes);
  const { renderArchitecturePublisherFlagship } = await import(
    '../editions/self/src/edition/static-flagship.mjs'
  );
  await assert.rejects(
    renderArchitecturePublisherFlagship({
      sourceManifest: prepared.sourceManifest,
      sourceSha256: prepared.sourceSha256,
      edition: changedEdition,
      editionSha256: sha256(changedEditionBytes),
      output: path.join(directory, 'static'),
    }),
    { code: 'self_flagship_scene_mismatch' },
  );
});

test('the installed self package renders the flagship offline from relocated inputs', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'publisher-flagship-installed-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const { consumer } = await installCoreAndSelf(root, directory),
    inputRoot = path.join(directory, 'relocated-inputs'),
    sources = {};
  await fs.mkdir(inputRoot);
  for (const [id, relative] of Object.entries(selectedSources)) {
    const bytes = await fs.readFile(path.join(root, relative)),
      file = path.join(inputRoot, id + '.source');
    await fs.writeFile(file, bytes);
    sources[id] = { path: file, sha256: sha256(bytes) };
  }
  const requestFile = path.join(directory, 'request.json'),
    preparedRoot = path.join(directory, 'prepared'),
    request = {
      schema: 'architecture.publisher-self-input/v1',
      source: { id: 'architecture-publisher', revision: 'installed-flagship' },
      sources,
      output: preparedRoot,
    };
  await fs.writeFile(requestFile, JSON.stringify(request));
  const driver = path.join(consumer, 'render-self-flagship.mjs');
  await fs.writeFile(
    driver,
    [
      "import fs from 'node:fs/promises';",
      "import { prepareArchitecturePublisherEditionInput, renderArchitecturePublisherFlagshipInput } from '@architecture-publisher/self-edition';",
      'const prepared = await prepareArchitecturePublisherEditionInput(process.argv[2]);',
      "const plan = JSON.parse(await fs.readFile(prepared.plan, 'utf8'));",
      "await fs.writeFile(prepared.plan, JSON.stringify({...plan, output:process.argv[3]}));",
      'const result = await renderArchitecturePublisherFlagshipInput(prepared.plan);',
      "process.stdout.write(JSON.stringify(result) + '\\n');",
      '',
    ].join('\n'),
  );
  const output = path.join(directory, 'installed-static'),
    result = spawnSync(process.execPath, [driver, requestFile, output], {
      cwd: consumer,
      encoding: 'utf8',
      env: { HOME: directory, PATH: directory, LANG: 'C.UTF-8' },
      timeout: 120000,
    });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const observed = JSON.parse(result.stdout),
    png = await fs.readFile(path.join(output, 'architecture-publisher-6000.png'));
  assert.equal(observed.status, 'rendered');
  assert.equal(observed.staticWidth, 6000);
  assert.equal(observed.staticHeight, 3375);
  assert.equal(png.readUInt32BE(16), 6000);
  assert.equal(png.readUInt32BE(20), 3375);
  assert.equal(observed.qualification, 'not-performed');
});

test('delivery-resolution canvas inspection rejects empty and edge-bound raster output', () => {
  assert.throws(() => inspectRgbaPngCanvas(Buffer.from('not png')), {
    code: 'png_canvas_invalid',
  });
  const fixture = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAAHdElNRQfqCRQWJCqbmMdPAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDI2LTA5LTIwVDIyOjM2OjQyKzAwOjAwcglJGwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyNi0wOS0yMFQyMjozNjo0MiswMDowMANU8acAAAAodEVYdGRhdGU6dGltZXN0YW1wADIwMjYtMDktMjBUMjI6MzY6NDIrMDA6MDBUQdB4AAAAEUlEQVQI12NQM9P///nDi/8AEjMFVfq+P94AAAAASUVORK5CYII=',
    'base64',
  );
  const contract = { background: [243, 240, 232, 255] };
  assert.deepEqual(inspectRgbaPngCanvas(fixture, contract).envelope, {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  assert.deepEqual(
    inspectRgbaPngCanvas(fixture, {
      ...contract,
      minimumClearance: 1,
    }).failures,
    [{ code: 'png-canvas-clearance', actual: 0, minimum: 1 }],
  );
  assert.deepEqual(
    inspectRgbaPngCanvas(fixture, {
      ...contract,
      minimumEnvelopeFraction: 0.75,
      maximumCenterOffsetFraction: 0.1,
    }).failures.map(({ code }) => code),
    ['png-canvas-fill', 'png-canvas-balance'],
  );
  const missing = inspectRgbaPngElements(
    fixture,
    {
      width: 2,
      height: 1,
      paint: {
        paper: '#f3f0e8',
        ink: '#26362f',
        line: '#26362f',
      },
      texts: [
        {
          id: 'missing',
          text: 'x',
          visible: true,
          tone: 'ink',
          box: { x: 1, y: 0, width: 1, height: 1 },
        },
      ],
      nodes: [],
      edges: [],
      decorations: [],
    },
    { background: contract.background, sourcePadding: 0 },
  );
  assert.deepEqual(missing.failures[0], {
    code: 'png-element-empty',
    id: 'text:missing',
  });
  assert.equal(missing.failures[1].code, 'png-unassigned-ink');
  assert.equal(missing.failures[1].pixels, 1);
  assert.deepEqual(
    missing.failures[1].samples.map(({ x, y }) => ({ x, y })),
    [{ x: 0, y: 0 }],
  );

  const absentPaint = inspectRgbaPngElements(
    fixture,
    {
      width: 2,
      height: 1,
      paint: {
        paper: '#f3f0e8',
        ink: '#26362f',
        line: '#26362f',
      },
      texts: [
        {
          id: 'label',
          text: 'x',
          visible: true,
          tone: 'ink',
          box: { x: 1.2, y: 0, width: 0.2, height: 1 },
        },
      ],
      nodes: [
        {
          id: 'node',
          tone: 'ink',
          box: { x: 1.2, y: 0, width: 0.2, height: 1 },
        },
      ],
      edges: [
        {
          id: 'edge',
          kind: 'flow',
          tone: 'ink',
          arrow: true,
          strokeWidth: 0.05,
          points: [
            { x: 1.5, y: 0.5 },
            { x: 1.9, y: 0.5 },
          ],
          arrowGeometry: {
            length: 0.1,
            halfWidth: 0.1,
            strokeWidth: 0.05,
          },
        },
      ],
      decorations: [
        {
          id: 'rule',
          tone: 'ink',
          strokeWidth: 0.05,
          points: [
            { x: 1.2, y: 0.25 },
            { x: 1.8, y: 0.25 },
          ],
        },
      ],
    },
    { background: contract.background, sourcePadding: 0 },
  );
  assert.deepEqual(
    absentPaint.failures
      .filter(({ code }) => code === 'png-element-empty')
      .map(({ id }) => id),
    [
      'text:label',
      'node:node',
      'edge:edge:stroke',
      'edge:edge:arrow',
      'rule:rule',
    ],
  );
});
