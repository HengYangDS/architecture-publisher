import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright-core';
import { browserLifetime } from './fixtures/browser-lifetime.mjs';
import { selectedInteractiveMember } from './fixtures/interactive-member.mjs';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';
import { composeInteractiveHtml } from '../packages/publisher/src/rendering/interactive-html.mjs';
import { renderArchitectureScene } from '../packages/publisher/renderers/archify/index.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import { meaningFor, compose, sceneFor, namespace } from './fixtures/authored-routes.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';
import { renderInteractiveEditionHtml } from '../packages/publisher/renderers/interactive/index.mjs';

const browserOptions = {
  executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
  headless: true,
  chromiumSandbox: true,
};
const runBrowser = {
  skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? ''),
};

test(
  'native camera accessible names include the visible readout after every action',
  runBrowser,
  async (t) => {
    const html = await authoredHtml(t);
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(html.toString(), { waitUntil: 'load' });
    const frame = page.frames().find((value) => value !== page.mainFrame());
    await frame.waitForFunction(() => Boolean(globalThis.Archify?.view));
    const control = frame.locator('[data-view="reset"]');
    for (const action of [null, 'in', 'in', 'reset']) {
      if (action) await frame.locator(`[data-view="${action}"]`).click();
      const name = await control.evaluate((element) => ({
        visible: element.innerText.replace(/\s+/gu, ' ').trim(),
        accessible: element.getAttribute('aria-label'),
      }));
      assert(name.visible, JSON.stringify(name));
      assert(name.accessible.includes(name.visible), JSON.stringify(name));
      assert.match(name.accessible, /Reset diagram view/u);
    }
    const names = await frame.locator('.diagram-nav button').evaluateAll((elements) =>
      elements.map((element) => ({
        visible: element.innerText.replace(/\s+/gu, ' ').trim().toLowerCase(),
        accessible: (element.getAttribute('aria-label') ?? '').toLowerCase(),
      })),
    );
    for (const name of names) assert(name.accessible.includes(name.visible), JSON.stringify(name));
  },
);

test(
  'interactive source values preserve exact whitespace in diagrams and Inspect',
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-exact-value-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const values = ['  first  second\nthird\t fourth  ', '  next  item\nvalue\t remains  '];
    const condition = '  if  selected\nthen\t admitted  ';
    const revision = 'a'.repeat(64);

    for (const kind of ['claims', 'mixed', 'responsibility']) {
      const mixed = kind !== 'claims';
      const scene = interactiveEditionScene();
      const selected = scene.pages[mixed ? 0 : 1];
      selected.claimCards = values.map((value, index) => ({
        namespace: 'private/model',
        id: `claim-${index}`,
        sha256: revision,
        facts: [
          { label: 'Claim plane', value: 'implemented' },
          { label: 'Value', value },
          { label: 'Condition', value: condition },
        ],
      }));
      selected.sourceAssertionCarriers.push(
        ...values.map((_, index) => ({
          assertionId: `source-value-${index}`,
          kind: 'claim',
          nodeRefs: [],
          relationRefs: [],
          claimRefs: [
            { namespace: 'private/model', reference: `claim-${index}`, sha256: revision },
          ],
        })),
      );
      if (mixed) {
        selected.sourceAssertionCarriers.push({
          assertionId: 'source-relation',
          kind: 'relation',
          nodeRefs: [],
          relationRefs: [
            { namespace: 'private/model', reference: 'relation:4:2', sha256: revision },
          ],
        });
        selected.claimRelationLinks = values.map((_, index) => ({
          claimAssertionId: `source-value-${index}`,
          relationAssertionId: 'source-relation',
        }));
        if (kind === 'responsibility') {
          selected.groups = [
            {
              id: 'first',
              label: 'First responsibility',
              elements: [{ namespace: 'private/model', id: 'secret-alpha' }],
            },
            {
              id: 'second',
              label: 'Second responsibility',
              elements: [{ namespace: 'private/model', id: 'secret-beta' }],
            },
          ];
          selected.visualForm = {
            schema: 'architecture.visual-form/v1',
            kind: 'responsibility',
            roles: [
              { group: 'first', basis: 'source-value-0' },
              { group: 'second', basis: 'source-value-0' },
            ],
            handoffs: [{ from: 'first', to: 'second', basis: 'source-value-0' }],
          };
        }
      }
      const file = path.join(root, `${kind}.html`);
      await fs.writeFile(file, (await renderInteractiveEditionHtml(scene)).bytes);
      await page.goto(pathToFileURL(file).href);
      await page
        .locator('.navigation button')
        .nth(mixed ? 0 : 1)
        .click();
      if (mixed)
        await page
          .locator(
            `#page-0 .${kind === 'responsibility' ? 'form-inspect' : 'source-inspection'} > summary`,
          )
          .click();
      const rows = await page
        .locator(`#page-${mixed ? 0 : 1} dd, #page-${mixed ? 0 : 1} .claim-predicate`)
        .evaluateAll((items) =>
          items.map((item) => ({ text: item.textContent, visible: item.innerText })),
        );
      for (const value of [...values, condition]) {
        const matches = rows.filter((row) => row.text === value);
        assert(matches.length, 'every selected source value must retain a visible carrier');
        for (const row of matches)
          assert.equal(row.visible, value, 'reading must preserve exact source whitespace');
      }
      if (kind === 'responsibility') {
        const rows = await page
          .locator('.form-map-role small')
          .evaluateAll((items) =>
            items.map((item) => ({ text: item.textContent, visible: item.innerText })),
          );
        const conditions = rows.filter((row) => row.text === `Condition · ${condition}`);
        assert(conditions.length, 'each source-backed role retains its selected condition');
        for (const row of conditions) assert.equal(row.visible, row.text);
      }
    }

    const sourceBytes = Buffer.from(JSON.stringify({ value: values[0] }));
    const content = Buffer.from(
      '<!doctype html><html><head><title>Selected Claim</title></head><body><div data-node-id="carrier">Selected Claim</div></body></html>',
    );
    const source = {
      id: 'source',
      kind: 'native',
      namespace: 'example/claims',
      sha256: sha(sourceBytes),
      claimant: 'fixture:owner',
    };
    const html = composeInteractiveHtml({
      schema: 'architecture.interactive-html-composition/v2',
      title: 'Source value reading',
      framing: 'Source values remain exact in the publication reader.',
      build: {
        lockSha256: '1'.repeat(64),
        editionSha256: '2'.repeat(64),
        semanticDigest: '3'.repeat(64),
      },
      editionId: 'value-reading',
      overview: 'overview',
      sources: [source],
      pages: [
        {
          id: 'overview',
          label: 'Source values',
          shortLabel: 'Values',
          purpose: 'overview',
          path: 'views/overview.html',
          sha256: sha(content),
          sourceIds: ['source'],
          content,
          subjectSources: { carrier: ['source'] },
          facts: [
            {
              reference: JSON.stringify([source.namespace, 'claim', 'value']),
              sourceSha256: source.sha256,
              graphicId: 'carrier',
              title: 'Selected Claim',
              facts: [{ label: 'Value', value: values[0] }],
            },
          ],
        },
      ],
      state: {
        qualification: 'not-performed',
        humanAcceptance: 'not-performed',
        publication: 'not-performed',
      },
    });
    const file = path.join(root, 'inspect.html');
    await fs.writeFile(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.locator('#interactive-inspect').click();
    const details = page.locator('#interactive-inspect-content details');
    for (const item of await details.all())
      if ((await item.getAttribute('open')) === null) await item.locator('summary').click();
    const row = await page
      .locator('#interactive-inspect-content dd')
      .filter({ hasText: 'first' })
      .evaluate((item) => ({ text: item.textContent, visible: item.innerText }));
    assert.equal(row.text, values[0]);
    assert.equal(row.visible, values[0], 'Inspect must preserve the exact selected value');
  },
);

test(
  'Inspect card states preserve measured contrast in every offered appearance',
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-inspect-contrast-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const source = {
      id: 'source',
      kind: 'native',
      namespace: 'example/claims',
      sha256: '4'.repeat(64),
      claimant: 'fixture:owner',
    };
    const content = Buffer.from(
      '<!doctype html><html><head><title>Claims</title></head><body><div data-node-id="first">First</div><div data-node-id="second">Second</div></body></html>',
    );
    const html = composeInteractiveHtml({
      schema: 'architecture.interactive-html-composition/v2',
      title: 'Selected meaning',
      framing: 'Source-attributed statements for independent reading.',
      build: {
        lockSha256: '1'.repeat(64),
        editionSha256: '2'.repeat(64),
        semanticDigest: '3'.repeat(64),
      },
      editionId: 'inspect-reading',
      overview: 'overview',
      sources: [source],
      pages: [
        {
          id: 'overview',
          label: 'Claims',
          shortLabel: 'Claims',
          purpose: 'overview',
          path: 'views/overview.html',
          sha256: sha(content),
          sourceIds: ['source'],
          content,
          subjectSources: { first: ['source'], second: ['source'] },
          facts: ['first', 'second'].map((graphicId) => ({
            reference: JSON.stringify([source.namespace, 'claim', graphicId]),
            sourceSha256: source.sha256,
            graphicId,
            title: graphicId === 'first' ? 'First statement' : 'Second statement',
            facts: [{ label: 'Value', value: 'Exact selected meaning' }],
          })),
        },
      ],
      state: {
        qualification: 'not-performed',
        humanAcceptance: 'not-performed',
        publication: 'not-performed',
      },
    });
    const file = path.join(root, 'inspect.html');
    await fs.writeFile(file, html);
    await page.goto(pathToFileURL(file).href);
    await page.locator('#interactive-inspect').click();
    const cards = page.locator('#interactive-inspect-index button');
    assert.equal(await cards.count(), 2);
    const observations = [];
    for (const style of ['editorial', 'blueprint', 'classic', 'signal-flow']) {
      for (const theme of ['light', 'dark']) {
        await page.evaluate(
          ({ style, theme }) => {
            globalThis.document.documentElement.dataset.style = style;
            globalThis.document.documentElement.dataset.theme = theme;
          },
          { style, theme },
        );
        for (const state of ['idle', 'hover', 'selected', 'keyboard-focus']) {
          await cards.nth(1).click();
          await page.mouse.move(1500, 80);
          if (state === 'hover') await cards.first().hover();
          if (state === 'selected' || state === 'keyboard-focus') {
            await cards.first().click();
            await page.mouse.move(1500, 80);
          }
          if (state === 'keyboard-focus') {
            await cards.nth(1).press('Shift+Tab');
            assert(await cards.first().evaluate((item) => item.matches(':focus-visible')));
          }
          observations.push({
            style,
            theme,
            state,
            title: await contrast(
              page,
              '#interactive-inspect-index strong',
              'color',
              '#interactive-inspect-index button',
            ),
            detail: await contrast(
              page,
              '#interactive-inspect-index small',
              'color',
              '#interactive-inspect-index button',
            ),
          });
        }
      }
    }
    assert.deepEqual(
      observations.filter((item) => item.title < 4.5 || item.detail < 4.5),
      [],
      'Inspect title and detail must remain readable in every state, style and theme',
    );
    t.diagnostic(
      `Measured ${observations.length} Inspect states; minimum title ${Math.min(...observations.map((item) => item.title))}, minimum detail ${Math.min(...observations.map((item) => item.detail))}`,
    );
  },
);

test(
  'native relationship captions keep text contrast in every offered appearance',
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-native-caption-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const output = path.join(root, 'architecture.html');
    await renderArchitectureScene({
      output,
      scene: {
        schema: 'architecture.interactive-scene/v1',
        id: 'overview',
        title: 'Source-bound relationship',
        subtitle: 'The caption is content, not a decorative stroke.',
        viewport: { width: 960, height: 540 },
        nodes: [
          {
            id: 'source',
            label: 'Source',
            visualRole: 'external',
            position: { x: 70, y: 180 },
            size: { width: 220, height: 100 },
          },
          {
            id: 'target',
            label: 'Target',
            visualRole: 'backend',
            position: { x: 620, y: 180 },
            size: { width: 220, height: 100 },
          },
        ],
        groups: [],
        edges: [
          {
            id: 'relationship',
            from: 'source',
            to: 'target',
            label: 'hands off',
            visualRole: 'default',
            fromSide: 'right',
            toSide: 'left',
            route: 'straight',
          },
        ],
      },
    });
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(await fs.readFile(output, 'utf8'), { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.Archify?.layoutStability);
    await page.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.layoutStability.whenStable();
    });
    const sourceGeometry = () =>
      page
        .locator('.diagram-container>svg text, .diagram-container>svg path')
        .evaluateAll((elements) =>
          elements.map((element) => ({
            text: element.textContent,
            path: element.getAttribute('d'),
            x: element.getAttribute('x'),
            y: element.getAttribute('y'),
            fontFamily: globalThis.getComputedStyle(element).fontFamily,
            fontSize: globalThis.getComputedStyle(element).fontSize,
            fontWeight: globalThis.getComputedStyle(element).fontWeight,
            width: element.getBBox().width,
            height: element.getBBox().height,
          })),
        );
    const baseline = await sourceGeometry();
    for (const style of ['editorial', 'blueprint', 'classic', 'signal-flow']) {
      for (const theme of ['light', 'dark']) {
        await page.evaluate(
          ({ style, theme }) => {
            globalThis.Archify.preset.apply(style);
            if (globalThis.document.documentElement.dataset.theme !== theme)
              globalThis.Archify.theme.toggle();
          },
          { style, theme },
        );
        await page.evaluate(() => globalThis.Archify.layoutStability.whenStable());
        const observed = await page.locator('text.t-edge-default').evaluate((element) => {
          const color = (value) =>
            value
              .match(/[\d.]+/gu)
              .slice(0, 3)
              .map(Number)
              .map((channel) => {
                const normalized = channel / 255;
                return normalized <= 0.04045
                  ? normalized / 12.92
                  : ((normalized + 0.055) / 1.055) ** 2.4;
              })
              .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
          const foreground = globalThis.getComputedStyle(element).fill;
          const background = globalThis.getComputedStyle(
            element.parentElement.querySelector('rect.c-mask'),
          ).fill;
          const left = color(foreground),
            right = color(background);
          const route = element.ownerDocument.querySelector(
            '.diagram-container>svg path.a-default',
          );
          const stroke = globalThis.getComputedStyle(route).stroke;
          const strokeLuminance = color(stroke);
          return {
            foreground,
            background,
            ratio: (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05),
            stroke,
            strokeRatio:
              (Math.max(strokeLuminance, right) + 0.05) / (Math.min(strokeLuminance, right) + 0.05),
          };
        });
        assert(observed.ratio >= 4.5, `${style}/${theme}: ${JSON.stringify(observed)}`);
        assert(observed.strokeRatio >= 3, `${style}/${theme}: ${JSON.stringify(observed)}`);
        assert.deepEqual(await sourceGeometry(), baseline);
      }
    }
  },
);

test(
  'native node labels and details retain contrast over layered fills in every appearance',
  runBrowser,
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-node-contrast-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const output = path.join(root, 'architecture.html');
    const roles = [
      'frontend',
      'backend',
      'database',
      'cloud',
      'security',
      'messagebus',
      'external',
    ];
    await renderArchitectureScene({
      output,
      scene: {
        schema: 'architecture.interactive-scene/v1',
        id: 'overview',
        title: 'Node content contrast',
        subtitle: 'Labels and details remain readable over their actual paint layers.',
        viewport: { width: 1080, height: 560 },
        nodes: roles.map((visualRole, index) => ({
          id: visualRole,
          label: `Native ${visualRole}`,
          detail: 'Readable node detail',
          visualRole,
          position: { x: 60 + (index % 3) * 310, y: 70 + Math.floor(index / 3) * 150 },
          size: { width: 260, height: 100 },
        })),
        groups: [],
        edges: [],
      },
    });
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(await fs.readFile(output, 'utf8'), { waitUntil: 'load' });
    await page.waitForFunction(() => !!globalThis.Archify?.layoutStability);
    await page.evaluate(async () => {
      await globalThis.document.fonts.ready;
      await globalThis.Archify.layoutStability.whenStable();
    });
    const failures = [];
    for (const style of ['editorial', 'blueprint', 'classic', 'signal-flow']) {
      for (const theme of ['light', 'dark']) {
        await page.evaluate(
          ({ style, theme }) => {
            globalThis.Archify.preset.apply(style);
            if (globalThis.document.documentElement.dataset.theme !== theme)
              globalThis.Archify.theme.toggle();
          },
          { style, theme },
        );
        await page.evaluate(() => globalThis.Archify.layoutStability.whenStable());
        const observations = await page
          .locator('.diagram-container>svg [data-node-id]>text')
          .evaluateAll((elements) => {
            const channels = (value) => {
              const values = value.match(/[\d.]+/gu)?.map(Number) ?? [];
              if (value.startsWith('color(srgb '))
                return values.map((channel, index) => (index < 3 ? channel * 255 : channel));
              if (!value.startsWith('rgb')) throw Error('Unobserved node color space');
              return values;
            };
            const over = (foreground, background, opacity = 1) => {
              const alpha = (foreground[3] ?? 1) * opacity;
              return foreground
                .slice(0, 3)
                .map((channel, index) => channel * alpha + background[index] * (1 - alpha));
            };
            const luminance = (value) =>
              value
                .map((channel) => {
                  const normalized = channel / 255;
                  return normalized <= 0.04045
                    ? normalized / 12.92
                    : ((normalized + 0.055) / 1.055) ** 2.4;
                })
                .reduce(
                  (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
                  0,
                );
            return elements.map((element) => {
              const node = element.parentElement;
              const layers = [...node.querySelectorAll(':scope>rect')].map((rect) => {
                const paint = globalThis.getComputedStyle(rect);
                const fill = channels(paint.fill);
                if (fill.length < 3 || Number(paint.opacity) !== 1)
                  throw Error('Node paint requires a different compositing observer');
                return { fill, opacity: Number(paint.fillOpacity) };
              });
              if (!layers.length || (layers[0].fill[3] ?? 1) * layers[0].opacity !== 1)
                throw Error('Node text has no observed opaque paint base');
              const surface = layers.reduce(
                (below, above) => over(above.fill, below, above.opacity),
                [0, 0, 0],
              );
              const text = globalThis.getComputedStyle(element);
              const foreground = luminance(
                over(channels(text.fill), surface, Number(text.fillOpacity)),
              );
              const background = luminance(surface);
              return {
                node: node.dataset.nodeId,
                text: element.textContent,
                foreground: text.fill,
                layers,
                surface,
                ratio:
                  (Math.max(foreground, background) + 0.05) /
                  (Math.min(foreground, background) + 0.05),
              };
            });
          });
        assert.equal(observations.length, roles.length * 2);
        failures.push(
          ...observations
            .filter(({ ratio }) => ratio < 4.5)
            .map((observation) => ({ style, theme, ...observation })),
        );
      }
    }
    assert.deepEqual(failures, [], JSON.stringify(failures));
  },
);

async function authoredHtml(t, repeatMember = false, multiplePages = false) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-appearance-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const meaning = meaningFor('interactive');
  const raw = sceneFor(meaning, 'interactive');
  if (repeatMember)
    raw.nodes.push({
      ...structuredClone(raw.nodes[0]),
      id: 'client-copy',
      position: { x: 128, y: 280 },
    });
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), raw.texts);
  raw.texts = raw.texts.map((label) => ({
    ...label,
    box: measurer.box(label),
  }));
  const composed = compose(meaning, 'interactive').pages[0];
  const output = path.join(root, 'page.html');
  await renderArchitectureScene({
    scene: composed.scene,
    exploration: composed.exploration,
    output,
  });
  const content = await fs.readFile(output);
  const source = meaning.native.selections[0].source;
  return composeInteractiveHtml({
    schema: 'architecture.interactive-html-composition/v2',
    title: 'Architecture reading',
    framing: 'Source relationships and editorial explanation remain distinct.',
    appearance: { style: 'blueprint', theme: 'dark' },
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
    pages: (multiplePages ? ['overview', 'relations'] : ['overview']).map((id) => ({
      id,
      label: id === 'overview' ? composed.label : 'Relations',
      shortLabel: id === 'overview' ? 'Overview' : 'Relations',
      purpose: id === 'overview' ? 'overview' : 'mechanism',
      path: `views/${id}.html`,
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
    })),
    state: {
      qualification: 'not-performed',
      humanAcceptance: 'not-performed',
      publication: 'not-performed',
    },
  });
}

async function observeSystemTheme(member, theme, deliver, timeout = 5000) {
  await member.evaluate((light) => {
    const media = globalThis.matchMedia('(prefers-color-scheme: light)');
    const observation = { settled: media.matches === light };
    const listener = (event) => {
      if (event.matches === light) observation.settled = true;
    };
    if (!observation.settled) media.addEventListener('change', listener, { once: true });
    observation.cancel = () => media.removeEventListener('change', listener);
    globalThis.systemThemeObservation = observation;
  }, theme === 'light');
  try {
    await deliver();
    const settled = await member.waitForFunction(
      () => globalThis.systemThemeObservation.settled,
      undefined,
      { timeout },
    );
    await settled.dispose();
    assert.equal(
      await member.evaluate(() => globalThis.matchMedia('(prefers-color-scheme: light)').matches),
      theme === 'light',
      'the real browser delivered the selected system preference',
    );
  } catch (cause) {
    if (cause.name === 'TimeoutError')
      throw new Error(
        `The real browser did not deliver the ${theme} preference within ${timeout}ms`,
        {
          cause,
        },
      );
    throw cause;
  } finally {
    await member.evaluate(() => {
      globalThis.systemThemeObservation.cancel();
      delete globalThis.systemThemeObservation;
    });
  }
}

async function geometry(frame, selector) {
  return frame.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      const style = globalThis.getComputedStyle(element);
      return {
        text: element.textContent,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        font: style.fontFamily,
        fontSize: style.fontSize,
        path: element.getAttribute('d'),
        transform: element.getAttribute('transform'),
      };
    }),
  );
}

async function contrast(frame, selector, property, backgroundSelector) {
  return frame
    .locator(selector)
    .first()
    .evaluate(
      (element, args) => {
        const channels = (value) => value.match(/[\d.]+/g)?.map(Number) ?? [];
        const over = (foreground, background) => {
          const alpha = foreground[3] ?? 1;
          return foreground
            .slice(0, 3)
            .map((channel, index) => channel * alpha + background[index] * (1 - alpha));
        };
        const luminance = (value) => {
          const rgb = value.slice(0, 3).map((channel) => {
            const normalized = channel / 255;
            return normalized <= 0.04045
              ? normalized / 12.92
              : ((normalized + 0.055) / 1.055) ** 2.4;
          });
          return rgb.length === 3 ? rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 : -1;
        };
        const background = element.ownerDocument.querySelector(args.backgroundSelector);
        const layers = [];
        for (let current = background; current; current = current.parentElement) {
          const style = globalThis.getComputedStyle(current);
          if (Number(style.opacity) !== 1 || style.backgroundImage !== 'none')
            throw Error('The selected contrast surface requires a separate compositing observer');
          const color = channels(style.backgroundColor);
          layers.push(color);
          if ((color[3] ?? 1) === 1) break;
        }
        if (!layers.length || (layers.at(-1)[3] ?? 1) !== 1)
          throw Error('The selected contrast surface has no observed opaque background');
        const surface = layers.reduceRight((below, above) => over(above, below), [0, 0, 0]);
        const foreground = luminance(
          over(channels(globalThis.getComputedStyle(element)[args.property]), surface),
        );
        const paper = luminance(surface);
        return foreground < 0 || paper < 0
          ? 0
          : (Math.max(foreground, paper) + 0.05) / (Math.min(foreground, paper) + 0.05);
      },
      { property, backgroundSelector },
    );
}

test(
  'real desktop neutral builds switch every appearance without changing graph geometry',
  runBrowser,
  async (t) => {
    const fixture = await selectedNativeEdition(t, { media: ['interactive'] });
    fixture.project.presentation.interactive.appearance = {
      style: 'classic',
      theme: 'dark',
    };
    await fs.writeFile(
      path.join(fixture.root, 'edition/project.json'),
      JSON.stringify(fixture.project) + '\n',
    );
    const output = path.join(fixture.root, 'candidate');
    await compileEditionCandidateInput(fixture.file, fixture.digest, output);
    const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setContent(html, { waitUntil: 'load' });
    await page.locator('[data-rendered="true"]').waitFor();
    const baseline = await geometry(page, '.graph-svg text, .graph-svg rect, .graph-route');
    const colors = new Set();
    for (const style of ['editorial', 'blueprint', 'classic', 'signal-flow']) {
      for (const theme of ['light', 'dark']) {
        await page.selectOption('#interactive-style', style);
        await page.selectOption('#interactive-theme', theme);
        assert.equal(await page.locator('html').getAttribute('data-style'), style);
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        assert.deepEqual(
          await geometry(page, '.graph-svg text, .graph-svg rect, .graph-route'),
          baseline,
        );
        const background = await page
          .locator('html')
          .evaluate((el) => globalThis.getComputedStyle(el).backgroundColor);
        colors.add(background);
        const nodeFill = await page
          .locator('.graph-node>rect')
          .first()
          .evaluate((el) => globalThis.getComputedStyle(el).fill);
        assert.notEqual(nodeFill, background);
        assert(
          (await contrast(page, '.graph-label--node', 'fill', '.graph')) >= 4.5,
          `${style}/${theme}: node text contrast`,
        );
        assert(
          (await contrast(page, '.graph-route', 'stroke', '.graph')) >= 3,
          `${style}/${theme}: route contrast`,
        );
        assert(
          (await contrast(
            page,
            '.navigation button[aria-current=page]',
            'color',
            '.navigation button[aria-current=page]',
          )) >= 4.5,
          `${style}/${theme}: selected navigation text contrast`,
        );
      }
    }
    assert.equal(colors.size, 8);
    assert.deepEqual(errors, []);
  },
);

test(
  'responsibility appearance covers the actual figure, not just the surrounding toolbar',
  runBrowser,
  async (t) => {
    const fixture = await selectedNativeEdition(t, { media: ['interactive'] });
    const namespace = fixture.request.sources[0].namespace;
    const view = fixture.project.presentation.interactive.views[0];
    view.groups = ['alpha', 'beta'].map((id, index) => ({
      id: `role-${index + 1}`,
      label: `Responsibility ${index + 1}`,
      elements: [{ namespace, id }],
    }));
    view.form = {
      schema: 'architecture.visual-form/v1',
      kind: 'responsibility',
      roles: [
        { group: 'role-1', basis: 'first-role' },
        { group: 'role-2', basis: 'second-role' },
      ],
      handoffs: [{ from: 'role-1', to: 'role-2', basis: 'handoff' }],
    };
    fixture.project.editorialAssertions = [
      ['first-role', 'The first component has the first responsibility.'],
      ['second-role', 'The second component has the second responsibility.'],
      ['handoff', 'The first component hands work to the second.'],
    ].map(([id, statement]) => ({
      id,
      statement,
      proponent: fixture.project.editor,
      basis: ['overview'],
      questions: ['shape'],
    }));
    await fs.writeFile(
      path.join(fixture.root, 'edition/project.json'),
      JSON.stringify(fixture.project) + '\n',
    );
    const output = path.join(fixture.root, 'candidate');
    await compileEditionCandidateInput(fixture.file, fixture.digest, output);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.setContent(
      await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8'),
      { waitUntil: 'load' },
    );
    await page.locator('.form-map').waitFor();
    const baseline = await geometry(page, '.form-map text, .form-map rect, .form-map path');
    const surfaces = new Set();
    for (const style of ['editorial', 'blueprint', 'classic', 'signal-flow']) {
      for (const theme of ['light', 'dark']) {
        await page.selectOption('#interactive-style', style);
        await page.selectOption('#interactive-theme', theme);
        surfaces.add(
          await page
            .locator('.form-map')
            .evaluate((el) =>
              [
                globalThis.getComputedStyle(el).backgroundColor,
                globalThis.getComputedStyle(el.querySelector('text')).fill,
              ].join('|'),
            ),
        );
        assert.deepEqual(
          await geometry(page, '.form-map text, .form-map rect, .form-map path'),
          baseline,
        );
        assert(
          (await contrast(page, '.form-map-role small', 'color', '.form-map')) >= 4.5,
          `${style}/${theme}: role detail contrast`,
        );
        assert(
          (await contrast(page, '.form-map-graph text', 'fill', '.form-map')) >= 4.5,
          `${style}/${theme}: graph text contrast`,
        );
      }
    }
    assert.equal(
      surfaces.size,
      8,
      'the whole responsibility figure follows every offered appearance',
    );
  },
);

test(
  'native appearance reception is installed before an opaque child begins initialization',
  runBrowser,
  async (t) => {
    const html = await authoredHtml(t);
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const observation = `<script>(() => {
      let receiving = false;
      const add = window.addEventListener;
      window.addEventListener = function (type, listener, options) {
        if (type === 'message' && String(listener).includes('architecture-interactive:native-appearance')) receiving = true;
        return add.call(this, type, listener, options);
      };
      const descriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'srcdoc');
      window.appearanceReception = [];
      Object.defineProperty(HTMLIFrameElement.prototype, 'srcdoc', {
        configurable: true, get: descriptor.get,
        set(value) {
          window.appearanceReception.push(receiving);
          descriptor.set.call(this, value);
        }
      });
    })();</script>`;
    await page.setContent(html.toString().replace('<head>', '<head>' + observation), {
      waitUntil: 'load',
    });
    await page.frameLocator('#interactive-frame').locator('[data-interactive-member]').waitFor();
    assert.deepEqual(await page.evaluate(() => globalThis.appearanceReception), [true]);
  },
);

test(
  'native system-theme observation times out and releases its listener when no change is delivered',
  runBrowser,
  async (t) => {
    const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
    const page = await browser.newPage({ colorScheme: 'light' });
    const member = page.mainFrame();
    await assert.rejects(
      observeSystemTheme(
        member,
        'dark',
        () =>
          member.evaluate(() => {
            globalThis.expiredSystemThemeObservation = globalThis.systemThemeObservation;
          }),
        200,
      ),
      { message: 'The real browser did not deliver the dark preference within 200ms' },
    );
    assert.equal(
      await member.evaluate(() => typeof globalThis.systemThemeObservation),
      'undefined',
    );
    await observeSystemTheme(member, 'dark', () => page.emulateMedia({ colorScheme: 'dark' }));
    assert.equal(
      await member.evaluate(() => globalThis.expiredSystemThemeObservation.settled),
      false,
      'the expired listener does not observe a later real media event',
    );
  },
);

test(
  'authored reader style is shared with its opaque frame and never replaced by source initialization',
  runBrowser,
  async (t) => {
    const html = await authoredHtml(t);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setContent(html.toString(), { waitUntil: 'load' });
    const member = await selectedInteractiveMember(page, 'overview');
    await member.locator('svg').first().waitFor();
    assert.equal(
      await member.locator('.toolbar').isVisible(),
      true,
      'native presentation and export actions stay operable',
    );
    assert.equal(
      await page.locator('#interactive-style').count(),
      0,
      'an authored native preset has one control owner',
    );
    const publishedReader = await page
      .locator('#architecture-interactive-data')
      .evaluate((element) => JSON.parse(element.textContent).pages.overview.nativeReader);
    assert.equal(publishedReader, 'archify/v1', 'native ownership is an explicit adapter contract');
    const settle = async (style, theme) => {
      await page.waitForFunction(
        ({ style, theme }) => {
          const frame = globalThis.document.querySelector('#interactive-frame');
          return (
            frame?.dataset.page &&
            globalThis.document.documentElement.dataset.style === style &&
            globalThis.document.documentElement.dataset.theme === theme
          );
        },
        { style, theme },
        { timeout: 5000 },
      );
      await member.locator(`html[data-style="${style}"][data-theme="${theme}"]`).waitFor();
      await member.locator('html').evaluate(() => globalThis.Archify.layoutStability.whenStable());
    };
    const systemTheme = (theme) =>
      observeSystemTheme(member, theme, () => page.emulateMedia({ colorScheme: theme }));
    await settle('blueprint', 'dark');
    await systemTheme('dark');
    await systemTheme('light');
    assert.equal(
      await member.locator('html').getAttribute('data-theme'),
      'dark',
      'a delivered system preference must not replace the explicit authored theme',
    );
    assert.equal(await member.locator('#theme-label').textContent(), 'Dark');
    assert.equal(await member.locator('#btn-theme').getAttribute('aria-pressed'), 'false');
    const baseline = await geometry(member, 'svg text, [data-node-id], [data-edge-id]');
    for (const style of ['editorial', 'blueprint', 'classic', 'signal-flow']) {
      for (const theme of ['light', 'dark']) {
        await member.locator('#btn-preset').click();
        await member.locator(`[data-preset-value="${style}"]`).click();
        const currentTheme = await member.locator('html').getAttribute('data-theme');
        if (currentTheme !== theme) await member.locator('#btn-theme').click();
        await settle(style, theme);
        await systemTheme(theme === 'light' ? 'dark' : 'light');
        assert.equal(
          await member.locator('html').getAttribute('data-theme'),
          theme,
          'native reader selection remains explicit in an opaque frame',
        );
        assert.deepEqual(
          await geometry(member, 'svg text, [data-node-id], [data-edge-id]'),
          baseline,
        );
        const frameRoot = await member
          .locator('html')
          .evaluate((el) => globalThis.getComputedStyle(el).getPropertyValue('--bg').trim());
        const shellRoot = await page
          .locator('html')
          .evaluate((el) =>
            globalThis.getComputedStyle(el).getPropertyValue('--reader-paper').trim(),
          );
        assert.equal(frameRoot, shellRoot, 'native paint remains the single palette owner');
        assert.equal(
          await member.locator('#theme-label').textContent(),
          theme === 'dark' ? 'Dark' : 'Light',
        );
      }
    }
    await page.click('#interactive-inspect');
    await page.click('#interactive-inspect-back');
    await settle('signal-flow', 'dark');
    assert.deepEqual(await geometry(member, 'svg text, [data-node-id], [data-edge-id]'), baseline);
    assert.equal(
      await page.locator('#interactive-frame').getAttribute('sandbox'),
      'allow-scripts allow-downloads',
    );
    assert.deepEqual(errors, []);
  },
);

test(
  'native reading remains truthful, addressable and operable through publication',
  runBrowser,
  async (t) => {
    const exact = await authoredHtml(t);
    const limited = await authoredHtml(t, true);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    });
    await page.setContent(exact.toString(), { waitUntil: 'load' });
    let frame = page.frames().find((value) => value !== page.mainFrame());
    await frame.waitForFunction(() => !!globalThis.Archify?.routeProbe);
    await frame.evaluate(() => {
      globalThis.Archify.focus.set('client', { toggle: false });
      globalThis.Archify.focus.reach('downstream', { reveal: false });
    });
    await frame.locator('#btn-export').click();
    assert.equal(await frame.locator('[data-action="reach-share-card"]').isEnabled(), true);
    const downloaded = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await frame.locator('[data-action="reach-share-card"]').click();
    const asset = await downloaded;
    assert.ok(asset);
    const bytes = await fs.readFile(await asset.path());
    assert.equal(bytes.readUInt32BE(16), 1200);
    assert.equal(bytes.readUInt32BE(20), 630);
    const addressed = await frame.evaluate(async () => {
      globalThis.Archify.focus.clear();
      globalThis.Archify.routeProbe.begin({
        source: 'client',
        focusNode: false,
      });
      globalThis.Archify.routeProbe.choose('server');
      let copied;
      globalThis.document.execCommand = (command) => {
        if (command !== 'copy') return false;
        copied = globalThis.document.querySelector('textarea[readonly]')?.value;
        return true;
      };
      return { passed: await globalThis.Archify.routeProbe.copyLink(), copied };
    });
    assert.equal(addressed.passed, true);
    assert.equal(addressed.copied.startsWith('about:srcdoc'), false);
    const parameters = new URLSearchParams(new URL(addressed.copied).hash.slice(1));
    assert.equal(parameters.get('page'), 'overview');
    assert.equal(parameters.get('reader'), 'route=client~server');
    await page.close();
    const limitedPage = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    });
    await limitedPage.addInitScript(() => {
      const request = globalThis.requestAnimationFrame.bind(globalThis);
      const cancel = globalThis.cancelAnimationFrame.bind(globalThis);
      const pending = new Map();
      let identity = 0;
      globalThis.requestAnimationFrame = (callback) => {
        const id = --identity;
        pending.set(id, callback);
        return id;
      };
      globalThis.cancelAnimationFrame = (id) => {
        if (!pending.delete(id)) cancel(id);
      };
      globalThis.releaseNativeLayout = () => {
        globalThis.requestAnimationFrame = request;
        globalThis.cancelAnimationFrame = cancel;
        for (const callback of pending.values()) request(callback);
        pending.clear();
      };
    });
    await limitedPage.setContent(limited.toString(), { waitUntil: 'load' });
    frame = limitedPage.frames().find((value) => value !== limitedPage.mainFrame());
    await frame.waitForFunction(() => !!globalThis.Archify?.routeProbe);
    assert.equal(await frame.evaluate(() => globalThis.Archify.radar.count()), 0);
    await frame.evaluate(() => {
      const owner = globalThis.Archify.layoutStability;
      const whenStable = owner.whenStable.bind(owner);
      owner.whenStable = () => {
        globalThis.releaseNativeLayout();
        return whenStable();
      };
    });
    await frame.evaluate(() => globalThis.Archify.layoutStability.whenStable());
    assert.equal(await frame.locator('.diagram-container > svg [data-node-id]').count(), 3);
    const refusal = await frame.evaluate(() => {
      globalThis.Archify.routeProbe.begin({
        source: 'client',
        focusNode: false,
      });
      globalThis.Archify.routeProbe.choose('server');
      return {
        route: globalThis.Archify.routeProbe.exportSnapshot(),
        radar: globalThis.Archify.radar.count(),
        title: globalThis.document.querySelector('#route-probe-title').textContent,
      };
    });
    assert.equal(refusal.route, null);
    assert.equal(refusal.radar, 3);
    assert.doesNotMatch(refusal.title, /cannot reach/i);
    const occurrence = frame.locator('g[data-inspect-id="client-copy"]');
    await occurrence.press('Enter');
    assert.equal(await frame.evaluate(() => globalThis.Archify.focus.active()), 'client-copy');
    assert.equal(await limitedPage.locator('#interactive-inspector').isVisible(), false);
    await occurrence.press('i');
    await limitedPage.locator('#interactive-inspector').waitFor({ state: 'visible' });
    await limitedPage.locator('#interactive-inspect-back').click();
    await frame.waitForFunction(
      () => globalThis.document.activeElement?.getAttribute('data-inspect-id') === 'client-copy',
    );
    await limitedPage.close();
  },
);

test('standalone copy links do not invoke a policy-denied Clipboard API', runBrowser, async (t) => {
  const html = await authoredHtml(t);
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-copy-policy-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'architecture.html');
  await fs.writeFile(file, html);
  const browser = browserLifetime(t).use(await chromium.launch(browserOptions));
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) errors.push(message.text());
  });
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  const handle = await page.locator('#interactive-frame').elementHandle();
  const frame = await handle.contentFrame();
  await frame.waitForFunction(() => !!globalThis.Archify?.routeProbe);
  const copied = await frame.evaluate(async () => {
    const policy = globalThis.document.permissionsPolicy ?? globalThis.document.featurePolicy;
    const denied = policy?.allowsFeature('clipboard-write') === false;
    const attempts = [];
    const payloads = [];
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText(value) {
          attempts.push(value);
          return Promise.reject(new DOMException('Clipboard denied by policy', 'NotAllowedError'));
        },
      },
    });
    globalThis.document.execCommand = (command) => {
      if (command !== 'copy') return false;
      payloads.push(globalThis.document.querySelector('textarea[readonly]')?.value);
      return true;
    };
    globalThis.Archify.focus.set('client', { toggle: false });
    const focus = await globalThis.Archify.focus.copyLink();
    globalThis.Archify.focus.clear();
    globalThis.Archify.routeProbe.begin({ source: 'client', focusNode: false });
    globalThis.Archify.routeProbe.choose('server');
    const route = await globalThis.Archify.routeProbe.copyLink();
    globalThis.Archify.routeProbe.clear();
    globalThis.Archify.semanticLens.select('component');
    const lens = await globalThis.Archify.semanticLens.copyLink();
    return { denied, attempts, payloads, results: [focus, route, lens] };
  });
  assert.equal(copied.denied, true);
  assert.deepEqual(copied.attempts, []);
  assert.deepEqual(copied.results, [true, true, true]);
  assert.deepEqual(
    copied.payloads.map((value) => new URLSearchParams(new URL(value).hash.slice(1)).get('reader')),
    ['focus=client', 'route=client~server', 'lens=component'],
  );
  assert.deepEqual(errors, []);
});

test('standalone native reading survives page and browser history', runBrowser, async (t) => {
  const html = await authoredHtml(t, false, true);
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-reading-history-')),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'architecture.html');
  await fs.writeFile(file, html);
  for (const disableCache of [false, true])
    await t.test(
      disableCache ? 'without back-forward cache' : 'with default browser cache',
      async (t) => {
        const lifetime = browserLifetime(t);
        const browser = lifetime.use(
          await chromium.launch({
            ...browserOptions,
            args: disableCache ? ['--disable-features=BackForwardCache'] : [],
          }),
        );
        const page = await browser.newPage({
          viewport: { width: 1440, height: 900 },
        });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (['warning', 'error'].includes(message.type())) errors.push(message.text());
        });
        const routeHash = 'page=relations&reader=' + encodeURIComponent('route=client~server');
        await page.goto(pathToFileURL(file).href + '#' + routeHash, {
          waitUntil: 'load',
        });
        async function currentFrame(id, predicate) {
          await page.waitForFunction(
            (id) => globalThis.document.querySelector('#interactive-frame').dataset.page === id,
            id,
          );
          const handle = await page.locator('#interactive-frame').elementHandle();
          const frame = await handle.contentFrame();
          await frame.waitForFunction(predicate);
          return frame;
        }
        const nativeReady = () => !!globalThis.Archify?.routeProbe;
        const routeReady = () => !!globalThis.Archify?.routeProbe?.exportSnapshot();
        async function selectedRoute() {
          const frame = await currentFrame('relations', routeReady);
          assert.deepEqual(
            await frame.evaluate(() => globalThis.Archify.routeProbe.exportSnapshot().nodeIds),
            ['client', 'server'],
          );
          assert.equal(
            await frame.evaluate(() => globalThis.Archify.routeProbe.isJourneyPlaying()),
            false,
          );
          return frame;
        }
        let frame = await selectedRoute();
        const addressed = await frame.evaluate(async () => {
          let value;
          globalThis.document.execCommand = (command) => {
            if (command !== 'copy') return false;
            value = globalThis.document.querySelector('textarea[readonly]')?.value;
            return true;
          };
          return {
            passed: await globalThis.Archify.routeProbe.copyLink(),
            value,
          };
        });
        assert.equal(addressed.passed, true);
        assert.equal(new URL(addressed.value).hash.slice(1), routeHash);
        const initialLength = await page.evaluate(() => globalThis.history.length);
        await page.locator('[data-interactive-page="overview"]').click();
        frame = await currentFrame('overview', nativeReady);
        assert.equal(
          await frame.evaluate(() => globalThis.Archify.routeProbe.exportSnapshot()),
          null,
        );
        assert.equal(await page.evaluate(() => globalThis.history.length), initialLength + 1);
        await page.evaluate(() => globalThis.history.back());
        await selectedRoute();
        await page.evaluate(() => globalThis.history.forward());
        await currentFrame('overview', nativeReady);
        await page.evaluate(() => globalThis.history.back());
        await selectedRoute();
        await page.evaluate(() => {
          globalThis.location.hash =
            'page=relations&reader=' + encodeURIComponent('focus=client&reach=downstream');
        });
        frame = await currentFrame(
          'relations',
          () => !!globalThis.Archify?.focus?.reachabilitySnapshot(),
        );
        assert.deepEqual(
          await frame.evaluate(() => globalThis.Archify.focus.reachabilitySnapshot().nodeIds),
          ['client', 'server'],
        );
        await page.evaluate(() => globalThis.history.back());
        await selectedRoute();
        await page.reload({ waitUntil: 'load' });
        frame = await selectedRoute();
        const instance = await page.locator('#interactive-frame').elementHandle();
        await frame.evaluate(() => globalThis.Archify.view.zoomIn());
        assert.equal(
          await instance.evaluate(
            (node) => node === globalThis.document.querySelector('#interactive-frame'),
          ),
          true,
        );
        await page.goto('about:blank', { waitUntil: 'load' });
        await page.goBack({ waitUntil: 'load' });
        await selectedRoute();
        await page.evaluate(() => {
          globalThis.window.__architectureInteractive.navigate('overview');
          globalThis.window.__architectureInteractive.navigate('relations');
          globalThis.window.__architectureInteractive.navigate('overview');
        });
        await currentFrame('overview', nativeReady);
        await page.evaluate(() => globalThis.history.back());
        await currentFrame('relations', nativeReady);
        await page.evaluate(() => globalThis.history.back());
        await currentFrame('overview', nativeReady);
        await page.evaluate(() => globalThis.history.back());
        frame = await selectedRoute();
        const downloaded = page.waitForEvent('download', { timeout: 15000 });
        await frame.evaluate(() => globalThis.Archify.exportMenu.run('svg'));
        const canonical = await fs.readFile(await (await downloaded).path(), 'utf8');
        assert.doesNotMatch(
          canonical,
          /data-publication-uri|about:srcdoc|location[.](?:replace|hash)/,
        );
        assert.equal(canonical.includes(root), false);
        assert.deepEqual(errors, []);
      },
    );
});

test(
  'native appearance follows current page frame and refuses predecessor messages',
  runBrowser,
  async (t) => {
    const html = await authoredHtml(t, false, true);
    const lifetime = browserLifetime(t);
    const browser = lifetime.use(await chromium.launch(browserOptions));
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    await page.setContent(html.toString(), { waitUntil: 'load' });
    const member = page.frameLocator('#interactive-frame');
    await member.locator('[data-interactive-member]').waitFor();
    await member.locator('.diagram-container > svg').waitFor();
    await page.evaluate(() => {
      globalThis.oldNativeWindow =
        globalThis.document.getElementById('interactive-frame').contentWindow;
    });
    await page.getByRole('button', { name: 'Relations', exact: true }).click();
    await member.locator('[data-interactive-member="relations"]').waitFor();
    await member.locator('.diagram-container > svg').waitFor();
    await member.locator('#btn-theme').click();
    const selectedTheme = await member.locator('html').getAttribute('data-theme');
    await page.waitForFunction(
      (theme) => globalThis.document.documentElement.dataset.theme === theme,
      selectedTheme,
      { timeout: 2000 },
    );
    const framePalette = await member
      .locator('html')
      .evaluate((el) => globalThis.getComputedStyle(el).getPropertyValue('--bg').trim());
    assert.equal(
      await page
        .locator('html')
        .evaluate((el) =>
          globalThis.getComputedStyle(el).getPropertyValue('--reader-paper').trim(),
        ),
      framePalette,
    );
    const opposite = selectedTheme === 'dark' ? 'light' : 'dark';
    await page.evaluate(
      ({ selectedTheme, opposite }) => {
        const frame = globalThis.document.getElementById('interactive-frame');
        const palette = {
          paper: '#ffffff',
          panel: '#ffffff',
          ink: '#000000',
          muted: '#111111',
          rule: '#222222',
          line: '#333333',
          accent: '#444444',
          onAccent: '#ffffff',
          soft: '#555555',
          cool: '#666666',
          control: '#777777',
          warm: '#888888',
          alert: '#999999',
        };
        const message = {
          type: 'architecture-interactive:native-appearance',
          page: 'relations',
          style: 'classic',
          theme: opposite,
          palette,
        };
        globalThis.dispatchEvent(
          new globalThis.MessageEvent('message', {
            source: globalThis.oldNativeWindow,
            data: message,
          }),
        );
        if (globalThis.document.documentElement.dataset.theme !== selectedTheme)
          throw new Error('Predecessor altered current appearance');
        globalThis.dispatchEvent(
          new globalThis.MessageEvent('message', {
            source: frame.contentWindow,
            data: { ...message, page: 'overview' },
          }),
        );
        if (globalThis.document.documentElement.dataset.theme !== selectedTheme)
          throw new Error('Wrong page altered current appearance');
      },
      { selectedTheme, opposite },
    );
    assert.equal(
      await page.locator('#interactive-frame').getAttribute('sandbox'),
      'allow-scripts allow-downloads',
    );
  },
);
