import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';

const cli = fileURLToPath(new URL('../packages/publisher/src/cli/main.mjs', import.meta.url));

test('one exact Build Request yields location-independent sibling media and a complete Candidate', async (t) => {
  const fixture = await selectedNativeEdition(t);
  const first = path.join(fixture.root, 'candidate-one');
  const second = path.join(fixture.root, 'candidate-two');
  const built = await compileEditionCandidateInput(fixture.file, fixture.digest, first);
  assert.equal(built.status, 'built');
  const candidateBytes = await fs.readFile(path.join(first, 'candidate.json'));
  const candidate = JSON.parse(candidateBytes);
  assert.equal(candidate.schema, 'architecture.edition-candidate/v2');
  assert.equal(candidate.input.lockSha256, built.lockSha256);
  assert.deepEqual(
    candidate.input.semanticSupplies.map(({ id }) => id),
    ['likec4-parser', 'publisher-semantic-file-set'],
  );
  assert.equal(Object.hasOwn(candidate.input, 'parserSupplySha256'), false);
  assert.deepEqual(Object.keys(candidate.media).sort(), ['interactive', 'static']);
  assert.deepEqual(
    candidate.obligations.static.assertionIds,
    candidate.obligations.interactive.assertionIds,
  );
  assert.notEqual(candidate.media.static.sceneSha256, candidate.media.interactive.sceneSha256);
  for (const medium of ['static', 'interactive'])
    assert.match(candidate.media[medium].carrierSha256, /^[a-f0-9]{64}$/u);
  const svg = await fs.readFile(path.join(first, 'static/architecture.svg'));
  const png = await fs.readFile(path.join(first, 'static/architecture.png'));
  const html = await fs.readFile(path.join(first, 'interactive/architecture.html'));
  assert.equal(png.readUInt32BE(16), 6000);
  assert.match(svg.toString('utf8'), /Alpha/u);
  assert.doesNotMatch(svg.toString('utf8'), /fixture\/model|fixture\/views/u);
  assert.match(html.toString('utf8'), /What is connected\?/u);
  assert.equal(
    html.includes(Buffer.from('<link rel="icon" href="data:,">')),
    true,
    'successor HTML must not request an implicit favicon',
  );
  assert.doesNotMatch(html.toString('utf8'), /fixture\/model|fixture\/views/u);
  const contents = new Map([
    ['static/architecture.svg', svg],
    ['static/architecture.png', png],
    ['interactive/architecture.html', html],
  ]);
  for (const medium of ['static', 'interactive'])
    for (const selected of candidate.media[medium].artifacts)
      assert.equal(selected.sha256, sha(contents.get(selected.path)));
  const rebuilt = await compileEditionCandidateInput(fixture.file, fixture.digest, second);
  assert.equal(rebuilt.candidateSha256, built.candidateSha256);
  assert.deepEqual(await fs.readFile(path.join(second, 'candidate.json')), candidateBytes);
  assert.notEqual(rebuilt.output, built.output);
});

test('successor output is explicit and legacy output cannot be overridden', async (t) => {
  const fixture = await selectedNativeEdition(t);
  await assert.rejects(compileEditionCandidateInput(fixture.file, fixture.digest), {
    code: 'edition_candidate_output_required',
  });
  assert.deepEqual((await fs.readdir(fixture.root)).sort(), [
    'build-request.json',
    'edition',
    'sources',
  ]);
  const legacy = path.join(fixture.root, 'legacy.json');
  const legacyBytes = Buffer.from(
    JSON.stringify({
      sourceManifest: 'source/manifest.json',
      sourceSha256: 'a'.repeat(64),
      semanticMember: 'semantic.json',
      edition: 'edition.json',
      editionSha256: 'b'.repeat(64),
      output: 'candidate',
    }),
  );
  await fs.writeFile(legacy, legacyBytes);
  await assert.rejects(
    compileEditionCandidateInput(legacy, sha(legacyBytes), path.join(fixture.root, 'override')),
    { code: 'edition_candidate_output_conflict' },
  );
});

test('a changed pinned source cannot produce a Candidate or an output directory', async (t) => {
  const fixture = await selectedNativeEdition(t);
  await fs.appendFile(path.join(fixture.root, 'sources/model.c4'), '\n// changed\n');
  const output = path.join(fixture.root, 'candidate');
  await assert.rejects(compileEditionCandidateInput(fixture.file, fixture.digest, output), {
    code: 'materialized_pin_mismatch',
  });
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
});

test('a one-medium request emits only that requested medium', async (t) => {
  for (const medium of ['static', 'interactive']) {
    const fixture = await selectedNativeEdition(t, { media: [medium], width: 1800 });
    const output = path.join(fixture.root, 'candidate');
    const built = await compileEditionCandidateInput(fixture.file, fixture.digest, output);
    const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json')));
    assert.deepEqual(built.media, [medium]);
    assert.deepEqual(Object.keys(candidate.media), [medium]);
    assert.deepEqual(Object.keys(candidate.obligations), [medium]);
    await assert.rejects(
      fs.stat(path.join(output, medium === 'static' ? 'interactive' : 'static')),
      {
        code: 'ENOENT',
      },
    );
  }
});

test('an unadmitted toolchain profile never becomes an apparently supported Candidate', async (t) => {
  const fixture = await selectedNativeEdition(t, { profile: 'unadmitted' });
  const output = path.join(fixture.root, 'candidate');
  await assert.rejects(compileEditionCandidateInput(fixture.file, fixture.digest, output), {
    code: 'edition_toolchain_profile_unadmitted',
  });
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
});

test('a later static render failure leaves no complete Candidate after interactive work', async (t) => {
  const fixture = await selectedNativeEdition(t, {
    title: 'X'.repeat(2048),
    media: ['interactive', 'static'],
  });
  const output = path.join(fixture.root, 'candidate');
  await assert.rejects(compileEditionCandidateInput(fixture.file, fixture.digest, output), {
    code: 'static_edition_text_unrepresentable',
  });
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
  assert.equal(
    (await fs.readdir(fixture.root)).some((name) => name.startsWith('.edition-candidate-')),
    false,
  );
});

test('destination conflicts and invalid parents fail before output effects', async (t) => {
  const fixture = await selectedNativeEdition(t);
  const occupied = path.join(fixture.root, 'candidate');
  await fs.writeFile(occupied, 'preserve me');
  await assert.rejects(compileEditionCandidateInput(fixture.file, fixture.digest, occupied), {
    code: 'edition_candidate_output_exists',
  });
  assert.equal(await fs.readFile(occupied, 'utf8'), 'preserve me');
  await assert.rejects(
    compileEditionCandidateInput(
      fixture.file,
      fixture.digest,
      path.join(fixture.root, 'missing', 'candidate'),
    ),
    { code: 'edition_candidate_output_parent_invalid' },
  );
  await assert.rejects(fs.stat(path.join(fixture.root, 'missing')), { code: 'ENOENT' });
});

test('Candidate structural validation is public but does not grant source authority', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const output = path.join(fixture.root, 'candidate');
  const result = await compileEditionCandidateInput(fixture.file, fixture.digest, output);
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json')));
  const { validateSelectedEditionCandidate, selectedEditionCandidateDigest } =
    await import('../packages/publisher/src/compiler/index.mjs');
  assert.equal(validateSelectedEditionCandidate(candidate).qualification, 'unqualified');
  assert.equal(selectedEditionCandidateDigest(candidate), result.candidateSha256);
  const parserFree = structuredClone(candidate);
  parserFree.input.semanticSupplies = parserFree.input.semanticSupplies.filter(
    ({ id }) => id !== 'likec4-parser',
  );
  assert.deepEqual(
    validateSelectedEditionCandidate(parserFree).input.semanticSupplies.map(({ id }) => id),
    ['publisher-semantic-file-set'],
  );
  assert.notEqual(selectedEditionCandidateDigest(parserFree), result.candidateSha256);
  for (const change of [
    (value) => (value.qualification = 'accepted'),
    (value) => (value.media.static.artifacts[0].path = 'interactive/architecture.html'),
    (value) => (value.media.unknown = value.media.static),
    (value) => (value.input.extraAuthority = true),
    (value) => value.input.semanticSupplies.push(value.input.semanticSupplies[0]),
    (value) => (value.input.semanticSupplies[0].sha256 = 'not-a-digest'),
    (value) => delete value.input.semanticSupplies[0].basis,
    (value) => (value.input.semanticSupplies[0].basis = 'declared-only'),
    (value) => delete value.media.static.supplies[0].method,
    (value) => (value.input.semanticSupplies = []),
    (value) => {
      value.media.static.supplies.find(({ id }) => id === 'publisher-static-media-file-set').basis =
        'observed';
    },
    (value) => (value.media.interactive.supplies[0].method = 'unrecognized-check/v1'),
  ]) {
    const altered = structuredClone(candidate);
    change(altered);
    assert.throws(() => validateSelectedEditionCandidate(altered));
  }
});

test('the one public build command accepts a successor output effect without changing v1', async (t) => {
  const fixture = await selectedNativeEdition(t, { width: 1800 });
  const output = path.join(fixture.root, 'from-cli');
  const invoked = spawnSync(
    process.execPath,
    [cli, 'edition', 'build', fixture.file, '--sha256', fixture.digest, '--output', output],
    { cwd: fixture.root, encoding: 'utf8', input: '', timeout: 30_000 },
  );
  assert.equal(invoked.status, 0, invoked.stdout + invoked.stderr);
  const result = JSON.parse(invoked.stdout);
  assert.equal(result.status, 'built');
  assert.equal(result.output, output);
  assert.equal(
    (await fs.readFile(path.join(output, 'static/architecture.png'))).readUInt32BE(16),
    1800,
  );
  assert.equal(
    JSON.parse(await fs.readFile(path.join(output, 'candidate.json'))).qualification,
    'unqualified',
  );
  const missing = spawnSync(
    process.execPath,
    [cli, 'edition', 'build', fixture.file, '--sha256', fixture.digest],
    { cwd: fixture.root, encoding: 'utf8', input: '', timeout: 10_000 },
  );
  assert.equal(missing.status, 1, missing.stdout + missing.stderr);
  assert.equal(JSON.parse(missing.stdout).error.code, 'edition_candidate_output_required');
});
