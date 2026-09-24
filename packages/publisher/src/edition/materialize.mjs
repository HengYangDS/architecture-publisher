import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { fail, isDigest, LIMITS, portableKey, portablePath } from '../source/manifest.mjs';
import { readSelectedInput, sealMaterializedInputLock } from '../source/materialize.mjs';
import { validateBuildRequest, validateEditionProject } from './authoring.mjs';
import { deriveSourceRevision } from './revision.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function decodedJson(bytes, code) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail(code);
  }
}

function sameSet(left, right) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function selectedRootPaths(request, requestFile, override) {
  const editionPath = path.posix.join(request.edition.root, request.edition.manifest);
  const requestName = path.basename(requestFile);
  try {
    portablePath(requestName);
  } catch {
    fail('materialized_request_path_invalid');
  }
  const selected = [requestName, editionPath];
  for (const source of request.sources) {
    const relative =
      source.revision.kind === 'vcs' && source.input.kind === 'locator'
        ? path.posix.join(source.revision.repository, source.input.path)
        : source.input.path;
    selected.push(relative);
  }
  if (override !== null) selected.push(path.posix.join(request.edition.root, override));
  const aliases = new Map();
  for (const selectedPath of selected) {
    const key = portableKey(selectedPath);
    if (aliases.has(key) && aliases.get(key) !== selectedPath) fail('materialized_path_alias');
    aliases.set(key, selectedPath);
  }
}

/** Materialize selected direct authoring bytes; Provider convergence follows separately. */
export async function materializeBuildRequestInput(requestPath, expectedSha256) {
  if (typeof requestPath !== 'string' || !requestPath) fail('materialized_request_path_required');
  if (!isDigest(expectedSha256)) fail('materialized_request_digest_required');
  const file = path.resolve(requestPath);
  await noSymlinkAncestors(file);
  const root = await fs.realpath(path.dirname(file));
  const requestBytes = await regularBytes(file, LIMITS.manifestBytes);
  if (sha(requestBytes) !== expectedSha256) fail('materialized_request_digest_mismatch');
  const request = validateBuildRequest(
    decodedJson(requestBytes, 'materialized_request_json_invalid'),
  );
  if (request.providers.length || request.edition.kind !== 'direct')
    fail('materialized_provider_pending');
  const editionPath = path.resolve(
    root,
    ...request.edition.root.split('/'),
    ...request.edition.manifest.split('/'),
  );
  await noSymlinkAncestors(editionPath);
  const editionBytes = await regularBytes(editionPath, 4 * 1024 * 1024);
  const project = validateEditionProject(
    decodedJson(editionBytes, 'materialized_edition_json_invalid'),
  );
  const override = project.visualPolicy.override ?? null;
  selectedRootPaths(request, file, override);
  /** @type {Buffer | null} */
  let overrideBytes = null;
  if (override !== null) {
    const selectedOverride = path.resolve(
      root,
      ...request.edition.root.split('/'),
      ...override.split('/'),
    );
    await noSymlinkAncestors(selectedOverride);
    overrideBytes = await regularBytes(selectedOverride, 4 * 1024 * 1024);
  }
  const namespaces = request.sources.map(({ namespace }) => namespace);
  if (!sameSet(namespaces, project.scope.sourceNamespaces))
    fail('materialized_edition_sources_mismatch');
  const selectedQuestions = new Set(
    request.media.flatMap((medium) => project.presentation[medium].questions),
  );
  if (project.questions.some(({ id }) => !selectedQuestions.has(id)))
    fail('materialized_selected_media_incomplete');

  const sources = [];
  const limits = [
    'native-dependency-closure-unchecked',
    'edition-dependency-closure-unchecked',
    'rendering-supplies-unchecked',
  ];
  let totalBytes = editionBytes.length + (overrideBytes?.length ?? 0);
  for (const source of request.sources) {
    const selected = await readSelectedInput(root, {
      ...source.input,
      ...(source.revision.kind === 'vcs' ? { vcs: source.revision } : {}),
    });
    totalBytes += selected.content.length;
    if (totalBytes > LIMITS.totalBytes) fail('bundle_size_exceeded');
    if (source.revision.kind === 'vcs' && selected.vcsObject === null)
      limits.push(`vcs-provenance-unverified:${source.namespace}`);
    sources.push({
      id: source.id,
      namespace: source.namespace,
      format: source.format,
      claimant: source.claimant,
      revisionEvidence: deriveSourceRevision(
        source.revision,
        selected.content,
        selected.vcsObject,
        selected.vcsBlob,
      ),
      content: selected.content,
    });
  }
  const sealed = sealMaterializedInputLock({
    edition: {
      id: project.id,
      editor: project.editor,
      content: editionBytes,
      override: overrideBytes,
    },
    sources,
    media: request.media,
    toolchain: request.toolchain,
  });
  return Object.freeze({
    get lock() {
      return sealed.lock;
    },
    lockJson: sealed.lockJson,
    lockSha256: sealed.lockSha256,
    read: sealed.read,
    readEdition: sealed.readEdition,
    readEditionOverride: sealed.readEditionOverride,
    project,
    limits: Object.freeze(limits),
  });
}
