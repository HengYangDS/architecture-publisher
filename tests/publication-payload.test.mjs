import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { planEthosPublication } from '../packages/extensions/ethos/src/edition/publication.mjs';

const selected = process.env.ETHOS_QUALIFIED_PAIR_PLAN;

test('reader payload excludes qualification while retaining complete effect-time dependencies', { skip: !selected }, async (t) => {
  const work = new URL('../build/test-work/', import.meta.url);
  await fs.mkdir(work, { recursive: true });
  const temporary = await fs.mkdtemp(new URL('payload-', work));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const input = JSON.parse(await fs.readFile(selected));
  input.deployment = {
    destinations: {
      static: path.join(temporary, 'static'),
      interactive: path.join(temporary, 'interactive'),
    },
    recoveryRoot: path.join(temporary, 'recovery'),
  };
  const result = await planEthosPublication(input);
  const payload = result.filePlan.payload;
  assert(!payload.some(f => f.path.startsWith('evidence/')), 'Forensic evidence must not be reader payload');
  assert.deepEqual(payload.filter(f => f.medium === 'native').map(f => f.path).sort(), [
    'terminal/native/terminal-1600.png', 'terminal/native/terminal-2400.png',
    'terminal/native/terminal-6000.png', 'terminal/native/terminal.html', 'terminal/native/terminal.svg',
  ].sort());
  assert.equal(payload.filter(f => f.medium === 'atlas' && f.path.endsWith('.html')).length, 13);
  const deps = new Map(result.filePlan.dependencies.map(x => [x.file, x.sha256]));
  for (const item of [...input.browser.reports, input.browser.checker, ...input.review.evidenceBundles, input.staticArtifact]) {
    assert.equal(deps.get(item.manifestPath), item.sha256);
    const manifest = JSON.parse(await fs.readFile(item.manifestPath));
    for (const f of manifest.files) assert.equal(deps.get(path.join(path.dirname(item.manifestPath), f.path)), f.sha256);
  }
  assert.equal(result.qualification.browser.reports.length, 4);
  assert(payload.reduce((sum, f) => sum + f.bytes, 0) < 36 * 1024 * 1024);
});
