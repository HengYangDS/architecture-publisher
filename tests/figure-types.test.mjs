import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/edition.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/compiler/build-input.mjs';
import { compileEditionMeaning } from '../packages/publisher/src/compiler/meaning.mjs';
import { composeStaticEditionScene } from '../packages/publisher/src/scene/static/edition.mjs';
import { importLikeC4Layout } from '../packages/publisher/src/semantics/native-likec4.mjs';
import {
  composeStaticEditionSvg,
  composeStaticFigureSvg,
} from '../packages/publisher/renderers/svg/index.mjs';
import { staticEditionScene } from './fixtures/static-edition-scene.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import { validateEditionProject } from '../packages/publisher/src/edition/authoring.mjs';
import { composeAuthoredInteractiveArchitecture } from '../packages/publisher/src/scene/interactive/authored-architecture.mjs';
import { composeInteractiveEditionScene } from '../packages/publisher/src/scene/interactive/edition.mjs';
import {
  neutralFigurePolicy,
  resolveFigureTypes,
} from '../packages/publisher/src/scene/figure-types.mjs';
import { adaptArchitectureIcons } from '../packages/publisher/renderers/archify/icons.mjs';
import { composeFigureTypeLegend } from '../packages/publisher/renderers/svg/figure-types.mjs';
import { SELF_RELATIONS } from '../editions/self/src/edition/model.mjs';
import { architecturePublisherInteractiveScenes } from '../editions/self/src/edition/interactive-scenes.mjs';
import { composeArchitecturePublisherInteractiveScene } from '../editions/self/src/edition/interactive-scene.mjs';
import { SELF_FIGURE_TYPES } from '../editions/self/src/edition/figure-types.mjs';
import { meaningFor, sceneFor } from './fixtures/authored-routes.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';
import {
  loadFigureIconSupply,
  renderFigureIcon,
  validateFigureIconCatalog,
  validateResolvedFigureIcons,
} from '../packages/publisher/renderers/icons/index.mjs';

function selfDocument() {
  const document = claimModel();
  const views = architecturePublisherInteractiveScenes();
  const ids = new Set(
    Object.values(views).flatMap(({ composition }) =>
      composition.groups.flatMap(({ entities }) => entities),
    ),
  );
  document.entities = Object.fromEntries(
    [...ids].map((id) => [
      id,
      {
        type: 'component',
        label: id,
        provenance: ['contract'],
      },
    ]),
  );
  document.relations = structuredClone(SELF_RELATIONS);
  return document;
}

function ordinaryMeaning() {
  const meaning = meaningFor('interactive');
  const scene = sceneFor(meaning, 'interactive');
  scene.nodes = scene.nodes.map((node) =>
    node.adornment
      ? node
      : (({ id, position, size, semanticIds }) => ({
          id,
          position,
          size,
          semanticIds,
          label: id,
          visualRole: 'backend',
          figureKind: 'component',
        }))(node),
  );
  meaning.editorial.visualPolicy = {
    profile: 'neutral',
    figureTypes: { component: 'lucide:box' },
  };
  return meaning;
}

test('Edition owns a precise figure-kind catalog without a fixed domain taxonomy', async (t) => {
  const { project } = await selectedNativeEdition(t);
  project.visualPolicy.figureTypes = { 'source-owned domain': 'lucide:network' };
  assert.doesNotThrow(() => validateEditionProject(project));
  for (const mapping of [
    { ' source': 'lucide:network' },
    { source: 'none' },
    { source: 'https://example.com/icon.svg' },
  ]) {
    project.visualPolicy.figureTypes = mapping;
    assert.throws(() => validateEditionProject(project), { code: 'edition_project_invalid' });
  }
});

test('all selected authored pages require covered distinct resolved glyphs', () => {
  const meaning = ordinaryMeaning();
  const page = structuredClone(meaning.refinement.media.interactive.pages[0]);
  page.id = page.scene.id = 'mechanism';
  page.purpose = 'mechanism';
  page.scene.nodes[0].figureKind = 'later-page role';
  meaning.refinement.media.interactive.pages.push(page);
  meaning.media.interactive.views.push({
    ...structuredClone(meaning.media.interactive.views[0]),
    id: page.id,
  });
  assert.throws(() => composeAuthoredInteractiveArchitecture(meaning), {
    code: 'figure_type_missing',
  });
  meaning.editorial.visualPolicy.figureTypes['later-page role'] = 'lucide:box';
  assert.throws(() => composeAuthoredInteractiveArchitecture(meaning), {
    code: 'figure_type_glyph_conflict',
  });
  meaning.editorial.visualPolicy.figureTypes['later-page role'] = 'lucide:network';
  const composed = composeAuthoredInteractiveArchitecture(meaning);
  assert.equal(composed.pages[0].scene.nodes[0].icon, 'lucide:box');
  assert.equal(composed.pages[1].scene.nodes[0].icon, 'lucide:network');
  assert.equal(composed.pages[1].scene.nodes[2].icon, 'lucide:box');
  assert.equal(sceneFor(meaning, 'interactive').nodes[0].icon, undefined);
});

test('suppression, missing catalogs and occurrence overrides cannot bypass type ownership', () => {
  const meaning = ordinaryMeaning();
  delete meaning.editorial.visualPolicy.figureTypes;
  assert.throws(() => composeAuthoredInteractiveArchitecture(meaning), {
    code: 'figure_types_required',
  });
  meaning.editorial.visualPolicy.figureTypes = { component: 'lucide:box' };
  sceneFor(meaning, 'interactive').nodes[0].icon = 'lucide:network';
  assert.throws(() => composeAuthoredInteractiveArchitecture(meaning), {
    code: 'figure_type_occurrence_override',
  });
});

test('primitive-only source artwork remains unchanged without an automatic catalog', () => {
  const meaning = meaningFor('interactive');
  const before = structuredClone(sceneFor(meaning, 'interactive').nodes);
  const composed = composeAuthoredInteractiveArchitecture(meaning);
  assert.deepEqual(
    composed.pages[0].scene.nodes.map(({ primitives }) => primitives),
    before.map(({ primitives }) => primitives),
  );
  assert(composed.pages[0].scene.nodes.every((node) => node.icon === undefined));
});

test('self-use retains one glyph per kind and distinct artwork across every page', () => {
  const document = selfDocument();
  const views = architecturePublisherInteractiveScenes();
  const byKind = new Map();
  const byGlyph = new Map();
  for (const [id, view] of Object.entries(views)) {
    const scene = composeArchitecturePublisherInteractiveScene(
      document,
      { title: 'Architecture Publisher' },
      { id, label: view.label, ...view.composition },
    );
    for (const node of scene.nodes) {
      assert.equal(SELF_FIGURE_TYPES[node.figureKind], node.icon);
      assert(
        !byKind.has(node.figureKind) || byKind.get(node.figureKind) === node.icon,
        `${id}:${node.id}: one kind changed glyph`,
      );
      assert(
        !byGlyph.has(node.icon) || byGlyph.get(node.icon) === node.figureKind,
        `${id}:${node.id}: different kinds share glyph`,
      );
      byKind.set(node.figureKind, node.icon);
      byGlyph.set(node.icon, node.figureKind);
    }
  }
  assert.equal(byKind.size, 26);
});

test('neutral composition preserves the same catalog rather than dropping visual policy', () => {
  const meaning = ordinaryMeaning();
  meaning.completeness = 'finite-unqualified-obligations';
  meaning.questions = [];
  meaning.editorial.narrative = { summary: 'Selected components.' };
  meaning.media.interactive.views[0].questionIds = [];
  meaning.refinement.media.interactive = { kind: 'neutral' };
  const scene = composeInteractiveEditionScene(meaning);
  assert.deepEqual(scene.visualPolicy.figureTypes, { component: 'lucide:box' });
  assert(scene.pages[0].nodes.every(({ icon }) => icon === 'lucide:box'));
});

test('resolved artwork catches aliases, unsupported names and cross-page drift', async () => {
  const supply = await loadFigureIconSupply();
  assert.doesNotThrow(() => validateFigureIconCatalog(SELF_FIGURE_TYPES, supply));
  assert.throws(
    () =>
      validateFigureIconCatalog(
        { one: 'lucide:alarm-check', two: 'lucide:alarm-clock-check' },
        supply,
      ),
    { code: 'figure_type_glyph_conflict' },
  );
  assert.throws(() => validateFigureIconCatalog({ unused: 'lucide:missing' }, supply), {
    code: 'figure_type_glyph_unsupported',
  });
  assert.throws(
    () =>
      validateResolvedFigureIcons(
        [
          { nodes: [{ kind: 'component', icon: 'lucide:box' }] },
          { nodes: [{ kind: 'component', icon: 'lucide:network' }] },
        ],
        supply,
      ),
    { code: 'figure_type_glyph_conflict' },
  );
});

test('a static-only build rejects missing type authority before writing any candidate', async (t) => {
  const selected = await selectedNativeEdition(t, { media: ['static'] });
  delete selected.project.visualPolicy.figureTypes;
  await fs.writeFile(
    path.join(selected.root, 'edition/project.json'),
    JSON.stringify(selected.project),
  );
  const output = path.join(selected.root, 'candidate');
  await assert.rejects(compileEditionCandidateInput(selected.file, selected.digest, output), {
    code: 'figure_types_required',
  });
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
  assert(!(await fs.readdir(selected.root)).some((name) => name.startsWith('.edition-candidate-')));
});

test('static-exclusive and later static-view kinds cannot hide behind interactive coverage', async (t) => {
  for (const laterView of [false, true])
    await t.test(laterView ? 'later view' : 'static-exclusive view', async (t) => {
      const selected = await selectedNativeEdition(t);
      const model = Buffer.from(
        "specification { element component\n element worker }\nmodel { alpha = component 'Alpha'\n beta = component 'Beta'\n gamma = worker 'Gamma'\n alpha -> beta }\n",
      );
      const views = Buffer.from(
        'views { view overview { include alpha, beta }\n view later { include gamma } }\n',
      );
      for (const [id, content] of [
        ['model', model],
        ['views', views],
      ]) {
        const source = selected.request.sources.find((item) => item.id === id);
        source.input.sha256 = sha(content);
        await fs.writeFile(path.join(selected.root, source.input.path), content);
      }
      selected.project.questions.push({
        id: 'worker-shape',
        audience: 'maintainer',
        text: 'Where is the worker?',
      });
      selected.project.scope.selections.push({
        id: 'later',
        namespace: 'fixture/views',
        kind: 'reference',
        reference: 'view:later',
        questions: ['worker-shape'],
      });
      selected.project.presentation.static.views = [
        ...(laterView ? [{ id: 'overview', questions: ['shape'] }] : []),
        { id: 'later', questions: ['worker-shape'] },
      ];
      await fs.writeFile(
        path.join(selected.root, 'edition/project.json'),
        JSON.stringify(selected.project),
      );
      const bytes = Buffer.from(JSON.stringify(selected.request));
      await fs.writeFile(selected.file, bytes);
      const output = path.join(selected.root, 'candidate');
      await assert.rejects(compileEditionCandidateInput(selected.file, sha(bytes), output), {
        code: 'figure_type_missing',
      });
      await assert.rejects(fs.stat(output), { code: 'ENOENT' });
    });
});

test('ordinary static composition preserves kinds and resolves the Edition catalog', async (t) => {
  const selected = await selectedNativeEdition(t, { media: ['static'] });
  const input = await materializeBuildRequestInput(selected.file, selected.digest);
  const meaning = structuredClone(await compileEditionMeaning(input));
  const layout = await importLikeC4Layout({
    lock: input.lock,
    readSource: input.readSource,
    view: { namespace: 'fixture/views', id: 'overview' },
  });
  meaning.refinement = { media: { static: { kind: 'neutral' } } };
  const scene = composeStaticEditionScene(meaning, layout);
  assert.deepEqual(scene.visualPolicy.figureTypes, { component: 'lucide:box' });
  assert(
    scene.nodes.every(
      (node) =>
        node.kind === 'component' && node.figureKind === 'component' && node.icon === 'lucide:box',
    ),
  );
  const untyped = structuredClone(meaning);
  untyped.editorial.visualPolicy.figureTypes['source element'] = 'lucide:circle';
  for (const selection of untyped.native.selections)
    for (const node of selection.members.elements) if (node.id === 'alpha') node.kind = null;
  const untypedScene = composeStaticEditionScene(untyped, layout);
  const alpha = untypedScene.nodes.find((node) => node.id === 'alpha');
  assert.equal(alpha.kind, null);
  assert.equal(alpha.figureKind, 'source element');
  assert.equal(alpha.icon, 'lucide:circle');
});

test('untyped static labels reserve native measured clearance below their glyph', async () => {
  const icons = await loadFigureIconSupply();
  const scene = staticEditionScene();
  scene.visualPolicy.figureTypes['source element'] = 'lucide:circle';
  Object.assign(scene.nodes[0], {
    kind: null,
    figureKind: 'source element',
    icon: 'lucide:circle',
    label: 'ABCDEFG ABCDEFG',
    height: 64,
  });
  assert.throws(() => composeStaticEditionSvg(scene, { icons }), {
    code: 'static_edition_node_unrepresentable',
  });
  scene.nodes[0].height = 86;
  scene.bounds.height = 86;
  const markup = composeStaticEditionSvg(scene, { icons }).bytes.toString('utf8');
  const nodeMarkup = markup.slice(
    markup.indexOf('data-graphic-id="n-0"'),
    markup.indexOf('data-graphic-id="n-1"'),
  );
  const labels = [
    ...nodeMarkup.matchAll(
      /<text x="([\d.]+)" y="([\d.]+)"[^>]*font-size="16"[^>]*>([^<]+)<\/text>/gu,
    ),
  ].map(([, x, baseline, text]) => ({
    x: Number(x),
    baseline: Number(baseline),
    text,
    fontSize: 16,
    weight: '600',
    anchor: 'start',
  }));
  assert.equal(labels.length, 2);
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), labels);
  const glyph = nodeMarkup.match(
    /data-semantic-sigil="lucide:circle" transform="translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)"/u,
  );
  assert.ok(glyph);
  const glyphBottom = Number(glyph[2]) + 25 * Number(glyph[3]);
  for (const label of labels) {
    const ink = measurer.box(label);
    assert.ok(ink.y - glyphBottom >= 6, 'label ink must clear the stroked glyph envelope');
    assert.ok(ink.y + ink.height <= 86 - 12, 'label ink must retain bottom padding');
  }
  assert.equal(scene.nodes[0].kind, null);
});

test('static nodes and multi-view Legends paint the catalog artwork exactly once per kind', async () => {
  const icons = await loadFigureIconSupply();
  const makeScene = (id) => {
    const scene = staticEditionScene();
    scene.editorialViewId = id;
    scene.visualPolicy.figureTypes = { component: 'lucide:box' };
    scene.nodes = scene.nodes.map((node) => ({
      ...node,
      figureKind: 'component',
      icon: 'lucide:box',
    }));
    return scene;
  };
  const scene = makeScene('overview');
  const markup = composeStaticEditionSvg(scene, { icons }).bytes.toString('utf8');
  assert.equal((markup.match(/data-semantic-sigil="lucide:box"/gu) ?? []).length, 3);
  assert.equal((markup.match(/data-legend-kind="component"/gu) ?? []).length, 1);
  assert.match(
    markup,
    /data-legend-kind="component"[^>]*><g[^>]*data-semantic-sigil="lucide:box"[\s\S]*?<text[^>]*>component<\/text>/u,
  );
  const figure = composeStaticFigureSvg({
    title: scene.title,
    summary: scene.summary,
    rasterWidth: 6000,
    views: ['first', 'second'].map((id, index) => {
      const part = makeScene(id);
      return {
        id,
        scene: part,
        rendered: composeStaticEditionSvg(part, {
          icons,
          fragment: true,
          idPrefix: `static-view-${index}-`,
        }),
      };
    }),
  });
  const svg = figure.bytes.toString('utf8');
  assert.equal((svg.match(/data-legend-kind="component"/gu) ?? []).length, 2);
  assert.equal((svg.match(/data-semantic-sigil="lucide:box"/gu) ?? []).length, 6);
});

test('effective type resolution preserves null source kinds and validates the finite catalog', () => {
  const pages = [{ nodes: [{ id: 'untyped', kind: null }] }];
  const catalog = { 'source element': 'lucide:circle' };
  const selected = resolveFigureTypes(pages, catalog);
  assert.equal(selected[0].nodes[0].kind, null);
  assert.equal(selected[0].nodes[0].figureKind, 'source element');
  assert.equal(selected[0].nodes[0].icon, 'lucide:circle');
  assert.deepEqual(pages, [{ nodes: [{ id: 'untyped', kind: null }] }]);
  assert.deepEqual(neutralFigurePolicy(), { profile: 'neutral' });
  assert.deepEqual(neutralFigurePolicy({ figureTypes: catalog }), {
    profile: 'neutral',
    figureTypes: catalog,
  });
  assert.throws(() => resolveFigureTypes(pages, { ' source element': 'lucide:circle' }), {
    code: 'figure_type_invalid',
  });
  assert.throws(() => resolveFigureTypes(pages, { 'source element': 1 }), {
    code: 'figure_type_invalid',
  });
});

test('resolved kinds cannot be missing or share artwork across later pages', async () => {
  const icons = await loadFigureIconSupply();
  for (const kind of [null, '']) {
    assert.throws(
      () => validateResolvedFigureIcons([{ nodes: [{ kind, icon: 'lucide:box' }] }], icons),
      { code: 'figure_type_missing' },
    );
  }
  assert.throws(
    () =>
      validateResolvedFigureIcons(
        [
          { nodes: [{ figureKind: 'component', icon: 'lucide:box' }] },
          { nodes: [{ figureKind: 'store', icon: 'lucide:box' }] },
        ],
        icons,
      ),
    { code: 'figure_type_glyph_conflict' },
  );
  assert.throws(() => renderFigureIcon('lucide:missing', icons), {
    code: 'figure_type_glyph_unsupported',
  });
});

test('the type Legend lays out complete icon-first entries without truncation or count badges', async () => {
  const icons = await loadFigureIconSupply();
  const nodes = [
    { kind: 'source element', icon: 'lucide:circle' },
    { figureKind: 'source element', icon: 'lucide:circle' },
    { figureKind: 'repository policy', icon: 'lucide:shield-check' },
    { figureKind: 'component', icon: 'lucide:box' },
  ];
  assert.equal(composeFigureTypeLegend([], icons, 96), null);
  assert.equal(composeFigureTypeLegend([{ primitives: [] }], icons, 96), null);
  assert.throws(() => composeFigureTypeLegend(nodes, undefined, 96), {
    code: 'figure_icon_supply_required',
  });
  for (const width of [95, NaN]) {
    assert.throws(() => composeFigureTypeLegend(nodes, icons, width), {
      code: 'figure_legend_width_invalid',
    });
  }
  const result = composeFigureTypeLegend(nodes, icons, 96);
  assert.equal(result.width, 96);
  assert.ok(result.height > 52);
  const entries = [
    ...result.markup.matchAll(
      /<g data-legend-kind="([^"]+)"[^>]*>([\s\S]*?)(?=<g data-legend-kind=|$)/gu,
    ),
  ];
  assert.deepEqual(
    entries.map(([, kind]) => kind),
    ['source element', 'repository policy', 'component'],
  );
  for (const [, kind, entry] of entries) {
    assert.ok(entry.indexOf('data-semantic-sigil=') < entry.indexOf('<text'));
    assert.equal(
      [...entry.matchAll(/<text[^>]*>([^<]+)<\/text>/gu)].map(([, text]) => text).join(''),
      kind,
    );
  }
  assert.doesNotMatch(result.markup, /legend-count|>\d+<\/text>/u);
});

test('native icon seams fail closed in private copies without changing frozen supply', async (t) => {
  const icons = await loadFigureIconSupply();
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-icon-seam-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = fileURLToPath(
    new URL('../packages/publisher/renderers/archify/supply/', import.meta.url),
  );
  const members = [
    'schemas/common.schema.json',
    'renderers/shared/generated-validators.mjs',
    'renderers/shared/utils.mjs',
    'renderers/shared/i18n.mjs',
    'renderers/architecture/render-architecture.mjs',
  ];
  const originals = await Promise.all(
    members.map((member) => fs.readFile(path.join(source, member))),
  );
  const scene = { nodes: [{ figureKind: 'component', icon: 'lucide:box' }] };
  for (const changed of members.slice(1).filter((member) => !member.endsWith('/i18n.mjs'))) {
    for (const [index, member] of members.entries()) {
      await fs.mkdir(path.dirname(path.join(root, member)), { recursive: true });
      await fs.writeFile(path.join(root, member), originals[index]);
    }
    await fs.writeFile(path.join(root, changed), 'Unexpected upstream implementation.');
    await assert.rejects(() => adaptArchitectureIcons(root, scene, icons), {
      code: 'render_icon_seam_invalid',
    });
  }
  for (const [index, member] of members.entries()) {
    await fs.writeFile(path.join(root, member), originals[index]);
  }
  assert.equal(
    await adaptArchitectureIcons(
      root,
      { nodes: [{ kind: 'component', icon: 'lucide:box' }] },
      icons,
    ),
    true,
  );
  const native = await import(pathToFileURL(path.join(root, 'renderers/shared/utils.mjs')));
  assert.match(
    native.renderSemanticSigil('component', { icon: 'lucide:box', x: 3, y: 7 }),
    /data-semantic-sigil="lucide:box"/u,
  );
  assert.equal(
    await adaptArchitectureIcons(root, { nodes: [{ kind: 'component' }] }, icons),
    false,
  );
  assert.equal(
    await adaptArchitectureIcons(
      root,
      { nodes: [{ figureKind: 'adornment', adornment: {} }] },
      icons,
    ),
    false,
  );
  for (const [index, member] of members.entries()) {
    assert.deepEqual(await fs.readFile(path.join(source, member)), originals[index]);
  }
});
