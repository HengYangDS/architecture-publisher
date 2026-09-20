import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readSourceBundle } from '../src/source/bundle.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    timeout: 90000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout;
}

test('the installed product publishes its own architecture through the public contract', async (t) => {
  const parent = path.join(root, 'build/test-work');
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, 'self-hosted-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const packed = JSON.parse(
      run(
        'npm',
        ['pack', '--ignore-scripts', '--json', '--pack-destination', directory],
        root,
      ),
    )[0],
    consumer = path.join(directory, 'consumer'),
    home = path.join(directory, 'home');
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
    physicalParent = path.join(directory, 'physical-inputs'),
    aliasedParent = path.join(directory, 'aliased-inputs');
  await fs.mkdir(physicalParent);
  await fs.symlink(physicalParent, aliasedParent, 'dir');
  const inputs = path.join(aliasedParent, 'inputs'),
    publication = path.join(directory, 'publication'),
    selected = JSON.parse(
      run(
        process.execPath,
        [path.join(pkg, 'examples/self-host/build.mjs'), inputs],
        directory,
        { HOME: home, PATH: home, LANG: 'C.UTF-8' },
      ),
    ),
    plan = JSON.parse(await fs.readFile(selected.plan, 'utf8'));
  assert.equal(path.dirname(selected.plan), path.join(physicalParent, 'inputs'));
  assert.equal(path.dirname(selected.sourceManifest), path.join(physicalParent, 'inputs', 'source'));
  plan.output = publication;
  const planBytes = Buffer.from(JSON.stringify(plan, null, 2) + '\n'),
    planPath = path.join(directory, 'plan.json');
  await fs.writeFile(planPath, planBytes);
  const response = JSON.parse(
      run(
        process.execPath,
        [
          path.join(pkg, 'src/cli/main.mjs'),
          'publish',
          'semantic',
          planPath,
          '--sha256',
          sha(planBytes),
        ],
        directory,
        { HOME: home, PATH: home, LANG: 'C.UTF-8' },
      ),
    ),
    output = await readSourceBundle(
      path.join(publication, 'manifest.json'),
      response.manifestSha256,
    ),
    members = new Map(output.members.map((item) => [item.path, item.content])),
    receipt = JSON.parse(members.get('publication.json')),
    semantic = JSON.parse(members.get('semantic.json')),
    edition = JSON.parse(members.get('edition.json')),
    svg = members.get('overview.svg').toString(),
    html = members.get('views/overview.html').toString();
  assert.equal(output.source.id, 'architecture-publisher');
  assert.equal(semantic.context.adoptionRole, 'self-hosted');
  assert.equal(semantic.context.independentAdopterEvidence, false);
  assert.equal(receipt.semanticDigest, selected.semanticDigest);
  assert.equal(plan.edition, selected.edition);
  assert.equal(plan.editionSha256, sha(await fs.readFile(selected.edition)));
  assert.deepEqual(
    edition,
    JSON.parse(await fs.readFile(selected.edition, 'utf8')),
  );
  assert.equal(receipt.editionSha256, plan.editionSha256);
  assert.equal(receipt.editionDigest, response.editionDigest);
  assert.equal(receipt.staticSceneDigest, response.staticSceneDigest);
  assert.equal(
    receipt.interactiveSceneDigest,
    response.interactiveSceneDigest,
  );
  const acceptance = JSON.parse(await fs.readFile(
    path.join(root, 'examples/self-host/browser-acceptance.json'), 'utf8'));
  assert.equal(acceptance.adoptionRole, 'self-hosted');
  assert.equal(acceptance.independentAdopterEvidence, false);
  assert.equal(acceptance.semanticDigest, selected.semanticDigest);
  assert.equal(acceptance.editionSha256, receipt.editionSha256);
  assert.equal(acceptance.editionDigest, response.editionDigest);
  assert.equal(acceptance.staticSceneDigest, response.staticSceneDigest);
  assert.equal(
    acceptance.interactiveSceneDigest,
    response.interactiveSceneDigest,
  );
  assert.equal(acceptance.publicationManifestSha256, output.manifestSha256);
  assert.equal(acceptance.staticSvgSha256, sha(members.get('overview.svg')));
  assert.equal(acceptance.staticPngSha256, sha(members.get('overview.png')));
  assert.equal(acceptance.verifier.observerSha256,
    sha(await fs.readFile(path.join(root, 'tools/qualification/semantic-browser.mjs'))));
  assert.equal(acceptance.verifier.checksSha256,
    sha(await fs.readFile(path.join(root, 'tools/qualification/semantic-browser-checks.mjs'))));
  assert.deepEqual(acceptance.views,
    [...receipt.views.map((view) => view.id), 'overview-static']);

  for (const id of [
    'public-cli',
    'source-bundle',
    'semantic-contract',
    'publication-coordinator',
    'static-compositor',
    'interactive-renderer',
    'raster-boundary',
    'publication-writer',
  ]) {
    assert.match(svg, new RegExp(`data-node-id="${id}"`));
    assert.match(html, new RegExp(`data-node-id="${id}"`));
  }
  assert(members.get('overview.png').subarray(0, 8).equals(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  ));
  await assert.rejects(fs.access(path.join(consumer, '.git')), { code: 'ENOENT' });
});
