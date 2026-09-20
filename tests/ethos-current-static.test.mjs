import test from 'node:test';
import assert from 'node:assert/strict';
import { readStaticArtifact } from '../packages/extensions/ethos/src/edition/static-artifact.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { writeSourceBundle } from '../packages/publisher/src/source/write.mjs';
import { compileEthosPoster } from '../packages/extensions/ethos/src/edition/poster.mjs';
import { sha256 } from '../packages/extensions/ethos/src/adapter/projection.mjs';

test('candidate static intake requires exact review binding before reading selected artifacts', async () => {
  await assert.rejects(
    readStaticArtifact(
      {
        manifestPath: '/absent/manifest.json',
        sha256: '1'.repeat(64),
        poster: {},
      },
      {},
      { staticManifestSha256: '2'.repeat(64) },
    ),
    /Current static review identity/,
  );
});

test('candidate static intake never accepts old retained review as new-edition review', async () => {
  await assert.rejects(
    readStaticArtifact(
      {
        manifestPath: '/absent/manifest.json',
        sha256: '1'.repeat(64),
        poster: {},
      },
      {},
      { retainedStaticSubject: { files: [] } },
    ),
    /Current static review identity/,
  );
});

test('current static reader recomputes the real scene and rejects coordinated record drift', async (t) => {
  const root = path.resolve(import.meta.dirname, '..'),
    base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'current-static-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const source = {
    sourceManifest: path.join(
      root,
      'tests/fixtures/ethos-source/manifest.json',
    ),
    sourceSha256:
      '58121ad168a314af94b55f557435ffb7d9828ca7c476411f18467731ae9d1db0',
    projectionDigest:
      '4ea40f421434106948f1e1d2d9ae5ee6c8b9868edc5538ff755876fd01d37ef8',
  };
  const authoring = path.join(root, 'packages/extensions/ethos/src/edition/static/authoring');
  const editionManifest = path.join(authoring, 'manifest.json');
  const poster = {
    ...source,
    editionManifest,
    editionSha256: sha256(await fs.readFile(editionManifest)),
  };
  const c = await compileEthosPoster({
    ...poster,
    output: path.join(dir, 'unused'),
  });
  const encoded = (x) => Buffer.from(JSON.stringify(x));
  const members = [
    { path: 'native/terminal.svg', content: c.svg },
    {
      path: 'native/terminal.html',
      content: Buffer.from('unqualified test reader'),
    },
    { path: 'scene.json', content: encoded(c.scene) },
    { path: 'composition.json', content: encoded(c.composition) },
    { path: 'checks.json', content: encoded(c.result) },
    ...['outline.json', 'raster.json', 'reproduction.json'].map((path) => ({
      path,
      content: encoded({}),
    })),
    { path: 'outlined.svg', content: Buffer.from('<svg/>') },
    ...[1600, 2400, 6000].map((w) => ({
      path: `native/terminal-${w}.png`,
      content: Buffer.from('not qualified raster'),
    })),
  ];
  const good = await writeSourceBundle(
    path.join(dir, 'selected'),
    { id: 'test:current-static', revision: 'test' },
    members,
  );
  const select = (m) => ({
    manifestPath: m.manifestPath,
    sha256: m.manifestSha256,
    poster,
  });
  const review = (m) => ({
    semanticAcceptance: 'bounded-current-review',
    staticManifestSha256: m.manifestSha256,
  });
  await assert.rejects(
    readStaticArtifact(select(good), source, review(good)),
    /Candidate outline source differs/,
  );
  for (const [name, edit] of [
    [
      'scene.json',
      (x) => {
        x.texts[0].text = 'changed';
      },
    ],
    [
      'checks.json',
      (x) => {
        x.labels = 1;
      },
    ],
    [
      'composition.json',
      (x) => {
        x.document.labels[0].text = 'changed';
      },
    ],
  ]) {
    const next = members.map((m) => ({ ...m }));
    const member = next.find((m) => m.path === name),
      value = JSON.parse(member.content);
    edit(value);
    member.content = encoded(value);
    const changed = await writeSourceBundle(
      path.join(dir, name.replace('.json', '')),
      { id: 'test:current-static', revision: 'test' },
      next,
    );
    await assert.rejects(
      readStaticArtifact(select(changed), source, review(changed)),
      /recompiled evidence mismatch/,
    );
  }
});
