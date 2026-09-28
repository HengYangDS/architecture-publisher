import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from '../packages/publisher/src/compiler/index.mjs';
import { compileNativeEditionEvolution } from '../packages/publisher/src/edition/evolution.mjs';
import { compareEvolutionInput } from '../packages/publisher/src/compiler/evolution.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/compiler/build-input.mjs';
import { compileNativeSelectionDelta } from '../packages/publisher/src/semantics/change.mjs';
import { canonical } from '../packages/publisher/src/source/json.mjs';
import {
  executableModelProvider,
  moveModelToProvider,
  selectedNativeEdition,
  sha,
} from './fixtures/selected-native-edition.mjs';

async function snapshot(fixture) {
  const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
  const meaning = await compileEditionMeaning(selected);
  return { lock: selected.lock, meaning };
}

async function nativeDelta(before, after) {
  const prior = await snapshot(before);
  const next = await snapshot(after);
  return compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
}

function resealNativeSide(side) {
  side.native.semanticDigest = sha(canonical(side.native.selections));
  side.native.subjectLockSha256 = sha(canonical(side.lock));
  return side;
}

async function replaceSource(fixture, source, bytes) {
  const entry = fixture.request.sources.find(({ id }) => id === source);
  assert(entry);
  await fs.writeFile(path.join(fixture.root, entry.input.path), bytes);
  entry.input.sha256 = sha(bytes);
  await rewriteRequest(fixture);
}

async function rewriteRequest(fixture) {
  const requestBytes = Buffer.from(JSON.stringify(fixture.request) + '\n');
  await fs.writeFile(fixture.file, requestBytes);
  fixture.digest = sha(requestBytes);
}

async function rewriteProject(fixture) {
  await fs.writeFile(
    path.join(fixture.root, 'edition/project.json'),
    JSON.stringify(fixture.project) + '\n',
  );
}

test('native evolution refuses malformed sides and implicit Edition ownership changes', async (t) => {
  const baseline = await snapshot(
    await selectedNativeEdition(t, { media: ['static', 'interactive'] }),
  );
  const cases = [
    ['missing side', (input) => delete input.before, 'native_evolution_input_invalid'],
    ['extra input authority', (input) => (input.extra = {}), 'native_evolution_input_invalid'],
    [
      'foreign lock schema',
      (input) => (input.after.lock.schema = 'foreign'),
      'native_evolution_input_invalid',
    ],
    [
      'missing questions',
      (input) => (input.after.meaning.questions = null),
      'native_evolution_input_invalid',
    ],
    [
      'missing assertions',
      (input) => (input.after.meaning.assertions = null),
      'native_evolution_input_invalid',
    ],
    [
      'unselected medium',
      (input) => (input.after.lock.media = ['static']),
      'native_evolution_input_invalid',
    ],
    [
      'changed Edition digest outside the lock',
      (input) => (input.after.meaning.edition.sha256 = '0'.repeat(64)),
      'native_evolution_input_invalid',
    ],
    [
      'missing selected views',
      (input) => (input.after.meaning.media.static.views = null),
      'native_evolution_input_invalid',
    ],
    [
      'renamed Edition',
      (input) => {
        input.after.lock.edition.id = 'renamed';
        input.after.meaning.edition.id = 'renamed';
      },
      'native_evolution_edition_identity_changed',
    ],
    [
      'changed editor',
      (input) => {
        input.after.lock.edition.editor = 'another-editor';
        input.after.meaning.edition.editor = 'another-editor';
      },
      'native_evolution_editor_changed',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = { before: structuredClone(baseline), after: structuredClone(baseline) };
    mutate(input);
    assert.throws(() => compileNativeEditionEvolution(input), { code }, name);
  }
});

test('retargeting a context-only editorial basis renews its reader views', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  for (const [fixture, target] of [
    [before, 'alpha'],
    [after, 'beta'],
  ]) {
    fixture.project.scope.selections[0].namespace = 'fixture/model';
    fixture.project.scope.selections[0].reference = `element:${target}`;
    delete fixture.project.scope.selections[0].questions;
    fixture.project.editorialAssertions = [
      {
        id: 'editorial-shape',
        statement: 'This selection is the editorial focus.',
        proponent: 'fixture-editor',
        basis: ['overview'],
        questions: ['shape'],
      },
    ];
    await rewriteProject(fixture);
  }
  const plan = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(plan.editions.affected[0].media, {
    static: ['overview'],
    interactive: ['overview'],
  });
  assert.deepEqual(
    plan.obligations.mediumVerification.map(({ medium }) => medium),
    ['static', 'interactive'],
  );
  assert.deepEqual(
    plan.obligations.humanReview.map(({ medium }) => medium),
    ['static', 'interactive'],
  );
});

function addOperationQuestion(fixture) {
  fixture.project.questions.push({
    id: 'operation',
    audience: 'maintainer',
    text: 'What operation is selected?',
  });
  fixture.project.scope.selections[0].questions.push('operation');
}

async function comparisonPlan(t, before, after) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-evolution-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(before.root, path.join(root, 'before'), { recursive: true });
  await fs.cp(after.root, path.join(root, 'after'), { recursive: true });
  const plan = {
    schema: 'architecture.semantic-compare-input/v3',
    before: { request: { path: 'before/build-request.json', sha256: before.digest } },
    after: { request: { path: 'after/build-request.json', sha256: after.digest } },
  };
  const file = path.join(root, 'comparison.json');
  const bytes = Buffer.from(JSON.stringify(plan) + '\n');
  await fs.writeFile(file, bytes);
  return { root, file, plan, digest: sha(bytes) };
}

test('native comparison detects a source-bound label change without relying on cardinality', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(
    after,
    'model',
    Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'")),
  );
  const delta = await nativeDelta(before, after);
  assert.deepEqual(delta.sourceBytes.changed, ['fixture/model']);
  assert.deepEqual(delta.supported, [
    {
      selectionId: 'overview',
      subject: { kind: 'element', namespace: 'fixture/model', id: 'alpha' },
      fields: ['label'],
    },
  ]);
  assert(delta.unknown.some(({ reason }) => reason === 'dependency-closure-unproved'));
  assert.equal(delta.hasChanges, true);
});

test('native comparison detects a changed selected view membership', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(after, 'views', Buffer.from('views { view overview { include alpha } }\n'));
  const delta = await nativeDelta(before, after);
  assert.deepEqual(delta.sourceBytes.changed, ['fixture/views']);
  assert(
    delta.supported.some(
      ({ subject, fields }) => subject.kind === 'view-membership' && fields.includes('elements'),
    ),
  );
  assert.equal(delta.hasChanges, true);
});

test('native comparison of identical selected inputs has no invented change', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const delta = await nativeDelta(before, after);
  assert.deepEqual(delta.sourceBytes, { added: [], removed: [], changed: [] });
  assert.deepEqual(delta.sourceBindings, { changed: [] });
  assert.deepEqual(delta.supported, []);
  assert.deepEqual(delta.unknown, []);
  assert.equal(delta.supplyChanged, false);
  assert.equal(delta.hasChanges, false);
});

test('native change admission rejects ambiguous source and selection identity', async (t) => {
  const selected = await snapshot(await selectedNativeEdition(t));
  const before = resealNativeSide({
    lock: structuredClone(selected.lock),
    native: structuredClone(selected.meaning.native),
  });
  for (const [name, mutate] of [
    ['missing selected source array', (side) => (side.lock.sources = null)],
    [
      'duplicate source namespace',
      (side) => side.lock.sources.push(structuredClone(side.lock.sources[0])),
    ],
    [
      'derived namespace collides with source',
      (side) =>
        side.lock.derived.push({
          namespace: side.lock.sources[0].namespace,
          sha256: 'a'.repeat(64),
        }),
    ],
    [
      'duplicate derived namespace',
      (side) =>
        side.lock.derived.push(
          ...[0, 1].map(() => ({ namespace: 'fixture/derived', sha256: 'a'.repeat(64) })),
        ),
    ],
    [
      'selected source digest differs from its lock',
      (side) => (side.native.selections[0].source.sha256 = '0'.repeat(64)),
    ],
    [
      'duplicate selection identity',
      (side) => side.native.selections.push(structuredClone(side.native.selections[0])),
    ],
    [
      'duplicate selected element identity',
      (side) =>
        side.native.selections[0].members.elements.push(
          structuredClone(side.native.selections[0].members.elements[0]),
        ),
    ],
  ]) {
    const after = structuredClone(before);
    mutate(after);
    resealNativeSide(after);
    assert.throws(
      () => compileNativeSelectionDelta(before, after),
      {
        code: 'native_evolution_input_invalid',
      },
      name,
    );
  }
});

test('native delta distinguishes changed bytes, bindings, supplied output and uncertainty', async (t) => {
  const selected = await snapshot(await selectedNativeEdition(t));
  const before = resealNativeSide({
    lock: structuredClone(selected.lock),
    native: structuredClone(selected.meaning.native),
  });
  const changed = (mutate) => {
    const after = structuredClone(before);
    mutate(after);
    return resealNativeSide(after);
  };
  const reason = (delta, expected) =>
    assert(
      delta.unknown.some(({ reason: value }) => value === expected),
      expected,
    );

  const addedSource = compileNativeSelectionDelta(
    before,
    changed((side) =>
      side.lock.sources.push({ ...side.lock.sources[0], namespace: 'fixture/extra' }),
    ),
  );
  assert.deepEqual(addedSource.sourceBytes.added, ['fixture/extra']);
  const removedSource = structuredClone(before);
  removedSource.lock.sources.push({ ...removedSource.lock.sources[0], namespace: 'fixture/extra' });
  assert.deepEqual(
    compileNativeSelectionDelta(resealNativeSide(removedSource), before).sourceBytes.removed,
    ['fixture/extra'],
  );

  const addedDerived = compileNativeSelectionDelta(
    before,
    changed((side) =>
      side.lock.derived.push({ namespace: 'fixture/derived', sha256: 'a'.repeat(64) }),
    ),
  );
  reason(addedDerived, 'derived-projection-added');
  const priorDerived = changed((side) =>
    side.lock.derived.push({
      namespace: 'fixture/derived',
      sha256: 'a'.repeat(64),
      claimant: 'before',
    }),
  );
  reason(compileNativeSelectionDelta(priorDerived, before), 'derived-projection-removed');
  reason(
    compileNativeSelectionDelta(
      priorDerived,
      changed((side) =>
        side.lock.derived.push({
          namespace: 'fixture/derived',
          sha256: 'a'.repeat(64),
          claimant: 'after',
        }),
      ),
    ),
    'derived-projection-binding-changed',
  );
  reason(
    compileNativeSelectionDelta(
      priorDerived,
      changed((side) =>
        side.lock.derived.push({ namespace: 'fixture/derived', sha256: 'b'.repeat(64) }),
      ),
    ),
    'derived-projection-bytes-changed',
  );

  const outputDrift = compileNativeSelectionDelta(
    before,
    changed(
      (side) =>
        (side.native.selections[0].members.elements[0].label = 'Changed without input change'),
    ),
  );
  reason(outputDrift, 'native-output-drift');
  assert(
    outputDrift.supported.some(
      ({ subject, fields }) => subject.kind === 'element' && fields.includes('label'),
    ),
  );
  reason(
    compileNativeSelectionDelta(
      before,
      changed((side) => side.native.limits.push('new-limit')),
    ),
    'native-limits-changed',
  );
  reason(
    compileNativeSelectionDelta(
      before,
      changed((side) => (side.native.nativeClosure = 'partial')),
    ),
    'native-closure-changed',
  );
  assert.equal(
    compileNativeSelectionDelta(
      before,
      changed((side) => (side.native.parserSupply = { changed: true })),
    ).supplyChanged,
    true,
  );
  reason(
    compileNativeSelectionDelta(
      before,
      changed((side) => side.native.selections[0].limits.push('new-limit')),
    ),
    'selection-limits-changed',
  );
  reason(
    compileNativeSelectionDelta(
      before,
      changed((side) => (side.native.selections[0].format = 'foreign/dsl')),
    ),
    'native-selection-format-changed',
  );
  const removedSelection = compileNativeSelectionDelta(
    before,
    changed((side) => side.native.selections.pop()),
  );
  assert(
    removedSelection.supported.some(
      ({ subject, fields }) => subject.kind === 'selection' && fields.includes('removed'),
    ),
  );
  const addedSelection = compileNativeSelectionDelta(
    before,
    changed((side) => {
      const additional = structuredClone(side.native.selections[0]);
      additional.selectionId = 'additional-view';
      side.native.selections.push(additional);
    }),
  );
  assert(
    addedSelection.supported.some(
      ({ subject, fields }) => subject.kind === 'selection' && fields.includes('added'),
    ),
  );
  assert(
    compileNativeSelectionDelta(
      before,
      changed((side) => (side.native.selections[0].target.id = 'new-view')),
    ).supported.some(
      ({ subject, fields }) => subject.kind === 'selection' && fields.includes('id'),
    ),
  );
  assert.deepEqual(
    compileNativeSelectionDelta(
      before,
      changed(
        (side) =>
          (side.lock.sources.find(({ namespace }) => namespace === 'fixture/model').claimant =
            'new-owner'),
      ),
    ).sourceBindings.changed,
    ['fixture/model'],
  );
  const changedBytes = compileNativeSelectionDelta(
    before,
    changed((side) => {
      const selectedSource = side.native.selections[0].source;
      side.lock.sources.find(({ namespace }) => namespace === selectedSource.namespace).sha256 =
        'b'.repeat(64);
      selectedSource.sha256 = 'b'.repeat(64);
      side.native.nativeClosure = 'partial';
    }),
  );
  assert.deepEqual(changedBytes.sourceBytes.changed, [
    before.native.selections[0].source.namespace,
  ]);
  reason(changedBytes, 'dependency-closure-unproved');
  const complete = changed((side) => (side.native.nativeClosure = 'complete'));
  const changedComplete = structuredClone(complete);
  const selectedSource = changedComplete.native.selections[0].source;
  changedComplete.lock.sources.find(
    ({ namespace }) => namespace === selectedSource.namespace,
  ).sha256 = 'b'.repeat(64);
  selectedSource.sha256 = 'b'.repeat(64);
  const provedClosure = compileNativeSelectionDelta(complete, resealNativeSide(changedComplete));
  assert.deepEqual(provedClosure.sourceBytes.changed, [selectedSource.namespace]);
  assert.equal(
    provedClosure.unknown.some(({ reason: value }) => value === 'dependency-closure-unproved'),
    false,
  );
});

test('native comparison does not hide changed source attribution behind equal content bytes', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  after.request.sources[0].claimant = 'another-maintainer';
  await rewriteRequest(after);
  const delta = await nativeDelta(before, after);
  assert.deepEqual(delta.sourceBytes, { added: [], removed: [], changed: [] });
  assert.deepEqual(delta.sourceBindings.changed, ['fixture/model']);
  assert.equal(delta.hasChanges, true);
});

test('relocated relation locators retain uncertainty but expose changed qualifier values', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const changed =
    '\n' +
    after.model
      .toString()
      .replace('alpha -> beta', "alpha -> beta { metadata { policy 'review' } }");
  await replaceSource(after, 'model', Buffer.from(changed));
  const delta = await nativeDelta(before, after);
  assert(delta.unknown.some(({ reason }) => reason === 'relation-lineage-unproved'));
  assert(
    delta.supported.some(
      ({ subject, fields }) =>
        subject.kind === 'relation-set' && fields.includes('relation-values'),
    ),
  );
});

test('relation locator drift alone is not reported as a proven view membership change', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(after, 'model', Buffer.from('\n' + after.model.toString()));
  const delta = await nativeDelta(before, after);
  assert.deepEqual(delta.supported, []);
  assert(delta.unknown.some(({ reason }) => reason === 'relation-lineage-unproved'));
});

test('native Edition evolution separates rebuild, verification, review, acceptance, and publication', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(
    after,
    'model',
    Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'")),
  );
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.equal(result.schema, 'architecture.semantic-change/v3');
  assert.deepEqual(Object.keys(result.obligations), [
    'rebuild',
    'semanticVerification',
    'mediumVerification',
    'humanReview',
    'acceptance',
    'publication',
  ]);
  assert.deepEqual(result.editions.changed, ['selected-atlas']);
  assert.deepEqual(result.editions.affected[0].questions, ['shape']);
  assert.deepEqual(result.editions.affected[0].media, {
    static: ['overview'],
    interactive: ['overview'],
  });
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ['edition-candidate', 'static', 'interactive-document', 'interactive'],
  );
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.equal(result.obligations.mediumVerification.length, 2);
  assert.equal(result.obligations.humanReview.length, 2);
  assert.deepEqual(
    result.obligations.acceptance.map(({ action }) => action),
    ['reaccept'],
  );
  assert.deepEqual(
    result.obligations.publication.map(({ action }) => action),
    ['replace'],
  );
});

test('unchanged native Edition inputs produce no new obligations', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.changed, []);
  assert(Object.values(result.obligations).every((items) => items.length === 0));
});

test('toolchain and Edition resource revisions renew release obligations independently', async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  for (const [name, mutate, reason] of [
    [
      'toolchain',
      (side) => {
        side.lock.toolchain.profile = 'revised-runtime';
      },
      'toolchain-changed',
    ],
    [
      'Edition resource',
      (side) => {
        side.lock.edition.resources.push({
          ref: 'art-direction.json',
          bytes: 3,
          sha256: sha('{}\n'),
        });
      },
      'edition-resource-changed',
    ],
  ]) {
    const after = structuredClone(before);
    mutate(after);
    after.meaning.native.subjectLockSha256 = sha(canonical(after.lock));
    const result = compileNativeEditionEvolution({ before, after });
    assert(result.editions.affected[0].reasons.includes(reason), name);
    assert.equal(result.obligations.semanticVerification.length, 1, name);
    assert.equal(result.obligations.acceptance.length, 1, name);
    assert.equal(result.obligations.publication.length, 1, name);
  }
});

test('editorial-only changes still require new media and acceptance without minting native changes', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t, { title: 'Revised reader atlas' });
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.equal(result.delta.native.hasChanges, false);
  assert.deepEqual(result.editions.affected[0].media, {
    static: ['overview'],
    interactive: ['overview'],
  });
  assert.equal(result.obligations.acceptance.length, 1);
  assert.equal(result.obligations.publication.length, 1);
});

test('a changed native uncertainty limit cannot inherit an unchanged Edition verdict', async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  const after = structuredClone(before);
  after.meaning.native.limits.push('new-unproved-read-scope');
  after.meaning.limits.push('new-unproved-read-scope');
  const result = compileNativeEditionEvolution({ before, after });
  assert(result.delta.native.unknown.some(({ reason }) => reason === 'native-limits-changed'));
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.equal(result.obligations.acceptance.length, 1);
});

test('different native output for one exact lock is uncertainty, never a no-op', async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  const after = structuredClone(before);
  const range = after.meaning.native.selections[0].target.origin.range;
  range.start.line += 1;
  range.end.line += 1;
  after.meaning.native.semanticDigest = sha(
    Buffer.from(canonical(after.meaning.native.selections)),
  );
  const result = compileNativeEditionEvolution({ before, after });
  assert.notEqual(result.before.nativeDigest, result.after.nativeDigest);
  assert(result.delta.native.unknown.some(({ reason }) => reason === 'native-output-drift'));
  assert.deepEqual(result.editions.changed, ['selected-atlas']);
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.equal(result.obligations.acceptance.length, 1);
});

test('Edition JSON whitespace changes exact bytes without inventing a media redraw', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await fs.writeFile(
    path.join(after.root, 'edition/project.json'),
    JSON.stringify(after.project, null, 2) + '\n',
  );
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.equal(result.delta.editorialChanged, false);
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ['edition-candidate'],
  );
  assert.deepEqual(result.obligations.mediumVerification, []);
  assert.deepEqual(result.obligations.humanReview, []);
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.equal(result.obligations.acceptance.length, 1);
});

test('removing one selected medium withdraws it without redrawing the retained medium', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t, { media: ['static'] });
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.affected[0].withdrawn, [{ medium: 'interactive', scene: null }]);
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ['edition-candidate'],
  );
  assert.deepEqual(result.obligations.mediumVerification, []);
  assert.deepEqual(result.obligations.humanReview, []);
  assert.deepEqual(
    result.obligations.publication.map(({ action }) => action),
    ['replace', 'withdraw'],
  );
});

test('adding one selected medium builds only that medium and requires fresh review', async (t) => {
  const before = await selectedNativeEdition(t, { media: ['static'] });
  const after = await selectedNativeEdition(t);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ['edition-candidate', 'interactive-document', 'interactive'],
  );
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium }) => medium),
    ['interactive'],
  );
  assert.deepEqual(
    result.obligations.humanReview.map(({ medium }) => medium),
    ['interactive'],
  );
});

test('removing an interactive page withdraws it without repainting an unchanged overview', async (t) => {
  const before = await selectedNativeEdition(t);
  before.project.presentation.interactive.views.push({ id: 'detail', questions: ['shape'] });
  await rewriteProject(before);
  const after = await selectedNativeEdition(t);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.affected[0].withdrawn, [
    { medium: 'interactive', scene: 'detail' },
  ]);
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ['edition-candidate', 'interactive-document'],
  );
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium }) => medium),
    ['interactive'],
  );
  assert.equal(result.obligations.publication.at(-1).action, 'withdraw');
  assert.equal(result.obligations.publication.at(-1).scene, 'detail');
});

test('changing a retained view question verifies both the removed and added question scope', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  for (const fixture of [before, after]) {
    addOperationQuestion(fixture);
    fixture.project.presentation.static.views[0].questions.push('operation');
    fixture.project.presentation.interactive.views.push({
      id: 'detail',
      questions: ['operation'],
    });
  }
  after.project.presentation.interactive.views[0].questions = ['operation'];
  await rewriteProject(before);
  await rewriteProject(after);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.affected[0].media.interactive, ['overview']);
  assert.deepEqual(result.editions.affected[0].questions, ['operation', 'shape']);
  assert.deepEqual(result.obligations.semanticVerification[0].questions, ['operation', 'shape']);
  assert.deepEqual(result.obligations.mediumVerification[0].questions, ['operation', 'shape']);
});

test('simultaneous media changes retain separate question scopes for each medium', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  for (const fixture of [before, after]) {
    addOperationQuestion(fixture);
    fixture.project.presentation.interactive.views[0].questions = ['operation'];
  }
  after.project.presentation.static.width = 5000;
  after.project.presentation.interactive.intent = 'Changed exploration intent.';
  await rewriteProject(before);
  await rewriteProject(after);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.obligations.semanticVerification[0].questions, ['operation', 'shape']);
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium, questions }) => ({ medium, questions })),
    [
      { medium: 'static', questions: ['shape'] },
      { medium: 'interactive', questions: ['operation'] },
    ],
  );
  assert.deepEqual(
    result.obligations.humanReview.map(({ medium, questions }) => ({ medium, questions })),
    [
      { medium: 'static', questions: ['shape'] },
      { medium: 'interactive', questions: ['operation'] },
    ],
  );
});

test('removing a static view retains its old question scope in the rebuilt artifact', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  for (const fixture of [before, after]) {
    addOperationQuestion(fixture);
    fixture.project.presentation.interactive.views[0].questions.push('operation');
  }
  before.project.presentation.static.views.push({ id: 'detail', questions: ['operation'] });
  await rewriteProject(before);
  await rewriteProject(after);
  const result = compileNativeEditionEvolution({
    before: await snapshot(before),
    after: await snapshot(after),
  });
  assert.deepEqual(result.editions.affected[0].media.static, ['overview']);
  assert.deepEqual(result.editions.affected[0].withdrawn, []);
  assert.deepEqual(result.obligations.semanticVerification[0].questions, ['operation', 'shape']);
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium, questions }) => ({ medium, questions })),
    [{ medium: 'static', questions: ['operation', 'shape'] }],
  );
});

test('changed compiled medium obligations cannot report a no-op for the same selected lock', async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  const after = structuredClone(before);
  after.meaning.media.static.views[0].assertionsByQuestion.shape = [];
  const result = compileNativeEditionEvolution({ before, after });
  assert.deepEqual(result.delta.media.changed, ['static']);
  assert.deepEqual(result.editions.changed, ['selected-atlas']);
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium }) => medium),
    ['static'],
  );
});

test('parser supply-only replacement renews media and acceptance without inventing source change', async (t) => {
  const fixture = await selectedNativeEdition(t);
  const before = await snapshot(fixture);
  const after = structuredClone(before);
  after.meaning.native.parserSupply.sha256 = sha('replacement-parser-package');
  const result = compileNativeEditionEvolution({ before, after });
  assert.deepEqual(result.delta.native.sourceBytes, { added: [], removed: [], changed: [] });
  assert.equal(result.delta.native.before, result.delta.native.after);
  assert.equal(result.delta.native.supplyChanged, true);
  assert.deepEqual(
    result.obligations.rebuild.map(({ target }) => target),
    ['edition-candidate', 'static', 'interactive-document', 'interactive'],
  );
  assert.deepEqual(
    result.obligations.mediumVerification.map(({ medium }) => medium),
    ['static', 'interactive'],
  );
  assert.equal(result.obligations.acceptance.length, 1);
  assert.equal(result.obligations.publication.length, 1);
  assert(result.editions.affected[0].reasons.includes('parser-supply-changed'));
});

test('the existing evolution command compares exact relocated native Build Requests', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await replaceSource(
    after,
    'model',
    Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'")),
  );
  const selected = await comparisonPlan(t, before, after);
  const result = await compareEvolutionInput(selected.file, selected.digest);
  assert.equal(result.schema, 'architecture.semantic-change/v3');
  assert.deepEqual(result.delta.native.sourceBytes.changed, ['fixture/model']);
  assert.deepEqual(result.editions.changed, ['selected-atlas']);
  assert.equal(result.obligations.acceptance.length, 1);
  const cli = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('../packages/publisher/src/cli/main.mjs', import.meta.url)),
      'evolution',
      'plan',
      selected.file,
      '--sha256',
      selected.digest,
    ],
    {
      cwd: selected.root,
      env: { HOME: selected.root, PATH: '', LANG: 'C.UTF-8' },
      encoding: 'utf8',
      timeout: 20_000,
    },
  );
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout), result);
});

test('native comparison refuses changed selected bytes before deriving obligations', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const selected = await comparisonPlan(t, before, after);
  await fs.writeFile(path.join(selected.root, 'after/sources/model.c4'), 'model { changed }\n');
  await assert.rejects(compareEvolutionInput(selected.file, selected.digest), {
    code: 'materialized_pin_mismatch',
  });
});

test('native comparison plan refuses a path outside its portable input root', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const selected = await comparisonPlan(t, before, after);
  assert.equal(
    (await compareEvolutionInput(selected.file, selected.digest)).schema,
    'architecture.semantic-change/v3',
  );
  selected.plan.before.request.path = '../before/build-request.json';
  const bytes = Buffer.from(JSON.stringify(selected.plan) + '\n');
  await fs.writeFile(selected.file, bytes);
  await assert.rejects(compareEvolutionInput(selected.file, sha(bytes)), {
    code: 'semantic_plan_invalid',
  });
});

test('native comparison reads a pinned declarative Provider without changing selected meaning', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await moveModelToProvider(after);
  const selected = await comparisonPlan(t, before, after);
  const result = await compareEvolutionInput(selected.file, selected.digest);
  assert.deepEqual(result.delta.native.sourceBytes, { added: [], removed: [], changed: [] });
  assert.deepEqual(result.editions.changed, []);
  assert(Object.values(result.obligations).every((items) => items.length === 0));
});

test('native comparison detects changed bytes delivered by a pinned declarative Provider', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const changed = Buffer.from(after.model.toString().replace("'Alpha'", "'Renamed Alpha'"));
  await moveModelToProvider(after, changed);
  const selected = await comparisonPlan(t, before, after);
  const result = await compareEvolutionInput(selected.file, selected.digest);
  assert.deepEqual(result.delta.native.sourceBytes.changed, ['fixture/model']);
  assert.deepEqual(result.editions.changed, ['selected-atlas']);
});

test('native evolution does not execute a Provider from a comparison plan without admission', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  await moveModelToProvider(before, before.model, 'executable');
  const selected = await comparisonPlan(t, before, after);
  await assert.rejects(compareEvolutionInput(selected.file, selected.digest), {
    code: 'semantic_native_provider_comparison_unadmitted',
  });
});

test('native evolution selects executable Providers independently on both sides', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const prior = await executableModelProvider(before);
  const next = await executableModelProvider(after);
  const selected = await comparisonPlan(t, before, after);
  const choice = {
    before: [{ id: 'model-provider', manifestSha256: prior.manifestSha256 }],
    after: [{ id: 'model-provider', manifestSha256: next.manifestSha256 }],
  };
  const result = await compareEvolutionInput(selected.file, selected.digest, choice);
  assert.equal(result.schema, 'architecture.semantic-change/v3');
  assert.deepEqual(result.delta.native.sourceBytes, { added: [], removed: [], changed: [] });
  assert.equal((await fs.readFile(prior.executionMarker, 'utf8')) !== '', true);
  assert.equal((await fs.readFile(next.executionMarker, 'utf8')) !== '', true);
  const cli = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('../packages/publisher/src/cli/main.mjs', import.meta.url)),
      'evolution',
      'plan',
      selected.file,
      '--sha256',
      selected.digest,
      '--execute-before-providers',
      `model-provider@${prior.manifestSha256}`,
      '--execute-after-providers',
      `model-provider@${next.manifestSha256}`,
    ],
    {
      cwd: selected.root,
      env: { HOME: selected.root, PATH: '', LANG: 'C.UTF-8' },
      encoding: 'utf8',
      timeout: 20_000,
    },
  );
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout), result);
});

test('a Provider package-only change renews semantic verification without redrawing media', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const prior = await executableModelProvider(before);
  const next = await executableModelProvider(after);
  const priorPackage = JSON.parse(
    await fs.readFile(path.join(before.root, 'provider/provider.json'), 'utf8'),
  ).delivery.package.contentSha256;
  const nextPackage = JSON.parse(
    await fs.readFile(path.join(after.root, 'provider/provider.json'), 'utf8'),
  ).delivery.package.contentSha256;
  assert.notEqual(priorPackage, nextPackage);
  const selected = await comparisonPlan(t, before, after);
  const result = await compareEvolutionInput(selected.file, selected.digest, {
    before: [{ id: 'model-provider', manifestSha256: prior.manifestSha256 }],
    after: [{ id: 'model-provider', manifestSha256: next.manifestSha256 }],
  });
  assert.equal(result.delta.native.hasChanges, false);
  assert.deepEqual(result.delta.execution.providerPackages, {
    added: [],
    removed: [],
    changed: [{ id: 'model-provider', beforeSha256: priorPackage, afterSha256: nextPackage }],
  });
  const priorCandidate = await compileEditionCandidateInput(
    before.file,
    before.digest,
    path.join(before.root, 'candidate'),
  );
  const nextCandidate = await compileEditionCandidateInput(
    after.file,
    after.digest,
    path.join(after.root, 'candidate'),
  );
  assert.equal(priorCandidate.lockSha256, nextCandidate.lockSha256);
  assert.equal(priorCandidate.candidateSha256, nextCandidate.candidateSha256);
  assert.equal(priorCandidate.manifestSha256, nextCandidate.manifestSha256);
  assert.deepEqual(result.editions.changed, ['selected-atlas']);
  assert.deepEqual(result.obligations.rebuild, []);
  assert.deepEqual(result.obligations.mediumVerification, []);
  assert.deepEqual(result.obligations.humanReview, []);
  assert.deepEqual(result.obligations.semanticVerification[0].questions, ['shape']);
  assert.deepEqual(
    result.obligations.acceptance.map(({ action }) => action),
    ['reaccept'],
  );
  assert.deepEqual(
    result.obligations.publication.map(({ action }) => action),
    ['replace'],
  );
});

test('a relocated unchanged executable Provider package creates no evolution obligation', async (t) => {
  const fixture = await selectedNativeEdition(t);
  const provider = await executableModelProvider(fixture);
  const selected = await comparisonPlan(t, fixture, fixture);
  const choice = [{ id: 'model-provider', manifestSha256: provider.manifestSha256 }];
  const result = await compareEvolutionInput(selected.file, selected.digest, {
    before: choice,
    after: choice,
  });
  assert.deepEqual(result.delta.execution.providerPackages, {
    added: [],
    removed: [],
    changed: [],
  });
  assert.deepEqual(result.editions.changed, []);
  assert(Object.values(result.obligations).every((items) => items.length === 0));
});

test('package-only evolution refuses malformed or ambiguous execution evidence', async (t) => {
  const fixture = await selectedNativeEdition(t);
  const side = await snapshot(fixture);
  for (const before of [
    [{ id: 'model-provider', sha256: 'not-a-digest' }],
    [
      { id: 'model-provider', sha256: sha('first') },
      { id: 'model-provider', sha256: sha('second') },
    ],
  ]) {
    assert.throws(
      () => compileNativeEditionEvolution({ before: side, after: side }, { before, after: [] }),
      { code: 'native_evolution_execution_invalid' },
    );
  }
});

test('native evolution validates both executable selections before either Provider runs', async (t) => {
  const before = await selectedNativeEdition(t);
  const after = await selectedNativeEdition(t);
  const prior = await executableModelProvider(before);
  const next = await executableModelProvider(after);
  const selected = await comparisonPlan(t, before, after);
  const beforeChoice = [{ id: 'model-provider', manifestSha256: prior.manifestSha256 }];
  await assert.rejects(
    compareEvolutionInput(selected.file, selected.digest, { before: beforeChoice, after: [] }),
    { code: 'semantic_native_provider_comparison_unadmitted' },
  );
  await assert.rejects(fs.access(prior.executionMarker), { code: 'ENOENT' });
  await assert.rejects(fs.access(next.executionMarker), { code: 'ENOENT' });

  await fs.writeFile(path.join(selected.root, 'after/provider/model.c4'), 'changed after pin\n');
  await assert.rejects(
    compareEvolutionInput(selected.file, selected.digest, {
      before: beforeChoice,
      after: [{ id: 'model-provider', manifestSha256: next.manifestSha256 }],
    }),
    { code: 'edition_provider_v2_input_size_mismatch' },
  );
  await assert.rejects(fs.access(prior.executionMarker), { code: 'ENOENT' });
  await assert.rejects(fs.access(next.executionMarker), { code: 'ENOENT' });
});
