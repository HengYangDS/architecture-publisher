import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileEnvelope } from '../../src/source/files.mjs';
import { fail, hasExactFields } from '../../src/source/manifest.mjs';

const root = fileURLToPath(new URL('./supply/', import.meta.url));
const manifestSha256 = '28a1a53ac46f760ccdf04ad98dfdf4d01af081ba49d9611fc1793bb9902714a2';
const error = 'render_dagre_supply_invalid';
const packages = [
  {
    name: '@dagrejs/dagre',
    version: '3.1.1',
    license: 'MIT',
    integrity:
      'sha512-zroZB1dFOFiGgv4Xcrn1DckB1o4aOikPqD2NDQPV0WM//CXGcS6xiD0rNkqHmw6FEg4tabt4nxPLwgCWT+Vb2A==',
  },
  {
    name: '@dagrejs/graphlib',
    version: '4.0.5',
    license: 'MIT',
    integrity:
      'sha512-7xrBTqIts3o+PMUZX97wSc+7TUbW+/rULzGNCTP6yooNVDXbzw4Wutg/H/xOutTB/c/k0YqOAavgPh4/Zk9PFA==',
  },
];

/** Verify the selected geometry implementation and its two locked package identities. */
export function validateDagreManifest(value) {
  if (
    !hasExactFields(value, ['schema', 'packages', 'files']) ||
    value.schema !== 'architecture.geometry-supply/v1' ||
    !Array.isArray(value.packages) ||
    value.packages.length !== packages.length ||
    value.packages.some(
      (item, index) =>
        !hasExactFields(item, ['name', 'version', 'license', 'integrity']) ||
        Object.entries(packages[index]).some(([key, expected]) => item[key] !== expected),
    ) ||
    !Array.isArray(value.files) ||
    value.files.length !== 2 ||
    value.files[0]?.path !== 'dagre.min.js' ||
    value.files[1]?.path !== 'LICENSE'
  )
    fail(error);
  return value;
}

/** Read only the exact geometry bytes carried by the installed product. */
export async function verifyDagreSupply(directory) {
  try {
    const selected = await readFileEnvelope(
      path.join(directory, 'supply.json'),
      manifestSha256,
      validateDagreManifest,
      true,
    );
    return {
      version: '3.1.1',
      manifestSha256: selected.manifestSha256,
      script: Buffer.from(selected.members[0].content),
      license: Buffer.from(selected.members[1].content),
    };
  } catch (cause) {
    throw Object.assign(new Error(error, { cause }), { code: error });
  }
}

/** Prevent callers from replacing Publisher's selected geometry supply. */
export function loadDagreSupply() {
  if (arguments.length) fail(error);
  return verifyDagreSupply(root);
}
