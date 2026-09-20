import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeSourceBundle } from '../packages/publisher/src/source/write.mjs';
import { fixture } from './fixtures/ethos-source.mjs';
import {
  installCoreAndEthos,
  runInstalledExport,
} from './fixtures/installed-packages.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
test('packed offline ETHOS extension reads selected source without Git or Python', async (t) => {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const out = await fs.mkdtemp(path.join(base, 'ethos cli-'));
  t.after(() => fs.rm(out, { recursive: true, force: true }));
  const { consumer } = await installCoreAndEthos(root, out);
  const f = fixture(),
    bundle = await writeSourceBundle(
      path.join(out, 'bundle'),
      f.source,
      f.members,
    ),
    home = path.join(out, 'home');
  await fs.mkdir(home);
  const args = [
    bundle.manifestPath,
    bundle.manifestSha256,
    f.input.digest,
  ];
  const run = (selected) =>
    runInstalledExport({
      consumer,
      module: '@architecture-publisher/ethos/adapter',
      name: 'verifyEthosSourceInput',
      args: selected,
      cwd: home,
    });
  const read = await run(args);
  assert.equal(read.status, 0, read.stdout + read.stderr);
  const result = JSON.parse(read.stdout);
  assert.equal(result.projectionDigest, f.input.digest);
  assert.equal(result.officialReplay, 'not-performed');
  assert.equal(result.semanticAcceptance, 'not-performed');
  assert(!read.stdout.includes(out));
  assert.equal(result.source.revision, f.input.source.revision);
  const wrong = await run([...args.slice(0, -1), '0'.repeat(64)]);
  assert.equal(wrong.status, 1);
  assert.equal(
    JSON.parse(wrong.stdout).error.code,
    'projection_digest_mismatch',
  );
});
