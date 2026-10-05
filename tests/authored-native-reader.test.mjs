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
import { editionFixture } from './fixtures/edition.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { semanticArchitectureProjections } from '../packages/publisher/src/scene/contract.mjs';
import { interactiveArchitectureScene } from '../packages/publisher/src/scene/interactive/architecture.mjs';

const browserPath = process.env.ARCHPUB_BROWSER_EXECUTABLE;
const runBrowser = { skip: !path.isAbsolute(browserPath ?? '') };

test(
  'typed native figures refuse neutral fallback and suppression before rendering',
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-icon-default-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const { model, edition } = editionFixture();
    const view = semanticArchitectureProjections(model, edition).interactiveScenes[0];
    const scene = structuredClone(interactiveArchitectureScene(model, edition, view));
    for (const [index, node] of scene.nodes.entries()) {
      node.figureKind = index === 2 ? 'backend' : 'none';
      if (index === 1) node.icon = 'none';
    }
    for (const edge of scene.edges) edge.semanticIds = [ref('relation', edge.id)];
    const exploration = {
      nodes: scene.nodes.map(({ id, label, figureKind }) => ({ id, label, kind: figureKind })),
      relations: scene.edges.map(({ id, from, to }) => ({
        id,
        reference: ref('relation', id),
        from,
        to,
        label: model.relations[id].type,
        edgeId: id,
      })),
      limits: [],
    };
    const output = path.join(root, 'architecture.html');
    await assert.rejects(renderArchitectureScene({ scene, exploration, output }), {
      code: 'figure_type_glyph_unsupported',
    });
    await assert.rejects(fs.stat(output), { code: 'ENOENT' });
  },
);

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

test('homogeneous aggregate occurrences retain their declared source type', () => {
  const meaning = meaningFor('interactive');
  sceneFor(meaning, 'interactive').nodes[0].semanticIds.push(ref('entity', 'server'));
  const page = compose(meaning, 'interactive').pages[0];
  assert.equal(page.exploration.nodes.find(({ id }) => id === 'client').kind, 'component');
  assert.deepEqual(page.exploration.relations, []);
  assert.deepEqual(page.exploration.limits, ['nonbijective-source-membership']);
});

test('authored figure roles preserve mixed source kinds, labels and exact Inspect facts', () => {
  const source = claimModel();
  source.vocabulary.entities.push('database');
  source.entities.server.type = 'database';
  const meaning = meaningFor('interactive', false, source);
  const scene = sceneFor(meaning, 'interactive');
  const original = scene.nodes[0];
  scene.nodes[0] = {
    id: original.id,
    label: 'Source pair',
    figureKind: 'source',
    visualRole: 'frontend',
    position: original.position,
    size: original.size,
    semanticIds: [ref('entity', 'client'), ref('entity', 'server')],
  };
  meaning.editorial.visualPolicy = { profile: 'neutral', figureTypes: { source: 'lucide:files' } };
  const page = compose(meaning, 'interactive').pages[0];
  assert.deepEqual(
    page.exploration.nodes.find(({ id }) => id === 'client'),
    {
      id: 'client',
      label: 'Source pair',
      kind: 'source',
    },
  );
  assert.deepEqual(page.exploration.limits, ['nonbijective-source-membership']);
  assert.deepEqual(page.exploration.relations, []);
  const kinds = page.facts
    .filter(
      ({ graphicId, reference }) =>
        graphicId === 'client' &&
        [ref('entity', 'client'), ref('entity', 'server')].includes(reference),
    )
    .map(({ facts }) => facts.find(({ label }) => label === 'Entity kind').value);
  assert.deepEqual(kinds, ['component', 'database']);
});

test(
  'aggregate figures retain native occurrence reading without inventing relationship counts',
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-occurrence-reader-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const meaning = meaningFor('interactive');
    const raw = sceneFor(meaning, 'interactive');
    raw.nodes.push({
      ...structuredClone(raw.nodes[0]),
      id: 'client-copy',
      position: { x: 128, y: 280 },
    });
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
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setContent(await fs.readFile(output, 'utf8'), { waitUntil: 'load' });
    assert.equal(await page.locator('.diagram-container > svg [data-node-id]').count(), 3);
    assert.equal(
      await page.locator('svg [data-node-id="client-copy"]').getAttribute('data-node-label'),
      'client-copy',
    );
    await page.evaluate(() => globalThis.Archify.finder.open());
    await page.locator('#node-finder-input').fill('client');
    assert.equal(await page.locator('#node-finder-results button:visible').count(), 2);
    await page.locator('#node-finder-results button[data-node-id="client-copy"]').click();
    assert.equal(await page.evaluate(() => globalThis.Archify.focus.active()), 'client-copy');
    assert.match(await page.locator('#focus-summary').textContent(), /figure occurrence/i);
    assert.equal(await page.locator('#btn-focus-relations').isVisible(), false);
    assert.equal(
      await page.evaluate(() => globalThis.Archify.focus.reach('downstream', { reveal: false })),
      false,
    );
    assert.equal(await page.evaluate(() => globalThis.Archify.focus.reachabilitySnapshot()), null);
    assert.equal(
      await page.evaluate(() => globalThis.Archify.routeProbe.begin({ source: 'client' })),
      false,
    );
    await page.evaluate(() => globalThis.Archify.semanticLens.toggle());
    assert.equal(await page.locator('#semantic-lens').isVisible(), true);
    assert.match(await page.locator('.semantic-lens-instruction').textContent(), /figure/i);
    await page.locator('#semantic-lens-kinds button[data-kind="component"]').click();
    assert.match(
      await page.locator('#semantic-lens-status').textContent(),
      /3 .*figure occurrences/i,
    );
    assert.doesNotMatch(
      await page.locator('#semantic-lens-status').textContent(),
      /0 relationships/i,
    );
    await page.evaluate(() => globalThis.Archify.guide.open());
    assert.deepEqual(await page.evaluate(() => globalThis.Archify.guide.facts()), {
      nodes: 3,
      relationships: null,
    });
    assert.match(await page.locator('#diagram-guide-stats').textContent(), /3 figure occurrences/i);
    assert.equal(await page.locator('#btn-route-probe').isVisible(), false);
    assert.equal(await page.locator('#btn-semantic-lens').isVisible(), true);
    assert.equal(await page.locator('[data-guide-action="route"]').isVisible(), false);
    assert.deepEqual(errors, []);
  },
);

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
  'native icons remain decorative while Legend and Lens use explicit figure roles',
  runBrowser,
  async (t) => {
    const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-type-marks-')));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const { model, edition } = editionFixture();
    const view = semanticArchitectureProjections(model, edition).interactiveScenes[0];
    const scene = structuredClone(interactiveArchitectureScene(model, edition, view));
    const icons = ['lucide:notebook-pen', 'lucide:notebook-pen', 'lucide:panels-top-left'];
    for (const [index, node] of scene.nodes.entries()) {
      node.figureKind = index === 2 ? 'scene' : 'editorial project';
      node.icon = icons[index];
    }
    for (const edge of scene.edges) edge.semanticIds = [ref('relation', edge.id)];
    const exploration = {
      nodes: scene.nodes.map(({ id, label, figureKind }) => ({ id, label, kind: figureKind })),
      relations: scene.edges.map(({ id, from, to }) => ({
        id,
        reference: ref('relation', id),
        from,
        to,
        label: model.relations[id].type,
        edgeId: id,
      })),
      limits: [],
    };
    const output = path.join(root, 'architecture.html');
    await renderArchitectureScene({ scene, exploration, output });
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(
      await chromium.launch({ executablePath: browserPath, headless: true, chromiumSandbox: true }),
    );
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setContent(await fs.readFile(output, 'utf8'), { waitUntil: 'load' });
    const sourceKinds = [...new Set(exploration.nodes.map(({ kind }) => kind))];
    assert.deepEqual(
      await page
        .locator('[data-legend-kind]')
        .evaluateAll((entries) => entries.map((entry) => entry.getAttribute('data-legend-kind'))),
      sourceKinds,
    );
    for (const [index, member] of exploration.nodes.entries()) {
      const node = page.locator(`.diagram-container > svg [data-node-id="${member.id}"]`);
      assert.equal(await node.getAttribute('data-node-kind'), member.kind);
      assert.equal(await node.locator('[data-node-type]').count(), 0);
      assert.equal(
        await node.locator(`[data-semantic-sigil="${icons[index]}"]`).count(),
        icons[index] === 'none' ? 0 : 1,
      );
      assert.doesNotMatch(await node.locator('title').textContent(), /Backend|Frontend|Security/i);
    }
    const legend = page.locator(`[data-legend-kind="${sourceKinds[0]}"]`);
    assert.deepEqual(
      await legend
        .locator('[data-semantic-sigil]')
        .evaluateAll((marks) => marks.map((mark) => mark.getAttribute('data-semantic-sigil'))),
      ['lucide:notebook-pen'],
    );
    assert.equal(await legend.getAttribute('data-legend-count'), '2');
    assert.equal(await legend.locator('[data-legend-count-badge]').count(), 0);
    assert.equal(await legend.locator('text').textContent(), 'editorial project');
    assert.equal(await legend.getAttribute('aria-label'), 'Inspect editorial project');
    const hitGeometry = await legend.evaluate((entry) => {
      const hit = entry.querySelector('[data-legend-hit]').getBoundingClientRect();
      const label = entry
        .querySelector('text:not([data-legend-bridge-runtime])')
        .getBoundingClientRect();
      const icons = [...entry.querySelectorAll('[data-semantic-sigil]')].map((mark) =>
        mark.getBoundingClientRect(),
      );
      const covers = (box) =>
        box.left >= hit.left &&
        box.right <= hit.right &&
        box.top >= hit.top &&
        box.bottom <= hit.bottom;
      const center = globalThis.document.elementFromPoint(
        (hit.left + hit.right) / 2,
        (hit.top + hit.bottom) / 2,
      );
      return {
        label: covers(label),
        icons: icons.every(covers),
        iconBeforeLabel: icons.every((icon) => icon.right + 3 <= label.left),
        iconsSeparated: icons.every(
          (icon, index) => !index || icons[index - 1].right + 3 <= icon.left,
        ),
        target: entry.contains(center),
      };
    });
    assert.deepEqual(hitGeometry, {
      label: true,
      icons: true,
      iconBeforeLabel: true,
      iconsSeparated: true,
      target: true,
    });
    const entrySpacing = await page.locator('[data-legend-kind]').evaluateAll((entries) => {
      const boxes = entries.map((entry) =>
        entry.querySelector('[data-legend-hit]').getBoundingClientRect(),
      );
      return boxes.slice(1).map((box, index) => box.left - boxes[index].right);
    });
    assert(
      entrySpacing.every((gap) => gap >= 8),
      `Legend targets collide: ${entrySpacing}`,
    );
    await legend.click();
    assert.equal(await page.locator('#semantic-lens').isVisible(), true);
    assert.equal(
      await page
        .locator(`#semantic-lens-kinds [data-kind="${sourceKinds[0]}"]`)
        .getAttribute('aria-pressed'),
      'true',
    );
    assert.match(await page.locator('#semantic-lens-status').textContent(), /2/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#semantic-lens').isVisible(), false);
    assert.equal(await legend.getAttribute('aria-pressed'), 'true');
    await legend.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#semantic-lens').isVisible(), true);
    assert.equal(
      await page
        .locator(`#semantic-lens-kinds [data-kind="${sourceKinds[0]}"]`)
        .getAttribute('aria-pressed'),
      'false',
    );
    await page.keyboard.press('Escape');
    await legend.focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#semantic-lens').isVisible(), true);
    assert.equal(
      await page
        .locator(`#semantic-lens-kinds [data-kind="${sourceKinds[0]}"]`)
        .getAttribute('aria-pressed'),
      'true',
    );
    const downloaded = page.waitForEvent('download', { timeout: 15000 });
    await page.evaluate(() => globalThis.Archify.exportMenu.run('svg'));
    const exported = await fs.readFile(await (await downloaded).path(), 'utf8');
    assert.match(exported, /data-semantic-sigil="lucide:notebook-pen"/);
    assert.match(exported, /data-semantic-sigil="lucide:panels-top-left"/);
    assert.doesNotMatch(exported, /data-semantic-sigil="(?:backend|clock)"/);
    assert.match(exported, /<metadata id="figure-icon-license">/);
    assert.equal(
      await page.evaluate((source) => {
        const document = new globalThis.DOMParser().parseFromString(source, 'image/svg+xml');
        return document.querySelectorAll(
          '[data-node-type], [data-legend-selected], [data-lens-match]',
        ).length;
      }, exported),
      0,
    );
    assert.deepEqual(errors, []);
  },
);

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
    assert.doesNotMatch(
      await page.locator('.semantic-lens-instruction').textContent(),
      /real traffic/i,
    );
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
