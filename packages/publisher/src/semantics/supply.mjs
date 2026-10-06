import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileEnvelope } from '../file-input/read.mjs';
import { fail } from '../protocol/values.mjs';
import { LIKEC4_SUPPLY_SHA256 } from './supply-identity.mjs';

const supplyRoot = fileURLToPath(new URL('../../supplies/likec4/', import.meta.url));
const supplyError = 'native_likec4_supply_invalid';

function admittedManifest(value) {
  if (
    value?.schema !== 'architecture.native-parser-supply/v1' ||
    value.parser?.name !== '@likec4/language-services' ||
    value.parser.version !== '1.59.4' ||
    value.builder?.name !== 'esbuild' ||
    value.builder.version !== '0.28.2' ||
    JSON.stringify(value.blockedExternalPackages) !== '["pnpapi"]' ||
    !Array.isArray(value.files) ||
    value.files.length !== 2 ||
    value.files[0]?.path !== 'parser.mjs' ||
    value.files[1]?.path !== 'THIRD-PARTY-NOTICES.txt'
  )
    fail(supplyError);
  return value;
}

/** Verify the installed, code-owned parser supply before it is selected. */
async function verifyLikeC4Supply() {
  try {
    const verified = await readFileEnvelope(
      path.join(supplyRoot, 'supply.json'),
      LIKEC4_SUPPLY_SHA256,
      admittedManifest,
    );
    const parser = verified.members.find(({ path: name }) => name === 'parser.mjs');
    return Object.freeze({
      sha256: verified.manifestSha256,
      parserSha256: parser.sha256,
      parserBytes: Buffer.from(parser.content),
    });
  } catch (cause) {
    throw Object.assign(new Error(supplyError, { cause }), { code: supplyError });
  }
}

/** Return exact verified bytes; never dynamically load the mutable installed path. */
export const readLikeC4ParserSupply = verifyLikeC4Supply;
