import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import test from 'node:test';
import { fromSources } from '@likec4/language-services/node';
import * as semantics from '../packages/publisher/src/semantics/index.mjs';
import { importLikeC4NativeWithParser } from '../packages/publisher/src/semantics/native-likec4.mjs';
import { sealMaterializedInputLock } from '../packages/publisher/src/source/materialize.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const model = Buffer.from(
  "specification { element component }\nmodel { left = component 'Left'\n right = component 'Right'\n left -> right }\n",
);
const views = Buffer.from('views { view overview { include * } }\n');

test('selected LikeC4 parser supply includes its declared import peers', async () => {
  const [{ bundleRequire }, { transform }] = await Promise.all([
    import('bundle-require'),
    import('esbuild'),
  ]);
  assert.equal(typeof bundleRequire, 'function');
  assert.equal(typeof transform, 'function');
});

function selection(
  contents = new Map([
    ['example/model', model],
    ['example/views', views],
  ]),
) {
  return {
    lock: {
      schema: 'architecture.materialized-input-lock/v1',
      sources: [...contents].map(([namespace, content]) => ({
        namespace,
        claimant: 'example-maintainer',
        format: { id: 'likec4/dsl', version: 'unversioned' },
        revision: { kind: 'content', algorithm: 'sha256', value: sha(content) },
        sha256: sha(content),
      })),
    },
    readSource(namespace) {
      return Buffer.from(contents.get(namespace));
    },
  };
}

test('public native import selects the verified bundled parser and rejects overrides', async () => {
  const index = await semantics.importLikeC4Native(selection());
  const manifest = await fs.readFile(
    new URL('../packages/publisher/supplies/likec4/supply.json', import.meta.url),
  );
  assert.deepEqual(index.parserSupply, { id: 'likec4-parser', sha256: sha(manifest) });
  await assert.rejects(semantics.importLikeC4Native(selection(), fromSources), {
    code: 'native_likec4_parser_override_forbidden',
  });
});

test('native importer explicitly requests upstream no-filesystem mode', async () => {
  let selectedOptions;
  await importLikeC4NativeWithParser(selection(), async (files, options) => {
    selectedOptions = options;
    return fromSources(files, options);
  });
  assert.equal(selectedOptions.useFileSystem, false);
  assert.equal(selectedOptions.manualLayouts, false);
  assert.equal(selectedOptions.watch, false);
  assert.equal(selectedOptions.graphviz, 'wasm');
});

test('native LikeC4 import binds model and view semantics to selected bytes', async () => {
  assert.equal(typeof semantics.importLikeC4Native, 'function');
  const index = await importLikeC4NativeWithParser(selection(), fromSources);
  assert.equal(index.schema, 'architecture.native-index/v1');
  assert.equal(index.format, 'likec4/dsl');
  assert.equal(index.closure, 'parsed-document-set-only');
  assert.equal(index.elements.length, 2);
  assert.equal(index.relations.length, 1);
  assert.equal(index.views.length, 1);
  assert.deepEqual(index.opaqueViews, []);
  assert.deepEqual(index.generatedViews, ['index']);
  assert.equal(Object.hasOwn(index, 'unlocatedViews'), false);
  assert.deepEqual(
    index.elements.map(({ id }) => id),
    ['left', 'right'],
  );
  assert.deepEqual(index.relations[0].from, { namespace: 'example/model', id: 'left' });
  assert.deepEqual(index.relations[0].to, { namespace: 'example/model', id: 'right' });
  assert.equal(index.relations[0].kind, null);
  assert.equal(index.relations[0].direction, 'forward');
  assert.equal(index.relations[0].identityScope, 'parser-run');
  assert.equal(index.relations[0].origin.namespace, 'example/model');
  assert.equal(index.relations[0].origin.sha256, sha(model));
  assert.equal(index.relations[0].origin.quality, 'point');
  assert.equal(index.views[0].origin.namespace, 'example/views');
  assert.deepEqual(index.views[0].elements, [
    { namespace: 'example/model', id: 'left' },
    { namespace: 'example/model', id: 'right' },
  ]);
  assert.deepEqual(index.views[0].relations, [index.relations[0].id]);
  assert(index.semanticLimits.includes('view-membership-upstream-computed-unqualified'));
  assert(index.semanticLimits.includes('domain-metadata-opaque'));
  assert(!JSON.stringify(index).includes('/workspace/'));
});

test('the upstream include view contains exactly the selected model members', async () => {
  const base = await importLikeC4NativeWithParser(selection(), fromSources);
  const extra = Buffer.from("model { third = component 'Third'\n right -> third }\n");
  const extended = await importLikeC4NativeWithParser(
    selection(
      new Map([
        ['example/model', model],
        ['example/views', views],
        ['example/extra', extra],
      ]),
    ),
    fromSources,
  );
  assert.deepEqual(base.views[0].elements.map(({ id }) => id).sort(), ['left', 'right']);
  assert.deepEqual(extended.views[0].elements.map(({ id }) => id).sort(), [
    'left',
    'right',
    'third',
  ]);
  assert.equal(base.views[0].relations.length, 1);
  assert.equal(extended.views[0].relations.length, 2);
});

test('the upstream include view cannot resolve an unselected element', async () => {
  const missing = Buffer.from('views { view overview { include missing } }\n');
  await assert.rejects(
    importLikeC4NativeWithParser(
      selection(
        new Map([
          ['example/model', model],
          ['example/views', missing],
        ]),
      ),
      fromSources,
    ),
    { code: 'native_likec4_parse_invalid' },
  );
});

test('dynamic view flow stays opaque instead of becoming a structural view', async () => {
  const mixedViews = Buffer.from(
    'views { view overview { include * } dynamic view flow { left -> right } }\n',
  );
  const index = await importLikeC4NativeWithParser(
    selection(
      new Map([
        ['example/model', model],
        ['example/views', mixedViews],
      ]),
    ),
    fromSources,
  );
  assert.deepEqual(
    index.views.map(({ id }) => id),
    ['overview'],
  );
  assert.deepEqual(
    index.opaqueViews.map(({ id, kind, origin }) => ({ id, kind, namespace: origin.namespace })),
    [{ id: 'flow', kind: 'dynamic', namespace: 'example/views' }],
  );
  assert.equal(index.opaqueViews[0].origin.sha256, sha(mixedViews));
  assert(index.semanticLimits.includes('native-view-semantics-uninterpreted'));
});

test('native metadata is retained as opaque values, not inferred claims', async () => {
  const withMetadata = Buffer.from(
    "specification { element component }\nmodel { left = component 'Left' { metadata { owner 'team-a' } }\n right = component 'Right'\n left -> right { metadata { policy 'review' } } }\n",
  );
  const index = await importLikeC4NativeWithParser(
    selection(
      new Map([
        ['example/model', withMetadata],
        ['example/views', views],
      ]),
    ),
    fromSources,
  );
  assert.deepEqual(index.elements.find(({ id }) => id === 'left').opaqueMetadata, {
    owner: 'team-a',
  });
  assert.equal(
    Object.hasOwn(
      index.elements.find(({ id }) => id === 'right'),
      'opaqueMetadata',
    ),
    false,
  );
  assert.deepEqual(index.relations[0].opaqueMetadata, { policy: 'review' });
  assert.equal(Object.isFrozen(index.relations[0].opaqueMetadata), true);
  assert(index.semanticLimits.includes('domain-metadata-opaque'));
});

test('native metadata with hidden fields cannot be silently dropped', async () => {
  const parser = async (sources, options) => {
    const upstream = await fromSources(sources, options);
    const model = upstream.syncComputedModel();
    return {
      documentPaths: () => upstream.documentPaths(),
      languageServices: upstream.languageServices,
      ensureSingleProject: () => upstream.ensureSingleProject(),
      syncComputedModel: () => ({
        elements: () =>
          [...model.elements()].map((element, index) =>
            index === 0
              ? {
                  id: element.id,
                  kind: element.kind,
                  title: element.title,
                  metadata: { [Symbol('hidden')]: 'unselected' },
                }
              : element,
          ),
        relationships: () => model.relationships(),
        views: () => model.views(),
      }),
    };
  };
  await assert.rejects(importLikeC4NativeWithParser(selection(), parser), {
    code: 'native_likec4_metadata_invalid',
  });
});

test('native LikeC4 import consumes the actual sealed materialization interface', async () => {
  const selected = selection();
  const sealed = sealMaterializedInputLock({
    edition: { id: 'example', editor: 'example', content: Buffer.from('{}'), resources: [] },
    sources: selected.lock.sources.map((source) => ({
      ...source,
      revisionEvidence: source.revision,
      content: selected.readSource(source.namespace),
    })),
    media: ['static'],
    toolchain: { profile: 'portable' },
  });
  const index = await importLikeC4NativeWithParser(sealed, fromSources);
  assert.equal(index.elements.length, 2);
  assert.equal(index.relations.length, 1);
  assert.equal(index.sources[0].sha256, sealed.lock.sources[0].sha256);
});

test('native LikeC4 import keeps same-label sources and cross-source endpoints distinct', async () => {
  const left = Buffer.from(
    "specification { element component }\nmodel { left = component 'authority' }\n",
  );
  const right = Buffer.from("model { right = component 'authority'\n left -> right }\n");
  const selected = selection(
    new Map([
      ['example/left', left],
      ['example/right', right],
      ['example/views', views],
    ]),
  );
  const index = await importLikeC4NativeWithParser(selected, fromSources);
  assert.deepEqual(
    index.elements.map(({ id, namespace, label }) => ({ id, namespace, label })),
    [
      { id: 'left', namespace: 'example/left', label: 'authority' },
      { id: 'right', namespace: 'example/right', label: 'authority' },
    ],
  );
  assert.deepEqual(index.relations[0].from, { namespace: 'example/left', id: 'left' });
  assert.deepEqual(index.relations[0].to, { namespace: 'example/right', id: 'right' });
  assert.equal(index.relations[0].origin.namespace, 'example/right');
});

test('native LikeC4 import does not freeze or retain mutable caller metadata', async () => {
  const selected = selection();
  const index = await importLikeC4NativeWithParser(selected, fromSources);
  assert.equal(Object.isFrozen(selected.lock.sources[0].format), false);
  selected.lock.sources[0].format.version = 'edited';
  assert.equal(index.sources[0].format.version, 'unversioned');
});

test('native LikeC4 import rejects bytes that disagree with the selected lock', async () => {
  const locked = selection();
  locked.readSource = (namespace) =>
    namespace === 'example/model' ? Buffer.from('changed') : Buffer.from(views);
  await assert.rejects(importLikeC4NativeWithParser(locked, fromSources), {
    code: 'native_likec4_digest_mismatch',
  });
});

test('native LikeC4 import rejects duplicate selected source namespaces', async () => {
  const locked = selection();
  locked.lock.sources.push({ ...locked.lock.sources[0] });
  await assert.rejects(importLikeC4NativeWithParser(locked, fromSources), {
    code: 'native_likec4_selection_invalid',
  });
});

test('native LikeC4 import rejects parser documents outside the selected set', async () => {
  const parser = async (sources) => ({
    documentPaths: () => [
      ...Object.keys(sources).map((name) => `/workspace/${name}`),
      '/workspace/ambient.c4',
    ],
  });
  await assert.rejects(importLikeC4NativeWithParser(selection(), parser), {
    code: 'native_likec4_document_set_mismatch',
  });
});

test('native LikeC4 import rejects an ambient document with a selected basename', async () => {
  const parser = async (sources, options) => {
    const selected = await fromSources(sources, options);
    return {
      documentPaths: () =>
        selected
          .documentPaths()
          .map((file, index) => (index === 0 ? file.replace('/workspace/', '/ambient/') : file)),
      languageServices: selected.languageServices,
      syncComputedModel: () => selected.syncComputedModel(),
    };
  };
  await assert.rejects(importLikeC4NativeWithParser(selection(), parser), {
    code: 'native_likec4_document_set_mismatch',
  });
});

test('native LikeC4 import refuses a location outside selected virtual documents', async () => {
  const parser = async (sources, options) => {
    const selected = await fromSources(sources, options);
    return {
      documentPaths: () => selected.documentPaths(),
      languageServices: {
        getErrors: () => selected.languageServices.getErrors(),
        locate: (query) => {
          const location = selected.languageServices.locate(query);
          return location && { ...location, uri: location.uri.replace('/workspace/', '/ambient/') };
        },
      },
      ensureSingleProject: () => selected.ensureSingleProject(),
      syncComputedModel: () => selected.syncComputedModel(),
    };
  };
  await assert.rejects(importLikeC4NativeWithParser(selection(), parser), {
    code: 'native_likec4_source_reference_unselected',
  });
});

test('native LikeC4 import fails when an authored view loses its source location', async () => {
  const parser = async (sources, options) => {
    const selected = await fromSources(sources, options);
    return {
      documentPaths: () => selected.documentPaths(),
      languageServices: {
        getErrors: () => selected.languageServices.getErrors(),
        locate: (query) =>
          query.view === 'overview' ? null : selected.languageServices.locate(query),
      },
      ensureSingleProject: () => selected.ensureSingleProject(),
      syncComputedModel: () => selected.syncComputedModel(),
    };
  };
  await assert.rejects(importLikeC4NativeWithParser(selection(), parser), {
    code: 'native_likec4_source_reference_missing',
  });
});

test('native LikeC4 import rejects a source range outside its selected bytes', async () => {
  const parser = async (sources, options) => {
    const selected = await fromSources(sources, options);
    return {
      documentPaths: () => selected.documentPaths(),
      languageServices: {
        getErrors: () => selected.languageServices.getErrors(),
        locate: (query) => {
          const location = selected.languageServices.locate(query);
          return (
            location && {
              ...location,
              range: {
                start: { line: 999, character: 0 },
                end: { line: 999, character: 0 },
              },
            }
          );
        },
      },
      ensureSingleProject: () => selected.ensureSingleProject(),
      syncComputedModel: () => selected.syncComputedModel(),
    };
  };
  await assert.rejects(importLikeC4NativeWithParser(selection(), parser), {
    code: 'native_likec4_source_reference_invalid',
  });
});

test('native LikeC4 import refuses invalid selected DSL rather than inventing a model', async () => {
  const invalid = selection(new Map([['example/model', Buffer.from('model { broken = }\n')]]));
  await assert.rejects(importLikeC4NativeWithParser(invalid, fromSources), {
    code: 'native_likec4_parse_invalid',
  });
});

test('native LikeC4 import rejects ambiguous parser projects', async () => {
  const parser = async (sources, options) => {
    const selected = await fromSources(sources, options);
    return {
      documentPaths: () => selected.documentPaths(),
      languageServices: selected.languageServices,
      ensureSingleProject: () => {
        throw new Error('ambiguous project');
      },
      syncComputedModel: () => selected.syncComputedModel(),
    };
  };
  await assert.rejects(importLikeC4NativeWithParser(selection(), parser), {
    code: 'native_likec4_model_invalid',
  });
});

test('native LikeC4 import indexes selected source lines once for many references', async () => {
  const body = 'line one\nline two\n';
  const selected = selection(new Map([['example/model', Buffer.from(body)]]));
  const original = String.prototype.split;
  let splits = 0;
  String.prototype.split = function (...args) {
    if (String(this) === body) splits++;
    return Reflect.apply(original, this, args);
  };
  try {
    const parser = async (sources) => {
      const name = Object.keys(sources)[0];
      return {
        documentPaths: () => [`/workspace/${name}`],
        languageServices: {
          getErrors: () => [],
          locate: () => ({
            uri: `virtual:/workspace/${name}`,
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 },
            },
          }),
        },
        ensureSingleProject: () => {},
        syncComputedModel: () => ({
          elements: () =>
            Array.from({ length: 20 }, (_, index) => ({
              id: `node-${index}`,
              kind: 'component',
              title: `Node ${index}`,
              metadata: {},
            })),
          relationships: () => [],
          views: () => [],
        }),
      };
    };
    const index = await importLikeC4NativeWithParser(selected, parser);
    assert.equal(index.elements.length, 20);
    assert(splits <= 1, `source lines split ${splits} times`);
  } finally {
    String.prototype.split = original;
  }
});
