import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as semantics from '../packages/publisher/src/semantics/document.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('one-shot migration preserves legacy meaning under explicit v2 choices', async () => {
  const migration = await import(
    '../tools/migration/semantic-v1-to-claim-v2.mjs'
  ).catch(() => ({}));
  assert.equal(typeof migration.migrateSemanticV1, 'function');
  const legacy = JSON.parse(
      await fs.readFile(
        path.join(root, 'tests/fixtures/migration/semantic-document-v1.json'),
      ),
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
  const { migrateSemanticV1 } = await import(
    '../tools/migration/semantic-v1-to-claim-v2.mjs'
  );
  const legacy = JSON.parse(
    await fs.readFile(
      path.join(root, 'tests/fixtures/migration/semantic-document-v1.json'),
    ),
  );
  assert.throws(
    () => migrateSemanticV1(legacy, {}),
    /semantic_migration_plan_invalid/,
  );
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
  const roots = [
      'packages/publisher/src',
      'migration/ethos/src',
      'examples',
    ],
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
          if (pattern.test(source))
            findings.push({ file, pattern: String(pattern) });
      }
    }
  }
  for (const relative of roots) await visit(relative);
  assert.deepEqual(findings, []);
});

test('the development-only migration tool is excluded from the package', () => {
  const result = spawnSync(
    'npm',
    ['pack', '--dry-run', '--ignore-scripts', '--json'],
    {
      cwd: path.join(root, 'packages/publisher'),
      encoding: 'utf8',
      timeout: 60000,
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const files = JSON.parse(result.stdout)[0].files.map((item) => item.path);
  assert(!files.some((file) => file.startsWith('tools/migration/')));
  assert(!files.some((file) => file.includes('semantic-document-v1')));
});
