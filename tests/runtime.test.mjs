import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as runtime from 'architecture-publisher/runtime';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readPublisherRuntime = runtime.readPublisherRuntime;
const packageRoot = fileURLToPath(new URL('../packages/publisher/', import.meta.url));

async function declaredMembers(root) {
  const members = [];
  async function collect(directory, prefix) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const relative = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) await collect(path.join(directory, entry.name), relative);
      else {
        const content = await fs.readFile(path.join(directory, entry.name));
        members.push({ path: relative, bytes: content.length, sha256: sha256(content) });
      }
    }
  }
  for (const directory of ['src', 'renderers', 'supplies'])
    await collect(path.join(root, directory), directory);
  for (const memberPath of ['package.json', 'README.md']) {
    const content = await fs.readFile(path.join(root, memberPath));
    members.push({ path: memberPath, bytes: content.length, sha256: sha256(content) });
  }
  return members.sort((left, right) =>
    Buffer.compare(Buffer.from(left.path, 'utf8'), Buffer.from(right.path, 'utf8')),
  );
}

test('the public runtime reader returns one sorted exact installed closure', async () => {
  const members = await readPublisherRuntime();
  const paths = members.map((member) => member.path);

  assert.deepEqual(
    paths,
    [...paths].sort((left, right) => left.localeCompare(right)),
  );
  assert(paths.includes('package.json'));
  assert(paths.includes('src/index.mjs'));
  assert(paths.some((member) => member.startsWith('renderers/')));

  for (const member of members) {
    assert.equal(path.isAbsolute(member.path), false);
    const bytes = await fs.readFile(member.file);
    assert.equal(member.bytes, bytes.length, member.path);
    assert.equal(member.sha256, sha256(bytes), member.path);
  }
});

test('installed package content identity includes supplies and README without claiming archive bytes', async (t) => {
  assert.equal(typeof runtime.readPublisherInstalledPackage, 'function');
  const first = await runtime.readPublisherInstalledPackage();
  assert.equal(first.schema, 'architecture.publisher-installed-package/v1');
  assert.equal(first.name, 'architecture-publisher');
  assert.equal(first.scope, 'current-invocation-installed-content');
  assert.equal(first.method, 'declared-package-tree-sha256/v1');
  assert.match(first.treeSha256, /^[a-f0-9]{64}$/u);
  assert(first.files > (await readPublisherRuntime()).length);
  assert.equal(
    first.treeSha256,
    sha256(Buffer.from(JSON.stringify(await declaredMembers(packageRoot)))),
  );

  const temp = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-package-id-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const copy = path.join(temp, 'publisher');
  await fs.cp(packageRoot, copy, { recursive: true });
  const relocated = await import(pathToFileURL(path.join(copy, 'src/runtime.mjs')).href);
  assert.deepEqual(await relocated.readPublisherInstalledPackage(), first);
  await fs.appendFile(path.join(copy, 'README.md'), '\nPackage-only note.\n');
  const readmeChanged = await relocated.readPublisherInstalledPackage();
  assert.notEqual(readmeChanged.treeSha256, first.treeSha256);
  await fs.appendFile(path.join(copy, 'supplies/implementation.json'), '\n');
  const supplyChanged = await relocated.readPublisherInstalledPackage();
  assert.notEqual(supplyChanged.treeSha256, readmeChanged.treeSha256);
  await fs.writeFile(path.join(copy, 'supplies/\uE000.txt'), 'private-use');
  await fs.writeFile(path.join(copy, 'supplies/\u{10000}.txt'), 'supplementary');
  const unicodeMembers = await declaredMembers(copy);
  assert.equal(
    (await relocated.readPublisherInstalledPackage()).treeSha256,
    sha256(Buffer.from(JSON.stringify(unicodeMembers))),
  );
  const externalSupplies = path.join(temp, 'external-supplies');
  await fs.rename(path.join(copy, 'supplies'), externalSupplies);
  await fs.symlink(externalSupplies, path.join(copy, 'supplies'), 'dir');
  await assert.rejects(relocated.readPublisherInstalledPackage(), {
    message: 'Publisher runtime symlink',
  });
});
