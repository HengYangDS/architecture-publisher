import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeSourceBundle } from '../src/source/write.mjs';
import { RASTER_LIMITS } from '../src/static/limits.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (b) => createHash('sha256').update(b).digest('hex');

test('installed raster command needs only explicit input and its pinned static supply', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'installed raster '));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const run = (cmd, args, cwd = root) => {
    const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 60000 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r.stdout;
  };
  const pack = JSON.parse(
    run('npm', [
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      dir,
    ]),
  )[0];
  assert(pack.files.some((f) => f.path === 'src/static/raster.mjs'));
  assert(
    pack.files.some((f) => f.path === 'assets/raster/resvg/index_bg.wasm'),
  );
  const consumer = path.join(dir, 'consumer'),
    home = path.join(dir, 'empty home');
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
      path.join(dir, pack.filename),
    ],
    consumer,
  );
  const pkg = path.join(consumer, 'node_modules/architecture-publishing');
  // This disposable installed copy deliberately lacks the interactive and ETHOS code.
  // Static execution must never load those independent capability owners.
  for (const name of [
    'src/interactive',
    'src/integrations',
    'editions',
    'assets/archify',
  ])
    await fs.rm(path.join(pkg, name), { recursive: true });
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120"><rect width="300" height="120" fill="#f5f3ed"/><text font-family="JetBrains Mono" font-size="20" x="20" y="70" fill="#29372f">Offline delivery</text></svg>',
  );
  const source = await writeSourceBundle(
    path.join(dir, 'input'),
    { id: 'service:independent' },
    [
      { path: 'diagram.svg', content: svg },
      {
        path: 'font.ttf',
        content: await fs.readFile(
          path.join(pkg, 'assets/fonts/JetBrainsMono-Regular.ttf'),
        ),
      },
    ],
  );
  const plan = {
    manifest: 'input/manifest.json',
    manifestSha256: source.manifestSha256,
    svg: 'diagram.svg',
    fonts: [{ path: 'font.ttf', family: 'JetBrains Mono', weight: 400 }],
    width: 1200,
    output: 'figure.png',
  };
  const planPath = path.join(dir, 'plan.json');
  await fs.writeFile(planPath, JSON.stringify(plan));
  const invoke = () =>
    spawnSync(
      process.execPath,
      [path.join(pkg, 'src/cli/main.mjs'), 'raster', planPath],
      {
        cwd: home,
        env: { HOME: home, PATH: home },
        encoding: 'utf8',
        timeout: 60000,
      },
    );
  const first = invoke();
  assert.equal(first.status, 0, first.stdout + first.stderr);
  const result = JSON.parse(first.stdout),
    bytes = await fs.readFile(path.join(dir, 'figure.png'));
  assert.equal(result.artifact.sha256, hash(bytes));
  assert.equal(result.width, 1200);
  assert.equal(result.height, 480);
  assert.equal(result.browserAcceptance, 'not-performed');
  assert.equal(result.semanticAcceptance, 'not-performed');
  const occupied = invoke();
  assert.equal(occupied.status, 1);
  assert.equal(JSON.parse(occupied.stdout).error.code, 'raster_output_exists');
  assert.deepEqual(await fs.readFile(path.join(dir, 'figure.png')), bytes);
  const invalidSource = await writeSourceBundle(
    path.join(dir, 'invalid-input'),
    { id: 'service:invalid-attribute-value' },
    [
      {
        path: 'diagram.svg',
        content: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M0 0 L"/></svg>',
        ),
      },
    ],
  );
  await fs.writeFile(
    planPath,
    JSON.stringify({
      ...plan,
      manifest: 'invalid-input/manifest.json',
      manifestSha256: invalidSource.manifestSha256,
      fonts: [],
      output: 'invalid.png',
    }),
  );
  const invalid = invoke();
  assert.equal(invalid.status, 1);
  assert.equal(
    JSON.parse(invalid.stdout).error.code,
    'raster_svg_value_invalid',
  );
  await assert.rejects(fs.stat(path.join(dir, 'invalid.png')), {
    code: 'ENOENT',
  });
  const wrongReference = await writeSourceBundle(
    path.join(dir, 'wrong-reference'),
    { id: 'service:invalid-reference-type' },
    [{
      path: 'diagram.svg',
      content: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><rect id="paint" width="10" height="10"/></defs><rect width="100" height="100" fill="url(#paint)"/></svg>',
      ),
    }],
  );
  await fs.writeFile(planPath, JSON.stringify({
    ...plan,
    manifest: 'wrong-reference/manifest.json',
    manifestSha256: wrongReference.manifestSha256,
    fonts: [],
    output: 'wrong-reference.png',
  }));
  const wrong = invoke();
  assert.equal(wrong.status, 1);
  assert.equal(
    JSON.parse(wrong.stdout).error.code,
    'raster_svg_reference_type_invalid',
  );
  await assert.rejects(fs.stat(path.join(dir, 'wrong-reference.png')), {
    code: 'ENOENT',
  });
  await fs.writeFile(planPath, JSON.stringify(plan));
  for (const member of [
    'resvg/index.mjs',
    'resvg/index_bg.wasm',
    'sax/sax.cjs',
    'opentype/opentype.mjs',
  ]) {
    const target = path.join(pkg, 'assets/raster', member),
      original = await fs.readFile(target);
    await fs.appendFile(target, '\ntampered');
    plan.output = 'bad.png';
    await fs.writeFile(planPath, JSON.stringify(plan));
    const bad = invoke();
    assert.equal(bad.status, 1);
    assert.equal(JSON.parse(bad.stdout).error.code, 'raster_supply_invalid');
    await assert.rejects(fs.stat(path.join(dir, 'bad.png')), {
      code: 'ENOENT',
    });
    await fs.writeFile(target, original);
  }
  // A test-only installed worker observes the actual child-process invocation.
  // It does not stand in for the real raster tests above or qualify any artifact.
  const worker = path.join(pkg, 'src/static/worker.mjs');
  await fs.writeFile(
    worker,
    `
    import fs from 'node:fs';
    const forwarded=JSON.parse(fs.readFileSync(0,'utf8'));
    const bounded=process.execArgv.includes('--max-old-space-size=${RASTER_LIMITS.heapMiB}') &&
      process.execArgv.includes('--wasm-max-mem-pages=${RASTER_LIMITS.wasmPages}');
    console.log(JSON.stringify({status:'error',code:bounded && forwarded.width===1200 ? 'resource-boundary-observed' : 'resource-boundary-missing'}));
    process.exitCode=1;
  `,
  );
  const boundary = invoke();
  assert.equal(boundary.status, 1);
  assert.equal(
    JSON.parse(boundary.stdout).error.code,
    'resource-boundary-observed',
  );
  await assert.rejects(fs.stat(path.join(dir, 'bad.png')), { code: 'ENOENT' });
  // Inject faults only into this disposable installation, after real rendering.
  // These cases qualify transport rejection, not a replacement renderer.
  const successfulReply = {
    status: 'rendered',
    width: 1200,
    height: 480,
    elements: 3,
    fontCount: 1,
    png: bytes.toString('base64'),
  };
  const consumeInput =
    'import fs from "node:fs";JSON.parse(fs.readFileSync(0,"utf8"));';
  for (const [label, body, expected] of [
    ['empty stdout', '', 'raster_response_invalid'],
    [
      'invalid JSON',
      'process.stdout.write("{broken");',
      'raster_response_invalid',
    ],
    ...[
      null,
      [],
      0,
      { ...successfulReply, png: [] },
      { ...successfulReply, unexpected: true },
      { ...successfulReply, png: successfulReply.png + '!' },
      { ...successfulReply, elements: -1 },
      { ...successfulReply, fontCount: 17 },
      { ...successfulReply, width: 1199 },
      { ...successfulReply, height: 479 },
      { ...successfulReply, png: '' },
      { ...successfulReply, png: Buffer.alloc(33).toString('base64') },
      { ...successfulReply, png: bytes.subarray(0, 20).toString('base64') },
      { status: 'error', code: { unexpected: true } },
    ].map((reply, index) => [
      `invalid reply ${index}`,
      `process.stdout.write(${JSON.stringify(JSON.stringify(reply))});`,
      'raster_response_invalid',
    ]),
    [
      'nonzero despite success reply',
      `process.stdout.write(${JSON.stringify(JSON.stringify(successfulReply))});process.exitCode=1;`,
      'raster_render_failed',
    ],
    [
      'killed child',
      'process.kill(process.pid,"SIGKILL");',
      'raster_process_failed',
    ],
    [
      'bounded child output',
      `const chunk=Buffer.alloc(65536);for(let count=0;count<=${RASTER_LIMITS.responseBytes};count+=chunk.length)fs.writeSync(1,chunk);`,
      'raster_process_failed',
    ],
  ]) {
    await t.test(label, async () => {
      const outputDir = await fs.mkdtemp(path.join(dir, 'response-'));
      await fs.writeFile(
        planPath,
        JSON.stringify({
          ...plan,
          output: path.relative(dir, path.join(outputDir, 'bad.png')),
        }),
      );
      await fs.writeFile(worker, consumeInput + body);
      const rejected = invoke();
      assert.equal(rejected.status, 1, rejected.stdout + rejected.stderr);
      assert.equal(JSON.parse(rejected.stdout).error.code, expected);
      await assert.rejects(fs.stat(path.join(outputDir, 'bad.png')), {
        code: 'ENOENT',
      });
      assert.deepEqual(
        await fs.readFile(path.join(dir, 'figure.png')),
        bytes,
      );
      assert.deepEqual(await fs.readdir(outputDir), []);
    });
  }
  await t.test(
    'actual deadline stops a non-terminating child',
    async () => {
      const outputDir = await fs.mkdtemp(path.join(dir, 'deadline-'));
      await fs.writeFile(
        planPath,
        JSON.stringify({
          ...plan,
          output: path.relative(dir, path.join(outputDir, 'bad.png')),
        }),
      );
      await fs.writeFile(
        worker,
        consumeInput + 'setInterval(()=>{},1000);',
      );
      const started = performance.now(),
        timedOut = invoke();
      assert.equal(timedOut.status, 1, timedOut.stdout + timedOut.stderr);
      assert.equal(
        JSON.parse(timedOut.stdout).error.code,
        'raster_execution_timeout',
      );
      assert(performance.now() - started >= RASTER_LIMITS.executionMs);
      assert(
        performance.now() - started < RASTER_LIMITS.executionMs + 15000,
      );
      await assert.rejects(fs.stat(path.join(outputDir, 'bad.png')), {
        code: 'ENOENT',
      });
      assert.deepEqual(await fs.readdir(outputDir), []);
    },
  );
});
