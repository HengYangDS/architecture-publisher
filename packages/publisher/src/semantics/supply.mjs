import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileEnvelope } from '../source/files.mjs';
import { fail } from '../source/manifest.mjs';

const SUPPLY_SHA256 = '410edfd9498df6d4e186d3c7abd0441563d6ef052c68aa243f9e7c3e4ab6c615';
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
      SUPPLY_SHA256,
      admittedManifest,
    );
    const parser = verified.members.find(({ path: name }) => name === 'parser.mjs');
    return Object.freeze({
      sha256: verified.manifestSha256,
      parserPath: path.join(supplyRoot, 'parser.mjs'),
      parserSha256: parser.sha256,
    });
  } catch (cause) {
    throw Object.assign(new Error(supplyError, { cause }), { code: supplyError });
  }
}

/** Load only the parser whose installed bytes passed package-owned admission. */
export async function loadLikeC4ParserSupply() {
  const supply = await verifyLikeC4Supply();
  try {
    const verifiedParserUrl = pathToFileURL(supply.parserPath).href;
    const parser = await import(verifiedParserUrl);
    if (typeof parser.fromSources !== 'function') fail(supplyError);
    return Object.freeze({ ...supply, fromSources: parser.fromSources });
  } catch (cause) {
    throw Object.assign(new Error(supplyError, { cause }), { code: supplyError });
  }
}
