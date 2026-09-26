import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import { verifyQualificationInput } from '../packages/publisher/src/qualification/index.mjs';
import { canonical } from '../packages/publisher/src/semantics/document.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import {
  executableModelProvider,
  selectedNativeEdition,
  sha,
} from './fixtures/selected-native-edition.mjs';

const cli = fileURLToPath(new URL('../packages/publisher/src/cli/main.mjs', import.meta.url));

async function selectedInput(t, supplied = null) {
  const selected = supplied ?? (await selectedNativeEdition(t, { width: 1800 }));
  const built = await compileEditionCandidateInput(
    selected.file,
    selected.digest,
    path.join(selected.root, 'candidate'),
  );
  const set = {
    schema: 'architecture.qualification-set/v2',
    candidateSha256: built.candidateSha256,
    inputLockSha256: built.lockSha256,
    records: [],
  };
  const setBytes = Buffer.from(JSON.stringify(set) + '\n');
  const setPath = path.join(selected.root, 'qualification-set.json');
  await fs.writeFile(setPath, setBytes);
  const input = {
    schema: 'architecture.qualification-input/v2',
    request: { path: path.relative(selected.root, selected.file), sha256: selected.digest },
    candidate: { path: 'candidate/manifest.json', sha256: built.manifestSha256 },
    qualification: { path: 'qualification-set.json', sha256: sha(setBytes) },
  };
  const inputBytes = Buffer.from(JSON.stringify(input) + '\n');
  const inputPath = path.join(selected.root, 'qualification-input.json');
  await fs.writeFile(inputPath, inputBytes);
  return { selected, built, input, inputBytes, inputPath, setBytes, setPath };
}

async function selectedPolicy({ selected, built }) {
  const bundle = await readSourceBundle(built.manifestPath, built.manifestSha256);
  const candidate = JSON.parse(
    bundle.members.find(({ path: member }) => member === 'candidate.json').content,
  );
  const requirements = Object.keys(candidate.media).flatMap((medium) =>
    candidate.obligations[medium].views.flatMap((view) =>
      view.questionIds.map((question) => ({
        predicate: 'visible-question',
        scope: { kind: 'question', medium, view: view.id, question },
        verifier: {
          kind: 'machine',
          id: 'fixture-checker',
          implementationSha256: sha(Buffer.from('fixture-checker')),
        },
        method: 'carrier-inspection/v1',
        allowedLimitations: [],
      })),
    ),
  );
  const policy = {
    schema: 'architecture.qualification-policy/v1',
    id: 'fixture-policy',
    accepter: 'fixture-editor',
    candidateSha256: built.candidateSha256,
    acceptedCandidateLimits: candidate.limits,
    requirements,
  };
  const bytes = Buffer.from(JSON.stringify(policy) + '\n');
  const file = path.join(selected.root, 'qualification-policy.json');
  await fs.writeFile(file, bytes);
  return { file, sha256: sha(bytes), candidate, policy };
}

test('v2 qualification input replays one exact Candidate without granting acceptance', async (t) => {
  const { built, inputBytes, inputPath } = await selectedInput(t);
  const result = await verifyQualificationInput(inputPath, sha(inputBytes));
  assert.equal(result.status, 'records-bound');
  assert.equal(result.candidateSha256, built.candidateSha256);
  assert.equal(result.inputLockSha256, built.lockSha256);
  assert.equal(result.records, 0);
  assert.equal(result.attribution, 'submitted-unverified');
  assert.equal(result.completeness, 'not-assessed-no-policy');
  assert.equal(result.admitted, false);
  assert.equal(result.acceptance, 'not-performed');
  assert.equal(result.publication, 'not-performed');
  assert.equal(result.missingSubmittedPassQuestionScopes.length, 2);
});

test('invoker-selected policy is exact but cannot confer acceptance authority', async (t) => {
  const fixture = await selectedInput(t);
  const policy = await selectedPolicy(fixture);
  const result = await verifyQualificationInput(fixture.inputPath, sha(fixture.inputBytes), [], {
    file: policy.file,
    sha256: policy.sha256,
  });
  assert.equal(result.status, 'records-bound');
  assert.equal(result.policySha256, policy.sha256);
  assert.equal(result.policyAttribution, 'invoker-selected-unverified');
  assert.equal(result.completeness, 'submitted-policy-incomplete');
  assert.deepEqual(result.missingRequirements, [0, 1]);
  assert.equal(result.admitted, false);

  const command = spawnSync(
    process.execPath,
    [
      cli,
      'qualify',
      'verify',
      fixture.inputPath,
      '--sha256',
      sha(fixture.inputBytes),
      '--policy',
      policy.file,
      '--policy-sha256',
      policy.sha256,
    ],
    { encoding: 'utf8', timeout: 20_000 },
  );
  assert.equal(command.status, 0, command.stdout + command.stderr);
  assert.equal(JSON.parse(command.stdout).policySha256, policy.sha256);
});

test('submitted PASS records can fit the selected policy without becoming accepted evidence', async (t) => {
  const fixture = await selectedInput(t);
  const selected = await selectedPolicy(fixture);
  const records = selected.policy.requirements.map((requirement, index) => ({
    id: `question-${index}`,
    predicate: requirement.predicate,
    subject: {
      kind: 'medium',
      sha256: sha(Buffer.from(canonical(selected.candidate.media[requirement.scope.medium]))),
    },
    scope: requirement.scope,
    verifier: requirement.verifier,
    method: requirement.method,
    observations: [{ name: 'visible', value: true }],
    verdict: 'PASS',
    limitations: [],
  }));
  const setBytes = Buffer.from(
    JSON.stringify({
      schema: 'architecture.qualification-set/v2',
      candidateSha256: fixture.built.candidateSha256,
      inputLockSha256: fixture.built.lockSha256,
      records,
    }) + '\n',
  );
  await fs.writeFile(fixture.setPath, setBytes);
  const input = {
    ...fixture.input,
    qualification: { path: 'qualification-set.json', sha256: sha(setBytes) },
  };
  const inputBytes = Buffer.from(JSON.stringify(input) + '\n');
  await fs.writeFile(fixture.inputPath, inputBytes);
  const result = await verifyQualificationInput(fixture.inputPath, sha(inputBytes), [], {
    file: selected.file,
    sha256: selected.sha256,
  });
  assert.equal(result.completeness, 'submitted-policy-complete');
  assert.equal(result.submittedVerdict, 'PASS');
  assert.equal(result.attribution, 'submitted-unverified');
  assert.equal(result.policyAttribution, 'invoker-selected-unverified');
  assert.equal(result.admitted, false);
  assert.equal(result.acceptance, 'not-performed');
});

test('changed selected policy bytes fail before executable Provider code starts', async (t) => {
  const selected = await selectedNativeEdition(t, { width: 1800 });
  const { executionMarker, manifestSha256 } = await executableModelProvider(selected);
  const fixture = await selectedInput(t, selected);
  const policy = await selectedPolicy(fixture);
  await fs.rm(executionMarker);
  await assert.rejects(
    verifyQualificationInput(
      fixture.inputPath,
      sha(fixture.inputBytes),
      [{ id: 'model-provider', manifestSha256 }],
      { file: policy.file, sha256: '0'.repeat(64) },
    ),
    { code: 'qualification_policy_digest_mismatch' },
  );
  await assert.rejects(fs.access(executionMarker), { code: 'ENOENT' });
});

test('a policy with duplicate JSON keys cannot borrow an exact digest', async (t) => {
  const fixture = await selectedInput(t);
  const policy = await selectedPolicy(fixture);
  const bytes = Buffer.from(
    (await fs.readFile(policy.file, 'utf8')).replace(
      '"schema":',
      '"schema":"architecture.qualification-policy/v1","schema":',
    ),
  );
  await fs.writeFile(policy.file, bytes);
  await assert.rejects(
    verifyQualificationInput(fixture.inputPath, sha(fixture.inputBytes), [], {
      file: policy.file,
      sha256: sha(bytes),
    }),
    { code: 'qualification_policy_json_duplicate_key' },
  );
});

test('the sole qualify command forwards invoker-owned Provider choice separately from evidence', async (t) => {
  const { inputBytes, inputPath } = await selectedInput(t);
  const result = spawnSync(
    process.execPath,
    [
      cli,
      'qualify',
      'verify',
      inputPath,
      '--sha256',
      sha(inputBytes),
      '--execute-providers',
      `unselected@${'0'.repeat(64)}`,
    ],
    { encoding: 'utf8', timeout: 10_000 },
  );
  assert.notEqual(result.status, 0);
  assert.equal(
    JSON.parse(result.stdout).error.code,
    'materialized_provider_execution_choice_mismatch',
  );
});

test('v2 qualification rejects ambiguous input and record JSON before admission', async (t) => {
  const { input, inputBytes, inputPath, setBytes, setPath } = await selectedInput(t);
  const ambiguousInput = Buffer.from(
    inputBytes
      .toString('utf8')
      .replace('"schema":', '"schema":"architecture.qualification-input/v2","schema":'),
  );
  await fs.writeFile(inputPath, ambiguousInput);
  await assert.rejects(verifyQualificationInput(inputPath, sha(ambiguousInput)), {
    code: 'qualification_json_duplicate_key',
  });

  const ambiguousSet = Buffer.from(
    setBytes
      .toString('utf8')
      .replace('"schema":', '"schema":"architecture.qualification-set/v2","schema":'),
  );
  await fs.writeFile(setPath, ambiguousSet);
  input.qualification.sha256 = sha(ambiguousSet);
  const selectedInputBytes = Buffer.from(JSON.stringify(input) + '\n');
  await fs.writeFile(inputPath, selectedInputBytes);
  await assert.rejects(verifyQualificationInput(inputPath, sha(selectedInputBytes)), {
    code: 'qualification_set_json_duplicate_key',
  });
});

test('evidence cannot carry its own executable Provider permission', async (t) => {
  const { input, inputPath } = await selectedInput(t);
  const injected = Buffer.from(JSON.stringify({ ...input, executeProviders: [] }) + '\n');
  await fs.writeFile(inputPath, injected);
  await assert.rejects(verifyQualificationInput(inputPath, sha(injected)), {
    code: 'qualification_input_invalid',
  });
  const selectedPolicy = Buffer.from(JSON.stringify({ ...input, policy: 'self-selected' }) + '\n');
  await fs.writeFile(inputPath, selectedPolicy);
  await assert.rejects(verifyQualificationInput(inputPath, sha(selectedPolicy)), {
    code: 'qualification_input_invalid',
  });
});

test('historical v1 cannot borrow successor policy selection', async (t) => {
  const fixture = await selectedInput(t);
  const policy = await selectedPolicy(fixture);
  const legacy = Buffer.from(
    JSON.stringify({ ...fixture.input, schema: 'architecture.qualification-input/v1' }) + '\n',
  );
  await fs.writeFile(fixture.inputPath, legacy);
  await assert.rejects(
    verifyQualificationInput(fixture.inputPath, sha(legacy), [], {
      file: policy.file,
      sha256: policy.sha256,
    }),
    {
      code: 'qualification_policy_choice_unadmitted',
    },
  );
});

test('invalid Qualification Set bytes fail before any Candidate replay', async (t) => {
  const { input, inputPath, setPath } = await selectedInput(t);
  await fs.appendFile(setPath, 'changed');
  input.request.sha256 = '0'.repeat(64);
  const bytes = Buffer.from(JSON.stringify(input) + '\n');
  await fs.writeFile(inputPath, bytes);
  await assert.rejects(verifyQualificationInput(inputPath, sha(bytes)), {
    code: 'qualification_set_digest_mismatch',
  });
});

test('v2 qualification executes only an explicitly chosen exact Provider', async (t) => {
  const selected = await selectedNativeEdition(t, { width: 1800 });
  const { executionMarker, manifestSha256 } = await executableModelProvider(selected);
  const { built, inputBytes, inputPath } = await selectedInput(t, selected);
  await fs.rm(executionMarker);
  await assert.rejects(verifyQualificationInput(inputPath, sha(inputBytes)), {
    code: 'materialized_provider_execution_choice_mismatch',
  });
  await assert.rejects(fs.access(executionMarker), { code: 'ENOENT' });
  const choice = [{ id: 'model-provider', manifestSha256 }];
  const verified = await verifyQualificationInput(inputPath, sha(inputBytes), choice);
  assert.equal(verified.candidateSha256, built.candidateSha256);
  assert(Number.isSafeInteger(Number(await fs.readFile(executionMarker, 'utf8'))));
  await fs.rm(executionMarker);
  const command = spawnSync(
    process.execPath,
    [
      cli,
      'qualify',
      'verify',
      inputPath,
      '--sha256',
      sha(inputBytes),
      '--execute-providers',
      `model-provider@${manifestSha256}`,
    ],
    { encoding: 'utf8', timeout: 20_000 },
  );
  assert.equal(command.status, 0, command.stdout + command.stderr);
  const output = JSON.parse(command.stdout);
  assert.equal(output.status, 'records-bound');
  assert.equal(output.admitted, false);
  assert(Number.isSafeInteger(Number(await fs.readFile(executionMarker, 'utf8'))));
});
