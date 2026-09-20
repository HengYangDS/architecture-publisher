import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readSourceBundle } from '../src/source/bundle.mjs';
import { compareEditionInput } from '../src/edition/input.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function selected(state, base = root) {
  const directory = path.join(base, 'examples/aigw'),
    manifest = path.join(directory, state, 'manifest.json'),
    edition = path.join(directory, state + '-edition.json');
  return {
    sourceManifest: manifest,
    sourceSha256: sha(await fs.readFile(manifest)),
    semanticMember: 'semantic.json',
    edition,
    editionSha256: sha(await fs.readFile(edition)),
  };
}

test('AIGW inputs bind a real ordered-registry source evolution', async () => {
  const initial = await selected('initial'),
    evolved = await selected('evolved'),
    initialBundle = await readSourceBundle(
      initial.sourceManifest,
      initial.sourceSha256,
    ),
    evolvedBundle = await readSourceBundle(
      evolved.sourceManifest,
      evolved.sourceSha256,
    );
  assert.equal(
    initialBundle.source.revision,
    '36a6a28336280b71c4dc8d793a75bdb2671bb73c',
  );
  assert.equal(
    evolvedBundle.source.revision,
    '069c2a655a5a1b9124d656e64b2d323ff53baf11',
  );
  assert(
    evolvedBundle.members.some(
      (item) => item.path === 'source/internal/client/registry.go',
    ),
  );
  assert.match(
    evolvedBundle.members
      .find((item) => item.path === 'source/internal/client/registry.go')
      .content.toString(),
    /sole ordered operational registry/,
  );
  const plan = path.join(root, 'examples/aigw/evolution.json'),
    delta = await compareEditionInput(plan, sha(await fs.readFile(plan)));
  assert.deepEqual(delta.delta.added.entities, ['adapter-contract', 'registry']);
  assert.deepEqual(delta.delta.added.relations, [
    'contract-claude',
    'contract-codex',
    'registry-contract',
    'synchronizer-registry',
  ]);
  assert.deepEqual(delta.delta.removed.relations, [
    'synchronizer-claude',
    'synchronizer-codex',
  ]);
  assert.deepEqual(delta.editions.changed, ['aigw-client-projection']);
  assert.equal(delta.editions.affected[0].scope, 'complete');
  assert(delta.obligations.rebuild.length > 0);
  assert.equal(delta.obligations.semanticVerification.length, 1);
  assert(delta.obligations.mediumVerification.length > 0);
  assert.equal(delta.obligations.acceptance.length, 1);
  assert.deepEqual(
    delta.obligations.publication.map(({ action, scene }) => [action, scene]),
    [
      ['replace', null],
      ['withdraw', 'projection'],
    ],
  );
});

test('packed CLI replays both AIGW structures in a relocated offline home', async (t) => {
  const parent = path.join(root, 'build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, 'aigw-adopter-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const run = (command, args, cwd, env = process.env) => {
    const result = spawnSync(command, args, {
      cwd,
      env,
      encoding: 'utf8',
      timeout: 90000,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return result.stdout;
  };
  const packed = JSON.parse(
    run(
      'npm',
      ['pack', '--ignore-scripts', '--json', '--pack-destination', directory],
      root,
    ),
  )[0];
  const consumer = path.join(directory, 'consumer'),
    home = path.join(directory, 'empty-home');
  await fs.mkdir(consumer);
  await fs.mkdir(home);
  run(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(directory, packed.filename),
    ],
    consumer,
  );
  const pkg = path.join(consumer, 'node_modules/architecture-publisher'),
    cli = path.join(pkg, 'src/cli/main.mjs'),
    observed = {};
  await assert.rejects(fs.access(path.join(consumer, '.git')), {
    code: 'ENOENT',
  });
  for (const state of ['initial', 'evolved']) {
    const selection = await selected(state, pkg),
      plan = {
        ...selection,
        sourceManifest: path.relative(directory, selection.sourceManifest),
        edition: path.relative(directory, selection.edition),
        output: state,
      },
      planBytes = Buffer.from(JSON.stringify(plan, null, 2) + '\n'),
      planPath = path.join(directory, state + '-plan.json');
    await fs.writeFile(planPath, planBytes);
    const response = JSON.parse(
      run(
        process.execPath,
        [cli, 'publish', 'semantic', planPath, '--sha256', sha(planBytes)],
        directory,
        { HOME: home, PATH: home, LANG: 'C.UTF-8' },
      ),
    );
    const output = await readSourceBundle(
      path.join(directory, state, 'manifest.json'),
      response.manifestSha256,
    );
    observed[state] = new Map(
      output.members.map((item) => [item.path, item.content]),
    );
    const receipt = JSON.parse(observed[state].get('publication.json'));
    assert.deepEqual(
      JSON.parse(observed[state].get('edition.json')),
      JSON.parse(await fs.readFile(selection.edition, 'utf8')),
    );
    assert.equal(receipt.editionSha256, selection.editionSha256);
    assert.equal(response.editionDigest, receipt.editionDigest);
    assert.equal(response.staticSceneDigest, receipt.staticSceneDigest);
    assert.equal(
      response.interactiveSceneDigest,
      receipt.interactiveSceneDigest,
    );
    const acceptance = JSON.parse(await fs.readFile(
      path.join(root, 'examples/aigw/browser-acceptance.json'), 'utf8'));
    const selectedAcceptance = acceptance.runs.find((run) => run.id === state);
    assert.equal(selectedAcceptance.publicationManifestSha256, output.manifestSha256);
    assert.equal(selectedAcceptance.semanticDigest, response.semanticDigest);
    assert.equal(selectedAcceptance.editionSha256, receipt.editionSha256);
    assert.equal(selectedAcceptance.editionDigest, response.editionDigest);
    assert.equal(selectedAcceptance.staticSceneDigest, response.staticSceneDigest);
    assert.equal(
      selectedAcceptance.interactiveSceneDigest,
      response.interactiveSceneDigest,
    );
    assert.equal(selectedAcceptance.staticSvgSha256, sha(observed[state].get('overview.svg')));
    assert.equal(selectedAcceptance.staticPngSha256, sha(observed[state].get('overview.png')));
    assert.equal(acceptance.verifier.observerSha256,
      sha(await fs.readFile(path.join(root, 'tools/qualification/semantic-browser.mjs'))));
    assert.equal(acceptance.verifier.checksSha256,
      sha(await fs.readFile(path.join(root, 'tools/qualification/semantic-browser-checks.mjs'))));
    assert.equal(response.semanticAcceptance, 'source-bound-structure');
    assert.equal(response.browserAcceptance, 'not-performed');
    assert(!observed[state].get('views/overview.html').toString().includes(root));
    assert(
      observed[state]
        .get('overview.png')
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    );
    assert.equal(observed[state].get('overview.png').readUInt32BE(16), 2400);
    for (const page of [...output.members]
      .filter((item) => item.path.startsWith('views/'))
      .map((item) => item.content.toString())) {
      assert.doesNotMatch(page, /data-preset-badge-/);
      assert.doesNotMatch(page, /content:\s*attr\(data-preset-badge-/);
    }
  }
  for (const output of [
    observed.evolved.get('views/overview.html').toString(),
    observed.evolved.get('overview.svg').toString(),
    observed.evolved.get('views/registry.html').toString(),
  ]) {
    assert.match(output, /data-node-id="registry"/);
    assert.match(output, /data-node-id="adapter-contract"/);
    assert.match(output, /data-edge-id="registry-contract"/);
  }
  assert.doesNotMatch(
    observed.initial.get('views/overview.html').toString(),
    /data-node-id="registry"/,
  );
  assert.doesNotMatch(
    observed.initial.get('overview.svg').toString(),
    /data-node-id="registry"/,
  );
});
