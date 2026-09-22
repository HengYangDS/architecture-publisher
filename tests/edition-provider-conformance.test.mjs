import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { runProviderConformance } from '../conformance/journeys/provider/run.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const evidence = new URL('../build/test-work/', import.meta.url);
const matrix = JSON.parse(
  await fs.readFile(
    new URL('../conformance/fixtures/provider-contract-matrix.json', import.meta.url),
  ),
);

async function copied(t, name) {
  await fs.mkdir(evidence, { recursive: true });
  const root = await fs.mkdtemp(new URL(`provider-conformance-${name}-`, evidence));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(new URL(`./fixtures/providers/${name}/`, import.meta.url), root, { recursive: true });
  const providerManifest = path.join(
    root,
    name === 'declarative' ? 'valid/provider.json' : 'provider.json',
  );
  return {
    providerManifest,
    providerManifestSha256: sha(await fs.readFile(providerManifest)),
    ...(name === 'executable' ? { providerPackageRoot: path.join(root, 'package') } : {}),
  };
}

test('both delivery modes cross one non-authorizing conformance matrix', async (t) => {
  const reports = await Promise.all([
    runProviderConformance(await copied(t, 'declarative')),
    runProviderConformance(await copied(t, 'executable')),
  ]);
  for (const report of reports) {
    assert.deepEqual(
      report.predicates.map(({ id }) => id),
      matrix.predicates,
    );
    for (const predicate of report.predicates) {
      assert.equal(predicate.verdict, 'pass');
      assert.equal(typeof predicate.evidence?.method, 'string');
      assert(predicate.evidence.method.length > 0);
      assert(Array.isArray(predicate.evidence.observations));
      assert(predicate.evidence.observations.length > 0);
      assert(predicate.evidence.observations.every((value) => typeof value === 'string'));
    }
    assert.deepEqual(report.authority, matrix.authority);
    assert.equal(report.verdict, 'pass');
  }
  assert.deepEqual(reports.map(({ delivery }) => delivery).sort(), ['declarative', 'executable']);
});

test('dependency conformance rejects the exact forbidden executable import', async (t) => {
  for (const specifier of [
    'architecture-publisher/renderers/archify',
    'architecture-publisher/qualification',
    'architecture-publisher/publication',
    'simple-git',
    '../../../../../ethos/src/index.mjs',
  ]) {
    const selection = await copied(t, 'executable');
    await fs.writeFile(
      path.join(selection.providerPackageRoot, 'provider.mjs'),
      `import ${JSON.stringify(specifier)};\nexport function materializeEditionProvider() {}\n`,
    );
    await assert.rejects(runProviderConformance(selection), {
      code: 'provider_conformance_dependency_direction',
      message: `provider_conformance_dependency_direction:${specifier}`,
    });
  }
});
