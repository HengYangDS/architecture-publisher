import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  selectedEditionCandidateDigest,
  validateSelectedEditionCandidate,
} from '../compiler/candidate.mjs';
import { compileEditionCandidateInput } from '../compiler/edition.mjs';
import { exact } from '../semantics/document.mjs';
import { readSourceBundle } from '../source/bundle.mjs';
import { parseStrictJson } from '../source/json.mjs';
import { isDigest } from '../source/manifest.mjs';
import { invokeQualificationWorker } from './process-boundary.mjs';

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

/** Bind a Candidate and retain its already-verified value for the same invocation. */
export async function replaySelectedCandidate(input, executionChoice = []) {
  if (
    !exact(input, [
      'requestPath',
      'requestSha256',
      'candidateManifestPath',
      'candidateManifestSha256',
    ]) ||
    typeof input.requestPath !== 'string' ||
    !input.requestPath ||
    typeof input.candidateManifestPath !== 'string' ||
    !input.candidateManifestPath ||
    !isDigest(input.requestSha256) ||
    !isDigest(input.candidateManifestSha256)
  )
    fail('selected_candidate_replay_input_invalid');
  const bundle = await readSourceBundle(
    input.candidateManifestPath,
    input.candidateManifestSha256,
    true,
  );
  const member = bundle.members.find(({ path: selected }) => selected === 'candidate.json');
  if (!member) fail('selected_candidate_missing');
  const candidate = validateSelectedEditionCandidate(
    parseStrictJson(
      member.content,
      'selected_candidate_json_invalid',
      'selected_candidate_json_duplicate_key',
    ),
  );
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), 'archpub-candidate-replay-'),
  );
  try {
    const rebuilt = await compileEditionCandidateInput(
      input.requestPath,
      input.requestSha256,
      path.join(scratch, 'candidate'),
      executionChoice,
    );
    const candidateSha256 = selectedEditionCandidateDigest(candidate);
    if (
      rebuilt.candidateSha256 !== candidateSha256 ||
      rebuilt.manifestSha256 !== bundle.manifestSha256
    )
      fail('selected_candidate_replay_mismatch');
    // Full byte replay rebuilds from pinned inputs; an explicitly selected Provider can run again.
    const replay = {
      status: 'replayed',
      verdict: 'match',
      scope: 'selected-input-current-runtime-byte-replay',
      candidateSha256,
      inputLockSha256: rebuilt.lockSha256,
      candidateManifestSha256: bundle.manifestSha256,
      replayedEditionObligations: candidate.obligations,
      qualification: 'not-performed',
      acceptance: 'not-performed',
      publication: 'not-performed',
      limits: [
        'not-original-builder-attestation',
        'not-independent-semantic-or-visual-verification',
      ],
    };
    return { candidate, replay };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

/** Public replay value; the Candidate object remains invocation-local. */
export async function verifySelectedCandidateReplay(input, executionChoice = []) {
  return invokeQualificationWorker('replay', input, executionChoice);
}
