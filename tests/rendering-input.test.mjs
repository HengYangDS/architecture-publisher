import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  measureTypographyInput,
  renderInteractiveInput,
  renderRasterInput,
} from '../packages/publisher/src/rendering/input.mjs';

async function fixture(t) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'archpub-render-')));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const write = async (name, value) => {
    const file = path.join(root, name);
    await fs.writeFile(file, typeof value === 'string' ? value : JSON.stringify(value) + '\n');
    return file;
  };
  return { root, write };
}

test('rendering input rejects malformed and incomplete raster requests', async (t) => {
  const { root, write } = await fixture(t);
  await assert.rejects(renderRasterInput(await write('malformed.json', '{')), {
    code: 'raster_plan_invalid',
  });
  await assert.rejects(renderRasterInput(await write('missing.json', { manifest: 'image.json' })), {
    code: 'raster_plan_invalid',
  });
  await assert.rejects(renderRasterInput(await write('empty.json', { manifest: '', output: '' })), {
    code: 'raster_plan_invalid',
  });
  await fs.symlink(path.join(root, 'missing.json'), path.join(root, 'linked.json'));
  await assert.rejects(renderRasterInput(path.join(root, 'linked.json')), /symlink|link/i);
});

test('typography input requires explicit compiler, SDK, fonts and output paths', async (t) => {
  const { write } = await fixture(t);
  await assert.rejects(measureTypographyInput(await write('malformed.json', '{')), {
    code: 'measurement_plan_invalid',
  });
  await assert.rejects(measureTypographyInput(await write('missing.json', { fonts: [] })), {
    code: 'measurement_plan_invalid',
  });
  await assert.rejects(
    measureTypographyInput(
      await write('compiler.json', {
        compiler: { path: '' },
        sdk: { path: 'sdk' },
        fonts: [],
        output: 'measured.json',
      }),
    ),
    { code: 'measurement_plan_invalid' },
  );
  await assert.rejects(
    measureTypographyInput(
      await write('font.json', {
        compiler: { path: 'compiler' },
        sdk: { path: 'sdk' },
        fonts: [null],
        output: 'measured.json',
      }),
    ),
    { code: 'measurement_plan_invalid' },
  );
});

test('interactive rendering adapts explicit paths without manufacturing input', async (t) => {
  const { root } = await fixture(t);
  await assert.rejects(
    renderInteractiveInput(
      'flowchart',
      path.join(root, 'missing.json'),
      'a'.repeat(64),
      path.join(root, 'out.html'),
    ),
  );
  await assert.rejects(fs.stat(path.join(root, 'out.html')), { code: 'ENOENT' });
});

test('valid adapter shapes reach their selected renderer without ambient substitution', async (t) => {
  const { root, write } = await fixture(t);
  const raster = await write('raster.json', {
    manifest: 'missing-manifest.json',
    manifestSha256: 'a'.repeat(64),
    svg: 'overview.svg',
    fonts: [],
    width: 16,
    output: 'out.png',
  });
  await assert.rejects(renderRasterInput(raster), { code: 'ENOENT' });
  await assert.rejects(fs.stat(path.join(root, 'out.png')), { code: 'ENOENT' });

  const invalidFont = await write('invalid-font.json', {
    compiler: { path: 'compiler' },
    sdk: { path: 'sdk' },
    fonts: [{ path: '' }],
    output: 'measured.json',
  });
  await assert.rejects(measureTypographyInput(invalidFont), {
    code: 'measurement_plan_invalid',
  });

  const selected = await write('selected.json', {
    compiler: { path: 'compiler' },
    sdk: { path: 'sdk' },
    fonts: [{ path: 'font' }],
    output: 'measured.json',
  });
  await assert.rejects(measureTypographyInput(selected), (error) =>
    ['coretext_plan_invalid', 'coretext_platform_unsupported'].includes(error.code),
  );
});
