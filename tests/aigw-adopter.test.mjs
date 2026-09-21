import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { editionDigest, validateEdition } from '../packages/publisher/src/edition/contract.mjs';
import { compareEditionInput } from '../packages/publisher/src/edition/input.mjs';
import {
  claimModelDigest,
  validateClaimModel,
} from '../packages/publisher/src/semantics/document.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = path.join(root, 'packages/publisher');
const handoffPath = path.join(root, 'conformance/fixtures/aigw-source-owned-handoff.json');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function json(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: 120_000,
    ...options,
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`,
  );
  return result.stdout;
}

async function copyHandoffFiles(source, destination, files) {
  for (const relative of Object.keys(files)) {
    const input = path.join(source, ...relative.split('/'));
    const output = path.join(destination, ...relative.split('/'));
    const stat = await fs.lstat(input);
    assert(stat.isFile() && !stat.isSymbolicLink(), relative);
    const bytes = await fs.readFile(input);
    assert.equal(sha(bytes), files[relative], relative);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, bytes, { flag: 'wx' });
  }
}

test('Publisher retains only immutable AIGW source-ownership evidence', async () => {
  const handoff = await json(handoffPath);
  assert.equal(handoff.schema, 'aigw.architecture-publisher-handoff/v1');
  assert.equal(handoff.publisher.package.name, 'architecture-publisher');
  assert.equal(handoff.aigw.source.editionPath, 'docs/architecture/client-projection');
  assert.equal(handoff.aigw.governance.ownerState, 'candidate');
  assert.deepEqual(handoff.aigw.governance.acceptedRefs, []);
  assert.equal(handoff.aigw.governance.remotePublication, 'unproved');
  for (const value of [
    handoff.publisher.source.commit,
    handoff.publisher.source.oid,
    handoff.publisher.package.sha256,
    handoff.aigw.source.ownerCommit,
    handoff.aigw.source.ownerTree,
    handoff.aigw.source.editionTree,
    handoff.aigw.source.semanticRevision,
    ...Object.values(handoff.aigw.files),
    ...Object.values(handoff.aigw.candidate),
  ])
    if (typeof value === 'string') assert.match(value, /^[0-9a-f]{40}$|^[0-9a-f]{64}$/u);

  await assert.rejects(fs.access(path.join(root, 'migration/aigw')), { code: 'ENOENT' });
  const tracked = run('git', ['ls-files'], { cwd: root }).trim().split('\n');
  assert.equal(
    tracked.some((file) => file.startsWith('migration/aigw/')),
    false,
  );
});

const aigwEditionRoot = process.env.AIGW_EDITION_ROOT;
const aigwSourceRoot = process.env.AIGW_SOURCE_ROOT;
const externalSelection =
  path.isAbsolute(aigwEditionRoot ?? '') && path.isAbsolute(aigwSourceRoot ?? '');

test(
  'packed Publisher reproduces the source-owned AIGW Edition and evolution offline',
  { skip: externalSelection ? false : 'explicit AIGW_EDITION_ROOT and AIGW_SOURCE_ROOT required' },
  async (t) => {
    const handoff = await json(handoffPath);
    const temporary = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'aigw-source-owned-edition-')),
    );
    t.after(() => fs.rm(temporary, { recursive: true, force: true }));

    const editionRoot = path.join(temporary, 'edition');
    await fs.mkdir(editionRoot);
    await copyHandoffFiles(aigwEditionRoot, editionRoot, handoff.aigw.files);

    const modelPath = path.join(editionRoot, 'claim-model.json');
    const editionPath = path.join(editionRoot, 'edition.json');
    const modelBytes = await fs.readFile(modelPath);
    const editionBytes = await fs.readFile(editionPath);
    const model = validateClaimModel(JSON.parse(modelBytes));
    const edition = validateEdition(model, JSON.parse(editionBytes));
    assert.equal(claimModelDigest(model), handoff.aigw.candidate.semanticDigest);
    assert.equal(editionDigest(model, edition), handoff.aigw.candidate.editionDigest);

    const evolutionPath = path.join(editionRoot, 'evolution.json');
    const evolution = await compareEditionInput(
      evolutionPath,
      sha(await fs.readFile(evolutionPath)),
    );
    assert.equal(evolution.delta.hasChanges, true);
    assert.deepEqual(evolution.delta.added.entities, handoff.aigw.evolution.addedEntities);
    assert.deepEqual(evolution.delta.removed.entities, handoff.aigw.evolution.removedEntities);
    assert.deepEqual(evolution.editions.changed, handoff.aigw.evolution.changedEditions);
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(evolution.obligations).map(([kind, obligations]) => [
          kind,
          obligations.length,
        ]),
      ),
      handoff.aigw.evolution.obligations,
    );

    const archive = JSON.parse(
      run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], {
        cwd: publisher,
      }),
    )[0];
    const archivePath = path.join(temporary, archive.filename);
    assert.equal(sha(await fs.readFile(archivePath)), handoff.publisher.package.sha256);

    const consumer = path.join(temporary, 'consumer');
    const home = path.join(temporary, 'home');
    const cache = path.join(temporary, 'npm-cache');
    await fs.mkdir(consumer);
    await fs.mkdir(home);
    await fs.writeFile(
      path.join(consumer, 'package.json'),
      JSON.stringify({ private: true, type: 'module' }),
    );
    run(
      'npm',
      [
        'install',
        '--offline',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        archivePath,
      ],
      {
        cwd: consumer,
        env: {
          ...process.env,
          HOME: home,
          npm_config_cache: cache,
          npm_config_offline: 'true',
          npm_config_registry: 'https://registry.invalid/',
          npm_config_update_notifier: 'false',
        },
      },
    );
    const resolve = createRequire(path.join(consumer, 'package.json')).resolve;
    const cli = resolve('architecture-publisher/package.json').replace(
      /package\.json$/u,
      'src/cli/main.mjs',
    );

    const selected = [];
    for (const [id, source] of Object.entries(model.sources)) {
      const relative = source.locator.replace(/^source\//u, '');
      const input = path.join(aigwSourceRoot, ...relative.split('/'));
      const stat = await fs.lstat(input);
      assert(stat.isFile() && !stat.isSymbolicLink(), id);
      const bytes = await fs.readFile(input);
      assert.equal(sha(bytes), source.sha256, id);
      selected.push({ input, path: source.locator, bytes: bytes.length, sha256: source.sha256 });
    }
    const semanticInput = path.join(editionRoot, 'claim-model.json');
    selected.unshift({
      input: semanticInput,
      path: 'semantic.json',
      bytes: modelBytes.length,
      sha256: sha(modelBytes),
    });
    const sourcePlan = {
      schema: 'architecture.pack-input/v1',
      source: {
        id: handoff.aigw.source.repository,
        revision: handoff.aigw.source.semanticRevision,
      },
      files: selected,
      output: path.join(temporary, 'source-bundle'),
    };
    const sourcePlanBytes = Buffer.from(`${JSON.stringify(sourcePlan, null, 2)}\n`);
    const sourcePlanPath = path.join(temporary, 'source-pack.json');
    await fs.writeFile(sourcePlanPath, sourcePlanBytes);
    const runtimeEnv = { HOME: home, PATH: home, LANG: 'C.UTF-8' };
    const sourceResult = JSON.parse(
      run(
        process.execPath,
        [cli, 'source', 'pack', sourcePlanPath, '--sha256', sha(sourcePlanBytes)],
        { cwd: consumer, env: runtimeEnv },
      ),
    );
    assert.equal(sourceResult.manifestSha256, handoff.aigw.candidate.sourceManifestSha256);

    const output = path.join(temporary, 'candidate');
    const buildPlan = {
      sourceManifest: sourceResult.manifestPath,
      sourceSha256: sourceResult.manifestSha256,
      semanticMember: 'semantic.json',
      edition: editionPath,
      editionSha256: sha(editionBytes),
      output,
    };
    const buildPlanBytes = Buffer.from(`${JSON.stringify(buildPlan, null, 2)}\n`);
    const buildPlanPath = path.join(temporary, 'edition-build.json');
    await fs.writeFile(buildPlanPath, buildPlanBytes);
    const result = JSON.parse(
      run(
        process.execPath,
        [cli, 'edition', 'build', buildPlanPath, '--sha256', sha(buildPlanBytes)],
        { cwd: consumer, env: runtimeEnv },
      ),
    );
    assert.deepEqual(
      {
        manifestSha256: result.manifestSha256,
        candidateSha256: result.candidateSha256,
        semanticDigest: result.semanticDigest,
        editionDigest: result.editionDigest,
        staticSceneDigest: result.staticSceneDigest,
        interactiveSceneDigest: result.interactiveSceneDigest,
      },
      {
        manifestSha256: handoff.aigw.candidate.manifestSha256,
        candidateSha256: handoff.aigw.candidate.candidateSha256,
        semanticDigest: handoff.aigw.candidate.semanticDigest,
        editionDigest: handoff.aigw.candidate.editionDigest,
        staticSceneDigest: handoff.aigw.candidate.staticSceneDigest,
        interactiveSceneDigest: handoff.aigw.candidate.interactiveSceneDigest,
      },
    );
    assert.equal(
      sha(await fs.readFile(path.join(output, 'overview.png'))),
      handoff.aigw.candidate.pngSha256,
    );
    assert.equal(
      sha(await fs.readFile(path.join(output, 'overview.svg'))),
      handoff.aigw.candidate.svgSha256,
    );
    assert.equal(
      sha(await fs.readFile(path.join(output, 'views/overview.html'))),
      handoff.aigw.candidate.overviewHtmlSha256,
    );
    const bundle = await readSourceBundle(
      path.join(output, 'manifest.json'),
      result.manifestSha256,
    );
    for (const member of bundle.members) {
      assert.equal(member.content.includes(Buffer.from(aigwEditionRoot)), false, member.path);
      assert.equal(member.content.includes(Buffer.from(aigwSourceRoot)), false, member.path);
      assert.equal(member.content.includes(Buffer.from(root)), false, member.path);
    }
  },
);
