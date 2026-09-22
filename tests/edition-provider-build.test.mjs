import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/edition.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fixtureRoot = new URL('./fixtures/providers/declarative/valid/', import.meta.url);
const evidence = new URL('../build/test-work/', import.meta.url);

async function fixture(t) {
  await fs.mkdir(evidence, { recursive: true });
  const root = await fs.mkdtemp(new URL('provider-build-', evidence));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(fixtureRoot, path.join(root, 'input'), { recursive: true });
  const providerBytes = await fs.readFile(path.join(root, 'input/provider.json'));
  const provider = JSON.parse(providerBytes);
  const direct = {
    sourceManifest: 'input/source/manifest.json',
    sourceSha256: provider.delivery.sourceManifestSha256,
    semanticMember: provider.delivery.semanticMember,
    edition: 'input/edition.json',
    editionSha256: provider.delivery.editionSha256,
    output: 'direct-output',
  };
  const provided = {
    providerManifest: 'input/provider.json',
    providerManifestSha256: sha(providerBytes),
    output: 'provider-output',
  };
  const write = async (name, value) => {
    const file = path.join(root, name);
    const bytes = Buffer.from(JSON.stringify(value, null, 2) + '\n');
    await fs.writeFile(file, bytes);
    return { file, digest: sha(bytes) };
  };
  return { root, provider, direct, provided, write };
}

test('provider plan preserves Candidate identity and emits outer provenance', async (t) => {
  const selected = await fixture(t);
  const directPlan = await selected.write('direct.json', selected.direct);
  const providerPlan = await selected.write('provider.json', selected.provided);
  const direct = await compileEditionCandidateInput(directPlan.file, directPlan.digest);
  const provided = await compileEditionCandidateInput(providerPlan.file, providerPlan.digest);
  for (const key of [
    'candidateSha256',
    'semanticDigest',
    'editionDigest',
    'staticSceneDigest',
    'interactiveSceneDigest',
  ])
    assert.equal(provided[key], direct[key]);
  assert.equal(Object.hasOwn(direct, 'providerMaterializationSha256'), false);
  assert.match(provided.providerMaterializationSha256, /^[0-9a-f]{64}$/u);

  const directBundle = await readSourceBundle(direct.manifestPath, direct.manifestSha256);
  const providerBundle = await readSourceBundle(provided.manifestPath, provided.manifestSha256);
  assert.equal(
    directBundle.members.some(({ path: member }) => member === 'provider.json'),
    false,
  );
  const receipt = providerBundle.members.find(({ path: member }) => member === 'provider.json');
  assert(receipt);
  assert.equal(sha(receipt.content), provided.providerMaterializationSha256);
  assert.equal(JSON.parse(receipt.content).delivery, 'declarative');
});

test('edition build request is an exact direct/provider union', async (t) => {
  const selected = await fixture(t);
  for (const [name, plan] of [
    ['mixed', { ...selected.direct, ...selected.provided }],
    ['unknown', { ...selected.provided, extra: true }],
    ['declarative-root', { ...selected.provided, providerPackageRoot: 'input' }],
  ]) {
    const input = await selected.write(`${name}.json`, plan);
    await assert.rejects(compileEditionCandidateInput(input.file, input.digest), {
      code: 'edition_candidate_plan_invalid',
    });
  }

  const executableManifest = structuredClone(selected.provider);
  executableManifest.delivery = {
    kind: 'executable',
    package: {
      name: '@example/provider',
      version: '1.0.0',
      packageJsonSha256: 'a'.repeat(64),
      entrypoint: './provider',
    },
    inputs: [],
  };
  const executableBytes = Buffer.from(JSON.stringify(executableManifest, null, 2) + '\n');
  await fs.writeFile(path.join(selected.root, 'input/executable-provider.json'), executableBytes);
  const missingRoot = await selected.write('missing-root.json', {
    providerManifest: 'input/executable-provider.json',
    providerManifestSha256: sha(executableBytes),
    output: 'missing-root-output',
  });
  await assert.rejects(compileEditionCandidateInput(missingRoot.file, missingRoot.digest), {
    code: 'edition_provider_package_root_required',
  });
});
