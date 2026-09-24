import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as semantics from '../packages/publisher/src/semantics/document.mjs';
import { createHash } from 'node:crypto';
import { editionDigest, validateEdition } from '../packages/publisher/src/edition/index.mjs';
import { validateEditionProvider } from '../packages/publisher/src/provider/index.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/index.mjs';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('one-shot migration preserves legacy meaning under explicit v2 choices', async () => {
  const migration = await import('../tools/migration/semantic-v1-to-claim-v2.mjs').catch(
    () => ({}),
  );
  assert.equal(typeof migration.migrateSemanticV1, 'function');
  const legacy = JSON.parse(
      await fs.readFile(path.join(root, 'tests/fixtures/migration/semantic-document-v1.json')),
    ),
    migrated = migration.migrateSemanticV1(legacy, {
      maturities: ['implemented', 'target'],
      predicates: {
        calls: {
          valueKind: 'entity',
          cardinality: 'single',
          values: [],
          provenance: ['contract'],
        },
      },
      relations: {
        request: {
          plane: 'implemented',
          maturity: 'implemented',
          conditionKeys: [],
          scopeKeys: [],
        },
      },
      claims: {
        admission: {
          plane: 'intended',
          maturity: 'target',
          conditionKeys: ['authorization'],
          scopeKeys: ['environment'],
        },
      },
    });
  assert.equal(migrated.schema, 'architecture.claim-model/v2');
  assert.deepEqual(migrated.entities, legacy.entities);
  assert.deepEqual(migrated.relations, legacy.relations);
  assert.deepEqual(migrated.claims.request, {
    subject: 'client',
    predicate: 'calls',
    object: 'server',
    value: null,
    plane: 'implemented',
    condition: {},
    scope: {},
    maturity: 'implemented',
    validity: 'affirmed',
    dependsOn: [{ section: 'relations', id: 'request' }],
    coverage: 'complete',
    provenance: ['contract'],
  });
  assert.deepEqual(migrated.claims.admission, {
    subject: 'client',
    predicate: 'calls',
    object: 'server',
    value: null,
    plane: 'intended',
    condition: { authorization: 'granted' },
    scope: { environment: 'local' },
    maturity: 'target',
    validity: 'affirmed',
    dependsOn: [{ section: 'relations', id: 'request' }],
    coverage: 'complete',
    provenance: ['contract'],
  });
  assert.deepEqual(migrated.context, {
    release: 'alpha.7',
    'migration:assertion-values': {
      admission: { text: 'Only authorized clients call the server.' },
    },
  });
  assert.deepEqual(semantics.validateClaimModel(migrated), migrated);
});

test('migration refuses to infer missing semantic choices', async () => {
  const { migrateSemanticV1 } = await import('../tools/migration/semantic-v1-to-claim-v2.mjs');
  const legacy = JSON.parse(
    await fs.readFile(path.join(root, 'tests/fixtures/migration/semantic-document-v1.json')),
  );
  assert.throws(() => migrateSemanticV1(legacy, {}), /semantic_migration_plan_invalid/);
  legacy.assertions.admission.proposition = null;
  assert.throws(
    () =>
      migrateSemanticV1(legacy, {
        maturities: ['implemented', 'target'],
        predicates: {
          calls: {
            valueKind: 'entity',
            cardinality: 'single',
            values: [],
            provenance: ['contract'],
          },
        },
        relations: {
          request: {
            plane: 'implemented',
            maturity: 'implemented',
            conditionKeys: [],
            scopeKeys: [],
          },
        },
        claims: {},
      }),
    /semantic_migration_claim_mapping_required.*admission/,
  );
});

test('current runtime exposes only the v2 Claim Model contract', async () => {
  assert.equal(semantics.validateSemanticDocument, undefined);
  assert.equal(semantics.normalizedDocument, undefined);
  assert.equal(semantics.semanticDigest, undefined);
  assert.equal(semantics.SECTIONS, undefined);
  assert.equal(semantics.validReference, undefined);
  const source = await fs.readFile(
    path.join(root, 'packages/publisher/src/semantics/document.mjs'),
    'utf8',
  );
  assert.doesNotMatch(source, /architecture\.semantic-document\/v1/);
});

test('current runtime and examples contain no v1 reader or dual-schema residue', async () => {
  const roots = ['packages/publisher/src', 'examples'],
    forbidden = [
      /architecture\.semantic-document\/v1/,
      /\bvalidateSemanticDocument\b/,
      /\bnormalizedDocument\b/,
    ],
    findings = [];
  async function visit(relative) {
    for (const entry of await fs.readdir(path.join(root, relative), {
      withFileTypes: true,
    })) {
      const file = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (/\.(?:mjs|json|md)$/.test(file)) {
        const source = await fs.readFile(path.join(root, file), 'utf8');
        for (const pattern of forbidden)
          if (pattern.test(source)) findings.push({ file, pattern: String(pattern) });
      }
    }
  }
  for (const relative of roots) await visit(relative);
  assert.deepEqual(findings, []);
});

test('the development-only migration tool is excluded from the package', () => {
  const result = spawnSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
    cwd: path.join(root, 'packages/publisher'),
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.equal(result.status, 0, result.stderr);
  const files = parseNpmPackRecord(result.stdout).files.map((item) => item.path);
  assert(!files.some((file) => file.startsWith('tools/migration/')));
  assert(!files.some((file) => file.includes('semantic-document-v1')));
});

test('signed-release declarative fixture retains its exact v1 source and Edition meaning', async () => {
  const fixtureRoot = path.join(root, 'tests/fixtures/providers/declarative/valid');
  const frozen = {
    'provider.json': '7229f5541d16aca5f9b565e5fc5721a318df320eec48588d36b8d07473ede46d',
    'source/manifest.json': '726db625c57b644bd1fa848ed7e96e17760b7f37df389ba093f091f5328a6767',
    'source/semantic.json': '70844a60a44f9c9ffea5fea9b251ce7c4e768dfed4bec9f08df80c0ad50b31e4',
    'source/contract.md': '6745a600e15251de2d55276894a0afd83edd7fee2b4d8ca3cd0f426edbf290ad',
    'edition.json': '68fa90b017ec6a7b7d62866c472fee36b24f54b59e696cfcbdbc5ee113da4efe',
  };
  for (const [relative, expected] of Object.entries(frozen))
    assert.equal(sha(await fs.readFile(path.join(fixtureRoot, relative))), expected, relative);

  const provider = validateEditionProvider(
    JSON.parse(await fs.readFile(path.join(fixtureRoot, 'provider.json'))),
  );
  assert.equal(provider.schema, 'architecture.edition-provider/v1');
  assert.equal(provider.subject.revision, 'release-1');
  const source = await readSourceBundle(
    path.join(fixtureRoot, provider.delivery.sourceManifest),
    provider.delivery.sourceManifestSha256,
  );
  assert.equal(source.scope, 'source-file-integrity');
  assert.equal(source.officialReplay, 'not-performed');
  assert.equal(source.semanticAcceptance, 'not-performed');
  assert.equal(source.source.revision, provider.subject.revision);
  const semantic = source.members.find(
    ({ path: name }) => name === provider.delivery.semanticMember,
  );
  const model = semantics.validateClaimModel(JSON.parse(semantic.content));
  assert.equal(semantics.claimModelDigest(model), provider.expected.claimModelDigest);
  const edition = validateEdition(
    model,
    JSON.parse(await fs.readFile(path.join(fixtureRoot, provider.delivery.edition))),
  );
  assert.equal(edition.source.manifestSha256, source.manifestSha256);
  assert.equal(editionDigest(model, edition), provider.expected.editionDigest);
  const selectedAuthoredDigest = sha('unread-authoring-reference');
  const withLegacyAuthoredIdentity = structuredClone(edition);
  withLegacyAuthoredIdentity.scenes.static.authoredInputSha256 = selectedAuthoredDigest;
  assert.equal(
    validateEdition(model, withLegacyAuthoredIdentity).scenes.static.authoredInputSha256,
    selectedAuthoredDigest,
  );
});
