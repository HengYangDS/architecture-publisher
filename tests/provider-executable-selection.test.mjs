import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import * as provider from '../packages/publisher/src/provider/index.mjs';
import * as selection from '../packages/publisher/src/provider/executable-selection.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-v2-exec-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const packageRoot = path.join(root, 'package');
  await fs.mkdir(packageRoot);
  await fs.mkdir(path.join(root, 'inputs'));
  const native = Buffer.from('{"native":true}\n');
  const derived = Buffer.from('{"index":true}\n');
  await fs.writeFile(path.join(root, 'inputs/native.json'), native);
  const packageJson = Buffer.from(
    JSON.stringify({
      name: '@fixture/v2-executable',
      version: '1.0.0',
      type: 'module',
      exports: { './provider': './provider.mjs' },
    }) + '\n',
  );
  await fs.writeFile(path.join(packageRoot, 'package.json'), packageJson);
  await fs.writeFile(
    path.join(packageRoot, 'provider.mjs'),
    `export async function materializeEditionProvider(request) {
  if (request.schema !== 'architecture.edition-provider-request/v2') throw new Error('wrong request');
  const item = request.inputs.find((input) => input.id === 'source');
  const native = JSON.parse(Buffer.from(item.contentBase64, 'base64').toString('utf8'));
  return {
    schema: 'architecture.edition-provider-reply/v2',
    derived: [{ id: 'index', contentBase64: Buffer.from(JSON.stringify({ index: native.native }) + '\\n').toString('base64') }],
  };
}
`,
  );
  const manifest = {
    schema: 'architecture.edition-provider/v2',
    provider: { id: 'example-executable', revision: '1' },
    selected: {
      native: [
        {
          id: 'model',
          namespace: 'org.example/service',
          claimant: 'service-maintainer',
          format: { id: 'example/native-json', version: '1' },
          revision: { kind: 'content', algorithm: 'sha256' },
          bytes: native.length,
          sha256: sha(native),
        },
      ],
      derived: [
        {
          id: 'index',
          namespace: 'org.example/service-index',
          claimant: 'adapter-maintainer',
          format: { id: 'example/index-json', version: '1' },
          derivedFrom: ['model'],
          adapter: { id: 'example-adapter', version: '1', contentSha256: sha('adapter') },
          method: 'extract/v1',
          bytes: derived.length,
          sha256: sha(derived),
        },
      ],
      edition: null,
    },
    delivery: {
      kind: 'executable',
      package: {
        name: '@fixture/v2-executable',
        version: '1.0.0',
        packageJsonSha256: sha(packageJson),
        contentSha256: await provider.editionProviderPackageDigest(packageRoot),
        entrypoint: './provider',
      },
      inputs: [
        {
          id: 'source',
          path: 'inputs/native.json',
          mediaType: 'application/json',
          bytes: native.length,
          sha256: sha(native),
        },
      ],
      nativeInputs: [{ item: 'model', input: 'source' }],
      editionInput: null,
      editionResourceInputs: [],
    },
  };
  const manifestPath = path.join(root, 'provider.json');
  const save = async () => {
    const bytes = Buffer.from(JSON.stringify(manifest) + '\n');
    await fs.writeFile(manifestPath, bytes);
    return sha(bytes);
  };
  return { root, packageRoot, native, derived, manifest, manifestPath, save };
}

test('v2 executable Provider materializes exact native inputs and derived output', async (t) => {
  assert.equal(typeof selection.readExecutableSelectedInputs, 'function');
  const f = await fixture(t);
  const result = await selection.readExecutableSelectedInputs(
    f.manifestPath,
    await f.save(),
    f.packageRoot,
  );
  assert.equal(result.closure, 'selected-provider-inputs-and-outputs-only');
  assert.equal(result.selected.native[0].namespace, 'org.example/service');
  assert.deepEqual(result.selected.derived[0].derivedFrom, [
    {
      id: 'model',
      namespace: 'org.example/service',
      sha256: sha(f.native),
    },
  ]);
  assert.deepEqual(result.read('native', 'model'), f.native);
  assert.deepEqual(result.read('derived', 'index'), f.derived);
  assert.equal(result.invocation.delivery, 'executable');
  assert(result.limits.includes('provider-dependencies-unobserved'));
});

test('executable Edition resources are selected inputs, not ambient files', async (t) => {
  const f = await fixture(t);
  const edition = Buffer.from('{"editor":"fixture-editor"}\n');
  const palette = Buffer.from('{"palette":"stone"}\n');
  await fs.writeFile(path.join(f.root, 'inputs/edition.json'), edition);
  await fs.writeFile(path.join(f.root, 'inputs/palette.json'), palette);
  f.manifest.selected.edition = {
    id: 'portrait',
    editor: 'fixture-editor',
    bytes: edition.length,
    sha256: sha(edition),
    resources: [{ ref: 'palette.json', bytes: palette.length, sha256: sha(palette) }],
  };
  f.manifest.delivery.inputs.push(
    {
      id: 'authored-edition',
      path: 'inputs/edition.json',
      mediaType: 'application/json',
      bytes: edition.length,
      sha256: sha(edition),
    },
    {
      id: 'palette',
      path: 'inputs/palette.json',
      mediaType: 'application/json',
      bytes: palette.length,
      sha256: sha(palette),
    },
  );
  f.manifest.delivery.editionInput = 'authored-edition';
  f.manifest.delivery.editionResourceInputs = [{ ref: 'palette.json', input: 'palette' }];
  const result = await selection.readExecutableSelectedInputs(
    f.manifestPath,
    await f.save(),
    f.packageRoot,
  );
  assert.deepEqual(result.read('edition', 'portrait'), edition);
  assert.deepEqual(result.read('edition-resource', 'palette.json'), palette);
});

test('v2 executable Provider rejects changed package and selected input bytes', async (t) => {
  const f = await fixture(t);
  const selectedSha256 = await f.save();
  await fs.appendFile(path.join(f.packageRoot, 'provider.mjs'), '\n');
  await assert.rejects(
    selection.readExecutableSelectedInputs(f.manifestPath, selectedSha256, f.packageRoot),
    { code: 'edition_provider_package_content_mismatch' },
  );

  f.manifest.delivery.package.contentSha256 = await provider.editionProviderPackageDigest(
    f.packageRoot,
  );
  const changedInputSha256 = await f.save();
  await fs.writeFile(path.join(f.root, 'inputs/native.json'), '{"native":null}\n');
  await assert.rejects(
    selection.readExecutableSelectedInputs(f.manifestPath, changedInputSha256, f.packageRoot),
    { code: 'edition_provider_v2_input_digest_mismatch' },
  );
});

test('v2 executable reply cannot assert publication or drift from expected output', async (t) => {
  const f = await fixture(t);
  const packageFile = path.join(f.packageRoot, 'provider.mjs');
  const source = await fs.readFile(packageFile, 'utf8');
  await fs.writeFile(
    packageFile,
    source.replace('    derived: [', '    publication: {},\n    derived: ['),
  );
  f.manifest.delivery.package.contentSha256 = await provider.editionProviderPackageDigest(
    f.packageRoot,
  );
  await assert.rejects(
    selection.readExecutableSelectedInputs(f.manifestPath, await f.save(), f.packageRoot),
    { code: 'edition_provider_v2_reply_invalid' },
  );

  await fs.writeFile(packageFile, source);
  f.manifest.delivery.package.contentSha256 = await provider.editionProviderPackageDigest(
    f.packageRoot,
  );
  f.manifest.selected.derived[0].sha256 = sha('not the output');
  await assert.rejects(
    selection.readExecutableSelectedInputs(f.manifestPath, await f.save(), f.packageRoot),
    { code: 'edition_provider_v2_output_digest_mismatch' },
  );
});

test('v2 executable Provider relocates offline without changing selected bytes', async (t) => {
  const f = await fixture(t);
  const selectedSha256 = await f.save();
  const first = await selection.readExecutableSelectedInputs(
    f.manifestPath,
    selectedSha256,
    f.packageRoot,
  );
  const relocated = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-v2-reloc-'),
  );
  t.after(() => fs.rm(relocated, { recursive: true, force: true }));
  await fs.cp(f.root, relocated, { recursive: true });
  const second = await selection.readExecutableSelectedInputs(
    path.join(relocated, 'provider.json'),
    selectedSha256,
    path.join(relocated, 'package'),
  );
  assert.deepEqual(second.selected, first.selected);
  assert.deepEqual(second.read('native', 'model'), first.read('native', 'model'));
  assert.deepEqual(second.read('derived', 'index'), first.read('derived', 'index'));
});
