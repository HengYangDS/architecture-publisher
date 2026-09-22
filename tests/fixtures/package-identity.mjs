import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function npmPackageIdentity(archiveBytes) {
  return Object.freeze({
    archiveSha256: sha256(archiveBytes),
    contentTarSha256: sha256(gunzipSync(archiveBytes)),
  });
}
