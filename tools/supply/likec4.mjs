import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, version as esbuildVersion } from 'esbuild';
import { noSymlinkAncestors } from '../../packages/publisher/src/file-input/read.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const remedaLicenseSha256 = 'acf30083045d768ce20640237313ee31a45d548d66ef76df5bb5fb0745479535';
const khromaLicenseSha256 = '66b333b0f66759a0b710459e03f7029abe17f4358114a128d2c972e642961b49';
const requireBanner = [
  "import { createRequire as __archpubCreateRequire, builtinModules as __archpubBuiltinModules } from 'node:module';",
  'const __archpubNodeRequire = __archpubCreateRequire(import.meta.url);',
  "const __archpubAllowed = new Set(__archpubBuiltinModules.map((name) => name.replace(/^node:/, '')));",
  "const require = (name) => { if (!__archpubAllowed.has(name.replace(/^node:/, ''))) throw new Error('external_dependency_denied:' + name); return __archpubNodeRequire(name); };",
].join('\n');

function packageLockPath(input) {
  const parts = input.replaceAll('\\', '/').split('/');
  const index = parts.lastIndexOf('node_modules');
  if (index < 0 || !parts[index + 1]) throw Error('likec4_supply_input_outside_packages');
  const count = parts[index + 1].startsWith('@') ? 2 : 1;
  if (!parts[index + count]) throw Error('likec4_supply_package_path_invalid');
  const selected = parts.slice(0, index + count + 1);
  if (selected.some((part) => part === '..' || part === ''))
    throw Error('likec4_supply_package_path_invalid');
  return selected.join('/');
}

async function licenseText(packagePath, manifest) {
  const directory = path.join(root, ...packagePath.split('/'));
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const notices = entries
    .filter(({ name }) => /^(?:licen[cs]e|copying|notice)(?:[._-]|$)/iu.test(name))
    .sort((left, right) => compare(left.name, right.name));
  if (!notices.length && manifest.name === 'remeda' && manifest.version === '2.50.0') {
    const bytes = await fs.readFile(new URL('./licenses/remeda-LICENSE', import.meta.url));
    if (sha(bytes) !== remedaLicenseSha256) throw Error('likec4_supply_license_drift');
    return bytes.toString('utf8');
  }
  if (!notices.length) throw Error(`likec4_supply_license_missing:${manifest.name}`);
  const parts = [];
  for (const entry of notices) {
    if (!entry.isFile() || entry.isSymbolicLink()) throw Error('likec4_supply_license_invalid');
    const bytes = await fs.readFile(path.join(directory, entry.name));
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (!text.trim()) throw Error('likec4_supply_license_invalid');
    parts.push(text.trimEnd());
  }
  return parts.join('\n\n');
}

async function includedPackages(metafile) {
  const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'));
  const packagePaths = [...new Set(Object.keys(metafile.inputs).map(packageLockPath))].sort(
    compare,
  );
  const noticesByIdentity = new Map();
  const packages = [];
  for (const lockPath of packagePaths) {
    const manifest = JSON.parse(
      await fs.readFile(path.join(root, ...lockPath.split('/'), 'package.json'), 'utf8'),
    );
    const locked = lock.packages?.[lockPath];
    if (
      !manifest.name ||
      !manifest.version ||
      !locked ||
      locked.version !== manifest.version ||
      typeof locked.integrity !== 'string'
    )
      throw Error(`likec4_supply_lock_mismatch:${lockPath}`);
    const notice = await licenseText(lockPath, manifest);
    let license = manifest.license;
    if (license === undefined && manifest.name === 'khroma' && manifest.version === '2.1.0') {
      const original = await fs.readFile(path.join(root, ...lockPath.split('/'), 'license'));
      if (sha(original) !== khromaLicenseSha256) throw Error('likec4_supply_license_drift');
      license = 'MIT';
    }
    if (typeof license !== 'string' || !license) throw Error('likec4_supply_license_undeclared');
    const identity = `${manifest.name}@${manifest.version}`;
    const prior = noticesByIdentity.get(identity);
    if (prior && (prior.license !== license || prior.text !== notice))
      throw Error('likec4_supply_license_conflict');
    noticesByIdentity.set(identity, { license, text: notice });
    packages.push({
      lockPath,
      name: manifest.name,
      version: manifest.version,
      license,
      integrity: locked.integrity,
      noticeSha256: sha(Buffer.from(notice)),
    });
  }
  const notices = Buffer.from(
    [...noticesByIdentity]
      .sort(([left], [right]) => compare(left, right))
      .map(([identity, { license, text }]) => `===== ${identity} (${license}) =====\n${text}\n`)
      .join('\n'),
  );
  return { packages, notices };
}

function blockedExternals(metafile) {
  const builtins = new Set(builtinModules.map((name) => name.replace(/^node:/u, '')));
  const external = Object.values(metafile.outputs).flatMap(({ imports }) =>
    imports.filter(({ external: selected }) => selected),
  );
  const blocked = [
    ...new Set(
      external
        .filter(({ path: name }) => !builtins.has(name.replace(/^node:/u, '')))
        .map(({ path: name }) => name),
    ),
  ].sort(compare);
  if (
    blocked.length !== 1 ||
    blocked[0] !== 'pnpapi' ||
    external.some(({ path: name, kind }) => name === 'pnpapi' && kind !== 'require-call')
  )
    throw Error('likec4_supply_external_import_changed');
  return blocked;
}

/** Build reproducible candidate bytes; this does not admit or publish the supply. */
export async function buildLikeC4Supply() {
  const parserPackage = JSON.parse(
    await fs.readFile(
      path.join(root, 'node_modules/@likec4/language-services/package.json'),
      'utf8',
    ),
  );
  const result = await build({
    absWorkingDir: root,
    entryPoints: ['@likec4/language-services/node'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    metafile: true,
    logLevel: 'silent',
    banner: { js: requireBanner },
  });
  if (result.outputFiles.length !== 1) throw Error('likec4_supply_output_invalid');
  const bundle = Buffer.from(result.outputFiles[0].contents);
  const blockedExternalPackages = blockedExternals(result.metafile);
  const { packages, notices } = await includedPackages(result.metafile);
  const manifest = {
    schema: 'architecture.native-parser-supply/v1',
    parser: { name: parserPackage.name, version: parserPackage.version },
    builder: { name: 'esbuild', version: esbuildVersion },
    blockedExternalPackages,
    packages,
    files: [
      { path: 'parser.mjs', bytes: bundle.length, sha256: sha(bundle) },
      { path: 'THIRD-PARTY-NOTICES.txt', bytes: notices.length, sha256: sha(notices) },
    ],
  };
  return { bundle, notices, manifest };
}

async function supplyFiles() {
  const { bundle, notices, manifest } = await buildLikeC4Supply();
  return new Map([
    ['parser.mjs', bundle],
    ['THIRD-PARTY-NOTICES.txt', notices],
    ['supply.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n')],
  ]);
}

async function verifyDirectory(directory, expected) {
  await noSymlinkAncestors(directory);
  if (!(await fs.lstat(directory)).isDirectory()) throw Error('likec4_supply_directory_invalid');
  const entries = await fs.readdir(directory, { withFileTypes: true });
  if (
    entries.length !== expected.size ||
    entries.some((entry) => !entry.isFile() || entry.isSymbolicLink() || !expected.has(entry.name))
  )
    throw Error('likec4_supply_inventory_drift');
  for (const [name, bytes] of expected)
    if (!(await fs.readFile(path.join(directory, name))).equals(bytes))
      throw Error(`likec4_supply_file_drift:${name}`);
}

async function main() {
  const mode = process.argv[2];
  if (!['--write', '--check'].includes(mode) || process.argv.length !== 3)
    throw Error('usage: likec4.mjs --write|--check');
  const files = await supplyFiles();
  const destination = path.join(root, 'packages/publisher/supplies/likec4');
  if (mode === '--write') {
    await fs.mkdir(destination, { recursive: true });
    await noSymlinkAncestors(destination);
    const present = await fs.readdir(destination, { withFileTypes: true });
    if (
      present.some((entry) => !entry.isFile() || entry.isSymbolicLink() || !files.has(entry.name))
    )
      throw Error('likec4_supply_unknown_content');
    for (const [name, bytes] of files) await fs.writeFile(path.join(destination, name), bytes);
  }
  await verifyDirectory(destination, files);
  process.stdout.write(`LikeC4 supply ${mode === '--write' ? 'written' : 'verified'}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await main();
