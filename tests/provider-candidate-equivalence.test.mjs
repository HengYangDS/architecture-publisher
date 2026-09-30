import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import {
  executableModelProvider,
  moveModelToProvider,
  selectedNativeEdition,
  sha,
} from './fixtures/selected-native-edition.mjs';

test('delivery modes preserve locked meaning while Candidate media disclose distinct limits', async (t) => {
  const direct = await selectedNativeEdition(t, { width: 1800 });
  const declarative = await selectedNativeEdition(t, { width: 1800 });
  await moveModelToProvider(declarative);
  const executable = await selectedNativeEdition(t, { width: 1800 });
  const { executionMarker } = await executableModelProvider(executable);

  const build = async (selected, executionChoice) => {
    const result = await compileEditionCandidateInput(
      selected.file,
      selected.digest,
      path.join(selected.root, 'candidate'),
      executionChoice,
    );
    const bundle = await readSourceBundle(result.manifestPath, result.manifestSha256);
    return {
      lockSha256: result.lockSha256,
      members: Object.fromEntries(
        bundle.members
          .filter(({ path: name }) => name !== 'candidate.json')
          .map(({ path: name, content }) => [name, sha(content)]),
      ),
      candidate: JSON.parse(
        bundle.members.find(({ path: name }) => name === 'candidate.json').content,
      ),
    };
  };
  const selectedDirect = await build(direct);
  const selectedDeclarative = await build(declarative);
  const selectedExecutable = await build(executable, [
    { id: 'model-provider', manifestSha256: executable.request.providers[0].sha256 },
  ]);
  for (const alternate of [selectedDeclarative, selectedExecutable]) {
    assert.equal(alternate.lockSha256, selectedDirect.lockSha256);
    assert.equal(alternate.members['input-lock.json'], selectedDirect.members['input-lock.json']);
    assert.equal(
      alternate.candidate.input.semanticDigest,
      selectedDirect.candidate.input.semanticDigest,
    );
    assert.equal(
      alternate.candidate.input.editionSha256,
      selectedDirect.candidate.input.editionSha256,
    );
    assert.deepEqual(alternate.candidate.obligations, selectedDirect.candidate.obligations);
    for (const medium of ['static', 'interactive']) {
      assert.equal(
        alternate.candidate.media[medium].carrierSha256,
        selectedDirect.candidate.media[medium].carrierSha256,
      );
      assert.deepEqual(
        alternate.candidate.media[medium].supplies,
        selectedDirect.candidate.media[medium].supplies,
      );
    }
  }
  assert.deepEqual(selectedDeclarative.members, selectedDirect.members);
  assert.deepEqual(selectedDeclarative.candidate.limits, selectedDirect.candidate.limits);
  assert.notEqual(
    selectedDeclarative.candidate.input.closure,
    selectedDirect.candidate.input.closure,
  );
  assert(selectedExecutable.candidate.limits.includes('provider-dependencies-unobserved'));
  assert.notDeepEqual(selectedExecutable.candidate.limits, selectedDirect.candidate.limits);
  for (const medium of ['static', 'interactive'])
    assert.notEqual(
      selectedExecutable.candidate.media[medium].sceneSha256,
      selectedDirect.candidate.media[medium].sceneSha256,
    );
  await fs.access(executionMarker);
});
