import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { fail, LIMITS, portablePath } from '../source/manifest.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const JSON_BYTES = 16 * 1024 * 1024;
const PACKAGE_FILES = 4096;
const PACKAGE_BYTES = 128 * 1024 * 1024;

function packageJson(bytes) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail('edition_provider_package_json_invalid');
  }
}

function below(root, selected, code) {
  if (selected === root || !selected.startsWith(root + path.sep)) fail(code);
  return selected;
}

function compareNames(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function editionProviderPackageIdentity(root) {
  if (typeof root !== 'string' || !path.isAbsolute(root))
    fail('edition_provider_package_root_required');
  const packageRoot = path.resolve(root);
  await noSymlinkAncestors(packageRoot);
  const rootStat = await fs.lstat(packageRoot);
  if (
    !rootStat.isDirectory() ||
    rootStat.isSymbolicLink() ||
    (await fs.realpath(packageRoot)) !== packageRoot
  )
    fail('edition_provider_package_root_invalid');
  const files = [];
  let totalBytes = 0;
  const pending = [{ directory: packageRoot, relative: '' }];
  while (pending.length) {
    const { directory, relative } = /** @type {{directory: string, relative: string}} */ (
      pending.pop()
    );
    const entries = (await fs.readdir(directory, { withFileTypes: true })).sort((left, right) =>
      compareNames(left.name, right.name),
    );
    for (const entry of entries) {
      if (entry.name === 'node_modules') fail('edition_provider_package_content_invalid');
      const member = path.join(directory, entry.name),
        memberPath = path.posix.join(relative, entry.name);
      if (entry.isSymbolicLink()) fail('edition_provider_package_content_invalid');
      if (entry.isDirectory()) {
        pending.push({ directory: member, relative: memberPath });
        continue;
      }
      if (!entry.isFile()) fail('edition_provider_package_content_invalid');
      const bytes = await regularBytes(member, JSON_BYTES);
      totalBytes += bytes.length;
      if (files.length >= PACKAGE_FILES || totalBytes > PACKAGE_BYTES)
        fail('edition_provider_package_content_invalid');
      files.push({ path: memberPath, bytes: bytes.length, sha256: sha(bytes) });
    }
  }
  files.sort((left, right) => compareNames(left.path, right.path));
  return {
    root: packageRoot,
    bytes: totalBytes,
    sha256: sha(
      Buffer.from(
        JSON.stringify({ schema: 'architecture.edition-provider-package-content/v1', files }) +
          '\n',
      ),
    ),
  };
}

/** Bind every regular file in one independently installed Provider package. */
export async function editionProviderPackageDigest(root) {
  return (await editionProviderPackageIdentity(root)).sha256;
}

/** Select one exact installed package for either Provider transport. */
export async function selectProviderPackage(root, selected) {
  const packageIdentity = await editionProviderPackageIdentity(root),
    packageRoot = packageIdentity.root;
  const packageFile = path.join(packageRoot, 'package.json');
  await noSymlinkAncestors(packageFile);
  const packageBytes = await regularBytes(packageFile, LIMITS.manifestBytes);
  if (sha(packageBytes) !== selected.packageJsonSha256)
    fail('edition_provider_package_digest_mismatch');
  if (packageIdentity.sha256 !== selected.contentSha256)
    fail('edition_provider_package_content_mismatch');
  const manifest = packageJson(packageBytes);
  if (
    manifest === null ||
    typeof manifest !== 'object' ||
    Array.isArray(manifest) ||
    manifest.name !== selected.name ||
    manifest.version !== selected.version
  )
    fail('edition_provider_package_identity_mismatch');
  const target = manifest.exports?.[selected.entrypoint];
  if (typeof target !== 'string' || !target.startsWith('./'))
    fail('edition_provider_entrypoint_invalid');
  let portableTarget;
  try {
    portableTarget = portablePath(target.slice(2));
  } catch {
    fail('edition_provider_entrypoint_invalid');
  }
  const entrypoint = below(
    packageRoot,
    path.resolve(packageRoot, ...portableTarget.split('/')),
    'edition_provider_entrypoint_invalid',
  );
  await noSymlinkAncestors(entrypoint);
  await regularBytes(entrypoint, JSON_BYTES);
  return { entrypoint, packageBytes, packageIdentity };
}
