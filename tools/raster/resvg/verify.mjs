import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../..');
const manifestPath = path.join(root, 'packages/publisher/renderers/resvg/supply/resvg/source.json');
const modes = ['--archive', '--inputs', '--outputs', '--registry-url'];

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
  if (mode === '--registry-url') {
    const base = new URL(selectedPath);
    if (
      !['http:', 'https:'].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      !/^\/api\/v4\/?$/u.test(base.pathname)
    )
      throw new Error('source registry API base invalid');
    const registry = manifest.source.registry;
    if (registry.provider !== 'gitlab') throw new Error('source registry provider invalid');
    const segments = [registry.projectPath, registry.package, registry.version, registry.file];
    if (segments.some((value) => typeof value !== 'string' || !value))
      throw new Error('source registry identity invalid');
    const [project, name, version, file] = segments.map((value) => encodeURIComponent(value));
    process.stdout.write(
      `${base.origin}/api/v4/projects/${project}/packages/generic/${name}/${version}/${file}\n`,
    );
    return;
  }
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

const mode = process.argv[2];
const selectedPath =
  process.argv[3] ?? (mode === '--registry-url' ? process.env.CI_API_V4_URL : undefined);
if (!modes.includes(mode) || !selectedPath || process.argv.length > 4) {
  process.stderr.write(
    'usage: node verify.mjs <--archive|--inputs|--outputs> <path> | --registry-url [API_BASE]\n',
  );
  process.exitCode = 64;
} else {
  try {
    await verify(mode, selectedPath);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 65;
  }
}
