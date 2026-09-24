import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  editionProviderPackageDigest,
  materializeBuildRequestInput,
} from '../packages/publisher/src/provider/index.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const format = { id: 'example/native-json', version: '1' };
const revision = { kind: 'content', algorithm: 'sha256' };

function editionProject(namespaces) {
  const selections = namespaces.map((namespace, index) => ({
    id: `selected-${index}`,
    namespace,
    kind: 'reference',
    reference: `item-${index}`,
  }));
  return {
    schema: 'architecture.edition-project/v1',
    id: 'combined-atlas',
    editor: 'combined-editor',
    title: 'Combined architecture',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is selected?' }],
    scope: { sourceNamespaces: namespaces, selections, limits: [] },
    requiredAssertions: selections.map(({ id }, index) => ({
      id: `assertion-${index}`,
      kind: 'source',
      selection: id,
      questions: ['shape'],
    })),
    omissions: [],
    transformations: [],
    narrative: { summary: 'Selected native sources.', readingOrder: ['shape'] },
    presentation: {
      static: { questions: ['shape'], intent: 'A clear overview.' },
      interactive: { questions: ['shape'], intent: 'An explorable overview.' },
    },
    visualPolicy: { profile: 'neutral' },
  };
}

function providerManifest(slug, namespace, native, projection) {
  return {
    schema: 'architecture.edition-provider/v2',
    provider: { id: `${slug}-provider`, revision: '1' },
    selected: {
      native: [
        {
          id: 'model',
          namespace,
          claimant: `${slug}-maintainer`,
          format,
          revision,
          bytes: native.length,
          sha256: sha(native),
        },
      ],
      derived: [
        {
          id: 'index',
          claimant: 'adapter-maintainer',
          format: { id: 'example/index', version: '1' },
          derivedFrom: ['model'],
          adapter: { id: 'native-reader', version: '1', contentSha256: sha('adapter') },
          method: 'extract/v1',
          bytes: projection.length,
          sha256: sha(projection),
        },
      ],
      edition: null,
    },
    delivery: {
      kind: 'declarative',
      files: [
        { kind: 'native', id: 'model', path: 'native.json' },
        { kind: 'derived', id: 'index', path: 'index.json' },
      ],
    },
  };
}

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-join-v2-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'edition'));
  await fs.mkdir(path.join(root, 'sources'));
  await fs.mkdir(path.join(root, 'providers/alpha'), { recursive: true });
  await fs.mkdir(path.join(root, 'providers/beta'), { recursive: true });
  const direct = Buffer.from('{"direct":true}\n');
  await fs.writeFile(path.join(root, 'sources/direct.json'), direct);
  const providers = {};
  for (const slug of ['alpha', 'beta']) {
    const namespace = `org.example/${slug}`;
    const native = Buffer.from(`{"${slug}":true}\n`);
    const projection = Buffer.from(`{"index":"${slug}"}\n`);
    const directory = path.join(root, 'providers', slug);
    await fs.writeFile(path.join(directory, 'native.json'), native);
    await fs.writeFile(path.join(directory, 'index.json'), projection);
    providers[slug] = {
      directory,
      native,
      projection,
      manifest: providerManifest(slug, namespace, native, projection),
      relativeManifest: `providers/${slug}/provider.json`,
    };
  }
  const state = {
    root,
    direct,
    providers,
    project: editionProject(['org.example/direct', 'org.example/alpha', 'org.example/beta']),
    request: {
      schema: 'architecture.build-request/v1',
      edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
      sources: [
        {
          id: 'direct-local',
          namespace: 'org.example/direct',
          format,
          claimant: 'direct-maintainer',
          revision,
          input: { kind: 'locator', path: 'sources/direct.json' },
        },
      ],
      providers: ['alpha', 'beta'].map((slug) => ({
        id: `${slug}-selection`,
        manifest: providers[slug].relativeManifest,
        sha256: '0'.repeat(64),
      })),
      media: ['static', 'interactive'],
      toolchain: { profile: 'portable' },
    },
  };
  state.save = async () => {
    const editionBytes = Buffer.from(JSON.stringify(state.project) + '\n');
    await fs.writeFile(path.join(root, 'edition/project.json'), editionBytes);
    for (const item of Object.values(providers)) {
      if (item.manifest.selected.edition !== null) {
        item.manifest.selected.edition.bytes = editionBytes.length;
        item.manifest.selected.edition.sha256 = sha(editionBytes);
        await fs.writeFile(path.join(item.directory, 'edition.json'), editionBytes);
      }
      const bytes = Buffer.from(JSON.stringify(item.manifest) + '\n');
      await fs.writeFile(path.join(item.directory, 'provider.json'), bytes);
      const selection = state.request.providers.find(
        ({ manifest }) => manifest === item.relativeManifest,
      );
      if (selection) selection.sha256 = sha(bytes);
    }
    const requestBytes = Buffer.from(JSON.stringify(state.request) + '\n');
    const requestPath = path.join(root, 'build-request.json');
    await fs.writeFile(requestPath, requestBytes);
    return { requestPath, digest: sha(requestBytes) };
  };
  state.materialize = async () => {
    const { requestPath, digest } = await state.save();
    return materializeBuildRequestInput(requestPath, digest);
  };
  return state;
}

function supplyEdition(item, project) {
  item.manifest.selected.edition = {
    id: project.id,
    editor: project.editor,
    bytes: 0,
    sha256: '0'.repeat(64),
    resources: [],
  };
  item.manifest.delivery.files.push({
    kind: 'edition',
    id: project.id,
    path: 'edition.json',
  });
}

async function prepareExecutableAlpha(f) {
  const alpha = f.providers.alpha;
  const packageRoot = path.join(alpha.directory, 'package');
  await fs.mkdir(packageRoot);
  const packageJson = Buffer.from(
    JSON.stringify({
      name: '@fixture/alpha-provider',
      version: '1.0.0',
      type: 'module',
      exports: { './provider': './provider.mjs' },
    }) + '\n',
  );
  await fs.writeFile(path.join(packageRoot, 'package.json'), packageJson);
  await fs.writeFile(
    path.join(packageRoot, 'provider.mjs'),
    `export async function materializeEditionProvider(request) {
  const source = JSON.parse(Buffer.from(request.inputs[0].contentBase64, 'base64').toString('utf8'));
  const index = Object.keys(source)[0];
  return {
    schema: 'architecture.edition-provider-reply/v2',
    derived: [{ id: 'index', contentBase64: Buffer.from(JSON.stringify({ index }) + '\\n').toString('base64') }],
  };
}
`,
  );
  alpha.manifest.delivery = {
    kind: 'executable',
    package: {
      name: '@fixture/alpha-provider',
      version: '1.0.0',
      packageJsonSha256: sha(packageJson),
      contentSha256: await editionProviderPackageDigest(packageRoot),
      entrypoint: './provider',
    },
    inputs: [
      {
        id: 'source',
        path: 'native.json',
        mediaType: 'application/json',
        bytes: alpha.native.length,
        sha256: sha(alpha.native),
      },
    ],
    nativeInputs: [{ item: 'model', input: 'source' }],
    editionInput: null,
    editionResourceInputs: [],
  };
  f.request.providers[0].packageRoot = 'providers/alpha/package';
  return alpha;
}

test('direct and two declarative Providers join one selected-input lock', async (t) => {
  const f = await fixture(t);
  const first = await f.materialize();
  assert.equal(first.lock.sources.length, 3);
  assert.equal(first.lock.derived.length, 2);
  assert.equal(Object.hasOwn(first.lock.derived[0], 'id'), false);
  assert.deepEqual(first.lock.derived.map((item) => item.derivedFrom[0].namespace).sort(), [
    'org.example/alpha',
    'org.example/beta',
  ]);
  assert.deepEqual(first.read('direct-local'), f.direct);
  assert.deepEqual(first.readSource('org.example/alpha'), f.providers.alpha.native);
  assert.deepEqual(first.readSource('org.example/beta'), f.providers.beta.native);
  assert.throws(() => first.read('model'), { code: 'materialized_item_unknown' });
  assert(first.limits.includes('path-confinement-under-concurrent-mutation-unproved'));
  assert.equal(first.readEvidence.subjectLockSha256, first.lockSha256);
  assert.equal(first.invocations.length, 2);
  const alphaProjection = first.lock.derived.find(
    (item) => item.derivedFrom[0].namespace === 'org.example/alpha',
  );
  assert.deepEqual(first.readDerived(alphaProjection), f.providers.alpha.projection);

  f.request.providers.reverse();
  f.providers.alpha.manifest.selected.native[0].id = 'renamed-native';
  f.providers.alpha.manifest.selected.derived[0].derivedFrom = ['renamed-native'];
  f.providers.alpha.manifest.delivery.files[0].id = 'renamed-native';
  const second = await f.materialize();
  assert.equal(second.lockSha256, first.lockSha256);
  assert.notDeepEqual(second.invocations, first.invocations);
});

test('direct and Provider native delivery with the same meaning share lock identity', async (t) => {
  const f = await fixture(t);
  f.request.providers = [];
  f.project = editionProject(['org.example/direct']);
  const direct = await f.materialize();

  f.request.sources = [];
  f.request.providers = [
    {
      id: 'alpha-selection',
      manifest: f.providers.alpha.relativeManifest,
      sha256: '0'.repeat(64),
    },
  ];
  await fs.writeFile(path.join(f.providers.alpha.directory, 'native.json'), f.direct);
  f.providers.alpha.manifest.selected.native[0] = {
    ...f.providers.alpha.manifest.selected.native[0],
    namespace: 'org.example/direct',
    claimant: 'direct-maintainer',
    bytes: f.direct.length,
    sha256: sha(f.direct),
  };
  f.providers.alpha.manifest.selected.derived = [];
  f.providers.alpha.manifest.delivery.files.pop();
  const provider = await f.materialize();
  assert.equal(provider.lockSha256, direct.lockSha256);
  assert.notDeepEqual(provider.invocations, direct.invocations);
});

test('global selection rejects duplicate namespaces and conflicting Edition ownership', async (t) => {
  const f = await fixture(t);
  f.providers.alpha.manifest.selected.native[0].namespace = 'org.example/direct';
  await assert.rejects(f.materialize(), { code: 'materialized_source_namespace_duplicate' });

  f.providers.alpha.manifest.selected.native[0].namespace = 'org.example/alpha';
  supplyEdition(f.providers.alpha, f.project);
  await assert.rejects(f.materialize(), { code: 'materialized_edition_ambiguous' });

  f.request.edition = { kind: 'provider', provider: 'alpha-selection' };
  const selected = await f.materialize();
  assert.equal(selected.project.id, f.project.id);
  supplyEdition(f.providers.beta, f.project);
  await assert.rejects(f.materialize(), { code: 'materialized_edition_ambiguous' });

  f.providers.beta.manifest.selected.edition = null;
  f.providers.beta.manifest.delivery.files.pop();
  f.providers.alpha.manifest.selected.edition = null;
  f.providers.alpha.manifest.delivery.files.pop();
  await assert.rejects(f.materialize(), { code: 'materialized_provider_edition_missing' });
});

test('Provider Edition cannot recover an unselected override from ambient files', async (t) => {
  const f = await fixture(t);
  f.request.edition = { kind: 'provider', provider: 'alpha-selection' };
  f.project.visualPolicy.override = 'palette.json';
  supplyEdition(f.providers.alpha, f.project);
  await fs.writeFile(path.join(f.providers.alpha.directory, 'palette.json'), '{"palette":"stone"}');
  await assert.rejects(f.materialize(), { code: 'materialized_edition_resource_missing' });
});

test('selected Provider Edition resource bytes share direct identity', async (t) => {
  const f = await fixture(t);
  const palette = Buffer.from('{"palette":"stone"}\n');
  f.project.visualPolicy.override = 'palette.json';
  await fs.writeFile(path.join(f.root, 'edition/palette.json'), palette);
  const direct = await f.materialize();

  f.request.edition = { kind: 'provider', provider: 'alpha-selection' };
  const alpha = f.providers.alpha;
  supplyEdition(alpha, f.project);
  alpha.manifest.selected.edition.resources = [
    { ref: 'palette.json', bytes: palette.length, sha256: sha(palette) },
  ];
  alpha.manifest.delivery.files.push({
    kind: 'edition-resource',
    id: 'palette.json',
    path: 'assets/palette.json',
  });
  await fs.mkdir(path.join(alpha.directory, 'assets'));
  await fs.writeFile(path.join(alpha.directory, 'assets/palette.json'), palette);
  const supplied = await f.materialize();
  assert.equal(supplied.lockSha256, direct.lockSha256);
  assert.deepEqual(supplied.readEditionResource('palette.json'), palette);
  assert.equal(
    supplied.readEvidence.items.find(({ kind }) => kind === 'edition-resource').method,
    'filesystem-read-sha256/v1',
  );
});

test('direct and Provider-supplied identical Edition bytes share identity', async (t) => {
  const f = await fixture(t);
  const direct = await f.materialize();
  f.request.edition = { kind: 'provider', provider: 'alpha-selection' };
  supplyEdition(f.providers.alpha, f.project);
  const supplied = await f.materialize();
  assert.equal(supplied.lockSha256, direct.lockSha256);
  assert.deepEqual(supplied.readEdition(), direct.readEdition());
  assert.equal(
    supplied.readEvidence.items.find(({ kind }) => kind === 'edition').method,
    'filesystem-read-sha256/v1',
  );
});

test('global join rejects ambiguous derived meaning and false Edition metadata', async (t) => {
  const f = await fixture(t);
  const duplicate = { ...f.providers.alpha.manifest.selected.derived[0], id: 'copy' };
  f.providers.alpha.manifest.selected.derived.push(duplicate);
  f.providers.alpha.manifest.delivery.files.push({
    kind: 'derived',
    id: 'copy',
    path: 'copy.json',
  });
  await fs.writeFile(
    path.join(f.providers.alpha.directory, 'copy.json'),
    f.providers.alpha.projection,
  );
  await assert.rejects(f.materialize(), { code: 'materialized_derived_duplicate' });

  f.providers.alpha.manifest.selected.derived.pop();
  f.providers.alpha.manifest.delivery.files.pop();
  f.request.edition = { kind: 'provider', provider: 'alpha-selection' };
  supplyEdition(f.providers.alpha, f.project);
  f.providers.alpha.manifest.selected.edition.editor = 'false-editor';
  await assert.rejects(f.materialize(), {
    code: 'materialized_provider_edition_identity_mismatch',
  });
});

test('declarative delivery cannot consume an executable package root', async (t) => {
  const f = await fixture(t);
  f.request.providers[0].packageRoot = 'providers/alpha';
  await assert.rejects(f.materialize(), { code: 'materialized_provider_package_root_invalid' });
});

test('an unverified Provider VCS claim remains distinct from checked content', async (t) => {
  const f = await fixture(t);
  f.providers.alpha.manifest.selected.native[0].revision = {
    kind: 'vcs',
    repository: 'unavailable-repository',
    ref: 'HEAD',
  };
  const result = await f.materialize();
  const alpha = result.lock.sources.find(({ namespace }) => namespace === 'org.example/alpha');
  assert.equal(alpha.revision.kind, 'vcs');
  assert.equal(alpha.revision.object, null);
  assert(result.limits.includes('vcs-provenance-unverified:org.example/alpha'));
});

test('Edition scope cannot omit a selected Provider source', async (t) => {
  const f = await fixture(t);
  f.project.scope.sourceNamespaces.pop();
  f.project.scope.selections.pop();
  f.project.requiredAssertions.pop();
  await assert.rejects(f.materialize(), { code: 'materialized_edition_sources_mismatch' });
});

test('mixed declarative and executable Providers share one selected-input identity', async (t) => {
  const f = await fixture(t);
  const declarative = await f.materialize();
  const alpha = await prepareExecutableAlpha(f);
  const mixed = await f.materialize();
  assert.equal(mixed.lockSha256, declarative.lockSha256);
  assert.deepEqual(mixed.readSource('org.example/alpha'), alpha.native);
  assert.deepEqual(
    mixed.invocations.map(({ delivery }) => delivery),
    ['executable', 'declarative'],
  );
  assert.equal(
    mixed.readEvidence.items.find(
      ({ kind, key }) => kind === 'native' && key === 'org.example/alpha',
    ).method,
    'provider-input-sha256/v2',
  );
  assert.equal(
    mixed.readEvidence.items.find(
      ({ kind, key }) => kind === 'derived' && key === 'alpha-selection/index',
    ).method,
    'provider-reply-sha256/v2',
  );

  const editionBytes = Buffer.from(JSON.stringify(f.project) + '\n');
  alpha.manifest.selected.edition = {
    id: f.project.id,
    editor: f.project.editor,
    bytes: editionBytes.length,
    sha256: sha(editionBytes),
    resources: [],
  };
  alpha.manifest.delivery.inputs.push({
    id: 'authored-edition',
    path: 'edition.json',
    mediaType: 'application/json',
    bytes: editionBytes.length,
    sha256: sha(editionBytes),
  });
  alpha.manifest.delivery.editionInput = 'authored-edition';
  f.request.edition = { kind: 'provider', provider: 'alpha-selection' };
  const executableEdition = await f.materialize();
  assert.equal(executableEdition.lockSha256, declarative.lockSha256);
  assert.equal(
    executableEdition.readEvidence.items.find(({ kind }) => kind === 'edition').method,
    'provider-input-sha256/v2',
  );
});

test('direct, declarative, and executable Edition resources share exact identity', async (t) => {
  const f = await fixture(t);
  const palette = Buffer.from('{"palette":"stone"}\n');
  f.project.visualPolicy.override = 'palette.json';
  await fs.writeFile(path.join(f.root, 'edition/palette.json'), palette);
  const direct = await f.materialize();

  const alpha = f.providers.alpha;
  f.request.edition = { kind: 'provider', provider: 'alpha-selection' };
  supplyEdition(alpha, f.project);
  alpha.manifest.selected.edition.resources = [
    { ref: 'palette.json', bytes: palette.length, sha256: sha(palette) },
  ];
  alpha.manifest.delivery.files.push({
    kind: 'edition-resource',
    id: 'palette.json',
    path: 'assets/palette.json',
  });
  await fs.mkdir(path.join(alpha.directory, 'assets'));
  const selectedPalette = path.join(alpha.directory, 'assets/palette.json');
  await fs.writeFile(selectedPalette, palette);
  const declarative = await f.materialize();
  assert.equal(declarative.lockSha256, direct.lockSha256);

  await prepareExecutableAlpha(f);
  const editionBytes = Buffer.from(JSON.stringify(f.project) + '\n');
  alpha.manifest.delivery.inputs.push(
    {
      id: 'authored-edition',
      path: 'edition.json',
      mediaType: 'application/json',
      bytes: editionBytes.length,
      sha256: sha(editionBytes),
    },
    {
      id: 'palette',
      path: 'assets/palette.json',
      mediaType: 'application/json',
      bytes: palette.length,
      sha256: sha(palette),
    },
  );
  alpha.manifest.delivery.editionInput = 'authored-edition';
  alpha.manifest.delivery.editionResourceInputs = [{ ref: 'palette.json', input: 'palette' }];
  const executable = await f.materialize();
  assert.equal(executable.lockSha256, direct.lockSha256);
  assert.deepEqual(executable.readEditionResource('palette.json'), palette);
  assert.equal(
    executable.readEvidence.items.find(({ kind }) => kind === 'edition-resource').method,
    'provider-input-sha256/v2',
  );

  const changed = Buffer.from('{"palette":"slate"}\n');
  await fs.writeFile(selectedPalette, changed);
  alpha.manifest.selected.edition.resources[0].bytes = changed.length;
  alpha.manifest.selected.edition.resources[0].sha256 = sha(changed);
  const paletteInput = alpha.manifest.delivery.inputs.find(({ id }) => id === 'palette');
  paletteInput.bytes = changed.length;
  paletteInput.sha256 = sha(changed);
  const different = await f.materialize();
  assert.notEqual(different.lockSha256, executable.lockSha256);
});
