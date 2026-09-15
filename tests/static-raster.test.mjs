import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { writeSourceBundle } from '../src/source/write.mjs';
import { validateSvg } from '../src/static/svg.mjs';
import { RASTER_LIMITS } from '../src/static/limits.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const shape =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="#f5f3ed"/><path d="M 20 50 H 180" stroke="#29372f" stroke-width="3"/></svg>';
const withText = (text) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100"><rect width="240" height="100" fill="#f5f3ed"/><text x="16" y="56" font-family="JetBrains Mono" font-size="20" fill="#29372f">${text}</text></svg>`;
async function api() {
  const entry = new URL('../src/static/raster.mjs', import.meta.url);
  await assert.doesNotReject(
    fs.access(entry),
    'public raster implementation exists',
  );
  return (await import(entry)).rasterize;
}
async function setup(t, svg = shape, fonts = false) {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'raster space-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const members = [{ path: 'figure.svg', content: Buffer.from(svg) }];
  const selection = [];
  if (fonts) {
    members.push({
      path: 'fonts/regular.ttf',
      content: await fs.readFile(
        path.join(root, 'assets/fonts/JetBrainsMono-Regular.ttf'),
      ),
    });
    selection.push({
      path: 'fonts/regular.ttf',
      family: 'JetBrains Mono',
      weight: 400,
    });
  }
  const bundle = await writeSourceBundle(
    path.join(dir, 'input'),
    { id: 'diagram:test', revision: 'r1' },
    members,
  );
  return {
    dir,
    plan: {
      manifest: bundle.manifestPath,
      manifestSha256: bundle.manifestSha256,
      svg: 'figure.svg',
      fonts: selection,
      width: 800,
      output: path.join(dir, 'figure.png'),
    },
  };
}
test('rasterizes an explicit shape-only SVG without fonts or interactive dependencies', async (t) => {
  const f = await setup(t),
    rasterize = await api(),
    r = await rasterize(f.plan);
  const png = await fs.readFile(f.plan.output);
  assert.equal(r.status, 'rendered');
  assert.equal(r.width, 800);
  assert.equal(r.height, 400);
  assert.equal(r.artifact.sha256, hash(png));
  assert.deepEqual(
    png.subarray(0, 8),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  assert.equal(png.readUInt32BE(16), 800);
  assert.equal(png.readUInt32BE(20), 400);
  assert.equal(r.browserAcceptance, 'not-performed');
  assert.equal(r.semanticAcceptance, 'not-performed');
  assert.deepEqual((await fs.readdir(f.dir)).sort(), ['figure.png', 'input']);
});
test('rasterizes supplied font bytes and changes output after authored text update', async (t) => {
  const a = await setup(t, withText('Verify'), true),
    b = await setup(t, withText('Observe'), true),
    rasterize = await api();
  const first = await rasterize(a.plan),
    second = await rasterize(b.plan);
  assert.notEqual(first.artifact.sha256, second.artifact.sha256);
  const repeated = await rasterize({
    ...a.plan,
    output: path.join(a.dir, 'repeat.png'),
  });
  assert.equal(first.artifact.sha256, repeated.artifact.sha256);
});
test('supports internal gradient, clipping and use references', async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><linearGradient id="g"><stop offset="0" stop-color="#29372f"/><stop offset="1" stop-color="#b9bfb2"/></linearGradient><path id="line" d="M 10 20 H 80"/><clipPath id="clip"><rect width="90" height="90"/></clipPath></defs><rect width="100" height="100" fill="url(#g)"/><use href="#line" stroke="#fff" clip-path="url(#clip)"/></svg>';
  const f = await setup(t, svg),
    rasterize = await api();
  assert.equal((await rasterize(f.plan)).width, 800);
});
for (const body of [
  '<rect width="20" height="20" fill="not-a-color"/>',
  '<path d="M0 0 L"/>',
  '<g transform="translate(banana)"/>',
  '<path stroke-width="NaN"/>',
  '<path stroke-linecap="triangle"/>',
]) {
  test(`invalid SVG value never publishes a PNG: ${body}`, async (t) => {
    const f = await setup(t, shape.replace('</svg>', body + '</svg>'));
    await assert.rejects((await api())(f.plan), {
      code: 'raster_svg_value_invalid',
    });
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
    assert.deepEqual(await fs.readdir(f.dir), ['input']);
  });
}
for (const [name, svg] of [
  ['script', shape.replace('</svg>', '<script>alert(1)</script></svg>')],
  ['event handler', shape.replace('<rect', '<rect onclick="run()"')],
  [
    'external use',
    shape.replace('</svg>', '<use href="file:///private/input.svg#x"/></svg>'),
  ],
  [
    'entity-encoded external reference',
    shape.replace(
      '</svg>',
      '<use href="&#104;ttps://example.invalid/x.svg#x"/></svg>',
    ),
  ],
  [
    'stylesheet',
    shape.replace('</svg>', '<style>rect{fill:red}</style></svg>'),
  ],
  [
    'embedded HTML',
    shape.replace(
      '</svg>',
      '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject></svg>',
    ),
  ],
  [
    'animation',
    shape.replace(
      '</svg>',
      '<animate attributeName="opacity" values="0;1"/></svg>',
    ),
  ],
  ['DTD', '<!DOCTYPE svg SYSTEM "file:///private/source">' + shape],
  [
    'processing instruction',
    '<?xml-stylesheet href="https://example.invalid/style.css"?>' + shape,
  ],
  [
    'image',
    shape.replace('</svg>', '<image href="data:image/png;base64,AA=="/></svg>'),
  ],
  [
    'external CSS paint',
    shape.replace(
      'fill="#f5f3ed"',
      'fill="url(https://example.invalid/paint)"',
    ),
  ],
  ['inline CSS', shape.replace('<rect', '<rect style="fill:red"')],
  [
    'foreign namespace',
    shape.replace(
      '</svg>',
      '<x:path xmlns:x="urn:unknown" d="M0 0 H10"/></svg>',
    ),
  ],
  ['malformed XML', shape.replace('</svg>', '</g>')],
  [
    'unbound internal reference',
    shape.replace('</svg>', '<use href="#absent"/></svg>'),
  ],
  [
    'duplicate identity',
    shape.replace('</svg>', '<g id="same"/><g id="same"/></svg>'),
  ],
  [
    'cyclic use',
    shape.replace(
      '</svg>',
      '<defs><g id="cycle"><use href="#cycle"/></g></defs><use href="#cycle"/></svg>',
    ),
  ],
])
  test(`rejects ${name} instead of silently dropping it`, async (t) => {
    const f = await setup(t, svg),
      rasterize = await api();
    await assert.rejects(rasterize(f.plan));
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  });
test('preserves explicit font declarations inside a referenced group', async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><defs><g id="caption" font-family="JetBrains Mono"><text x="10" y="50">Verify</text></g></defs><use href="#caption" font-family="Missing"/></svg>';
  const f = await setup(t, svg, true),
    rasterize = await api();
  assert.equal((await rasterize(f.plan)).status, 'rendered');
});
test('checks referenced text in the instance font context, not the definition ancestors', async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" font-family="JetBrains Mono"><defs font-weight="400"><g id="caption"><text x="10" y="50">Verify</text></g></defs><use href="#caption" font-weight="700"/></svg>';
  const f = await setup(t, svg, true),
    rasterize = await api();
  await assert.rejects(rasterize(f.plan), { code: 'raster_font_unbound' });
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('resolves nested text instances from explicitly selected use fonts', async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><defs><g id="caption"><text x="10" y="50">Verify</text></g><g id="nested"><use href="#caption"/></g></defs><use href="#nested" font-family="JetBrains Mono"/></svg>';
  const direct =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="10" y="50" font-family="JetBrains Mono">Verify</text></svg>';
  const a = await setup(t, svg, true),
    b = await setup(t, direct, true),
    rasterize = await api();
  assert.equal(
    (await rasterize(a.plan)).artifact.sha256,
    (await rasterize(b.plan)).artifact.sha256,
  );
});
test('checks every text instance even when another instance already passed', async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" font-family="JetBrains Mono"><defs><text id="caption" x="10" y="50">Verify</text></defs><use href="#caption"/><use href="#caption" font-weight="700"/></svg>';
  const f = await setup(t, svg, true),
    rasterize = await api();
  await assert.rejects(rasterize(f.plan), { code: 'raster_font_unbound' });
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('rejects undeclared font families inherited through use', async (t) => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><defs font-family="JetBrains Mono"><text id="caption" x="10" y="50">Verify</text></defs><use href="#caption" font-family="Missing"/></svg>';
  const f = await setup(t, svg, true),
    rasterize = await api();
  await assert.rejects(rasterize(f.plan), { code: 'raster_font_unbound' });
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('bounds SVG bytes, nesting, elements and reference chains before rendering', () => {
  const base = (body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">${body}</svg>`;
  const check = (svg) => validateSvg(Buffer.from(svg), [], 800);
  assert.throws(
    () => validateSvg(Buffer.alloc(RASTER_LIMITS.svgBytes + 1), [], 800),
    { code: 'raster_svg_size_exceeded' },
  );
  assert.throws(
    () =>
      check(
        base(
          '<g>'.repeat(RASTER_LIMITS.depth) +
            '</g>'.repeat(RASTER_LIMITS.depth),
        ),
      ),
    { code: 'raster_svg_limit' },
  );
  assert.throws(() => check(base('<g/>'.repeat(RASTER_LIMITS.elements))), {
    code: 'raster_svg_limit',
  });
  // Reverse references catch a cached-subgraph traversal that checks only
  // current recursion depth rather than the longest expanded path.
  const chain = [
    '<g id="n0"/>',
    ...Array.from(
      { length: RASTER_LIMITS.referenceDepth + 1 },
      (_, i) => `<use id="n${i + 1}" href="#n${i}"/>`,
    ),
  ];
  assert.throws(() => check(base('<defs>' + chain.join('') + '</defs>')), {
    code: 'raster_svg_limit',
  });
});
test('rejects excessive pixel area and retains a valid large canvas bound', () => {
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M0 0 H100"/></svg>',
  );
  assert.throws(() => validateSvg(svg, [], 8192), {
    code: 'raster_dimensions_invalid',
  });
  assert.equal(validateSvg(svg, [], 4096).height, 4096);
});
test('rejects absent font, missing glyph, mismatched family and missing weight', async (t) => {
  const rasterize = await api();
  for (const [text, fonts, change] of [
    ['Verify', false, (p) => p],
    ['问道', true, (p) => p],
    [
      'Verify',
      true,
      (p) => {
        p.fonts[0].family = 'Unrelated';
        return p;
      },
    ],
    [
      'Verify',
      true,
      (p) => {
        p.fonts[0].weight = 600;
        return p;
      },
    ],
  ]) {
    const f = await setup(t, withText(text), fonts);
    await assert.rejects(rasterize(change(f.plan)));
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  }
});
test('rejects extra plan fields and invalid dimensions before output', async (t) => {
  const f = await setup(t),
    rasterize = await api();
  for (const p of [
    { ...f.plan, plugin: './arbitrary.mjs' },
    ...[0, -1, 1.5, 8193, Infinity].map((width) => ({ ...f.plan, width })),
  ])
    await assert.rejects(rasterize(p));
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  const tall = await setup(
    t,
    shape.replace('height="100"', 'height="1000000"'),
  );
  await assert.rejects(rasterize(tall.plan));
});
test('rejects changed bundle and missing SVG member', async (t) => {
  const f = await setup(t),
    rasterize = await api();
  await assert.rejects(
    rasterize({ ...f.plan, manifestSha256: '0'.repeat(64) }),
  );
  await assert.rejects(rasterize({ ...f.plan, svg: 'absent.svg' }));
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});
test('preserves occupied output and rejects symlink parent', async (t) => {
  const f = await setup(t),
    rasterize = await api();
  await fs.writeFile(f.plan.output, 'keep');
  await assert.rejects(rasterize(f.plan), { code: 'raster_output_exists' });
  assert.equal(await fs.readFile(f.plan.output, 'utf8'), 'keep');
  const link = path.join(f.dir, 'link');
  await fs.symlink(f.dir, link);
  await assert.rejects(
    rasterize({ ...f.plan, output: path.join(link, 'new.png') }),
    { code: 'raster_output_parent_invalid' },
  );
});
test('inherits explicitly selected fonts and resolves bold only to supplied weight', async (t) => {
  const svg = withText('Verify')
    .replace('font-family="JetBrains Mono"', '')
    .replace('<text', '<g font-family="JetBrains Mono"><text')
    .replace('</text>', '</text></g>');
  const f = await setup(t, svg, true),
    rasterize = await api();
  assert.equal((await rasterize(f.plan)).status, 'rendered');
  const bold = await setup(
    t,
    svg.replace('<text', '<text font-weight="bold"'),
    true,
  );
  await assert.rejects(rasterize(bold.plan), { code: 'raster_font_unbound' });
});
test('concurrently arriving output is preserved', async (t) => {
  const { Worker } = await import('node:worker_threads');
  const f = await setup(t),
    rasterize = await api();
  const worker = new Worker(
    `
    const {parentPort,workerData}=require('node:worker_threads'),fs=require('node:fs');
    const deadline=Date.now()+10000;
    const timer=setInterval(()=>{
      if(fs.readdirSync(workerData.dir).some(n=>n.startsWith('.architecture-raster-'))){
        fs.writeFileSync(workerData.output,'concurrent owner',{flag:'wx'});
        clearInterval(timer);parentPort.postMessage('written');
      }else if(Date.now()>deadline){clearInterval(timer);parentPort.postMessage('timeout');}
    },1);parentPort.postMessage('ready');
  `,
    { eval: true, workerData: { dir: f.dir, output: f.plan.output } },
  );
  t.after(() => worker.terminate());
  await new Promise((resolve, reject) => {
    worker.once('message', resolve);
    worker.once('error', reject);
  });
  await assert.rejects(rasterize(f.plan), { code: 'raster_output_exists' });
  assert.equal(await fs.readFile(f.plan.output, 'utf8'), 'concurrent owner');
  assert.deepEqual((await fs.readdir(f.dir)).sort(), ['figure.png', 'input']);
});
