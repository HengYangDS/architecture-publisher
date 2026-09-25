import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compileEditionMeaning } from '../packages/publisher/src/compiler/index.mjs';
import { compileNativeEditionEvolution } from '../packages/publisher/src/edition/evolution.mjs';
import { compareEvolutionInput } from '../packages/publisher/src/compiler/evolution.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/provider/index.mjs';
import { compileNativeSelectionDelta } from '../packages/publisher/src/semantics/change.mjs';
import { canonical } from '../packages/publisher/src/source/json.mjs';
import {
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

function addOperationQuestion(fixture) {
  fixture.project.questions.push({
    id: 'operation',
    audience: 'maintainer',
    text: 'What operation is selected?',
  });
  fixture.project.requiredAssertions.push({
    id: 'operation',
    kind: 'source',
    selection: 'overview',
    questions: ['operation'],
  });
  fixture.project.narrative.readingOrder.push('operation');
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
    ['publication-bundle', 'static', 'interactive-atlas', 'interactive'],
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
    ['publication-bundle'],
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
    ['publication-bundle'],
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
    ['publication-bundle', 'interactive-atlas', 'interactive'],
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
    ['publication-bundle', 'interactive-atlas'],
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
