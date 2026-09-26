import { canonical, deepFreeze, exact, jsonValue, text } from '../semantics/document.mjs';
import { fail, isDigest } from '../source/manifest.mjs';
import {
  selectedEditionCandidateDigest,
  validateSelectedEditionCandidate,
} from '../compiler/candidate.mjs';
import { bindSelectedQualificationSet, requiredText, selectedScope } from './selected.mjs';

const policyKey = ({ predicate, scope, verifier, method }) =>
  canonical({ predicate, scope, verifier, method });

function uniqueTexts(values, valid = requiredText) {
  return Array.isArray(values) && values.every(valid) && new Set(values).size === values.length;
}

function selectedRequirement(value, candidate, obligations, candidateSha256) {
  if (
    !exact(value, ['predicate', 'scope', 'verifier', 'method', 'allowedLimitations']) ||
    !requiredText(value.predicate) ||
    !requiredText(value.method) ||
    !uniqueTexts(value.allowedLimitations) ||
    !exact(value.verifier, ['kind', 'id', 'implementationSha256']) ||
    !['human', 'machine'].includes(value.verifier.kind) ||
    !requiredText(value.verifier.id) ||
    !isDigest(value.verifier.implementationSha256)
  )
    fail('selected_qualification_policy_requirement_invalid');
  try {
    selectedScope(value.scope, candidate, obligations, candidateSha256);
  } catch {
    fail('selected_qualification_policy_scope_invalid');
  }
}

function selectedPolicy(value, candidate, obligations, candidateSha256) {
  try {
    jsonValue(value, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
  } catch {
    fail('selected_qualification_policy_invalid');
  }
  if (
    !exact(value, [
      'schema',
      'id',
      'accepter',
      'candidateSha256',
      'acceptedCandidateLimits',
      'requirements',
    ]) ||
    value.schema !== 'architecture.qualification-policy/v1' ||
    !requiredText(value.id) ||
    !requiredText(value.accepter) ||
    !isDigest(value.candidateSha256) ||
    !uniqueTexts(value.acceptedCandidateLimits, text) ||
    !Array.isArray(value.requirements) ||
    !value.requirements.length ||
    value.requirements.length > 4096
  )
    fail('selected_qualification_policy_invalid');
  if (value.candidateSha256 !== candidateSha256)
    fail('selected_qualification_policy_identity_mismatch');
  if (
    canonical([...value.acceptedCandidateLimits].sort()) !== canonical([...candidate.limits].sort())
  )
    fail('selected_qualification_policy_limits_mismatch');
  const requirements = new Map();
  const coveredQuestions = new Set();
  for (const [index, requirement] of value.requirements.entries()) {
    selectedRequirement(requirement, candidate, obligations, candidateSha256);
    const key = policyKey(requirement);
    if (requirements.has(key)) fail('selected_qualification_policy_duplicate');
    requirements.set(key, { index, requirement });
    if (requirement.scope.kind === 'question')
      coveredQuestions.add(
        JSON.stringify([
          requirement.scope.medium,
          requirement.scope.view,
          requirement.scope.question,
        ]),
      );
  }
  for (const medium of Object.keys(candidate.media))
    for (const view of obligations[medium].views)
      for (const question of view.questionIds)
        if (!coveredQuestions.has(JSON.stringify([medium, view.id, question])))
          fail('selected_qualification_policy_question_missing');
  return requirements;
}

/** Assess submitted records against an invoker-selected policy without authenticating either actor. */
export function assessSelectedQualificationPolicy(candidateValue, replay, setValue, policyValue) {
  const candidate = validateSelectedEditionCandidate(candidateValue);
  const bound = bindSelectedQualificationSet(candidate, replay, setValue);
  const requirements = selectedPolicy(
    policyValue,
    candidate,
    replay.replayedEditionObligations,
    selectedEditionCandidateDigest(candidate),
  );
  const seen = new Set();
  const unselectedRecords = [];
  const unacceptedLimitations = [];
  const nonPassingRecords = [];
  let matchedFailure = false;
  for (const record of bound.qualificationSet.records) {
    const key = policyKey(record);
    const selected = requirements.get(key);
    if (!selected) {
      unselectedRecords.push(record.id);
      continue;
    }
    if (seen.has(key)) fail('selected_qualification_policy_record_duplicate');
    seen.add(key);
    if (
      record.limitations.some((limit) => !selected.requirement.allowedLimitations.includes(limit))
    )
      unacceptedLimitations.push(record.id);
    if (record.verdict !== 'PASS') nonPassingRecords.push(record.id);
    if (record.verdict === 'FAIL') matchedFailure = true;
  }
  const missingRequirements = [...requirements]
    .filter(([key]) => !seen.has(key))
    .map(([, { index }]) => index);
  const complete =
    !missingRequirements.length && !unselectedRecords.length && !unacceptedLimitations.length;
  const submittedVerdict = matchedFailure
    ? 'FAIL'
    : !complete || nonPassingRecords.length
      ? 'UNKNOWN'
      : 'PASS';
  return deepFreeze({
    ...bound,
    policy: { id: policyValue.id, accepter: policyValue.accepter },
    policyAttribution: 'invoker-selected-unverified',
    completeness: complete ? 'submitted-policy-complete' : 'submitted-policy-incomplete',
    submittedVerdict,
    missingRequirements,
    unselectedRecords: unselectedRecords.sort(),
    unacceptedLimitations: unacceptedLimitations.sort(),
    nonPassingRecords: nonPassingRecords.sort(),
    admitted: false,
    acceptance: 'not-performed',
    publication: 'not-performed',
  });
}
