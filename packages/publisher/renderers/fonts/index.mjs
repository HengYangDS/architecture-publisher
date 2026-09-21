import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { fail } from '../../src/source/manifest.mjs';

const root = fileURLToPath(new URL('./supply/', import.meta.url));
const digest = 'fdf4df13d28e4161b937162bbe31ef05be3c4db88d82f490fa1305a6e353d08a';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Exact bundled font supply shared by independent media renderers. */
export async function loadBundledFonts() {
  const raw = await fs.readFile(path.join(root, 'supply.json'));
  if (sha(raw) !== digest) fail('render_font_supply_invalid');
  const supply = JSON.parse(raw),
    fonts = [];
  let license;
  for (const file of supply.files) {
    const name = path.join(root, file.path),
      stat = await fs.lstat(name);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== file.bytes)
      fail('render_font_supply_invalid');
    const bytes = await fs.readFile(name);
    if (sha(bytes) !== file.sha256) fail('render_font_supply_invalid');
    if (file.weight) fonts.push({ ...file, bytes });
    else license = { ...file, bytes };
  }
  return { fonts, license, manifest: supply, sha256: digest };
}
