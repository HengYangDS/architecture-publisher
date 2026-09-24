import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BUILD_REQUEST_SCHEMA,
  validateBuildRequest,
} from '../packages/publisher/src/edition/index.mjs';

const A = 'a'.repeat(64);

function request() {
  return {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'edition.json' },
    sources: [
      {
        id: 'ethos-architecture',
        namespace: 'ethos',
        format: { id: 'likec4', version: '1.0.0' },
        claimant: 'ethos-maintainer',
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'locator', path: 'sources/ethos/architecture.likec4' },
      },
      {
        id: 'aigw-architecture',
        namespace: 'aigw',
        format: { id: 'architecture.source-bundle', version: '1' },
        claimant: 'aigw-maintainer',
        revision: { kind: 'opaque', value: 'release-2026-09' },
        input: { kind: 'pin', path: 'sources/aigw/source.json', sha256: A },
      },
    ],
    providers: [],
    media: ['static', 'interactive'],
    toolchain: { profile: 'portable' },
  };
}

test('Build Request is a versioned closed authoring contract, not a generated seal', () => {
  const value = request();
  const before = structuredClone(value);
  const selected = validateBuildRequest(value);
  assert.equal(BUILD_REQUEST_SCHEMA.$id, 'architecture.build-request/v1');
  assert.deepEqual(selected, before);
  assert.deepEqual(value, before);
  assert.notEqual(selected, value);
  assert.equal(Object.isFrozen(selected), true);
  assert.equal(Object.isFrozen(selected.sources[0]), true);
  assert.deepEqual(selected.media, ['static', 'interactive']);
});

test('Build Request rejects unknown fields and unsupported version at every owner', () => {
  for (const change of [
    (v) => (v.schema = 'architecture.build-request/v2'),
    (v) => (v.authoredInputSha256 = A),
    (v) => (v.sources[0].format.extra = true),
    (v) => (v.sources[0].revision.commit = A),
    (v) => (v.edition.candidate = 'approved'),
    (v) => (v.toolchain.rendererCode = './custom.mjs'),
    (v) => v.media.push('pdf'),
  ]) {
    const value = request();
    change(value);
    assert.throws(() => validateBuildRequest(value), { code: 'build_request_invalid' });
  }
});

test('Build Request selects exactly one Edition root across direct and Provider material', () => {
  const selected = request();
  selected.sources = [];
  selected.providers = [{ id: 'editor-input', manifest: 'providers/editor.json', sha256: A }];
  selected.edition = {
    kind: 'provider',
    provider: 'editor-input',
  };
  assert.deepEqual(validateBuildRequest(selected).edition, selected.edition);

  for (const change of [
    (v) => (v.edition.provider = 'absent'),
    (v) => (v.edition.root = 'edition'),
    (v) => (v.edition.manifest = 'edition.json'),
    (v) => (v.edition.directRoot = 'other'),
    (v) => (v.providers[0].id = 'editor-input/other'),
    (v) => v.providers.push(structuredClone(v.providers[0])),
  ]) {
    const value = structuredClone(selected);
    change(value);
    assert.throws(() => validateBuildRequest(value), { code: 'build_request_invalid' });
  }
});

test('Build Request rejects source ambiguity, unsafe paths, and unselected inputs', () => {
  for (const change of [
    (v) => (v.sources[1].id = 'ethos-architecture'),
    (v) => (v.sources[1].namespace = 'ethos'),
    (v) => (v.sources[0].input.path = '../ambient/source.likec4'),
    (v) => (v.sources[0].input.path = 'C:\\ambient\\source.likec4'),
    (v) => (v.sources[1].input.sha256 = 'not-a-digest'),
    (v) => (v.sources[0].revision = { kind: 'vcs', repository: 'repo', ref: '' }),
    (v) => (v.media = ['static', 'static']),
    (v) => {
      v.sources = [];
      v.providers = [];
    },
  ]) {
    const value = request();
    change(value);
    assert.throws(() => validateBuildRequest(value), { code: 'build_request_invalid' });
  }
});

test('source namespaces are opaque owner-qualified identities, not local slugs', () => {
  const value = request();
  value.sources[0].namespace = 'org.example/ethos.architecture';
  assert.doesNotThrow(() => validateBuildRequest(value));
});

test('content revision declares its algorithm but not a hand-maintained digest', () => {
  const value = request();
  value.sources[0].revision = { kind: 'content', algorithm: 'sha256' };
  assert.doesNotThrow(() => validateBuildRequest(value));
  value.sources[0].revision.canonicalization = 'publisher-json/v1';
  assert.doesNotThrow(() => validateBuildRequest(value));
  value.sources[0].revision.canonicalization = 'unknown';
  assert.throws(() => validateBuildRequest(value), { code: 'build_request_invalid' });
  value.sources[0].revision.canonicalization = 'raw-bytes/v1';
  value.sources[0].revision.value = A;
  assert.throws(() => validateBuildRequest(value), { code: 'build_request_invalid' });
});

test('a VCS selector may name the Build Request root exactly', () => {
  const value = request();
  value.sources[0].revision = { kind: 'vcs', repository: '.', ref: 'HEAD' };
  assert.doesNotThrow(() => validateBuildRequest(value));
});
