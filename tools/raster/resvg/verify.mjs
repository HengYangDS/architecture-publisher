import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const manifestPath = path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/source.json');
const modes = ['--archive', '--inputs', '--outputs'];

async function check(file, selected, message) {
  const info = await fs.lstat(file);
  if (!info.isFile() || (selected.bytes !== undefined && info.size !== selected.bytes))
    throw new Error(message);
  const bytes = await fs.readFile(file);
  if (createHash('sha256').update(bytes).digest('hex') !== selected.sha256)
    throw new Error(message);
  return bytes;
}

async function verify(mode, selectedPath) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const directory = path.resolve(selectedPath);
  if (mode === '--archive') {
    await check(
      directory,
      { sha256: manifest.source.archiveSha256 },
      'source closure digest mismatch',
    );
    return;
  }
  if (mode === '--inputs') {
    for (const selected of manifest.build.inputs) {
      const relative = selected.path.slice('tools/raster/resvg/'.length);
      if (
        !selected.path.startsWith('tools/raster/resvg/') ||
        !relative ||
        relative.split(/[\\/]/u).some((segment) => segment === '..' || segment === '.')
      )
        throw new Error('source closure input path invalid');
      await check(
        path.join(directory, relative),
        selected,
        `source closure input mismatch: ${selected.path}`,
      );
    }
    return;
  }
  for (const selected of manifest.outputs) {
    const bytes = await check(
      path.join(directory, selected.nativeFile),
      selected,
      `generated output mismatch: ${selected.nativeFile}`,
    );
    process.stdout.write(
      `${createHash('sha256').update(bytes).digest('hex')}  ${selected.nativeFile}\n`,
    );
  }
}

if (process.argv.length !== 4 || !modes.includes(process.argv[2])) {
  process.stderr.write('usage: node verify.mjs <--archive|--inputs|--outputs> <path>\n');
  process.exitCode = 64;
} else {
  try {
    await verify(process.argv[2], process.argv[3]);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 65;
  }
}
