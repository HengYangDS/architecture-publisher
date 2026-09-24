import assert from 'node:assert/strict';
import test from 'node:test';
import * as providerContract from '../packages/publisher/src/provider/index.mjs';

const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const C = 'c'.repeat(64);

function manifest(kind = 'declarative') {
  return {
    schema: 'architecture.edition-provider/v2',
    provider: { id: 'example-provider', revision: '1.0.0' },
    selected: {
      native: [
        {
          id: 'model',
          namespace: 'org.example/service',
          claimant: 'service-maintainer',
          format: { id: 'example/native', version: '1' },
          revision: { kind: 'content', algorithm: 'sha256' },
          bytes: 12,
          sha256: A,
        },
      ],
      derived: [
        {
          id: 'index',
          claimant: 'adapter-maintainer',
          format: { id: 'example/import-index', version: '1' },
          derivedFrom: ['model'],
          adapter: { id: 'native-reader', version: '1', contentSha256: B },
          method: 'import/v1',
          bytes: 23,
          sha256: C,
        },
      ],
      edition: null,
    },
    delivery:
      kind === 'declarative'
        ? {
            kind,
            files: [
              { kind: 'native', id: 'model', path: 'model.src' },
              { kind: 'derived', id: 'index', path: 'index.json' },
            ],
          }
        : {
            kind,
            package: {
              name: '@example/provider',
              version: '1.0.0',
              packageJsonSha256: A,
              contentSha256: B,
              entrypoint: './provider',
            },
            inputs: [
              {
                id: 'source',
                path: 'inputs/source.json',
                mediaType: 'application/json',
                bytes: 12,
                sha256: A,
              },
            ],
            nativeInputs: [{ item: 'model', input: 'source' }],
            editionInput: null,
            editionResourceInputs: [],
          },
  };
}

test('v2 Provider is a closed, frozen selected contract separate from v1', () => {
  assert.equal(typeof providerContract.validateEditionProviderV2, 'function');
  for (const kind of ['declarative', 'executable']) {
    const value = manifest(kind);
    const selected = providerContract.validateEditionProviderV2(value);
    assert.deepEqual(selected, value);
    assert.notEqual(selected, value);
    assert.equal(Object.isFrozen(selected.selected.native[0]), true);
    assert.equal(selected.delivery.kind, kind);
    assert.throws(() => providerContract.validateEditionProvider(value), {
      code: 'edition_provider_fields_invalid',
    });
  }
});

test('Provider identity and transport never authorize Candidate, acceptance, or publication', () => {
  for (const change of [
    (v) => (v.candidate = A),
    (v) => (v.selected.acceptance = 'approved'),
    (v) => (v.selected.native[0].publication = 'released'),
    (v) => (v.selected.derived[0].authority = 'endorsed'),
    (v) => (v.delivery.qualification = 'pass'),
  ]) {
    const value = manifest();
    change(value);
    assert.throws(() => providerContract.validateEditionProviderV2(value), {
      code: 'edition_provider_v2_invalid',
    });
  }
});

test('native and derived identity is globally unambiguous and derivedFrom is selected', () => {
  const nativeOnly = manifest();
  nativeOnly.selected.derived = [];
  nativeOnly.delivery.files.pop();
  assert.equal(providerContract.validateEditionProviderV2(nativeOnly).selected.native.length, 1);
  const multiSource = manifest();
  multiSource.selected.native.push({
    ...structuredClone(multiSource.selected.native[0]),
    id: 'second-source',
    namespace: 'org.example/other',
    claimant: 'other-maintainer',
    sha256: B,
  });
  multiSource.delivery.files.push({ kind: 'native', id: 'second-source', path: 'other.src' });
  assert.equal(providerContract.validateEditionProviderV2(multiSource).selected.native.length, 2);

  for (const change of [
    (v) => (v.selected.derived[0].derivedFrom = ['missing']),
    (v) => (v.selected.derived[0].id = 'model'),
    (v) => v.selected.native.push({ ...v.selected.native[0], id: 'another' }),
    (v) => {
      v.selected.derived.push({ ...v.selected.derived[0], id: 'second', derivedFrom: ['index'] });
      v.delivery.files.push({ kind: 'derived', id: 'second', path: 'second.json' });
    },
    (v) => (v.selected.native = []),
    (v) => (v.selected.native[0].sha256 = 'bad'),
    (v) => (v.selected.native[0].namespace = '\ud800'),
  ]) {
    const value = manifest();
    change(value);
    assert.throws(() => providerContract.validateEditionProviderV2(value), {
      code: 'edition_provider_v2_invalid',
    });
  }
});

test('declarative paths cover exactly selected contributions without aliases', () => {
  for (const change of [
    (v) => v.delivery.files.pop(),
    (v) => v.delivery.files.push({ kind: 'native', id: 'unselected', path: 'extra.src' }),
    (v) => (v.delivery.files[1].path = 'MODEL.src'),
    (v) => (v.delivery.files[1].path = 'model.src/child'),
    (v) => {
      v.selected.native.push({
        ...structuredClone(v.selected.native[0]),
        id: 'second-source',
        namespace: 'org.example/other',
        sha256: B,
      });
      v.delivery.files[0].path = 'Foo/one.src';
      v.delivery.files.push({ kind: 'native', id: 'second-source', path: 'foo/two.src' });
    },
    (v) => (v.delivery.files[1].path = '../ambient.json'),
    (v) => (v.delivery.kind = 'unknown'),
    (v) => (v.delivery.executable = {}),
  ]) {
    const value = manifest();
    change(value);
    assert.throws(() => providerContract.validateEditionProviderV2(value), {
      code: 'edition_provider_v2_invalid',
    });
  }
  const withEdition = manifest();
  withEdition.selected.edition = {
    id: 'atlas',
    editor: 'named-editor',
    bytes: 90,
    sha256: B,
    resources: [],
  };
  assert.throws(() => providerContract.validateEditionProviderV2(withEdition), {
    code: 'edition_provider_v2_invalid',
  });
  withEdition.delivery.files.push({ kind: 'edition', id: 'atlas', path: 'edition/project.json' });
  assert.equal(
    providerContract.validateEditionProviderV2(withEdition).selected.edition.id,
    'atlas',
  );
  const editorialOnly = manifest();
  editorialOnly.selected.native = [];
  editorialOnly.selected.derived = [];
  editorialOnly.selected.edition = {
    id: 'atlas',
    editor: 'named-editor',
    bytes: 90,
    sha256: B,
    resources: [],
  };
  editorialOnly.delivery.files = [{ kind: 'edition', id: 'atlas', path: 'edition/project.json' }];
  assert.equal(
    providerContract.validateEditionProviderV2(editorialOnly).selected.edition.id,
    'atlas',
  );
});

test('executable selection pins one package and bounded inputs, not a parallel command plane', () => {
  const withEdition = manifest('executable');
  withEdition.selected.edition = {
    id: 'atlas',
    editor: 'named-editor',
    bytes: 90,
    sha256: B,
    resources: [],
  };
  withEdition.delivery.inputs.push({
    id: 'authored-edition',
    path: 'inputs/edition.json',
    mediaType: 'application/json',
    bytes: 90,
    sha256: B,
  });
  withEdition.delivery.editionInput = 'authored-edition';
  assert.equal(
    providerContract.validateEditionProviderV2(withEdition).selected.edition.id,
    'atlas',
  );

  for (const change of [
    (v) => (v.delivery.package.contentSha256 = 'bad'),
    (v) => (v.delivery.package.entrypoint = '../checkout/provider'),
    (v) => (v.delivery.inputs[0].path = '/absolute/path'),
    (v) => v.delivery.inputs.push(structuredClone(v.delivery.inputs[0])),
    (v) => {
      v.delivery.inputs[0].path = 'Foo/one.json';
      v.delivery.inputs.push({
        ...structuredClone(v.delivery.inputs[0]),
        id: 'extra',
        path: 'foo/two.json',
      });
    },
    (v) => (v.delivery.inputs[0].id = 'provider-manifest'),
    (v) => (v.delivery.nativeInputs = []),
    (v) => (v.delivery.nativeInputs[0].input = 'missing'),
    (v) => (v.delivery.inputs[0].sha256 = C),
    (v) => v.delivery.nativeInputs.push({ item: 'model', input: 'source' }),
    (v) => (v.delivery.editionInput = 'source'),
    (v) =>
      (v.selected.edition = {
        id: 'atlas',
        editor: 'named-editor',
        bytes: 12,
        sha256: A,
        resources: [],
      }),
    (v) => (v.delivery.files = []),
  ]) {
    const value = manifest('executable');
    change(value);
    assert.throws(() => providerContract.validateEditionProviderV2(value), {
      code: 'edition_provider_v2_invalid',
    });
  }
});

test('Edition resource descriptors require exact and unambiguous delivery bindings', () => {
  const resource = { ref: 'palette.json', bytes: 12, sha256: C };
  const authored = {
    id: 'atlas',
    editor: 'named-editor',
    bytes: 90,
    sha256: B,
    resources: [resource],
  };
  const declarative = manifest();
  declarative.selected.edition = structuredClone(authored);
  declarative.delivery.files.push(
    { kind: 'edition', id: 'atlas', path: 'edition/project.json' },
    { kind: 'edition-resource', id: 'palette.json', path: 'edition/palette.json' },
  );
  assert.equal(
    providerContract.validateEditionProviderV2(declarative).selected.edition.resources.length,
    1,
  );
  for (const change of [
    (value) => value.selected.edition.resources.pop(),
    (value) => delete value.selected.edition.resources,
    (value) => (value.selected.edition.resources[0].bytes = 4 * 1024 * 1024 + 1),
    (value) => {
      value.selected.edition.resources.push({ ...resource, ref: 'PALETTE.json' });
      value.delivery.files.push({
        kind: 'edition-resource',
        id: 'PALETTE.json',
        path: 'second.json',
      });
    },
    (value) => (value.delivery.files.at(-1).path = 'edition/project.json'),
  ]) {
    const value = structuredClone(declarative);
    change(value);
    assert.throws(() => providerContract.validateEditionProviderV2(value), {
      code: 'edition_provider_v2_invalid',
    });
  }

  const executable = manifest('executable');
  executable.selected.edition = structuredClone(authored);
  executable.delivery.inputs.push(
    {
      id: 'authored-edition',
      path: 'inputs/edition.json',
      mediaType: 'application/json',
      bytes: 90,
      sha256: B,
    },
    {
      id: 'palette',
      path: 'inputs/palette.json',
      mediaType: 'application/json',
      bytes: 12,
      sha256: C,
    },
  );
  executable.delivery.editionInput = 'authored-edition';
  executable.delivery.editionResourceInputs = [{ ref: 'palette.json', input: 'palette' }];
  assert.equal(
    providerContract.validateEditionProviderV2(executable).selected.edition.resources.length,
    1,
  );
  for (const change of [
    (value) => (value.delivery.editionResourceInputs = []),
    (value) => (value.delivery.editionResourceInputs[0].ref = 'unknown.json'),
    (value) => (value.delivery.editionResourceInputs[0].input = 'source'),
    (value) => (value.delivery.editionResourceInputs[0].input = 'authored-edition'),
    (value) => (value.delivery.inputs.at(-1).sha256 = A),
    (value) => value.delivery.editionResourceInputs.push({ ref: 'palette.json', input: 'palette' }),
  ]) {
    const value = structuredClone(executable);
    change(value);
    assert.throws(() => providerContract.validateEditionProviderV2(value), {
      code: 'edition_provider_v2_invalid',
    });
  }
});
