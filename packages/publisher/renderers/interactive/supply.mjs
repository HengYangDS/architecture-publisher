import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileEnvelope } from '../../src/file-input/read.mjs';
import { fail, hasExactFields } from '../../src/protocol/values.mjs';

const root = fileURLToPath(new URL('./supply/', import.meta.url));
const manifestSha256 = '0c8c5f6db2aefe37709beecc54e1e81ad3afbf6684de2720c70b9d69287a0337';
const error = 'render_interactive_supply_invalid';
const identity = Object.freeze({
  name: 'svg-pan-zoom',
  version: '3.6.2',
  license: 'BSD-2-Clause',
  integrity:
    'sha512-JwnvRWfVKw/Xzfe6jriFyfey/lWJLq4bUh2jwoR5ChWQuQoOH8FEh1l/bEp46iHHKHEJWIyFJETbazraxNWECg==',
});

export function validateInteractiveManifest(value) {
  if (
    !hasExactFields(value, ['schema', 'packages', 'files']) ||
    value.schema !== 'architecture.viewport-supply/v1' ||
    !Array.isArray(value.packages) ||
    value.packages.length !== 1 ||
    !hasExactFields(value.packages[0], Object.keys(identity)) ||
    Object.entries(identity).some(([key, expected]) => value.packages[0][key] !== expected) ||
    !Array.isArray(value.files) ||
    value.files.length !== 2 ||
    value.files[0]?.path !== 'svg-pan-zoom.min.js' ||
    value.files[1]?.path !== 'LICENSE'
  )
    fail(error);
  return value;
}

export async function verifyInteractiveSupply(directory) {
  try {
    const selected = await readFileEnvelope(
      path.join(directory, 'supply.json'),
      manifestSha256,
      validateInteractiveManifest,
      true,
    );
    return {
      version: identity.version,
      manifestSha256: selected.manifestSha256,
      script: Buffer.from(selected.members[0].content),
      license: Buffer.from(selected.members[1].content),
    };
  } catch (cause) {
    throw Object.assign(new Error(error, { cause }), { code: error });
  }
}

export function loadInteractiveSupply() {
  if (arguments.length) fail(error);
  return verifyInteractiveSupply(root);
}
