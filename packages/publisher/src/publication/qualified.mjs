// Candidate evidence is selected here; only an external accepter can adopt it.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  selectedEditionCandidateDigest,
  validateSelectedEditionCandidate,
} from '../compiler/candidate.mjs';
import { assessSubmittedQualificationPolicy } from '../qualification/policy.mjs';
import { canonical } from '../semantics/document.mjs';
import { readSourceBundle } from '../source/bundle.mjs';
import { parseStrictJson } from '../source/json.mjs';
import { hasExactFields, isDigest, portablePath } from '../source/manifest.mjs';
import { QUALIFIED_SOURCE } from './contract.mjs';
import { noLinks, planPairFiles } from './files.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

function selectedInputPath(base, name) {
  if (typeof name !== 'string' || path.isAbsolute(name)) fail('qualified_path_invalid');
  try {
    portablePath(name);
  } catch {
    fail('qualified_path_invalid');
  }
  return path.resolve(base, ...name.split('/'));
}

function selectedTargetPath(base, name) {
  if (typeof name !== 'string' || !name.trim()) fail('qualified_path_invalid');
  return path.resolve(base, name);
}

async function selectedJson(base, reference) {
  if (!hasExactFields(reference, ['file', 'sha256']) || !isDigest(reference.sha256))
    fail('qualified_reference_invalid');
  const file = selectedInputPath(base, reference.file);
  await noLinks(file);
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.size > 4 * 1024 * 1024) fail('qualified_reference_invalid');
  const bytes = await fs.readFile(file);
  if (sha(bytes) !== reference.sha256) fail('qualified_reference_changed');
  return {
    file,
    sha256: reference.sha256,
    value: parseStrictJson(bytes, 'qualified_json_invalid', 'qualified_json_duplicate_key'),
  };
}

function selectedEvidence(candidate, lock, set, policy, report) {
  const candidateSha256 = selectedEditionCandidateDigest(candidate);
  if (
    !hasExactFields(lock, ['schema', 'edition', 'sources', 'derived', 'media', 'toolchain']) ||
    lock.schema !== 'architecture.materialized-input-lock/v1' ||
    !Array.isArray(lock.sources) ||
    !lock.sources.length ||
    !Array.isArray(lock.derived) ||
    !hasExactFields(lock.edition, ['id', 'editor', 'bytes', 'sha256', 'resources']) ||
    typeof lock.edition.editor !== 'string' ||
    !lock.edition.editor.trim() ||
    lock.edition.sha256 !== candidate.input.editionSha256 ||
    !Array.isArray(lock.media) ||
    canonical([...lock.media].sort()) !== canonical(['interactive', 'static']) ||
    lock.sources.some(
      (source) =>
        typeof source?.claimant !== 'string' ||
        !source.claimant.trim() ||
        typeof source.namespace !== 'string' ||
        !source.namespace.trim() ||
        !isDigest(source.sha256) ||
        !source.revision,
    )
  )
    fail('qualified_input_lock_invalid');
  let assessed;
  try {
    assessed = assessSubmittedQualificationPolicy(candidate, set.value, policy.value);
  } catch {
    fail('qualified_evidence_invalid');
  }
  const expectedReport = {
    status: 'records-bound',
    qualificationSetDigest: assessed.qualificationSetDigest,
    candidateSha256: assessed.candidateSha256,
    inputLockSha256: assessed.inputLockSha256,
    records: assessed.records,
    attribution: assessed.attribution,
    missingSubmittedPassQuestionScopes: assessed.missingSubmittedPassQuestionScopes,
    completeness: assessed.completeness,
    admitted: assessed.admitted,
    acceptance: assessed.acceptance,
    publication: assessed.publication,
    policySha256: policy.sha256,
    policy: assessed.policy,
    policyAttribution: assessed.policyAttribution,
    submittedVerdict: assessed.submittedVerdict,
    missingRequirements: assessed.missingRequirements,
    unselectedRecords: assessed.unselectedRecords,
    unacceptedLimitations: assessed.unacceptedLimitations,
    nonPassingRecords: assessed.nonPassingRecords,
  };
  if (assessed.submittedVerdict !== 'PASS' || canonical(report.value) !== canonical(expectedReport))
    fail('qualified_report_invalid');
  return { candidateSha256, qualificationSetDigest: assessed.qualificationSetDigest };
}

export async function planQualifiedFilePublication(value, base) {
  if (
    !hasExactFields(value, [
      'schema',
      'candidate',
      'qualifications',
      'roles',
      'options',
      'entries',
      ...(Object.hasOwn(value, 'replacement') ? ['replacement'] : []),
    ]) ||
    value.schema !== 'architecture.qualified-file-publication/v1' ||
    !hasExactFields(value.candidate, ['manifest', 'sha256']) ||
    !isDigest(value.candidate.sha256) ||
    !hasExactFields(value.qualifications, ['set', 'policy', 'report']) ||
    !hasExactFields(value.roles, ['releaseOwner', 'custodian', 'effectAuthorizer']) ||
    ![value.roles.custodian, value.roles.effectAuthorizer].every(
      (role) => typeof role === 'string' && role.trim(),
    ) ||
    (value.roles.releaseOwner !== null &&
      (typeof value.roles.releaseOwner !== 'string' || !value.roles.releaseOwner.trim())) ||
    !hasExactFields(value.options, ['destinations', 'recoveryRoot']) ||
    !hasExactFields(value.options.destinations, ['static', 'interactive']) ||
    !hasExactFields(value.entries, ['static', 'interactive'])
  )
    fail('qualified_input_invalid');
  const manifestPath = selectedInputPath(base, value.candidate.manifest);
  const bundle = await readSourceBundle(manifestPath, value.candidate.sha256, true);
  const root = path.dirname(manifestPath);
  const members = new Map(bundle.members.map((member) => [member.path, member]));
  const candidateMember = members.get('candidate.json');
  const lockMember = members.get('input-lock.json');
  if (!candidateMember || !lockMember) fail('qualified_candidate_incomplete');
  const candidate = validateSelectedEditionCandidate(
    parseStrictJson(
      candidateMember.content,
      'qualified_candidate_json_invalid',
      'qualified_candidate_json_duplicate_key',
    ),
  );
  if (
    !hasExactFields(candidate.media, ['static', 'interactive']) ||
    sha(lockMember.content) !== candidate.input.lockSha256 ||
    bundle.source.id !== 'edition-candidate' ||
    bundle.source.revision !== candidate.input.lockSha256
  )
    fail('qualified_candidate_incomplete');
  const lock = parseStrictJson(
    lockMember.content,
    'qualified_lock_json_invalid',
    'qualified_lock_json_duplicate_key',
  );
  if (canonical(lock) !== lockMember.content.toString('utf8')) fail('qualified_input_lock_invalid');
  const [set, policy, report] = await Promise.all(
    ['set', 'policy', 'report'].map((name) => selectedJson(base, value.qualifications[name])),
  );
  const evidence = selectedEvidence(candidate, lock, set, policy, report);
  const expected = new Set(['candidate.json', 'input-lock.json']);
  const payload = [];
  for (const [medium, slot] of [
    ['static', 'native'],
    ['interactive', 'atlas'],
  ])
    for (const artifact of candidate.media[medium].artifacts) {
      expected.add(artifact.path);
      const member = members.get(artifact.path);
      if (!member || member.bytes !== artifact.bytes || member.sha256 !== artifact.sha256)
        fail('qualified_candidate_artifact_mismatch');
      payload.push({
        medium: slot,
        path: path.posix.basename(artifact.path),
        source: path.join(root, ...artifact.path.split('/')),
        bytes: member.bytes,
        sha256: member.sha256,
      });
    }
  if (expected.size !== members.size || [...members.keys()].some((name) => !expected.has(name)))
    fail('qualified_candidate_members_invalid');
  const source = {
    schema: QUALIFIED_SOURCE,
    candidateManifestSha256: value.candidate.sha256,
    candidateSha256: evidence.candidateSha256,
    inputLockSha256: candidate.input.lockSha256,
    editionSha256: candidate.input.editionSha256,
    qualificationSetSha256: set.sha256,
    qualificationSetDigest: evidence.qualificationSetDigest,
    policySha256: policy.sha256,
    reportSha256: report.sha256,
    evidenceAttribution: 'submitted-unverified',
    roles: {
      claimants: lock.sources.map(({ namespace, claimant, revision, sha256 }) => ({
        namespace,
        claimant,
        revision,
        sha256,
      })),
      editor: lock.edition.editor,
      producer: 'architecture-publisher',
      verifiers: [
        ...new Map(
          set.value.records.map(({ verifier }) => [canonical(verifier), verifier]),
        ).values(),
      ],
      accepter: policy.value.accepter,
      releaseOwner: value.roles.releaseOwner,
      custodian: value.roles.custodian,
      effectAuthorizer: value.roles.effectAuthorizer,
    },
  };
  const options = {
    sourceRoots: [root],
    destinations: {
      native: selectedTargetPath(base, value.options.destinations.static),
      atlas: selectedTargetPath(base, value.options.destinations.interactive),
    },
    recoveryRoot: selectedTargetPath(base, value.options.recoveryRoot),
  };
  const dependencies = [
    { file: manifestPath, sha256: value.candidate.sha256 },
    ...bundle.members.map(({ path: name, sha256 }) => ({
      file: path.join(root, ...name.split('/')),
      sha256,
    })),
    ...[set, policy, report].map(({ file, sha256 }) => ({ file, sha256 })),
  ];
  return planPairFiles({
    options,
    source,
    payload,
    entries: { native: value.entries.static, atlas: value.entries.interactive },
    dependencies,
    ...(value.replacement ? { replacement: value.replacement } : {}),
  });
}
