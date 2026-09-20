import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

async function api() {
  const file = new URL(
    '../editions/ethos/browser-obligations.mjs',
    import.meta.url,
  );
  await assert.doesNotReject(
    fs.access(file),
    'one pure artifact obligation owner',
  );
  return import(file);
}
const html = `<!doctype html><div class="diagram-container"><svg role="img"><g data-node-id="a"></g><g data-node-id="b"></g></svg></div>
<script id="archify-guided-views-data" type="application/json">[{"id":"chapter","focus":["a","b"]}]</script>
<section data-resource-comparison><details><summary>Bindings</summary></details></section>
<details class="no-print"><summary>License</summary></details>`;

test('story obligations come from the selected HTML rather than the report', async () => {
  const { derivePageObligations } = await api(),
    value = derivePageObligations(html);
  assert.deepEqual(value.beats, [
    { chapter: 'chapter', nodeId: 'a', index: 0 },
    { chapter: 'chapter', nodeId: 'b', index: 1 },
  ]);
  assert.equal(value.disclosureCount, 1);
  assert.equal(value.trace, false);
  assert.throws(
    () => derivePageObligations(html.replace('"a","b"', '"a","missing"')),
    /node|binding/i,
  );
  assert.throws(
    () => derivePageObligations(html + html),
    /duplicate|unique|one/i,
  );
});

test('self-declared empty story/export/disclosure coverage cannot pass', async () => {
  const { browserCoverageGaps, derivePageObligations } = await api();
  const page = {
    id: 'overview',
    path: 'index.html',
    htmlSha256: 'a'.repeat(64),
    obligations: derivePageObligations(html),
  };
  const report = {
    status: 'PASS_BOUNDED',
    scenario: 'story',
    browserClosed: true,
    browserVersion: 'test-only',
    viewports: [[1600, 900]],
    errors: [],
    pages: [page],
    observations: [],
    stories: [],
    exports: [],
    disclosures: [],
  };
  const gaps = browserCoverageGaps(report, [page], [1600, 900], {
    effective_font_px_min_at_reference: 12,
  });
  assert(gaps.some((g) => g.includes('observation')));
  assert(gaps.some((g) => g.includes('story')));
  assert(gaps.some((g) => g.includes('export')));
  assert(gaps.some((g) => g.includes('disclosure')));
  assert(
    browserCoverageGaps(
      { ...report, fixtureOnly: 'synthetic' },
      [page],
      [1600, 900],
      { effective_font_px_min_at_reference: 12 },
    ).some((g) => g.includes('synthetic')),
  );
});

test('pure coverage predicate accepts complete data and rejects coordinated omissions', async () => {
  const { browserCoverageGaps, derivePageObligations, ATLAS_EXPORTS } =
    await api();
  const page = {
      id: 'overview',
      path: 'index.html',
      htmlSha256: 'a'.repeat(64),
      obligations: derivePageObligations(html),
    },
    viewport = { width: 1600, height: 900 },
    floor = { effective_font_px_min_at_reference: 12 };
  // In-memory predicate fixture only. No public admission, artifact receipt or
  // successful browser execution is produced from these invented values.
  const measured = {
    graphCount: 1,
    viewport,
    scrollWidth: 1600,
    subtitleVisible: true,
    texts: [
      {
        owner: 'a',
        text: 'A',
        opacity: 1,
        effectiveFont: 14,
        box: { x: 20, y: 40, right: 60, bottom: 60 },
      },
    ],
    panel: { x: 0, y: 0, right: 1600, bottom: 900 },
    hiddenTexts: [],
    overlaps: [],
    overflow: [],
    occludedText: [],
    notesHidden: [],
    supportOverlaps: [],
    supportOverflow: [],
  };
  const beats = page.obligations.beats;
  const report = {
    status: 'PASS_BOUNDED',
    scenario: 'story',
    browserClosed: true,
    browserVersion: 'in-memory-predicate-fixture',
    viewports: [[1600, 900]],
    errors: [],
    pages: [page],
    observations: ['document', 'present'].map((state) => ({
      page: page.id,
      state,
      htmlSha256: page.htmlSha256,
      viewport,
      measured,
      findings: [],
      screenshot: state + '.png',
    })),
    stories: ['document', 'present'].map((state) => ({
      page: page.id,
      state,
      viewport,
      expected: beats,
      seen: beats,
      samples: beats.map((beat) => ({
        chapter: beat.chapter,
        beat,
        findings: [],
        measured: {
          ...measured,
          story: beat,
          texts: [{ ...measured.texts[0], owner: beat.nodeId }],
        },
      })),
      findings: [],
      durationMs: 1000,
      replay: { chapter: 'chapter', beat: { index: 0 }, playing: true },
      paused: { playing: false, beat: beats[0] },
      retained: { playing: false, beat: beats[0] },
      resumed: true,
      reset: measured,
    })),
    exports: [
      {
        page: page.id,
        viewport,
        results: ATLAS_EXPORTS.map((format) =>
          format === 'webm'
            ? {
                format,
                status: 'NOT_APPLICABLE',
                reason: 'No trace',
                capability: { animation: null },
              }
            : {
                format,
                file: '/in-memory/' + format,
                bytes: 1,
                sha256: 'b'.repeat(64),
                receipt: {
                  'data-last-export-bytes': '1',
                  'data-last-export-canonical': ['route', 'reach'].includes(
                    format,
                  )
                    ? 'false'
                    : 'true',
                  ...(['route', 'reach'].includes(format)
                    ? {
                        ['data-last-export-' + format + '-state-clean']: 'true',
                      }
                    : {}),
                },
                content:
                  format === 'svg'
                    ? { original: ['A'], exported: ['A'] }
                    : { width: 100, height: 100, luminanceRange: 20 },
              },
        ),
      },
    ],
    disclosures: [
      {
        page: page.id,
        viewport,
        results: [
          { index: 0, measured, findings: [], screenshot: 'disclosure.png' },
        ],
      },
    ],
  };
  assert.deepEqual(browserCoverageGaps(report, [page], [1600, 900], floor), []);
  const { validateEthosBrowserReport } =
    await import('../editions/ethos/browser.mjs');
  const { sha256 } = await import('../adapters/ethos/projection.mjs');
  const portable = structuredClone(report),
    members = [];
  portable.source = {
    commit: 'c'.repeat(40),
    tree: 'd'.repeat(40),
    digest: 'e'.repeat(64),
    qualitySha256: 'f'.repeat(64),
  };
  portable.artifactManifestSha256 = '1'.repeat(64);
  for (const item of portable.exports[0].results)
    if (item.status !== 'NOT_APPLICABLE') item.file = 'exports/' + item.format;
  const names = [
    ...portable.observations.map((o) => 'screenshots/' + o.screenshot),
    ...portable.disclosures[0].results.map(
      (r) => 'screenshots/' + r.screenshot,
    ),
    ...portable.exports[0].results
      .filter((r) => r.status !== 'NOT_APPLICABLE')
      .map((r) => r.file),
  ];
  portable.evidenceFiles = names.map((name) => {
    const content = Buffer.from('x');
    members.push({ path: name, content });
    return { path: name, bytes: 1, sha256: sha256(content) };
  });
  for (const item of portable.exports[0].results)
    if (item.status !== 'NOT_APPLICABLE') item.sha256 = sha256('x');
  portable.checkerManifestSha256 = '2'.repeat(64);
  const target = {
    checkerManifestSha256: portable.checkerManifestSha256,
    source: portable.source,
    outputManifestSha256: portable.artifactManifestSha256,
    pages: [page],
    typography: floor,
  };
  assert.equal(
    validateEthosBrowserReport(
      { report: portable, members },
      target,
      [1600, 900],
    ).files,
    names.length,
  );
  for (const edit of [
    (r) => {
      r.checkerManifestSha256 = '0'.repeat(64);
    },
    (r) => {
      r.evidenceFiles.pop();
    },
    (r) => {
      r.source.qualitySha256 = '0'.repeat(64);
    },
    (r) => {
      r.artifactManifestSha256 = '0'.repeat(64);
    },
    (r) => {
      r.observations[1].screenshot = r.observations[0].screenshot;
    },
    (r) => {
      r.exports[0].results[0].file = '../escape';
    },
  ]) {
    const changed = structuredClone(portable);
    edit(changed);
    assert.throws(() =>
      validateEthosBrowserReport(
        { report: changed, members },
        target,
        [1600, 900],
      ),
    );
  }
  assert.throws(() =>
    validateEthosBrowserReport(
      {
        report: portable,
        members: members.map((m, i) =>
          i ? m : { ...m, content: Buffer.from('z') },
        ),
      },
      target,
      [1600, 900],
    ),
  );

  for (const [name, mutate] of [
    [
      'story self-exemption',
      (r) => {
        r.stories[0].expected = [];
        r.stories[0].seen = [];
        r.stories[0].samples = [];
      },
    ],
    ['export omitted', (r) => r.exports[0].results.pop()],
    ['disclosure omitted', (r) => (r.disclosures[0].results = [])],
    [
      'measured overlap',
      (r) => r.observations[0].measured.overlaps.push(['A', 'B']),
    ],
    ['wrong viewport', (r) => (r.stories[0].viewport.width = 1440)],
    [
      'duplicate page observation',
      (r) => (r.observations[1] = r.observations[0]),
    ],
    ['fake reset', (r) => (r.stories[0].reset = null)],
  ]) {
    const value = structuredClone(report);
    mutate(value);
    assert(
      browserCoverageGaps(value, [page], [1600, 900], floor).length > 0,
      name,
    );
  }
});

test('observation names separate artifact, viewport, state and operation', async () => {
  const { observationName } = await api(),
    base = {
      page: 'overview',
      htmlSha256: 'a'.repeat(64),
      viewport: [1600, 900],
      state: 'document',
      part: 'png',
    };
  const names = [
    base,
    { ...base, viewport: [1920, 1080] },
    { ...base, state: 'present' },
    { ...base, htmlSha256: 'b'.repeat(64) },
    { ...base, part: 'webp' },
  ].map(observationName);
  assert.equal(new Set(names).size, names.length);
  assert.throws(() => observationName({ ...base, page: '../escape' }));
});

test(
  'browser plan consumes current artifact output and does not execute a browser',
  { skip: !process.env.ETHOS_ATLAS_PLAN },
  async () => {
    const module = new URL('../editions/ethos/browser.mjs', import.meta.url);
    await assert.doesNotReject(
      fs.access(module),
      'browser plan must use current output directly',
    );
    const { describeEthosBrowser } = await import(module),
      atlas = JSON.parse(await fs.readFile(process.env.ETHOS_ATLAS_PLAN));
    const result = await describeEthosBrowser(atlas);
    assert.equal(result.pages.length, 13);
    assert.equal(
      result.pages.reduce((n, p) => n + p.obligations.beats.length, 0),
      238,
    );
    assert.equal(result.viewports.length, 4);
    assert.equal(result.browserExecuted, false);
    assert.equal(result.browserAcceptance, 'not-performed');
    assert.equal(result.typography.effective_font_px_min_at_reference, 12);
  },
);

test('runtime evidence validator rejects a forged passing summary', async () => {
  const module = await import('../editions/ethos/browser.mjs');
  assert.equal(typeof module.validateEthosBrowserReport, 'function');
  const target = {
    source: { digest: 'a'.repeat(64), qualitySha256: 'b'.repeat(64) },
    pages: [],
    typography: { effective_font_px_min_at_reference: 12 },
  };
  assert.throws(
    () =>
      module.validateEthosBrowserReport(
        {
          report: { status: 'PASS_BOUNDED', fixtureOnly: 'test' },
          members: [],
        },
        target,
        [1600, 900],
      ),
    /synthetic/i,
  );
  assert.throws(() =>
    module.validateEthosBrowserReport(
      { report: { status: 'PASS_BOUNDED' }, members: [] },
      target,
      [1600, 900],
    ),
  );
});

test(
  'current atlas cannot publish with no observed viewport reports',
  { skip: !process.env.ETHOS_ATLAS_PLAN },
  async () => {
    const module = await import('../editions/ethos/browser.mjs');
    assert.equal(typeof module.readEthosBrowserEvidence, 'function');
    const atlas = JSON.parse(await fs.readFile(process.env.ETHOS_ATLAS_PLAN));
    await assert.rejects(
      module.readEthosBrowserEvidence({ atlas, reports: [] }),
      /viewport|coverage/i,
    );
  },
);

test(
  'installed browser-plan command derives current obligations without launching a browser',
  { skip: !process.env.ETHOS_ATLAS_PLAN },
  async (t) => {
    const { spawnSync } = await import('node:child_process'),
      path = await import('node:path'),
      { fileURLToPath } = await import('node:url');
    const root = fileURLToPath(new URL('../', import.meta.url)),
      base = path.join(root, 'build/test-work');
    await fs.mkdir(base, { recursive: true });
    const tmp = await fs.mkdtemp(path.join(base, 'browser-plan '));
    t.after(() => fs.rm(tmp, { recursive: true, force: true }));
    const pack = spawnSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', tmp],
      { cwd: root, encoding: 'utf8' },
    );
    assert.equal(pack.status, 0, pack.stderr);
    const info = JSON.parse(pack.stdout)[0],
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
        path.join(tmp, info.filename),
      ],
      { cwd: consumer, encoding: 'utf8' },
    );
    assert.equal(install.status, 0, install.stderr);
    const plan = JSON.parse(await fs.readFile(process.env.ETHOS_ATLAS_PLAN));
    for (const key of ['sourceManifest', 'editionManifest', 'outputManifest']) {
      const dest = path.join(tmp, key);
      await fs.cp(path.dirname(plan[key]), dest, { recursive: true });
      plan[key] = key + '/manifest.json';
    }
    await fs.writeFile(path.join(tmp, 'plan.json'), JSON.stringify(plan));
    const home = path.join(tmp, 'home');
    await fs.mkdir(home);
    const result = spawnSync(
      process.execPath,
      [
        path.join(
          consumer,
          'node_modules/architecture-publisher/src/cli/main.mjs',
        ),
        'atlas',
        'ethos',
        'browser-plan',
        path.join(tmp, 'plan.json'),
      ],
      {
        cwd: consumer,
        env: { HOME: home, PATH: home, LANG: 'C.UTF-8' },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const value = JSON.parse(result.stdout);
    assert.equal(value.scope, 'required-browser-observations');
    assert.equal(value.pages.length, 13);
    assert.equal(value.browserExecuted, false);
    assert(!result.stdout.includes(root));
  },
);
