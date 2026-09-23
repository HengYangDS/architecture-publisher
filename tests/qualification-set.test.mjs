import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  admitQualificationSet,
  bindQualificationRecord,
  bindQualificationSet,
  qualificationSubject,
  qualificationSetDigest,
  validateQualificationSet,
  verifyQualificationInput,
} from '../packages/publisher/src/qualification/index.mjs';
import {
  createEditionCandidate,
  editionCandidateDigest,
} from '../packages/publisher/src/compiler/candidate.mjs';
import {
  interactiveSceneDigest,
  staticSceneDigest,
} from '../packages/publisher/src/edition/contract.mjs';
import { editionFixture } from './fixtures/edition.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const exactDigest = (value) => digest(Buffer.from(value));
const root = path.resolve(import.meta.dirname, '..');
const cli = path.join(root, 'packages/publisher/src/cli/main.mjs');

function authority() {
  const { model, edition } = editionFixture();
  return { model, edition };
}

function candidate(selected = authority()) {
  return createEditionCandidate({
    sourceManifestSha256: selected.edition.source.manifestSha256,
    claimModelSha256: exactDigest('claim-model-bytes'),
    claimModel: selected.model,
    editionSha256: exactDigest('edition'),
    edition: selected.edition,
    media: {
      static: {
        sceneSha256: staticSceneDigest(selected.model, selected.edition),
        artifacts: [
          {
            id: 'overview-png',
            mediaType: 'image/png',
            bytes: 1,
            path: 'static/architecture-publisher-6000.png',
            sha256: exactDigest('png'),
          },
        ],
        supplies: [{ id: 'raster', sha256: exactDigest('raster') }],
      },
      interactive: {
        sceneSha256: interactiveSceneDigest(selected.model, selected.edition),
        artifacts: [
          {
            id: 'atlas',
            mediaType: 'text/html',
            bytes: 1,
            path: 'interactive/architecture-publisher.html',
            sha256: exactDigest('html'),
          },
        ],
        supplies: [{ id: 'archify', sha256: exactDigest('archify') }],
      },
    },
  });
}

function admit(candidateValue, qualificationValue, selected = authority()) {
  return admitQualificationSet(
    selected.model,
    selected.edition,
    candidateValue,
    qualificationValue,
  );
}

function recordsFor(selectedCandidate) {
  return selectedCandidate.obligations.map(({ kind, predicate }, index) =>
    bindQualificationRecord(selectedCandidate, {
      id: `${kind}.${index}`,
      kind,
      verifier: {
        kind: kind === 'human' ? 'human' : 'machine',
        id: kind === 'human' ? 'reviewer:human' : `verifier:${kind}`,
        implementationSha256: exactDigest(`verifier:${kind}`),
      },
      predicate,
      scope:
        kind === 'human'
          ? {
              kind: 'viewport',
              medium: 'interactive',
              artifact: 'atlas',
              width: 1440,
              height: 1000,
            }
          : { kind: 'fixture', value: predicate },
      environment: null,
      observations: [{ name: 'result', value: 'verified' }],
      verdict: 'PASS',
      limitations: [],
    }),
  );
}

async function qualificationInputFixture(directory) {
  const selected = authority(),
    claimModelBytes = Buffer.from(JSON.stringify(selected.model, null, 2) + '\n'),
    editionBytes = Buffer.from(JSON.stringify(selected.edition, null, 2) + '\n'),
    selectedCandidate = createEditionCandidate({
      sourceManifestSha256: selected.edition.source.manifestSha256,
      claimModelSha256: digest(claimModelBytes),
      claimModel: selected.model,
      editionSha256: digest(editionBytes),
      edition: selected.edition,
      media: {
        static: {
          sceneSha256: staticSceneDigest(selected.model, selected.edition),
          artifacts: [
            {
              id: 'overview-png',
              mediaType: 'image/png',
              bytes: 1,
              path: 'static/architecture-publisher-6000.png',
              sha256: exactDigest('png'),
            },
          ],
          supplies: [{ id: 'raster', sha256: exactDigest('raster') }],
        },
        interactive: {
          sceneSha256: interactiveSceneDigest(selected.model, selected.edition),
          artifacts: [
            {
              id: 'atlas',
              mediaType: 'text/html',
              bytes: 1,
              path: 'interactive/architecture-publisher.html',
              sha256: exactDigest('html'),
            },
          ],
          supplies: [{ id: 'archify', sha256: exactDigest('archify') }],
        },
      },
    }),
    qualification = bindQualificationSet(selectedCandidate, recordsFor(selectedCandidate)),
    candidateBytes = Buffer.from(JSON.stringify(selectedCandidate, null, 2) + '\n'),
    qualificationBytes = Buffer.from(JSON.stringify(qualification, null, 2) + '\n'),
    files = {
      'claim-model.json': claimModelBytes,
      'edition.json': editionBytes,
      'candidate.json': candidateBytes,
      'qualification.json': qualificationBytes,
    };
  await Promise.all(
    Object.entries(files).map(([name, bytes]) => fs.writeFile(path.join(directory, name), bytes)),
  );
  const request = {
      schema: 'architecture.qualification-input/v1',
      claimModel: {
        path: 'claim-model.json',
        sha256: digest(claimModelBytes),
      },
      edition: {
        path: 'edition.json',
        sha256: digest(editionBytes),
      },
      candidate: {
        path: 'candidate.json',
        sha256: digest(candidateBytes),
      },
      qualification: {
        path: 'qualification.json',
        sha256: digest(qualificationBytes),
      },
    },
    requestBytes = Buffer.from(JSON.stringify(request, null, 2) + '\n'),
    requestPath = path.join(directory, 'request.json');
  await fs.writeFile(requestPath, requestBytes);
  return {
    requestPath,
    requestSha256: digest(requestBytes),
    qualificationPath: path.join(directory, 'qualification.json'),
    qualificationSha256: digest(qualificationBytes),
    recordCount: qualification.records.length,
  };
}

function record(overrides = {}, selectedCandidate = candidate()) {
  const kind = overrides.kind ?? 'semantic',
    scope =
      overrides.scope ??
      (kind === 'human'
        ? {
            kind: 'viewport',
            medium: 'interactive',
            artifact: 'atlas',
            width: 1440,
            height: 1000,
          }
        : { kind: 'document', value: 'candidate.json' });
  return {
    id: 'semantic.integrity',
    kind,
    subject: qualificationSubject(selectedCandidate, kind, scope),
    editionDigest: selectedCandidate.edition.digest,
    sourceManifestSha256: selectedCandidate.source.manifestSha256,
    claimModelDigest: selectedCandidate.claimModel.digest,
    verifier: {
      kind: kind === 'human' ? 'human' : 'machine',
      id: kind === 'human' ? 'reviewer:human' : 'architecture-publisher.semantic-verifier',
      implementationSha256: exactDigest('verifier'),
    },
    predicate: 'semantic-integrity',
    scope,
    environment: null,
    observations: [{ name: 'claim-model', value: 'valid' }],
    verdict: 'PASS',
    limitations: [],
    ...overrides,
  };
}

function set(records, selectedCandidate = candidate()) {
  const selectedRecords = records ?? [record({}, selectedCandidate)];
  return {
    schema: 'architecture.qualification-set/v1',
    candidateSha256: editionCandidateDigest(selectedCandidate),
    editionDigest: selectedCandidate.edition.digest,
    sourceManifestSha256: selectedCandidate.source.manifestSha256,
    claimModelDigest: selectedCandidate.claimModel.digest,
    records: selectedRecords,
  };
}

test('qualification set validates exact predicate-specific evidence without manufacturing acceptance', () => {
  const source = set();
  const selected = validateQualificationSet(source);
  assert.equal(selected.records[0].verdict, 'PASS');
  assert.equal(selected.records[0].environment, null);
  assert.match(qualificationSetDigest(source), /^[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(selected, 'status'), false);
  assert.equal(Object.hasOwn(selected, 'accepted'), false);
});

test('qualification records fail closed on unknown fields, duplicate identities, and ambiguous subjects', () => {
  assert.throws(() => validateQualificationSet(set([{ ...record(), score: 100 }])), {
    code: 'qualification_record_invalid',
  });
  assert.throws(() => validateQualificationSet(set([record(), record()])), {
    code: 'qualification_record_duplicate',
  });
  assert.throws(
    () =>
      validateQualificationSet(
        set([record({ subject: { kind: 'edition-candidate', sha256: 'bad' } })]),
      ),
    { code: 'qualification_subject_invalid' },
  );
});

test('externally supplied qualification fields fail closed at their exact boundary', () => {
  const recordCases = [
    ['scope', { scope: { kind: 'document', value: '' } }, 'qualification_scope_invalid'],
    [
      'environment',
      { environment: { kind: 'host', value: '' } },
      'qualification_environment_invalid',
    ],
    [
      'verifier',
      { verifier: { kind: 'machine', id: '', implementationSha256: exactDigest('verifier') } },
      'qualification_verifier_invalid',
    ],
    ['observations', { observations: [] }, 'qualification_observations_invalid'],
    [
      'observation identity',
      { observations: [{ name: '', value: true }] },
      'qualification_observation_invalid',
    ],
    [
      'duplicate observation',
      {
        observations: [
          { name: 'a', value: 1 },
          { name: 'a', value: 2 },
        ],
      },
      'qualification_observation_duplicate',
    ],
    [
      'non-JSON observation',
      { observations: [{ name: 'a', value: 1n }] },
      'qualification_observation_invalid',
    ],
    ['verdict', { verdict: 'MAYBE' }, 'qualification_verdict_invalid'],
    ['limitations type', { limitations: [1] }, 'qualification_limitations_invalid'],
    [
      'duplicate limitation',
      { limitations: ['same', 'same'] },
      'qualification_limitations_invalid',
    ],
    [
      'common identity',
      { subject: { kind: 'claim-model', sha256: exactDigest('other') } },
      'qualification_identity_mismatch',
    ],
  ];
  for (const [name, overrides, code] of recordCases)
    assert.throws(() => validateQualificationSet(set([record(overrides)])), { code }, name);

  assert.throws(
    () =>
      validateQualificationSet(
        set([
          record({
            verifier: {
              kind: 'human',
              id: 'reviewer',
              implementationSha256: exactDigest('verifier'),
            },
          }),
        ]),
      ),
    { code: 'qualification_machine_verifier_required' },
  );
  assert.throws(
    () =>
      validateQualificationSet(
        set([
          record({
            kind: 'human',
            verifier: {
              kind: 'machine',
              id: 'machine',
              implementationSha256: exactDigest('verifier'),
            },
          }),
        ]),
      ),
    { code: 'qualification_human_verifier_required' },
  );
  assert.throws(() => validateQualificationSet({ ...set(), records: [] }), {
    code: 'qualification_set_invalid',
  });
  assert.throws(() => validateQualificationSet({ ...set(), schema: 'unknown' }), {
    code: 'qualification_set_invalid',
  });
});

test('binding and admission do not turn a selected candidate into verifier authority', () => {
  const selected = candidate();
  assert.throws(() => qualificationSubject(selected, 'unknown'), {
    code: 'qualification_kind_invalid',
  });
  assert.throws(() => bindQualificationRecord(selected, {}), {
    code: 'qualification_result_invalid',
  });
  assert.throws(() => bindQualificationSet(selected, null), {
    code: 'qualification_records_invalid',
  });
  const mismatched = set([record({}, selected)], selected);
  mismatched.candidateSha256 = exactDigest('other-candidate');
  assert.throws(() => admit(selected, mismatched), {
    code: 'qualification_identity_mismatch',
  });
});

test('qualification records remain non-compensating and bind common identities', () => {
  const failed = validateQualificationSet(
    set([
      record(),
      record({
        id: 'geometry.overlap',
        kind: 'static',
        subject: qualificationSubject(candidate(), 'static'),
        predicate: 'painted-geometry',
        verdict: 'FAIL',
      }),
    ]),
  );
  assert.deepEqual(
    failed.records.map(({ verdict }) => verdict),
    ['PASS', 'FAIL'],
  );
  assert.throws(
    () =>
      validateQualificationSet(
        set([
          record({
            editionDigest: exactDigest('other-edition'),
          }),
        ]),
      ),
    { code: 'qualification_identity_mismatch' },
  );
});

test('validated and admitted qualification values are deeply immutable', () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    qualification = validateQualificationSet(set(undefined, selectedCandidate)),
    admitted = admit(
      selectedCandidate,
      bindQualificationSet(selectedCandidate, recordsFor(selectedCandidate)),
      selected,
    );
  for (const value of [qualification, admitted, admitted.qualification])
    assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(qualification.records), true);
  assert.equal(Object.isFrozen(qualification.records[0]), true);
  assert.equal(Object.isFrozen(admitted.qualification.records[0]), true);
  assert.throws(() => {
    admitted.qualification.records[0].verdict = 'FAIL';
  }, TypeError);
  assert.equal(admitted.verdict, 'PASS');
  assert.equal(admitted.admitted, true);
});

test('human evidence binds a declared artifact and concrete viewing size', () => {
  const selectedCandidate = candidate(),
    human = bindQualificationRecord(selectedCandidate, {
      id: 'human.faithful',
      kind: 'human',
      verifier: {
        kind: 'human',
        id: 'reviewer:human',
        implementationSha256: exactDigest('review-rubric'),
      },
      predicate: 'faithful',
      scope: {
        kind: 'viewport',
        medium: 'interactive',
        artifact: 'atlas',
        width: 1440,
        height: 1000,
      },
      environment: null,
      observations: [{ name: 'notes', value: 'reviewed' }],
      verdict: 'PASS',
      limitations: [],
    });
  assert.deepEqual(human.subject, {
    kind: 'artifact',
    sha256: selectedCandidate.media.interactive.artifacts[0].sha256,
  });
  assert.throws(
    () =>
      bindQualificationRecord(selectedCandidate, {
        id: 'human.unbound',
        kind: 'human',
        verifier: {
          kind: 'human',
          id: 'reviewer:human',
          implementationSha256: exactDigest('review-rubric'),
        },
        predicate: 'faithful',
        scope: { kind: 'document', value: 'candidate.json' },
        environment: null,
        observations: [{ name: 'notes', value: 'reviewed' }],
        verdict: 'PASS',
        limitations: [],
      }),
    { code: 'qualification_human_scope_invalid' },
  );
});

test('bound qualification sets reject forged subjects before admission', () => {
  const selectedCandidate = candidate(),
    semantic = bindQualificationRecord(selectedCandidate, {
      id: 'semantic.bound',
      kind: 'semantic',
      verifier: {
        kind: 'machine',
        id: 'verifier:semantic',
        implementationSha256: exactDigest('verifier:semantic'),
      },
      predicate: 'semantic-integrity',
      scope: { kind: 'document', value: 'candidate.json' },
      environment: null,
      observations: [{ name: 'result', value: 'verified' }],
      verdict: 'PASS',
      limitations: [],
    });
  assert.throws(
    () =>
      bindQualificationSet(selectedCandidate, [
        {
          ...semantic,
          subject: { kind: 'nonsense', sha256: semantic.subject.sha256 },
        },
      ]),
    { code: 'qualification_subject_mismatch' },
  );
});

test('qualification admission rederives obligations from exact Edition authority', () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    forgedCandidate = {
      ...selectedCandidate,
      obligations: selectedCandidate.obligations.map((obligation, index) =>
        index === 0 ? { ...obligation, predicate: 'forged-approval' } : obligation,
      ),
    },
    qualification = bindQualificationSet(forgedCandidate, [
      bindQualificationRecord(forgedCandidate, {
        id: 'semantic.authority',
        kind: 'semantic',
        verifier: {
          kind: 'machine',
          id: 'verifier:semantic',
          implementationSha256: exactDigest('verifier:semantic'),
        },
        predicate: 'claim-model-valid',
        scope: { kind: 'document', value: 'candidate.json' },
        environment: null,
        observations: [{ name: 'result', value: 'verified' }],
        verdict: 'PASS',
        limitations: [],
      }),
    ]);

  assert.throws(() => admit(forgedCandidate, qualification, selected), {
    code: 'candidate_obligation_mismatch',
  });
});

test('record binding derives exact identities for every qualification kind', () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    records = recordsFor(selectedCandidate),
    qualification = bindQualificationSet(selectedCandidate, records),
    admitted = admit(selectedCandidate, qualification, selected);
  assert.equal(admitted.complete, true);
  assert.equal(admitted.admitted, true);
  assert.equal(qualification.editionDigest, selectedCandidate.edition.digest);
  assert.equal(qualification.sourceManifestSha256, selectedCandidate.source.manifestSha256);
  assert.equal(qualification.claimModelDigest, selectedCandidate.claimModel.digest);
  assert.equal(
    qualificationSetDigest(qualification),
    qualificationSetDigest({ ...qualification, records: [...records].reverse() }),
  );
});

test('Edition obligations close exactly and no predicate can substitute for another', () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    records = recordsFor(selectedCandidate),
    complete = bindQualificationSet(selectedCandidate, records),
    admitted = admit(selectedCandidate, complete, selected);
  assert.equal(admitted.complete, true);
  assert.equal(admitted.verdict, 'PASS');
  assert.equal(admitted.admitted, true);
  assert.deepEqual(admitted.missing, []);

  const omitted = selectedCandidate.obligations.at(-1),
    missing = admit(
      selectedCandidate,
      bindQualificationSet(selectedCandidate, records.slice(0, -1)),
      selected,
    );
  assert.equal(missing.complete, false);
  assert.equal(missing.verdict, 'UNKNOWN');
  assert.equal(missing.admitted, false);
  assert.deepEqual(missing.missing, [omitted]);
});

test('Qualification admission rejects duplicate, undeclared and substituted obligations', () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    records = recordsFor(selectedCandidate),
    staticRecord = records.find(({ kind }) => kind === 'static');

  assert.throws(
    () =>
      admit(
        selectedCandidate,
        set([...records, { ...staticRecord, id: 'static.geometry.again' }], selectedCandidate),
        selected,
      ),
    { code: 'qualification_obligation_duplicate' },
  );
  assert.throws(
    () =>
      admit(
        selectedCandidate,
        set(
          [
            ...records,
            record(
              {
                id: 'extra',
                kind: 'coverage',
                subject: qualificationSubject(selectedCandidate, 'coverage'),
                predicate: 'not-declared',
              },
              selectedCandidate,
            ),
          ],
          selectedCandidate,
        ),
        selected,
      ),
    { code: 'qualification_obligation_undeclared' },
  );
  assert.throws(
    () =>
      admit(
        selectedCandidate,
        set(
          [
            ...records,
            record(
              {
                id: 'human.invalid',
                kind: 'human',
                subject: qualificationSubject(selectedCandidate, 'human', {
                  kind: 'viewport',
                  medium: 'interactive',
                  artifact: 'atlas',
                  width: 1440,
                  height: 1000,
                }),
                predicate: 'faithful',
                verifier: {
                  kind: 'machine',
                  id: 'verifier:invalid-human',
                  implementationSha256: exactDigest('invalid-human'),
                },
              },
              selectedCandidate,
            ),
          ],
          selectedCandidate,
        ),
        selected,
      ),
    { code: 'qualification_human_verifier_required' },
  );
  assert.throws(
    () =>
      admit(
        selectedCandidate,
        set(
          records.map((selectedRecord) =>
            selectedRecord === staticRecord
              ? {
                  ...selectedRecord,
                  subject: qualificationSubject(selectedCandidate, 'interactive'),
                }
              : selectedRecord,
          ),
          selectedCandidate,
        ),
        selected,
      ),
    { code: 'qualification_subject_mismatch' },
  );
});

test('qualification input verifies exact authority and exposes no publication claim', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'qualification-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const fixture = await qualificationInputFixture(directory),
    result = await verifyQualificationInput(fixture.requestPath, fixture.requestSha256);
  assert.deepEqual(
    {
      status: result.status,
      verdict: result.verdict,
      complete: result.complete,
      admitted: result.admitted,
      authorization: result.authorization,
      publication: result.publication,
      records: result.records,
    },
    {
      status: 'verified',
      verdict: 'PASS',
      complete: true,
      admitted: true,
      authorization: 'not-performed',
      publication: 'not-performed',
      records: fixture.recordCount,
    },
  );
  await assert.rejects(verifyQualificationInput(fixture.requestPath, exactDigest('changed')), {
    code: 'qualification_digest_mismatch',
  });
});

test('qualification input rejects malformed selection before judging external evidence', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'qualification-input-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const selected = await qualificationInputFixture(directory);
  await assert.rejects(verifyQualificationInput(selected.requestPath, 'bad'), {
    code: 'qualification_digest_required',
  });
  const original = JSON.parse(await fs.readFile(selected.requestPath, 'utf8'));
  const selectedModelBytes = await fs.readFile(path.join(directory, 'claim-model.json'));
  const save = async (plan) => {
    const bytes = Buffer.from(JSON.stringify(plan) + '\n');
    await fs.writeFile(selected.requestPath, bytes);
    return digest(bytes);
  };

  const malformedPlan = Buffer.from('{');
  await fs.writeFile(selected.requestPath, malformedPlan);
  await assert.rejects(verifyQualificationInput(selected.requestPath, digest(malformedPlan)), {
    code: 'qualification_json_invalid',
  });
  await assert.rejects(
    verifyQualificationInput(selected.requestPath, await save({ ...original, claimModel: null })),
    { code: 'qualification_input_invalid' },
  );

  await assert.rejects(
    verifyQualificationInput(selected.requestPath, await save({ ...original, schema: 'unknown' })),
    { code: 'qualification_input_invalid' },
  );
  await assert.rejects(
    verifyQualificationInput(
      selected.requestPath,
      await save({ ...original, claimModel: { ...original.claimModel, path: '../outside' } }),
    ),
    { code: 'qualification_input_invalid' },
  );
  await assert.rejects(
    verifyQualificationInput(
      selected.requestPath,
      await save({
        ...original,
        claimModel: { ...original.claimModel, sha256: exactDigest('other') },
      }),
    ),
    { code: 'qualification_claim_model_digest_mismatch' },
  );

  const malformed = Buffer.from('{');
  await fs.writeFile(path.join(directory, 'claim-model.json'), malformed);
  await assert.rejects(
    verifyQualificationInput(
      selected.requestPath,
      await save({
        ...original,
        claimModel: { ...original.claimModel, sha256: digest(malformed) },
      }),
    ),
    { code: 'qualification_claim_model_json_invalid' },
  );
  await fs.writeFile(path.join(directory, 'claim-model.json'), selectedModelBytes);
  const candidateFile = path.join(directory, 'candidate.json');
  const candidate = JSON.parse(await fs.readFile(candidateFile, 'utf8'));
  candidate.claimModel.sha256 = exactDigest('other-claim-model-bytes');
  const candidateBytes = Buffer.from(JSON.stringify(candidate) + '\n');
  await fs.writeFile(candidateFile, candidateBytes);
  await assert.rejects(
    verifyQualificationInput(
      selected.requestPath,
      await save({
        ...original,
        candidate: { ...original.candidate, sha256: digest(candidateBytes) },
      }),
    ),
    { code: 'qualification_authority_identity_mismatch' },
  );
});

test('generic CLI admits qualification only against exact Candidate and Edition authority', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'qualification-cli-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const fixture = await qualificationInputFixture(directory);

  const result = spawnSync(
    process.execPath,
    [cli, 'qualify', 'verify', fixture.requestPath, '--sha256', fixture.requestSha256],
    { cwd: directory, encoding: 'utf8', timeout: 10000 },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, 'verified');
  assert.equal(output.complete, true);
  assert.equal(output.admitted, true);

  const bare = spawnSync(
    process.execPath,
    [cli, 'qualify', 'verify', fixture.qualificationPath, '--sha256', fixture.qualificationSha256],
    { cwd: directory, encoding: 'utf8', timeout: 10000 },
  );
  assert.notEqual(bare.status, 0, bare.stdout + bare.stderr);
});
