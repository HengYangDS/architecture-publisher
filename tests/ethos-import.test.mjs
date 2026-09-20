import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { importEthosSource } from '../adapters/ethos/import.mjs';
import { readEthosSource } from '../adapters/ethos/projection.mjs';
import { fixture, encode, sha } from './fixtures/ethos-source.mjs';

async function setup(t) {
  const base = new URL('../build/test-work/', import.meta.url);
  await fs.mkdir(base, { recursive: true });
  const root = await fs.mkdtemp(new URL('import-', base));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const repo = path.join(root, 'source');
  await fs.mkdir(repo);
  const f = fixture();
  const run = (...args) => {
    const r = spawnSync('git', args, {
      cwd: repo,
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_NOSYSTEM: '1',
      },
    });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
  };
  run('init', '--initial-branch=main');
  run('config', 'user.name', 'Synthetic Test');
  run('config', 'user.email', 'test@example.invalid');
  const python = spawnSync(
    'python3',
    ['-c', 'import sys;print(sys.executable)'],
    { encoding: 'utf8' },
  ).stdout.trim();
  const git = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim();
  assert(
    python && git,
    'Explicit test toolchain must be available for source replay tests',
  );
  const exporter = Buffer.from(
    `import json,subprocess,hashlib,sys\nfrom pathlib import Path\nroot=sys.argv[sys.argv.index('--root')+1]\nrevision=sys.argv[sys.argv.index('--revision')+1]\ndef blob(p):return subprocess.check_output(['git','-C',root,'show',revision+':'+p])\nv=json.loads(blob('fixture-projection.json'))\nv['source']['revision']=revision\nv['source']['git']={'commit':revision,'tree':subprocess.check_output(['git','-C',root,'rev-parse',revision+'^{tree}']).decode().strip()}\nv.pop('digest',None)\nv['digest']=hashlib.sha256((json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False)+'\\n').encode()).hexdigest()\nprint(json.dumps(v,separators=(',',':'),ensure_ascii=False))\n`,
  );
  for (const m of f.members.filter((m) => m.path.startsWith('source/'))) {
    const p = path.join(repo, m.path.slice(7));
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(
      p,
      m.path.endsWith('/export_terminal_architecture.py')
        ? exporter
        : m.content,
    );
  }
  await fs.writeFile(
    path.join(repo, 'fixture-projection.json'),
    encode(f.input),
  );
  run('add', '.');
  run('-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'test fixture');
  const revision = run('rev-parse', 'HEAD');
  f.input.source.revision = revision;
  f.input.source.git = {
    commit: revision,
    tree: run('rev-parse', 'HEAD^{tree}'),
  };
  f.refresh();
  const plan = {
    repository: repo,
    revision,
    projectionDigest: f.input.digest,
    exporterSha256: sha(exporter),
    ownerSha256: sha(
      f.members.find((m) => m.path.endsWith('/projections.py')).content,
    ),
    git,
    python,
    output: path.join(root, 'bundle'),
  };
  return { root, repo, f, plan, exporter };
}

test('explicit replay uses selected committed bytes, not dirty checkout files', async (t) => {
  const f = await setup(t);
  await fs.writeFile(
    path.join(f.repo, 'tools/projection/export_terminal_architecture.py'),
    'raise Exception("dirty source must not run")',
  );
  const result = await importEthosSource(f.plan);
  assert.equal(result.officialReplay, 'performed');
  const input = await readEthosSource(
    result.manifestPath,
    result.manifestSha256,
    f.plan.projectionDigest,
  );
  assert.deepEqual(input.projection, f.f.input);
  assert.equal(input.officialReplay, 'not-performed');
});
for (const field of ['exporterSha256', 'ownerSha256'])
  test(`rejects wrong ${field} before Python/output`, async (t) => {
    const f = await setup(t);
    f.plan[field] = '0'.repeat(64);
    f.plan.python = '/nonexistent/python';
    await assert.rejects(importEthosSource(f.plan), {
      code: 'source_code_digest_mismatch',
    });
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  });
test('rejects wrong projection digest and retains existing output', async (t) => {
  const f = await setup(t);
  await assert.rejects(
    importEthosSource({ ...f.plan, projectionDigest: '0'.repeat(64) }),
    { code: 'projection_digest_mismatch' },
  );
  await fs.mkdir(f.plan.output);
  await fs.writeFile(path.join(f.plan.output, 'keep'), 'unchanged');
  await assert.rejects(importEthosSource(f.plan), { code: 'output_exists' });
  assert.equal(
    await fs.readFile(path.join(f.plan.output, 'keep'), 'utf8'),
    'unchanged',
  );
});
test('requires exact source commit and explicit executable paths', async (t) => {
  const f = await setup(t);
  await assert.rejects(importEthosSource({ ...f.plan, revision: 'HEAD' }), {
    code: 'source_revision_required',
  });
  await assert.rejects(importEthosSource({ ...f.plan, git: 'git' }), {
    code: 'executable_path_required',
  });
  await assert.rejects(importEthosSource({ ...f.plan, python: 'python3' }), {
    code: 'executable_path_required',
  });
});

test('failed Python execution never produces a consumable output', async (t) => {
  const f = await setup(t);
  f.plan.python = '/definitely-absent-python';
  await assert.rejects(importEthosSource(f.plan), {
    code: 'source_process_failed',
  });
  await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
});

test('explicit import CLI resolves plan paths from the plan location', async (t) => {
  const f = await setup(t),
    plan = path.join(f.root, 'plan.json');
  await fs.writeFile(
    plan,
    JSON.stringify({ ...f.plan, repository: 'source', output: 'bundle' }),
  );
  const cli = new URL('../src/cli/main.mjs', import.meta.url);
  const result = spawnSync(
    process.execPath,
    [cli.pathname, 'source', 'ethos', 'import', plan],
    { cwd: path.dirname(f.root), encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.officialReplay, 'performed');
  assert.equal(receipt.manifestPath, path.join(f.root, 'bundle/manifest.json'));
});
