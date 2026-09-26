import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { compileEditionMeaning } from '../packages/publisher/src/compiler/meaning.mjs';
import { compileSelectedEditionCandidateInput } from '../packages/publisher/src/compiler/successor.mjs';
import { materializeBuildRequestInput } from '../packages/publisher/src/provider/build-request.mjs';
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
