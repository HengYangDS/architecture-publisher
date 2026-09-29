import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compileNativeEditionEvolution } from '../packages/publisher/src/edition/evolution.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { installCoreAndSelf } from './fixtures/installed-packages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const selectedSources = Object.freeze({
  'product-contract': 'docs/product-contract.md',
  'core-package': 'packages/publisher/package.json',
  'self-prepare-owner': 'editions/self/src/edition/prepare.mjs',
  'self-model-owner': 'editions/self/src/edition/model.mjs',
  'self-project-owner': 'editions/self/src/edition/project.mjs',
  'self-static-composition-owner': 'editions/self/src/edition/static/composition.mjs',
  'self-static-compiler-owner': 'editions/self/src/edition/static/scene.mjs',
  'static-renderer-owner': 'packages/publisher/renderers/svg/canvas.mjs',
  'self-static-metrics': 'editions/self/src/edition/static/authoring/metrics.json',
  'self-interactive-scene-owner': 'editions/self/src/edition/interactive-scenes.mjs',
  'self-interactive-composition-owner': 'editions/self/src/edition/interactive-scene.mjs',
  'interactive-compositor-owner': 'packages/publisher/src/rendering/interactive-html.mjs',
  'source-owner': 'packages/publisher/src/source/write.mjs',
  'claim-owner': 'packages/publisher/src/semantics/document.mjs',
  'evolution-owner': 'packages/publisher/src/edition/evolution.mjs',
  'compiler-owner': 'packages/publisher/src/compiler/edition.mjs',
  'interactive-renderer-owner': 'packages/publisher/renderers/archify/index.mjs',
  'qualification-owner': 'packages/publisher/src/qualification/contract.mjs',
  'publication-owner': 'packages/publisher/src/publication/files.mjs',
  'installed-test-owner': 'tests/self-hosted-adopter.test.mjs',
});

function installedPath(install, relative) {
  if (relative.startsWith('packages/publisher/'))
    return path.join(install.coreRoot, relative.slice('packages/publisher/'.length));
  if (relative.startsWith('editions/self/'))
    return path.join(install.selfRoot, relative.slice('editions/self/'.length));
  return path.join(root, relative);
}

async function replaceExact(file, before, after) {
  const source = await fs.readFile(file, 'utf8');
  assert(source.includes(before), `missing mutation target in ${file}`);
  await fs.writeFile(file, source.replace(before, after));
}

async function mutateSelfModel(install) {
  await replaceExact(
    path.join(install.selfRoot, 'src/edition/model.mjs'),
    "'Qualification Set contract'",
    "'Conjunctive Qualification contract'",
  );
  await replaceExact(
    path.join(install.selfRoot, 'src/edition/interactive-scenes.mjs'),
    "['qualification', 'Qualification Set', ['qualification-set']]",
    "['qualification', 'Conjunctive Qualification', ['qualification-set']]",
  );
}

function interactivePages(bytes) {
  const match = bytes
    .toString('utf8')
    .match(
      /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/,
    );
  assert(match, 'selected interactive page data is embedded');
  return JSON.parse(match[1]).pages;
}

async function buildInstalledCandidate(directory, revision, mutate = false) {
  await fs.mkdir(directory);
  const install = await installCoreAndSelf(root, directory);
  if (mutate) await mutateSelfModel(install);
  const sourcePaths = Object.fromEntries(
      Object.entries(selectedSources).map(([id, relative]) => [
        id,
        installedPath(install, relative),
      ]),
    ),
    sources = {};
  for (const [id, file] of Object.entries(sourcePaths)) {
    const bytes = await fs.readFile(file);
    sources[id] = { path: file, sha256: sha256(bytes) };
  }
  const api = await import(
      pathToFileURL(path.join(install.selfRoot, 'src/edition/index.mjs')).href +
        `?revision=${revision}`
    ),
    preparedRoot = path.join(directory, 'prepared'),
    prepared = await api.prepareArchitecturePublisherEdition({
      schema: 'architecture.publisher-self-input/v1',
      source: { id: 'architecture-publisher', revision },
      sources,
      output: preparedRoot,
    }),
    candidateRoot = path.join(directory, 'candidate'),
    core = await import(
      pathToFileURL(path.join(install.coreRoot, 'src/compiler/index.mjs')).href +
        `?revision=${revision}`
    ),
    selection = await import(
      pathToFileURL(path.join(install.coreRoot, 'src/compiler/build-input.mjs')).href +
        `?revision=${revision}`
    ),
    selected = await selection.materializeBuildRequestInput(
      prepared.buildRequest,
      prepared.buildRequestSha256,
    ),
    meaning = await core.compileEditionMeaning(selected),
    result = await core.compileEditionCandidateInput(
      prepared.buildRequest,
      prepared.buildRequestSha256,
      candidateRoot,
    ),
    source = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256),
    sourceMembers = new Map(source.members.map((member) => [member.path, member.content])),
    candidate = JSON.parse(await fs.readFile(path.join(candidateRoot, 'candidate.json')));
  assert.deepEqual(result.media.sort(), ['interactive', 'static']);
  return {
    sourcePaths,
    preparedRoot,
    candidateRoot,
    model: JSON.parse(sourceMembers.get('semantic.json')),
    project: JSON.parse(await fs.readFile(prepared.project, 'utf8')),
    snapshot: { lock: selected.lock, meaning },
    candidate,
    pages: interactivePages(
      await fs.readFile(path.join(candidateRoot, 'interactive/architecture.html')),
    ),
  };
}

test('a source-authored self-model change renews exact Project and media obligations', async (t) => {
  const scratch = path.join(root, 'build/test-work');
  await fs.mkdir(scratch, { recursive: true });
  const directory = await fs.mkdtemp(path.join(scratch, 'publisher-self-evolution-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const before = await buildInstalledCandidate(
      path.join(directory, 'before'),
      'self-evolution-before',
    ),
    after = await buildInstalledCandidate(
      path.join(directory, 'after'),
      'self-evolution-after',
      true,
    ),
    evolution = compileNativeEditionEvolution({
      before: before.snapshot,
      after: after.snapshot,
    }),
    affected = evolution.editions.affected[0],
    artifact = (value, medium, id) =>
      value.candidate.media[medium].artifacts.find((item) => item.id === id),
    changedPages = Object.keys(before.pages).filter(
      (id) => before.pages[id].sha256 !== after.pages[id].sha256,
    );

  assert.equal(evolution.schema, 'architecture.semantic-change/v3');
  assert.equal(evolution.delta.native.hasChanges, true);
  assert(affected.media.static.includes('system-map'));
  assert(affected.media.interactive.includes('overview'));
  assert(affected.media.interactive.includes('qualification'));
  assert.notEqual(before.candidate.input.semanticDigest, after.candidate.input.semanticDigest);
  assert.equal(before.candidate.media.static.sceneSha256, after.candidate.media.static.sceneSha256);
  assert.equal(
    artifact(before, 'static', 'architecture-png').sha256,
    artifact(after, 'static', 'architecture-png').sha256,
  );
  assert.notEqual(
    artifact(before, 'interactive', 'architecture-html').sha256,
    artifact(after, 'interactive', 'architecture-html').sha256,
  );
  assert(changedPages.length > 0);
  assert(changedPages.every((id) => affected.media.interactive.includes(id)));
  assert(
    new Set(evolution.obligations.mediumVerification.map(({ medium }) => medium)).has('static'),
  );
  assert(
    new Set(evolution.obligations.mediumVerification.map(({ medium }) => medium)).has(
      'interactive',
    ),
  );
  assert.deepEqual(
    new Set(evolution.obligations.humanReview.map(({ medium }) => medium)),
    new Set(['static', 'interactive']),
  );
  assert.equal(after.candidate.qualification, 'unqualified');
  assert.equal(Object.hasOwn(after.candidate, 'humanAcceptance'), false);
  for (const file of Object.values(after.sourcePaths)) {
    assert.equal(file.startsWith(before.preparedRoot), false);
    assert.equal(file.startsWith(before.candidateRoot), false);
    assert.equal(file.startsWith(after.preparedRoot), false);
    assert.equal(file.startsWith(after.candidateRoot), false);
  }
});
