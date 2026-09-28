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
    const compactCandidate = await renderInteractiveEditionHtml(interactiveEditionScene());
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
    const groupedScene = structuredClone(chainScene);
    const grouped = groupedScene.pages[0];
    grouped.nodes.pop();
    grouped.relations.pop();
    grouped.sourceAssertionCarriers[0].nodeRefs.pop();
    grouped.sourceAssertionCarriers[0].relationRefs.pop();
    grouped.groups = [
      {
        id: 'input',
        label: 'Input',
        elements: grouped.nodes.slice(0, 2).map(({ namespace, id }) => ({ namespace, id })),
      },
      {
        id: 'effect',
        label: 'Effect',
        elements: grouped.nodes.slice(2).map(({ namespace, id }) => ({ namespace, id })),
      },
    ];
    const groupedCandidate = await renderInteractiveEditionHtml(groupedScene);
    const branchingScene = interactiveEditionScene();
    const branching = branchingScene.pages[0];
    const nodeTemplate = branching.nodes[0];
    const relationTemplate = branching.relations[0];
    const labels = [
      'Operator',
      'Controller',
      'Configuration',
      'Admitted adapters',
      'Native projection',
      'Native client',
      'Selected endpoint',
    ];
    branching.nodes = labels.map((label, index) => ({
      ...nodeTemplate,
      id: `branch-node-${index}`,
      label,
    }));
    branching.relations = [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ].map(([from, to], index) => ({
      ...relationTemplate,
      id: `branch-relation-${index}`,
      from: { namespace: nodeTemplate.namespace, id: branching.nodes[from].id },
      to: { namespace: nodeTemplate.namespace, id: branching.nodes[to].id },
      label: `relation-${index}`,
    }));
    branching.sourceAssertionCarriers[0].nodeRefs = branching.nodes.map(({ namespace, id }) => ({
      namespace,
      id,
    }));
    branching.sourceAssertionCarriers[0].relationRefs = branching.relations.map(
      ({ id, origin }) => ({
        namespace: origin.namespace,
        reference: id,
        sha256: origin.sha256,
      }),
    );
    const branchingCandidate = await renderInteractiveEditionHtml(branchingScene);
    const server = http.createServer((request, response) => {
      if (
        ![
          '/edition.html',
          '/hostile.html',
          '/chain.html',
          '/branching.html',
          '/grouped.html',
          '/compact.html',
        ].includes(request.url)
      ) {
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
            : request.url === '/branching.html'
              ? branchingCandidate.bytes
              : request.url === '/grouped.html'
                ? groupedCandidate.bytes
                : request.url === '/compact.html'
                  ? compactCandidate.bytes
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
    assert.match(
      await page.locator('#graph-0').getAttribute('style'),
      /--graph-wide-height:\s*\d+px;\s*--graph-down-height:\s*\d+px/u,
    );
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
        const selected = graph.$(':selected').first();
        return {
          zoom: graph.zoom(),
          width: bounds.w,
          height: bounds.h,
          selected: selected.nonempty() ? selected.id() : null,
        };
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
    const focusButton = page.locator('#page-0 [data-focus-node]').last();
    const requestedNode = await focusButton.getAttribute('data-focus-node');
    await focusButton.focus();
    await page.keyboard.press('Enter');
    const focused = await page.evaluate(() => {
      const graph = Reflect.get(globalThis.document.getElementById('graph-0'), '_cyreg').cy;
      const node = graph.nodes(':selected').first();
      const point = node.renderedPosition();
      return {
        id: node.id(),
        offset: Math.hypot(point.x - graph.width() / 2, point.y - graph.height() / 2),
      };
    });
    assert.equal(focused.id, requestedNode);
    assert(
      focused.offset <= 2,
      `first source focus missed graph center: ${JSON.stringify(focused)}`,
    );
    await page.getByRole('button', { name: 'Fit graph' }).click();
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
    const selectedNode = page.getByRole('button', { name: 'Alpha & one component' });
    const selectedId = await selectedNode.getAttribute('data-focus-node');
    await selectedNode.click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
        ),
    );
    assert.equal(await page.locator('#graph-0').getAttribute('data-layout'), 'downward');
    assert.equal((await graphGeometry()).selected, selectedId);
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
    assert.equal((await graphGeometry()).selected, selectedId);
    await page.getByRole('button', { name: 'Fit graph' }).click();
    const restoredGeometry = await graphGeometry();
    assert.equal(restoredGeometry.selected, null);
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

    const graphReading = () =>
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
          effectiveEdgeFontSize:
            Number.parseFloat(graph.edges()[0].style('font-size')) * graph.zoom(),
          overlap,
        };
      });
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${origin}/chain.html`, { waitUntil: 'load', timeout: 15_000 });
    await page.waitForSelector('#graph-0[data-rendered="true"]', { timeout: 8_000 });
    const desktopChain = await graphReading();
    assert.equal(desktopChain.pattern.includes('graph--chain'), false);
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
    const mobileChain = await graphReading();
    assert.equal(mobileChain.overlap, false);
    assert(
      mobileChain.effectiveFontSize >= 12,
      `mobile chain labels are too small: ${JSON.stringify(mobileChain)}`,
    );
    assert.deepEqual(errors, []);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${origin}/branching.html`, { waitUntil: 'load', timeout: 15_000 });
    await page.waitForSelector('#graph-0[data-rendered="true"]', { timeout: 8_000 });
    const desktopBranch = await graphReading();
    assert.deepEqual([desktopBranch.nodeCount, desktopBranch.relationCount], [7, 6]);
    assert.equal(desktopBranch.overlap, false);
    assert(
      desktopBranch.effectiveFontSize >= 12,
      `branching reader graph is too small: ${JSON.stringify(desktopBranch)}`,
    );
    assert(
      desktopBranch.effectiveEdgeFontSize >= 11,
      `branching relation references are too small: ${JSON.stringify(desktopBranch)}`,
    );
    assert.deepEqual(errors, []);

    await page.goto(`${origin}/grouped.html`, { waitUntil: 'load', timeout: 15_000 });
    await page.waitForSelector('#graph-0[data-rendered="true"]', { timeout: 8_000 });
    const visualGroups = await page.evaluate(() => {
      const graph = Reflect.get(globalThis.document.getElementById('graph-0'), '_cyreg').cy;
      return graph.nodes('[group]').map((group) => ({
        label: group.data('label'),
        members: group.children().map((node) => node.id()),
        bounds: group.boundingBox({ includeLabels: true }),
        font: Number.parseFloat(group.style('font-size')) * graph.zoom(),
      }));
    });
    assert.deepEqual(
      visualGroups.map(({ label, members }) => [label, members.length]),
      [
        ['Input', 2],
        ['Effect', 2],
      ],
    );
    assert(visualGroups.every(({ font }) => font >= 12));
    assert(
      visualGroups[0].bounds.x2 <= visualGroups[1].bounds.x1 ||
        visualGroups[0].bounds.y2 <= visualGroups[1].bounds.y1,
      `reading groups overlap: ${JSON.stringify(visualGroups)}`,
    );
    assert.deepEqual(await page.locator('#page-0 .node-list h4').allTextContents(), [
      'Input',
      'Effect',
    ]);
    await page.addScriptTag({ content: axe.source });
    await assertAccessible('grouped reading page');
    assert.deepEqual(errors, []);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${origin}/compact.html`, { waitUntil: 'load', timeout: 15_000 });
    await page.waitForSelector('#graph-0[data-rendered="true"]', { timeout: 8_000 });
    const compact = await page.evaluate(() => {
      const bounds = (selector) =>
        globalThis.document.querySelector(selector).getBoundingClientRect();
      const stage = bounds('#page-0 .stage');
      const boundary = bounds('#page-0 .reading-boundary');
      const evidence = bounds('#page-0 .notes');
      return {
        stageWidth: stage.width,
        pageWidth: bounds('#page-0').width,
        boundaryStartsAfterStage: boundary.left >= stage.right + 20,
        evidenceStartsAfterStage: evidence.top >= stage.bottom + 20,
        scrollWidth: globalThis.document.documentElement.scrollWidth,
        viewport: globalThis.innerWidth,
      };
    });
    assert(compact.stageWidth < compact.pageWidth * 0.6, JSON.stringify(compact));
    assert.equal(compact.boundaryStartsAfterStage, true);
    assert.equal(compact.evidenceStartsAfterStage, true);
    assert(compact.scrollWidth <= compact.viewport, JSON.stringify(compact));
    await page.addScriptTag({ content: axe.source });
    await assertAccessible('compact reading page');
    assert.deepEqual(errors, []);
  },
);

test(
  'unequal source claims read in order without stretched empty cards',
  { skip: !path.isAbsolute(browserExecutable ?? ''), timeout: 20_000 },
  async (t) => {
    const scene = interactiveEditionScene();
    const selected = scene.pages[0];
    const revision = 'a'.repeat(64);
    selected.sourceAssertionCarriers.push({
      assertionId: 'relation-assertion',
      kind: 'relation',
      nodeRefs: [],
      relationRefs: [{ namespace: 'private/model', reference: 'relation:4:2', sha256: revision }],
    });
    selected.claimCards = [1, 2, 3].map((index) => ({
      namespace: 'private/model',
      id: `claim-${index}`,
      sha256: revision,
      facts: [
        { label: 'Claim plane', value: 'implemented' },
        { label: 'Subject', value: 'Alpha & one' },
        { label: 'Predicate', value: 'calls' },
        { label: 'Object', value: 'Beta' },
        {
          label: 'Declared evidence authority',
          value: 'Selected implementation evidence '.repeat(index === 2 ? 25 : 5),
        },
      ],
    }));
    for (const index of [1, 2, 3])
      selected.sourceAssertionCarriers.push({
        assertionId: `claim-assertion-${index}`,
        kind: 'claim',
        nodeRefs: [],
        relationRefs: [],
        claimRefs: [{ namespace: 'private/model', reference: `claim-${index}`, sha256: revision }],
      });
    selected.claimRelationLinks = [1, 2, 3].map((index) => ({
      claimAssertionId: `claim-assertion-${index}`,
      relationAssertionId: 'relation-assertion',
    }));
    const html = await renderInteractiveEditionHtml(scene);
    const browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(html.bytes.toString('utf8'), { waitUntil: 'load' });
    await page.evaluate(() => globalThis.document.fonts.ready);
    const measured = () =>
      page.evaluate(() =>
        [...globalThis.document.querySelectorAll('#page-0 .claim-card')].map((card) => {
          const box = card.getBoundingClientRect();
          const facts = card.querySelector('.claim-facts').getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, blank: box.bottom - facts.bottom };
        }),
      );
    const desktop = await measured();
    assert.equal(desktop.length, 3);
    assert(
      desktop.every(({ blank }) => blank < 30),
      JSON.stringify(desktop),
    );
    assert(desktop.every(({ top }, index) => !index || top >= desktop[index - 1].bottom));
    await page.addScriptTag({ content: axe.source });
    const violations = () =>
      page.evaluate(async () => {
        const result = await globalThis.axe.run(globalThis.document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        });
        return result.violations.map(({ id }) => id);
      });
    assert.deepEqual(await violations(), []);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
        ),
    );
    const narrow = await page.evaluate(() => ({
      viewport: globalThis.innerWidth,
      scrollWidth: globalThis.document.documentElement.scrollWidth,
      overflow: [...globalThis.document.querySelectorAll('#page-0 *')]
        .filter((element) => element.getBoundingClientRect().right > globalThis.innerWidth + 1)
        .slice(0, 8)
        .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
    }));
    assert(narrow.scrollWidth <= narrow.viewport, JSON.stringify(narrow));
    assert.deepEqual(await violations(), []);
  },
);

test(
  'one dense graph opens readably and keeps the reader-selected viewport',
  { skip: !path.isAbsolute(browserExecutable ?? ''), timeout: 45_000 },
  async (t) => {
    const scene = interactiveEditionScene();
    const overview = scene.pages[0];
    for (let index = 0; index < 14; index += 1) {
      const previous = overview.nodes.at(-1);
      const node = { ...overview.nodes[1], id: `step-${index}`, label: `Step ${index}` };
      const relation = {
        ...overview.relations[0],
        id: `step-relation-${index}`,
        from: { namespace: previous.namespace, id: previous.id },
        to: { namespace: node.namespace, id: node.id },
      };
      overview.nodes.push(node);
      overview.relations.push(relation);
      overview.sourceAssertionCarriers[0].nodeRefs.push({ namespace: node.namespace, id: node.id });
      overview.sourceAssertionCarriers[0].relationRefs.push({
        namespace: relation.origin.namespace,
        reference: relation.id,
        sha256: relation.origin.sha256,
      });
    }
    const html = await renderInteractiveEditionHtml(scene);
    const browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 375, height: 844 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('request', (request) => {
      if (/^https?:/u.test(request.url())) errors.push(`external-request:${request.url()}`);
    });
    await page.setContent(html.bytes.toString('utf8'), { waitUntil: 'load' });
    await page.waitForSelector('#graph-0[data-rendered="true"]');
    await page.evaluate(() => globalThis.document.fonts.ready);
    const frame = async () =>
      page.evaluate(
        () =>
          new Promise((resolve) =>
            globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
          ),
      );
    const view = () =>
      page.evaluate(() => {
        const container = globalThis.document.getElementById('graph-0');
        const graph = Reflect.get(container, '_cyreg').cy;
        const selected = graph.$(':selected').first();
        const firstRelation = JSON.parse(
          globalThis.document.getElementById('edition-data').textContent,
        )[0].relations[0];
        const visible = (id) => {
          const point = graph.getElementById(id).renderedPosition();
          return (
            point.x >= 0 && point.x <= graph.width() && point.y >= 0 && point.y <= graph.height()
          );
        };
        return {
          layout: container.dataset.layout,
          zoom: graph.zoom(),
          textPx: Number.parseFloat(graph.nodes()[0].style('font-size')) * graph.zoom(),
          selected: selected.nonempty() ? selected.id() : null,
          focusOffset: selected.nonempty()
            ? Math.hypot(
                selected.renderedPosition().x - graph.width() / 2,
                selected.renderedPosition().y - graph.height() / 2,
              )
            : null,
          firstSource: firstRelation.source,
          firstTarget: firstRelation.target,
          firstEndpointsVisible: visible(firstRelation.source) && visible(firstRelation.target),
          nodes: graph.nodes().length,
          relations: graph.edges().length,
          scrollWidth: globalThis.document.documentElement.scrollWidth,
          viewport: globalThis.innerWidth,
        };
      });
    await frame();
    const initial = await view();
    assert.deepEqual([initial.nodes, initial.relations], [16, 15]);
    assert.equal(initial.layout, 'downward');
    assert(initial.textPx >= 12, JSON.stringify(initial));
    assert.equal(initial.selected, initial.firstSource);
    assert(initial.firstEndpointsVisible, JSON.stringify(initial));
    assert(initial.scrollWidth <= initial.viewport, JSON.stringify(initial));

    const lastNode = page.locator('#page-0 [data-focus-node]').last();
    const requested = await lastNode.getAttribute('data-focus-node');
    await lastNode.click();
    await frame();
    const firstListFocus = await view();
    assert.equal(firstListFocus.selected, requested);
    assert(firstListFocus.zoom >= 1, JSON.stringify(firstListFocus));
    assert(firstListFocus.focusOffset <= 12, JSON.stringify(firstListFocus));
    await page.setViewportSize({ width: 390, height: 844 });
    await frame();
    const resizedListFocus = await view();
    assert.equal(resizedListFocus.selected, requested);
    assert(resizedListFocus.focusOffset <= 12, JSON.stringify(resizedListFocus));

    await page.locator('#graph-0').scrollIntoViewIfNeeded();
    const target = await page.evaluate((id) => {
      const container = globalThis.document.getElementById('graph-0');
      const graph = Reflect.get(container, '_cyreg').cy;
      const position = graph.getElementById(id).renderedPosition();
      const box = container.getBoundingClientRect();
      return { x: box.x + position.x, y: box.y + position.y };
    }, requested);
    await page.mouse.click(target.x, target.y);
    await page.setViewportSize({ width: 375, height: 844 });
    await frame();
    const direct = await view();
    assert.equal(direct.selected, requested);
    assert(direct.textPx >= 12, JSON.stringify(direct));
    assert(direct.focusOffset <= 12, JSON.stringify(direct));

    await page.evaluate(() => {
      const graph = Reflect.get(globalThis.document.getElementById('graph-0'), '_cyreg').cy;
      graph.emit('tap');
    });
    await frame();
    const manual = await view();
    assert.equal(manual.selected, null);
    await page.setViewportSize({ width: 390, height: 844 });
    await frame();
    const resizedManual = await view();
    assert.equal(resizedManual.selected, null);
    assert(Math.abs(resizedManual.zoom - manual.zoom) < 0.01, JSON.stringify(resizedManual));

    await page.getByRole('button', { name: 'Fit graph' }).click();
    await page.setViewportSize({ width: 375, height: 844 });
    await frame();
    const fitted = await view();
    assert.equal(fitted.selected, null);
    assert(fitted.zoom < 0.75, JSON.stringify(fitted));
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => {
      const result = await globalThis.axe.run(globalThis.document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      });
      return result.violations.map(({ id }) => id);
    });
    assert.deepEqual(violations, []);
    assert.deepEqual(errors, []);
  },
);
