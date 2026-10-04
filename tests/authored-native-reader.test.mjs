import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright-core';
import { browserLifetime } from './fixtures/browser-lifetime.mjs';
import { meaningFor, sceneFor, compose, ref } from './fixtures/authored-routes.mjs';
import { renderArchitectureScene } from '../packages/publisher/renderers/archify/index.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';

const browserPath = process.env.ARCHPUB_BROWSER_EXECUTABLE;
const runBrowser = { skip: !path.isAbsolute(browserPath ?? '') };

test('checked source relations remain logical edges when their physical segments are shared', () => {
  const page = compose(meaningFor('interactive'), 'interactive').pages[0];
  assert.deepEqual(page.exploration.nodes, [
    { id: 'client', label: 'client', kind: 'component' },
    { id: 'server', label: 'server', kind: 'component' },
  ]);
  assert.deepEqual(page.exploration.relations, [
    {
      id: 'route-request',
      reference: ref('relation', 'request'),
      from: 'client',
      to: 'server',
      label: 'calls',
      routeId: 'route-request',
    },
    {
      id: 'route-telemetry',
      reference: ref('relation', 'telemetry'),
      from: 'client',
      to: 'server',
      label: 'calls',
      routeId: 'route-telemetry',
    },
  ]);
  assert.deepEqual(page.exploration.limits, []);
});

test('repeated source occurrences declare a query limit instead of choosing an arbitrary endpoint', () => {
  const meaning = meaningFor('interactive');
  const scene = sceneFor(meaning, 'interactive');
  scene.nodes.push({
    ...structuredClone(scene.nodes[0]),
    id: 'client-copy',
    position: { x: 128, y: 280 },
  });
  const page = compose(meaning, 'interactive').pages[0];
  assert.deepEqual(page.exploration.limits, ['nonbijective-source-membership']);
  assert.deepEqual(page.exploration.relations, []);
  assert.equal(page.carriers[0].graphicIds.includes('client-copy'), true);
});

test('a raw physical route is not admitted to native graph queries without checked source bindings', async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-raw-route-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = structuredClone(compose(meaningFor('interactive'), 'interactive').pages[0].scene);
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), scene.texts);
  scene.texts = scene.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  const output = path.join(root, 'architecture.html');
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, 'utf8');
  assert.doesNotMatch(html, /<path\b[^>]*data-edge-(?:from|to)="junction"/);
  assert.match(html, /data-literal-segment-id="bridge"/);
});

test(
  'native Route and Reach query exact logical relations, not painted junction fragments',
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-native-reader-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const meaning = meaningFor('interactive');
    const raw = sceneFor(meaning, 'interactive');
    const measurer = await createBundledTextMeasurer(await loadBundledFonts(), raw.texts);
    raw.texts = raw.texts.map((label) => ({ ...label, box: measurer.box(label) }));
    const composed = compose(meaning, 'interactive').pages[0];
    const output = path.join(root, 'architecture.html');
    await renderArchitectureScene({
      scene: composed.scene,
      exploration: composed.exploration,
      output,
    });
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(
      await chromium.launch({ executablePath: browserPath, headless: true, chromiumSandbox: true }),
    );
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setContent(await fs.readFile(output, 'utf8'), { waitUntil: 'load' });
    assert.equal(
      await page.locator('svg [data-node-id="client"]').getAttribute('data-node-kind'),
      'component',
    );
    assert.equal(await page.locator('svg [data-node-id="junction"]').count(), 0);
    const route = await page.evaluate(() => {
      globalThis.Archify.routeProbe.begin({ source: 'client', focusNode: false });
      globalThis.Archify.routeProbe.choose('server');
      return globalThis.Archify.routeProbe.exportSnapshot();
    });
    assert.deepEqual(route.nodeIds, ['client', 'server']);
    assert.equal(route.hops, 1);
    assert.equal(route.edges[0].key, ref('relation', 'request'));
    const reach = await page.evaluate(() => {
      globalThis.Archify.routeProbe.clear();
      globalThis.Archify.focus.set('client', { toggle: false });
      globalThis.Archify.focus.reach('downstream', { reveal: false });
      return globalThis.Archify.focus.reachabilitySnapshot();
    });
    assert.deepEqual(reach.nodeIds, ['client', 'server']);
    assert.deepEqual(
      reach.edges.map((edge) => edge.key).sort(),
      [ref('relation', 'request'), ref('relation', 'telemetry')].sort(),
    );
    assert.equal(await page.locator('[data-literal-segment-id="bridge"]').count(), 1);
    await page.evaluate(() => {
      globalThis.Archify.focus.clear();
      globalThis.Archify.finder.open();
    });
    await page.locator('#node-finder-input').fill('server');
    assert.equal(await page.locator('#node-finder-results button:visible').count(), 1);
    await page.locator('#node-finder-results button:visible').click();
    assert.equal(await page.evaluate(() => globalThis.Archify.focus.active()), 'server');
    assert.equal(await page.locator('#focus-kind').textContent(), 'Component');
    await page.evaluate(() => globalThis.Archify.focus.clear());
    await page.evaluate(() => globalThis.Archify.guide.toggle());
    assert.equal(await page.locator('#diagram-guide').isVisible(), true);
    await page.locator('#diagram-guide-close').click();
    await page.evaluate(() => globalThis.Archify.semanticLens.toggle());
    assert.equal(await page.locator('#semantic-lens').isVisible(), true);
    await page.keyboard.press('Escape');
    await page.evaluate(() => globalThis.Archify.presentation.enter());
    assert.equal(await page.locator('html').getAttribute('data-present'), 'true');
    await page.evaluate(() => globalThis.Archify.presentation.exit());
    await page.evaluate(() => globalThis.Archify.layoutStability.whenStable());
    assert.equal(
      await page.evaluate(
        () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
      ),
      true,
    );
    const downloaded = page.waitForEvent('download', { timeout: 15000 });
    await page.evaluate(() => globalThis.Archify.exportMenu.run('svg'));
    const exported = await fs.readFile(await (await downloaded).path(), 'utf8');
    const residualState = await page.evaluate((xml) => {
      const document = new globalThis.DOMParser().parseFromString(xml, 'image/svg+xml');
      return document.querySelectorAll(
        '[data-focus-active],[data-route-active],[data-reach-active],[data-intent-trace-overlay],[data-relationship-hit-overlay]',
      ).length;
    }, exported);
    assert.equal(residualState, 0);
    assert.equal(exported.includes('M 400 200 L 432 200'), true);
    assert.deepEqual(errors, []);
  },
);
