import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
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
  assert.match(
    selected.license.bytes.toString('utf8'),
    /SIL OPEN FONT LICENSE/,
  );
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
      await fs.writeFile(
        file,
        text.replace('</head>', '<!-- trusted edition -->\n</head>'),
      );
    },
  );
  assert.equal(called, true);
  assert.equal(result.nativeValidation.checksPassed, 9);
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
        await fs.writeFile(
          path.join(runtime, 'assets/template.html'),
          '<html>invalid</html>',
        );
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
  assert.equal(r.browserAcceptance, 'not-performed');
  assert.equal(r.semanticAcceptance, 'not-performed');
  assert.match(bytes.toString(), /Order service/);
  assert.match(bytes.toString(), /<svg/);
  assert.deepEqual((await fs.readdir(f.root)).sort(), [
    'diagram.html',
    'diagram.json',
  ]);
});
test('rejects changed input before creating output', async (t) => {
  const f = await setup(t);
  await assert.rejects(
    renderDiagram({ ...f.plan, inputSha256: '0'.repeat(64) }),
    { code: 'render_input_digest_mismatch' },
  );
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
  assert.match(
    html,
    /getElementById\('architecture-font-supply'\)\.textContent/,
  );
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
      e.code === 'render_native_rejected' &&
      e.diagnostics.some((d) => /overlap/i.test(d.message)),
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
  assert.equal(
    await fs.readFile(f.plan.output, 'utf8'),
    'arrived concurrently',
  );
  assert.deepEqual((await fs.readdir(f.root)).sort(), [
    'diagram.html',
    'diagram.json',
  ]);
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
