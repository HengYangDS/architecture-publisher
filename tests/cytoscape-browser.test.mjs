import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import axe from 'axe-core';
import { chromium } from 'playwright-core';
import { renderInteractiveEditionHtml } from '../packages/publisher/renderers/cytoscape/index.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';

const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;

test(
  'the exact neutral HTML reads every page offline with independent graph behavior',
  {
    skip: !path.isAbsolute(browserExecutable ?? ''),
    timeout: 35_000,
  },
  async (t) => {
    const scene = interactiveEditionScene();
    const overview = scene.pages[0];
    for (let index = 0; index < 10; index += 1) {
      const id = 'client-' + index;
      const relationId = 'relation-client-' + index;
      const endpoint = { namespace: overview.nodes[1].namespace, id };
      overview.nodes.push({ ...overview.nodes[1], id, label: 'Client ' + index });
      overview.relations.push({
        ...overview.relations[0],
        id: relationId,
        from: overview.relations[0].to,
        to: endpoint,
      });
      overview.sourceAssertionCarriers[0].nodeRefs.push(endpoint);
      overview.sourceAssertionCarriers[0].relationRefs.push({
        ...overview.sourceAssertionCarriers[0].relationRefs[0],
        reference: relationId,
      });
    }
    const candidate = await renderInteractiveEditionHtml(scene);
    const hostileScene = interactiveEditionScene();
    hostileScene.pages[0].nodes[0].label = '<img src=x onerror="window.__archpub_injected=true">';
    const hostileCandidate = await renderInteractiveEditionHtml(hostileScene);
    const chainScene = interactiveEditionScene();
    const chain = chainScene.pages[0];
    chain.nodes[0].label = 'Result[E,T]';
    chain.nodes[1].label = 'Effect[R,E,T]';
    chain.relations[0].label = '';
    for (const label of ['Computation[R,E,T]', 'Dependency Mgmt', 'Injector Orchestration']) {
      const previous = chain.nodes.at(-1);
      const id = `layer-${chain.nodes.length}`;
      const node = { ...chain.nodes[1], id, label };
      const relation = {
        ...chain.relations[0],
        id: `relation-${id}`,
        from: { namespace: previous.namespace, id: previous.id },
        to: { namespace: node.namespace, id },
      };
      chain.nodes.push(node);
      chain.relations.push(relation);
      chain.sourceAssertionCarriers[0].nodeRefs.push({ namespace: node.namespace, id });
      chain.sourceAssertionCarriers[0].relationRefs.push({
        namespace: relation.origin.namespace,
        reference: relation.id,
        sha256: relation.origin.sha256,
      });
    }
    const chainCandidate = await renderInteractiveEditionHtml(chainScene);
    const server = http.createServer((request, response) => {
      if (!['/edition.html', '/hostile.html', '/chain.html'].includes(request.url)) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      response.end(
        request.url === '/hostile.html'
          ? hostileCandidate.bytes
          : request.url === '/chain.html'
            ? chainCandidate.bytes
            : candidate.bytes,
      );
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    t.after(() => browser.close());
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    t.after(() => context.close());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.route('**/*', (route) => {
      if (route.request().url().startsWith(`${origin}/`)) return route.continue();
      errors.push(`external-request:${route.request().url()}`);
      return route.abort();
    });
    const response = await page.goto(`${origin}/edition.html`, {
      waitUntil: 'load',
      timeout: 15_000,
    });
    assert.equal(response.status(), 200);
    await page.waitForSelector('#graph-0[data-rendered="true"]', { timeout: 8_000 });
    await page.evaluate(() => globalThis.document.fonts.ready);
    await page.addScriptTag({ content: axe.source });
    const assertAccessible = async (label) => {
      const violations = await page.evaluate(async () => {
        const result = await globalThis.axe.run(globalThis.document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        });
        return result.violations.map(({ id, impact, nodes }) => ({
          id,
          impact,
          targets: nodes.map(({ target }) => target),
        }));
      });
      assert.deepEqual(violations, [], `${label} accessibility violations`);
    };
    const graphGeometry = () =>
      page.evaluate(() => {
        const registry = Reflect.get(globalThis.document.getElementById('graph-0'), '_cyreg');
        const graph = registry.cy;
        const bounds = graph.elements().boundingBox();
        return { zoom: graph.zoom(), width: bounds.w, height: bounds.h };
      });
    await assertAccessible('overview');
    assert.equal(await page.locator('#graph-0').getAttribute('data-layout'), 'rightward');
    assert.equal(
      await page
        .locator('#graph-0')
        .evaluate((element) => element.classList.contains('graph--chain')),
      false,
    );
    const initialGeometry = await graphGeometry();
    assert.equal((await page.locator('#page-0 canvas').count()) > 0, true);
    assert.equal(await page.locator('#page-1').isHidden(), true);
    assert.equal(await page.getByRole('button', { name: 'Alpha & one component' }).count(), 1);
    await page.getByRole('button', { name: 'What remains uncertain?' }).click();
    assert.equal(await page.locator('#page-0').isHidden(), true);
    assert.equal(await page.locator('#page-1').isVisible(), true);
    assert.equal(await page.getByText('Runtime safety is not established.').isVisible(), true);
    assert.equal(await page.locator('#page-1 .empty-graph blockquote').count(), 1);
    await assertAccessible('editorial page');
    assert.equal(
      await page
        .locator('#page-1 .empty-graph')
        .evaluate((element) => element.getBoundingClientRect().height < 450),
      true,
    );
    await page.getByRole('button', { name: 'What is connected?' }).click();
    assert.equal(await page.locator('#page-0').isVisible(), true);
    await page.getByRole('button', { name: 'Alpha & one component' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
        ),
    );
    assert.equal(await page.locator('#graph-0').getAttribute('data-layout'), 'downward');
    await assertAccessible('narrow overview');
    assert.equal(
      await page.evaluate(
        () => globalThis.document.documentElement.scrollWidth <= globalThis.window.innerWidth,
      ),
      true,
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
        ),
    );
    assert.equal(await page.locator('#graph-0').getAttribute('data-layout'), 'rightward');
    const restoredGeometry = await graphGeometry();
    for (const measure of ['zoom', 'width', 'height'])
      assert(
        Math.abs(restoredGeometry[measure] - initialGeometry[measure]) <=
          initialGeometry[measure] * 0.01,
        'responsive relayout changed ' + measure,
      );
    assert.deepEqual(errors, []);
    await page.goto(`${origin}/hostile.html`, { waitUntil: 'load', timeout: 15_000 });
    await page.waitForSelector('#graph-0[data-rendered="true"]', { timeout: 8_000 });
    assert.equal(await page.evaluate(() => globalThis.__archpub_injected ?? false), false);
    assert.equal((await page.getByText('<img src=x onerror=', { exact: false }).count()) > 0, true);
    assert.deepEqual(errors, []);

    const chainReading = () =>
      page.evaluate(() => {
        const container = globalThis.document.getElementById('graph-0');
        const graph = Reflect.get(container, '_cyreg').cy;
        const boxes = graph.nodes().map((node) => {
          const position = node.renderedPosition();
          const halfWidth = node.renderedWidth() / 2;
          const halfHeight = node.renderedHeight() / 2;
          return {
            left: position.x - halfWidth,
            right: position.x + halfWidth,
            top: position.y - halfHeight,
            bottom: position.y + halfHeight,
          };
        });
        const overlap = boxes.some((left, index) =>
          boxes
            .slice(index + 1)
            .some(
              (right) =>
                Math.min(left.right, right.right) > Math.max(left.left, right.left) &&
                Math.min(left.bottom, right.bottom) > Math.max(left.top, right.top),
            ),
        );
        return {
          pattern: container.className,
          nodeCount: graph.nodes().length,
          relationCount: graph.edges().length,
          effectiveFontSize: Number.parseFloat(graph.nodes()[0].style('font-size')) * graph.zoom(),
          overlap,
        };
      });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${origin}/chain.html`, { waitUntil: 'load', timeout: 15_000 });
    await page.waitForSelector('#graph-0[data-rendered="true"]', { timeout: 8_000 });
    const desktopChain = await chainReading();
    assert.equal(desktopChain.pattern.includes('graph--chain'), true);
    assert.deepEqual([desktopChain.nodeCount, desktopChain.relationCount], [5, 4]);
    assert.equal(desktopChain.overlap, false);
    assert(
      desktopChain.effectiveFontSize >= 12,
      `desktop chain labels are too small: ${JSON.stringify(desktopChain)}`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
        ),
    );
    const mobileChain = await chainReading();
    assert.equal(mobileChain.overlap, false);
    assert(
      mobileChain.effectiveFontSize >= 12,
      `mobile chain labels are too small: ${JSON.stringify(mobileChain)}`,
    );
    assert.deepEqual(errors, []);
  },
);
