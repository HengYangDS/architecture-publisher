import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dagre from '@dagrejs/dagre';
import { loadDagreSupply } from '../../packages/publisher/renderers/dagre/supply.mjs';

if (process.argv.length !== 3 || process.argv[2] !== '--check')
  throw new Error('dagre_supply_check_required');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'));
for (const [name, version] of [
  ['@dagrejs/dagre', '3.1.1'],
  ['@dagrejs/graphlib', '4.0.5'],
]) {
  const selected = lock.packages?.[`node_modules/${name}`];
  if (selected?.version !== version || selected.license !== 'MIT' || !selected.integrity)
    throw new Error('dagre_supply_lock_mismatch:' + name);
}
const selected = await loadDagreSupply();
if (dagre.version !== selected.version) throw new Error('dagre_supply_version_drift');
const installed = await fs.readFile(
  path.join(root, 'node_modules/@dagrejs/dagre/dist/dagre.min.js'),
);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
if (sha(installed) !== sha(selected.script)) throw new Error('dagre_supply_input_drift');
process.stdout.write(`Dagre ${selected.version} supply verified\n`);
