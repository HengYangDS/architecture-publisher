import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { noSymlinkAncestors, regularBytes } from '../file-input/read.mjs';
import { canonical } from '../protocol/json.mjs';
import { fail, hasExactFields, isDigest } from '../protocol/values.mjs';
import { LIMITS, portableKey, portablePath } from '../file-input/contract.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const inside = (root, selected) => {
  const relative = path.relative(root, selected);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
};

async function trustedGit(selectionRoot) {
  const directories = [];
  for (const entry of (process.env.PATH ?? '').split(path.delimiter)) {
    if (!path.isAbsolute(entry)) continue;
    let directory;
    try {
      directory = await fs.realpath(entry);
    } catch {
      continue;
    }
    if (!inside(selectionRoot, directory)) directories.push(directory);
  }
  const name = process.platform === 'win32' ? 'git.exe' : 'git';
  for (const directory of directories) {
    try {
      const binary = await fs.realpath(path.join(directory, name));
      if (inside(selectionRoot, binary) || !(await fs.stat(binary)).isFile()) continue;
      await fs.access(binary, constants.X_OK);
      return { binary, searchPath: directories.join(path.delimiter) };
    } catch {
      continue;
    }
  }
  fail('materialized_vcs_unavailable');
}

const gitEnvironment = (searchPath) => {
  const environment = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
  );
  return {
    ...environment,
    PATH: searchPath,
    GIT_NO_LAZY_FETCH: '1',
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_OPTIONAL_LOCKS: '0',
    GIT_TERMINAL_PROMPT: '0',
  };
};

function git(selectedGit, repo, args, maximum = 1024 * 1024) {
  const result = spawnSync(selectedGit.binary, args, {
    cwd: repo,
    env: gitEnvironment(selectedGit.searchPath),
    input: '',
    encoding: null,
    timeout: 10_000,
    maxBuffer: maximum + 1024,
    windowsHide: true,
  });
  const error = /** @type {NodeJS.ErrnoException | undefined} */ (result.error);
  if (error?.code === 'ENOENT') fail('materialized_vcs_unavailable');
  if (error?.code === 'ENOBUFS') fail('file_size_exceeded');
  if (result.error) fail('materialized_vcs_command_failed');
  return result;
}

async function vcsBytes(root, selectedPath, { repository, ref }) {
  if (repository !== '.') portablePath(repository);
  const repo = path.resolve(root, ...repository.split('/'));
  try {
    await noSymlinkAncestors(repo);
    if (!(await fs.stat(repo)).isDirectory()) fail('materialized_vcs_repository_invalid');
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (code === 'ENOENT' || code === 'ENOTDIR') fail('materialized_vcs_repository_invalid');
    throw error;
  }
  const canonicalRoot = await fs.realpath(root);
  const canonicalRepo = await fs.realpath(repo);
  const selectedGit = await trustedGit(canonicalRoot);
  const top = git(selectedGit, canonicalRepo, ['rev-parse', '--show-toplevel']);
  if (top.status !== 0 || (await fs.realpath(top.stdout.toString('utf8').trim())) !== canonicalRepo)
    fail('materialized_vcs_repository_invalid');
  const resolved = git(selectedGit, canonicalRepo, [
    'rev-parse',
    '--verify',
    '--end-of-options',
    `${ref}^{commit}`,
  ]);
  const commit = resolved.stdout.toString('utf8').trim();
  if (resolved.status !== 0 || !/^[a-f0-9]{40,64}$/u.test(commit))
    fail('materialized_vcs_ref_unresolved');
  const tree = git(selectedGit, canonicalRepo, ['ls-tree', '-z', commit, '--', selectedPath]);
  const entries = tree.stdout.toString('utf8').split('\0').filter(Boolean);
  if (tree.status !== 0 || entries.length !== 1) fail('materialized_vcs_object_unavailable');
  const match = /^(100644|100755) blob ([a-f0-9]{40,64})\t(.+)$/u.exec(entries[0]);
  if (!match || match[3] !== selectedPath) fail('materialized_vcs_type_unsupported');
  const object = git(
    selectedGit,
    canonicalRepo,
    ['cat-file', 'blob', match[2]],
    LIMITS.memberBytes,
  );
  if (object.status !== 0) fail('materialized_vcs_object_unavailable');
  if (object.stdout.length > LIMITS.memberBytes) fail('file_size_exceeded');
  return { content: object.stdout, vcsObject: commit, vcsBlob: match[2] };
}

/** Read one selected root file. Pins are independent of any optional VCS claim. */
export async function readSelectedInput(root, selection) {
  if (!selection || typeof selection !== 'object' || !['locator', 'pin'].includes(selection.kind))
    fail('materialized_selection_invalid');
  portablePath(selection.path);
  if (selection.kind === 'pin' && !isDigest(selection.sha256)) fail('materialized_pin_invalid');
  let selected;
  if (selection.kind === 'locator' && selection.vcs)
    selected = await vcsBytes(root, selection.path, selection.vcs);
  else {
    const file = path.resolve(root, ...selection.path.split('/'));
    await noSymlinkAncestors(file);
    selected = {
      content: await regularBytes(file, LIMITS.memberBytes),
      vcsObject: null,
      vcsBlob: null,
    };
  }
  if (selection.kind === 'pin' && sha(selected.content) !== selection.sha256)
    fail('materialized_pin_mismatch');
  return selected;
}

/**
 * @typedef {object} DerivedInput
 * @property {string} namespace
 * @property {string} claimant
 * @property {{ id: string, version: string }} format
 * @property {{ namespace: string, sha256: string }[]} derivedFrom
 * @property {{ id: string, version: string, contentSha256: string }} adapter
 * @property {string} method
 * @property {Buffer} content
 */

/** Seal one selected meaning, independent of request-local and Provider-local handles. */
export function sealMaterializedInputLock({
  edition,
  sources,
  derived = /** @type {DerivedInput[]} */ ([]),
  media,
  toolchain,
}) {
  if (
    !edition ||
    typeof edition !== 'object' ||
    Array.isArray(edition) ||
    !hasExactFields(edition, ['content', 'editor', 'id', 'resources']) ||
    !Array.isArray(edition.resources)
  )
    fail('materialized_edition_resources_invalid');
  const editionContent = Buffer.from(edition.content);
  const resourceContents = new Map();
  const resourceKeys = new Set();
  const resources = edition.resources.map(({ ref, content }) => {
    portablePath(ref);
    const key = portableKey(ref);
    if (resourceKeys.has(key)) fail('materialized_edition_resource_duplicate');
    resourceKeys.add(key);
    const bytes = Buffer.from(content);
    resourceContents.set(ref, bytes);
    return { ref, bytes: bytes.length, sha256: sha(bytes) };
  });
  resources.sort((left, right) => (left.ref < right.ref ? -1 : left.ref > right.ref ? 1 : 0));

  const sourceContents = new Map();
  const native = sources.map((source) => {
    if (sourceContents.has(source.namespace)) fail('materialized_source_namespace_duplicate');
    const content = Buffer.from(source.content);
    sourceContents.set(source.namespace, content);
    return {
      namespace: source.namespace,
      format: { id: source.format.id, version: source.format.version },
      claimant: source.claimant,
      revision: source.revisionEvidence,
      bytes: content.length,
      sha256: sha(content),
    };
  });
  native.sort((left, right) =>
    left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0,
  );
  const nativeByNamespace = new Map(native.map((item) => [item.namespace, item]));

  const derivedContents = new Map();
  const namespaces = new Set(nativeByNamespace.keys());
  const projections = derived.map((item) => {
    if (typeof item.namespace !== 'string' || !item.namespace.trim())
      fail('materialized_derived_namespace_invalid');
    if (namespaces.has(item.namespace)) fail('materialized_derived_namespace_duplicate');
    namespaces.add(item.namespace);
    if (!Array.isArray(item.derivedFrom) || !item.derivedFrom.length)
      fail('materialized_derived_ancestor_invalid');
    const ancestors = new Set();
    const derivedFrom = item.derivedFrom.map((ancestor) => {
      const selected = nativeByNamespace.get(ancestor?.namespace);
      if (!selected || selected.sha256 !== ancestor.sha256 || ancestors.has(ancestor.namespace))
        fail('materialized_derived_ancestor_invalid');
      ancestors.add(ancestor.namespace);
      return { namespace: selected.namespace, sha256: selected.sha256 };
    });
    derivedFrom.sort((left, right) =>
      left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0,
    );
    const content = Buffer.from(item.content);
    const entry = {
      namespace: item.namespace,
      claimant: item.claimant,
      format: { id: item.format.id, version: item.format.version },
      derivedFrom,
      adapter: {
        id: item.adapter.id,
        version: item.adapter.version,
        contentSha256: item.adapter.contentSha256,
      },
      method: item.method,
      bytes: content.length,
      sha256: sha(content),
    };
    const key = canonical(entry);
    derivedContents.set(key, content);
    return { key, entry };
  });
  projections.sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0));

  const lock = {
    schema: 'architecture.materialized-input-lock/v1',
    edition: {
      id: edition.id,
      editor: edition.editor,
      bytes: editionContent.length,
      sha256: sha(editionContent),
      resources,
    },
    sources: native,
    derived: projections.map(({ entry }) => entry),
    media: [...media].sort(),
    toolchain: { profile: toolchain.profile },
  };
  const lockJson = canonical(lock);
  const lockSha256 = sha(Buffer.from(lockJson));
  return Object.freeze({
    get lock() {
      return JSON.parse(lockJson);
    },
    lockJson,
    lockSha256,
    readEdition() {
      return Buffer.from(editionContent);
    },
    readEditionResource(ref) {
      const selected = resourceContents.get(ref);
      if (!selected) fail('materialized_item_unknown');
      return Buffer.from(selected);
    },
    readSource(namespace) {
      const selected = sourceContents.get(namespace);
      if (!selected) fail('materialized_item_unknown');
      return Buffer.from(selected);
    },
    readDerived(entry) {
      const selected = derivedContents.get(canonical(entry));
      if (!selected) fail('materialized_item_unknown');
      return Buffer.from(selected);
    },
  });
}
