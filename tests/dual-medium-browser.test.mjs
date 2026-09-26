import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import axe from 'axe-core';
import { chromium } from 'playwright-core';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import { selectedNativeEdition } from './fixtures/selected-native-edition.mjs';

const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;

test(
  'the exact built Candidate remains legible, accessible, and offline in Chrome',
  { skip: !path.isAbsolute(browserExecutable ?? ''), timeout: 35_000 },
  async (t) => {
    const fixture = await selectedNativeEdition(t, { width: 1800 });
    const output = path.join(fixture.root, 'candidate');
    await compileEditionCandidateInput(fixture.file, fixture.digest, output);
    const bytes = await fs.readFile(path.join(output, 'interactive/architecture.html'));
    const svg = await fs.readFile(path.join(output, 'static/architecture.svg'));
    const server = http.createServer((request, response) => {
      if (!['/architecture.html', '/architecture.svg'].includes(request.url)) {
        response.writeHead(404);
        response.end();
        return;
      }
      const isSvg = request.url === '/architecture.svg';
      response.writeHead(200, {
        'Content-Type': isSvg ? 'image/svg+xml; charset=utf-8' : 'text/html; charset=utf-8',
      });
      response.end(isSvg ? svg : bytes);
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
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const origin = `http://127.0.0.1:${server.address().port}`;
    await page.route('**/*', (route) => {
      if (route.request().url().startsWith(`${origin}/`)) return route.continue();
      errors.push(`external-request:${route.request().url()}`);
      return route.abort();
    });
    const response = await page.goto(`${origin}/architecture.html`, {
      waitUntil: 'load',
      timeout: 15_000,
    });
    assert.equal(response.status(), 200);
    await page.waitForSelector('#graph-0[data-rendered="true"]', { timeout: 8_000 });
    await page.evaluate(() => globalThis.document.fonts.ready);
    const desktopLayout = await page.evaluate(() => {
      const graph = globalThis.document.querySelector('#graph-0').getBoundingClientRect();
      const notes = globalThis.document.querySelector('#page-0 .notes').getBoundingClientRect();
      return { graphWidth: graph.width, graphBottom: graph.bottom, notesTop: notes.top };
    });
    assert(desktopLayout.graphWidth > 1200, 'the graph must use the reading width');
    assert(desktopLayout.notesTop > desktopLayout.graphBottom, 'evidence must follow the graph');
    assert.equal(await page.locator('.navigation button').first().innerText(), 'Overview');
    assert.equal(
      await page.locator('.navigation button').first().getAttribute('aria-label'),
      'Overview — What is connected?',
    );
    assert.equal(await page.locator('#page-0 .graph-wrap .fit').count(), 1);
    assert.equal(await page.locator('[data-focus-node]').filter({ hasText: 'Alpha' }).count(), 1);
    assert.equal(await page.locator('[data-focus-node]').filter({ hasText: 'Beta' }).count(), 1);
    assert.equal((await page.locator('#graph-0 canvas').count()) > 0, true);
    await page.addScriptTag({ content: axe.source });
    const accessible = async () =>
      page.evaluate(async () => {
        const result = await globalThis.axe.run(globalThis.document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        });
        return result.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map(({ target }) => target),
        }));
      });
    assert.deepEqual(await accessible(), []);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
        ),
    );
    assert.equal(await page.locator('#graph-0').getAttribute('data-layout'), 'downward');
    const mobileLayout = await page.evaluate(() => {
      const graph = globalThis.document.querySelector('#graph-0').getBoundingClientRect();
      const notes = globalThis.document.querySelector('#page-0 .notes').getBoundingClientRect();
      return { graphBottom: graph.bottom, notesTop: notes.top };
    });
    assert(mobileLayout.notesTop > mobileLayout.graphBottom);
    assert.deepEqual(await accessible(), []);
    assert.deepEqual(errors, []);
    await page.goto(`${origin}/architecture.svg`, { waitUntil: 'load', timeout: 15_000 });
    assert.equal(await page.locator('svg').count(), 1);
    for (const carrier of ['n-0', 'n-1', 'r-0']) {
      const visible = await page
        .locator(`[data-graphic-id="${carrier}"] text, text[data-graphic-id="${carrier}"]`)
        .first()
        .evaluate((element) => {
          const bounds = element.getBBox();
          const style = globalThis.getComputedStyle(element);
          return bounds.width > 0 && bounds.height > 0 && style.visibility !== 'hidden';
        });
      assert.equal(visible, true, `${carrier} must be painted text, not an ID alone`);
    }
    assert.doesNotMatch(await page.content(), /fixture\/model|fixture\/views/u);
    assert.deepEqual(errors, []);
  },
);
