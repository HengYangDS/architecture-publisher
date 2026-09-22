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
