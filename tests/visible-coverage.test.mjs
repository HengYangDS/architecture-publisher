import assert from 'node:assert/strict';
import test from 'node:test';
import { renderInteractiveEditionHtml } from '../packages/publisher/renderers/cytoscape/edition.mjs';
import { composeStaticEditionSvg } from '../packages/publisher/renderers/svg/edition.mjs';
import { interactiveEditionScene } from './fixtures/interactive-edition-scene.mjs';
import { staticEditionScene } from './fixtures/static-edition-scene.mjs';

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
