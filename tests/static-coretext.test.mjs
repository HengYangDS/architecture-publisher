import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = path.join(root, 'packages/publisher');
const sha = (b) => createHash('sha256').update(b).digest('hex');
async function api() {
  const entry = new URL('../packages/publisher/renderers/svg/coretext.mjs', import.meta.url);
  await assert.doesNotReject(fs.access(entry), 'explicit CoreText adapter exists');
  return (await import(entry)).measureCoreText;
}
async function setup(t) {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'coretext '));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const select = (args) => {
    const r = spawnSync('/usr/bin/xcrun', args, {
      encoding: 'utf8',
      timeout: 30000,
    });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  // Preserve the selected driver spelling: swiftc can link to swift-frontend,
  // which uses argv[0] to select compiler-driver mode.
  const compiler = select(['--find', 'swiftc']);
  const sdk = await fs.realpath(select(['--show-sdk-path']));
  const font = await fs.realpath(
    path.join(root, 'packages/publisher/renderers/fonts/supply/JetBrainsMono-Regular.ttf'),
  );
  return {
    dir,
    plan: {
      compiler: { path: compiler, sha256: sha(await fs.readFile(compiler)) },
      sdk: {
        path: sdk,
        settingsSha256: sha(await fs.readFile(path.join(sdk, 'SDKSettings.json'))),
      },
      fonts: [
        {
          id: '400',
          path: font,
          sha256: sha(await fs.readFile(font)),
          postscript: 'JetBrainsMono-Regular',
          cascade: [],
        },
      ],
      requests: [{ text: 'Reliable work', size: 18, font: '400' }],
      output: path.join(dir, 'metrics'),
    },
  };
}
test('CoreText adapter refuses implicit selection and unsupported hosts', async () => {
  const measure = await api();
  await assert.rejects(measure({}), {
    code: process.platform === 'darwin' ? 'coretext_plan_invalid' : 'coretext_platform_unsupported',
  });
});

test('CoreText request preflight is portable and does not read selected host tools', async () => {
  const entry = new URL('../packages/publisher/renderers/svg/coretext.mjs', import.meta.url);
  const { validateCoreTextPlan } = await import(entry);
  assert.equal(typeof validateCoreTextPlan, 'function');
  const unavailable = path.resolve('not-selected');
  const base = {
    compiler: { path: unavailable, sha256: '0'.repeat(64) },
    sdk: { path: unavailable, settingsSha256: '0'.repeat(64) },
    fonts: [
      {
        id: 'regular',
        path: unavailable,
        sha256: '0'.repeat(64),
        postscript: 'Selected-Regular',
        cascade: [],
      },
    ],
    requests: [{ text: 'Selected label', size: 12, font: 'regular' }],
    output: path.join(unavailable, 'output'),
  };
  const requests = validateCoreTextPlan(base);
  assert.deepEqual(requests, base.requests);
  assert.notEqual(requests, base.requests);
  for (const [name, mutate] of [
    ['unknown plan field', (plan) => (plan.extra = true)],
    ['duplicate font ID', (plan) => plan.fonts.push(structuredClone(plan.fonts[0]))],
    ['self cascade', (plan) => (plan.fonts[0].cascade = ['regular'])],
    ['duplicate cascade', (plan) => (plan.fonts[0].cascade = ['missing', 'missing'])],
    ['unknown request font', (plan) => (plan.requests[0].font = 'missing')],
    ['duplicate request', (plan) => plan.requests.push(structuredClone(plan.requests[0]))],
    ['empty text', (plan) => (plan.requests[0].text = '  ')],
    ['invalid size', (plan) => (plan.requests[0].size = 0)],
    [
      'aggregate text budget',
      (plan) =>
        (plan.requests = Array.from({ length: 211 }, (_, i) => ({
          text: 'x'.repeat(19990) + String(i).padStart(5, '0'),
          size: 12,
          font: 'regular',
        }))),
    ],
  ]) {
    const plan = structuredClone(base);
    mutate(plan);
    assert.throws(() => validateCoreTextPlan(plan), { code: 'coretext_plan_invalid' }, name);
  }
});

test(
  'CoreText rejects malformed request records before reading selected tools',
  { skip: process.platform !== 'darwin' },
  async () => {
    const measure = await api();
    const plan = {
      compiler: { path: '/not-selected', sha256: '0'.repeat(64) },
      sdk: { path: '/not-selected', settingsSha256: '0'.repeat(64) },
      fonts: [
        {
          id: '400',
          path: '/not-selected',
          sha256: '0'.repeat(64),
          postscript: 'NotSelected',
          cascade: [],
        },
      ],
      output: '/not-selected/output',
    };
    for (const record of [null, false, [], {}, { text: 'x', size: 12, font: 'missing' }])
      await assert.rejects(measure({ ...plan, requests: [record] }), {
        code: 'coretext_plan_invalid',
      });
  },
);
test(
  'CoreText rejects ambiguous font identity and request volume before reading selected tools',
  { skip: process.platform !== 'darwin' },
  async () => {
    const measure = await api();
    const base = {
      compiler: { path: '/not-selected', sha256: '0'.repeat(64) },
      sdk: { path: '/not-selected', settingsSha256: '0'.repeat(64) },
      fonts: [
        {
          id: 'regular',
          path: '/not-selected',
          sha256: '0'.repeat(64),
          postscript: 'Selected-Regular',
          cascade: [],
        },
      ],
      requests: [{ text: 'Selected label', size: 12, font: 'regular' }],
      output: '/not-selected/output',
    };
    for (const [name, mutate] of [
      ['duplicate font ID', (p) => p.fonts.push(structuredClone(p.fonts[0]))],
      ['empty font ID', (p) => (p.fonts[0].id = '')],
      ['empty PostScript name', (p) => (p.fonts[0].postscript = '')],
      ['self cascade', (p) => (p.fonts[0].cascade = ['regular'])],
      ['unknown cascade', (p) => (p.fonts[0].cascade = ['missing'])],
      ['duplicate cascade', (p) => (p.fonts[0].cascade = ['missing', 'missing'])],
      ['duplicate request', (p) => p.requests.push(structuredClone(p.requests[0]))],
      ['oversized label', (p) => (p.requests[0].text = 'x'.repeat(20001))],
      [
        'aggregate text budget',
        (p) =>
          (p.requests = Array.from({ length: 211 }, (_, i) => ({
            text: 'x'.repeat(19990) + String(i).padStart(5, '0'),
            size: 12,
            font: 'regular',
          }))),
      ],
    ]) {
      const plan = structuredClone(base);
      mutate(plan);
      await assert.rejects(measure(plan), { code: 'coretext_plan_invalid' }, name);
    }
  },
);
test(
  'CoreText refuses non-directory SDK and output parents before compiling',
  { skip: process.platform !== 'darwin' },
  async (t) => {
    const measure = await api(),
      f = await setup(t);
    const sdkFile = structuredClone(f.plan);
    sdkFile.sdk.path = f.plan.fonts[0].path;
    await assert.rejects(measure(sdkFile), { code: 'coretext_sdk_invalid' });

    const occupiedParent = path.join(f.dir, 'not-a-directory');
    await fs.writeFile(occupiedParent, 'foreign');
    const outputParent = structuredClone(f.plan);
    outputParent.output = path.join(occupiedParent, 'metrics');
    await assert.rejects(measure(outputParent), { code: 'output_parent_invalid' });
    assert.equal(await fs.readFile(occupiedParent, 'utf8'), 'foreign');
  },
);
test(
  'CoreText measures actual glyph bounds and records explicitly selected font runs',
  { skip: process.platform !== 'darwin' },
  async (t) => {
    const measure = await api(),
      f = await setup(t),
      result = await measure(f.plan);
    assert.equal(result.status, 'measured');
    assert.equal(result.requestCount, 1);
    assert.equal(result.freshMeasurement, 'performed');
    assert.equal(result.observations[0].fonts[0].postscript, 'JetBrainsMono-Regular');
    assert.equal(result.observations[0].fonts[0].sha256, f.plan.fonts[0].sha256);
    const table = JSON.parse(await fs.readFile(path.join(f.plan.output, 'metrics.json')));
    assert.equal(table.provenance.method, 'recorded');
    assert.equal(table.records[0][0], JSON.stringify(['Reliable work', 18, '400']));
    assert(table.records[0][1].width > 100);
    assert(table.records[0][1].glyph.height > 0);
    const before = await fs.readFile(path.join(f.plan.output, 'manifest.json'));
    await assert.rejects(measure(f.plan), { code: 'output_exists' });
    assert.deepEqual(await fs.readFile(path.join(f.plan.output, 'manifest.json')), before);
    assert.deepEqual((await fs.readdir(f.dir)).sort(), ['metrics']);
  },
);
test(
  'CoreText emits identical metric bytes for identical selected inputs',
  { skip: process.platform !== 'darwin' },
  async (t) => {
    const measure = await api(),
      first = await setup(t),
      second = structuredClone(first.plan);
    second.output = path.join(first.dir, 'repeated-metrics');

    await measure(first.plan);
    await measure(second);

    assert.deepEqual(
      await fs.readFile(path.join(first.plan.output, 'metrics.json')),
      await fs.readFile(path.join(second.output, 'metrics.json')),
    );
  },
);
test(
  'CoreText accepts the selected font through the macOS private tmp path alias',
  { skip: process.platform !== 'darwin' },
  async (t) => {
    const measure = await api(),
      f = await setup(t),
      aliasRoot = await fs.mkdtemp('/private/tmp/architecture-coretext-alias-');
    t.after(() => fs.rm(aliasRoot, { recursive: true, force: true }));
    const font = path.join(aliasRoot, 'selected.ttf');
    await fs.copyFile(f.plan.fonts[0].path, font);
    const plan = structuredClone(f.plan);
    plan.fonts[0].path = font;
    plan.fonts[0].sha256 = sha(await fs.readFile(font));
    plan.output = path.join(aliasRoot, 'metrics');

    const result = await measure(plan);

    assert.equal(result.status, 'measured');
    assert.equal(result.observations[0].fonts[0].path, font);
  },
);
test(
  'CoreText rejects font drift, identity substitution and undeclared fallback before publication',
  { skip: process.platform !== 'darwin' },
  async (t) => {
    const measure = await api(),
      f = await setup(t);
    const changed = structuredClone(f.plan);
    changed.fonts[0].sha256 = '0'.repeat(64);
    await assert.rejects(measure(changed), { code: 'coretext_font_changed' });
    const renamed = structuredClone(f.plan);
    renamed.fonts[0].postscript = 'Missing-Font';
    await assert.rejects(measure(renamed), { code: 'coretext_font_unbound' });
    const fallback = structuredClone(f.plan);
    fallback.requests[0].text = '问道';
    await assert.rejects(measure(fallback), { code: 'coretext_font_unbound' });
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
    assert.deepEqual(await fs.readdir(f.dir), []);
  },
);

test(
  'installed CoreText CLI uses an explicit relocated plan without checkout or ambient PATH',
  { skip: process.platform !== 'darwin' },
  async (t) => {
    const f = await setup(t);
    const runNpm = (args) => {
      const r = spawnSync('npm', args, {
        cwd: publisher,
        encoding: 'utf8',
        timeout: 60000,
        env: {
          ...process.env,
          npm_config_offline: 'true',
          npm_config_update_notifier: 'false',
        },
      });
      assert.equal(r.status, 0, r.stdout + r.stderr);
      return r.stdout;
    };
    const packed = parseNpmPackRecord(
      runNpm(['pack', '--ignore-scripts', '--json', '--pack-destination', f.dir]),
    );
    assert(packed.files.some((x) => x.path === 'renderers/svg/coretext.swift'));
    const consumer = path.join(f.dir, 'consumer');
    await fs.mkdir(consumer);
    runNpm([
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(f.dir, packed.filename),
    ]);
    const pkg = path.join(consumer, 'node_modules/architecture-publisher');
    const font = path.join(f.dir, 'selected font.ttf');
    await fs.copyFile(f.plan.fonts[0].path, font);
    // Only this disposable installation is changed. Measurement must not load
    // the drawing backends, their fonts, or ETHOS-specific edition code.
    for (const name of ['renderers/archify', 'renderers/fonts', 'renderers/resvg'])
      await fs.rm(path.join(pkg, name), { recursive: true });
    const plan = structuredClone(f.plan);
    plan.compiler.path = path.relative(f.dir, plan.compiler.path);
    plan.sdk.path = path.relative(f.dir, plan.sdk.path);
    plan.fonts[0].path = './selected font.ttf';
    plan.output = './measured output';
    const planPath = path.join(f.dir, 'plan.json');
    await fs.writeFile(planPath, JSON.stringify(plan), { flag: 'wx' });
    const home = path.join(f.dir, 'empty home');
    await fs.mkdir(home);
    const run = () =>
      spawnSync(
        process.execPath,
        [path.join(pkg, 'src/cli/main.mjs'), 'render', 'measure', planPath],
        {
          cwd: home,
          env: { HOME: home, PATH: home },
          encoding: 'utf8',
          timeout: 180000,
        },
      );
    const observed = run();
    assert.equal(observed.status, 0, observed.stdout + observed.stderr);
    const result = JSON.parse(observed.stdout);
    assert.equal(result.status, 'measured');
    assert.equal(result.freshMeasurement, 'performed');
    assert.equal(result.requestCount, 1);
    assert.equal(result.browserAcceptance, 'not-performed');
    const manifest = path.join(f.dir, 'measured output/manifest.json'),
      before = await fs.readFile(manifest);
    const repeated = run();
    assert.equal(repeated.status, 1);
    assert.equal(JSON.parse(repeated.stdout).error.code, 'output_exists');
    assert.deepEqual(await fs.readFile(manifest), before);
  },
);
