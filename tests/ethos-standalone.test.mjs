import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const sha = (b) => createHash('sha256').update(b).digest('hex');
async function api() {
  const m = await import('../editions/ethos/standalone.mjs').catch(() => ({}));
  assert.equal(
    typeof m.composeStandaloneAtlas,
    'function',
    'standalone composer exists',
  );
  return m.composeStandaloneAtlas;
}
const page = (title, link) =>
  Buffer.from(
    `<!DOCTYPE html><html lang="en"><head><title>${title}</title><style>body{color:#29372f}</style></head><body><svg><text>${title}</text></svg><a href="${link}">Next</a><script>window.test=true</script></body></html>`,
  );
function fixture() {
  const pages = [
    ['overview', 'index.html', page('Overview', 'resources/lane/index.html')],
    ['lane', 'resources/lane/index.html', page('Lane', '../../index.html')],
  ];
  return {
    source: {
      commit: '1'.repeat(40),
      projectionDigest: 'a'.repeat(64),
      manifestSha256: 'b'.repeat(64),
    },
    pages: pages.map(([id, path, content]) => ({
      id,
      path,
      sha256: sha(content),
    })),
    members: [
      ...pages.map(([, path, content]) => ({ path, content })),
      { path: 'ARCHIFY-LICENSE.txt', content: Buffer.from('Original license') },
      { path: 'FONT-LICENSE.txt', content: Buffer.from('Font license') },
    ],
  };
}
test('single file retains all original page bytes through lossless shared block packing', async () => {
  const compose = await api(),
    f = fixture(),
    html = compose(f);
  const m = html.match(
    /<script id="atlas-data" type="application\/json">([\s\S]*?)<\/script>/,
  );
  assert(m);
  const d = JSON.parse(m[1]);
  assert.deepEqual(
    Object.keys(d.pages).sort(),
    f.pages.map((p) => p.path).sort(),
  );
  for (const p of f.pages) {
    const b = Buffer.from(
      d.pages[p.path].pieces
        .map((x) => (typeof x === 'number' ? d.blocks[x] : x))
        .join(''),
    );
    assert.equal(sha(b), p.sha256);
  }
  assert(html.includes('Original license'));
  assert(html.includes('Font license'));
  assert(html.includes('frame.srcdoc'));
  assert(html.includes('popstate'));
});
test('standalone rejects missing local pages and changed selected bytes', async () => {
  const compose = await api(),
    f = fixture();
  f.pages[0].sha256 = '0'.repeat(64);
  assert.throws(() => compose(f), /identity/);
  const g = fixture();
  g.pages.pop();
  g.members = g.members.filter((m) => m.path !== 'resources/lane/index.html');
  assert.throws(() => compose(g), /page/);
});
test('embedded source cannot terminate the JSON data block', async () => {
  const compose = await api(),
    f = fixture(),
    p = f.pages[0],
    m = f.members[0];
  m.content = Buffer.concat([
    m.content,
    Buffer.from('<!-- </script><script>notExecutable()</script> -->'),
  ]);
  p.sha256 = sha(m.content);
  const html = compose(f);
  const data = html.match(
    /<script id="atlas-data" type="application\/json">([\s\S]*?)<\/script>/,
  )[1];
  assert(!data.includes('<'));
  assert(JSON.parse(data));
});
