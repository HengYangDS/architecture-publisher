import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

const source = async (name) => fs.readFile(new URL(`./${name}`, import.meta.url), 'utf8');

test('nested npm preload is a file URL rather than a drive-qualified import specifier', async () => {
  const fixture = await source('npm-environment.test.mjs');
  assert.equal(/const preload = new URL\([^;]+\)\.href;/u.test(fixture), true);
});

test('Git slash paths are compared with canonical slash owner identities', async () => {
  const fixture = await source('ethos-source-owned-handoff.test.mjs');
  assert.equal(
    /const thisTest = path\.relative\([^;]+\)\.replaceAll\('\\\\', '\/'\);/u.test(fixture),
    true,
  );
  assert.equal(
    /path\.relative\(root, handoffPath\)\.replaceAll\('\\\\', '\/'\)/u.test(fixture),
    true,
  );
});

test('ambient LikeC4 fixture normalizes native separators before corrupting the source path', async () => {
  const fixture = await source('native-import.test.mjs');
  assert.equal(
    /file\.replaceAll\('\\\\', '\/'\)\.replace\('\/workspace\/', '\/ambient\/'\)/u.test(fixture),
    true,
  );
});

test('npm command test checks native Windows shims without requiring a POSIX symlink', async () => {
  const fixture = await source('product-identity.test.mjs');
  assert.equal(/process\.platform === 'win32'/u.test(fixture), true);
  assert.equal(/archpub\.cmd/u.test(fixture), true);
  assert.equal(/bin\/npm-cli\.js/u.test(fixture), true);
});

test('process interruption fixture matches the owner filename through the native path API', async () => {
  const fixture = await source('pair-files.test.mjs');
  assert.equal(/path\.basename\(a\)==='owner\.json'/u.test(fixture), true);
  assert.equal(/path\.basename\(b\)==='operation\.json'/u.test(fixture), true);
});
