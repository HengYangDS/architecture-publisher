// Filesystem effects only. These tests create no browser or approval reports.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  planPairFiles,
  installPairFiles,
  recoverPairFiles,
} from '../packages/publisher/src/publication/files.mjs';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const root = path.resolve(import.meta.dirname, '..');
const publisher = path.join(root, 'packages/publisher');
async function fixture(t) {
  const dir = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'pair-files-')));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const sources = path.join(dir, 'sources');
  await fs.mkdir(sources);
  await fs.writeFile(path.join(sources, 'figure.svg'), '<svg/>');
  await fs.writeFile(path.join(sources, 'page.html'), '<html>file fixture</html>');
  const destinations = {
    native: path.join(dir, 'native'),
    atlas: path.join(dir, 'atlas'),
  };
  for (const target of Object.values(destinations)) {
    await fs.mkdir(target);
    await fs.writeFile(path.join(target, 'owner-note.txt'), 'keep this exact byte');
    await fs.writeFile(path.join(target, '.DS_Store'), 'metadata');
    await fs.mkdir(path.join(target, 'empty'));
    await fs.writeFile(path.join(target, 'index.html'), 'old entry');
  }
  return {
    dir,
    options: {
      sourceRoots: [sources],
      destinations,
      recoveryRoot: path.join(dir, 'recovery'),
    },
  };
}
async function planFiles(options) {
  const payload = [];
  async function add(medium, file, target) {
    const source = path.join(options.sourceRoots[0], file),
      bytes = await fs.readFile(source);
    payload.push({
      medium,
      path: target,
      source,
      bytes: bytes.length,
      sha256: sha(bytes),
    });
  }
  await add('native', 'figure.svg', 'terminal/figure.svg');
  for (let i = 0; i < 13; i++) await add('atlas', 'page.html', 'atlas/page-' + i + '/index.html');
  const entries = Object.fromEntries(
    ['native', 'atlas'].map((m) => [
      m,
      { 'index.html': 'Open ' + m, 'README.md': 'Filesystem fixture only' },
    ]),
  );
  return planPairFiles({
    options,
    source: { id: 'file-test:two-media' },
    payload,
    entries,
    dependencies: [],
  });
}
const approve = (plan) => ({ decision: 'AUTHORIZED', planSha256: plan.sha256 });
async function interruptWriter(dir, plan, acceptance, phase, side, mode = 'install') {
  const input = path.join(dir, 'writer-input.json'),
    child = path.join(dir, 'writer-interrupt.mjs');
  await fs.writeFile(input, JSON.stringify({ plan, acceptance, phase, side, mode }));
  await fs.writeFile(
    child,
    `import fs from 'node:fs/promises';import path from 'node:path';
import {installPairFiles,recoverPairFiles} from ${JSON.stringify(new URL('../packages/publisher/src/publication/files.mjs', import.meta.url).href)};
const {plan,acceptance,phase,side,mode}=JSON.parse(await fs.readFile(process.argv[2])),lock=path.join(path.dirname(plan.options.destinations.native),'.architecture-publication-writer');
const native={mkdir:fs.mkdir,writeFile:fs.writeFile,rename:fs.rename,unlink:fs.unlink};
async function invoke(name,args,event){if(event===phase&&side==='before')process.kill(process.pid,'SIGKILL');const result=await native[name](...args);if(event===phase&&side==='after')process.kill(process.pid,'SIGKILL');return result;}
fs.mkdir=(a,...args)=>invoke('mkdir',[a,...args],a===lock?'activation':'');
fs.writeFile=(a,...args)=>invoke('writeFile',[a,...args],a.endsWith('/owner.json')?'owner-publication':'');
fs.unlink=(a,...args)=>invoke('unlink',[a,...args],a===path.join(lock,'owner.json')?'release':'');
fs.rename=async(a,b)=>{let event=b===lock?'activation':a===plan.options.destinations.native?'save-native':'';if(a===lock){const owner=JSON.parse(await fs.readFile(path.join(lock,'owner.json')));event=owner.pid===process.pid?'release':'reclaim';}return invoke('rename',[a,b],event);};
await (mode==='install'?installPairFiles:recoverPairFiles)(plan,acceptance);`,
  );
  const result = spawnSync(process.execPath, [child, input], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 8e6,
  });
  assert.equal(result.signal, 'SIGKILL', result.stderr);
}

for (const phase of ['owner-publication', 'activation', 'release'])
  for (const side of ['before', 'after'])
    test(`writer termination ${side} ${phase} leaves a recoverable or unstarted operation`, async (t) => {
      const { dir, options } = await fixture(t),
        plan = await planFiles(options),
        acceptance = approve(plan);
      await interruptWriter(dir, plan, acceptance, phase, side);
      const result = await recoverPairFiles(plan, acceptance);
      assert.equal(result.status, phase === 'release' ? 'ALREADY_INSTALLED' : 'NOT_STARTED');
      if (phase !== 'release') {
        for (const target of Object.values(options.destinations))
          assert.deepEqual((await fs.readdir(target)).sort(), [
            '.DS_Store',
            'empty',
            'index.html',
            'owner-note.txt',
          ]);
        assert.equal((await installPairFiles(plan, acceptance)).status, 'INSTALLED');
      }
      for (const target of Object.values(options.destinations))
        assert.equal(
          await fs.readFile(path.join(target, 'owner-note.txt'), 'utf8'),
          'keep this exact byte',
        );
    });

for (const side of ['before', 'after'])
  test(`writer termination ${side} stale reclamation can be resumed`, async (t) => {
    const { dir, options } = await fixture(t),
      plan = await planFiles(options),
      acceptance = approve(plan);
    await interruptWriter(dir, plan, acceptance, 'save-native', 'after');
    await interruptWriter(dir, plan, acceptance, 'reclaim', side, 'recover');
    assert.equal((await recoverPairFiles(plan, acceptance)).status, 'ROLLED_BACK');
    assert.equal((await recoverPairFiles(plan, acceptance)).status, 'ALREADY_ROLLED_BACK');
    for (const target of Object.values(options.destinations))
      assert.deepEqual((await fs.readdir(target)).sort(), [
        '.DS_Store',
        'empty',
        'index.html',
        'owner-note.txt',
      ]);
  });

test('an ambiguous empty writer lock is never replaced by an installation', async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    lock = path.join(dir, '.architecture-publication-writer');
  await fs.mkdir(lock);
  await assert.rejects(installPairFiles(plan, approve(plan)));
  assert.deepEqual(await fs.readdir(lock), []);
  for (const target of Object.values(options.destinations))
    assert.equal(await fs.readFile(path.join(target, 'index.html'), 'utf8'), 'old entry');
});

test('a delayed stale reclaimer cannot move a newer active writer', async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, 'save-native', 'after');
  const lock = path.join(dir, '.architecture-publication-writer'),
    rename = fs.rename;
  let raced = false;
  fs.rename = async (a, b) => {
    if (!raced && a === lock) {
      raced = true;
      assert.equal((await recoverPairFiles(plan, acceptance)).status, 'ROLLED_BACK');
      const next = await planPairFiles({
        options,
        source: { id: 'next-file-test' },
        payload: plan.payload,
        entries: plan.entries,
        dependencies: plan.dependencies,
      });
      let checked = false;
      await installPairFiles(next, approve(next), {
        rename: async (from, to) => {
          if (!checked) {
            checked = true;
            const owner = await fs.readFile(path.join(lock, 'owner.json'), 'utf8');
            await assert.rejects(rename(a, b), (e) => ['EEXIST', 'ENOTEMPTY'].includes(e.code));
            assert.equal(await fs.readFile(path.join(lock, 'owner.json'), 'utf8'), owner);
          }
          return rename(from, to);
        },
      });
      assert.equal(checked, true);
      throw Error('Delayed reclaimer lost exact identity');
    }
    return rename(a, b);
  };
  try {
    await assert.rejects(recoverPairFiles(plan, acceptance), /lost exact identity/);
  } finally {
    fs.rename = rename;
  }
  assert.equal(raced, true);
  for (const target of Object.values(options.destinations))
    assert.equal(
      await fs.readFile(path.join(target, 'owner-note.txt'), 'utf8'),
      'keep this exact byte',
    );
});

test('writer control locations cannot be selected as user destinations', async (t) => {
  const { dir, options } = await fixture(t);
  for (const name of [
    '.architecture-publication-writer',
    '.architecture-publication-writer-history',
    '.architecture-publication-stage-conflict',
  ])
    await assert.rejects(
      planFiles({
        ...options,
        destinations: { ...options.destinations, native: path.join(dir, name) },
      }),
      /reserved.*namespace/i,
    );
  for (const name of [
    '.architecture-publication-writer-history/nested',
    '.ARCHITECTURE-PUBLICATION-WRITER-HISTORY',
  ])
    await assert.rejects(
      planFiles({ ...options, recoveryRoot: path.join(dir, name) }),
      /reserved.*namespace/i,
    );
});

test('foreign-host and different-plan writer records are preserved and refused', async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await interruptWriter(dir, plan, acceptance, 'save-native', 'after');
  const file = path.join(dir, '.architecture-publication-writer/owner.json'),
    original = JSON.parse(await fs.readFile(file));
  for (const changed of [
    { ...original, host: 'another-host.invalid' },
    { ...original, planSha256: '0'.repeat(64) },
  ]) {
    const bytes = JSON.stringify(changed);
    await fs.writeFile(file, bytes);
    await assert.rejects(recoverPairFiles(plan, acceptance), /active installer|exact prior plan/);
    assert.equal(await fs.readFile(file, 'utf8'), bytes);
  }
  await fs.writeFile(file, JSON.stringify(original));
  assert.equal((await recoverPairFiles(plan, acceptance)).status, 'ROLLED_BACK');
});

test('pair publisher belongs to existing delivery entry and dry-run preserves both targets', async (t) => {
  assert.equal(typeof planFiles, 'function');
  const { options } = await fixture(t),
    p = await planFiles(options);
  assert.equal(p.mode, 'dry-run');
  assert.equal(p.source.id, 'file-test:two-media');
  assert.equal(
    p.payload.filter((f) => f.medium === 'atlas' && f.path.endsWith('index.html')).length,
    13,
  );
  assert.ok(p.payload.some((f) => f.medium === 'native' && f.path === 'terminal/figure.svg'));
  assert.equal(p.scope, 'file-installation-only');
  assert.ok(p.payload.every((f) => /^[a-f\d]{64}$/.test(f.sha256)));
  for (const target of Object.values(options.destinations))
    assert.deepEqual((await fs.readdir(target)).sort(), [
      '.DS_Store',
      'empty',
      'index.html',
      'owner-note.txt',
    ]);
  await assert.rejects(fs.stat(options.recoveryRoot), { code: 'ENOENT' });
});

test('exact pair install preserves foreign bytes, previous entries and every atlas page', async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  const result = await installPairFiles(p, approve(p));
  assert.equal(result.status, 'INSTALLED');
  assert.equal(result.globalAtomicity, false);
  for (const medium of ['native', 'atlas']) {
    const target = options.destinations[medium];
    assert.equal(
      await fs.readFile(path.join(target, 'owner-note.txt'), 'utf8'),
      'keep this exact byte',
    );
    assert.equal(await fs.readFile(path.join(target, '.DS_Store'), 'utf8'), 'metadata');
    assert.ok((await fs.stat(path.join(target, 'empty'))).isDirectory());
    const m = JSON.parse(await fs.readFile(path.join(target, 'delivery-manifest.json')));
    assert.equal(m.source.digest, p.source.digest);
    assert.equal(m.planSha256, p.sha256);
    assert.equal(
      await fs.readFile(path.join(target, m.previousEntries['index.html']), 'utf8'),
      'old entry',
    );
    for (const row of p.payload.filter((f) => f.medium === medium))
      assert.equal(sha(await fs.readFile(path.join(target, row.path))), row.sha256);
    assert.equal(
      await fs.readFile(path.join(result.recovery[medium], 'index.html'), 'utf8'),
      'old entry',
    );
  }
  const again = await installPairFiles(p, approve(p));
  assert.equal(again.status, 'ALREADY_INSTALLED');
});

test('missing or mismatched acceptance, stale plan and destination drift refuse all writes', async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  for (const approval of [
    undefined,
    { ...approve(p), decision: 'PENDING' },
    { ...approve(p), planSha256: '0'.repeat(64) },
  ])
    await assert.rejects(installPairFiles(p, approval), /authorization|approved/i);
  const tampered = structuredClone(p);
  tampered.payload.pop();
  await assert.rejects(installPairFiles(tampered, approve(p)), /plan.*digest|plan.*hash/i);
  await fs.writeFile(path.join(options.destinations.native, 'late.txt'), 'concurrent edit');
  await assert.rejects(installPairFiles(p, approve(p)), /destination.*changed|prestate/i);
  assert.equal(
    await fs.readFile(path.join(options.destinations.atlas, 'index.html'), 'utf8'),
    'old entry',
  );
  await assert.rejects(fs.stat(options.recoveryRoot), { code: 'ENOENT' });
});

test('second installation failure restores both original directory states', async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  let failed = false;
  const rename = async (a, b) => {
    if (!failed && b === options.destinations.atlas && a.includes('stage')) {
      failed = true;
      throw Error('Injected second installation failure');
    }
    return fs.rename(a, b);
  };
  await assert.rejects(installPairFiles(p, approve(p), { rename }), /second installation failure/);
  assert.equal(failed, true);
  for (const target of Object.values(options.destinations)) {
    assert.equal(await fs.readFile(path.join(target, 'index.html'), 'utf8'), 'old entry');
    assert.deepEqual((await fs.readdir(target)).sort(), [
      '.DS_Store',
      'empty',
      'index.html',
      'owner-note.txt',
    ]);
  }
});

test('source or target symlinks, overlaps and payload collisions fail before writes', async (t) => {
  const { dir, options } = await fixture(t);
  await fs.mkdir(path.join(options.destinations.native, 'terminal'));
  await fs.writeFile(path.join(options.destinations.native, 'terminal/figure.svg'), 'foreign');
  await assert.rejects(planFiles(options), /collision/i);
  await fs.unlink(path.join(options.destinations.native, 'terminal/figure.svg'));
  await fs.rmdir(path.join(options.destinations.native, 'terminal'));
  await fs.symlink('/not-owned', path.join(options.destinations.atlas, 'foreign-link'));
  await assert.rejects(planFiles(options), /symlink|symbolic/i);
  await fs.unlink(path.join(options.destinations.atlas, 'foreign-link'));
  await assert.rejects(
    planFiles({
      ...options,
      destinations: {
        ...options.destinations,
        atlas: options.destinations.native,
      },
    }),
    /overlap|distinct/i,
  );
  await assert.rejects(
    planFiles({
      ...options,
      recoveryRoot: path.join(options.destinations.native, 'backup'),
    }),
    /overlap/i,
  );
  await assert.rejects(
    planFiles({
      ...options,
      destinations: {
        ...options.destinations,
        native: path.join(options.sourceRoots[0], 'not-admitted'),
      },
    }),
    /overlap/i,
  );
  await assert.rejects(fs.stat(path.join(dir, 'recovery')), { code: 'ENOENT' });
});

test('a recomputed plan cannot replace the canonical payload with arbitrary content', async (t) => {
  const { dir, options } = await fixture(t),
    p = await planFiles(options),
    file = path.join(dir, 'arbitrary.txt');
  await fs.writeFile(file, 'arbitrary');
  p.payload[0] = {
    ...p.payload[0],
    source: file,
    sha256: sha('arbitrary'),
    bytes: 9,
  };
  const { sha256: _, ...body } = p;
  p.sha256 = sha(JSON.stringify(body, null, 2) + '\n');
  await assert.rejects(installPairFiles(p, approve(p)), /canonical|plan.*changed|source outside/i);
  await assert.rejects(fs.stat(options.recoveryRoot), { code: 'ENOENT' });
});

test('migration rehearsal reads real previous deliveries but writes only temporary copies', async (t) => {
  const prior = {
    native: process.env.PAIR_PRIOR_NATIVE,
    atlas: process.env.PAIR_PRIOR_ATLAS,
  };
  if (!prior.native && !prior.atlas) {
    t.skip('Real delivery rehearsal requires explicit PAIR_PRIOR_NATIVE and PAIR_PRIOR_ATLAS');
    return;
  }
  for (const [medium, file] of Object.entries(prior))
    assert.ok(
      typeof file === 'string' && path.isAbsolute(file),
      'Explicit absolute prior ' + medium + ' destination required',
    );
  const { options } = await fixture(t);
  for (const [medium, old] of Object.entries(prior)) {
    await fs.rm(options.destinations[medium], { recursive: true });
    await fs.cp(old, options.destinations[medium], { recursive: true });
  }
  const p = await planFiles(options);
  assert.ok(p.prestates.native.entries.length > 30);
  assert.ok(p.prestates.atlas.entries.length > 70);
  const result = await installPairFiles(p, approve(p));
  assert.equal(result.status, 'INSTALLED');
  for (const medium of ['native', 'atlas']) {
    const target = options.destinations[medium],
      m = JSON.parse(await fs.readFile(path.join(target, 'delivery-manifest.json')));
    for (const before of p.prestates[medium].entries.filter((e) => e.kind === 'file'))
      assert.equal(
        sha(await fs.readFile(path.join(target, m.previousEntries[before.path] ?? before.path))),
        before.sha256,
      );
  }
});

test('unknown manifest text is preserved as data, not parsed as accepted authority', async (t) => {
  const { options } = await fixture(t);
  await fs.writeFile(
    path.join(options.destinations.native, 'delivery-manifest.json'),
    'owner text, not JSON',
  );
  const p = await planFiles(options),
    r = await installPairFiles(p, approve(p));
  assert.equal(r.status, 'INSTALLED');
  const m = JSON.parse(
    await fs.readFile(path.join(options.destinations.native, 'delivery-manifest.json')),
  );
  assert.equal(
    await fs.readFile(
      path.join(options.destinations.native, m.previousEntries['delivery-manifest.json']),
      'utf8',
    ),
    'owner text, not JSON',
  );
});

test('JSON null old metadata is preserved without being treated as a delivery receipt', async (t) => {
  const { options } = await fixture(t);
  await fs.writeFile(path.join(options.destinations.native, 'delivery-manifest.json'), 'null');
  const p = await planFiles(options),
    r = await installPairFiles(p, approve(p));
  assert.equal(r.status, 'INSTALLED');
});

test('reserved root metadata occupied by a directory is rejected before staging', async (t) => {
  const { options } = await fixture(t);
  await fs.mkdir(path.join(options.destinations.native, 'README.md'));
  await fs.writeFile(path.join(options.destinations.native, 'README.md', 'child.txt'), 'preserve');
  await assert.rejects(planFiles(options), /reserved.*directory|metadata.*file/i);
  await assert.rejects(fs.stat(options.recoveryRoot), { code: 'ENOENT' });
  assert.equal(
    await fs.readFile(path.join(options.destinations.native, 'README.md', 'child.txt'), 'utf8'),
    'preserve',
  );
});

test('case-insensitive macOS aliases cannot bypass source/destination overlap checks', async (t) => {
  const { options } = await fixture(t),
    original = options.sourceRoots[0],
    alias = original.replace('/sources', '/SOURCES');
  if ((await fs.realpath(alias).catch(() => null)) !== (await fs.realpath(original))) {
    t.skip('Case-sensitive filesystem');
    return;
  }
  await assert.rejects(
    planFiles({
      ...options,
      destinations: {
        native: path.join(alias, 'unwritten-native'),
        atlas: path.join(alias, 'unwritten-atlas'),
      },
    }),
    /overlap|canonical/i,
  );
  await assert.rejects(fs.stat(path.join(alias, 'unwritten-native')), {
    code: 'ENOENT',
  });
});

test('replay rejects coordinated entry, manifest and checksum drift', async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  await installPairFiles(p, approve(p));
  const target = options.destinations.native,
    mp = path.join(target, 'delivery-manifest.json'),
    m = JSON.parse(await fs.readFile(mp));
  await fs.writeFile(path.join(target, 'index.html'), 'foreign redirect');
  const entry = m.files.find((f) => f.path === 'index.html');
  entry.sha256 = sha('foreign redirect');
  entry.bytes = 16;
  const bytes = JSON.stringify(m, null, 2) + '\n';
  await fs.writeFile(mp, bytes);
  await fs.writeFile(
    path.join(target, 'SHA256SUMS'),
    m.files
      .concat({ path: 'delivery-manifest.json', sha256: sha(bytes) })
      .map((f) => `${f.sha256}  ${f.path}`)
      .join('\n') + '\n',
  );
  await assert.rejects(
    installPairFiles(p, approve(p)),
    /installed.*(?:entry|manifest)|approved.*content/i,
  );
});

test('a replay must refer to the actually recorded operation, not a newly invented plan hash', async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  await installPairFiles(p, approve(p));
  const original = p.sha256;
  p.policy.arbitrary = 'changed';
  const { sha256: _, ...body } = p;
  p.sha256 = sha(JSON.stringify(body, null, 2) + '\n');
  for (const target of Object.values(options.destinations)) {
    const file = path.join(target, 'delivery-manifest.json');
    const m = JSON.parse(await fs.readFile(file));
    m.planSha256 = p.sha256;
    m.authorization = approve(p);
    const bytes = JSON.stringify(m, null, 2) + '\n';
    await fs.writeFile(file, bytes);
    await fs.writeFile(
      path.join(target, 'SHA256SUMS'),
      m.files
        .concat({ path: 'delivery-manifest.json', sha256: sha(bytes) })
        .map((f) => `${f.sha256}  ${f.path}`)
        .join('\n') + '\n',
    );
  }
  await assert.rejects(installPairFiles(p, approve(p)), /recorded|operation|canonical|ENOENT/i);
  assert.ok(original !== p.sha256);
});

test('incomplete rollback still reports recovery paths when writing the journal also fails', async (t) => {
  const { options } = await fixture(t),
    p = await planFiles(options);
  const rename = async (a, b) => {
    if (a.includes('stage') && b === options.destinations.atlas)
      throw Error('second install failed');
    if (a.endsWith('prior-atlas')) throw Error('restore failed');
    return fs.rename(a, b);
  };
  const writeJournal = async (file, bytes) => {
    if (JSON.parse(bytes).status === 'RECOVERY_REQUIRED') throw Error('journal ENOSPC');
    return fs.writeFile(file, bytes);
  };
  await assert.rejects(installPairFiles(p, approve(p), { rename, writeJournal }), (e) => {
    assert.match(e.message, /RECOVERY_REQUIRED/);
    assert.match(e.message, /second install failed/);
    assert.match(e.message, /restore failed/);
    assert.match(e.message, /journal ENOSPC/);
    assert.ok(e.message.includes(options.recoveryRoot));
    return true;
  });
  assert.equal(
    await fs.readFile(
      path.join(options.recoveryRoot, p.sha256.slice(0, 20), 'prior-atlas', 'index.html'),
      'utf8',
    ),
    'old entry',
  );
});

test('a missing initial journal can be recovered only while both exact prestates remain', async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  const op = path.join(options.recoveryRoot, plan.sha256.slice(0, 20)),
    journalFile = path.join(op, 'operation.json');
  // Persisted shape emitted by the preceding installer; not publication evidence.
  await fs.mkdir(op, { recursive: true });
  await fs.writeFile(path.join(op, 'plan.json'), JSON.stringify(plan, null, 2) + '\n');
  await fs.writeFile(path.join(op, 'acceptance.json'), JSON.stringify(acceptance, null, 2) + '\n');
  await assert.rejects(fs.stat(journalFile), { code: 'ENOENT' });
  const late = path.join(options.destinations.atlas, 'late.txt');
  await fs.writeFile(late, 'preserve this arrival');
  await assert.rejects(recoverPairFiles(plan, acceptance), /prestate|destination.*changed/i);
  assert.equal(await fs.readFile(late, 'utf8'), 'preserve this arrival');
  await assert.rejects(fs.stat(journalFile), { code: 'ENOENT' });
  await fs.unlink(late);
  const retained = path.join(op, 'prior-native');
  await fs.mkdir(retained);
  await assert.rejects(
    recoverPairFiles(plan, acceptance),
    /journal.*missing|missing.*journal|ambiguous/i,
  );
  await fs.rmdir(retained);
  assert.equal((await recoverPairFiles(plan, acceptance)).status, 'ROLLED_BACK');
  assert.equal((await recoverPairFiles(plan, acceptance)).status, 'ALREADY_ROLLED_BACK');
  for (const target of Object.values(options.destinations))
    assert.deepEqual((await fs.readdir(target)).sort(), [
      '.DS_Store',
      'empty',
      'index.html',
      'owner-note.txt',
    ]);
});

test('initial journal failure never exposes an incomplete operation', async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  await assert.rejects(
    installPairFiles(plan, acceptance, {
      writeJournal: async () => {
        throw Error('initial journal unavailable');
      },
    }),
    /initial journal unavailable/,
  );
  await assert.rejects(fs.stat(path.join(options.recoveryRoot, plan.sha256.slice(0, 20))), {
    code: 'ENOENT',
  });
  assert.equal((await recoverPairFiles(plan, acceptance)).status, 'NOT_STARTED');
  assert.equal((await installPairFiles(plan, acceptance)).status, 'INSTALLED');
});

for (const phase of ['plan.json', 'acceptance.json', 'operation.json', 'activation'])
  for (const side of ['before', 'after'])
    test(`initialization termination ${side} ${phase} preserves exact recovery inputs`, async (t) => {
      const { dir, options } = await fixture(t),
        plan = await planFiles(options),
        acceptance = approve(plan);
      const input = path.join(dir, 'initialization.json'),
        child = path.join(dir, 'initialization.mjs');
      await fs.writeFile(input, JSON.stringify({ plan, acceptance, phase, side }));
      await fs.writeFile(
        child,
        `import fs from 'node:fs/promises';import path from 'node:path';import {installPairFiles} from ${JSON.stringify(new URL('../packages/publisher/src/publication/files.mjs', import.meta.url).href)};
const {plan,acceptance,phase,side}=JSON.parse(await fs.readFile(process.argv[2])),op=path.join(plan.options.recoveryRoot,plan.sha256.slice(0,20)),native={mkdir:fs.mkdir,rename:fs.rename};
async function invoke(method,args,event){if(event===phase&&side==='before')process.kill(process.pid,'SIGKILL');const value=await native[method](...args);if(event===phase&&side==='after')process.kill(process.pid,'SIGKILL');return value;}
fs.mkdir=(file,...args)=>invoke('mkdir',[file,...args],file===op?'activation':'');
fs.rename=(from,to)=>invoke('rename',[from,to],to===op?'activation':to.startsWith(plan.options.recoveryRoot+path.sep)?path.basename(to):'');
await installPairFiles(plan,acceptance);`,
      );
      const run = spawnSync(process.execPath, [child, input], {
        cwd: dir,
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 8e6,
      });
      assert.equal(run.signal, 'SIGKILL', run.stderr);
      const activated = phase === 'activation' && side === 'after';
      assert.equal(
        (await recoverPairFiles(plan, acceptance)).status,
        activated ? 'ROLLED_BACK' : 'NOT_STARTED',
      );
      for (const target of Object.values(options.destinations))
        assert.deepEqual((await fs.readdir(target)).sort(), [
          '.DS_Store',
          'empty',
          'index.html',
          'owner-note.txt',
        ]);
      if (!activated) assert.equal((await installPairFiles(plan, acceptance)).status, 'INSTALLED');
    });

for (const status of ['PREPARING', 'INSTALLING', 'INSTALLED'])
  for (const side of ['before', 'after'])
    test(`process termination ${side} ${status} journal replacement preserves recoverability`, async (t) => {
      const { dir, options } = await fixture(t),
        plan = await planFiles(options),
        acceptance = approve(plan);
      const planFile = path.join(dir, 'plan.json'),
        acceptanceFile = path.join(dir, 'acceptance.json'),
        child = path.join(dir, 'journal-interrupt.mjs');
      await fs.writeFile(planFile, JSON.stringify(plan));
      await fs.writeFile(acceptanceFile, JSON.stringify(acceptance));
      await fs.writeFile(
        child,
        `import fs from 'node:fs/promises';import {installPairFiles} from ${JSON.stringify(new URL('../packages/publisher/src/publication/files.mjs', import.meta.url).href)};
const plan=JSON.parse(await fs.readFile(process.argv[2])),acceptance=JSON.parse(await fs.readFile(process.argv[3]));
const rename=fs.rename;fs.rename=async(a,b)=>{const hit=b.endsWith('/operation.json')&&JSON.parse(await fs.readFile(a)).status===process.argv[4];if(hit&&process.argv[5]==='before')process.kill(process.pid,'SIGKILL');await rename(a,b);if(hit&&process.argv[5]==='after')process.kill(process.pid,'SIGKILL');};
await installPairFiles(plan,acceptance);`,
      );
      const run = spawnSync(process.execPath, [child, planFile, acceptanceFile, status, side], {
        cwd: dir,
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 8e6,
      });
      assert.equal(run.signal, 'SIGKILL', run.stderr);
      const result = await recoverPairFiles(plan, acceptance),
        installed = status === 'INSTALLED' && side === 'after',
        unstarted = status === 'PREPARING';
      assert.equal(
        result.status,
        unstarted ? 'NOT_STARTED' : installed ? 'ALREADY_INSTALLED' : 'ROLLED_BACK',
      );
      assert.equal(
        (await recoverPairFiles(plan, acceptance)).status,
        unstarted ? 'NOT_STARTED' : installed ? 'ALREADY_INSTALLED' : 'ALREADY_ROLLED_BACK',
      );
      for (const target of Object.values(options.destinations))
        assert.equal(
          await fs.readFile(path.join(target, 'owner-note.txt'), 'utf8'),
          'keep this exact byte',
        );
      if (!installed)
        for (const target of Object.values(options.destinations))
          assert.deepEqual((await fs.readdir(target)).sort(), [
            '.DS_Store',
            'empty',
            'index.html',
            'owner-note.txt',
          ]);
    });

test('initially absent destinations install without inventing prior recovery copies', async (t) => {
  const { options } = await fixture(t);
  for (const target of Object.values(options.destinations))
    await fs.rm(target, { recursive: true });
  const p = await planFiles(options);
  assert.ok(Object.values(p.prestates).every((p) => !p.exists));
  const r = await installPairFiles(p, approve(p));
  assert.equal(r.status, 'INSTALLED');
  for (const target of Object.values(options.destinations))
    assert.ok((await fs.stat(path.join(target, 'index.html'))).isFile());
  for (const prior of Object.values(r.recovery))
    await assert.rejects(fs.stat(prior), { code: 'ENOENT' });
});

test('an exception after a successful rename restores actual disk state rather than trusting journal arrays', async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options);
  let interrupted = false;
  const rename = async (a, b) => {
    await fs.rename(a, b);
    if (!interrupted && a === options.destinations.native) {
      interrupted = true;
      throw Error('after rename before record');
    }
  };
  await assert.rejects(
    installPairFiles(plan, approve(plan), { rename }),
    /after rename before record/,
  );
  assert.equal(interrupted, true);
  for (const target of Object.values(options.destinations))
    assert.equal(await fs.readFile(path.join(target, 'index.html'), 'utf8'), 'old entry');
  const journal = JSON.parse(
    await fs.readFile(path.join(options.recoveryRoot, plan.sha256.slice(0, 20), 'operation.json')),
  );
  assert.equal(journal.status, 'ROLLED_BACK');
});

for (const boundary of [
  'before-save-native',
  'after-save-native',
  'before-install-native',
  'after-install-native',
  'before-save-atlas',
  'after-save-atlas',
  'before-install-atlas',
  'after-install-atlas',
])
  test(`process termination at ${boundary} is recoverable without changing prior content`, async (t) => {
    assert.equal(typeof recoverPairFiles, 'function');
    const { dir, options } = await fixture(t),
      plan = await planFiles(options),
      acceptance = approve(plan);
    const planFile = path.join(dir, 'plan.json'),
      acceptanceFile = path.join(dir, 'acceptance.json');
    await fs.writeFile(planFile, JSON.stringify(plan));
    await fs.writeFile(acceptanceFile, JSON.stringify(acceptance));
    const child = path.join(dir, 'interrupt.mjs');
    await fs.writeFile(
      child,
      `import fs from 'node:fs/promises';import {installPairFiles} from ${JSON.stringify(new URL('../packages/publisher/src/publication/files.mjs', import.meta.url).href)};
const plan=JSON.parse(await fs.readFile(process.argv[2])),acceptance=JSON.parse(await fs.readFile(process.argv[3])),boundary=process.argv[4];
await installPairFiles(plan,acceptance,{rename:async(a,b)=>{let event='';for(const m of ['native','atlas']){if(a===plan.options.destinations[m])event='save-'+m;else if(b===plan.options.destinations[m])event='install-'+m;}if(boundary==='before-'+event)process.kill(process.pid,'SIGKILL');await fs.rename(a,b);if(boundary==='after-'+event)process.kill(process.pid,'SIGKILL');}});`,
    );
    const run = spawnSync(process.execPath, [child, planFile, acceptanceFile, boundary], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 8e6,
    });
    assert.equal(run.signal, 'SIGKILL', run.stderr);
    if (boundary === 'after-install-native') {
      await fs.writeFile(
        path.join(options.destinations.native, 'user-arrived.txt'),
        'new user content',
      );
      await assert.rejects(recoverPairFiles(plan, acceptance), /unknown changes/);
      assert.equal(
        await fs.readFile(path.join(options.destinations.native, 'user-arrived.txt'), 'utf8'),
        'new user content',
      );
      assert.equal(
        await fs.readFile(path.join(options.destinations.atlas, 'index.html'), 'utf8'),
        'old entry',
      );
      await fs.unlink(path.join(options.destinations.native, 'user-arrived.txt'));
      const op = path.join(options.recoveryRoot, plan.sha256.slice(0, 20));
      let interrupted = false;
      const rename = async (a, b) => {
        await fs.rename(a, b);
        if (!interrupted && b === path.join(op, 'failed-native')) {
          interrupted = true;
          throw Error('interrupted recovery');
        }
      };
      await assert.rejects(recoverPairFiles(plan, acceptance, { rename }), /interrupted recovery/);
      assert.equal(interrupted, true);
    }
    if (boundary === 'after-install-atlas') {
      const recoveryChild = path.join(dir, 'interrupt-recovery.mjs');
      await fs.writeFile(
        recoveryChild,
        `import fs from 'node:fs/promises';import {recoverPairFiles} from ${JSON.stringify(new URL('../packages/publisher/src/publication/files.mjs', import.meta.url).href)};
const plan=JSON.parse(await fs.readFile(process.argv[2])),acceptance=JSON.parse(await fs.readFile(process.argv[3]));
await recoverPairFiles(plan,acceptance,{rename:async(a,b)=>{await fs.rename(a,b);if(a===plan.options.destinations.atlas)process.kill(process.pid,'SIGKILL');}});`,
      );
      const killed = spawnSync(process.execPath, [recoveryChild, planFile, acceptanceFile], {
        cwd: dir,
        encoding: 'utf8',
        timeout: 30000,
        maxBuffer: 8e6,
      });
      assert.equal(killed.signal, 'SIGKILL', killed.stderr);
    }
    const recovered = await recoverPairFiles(plan, acceptance);
    assert.equal(recovered.status, 'ROLLED_BACK');
    for (const target of Object.values(options.destinations)) {
      assert.equal(await fs.readFile(path.join(target, 'index.html'), 'utf8'), 'old entry');
      assert.equal(
        await fs.readFile(path.join(target, 'owner-note.txt'), 'utf8'),
        'keep this exact byte',
      );
      assert.deepEqual((await fs.readdir(target)).sort(), [
        '.DS_Store',
        'empty',
        'index.html',
        'owner-note.txt',
      ]);
    }
    assert.equal((await recoverPairFiles(plan, acceptance)).status, 'ALREADY_ROLLED_BACK');
  });

test('a second writer is refused while the first installer owns the same destination parent', async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan);
  let secondObserved = false;
  const rename = async (a, b) => {
    if (!secondObserved && a === options.destinations.native) {
      secondObserved = true;
      await assert.rejects(installPairFiles(plan, acceptance), /active installer|writer lock/);
    }
    await fs.rename(a, b);
  };
  assert.equal((await installPairFiles(plan, acceptance, { rename })).status, 'INSTALLED');
  assert.equal(secondObserved, true);
  assert.equal((await recoverPairFiles(plan, acceptance)).status, 'ALREADY_INSTALLED');
});

test('writer release failure preserves the publication failure that triggered cleanup', async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    acceptance = approve(plan),
    lock = path.join(dir, '.architecture-publication-writer'),
    nativeRename = fs.rename;
  fs.rename = async (source, target) => {
    if (source === lock) throw Error('release failed');
    return nativeRename(source, target);
  };
  try {
    await assert.rejects(
      installPairFiles(plan, acceptance, {
        rename: async () => {
          throw Error('publication failed');
        },
      }),
      (error) => {
        assert(error instanceof AggregateError);
        assert.match(error.cause.message, /^publication failed;/);
        assert.equal(error.cause.cause.message, 'publication failed');
        assert.deepEqual(
          error.errors.map(({ message }) => message.endsWith('release failed')),
          [false, true],
        );
        return true;
      },
    );
  } finally {
    fs.rename = nativeRename;
  }
});

test('file plans reject aliases of reserved metadata and prefix collisions', async (t) => {
  const { options } = await fixture(t),
    plan = await planFiles(options);
  for (const name of ['readme.md', 'ReadMe.Md', 'SHA256SUMS/child', 'artifact/../escape']) {
    const input = {
      options,
      source: plan.source,
      payload: [{ ...plan.payload[0], path: name }],
      entries: plan.entries,
      dependencies: [],
    };
    await assert.rejects(planPairFiles(input), /path|collision/i, name);
  }
});

test('file source paths cannot disguise a source-root escape', async (t) => {
  const { dir, options } = await fixture(t),
    plan = await planFiles(options),
    outside = path.join(dir, 'outside');
  await fs.writeFile(outside, 'outside');
  const input = {
    options,
    source: plan.source,
    payload: [
      {
        ...plan.payload[0],
        source: options.sourceRoots[0] + '/../outside',
        bytes: 7,
        sha256: sha('outside'),
      },
    ],
    entries: plan.entries,
    dependencies: [],
  };
  await assert.rejects(planPairFiles(input), /source.*path|outside|canonical/i);
  await assert.rejects(fs.stat(options.recoveryRoot), { code: 'ENOENT' });
});

test('file payload can come from explicit independent media and evidence roots', async (t) => {
  const { dir, options } = await fixture(t),
    prior = await planFiles(options),
    evidence = path.join(dir, 'review-evidence');
  await fs.mkdir(evidence);
  const file = path.join(evidence, 'report.json');
  await fs.writeFile(file, '{"scope":"file fixture"}');
  const bytes = await fs.readFile(file);
  const { sourceRoots, ...deployment } = options;
  const plan = await planPairFiles({
    options: { ...deployment, sourceRoots: [...sourceRoots, evidence] },
    source: prior.source,
    payload: [
      ...prior.payload,
      {
        medium: 'atlas',
        path: 'atlas/report.json',
        source: file,
        bytes: bytes.length,
        sha256: sha(bytes),
      },
    ],
    entries: prior.entries,
    dependencies: [],
  });
  assert.equal(plan.options.sourceRoots.length, 2);
  assert.equal((await installPairFiles(plan, approve(plan))).status, 'INSTALLED');
  assert.deepEqual(
    await fs.readFile(path.join(options.destinations.atlas, 'atlas/report.json')),
    bytes,
  );
});

test('installed file engine handles explicit roots with no developer executables', async (t) => {
  const { dir, options } = await fixture(t),
    pack = spawnSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', dir], {
      cwd: publisher,
      encoding: 'utf8',
    });
  assert.equal(pack.status, 0, pack.stderr);
  const info = JSON.parse(pack.stdout)[0],
    consumer = path.join(dir, 'installed');
  await fs.mkdir(consumer);
  const installation = spawnSync(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(dir, info.filename),
    ],
    { cwd: consumer, encoding: 'utf8' },
  );
  assert.equal(installation.status, 0, installation.stderr);
  const plan = await planFiles(options),
    input = path.join(dir, 'installed-input.json'),
    entry = path.join(dir, 'installed.mjs'),
    home = path.join(dir, 'empty-home');
  await fs.mkdir(home);
  await fs.writeFile(input, JSON.stringify({ plan, acceptance: approve(plan) }));
  const module = path.join(
    consumer,
    'node_modules/architecture-publisher/src/publication/files.mjs',
  );
  await fs.writeFile(
    entry,
    `import fs from 'node:fs/promises';import {installPairFiles,recoverPairFiles} from ${JSON.stringify(new URL('file://' + module).href)};const {plan,acceptance}=JSON.parse(await fs.readFile(process.argv[2]));const result=await installPairFiles(plan,acceptance);const repeated=await installPairFiles(plan,acceptance);const recovered=await recoverPairFiles(plan,acceptance);console.log(JSON.stringify({result,repeated,recovered}));`,
  );
  const executed = spawnSync(process.execPath, [entry, input], {
    cwd: consumer,
    env: { HOME: home, PATH: home, LANG: 'C.UTF-8' },
    encoding: 'utf8',
  });
  assert.equal(executed.status, 0, executed.stderr);
  const report = JSON.parse(executed.stdout);
  assert.equal(report.result.status, 'INSTALLED');
  assert.equal(report.result.scope, 'file-installation-only');
  assert.equal(report.repeated.status, 'ALREADY_INSTALLED');
  assert.equal(report.recovered.status, 'ALREADY_INSTALLED');
  for (const target of Object.values(options.destinations))
    assert.equal(
      await fs.readFile(path.join(target, 'owner-note.txt'), 'utf8'),
      'keep this exact byte',
    );
});
