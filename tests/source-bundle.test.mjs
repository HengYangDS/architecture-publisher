import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateManifest} from '../packages/publisher/src/source/manifest.mjs';
import {readSourceBundle} from '../packages/publisher/src/source/bundle.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const evidence = new URL('../build/test-work/', import.meta.url);
async function fixture(t) {
  await fs.mkdir(evidence, {recursive: true});
  const root = await fs.mkdtemp(new URL('source with spaces-', evidence));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  const bytes = Buffer.from('{"nodes":["service","database"],"condition":"all requests"}\n');
  await fs.mkdir(path.join(root, 'input'));
  await fs.writeFile(path.join(root, 'input/model.json'), bytes);
  const manifest = {schema: 'architecture.source-bundle/v1', source: {id: 'example:service', revision: 'release-1'}, files: [{path: 'input/model.json', bytes: bytes.length, sha256: sha(bytes)}]};
  const file = path.join(root, 'manifest.json');
  const save = async () => {const raw = Buffer.from(JSON.stringify(manifest)); await fs.writeFile(file, raw); return sha(raw);};
  return {root, file, bytes, manifest, save, digest: await save()};
}

test('reads a source without Git or ETHOS, and binds the selected bytes', async t => {
  const f = await fixture(t);
  const result = await readSourceBundle(f.file, f.digest);
  assert.deepEqual(result.source, f.manifest.source);
  assert.equal(result.manifestSha256, f.digest);
  assert.deepEqual(result.members[0].content, f.bytes);
  assert.equal(result.scope, 'source-file-integrity');
  assert.equal(result.officialReplay, 'not-performed');
  assert.equal(result.semanticAcceptance, 'not-performed');
});

test('manifest validation is data-only and does not require a Git revision', async t => {
  const f = await fixture(t);
  delete f.manifest.source.revision;
  const result = validateManifest(f.manifest);
  assert.deepEqual(result.source, {id: 'example:service'});
  assert.notEqual(result, f.manifest);
});

for (const bad of ['../escape', '/absolute', 'C:/drive', 'input\\file', 'input/./file', 'input//file', 'input/../file', 'input/a\0b', 'input/name.', 'input/name ', 'input/CON.txt', 'input/AUX', 'input/x:y', 'input/a?b', 'input/COM¹.txt', 'input/name ', 'input/\ud800.json']) {
  test(`rejects unsafe portable path ${JSON.stringify(bad)}`, async t => {
    const f = await fixture(t); f.manifest.files[0].path = bad;
    assert.throws(() => validateManifest(f.manifest), {code: 'member_path_invalid'});
  });
}

for (const second of ['input/model.json', 'INPUT/MODEL.JSON']) {
  test(`rejects duplicate or portable alias ${second}`, async t => {
    const f = await fixture(t); f.manifest.files.push({...f.manifest.files[0], path: second});
    assert.throws(() => validateManifest(f.manifest), {code: 'member_path_duplicate'});
  });
}

test('rejects normalized Unicode aliases', async t => {
  const f = await fixture(t); f.manifest.files[0].path = 'input/é.json';
  f.manifest.files.push({...f.manifest.files[0], path: 'input/e\u0301.json'});
  assert.throws(() => validateManifest(f.manifest), {code: 'member_path_duplicate'});
});

for (const [label, mutate, code] of [
  ['unknown schema', m => {m.schema = 'unknown';}, 'schema_unsupported'],
  ['missing source', m => {delete m.source;}, 'manifest_fields_invalid'],
  ['empty source identity', m => {m.source.id = '';}, 'source_invalid'],
  ['executable source field', m => {m.source.command = 'echo bad';}, 'source_invalid'],
  ['empty members', m => {m.files = [];}, 'members_invalid'],
  ['fractional size', m => {m.files[0].bytes = 1.5;}, 'member_size_invalid'],
  ['negative size', m => {m.files[0].bytes = -1;}, 'member_size_invalid'],
  ['overlarge member', m => {m.files[0].bytes = 33 * 1024 * 1024;}, 'member_size_invalid'],
  ['invalid digest', m => {m.files[0].sha256 = 'abc';}, 'member_digest_invalid']
]) {
  test(`rejects ${label}`, async t => {
    const f = await fixture(t); mutate(f.manifest);
    assert.throws(() => validateManifest(f.manifest), {code});
  });
}

test('requires a caller-selected digest, not a self-authorized manifest', async t => {
  const f = await fixture(t);
  await assert.rejects(readSourceBundle(f.file, '0'.repeat(64)), {code: 'manifest_digest_mismatch'});
  await assert.rejects(readSourceBundle(f.file), {code: 'manifest_digest_required'});
});

test('rejects changed member bytes even when length stays constant', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'input/model.json'), Buffer.alloc(f.bytes.length, 'x'));
  await assert.rejects(readSourceBundle(f.file, f.digest), {code: 'member_digest_mismatch'});
});

test('rejects changed size, missing and undeclared members', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'input/model.json'), 'x');
  await assert.rejects(readSourceBundle(f.file, f.digest), {code: 'member_size_mismatch'});
  await fs.unlink(path.join(f.root, 'input/model.json'));
  await assert.rejects(readSourceBundle(f.file, f.digest), {code: 'bundle_members_mismatch'});
  await fs.writeFile(path.join(f.root, 'input/model.json'), f.bytes);
  await fs.writeFile(path.join(f.root, '.hidden-extra'), 'not listed');
  await assert.rejects(readSourceBundle(f.file, f.digest), {code: 'bundle_members_mismatch'});
});

test('rejects symlink members and symlink manifest', async t => {
  const f = await fixture(t);
  await fs.rename(path.join(f.root, 'input/model.json'), path.join(f.root, 'input/actual.json'));
  await fs.symlink('actual.json', path.join(f.root, 'input/model.json'));
  await assert.rejects(readSourceBundle(f.file, f.digest), {code: 'bundle_symlink_forbidden'});
  await fs.rename(f.file, path.join(f.root, 'actual-manifest.json'));
  await fs.symlink('actual-manifest.json', f.file);
  await assert.rejects(readSourceBundle(f.file, f.digest), {code: 'bundle_symlink_forbidden'});
});

test('rejects symlink directory and self-inclusion', async t => {
  const f = await fixture(t);
  await fs.rename(path.join(f.root, 'input'), path.join(f.root, 'actual-input'));
  await fs.symlink('actual-input', path.join(f.root, 'input'));
  await assert.rejects(readSourceBundle(f.file, f.digest), {code: 'bundle_symlink_forbidden'});
  await fs.unlink(path.join(f.root, 'input'));
  await fs.rename(path.join(f.root, 'actual-input'), path.join(f.root, 'input'));
  f.manifest.files.push({path: 'manifest.json', bytes: 0, sha256: sha('')});
  await assert.rejects(readSourceBundle(f.file, await f.save()), {code: 'manifest_self_member'});
});

test('rejects inconsistent directory aliases before filesystem access', async t => {
  const f = await fixture(t);
  f.manifest.files = ['Directory/a', 'directory/b'].map(p => ({...f.manifest.files[0], path: p}));
  assert.throws(() => validateManifest(f.manifest), {code: 'member_path_duplicate'});
});

test('uses UTF-8 component byte limits, not JavaScript character count', async t => {
  const f = await fixture(t);
  f.manifest.files[0].path = 'é'.repeat(128);
  assert.throws(() => validateManifest(f.manifest), {code: 'member_path_invalid'});
  f.manifest.files[0].path = 'é'.repeat(127) + 'a';
  assert.equal(validateManifest(f.manifest).files[0].path, f.manifest.files[0].path);
});
