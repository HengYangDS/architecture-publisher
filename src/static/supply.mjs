import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { fail } from '../source/manifest.mjs';

export const RASTER_SUPPLY_SHA256 =
  '99982a6900c3821483390b8f5276efcd694e9f4d772fbe013995e25c3610a6aa';
const root = fileURLToPath(new URL('../../assets/raster/', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Installed package integrity, not protection against a malicious installer. */
export async function verifyRasterSupply() {
  const names = new Set();
  async function walk(directory, prefix = '') {
    for (const item of await fs.readdir(directory, { withFileTypes: true })) {
      if (item.isSymbolicLink()) fail('raster_supply_invalid');
      if (item.isDirectory())
        await walk(path.join(directory, item.name), prefix + item.name + '/');
      else if (item.isFile()) names.add(prefix + item.name);
      else fail('raster_supply_invalid');
    }
  }
  const stat = await fs.lstat(root);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    fail('raster_supply_invalid');
  await walk(root);
  const raw = await fs.readFile(path.join(root, 'supply.json'));
  if (sha(raw) !== RASTER_SUPPLY_SHA256) fail('raster_supply_invalid');
  const manifest = JSON.parse(raw);
  if (names.size !== manifest.files.length + 1 || !names.delete('supply.json'))
    fail('raster_supply_invalid');
  for (const file of manifest.files) {
    if (!names.delete(file.path)) fail('raster_supply_invalid');
    const bytes = await fs.readFile(path.join(root, file.path));
    if (bytes.length !== file.bytes || sha(bytes) !== file.sha256)
      fail('raster_supply_invalid');
  }
  if (names.size) fail('raster_supply_invalid');
  return {
    sha256: RASTER_SUPPLY_SHA256,
    packages: manifest.packages.map(({ name, version, license }) => ({
      name,
      version,
      license,
    })),
  };
}
