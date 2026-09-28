import { createHash } from 'node:crypto';
import { compileEditionEvolution } from '../edition/evolution.mjs';
import { editionDigest, validateEdition } from '../edition/contract.mjs';
import { readPublisherIdentity } from '../runtime.mjs';
import { claimModelDigest, deepFreeze, validateClaimModel } from '../semantics/document.mjs';
import { readSourceBundle } from '../source/bundle.mjs';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { fail, hasExactFields as exact, isDigest, LIMITS } from '../source/manifest.mjs';
import { validateProviderMaterialization } from './protocol.mjs';
import { readEditionProviderInput, resolveProviderPath } from './input.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const JSON_BYTES = 16 * 1024 * 1024;

function json(bytes, code) {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail(code);
  }
}

async function selectedJson(file, expectedSha256, kind) {
  if (!isDigest(expectedSha256)) fail(`edition_provider_${kind}_digest_required`);
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, JSON_BYTES);
  if (sha(bytes) !== expectedSha256) fail(`edition_provider_${kind}_digest_mismatch`);
  return { bytes, value: json(bytes, `edition_provider_${kind}_json_invalid`) };
}

function inputReceipt(id, bytes) {
  return { id, bytes: bytes.length, sha256: sha(bytes) };
}

function assertIdentity(actual, expected, code) {
  if (actual !== expected) fail(code);
}

/** Materialize one closed declarative Provider into ordinary compiler inputs. */
export async function materializeDeclarativeProvider(selection) {
  if (!exact(selection, ['providerManifest', 'providerManifestSha256']))
    fail('edition_provider_selection_invalid');
  const selected = await readEditionProviderInput(
      selection.providerManifest,
      selection.providerManifestSha256,
    ),
    { manifest, root } = selected;
  if (manifest.delivery.kind !== 'declarative') fail('edition_provider_delivery_kind_invalid');

  const sourceManifest = resolveProviderPath(
      root,
      manifest.delivery.sourceManifest,
      'edition_provider_delivery_path_invalid',
    ),
    editionFile = resolveProviderPath(
      root,
      manifest.delivery.edition,
      'edition_provider_delivery_path_invalid',
    ),
    source = await readSourceBundle(sourceManifest, manifest.delivery.sourceManifestSha256);
  if (
    source.source.id !== manifest.subject.id ||
    source.source.revision !== manifest.subject.revision
  )
    fail('edition_provider_subject_mismatch');
  assertIdentity(
    source.manifestSha256,
    manifest.expected.sourceManifestSha256,
    'edition_provider_source_identity_mismatch',
  );

  const semantic = source.members.find(({ path }) => path === manifest.delivery.semanticMember);
  if (!semantic) fail('edition_provider_semantic_member_missing');
  const model = validateClaimModel(
      json(semantic.content, 'edition_provider_semantic_json_invalid'),
    ),
    selectedSemanticDigest = claimModelDigest(model);
  assertIdentity(
    selectedSemanticDigest,
    manifest.expected.claimModelDigest,
    'edition_provider_semantic_identity_mismatch',
  );

  const selectedEdition = await selectedJson(
      editionFile,
      manifest.delivery.editionSha256,
      'edition',
    ),
    edition = validateEdition(model, selectedEdition.value),
    selectedEditionDigest = editionDigest(model, edition);
  if (edition.source.manifestSha256 !== source.manifestSha256)
    fail('edition_provider_edition_source_mismatch');
  assertIdentity(
    selectedEditionDigest,
    manifest.expected.editionDigest,
    'edition_provider_edition_identity_mismatch',
  );

  /** @type {string | null} */
  let evolution = null;
  /** @type {string | null} */
  let evolutionSha256 = null;
  /** @type {Buffer | null} */
  let evolutionBytes = null;
  if (manifest.delivery.evolution !== null) {
    evolution = resolveProviderPath(
      root,
      manifest.delivery.evolution,
      'edition_provider_delivery_path_invalid',
    );
    const selectedEvolution = await selectedJson(
      evolution,
      manifest.delivery.evolutionSha256,
      'evolution',
    );
    compileEditionEvolution(selectedEvolution.value);
    evolutionBytes = selectedEvolution.bytes;
    evolutionSha256 = manifest.delivery.evolutionSha256;
    assertIdentity(
      evolutionSha256,
      manifest.expected.evolutionSha256,
      'edition_provider_evolution_identity_mismatch',
    );
  }

  const providerBytes = await regularBytes(selection.providerManifest, LIMITS.manifestBytes),
    sourceManifestBytes = await regularBytes(sourceManifest, LIMITS.manifestBytes),
    inputs = [
      inputReceipt('provider-manifest', providerBytes),
      inputReceipt('source-manifest', sourceManifestBytes),
      ...source.members.map(({ path, content }) => inputReceipt(`source:${path}`, content)),
      inputReceipt('edition', selectedEdition.bytes),
      ...(evolutionBytes ? [inputReceipt('evolution', evolutionBytes)] : []),
    ].sort((left, right) => left.id.localeCompare(right.id));
  if (inputs.length > manifest.limits.inputs) fail('edition_provider_inputs_invalid');
  if (inputs.reduce((total, input) => total + input.bytes, 0) > manifest.limits.inputBytes)
    fail('edition_provider_input_size_invalid');

  const receipt = validateProviderMaterialization({
    schema: 'architecture.edition-provider-materialization/v1',
    provider: manifest.provider,
    subject: manifest.subject,
    delivery: 'declarative',
    inputs,
    materialized: {
      sourceManifestSha256: source.manifestSha256,
      claimModelDigest: selectedSemanticDigest,
      editionDigest: selectedEditionDigest,
      evolutionSha256,
    },
    producer: await readPublisherIdentity(),
    execution: { kind: 'declarative', durationMs: 0, deterministic: true },
  });
  return deepFreeze({
    sourceManifest,
    sourceSha256: source.manifestSha256,
    semanticMember: manifest.delivery.semanticMember,
    edition: editionFile,
    editionSha256: manifest.delivery.editionSha256,
    evolution,
    evolutionSha256,
    semanticDigest: selectedSemanticDigest,
    editionDigest: selectedEditionDigest,
    receipt,
  });
}
