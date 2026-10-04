import assert from 'node:assert/strict';
import test from 'node:test';
import { validateEditionProject } from '../packages/publisher/src/edition/authoring.mjs';
import { assembleEditionSelection } from '../packages/publisher/src/edition/selection.mjs';
import { compileEditionMeaning } from '../packages/publisher/src/compiler/meaning.mjs';
import { composeInteractiveEditionScene } from '../packages/publisher/src/scene/interactive/edition.mjs';
import { renderInteractiveEditionHtml } from '../packages/publisher/renderers/interactive/index.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';

async function meaningFor(fixture) {
  const content = Buffer.from(JSON.stringify(fixture.project) + '\n');
  return compileEditionMeaning(
    assembleEditionSelection({
      request: fixture.request,
      edition: { content, resources: [] },
      sources: fixture.request.sources.map((source, index) => {
        const bytes = index === 0 ? fixture.model : fixture.views;
        return {
          namespace: source.namespace,
          format: source.format,
          claimant: source.claimant,
          revisionEvidence: {
            kind: 'content',
            scope: 'selected-root',
            canonicalization: 'raw-bytes/v1',
            algorithm: 'sha256',
            value: sha(bytes),
            verification: 'recomputed',
          },
          content: bytes,
        };
      }),
    }),
  );
}

test('Edition appearance is a finite optional choice, not executable styling', async (t) => {
  const fixture = await selectedNativeEdition(t);
  assert.equal(
    validateEditionProject(fixture.project).presentation.interactive.appearance,
    undefined,
  );
  for (const style of ['editorial', 'blueprint', 'classic', 'signal-flow']) {
    for (const theme of ['light', 'dark']) {
      fixture.project.presentation.interactive.appearance = { style, theme };
      const validated = validateEditionProject(fixture.project);
      assert.deepEqual(validated.presentation.interactive.appearance, { style, theme });
      assert(Object.isFrozen(validated.presentation.interactive.appearance));
    }
  }
});

test('Edition refuses unknown appearances, incomplete choices and executable overrides', async (t) => {
  const fixture = await selectedNativeEdition(t);
  for (const appearance of [
    null,
    [],
    {},
    { style: 'editorial' },
    { style: 'unknown', theme: 'light' },
    { style: 'editorial', theme: 'system' },
    { style: 'editorial', theme: 'light', css: 'body{display:none}' },
    { style: 'editorial', theme: 'light', script: 'alert(1)' },
  ]) {
    fixture.project.presentation.interactive.appearance = appearance;
    assert.throws(() => validateEditionProject(fixture.project), /edition_project_invalid/);
  }
});

test('appearance reaches the generic reader without altering selected meaning or geometry', async (t) => {
  const fixture = await selectedNativeEdition(t, { media: ['interactive'] });
  const baseline = await meaningFor(fixture);
  const baseScene = composeInteractiveEditionScene(baseline);
  const baseRendered = await renderInteractiveEditionHtml(baseScene);
  fixture.project.presentation.interactive.appearance = { style: 'blueprint', theme: 'dark' };
  const chosen = await meaningFor(fixture);
  const chosenScene = composeInteractiveEditionScene(chosen);
  assert.deepEqual(chosenScene.appearance, { style: 'blueprint', theme: 'dark' });
  assert.deepEqual(chosen.assertions, baseline.assertions);
  assert.deepEqual(chosenScene.pages, baseScene.pages);
  const chosenRendered = await renderInteractiveEditionHtml(chosenScene);
  const pages = (bytes) =>
    JSON.parse(bytes.toString().match(/id="edition-data">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(pages(chosenRendered.bytes), pages(baseRendered.bytes));
  assert.deepEqual(chosenRendered.carriers, baseRendered.carriers);
  const html = chosenRendered.bytes.toString();
  assert.match(html, /data-style="blueprint" data-theme="dark"/);
  assert.match(html, /id="interactive-style"/);
  assert.match(html, /id="interactive-theme"/);
  assert.doesNotMatch(html, /Play Story|setInterval\(|localStorage|sessionStorage/);
  assert.equal((html.match(/id="interactive-style"/g) ?? []).length, 1);
  assert.equal((html.match(/id="interactive-theme"/g) ?? []).length, 1);
});

test('the direct neutral renderer rejects an unsupported appearance instead of substituting', async (t) => {
  const fixture = await selectedNativeEdition(t, { media: ['interactive'] });
  const scene = composeInteractiveEditionScene(await meaningFor(fixture));
  await assert.rejects(
    renderInteractiveEditionHtml({ ...scene, appearance: { style: 'unknown', theme: 'light' } }),
    /interactive_appearance_invalid/,
  );
});
