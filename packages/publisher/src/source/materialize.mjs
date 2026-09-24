import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { noSymlinkAncestors, regularBytes } from './files.mjs';
import { fail, isDigest, LIMITS, portablePath } from './manifest.mjs';

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

/** Seal selected bytes without source-input locator or delivery-mode spelling. */
export function sealMaterializedInputLock({ edition, sources, media, toolchain }) {
  const contents = new Map();
  const editionContent = Buffer.from(edition.content);
  const editionOverride = edition.override === null ? null : Buffer.from(edition.override);
  for (const source of sources) {
    if (contents.has(source.id)) fail('materialized_item_duplicate');
    contents.set(source.id, Buffer.from(source.content));
  }
  const lock = {
    schema: 'architecture.materialized-input-lock/v1',
    edition: {
      id: edition.id,
      editor: edition.editor,
      bytes: edition.content.length,
      sha256: sha(edition.content),
      visualPolicyOverride:
        editionOverride === null
          ? null
          : {
              bytes: editionOverride.length,
              sha256: sha(editionOverride),
              observedBy: 'materializer',
            },
    },
    sources: sources
      .map((source) => {
        return {
          id: source.id,
          namespace: source.namespace,
          format: { id: source.format.id, version: source.format.version },
          claimant: source.claimant,
          revision: source.revisionEvidence,
          bytes: source.content.length,
          sha256: sha(source.content),
        };
      })
      .sort((left, right) =>
        left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0,
      ),
    media: [...media].sort(),
    toolchain: { profile: toolchain.profile },
    closure: 'selected-roots-only',
  };
  const lockJson = JSON.stringify(lock);
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
    readEditionOverride() {
      return editionOverride === null ? null : Buffer.from(editionOverride);
    },
    read(id) {
      const selected = contents.get(id);
      if (!selected) fail('materialized_item_unknown');
      return Buffer.from(selected);
    },
  });
}
