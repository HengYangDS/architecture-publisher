import { validateManifest } from './manifest.mjs';
import { readFileEnvelope } from './files.mjs';

/** Source schema and meaning stay separate from the shared file envelope. */
export async function readSourceBundle(manifestPath, expectedSha256) {
  const { manifest, manifestSha256, members } = await readFileEnvelope(
    manifestPath,
    expectedSha256,
    validateManifest,
  );
  return {
    source: manifest.source,
    manifestSha256,
    members,
    scope: 'source-file-integrity',
    officialReplay: 'not-performed',
    semanticAcceptance: 'not-performed',
  };
}
