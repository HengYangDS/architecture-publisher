import { createHash } from 'node:crypto';
import { deepFreeze } from '../semantics/document.mjs';
import { fail, hasExactFields, isDigest } from '../protocol/values.mjs';
import { portableKey, portablePath } from '../file-input/contract.mjs';
import { EDITION_PROVIDER_LIMITS } from './limits.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const MAX_RECEIPT_INPUTS = EDITION_PROVIDER_LIMITS.inputs + 2;

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

function base64Bytes(value, code = 'edition_provider_base64_invalid') {
  if (typeof value !== 'string' || /[^A-Za-z0-9+/=]/u.test(value)) fail(code);
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value) fail(code);
  return bytes;
}

function digest(value, code) {
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

function protocolInput(value, index) {
  const selected = exact(
    value,
    ['id', 'mediaType', 'bytes', 'sha256', 'contentBase64'],
    'edition_provider_input_fields_invalid',
  );
  text(selected.id, 'edition_provider_input_identity_invalid');
  text(selected.mediaType, 'edition_provider_input_media_type_invalid');
  if (!Number.isSafeInteger(selected.bytes) || selected.bytes < 0)
    fail('edition_provider_input_size_invalid', `edition_provider_input_size_invalid:${index}`);
  digest(selected.sha256, 'edition_provider_input_identity_invalid');
  const bytes = base64Bytes(selected.contentBase64);
  if (bytes.length !== selected.bytes) fail('edition_provider_input_size_mismatch');
  if (sha(bytes) !== selected.sha256) fail('edition_provider_input_digest_mismatch');
  return selected;
}

function uniqueInputs(values) {
  if (!Array.isArray(values) || values.length > EDITION_PROVIDER_LIMITS.inputs)
    fail('edition_provider_inputs_invalid');
  const ids = new Set();
  let total = 0;
  for (const [index, value] of values.entries()) {
    const input = protocolInput(value, index);
    if (ids.has(input.id)) fail('edition_provider_input_duplicate');
    ids.add(input.id);
    total += input.bytes;
  }
  if (total > EDITION_PROVIDER_LIMITS.inputBytes) fail('edition_provider_input_size_invalid');
  return values;
}

export function validateProviderRequest(value) {
  const selected = exact(
    value,
    ['schema', 'provider', 'subject', 'inputs'],
    'edition_provider_request_fields_invalid',
  );
  if (selected.schema !== 'architecture.edition-provider-request/v1')
    fail('edition_provider_request_schema_unsupported');
  identity(selected.provider, 'edition_provider_identity_invalid');
  identity(selected.subject, 'edition_provider_subject_invalid');
  uniqueInputs(selected.inputs);
  return deepFreeze(structuredClone(selected));
}

function replyMember(value) {
  const selected = exact(
    value,
    ['path', 'contentBase64'],
    'edition_provider_member_fields_invalid',
  );
  providerPath(selected.path, 'edition_provider_member_path_invalid');
  base64Bytes(selected.contentBase64);
  return selected;
}

function jsonValue(value, code) {
  const selected = exact(value, ['contentBase64'], code);
  const bytes = base64Bytes(selected.contentBase64);
  try {
    JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    fail(code);
  }
  return selected;
}

export function validateProviderReply(value) {
  const selected = exact(
    value,
    ['schema', 'source', 'semanticMember', 'edition', 'evolution'],
    'edition_provider_reply_fields_invalid',
  );
  if (selected.schema !== 'architecture.edition-provider-reply/v1')
    fail('edition_provider_reply_schema_unsupported');
  const source = exact(
    selected.source,
    ['id', 'revision', 'members'],
    'edition_provider_source_fields_invalid',
  );
  text(source.id, 'edition_provider_source_identity_invalid');
  text(source.revision, 'edition_provider_source_identity_invalid');
  if (!Array.isArray(source.members) || !source.members.length)
    fail('edition_provider_members_invalid');
  const paths = new Set();
  let total = 0;
  for (const member of source.members) {
    const item = replyMember(member);
    const key = portableKey(item.path);
    if (paths.has(key)) fail('edition_provider_member_duplicate');
    paths.add(key);
    total += base64Bytes(item.contentBase64).length;
  }
  if (total > EDITION_PROVIDER_LIMITS.replyBytes) fail('edition_provider_reply_size_invalid');
  providerPath(selected.semanticMember, 'edition_provider_semantic_member_invalid');
  if (!paths.has(portableKey(selected.semanticMember)))
    fail('edition_provider_semantic_member_missing');
  const semantic = source.members.find(
    ({ path }) => portableKey(path) === portableKey(selected.semanticMember),
  );
  jsonValue({ contentBase64: semantic.contentBase64 }, 'edition_provider_semantic_json_invalid');
  jsonValue(selected.edition, 'edition_provider_edition_json_invalid');
  if (selected.evolution !== null)
    jsonValue(selected.evolution, 'edition_provider_evolution_json_invalid');
  return deepFreeze(structuredClone(selected));
}

function receiptInput(value) {
  const selected = exact(
    value,
    ['id', 'bytes', 'sha256'],
    'edition_provider_receipt_input_invalid',
  );
  text(selected.id, 'edition_provider_receipt_input_invalid');
  if (!Number.isSafeInteger(selected.bytes) || selected.bytes < 0)
    fail('edition_provider_receipt_input_invalid');
  digest(selected.sha256, 'edition_provider_receipt_input_invalid');
  return selected;
}

export function validateProviderMaterialization(value) {
  const selected = exact(
    value,
    [
      'schema',
      'provider',
      'subject',
      'delivery',
      'inputs',
      'materialized',
      'producer',
      'execution',
    ],
    'edition_provider_materialization_fields_invalid',
  );
  if (selected.schema !== 'architecture.edition-provider-materialization/v1')
    fail('edition_provider_materialization_schema_unsupported');
  identity(selected.provider, 'edition_provider_identity_invalid');
  identity(selected.subject, 'edition_provider_subject_invalid');
  if (!['declarative', 'executable'].includes(selected.delivery))
    fail('edition_provider_delivery_kind_invalid');
  if (!Array.isArray(selected.inputs) || selected.inputs.length > MAX_RECEIPT_INPUTS)
    fail('edition_provider_receipt_inputs_invalid');
  const ids = new Set();
  for (const value of selected.inputs) {
    const input = receiptInput(value);
    if (ids.has(input.id)) fail('edition_provider_input_duplicate');
    ids.add(input.id);
  }
  const materialized = exact(
    selected.materialized,
    ['sourceManifestSha256', 'claimModelDigest', 'editionDigest', 'evolutionSha256'],
    'edition_provider_materialized_identity_invalid',
  );
  digest(materialized.sourceManifestSha256, 'edition_provider_materialized_identity_invalid');
  digest(materialized.claimModelDigest, 'edition_provider_materialized_identity_invalid');
  digest(materialized.editionDigest, 'edition_provider_materialized_identity_invalid');
  if (materialized.evolutionSha256 !== null)
    digest(materialized.evolutionSha256, 'edition_provider_materialized_identity_invalid');
  const producer = exact(
    selected.producer,
    ['name', 'version'],
    'edition_provider_producer_invalid',
  );
  if (producer.name !== 'architecture-publisher') fail('edition_provider_producer_invalid');
  text(producer.version, 'edition_provider_producer_invalid');
  const execution = exact(
    selected.execution,
    ['kind', 'durationMs', 'deterministic'],
    'edition_provider_execution_invalid',
  );
  const expectedExecution = selected.delivery === 'declarative' ? 'declarative' : 'child-process';
  if (
    execution.kind !== expectedExecution ||
    !Number.isSafeInteger(execution.durationMs) ||
    execution.durationMs < 0 ||
    typeof execution.deterministic !== 'boolean'
  )
    fail('edition_provider_execution_invalid');
  return deepFreeze(structuredClone(selected));
}
