import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  editionCandidateDigest,
  createEditionCandidate,
  mediaCandidateDigest,
  validateEditionCandidateBinding,
  validateEditionCandidate,
} from '../packages/publisher/src/compiler/candidate.mjs';
import {
  editionDigest,
  interactiveSceneDigest,
  staticSceneDigest,
} from '../packages/publisher/src/edition/contract.mjs';
import { claimModelDigest } from '../packages/publisher/src/semantics/document.mjs';
import { editionFixture } from './fixtures/edition.mjs';

const digest = (value) =>
  createHash('sha256').update(Buffer.from(value)).digest('hex');

function candidate() {
  return {
    schema: 'architecture.edition-candidate/v1',
    source: {
      manifestSha256: digest('source'),
    },
    claimModel: {
      sha256: digest('claim-model-bytes'),
      digest: digest('claim-model-value'),
    },
    edition: {
      sha256: digest('edition-bytes'),
      digest: digest('edition-value'),
    },
    media: {
      static: {
        sceneSha256: digest('static-scene'),
        artifacts: [
          {
            id: 'overview-svg',
            path: 'static/architecture-publisher.svg',
            mediaType: 'image/svg+xml',
            bytes: 123,
            sha256: digest('svg'),
          },
          {
            id: 'overview-png',
            path: 'static/architecture-publisher-6000.png',
            mediaType: 'image/png',
            bytes: 456,
            sha256: digest('png'),
          },
        ],
        supplies: [
          { id: 'font-supply', sha256: digest('fonts') },
          { id: 'raster-supply', sha256: digest('raster') },
        ],
      },
      interactive: {
        sceneSha256: digest('interactive-scenes'),
        artifacts: [
          {
            id: 'standalone-atlas',
            path: 'interactive/architecture-publisher.html',
            mediaType: 'text/html',
            bytes: 789,
            sha256: digest('html'),
          },
        ],
        supplies: [
          { id: 'archify-supply', sha256: digest('archify') },
          { id: 'font-supply', sha256: digest('fonts') },
        ],
      },
    },
    obligations: [
      { kind: 'semantic', predicate: 'source-and-claim-integrity' },
      { kind: 'coverage', predicate: 'required-claims-and-omissions' },
      { kind: 'static', predicate: 'painted-static-geometry' },
      {
        kind: 'interactive',
        predicate: 'browser-behavior-and-complete-views',
      },
      {
        kind: 'accessibility',
        predicate: 'keyboard-focus-contrast-text-and-reduced-motion',
      },
      { kind: 'installed', predicate: 'offline-relocated-reproduction' },
      {
        kind: 'recovery',
        predicate: 'replacement-and-interrupted-effect-recovery',
      },
      { kind: 'human', predicate: 'faithful' },
      { kind: 'human', predicate: 'intelligible' },
      { kind: 'human', predicate: 'restrained' },
    ],
  };
}

test('Edition Candidate is the single exact identity across sibling media', () => {
  const value = candidate(), before = structuredClone(value),
    selected = validateEditionCandidate(value);
  assert.deepEqual(value, before);
  assert.equal(selected.schema, 'architecture.edition-candidate/v1');
  assert.match(editionCandidateDigest(value), /^[a-f0-9]{64}$/);
  assert.notEqual(
    mediaCandidateDigest(selected.media.static),
    mediaCandidateDigest(selected.media.interactive),
  );
});

test('Qualification owns exact subjects rather than the Candidate compiler', async () => {
  const { qualificationSubject } = await import(
    '../packages/publisher/src/qualification/contract.mjs'
  );
  const value = candidate();
  assert.deepEqual(qualificationSubject(value, 'semantic'), {
    kind: 'claim-model',
    sha256: value.claimModel.digest,
  });
  assert.deepEqual(qualificationSubject(value, 'static'), {
    kind: 'static-medium',
    sha256: mediaCandidateDigest(value.media.static),
  });
  assert.deepEqual(qualificationSubject(value, 'accessibility'), {
    kind: 'edition-candidate',
    sha256: editionCandidateDigest(value),
  });
});

test('Candidate identity normalizes declared sets but preserves exact artifacts', () => {
  const left = candidate(), right = structuredClone(left);
  right.obligations.reverse();
  right.media.static.artifacts.reverse();
  right.media.static.supplies.reverse();
  assert.equal(editionCandidateDigest(left), editionCandidateDigest(right));
  right.media.static.artifacts[0].sha256 = digest('changed-artifact');
  assert.notEqual(editionCandidateDigest(left), editionCandidateDigest(right));
});

test('Candidate rejects parallel state, incomplete media and duplicate obligations', () => {
  for (const mutate of [
    (value) => (value.qualification = 'passed'),
    (value) => (value.scope = 'copied Edition scope'),
    (value) => (value.media.static.artifacts = []),
    (value) => (value.media.interactive.supplies = []),
    (value) => value.obligations.push(structuredClone(value.obligations[0])),
    (value) => (value.media.static.artifacts[1].id = 'overview-svg'),
    (value) => (value.media.static.artifacts[1].path = value.media.static.artifacts[0].path),
  ]) {
    const value = candidate();
    mutate(value);
    assert.throws(() => validateEditionCandidate(value), /candidate_/);
  }
});


test('Candidate uses one portable artifact namespace across sibling media', () => {
  const caseCollision = candidate();
  caseCollision.media.static.artifacts[0].path = 'same.HTML';
  caseCollision.media.interactive.artifacts[0].path = 'same.html';
  assert.throws(() => validateEditionCandidate(caseCollision), {
    code: 'candidate_artifact_duplicate',
  });

  const prefixCollision = candidate();
  prefixCollision.media.static.artifacts[0].path = 'shared';
  prefixCollision.media.interactive.artifacts[0].path = 'shared/atlas.html';
  assert.throws(() => validateEditionCandidate(prefixCollision), {
    code: 'candidate_artifact_duplicate',
  });
});

test('validated Candidate values are deeply immutable', () => {
  const selected = validateEditionCandidate(candidate());
  assert.equal(Object.isFrozen(selected), true);
  assert.equal(Object.isFrozen(selected.media), true);
  assert.equal(Object.isFrozen(selected.media.static), true);
  assert.equal(Object.isFrozen(selected.media.static.artifacts), true);
  assert.equal(Object.isFrozen(selected.media.static.artifacts[0]), true);
  assert.equal(Object.isFrozen(selected.obligations), true);
  assert.equal(Object.isFrozen(selected.obligations[0]), true);
  assert.throws(
    () => {
      selected.media.static.artifacts[0].sha256 = digest('mutated');
    },
    TypeError,
  );
});

test('Candidate obligations and scenes are projections of the exact Edition authority', () => {
  const selected = editionFixture(), value = candidate();
  value.source.manifestSha256 = selected.edition.source.manifestSha256;
  value.claimModel.digest = claimModelDigest(selected.model);
  value.edition.digest = editionDigest(selected.model, selected.edition);
  value.media.static.sceneSha256 = staticSceneDigest(
    selected.model,
    selected.edition,
  );
  value.media.interactive.sceneSha256 = interactiveSceneDigest(
    selected.model,
    selected.edition,
  );
  value.obligations = Object.entries(selected.edition.qualification).flatMap(
    ([kind, predicates]) => predicates.map((predicate) => ({ kind, predicate })),
  );
  assert.doesNotThrow(() =>
    validateEditionCandidateBinding(selected.model, selected.edition, value),
  );
  value.obligations.pop();
  assert.throws(
    () => validateEditionCandidateBinding(selected.model, selected.edition, value),
    { code: 'candidate_obligation_mismatch' },
  );
});

test('Candidate creation derives all copied authority from the exact Edition', () => {
  const selected = editionFixture(), template = candidate(),
    created = createEditionCandidate({
      sourceManifestSha256: selected.edition.source.manifestSha256,
      claimModelSha256: template.claimModel.sha256,
      claimModel: selected.model,
      editionSha256: template.edition.sha256,
      edition: selected.edition,
      media: {
        static: {
          ...template.media.static,
          sceneSha256: staticSceneDigest(selected.model, selected.edition),
        },
        interactive: {
          ...template.media.interactive,
          sceneSha256: interactiveSceneDigest(selected.model, selected.edition),
        },
      },
    });
  assert.deepEqual(
    created.obligations,
    Object.entries(selected.edition.qualification)
      .flatMap(([kind, predicates]) =>
        predicates.map((predicate) => ({ kind, predicate })),
      )
      .sort((left, right) =>
        `${left.kind}\u0000${left.predicate}`.localeCompare(
          `${right.kind}\u0000${right.predicate}`,
        ),
      ),
  );
  assert.equal(created.claimModel.digest, claimModelDigest(selected.model));
  assert.equal(created.edition.digest, editionDigest(selected.model, selected.edition));
});
