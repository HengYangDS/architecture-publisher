import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
import * as semantics from '../packages/publisher/src/semantics/document.mjs';
import { createHash } from 'node:crypto';
import { editionDigest, validateEdition } from '../packages/publisher/src/edition/index.mjs';
import { validateEditionProvider } from '../packages/publisher/src/provider/index.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/index.mjs';
import {
  editionCandidateDigest,
  validateEditionCandidateBinding,
} from '../packages/publisher/src/compiler/candidate.mjs';
import {
  admitQualificationSet,
  qualificationSetDigest,
} from '../packages/publisher/src/qualification/contract.mjs';
import { spawnNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import {
  alpha3CandidateDigest,
  alpha3QualificationDigest,
  alpha3ReleaseFiles,
  declarativeV1Files,
} from './fixtures/historical-release.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('one-shot migration preserves legacy meaning under explicit v2 choices', async () => {
  const migration = await import('../tools/migration/semantic-document-to-claim-model.mjs').catch(
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
  const { migrateSemanticV1 } =
    await import('../tools/migration/semantic-document-to-claim-model.mjs');
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
  const result = spawnNativeSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
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
  for (const [relative, expected] of Object.entries(declarativeV1Files))
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

test('released alpha.3 Candidate and Qualification retain exact v1 binding', async () => {
  const fixtureRoot = path.join(root, 'tests/fixtures/migration/alpha3-release');
  const values = {};
  for (const [name, expected] of Object.entries(alpha3ReleaseFiles)) {
    const bytes = await fs.readFile(path.join(fixtureRoot, name));
    assert.equal(sha(bytes), expected, name);
    values[name] = JSON.parse(bytes);
  }
  const model = semantics.validateClaimModel(values['claim-model.json']);
  const edition = validateEdition(model, values['edition.json']);
  const candidate = validateEditionCandidateBinding(model, edition, values['candidate.json']);
  const qualification = values['qualification.json'];
  assert.equal(candidate.source.manifestSha256, alpha3ReleaseFiles['source-manifest.json']);
  assert.equal(candidate.claimModel.sha256, alpha3ReleaseFiles['claim-model.json']);
  assert.equal(candidate.edition.sha256, alpha3ReleaseFiles['edition.json']);
  assert.equal(editionCandidateDigest(candidate), alpha3CandidateDigest);
  assert.equal(qualificationSetDigest(qualification), alpha3QualificationDigest);
  const admitted = admitQualificationSet(model, edition, candidate, qualification);
  assert.equal(admitted.complete, true);
  assert.equal(admitted.verdict, 'PASS');
  assert.equal(admitted.admitted, true);
});
