import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { writeSourceBundle } from '../src/source/write.mjs';
import { readSourceBundle } from '../src/source/bundle.mjs';
import { rasterize } from '../src/static/raster.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const shape =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><path d="M20 20 H100" stroke="black"/></svg>';
async function api() {
  const entry = new URL('../editions/ethos/outline.mjs', import.meta.url);
  await assert.doesNotReject(
    fs.access(entry),
    'explicit outline adapter exists',
  );
  return (await import(entry)).outlineEthosPoster;
}
async function setup(t) {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'outline protocol '));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  // Test-only executables exercise the boundary protocol, not visual preservation.
  const bundle = await writeSourceBundle(
    path.join(dir, 'fixture'),
    { id: 'test:shape' },
    [{ path: 'figure.svg', content: Buffer.from(shape) }],
  );
  const r = await rasterize({
    manifest: bundle.manifestPath,
    manifestSha256: bundle.manifestSha256,
    svg: 'figure.svg',
    fonts: [],
    width: 1600,
    output: path.join(dir, 'reference.png'),
  });
  const renderer = path.join(dir, 'renderer.cjs');
  const listing = path.join(dir, 'font-list.cjs');
  const font = await fs.realpath(
    path.join(root, 'assets/fonts/JetBrainsMono-Regular.ttf'),
  );
  const png = await fs.readFile(path.join(dir, 'reference.png'));
  async function executable(file, program) {
    await fs.writeFile(file, '#!' + process.execPath + '\n' + program, {
      mode: 0o755,
    });
    return { path: file, sha256: sha(await fs.readFile(file)) };
  }
  const render = await executable(
    renderer,
    // The UTF-8 fd fast path stalled on the measured 73,525-byte socket input.
    // Read bytes and bind the complete input, not only a marker string.
    `const fs=require('node:fs'),crypto=require('node:crypto');
const input=fs.readFileSync(0);
if(crypto.createHash('sha256').update(input).digest('hex')!=='87594199a5b3182860d6ed1a16b446082a2862cc52b8ed8c1731111f3e600bfa')process.exit(3);
fs.writeSync(1,process.argv.includes('svg')?${JSON.stringify(shape)}:Buffer.from(${JSON.stringify(png.toString('base64'))},'base64'));`,
  );
  const list = await executable(
    listing,
    `process.stdout.write(${JSON.stringify(font + '\n')});`,
  );
  return {
    dir,
    executable,
    shape,
    plan: {
      poster: {
        sourceManifest: path.join(
          root,
          'tests/fixtures/ethos-source/manifest.json',
        ),
        sourceSha256:
          '58121ad168a314af94b55f557435ffb7d9828ca7c476411f18467731ae9d1db0',
        projectionDigest:
          '4ea40f421434106948f1e1d2d9ae5ee6c8b9868edc5538ff755876fd01d37ef8',
        editionManifest: path.join(
          root,
          'editions/ethos/static/authoring/manifest.json',
        ),
        editionSha256:
          '62317d11b19994090a1c7ae65eae3a092ebc783b9702cc687f5e4d33ace15a43',
      },
      renderer: render,
      fontList: list,
      fonts: [{ path: font, sha256: sha(await fs.readFile(font)) }],
      reference: { width: 1600, height: 900, pngSha256: r.artifact.sha256 },
      output: path.join(dir, 'outlined'),
    },
  };
}
test('outline protocol fixture rejects incomplete input rather than accepting a marker', async (t) => {
  const f = await setup(t);
  for (const input of [Buffer.from('data-source-commit'), Buffer.alloc(0)]) {
    const result = spawnSync(f.plan.renderer.path, ['--width', '1600'], {
      input,
      cwd: f.dir,
      env: { HOME: f.dir, PATH: f.dir },
      timeout: 30000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 3);
    assert.equal(result.stdout.length, 0);
  }
});
test('outline protocol retains source, text and observations without claiming visual acceptance', async (t) => {
  const outline = await api(),
    f = await setup(t);
  const before = (await fs.readdir(f.dir)).sort();
  const result = await outline(f.plan);
  assert.equal(result.status, 'outlined');
  assert.equal(result.labels, 180);
  assert.equal(result.visualAcceptance, 'not-performed');
  assert.equal(result.browserAcceptance, 'not-performed');
  assert.equal(result.reference.sha256, f.plan.reference.pngSha256);
  const bundle = await readSourceBundle(
    result.output.manifestPath,
    result.output.manifestSha256,
  );
  const members = new Map(bundle.members.map((m) => [m.path, m.content]));
  assert.deepEqual([...members.keys()].sort(), [
    'observation.json',
    'outlined.svg',
    'source.svg',
    'text.txt',
  ]);
  assert.equal(
    sha(members.get('source.svg')),
    '87594199a5b3182860d6ed1a16b446082a2862cc52b8ed8c1731111f3e600bfa',
  );
  assert.equal(
    members.get('text.txt').toString().trim().split('\n').length,
    180,
  );
  assert.equal(members.get('outlined.svg').toString(), shape);
  assert.deepEqual(
    (await fs.readdir(f.dir)).sort(),
    [...before, 'outlined'].sort(),
  );
  const original = await fs.readFile(result.output.manifestPath);
  await assert.rejects(outline(f.plan), { code: 'output_exists' });
  assert.deepEqual(await fs.readFile(result.output.manifestPath), original);
});
test('outline refuses implicit tools, source substitution and bad dimensions', async (t) => {
  const outline = await api(),
    f = await setup(t);
  for (const mutate of [
    (p) => {
      delete p.renderer;
    },
    (p) => {
      p.renderer.path = 'rsvg-convert';
    },
    (p) => {
      p.fonts = [];
    },
    (p) => {
      p.fonts.push(p.fonts[0]);
    },
    (p) => {
      p.reference.width = 0;
    },
    (p) => {
      p.reference.height = 8193;
    },
    (p) => {
      p.poster.output = '/not-an-input';
    },
    (p) => {
      p.extra = true;
    },
  ]) {
    const plan = structuredClone(f.plan);
    mutate(plan);
    await assert.rejects(outline(plan));
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  }
  const changed = structuredClone(f.plan);
  changed.poster.projectionDigest = '0'.repeat(64);
  await assert.rejects(outline(changed));
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('outline refuses tool and font drift, reference mismatch and unexpected font lookup', async (t) => {
  const outline = await api(),
    f = await setup(t);
  for (const [mutate, code] of [
    [
      (p) => {
        p.renderer.sha256 = '0'.repeat(64);
      },
      'outline_tool_changed',
    ],
    [
      (p) => {
        p.fonts[0].sha256 = '0'.repeat(64);
      },
      'outline_font_changed',
    ],
    [
      (p) => {
        p.reference.pngSha256 = '0'.repeat(64);
      },
      'outline_reference_mismatch',
    ],
  ]) {
    const p = structuredClone(f.plan);
    mutate(p);
    const before = (await fs.readdir(f.dir)).sort();
    await assert.rejects(outline(p), { code });
    await assert.rejects(fs.stat(p.output), { code: 'ENOENT' });
    assert.deepEqual((await fs.readdir(f.dir)).sort(), before);
  }
  f.plan.fontList = await f.executable(
    f.plan.fontList.path,
    'process.stdout.write("/undeclared/font.ttf\\n");',
  );
  await assert.rejects(outline(f.plan), {
    code: 'outline_font_inventory_mismatch',
  });
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('outline refuses surviving text, SVG scripts and renderer failure', async (t) => {
  const outline = await api(),
    f = await setup(t);
  const png = await fs.readFile(path.join(f.dir, 'reference.png'));
  for (const body of [
    shape.replace('</svg>', '<text>not outlined</text></svg>'),
    shape.replace('</svg>', '<script>fail()</script></svg>'),
  ]) {
    f.plan.renderer = await f.executable(
      f.plan.renderer.path,
      `const fs=require('node:fs');fs.readFileSync(0);process.stdout.write(process.argv.includes('svg')?${JSON.stringify(body)}:Buffer.from(${JSON.stringify(png.toString('base64'))},'base64'));`,
    );
    await assert.rejects(outline(f.plan), {
      code: body.includes('<text')
        ? 'raster_font_unbound'
        : 'raster_svg_unsupported',
    });
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  }
  f.plan.renderer = await f.executable(
    f.plan.renderer.path,
    'require("node:fs").readFileSync(0);process.exit(4);',
  );
  await assert.rejects(outline(f.plan), { code: 'outline_execution_failed' });
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('outline rechecks selected files after conversion', async (t) => {
  const outline = await api();
  for (const kind of ['tool', 'font']) {
    const f = await setup(t);
    const font = path.join(f.dir, 'selected-font.ttf');
    await fs.copyFile(f.plan.fonts[0].path, font);
    f.plan.fonts = [{ path: font, sha256: sha(await fs.readFile(font)) }];
    f.plan.fontList = await f.executable(
      f.plan.fontList.path,
      `process.stdout.write(${JSON.stringify(font + '\n')});`,
    );
    const png = await fs.readFile(path.join(f.dir, 'reference.png'));
    const target = kind === 'tool' ? '__filename' : JSON.stringify(font);
    f.plan.renderer = await f.executable(
      f.plan.renderer.path,
      `const fs=require('node:fs');fs.readFileSync(0);
if(process.argv.includes('svg')){fs.appendFileSync(${target},'\\n// changed');process.stdout.write(${JSON.stringify(shape)});}
else process.stdout.write(Buffer.from(${JSON.stringify(png.toString('base64'))},'base64'));`,
    );
    const before = (await fs.readdir(f.dir)).sort();
    await assert.rejects(outline(f.plan), {
      code: kind === 'tool' ? 'outline_tool_changed' : 'outline_font_changed',
    });
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
    assert.deepEqual((await fs.readdir(f.dir)).sort(), before);
  }
});
test('outline preserves a concurrently arriving output and refuses symlink ancestry', async (t) => {
  const outline = await api(),
    f = await setup(t);
  const png = await fs.readFile(path.join(f.dir, 'reference.png'));
  f.plan.renderer = await f.executable(
    f.plan.renderer.path,
    `const fs=require('node:fs');fs.readFileSync(0);
if(process.argv.includes('svg')){fs.mkdirSync(${JSON.stringify(f.plan.output)});fs.writeFileSync(${JSON.stringify(path.join(f.plan.output, 'keep'))},'concurrent owner',{flag:'wx'});process.stdout.write(${JSON.stringify(shape)});}
else process.stdout.write(Buffer.from(${JSON.stringify(png.toString('base64'))},'base64'));`,
  );
  await assert.rejects(outline(f.plan), { code: 'output_exists' });
  assert.equal(
    await fs.readFile(path.join(f.plan.output, 'keep'), 'utf8'),
    'concurrent owner',
  );
  const link = path.join(f.dir, 'link');
  await fs.symlink(f.dir, link);
  await assert.rejects(outline({ ...f.plan, output: path.join(link, 'new') }), {
    code: 'output_parent_invalid',
  });
  await fs.mkdir(path.join(f.dir, 'nested'));
  await assert.rejects(
    outline({ ...f.plan, output: path.join(link, 'nested/new') }),
    {
      code: 'output_parent_invalid',
    },
  );
  assert.deepEqual(await fs.readdir(path.join(f.dir, 'nested')), []);
});
test('outline CLI resolves explicit input paths from the plan, not cwd', async (t) => {
  await api();
  const f = await setup(t);
  const log = path.join(f.dir, 'child-io.log');
  const png = await fs.readFile(path.join(f.dir, 'reference.png'));
  f.plan.renderer = await f.executable(
    f.plan.renderer.path,
    `const fs=require('node:fs'),crypto=require('node:crypto');
const input=fs.readFileSync(0);
fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({args:process.argv.slice(2),sha256:crypto.createHash('sha256').update(input).digest('hex')})+'\\n');
fs.writeSync(1,process.argv.includes('svg')?${JSON.stringify(shape)}:Buffer.from(${JSON.stringify(png.toString('base64'))},'base64'));`,
  );
  const plan = structuredClone(f.plan);
  for (const key of ['sourceManifest', 'editionManifest'])
    plan.poster[key] = path.relative(f.dir, plan.poster[key]);
  for (const k of ['renderer', 'fontList'])
    plan[k].path = path.relative(f.dir, plan[k].path);
  for (const font of plan.fonts) font.path = path.relative(f.dir, font.path);
  plan.output = 'outlined';
  const p = path.join(f.dir, 'plan.json');
  await fs.writeFile(p, JSON.stringify(plan));
  const r = spawnSync(
    process.execPath,
    [path.join(root, 'src/cli/main.mjs'), 'poster', 'ethos', 'outline', p],
    {
      cwd: path.dirname(root),
      encoding: 'utf8',
      timeout: 120000,
      env: { HOME: f.dir, PATH: f.dir },
    },
  );
  assert.equal(
    r.status,
    0,
    r.stdout +
      r.stderr +
      '\n' +
      (await fs.readFile(log, 'utf8').catch(() => 'no child log')) +
      '\n' +
      r.error?.code,
  );
  const observed = (await fs.readFile(log, 'utf8'))
    .trim()
    .split('\n')
    .map(JSON.parse);
  assert.deepEqual(
    observed.map((x) => x.args),
    [
      ['--width', '1600'],
      ['--format', 'svg'],
    ],
  );
  assert(
    observed.every(
      (x) =>
        x.sha256 ===
        '87594199a5b3182860d6ed1a16b446082a2862cc52b8ed8c1731111f3e600bfa',
    ),
  );
  assert.equal(JSON.parse(r.stdout).status, 'outlined');
  assert.equal(JSON.parse(r.stdout).visualAcceptance, 'not-performed');
});
