import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Return the installed package identity from its single package manifest. */
export async function readPublisherIdentity() {
  const value = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    value.name !== 'architecture-publisher' ||
    typeof value.version !== 'string' ||
    !value.version
  )
    throw Error('Publisher package identity invalid');
  return Object.freeze({ name: value.name, version: value.version });
}

async function visit(directory, prefix, members) {
  const stat = await fs.lstat(directory);
  if (stat.isSymbolicLink()) throw Error('Publisher runtime symlink');
  if (!stat.isDirectory()) throw Error('Unsupported publisher runtime member');
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw Error('Publisher runtime symlink');
    if (entry.isDirectory()) await visit(file, relative, members);
    else if (entry.isFile()) {
      const bytes = await fs.readFile(file);
      members.push({ file, path: relative, bytes: bytes.length, sha256: sha256(bytes) });
    } else throw Error('Unsupported publisher runtime member');
  }
}

async function regularMember(file, relative) {
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Publisher package member invalid');
  const bytes = await fs.readFile(file);
  if (bytes.length !== stat.size) throw Error('Publisher package member changed');
  return { path: relative, bytes: bytes.length, sha256: sha256(bytes) };
}

/** Return the exact installed product closure without exposing layout assumptions. */
export async function readPublisherRuntime() {
  const members = [];
  for (const directory of ['src', 'renderers'])
    await visit(path.join(root, directory), directory, members);
  const manifest = path.join(root, 'package.json');
  const bytes = await fs.readFile(manifest);
  members.push({
    file: manifest,
    path: 'package.json',
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
  return members.sort((left, right) => left.path.localeCompare(right.path));
}

/** Fingerprint the complete declared installed package content, not archive bytes or its original builder. */
export async function readPublisherInstalledPackage() {
  const identity = await readPublisherIdentity();
  const members = (await readPublisherRuntime()).map(({ path: member, bytes, sha256: digest }) => ({
    path: member,
    bytes,
    sha256: digest,
  }));
  const supplies = [];
  await visit(path.join(root, 'supplies'), 'supplies', supplies);
  members.push(
    ...supplies.map(({ path: member, bytes, sha256: digest }) => ({
      path: member,
      bytes,
      sha256: digest,
    })),
  );
  members.push(await regularMember(path.join(root, 'README.md'), 'README.md'));
  members.sort((left, right) =>
    Buffer.compare(Buffer.from(left.path, 'utf8'), Buffer.from(right.path, 'utf8')),
  );
  return Object.freeze({
    schema: 'architecture.publisher-installed-package/v1',
    name: identity.name,
    version: identity.version,
    treeSha256: sha256(Buffer.from(JSON.stringify(members))),
    files: members.length,
    bytes: members.reduce((total, member) => total + member.bytes, 0),
    method: 'declared-package-tree-sha256/v1',
    scope: 'current-invocation-installed-content',
  });
}
