import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright-core';
import { composeAuthoredStaticCanvas } from '../packages/publisher/src/scene/static/authored-canvas.mjs';
import { composeAuthoredInteractiveArchitecture } from '../packages/publisher/src/scene/interactive/authored-architecture.mjs';
import { parseSelectedSceneRefinement } from '../packages/publisher/src/edition/refinement.mjs';
import { assertAuthoredCanvasScene } from '../packages/publisher/src/scene/static/audit.mjs';
import { renderAuthoredCanvasSvg } from '../packages/publisher/renderers/svg/canvas.mjs';
import { renderArchitectureScene } from '../packages/publisher/renderers/archify/index.mjs';
import { adaptArchitecturePrimitives } from '../packages/publisher/renderers/archify/primitives.mjs';
import { adaptArchitectureTexts } from '../packages/publisher/renderers/archify/text.mjs';
import { rasterizeBytes } from '../packages/publisher/renderers/resvg/index.mjs';
import { inspectRgbaPngCanvas } from '../packages/publisher/src/qualification/static/png.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import {
  importClaimModel,
  resolveClaimModelSelection,
} from '../packages/publisher/src/semantics/native-claim-model.mjs';
import { claimModel } from './fixtures/claim-model.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const namespace = 'fixture/primitives';
const reference = JSON.stringify([namespace, 'entity', 'client']);
const rect = () => ({
  kind: 'rect',
  box: { x: 0, y: 0, width: 80, height: 60 },
  fill: 'paper',
  stroke: 'ink',
  strokeWidth: 2,
});

function meaning(medium) {
  const model = claimModel();
  const bytes = Buffer.from(JSON.stringify(model));
  const imported = importClaimModel(
    {
      namespace,
      format: { id: 'architecture.claim-model', version: '2' },
      sha256: sha(bytes),
      claimant: model.owner,
    },
    bytes,
    'native',
  );
  const selection = resolveClaimModelSelection(imported, {
    id: 'client',
    namespace,
    kind: 'reference',
    reference: 'entity:client',
  });
  const common = { id: 'painted-client', semanticIds: [reference], primitives: [rect()] };
  const text = {
    id: 'client-label',
    text: 'Source client',
    fontSize: 14,
    weight: '400',
    anchor: 'start',
    tone: 'ink',
    x: 60,
    baseline: 100,
    visible: true,
    semanticIds: [reference],
    box: { x: 60, y: 86, width: 150, height: 14 },
  };
  const staticScene = {
    schema: 'architecture.authored-static-scene/v1',
    title: 'Finite painting',
    subtitle: 'Exact semantic ports',
    width: 900,
    height: 460,
    referenceWidth: 900,
    spine: [],
    paint: { paper: '#f3f0e8', ink: '#26362f' },
    nodes: [{ ...common, box: { x: 200, y: 200, width: 80, height: 60 } }],
    texts: [text],
    edges: [],
    decorations: [],
    requiredSemanticIds: [reference],
  };
  const interactiveScene = {
    schema: 'architecture.interactive-scene/v1',
    id: 'overview',
    title: 'Finite painting',
    subtitle: 'Exact semantic ports',
    viewport: { width: 900, height: 460 },
    nodes: [{ ...common, position: { x: 200, y: 200 }, size: { width: 80, height: 60 } }],
    texts: [text],
    groups: [],
    edges: [],
    requiredSemanticIds: [reference],
  };
  return {
    edition: { id: 'finite-reading', editor: 'fixture-editor', sha256: '1'.repeat(64) },
    editorial: { title: 'Finite painting' },
    assertions: [{ id: 'client', kind: 'source', selection: 'client' }],
    native: { selections: [selection] },
    media: { [medium]: { views: [{ id: 'overview', assertionIds: ['client'] }] } },
    refinement: {
      media: {
        [medium]:
          medium === 'static'
            ? { kind: 'authored-canvas', scene: staticScene }
            : {
                kind: 'authored-architecture',
                pages: [
                  {
                    id: 'overview',
                    label: 'Exact semantic ports',
                    purpose: 'overview',
                    scene: interactiveScene,
                  },
                ],
              },
      },
    },
  };
}

const sceneFor = (value, medium) =>
  medium === 'static'
    ? value.refinement.media.static.scene
    : value.refinement.media.interactive.pages[0].scene;
const compose = (value, medium) =>
  medium === 'static'
    ? composeAuthoredStaticCanvas(value)
    : composeAuthoredInteractiveArchitecture(value);
const resultScene = (result, medium) =>
  medium === 'static' ? result.scene : result.pages[0].scene;

for (const medium of ['static', 'interactive']) {
  test(`${medium} primitive-only source painting derives ink bounds without legacy role fields`, () => {
    const value = meaning(medium);
    const before = JSON.stringify(sceneFor(value, medium).nodes[0]);
    const scene = resultScene(compose(value, medium), medium);
    assert.deepEqual(scene.nodes[0].paintBox, { x: 199, y: 199, width: 82, height: 62 });
    assert.equal(Object.hasOwn(scene.nodes[0], 'radius'), false);
    assert.equal(Object.hasOwn(scene.nodes[0], 'visualRole'), false);
    assert.equal(JSON.stringify(sceneFor(value, medium).nodes[0]), before);
    const bytes = Buffer.from(
      JSON.stringify({ schema: 'architecture.scene-refinement/v1', media: value.refinement.media }),
    );
    assert.doesNotThrow(() => parseSelectedSceneRefinement(bytes, [medium], sha(bytes)));
  });

  test(`${medium} rejects false ink envelopes, executable geometry and invisible structural marks`, () => {
    for (const change of [
      (node) => {
        node.paintBox = { x: 200, y: 200, width: 80, height: 60 };
      },
      (node) => {
        node.primitives[0].transform = 'translate(10,0)';
      },
      (node) => {
        node.primitives[0].href = 'https://example.invalid/mark';
      },
      (node) => {
        node.primitives[0].kind = 'path';
      },
      (node) => {
        node.primitives[0].box.x = Number.POSITIVE_INFINITY;
      },
      (node) => {
        node.primitives[0].fill = null;
        node.primitives[0].stroke = null;
        node.primitives[0].strokeWidth = 0;
      },
      (node) => {
        node.primitives = [];
      },
      (node) => {
        node.radius = 12;
      },
    ]) {
      const value = meaning(medium);
      change(sceneFor(value, medium).nodes[0]);
      assert.throws(() => compose(value, medium));
    }
  });

  test(`${medium} adornments have geometry only and cannot replace source ownership`, () => {
    const value = meaning(medium);
    const scene = sceneFor(value, medium);
    const adornment = structuredClone(scene.nodes[0]);
    adornment.id = 'routing-mark';
    adornment.adornment = true;
    adornment.semanticIds = [];
    if (medium === 'static') adornment.box.x = 600;
    else adornment.position.x = 600;
    scene.nodes.push(adornment);
    const result = compose(value, medium);
    assert.equal(resultScene(result, medium).nodes.length, 2);
    if (medium === 'interactive')
      assert.equal(Object.hasOwn(result.pages[0].subjectNamespaces, 'routing-mark'), false);
    adornment.semanticIds = [reference];
    assert.throws(() => compose(value, medium));
    const replacement = meaning(medium);
    sceneFor(replacement, medium).nodes[0].adornment = true;
    sceneFor(replacement, medium).nodes[0].semanticIds = [];
    assert.throws(() => compose(replacement, medium));
  });

  test(`${medium} primitive budgets are global and exact, including closing traversal`, () => {
    const exact = meaning(medium);
    sceneFor(exact, medium).nodes[0].primitives = Array.from({ length: 32 }, rect);
    assert.doesNotThrow(() => compose(exact, medium));
    sceneFor(exact, medium).nodes[0].primitives.push(rect());
    assert.throws(() => compose(exact, medium));
    const tooManyPoints = meaning(medium);
    sceneFor(tooManyPoints, medium).nodes[0].primitives = [
      {
        kind: 'polyline',
        points: Array.from({ length: 65 }, (_, x) => ({ x, y: x % 2 })),
        closed: false,
        fill: null,
        stroke: 'ink',
        strokeWidth: 2,
      },
    ];
    assert.throws(() => compose(tooManyPoints, medium));
  });

  test(`${medium} admits standard circles, rectangles and stroked paths but rejects degenerate fills`, () => {
    const value = meaning(medium);
    const node = sceneFor(value, medium).nodes[0];
    node.primitives = [
      {
        kind: 'circle',
        center: { x: 20, y: 20 },
        radius: 10,
        fill: 'paper',
        stroke: 'ink',
        strokeWidth: 2,
      },
      rect(),
      {
        kind: 'line',
        start: { x: 0, y: 0 },
        end: { x: 80, y: 60 },
        fill: null,
        stroke: 'ink',
        strokeWidth: 2,
      },
      {
        kind: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 80, y: 60 },
        ],
        closed: false,
        fill: null,
        stroke: 'ink',
        strokeWidth: 2,
      },
    ];
    assert.deepEqual(resultScene(compose(value, medium), medium).nodes[0].paintBox, {
      x: 199,
      y: 199,
      width: 82,
      height: 62,
    });
    for (const invalid of [
      {
        kind: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 20 },
          { x: 40, y: 40 },
        ],
        closed: true,
        fill: 'paper',
        stroke: null,
        strokeWidth: 0,
      },
      {
        kind: 'line',
        start: { x: 5, y: 5 },
        end: { x: 5, y: 5 },
        fill: null,
        stroke: 'ink',
        strokeWidth: 2,
      },
      {
        kind: 'polyline',
        points: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 0, y: 60 },
          { x: 0, y: 0 },
          { x: 0, y: 60 },
          { x: 80, y: 0 },
        ],
        closed: true,
        fill: 'paper',
        stroke: null,
        strokeWidth: 0,
      },
      {
        kind: 'polyline',
        points: [
          { x: 0.1, y: 0.2 },
          { x: 80.3, y: 0.4 },
          { x: 0.5, y: 60.6 },
          { x: 0.1, y: 0.2 },
          { x: 0.5, y: 60.6 },
          { x: 80.3, y: 0.4 },
        ],
        closed: true,
        fill: 'ink',
        stroke: null,
        strokeWidth: 0,
      },
      { ...rect(), fill: null, strokeWidth: 0 },
      { ...rect(), opacity: 0 },
      { ...rect(), stroke: null, strokeWidth: 2 },
    ]) {
      const rejected = meaning(medium);
      sceneFor(rejected, medium).nodes[0].primitives = [invalid];
      assert.throws(() => compose(rejected, medium));
    }
  });

  test(`${medium} enforces whole-canvas primitive and point budgets before painting`, () => {
    const value = meaning(medium);
    const scene = sceneFor(value, medium);
    const add = (count, primitives) => {
      scene.nodes = Array.from({ length: count }, (_, index) => ({
        ...structuredClone(scene.nodes[0]),
        id: `mark-${index}`,
        ...(index ? { adornment: true, semanticIds: [] } : {}),
        primitives: structuredClone(primitives),
      }));
    };
    add(128, Array.from({ length: 32 }, rect));
    assert.doesNotThrow(() => compose(value, medium));
    scene.nodes.push({
      ...structuredClone(scene.nodes[1]),
      id: 'one-extra-mark',
      primitives: [rect()],
    });
    assert.throws(() => compose(value, medium));
    const path = {
      kind: 'polyline',
      points: Array.from({ length: 64 }, (_, x) => ({ x, y: x % 2 })),
      closed: false,
      fill: null,
      stroke: 'ink',
      strokeWidth: 2,
    };
    add(
      16,
      Array.from({ length: 32 }, () => path),
    );
    assert.doesNotThrow(() => compose(value, medium));
    scene.nodes.push({
      ...structuredClone(scene.nodes[1]),
      id: 'two-extra-points',
      primitives: [
        {
          kind: 'line',
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
          fill: null,
          stroke: 'ink',
          strokeWidth: 2,
        },
      ],
    });
    assert.throws(() => compose(value, medium));
    scene.nodes.pop();
    scene.nodes[0].primitives[0].closed = true;
    assert.throws(() => compose(value, medium));
  });
}

for (const medium of ['static', 'interactive']) {
  test(`${medium} rejects a contrasting composite erased by its final background paint`, () => {
    const value = meaning(medium),
      node = sceneFor(value, medium).nodes[0];
    node.primitives = [
      { ...rect(), fill: 'ink', stroke: null, strokeWidth: 0 },
      { ...rect(), fill: 'paper', stroke: null, strokeWidth: 0 },
    ];
    assert.throws(() => compose(value, medium));
    node.primitives.at(-1).stroke = 'ink';
    node.primitives.at(-1).strokeWidth = 2;
    assert.doesNotThrow(() => compose(value, medium));
  });
}

test('legacy SVG keeps valid uppercase palette bytes without primitive normalization', async () => {
  const value = meaning('static'),
    scene = sceneFor(value, 'static');
  scene.paint = { paper: '#F3F0E8', ink: '#26362F' };
  scene.nodes[0] = {
    id: 'painted-client',
    kind: 'source',
    tone: 'ink',
    center: { x: 240, y: 230 },
    radius: 30,
    box: { x: 210, y: 200, width: 60, height: 60 },
    paintBox: { x: 209, y: 199, width: 62, height: 62 },
    strokeWidth: 2,
    semanticIds: [reference],
  };
  const measurer = await createBundledTextMeasurer(await loadBundledFonts());
  const svg = renderAuthoredCanvasSvg(
    compose(value, 'static').scene,
    'fixture-editor',
    measurer,
  ).toString('utf8');
  assert(svg.includes('fill="#F3F0E8"'));
  assert(svg.includes('stroke="#26362F"'));
});

for (const medium of ['static', 'interactive']) {
  test(`${medium} rejects background-only source marks but retains outlined paper interiors`, () => {
    const value = meaning(medium),
      scene = sceneFor(value, medium),
      node = scene.nodes[0];
    node.primitives[0].stroke = null;
    node.primitives[0].strokeWidth = 0;
    assert.throws(() => compose(value, medium));
    node.primitives[0].fill = 'ink';
    if (medium === 'static') {
      scene.paint.ink = scene.paint.paper.toUpperCase();
      assert.throws(() => compose(value, medium));
      scene.paint.ink = '#26362f';
    }
    assert.doesNotThrow(() => compose(value, medium));
    node.primitives = [rect()];
    assert.doesNotThrow(() => compose(value, medium));
  });
}

test('interactive adornments remain outside structural group membership', () => {
  const value = meaning('interactive'),
    scene = sceneFor(value, 'interactive');
  const adornment = {
    ...structuredClone(scene.nodes[0]),
    id: 'routing-mark',
    semanticIds: [],
    adornment: true,
    position: { x: 600, y: 200 },
  };
  scene.nodes.push(adornment);
  scene.groups = [
    { id: 'source-group', label: 'Selected source', nodeIds: ['painted-client'], padding: 20 },
  ];
  assert.doesNotThrow(() => compose(value, 'interactive'));
  const rejected = structuredClone(value);
  sceneFor(rejected, 'interactive').groups[0].nodeIds.push('routing-mark');
  assert.throws(() => compose(rejected, 'interactive'));
});

test('static paint substitution never moves ports and collision audit uses derived ink', () => {
  const value = meaning('static');
  const node = sceneFor(value, 'static').nodes[0];
  const port = structuredClone(node.box);
  node.primitives[0].box = { x: -155, y: -125, width: 200, height: 180 };
  const result = composeAuthoredStaticCanvas(value);
  assert.deepEqual(result.scene.nodes[0].box, port);
  assert.throws(() => assertAuthoredCanvasScene(result.scene), {
    code: 'authored_canvas_geometry_invalid',
  });
});

test('public interactive render derives omitted ink bounds before testing authored text', async (t) => {
  const root = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-primitive-text-collision-'),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const value = meaning('interactive'),
    scene = sceneFor(value, 'interactive');
  scene.nodes[0].primitives[0].box = { x: -155, y: -125, width: 200, height: 180 };
  const fonts = await loadBundledFonts(),
    measurer = await createBundledTextMeasurer(fonts);
  for (const text of scene.texts) text.box = measurer.box(text);
  await assert.rejects(
    renderArchitectureScene({ scene, output: path.join(root, 'architecture.html') }),
    /text_geometry_invalid.*collision/,
  );
});

test('primitive ink cannot overlap prototype-named legacy port owners', async (t) => {
  const root = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-primitive-prototype-'),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const id of ['other', 'constructor', 'tostring', 'isprototypeof']) {
    const value = meaning('interactive'),
      scene = sceneFor(value, 'interactive');
    scene.texts = [];
    scene.nodes[0].primitives[0].box = { x: 0, y: 0, width: 200, height: 60 };
    scene.nodes.push({
      id,
      label: 'Other',
      visualRole: 'backend',
      position: { x: 330, y: 200 },
      size: { width: 50, height: 60 },
    });
    await assert.rejects(
      renderArchitectureScene({ scene, output: path.join(root, `${id}.html`) }),
      (error) =>
        error.code === 'render_native_rejected' &&
        error.native.error.includes('paint_geometry_invalid'),
    );
  }
});

test('primitive adaptation retains valid native parser and painter syntax', async (t) => {
  const root = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-primitive-syntax-'),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(new URL('../packages/publisher/renderers/archify/supply/', import.meta.url), root, {
    recursive: true,
  });
  const value = meaning('interactive');
  const fonts = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(fonts);
  for (const text of sceneFor(value, 'interactive').texts) text.box = measurer.box(text);
  const scene = resultScene(compose(value, 'interactive'), 'interactive');
  await adaptArchitecturePrimitives(root, scene);
  await adaptArchitectureTexts(root, scene);
  for (const file of [
    'renderers/shared/generated-validators.mjs',
    'renderers/architecture/render-architecture.mjs',
  ]) {
    const check = spawnSync(process.execPath, ['--check', path.join(root, file)], {
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(check.status, 0, check.stderr);
  }
});

test('both renderers emit the same admitted primitive data, not the legacy circle or component', async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-primitives-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const fonts = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(fonts);
  const primitive = {
    kind: 'polyline',
    closed: true,
    points: [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
      { x: 0, y: 60 },
    ],
    fill: 'paper',
    stroke: 'ink',
    strokeWidth: 2,
  };
  for (const medium of ['static', 'interactive']) {
    const value = meaning(medium);
    const source = sceneFor(value, medium);
    source.nodes[0].primitives = [structuredClone(primitive)];
    for (const label of source.texts) label.box = measurer.box(label);
    const scene = resultScene(compose(value, medium), medium);
    if (medium === 'static') {
      const svg = renderAuthoredCanvasSvg(scene, 'fixture-editor', measurer).toString('utf8');
      assert.match(svg, /<polygon[^>]*points="200,200 280,200 280,260 200,260"/u);
      assert.equal(/<circle\b[^>]*data-graphic-id="node:painted-client"/u.test(svg), false);
    } else {
      const output = path.join(root, 'architecture.html');
      await renderArchitectureScene({ scene, output });
      const html = await fs.readFile(output, 'utf8');
      assert.match(html, /<polygon[^>]*points="200,200 280,200 280,260 200,260"/u);
      assert.equal(html.includes('data-node-id="painted-client"'), true);
      assert.equal(/<g[^>]*data-node-id="painted-client"[^>]*>[\s\S]*?<rect/u.test(html), false);
    }
  }
});

test(
  'real raster and desktop Chrome paint the selected primitive within derived ink bounds',
  {
    skip: !process.env.ARCHPUB_BROWSER_EXECUTABLE,
  },
  async (t) => {
    const root = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), 'archpub-primitive-pixels-'),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const fonts = await loadBundledFonts(),
      measurer = await createBundledTextMeasurer(fonts);
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const shapes = [
      {
        kind: 'circle',
        center: { x: 40, y: 30 },
        radius: 20,
        fill: 'paper',
        stroke: 'ink',
        strokeWidth: 4,
      },
      { ...rect(), strokeWidth: 4 },
      {
        kind: 'line',
        start: { x: 0, y: 0 },
        end: { x: 80, y: 60 },
        fill: null,
        stroke: 'ink',
        strokeWidth: 8,
      },
      {
        kind: 'polyline',
        closed: true,
        points: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 80, y: 60 },
          { x: 0, y: 60 },
        ],
        fill: 'paper',
        stroke: 'ink',
        strokeWidth: 4,
      },
      {
        kind: 'polyline',
        closed: false,
        points: [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
          { x: 80, y: 60 },
        ],
        fill: null,
        stroke: 'ink',
        strokeWidth: 4,
      },
    ];
    let delivery = '';
    const server = http.createServer((_request, response) =>
      response.writeHead(200, { 'Content-Type': 'text/html' }).end(delivery),
    );
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [index, primitive] of shapes.entries()) {
      const staticValue = meaning('static');
      sceneFor(staticValue, 'static').nodes[0].primitives = [primitive];
      for (const text of sceneFor(staticValue, 'static').texts) text.box = measurer.box(text);
      const staticScene = resultScene(compose(staticValue, 'static'), 'static');
      const svg = renderAuthoredCanvasSvg(staticScene, 'fixture-editor', measurer).toString('utf8');
      const fragment = svg.match(/<g data-graphic-id="node:painted-client">([\s\S]*?)<\/g>/u)[1];
      const pixels = path.join(root, `shape-${index}.png`);
      await rasterizeBytes({
        svg: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="460">${fragment}</svg>`,
        ),
        fonts: [],
        width: 900,
        output: pixels,
      });
      const raster = inspectRgbaPngCanvas(await fs.readFile(pixels), {
        background: [0, 0, 0, 0],
        colorDistance: 0,
      });
      const bounds = {
          x: raster.envelope.left,
          y: raster.envelope.top,
          width: raster.envelope.right - raster.envelope.left + 1,
          height: raster.envelope.bottom - raster.envelope.top + 1,
        },
        envelope = staticScene.nodes[0].paintBox;
      assert(bounds.x >= envelope.x && bounds.y >= envelope.y);
      assert(
        bounds.x + bounds.width <= envelope.x + envelope.width &&
          bounds.y + bounds.height <= envelope.y + envelope.height,
      );
      assert(bounds.width > 0 && bounds.height > 0);
      const interactiveValue = meaning('interactive');
      sceneFor(interactiveValue, 'interactive').nodes[0].primitives = [structuredClone(primitive)];
      for (const text of sceneFor(interactiveValue, 'interactive').texts)
        text.box = measurer.box(text);
      const scene = resultScene(compose(interactiveValue, 'interactive'), 'interactive');
      const output = path.join(root, `shape-${index}.html`);
      await renderArchitectureScene({ scene, output });
      delivery = await fs.readFile(output, 'utf8');
      await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
      const mark = page.locator(
        '[data-node-id="painted-client"] > circle, [data-node-id="painted-client"] > rect, [data-node-id="painted-client"] > line, [data-node-id="painted-client"] > polygon, [data-node-id="painted-client"] > polyline',
      );
      assert.equal(await mark.count(), 1);
      const painted = await mark.evaluate((node) => {
        const bounds = node.getBBox(),
          style = node.ownerDocument.defaultView.getComputedStyle(node);
        return {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          cap: style.strokeLinecap,
          join: style.strokeLinejoin,
          fillRule: style.fillRule,
        };
      });
      assert.equal(painted.cap, 'round');
      assert.equal(painted.join, 'round');
      assert.equal(painted.fillRule, 'nonzero');
      assert(painted.x >= scene.nodes[0].paintBox.x && painted.y >= scene.nodes[0].paintBox.y);
      assert(
        painted.x + painted.width <= scene.nodes[0].paintBox.x + scene.nodes[0].paintBox.width,
      );
      assert(
        painted.y + painted.height <= scene.nodes[0].paintBox.y + scene.nodes[0].paintBox.height,
      );
    }
    assert.equal(errors.length, 0, errors.join('\n'));
  },
);
