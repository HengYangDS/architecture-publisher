import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright-core';
import { createHash } from 'node:crypto';
import { readSourceBundle } from '../../packages/publisher/src/source/bundle.mjs';
import { validateHtmlObservation, validateStaticObservation } from './semantic-browser-checks.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const input = path.resolve(process.argv[2] ?? '');
const config = JSON.parse(await fs.readFile(input, 'utf8'));
if (
  !path.isAbsolute(config.manifest ?? '') ||
  !path.isAbsolute(config.browserExecutable ?? '') ||
  !path.isAbsolute(config.output ?? '')
)
  throw Error('Explicit manifest, browser executable and output required');
const bundle = await readSourceBundle(config.manifest, config.manifestSha256),
  publication = JSON.parse(
    bundle.members.find((item) => item.path === 'publication.json')?.content,
  ),
  members = new Map(bundle.members.map((item) => ['/' + item.path, item.content])),
  reports = [];
if (publication.semanticDigest !== config.semanticDigest)
  throw Error('Selected semantic identity changed');
await fs.mkdir(config.output);
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname,
    selected = members.get(pathname);
  if (!selected) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.writeHead(200, {
    'Content-Type': pathname.endsWith('.svg')
      ? 'image/svg+xml; charset=utf-8'
      : 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(selected);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({
  executablePath: config.browserExecutable,
  headless: true,
  chromiumSandbox: true,
  timeout: 15000,
});
try {
  for (const view of publication.views) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: 'block',
    });
    try {
      const page = await context.newPage(),
        errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (url.origin === `http://127.0.0.1:${server.address().port}`) return route.continue();
        errors.push('external-request:' + url.origin);
        return route.abort();
      });
      const response = await page.goto(
        `http://127.0.0.1:${server.address().port}/views/${view.id}.html?theme=light`,
        { waitUntil: 'load', timeout: 20000 },
      );
      if (response.status() !== 200) throw Error('Browser artifact missing');
      await page.evaluate(async () => document.fonts.ready);
      const observed = await page.evaluate(() => {
        const box = (element) => {
          const rect = element.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          };
        };
        const overlaps = (left, right) =>
          Math.min(left.right, right.right) - Math.max(left.x, right.x) > 0.5 &&
          Math.min(left.bottom, right.bottom) - Math.max(left.y, right.y) > 0.5;
        const svg = document.querySelector('.diagram-container > svg'),
          panel = document.querySelector('.diagram-container'),
          panelBox = box(panel),
          texts = [...svg.querySelectorAll('text')].map((element) => ({
            text: element.textContent.trim(),
            box: box(element),
            font: Number.parseFloat(getComputedStyle(element).fontSize),
          })),
          overlapsFound = [];
        for (let left = 0; left < texts.length; left++)
          for (let right = left + 1; right < texts.length; right++)
            if (overlaps(texts[left].box, texts[right].box))
              overlapsFound.push([texts[left].text, texts[right].text]);
        return {
          nodeIds: [...svg.querySelectorAll('[data-node-id]')].map((node) =>
            node.getAttribute('data-node-id'),
          ),
          edges: [...svg.querySelectorAll('path[data-edge-id]')].map((edge) => ({
            id: edge.getAttribute('data-edge-id'),
            from: edge.getAttribute('data-edge-from'),
            to: edge.getAttribute('data-edge-to'),
            path: edge.getAttribute('d'),
            start: point(edge, 0),
            end: point(edge, edge.getTotalLength()),
            fromBox: box(
              svg.querySelector(`[data-node-id="${edge.getAttribute('data-edge-from')}"]`),
            ),
            toBox: box(svg.querySelector(`[data-node-id="${edge.getAttribute('data-edge-to')}"]`)),
          })),
          overlap: overlapsFound,
          overflow: texts
            .filter(
              (text) =>
                text.box.x < panelBox.x - 0.5 ||
                text.box.right > panelBox.right + 0.5 ||
                text.box.y < panelBox.y - 0.5 ||
                text.box.bottom > panelBox.bottom + 0.5,
            )
            .map((text) => text.text),
          minimumFont: Math.min(...texts.map((text) => text.font)),
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth,
          surfaceBadges: [
            getComputedStyle(document.querySelector('.header-row'), '::after').content,
            getComputedStyle(panel, '::after').content,
          ],
          title: document.title,
        };

        function point(element, length) {
          const selected = element.getPointAtLength(length).matrixTransform(element.getScreenCTM());
          return { x: selected.x, y: selected.y };
        }
      });
      validateHtmlObservation(observed, view, errors);
      await page.locator('#btn-theme').click();
      if ((await page.locator('html').getAttribute('data-theme')) !== 'dark')
        throw Error('Theme control did not change state');
      const first = view.nodeIds[0];
      await page.locator(`.diagram-container > svg [data-node-id="${first}"]`).click();
      const focus = await page
        .locator('.diagram-container > svg')
        .getAttribute('data-focus-active');
      if (focus !== first) throw Error('Focus interaction did not activate');
      const screenshot = path.join(config.output, view.id + '.png');
      await page.screenshot({ path: screenshot });
      reports.push({
        id: view.id,
        ...observed,
        screenshot: path.basename(screenshot),
        screenshotSha256: sha(await fs.readFile(screenshot)),
      });
    } finally {
      await context.close();
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
  });
  try {
    const page = await context.newPage(),
      errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.origin === `http://127.0.0.1:${server.address().port}`) return route.continue();
      errors.push('external-request:' + url.origin);
      return route.abort();
    });
    const response = await page.goto(`http://127.0.0.1:${server.address().port}/overview.svg`, {
      waitUntil: 'load',
      timeout: 20000,
    });
    if (
      response.status() !== 200 ||
      !response.headers()['content-type']?.startsWith('image/svg+xml')
    )
      throw Error('Static SVG artifact missing or incorrectly served');
    await page.evaluate(async () => document.fonts.ready);
    const observed = await page.evaluate(() => {
      const svg = document.documentElement,
        rect = svg.getBoundingClientRect(),
        viewBox = svg.viewBox.baseVal,
        texts = [...svg.querySelectorAll('text')].map((element) => ({
          text: element.textContent.trim(),
          box: box(element),
          font: Number.parseFloat(getComputedStyle(element).fontSize),
        })),
        nodes = [...svg.querySelectorAll('[data-node-id]')].map((node) => ({
          id: node.getAttribute('data-node-id'),
          box: box(node),
        })),
        labels = [...svg.querySelectorAll('[data-edge-label]')].map((label) => ({
          id: label.getAttribute('data-edge-label'),
          box: box(label),
        })),
        overlaps = (left, right) =>
          Math.min(left.right, right.right) - Math.max(left.x, right.x) > 0.5 &&
          Math.min(left.bottom, right.bottom) - Math.max(left.y, right.y) > 0.5,
        overlap = [],
        labelNodeOverlap = [];
      for (let left = 0; left < texts.length; left++)
        for (let right = left + 1; right < texts.length; right++)
          if (overlaps(texts[left].box, texts[right].box))
            overlap.push([texts[left].text, texts[right].text]);
      for (const label of labels)
        for (const node of nodes)
          if (overlaps(label.box, node.box)) labelNodeOverlap.push([label.id, node.id]);
      const labelStrokeOverlap = [],
        edgeNodeOverlap = [];
      const inside = (point, box, padding = 3) =>
        point.x >= box.x - padding &&
        point.x <= box.right + padding &&
        point.y >= box.y - padding &&
        point.y <= box.bottom + padding;
      const painted = [...svg.querySelectorAll('path[data-edge-id], rect[stroke]')];
      for (const stroke of painted) {
        const id =
          stroke.getAttribute('data-edge-id') ??
          stroke.getAttribute('data-node-id') ??
          'group-border';
        const length = stroke.getTotalLength();
        const count = Math.ceil(length / 2);
        const points = Array.from({ length: count + 1 }, (_, index) =>
          point(stroke, (length * index) / count),
        );
        for (const text of texts)
          if (points.some((p) => inside(p, text.box))) labelStrokeOverlap.push([text.text, id]);
        if (stroke.hasAttribute('data-edge-id')) {
          const from = stroke.getAttribute('data-edge-from');
          const to = stroke.getAttribute('data-edge-to');
          for (const node of nodes)
            if (node.id !== from && node.id !== to && points.some((p) => inside(p, node.box)))
              edgeNodeOverlap.push([id, node.id]);
        }
      }
      return {
        root: svg.localName,
        fontFaces: [...document.fonts].map((font) => ({
          family: font.family,
          weight: font.weight,
          status: font.status,
        })),
        width: rect.width,
        height: rect.height,
        viewBox: [viewBox.x, viewBox.y, viewBox.width, viewBox.height],
        nodeIds: [...svg.querySelectorAll('[data-node-id]')].map((node) =>
          node.getAttribute('data-node-id'),
        ),
        edges: [...svg.querySelectorAll('path[data-edge-id]')].map((edge) => ({
          id: edge.getAttribute('data-edge-id'),
          from: edge.getAttribute('data-edge-from'),
          to: edge.getAttribute('data-edge-to'),
          path: edge.getAttribute('d'),
          stroke: getComputedStyle(edge).stroke,
          start: point(edge, 0),
          end: point(edge, edge.getTotalLength()),
          fromBox: box(
            svg.querySelector(`[data-node-id="${edge.getAttribute('data-edge-from')}"]`),
          ),
          toBox: box(svg.querySelector(`[data-node-id="${edge.getAttribute('data-edge-to')}"]`)),
        })),
        overlap,
        labelNodeOverlap,
        labelStrokeOverlap,
        edgeNodeOverlap,
        overflow: texts
          .filter(
            (text) =>
              text.box.x < rect.x - 0.5 ||
              text.box.right > rect.right + 0.5 ||
              text.box.y < rect.y - 0.5 ||
              text.box.bottom > rect.bottom + 0.5,
          )
          .map((text) => text.text),
        minimumFont: Math.min(...texts.map((text) => text.font)),
      };

      function box(element) {
        const rect = element.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      }

      function point(element, length) {
        const selected = element.getPointAtLength(length).matrixTransform(element.getScreenCTM());
        return { x: selected.x, y: selected.y };
      }
    });
    const overview = publication.static;
    if (!overview) throw Error('Static overview declaration missing');
    validateStaticObservation(observed, overview, errors);
    const screenshot = path.join(config.output, 'overview-static.png');
    await page.screenshot({ path: screenshot });
    reports.push({
      id: 'overview-static',
      medium: 'image/svg+xml',
      ...observed,
      screenshot: path.basename(screenshot),
      screenshotSha256: sha(await fs.readFile(screenshot)),
    });
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
const report = {
  schema: 'architecture.semantic-browser-observation/v1',
  sourceManifestSha256: bundle.manifestSha256,
  semanticDigest: publication.semanticDigest,
  browserVersion: browser.version(),
  reports,
  status: 'PASS_BOUNDED',
  scope: 'Selected pages at 1440x1000; not arbitrary browser or visual approval',
};
await fs.writeFile(
  path.join(config.output, 'report.json'),
  JSON.stringify(report, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify(report));
