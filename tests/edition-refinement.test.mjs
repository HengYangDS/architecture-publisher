import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { compileEditionMeaning } from '../packages/publisher/src/compiler/meaning.mjs';
import { compileSelectedEditionCandidateInput } from '../packages/publisher/src/compiler/successor.mjs';
import { composeStaticEditionSvg } from '../packages/publisher/renderers/svg/index.mjs';
import { parseSelectedSceneRefinement } from '../packages/publisher/src/edition/refinement.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/provider/build-request.mjs';
import { composeStaticEditionScene } from '../packages/publisher/src/scene/static/edition.mjs';
import { importLikeC4Layout } from '../packages/publisher/src/semantics/native-likec4.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';

async function inputWithRefinement(t, change = (value) => value, media = ['static']) {
  const fixture = await selectedNativeEdition(t, { media });
  const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
  const layout = await importLikeC4Layout({
    lock: selected.lock,
    readSource: selected.readSource,
    view: { namespace: 'fixture/views', id: 'overview' },
  });
  const refinement = change({
    schema: 'architecture.scene-refinement/v1',
    media: {
      static: {
        view: 'overview',
        nodes: layout.nodes.map(({ namespace, id, x, y, width, height }) => ({
          namespace,
          id,
          x,
          y,
          width,
          height,
        })),
        edges: layout.edges.map(({ from, to, relations, points }) => ({
          from,
          to,
          relations: relations.map(({ namespace, reference }) => ({ namespace, reference })),
          points,
        })),
        groups: [],
      },
    },
  });
  const bytes = Buffer.from(JSON.stringify(refinement) + '\n');
  fixture.project.visualPolicy.override = 'refinement.json';
  await fs.writeFile(
    path.join(fixture.root, 'edition/project.json'),
    JSON.stringify(fixture.project) + '\n',
  );
  await fs.writeFile(path.join(fixture.root, 'edition/refinement.json'), bytes);
  return { ...fixture, refinement, overrideDigest: sha(bytes) };
}

function authoredInteractive(label) {
  return {
    kind: 'authored-architecture',
    pages: [
      {
        id: 'overview',
        label,
        purpose: 'overview',
        scene: {
          schema: 'architecture.interactive-scene/v1',
          id: 'overview',
          title: 'Selected architecture',
          subtitle: label,
          viewport: { width: 800, height: 600 },
          nodes: [
            {
              id: 'alpha',
              label: 'Alpha',
              visualRole: 'structure',
              position: { x: 80, y: 100 },
              size: { width: 160, height: 80 },
            },
          ],
          groups: [],
          edges: [],
        },
      },
    ],
  };
}

test('selected static refinement is byte-bound and changes only public-build geometry', async (t) => {
  const neutral = await selectedNativeEdition(t, { media: ['static'] });
  const neutralBuilt = await compileSelectedEditionCandidateInput(
    neutral.file,
    neutral.digest,
    path.join(neutral.root, 'candidate'),
  );
  const neutralCandidate = JSON.parse(
    await fs.readFile(path.join(neutralBuilt.output, 'candidate.json'), 'utf8'),
  );
  const fixture = await inputWithRefinement(t, (value) => {
    value.media.static.nodes[0].x += 45;
    return value;
  });
  const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
  const meaning = await compileEditionMeaning(selected);
  assert.equal(meaning.refinement.schema, 'architecture.scene-refinement/v1');
  assert.equal(meaning.refinement.sha256, fixture.overrideDigest);
  assert.equal(Object.isFrozen(meaning.refinement.media.static.nodes[0]), true);
  const built = await compileSelectedEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, 'candidate'),
  );
  assert.equal(built.status, 'built');
  assert.deepEqual(built.media, ['static']);
  const candidate = JSON.parse(
    await fs.readFile(path.join(built.output, 'candidate.json'), 'utf8'),
  );
  assert.equal(candidate.media.static.artifacts.length, 2);
  assert.notEqual(candidate.media.static.sceneSha256, neutralCandidate.media.static.sceneSha256);
  assert.notEqual(
    candidate.media.static.artifacts[0].sha256,
    neutralCandidate.media.static.artifacts[0].sha256,
  );
});

test('explicit neutral interactive keeps a static refinement medium-local', async (t) => {
  const first = await inputWithRefinement(
    t,
    (value) => {
      value.media.interactive = { kind: 'neutral' };
      return value;
    },
    ['static', 'interactive'],
  );
  const second = await inputWithRefinement(
    t,
    (value) => {
      value.media.static.nodes[0].x += 45;
      value.media.interactive = { kind: 'neutral' };
      return value;
    },
    ['static', 'interactive'],
  );
  const build = async (fixture) => {
    const result = await compileSelectedEditionCandidateInput(
      fixture.file,
      fixture.digest,
      path.join(fixture.root, 'candidate'),
    );
    return {
      result,
      candidate: JSON.parse(await fs.readFile(path.join(result.output, 'candidate.json'), 'utf8')),
    };
  };
  const original = await build(first);
  const refined = await build(second);
  assert.notEqual(original.result.lockSha256, refined.result.lockSha256);
  assert.notEqual(
    original.candidate.media.static.sceneSha256,
    refined.candidate.media.static.sceneSha256,
  );
  assert.notEqual(
    original.candidate.media.static.artifacts[0].sha256,
    refined.candidate.media.static.artifacts[0].sha256,
  );
  assert.equal(
    original.candidate.media.interactive.sceneSha256,
    refined.candidate.media.interactive.sceneSha256,
  );
  assert.equal(
    original.candidate.media.interactive.artifacts[0].sha256,
    refined.candidate.media.interactive.artifacts[0].sha256,
  );
});

test('explicit neutral static does not inherit interactive-only refinement identity', async (t) => {
  const fixture = await selectedNativeEdition(t, { media: ['static', 'interactive'] });
  const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
  const meaning = await compileEditionMeaning(selected);
  const layout = await importLikeC4Layout({
    lock: selected.lock,
    readSource: selected.readSource,
    view: { namespace: 'fixture/views', id: 'overview' },
  });
  const sceneFor = (label) => {
    const value = {
      schema: 'architecture.scene-refinement/v1',
      media: {
        static: { kind: 'neutral' },
        interactive: authoredInteractive(label),
      },
    };
    const bytes = Buffer.from(JSON.stringify(value) + '\n');
    const refinement = parseSelectedSceneRefinement(bytes, ['static', 'interactive'], sha(bytes));
    return composeStaticEditionScene(
      {
        ...meaning,
        editorial: {
          ...meaning.editorial,
          visualPolicy: { profile: 'neutral', override: 'refinement.json' },
        },
        refinement,
      },
      layout,
    );
  };
  const first = sceneFor('First direction');
  const second = sceneFor('Second direction');
  assert.deepEqual(first, second);
  assert.equal(Object.hasOwn(first, 'refinement'), false);
});

test('authored static identity excludes a sibling authored interactive decision', async (t) => {
  const sceneFor = async (label) => {
    const fixture = await inputWithRefinement(
      t,
      (value) => {
        value.media.interactive = authoredInteractive(label);
        return value;
      },
      ['static', 'interactive'],
    );
    const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
    const meaning = await compileEditionMeaning(selected);
    const layout = await importLikeC4Layout({
      lock: selected.lock,
      readSource: selected.readSource,
      view: { namespace: 'fixture/views', id: 'overview' },
    });
    return composeStaticEditionScene(meaning, layout);
  };
  const first = await sceneFor('First direction');
  const second = await sceneFor('Second direction');
  assert.deepEqual(first, second);
  assert.match(first.refinement.decisionSha256, /^[a-f0-9]{64}$/u);
  assert.equal(Object.hasOwn(first.refinement, 'sha256'), false);
  assert.deepEqual(composeStaticEditionSvg(first).bytes, composeStaticEditionSvg(second).bytes);
});

test('neutral decisions cannot become an unobserved no-op or media payload', async (t) => {
  for (const [name, mutate] of [
    ['all-neutral', (value) => (value.media.static = { kind: 'neutral' })],
    [
      'neutral-media-payload',
      (value) => {
        value.media.interactive = { kind: 'neutral', html: '<p>unselected</p>' };
      },
    ],
  ]) {
    const fixture = await inputWithRefinement(
      t,
      mutate,
      name === 'all-neutral' ? ['static'] : ['static', 'interactive'],
    );
    await assert.rejects(
      compileEditionMeaning(await materializeBuildRequestInput(fixture.file, fixture.digest)),
      { code: 'scene_refinement_invalid' },
      name,
    );
  }
});

test('a selected refinement cannot add or remove source members', async (t) => {
  const fixture = await inputWithRefinement(t, (value) => {
    value.media.static.nodes[0].id = 'invented';
    return value;
  });
  await assert.rejects(
    compileSelectedEditionCandidateInput(
      fixture.file,
      fixture.digest,
      path.join(fixture.root, 'candidate'),
    ),
    { code: 'scene_refinement_membership_mismatch' },
  );
});

test('pre-rendered media is not a data-only refinement', async (t) => {
  const fixture = await inputWithRefinement(t, (value) => {
    value.media.static.html = '<svg/>';
    return value;
  });
  const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
  await assert.rejects(compileEditionMeaning(selected), {
    code: 'scene_refinement_invalid',
  });
});

test('an unknown refinement version cannot masquerade as a medium decision', async (t) => {
  const fixture = await inputWithRefinement(t, (value) => {
    value.schema = 'architecture.scene-refinement/v99';
    return value;
  });
  const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
  await assert.rejects(compileEditionMeaning(selected), {
    code: 'scene_refinement_invalid',
  });
});

test('an unsupported selected medium fails instead of silently using neutral output', async (t) => {
  const fixture = await inputWithRefinement(t, (value) => value, ['static', 'interactive']);
  const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
  await assert.rejects(compileEditionMeaning(selected), {
    code: 'scene_refinement_medium_unadmitted',
  });
});
