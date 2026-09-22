import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import test from 'node:test';
import { npmPackageIdentity } from './fixtures/package-identity.mjs';

test('npm package content identity survives different gzip encodings', () => {
  const tarBytes = Buffer.from('portable package content\n'.repeat(4096));
  const fastArchive = gzipSync(tarBytes, { level: 1 });
  const compactArchive = gzipSync(tarBytes, { level: 9 });

  const fast = npmPackageIdentity(fastArchive);
  const compact = npmPackageIdentity(compactArchive);

  assert.notEqual(fast.archiveSha256, compact.archiveSha256);
  assert.equal(fast.contentTarSha256, compact.contentTarSha256);
});
