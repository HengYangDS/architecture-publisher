import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { validateEditionProject } from '../packages/publisher/src/edition/authoring.mjs';
import { selectedEditionResources } from '../packages/publisher/src/edition/resources.mjs';
import { parseSelectedSceneRefinement } from '../packages/publisher/src/edition/refinement.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import * as fontModule from '../packages/publisher/renderers/resvg/font.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import { readFontFace } from '../packages/publisher/renderers/resvg/font.mjs';
import * as rasterRuntime from '../packages/publisher/renderers/resvg/supply/resvg/index.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/compiler/build-input.mjs';
import { editionProviderPackageDigest } from '../packages/publisher/src/provider/index.mjs';
import { compileSelectedEditionCandidateInput } from '../packages/publisher/src/compiler/successor.mjs';
import { renderArchitectureScene } from '../packages/publisher/renderers/archify/index.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { embedFonts } from '../packages/publisher/src/compiler/media.mjs';
import sax from '../packages/publisher/renderers/resvg/supply/sax/sax.cjs';
import { chromium } from 'playwright-core';
import { rasterizeBytes } from '../packages/publisher/renderers/resvg/public.mjs';
import { inspectRgbaPngCanvas } from '../packages/publisher/src/qualification/static/png.mjs';
import { withOwnedProcessScope } from '../packages/publisher/src/runtime/process-tree.mjs';
import { spawnSync } from 'node:child_process';
import { meaningFor, compose, composedScene } from './fixtures/authored-routes.mjs';
import { assertGlyphPaintBounds, observeGlyphPaintEnvelope } from './fixtures/font-paint.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function selectedWorkerFixture(t, body) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-measure-worker-')),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const renderer = path.join(root, 'packages/publisher/renderers/resvg');
  await fs.cp(new URL('../packages/publisher/renderers/resvg/', import.meta.url), renderer, {
    recursive: true,
  });
  await fs.cp(
    new URL('../packages/publisher/src/protocol/', import.meta.url),
    path.join(root, 'packages/publisher/src/protocol'),
    { recursive: true },
  );
  await fs.cp(
    new URL('../packages/publisher/src/runtime/', import.meta.url),
    path.join(root, 'packages/publisher/src/runtime'),
    { recursive: true },
  );
  await fs.writeFile(path.join(renderer, 'worker.mjs'), body);
  const module = await import(pathToFileURL(path.join(renderer, 'measurement.mjs')).href);
  return { root, module };
}

function selectedProject(supply) {
  return {
    schema: 'architecture.edition-project/v1',
    id: 'font-reading',
    editor: 'example:editor',
    title: 'Exact selected fonts',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'Which exact routes are connected?' }],
    scope: {
      sourceNamespaces: ['fixture/routes'],
      selections: [
        {
          id: 'request',
          namespace: 'fixture/routes',
          kind: 'reference',
          reference: 'relation:request',
          questions: ['shape'],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: 'Read selected source routes with explicit font resources.' },
    presentation: {
      static: { views: [{ id: 'overview', questions: ['shape'] }], width: 1800 },
      interactive: { views: [{ id: 'overview', questions: ['shape'] }] },
    },
    visualPolicy: {
      profile: 'neutral',
      override: 'refinement.json',
      fonts: [
        {
          id: 'reading',
          family: 'JetBrains Mono',
          faces: supply.fonts.map(({ weight, sha256 }) => ({
            weight: String(weight),
            ref: `fonts/${weight}.ttf`,
            sha256,
          })),
          distribution: [{ ref: 'fonts/OFL.txt', sha256: supply.license.sha256 }],
        },
      ],
    },
  };
}

test('Edition font selection binds exact face resources and attributed evidence', async () => {
  const value = selectedProject(await loadBundledFonts());
  assert.doesNotThrow(() => validateEditionProject(value));
  const duplicate = structuredClone(value);
  duplicate.visualPolicy.fonts.push(structuredClone(value.visualPolicy.fonts[0]));
  assert.throws(() => validateEditionProject(duplicate), { code: 'edition_project_invalid' });
  const absent = structuredClone(value);
  absent.visualPolicy.fonts[0].distribution = [];
  assert.throws(() => validateEditionProject(absent), { code: 'edition_project_invalid' });
  const variable = structuredClone(value);
  variable.visualPolicy.fonts[0].faces[0].weight = '400 700';
  assert.throws(() => validateEditionProject(variable), { code: 'edition_project_invalid' });
  const repeatedWeight = structuredClone(value);
  repeatedWeight.visualPolicy.fonts[0].faces.push(
    structuredClone(repeatedWeight.visualPolicy.fonts[0].faces[0]),
  );
  assert.throws(() => validateEditionProject(repeatedWeight), { code: 'edition_project_invalid' });
  const excessive = structuredClone(value);
  excessive.visualPolicy.fonts[0].distribution = Array.from({ length: 64 }, (_, index) => ({
    ref: `fonts/evidence-${index}.txt`,
    sha256: 'a'.repeat(64),
  }));
  assert.throws(() => validateEditionProject(excessive), { code: 'edition_project_invalid' });
});

test('the shared Edition resource owner deduplicates exact pins and refuses conflicting identities', async () => {
  const project = selectedProject(await loadBundledFonts());
  const first = project.visualPolicy.fonts[0];
  const second = structuredClone(first);
  second.id = 'second';
  project.visualPolicy.fonts.push(second);
  const resources = selectedEditionResources(project);
  assert.deepEqual(resources, [
    { ref: 'refinement.json', sha256: null },
    ...first.faces.map(({ ref, sha256 }) => ({ ref, sha256 })),
    ...first.distribution,
  ]);
  for (const mutate of [
    (value) => (value.visualPolicy.fonts[1].id = first.id),
    (value) => value.visualPolicy.fonts[0].faces.push(structuredClone(first.faces[0])),
    (value) => (value.visualPolicy.fonts[1].faces[0].sha256 = 'b'.repeat(64)),
    (value) => (value.visualPolicy.fonts[1].faces[0].ref = 'Fonts/400.ttf'),
    (value) => (value.visualPolicy.override = first.faces[0].ref),
  ]) {
    const changed = structuredClone(project);
    mutate(changed);
    assert.throws(() => selectedEditionResources(changed), { code: 'edition_project_invalid' });
  }
  const excessive = structuredClone(project);
  excessive.visualPolicy.fonts[0].distribution = Array.from({ length: 64 }, (_, index) => ({
    ref: `fonts/evidence-${index}.txt`,
    sha256: 'a'.repeat(64),
  }));
  assert.throws(() => selectedEditionResources(excessive), { code: 'edition_project_invalid' });
  assert.deepEqual(selectedEditionResources({ visualPolicy: { profile: 'neutral' } }), []);
});

test('authored media select optional default and text-local fonts without widening neutral seams', () => {
  const value = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      static: meaningFor('static').refinement.media.static,
      interactive: meaningFor('interactive').refinement.media.interactive,
    },
  };
  value.media.static.font = 'reading';
  value.media.interactive.font = 'reading';
  value.media.static.scene.texts[0].font = 'reading';
  value.media.static.scene.texts[0].weight = '500';
  value.media.interactive.pages[0].scene.texts[0].weight = '700';
  assert.doesNotThrow(() =>
    parseSelectedSceneRefinement(
      Buffer.from(JSON.stringify(value)),
      ['static', 'interactive'],
      'a'.repeat(64),
    ),
  );
  value.media.interactive = { kind: 'neutral', font: 'reading' };
  assert.throws(
    () =>
      parseSelectedSceneRefinement(
        Buffer.from(JSON.stringify(value)),
        ['static', 'interactive'],
        'a'.repeat(64),
      ),
    { code: 'scene_refinement_invalid' },
  );
});

test('exact normal 400 500 600 700 faces measure without synthetic weight fallback', async () => {
  const supply = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(
    supply,
    ['400', '500', '600', '700'].map((weight) => ({
      text: 'Source route',
      fontSize: 16,
      weight,
      family: 'JetBrains Mono',
      anchor: 'start',
      x: 30,
      baseline: 60,
    })),
  );
  for (const weight of ['400', '500', '600', '700']) {
    const box = measurer.box({
      text: 'Source route',
      fontSize: 16,
      weight,
      family: 'JetBrains Mono',
      anchor: 'start',
      x: 30,
      baseline: 60,
    });
    assert(box.width > 0 && box.height > 0);
  }
  assert.throws(
    () =>
      measurer.box({
        text: 'Source route',
        fontSize: 16,
        weight: '500',
        family: 'Unselected Family',
        anchor: 'start',
        x: 30,
        baseline: 60,
      }),
    { code: 'authored_canvas_font_unselected' },
  );
});

test('measurement refuses a declared family or weight that disagrees with actual font bytes', async () => {
  const supply = await loadBundledFonts();
  await assert.rejects(
    createBundledTextMeasurer({
      ...supply,
      fonts: supply.fonts.map((face) => ({ ...face, family: 'Invented Family' })),
    }),
    { code: 'authored_canvas_font_identity_mismatch' },
  );
  await assert.rejects(
    createBundledTextMeasurer({
      ...supply,
      fonts: supply.fonts.map((face) => (face.weight === 400 ? { ...face, weight: 600 } : face)),
    }),
    { code: 'authored_canvas_font_identity_mismatch' },
  );
});

test('measurement refuses malformed or over-budget font sets before native execution', async () => {
  const supply = await loadBundledFonts();
  const face = supply.fonts[0];
  for (const fonts of [
    Array.from({ length: 17 }, () => face),
    [null],
    [{ ...face, bytes: 'not font bytes' }],
    [{ ...face, bytes: Buffer.alloc(8 * 1024 * 1024 + 1) }],
    Array.from({ length: 5 }, () => ({ ...face, bytes: Buffer.alloc(8 * 1024 * 1024) })),
    [{ ...face, weight: 900 }],
  ])
    await assert.rejects(createBundledTextMeasurer({ ...supply, fonts }), {
      code: 'authored_canvas_font_measurement_invalid',
    });
});

test('same actual face with different bytes cannot overwrite a selected measured identity', async () => {
  const supply = await loadBundledFonts();
  const regular = supply.fonts.find(({ weight }) => weight === 400);
  const different = Buffer.concat([regular.bytes, Buffer.from('different exact resource')]);
  await assert.rejects(
    createBundledTextMeasurer({
      ...supply,
      fonts: [...supply.fonts, { ...regular, bytes: different, sha256: sha(different) }],
    }),
    { code: 'authored_canvas_font_identity_ambiguous' },
  );
});

async function fontInput(t) {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-font-input-')),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const supply = await loadBundledFonts();
  const project = selectedProject(supply);
  const resources = new Map([
    ['refinement.json', Buffer.from('{"selected":"resource bytes"}')],
    ...supply.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ['fonts/OFL.txt', supply.license.bytes],
  ]);
  await fs.mkdir(path.join(root, 'edition/fonts'), { recursive: true });
  await fs.mkdir(path.join(root, 'sources'));
  const native = Buffer.from('{"selected":"source bytes"}');
  await fs.writeFile(path.join(root, 'sources/model.json'), native);
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      {
        id: 'source',
        namespace: 'fixture/routes',
        format: { id: 'example/native-json', version: '1' },
        claimant: 'example:source',
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'pin', path: 'sources/model.json', sha256: sha(native) },
      },
    ],
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
  const requestBytes = Buffer.from(JSON.stringify(request));
  const requestPath = path.join(root, 'build-request.json');
  await fs.writeFile(requestPath, requestBytes);
  const save = async () => {
    await fs.writeFile(path.join(root, 'edition/project.json'), JSON.stringify(project));
    for (const [ref, bytes] of resources)
      await fs.writeFile(path.join(root, 'edition', ref), bytes);
  };
  await save();
  return {
    root,
    project,
    resources,
    save,
    materialize: () => materializeBuildRequestInput(requestPath, sha(requestBytes)),
  };
}

test('direct input materializes the exact font closure once and survives consumer relocation', async (t) => {
  const input = await fontInput(t);
  const selected = await input.materialize();
  assert.equal(selected.lock.edition.resources.length, 6);
  for (const [ref, bytes] of input.resources)
    assert.deepEqual(selected.readEditionResource(ref), bytes);
  const relocated = path.join(input.root, 'relocated');
  await fs.mkdir(relocated);
  await fs.cp(path.join(input.root, 'edition'), path.join(relocated, 'edition'), {
    recursive: true,
  });
  await fs.cp(path.join(input.root, 'sources'), path.join(relocated, 'sources'), {
    recursive: true,
  });
  await fs.copyFile(
    path.join(input.root, 'build-request.json'),
    path.join(relocated, 'build-request.json'),
  );
  const bytes = await fs.readFile(path.join(relocated, 'build-request.json'));
  const moved = await materializeBuildRequestInput(
    path.join(relocated, 'build-request.json'),
    sha(bytes),
  );
  assert.equal(moved.lockSha256, selected.lockSha256);
});

test('a changed selected face pin is refused before semantic compilation', async (t) => {
  const input = await fontInput(t);
  await fs.appendFile(path.join(input.root, 'edition/fonts/500.ttf'), 'changed');
  await assert.rejects(input.materialize(), {
    code: 'materialized_edition_resource_digest_mismatch',
  });
});

test('a missing selected distribution resource cannot be recovered from the bundled license', async (t) => {
  const input = await fontInput(t);
  await fs.unlink(path.join(input.root, 'edition/fonts/OFL.txt'));
  await assert.rejects(input.materialize(), { code: 'ENOENT' });
});

test('exact selected font closure is identical across direct declarative and executable delivery', async (t) => {
  const input = await fontInput(t);
  const direct = await input.materialize();
  const requestPath = path.join(input.root, 'build-request.json');
  const request = JSON.parse(await fs.readFile(requestPath, 'utf8'));
  const projectBytes = await fs.readFile(path.join(input.root, 'edition/project.json'));
  const native = await fs.readFile(path.join(input.root, 'sources/model.json'));
  const manifest = {
    schema: 'architecture.edition-provider/v2',
    provider: { id: 'font-input', revision: '1' },
    selected: {
      native: [
        {
          id: 'model',
          namespace: 'fixture/routes',
          claimant: 'example:source',
          format: { id: 'example/native-json', version: '1' },
          revision: { kind: 'content', algorithm: 'sha256' },
          bytes: native.length,
          sha256: sha(native),
        },
      ],
      derived: [],
      edition: {
        id: input.project.id,
        editor: input.project.editor,
        bytes: projectBytes.length,
        sha256: sha(projectBytes),
        resources: [...input.resources].map(([ref, content]) => ({
          ref,
          bytes: content.length,
          sha256: sha(content),
        })),
      },
    },
    delivery: {
      kind: 'declarative',
      files: [
        { kind: 'native', id: 'model', path: 'sources/model.json' },
        { kind: 'edition', id: input.project.id, path: 'edition/project.json' },
        ...[...input.resources.keys()].map((ref) => ({
          kind: 'edition-resource',
          id: ref,
          path: `edition/${ref}`,
        })),
      ],
    },
  };
  request.edition = { kind: 'provider', provider: 'selected-font-input' };
  request.sources = [];
  request.providers = [
    { id: 'selected-font-input', manifest: 'provider.json', sha256: 'a'.repeat(64) },
  ];
  const save = async () => {
    const bytes = Buffer.from(JSON.stringify(manifest));
    await fs.writeFile(path.join(input.root, 'provider.json'), bytes);
    request.providers[0].sha256 = sha(bytes);
    const requestBytes = Buffer.from(JSON.stringify(request));
    await fs.writeFile(requestPath, requestBytes);
    return sha(requestBytes);
  };
  const declarative = await materializeBuildRequestInput(requestPath, await save());
  assert.equal(declarative.lockSha256, direct.lockSha256);
  const packageRoot = path.join(input.root, 'provider-package');
  await fs.mkdir(packageRoot);
  const packageJson = Buffer.from(
    JSON.stringify({
      name: '@fixture/font-provider',
      version: '1.0.0',
      type: 'module',
      exports: { './provider': './provider.mjs' },
    }),
  );
  await fs.writeFile(path.join(packageRoot, 'package.json'), packageJson);
  await fs.writeFile(
    path.join(packageRoot, 'provider.mjs'),
    "export async function materializeEditionProvider() { return { schema: 'architecture.edition-provider-reply/v2', derived: [] }; }\n",
  );
  const resources = [...input.resources].map(([ref, content], index) => ({
    id: `resource-${index}`,
    ref,
    content,
  }));
  manifest.delivery = {
    kind: 'executable',
    package: {
      name: '@fixture/font-provider',
      version: '1.0.0',
      packageJsonSha256: sha(packageJson),
      contentSha256: await editionProviderPackageDigest(packageRoot),
      entrypoint: './provider',
    },
    inputs: [
      {
        id: 'native',
        path: 'sources/model.json',
        mediaType: 'application/json',
        bytes: native.length,
        sha256: sha(native),
      },
      {
        id: 'edition',
        path: 'edition/project.json',
        mediaType: 'application/json',
        bytes: projectBytes.length,
        sha256: sha(projectBytes),
      },
      ...resources.map(({ id, ref, content }) => ({
        id,
        path: `edition/${ref}`,
        mediaType: ref.endsWith('.ttf') ? 'font/ttf' : 'application/octet-stream',
        bytes: content.length,
        sha256: sha(content),
      })),
    ],
    nativeInputs: [{ item: 'model', input: 'native' }],
    editionInput: 'edition',
    editionResourceInputs: resources.map(({ id, ref }) => ({ ref, input: id })),
  };
  request.providers[0].packageRoot = 'provider-package';
  const digest = await save();
  const executable = await materializeBuildRequestInput(requestPath, digest, [
    { id: 'selected-font-input', manifestSha256: request.providers[0].sha256 },
  ]);
  assert.equal(executable.lockSha256, direct.lockSha256);
  assert.notDeepEqual(executable.invocations, declarative.invocations);
  for (const [ref, bytes] of input.resources)
    assert.deepEqual(executable.readEditionResource(ref), bytes);
});

test('logical aliases and conflicting pins cannot create two font resource authorities', async () => {
  const value = selectedProject(await loadBundledFonts());
  value.visualPolicy.fonts[0].distribution.push({ ref: 'fonts/OFL.txt', sha256: 'b'.repeat(64) });
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
  value.visualPolicy.fonts[0].distribution.pop();
  value.visualPolicy.fonts[0].faces[0].ref = 'fonts/ofl.txt';
  assert.throws(() => validateEditionProject(value), { code: 'edition_project_invalid' });
});

test('authored Archify page harmonizes measured default faces instead of hiding conflicts with an alias', async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-font-page-')),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const fonts = await loadBundledFonts();
  const scene = structuredClone(
    composedScene(compose(meaningFor('interactive'), 'interactive'), 'interactive'),
  );
  const measurer = await createBundledTextMeasurer(fonts, scene.texts);
  scene.texts = scene.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  const output = path.join(root, 'page.html');
  await renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, 'utf8');
  assert.equal(html.includes('Architecture Statement'), false);
  const css = /<style id="archify-fonts">([\s\S]*?)<\/style>/u.exec(html)?.[1];
  assert.ok(css);
  assert.equal(css.includes('data:font/woff2'), false);
  for (const { bytes } of fonts.fonts) assert.equal(css.includes(bytes.toString('base64')), true);
  assert.equal(html.includes('font-family="&quot;JetBrains Mono&quot;"'), true);
});

test('selected font resolution records consumed faces and refuses unavailable selected weights', async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  project.visualPolicy.fonts[0].faces = project.visualPolicy.fonts[0].faces.filter(
    ({ weight }) => weight === '400',
  );
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ['fonts/OFL.txt', bundled.license.bytes],
  ]);
  assert.equal(typeof fontModule.resolveAuthoredFontSupply, 'function');
  const resolve = (texts, backendDefaults = false) =>
    fontModule.resolveAuthoredFontSupply({
      catalogue: project.visualPolicy.fonts,
      defaultFont: 'reading',
      texts,
      readResource: (ref) => resources.get(ref),
      bundled,
      backendDefaults,
    });
  const label = { text: 'Source', weight: '400', visible: true };
  const selected = await resolve([label]);
  assert.deepEqual(
    selected.selectedFaces.map(({ weight }) => weight),
    [400],
  );
  assert.equal(selected.defaultFamily, 'JetBrains Mono');
  await assert.rejects(resolve([{ ...label, weight: '500' }], true), {
    code: 'authored_canvas_font_unselected',
  });
  await assert.rejects(resolve([{ ...label, font: 'unknown' }]), {
    code: 'authored_canvas_font_unselected',
  });
});

test('unused catalogue faces do not become a sibling medium font receipt', async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ['fonts/OFL.txt', bundled.license.bytes],
  ]);
  assert.equal(typeof fontModule.resolveAuthoredFontSupply, 'function');
  const resolve = () =>
    fontModule.resolveAuthoredFontSupply({
      catalogue: project.visualPolicy.fonts,
      defaultFont: 'reading',
      texts: [{ text: 'Source', weight: '400', visible: true }],
      readResource: (ref) => resources.get(ref),
      bundled,
      backendDefaults: false,
    });
  const first = await resolve();
  project.visualPolicy.fonts[0].faces.find(({ weight }) => weight === '700').sha256 = 'b'.repeat(
    64,
  );
  const second = await resolve();
  assert.equal(second.sha256, first.sha256);
  assert.deepEqual(second.selectedFaces, first.selectedFaces);
});

test('a selected normal face conflicting with page defaults is rejected even under an author-chosen id', async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const regular = bundled.fonts.find(({ weight }) => weight === 400);
  const altered = Buffer.concat([regular.bytes, Buffer.from('different exact bytes')]);
  project.visualPolicy.fonts[0].faces.find(({ weight }) => weight === '400').sha256 = sha(altered);
  const resources = new Map([
    ['fonts/400.ttf', altered],
    ['fonts/OFL.txt', bundled.license.bytes],
  ]);
  assert.equal(typeof fontModule.resolveAuthoredFontSupply, 'function');
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      catalogue: project.visualPolicy.fonts,
      defaultFont: 'reading',
      texts: [{ text: 'Source', weight: '400', visible: true }],
      readResource: (ref) => resources.get(ref),
      bundled,
      backendDefaults: true,
    }),
    { code: 'authored_canvas_font_identity_ambiguous' },
  );
});

test('selected font resolution rejects invalid inputs and unavailable declared evidence', async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ['fonts/OFL.txt', bundled.license.bytes],
  ]);
  const input = {
    catalogue: project.visualPolicy.fonts,
    defaultFont: 'reading',
    texts: [{ text: 'Source', weight: '400', visible: true }],
    readResource: (ref) => resources.get(ref),
    bundled,
  };
  for (const change of [{ texts: null }, { catalogue: null }, { bundled: { fonts: null } }])
    await assert.rejects(fontModule.resolveAuthoredFontSupply({ ...input, ...change }), {
      code: 'authored_canvas_font_measurement_invalid',
    });
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      ...input,
      catalogue: [...input.catalogue, input.catalogue[0]],
    }),
    { code: 'authored_canvas_font_identity_ambiguous' },
  );
  await assert.rejects(fontModule.resolveAuthoredFontSupply({ ...input, defaultFont: 'unknown' }), {
    code: 'authored_canvas_font_unselected',
  });
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      ...input,
      defaultFont: undefined,
      texts: [{ text: 'Source', weight: '500', visible: true }],
      bundled: { ...bundled, fonts: bundled.fonts.filter(({ weight }) => weight === 400) },
    }),
    { code: 'authored_canvas_font_unselected' },
  );
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({ ...input, readResource: undefined }),
    { code: 'authored_canvas_font_unselected' },
  );
  for (const change of [
    { readResource: () => 'not resource bytes' },
    { readResource: (ref) => (ref.endsWith('.txt') ? 'not evidence bytes' : resources.get(ref)) },
    { readResource: (ref) => (ref.endsWith('.txt') ? Buffer.alloc(0) : resources.get(ref)) },
    { readResource: (ref) => (ref.endsWith('.txt') ? Buffer.from('changed') : resources.get(ref)) },
  ])
    await assert.rejects(fontModule.resolveAuthoredFontSupply({ ...input, ...change }), {
      code: 'materialized_edition_resource_digest_mismatch',
    });
  const hidden = { text: 'Retained hidden label', weight: '700', visible: false };
  const selected = await fontModule.resolveAuthoredFontSupply({ ...input, texts: [hidden] });
  assert.deepEqual(selected.texts, [hidden]);
  assert.equal(selected.selectedFaces.length, 1, 'only framing consumes a face');
  const second = structuredClone(input.catalogue[0]);
  second.id = 'second';
  second.distribution[0].sha256 = 'b'.repeat(64);
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      ...input,
      catalogue: [...input.catalogue, second],
      texts: [{ text: 'Source', font: 'second', weight: '700', visible: true }],
    }),
    { code: 'authored_canvas_font_identity_ambiguous' },
  );
});

test('exact font CSS remains valid XML when an actual family contains reserved characters', async () => {
  const bundled = await loadBundledFonts();
  const font = bundled.fonts[0];
  const bytes = embedFonts(
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><text>Source</text></svg>'),
    [{ ...font, family: 'Example & Evidence' }],
    bundled.license,
  );
  const parser = sax.parser(true, { xmlns: true });
  let style = false;
  let css = '';
  parser.onopentag = ({ local }) => {
    style = local === 'style';
  };
  parser.onclosetag = () => {
    style = false;
  };
  parser.ontext = (text) => {
    if (style) css += text;
  };
  assert.doesNotThrow(() => parser.write(bytes.toString('utf8')).close());
  assert.equal(css.includes('Example & Evidence'), true);
});

test('font resources are resolved once per consumed face rather than once per graphic occurrence', async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ['fonts/OFL.txt', bundled.license.bytes],
  ]);
  const read = new Map();
  const supply = await fontModule.resolveAuthoredFontSupply({
    catalogue: project.visualPolicy.fonts,
    defaultFont: 'reading',
    texts: Array.from({ length: 64 }, () => ({ text: 'Source', weight: '400', visible: true })),
    readResource(ref) {
      read.set(ref, (read.get(ref) ?? 0) + 1);
      return resources.get(ref);
    },
    bundled,
  });
  assert.equal(supply.texts.length, 64);
  assert.deepEqual(
    [...read],
    [
      ['fonts/400.ttf', 1],
      ['fonts/OFL.txt', 1],
    ],
  );
});

test('interactive text-only 700 default does not consume phantom custom 400 framing', async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  project.visualPolicy.fonts[0].faces = project.visualPolicy.fonts[0].faces.filter(
    ({ weight }) => weight === '700',
  );
  const resources = new Map([
    ['fonts/700.ttf', bundled.fonts.find(({ weight }) => weight === 700).bytes],
    ['fonts/OFL.txt', bundled.license.bytes],
  ]);
  const supply = await fontModule.resolveAuthoredFontSupply({
    catalogue: project.visualPolicy.fonts,
    defaultFont: 'reading',
    texts: [{ text: 'Source', weight: '700', visible: true }],
    readResource: (ref) => resources.get(ref),
    bundled,
    backendDefaults: true,
    includeFraming: false,
  });
  assert.deepEqual(
    supply.selectedFaces.map(({ weight }) => weight),
    [700],
  );
});

test('unused authored selector is rejected rather than presented as installed page typography', async () => {
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  await assert.rejects(
    fontModule.resolveAuthoredFontSupply({
      catalogue: project.visualPolicy.fonts,
      defaultFont: 'reading',
      texts: [],
      readResource: () => bundled.fonts[0].bytes,
      bundled,
      backendDefaults: true,
      includeFraming: false,
    }),
    { code: 'authored_canvas_font_selection_unused' },
  );
});

test('default OFL and selected distribution evidence survive export-aware font stylesheet replacement', async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'architecture-font-notices-')),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const bundled = await loadBundledFonts();
  const project = selectedProject(bundled);
  const notice = Buffer.from('Selected static font attribution and distribution evidence.');
  project.visualPolicy.fonts[0].distribution = [{ ref: 'fonts/NOTICE.txt', sha256: sha(notice) }];
  const resources = new Map([
    ...bundled.fonts.map(({ weight, bytes }) => [`fonts/${weight}.ttf`, bytes]),
    ['fonts/NOTICE.txt', notice],
  ]);
  const scene = structuredClone(
    composedScene(compose(meaningFor('interactive'), 'interactive'), 'interactive'),
  );
  const supply = await fontModule.resolveAuthoredFontSupply({
    catalogue: project.visualPolicy.fonts,
    defaultFont: 'reading',
    texts: scene.texts,
    readResource: (ref) => resources.get(ref),
    bundled,
    backendDefaults: true,
    includeFraming: false,
  });
  const measured = await createBundledTextMeasurer(supply, supply.texts);
  const painted = {
    ...scene,
    texts: supply.texts.map((label) => ({ ...label, box: measured.box(label) })),
  };
  const output = path.join(root, 'page.html');
  await renderArchitectureScene({ scene: painted, output, fontSupply: supply });
  const html = await fs.readFile(output, 'utf8');
  const css = /<style id="archify-fonts">([\s\S]*?)<\/style>/u.exec(html)?.[1];
  assert(css.includes('SIL OPEN FONT LICENSE'));
  assert(css.includes(notice.toString('utf8')));
});

test('font metadata selects preferred and Macintosh family records without fabricating a family', async () => {
  const original = (await loadBundledFonts()).fonts[0].bytes;
  let nameOffset;
  for (let index = 0; index < original.readUInt16BE(4); index++) {
    const entry = 12 + index * 16;
    if (original.toString('ascii', entry, entry + 4) === 'name')
      nameOffset = original.readUInt32BE(entry + 8);
  }
  assert.notEqual(nameOffset, undefined);
  const select = (nameId, macintosh = false) => {
    const bytes = Buffer.from(original);
    for (let index = 0; index < bytes.readUInt16BE(nameOffset + 2); index++) {
      const record = nameOffset + 6 + index * 12;
      if (bytes.readUInt16BE(record + 6) !== 1) continue;
      bytes.writeUInt16BE(nameId, record + 6);
      if (macintosh) {
        bytes.writeUInt16BE(1, record);
        bytes.writeUInt16BE(0, record + 2);
        bytes.writeUInt16BE(0, record + 4);
        bytes.writeUInt16BE(14, record + 8);
        const storage = nameOffset + bytes.readUInt16BE(nameOffset + 4);
        Buffer.from('JetBrains Mono').copy(bytes, storage + bytes.readUInt16BE(record + 10));
      }
    }
    return bytes;
  };
  for (const bytes of [select(16), select(1, true)]) {
    const face = readFontFace(bytes, 'invalid_selected_static_font');
    assert.equal(face.family, 'JetBrains Mono');
    assert.equal(face.weight, 400);
    assert.equal(face.aliases.has(face.family), true);
  }
  assert.throws(() => readFontFace(select(20), 'invalid_selected_static_font'), {
    code: 'invalid_selected_static_font',
  });
});

test('font metadata cannot turn one measured family into a CSS fallback list or executable value', async () => {
  const bundled = await loadBundledFonts();
  const regular = bundled.fonts[0].bytes;
  const actual = Buffer.from('JetBrains Mono', 'utf16le').swap16();
  for (const family of [
    'JetBrain, Mono',
    'Jet"BrainsMono',
    'JetBrain; Mono',
    'JetBrain\u0000 Mono',
    'JetBrains Mon ',
    'JetBrain\u007f Mono',
  ]) {
    const replacement = Buffer.from(family, 'utf16le').swap16();
    assert.equal(replacement.length, actual.length);
    const bytes = Buffer.from(regular);
    let changed = 0;
    for (
      let offset = bytes.indexOf(actual);
      offset !== -1;
      offset = bytes.indexOf(actual, offset + actual.length)
    ) {
      replacement.copy(bytes, offset);
      changed++;
    }
    assert(changed > 0);
    assert.throws(() => readFontFace(bytes, 'authored_canvas_font_measurement_invalid'), {
      code: 'authored_canvas_font_family_unsupported',
    });
  }
});

test('native raster supply measures shaped text in one bounded source-font batch', async () => {
  assert.equal(typeof rasterRuntime.Renderer.prototype.measureText, 'function');
  const module = new WebAssembly.Module(
    await fs.readFile(
      new URL('../packages/publisher/renderers/resvg/supply/resvg/index_bg.wasm', import.meta.url),
    ),
  );
  const instance = new WebAssembly.Instance(module, { './index_bg.js': rasterRuntime });
  rasterRuntime.__wbg_set_wasm(instance.exports);
  instance.exports.__wbindgen_start();
  const renderer = new rasterRuntime.Renderer();
  try {
    const fonts = await loadBundledFonts();
    for (const { bytes } of fonts.fonts) renderer.addFont(bytes);
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" font-family="JetBrains Mono"><text id="architecture-measure-0" x="100" y="200" font-size="16" font-weight="400">-&gt;</text><text id="architecture-measure-1" x="100" y="300" text-anchor="middle" font-size="16" font-weight="700">AV office ffi</text></svg>',
    );
    const boxes = renderer.measureText(svg, 2);
    assert.equal(boxes.length, 8);
    assert([...boxes].every(Number.isFinite));
    assert(boxes[2] > 0 && boxes[3] > 0 && boxes[6] > 0 && boxes[7] > 0);
    assert.throws(() => renderer.measureText(svg, 4097), /measurement_limit/u);
    assert.throws(() => renderer.measureText(svg, 3), /measurement_text_missing/u);
  } finally {
    renderer.free();
  }
});

test('authored measurer caches native shaped boxes and rejects an unprepared request', async () => {
  const fonts = await loadBundledFonts();
  const label = { text: '->', fontSize: 16, weight: '400', anchor: 'start', x: 100, baseline: 200 };
  const measured = await createBundledTextMeasurer(fonts, [label]);
  const box = measured.box(label);
  assert(Math.abs(box.width - 16.64) <= 0.01);
  assert(Math.abs(box.height - 9.44) <= 0.01);
  assert.throws(() => measured.box({ ...label, text: 'AV' }), {
    code: 'authored_canvas_measurement_unprepared',
  });
});

test('native shaped preparation preserves anchors all selected weights and exact supported text', async () => {
  const fonts = await loadBundledFonts();
  const labels = ['400', '500', '600', '700'].flatMap((weight) =>
    ['start', 'middle', 'end'].flatMap((anchor) =>
      ['AV', 'office', 'ffi', '->', '==', 'αβ', 'Привет', 'A  B'].map((text) => ({
        text,
        weight,
        anchor,
        fontSize: 16,
        x: 0,
        baseline: 0,
      })),
    ),
  );
  const measured = await createBundledTextMeasurer(fonts, labels);
  for (const label of labels) {
    const original = measured.box(label);
    const moved = measured.box({ ...label, x: 100, baseline: 200 });
    assert.equal(moved.width, original.width);
    assert.equal(moved.height, original.height);
    assert.equal(moved.x, original.x + 100);
    assert.equal(moved.y, original.y + 200);
    original.width = 0;
    assert(measured.box(label).width > 0, 'returned objects must not mutate the native cache');
  }
  for (const text of ['e\u0301', 'a\u200Db', '\u202EAV', 'שלום', 'A\tB', 'A\u00A0B'])
    await assert.rejects(createBundledTextMeasurer(fonts, [{ ...labels[0], text }]), {
      code: 'authored_canvas_text_profile_unsupported',
    });
  await assert.rejects(createBundledTextMeasurer(fonts, [{ ...labels[0], text: '问道' }]), {
    code: 'authored_canvas_glyph_missing',
  });
});

test('neutral wrapping prepares exact contiguous word candidates before native measurement', async () => {
  const textModule = await import('../packages/publisher/renderers/elk/text.mjs');
  assert.equal(typeof textModule.wrappedLabelRequests, 'function');
  const label = 'Alpha office == Omega';
  const requests = [...textModule.wrappedLabelRequests(label)];
  assert.equal(requests.length, 10);
  assert(requests.some(({ text }) => text === 'office == Omega'));
  const measure = await createBundledTextMeasurer(await loadBundledFonts(), requests);
  const result = textModule.measuredLabel(label, measure, { maximumWidth: 125 });
  assert.equal(result.lines.join(' '), label);
  assert(result.lines.length > 1);
  await assert.rejects(
    createBundledTextMeasurer(
      await loadBundledFonts(),
      textModule.wrappedLabelRequests('A '.repeat(100)),
    ),
    { code: 'authored_canvas_text_measurement_limit' },
  );
});

test('static framing participates in the same native request cache and glyph budget', async () => {
  const canvasModule = await import('../packages/publisher/renderers/svg/canvas.mjs');
  assert.equal(typeof canvasModule.authoredCanvasFramingRequest, 'function');
  const request = canvasModule.authoredCanvasFramingRequest('example:editor');
  const fonts = await loadBundledFonts();
  const measure = await createBundledTextMeasurer(fonts, [request]);
  assert(measure.box(request).height > 0);
  assert.throws(() => measure.box(canvasModule.authoredCanvasFramingRequest('another:editor')), {
    code: 'authored_canvas_measurement_unprepared',
  });
});

test(
  'native shaped ink matches real Chrome paint and exported exact-font SVG',
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? '') },
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-shaping-paint-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const fonts = await loadBundledFonts();
    const cases = ['400', '500', '600', '700'].flatMap((weight) =>
      ['AV', 'office', 'ffi', '->', '==', 'A  B'].map((text) => ({
        text,
        weight,
        fontSize: 40,
        anchor: 'start',
        x: 80,
        baseline: 120,
      })),
    );
    const measure = await createBundledTextMeasurer(fonts, cases);
    const xml = (text) =>
      text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const observations = [];
    for (const [index, label] of cases.entries()) {
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180" xml:space="preserve" text-rendering="geometricPrecision" font-family="JetBrains Mono"><text x="${label.x}" y="${label.baseline}" font-size="${label.fontSize}" font-weight="${label.weight}">${xml(label.text)}</text></svg>`,
      );
      const bound = measure.box(label);
      const selected = fonts.fonts.filter(({ weight }) => String(weight) === label.weight);
      const exactSvg = embedFonts(svg, selected, fonts.license);
      await page.setContent(
        `<style>html,body{margin:0;background:transparent}svg{display:block}</style>${exactSvg.toString('utf8')}`,
      );
      await page.evaluate(() => globalThis.document.fonts.ready);
      const browserMetrics = await page.locator('text').evaluate((node) => {
        const style = globalThis.getComputedStyle(node);
        const context = globalThis.document.createElement('canvas').getContext('2d');
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const measurements = {};
        for (const rendering of ['auto', 'geometricPrecision']) {
          context.textRendering = rendering;
          const observed = context.measureText(node.textContent);
          measurements[rendering] = {
            left: observed.actualBoundingBoxLeft,
            right: observed.actualBoundingBoxRight,
            ascent: observed.actualBoundingBoxAscent,
            descent: observed.actualBoundingBoxDescent,
            width: observed.width,
          };
        }
        return {
          text: node.textContent,
          weight: style.fontWeight,
          loaded: globalThis.document.fonts.check(`${style.fontWeight} 40px "JetBrains Mono"`),
          family: style.fontFamily,
          rendering: style.textRendering,
          measurements,
        };
      });
      assert.equal(browserMetrics.text, label.text);
      assert.equal(browserMetrics.weight, label.weight);
      assert.equal(browserMetrics.loaded, true);
      assert(browserMetrics.family.includes('JetBrains Mono'));
      const chromeBytes = await page.locator('svg').screenshot({ omitBackground: true });
      const chrome = inspectRgbaPngCanvas(chromeBytes, {
        background: [0, 0, 0, 0],
        colorDistance: 0,
      });
      const output = path.join(root, `${index}.png`);
      await rasterizeBytes({
        svg,
        fonts: selected.map(({ weight, bytes }) => ({ weight, bytes, family: 'JetBrains Mono' })),
        width: 600,
        output,
      });
      const native = inspectRgbaPngCanvas(await fs.readFile(output), {
        background: [0, 0, 0, 0],
        colorDistance: 0,
      });
      t.diagnostic(
        JSON.stringify({
          label,
          bound,
          browserMetrics,
          native: native.envelope,
          chrome: chrome.envelope,
        }),
      );
      for (const observed of [native, chrome]) {
        assert(observed.envelope.left > 0 && observed.envelope.top > 0);
        assert(observed.envelope.right < 599 && observed.envelope.bottom < 179);
      }
      {
        const scale = 4;
        const enlarged = svg
          .toString('utf8')
          .replace(
            'width="600" height="180"',
            `width="${600 * scale}" height="${180 * scale}" viewBox="0 0 600 180"`,
          );
        await page.setViewportSize({ width: 600 * scale, height: 180 * scale });
        await page.setContent(
          `<style>html,body{margin:0;background:transparent}svg{display:block}</style>${embedFonts(Buffer.from(enlarged), selected, fonts.license).toString('utf8')}`,
        );
        await page.evaluate(() => globalThis.document.fonts.ready);
        const scaledChrome = await page.locator('svg').screenshot({ omitBackground: true });
        const scaledOutput = path.join(root, `${index}-scale-${scale}.png`);
        await rasterizeBytes({
          svg,
          fonts: selected.map(({ weight, bytes }) => ({ weight, bytes, family: 'JetBrains Mono' })),
          width: 600 * scale,
          output: scaledOutput,
        });
        const nativeBytes = await fs.readFile(output);
        const scaledNative = await fs.readFile(scaledOutput);
        const sampledNative = await observeGlyphPaintEnvelope(page, scaledNative, scale);
        const sampledChrome = await observeGlyphPaintEnvelope(page, scaledChrome, scale);
        for (const observed of [sampledNative, sampledChrome]) {
          assert.equal(observed.width, 600 * scale);
          assert.equal(observed.height, 180 * scale);
        }
        t.diagnostic(
          JSON.stringify({
            sampling: 'Exact selected SVG font bytes; independent alpha envelopes at 1x and 4x',
            label,
            outline: bound,
            browser: await browser.version(),
            deviceScaleFactor: await page.evaluate(() => globalThis.devicePixelRatio),
            native: await observeGlyphPaintEnvelope(page, nativeBytes),
            chrome: await observeGlyphPaintEnvelope(page, chromeBytes),
            scaledNative: sampledNative,
            scaledChrome: sampledChrome,
          }),
        );
        // Outline edges are continuous; raster footprints include both outer pixel edges.
        assertGlyphPaintBounds(sampledNative, bound, 1.1);
        assertGlyphPaintBounds(sampledChrome, bound, 1.1);
        if (label.weight === '400' && label.text === 'A  B') {
          await page.locator('text').evaluate((node) => (node.textContent = 'A B'));
          const collapsed = await observeGlyphPaintEnvelope(
            page,
            await page.locator('svg').screenshot({ omitBackground: true }),
            scale,
          );
          assert.throws(() => assertGlyphPaintBounds(collapsed, bound, 1.1), /right/u);
        }
        await page.setViewportSize({ width: 1440, height: 900 });
      }
      observations.push({ label, bound, browserMetrics, native, chrome });
    }
    assert.equal(observations.length, cases.length);
    assert.deepEqual(errors, []);
  },
);

test('one public build measures embeds and rasterizes exact authored 500 and 700 font resources', async (t) => {
  const input = await fontInput(t);
  const bundled = await loadBundledFonts();
  input.project.title = 'Shared routes';
  input.project.scope.selections.push({
    ...input.project.scope.selections[0],
    id: 'telemetry',
    reference: 'relation:telemetry',
  });
  const model = claimModel();
  model.relations.telemetry = {
    ...structuredClone(model.relations.request),
    qualifiers: { purpose: 'telemetry' },
  };
  const modelBytes = Buffer.from(JSON.stringify(model));
  const refinement = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      static: meaningFor('static').refinement.media.static,
      interactive: meaningFor('interactive').refinement.media.interactive,
    },
  };
  refinement.media.static.font = 'reading';
  refinement.media.interactive.font = 'reading';
  const scenes = [refinement.media.static.scene, refinement.media.interactive.pages[0].scene];
  for (const scene of scenes) {
    scene.texts[0].weight = '500';
    scene.texts[1].weight = '700';
    scene.texts.push({
      ...scene.texts[0],
      id: 'graphic-mark',
      text: 'Architecture mark',
      baseline: 340,
      semanticIds: [],
    });
  }
  const measurer = await createBundledTextMeasurer(
    bundled,
    scenes.flatMap(({ texts }) => texts),
  );
  for (const scene of scenes) {
    scene.texts = scene.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  }
  input.resources.set('refinement.json', Buffer.from(JSON.stringify(refinement)));
  await input.save();
  await fs.writeFile(path.join(input.root, 'sources/model.json'), modelBytes);
  const requestPath = path.join(input.root, 'build-request.json');
  const request = JSON.parse(await fs.readFile(requestPath, 'utf8'));
  request.sources[0].format = { id: 'architecture.claim-model', version: '2' };
  request.sources[0].claimant = model.owner;
  request.sources[0].input.sha256 = sha(modelBytes);
  const requestBytes = Buffer.from(JSON.stringify(request));
  await fs.writeFile(requestPath, requestBytes);
  const output = path.join(input.root, 'candidate');
  await compileSelectedEditionCandidateInput(requestPath, sha(requestBytes), output);
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  assert.match(
    svg,
    /<text[^>]*data-graphic-id="text:graphic-mark"[^>]*>Architecture mark<\/text>/u,
  );
  const interactiveWork = JSON.parse(
    /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u.exec(
      html,
    )[1],
  );
  const interactive = interactiveWork.pages.overview;
  const painted = interactive.pieces
    .map((piece) => (typeof piece === 'number' ? interactiveWork.blocks[piece] : piece))
    .join('');
  const mark = /<text[^>]*data-graphic-id="text:graphic-mark"[^>]*>Architecture mark<\/text>/u.exec(
    painted,
  )?.[0];
  assert(mark, 'Nonsemantic text still paints in the independent interactive medium');
  assert.doesNotMatch(
    mark,
    /data-inspect-id|data-inspect-label|data-text-id|data-text-label|role=|tabindex=|aria-label=/u,
  );
  assert.equal(Object.hasOwn(interactive.subjectSources, 'graphic-mark'), false);
  assert.match(painted, /<text[^>]*data-text-id="client-label"[^>]*role="button"/u);
  for (const weight of [500, 700]) {
    const face = bundled.fonts.find((item) => item.weight === weight);
    assert.equal(svg.includes(face.bytes.toString('base64')), true);
  }
  assert.equal(html.includes('Architecture Statement'), false);
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json'), 'utf8'));
  assert.equal(
    candidate.media.static.supplies.some(({ id }) => id === 'selected-fonts'),
    true,
  );
  assert.equal(
    candidate.media.interactive.supplies.some(({ id }) => id === 'overview/statement-fonts'),
    true,
  );
  assert.equal(
    (await fs.readFile(path.join(output, 'static/architecture.png')))
      .subarray(0, 8)
      .toString('hex'),
    '89504e470d0a1a0a',
  );
});

test('native shaping registers exactly one live worker and reclaims it before returning cached boxes', async () => {
  const fonts = await loadBundledFonts();
  const registrations = [];
  const releases = [];
  const label = {
    text: 'AV office',
    fontSize: 16,
    weight: '600',
    anchor: 'middle',
    x: 0,
    baseline: 0,
  };
  const measured = await withOwnedProcessScope(
    {
      registerOwned: async (pid) => registrations.push(pid),
      releaseOwned: async (pid) => releases.push(pid),
    },
    () => createBundledTextMeasurer(fonts, [label, { ...label, x: 100 }]),
  );
  assert.equal(registrations.length, 1);
  assert.deepEqual(releases, registrations);
  assert.throws(() => process.kill(registrations[0], 0), { code: 'ESRCH' });
  assert(measured.box(label).width > 0);
  assert.equal(registrations.length, 1, 'cache reads may not start another worker');
});

test('shaped-cache identity includes exact text weight size anchor and family', async () => {
  const fonts = await loadBundledFonts();
  const label = {
    text: 'Exact',
    fontSize: 16,
    weight: '400',
    anchor: 'start',
    x: 10,
    baseline: 20,
  };
  const measure = await createBundledTextMeasurer(fonts, [label]);
  for (const change of [{ text: 'exact' }, { fontSize: 17 }, { weight: '500' }, { anchor: 'end' }])
    assert.throws(() => measure.box({ ...label, ...change }), {
      code: 'authored_canvas_measurement_unprepared',
    });
  for (const change of [
    { fontSize: 0 },
    { fontSize: 5000 },
    { x: Infinity },
    { baseline: 100001 },
    { anchor: 'center' },
  ])
    assert.throws(() => measure.box({ ...label, ...change }), {
      code: 'authored_canvas_text_metrics_invalid',
    });
  for (const requests of [null, {}, 1])
    await assert.rejects(createBundledTextMeasurer(fonts, requests), {
      code: 'authored_canvas_measurement_request_invalid',
    });
  await assert.rejects(createBundledTextMeasurer(fonts, [null]), {
    code: 'authored_canvas_text_metrics_invalid',
  });
  await assert.rejects(
    createBundledTextMeasurer(
      fonts,
      Array.from({ length: 4097 }, () => label),
    ),
    { code: 'authored_canvas_text_measurement_limit' },
  );
  await assert.rejects(
    createBundledTextMeasurer(
      fonts,
      Array.from({ length: 50 }, (_, index) => ({
        ...label,
        text: `${index}`.padStart(4096, 'A'),
      })),
    ),
    { code: 'authored_canvas_text_measurement_limit' },
  );
});

test('measurement worker enforces finite-file input resource flags and one selected request', async (t) => {
  const code = `import fs from 'node:fs';
const request = JSON.parse(fs.readFileSync(0, 'utf8'));
const regular = fs.fstatSync(0).isFile();
const eof = fs.readSync(0, Buffer.alloc(1), 0, 1, null) === 0;
const bounded = process.execArgv.includes('--max-old-space-size=512') && process.execArgv.includes('--wasm-max-mem-pages=8192');
process.stdout.write(JSON.stringify({status:'measured',boxes:regular && eof && bounded && request.schema==='architecture.raster-measurement-request/v1' && request.count===1 ? [0,-10,20,10] : []})+'\\n');
setInterval(()=>{},1000);`;
  const { module } = await selectedWorkerFixture(t, code);
  const label = {
    text: 'Exact',
    fontSize: 16,
    weight: '400',
    anchor: 'start',
    x: 30,
    baseline: 60,
  };
  const measured = await module.createBundledTextMeasurer(await loadBundledFonts(), [label]);
  assert.deepEqual(measured.box(label), { x: 30, y: 50, width: 20, height: 10 });
});

test('native measurement refuses malformed interrupted and diagnostic worker replies', async (t) => {
  const selected = await selectedWorkerFixture(t, '');
  const worker = path.join(selected.root, 'packages/publisher/renderers/resvg/worker.mjs');
  const font = await loadBundledFonts();
  const label = { text: 'A', fontSize: 16, weight: '400', anchor: 'start', x: 0, baseline: 0 };
  const replies = [
    ['process.stdout.write("{broken\\n");', 'authored_canvas_measurement_response_invalid'],
    ['process.stdout.write("null\\n");', 'authored_canvas_measurement_response_invalid'],
    [
      'process.stdout.write(\'{"status":"measured","boxes":[0,0,1]}\\n\');',
      'authored_canvas_measurement_response_invalid',
    ],
    [
      'process.stdout.write(\'{"status":"measured","boxes":[0,0,0,1]}\\n\');',
      'authored_canvas_measurement_response_invalid',
    ],
    [
      'process.stdout.write(\'{"status":"measured","boxes":[0,0,1,"wrong"]}\\n\');',
      'authored_canvas_measurement_response_invalid',
    ],
    [
      'process.stdout.write(\'{"status":"error","code":"measurement_text_missing"}\\n\');',
      'measurement_text_missing',
    ],
    [
      'process.stdout.write(\'{"status":"error","code":{}}\\n\');',
      'authored_canvas_measurement_response_invalid',
    ],
    [
      'process.stdout.write(\'{"status":"error","code":"Bad-Error"}\\n\');',
      'authored_canvas_measurement_response_invalid',
    ],
    [
      'process.stdout.write(\'{"status":"waiting","boxes":[0,0,1,1]}\\n\');',
      'authored_canvas_measurement_response_invalid',
    ],
    [
      'process.stdout.write(\'{"status":"measured","boxes":{}}\\n\');',
      'authored_canvas_measurement_response_invalid',
    ],
    ['process.exit(1);', 'authored_canvas_measurement_execution_failed'],
    [
      'process.stderr.write("unexpected diagnostic");process.stdout.write(\'{"status":"measured","boxes":[0,0,1,1]}\\n\');',
      'authored_canvas_measurement_execution_failed',
    ],
    ['process.stdout.write("A".repeat(700000));', 'authored_canvas_measurement_response_limit'],
  ];
  for (const [body, expected] of replies) {
    await t.test(body, async () => {
      const interrupted = body === 'process.exit(1);';
      // Invalid replies still preserve a finite live root for native tree reclamation.
      const lifetime = interrupted ? '' : 'setTimeout(() => process.exit(1), 36000);';
      await fs.writeFile(worker, `import fs from 'node:fs';fs.readFileSync(0);${lifetime}${body}`);
      const failure =
        interrupted && process.platform === 'win32'
          ? { code: 'authored_canvas_measurement_cleanup_unproved', originalFailure: expected }
          : { code: expected };
      await assert.rejects(selected.module.createBundledTextMeasurer(font, [label]), failure);
    });
  }
});

test('native raster worker refuses an unsupported measurement operation before native execution', async () => {
  const result = spawnSync(
    process.execPath,
    ['packages/publisher/renderers/resvg/worker.mjs', '36000'],
    {
      input: JSON.stringify({
        schema: 'architecture.raster-measurement-request/v1',
        svg: '',
        fonts: [],
        count: 4097,
      }),
      encoding: 'utf8',
      timeout: 5000,
    },
  );
  assert.equal(result.status, 1);
  assert.deepEqual(JSON.parse(result.stdout), {
    status: 'error',
    code: 'authored_canvas_measurement_request_invalid',
  });
});

test('selected static TTF rejects compressed containers before parent decompression allocation', async () => {
  const woff = Buffer.alloc(75);
  woff.write('wOFF', 0);
  woff.writeUInt32BE(0x00010000, 4);
  woff.writeUInt32BE(75, 8);
  woff.writeUInt16BE(1, 12);
  woff.writeUInt32BE(134217728, 16);
  woff.write('cmap', 44);
  woff.writeUInt32BE(64, 48);
  woff.writeUInt32BE(11, 52);
  woff.writeUInt32BE(134217728, 56);
  const NativeArray = globalThis.Uint8Array;
  let largeAllocations = 0;
  globalThis.Uint8Array = new Proxy(NativeArray, {
    construct(target, args) {
      if (typeof args[0] === 'number' && args[0] > 8 * 1024 * 1024) {
        largeAllocations++;
        throw new Error('intercepted compressed font allocation');
      }
      return Reflect.construct(target, args);
    },
  });
  try {
    assert.throws(() => readFontFace(woff, 'invalid_selected_static_font'), {
      code: 'invalid_selected_static_font',
    });
  } finally {
    globalThis.Uint8Array = NativeArray;
  }
  assert.equal(
    largeAllocations,
    0,
    'unsupported compressed fonts must fail before OpenType parsing',
  );
  for (const signature of ['wOF2', 'OTTO', 'ttcf', 'true']) {
    const bytes = Buffer.alloc(12);
    bytes.write(signature);
    assert.throws(() => readFontFace(bytes, 'invalid_selected_static_font'), {
      code: 'invalid_selected_static_font',
    });
  }
});

test('selected static TTF validates its complete table directory before parsing', async () => {
  const regular = (await loadBundledFonts()).fonts[0].bytes;
  const invalid = (change) => {
    const bytes = Buffer.from(regular);
    change(bytes);
    assert.throws(() => readFontFace(bytes, 'invalid_selected_static_font'), {
      code: 'invalid_selected_static_font',
    });
  };
  invalid((bytes) => bytes.writeUInt16BE(0, 4));
  invalid((bytes) => bytes.writeUInt16BE(65535, 4));
  invalid((bytes) => bytes.copy(bytes, 28, 12, 16));
  invalid((bytes) => bytes.writeUInt32BE(0, 20));
  invalid((bytes) => bytes.writeUInt32BE(bytes.length + 1, 20));
  invalid((bytes) => bytes.writeUInt32BE(bytes.length, 24));
  const noTables = Buffer.alloc(28);
  noTables.writeUInt32BE(0x00010000, 0);
  noTables.writeUInt16BE(1, 4);
  noTables.write('none', 12);
  noTables.writeUInt32BE(28, 20);
  assert.throws(() => readFontFace(noTables, 'invalid_selected_static_font'), {
    code: 'invalid_selected_static_font',
  });
});

function renamedFontFace(face, family) {
  const original = Buffer.from('JetBrains Mono', 'utf16le').swap16();
  const replacement = Buffer.from(family, 'utf16le').swap16();
  assert.equal(
    replacement.length,
    original.length,
    'bounded test-name patch keeps the original table size',
  );
  const bytes = Buffer.from(face.bytes);
  let changed = 0;
  for (
    let offset = bytes.indexOf(original);
    offset !== -1;
    offset = bytes.indexOf(original, offset + original.length)
  ) {
    replacement.copy(bytes, offset);
    changed++;
  }
  assert(changed > 0);
  return { ...face, family, bytes, sha256: sha(bytes) };
}

test('actual selected non-identifier family names measure and paint as one quoted CSS string', async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-font-family-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const bundled = await loadBundledFonts();
  for (const [index, family] of [
    'Example & Font',
    'Font: Exact 01',
    'Custom + Fonts',
    '12 Exact Fonts',
  ].entries()) {
    const selected = renamedFontFace(bundled.fonts[0], family);
    const label = {
      text: 'AV ->',
      fontSize: 20,
      weight: '400',
      anchor: 'start',
      x: 80,
      baseline: 100,
      family,
    };
    const measure = await createBundledTextMeasurer(
      { ...bundled, fonts: [selected], defaultFamily: family },
      [label],
    );
    assert(measure.box(label).width > 0);
    const attr = JSON.stringify(family).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180"><text x="80" y="100" font-size="20" font-weight="400" font-family="${attr}">AV -&gt;</text></svg>`,
    );
    const output = path.join(root, `${index}.png`);
    await rasterizeBytes({
      svg,
      fonts: [{ family, weight: 400, bytes: selected.bytes }],
      width: 600,
      output,
    });
    assert((await fs.stat(output)).size > 100);
  }
});

test(
  'actual Archify SVG export retains a selected non-identifier family and native shaped text',
  { skip: !path.isAbsolute(process.env.ARCHPUB_BROWSER_EXECUTABLE ?? '') },
  async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-authored-export-')),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const bundled = await loadBundledFonts();
    const family = 'Example & Font';
    const chosen = renamedFontFace(bundled.fonts[0], family);
    const fonts = {
      ...bundled,
      fonts: [...bundled.fonts.map((face) => ({ ...face, family: 'JetBrains Mono' })), chosen],
      defaultFamily: family,
      distributions: [{ bytes: Buffer.from('Selected test font distribution evidence.') }],
    };
    const scene = structuredClone(
      composedScene(compose(meaningFor('interactive'), 'interactive'), 'interactive'),
    );
    scene.texts = scene.texts.map((label, index) => ({
      ...label,
      family,
      weight: '400',
      text: index === 0 ? 'AV -> == ffi' : 'A  B',
    }));
    const measure = await createBundledTextMeasurer(fonts, scene.texts);
    scene.texts = scene.texts.map((label) => ({ ...label, box: measure.box(label) }));
    const output = path.join(root, 'architecture.html');
    await renderArchitectureScene({ scene, output, fontSupply: fonts });
    const browser = await chromium.launch({
      executablePath: process.env.ARCHPUB_BROWSER_EXECUTABLE,
      headless: true,
      chromiumSandbox: true,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setContent(await fs.readFile(output, 'utf8'), { waitUntil: 'load' });
    await page.evaluate(() => globalThis.document.fonts.ready);
    for (const label of scene.texts) {
      const element = page.locator(`[data-text-id="${label.id}"]`);
      assert.equal(await element.textContent(), label.text);
      assert.equal(await element.getAttribute('font-family'), JSON.stringify(family));
    }
    await page.locator('#btn-export').click();
    const pending = page.waitForEvent('download');
    await page.locator('button[data-format="svg-light"]').click();
    const download = await pending;
    const exportedPath = path.join(root, 'export.svg');
    await download.saveAs(exportedPath);
    const exported = await fs.readFile(exportedPath, 'utf8');
    assert(exported.includes(chosen.bytes.toString('base64')));
    assert(exported.includes('Selected test font distribution evidence.'));
    assert(exported.includes('white-space:pre'));
    assert(exported.includes('geometricPrecision'));
    const xml = sax.parser(true, { xmlns: true });
    assert.doesNotThrow(() => xml.write(exported).close());
    await page.setContent(`<style>svg{display:block}</style>${exported}`, { waitUntil: 'load' });
    await page.evaluate(() => globalThis.document.fonts.ready);
    for (const label of scene.texts) {
      const expected = measure.box(label);
      const actual = await page.locator(`[data-text-id="${label.id}"]`).evaluate((node) => {
        const box = node.getBBox();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      });
      assert(
        actual.x <= expected.x + 0.5 &&
          actual.x + actual.width >= expected.x + expected.width - 0.5,
      );
      assert(
        actual.y <= expected.y + 0.5 &&
          actual.y + actual.height >= expected.y + expected.height - 0.5,
      );
    }
    assert.deepEqual(errors, []);
  },
);
