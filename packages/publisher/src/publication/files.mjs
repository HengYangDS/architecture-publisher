// Exact file installation and recovery only; never semantic or visual approval.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { parseStrictJson } from '../protocol/json.mjs';
import { hasExactFields } from '../protocol/values.mjs';
import { QUALIFIED_SOURCE, requireExplicitAcceptance } from './contract.mjs';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const encode = (v) => JSON.stringify(v, null, 2) + '\n';
const inside = (a, b) => a === b || b.startsWith(a + path.sep);
const overlap = (a, b) => inside(a, b) || inside(b, a);
const metadata = ['index.html', 'README.md', 'delivery-manifest.json', 'SHA256SUMS'];
export const PUBLICATION_MEDIA = Object.freeze(['native', 'atlas']);
const EDITION_MEDIA = Object.freeze(['static', 'interactive']);
function selectedMedia(options) {
  const destinations = options?.destinations;
  if (hasExactFields(destinations, PUBLICATION_MEDIA)) return PUBLICATION_MEDIA;
  if (hasExactFields(destinations, EDITION_MEDIA)) return EDITION_MEDIA;
  if (hasExactFields(destinations, ['native']) || hasExactFields(destinations, ['atlas']))
    return PUBLICATION_MEDIA;
  throw Error('Explicit publication media pair required');
}
function requireSourceMedia(source, media) {
  const expected = source?.schema === QUALIFIED_SOURCE ? EDITION_MEDIA : PUBLICATION_MEDIA;
  if (media !== expected) throw Error('Publication media do not match source');
}
const exists = (p) =>
  fs.lstat(p).then(
    () => true,
    (e) => {
      if (e.code === 'ENOENT') return false;
      throw e;
    },
  );
const equal = (a, b, why) => {
  if (a !== b) throw Error(why);
};
const sameSet = (actual, expected, why) =>
  equal(JSON.stringify([...actual].sort()), JSON.stringify([...expected].sort()), why);
function relative(root, file) {
  if (
    typeof file !== 'string' ||
    !file ||
    path.isAbsolute(file) ||
    file.includes('\\') ||
    file.split('/').some((p) => !p || p === '.' || p === '..')
  )
    throw Error('Invalid relative path');
  return path.join(root, file);
}
async function noLinks(file) {
  for (let p = path.resolve(file); ; p = path.dirname(p)) {
    const s = await fs.lstat(p).catch((e) => {
      if (e.code === 'ENOENT') return null;
      throw e;
    });
    if (s?.isSymbolicLink()) throw Error('Symbolic-link path refused: ' + p);
    if (p === path.dirname(p)) break;
  }
}
async function inventory(root) {
  await noLinks(root);
  if (!(await exists(root))) return { exists: false, entries: [] };
  if (!(await fs.lstat(root)).isDirectory()) throw Error('Destination is not a directory');
  const entries = [];
  async function walk(dir, rel = '') {
    for (const d of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const name = rel ? rel + '/' + d.name : d.name,
        p = path.join(dir, d.name),
        s = await fs.lstat(p);
      if (s.isSymbolicLink()) throw Error('Destination symlink refused: ' + p);
      if (s.isDirectory()) {
        entries.push({ path: name, kind: 'directory' });
        await walk(p, name);
      } else if (s.isFile()) {
        const b = await fs.readFile(p);
        entries.push({
          path: name,
          kind: 'file',
          bytes: b.length,
          sha256: sha(b),
        });
      } else throw Error('Unsupported destination content: ' + p);
    }
  }
  await walk(root);
  return { exists: true, entries };
}
function validateOptions(o) {
  const media = selectedMedia(o);
  if (
    !o ||
    !Array.isArray(o.sourceRoots) ||
    !o.sourceRoots.length ||
    o.sourceRoots.length > 32 ||
    o.sourceRoots.some((r) => typeof r !== 'string' || !path.isAbsolute(r))
  )
    throw Error('Explicit absolute source roots required');
  if (Object.hasOwn(o, 'nativeRoot') || Object.hasOwn(o, 'atlasRoot'))
    throw Error('Use explicit sourceRoots, not legacy media roots');
  if (new Set(o.sourceRoots.map((r) => path.resolve(r))).size !== o.sourceRoots.length)
    throw Error('Duplicate source roots');
  if (!path.isAbsolute(o.recoveryRoot ?? ''))
    throw Error('Explicit absolute recoveryRoot required');
  for (const name of media)
    if (!path.isAbsolute(o.destinations?.[name] ?? ''))
      throw Error('Explicit absolute destination required');
  const a = path.resolve(o.destinations[media[0]]),
    b = path.resolve(o.destinations[media[1]]),
    r = path.resolve(o.recoveryRoot);
  if (overlap(a, b) || overlap(a, r) || overlap(b, r))
    throw Error('Destinations and recovery must be distinct and non-overlapping');
  for (const target of [a, b, r])
    for (const source of o.sourceRoots)
      if (overlap(path.resolve(source), target)) throw Error('Source/destination overlap');
  if (path.dirname(a) !== path.dirname(b))
    throw Error('Pair destinations must share an explicit parent');
  for (const target of [a, b, r])
    if (
      inside(path.dirname(a), target) &&
      path
        .relative(path.dirname(a), target)
        .split(path.sep)[0]
        .normalize('NFC')
        .toLowerCase()
        .startsWith('.architecture-publication-')
    )
      throw Error('Destination uses reserved pair control namespace');
  return media;
}
async function canonicalOptions(options) {
  async function physical(file) {
    await noLinks(file);
    let parent = path.resolve(file);
    const suffix = [];
    while (!(await exists(parent))) {
      suffix.unshift(path.basename(parent));
      parent = path.dirname(parent);
    }
    return path.join(await fs.realpath(parent), ...suffix);
  }
  const o = structuredClone(options);
  o.sourceRoots = await Promise.all(o.sourceRoots.map(physical));
  o.recoveryRoot = await physical(o.recoveryRoot);
  for (const key of selectedMedia(o)) o.destinations[key] = await physical(o.destinations[key]);
  validateOptions(o);
  return o;
}

const planInput = (plan) => ({
  options: plan.options,
  source: plan.source,
  payload: plan.payload,
  entries: plan.entries,
  dependencies: plan.dependencies,
  ...(plan.replacement ? { replacement: plan.replacement } : {}),
});

function previousPayload(plan, medium) {
  return plan.replacement?.plan.payload.filter((row) => row.medium === medium) ?? [];
}

function validateReplacement(replacement, options) {
  if (!hasExactFields(replacement, ['authorization', 'plan']))
    throw Error('Explicit prior plan and authorization required');
  let current = replacement,
    depth = 0;
  while (current) {
    if (++depth > 16) throw Error('Prior replacement chain exceeds bounded input');
    verifyPlanAcceptance(current.plan, current.authorization);
    if (encode(current.plan.options.destinations) !== encode(options.destinations))
      throw Error('Prior plan destination identity mismatch');
    current = current.plan.replacement;
  }
}

function verifyPriorPreimages(replacement, medium, before) {
  const prior = replacement.plan;
  const managed = new Set([
    ...metadata,
    ...prior.payload.filter((p) => p.medium === medium).map((p) => p.path),
  ]);
  const expected = installedInventory(prior, medium, replacement.authorization);
  for (const name of managed) {
    const selected = expected.entries.find((e) => e.path === name);
    const actual = before.entries.find((e) => e.path === name);
    if (
      !before.exists ||
      !selected ||
      !actual ||
      actual.kind !== 'file' ||
      actual.bytes !== selected.bytes ||
      actual.sha256 !== selected.sha256
    )
      throw Error('Prior managed preimage or receipt changed: ' + medium + ':' + name);
  }
}

export async function planPairFiles(input, replayPrestates) {
  if (
    !input ||
    typeof input !== 'object' ||
    !Array.isArray(input.payload) ||
    !input.payload.length ||
    !Array.isArray(input.dependencies)
  )
    throw Error('Explicit file installation inputs required');
  const media = validateOptions(input.options);
  requireSourceMedia(input.source, media);
  const options = await canonicalOptions(input.options),
    payload = [],
    dependencies = new Map(),
    names = new Map();
  if (Object.hasOwn(input, 'replacement')) validateReplacement(input.replacement, options);
  const entries = structuredClone(input.entries);
  for (const medium of media) {
    if (
      !entries?.[medium] ||
      !hasExactFields(entries[medium], ['README.md', 'index.html']) ||
      Object.values(entries[medium]).some(
        (v) => typeof v !== 'string' || Buffer.byteLength(v) > 1048576,
      )
    )
      throw Error('Explicit local entry files required');
    names.set(medium, new Set(metadata.map((name) => name.normalize('NFC').toLowerCase())));
  }
  for (const item of input.payload) {
    if (
      !names.has(item?.medium) ||
      typeof item.source !== 'string' ||
      !path.isAbsolute(item.source) ||
      !Number.isSafeInteger(item.bytes) ||
      item.bytes < 0 ||
      !/^[a-f0-9]{64}$/.test(item.sha256)
    )
      throw Error('Invalid payload identity');
    if (path.resolve(item.source) !== item.source)
      throw Error('Payload source path is not canonical');
    relative(options.destinations[item.medium], item.path);
    const key = item.path.normalize('NFC').toLowerCase();
    const used = names.get(item.medium);
    if ([...used].some((n) => key === n || key.startsWith(n + '/') || n.startsWith(key + '/')))
      throw Error('Payload path collision');
    used.add(key);
    if (!options.sourceRoots.some((r) => inside(r, item.source)))
      throw Error('Payload source outside declared roots');
    for (const p of [...Object.values(options.destinations), options.recoveryRoot])
      if (inside(p, item.source)) throw Error('Payload reads a destination');
    await noLinks(item.source);
    const stat = await fs.lstat(item.source);
    if (!stat.isFile()) throw Error('Payload source is not a file');
    const bytes = await fs.readFile(item.source);
    equal(bytes.length, item.bytes, 'Payload size changed');
    equal(sha(bytes), item.sha256, 'Payload bytes changed');
    payload.push({ ...item });
    dependencies.set(item.source, item.sha256);
  }
  for (const dep of input.dependencies) {
    if (
      typeof dep?.file !== 'string' ||
      !path.isAbsolute(dep.file) ||
      !/^[a-f0-9]{64}$/.test(dep.sha256)
    )
      throw Error('Invalid dependency identity');
    if (path.resolve(dep.file) !== dep.file) throw Error('Dependency source path is not canonical');
    await noLinks(dep.file);
    equal(sha(await fs.readFile(dep.file)), dep.sha256, 'Dependency changed');
    if (dependencies.has(dep.file))
      equal(dependencies.get(dep.file), dep.sha256, 'Conflicting dependency identity');
    dependencies.set(dep.file, dep.sha256);
  }
  const prestates = {};
  for (const medium of media) {
    const before = replayPrestates?.[medium] ?? (await inventory(options.destinations[medium]));
    prestates[medium] = structuredClone(before);
    if (input.replacement) verifyPriorPreimages(input.replacement, medium, before);
    if (before.entries.some((e) => metadata.includes(e.path) && e.kind !== 'file'))
      throw Error('Reserved metadata must be a file, not a directory');
    const history = 'history/' + sha(encode(before)).slice(0, 20);
    if (before.entries.some((e) => e.path === history || e.path.startsWith(history + '/')))
      throw Error('History path collision');
    for (const row of payload.filter((p) => p.medium === medium)) {
      const key = row.path.normalize('NFC').toLowerCase();
      const replaced = new Set(
        input.replacement?.plan.payload.filter((p) => p.medium === medium).map((p) => p.path) ?? [],
      );
      if (
        before.entries.some((e) => {
          if (e.kind === 'file' && replaced.has(e.path)) return false;
          const prior = e.path.normalize('NFC').toLowerCase();
          return (
            key === prior ||
            prior.startsWith(key + '/') ||
            (e.kind === 'file' && key.startsWith(prior + '/'))
          );
        })
      )
        throw Error('Payload collision with prior content');
    }
  }
  const body = {
    schema: 'architecture.pair-files/v2',
    mode: 'dry-run',
    scope: 'file-installation-only',
    options,
    source: structuredClone(input.source),
    payload,
    entries,
    prestates,
    dependencies: [...dependencies].map(([file, sha256]) => ({ file, sha256 })),
    ...(input.replacement ? { replacement: structuredClone(input.replacement) } : {}),
    policy: {
      ...(input.replacement
        ? {
            preserveUnknownContent: true,
            replaceOnly: 'exact-prior-managed-payload-and-metadata',
            rollback: 'exact-prior-directories',
          }
        : { preserveAllPriorContent: true, replaceOnly: metadata }),
      globalAtomicity: false,
    },
  };
  return { ...body, sha256: sha(encode(body)) };
}

function expectedContents(plan, medium) {
  const before = plan.prestates[medium],
    history = 'history/' + sha(encode(before)).slice(0, 20),
    previousEntries = {};
  for (const row of before.entries)
    if (metadata.includes(row.path)) previousEntries[row.path] = history + '/' + row.path;
  const files = before.entries
    .filter(
      (e) => e.kind === 'file' && !previousPayload(plan, medium).some((p) => p.path === e.path),
    )
    .map((e) => ({ ...e, path: previousEntries[e.path] ?? e.path }));
  for (const row of plan.payload.filter((f) => f.medium === medium))
    files.push({
      path: row.path,
      kind: 'file',
      sha256: row.sha256,
      bytes: row.bytes,
    });
  for (const [name, text] of Object.entries(plan.entries[medium]))
    files.push({
      path: name,
      kind: 'file',
      sha256: sha(text),
      bytes: Buffer.byteLength(text),
    });
  files.sort((a, b) => a.path.localeCompare(b.path));
  const directories = new Set(
    before.entries.filter((e) => e.kind === 'directory').map((e) => e.path),
  );
  for (const f of files)
    for (let p = path.posix.dirname(f.path); p !== '.'; p = path.posix.dirname(p))
      directories.add(p);
  return { files, previousEntries, directories: [...directories].sort() };
}
function expectedManifest(plan, medium, acceptance) {
  const { files, previousEntries } = expectedContents(plan, medium);
  return {
    schema: 'architecture.pair-files-receipt/v1',
    status: 'INSTALLED',
    scope: 'file-installation-only',
    medium,
    source: plan.source,
    planSha256: plan.sha256,
    authorization: acceptance,
    previousEntries,
    files,
    globalAtomicity: false,
    sourceAuthority:
      plan.source?.schema === QUALIFIED_SOURCE
        ? 'Selected evidence and external decisions are attributed; local installation does not authenticate claimants or verifiers or grant hosted release'
        : 'Explicit input source; file installation grants no semantic or visual acceptance',
  };
}
async function checkFiles(root, rows) {
  for (const row of rows) {
    await noLinks(relative(root, row.path));
    const b = await fs.readFile(relative(root, row.path));
    equal(sha(b), row.sha256, 'Installed file mismatch: ' + row.path);
  }
}
async function verifyInstalled(plan, medium, acceptance) {
  const root = plan.options.destinations[medium],
    manifestBytes = await fs.readFile(path.join(root, 'delivery-manifest.json')),
    m = expectedManifest(plan, medium, acceptance);
  equal(
    Buffer.compare(manifestBytes, Buffer.from(encode(m))),
    0,
    'Installed manifest differs from approved content',
  );
  await checkFiles(root, m.files);
  await checkFiles(
    root,
    plan.payload.filter((f) => f.medium === medium),
  );
  const actual = await inventory(root),
    paths = actual.entries
      .filter((e) => e.kind === 'file')
      .map((e) => e.path)
      .sort();
  sameSet(
    actual.entries.filter((e) => e.kind === 'directory').map((e) => e.path),
    expectedContents(plan, medium).directories,
    'Installed directory set mismatch',
  );
  equal(
    JSON.stringify(paths),
    JSON.stringify([...m.files.map((f) => f.path), 'delivery-manifest.json', 'SHA256SUMS'].sort()),
    'Installed file set mismatch',
  );
  const expected =
    m.files
      .concat({
        path: 'delivery-manifest.json',
        sha256: sha(manifestBytes),
      })
      .map((f) => `${f.sha256}  ${f.path}`)
      .join('\n') + '\n';
  equal(
    await fs.readFile(path.join(root, 'SHA256SUMS'), 'utf8'),
    expected,
    'Installed checksum mismatch',
  );
  for (const prior of plan.prestates[medium].entries) {
    if (prior.kind === 'file' && previousPayload(plan, medium).some((p) => p.path === prior.path))
      continue;
    const p = m.previousEntries[prior.path] ?? prior.path;
    if (prior.kind === 'directory') {
      if (!(await fs.stat(relative(root, p))).isDirectory())
        throw Error('Preserved directory missing');
    } else
      equal(sha(await fs.readFile(relative(root, p))), prior.sha256, 'Preserved bytes mismatch');
  }
  return m;
}

async function syncDirectory(directory) {
  // Node's Windows directory handles cannot supply FlushFileBuffers write access.
  // The effect result declares this limit; required file flush failures are not ignored.
  if (process.platform === 'win32') return;
  const file = await fs.open(directory, 'r');
  try {
    await file.sync();
  } finally {
    await file.close();
  }
}
async function atomicJournal(file, bytes) {
  const temporary = file + '.' + randomUUID() + '.tmp',
    handle = await fs.open(temporary, 'wx', 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(temporary, file);
  await syncDirectory(path.dirname(file));
}
function verifyPlanAcceptance(plan, acceptance) {
  const { sha256: digest, ...body } = plan;
  equal(sha(encode(body)), digest, 'Plan digest mismatch');
  if (plan.schema !== 'architecture.pair-files/v2')
    throw Error('Unsupported file installation plan');
  requireSourceMedia(plan.source, validateOptions(plan.options));
  if (plan.source?.schema === QUALIFIED_SOURCE) {
    const source = plan.source;
    if (
      !hasExactFields(source, [
        'schema',
        'candidateManifestSha256',
        'candidateSha256',
        'inputLockSha256',
        'editionSha256',
        'qualificationSetSha256',
        'qualificationSetDigest',
        'policySha256',
        'reportSha256',
        'evidenceAttribution',
        'roles',
      ]) ||
      source.evidenceAttribution !== 'submitted-unverified' ||
      !hasExactFields(source.roles, [
        'claimants',
        'editor',
        'producer',
        'verifiers',
        'accepter',
        'releaseOwner',
        'custodian',
        'effectAuthorizer',
      ]) ||
      source.roles.producer !== 'architecture-publisher' ||
      !Array.isArray(source.roles.claimants) ||
      !source.roles.claimants.length ||
      !Array.isArray(source.roles.verifiers) ||
      !hasExactFields(acceptance, ['schema', 'planSha256', 'acceptance', 'effect']) ||
      acceptance.schema !== 'architecture.qualified-file-authorization/v1' ||
      acceptance.planSha256 !== digest ||
      !hasExactFields(acceptance.acceptance, [
        'decision',
        'accepter',
        'candidateSha256',
        'qualificationSetDigest',
        'policySha256',
      ]) ||
      acceptance.acceptance.decision !== 'ACCEPTED' ||
      acceptance.acceptance.accepter !== source.roles.accepter ||
      acceptance.acceptance.candidateSha256 !== source.candidateSha256 ||
      acceptance.acceptance.qualificationSetDigest !== source.qualificationSetDigest ||
      acceptance.acceptance.policySha256 !== source.policySha256 ||
      !hasExactFields(acceptance.effect, ['decision', 'authorizer']) ||
      acceptance.effect.decision !== 'AUTHORIZED' ||
      acceptance.effect.authorizer !== source.roles.effectAuthorizer
    )
      throw Error('Exact qualified Edition adoption and local effect authorization required');
    return digest;
  }
  requireExplicitAcceptance(
    acceptance,
    digest,
    'AUTHORIZED',
    'Exact file installation authorization required',
  );
  return digest;
}
async function withPairWriter(plan, acceptance, recover, action) {
  const digest = verifyPlanAcceptance(plan, acceptance),
    o = plan.options;
  const parent = path.dirname(o.destinations[selectedMedia(o)[0]]);
  let parentStat;
  try {
    parentStat = await fs.lstat(parent);
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
  }
  if (!parentStat?.isDirectory() || parentStat.isSymbolicLink())
    throw Error('Destination parent must exist');
  equal(encode(await canonicalOptions(o)), encode(o), 'Canonical writer path changed');
  const lock = path.join(parent, '.architecture-publication-writer'),
    history = lock + '-history';
  const token = randomUUID(),
    owner = {
      token,
      pid: process.pid,
      host: os.hostname(),
      planSha256: digest,
    };
  const ownerFile = path.join(lock, 'owner.json');
  let owned = false,
    prepared,
    result,
    failure;
  function alive(pid) {
    if (!Number.isSafeInteger(pid) || pid < 1) throw Error('Invalid writer lock process');
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      if (e.code === 'ESRCH') return false;
      return true;
    }
  }
  try {
    if (await exists(lock + '-recovery'))
      throw Error('Legacy writer lock recovery requires inspection');
    if (await exists(lock)) {
      await noLinks(ownerFile);
      const bytes = await fs.readFile(ownerFile),
        previous = parseStrictJson(
          bytes,
          'publication_writer_lock_json_invalid',
          'publication_writer_lock_json_duplicate_key',
        );
      if (typeof previous.token !== 'string' || !/^[a-f0-9-]{36}$/.test(previous.token))
        throw Error('Invalid writer lock identity');
      sameSet(await fs.readdir(lock), ['owner.json'], 'Ambiguous writer lock content');
      if (previous.host !== os.hostname() || alive(previous.pid))
        throw Error('An active installer holds the writer lock');
      if (!recover || previous.planSha256 !== digest)
        throw Error('Writer lock requires recovery of its exact prior plan');
      await noLinks(history);
      await fs.mkdir(history, { recursive: true });
      const retained = path.join(history, previous.token);
      if (await exists(retained)) throw Error('Retained writer lock already exists');
      equal(
        Buffer.compare(await fs.readFile(ownerFile), bytes),
        0,
        'Writer lock changed before recovery',
      );
      if (alive(previous.pid)) throw Error('An active installer holds the writer lock');
      // Keep the nonempty token tombstone: a delayed reclaimer cannot rename a
      // newer owner over it, even if it observed the old owner before this move.
      await fs.rename(lock, retained);
      await syncDirectory(parent);
      await syncDirectory(history);
    }
    prepared = await fs.mkdtemp(lock + '-pending-');
    const pendingOwner = path.join(prepared, 'owner.json');
    await fs.writeFile(pendingOwner, encode(owner), {
      flag: 'wx',
      mode: 0o600,
      flush: true,
    });
    await syncDirectory(prepared);
    if (await exists(lock)) throw Error('Another installer acquired the writer lock');
    // Cooperating writers only expose complete nonempty directories. A competing
    // rename cannot replace one; unknown legacy locks are refused above.
    await fs.rename(prepared, lock);
    owned = true;
    prepared = null;
    await syncDirectory(parent);
    equal(await fs.readFile(ownerFile, 'utf8'), encode(owner), 'Writer lock ownership changed');
    result = await action();
  } catch (error) {
    failure = error;
  }
  let releaseFailure;
  try {
    if (owned) {
      equal(
        await fs.readFile(ownerFile, 'utf8'),
        encode(owner),
        'Writer lock ownership changed at release',
      );
      await noLinks(history);
      await fs.mkdir(history, { recursive: true });
      const retained = path.join(history, token);
      if (await exists(retained)) throw Error('Writer release identity already retained');
      await fs.rename(lock, retained);
      await syncDirectory(parent);
      await syncDirectory(history);
    } else if (prepared) {
      // This process alone owns its unpublished directory. Never clean up another
      // process's abandoned preparation or an unknown active lock.
      if (await exists(path.join(prepared, 'owner.json')))
        await fs.unlink(path.join(prepared, 'owner.json'));
      await fs.rmdir(prepared);
    }
  } catch (error) {
    releaseFailure = error;
  }
  if (failure && releaseFailure)
    throw new AggregateError(
      [failure, releaseFailure],
      `${failure.message}; writer release failed`,
      { cause: failure },
    );
  if (failure) throw failure;
  if (releaseFailure) throw releaseFailure;
  return {
    ...result,
    durability: {
      fileFlush: 'required-for-created-files',
      directoryFlush: process.platform === 'win32' ? 'unsupported' : 'required',
      powerLossRecovery: 'not-qualified',
    },
  };
}
function sameInventory(a, b) {
  const normalized = (x) => ({
    exists: x.exists,
    entries: x.entries
      .map((e) =>
        e.kind === 'directory'
          ? { path: e.path, kind: e.kind }
          : { path: e.path, kind: e.kind, bytes: e.bytes, sha256: e.sha256 },
      )
      .sort((p, q) => p.path.localeCompare(q.path)),
  });
  return encode(normalized(a)) === encode(normalized(b));
}
function installedInventory(plan, medium, acceptance) {
  const manifest = expectedManifest(plan, medium, acceptance),
    body = encode(manifest);
  const sums =
    manifest.files
      .concat({ path: 'delivery-manifest.json', sha256: sha(body) })
      .map((f) => `${f.sha256}  ${f.path}`)
      .join('\n') + '\n';
  return {
    exists: true,
    entries: [
      ...expectedContents(plan, medium).directories.map((path) => ({
        path,
        kind: 'directory',
      })),
      ...manifest.files,
      {
        path: 'delivery-manifest.json',
        kind: 'file',
        bytes: Buffer.byteLength(body),
        sha256: sha(body),
      },
      {
        path: 'SHA256SUMS',
        kind: 'file',
        bytes: Buffer.byteLength(sums),
        sha256: sha(sums),
      },
    ],
  };
}
async function rollbackPair(plan, acceptance, journal, op, { rename, writeJournal }) {
  const states = [];
  // Inspect every target before the first recovery effect. Never move an unknown
  // or modified directory merely because an old journal says we installed it.
  for (const medium of [...selectedMedia(plan.options)].reverse()) {
    const target = plan.options.destinations[medium],
      prior = path.join(op, 'prior-' + medium),
      failed = path.join(op, 'failed-' + medium);
    const current = await inventory(target),
      saved = await inventory(prior),
      abandoned = await inventory(failed),
      before = plan.prestates[medium],
      expected = installedInventory(plan, medium, acceptance);
    if (saved.exists && (!before.exists || !sameInventory(saved, before)))
      throw Error('Recovery prior content changed: ' + medium);
    if (abandoned.exists && !sameInventory(abandoned, expected))
      throw Error('Recovery retained output changed: ' + medium);
    if (sameInventory(current, before)) {
      if (saved.exists) throw Error('Recovery has ambiguous duplicate prior: ' + medium);
      states.push({
        medium,
        target,
        prior,
        failed,
        current,
        before,
        expected,
        action: 'none',
      });
      continue;
    }
    if (current.exists && !sameInventory(current, expected))
      throw Error('Recovery destination contains unknown changes: ' + medium);
    if (before.exists && !saved.exists) throw Error('Recovery prior content missing: ' + medium);
    if (current.exists && abandoned.exists)
      throw Error('Recovery retained output already occupied: ' + medium);
    states.push({
      medium,
      target,
      prior,
      failed,
      current,
      before,
      expected,
      action: 'restore',
    });
  }
  const record = () => writeJournal(path.join(op, 'operation.json'), encode(journal));
  for (const s of states) {
    if (s.action === 'none') continue;
    if (s.current.exists) {
      equal(
        sameInventory(await inventory(s.target), s.expected),
        true,
        'Recovery target changed at effect boundary',
      );
      if (await exists(s.failed)) throw Error('Recovery retained output arrived concurrently');
      journal.intent = {
        action: 'retain-new',
        medium: s.medium,
        source: s.target,
        target: s.failed,
      };
      await record();
      await rename(s.target, s.failed);
      await syncDirectory(path.dirname(s.target));
      await syncDirectory(op);
    }
    if (s.before.exists) {
      equal(
        sameInventory(await inventory(s.prior), s.before),
        true,
        'Recovery prior changed at effect boundary',
      );
      if (await exists(s.target)) throw Error('Recovery destination arrived concurrently');
      journal.intent = {
        action: 'restore-prior',
        medium: s.medium,
        source: s.prior,
        target: s.target,
      };
      await record();
      await rename(s.prior, s.target);
      await syncDirectory(path.dirname(s.target));
      await syncDirectory(op);
    }
    equal(sameInventory(await inventory(s.target), s.before), true, 'Rollback prestate mismatch');
  }
  for (const m of selectedMedia(plan.options))
    equal(
      sameInventory(await inventory(plan.options.destinations[m]), plan.prestates[m]),
      true,
      'Rollback final prestate mismatch',
    );
  journal.status = 'ROLLED_BACK';
  journal.intent = null;
  await record();
  return {
    status: 'ROLLED_BACK',
    planSha256: plan.sha256,
    recovery: op,
    globalAtomicity: false,
  };
}

export async function recoverPairFiles(plan, acceptance, adapters = {}) {
  return withPairWriter(plan, acceptance, true, () =>
    recoverLockedPair(plan, acceptance, adapters),
  );
}
async function recoverLockedPair(
  plan,
  acceptance,
  { rename = fs.rename, writeJournal = atomicJournal } = {},
) {
  const digest = verifyPlanAcceptance(plan, acceptance),
    o = plan.options;
  equal(encode(await canonicalOptions(o)), encode(o), 'Canonical recovery path changed');
  const op = path.join(o.recoveryRoot, digest.slice(0, 20));
  await noLinks(op);
  if (!(await exists(op))) {
    for (const medium of selectedMedia(o))
      equal(
        sameInventory(await inventory(o.destinations[medium]), plan.prestates[medium]),
        true,
        'Unstarted destination prestate changed',
      );
    return {
      status: 'NOT_STARTED',
      scope: 'file-installation-only',
      planSha256: digest,
    };
  }
  equal(
    await fs.readFile(path.join(op, 'plan.json'), 'utf8'),
    encode(plan),
    'Recorded recovery plan differs',
  );
  equal(
    await fs.readFile(path.join(op, 'acceptance.json'), 'utf8'),
    encode(acceptance),
    'Recorded recovery acceptance differs',
  );
  const journalFile = path.join(op, 'operation.json');
  await noLinks(journalFile);
  const recorded = await fs.readFile(journalFile).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (recorded === null) {
    // Before the first durable journal, no destination switch is permitted.
    // Certify only the unchanged prestate; retain incomplete staging for inspection.
    for (const medium of selectedMedia(o)) {
      equal(
        sameInventory(await inventory(o.destinations[medium]), plan.prestates[medium]),
        true,
        'Unjournaled destination prestate changed',
      );
      for (const prefix of ['prior-', 'failed-'])
        if (await exists(path.join(op, prefix + medium)))
          throw Error('Missing journal has ambiguous retained content');
    }
    await writeJournal(
      journalFile,
      encode({
        planSha256: digest,
        status: 'ROLLED_BACK',
        destinations: o.destinations,
        intent: null,
        reason: 'unchanged-prestates-before-initial-journal',
      }),
    );
    return {
      status: 'ROLLED_BACK',
      planSha256: digest,
      recovery: op,
      globalAtomicity: false,
    };
  }
  const journal = parseStrictJson(
    recorded,
    'publication_journal_json_invalid',
    'publication_journal_json_duplicate_key',
  );
  equal(journal.planSha256, digest, 'Recovery journal plan mismatch');
  equal(
    encode(journal.destinations),
    encode(o.destinations),
    'Recovery journal destination mismatch',
  );
  if (journal.status === 'INSTALLED') {
    for (const m of selectedMedia(o)) await verifyInstalled(plan, m, acceptance);
    return { status: 'ALREADY_INSTALLED', planSha256: digest };
  }
  if (journal.status === 'ROLLED_BACK') {
    for (const m of selectedMedia(o))
      equal(
        sameInventory(await inventory(o.destinations[m]), plan.prestates[m]),
        true,
        'Recovered destination changed',
      );
    return { status: 'ALREADY_ROLLED_BACK', planSha256: digest };
  }
  if (!['PREPARING', 'INSTALLING', 'RECOVERY_REQUIRED'].includes(journal.status))
    throw Error('Unknown recovery state');
  return rollbackPair(plan, acceptance, journal, op, { rename, writeJournal });
}

export async function installPairFiles(plan, acceptance, adapters = {}) {
  return withPairWriter(plan, acceptance, false, () =>
    publishLockedPair(plan, acceptance, adapters),
  );
}
async function publishLockedPair(
  plan,
  acceptance,
  { rename = fs.rename, writeJournal = atomicJournal } = {},
) {
  const digest = verifyPlanAcceptance(plan, acceptance);
  equal(
    JSON.stringify(await canonicalOptions(plan.options)),
    JSON.stringify(plan.options),
    'Canonical path changed',
  );
  const o = plan.options;
  for (const d of plan.dependencies) {
    await noLinks(d.file);
    equal(sha(await fs.readFile(d.file)), d.sha256, 'Source/evidence changed: ' + d.file);
  }
  const already = await Promise.all(
    selectedMedia(o).map(async (m) => {
      const p = path.join(o.destinations[m], 'delivery-manifest.json');
      await noLinks(p);
      if (!(await exists(p))) return false;
      try {
        const value = JSON.parse(await fs.readFile(p));
        return (
          value?.schema === 'architecture.pair-files-receipt/v1' && value.planSha256 === digest
        );
      } catch (error) {
        if (error instanceof SyntaxError) return false;
        throw error;
      }
    }),
  );
  if (already.some(Boolean)) {
    if (!already.every(Boolean)) throw Error('Partial prior install requires recovery, not replay');
    equal(
      (await planPairFiles(planInput(plan), plan.prestates)).sha256,
      digest,
      'Canonical replay plan changed',
    );
    const operationFile = path.join(o.recoveryRoot, digest.slice(0, 20), 'operation.json');
    await noLinks(operationFile);
    const operation = parseStrictJson(
      await fs.readFile(operationFile),
      'publication_journal_json_invalid',
      'publication_journal_json_duplicate_key',
    );
    if (
      operation.planSha256 !== digest ||
      operation.status !== 'INSTALLED' ||
      JSON.stringify(operation.destinations) !== JSON.stringify(o.destinations)
    )
      throw Error('Recorded operation does not confirm delivery');
    for (const m of selectedMedia(o)) await verifyInstalled(plan, m, acceptance);
    return { status: 'ALREADY_INSTALLED', planSha256: digest };
  }
  for (const m of selectedMedia(o))
    equal(
      JSON.stringify(await inventory(o.destinations[m])),
      JSON.stringify(plan.prestates[m]),
      'Destination prestate changed',
    );
  // A caller-supplied hash cannot authorize a different payload. Re-derive the
  // controlled plan from the same exact source/evidence and current prestates.
  const currentPlan = await planPairFiles(planInput(plan));
  equal(currentPlan.sha256, digest, 'Canonical plan changed; re-plan and review');
  const parent = path.dirname(o.destinations[selectedMedia(o)[0]]);
  await noLinks(parent);
  await noLinks(o.recoveryRoot);
  if (!(await exists(parent))) throw Error('Destination parent must exist');
  const op = path.join(o.recoveryRoot, digest.slice(0, 20));
  await fs.mkdir(o.recoveryRoot, { recursive: true });
  equal(
    (await fs.stat(parent)).dev,
    (await fs.stat(o.recoveryRoot)).dev,
    'Recovery and destination must share a filesystem',
  );
  if (await exists(op))
    throw Error('Recorded operation already exists; inspect or recover its exact state');
  const preparation = await fs.mkdtemp(
    path.join(o.recoveryRoot, '.prepare-' + digest.slice(0, 20) + '-'),
  );
  const stage = await fs.mkdtemp(path.join(parent, '.architecture-publication-stage-')),
    recovery = Object.fromEntries(selectedMedia(o).map((m) => [m, path.join(op, 'prior-' + m)])),
    installed = [],
    saved = [];
  const journal = {
    planSha256: digest,
    status: 'PREPARING',
    stage,
    destinations: o.destinations,
    recovery,
    installed,
    saved,
    intent: null,
  };
  const record = () => writeJournal(path.join(op, 'operation.json'), encode(journal));
  try {
    await atomicJournal(path.join(preparation, 'plan.json'), encode(plan));
    await atomicJournal(path.join(preparation, 'acceptance.json'), encode(acceptance));
    await writeJournal(path.join(preparation, 'operation.json'), encode(journal));
    equal(
      await fs.readFile(path.join(preparation, 'operation.json'), 'utf8'),
      encode(journal),
      'Initial journal was not persisted',
    );
    await syncDirectory(preparation);
    if (await exists(op)) throw Error('Operation appeared during preparation');
    // The visible operation always contains its complete recovery inputs. Partial
    // preparations have no destination effects and stay separate for inspection.
    await fs.rename(preparation, op);
    await syncDirectory(o.recoveryRoot);
  } catch (error) {
    throw Error(
      error.message +
        '; operation initialization incomplete; preparation: ' +
        preparation +
        '; stage: ' +
        stage,
      { cause: error },
    );
  }
  try {
    for (const medium of selectedMedia(o)) {
      const target = o.destinations[medium],
        out = path.join(stage, medium),
        before = plan.prestates[medium];
      if (before.exists)
        await fs.cp(target, out, {
          recursive: true,
          errorOnExist: true,
          force: false,
        });
      else await fs.mkdir(out);
      await fs.chmod(out, 0o755);
      equal(
        JSON.stringify(await inventory(out)),
        JSON.stringify({ ...before, exists: true }),
        'Staged prestate changed',
      );
      const previousEntries = {},
        history = 'history/' + sha(encode(before)).slice(0, 20);
      if (before.entries.some((e) => e.path === history || e.path.startsWith(history + '/')))
        throw Error('History path collision');
      for (const name of metadata)
        if (await exists(path.join(out, name))) {
          const preserved = path.join(history, name);
          await fs.mkdir(path.dirname(path.join(out, preserved)), {
            recursive: true,
          });
          await fs.rename(path.join(out, name), path.join(out, preserved));
          previousEntries[name] = preserved;
        }
      // Retire only exact prior managed payload in the private staged copy.
      // The original complete directory remains the existing recovery preimage.
      for (const prior of previousPayload(plan, medium)) {
        const file = relative(out, prior.path);
        equal(
          sha(await fs.readFile(file)),
          prior.sha256,
          'Prior managed payload changed while staging',
        );
        await fs.unlink(file);
      }
      for (const f of plan.payload.filter((f) => f.medium === medium)) {
        const bytes = await fs.readFile(f.source);
        equal(sha(bytes), f.sha256, 'Payload changed');
        await fs.mkdir(path.dirname(path.join(out, f.path)), {
          recursive: true,
        });
        await fs.writeFile(path.join(out, f.path), bytes, { flag: 'wx', flush: true });
      }
      for (const [name, bytes] of Object.entries(plan.entries[medium]))
        await fs.writeFile(path.join(out, name), bytes, { flag: 'wx', flush: true });
      const manifest = expectedManifest(plan, medium, acceptance),
        files = manifest.files;
      const snapshot = await inventory(out);
      sameSet(
        snapshot.entries.filter((e) => e.kind === 'file').map((e) => e.path),
        files.map((f) => f.path),
        'Staged file set mismatch',
      );
      await fs.writeFile(path.join(out, 'delivery-manifest.json'), encode(manifest), {
        flag: 'wx',
        flush: true,
      });
      const sums =
        files
          .concat({
            path: 'delivery-manifest.json',
            sha256: sha(encode(manifest)),
          })
          .map((f) => `${f.sha256}  ${f.path}`)
          .join('\n') + '\n';
      await fs.writeFile(path.join(out, 'SHA256SUMS'), sums, { flag: 'wx', flush: true });
      await checkFiles(out, files);
      recovery[medium] = path.join(op, 'prior-' + medium);
    }
    for (const d of plan.dependencies)
      equal(sha(await fs.readFile(d.file)), d.sha256, 'Source changed before install');
    for (const m of selectedMedia(o))
      equal(
        JSON.stringify(await inventory(o.destinations[m])),
        JSON.stringify(plan.prestates[m]),
        'Destination changed before install',
      );
    journal.status = 'INSTALLING';
    await record();
    for (const medium of selectedMedia(o)) {
      equal(
        JSON.stringify(await inventory(o.destinations[medium])),
        JSON.stringify(plan.prestates[medium]),
        'Destination changed at local install boundary',
      );
      if (plan.prestates[medium].exists) {
        journal.intent = {
          action: 'save-prior',
          medium,
          source: o.destinations[medium],
          target: recovery[medium],
        };
        await record();
        await rename(o.destinations[medium], recovery[medium]);
        await syncDirectory(parent);
        await syncDirectory(op);
        saved.push(medium);
        await record();
      }
      journal.intent = {
        action: 'install-new',
        medium,
        source: path.join(stage, medium),
        target: o.destinations[medium],
      };
      await record();
      if (await exists(o.destinations[medium]))
        throw Error('Destination arrived concurrently at install boundary');
      await rename(path.join(stage, medium), o.destinations[medium]);
      await syncDirectory(parent);
      await syncDirectory(stage);
      installed.push(medium);
      await verifyInstalled(plan, medium, acceptance);
      journal.intent = null;
      await record();
    }
    journal.status = 'INSTALLED';
    await record();
    await fs.rmdir(stage);
    return {
      status: 'INSTALLED',
      scope: 'file-installation-only',
      planSha256: digest,
      destinations: o.destinations,
      recovery,
      globalAtomicity: false,
    };
  } catch (error) {
    const failures = [];
    try {
      await rollbackPair(plan, acceptance, journal, op, {
        rename,
        writeJournal,
      });
    } catch (e) {
      failures.push({ error: e.message });
    }
    journal.status = failures.length ? 'RECOVERY_REQUIRED' : 'ROLLED_BACK';
    journal.error = error.message;
    journal.rollbackFailures = failures;
    let journalError;
    try {
      await record();
    } catch (e) {
      journalError = e.message;
    }
    // Preserve partial staged/new bytes for diagnosis. Never delete prior content.
    throw Error(
      error.message +
        '; ' +
        journal.status +
        '; recovery: ' +
        op +
        '; stage: ' +
        stage +
        (failures.length
          ? '; rollback failures: ' + JSON.stringify(failures)
          : '; both prestates restored') +
        (journalError ? '; journal: ' + journalError : ''),
      { cause: error },
    );
  }
}

export { noLinks };
/** @internal Focused verification seam for preservation and rollback behavior. */
export { inventory };
