import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileEnvelope } from '../../src/file-input/read.mjs';
import { fail } from '../../src/protocol/values.mjs';

const root = fileURLToPath(new URL('./supply/', import.meta.url));
const manifestSha256 = 'c8faffa31505b7dbd5cf5f19cf78c154a610678f6083cb2cd82b83d8ed5f83ef';
const error = 'render_cytoscape_supply_invalid';

/** Internal descriptor validator; the pinned digest still selects the bytes. */
export function validateCytoscapeManifest(value) {
  if (
    value?.schema !== 'architecture.interactive-renderer-supply/v1' ||
    value.package?.name !== 'cytoscape' ||
    value.package.version !== '3.34.3' ||
    value.package.license !== 'MIT' ||
    value.package.integrity !==
      'sha512-yfYGhRcGAntq6YBD583j4n0Eg3jIxvWmZtz/5uz9UYkeIStSlMxuUja+ec5j3iBD8nv1rwaOAYMW09tBdkSeaQ==' ||
    !Array.isArray(value.files) ||
    value.files.length !== 2 ||
    value.files[0]?.path !== 'cytoscape.min.js' ||
    value.files[1]?.path !== 'LICENSE'
  )
    fail(error);
  return value;
}

/** Verify exact packaged browser bytes, not a generic third-party loader. */
export async function verifyCytoscapeSupply(directory) {
  try {
    const verified = await readFileEnvelope(
      path.join(directory, 'supply.json'),
      manifestSha256,
      validateCytoscapeManifest,
    );
    return {
      version: '3.34.3',
      manifestSha256: verified.manifestSha256,
      script: Buffer.from(verified.members[0].content),
      license: Buffer.from(verified.members[1].content),
    };
  } catch (cause) {
    throw Object.assign(new Error(error, { cause }), { code: error });
  }
}

/** Load only the installed, code-owned neutral interactive supply. */
export function loadCytoscapeSupply() {
  if (arguments.length) fail(error);
  return verifyCytoscapeSupply(root);
}
