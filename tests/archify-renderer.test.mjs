import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderDiagram } from '../packages/publisher/renderers/archify/index.mjs';
import * as renderer from '../packages/publisher/renderers/archify/index.mjs';
import * as fontSupply from '../packages/publisher/renderers/fonts/index.mjs';
import { serviceTopology } from './fixtures/diagrams.mjs';
const sha = (b) => createHash('sha256').update(b).digest('hex');
test('editions reuse the verified bundled font bytes without a second loader', async () => {
  assert.equal(typeof fontSupply.loadBundledFonts, 'function');
  const selected = await fontSupply.loadBundledFonts();
  assert.deepEqual(
    selected.fonts.map((f) => f.weight),
    [400, 500, 600, 700],
  );
  for (const font of selected.fonts) assert.equal(sha(font.bytes), font.sha256);
  assert.match(selected.license.bytes.toString('utf8'), /SIL OPEN FONT LICENSE/);
});
async function setup(t, diagram = serviceTopology()) {
  const base = new URL('../build/test-work/', import.meta.url);
  await fs.mkdir(base, { recursive: true });
  const root = await fs.mkdtemp(new URL('render space-', base));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const input = path.join(root, 'diagram.json'),
    bytes = Buffer.from(JSON.stringify(diagram, null, 2) + '\n');
  await fs.writeFile(input, bytes);
  return {
    root,
    diagram,
    input,
    bytes,
    plan: {
      type: diagram.diagram_type,
      input,
      inputSha256: sha(bytes),
      output: path.join(root, 'diagram.html'),
    },
  };
}
test('trusted edition adapts the private runtime before native validation', async (t) => {
  const f = await setup(t);
  assert.equal(typeof renderer.renderNativeDiagram, 'function');
  let called = false;
  const result = await renderer.renderNativeDiagram(
    {
      type: f.plan.type,
      inputBytes: f.bytes,
      output: f.plan.output,
    },
    async (runtime) => {
      called = true;
      const file = path.join(runtime, 'assets/template.html');
      const text = await fs.readFile(file, 'utf8');
      await fs.writeFile(file, text.replace('</head>', '<!-- trusted edition -->\n</head>'));
    },
  );
  assert.equal(called, true);
  assert.equal(result.nativeValidation.checksPassed, 9);
  assert.deepEqual(
    result.supplies.map(({ id }) => id),
    ['archify', 'runtime'],
  );
  const changed = await setup(t);
  const changedResult = await renderer.renderNativeDiagram(
    {
      type: changed.plan.type,
      inputBytes: changed.bytes,
      output: changed.plan.output,
    },
    async (runtime) => {
      const file = path.join(runtime, 'assets/template.html');
      const text = await fs.readFile(file, 'utf8');
      await fs.writeFile(
        file,
        text.replace('</head>', '<!-- another trusted edition -->\n</head>'),
      );
    },
  );
  assert.notEqual(
    result.supplies.find(({ id }) => id === 'runtime').sha256,
    changedResult.supplies.find(({ id }) => id === 'runtime').sha256,
  );
  assert.match(await fs.readFile(f.plan.output, 'utf8'), /trusted edition/);
});
test('private runtime adaptation cannot skip native validation or leak failed output', async (t) => {
  const f = await setup(t);
  assert.equal(typeof renderer.renderNativeDiagram, 'function');
  await assert.rejects(
    renderer.renderNativeDiagram(
      {
        type: f.plan.type,
        inputBytes: f.bytes,
        output: f.plan.output,
      },
      async (runtime) => {
        await fs.writeFile(path.join(runtime, 'assets/template.html'), '<html>invalid</html>');
      },
    ),
  );
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  assert.deepEqual(await fs.readdir(f.root), ['diagram.json']);
});
test('renders explicit non-ETHOS data through nine native showcase checks', async (t) => {
  const f = await setup(t);
  const r = await renderDiagram(f.plan);
  const bytes = await fs.readFile(f.plan.output);
  assert.equal(r.status, 'rendered');
  assert.equal(r.artifact.sha256, sha(bytes));
  assert.equal(r.inputSha256, sha(f.bytes));
  assert.equal(r.nativeValidation.checkCount, 9);
  assert.equal(r.nativeValidation.checksPassed, 9);
  assert.equal(r.nativeValidation.errors, 0);
  assert.equal(r.nativeValidation.warnings, 0);
  assert.deepEqual(
    r.supplies.map(({ id }) => id),
    ['archify', 'runtime', 'font-supply'],
  );
  assert(r.supplies.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)));
  assert.equal(r.browserAcceptance, 'not-performed');
  assert.equal(r.semanticAcceptance, 'not-performed');
  assert.match(bytes.toString(), /Order service/);
  assert.match(bytes.toString(), /<svg/);
  assert.equal(/<svg\b[^>]*role="group"/u.test(bytes.toString()), true);
  assert.deepEqual((await fs.readdir(f.root)).sort(), ['diagram.html', 'diagram.json']);
});
test('semantic architecture keeps interactive SVG children accessible', async (t) => {
  const f = await setup(t);
  const output = path.join(f.root, 'semantic.html');
  const scene = {
    schema: 'architecture.interactive-scene/v1',
    id: 'overview',
    title: 'Selected service',
    subtitle: 'One checked relation',
    viewport: { width: 960, height: 540 },
    nodes: [
      {
        id: 'source',
        label: 'Source',
        visualRole: 'external',
        position: { x: 70, y: 180 },
        size: { width: 220, height: 100 },
      },
      {
        id: 'target',
        label: 'Target',
        visualRole: 'backend',
        position: { x: 620, y: 180 },
        size: { width: 220, height: 100 },
      },
    ],
    groups: [],
    edges: [
      {
        id: 'source-target',
        from: 'source',
        to: 'target',
        label: 'hands off',
        visualRole: 'emphasis',
        fromSide: 'right',
        toSide: 'left',
        route: 'straight',
      },
    ],
  };
  await renderer.renderArchitectureScene({ scene, output });
  const html = await fs.readFile(output, 'utf8');
  assert.equal(/<svg\b[^>]*role="group"/u.test(html), true);
  assert.equal(/role="button"/u.test(html), true);
});
test('rejects changed input before creating output', async (t) => {
  const f = await setup(t);
  await assert.rejects(renderDiagram({ ...f.plan, inputSha256: '0'.repeat(64) }), {
    code: 'render_input_digest_mismatch',
  });
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('preserves existing output', async (t) => {
  const f = await setup(t);
  await fs.writeFile(f.plan.output, 'retained');
  await assert.rejects(renderDiagram(f.plan), { code: 'render_output_exists' });
  assert.equal(await fs.readFile(f.plan.output, 'utf8'), 'retained');
});
for (const [name, edit] of [
  [
    'repository',
    (d) => {
      d.meta.repository = {
        url: 'https://github.com/example/repo',
        revision: '1'.repeat(40),
      };
    },
  ],
  [
    'source evidence',
    (d) => {
      d.components[0].sources = [{ path: 'secret' }];
    },
  ],
  [
    'remote brand',
    (d) => {
      d.components[0].brand = {
        url: 'https://example.invalid/icon.svg',
        sha256: '0'.repeat(64),
      };
    },
  ],
  [
    'remote brand URL',
    (d) => {
      d.components[0].brand = 'https://example.invalid/icon.svg';
    },
  ],
])
  test(`rejects implicit ${name} before running native renderer`, async (t) => {
    const d = serviceTopology();
    edit(d);
    const f = await setup(t, d);
    await assert.rejects(renderDiagram(f.plan), {
      code: 'render_external_effect_unsupported',
    });
    assert.deepEqual(await fs.readdir(f.root), ['diagram.json']);
  });
test('rejects type mismatch and symlink input', async (t) => {
  const f = await setup(t);
  await assert.rejects(renderDiagram({ ...f.plan, type: 'lifecycle' }), {
    code: 'render_type_mismatch',
  });
  const link = path.join(f.root, 'link.json');
  await fs.symlink('diagram.json', link);
  await assert.rejects(renderDiagram({ ...f.plan, input: link }), {
    code: 'render_input_type_invalid',
  });
});
test('native schema rejection preserves diagnostics and produces no output', async (t) => {
  const d = serviceTopology();
  d.components[0].type = 'not-a-native-type';
  const f = await setup(t, d);
  await assert.rejects(
    renderDiagram(f.plan),
    (e) => e.code === 'render_native_rejected' && e.diagnostics.length > 0,
  );
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('delivered HTML embeds fonts and export fallback instead of reading CDN or system fonts', async (t) => {
  const f = await setup(t);
  await renderDiagram(f.plan);
  const html = await fs.readFile(f.plan.output, 'utf8');
  assert(!/<link\b[^>]*href=["']https?:/i.test(html));
  assert.equal((html.match(/data:font\/ttf;base64,/g) || []).length, 4);
  assert.match(html, /SIL OPEN FONT LICENSE/);
  assert.match(html, /getElementById\('architecture-font-supply'\)\.textContent/);
  assert(!html.includes("src: local('JetBrains Mono')"));
});
test('renders a distinct branching and retrying lifecycle, not renamed service nodes', async (t) => {
  const { jobLifecycle } = await import('./fixtures/diagrams.mjs');
  const f = await setup(t, jobLifecycle());
  const result = await renderDiagram(f.plan);
  const html = await fs.readFile(f.plan.output, 'utf8');
  assert.equal(result.type, 'lifecycle');
  assert.match(html, /Retry wait/);
  assert.match(html, /data-edge-from="wait"/);
  assert.match(html, /data-edge-to="run"/);
  assert.equal(result.nativeValidation.checksPassed, 9);
});
test('all additionally exposed native diagram protocols execute their checks', async (t) => {
  const { otherDiagramTypes } = await import('./fixtures/diagrams.mjs');
  for (const diagram of otherDiagramTypes()) {
    const f = await setup(t, diagram),
      r = await renderDiagram(f.plan);
    assert.equal(r.type, diagram.diagram_type);
    assert.equal(r.nativeValidation.checksPassed, 9);
  }
});
test('native geometry rejection cannot be replaced by successful schema validation', async (t) => {
  const d = serviceTopology();
  d.components[1].pos = [60, 150];
  const f = await setup(t, d);
  await assert.rejects(
    renderDiagram(f.plan),
    (e) =>
      e.code === 'render_native_rejected' && e.diagnostics.some((d) => /overlap/i.test(d.message)),
  );
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('rejects whitespace-prefixed remote brand instead of invoking network capture', async (t) => {
  const d = serviceTopology();
  d.components[0].brand = ' https://example.invalid/icon.svg ';
  const f = await setup(t, d);
  await assert.rejects(renderDiagram(f.plan), {
    code: 'render_external_effect_unsupported',
  });
});
test('standalone HTML carries upstream MIT attribution as well as the font license', async (t) => {
  const f = await setup(t);
  await renderDiagram(f.plan);
  const html = await fs.readFile(f.plan.output, 'utf8');
  assert(html.includes('Copyright (c) 2026 tt-a1i'));
  assert(html.includes('Permission is hereby granted, free of charge'));
});
test('a destination created during rendering remains untouched', async (t) => {
  const { Worker } = await import('node:worker_threads');
  const f = await setup(t);
  const worker = new Worker(
    `const {parentPort,workerData}=require('node:worker_threads');const fs=require('node:fs');const path=require('node:path');const until=Date.now()+5000;const timer=setInterval(()=>{if(fs.readdirSync(workerData.root).some(n=>n.startsWith('.architecture-render-'))){fs.writeFileSync(workerData.output,'arrived concurrently',{flag:'wx'});clearInterval(timer);parentPort.postMessage('written');}else if(Date.now()>until){clearInterval(timer);parentPort.postMessage('timeout');}},1);parentPort.postMessage('ready');`,
    { eval: true, workerData: { root: f.root, output: f.plan.output } },
  );
  t.after(() => worker.terminate());
  await new Promise((resolve, reject) => {
    worker.once('message', resolve);
    worker.once('error', reject);
  });
  await assert.rejects(renderDiagram(f.plan), { code: 'render_output_exists' });
  assert.equal(await fs.readFile(f.plan.output, 'utf8'), 'arrived concurrently');
  assert.deepEqual((await fs.readdir(f.root)).sort(), ['diagram.html', 'diagram.json']);
});
test('repeated rendering is deterministic and author updates change only new outputs', async (t) => {
  const f = await setup(t),
    first = await renderDiagram(f.plan);
  const second = await renderDiagram({
    ...f.plan,
    output: path.join(f.root, 'second.html'),
  });
  assert.equal(first.artifact.sha256, second.artifact.sha256);
  const prior = await fs.readFile(f.plan.output);
  const updated = serviceTopology();
  updated.meta.title = 'Order service with audit';
  const data = Buffer.from(JSON.stringify(updated));
  await fs.writeFile(f.input, data);
  const third = await renderDiagram({
    ...f.plan,
    inputSha256: sha(data),
    output: path.join(f.root, 'third.html'),
  });
  assert.notEqual(first.artifact.sha256, third.artifact.sha256);
  assert.deepEqual(await fs.readFile(f.plan.output), prior);
});

test('native renderer rejects malformed selection before loading supply or writing output', async (t) => {
  const f = await setup(t);
  const selected = { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output };
  for (const [plan, code] of [
    [null, 'render_type_unsupported'],
    [{ ...selected, type: 'unknown' }, 'render_type_unsupported'],
    [{ ...selected, inputBytes: 'not bytes' }, 'render_input_type_invalid'],
    [{ ...selected, inputBytes: Buffer.alloc(4 * 1024 * 1024 + 1) }, 'render_input_type_invalid'],
    [{ ...selected, output: 'relative.html' }, 'render_path_required'],
  ])
    await assert.rejects(
      renderer.renderNativeDiagram(plan, async () => {}),
      { code },
    );
  await assert.rejects(renderer.renderNativeDiagram(selected, null), {
    code: 'render_adaptation_required',
  });
  await assert.rejects(
    renderer.renderNativeDiagram({ ...selected, inputBytes: Buffer.from('{') }, async () => {}),
    {
      code: 'render_input_json_invalid',
    },
  );
  await assert.rejects(
    renderer.renderNativeDiagram({ ...selected, inputBytes: Buffer.from('{}') }, async () => {}),
    { code: 'render_type_mismatch' },
  );
  const noShowcase = structuredClone(f.diagram);
  delete noShowcase.meta.quality_profile;
  await assert.rejects(
    renderer.renderNativeDiagram(
      { ...selected, inputBytes: Buffer.from(JSON.stringify(noShowcase)) },
      async () => {},
    ),
    { code: 'render_showcase_required' },
  );
  await assert.rejects(
    renderer.renderNativeDiagram(
      { ...selected, output: path.join(f.root, 'absent', 'diagram.html') },
      async () => {},
    ),
    { code: 'render_output_parent_invalid' },
  );
  assert.deepEqual(await fs.readdir(f.root), ['diagram.json']);
});

test('public renderer rejects invalid digest and non-absolute paths before effects', async (t) => {
  const f = await setup(t);
  for (const [plan, code] of [
    [null, 'render_type_unsupported'],
    [{ ...f.plan, inputSha256: 'wrong' }, 'render_input_digest_required'],
    [{ ...f.plan, input: 'relative.json' }, 'render_path_required'],
    [{ ...f.plan, output: 'relative.html' }, 'render_path_required'],
  ])
    await assert.rejects(renderDiagram(plan), { code });
  await assert.rejects(renderer.renderArchitectureScene(null), {
    code: 'render_scene_plan_invalid',
  });
  assert.deepEqual(await fs.readdir(f.root), ['diagram.json']);
});

test('native renderer rejects adaptation receipts that misstate supplies', async (t) => {
  const f = await setup(t);
  const plan = { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output };
  for (const supplies of [
    'not-an-array',
    [null],
    [{ id: 'font', sha256: 'wrong' }],
    [{ id: 'archify', sha256: '0'.repeat(64) }],
    [{ id: 'font', sha256: '0'.repeat(64), extra: true }],
  ]) {
    await assert.rejects(
      renderer.renderNativeDiagram(plan, async () => ({ supplies })),
      {
        code: 'render_adaptation_receipt_invalid',
      },
    );
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  }
});

test('Archify supply faults never reach adaptation or create final HTML', async (t) => {
  const supplyRoot = fileURLToPath(
    new URL('../packages/publisher/renderers/archify/supply/', import.meta.url),
  );
  const manifest = path.join(supplyRoot, 'supply.json');
  const member = path.join(supplyRoot, 'renderers/shared/utils.mjs');
  const shared = path.join(supplyRoot, 'renderers/shared');
  const fakeEntry = (name, kind) => ({
    name,
    isSymbolicLink: () => kind === 'link',
    isDirectory: () => false,
    isFile: () => kind === 'file',
  });
  const corrupted = (value) => {
    const copy = Buffer.from(value);
    copy[0] ^= 1;
    return copy;
  };
  for (const [name, method, selected, alter] of [
    [
      'missing manifest',
      'lstat',
      (file) => file === manifest,
      () => {
        throw Error('gone');
      },
    ],
    [
      'unreadable manifest',
      'readFile',
      (file) => file === manifest,
      () => {
        throw Error('denied');
      },
    ],
    ['short manifest read', 'readFile', (file) => file === manifest, (value) => value.subarray(1)],
    ['changed manifest bytes', 'readFile', (file) => file === manifest, corrupted],
    ['changed selected member', 'readFile', (file) => file === member, corrupted],
    [
      'unlisted file',
      'readdir',
      (directory) => path.resolve(directory) === path.resolve(supplyRoot),
      (entries) => [...entries, fakeEntry('unlisted.txt', 'file')],
    ],
    [
      'linked entry',
      'readdir',
      (directory) => path.resolve(directory) === path.resolve(supplyRoot),
      (entries) => [...entries, fakeEntry('outside', 'link')],
    ],
    [
      'missing inventory member',
      'readdir',
      (directory) => path.resolve(directory) === shared,
      (entries) => entries.filter(({ name: entry }) => entry !== 'utils.mjs'),
    ],
  ])
    await t.test(name, async (caseTest) => {
      const f = await setup(caseTest);
      const original = fs[method].bind(fs);
      caseTest.mock.method(fs, method, async (target, ...rest) => {
        const value = await original(target, ...rest);
        return selected(target) ? alter(value) : value;
      });
      let adapted = false;
      await assert.rejects(
        renderer.renderNativeDiagram(
          { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output },
          async () => {
            adapted = true;
            return { supplies: [] };
          },
        ),
        { code: 'render_supply_invalid' },
      );
      assert.equal(adapted, false);
      await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
    });
});

test('untrusted native replies cannot mint a rendered artifact', async (t) => {
  for (const [name, source, code] of [
    ['malformed JSON', () => "process.stdout.write('{');", 'render_receipt_invalid'],
    [
      'rejection without diagnostics',
      () => `process.stdout.write(${JSON.stringify(JSON.stringify({ ok: false }))});`,
      'render_native_rejected',
    ],
    [
      'unbound success',
      () => `process.stdout.write(${JSON.stringify(JSON.stringify({ ok: true }))});`,
      'render_receipt_invalid',
    ],
    [
      'false artifact digest',
      (f) => {
        const receipt = {
          ok: true,
          command: 'deliver',
          type: f.plan.type,
          specification: { sha256: sha(f.bytes) },
          validation: {
            checkCount: 9,
            checksPassed: 9,
            compositionProfile: 'showcase',
            errors: 0,
            warnings: 0,
          },
          artifact: { sha256: '0'.repeat(64), bytes: 13 },
        };
        return `import fs from 'node:fs'; fs.writeFileSync(process.argv[5], '<html></html>'); process.stdout.write(${JSON.stringify(JSON.stringify(receipt))});`;
      },
      'render_artifact_invalid',
    ],
  ])
    await t.test(name, async (caseTest) => {
      const f = await setup(caseTest);
      await assert.rejects(
        renderer.renderNativeDiagram(
          { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output },
          async (native) => {
            await fs.writeFile(path.join(native, 'bin/archify.mjs'), source(f));
            return { supplies: [] };
          },
        ),
        { code },
      );
      await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
      assert.deepEqual(await fs.readdir(f.root), ['diagram.json']);
    });
});

test('adapted runtime inventory refuses non-regular members', async (t) => {
  for (const [name, kind] of [
    ['linked member', 'link'],
    ['special member', 'special'],
  ])
    await t.test(name, async (caseTest) => {
      const f = await setup(caseTest);
      const original = fs.readdir.bind(fs);
      caseTest.mock.method(fs, 'readdir', async (directory, ...rest) => {
        const entries = await original(directory, ...rest);
        if (!directory.includes('.architecture-render-') || path.basename(directory) !== 'runtime')
          return entries;
        return [
          ...entries,
          {
            name: 'unselected',
            isSymbolicLink: () => kind === 'link',
            isDirectory: () => false,
            isFile: () => false,
          },
        ];
      });
      let adapted = false;
      await assert.rejects(
        renderer.renderNativeDiagram(
          { type: f.plan.type, inputBytes: f.bytes, output: f.plan.output },
          async () => {
            adapted = true;
            return { supplies: [] };
          },
        ),
        { code: 'render_adaptation_receipt_invalid' },
      );
      assert.equal(adapted, true);
      await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
    });
});

test('font adaptation refuses a missing accessibility seam', async (t) => {
  const f = await setup(t);
  const original = fs.readFile.bind(fs);
  t.mock.method(fs, 'readFile', async (file, ...rest) => {
    const result = await original(file, ...rest);
    return typeof file === 'string' &&
      file.includes('.architecture-render-') &&
      file.endsWith(path.join('renderers', 'shared', 'cli.mjs'))
      ? result.replace('return `role="img" lang=', 'return `role="figure" lang=')
      : result;
  });
  await assert.rejects(renderDiagram(f.plan), { code: 'render_svg_accessibility_seam_invalid' });
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});

test('a linked output parent cannot redirect a final Archify artifact', async (t) => {
  if (process.platform === 'win32') {
    t.skip('symlink creation requires a separate native Windows privilege fixture');
    return;
  }
  const f = await setup(t);
  const destination = path.join(f.root, 'destination');
  const alias = path.join(f.root, 'alias');
  await fs.mkdir(destination);
  await fs.symlink(destination, alias);
  await assert.rejects(
    renderer.renderNativeDiagram(
      { type: f.plan.type, inputBytes: f.bytes, output: path.join(alias, 'diagram.html') },
      async () => ({ supplies: [] }),
    ),
    { code: 'render_output_parent_invalid' },
  );
  assert.deepEqual(await fs.readdir(destination), []);
});
