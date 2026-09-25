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
    const candidate = await renderInteractiveEditionHtml(interactiveEditionScene());
    const hostileScene = interactiveEditionScene();
    hostileScene.pages[0].nodes[0].label = '<img src=x onerror="window.__archpub_injected=true">';
    const hostileCandidate = await renderInteractiveEditionHtml(hostileScene);
    const server = http.createServer((request, response) => {
      if (!['/edition.html', '/hostile.html'].includes(request.url)) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      response.end(request.url === '/hostile.html' ? hostileCandidate.bytes : candidate.bytes);
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
    await assertAccessible('overview');
    assert.equal(await page.locator('#graph-0').getAttribute('data-layout'), 'rightward');
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
    assert.deepEqual(errors, []);
    await page.goto(`${origin}/hostile.html`, { waitUntil: 'load', timeout: 15_000 });
    await page.waitForSelector('#graph-0[data-rendered="true"]', { timeout: 8_000 });
    assert.equal(await page.evaluate(() => globalThis.__archpub_injected ?? false), false);
    assert.equal((await page.getByText('<img src=x onerror=', { exact: false }).count()) > 0, true);
    assert.deepEqual(errors, []);
  },
);
