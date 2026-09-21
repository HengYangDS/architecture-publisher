import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('qualified publication accepts a replacement selector structurally without bypassing review', async () => {
  const { planEthosPublication } =
    await import('../migration/ethos/src/edition/publication.mjs');
  await assert.rejects(
    planEthosPublication({
      review: {},
      staticArtifact: {},
      browser: { reports: [], checker: {} },
      deployment: { destinations: {}, recoveryRoot: '/unused' },
      replacement: { plan: {}, authorization: {} },
    }),
    (error) => error.code === 'review_fields_invalid',
  );
});

test('static-artifact reader exists independently of rendering and never accepts an unbound source', async () => {
  const module = new URL(
    '../migration/ethos/src/edition/static-artifact.mjs',
    import.meta.url,
  );
  await assert.doesNotReject(
    fs.access(module),
    'publication must consume frozen static artifacts directly',
  );
  const { readStaticArtifact } = await import(module);
  await assert.rejects(
    readStaticArtifact(
      { manifestPath: '/missing/manifest.json', sha256: '0'.repeat(64) },
      {},
    ),
  );
});

test(
  'qualified pair plan refuses actual artifacts without current browser evidence before target writes',
  { skip: !process.env.ETHOS_PAIR_PLAN },
  async (t) => {
    const module = new URL(
      '../migration/ethos/src/edition/publication.mjs',
      import.meta.url,
    );
    await assert.doesNotReject(
      fs.access(module),
      'qualified publication must compose existing consumers',
    );
    const { planEthosPublication } = await import(module),
      plan = JSON.parse(await fs.readFile(process.env.ETHOS_PAIR_PLAN));
    plan.browser.reports = [];
    const work = fileURLToPath(new URL('../build/test-work/', import.meta.url));
    await fs.mkdir(work, { recursive: true });
    const temporary = await fs.mkdtemp(path.join(work, 'pair-negative '));
    t.after(() => fs.rm(temporary, { recursive: true, force: true }));
    plan.deployment.destinations = {
      static: path.join(temporary, 'static'),
      atlas: path.join(temporary, 'atlas'),
    };
    plan.deployment.recoveryRoot = path.join(temporary, 'recovery');
    const before = await fs.readdir(temporary);
    await assert.rejects(
      planEthosPublication(plan),
      /Browser viewport coverage incomplete/,
    );
    assert.deepEqual(await fs.readdir(temporary), before);
  },
);

test(
  'frozen static payload rejects coordinated evidence drift',
  { skip: !process.env.ETHOS_PAIR_PLAN },
  async (t) => {
    const { readStaticArtifact } =
        await import('../migration/ethos/src/edition/static-artifact.mjs'),
      { readEthosReview } = await import('../migration/ethos/src/edition/review.mjs'),
      { readSourceBundle } = await import('../packages/publisher/src/source/bundle.mjs'),
      { writeSourceBundle } = await import('../packages/publisher/src/source/write.mjs');
    const plan = JSON.parse(await fs.readFile(process.env.ETHOS_PAIR_PLAN)),
      review = await readEthosReview(plan.review),
      original = await readSourceBundle(
        plan.staticArtifact.manifestPath,
        plan.staticArtifact.sha256,
      );
    assert.equal(
      (await readStaticArtifact(plan.staticArtifact, plan.review.atlas, review))
        .members.length,
      18,
    );
    const work = fileURLToPath(new URL('../build/test-work/', import.meta.url));
    await fs.mkdir(work, { recursive: true });
    const tmp = await fs.mkdtemp(path.join(work, 'static-reject '));
    t.after(() => fs.rm(tmp, { recursive: true, force: true }));
    for (const [name, edit] of [
      ['missing artifact', (m) => m.delete('native/terminal-6000.png')],
      [
        'changed source',
        (m) => {
          const j = JSON.parse(m.get('native/source-projection.json'));
          j.source.git.commit = '0'.repeat(40);
          m.set(
            'native/source-projection.json',
            Buffer.from(JSON.stringify(j)),
          );
        },
      ],
      [
        'changed quality',
        (m) => m.set('native/quality-contract.json', Buffer.from('{}')),
      ],
      [
        'changed author',
        (m) => m.set('provenance/author.ts', Buffer.from('unrelated')),
      ],
      [
        'low recorded font',
        (m) => {
          const j = JSON.parse(m.get('native/geometry-report.json'));
          j.minimumEffectiveFont = 1;
          m.set('native/geometry-report.json', Buffer.from(JSON.stringify(j)));
        },
      ],
      [
        'raster findings',
        (m) => {
          const j = JSON.parse(m.get('raster-report.json'));
          j.failures = ['overlap'];
          m.set('raster-report.json', Buffer.from(JSON.stringify(j)));
        },
      ],
      [
        'reproduced bytes changed',
        (m) => {
          const j = JSON.parse(m.get('cold-reproduction.json'));
          j.files[0].reproducedSha256 = '0'.repeat(64);
          m.set('cold-reproduction.json', Buffer.from(JSON.stringify(j)));
        },
      ],
      [
        'unknown extra artifact',
        (m) => m.set('noise.txt', Buffer.from('noise')),
      ],
    ])
      await t.test(name, async () => {
        const members = new Map(
          original.members.map((m) => [m.path, m.content]),
        );
        edit(members);
        const bundle = await writeSourceBundle(
          path.join(tmp, name),
          original.source,
          [...members].map(([path, content]) => ({ path, content })),
        );
        await assert.rejects(
          readStaticArtifact(
            {
              manifestPath: bundle.manifestPath,
              sha256: bundle.manifestSha256,
            },
            plan.review.atlas,
            review,
          ),
        );
      });
  },
);

test(
  'installed public planner rejects missing browser qualification without writing targets',
  { skip: !process.env.ETHOS_PAIR_PLAN },
  async (t) => {
    const { spawnSync } = await import('node:child_process');
    const root = fileURLToPath(new URL('../', import.meta.url));
    const work = path.join(root, 'build/test-work');
    await fs.mkdir(work, { recursive: true });
    const tmp = await fs.mkdtemp(path.join(work, 'installed-pair '));
    t.after(() => fs.rm(tmp, { recursive: true, force: true }));
    const pack = spawnSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', tmp],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(pack.status, 0, pack.stderr);
    const packed = JSON.parse(pack.stdout)[0],
      consumer = path.join(tmp, 'consumer');
    await fs.mkdir(consumer);
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
        path.join(tmp, packed.filename),
      ],
      { cwd: consumer, encoding: 'utf8' },
    );
    assert.equal(install.status, 0, install.stderr);
    const plan = JSON.parse(await fs.readFile(process.env.ETHOS_PAIR_PLAN));
    plan.browser.reports = [];
    plan.deployment.destinations = {
      static: path.join(tmp, 'static'),
      atlas: path.join(tmp, 'interactive'),
    };
    plan.deployment.recoveryRoot = path.join(tmp, 'recovery');
    const file = path.join(tmp, 'pair.json');
    await fs.writeFile(file, JSON.stringify(plan));
    const home = path.join(tmp, 'home');
    await fs.mkdir(home);
    const command = path.join(
      consumer,
      'node_modules/architecture-publisher/src/cli/main.mjs',
    );
    const result = spawnSync(
      process.execPath,
      [command, 'publish', 'ethos', 'plan', file],
      {
        cwd: consumer,
        env: { HOME: home, PATH: home, LANG: 'C.UTF-8' },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 1, result.stdout + result.stderr);
    const error = JSON.parse(result.stdout);
    assert.equal(error.error.code, 'publication_browser_unqualified');
    for (const target of [
      ...Object.values(plan.deployment.destinations),
      plan.deployment.recoveryRoot,
    ])
      await assert.rejects(fs.stat(target), { code: 'ENOENT' });
  },
);

test('publication effects reject absent acceptance before touching a file target', async () => {
  const { publishEthosPublication, recoverEthosPublication } =
      await import('../migration/ethos/src/edition/publication.mjs'),
    { sha256 } = await import('../migration/ethos/src/adapter/projection.mjs');
  const body = {
    schema: 'architecture.ethos-pair-publication/v1',
    filePlan: {},
    qualification: { browser: {} },
  };
  const plan = {
    ...body,
    sha256: sha256(JSON.stringify(body, null, 2) + '\n'),
  };
  await assert.rejects(
    publishEthosPublication(plan, {}),
    /Exact owner publication acceptance required/,
  );
  await assert.rejects(
    recoverEthosPublication(plan, {}),
    /Exact owner publication acceptance required/,
  );
  const authority = {
    decision: 'ACCEPTED',
    planSha256: plan.sha256,
    authority: {
      kind: 'human_product_owner',
      source: 'explicit_user_instruction',
      statement: 'fixture, not an actual user approval',
    },
  };
  await assert.rejects(
    publishEthosPublication(plan, authority),
    /Exact observed browser execution reference required/,
  );
});
