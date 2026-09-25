import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import { verifyQualificationInput } from '../packages/publisher/src/qualification/index.mjs';
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

test('v2 qualification input replays one exact Candidate without granting acceptance', async (t) => {
  const { built, inputBytes, inputPath } = await selectedInput(t);
  const result = await verifyQualificationInput(inputPath, sha(inputBytes));
  assert.equal(result.status, 'verified');
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
  assert.equal(JSON.parse(command.stdout).admitted, false);
  assert(Number.isSafeInteger(Number(await fs.readFile(executionMarker, 'utf8'))));
});
