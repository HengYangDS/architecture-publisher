import assert from 'node:assert/strict';
import test from 'node:test';
import { renderInteractiveEditionHtml } from '../packages/publisher/renderers/cytoscape/edition.mjs';
import { composeStaticEditionSvg } from '../packages/publisher/renderers/svg/edition.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';
import { staticEditionScene } from './fixtures/static-edition-scene.mjs';

function selectedMeaning(scene, medium) {
  const pages = medium === 'static' ? [scene] : scene.pages;
  const assertions = new Map();
  const views = pages.map((page) => {
    const selected = [
      ...page.sourceAssertionCarriers.map(({ assertionId }) => ({
        id: assertionId,
        kind: 'source',
        questions: page.questionIds,
      })),
      ...page.editorialAssertions.map(({ id, questions }) => ({
        id,
        kind: 'editorial',
        questions,
      })),
    ];
    for (const assertion of selected) assertions.set(assertion.id, assertion);
    const assertionIds = selected.map(({ id }) => id);
    return {
      id: medium === 'static' ? page.editorialViewId : page.id,
      questionIds: page.questionIds,
      assertionIds,
      assertionsByQuestion: Object.fromEntries(
        page.questionIds.map((id) => [
          id,
          selected
            .filter(({ questions }) => questions.includes(id))
            .map(({ id: assertionId }) => assertionId),
        ]),
      ),
      limitsByQuestion: page.limitsByQuestion,
    };
  });
  return { assertions: [...assertions.values()], media: { [medium]: { views } } };
}

test('interactive rendering refuses a question present only in hidden scene metadata', async () => {
  const scene = interactiveEditionScene();
  scene.pages[0].questions.push({
    id: 'hidden',
    audience: 'maintainer',
    text: 'What is not displayed?',
  });
  await assert.rejects(renderInteractiveEditionHtml(scene), {
    code: 'render_interactive_question_invalid',
  });
});

test('interactive rendering refuses a limit for an undisplayed question', async () => {
  const scene = interactiveEditionScene();
  scene.pages[0].limitsByQuestion.hidden = [
    { kind: 'scope', reason: 'A hidden limit cannot count as disclosure.' },
  ];
  await assert.rejects(renderInteractiveEditionHtml(scene), {
    code: 'render_interactive_question_invalid',
  });
});

test('static rendering refuses an authored question with no visible question record', () => {
  const scene = staticEditionScene();
  scene.questionIds.push('hidden');
  assert.throws(() => composeStaticEditionSvg(scene), {
    code: 'static_edition_question_invalid',
  });
});

test('static rendering refuses a limit for an undisplayed question', () => {
  const scene = staticEditionScene();
  scene.limitsByQuestion.hidden = [
    { kind: 'scope', reason: 'A hidden limit cannot count as disclosure.' },
  ];
  assert.throws(() => composeStaticEditionSvg(scene), {
    code: 'static_edition_question_invalid',
  });
});

test('static rendering refuses graphic carriers with no bound source assertion', () => {
  const scene = staticEditionScene();
  scene.sourceAssertionCarriers = [];
  assert.throws(() => composeStaticEditionSvg(scene), {
    code: 'static_edition_carrier_unclaimed',
  });
});

test('static private carrier evidence binds assertions to the visible graphics', () => {
  const rendered = composeStaticEditionSvg(staticEditionScene());
  assert.deepEqual(rendered.carriers.assertions, [
    {
      assertionId: 'source-shape',
      nodeGraphicIds: ['n-0', 'n-1'],
      relationGraphicIds: ['r-0'],
    },
  ]);
});

test('changing only assertion binding changes private evidence even when visible bytes agree', () => {
  const before = composeStaticEditionSvg(staticEditionScene());
  const scene = staticEditionScene();
  scene.sourceAssertionCarriers[0].assertionId = 'another-assertion';
  const after = composeStaticEditionSvg(scene);
  assert.deepEqual(after.bytes, before.bytes);
  assert.notDeepEqual(after.carriers.assertions, before.carriers.assertions);
});

test('static relation notes preserve bidirectional meaning', () => {
  const scene = staticEditionScene();
  scene.edges[0].relations[0].direction = 'bidirectional';
  scene.edges[0].relations[0].label = null;
  scene.edges[0].relations[0].kind = 'peer';
  const svg = composeStaticEditionSvg(scene).bytes.toString('utf8');
  assert.match(svg, /Alpha &amp; one ↔ Beta · peer/u);
  assert.doesNotMatch(svg, /Alpha &amp; one → Beta · peer/u);
});

test('compiler coverage join accepts the selected static and interactive view obligations', async () => {
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const staticScene = staticEditionScene();
  const staticCarriers = composeStaticEditionSvg(staticScene).carriers;
  assert.doesNotThrow(() =>
    validateVisibleSelection(
      selectedMeaning(staticScene, 'static'),
      'static',
      staticScene,
      staticCarriers,
    ),
  );
  const interactiveScene = interactiveEditionScene();
  const interactiveCarriers = (await renderInteractiveEditionHtml(interactiveScene)).carriers;
  assert.doesNotThrow(() =>
    validateVisibleSelection(
      selectedMeaning(interactiveScene, 'interactive'),
      'interactive',
      interactiveScene,
      interactiveCarriers,
    ),
  );
});

test('compiler coverage join refuses an invented Scene assertion despite valid rendered graphics', async () => {
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const scene = staticEditionScene();
  const meaning = selectedMeaning(scene, 'static');
  scene.sourceAssertionCarriers[0].assertionId = 'invented';
  const carriers = composeStaticEditionSvg(scene).carriers;
  assert.throws(() => validateVisibleSelection(meaning, 'static', scene, carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
});

test('compiler coverage join refuses an invented private carrier assertion', async () => {
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const scene = staticEditionScene();
  const meaning = selectedMeaning(scene, 'static');
  const carriers = composeStaticEditionSvg(scene).carriers;
  carriers.assertions[0].assertionId = 'invented';
  assert.throws(() => validateVisibleSelection(meaning, 'static', scene, carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
});

test('compiler coverage join refuses a partial assertion-to-graphic binding', async () => {
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const scene = staticEditionScene();
  const meaning = selectedMeaning(scene, 'static');
  const carriers = composeStaticEditionSvg(scene).carriers;
  carriers.assertions[0].nodeGraphicIds = ['n-1'];
  assert.throws(() => validateVisibleSelection(meaning, 'static', scene, carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
});

test('compiler coverage join refuses an omitted editorial assertion behind a limit', async () => {
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const scene = interactiveEditionScene();
  const meaning = selectedMeaning(scene, 'interactive');
  meaning.media.interactive.views[1].assertionsByQuestion.risk = [];
  const carriers = (await renderInteractiveEditionHtml(scene)).carriers;
  assert.throws(() => validateVisibleSelection(meaning, 'interactive', scene, carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
});

test('compiler coverage join binds each interactive carrier map to its page', async () => {
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const scene = interactiveEditionScene();
  const meaning = selectedMeaning(scene, 'interactive');
  const carriers = (await renderInteractiveEditionHtml(scene)).carriers;
  carriers[1].id = 'overview';
  assert.throws(() => validateVisibleSelection(meaning, 'interactive', scene, carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
});

test('compiler coverage join refuses interactive assertion substitution and false question coverage', async () => {
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const scene = interactiveEditionScene();
  const meaning = selectedMeaning(scene, 'interactive');
  scene.pages[0].sourceAssertionCarriers[0].assertionId = 'invented';
  const carriers = (await renderInteractiveEditionHtml(scene)).carriers;
  assert.throws(() => validateVisibleSelection(meaning, 'interactive', scene, carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
  const original = interactiveEditionScene();
  const originalCarriers = (await renderInteractiveEditionHtml(original)).carriers;
  const falseMeaning = selectedMeaning(original, 'interactive');
  falseMeaning.media.interactive.views[0].assertionsByQuestion.shape = ['invented'];
  assert.throws(
    () => validateVisibleSelection(falseMeaning, 'interactive', original, originalCarriers),
    { code: 'edition_visible_coverage_mismatch' },
  );
});

test('compiler coverage join refuses swapping declared assertions between questions', async () => {
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const scene = staticEditionScene();
  scene.questionIds.push('risk');
  scene.questions.push({
    id: 'risk',
    audience: 'maintainer',
    text: 'What remains uncertain?',
  });
  scene.limitsByQuestion.risk = [];
  scene.editorialAssertions.push({
    id: 'editorial-risk',
    kind: 'editorial',
    statement: 'Runtime safety is not established.',
    proponent: 'fixture-editor',
    basis: ['overview'],
    questions: ['risk'],
    semanticStatus: 'editor-attributed-unverified',
  });
  const meaning = selectedMeaning(scene, 'static');
  meaning.assertions.find(({ id }) => id === 'source-shape').questions = ['shape'];
  meaning.media.static.views[0].assertionsByQuestion = {
    shape: ['source-shape'],
    risk: ['editorial-risk'],
  };
  const carriers = composeStaticEditionSvg(scene).carriers;
  assert.doesNotThrow(() => validateVisibleSelection(meaning, 'static', scene, carriers));

  meaning.media.static.views[0].assertionsByQuestion = {
    shape: ['editorial-risk'],
    risk: ['source-shape'],
  };
  assert.throws(() => validateVisibleSelection(meaning, 'static', scene, carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
});

test('compiler coverage join permits a limited view when another view carries the assertion', async () => {
  const { validateVisibleSelection } =
    await import('../packages/publisher/src/compiler/coverage.mjs');
  const scene = interactiveEditionScene();
  const secondPage = scene.pages[1];
  secondPage.questionIds.push('shape');
  secondPage.questions.push({
    id: 'shape',
    audience: 'maintainer',
    text: 'What is connected?',
  });
  secondPage.limitsByQuestion.shape = [
    { kind: 'omission', selection: 'overview', reason: 'Shown in the overview.' },
  ];
  const meaning = selectedMeaning(scene, 'interactive');
  const carriers = (await renderInteractiveEditionHtml(scene)).carriers;
  assert.deepEqual(meaning.media.interactive.views[1].assertionsByQuestion.shape, []);
  assert.doesNotThrow(() => validateVisibleSelection(meaning, 'interactive', scene, carriers));
});

test('editorial-only pages keep each visible limit with its reader question', async () => {
  const scene = interactiveEditionScene();
  const page = scene.pages[1];
  page.questionIds.push('shape');
  page.questions.push({
    id: 'shape',
    audience: 'maintainer',
    text: 'What is connected?',
  });
  page.limitsByQuestion.shape = [
    { kind: 'omission', selection: 'overview', reason: 'Shown in the overview.' },
  ];
  const html = (await renderInteractiveEditionHtml(scene)).bytes.toString('utf8');
  const section = html.match(/<section class="edition-page" id="page-1"[\s\S]*?<\/section>/u)?.[0];
  assert.ok(section);
  assert.match(
    section,
    /<li><p>What remains uncertain\?<\/p><ul class="limits"><li>No runtime observation was selected\.<\/li><\/ul><\/li>/u,
  );
  assert.match(
    section,
    /<li><p>What is connected\?<\/p><ul class="limits"><li>Shown in the overview\.<\/li><\/ul><\/li>/u,
  );
  assert.equal(section.match(/No runtime observation was selected\./gu)?.length, 1);
  assert.equal(section.match(/Shown in the overview\./gu)?.length, 1);
});
