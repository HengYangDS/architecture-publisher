import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { sha256 } from '../adapters/ethos/projection.mjs';

const module = new URL('../editions/ethos/review.mjs', import.meta.url);
async function api() {
  await assert.doesNotReject(
    fs.access(module),
    'explicit bounded review continuity consumer must exist',
  );
  return import(module);
}
function specimen() {
  const notice = 'Target architecture, not a claim of current implementation.';
  const oldSpec = {
    meta: { title: 'Runtime', subtitle: notice + ' Extra runtime detail.' },
    components: [{ id: 'admit', label: 'Local admission' }],
    connections: [],
  };
  const spec = structuredClone(oldSpec);
  spec.meta.subtitle = notice;
  const oldHtml = Buffer.from(
    `<h2>${oldSpec.meta.subtitle}</h2><svg><desc>${oldSpec.meta.subtitle}</desc><text>Local admission</text></svg>`,
  );
  const html = Buffer.from(
    `<h2>${notice}</h2><svg><desc>${notice}</desc><text>Local admission</text></svg>`,
  );
  const bindings = Buffer.from('{"nodes":{"admit":["admission"]}}');
  const authorization = {
    pageId: 'runtime',
    beforeHtmlSha256: sha256(oldHtml),
    afterHtmlSha256: sha256(html),
    basis: [
      {
        path: 'correction/design.md',
        sha256: sha256('remove surplus subtitle only'),
      },
    ],
  };
  return {
    id: 'runtime',
    notice,
    oldSpec,
    spec,
    oldHtml,
    html,
    oldBindings: bindings,
    bindings,
    authorization,
  };
}
test('exact subtitle continuity retains graph meaning and does not mint approval', async () => {
  const { compareReviewedPage } = await api(),
    f = specimen();
  const result = compareReviewedPage(f);
  assert.equal(result.kind, 'source-maturity-subtitle');
  assert.equal(result.replacements, 2);
  const unchanged = {
    ...f,
    oldSpec: f.spec,
    oldHtml: f.html,
    authorization: undefined,
  };
  assert.equal(compareReviewedPage(unchanged).kind, 'byte-identical');
});
for (const [name, edit] of [
  [
    'changed node',
    (f) => {
      f.spec.components[0].label = 'Global permission';
    },
  ],
  [
    'changed bindings',
    (f) => {
      f.bindings = Buffer.from('{}');
    },
  ],
  [
    'extra HTML change',
    (f) => {
      f.html = Buffer.from(f.html.toString() + '<!-- extra -->');
      f.authorization.afterHtmlSha256 = sha256(f.html);
    },
  ],
  [
    'no explicit editorial selection',
    (f) => {
      delete f.authorization;
    },
  ],
  [
    'wrong page',
    (f) => {
      f.authorization.pageId = 'different';
    },
  ],
  [
    'wrong original hash',
    (f) => {
      f.authorization.beforeHtmlSha256 = '0'.repeat(64);
    },
  ],
  [
    'arbitrary subtitle rewrite',
    (f) => {
      f.spec.meta.subtitle = 'new marketing line';
    },
  ],
  [
    'missing occurrence',
    (f) => {
      f.oldHtml = Buffer.from(
        f.oldHtml
          .toString()
          .replace(
            `<desc>${f.oldSpec.meta.subtitle}</desc>`,
            '<desc>other</desc>',
          ),
      );
      f.authorization.beforeHtmlSha256 = sha256(f.oldHtml);
    },
  ],
])
  test(`review continuity refuses ${name}`, async () => {
    const { compareReviewedPage } = await api(),
      f = specimen();
    edit(f);
    assert.throws(() => compareReviewedPage(f));
  });

test('historical verifier remains independently imported rather than copied into tests', async () => {
  const module = new URL(
    '../editions/ethos/review-history.mjs',
    import.meta.url,
  );
  await assert.doesNotReject(
    fs.access(module),
    'frozen historical checks must have a real module owner',
  );
  const { verifyHistoricalReaderReview } = await import(module);
  assert.equal(typeof verifyHistoricalReaderReview, 'function');
  await assert.rejects(
    verifyHistoricalReaderReview(
      { evidence: {} },
      '/history/current',
      { pages: [] },
      {},
      async () => {
        throw Error('missing evidence');
      },
      async () => ({}),
      'selection.json',
    ),
  );
});

test(
  'actual retained history binds current 13 pages and rejects forged review applicability',
  { skip: !process.env.ETHOS_REVIEW_PLAN },
  async (t) => {
    const { readEthosReview } = await api();
    const base = path.dirname(process.env.ETHOS_REVIEW_PLAN);
    const plan = JSON.parse(await fs.readFile(process.env.ETHOS_REVIEW_PLAN));
    const good = await readEthosReview(plan);
    assert.equal(good.pages.length, 13);
    assert.equal(
      good.pages.filter((p) => p.kind === 'byte-identical').length,
      12,
    );
    assert.equal(good.independentReview, 'preserved-not-rerun');
    assert.equal(good.browserAcceptance, 'not-performed');
    const { readSourceBundle } = await import('../src/source/bundle.mjs');
    const { writeSourceBundle } = await import('../src/source/write.mjs');
    const bundle = await readSourceBundle(
      plan.evidenceBundles[0].manifestPath,
      plan.evidenceBundles[0].sha256,
    );
    const directory = await fs.mkdtemp(path.join(base, 'review-negative-'));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    for (const [name, edit] of [
      ['missing review file', (members) => members.delete(plan.history.review)],
      [
        'changed review report',
        (members) =>
          members.set(
            plan.history.review,
            Buffer.from('RECEIVED_READER_CLARITY_REVIEW\nEverything passes.'),
          ),
      ],
      [
        'wrong frozen subject',
        (members) => {
          const j = JSON.parse(members.get(plan.history.reviewApplicability));
          j.subject.source.commit = '0'.repeat(40);
          members.set(
            plan.history.reviewApplicability,
            Buffer.from(JSON.stringify(j)),
          );
        },
      ],
      [
        'incomplete page review',
        (members) => {
          const j = JSON.parse(members.get(plan.history.reviewApplicability));
          j.pages.pop();
          members.set(
            plan.history.reviewApplicability,
            Buffer.from(JSON.stringify(j)),
          );
        },
      ],
      [
        'altered prompt',
        (members) => {
          const p = plan.history.review.replace('.md', '.prompt.txt');
          members.set(p, Buffer.from('unrelated prompt'));
        },
      ],
      [
        'invented browser approval',
        (members) => {
          const j = JSON.parse(members.get(plan.history.reviewApplicability));
          j.browserAcceptance = 'ACCEPTED';
          members.set(
            plan.history.reviewApplicability,
            Buffer.from(JSON.stringify(j)),
          );
        },
      ],
      [
        'missing diagram comparison',
        (members) => {
          const j = JSON.parse(members.get(plan.history.reviewApplicability));
          j.diagramComparisons.pop();
          members.set(
            plan.history.reviewApplicability,
            Buffer.from(JSON.stringify(j)),
          );
        },
      ],
      [
        'explicitly synthetic history',
        (members) => {
          const j = JSON.parse(members.get(plan.history.reviewApplicability));
          j.synthetic = true;
          members.set(
            plan.history.reviewApplicability,
            Buffer.from(JSON.stringify(j)),
          );
        },
      ],
      [
        'erased review limitations',
        (members) => {
          const j = JSON.parse(members.get(plan.history.reviewApplicability));
          delete j.notEstablished;
          members.set(
            plan.history.reviewApplicability,
            Buffer.from(JSON.stringify(j)),
          );
        },
      ],
      [
        'changed editorial basis',
        (members) =>
          members.set(
            plan.editorial[0].basis[0].path,
            Buffer.from('replace everything'),
          ),
      ],
    ])
      await t.test(name, async () => {
        const members = new Map(bundle.members.map((m) => [m.path, m.content]));
        edit(members);
        const destination = path.join(directory, name);
        const b = await writeSourceBundle(
          destination,
          bundle.source,
          [...members].map(([path, content]) => ({ path, content })),
        );
        await assert.rejects(
          readEthosReview({
            ...plan,
            evidenceBundles: [
              { manifestPath: b.manifestPath, sha256: b.manifestSha256 },
              ...plan.evidenceBundles.slice(1),
            ],
          }),
        );
      });
    await t.test('unselected editorial correction', async () => {
      await assert.rejects(readEthosReview({ ...plan, editorial: [] }));
    });
    await t.test('duplicate evidence sources', async () => {
      await assert.rejects(
        readEthosReview({
          ...plan,
          evidenceBundles: [...plan.evidenceBundles, plan.evidenceBundles[0]],
        }),
      );
    });
    await t.test(
      'installed review consumes relocated evidence and preserves original subjects',
      async () => {
        const root = fileURLToPath(new URL('../', import.meta.url));
        const packed = spawnSync(
          'npm',
          [
            'pack',
            '--json',
            '--ignore-scripts',
            '--pack-destination',
            directory,
          ],
          { cwd: root, encoding: 'utf8' },
        );
        assert.equal(packed.status, 0, packed.stderr);
        const archive = JSON.parse(packed.stdout)[0];
        const consumer = path.join(directory, 'consumer');
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
            path.join(directory, archive.filename),
          ],
          { cwd: consumer, encoding: 'utf8' },
        );
        assert.equal(install.status, 0, install.stderr);
        const relocated = structuredClone(plan);
        for (const [i, b] of relocated.evidenceBundles.entries()) {
          const dest = path.join(directory, 'evidence-' + i);
          await fs.cp(path.dirname(b.manifestPath), dest, { recursive: true });
          b.manifestPath = path.relative(
            directory,
            path.join(dest, 'manifest.json'),
          );
        }
        for (const [key, name] of [
          ['sourceManifest', 'source'],
          ['editionManifest', 'edition'],
          ['outputManifest', 'atlas'],
        ]) {
          const dest = path.join(directory, name);
          await fs.cp(path.dirname(plan.atlas[key]), dest, { recursive: true });
          relocated.atlas[key] = name + '/manifest.json';
        }
        const home = path.join(directory, 'empty-home');
        await fs.mkdir(home);
        const file = path.join(directory, 'review-plan.json');
        await fs.writeFile(file, JSON.stringify(relocated));
        const command = path.join(
          consumer,
          'node_modules/architecture-publisher/src/cli/main.mjs',
        );
        const result = spawnSync(
          process.execPath,
          [command, 'atlas', 'ethos', 'review', file],
          {
            cwd: consumer,
            env: { HOME: home, PATH: home, LANG: 'C.UTF-8' },
            encoding: 'utf8',
          },
        );
        assert.equal(result.status, 0, result.stdout + result.stderr);
        const value = JSON.parse(result.stdout);
        assert.equal(value.scope, 'historical-review-applicability');
        assert.equal(value.pages.length, 13);
        assert.equal(value.independentReview, 'preserved-not-rerun');
        assert.equal(value.browserAcceptance, 'not-performed');
        assert(!result.stdout.includes(root));
      },
    );
  },
);

test('historical verifier positive and negative paths run in the ordinary offline suite', async () => {
  const { verifyHistoricalReaderReview } =
    await import('../editions/ethos/review-history.mjs');
  const { reviewHistoryFixture } =
    await import('./fixtures/review-history.mjs');
  const run = (f) =>
    verifyHistoricalReaderReview(
      f.options,
      f.atlas,
      f.manifest,
      f.source,
      f.read,
      f.json,
      f.selectionPath,
    );
  const good = reviewHistoryFixture();
  const result = await run(good);
  assert(
    result.additionalFiles.some(
      ([name]) => name === 'owner-visual-acceptance.json',
    ),
  );
  for (const mutate of [
    (f) => {
      f.binding.verifier.processExitCode = 1;
    },
    (f) => {
      f.binding.subject.atlasManifest.sha256 = '0'.repeat(64);
    },
    (f) => {
      f.binding.pages = [];
    },
    (f) => {
      f.binding.diagramComparisons.pop();
    },
    (f) => {
      f.binding.evidenceFiles = f.binding.evidenceFiles.filter(
        (x) => x.path !== 'owner.json',
      );
    },
    (f) => {
      f.binding.browserAcceptance = 'ACCEPTED';
    },
  ]) {
    const f = reviewHistoryFixture();
    mutate(f);
    f.put('binding.json', f.binding);
    await assert.rejects(run(f));
  }
});

test('review input bounds reject an unbounded evidence list before file reads', async () => {
  const { readEthosReview } = await api();
  await assert.rejects(
    readEthosReview({
      atlas: {},
      history: Object.fromEntries(
        [
          'atlasCandidate',
          'selectionPath',
          'review',
          'reviewApplicability',
          'reviewedAtlas',
          'predecessorAtlas',
          'ownerVisualAcceptance',
          'priorReview',
          'priorReviewApplicability',
        ].map((k) => [k, 'evidence/' + k]),
      ),
      evidenceBundles: Array(9).fill({
        manifestPath: '/missing/manifest.json',
        sha256: 'a'.repeat(64),
      }),
      editorial: [],
    }),
    { code: 'review_inputs_invalid' },
  );
});
