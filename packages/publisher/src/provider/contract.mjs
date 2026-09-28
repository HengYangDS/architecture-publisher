import { createHash } from 'node:crypto';
import { canonical, deepFreeze } from '../semantics/document.mjs';
import { fail, hasExactFields, isDigest } from '../protocol/values.mjs';
import { portableKey, portablePath } from '../file-input/contract.mjs';
import { EDITION_PROVIDER_LIMITS } from './limits.mjs';

const CONTRACTS = Object.freeze({
  sourceBundle: 'architecture.source-bundle/v1',
  claimModel: 'architecture.claim-model/v2',
  edition: 'architecture.edition/v1',
});
const COMMON_FIELDS = Object.freeze([
  'schema',
  'provider',
  'subject',
  'contracts',
  'delivery',
  'expected',
  'limits',
]);
const DECLARATIVE_FIELDS = Object.freeze([
  'kind',
  'sourceManifest',
  'sourceManifestSha256',
  'semanticMember',
  'edition',
  'editionSha256',
  'evolution',
  'evolutionSha256',
]);
const EXECUTABLE_FIELDS = Object.freeze(['kind', 'package', 'inputs']);
const PACKAGE_FIELDS = Object.freeze([
  'name',
  'version',
  'packageJsonSha256',
  'contentSha256',
  'entrypoint',
]);
const INPUT_FIELDS = Object.freeze(['id', 'path', 'mediaType', 'bytes', 'sha256']);
const RESERVED_RECEIPT_INPUT_IDS = new Set(['provider-manifest', 'provider-package']);
const EXPECTED_FIELDS = Object.freeze([
  'sourceManifestSha256',
  'claimModelDigest',
  'editionDigest',
  'evolutionSha256',
]);
const LIMIT_FIELDS = Object.freeze(['inputs', 'inputBytes', 'replyBytes', 'timeoutMs']);

function record(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(code);
  return value;
}

function exact(value, fields, code) {
  const selected = record(value, code);
  if (!hasExactFields(selected, fields)) fail(code);
  return selected;
}

function text(value, code) {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value !== value.trim() ||
    Buffer.byteLength(value, 'utf8') > 2048 ||
    [...value].some((character) => {
      const point = character.codePointAt(0);
      return (
        point === undefined ||
        point <= 0x1f ||
        point === 0x7f ||
        (point >= 0xd800 && point <= 0xdfff)
      );
    })
  )
    fail(code);
  return value;
}

function identity(value, code) {
  const selected = exact(value, ['id', 'revision'], code);
  text(selected.id, code);
  text(selected.revision, code);
  return selected;
}

function selectedDigest(value, code, optional = false) {
  if (optional && value === null) return null;
  if (!isDigest(value)) fail(code);
  return value;
}

function providerPath(value, code) {
  try {
    return portablePath(value);
  } catch {
    fail(code);
  }
}

function requestedLimit(value, maximum, code) {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) fail(code);
  return value;
}

function contracts(value) {
  const selected = exact(
    value,
    ['sourceBundle', 'claimModel', 'edition', 'evolution'],
    'edition_provider_contracts_invalid',
  );
  for (const [key, expected] of Object.entries(CONTRACTS))
    if (selected[key] !== expected) fail('edition_provider_contract_unsupported', key);
  if (
    selected.evolution !== null &&
    selected.evolution !== 'architecture.edition-evolution-input/v1'
  )
    fail('edition_provider_contract_unsupported', 'evolution');
  return selected;
}

function limits(value) {
  const selected = exact(value, LIMIT_FIELDS, 'edition_provider_limits_invalid');
  requestedLimit(
    selected.inputs,
    EDITION_PROVIDER_LIMITS.inputs,
    'edition_provider_limits_invalid',
  );
  requestedLimit(
    selected.inputBytes,
    EDITION_PROVIDER_LIMITS.inputBytes,
    'edition_provider_limits_invalid',
  );
  requestedLimit(
    selected.replyBytes,
    EDITION_PROVIDER_LIMITS.replyBytes,
    'edition_provider_limits_invalid',
  );
  requestedLimit(
    selected.timeoutMs,
    EDITION_PROVIDER_LIMITS.timeoutMs,
    'edition_provider_limits_invalid',
  );
  return selected;
}

function expected(value, hasEvolution) {
  const selected = exact(value, EXPECTED_FIELDS, 'edition_provider_expected_invalid');
  selectedDigest(selected.sourceManifestSha256, 'edition_provider_expected_identity_invalid');
  selectedDigest(selected.claimModelDigest, 'edition_provider_expected_identity_invalid');
  selectedDigest(selected.editionDigest, 'edition_provider_expected_identity_invalid');
  if (hasEvolution !== (selected.evolutionSha256 !== null))
    fail('edition_provider_evolution_identity_invalid');
  if (hasEvolution)
    selectedDigest(selected.evolutionSha256, 'edition_provider_expected_identity_invalid');
  return selected;
}

function declarativeDelivery(value) {
  const selected = exact(value, DECLARATIVE_FIELDS, 'edition_provider_delivery_fields_invalid');
  if (selected.kind !== 'declarative') fail('edition_provider_delivery_kind_invalid');
  providerPath(selected.sourceManifest, 'edition_provider_delivery_path_invalid');
  selectedDigest(selected.sourceManifestSha256, 'edition_provider_delivery_identity_invalid');
  providerPath(selected.semanticMember, 'edition_provider_delivery_path_invalid');
  providerPath(selected.edition, 'edition_provider_delivery_path_invalid');
  selectedDigest(selected.editionSha256, 'edition_provider_delivery_identity_invalid');
  if ((selected.evolution === null) !== (selected.evolutionSha256 === null))
    fail('edition_provider_evolution_selection_invalid');
  if (selected.evolution !== null) {
    providerPath(selected.evolution, 'edition_provider_delivery_path_invalid');
    selectedDigest(selected.evolutionSha256, 'edition_provider_delivery_identity_invalid');
  }
  return selected;
}

function packageSelection(value) {
  const selected = exact(value, PACKAGE_FIELDS, 'edition_provider_package_fields_invalid');
  text(selected.name, 'edition_provider_package_identity_invalid');
  text(selected.version, 'edition_provider_package_identity_invalid');
  selectedDigest(selected.packageJsonSha256, 'edition_provider_package_identity_invalid');
  selectedDigest(selected.contentSha256, 'edition_provider_package_identity_invalid');
  const entrypoint = text(selected.entrypoint, 'edition_provider_entrypoint_invalid');
  if (
    !entrypoint.startsWith('./') ||
    entrypoint.includes('\\') ||
    entrypoint.includes(':') ||
    entrypoint
      .split('/')
      .some((part, index) => index > 0 && (!part || part === '.' || part === '..'))
  )
    fail('edition_provider_entrypoint_invalid');
  return selected;
}

function executableInput(value, index) {
  const selected = exact(value, INPUT_FIELDS, 'edition_provider_input_fields_invalid');
  text(selected.id, 'edition_provider_input_identity_invalid');
  providerPath(selected.path, 'edition_provider_input_path_invalid');
  text(selected.mediaType, 'edition_provider_input_media_type_invalid');
  if (
    !Number.isSafeInteger(selected.bytes) ||
    selected.bytes < 0 ||
    selected.bytes > EDITION_PROVIDER_LIMITS.inputBytes
  )
    fail('edition_provider_input_size_invalid', `edition_provider_input_size_invalid:${index}`);
  selectedDigest(selected.sha256, 'edition_provider_input_identity_invalid');
  return selected;
}

function executableDelivery(value, selectedLimits) {
  const selected = exact(value, EXECUTABLE_FIELDS, 'edition_provider_delivery_fields_invalid');
  if (selected.kind !== 'executable') fail('edition_provider_delivery_kind_invalid');
  packageSelection(selected.package);
  if (
    !Array.isArray(selected.inputs) ||
    selected.inputs.length > selectedLimits.inputs ||
    selected.inputs.length > EDITION_PROVIDER_LIMITS.inputs
  )
    fail('edition_provider_inputs_invalid');
  const ids = new Set();
  const paths = new Set();
  let total = 0;
  for (const [index, input] of selected.inputs.entries()) {
    const item = executableInput(input, index);
    const key = portableKey(item.path);
    if (RESERVED_RECEIPT_INPUT_IDS.has(item.id)) fail('edition_provider_input_id_reserved');
    if (ids.has(item.id) || paths.has(key)) fail('edition_provider_input_duplicate');
    ids.add(item.id);
    paths.add(key);
    total += item.bytes;
  }
  if (total > selectedLimits.inputBytes) fail('edition_provider_input_size_invalid');
  return selected;
}

export function validateEditionProvider(value) {
  const selected = exact(value, COMMON_FIELDS, 'edition_provider_fields_invalid');
  if (selected.schema !== 'architecture.edition-provider/v1')
    fail('edition_provider_schema_unsupported');
  identity(selected.provider, 'edition_provider_identity_invalid');
  identity(selected.subject, 'edition_provider_subject_invalid');
  contracts(selected.contracts);
  const selectedLimits = limits(selected.limits);
  const kind = record(selected.delivery, 'edition_provider_delivery_fields_invalid').kind;
  if (kind === 'declarative') declarativeDelivery(selected.delivery);
  else if (kind === 'executable') executableDelivery(selected.delivery, selectedLimits);
  else fail('edition_provider_delivery_kind_invalid');
  const hasEvolution =
    kind === 'declarative'
      ? selected.delivery.evolution !== null
      : selected.contracts.evolution !== null;
  expected(selected.expected, hasEvolution);
  return deepFreeze(structuredClone(selected));
}

export function editionProviderDigest(value) {
  return createHash('sha256')
    .update(canonical(validateEditionProvider(value)))
    .digest('hex');
}
