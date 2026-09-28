import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { editionDigest, validateEdition } from '../edition/contract.mjs';
import { compileEditionEvolution } from '../edition/evolution.mjs';
import { readPublisherIdentity } from '../runtime.mjs';
import { claimModelDigest, deepFreeze, validateClaimModel } from '../semantics/document.mjs';
import { writeSourceBundle } from '../source/write.mjs';
import { noSymlinkAncestors, regularBytes } from '../file-input/read.mjs';
import { fail, hasExactFields as exact } from '../protocol/values.mjs';
import { LIMITS, portableKey } from '../file-input/contract.mjs';
import { readEditionProviderInput, resolveProviderPath } from './input.mjs';
import { editionProviderPackageDigest, selectProviderPackage } from './package.mjs';
import {
  validateProviderMaterialization,
  validateProviderReply,
  validateProviderRequest,
} from './protocol.mjs';
import { runProviderWorker } from './supervisor.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function json(bytes, code) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail(code);
  }
}

async function requestFor(manifest, root) {
  const inputs = [];
  for (const selected of manifest.delivery.inputs) {
    const file = resolveProviderPath(root, selected.path, 'edition_provider_input_path_invalid');
    await noSymlinkAncestors(file);
    const bytes = await regularBytes(file, manifest.limits.inputBytes);
    if (bytes.length !== selected.bytes) fail('edition_provider_input_size_mismatch');
    if (sha(bytes) !== selected.sha256) fail('edition_provider_input_digest_mismatch');
    inputs.push({
      id: selected.id,
      mediaType: selected.mediaType,
      bytes: selected.bytes,
      sha256: selected.sha256,
      contentBase64: bytes.toString('base64'),
    });
  }
  return validateProviderRequest({
    schema: 'architecture.edition-provider-request/v1',
    provider: manifest.provider,
    subject: manifest.subject,
    inputs,
  });
}

async function materializedValues(reply, manifest, scratch) {
  if (
    reply.source.id !== manifest.subject.id ||
    reply.source.revision !== manifest.subject.revision
  )
    fail('edition_provider_subject_mismatch');
  const members = reply.source.members.map(({ path: memberPath, contentBase64 }) => ({
      path: memberPath,
      content: Buffer.from(contentBase64, 'base64'),
    })),
    editionBytes = Buffer.from(reply.edition.contentBase64, 'base64'),
    evolutionBytes =
      reply.evolution === null ? null : Buffer.from(reply.evolution.contentBase64, 'base64'),
    replyBytes =
      members.reduce((total, member) => total + member.content.length, 0) +
      editionBytes.length +
      (evolutionBytes?.length ?? 0);
  if (replyBytes > manifest.limits.replyBytes) fail('edition_provider_reply_size_invalid');
  const written = await writeSourceBundle(
    path.join(scratch, 'materialized-source'),
    { id: reply.source.id, revision: reply.source.revision },
    members,
  );
  if (written.manifestSha256 !== manifest.expected.sourceManifestSha256)
    fail('edition_provider_source_identity_mismatch');
  const semanticMember = reply.source.members.find(
    ({ path: memberPath }) => portableKey(memberPath) === portableKey(reply.semanticMember),
  ).path;
  const semanticBytes = members.find(
      ({ path: memberPath }) => memberPath === semanticMember,
    ).content,
    model = validateClaimModel(json(semanticBytes, 'edition_provider_semantic_json_invalid')),
    semanticDigest = claimModelDigest(model);
  if (semanticDigest !== manifest.expected.claimModelDigest)
    fail('edition_provider_semantic_identity_mismatch');
  const edition = validateEdition(
      model,
      json(editionBytes, 'edition_provider_edition_json_invalid'),
    ),
    selectedEditionDigest = editionDigest(model, edition);
  if (edition.source.manifestSha256 !== written.manifestSha256)
    fail('edition_provider_edition_source_mismatch');
  if (selectedEditionDigest !== manifest.expected.editionDigest)
    fail('edition_provider_edition_identity_mismatch');
  const editionSha256 = sha(editionBytes);
  /** @type {string | null} */
  let evolutionSha256 = null;
  if (evolutionBytes !== null) {
    compileEditionEvolution(json(evolutionBytes, 'edition_provider_evolution_json_invalid'));
    evolutionSha256 = sha(evolutionBytes);
  }
  if (evolutionSha256 !== manifest.expected.evolutionSha256)
    fail('edition_provider_evolution_identity_mismatch');
  return {
    source: reply.source,
    semanticMember,
    edition: reply.edition,
    evolution: reply.evolution,
    sourceSha256: written.manifestSha256,
    semanticDigest,
    editionSha256,
    editionDigest: selectedEditionDigest,
    evolutionSha256,
  };
}

/** Execute one exact installed Provider in a bounded child and validate its values. */
export async function materializeExecutableProvider(
  selection,
  options = { verifyDeterminism: false },
) {
  if (!exact(selection, ['providerManifest', 'providerManifestSha256', 'providerPackageRoot']))
    fail('edition_provider_selection_invalid');
  if (!exact(options, ['verifyDeterminism'])) fail('edition_provider_options_invalid');
  if (typeof options.verifyDeterminism !== 'boolean') fail('edition_provider_options_invalid');
  const selected = await readEditionProviderInput(
      selection.providerManifest,
      selection.providerManifestSha256,
    ),
    { manifest, root } = selected;
  if (manifest.delivery.kind !== 'executable') fail('edition_provider_delivery_kind_invalid');
  const packageSelection = await selectProviderPackage(
      selection.providerPackageRoot,
      manifest.delivery.package,
    ),
    request = await requestFor(manifest, root),
    temporaryRoot = await fs.realpath(os.tmpdir()),
    scratch = await fs.mkdtemp(path.join(temporaryRoot, `architecture-provider-${process.pid}-`)),
    started = performance.now();
  try {
    for (const directory of ['config', 'cache', 'data', 'tmp'])
      await fs.mkdir(path.join(scratch, directory));
    const requestPath = path.join(scratch, 'request.json');
    await fs.writeFile(requestPath, JSON.stringify(request), { flag: 'wx', mode: 0o600 });
    const first = await runProviderWorker({
      entrypoint: packageSelection.entrypoint,
      requestPath,
      scratch,
      limits: manifest.limits,
      validateReply: validateProviderReply,
    });
    if (options.verifyDeterminism) {
      const second = await runProviderWorker({
        entrypoint: packageSelection.entrypoint,
        requestPath,
        scratch,
        limits: manifest.limits,
        validateReply: validateProviderReply,
      });
      if (first.raw !== second.raw) fail('edition_provider_nondeterministic');
    }
    if (
      (await editionProviderPackageDigest(packageSelection.packageIdentity.root)) !==
      selected.manifest.delivery.package.contentSha256
    )
      fail('edition_provider_package_content_mismatch');
    const values = await materializedValues(first.reply, manifest, scratch),
      providerBytes = await regularBytes(selection.providerManifest, LIMITS.manifestBytes),
      receipt = validateProviderMaterialization({
        schema: 'architecture.edition-provider-materialization/v1',
        provider: manifest.provider,
        subject: manifest.subject,
        delivery: 'executable',
        inputs: [
          { id: 'provider-manifest', bytes: providerBytes.length, sha256: sha(providerBytes) },
          {
            id: 'provider-package',
            bytes: packageSelection.packageIdentity.bytes,
            sha256: packageSelection.packageIdentity.sha256,
          },
          ...request.inputs.map(
            ({ contentBase64: _contentBase64, mediaType: _mediaType, ...input }) => input,
          ),
        ].sort((left, right) => left.id.localeCompare(right.id)),
        materialized: {
          sourceManifestSha256: values.sourceSha256,
          claimModelDigest: values.semanticDigest,
          editionDigest: values.editionDigest,
          evolutionSha256: values.evolutionSha256,
        },
        producer: await readPublisherIdentity(),
        execution: {
          kind: 'child-process',
          durationMs: Math.max(0, Math.round(performance.now() - started)),
          deterministic: options.verifyDeterminism,
        },
      });
    return deepFreeze({ ...values, receipt });
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
