import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { sha256 } from '../src/integrations/ethos/projection.mjs';
import { renderEthosAtlas } from '../editions/ethos/atlas.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceSha256 =
  '58121ad168a314af94b55f557435ffb7d9828ca7c476411f18467731ae9d1db0';
const projectionDigest =
  '4ea40f421434106948f1e1d2d9ae5ee6c8b9868edc5538ff755876fd01d37ef8';
const editionSha256 =
  'bcfc207b0f7dc3c56d2bbb8d9a4c7fa43985c43c155e485955c2681bd792a279';

test('current atlas admission binds actual producer output and refuses drift without legacy sidecars', async (t) => {
  const module = new URL('../editions/ethos/atlas-output.mjs', import.meta.url);
  await assert.doesNotReject(
    fs.access(module),
    'current output must have a direct read-only consumer',
  );
  const { readEthosAtlasOutput } = await import(module);
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const directory = await fs.mkdtemp(path.join(base, 'atlas-admission '));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const renderPlan = {
    sourceManifest: path.join(
      root,
      'tests/fixtures/ethos-source/manifest.json',
    ),
    sourceSha256,
    projectionDigest,
    editionManifest: path.join(root, 'editions/ethos/authoring/manifest.json'),
    editionSha256,
    output: path.join(directory, 'atlas'),
  };
  const rendered = await renderEthosAtlas(renderPlan);
  const { output, ...selection } = renderPlan;
  const plan = {
    ...selection,
    outputManifest: path.join(output, 'manifest.json'),
    outputSha256: rendered.manifestSha256,
  };
  const bytes = await fs.readFile(plan.outputManifest),
    manifest = JSON.parse(bytes);
  const result = await readEthosAtlasOutput(plan);
  assert.equal(result.scope, 'artifact-file-integrity');
  assert.equal(result.pages.length, 13);
  assert.equal(result.members.length, 15);
  assert.equal(result.browserAcceptance, 'not-performed');
  assert.equal(result.semanticAcceptance, 'not-performed');
  assert.equal(result.publicationAcceptance, 'not-performed');
  for (const member of result.members)
    assert.equal(sha256(member.content), member.sha256);
  assert.deepEqual(await fs.readFile(plan.outputManifest), bytes);
  await assert.rejects(fs.access(path.join(output, 'atlas-manifest.json')));
  await assert.rejects(fs.access(path.join(output, 'publication')));
  async function altered(label, edit, code) {
    await t.test(label, async () => {
      const value = structuredClone(manifest);
      edit(value);
      const changed = Buffer.from(JSON.stringify(value));
      await fs.writeFile(plan.outputManifest, changed);
      try {
        await assert.rejects(
          readEthosAtlasOutput({ ...plan, outputSha256: sha256(changed) }),
          { code },
        );
      } finally {
        await fs.writeFile(plan.outputManifest, bytes);
      }
    });
  }
  await t.test('caller must select the output digest', async () => {
    await assert.rejects(
      readEthosAtlasOutput({ ...plan, outputSha256: '0'.repeat(64) }),
      { code: 'manifest_digest_mismatch' },
    );
  });
  await altered(
    'wrong source',
    (m) => {
      m.source.commit = '0'.repeat(40);
    },
    'atlas_output_source_mismatch',
  );
  await altered(
    'wrong edition',
    (m) => {
      m.editionSha256 = '0'.repeat(64);
    },
    'atlas_output_edition_mismatch',
  );
  await altered(
    'invented acceptance',
    (m) => {
      m.browserAcceptance = 'PASS';
    },
    'atlas_output_acceptance_invalid',
  );
  await altered(
    'extra authority field',
    (m) => {
      m.authorized = true;
    },
    'atlas_output_fields_invalid',
  );
  await altered(
    'unknown schema',
    (m) => {
      m.schema = 'legacy';
    },
    'atlas_output_schema_invalid',
  );
  await altered(
    'duplicate member',
    (m) => {
      m.files.push({ ...m.files[0] });
    },
    'member_path_duplicate',
  );
  await altered(
    'escaping member',
    (m) => {
      m.files[0].path = '../escape.html';
    },
    'member_path_invalid',
  );
  await altered(
    'missing declared page',
    (m) => {
      m.files.splice(1, 1);
    },
    'bundle_members_mismatch',
  );
  for (const name of ['index.html', 'FONT-LICENSE.txt'])
    await t.test('changed bytes ' + name, async () => {
      const file = path.join(output, name),
        old = await fs.readFile(file),
        changed = Buffer.from(old);
      changed[0] ^= 1;
      await fs.writeFile(file, changed);
      try {
        await assert.rejects(readEthosAtlasOutput(plan), {
          code: 'member_digest_mismatch',
        });
      } finally {
        await fs.writeFile(file, old);
      }
    });
  await t.test(
    'self-consistent substitution still disagrees with edition',
    async () => {
      const file = path.join(output, 'index.html'),
        old = await fs.readFile(file),
        changed = Buffer.from(old);
      changed[0] ^= 1;
      await fs.writeFile(file, changed);
      try {
        const value = structuredClone(manifest);
        value.files[0].sha256 = sha256(changed);
        const raw = Buffer.from(JSON.stringify(value));
        await fs.writeFile(plan.outputManifest, raw);
        await assert.rejects(
          readEthosAtlasOutput({ ...plan, outputSha256: sha256(raw) }),
          { code: 'atlas_output_page_mismatch' },
        );
      } finally {
        await fs.writeFile(file, old);
        await fs.writeFile(plan.outputManifest, bytes);
      }
    },
  );
  await t.test('undeclared file', async () => {
    const file = path.join(output, 'unexpected.txt');
    await fs.writeFile(file, 'unexpected');
    try {
      await assert.rejects(readEthosAtlasOutput(plan), {
        code: 'bundle_members_mismatch',
      });
    } finally {
      await fs.unlink(file);
    }
  });
  await t.test('symlink input', async () => {
    const file = path.join(output, 'FONT-LICENSE.txt'),
      old = await fs.readFile(file),
      target = path.join(directory, 'notice');
    await fs.writeFile(target, old);
    await fs.unlink(file);
    await fs.symlink(target, file);
    try {
      await assert.rejects(readEthosAtlasOutput(plan), {
        code: 'bundle_symlink_forbidden',
      });
    } finally {
      await fs.unlink(file);
      await fs.writeFile(file, old);
    }
  });
  await t.test('missing file', async () => {
    const file = path.join(output, 'FONT-LICENSE.txt'),
      old = await fs.readFile(file);
    await fs.unlink(file);
    try {
      await assert.rejects(readEthosAtlasOutput(plan), {
        code: 'bundle_members_mismatch',
      });
    } finally {
      await fs.writeFile(file, old);
    }
  });
  await t.test(
    'symlink ancestor is not a relocated ordinary directory',
    async () => {
      const alias = path.join(directory, 'linked-parent');
      await fs.symlink(directory, alias);
      try {
        await assert.rejects(
          readEthosAtlasOutput({
            ...plan,
            outputManifest: path.join(alias, 'atlas/manifest.json'),
          }),
          { code: 'bundle_symlink_forbidden' },
        );
      } finally {
        await fs.unlink(alias);
      }
    },
  );
  await t.test(
    'rehashed license substitution does not inherit package identity',
    async () => {
      const file = path.join(output, 'FONT-LICENSE.txt'),
        old = await fs.readFile(file),
        changed = Buffer.from(old);
      changed[0] ^= 1;
      const value = structuredClone(manifest);
      value.files.find((f) => f.path === 'FONT-LICENSE.txt').sha256 =
        sha256(changed);
      const raw = Buffer.from(JSON.stringify(value));
      await fs.writeFile(file, changed);
      await fs.writeFile(plan.outputManifest, raw);
      try {
        await assert.rejects(
          readEthosAtlasOutput({ ...plan, outputSha256: sha256(raw) }),
          { code: 'atlas_output_license_mismatch' },
        );
      } finally {
        await fs.writeFile(file, old);
        await fs.writeFile(plan.outputManifest, bytes);
      }
    },
  );
  await t.test(
    'installed CLI reads relocated current output without development tools',
    async () => {
      const pack = spawnSync(
        'npm',
        ['pack', '--json', '--ignore-scripts', '--pack-destination', directory],
        { cwd: root, encoding: 'utf8' },
      );
      assert.equal(pack.status, 0, pack.stderr);
      const packed = JSON.parse(pack.stdout)[0];
      const consumer = path.join(directory, 'consumer'),
        home = path.join(directory, 'empty-home');
      await fs.mkdir(consumer);
      await fs.mkdir(home);
      const installed = spawnSync(
        'npm',
        [
          'install',
          '--offline',
          '--ignore-scripts',
          '--no-audit',
          '--no-fund',
          '--prefix',
          consumer,
          path.join(directory, packed.filename),
        ],
        { cwd: consumer, encoding: 'utf8' },
      );
      assert.equal(installed.status, 0, installed.stderr);
      const source = path.join(directory, 'relocated source'),
        edition = path.join(directory, 'relocated edition');
      await fs.cp(path.dirname(plan.sourceManifest), source, {
        recursive: true,
      });
      await fs.cp(path.dirname(plan.editionManifest), edition, {
        recursive: true,
      });
      const relocated = {
        ...plan,
        sourceManifest: 'relocated source/manifest.json',
        editionManifest: 'relocated edition/manifest.json',
        outputManifest: 'atlas/manifest.json',
      };
      const planFile = path.join(directory, 'read-plan.json');
      await fs.writeFile(planFile, JSON.stringify(relocated));
      const command = path.join(
        consumer,
        'node_modules/architecture-publisher/src/cli/main.mjs',
      );
      const run = () =>
        spawnSync(
          process.execPath,
          [command, 'atlas', 'ethos', 'verify', planFile],
          {
            cwd: consumer,
            env: { HOME: home, PATH: home, LANG: 'C.UTF-8' },
            encoding: 'utf8',
          },
        );
      const ok = run();
      assert.equal(ok.status, 0, ok.stdout + ok.stderr);
      const observation = JSON.parse(ok.stdout);
      assert.equal(observation.scope, 'artifact-file-integrity');
      assert.equal(observation.pages.length, 13);
      assert.equal(observation.members.length, 15);
      assert.equal(observation.browserAcceptance, 'not-performed');
      assert(!ok.stdout.includes('"content"'));
      assert(!ok.stdout.includes(root));
      const notice = path.join(output, 'FONT-LICENSE.txt'),
        old = await fs.readFile(notice);
      await fs.writeFile(notice, 'substitution');
      try {
        const bad = run();
        assert.equal(bad.status, 1, bad.stdout);
        assert.equal(JSON.parse(bad.stdout).error.code, 'member_size_mismatch');
      } finally {
        await fs.writeFile(notice, old);
      }
    },
  );
  assert.deepEqual(await fs.readFile(plan.outputManifest), bytes);
});
