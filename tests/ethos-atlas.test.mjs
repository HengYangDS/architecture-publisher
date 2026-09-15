import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readSourceBundle } from '../src/source/bundle.mjs';
import { writeSourceBundle } from '../src/source/write.mjs';
import { sha256 } from '../src/integrations/ethos/projection.mjs';
import { readEthosSource } from '../src/integrations/ethos/projection.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceSha256 =
  '58121ad168a314af94b55f557435ffb7d9828ca7c476411f18467731ae9d1db0';
const projectionDigest =
  '4ea40f421434106948f1e1d2d9ae5ee6c8b9868edc5538ff755876fd01d37ef8';
const editionSha256 =
  'bcfc207b0f7dc3c56d2bbb8d9a4c7fa43985c43c155e485955c2681bd792a279';
test('every page uses only the source-owned maturity notice as its subtitle', async () => {
  const source = await readEthosSource(
    path.join(root, 'tests/fixtures/ethos-source/manifest.json'),
    sourceSha256,
    projectionDigest,
  );
  const edition = JSON.parse(
    await fs.readFile(path.join(root, 'editions/ethos/authoring/edition.json')),
  );
  for (const page of edition.pages) {
    const spec = JSON.parse(
      await fs.readFile(path.join(root, 'editions/ethos/authoring', page.spec)),
    );
    assert.equal(
      spec.meta.subtitle,
      source.projection.documents.copy.maturity_notice,
      page.id,
    );
  }
});
async function setup(t, edit) {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'atlas space-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  let editionManifest = path.join(
      root,
      'editions/ethos/authoring/manifest.json',
    ),
    selected = editionSha256;
  if (edit) {
    const bundle = await readSourceBundle(editionManifest, editionSha256);
    const members = new Map(bundle.members.map((m) => [m.path, m.content]));
    const update = (name, fn) => {
      const value = JSON.parse(members.get(name));
      fn(value);
      members.set(name, Buffer.from(JSON.stringify(value)));
    };
    await edit({ members, update });
    update('edition.json', (e) => {
      for (const p of e.pages)
        for (const [file, hash] of [
          ['spec', 'specSha256'],
          ['bindings', 'bindingsSha256'],
        ])
          if (members.has(p[file])) p[hash] = sha256(members.get(p[file]));
    });
    const written = await writeSourceBundle(
      path.join(directory, 'edition'),
      bundle.source,
      [...members].map(([path, content]) => ({ path, content })),
    );
    editionManifest = written.manifestPath;
    selected = written.manifestSha256;
  }
  return {
    directory,
    plan: {
      sourceManifest: path.join(
        root,
        'tests/fixtures/ethos-source/manifest.json',
      ),
      sourceSha256,
      projectionDigest,
      editionManifest,
      editionSha256: selected,
      output: path.join(directory, 'atlas'),
    },
  };
}
async function api() {
  const module = new URL('../editions/ethos/atlas.mjs', import.meta.url);
  await assert.doesNotReject(
    fs.access(module),
    'formal ETHOS atlas entry must exist',
  );
  return (await import(module)).renderEthosAtlas;
}
test('formal edition reproduces all 13 accepted pages without the original checkout', async (t) => {
  const f = await setup(t),
    render = await api();
  const result = await render(f.plan);
  assert.equal(result.status, 'rendered');
  assert.equal(result.pages.length, 13);
  assert.equal(result.browserAcceptance, 'not-performed');
  assert.equal(result.semanticAcceptance, 'not-performed');
  const manifest = JSON.parse(
    await fs.readFile(path.join(f.plan.output, 'manifest.json')),
  );
  const edition = JSON.parse(
    await fs.readFile(path.join(root, 'editions/ethos/authoring/edition.json')),
  );
  for (const p of edition.pages) {
    const bytes = await fs.readFile(path.join(f.plan.output, p.path));
    assert.equal(sha256(bytes), p.acceptedHtmlSha256, p.id);
    assert.equal(
      manifest.files.find((x) => x.path === p.path).sha256,
      p.acceptedHtmlSha256,
    );
  }
  assert.match(
    await fs.readFile(path.join(f.plan.output, 'ARCHIFY-LICENSE.txt'), 'utf8'),
    /MIT License/,
  );
});
test('atlas preserves occupied output', async (t) => {
  const f = await setup(t),
    render = await api();
  await fs.mkdir(f.plan.output);
  await fs.writeFile(path.join(f.plan.output, 'keep'), 'original');
  await assert.rejects(render(f.plan), { code: 'atlas_output_exists' });
  assert.equal(
    await fs.readFile(path.join(f.plan.output, 'keep'), 'utf8'),
    'original',
  );
});
for (const [name, edit] of [
  [
    'missing page',
    ({ members }) => members.delete('pages/intent/diagram.json'),
  ],
  [
    'extra member',
    ({ members }) => members.set('noise.txt', Buffer.from('noise')),
  ],
  [
    'catalog drift',
    ({ update }) =>
      update('catalog.json', (c) => (c.pages[1].label = 'Different')),
  ],
  [
    'duplicate page',
    ({ update }) => update('edition.json', (e) => e.pages.push(e.pages[0])),
  ],
  [
    'escaping page',
    ({ update }) =>
      update('edition.json', (e) => (e.pages[1].path = '../escape.html')),
  ],
  [
    'source revision drift',
    ({ update }) =>
      update('edition.json', (e) => (e.source.commit = '0'.repeat(40))),
  ],
  [
    'unknown field',
    ({ update }) =>
      update('edition.json', (e) => (e.plugin = '/arbitrary/code.mjs')),
  ],
  [
    'missing detail section',
    ({ update }) =>
      update(
        'edition.json',
        (e) =>
          (e.pages.find((p) => p.id === 'verification').verificationDetails =
            false),
      ),
  ],
  [
    'missing lane boundary',
    ({ update }) =>
      update(
        'edition.json',
        (e) => (e.pages.find((p) => p.id === 'lanes').writeBoundary = false),
      ),
  ],
  [
    'missing local judgments',
    ({ update }) =>
      update('edition.json', (e) => (e.pages[0].resourceComparison = false)),
  ],
  [
    'font selection substitution',
    ({ update }) =>
      update('original-font-selection.json', (f) => (f.family = 'System Font')),
  ],
  [
    'unknown semantic node',
    ({ update }) =>
      update(
        'pages/intent/bindings.json',
        (b) => (b.nodes[Object.keys(b.nodes)[0]] = ['absent']),
      ),
  ],
  [
    'unknown source relation',
    ({ update }) =>
      update(
        'pages/intent/bindings.json',
        (b) =>
          (b.relations[Object.keys(b.relations)[0]].sourceRelations = [
            'absent',
          ]),
      ),
  ],
  [
    'unbound connection',
    ({ update }) =>
      update(
        'pages/intent/bindings.json',
        (b) => delete b.connections[Object.keys(b.connections)[0]],
      ),
  ],
  [
    'unknown assertion',
    ({ update }) =>
      update(
        'pages/intent/bindings.json',
        (b) => (b.connections[Object.keys(b.connections)[0]] = ['absent']),
      ),
  ],
  [
    'unknown presentation mode',
    ({ update }) =>
      update(
        'pages/intent/bindings.json',
        (b) => (b.presentation = { plugin: 'arbitrary' }),
      ),
  ],
  [
    'incomplete write boundary',
    ({ update }) =>
      update('pages/lanes/bindings.json', (b) =>
        b.writeBoundaryRequired.appliesTo.pop(),
      ),
  ],
])
  test(`atlas rejects ${name} before creating output`, async (t) => {
    const f = await setup(t, edit),
      render = await api();
    await assert.rejects(render(f.plan));
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  });
test('a later HTML mismatch retains partial output without completion manifest', async (t) => {
  const f = await setup(t, ({ update }) =>
    update(
      'edition.json',
      (e) => (e.pages[1].acceptedHtmlSha256 = '0'.repeat(64)),
    ),
  );
  const render = await api();
  await assert.rejects(render(f.plan), {
    code: 'atlas_expected_html_mismatch',
  });
  await fs.access(path.join(f.plan.output, 'index.html'));
  await assert.rejects(fs.stat(path.join(f.plan.output, 'manifest.json')), {
    code: 'ENOENT',
  });
});
test('a previously rendered page changed during the build prevents final manifest', async (t) => {
  const { Worker } = await import('node:worker_threads');
  const f = await setup(t),
    render = await api();
  const worker = new Worker(
    `
    const {parentPort,workerData}=require('node:worker_threads');
    const fs=require('node:fs'),path=require('node:path');
    const until=Date.now()+30000;
    const timer=setInterval(()=>{
      const later=path.join(workerData,'mechanisms/intent');
      if(fs.existsSync(later)&&fs.readdirSync(later).some(n=>n.startsWith('.architecture-render-'))){
        fs.writeFileSync(path.join(workerData,'index.html'),'changed during build');
        clearInterval(timer);parentPort.postMessage('changed');
      }else if(Date.now()>until){clearInterval(timer);parentPort.postMessage('timeout');}
    },1);parentPort.postMessage('ready');
  `,
    { eval: true, workerData: f.plan.output },
  );
  t.after(() => worker.terminate());
  await new Promise((resolve, reject) => {
    worker.once('message', resolve);
    worker.once('error', reject);
  });
  await assert.rejects(render(f.plan), { code: 'atlas_output_changed' });
  assert.equal(
    await fs.readFile(path.join(f.plan.output, 'index.html'), 'utf8'),
    'changed during build',
  );
  await assert.rejects(fs.stat(path.join(f.plan.output, 'manifest.json')), {
    code: 'ENOENT',
  });
});
test('CLI resolves atlas plan inputs relative to the plan, not cwd', async (t) => {
  const f = await setup(t);
  const plan = { ...f.plan };
  for (const key of ['sourceManifest', 'editionManifest', 'output'])
    plan[key] = path.relative(f.directory, plan[key]);
  const file = path.join(f.directory, 'plan.json');
  await fs.writeFile(file, JSON.stringify(plan));
  const run = spawnSync(
    process.execPath,
    [path.join(root, 'src/cli/main.mjs'), 'atlas', 'ethos', file],
    {
      cwd: f.directory,
      encoding: 'utf8',
      timeout: 60000,
      env: { HOME: f.directory, PATH: f.directory },
    },
  );
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(JSON.parse(run.stdout).pages.length, 13);
});

test('installed atlas uses only its package and explicitly supplied source', async (t) => {
  const f = await setup(t),
    consumer = path.join(f.directory, 'consumer'),
    home = path.join(f.directory, 'empty home');
  await fs.mkdir(consumer);
  await fs.mkdir(home);
  const pack = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', f.directory],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(pack.status, 0, pack.stderr);
  const info = JSON.parse(pack.stdout)[0];
  assert(
    info.files.some((x) => x.path === 'editions/ethos/atlas.mjs'),
    'installed archive includes edition implementation',
  );
  assert(
    info.files.every(
      (x) =>
        !x.path.startsWith('tests/') &&
        !x.path.startsWith('build/') &&
        !x.path.startsWith('.ethos/'),
    ),
  );
  const install = spawnSync(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(f.directory, info.filename),
    ],
    { cwd: consumer, encoding: 'utf8' },
  );
  assert.equal(install.status, 0, install.stderr);
  const pkg = path.join(consumer, 'node_modules/architecture-publishing');
  await fs.cp(
    path.dirname(f.plan.sourceManifest),
    path.join(f.directory, 'input'),
    { recursive: true, errorOnExist: true },
  );
  const plan = {
    ...f.plan,
    sourceManifest: 'input/manifest.json',
    editionManifest: path.relative(
      f.directory,
      path.join(pkg, 'editions/ethos/authoring/manifest.json'),
    ),
    output: 'installed atlas',
  };
  const file = path.join(f.directory, 'installed-plan.json');
  await fs.writeFile(file, JSON.stringify(plan));
  const run = spawnSync(
    process.execPath,
    [path.join(pkg, 'src/cli/main.mjs'), 'atlas', 'ethos', file],
    {
      cwd: home,
      encoding: 'utf8',
      timeout: 60000,
      env: { HOME: home, PATH: home },
    },
  );
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.pages.length, 13);
  assert.equal(result.browserAcceptance, 'not-performed');
  const edition = JSON.parse(
    await fs.readFile(path.join(pkg, 'editions/ethos/authoring/edition.json')),
  );
  for (const page of edition.pages)
    assert.equal(
      sha256(
        await fs.readFile(path.join(f.directory, 'installed atlas', page.path)),
      ),
      page.acceptedHtmlSha256,
    );
});
