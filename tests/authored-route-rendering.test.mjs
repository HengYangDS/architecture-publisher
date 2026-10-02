import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { assertAuthoredCanvasScene } from '../packages/publisher/src/scene/static/audit.mjs';
import { renderArchitectureScene } from '../packages/publisher/renderers/archify/index.mjs';
import { adaptArchitectureRoutes } from '../packages/publisher/renderers/archify/routes.mjs';
import {
  renderAuthoredCanvasSvg,
  authoredCanvasFramingRequest,
} from '../packages/publisher/renderers/svg/canvas.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import { auditEmittedEdges } from '../packages/publisher/src/scene/emitted-path.mjs';
import { composeInteractiveHtml } from '../packages/publisher/src/rendering/interactive-html.mjs';
import { rasterizeBytes } from '../packages/publisher/renderers/resvg/public.mjs';
import { inspectRgbaPngCanvas } from '../packages/publisher/src/qualification/static/png.mjs';
import { chromium } from 'playwright-core';
import {
  sha,
  namespace,
  editorialRef,
  meaningFor,
  sceneFor,
  compose,
  composedScene,
} from './fixtures/authored-routes.mjs';

test('the real static painter emits each shared physical segment and its declared arrow once', async () => {
  const result = compose(meaningFor('static'), 'static');
  assert.equal(assertAuthoredCanvasScene(result.scene).geometry.failures.length, 0);
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...result.scene.texts,
    authoredCanvasFramingRequest('example:editor'),
  ]);
  const svg = renderAuthoredCanvasSvg(result.scene, 'example:editor', measurer).toString('utf8');
  assert.equal([...svg.matchAll(/data-edge=/gu)].length, 3);
  assert.equal([...svg.matchAll(/ marker-end=/gu)].length, 1);
  assert.equal(svg.includes('M 400 200 L 432 200'), true);
  const bridge = svg.indexOf('data-edge="bridge"');
  const junction = svg.indexOf('data-graphic-id="node:junction"');
  assert.ok(bridge > junction, 'the visible bridge must paint after its filled junction');
});

test('emitted audit checks every literal point, not only its source and target', async () => {
  const result = compose(meaningFor('static'), 'static');
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
    ...result.scene.texts,
    authoredCanvasFramingRequest('example:editor'),
  ]);
  const svg = renderAuthoredCanvasSvg(result.scene, 'example:editor', measurer).toString('utf8');
  const changed = svg.replace('M 152 200 L 400 200', 'M 152 200 L 250 220 L 400 200');
  assert.throws(
    () => auditEmittedEdges(changed, result.scene, { minimumTerminal: 14, endpointTolerance: 1 }),
    /literal|route|point/u,
  );
});

for (const defect of [
  'missing-marker',
  'changed-wing',
  'changed-stroke',
  'missing-stroke',
  'reversed-marker',
]) {
  test(`emitted audit refuses actual arrow defect ${defect}`, async () => {
    const result = compose(meaningFor('static'), 'static');
    const measurer = await createBundledTextMeasurer(await loadBundledFonts(), [
      ...result.scene.texts,
      authoredCanvasFramingRequest('example:editor'),
    ]);
    const svg = renderAuthoredCanvasSvg(result.scene, 'example:editor', measurer).toString('utf8');
    let changed = svg;
    if (defect === 'missing-marker')
      changed = svg.replace(/<defs><marker[\s\S]*?<\/marker><\/defs>/u, '');
    if (defect === 'changed-wing')
      changed = svg.replace('d="M 0 0 L 8 4 L 0 8"', 'd="M 0 0 L 8 4 L 0 0"');
    if (defect === 'changed-stroke')
      changed = svg.replace('stroke-width="1.2"', 'stroke-width="0"');
    if (defect === 'missing-stroke')
      changed = svg.replace(
        /stroke="#303733" stroke-width="1.2"/u,
        'stroke="none" stroke-width="1.2"',
      );
    if (defect === 'reversed-marker')
      changed = svg.replace('orient="auto"', 'orient="auto-start-reverse"');
    assert.throws(
      () => auditEmittedEdges(changed, result.scene, { minimumTerminal: 14, endpointTolerance: 1 }),
      /arrow|marker/u,
    );
  });
}

test('geometry-only segments are never mandatory inspection subjects', async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-routes-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const meaning = meaningFor('interactive');
  const raw = sceneFor(meaning, 'interactive');
  raw.edges.push({
    ...structuredClone(raw.edges[0]),
    id: 'unused-decoration',
    points: [
      { x: 152, y: 200 },
      { x: 260, y: 200 },
      { x: 260, y: 310 },
      { x: 400, y: 310 },
      { x: 400, y: 200 },
    ],
  });
  const result = compose(meaning, 'interactive');
  assert.equal(Object.hasOwn(result.pages[0].subjectNamespaces, 'unused-decoration'), false);
});

test('the real Archify adapter retains literal contact bytes and paints a shared bridge once', async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-routes-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const result = compose(meaningFor('interactive'), 'interactive');
  const scene = structuredClone(result.pages[0].scene);
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), scene.texts);
  scene.texts = scene.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  const output = path.join(root, 'architecture.html');
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, 'utf8');
  assert.equal([...html.matchAll(/data-edge-id="bridge"/gu)].length, 1);
  const bridge = html.match(/<path\b[^>]*data-edge-id="bridge"[^>]*>/u)?.[0];
  assert.ok(bridge);
  assert.equal(bridge.includes('d="M 400 200 L 432 200"'), true);
  assert.equal(bridge.includes('marker-end='), false);
  assert.equal(
    [...html.matchAll(/<path\b[^>]*data-edge-id="terminal"[^>]*marker-end=/gu)].length,
    1,
  );
  assert.equal(html.includes('data-node-id="junction"'), false);
});

test('the route adapter never mutates a native renderer when no literal segments are selected', async () => {
  assert.deepEqual(
    await adaptArchitectureRoutes('/unselected/native', { nodes: [], edges: [] }),
    {},
  );
});

test('the route adapter refuses an unsupported literal tone before repainting the native runtime', async () => {
  const scene = structuredClone(compose(meaningFor('interactive'), 'interactive').pages[0].scene);
  scene.edges[0].strokeTone = 'unselected';
  const native = fileURLToPath(
    new URL('../packages/publisher/renderers/archify/supply/', import.meta.url),
  );
  await assert.rejects(adaptArchitectureRoutes(native, scene), {
    code: 'render_scene_route_tone_unsupported',
  });
});

test('the route adapter refuses a missing or duplicated selected native seam before writing', async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-route-seam-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(new URL('../packages/publisher/renderers/archify/supply/', import.meta.url), root, {
    recursive: true,
  });
  const file = path.join(root, 'renderers/architecture/render-architecture.mjs');
  const original = await fs.readFile(file, 'utf8');
  const seam = 'function renderConnectionPath(conn, index) {\n';
  const scene = compose(meaningFor('interactive'), 'interactive').pages[0].scene;
  for (const changed of [original.replace(seam, ''), `${original}\n${seam}`]) {
    await fs.writeFile(file, changed);
    await assert.rejects(adaptArchitectureRoutes(root, scene), {
      code: 'render_scene_route_seam_invalid',
    });
    assert.equal(await fs.readFile(file, 'utf8'), changed);
  }
});

test('unbound literal decoration paints without acquiring an inspection record', async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-route-paint-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(new URL('../packages/publisher/renderers/archify/supply/', import.meta.url), root, {
    recursive: true,
  });
  const scene = structuredClone(compose(meaningFor('interactive'), 'interactive').pages[0].scene);
  scene.routes = [];
  const adaptation = await adaptArchitectureRoutes(root, scene);
  const source = await fs.readFile(
    path.join(root, 'renderers/architecture/render-architecture.mjs'),
    'utf8',
  );
  const painted = Object.values(JSON.parse(/^ {2}const painted = (.*);$/mu.exec(source)[1]));
  assert.equal(painted.length, scene.edges.length);
  for (const markup of painted) {
    assert.match(markup, /aria-hidden="true"/u);
    assert.doesNotMatch(markup, /data-composition-points=|data-edge-id=/u);
  }
  assert.throws(
    () => adaptation.verifyRendered(Buffer.from('<svg/>')),
    /emitted edge identity set mismatch/u,
  );
});

test(
  'real raster and desktop Chrome retain bridge ink, arrow paint and all shared Inspect records',
  { skip: !process.env.ARCHPUB_BROWSER_EXECUTABLE },
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-routes-browser-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const fonts = await loadBundledFonts();
    const staticMeaning = meaningFor('static');
    const staticScene = composedScene(compose(staticMeaning, 'static'), 'static');
    const measurer = await createBundledTextMeasurer(fonts, [
      ...staticScene.texts,
      authoredCanvasFramingRequest('example:editor'),
    ]);
    const svg = renderAuthoredCanvasSvg(staticScene, 'example:editor', measurer);
    const rasterPath = path.join(root, 'architecture.png');
    await rasterizeBytes({
      svg,
      fonts: fonts.fonts.map(({ weight, bytes }) => ({ family: 'JetBrains Mono', weight, bytes })),
      width: 960,
      output: rasterPath,
    });
    const raster = inspectRgbaPngCanvas(await fs.readFile(rasterPath), {
      background: [250, 249, 246, 255],
      colorDistance: 4,
    });
    assert.ok(raster.inkPixels > 300);
    const meaning = meaningFor('interactive', true);
    const authored = sceneFor(meaning, 'interactive');
    authored.routes.push({
      ...structuredClone(authored.routes[0]),
      id: 'editorial-route',
      reference: editorialRef,
      editionSha256: meaning.edition.sha256,
    });
    const interactiveMeasurer = await createBundledTextMeasurer(fonts, authored.texts);
    authored.texts = authored.texts.map((label) => ({
      ...label,
      box: interactiveMeasurer.box(label),
    }));
    const composed = compose(meaning, 'interactive').pages[0];
    const output = path.join(root, 'page.html');
    await renderArchitectureScene({ scene: composed.scene, output });
    const content = await fs.readFile(output);
    const source = meaning.native.selections[0].source;
    const standalone = composeInteractiveHtml({
      schema: 'architecture.interactive-html-composition/v2',
      title: meaning.editorial.title,
      framing: 'Source relationships and editorial explanation remain distinct.',
      build: {
        lockSha256: '1'.repeat(64),
        editionSha256: meaning.edition.sha256,
        semanticDigest: '2'.repeat(64),
      },
      editionId: meaning.edition.id,
      overview: 'overview',
      sources: [
        {
          id: 'model',
          kind: 'native',
          namespace,
          sha256: source.sha256,
          claimant: source.claimant,
        },
      ],
      pages: [
        {
          id: composed.id,
          label: composed.label,
          shortLabel: 'Routes',
          purpose: composed.purpose,
          path: 'views/overview.html',
          sha256: sha(content),
          sourceIds: ['model'],
          subjectSources: Object.fromEntries(
            Object.entries(composed.subjectNamespaces).map(([id, namespaces]) => [
              id,
              namespaces.length ? ['model'] : [],
            ]),
          ),
          content,
          facts: composed.facts,
        },
      ],
      state: {
        qualification: 'not-performed',
        humanAcceptance: 'not-performed',
        publication: 'not-performed',
      },
    });
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setContent(standalone.toString('utf8'), { waitUntil: 'load' });
    const frame = page.frameLocator('#interactive-frame');
    await frame.locator('[data-edge-id="bridge"]').waitFor({ state: 'attached' });
    const actual = await frame.locator('[data-edge-id="bridge"]').evaluate((element) => ({
      d: element.getAttribute('d'),
      marker: element.getAttribute('marker-end'),
      stroke: element.ownerDocument.defaultView.getComputedStyle(element).stroke,
      width: element.ownerDocument.defaultView.getComputedStyle(element).strokeWidth,
      afterJunction: Boolean(
        element.compareDocumentPosition(
          element.ownerSVGElement.querySelector('rect[x="400"][y="188"]'),
        ) & element.ownerDocument.defaultView.Node.DOCUMENT_POSITION_PRECEDING,
      ),
    }));
    assert.equal(actual.d, 'M 400 200 L 432 200');
    assert.equal(actual.marker, null);
    assert.equal(actual.width, '1.5px');
    assert.notEqual(actual.stroke, 'none');
    assert.equal(actual.afterJunction, true);
    const terminal = await frame.locator('[data-edge-id="terminal"]').getAttribute('marker-end');
    assert.equal(terminal, 'url(#literal-arrow-terminal)');
    await page.locator('#interactive-inspect').click();
    await page.locator('#interactive-inspect-index button[data-graphic-id="bridge"]').click();
    await page
      .locator('#interactive-inspect-content summary')
      .filter({ hasText: 'Editorial: conditional' })
      .click();
    const inspector = await page.locator('#interactive-inspect-content').innerText();
    assert.match(inspector, /Relation kind/u);
    assert.match(inspector, /Editorial: conditional/u);
    assert.match(inspector, /editor-attributed-unverified/u);
    assert.equal(await page.locator('#interactive-inspect-content details').count(), 3);
    assert.deepEqual(errors, []);
  },
);
