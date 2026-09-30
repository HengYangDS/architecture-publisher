import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright-core';
import { missingPaintedWitnesses, paintedContactCounts } from './fixtures/painted-contact.mjs';
import { renderInteractiveEditionHtml } from '../packages/publisher/renderers/interactive/index.mjs';
import { interactiveGraphMarks as marks } from '../packages/publisher/src/scene/marks.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';

const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;

async function assertGraphicPaint(browser, layers, geometry) {
  const analysis = await browser.newPage();
  try {
    const mask = (css) =>
      layers.evaluate((css) => {
        globalThis.document.getElementById('mask-mode').textContent = css;
      }, css);
    const suppress = (selector, property, value) =>
      layers.evaluate(
        ({ selector, property, value }) => {
          const element = globalThis.document.querySelector(selector);
          const previous = element.getAttribute('style');
          element.style.setProperty(property, value, 'important');
          return previous;
        },
        { selector, property, value },
      );
    const restore = (selector, previous) =>
      layers.evaluate(
        ({ selector, previous }) => {
          const element = globalThis.document.querySelector(selector);
          if (previous === null) element.removeAttribute('style');
          else element.setAttribute('style', previous);
        },
        { selector, previous },
      );
    const witness = async (present, selector, property, value, witnesses, reason) => {
      const previous = await suppress(selector, property, value);
      try {
        const absent = await layers.screenshot({ omitBackground: true });
        assert.deepEqual(
          await missingPaintedWitnesses(analysis, present, absent, witnesses),
          [],
          reason,
        );
      } finally {
        await restore(selector, previous);
      }
    };
    await mask('rect,path{visibility:hidden!important}');
    const textLayer = await layers.screenshot({ omitBackground: true });
    const glyphs = await layers.evaluate((geometry) => {
      const viewport = globalThis.document.querySelector('.graph-viewport');
      const owners = [
        ...geometry.groups,
        ...geometry.nodes,
        ...geometry.relations.filter(({ label }) => label),
      ];
      const expectedCount = owners.reduce(
        (count, owner) => count + owner.label.baselines.length,
        0,
      );
      if (viewport.querySelectorAll('text').length !== expectedCount)
        throw Error('painted text differs from selected geometry');
      for (const owner of owners) {
        const elements = [
          ...viewport.querySelector(`[data-graphic-id="${owner.id}"]`).querySelectorAll('text'),
        ];
        if (elements.length !== owner.label.baselines.length)
          throw Error('painted text differs from selected geometry');
        for (const [index, element] of elements.entries()) {
          const baseline = owner.label.baselines[index];
          if (
            element.textContent !== baseline.text ||
            Number(element.getAttribute('x')) !== baseline.x ||
            Number(element.getAttribute('y')) !== baseline.baseline ||
            Number(element.getAttribute('font-size')) !== owner.label.fontSize ||
            element.getAttribute('font-weight') !== owner.label.weight
          )
            throw Error('painted text differs from selected geometry');
        }
      }
      return [...viewport.querySelectorAll('text')].map((element, index) => {
        element.dataset.paintWitness = String(index);
        const witnesses = [];
        for (let at = 0; at < element.getNumberOfChars(); at++) {
          if (!element.textContent[at]?.trim()) continue;
          const box = element.getExtentOfChar(at);
          witnesses.push({
            id: `${index}:${at}`,
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          });
        }
        return { index, witnesses };
      });
    }, geometry);
    for (const { index, witnesses } of glyphs) {
      assert(witnesses.length > 0);
      await witness(
        textLayer,
        `[data-paint-witness="${index}"]`,
        'opacity',
        '0',
        witnesses,
        'missing painted glyph',
      );
    }
    await mask(
      'text{visibility:hidden!important}.graph-group>rect,.graph-node>rect{fill:none!important}.graph-hit{visibility:hidden!important}',
    );
    const markLayer = await layers.screenshot({ omitBackground: true });
    const pointBox = (id, x, y) => ({ id, x: x - 0.5, y: y - 0.5, width: 1, height: 1 });
    for (const node of [...geometry.groups, ...geometry.nodes])
      await witness(
        markLayer,
        `[data-graphic-id="${node.id}"]>rect`,
        'opacity',
        '0',
        [pointBox(node.id, node.x + node.width / 2, node.y)],
        'missing painted frame',
      );
    for (const relation of geometry.relations) {
      const selector = `[data-graphic-id="${relation.id}"] .graph-route`;
      const segments = relation.points
        .slice(1)
        .map((end, index) => {
          const start = relation.points[index];
          return { start, end, length: Math.hypot(end.x - start.x, end.y - start.y) };
        })
        .sort((left, right) => right.length - left.length);
      const { start, end, length } = segments[0];
      assert(length > marks.arrowLength * 2);
      await witness(
        markLayer,
        selector,
        'stroke',
        'none',
        [pointBox(relation.id, (start.x + end.x) / 2, (start.y + end.y) / 2)],
        'missing painted route',
      );
      const terminals = [['marker-end', relation.points.at(-1), relation.points.at(-2)]];
      if (relation.direction === 'bidirectional')
        terminals.push(['marker-start', relation.points[0], relation.points[1]]);
      for (const [property, tip, previous] of terminals) {
        const distance = Math.hypot(tip.x - previous.x, tip.y - previous.y);
        const ux = (tip.x - previous.x) / distance,
          uy = (tip.y - previous.y) / distance;
        const behind = (marks.arrowLength * 5) / 6,
          side = (marks.arrowHalfWidth * 5) / 8;
        const witnesses = [-1, 1].map((sign) =>
          pointBox(
            `${relation.id}:${property}:${sign}`,
            tip.x - ux * behind - uy * side * sign,
            tip.y - uy * behind + ux * side * sign,
          ),
        );
        await witness(markLayer, selector, property, 'none', witnesses, 'missing painted arrow');
      }
    }
    return { textLayer, markLayer };
  } finally {
    await analysis.close();
  }
}

test(
  'actual SVG glyphs, route strokes, and arrowheads preserve the exact grouped cyclic scene',
  { skip: !path.isAbsolute(browserExecutable ?? ''), timeout: 30_000 },
  async (t) => {
    const scene = interactiveEditionScene();
    const first = scene.pages[0];
    const nodeTemplate = first.nodes[0];
    const edgeTemplate = first.relations[0];
    first.nodes = ['Alpha', 'Beta', 'Gamma'].map((label, index) => ({
      ...nodeTemplate,
      id: `source-${index}`,
      label,
    }));
    first.relations = [
      [0, 1, 'selects'],
      [0, 1, 'observes'],
      [1, 2, 'controls'],
      [2, 0, 'returns'],
      [2, 2, 'retries'],
    ].map(([from, to, label], index) => ({
      ...edgeTemplate,
      id: `relation-${index}`,
      direction: index === 0 ? 'bidirectional' : 'forward',
      label,
      from: { namespace: nodeTemplate.namespace, id: first.nodes[from].id },
      to: { namespace: nodeTemplate.namespace, id: first.nodes[to].id },
    }));
    first.groups = [
      {
        id: 'source',
        label: 'Source ownership',
        elements: first.nodes.slice(0, 1).map(({ namespace, id }) => ({ namespace, id })),
      },
      {
        id: 'execution',
        label: 'Execution',
        elements: first.nodes.slice(1).map(({ namespace, id }) => ({ namespace, id })),
      },
    ];
    first.sourceAssertionCarriers[0].nodeRefs = first.nodes.map(({ namespace, id }) => ({
      namespace,
      id,
    }));
    first.sourceAssertionCarriers[0].relationRefs = first.relations.map(({ id, origin }) => ({
      namespace: origin.namespace,
      reference: id,
      sha256: origin.sha256,
    }));
    const candidate = await renderInteractiveEditionHtml(scene);
    const browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 10_000,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setContent(candidate.bytes.toString('utf8'), { waitUntil: 'load' });
    await page.waitForSelector('#graph-0[data-rendered=true]', { timeout: 8_000 });
    await page.evaluate(() => globalThis.document.fonts.ready);
    const audit = await page.evaluate(() => {
      const geometry = JSON.parse(globalThis.document.getElementById('edition-data').textContent)[0]
        .geometry;
      const viewport = globalThis.document.querySelector('#graph-0 .graph-viewport');
      const texts = [...viewport.querySelectorAll('text')];
      const glyphs = [];
      let maximumMetricDrift = 0;
      for (const owner of [
        ...geometry.nodes,
        ...geometry.groups,
        ...geometry.relations.filter((edge) => edge.label),
      ]) {
        const emitted = [
          ...viewport.querySelector(`[data-graphic-id="${owner.id}"]`).querySelectorAll('text'),
        ];
        for (const [index, element] of emitted.entries()) {
          const box = element.getBBox();
          const painted = owner.label.baselines[index].box;
          let left = Infinity,
            top = Infinity,
            right = -Infinity,
            bottom = -Infinity;
          for (let character = 0; character < element.getNumberOfChars(); character++) {
            const box = element.getExtentOfChar(character);
            left = Math.min(left, box.x);
            top = Math.min(top, box.y);
            right = Math.max(right, box.x + box.width);
            bottom = Math.max(bottom, box.y + box.height);
          }
          glyphs.push({
            owner: owner.id,
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
          });
          if (!(box.width > 0 && box.height > 0)) throw new Error('empty actual text');
          maximumMetricDrift = Math.max(
            maximumMetricDrift,
            Math.abs(Number(element.getAttribute('x')) - owner.label.baselines[index].x),
            Math.abs(Number(element.getAttribute('y')) - owner.label.baselines[index].baseline),
          );
          if (!(painted.width > 0 && painted.height > 0)) throw new Error('empty selected text');
        }
      }
      const boxOverlap = (a, b) =>
        Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) &&
        Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y);
      const collisions = [];
      for (const [index, glyph] of glyphs.entries())
        for (const other of glyphs.slice(index + 1))
          if (boxOverlap(glyph, other)) collisions.push(['text', glyph.owner, other.owner]);
      for (const edge of geometry.relations) {
        const path = viewport.querySelector(`[data-graphic-id="${edge.id}"] .graph-route`);
        const length = path.getTotalLength();
        for (let at = 0; at <= length; at += 2) {
          const point = path.getPointAtLength(at);
          for (const glyph of glyphs)
            if (
              point.x > glyph.x - 1.75 &&
              point.x < glyph.x + glyph.width + 1.75 &&
              point.y > glyph.y - 1.75 &&
              point.y < glyph.y + glyph.height + 1.75
            )
              collisions.push(['route-text', edge.id, glyph.owner]);
        }
      }
      return {
        nodeCount: geometry.nodes.length,
        relationCount: geometry.relations.length,
        textCount: texts.length,
        maximumMetricDrift,
        collisions,
      };
    });

    const layers = await browser.newPage({
      viewport: { width: 1200, height: 900 },
      deviceScaleFactor: 1,
    });
    const graphic = await page
      .locator('#graph-0 .graph-svg')
      .evaluate((element) => element.outerHTML);
    const faces = candidate.bytes.toString('utf8').match(/<style>([\s\S]*?)<\/style>/u)[1];
    await layers.setContent('<!doctype html><style>' + faces + '</style>' + graphic);
    await layers.evaluate(() => globalThis.document.fonts.ready);
    const geometry = await page.evaluate(
      () => JSON.parse(globalThis.document.getElementById('edition-data').textContent)[0].geometry,
    );
    const dimensions = {
      width: Math.ceil(geometry.bounds.width),
      height: Math.ceil(geometry.bounds.height),
    };
    await layers.setViewportSize(dimensions);
    const captured = await layers.evaluate(({ width, height }) => {
      const svg = globalThis.document.querySelector('svg');
      const viewport = svg.querySelector('.graph-viewport');
      viewport.removeAttribute('transform');
      viewport.style.removeProperty('transform');
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;
      globalThis.document.body.style.margin = '0';
      globalThis.document.body.style.background = 'transparent';
      globalThis.document.documentElement.style.background = 'transparent';
      const style = globalThis.document.createElement('style');
      style.id = 'mask-mode';
      globalThis.document.head.append(style);
      const matrix = viewport.getScreenCTM();
      return {
        matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
        clippedText: [...viewport.querySelectorAll('text')]
          .filter((element) => {
            const box = element.getBoundingClientRect();
            return box.left < 0 || box.top < 0 || box.right > width || box.bottom > height;
          })
          .map((element) => element.textContent),
      };
    }, dimensions);
    assert.deepEqual(captured.matrix, [1, 0, 0, 1, 0, 0]);
    assert.deepEqual(captured.clippedText, []);
    const { textLayer, markLayer } = await assertGraphicPaint(browser, layers, geometry);
    const analysis = await browser.newPage();
    assert.deepEqual(await paintedContactCounts(analysis, textLayer, markLayer), {
      contact: 0,
      withinTwoPixels: 0,
    });
    for (const [css, reason] of [
      ['.graph-label--relation{opacity:0!important}', 'missing painted glyph'],
      ['.graph-route{stroke:transparent!important}', 'missing painted route'],
      ['.graph-svg marker path{fill:transparent!important}', 'missing painted arrow'],
      ['.graph-node>rect{stroke:transparent!important}', 'missing painted frame'],
    ]) {
      const defect = await layers.addStyleTag({ content: css });
      try {
        await assert.rejects(assertGraphicPaint(browser, layers, geometry), (error) =>
          error.message.includes(reason),
        );
      } finally {
        await defect.evaluate((element) => element.remove());
      }
    }
    const caption = layers.locator('.graph-label--relation').first();
    const selectedCaption = await caption.textContent();
    await caption.evaluate((element) => {
      element.textContent = element.textContent.slice(0, 1);
    });
    await assert.rejects(assertGraphicPaint(browser, layers, geometry), (error) =>
      error.message.includes('painted text differs'),
    );
    await caption.evaluate((element, text) => {
      element.textContent = text;
    }, selectedCaption);
    await layers.evaluate(() => {
      const svg = globalThis.document.querySelector('svg');
      const box = svg.querySelector('text').getBBox();
      const line = globalThis.document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute(
        'd',
        'M' +
          box.x +
          ' ' +
          (box.y + box.height / 2) +
          ' L' +
          (box.x + box.width) +
          ' ' +
          (box.y + box.height / 2),
      );
      line.setAttribute('stroke', '#24362e');
      line.setAttribute('stroke-width', '3');
      svg.querySelector('.graph-viewport').append(line);
    });
    const controlled = await layers.screenshot({ omitBackground: true });
    const detected = await paintedContactCounts(analysis, textLayer, controlled);
    assert(detected.contact > 0);
    assert(detected.withinTwoPixels >= detected.contact);

    assert.deepEqual(errors, []);
    assert.equal(audit.nodeCount, 3);
    assert.equal(audit.relationCount, 5);
    assert(audit.textCount >= 10);
    assert(audit.maximumMetricDrift < 0.001);
    assert.deepEqual(audit.collisions, [], JSON.stringify(audit));
  },
);
