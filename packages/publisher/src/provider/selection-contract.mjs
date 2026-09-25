import { EDITION_AUTHORING_FILE_BYTES } from '../edition/authoring.mjs';
import { deepFreeze, jsonValue } from '../semantics/document.mjs';
import {
  fail,
  hasExactFields as exact,
  isDigest,
  LIMITS,
  portableKey,
  portablePath,
} from '../source/manifest.mjs';
import { EDITION_PROVIDER_LIMITS } from './limits.mjs';

const INVALID = 'edition_provider_v2_invalid';
const idPattern = /^[a-z][a-z0-9-]{0,79}$/u;
const valid = (condition) => {
  if (!condition) fail(INVALID);
};
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  value === value.trim() &&
  Buffer.byteLength(value) <= 2048 &&
  ![...value].some((character) => {
    const point = character.codePointAt(0) ?? 0;
    return point <= 0x1f || point === 0x7f || (point >= 0xd800 && point <= 0xdfff);
  });
const identifier = (value) => typeof value === 'string' && idPattern.test(value);
const size = (value, maximum) => Number.isSafeInteger(value) && value >= 0 && value <= maximum;
const selectedPath = (value) => {
  try {
    portablePath(value);
    return true;
  } catch {
    return false;
  }
};
const noFileDirectoryOverlap = (paths) => {
  const files = new Set(paths.map(portableKey));
  const directories = new Map();
  for (const selected of paths) {
    const segments = selected.split('/');
    for (let index = 1; index < segments.length; index++) {
      const directory = segments.slice(0, index).join('/');
      const key = portableKey(directory);
      valid(!files.has(key) && (!directories.has(key) || directories.get(key) === directory));
      directories.set(key, directory);
    }
  }
};

function revision(value) {
  if (!record(value)) fail(INVALID);
  if (value.kind === 'content')
    valid(
      exact(value, ['kind', 'algorithm'], ['canonicalization']) &&
        value.algorithm === 'sha256' &&
        (value.canonicalization === undefined ||
          ['raw-bytes/v1', 'publisher-json/v1'].includes(value.canonicalization)),
    );
  else if (value.kind === 'vcs')
    valid(
      exact(value, ['kind', 'repository', 'ref']) &&
        (value.repository === '.' || selectedPath(value.repository)) &&
        text(value.ref),
    );
  else if (value.kind === 'opaque') valid(exact(value, ['kind', 'value']) && text(value.value));
  else fail(INVALID);
}

function sourceMetadata(value) {
  valid(
    identifier(value.id) &&
      text(value.claimant) &&
      exact(value.format, ['id', 'version']) &&
      text(value.format.id) &&
      text(value.format.version) &&
      size(value.bytes, LIMITS.memberBytes) &&
      isDigest(value.sha256),
  );
}

function selectedContributions(selected) {
  valid(exact(selected, ['native', 'derived', 'edition']));
  valid(Array.isArray(selected.native) && Array.isArray(selected.derived));
  valid(selected.native.length + selected.derived.length <= 256);
  const ids = new Set();
  const nativeIds = new Set();
  const namespaces = new Set();
  let total = 0;
  for (const item of selected.native) {
    valid(exact(item, ['id', 'namespace', 'claimant', 'format', 'revision', 'bytes', 'sha256']));
    sourceMetadata(item);
    valid(text(item.namespace) && !namespaces.has(item.namespace) && !ids.has(item.id));
    revision(item.revision);
    namespaces.add(item.namespace);
    ids.add(item.id);
    nativeIds.add(item.id);
    total += item.bytes;
  }
  for (const item of selected.derived) {
    valid(
      exact(item, [
        'id',
        'claimant',
        'format',
        'derivedFrom',
        'adapter',
        'method',
        'bytes',
        'sha256',
      ]),
    );
    sourceMetadata(item);
    valid(!ids.has(item.id));
    valid(
      Array.isArray(item.derivedFrom) &&
        item.derivedFrom.length > 0 &&
        item.derivedFrom.length <= selected.native.length &&
        new Set(item.derivedFrom).size === item.derivedFrom.length &&
        item.derivedFrom.every((id) => identifier(id) && nativeIds.has(id)),
    );
    valid(
      exact(item.adapter, ['id', 'version', 'contentSha256']) &&
        text(item.adapter.id) &&
        text(item.adapter.version) &&
        isDigest(item.adapter.contentSha256) &&
        text(item.method),
    );
    ids.add(item.id);
    total += item.bytes;
  }
  if (selected.edition !== null) {
    valid(exact(selected.edition, ['id', 'editor', 'bytes', 'sha256', 'resources']));
    valid(
      identifier(selected.edition.id) &&
        text(selected.edition.editor) &&
        size(selected.edition.bytes, EDITION_AUTHORING_FILE_BYTES) &&
        isDigest(selected.edition.sha256) &&
        Array.isArray(selected.edition.resources) &&
        selected.edition.resources.length <= 64,
    );
    total += selected.edition.bytes;
    const resourceKeys = new Set();
    const resourcePaths = [];
    for (const resource of selected.edition.resources) {
      valid(
        exact(resource, ['ref', 'bytes', 'sha256']) &&
          selectedPath(resource.ref) &&
          size(resource.bytes, EDITION_AUTHORING_FILE_BYTES) &&
          isDigest(resource.sha256),
      );
      const key = portableKey(resource.ref);
      valid(!resourceKeys.has(key));
      resourceKeys.add(key);
      resourcePaths.push(resource.ref);
      total += resource.bytes;
    }
    noFileDirectoryOverlap(resourcePaths);
  }
  valid(total <= LIMITS.totalBytes && (selected.native.length > 0 || selected.edition !== null));
  return new Set([
    ...selected.native.map(({ id }) => `native:${id}`),
    ...selected.derived.map(({ id }) => `derived:${id}`),
    ...(selected.edition === null
      ? []
      : [
          `edition:${selected.edition.id}`,
          ...selected.edition.resources.map(({ ref }) => `edition-resource:${ref}`),
        ]),
  ]);
}

function declarativeDelivery(delivery, identities) {
  valid(exact(delivery, ['kind', 'files']) && Array.isArray(delivery.files));
  valid(delivery.files.length === identities.size);
  const seen = new Set();
  const paths = new Set();
  const fileNames = [];
  for (const file of delivery.files) {
    valid(exact(file, ['kind', 'id', 'path']));
    const identity = `${file.kind}:${file.id}`;
    valid(identities.has(identity) && !seen.has(identity) && selectedPath(file.path));
    const key = portableKey(file.path);
    valid(!paths.has(key));
    seen.add(identity);
    paths.add(key);
    fileNames.push(file.path);
  }
  noFileDirectoryOverlap(fileNames);
}

function executableDelivery(delivery, selectedContributions) {
  valid(
    exact(delivery, [
      'kind',
      'package',
      'inputs',
      'nativeInputs',
      'editionInput',
      'editionResourceInputs',
    ]),
  );
  const selected = delivery.package;
  valid(
    exact(selected, ['name', 'version', 'packageJsonSha256', 'contentSha256', 'entrypoint']) &&
      text(selected.name) &&
      text(selected.version) &&
      isDigest(selected.packageJsonSha256) &&
      isDigest(selected.contentSha256) &&
      typeof selected.entrypoint === 'string' &&
      selected.entrypoint.startsWith('./') &&
      selectedPath(selected.entrypoint.slice(2)),
  );
  valid(Array.isArray(delivery.inputs) && delivery.inputs.length <= EDITION_PROVIDER_LIMITS.inputs);
  const ids = new Set();
  const paths = new Set();
  const fileNames = [];
  const inputs = new Map();
  let total = 0;
  for (const input of delivery.inputs) {
    valid(exact(input, ['id', 'path', 'mediaType', 'bytes', 'sha256']));
    valid(
      identifier(input.id) &&
        !['provider-manifest', 'provider-package'].includes(input.id) &&
        !ids.has(input.id) &&
        selectedPath(input.path) &&
        !paths.has(portableKey(input.path)) &&
        text(input.mediaType) &&
        size(input.bytes, EDITION_PROVIDER_LIMITS.inputBytes) &&
        isDigest(input.sha256),
    );
    ids.add(input.id);
    paths.add(portableKey(input.path));
    fileNames.push(input.path);
    inputs.set(input.id, input);
    total += input.bytes;
  }
  noFileDirectoryOverlap(fileNames);
  valid(total <= EDITION_PROVIDER_LIMITS.inputBytes);
  valid(
    Array.isArray(delivery.nativeInputs) &&
      delivery.nativeInputs.length === selectedContributions.native.length,
  );
  const native = new Map(selectedContributions.native.map((item) => [item.id, item]));
  const mappedItems = new Set();
  const mappedInputs = new Set();
  for (const binding of delivery.nativeInputs) {
    valid(exact(binding, ['item', 'input']));
    const item = native.get(binding.item);
    const input = inputs.get(binding.input);
    valid(
      item !== undefined &&
        input !== undefined &&
        !mappedItems.has(binding.item) &&
        !mappedInputs.has(binding.input) &&
        item.bytes === input.bytes &&
        item.sha256 === input.sha256,
    );
    mappedItems.add(binding.item);
    mappedInputs.add(binding.input);
  }
  valid(Array.isArray(delivery.editionResourceInputs));
  if (selectedContributions.edition === null)
    valid(delivery.editionInput === null && delivery.editionResourceInputs.length === 0);
  else {
    const authored = inputs.get(delivery.editionInput);
    valid(
      authored !== undefined &&
        !mappedInputs.has(delivery.editionInput) &&
        authored.bytes === selectedContributions.edition.bytes &&
        authored.sha256 === selectedContributions.edition.sha256,
    );
    mappedInputs.add(delivery.editionInput);
    const resources = new Map(
      selectedContributions.edition.resources.map((resource) => [resource.ref, resource]),
    );
    valid(delivery.editionResourceInputs.length === resources.size);
    const mappedResources = new Set();
    for (const binding of delivery.editionResourceInputs) {
      valid(exact(binding, ['ref', 'input']));
      const resource = resources.get(binding.ref);
      const input = inputs.get(binding.input);
      valid(
        resource !== undefined &&
          input !== undefined &&
          !mappedResources.has(binding.ref) &&
          !mappedInputs.has(binding.input) &&
          resource.bytes === input.bytes &&
          resource.sha256 === input.sha256,
      );
      mappedResources.add(binding.ref);
      mappedInputs.add(binding.input);
    }
  }
}

/** Validate declared selections and mode, not source truth or selected bytes. */
export function validateEditionProviderV2(value) {
  try {
    jsonValue(value, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
  } catch {
    fail(INVALID);
  }
  valid(exact(value, ['schema', 'provider', 'selected', 'delivery']));
  valid(value.schema === 'architecture.edition-provider/v2');
  valid(
    exact(value.provider, ['id', 'revision']) &&
      identifier(value.provider.id) &&
      text(value.provider.revision),
  );
  const identities = selectedContributions(value.selected);
  valid(record(value.delivery));
  if (value.delivery.kind === 'declarative') declarativeDelivery(value.delivery, identities);
  else if (value.delivery.kind === 'executable') executableDelivery(value.delivery, value.selected);
  else fail(INVALID);
  return deepFreeze(structuredClone(value));
}
