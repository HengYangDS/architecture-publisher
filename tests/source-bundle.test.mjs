import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateManifest } from '../packages/publisher/src/source/manifest.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { verifySourceInput } from '../packages/publisher/src/source/input.mjs';
import { readFileEnvelope, regularBytes } from '../packages/publisher/src/source/files.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const evidence = new URL('../build/test-work/', import.meta.url);
async function fixture(t) {
  await fs.mkdir(evidence, { recursive: true });
  const root = await fs.mkdtemp(new URL('source with spaces-', evidence));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const bytes = Buffer.from('{"nodes":["service","database"],"condition":"all requests"}\n');
  await fs.mkdir(path.join(root, 'input'));
  await fs.writeFile(path.join(root, 'input/model.json'), bytes);
  const manifest = {
    schema: 'architecture.source-bundle/v1',
    source: { id: 'example:service', revision: 'release-1' },
    files: [{ path: 'input/model.json', bytes: bytes.length, sha256: sha(bytes) }],
  };
  const file = path.join(root, 'manifest.json');
  const save = async () => {
    const raw = Buffer.from(JSON.stringify(manifest));
    await fs.writeFile(file, raw);
    return sha(raw);
  };
  return { root, file, bytes, manifest, save, digest: await save() };
}

test('reads a source without Git or ETHOS, and binds the selected bytes', async (t) => {
  const f = await fixture(t);
  const result = await readSourceBundle(f.file, f.digest);
  assert.deepEqual(result.source, f.manifest.source);
  assert.equal(result.manifestSha256, f.digest);
  assert.deepEqual(result.members[0].content, f.bytes);
  assert.equal(result.scope, 'source-file-integrity');
  assert.equal(result.officialReplay, 'not-performed');
  assert.equal(result.semanticAcceptance, 'not-performed');
});

test('public source verification returns metadata without exposing selected bytes', async (t) => {
  const f = await fixture(t);
  const result = await verifySourceInput(f.file, f.digest);

  assert.equal(result.status, 'verified');
  assert.equal(result.manifestSha256, f.digest);
  assert.deepEqual(result.members, [
    {
      path: 'input/model.json',
      bytes: f.bytes.length,
      sha256: sha(f.bytes),
    },
  ]);
  assert.equal(Object.hasOwn(result.members[0], 'content'), false);
});

test('manifest validation is data-only and does not require a Git revision', async (t) => {
  const f = await fixture(t);
  delete f.manifest.source.revision;
  const result = validateManifest(f.manifest);
  assert.deepEqual(result.source, { id: 'example:service' });
  assert.notEqual(result, f.manifest);
});

for (const bad of [
  '../escape',
  '/absolute',
  'C:/drive',
  'input\\file',
  'input/./file',
  'input//file',
  'input/../file',
  'input/a\0b',
  'input/name.',
  'input/name ',
  'input/CON.txt',
  'input/AUX',
  'input/x:y',
  'input/a?b',
  'input/COM¹.txt',
  'input/name ',
  'input/\ud800.json',
]) {
  test(`rejects unsafe portable path ${JSON.stringify(bad)}`, async (t) => {
    const f = await fixture(t);
    f.manifest.files[0].path = bad;
    assert.throws(() => validateManifest(f.manifest), { code: 'member_path_invalid' });
  });
}

for (const second of ['input/model.json', 'INPUT/MODEL.JSON']) {
  test(`rejects duplicate or portable alias ${second}`, async (t) => {
    const f = await fixture(t);
    f.manifest.files.push({ ...f.manifest.files[0], path: second });
    assert.throws(() => validateManifest(f.manifest), { code: 'member_path_duplicate' });
  });
}

test('rejects normalized Unicode aliases', async (t) => {
  const f = await fixture(t);
  f.manifest.files[0].path = 'input/é.json';
  f.manifest.files.push({ ...f.manifest.files[0], path: 'input/e\u0301.json' });
  assert.throws(() => validateManifest(f.manifest), { code: 'member_path_duplicate' });
});

for (const [label, mutate, code] of [
  [
    'unknown schema',
    (m) => {
      m.schema = 'unknown';
    },
    'schema_unsupported',
  ],
  [
    'missing source',
    (m) => {
      delete m.source;
    },
    'manifest_fields_invalid',
  ],
  [
    'empty source identity',
    (m) => {
      m.source.id = '';
    },
    'source_invalid',
  ],
  [
    'executable source field',
    (m) => {
      m.source.command = 'echo bad';
    },
    'source_invalid',
  ],
  [
    'empty members',
    (m) => {
      m.files = [];
    },
    'members_invalid',
  ],
  [
    'fractional size',
    (m) => {
      m.files[0].bytes = 1.5;
    },
    'member_size_invalid',
  ],
  [
    'negative size',
    (m) => {
      m.files[0].bytes = -1;
    },
    'member_size_invalid',
  ],
  [
    'overlarge member',
    (m) => {
      m.files[0].bytes = 33 * 1024 * 1024;
    },
    'member_size_invalid',
  ],
  [
    'invalid digest',
    (m) => {
      m.files[0].sha256 = 'abc';
    },
    'member_digest_invalid',
  ],
]) {
  test(`rejects ${label}`, async (t) => {
    const f = await fixture(t);
    mutate(f.manifest);
    assert.throws(() => validateManifest(f.manifest), { code });
  });
}

test('requires a caller-selected digest, not a self-authorized manifest', async (t) => {
  const f = await fixture(t);
  await assert.rejects(readSourceBundle(f.file, '0'.repeat(64)), {
    code: 'manifest_digest_mismatch',
  });
  await assert.rejects(readSourceBundle(f.file), { code: 'manifest_digest_required' });
});

test('source envelope rejects malformed selected bytes and an absent decoder', async (t) => {
  const f = await fixture(t);
  await assert.rejects(readSourceBundle('', f.digest), { code: 'manifest_path_required' });
  await assert.rejects(readFileEnvelope(f.file, f.digest, null), {
    code: 'envelope_decoder_required',
  });
  for (const bytes of [Buffer.from('{'), Buffer.from([0xff])]) {
    await fs.writeFile(f.file, bytes);
    await assert.rejects(readSourceBundle(f.file, sha(bytes)), {
      code: 'manifest_json_invalid',
    });
  }
});

test('selected member reads reject links, directories and declared-size overflow', async (t) => {
  const f = await fixture(t);
  const member = path.join(f.root, 'input/model.json');
  assert.deepEqual(await regularBytes(member, f.bytes.length), f.bytes);
  await assert.rejects(regularBytes(member, f.bytes.length - 1), {
    code: 'file_size_exceeded',
  });
  await assert.rejects(regularBytes(path.join(f.root, 'input'), 1024), {
    code: 'bundle_type_unsupported',
  });
  const link = path.join(f.root, 'input/linked.json');
  await fs.symlink(member, link);
  await assert.rejects(regularBytes(link, 1024), { code: 'bundle_symlink_forbidden' });
});

test('manifest root changing after ancestor inspection fails closed', async (t) => {
  for (const kind of ['symlink', 'file']) {
    const f = await fixture(t);
    const nativeLstat = fs.lstat;
    let rootReads = 0;
    fs.lstat = async (file, ...args) => {
      const stat = await nativeLstat(file, ...args);
      if (file !== f.root || ++rootReads !== 2) return stat;
      return {
        isSymbolicLink: () => kind === 'symlink',
        isDirectory: () => kind !== 'file',
      };
    };
    try {
      await assert.rejects(readSourceBundle(f.file, f.digest), {
        code: kind === 'symlink' ? 'bundle_symlink_forbidden' : 'bundle_type_unsupported',
      });
    } finally {
      fs.lstat = nativeLstat;
    }
    assert.equal(rootReads, 2);
  }
});

test('undeclared case-alias member cannot borrow a selected bundle', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'input/MODEL.JSON'), f.bytes);
  if ((await fs.readdir(path.join(f.root, 'input'))).length < 2) {
    t.skip('the filesystem folds case-alias names');
    return;
  }
  await assert.rejects(readSourceBundle(f.file, f.digest), {
    code: 'member_path_duplicate',
  });
});

test('selected member reads reject changed handles, short reads and trailing bytes', async (t) => {
  const f = await fixture(t);
  const member = path.join(f.root, 'input/model.json');
  const before = await fs.lstat(member);
  const nativeOpen = fs.open;
  try {
    for (const mode of ['not-file', 'replaced', 'short-read', 'trailing-byte', 'changed-after']) {
      let stats = 0;
      fs.open = async (file) => {
        assert.equal(file, member);
        return {
          stat: async () => {
            stats++;
            return {
              isFile: () => mode !== 'not-file',
              dev: before.dev + (mode === 'replaced' ? 1 : 0),
              ino: before.ino,
              size: before.size,
              mtimeMs: before.mtimeMs + (mode === 'changed-after' && stats > 1 ? 1 : 0),
              ctimeMs: before.ctimeMs,
            };
          },
          read: async (buffer, offset, length, position) => {
            if (position < f.bytes.length) {
              if (mode === 'short-read') return { bytesRead: 0 };
              f.bytes.copy(buffer, offset, position, position + length);
              return { bytesRead: length };
            }
            return { bytesRead: mode === 'trailing-byte' ? 1 : 0 };
          },
          close: async () => {},
        };
      };
      await assert.rejects(
        regularBytes(member, f.bytes.length),
        {
          code: mode === 'not-file' ? 'bundle_type_unsupported' : 'bundle_changed',
        },
        mode,
      );
    }
  } finally {
    fs.open = nativeOpen;
  }
});

test('rejects changed member bytes even when length stays constant', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'input/model.json'), Buffer.alloc(f.bytes.length, 'x'));
  await assert.rejects(readSourceBundle(f.file, f.digest), { code: 'member_digest_mismatch' });
});

test('rejects changed size, missing and undeclared members', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'input/model.json'), 'x');
  await assert.rejects(readSourceBundle(f.file, f.digest), { code: 'member_size_mismatch' });
  await fs.unlink(path.join(f.root, 'input/model.json'));
  await assert.rejects(readSourceBundle(f.file, f.digest), { code: 'bundle_members_mismatch' });
  await fs.writeFile(path.join(f.root, 'input/model.json'), f.bytes);
  await fs.writeFile(path.join(f.root, '.hidden-extra'), 'not listed');
  await assert.rejects(readSourceBundle(f.file, f.digest), { code: 'bundle_members_mismatch' });
});

test('a selected bundle refuses special filesystem entries', async (t) => {
  const f = await fixture(t);
  const special = path.join(f.root, 'foreign-special');
  await fs.writeFile(special, 'test-owned non-regular classification');
  const nativeLstat = fs.lstat;
  fs.lstat = async (file, ...args) => {
    const stat = await nativeLstat(file, ...args);
    return file === special
      ? {
          isSymbolicLink: () => false,
          isDirectory: () => false,
          isFile: () => false,
        }
      : stat;
  };
  try {
    await assert.rejects(readSourceBundle(f.file, f.digest), {
      code: 'bundle_type_unsupported',
    });
  } finally {
    fs.lstat = nativeLstat;
  }
});

test('a selected bundle detects manifest changes after all member reads', async (t) => {
  const f = await fixture(t);
  const member = path.join(f.root, 'input/model.json');
  const nativeOpen = fs.open;
  let changed = false;
  fs.open = async (file, ...args) => {
    const handle = await nativeOpen(file, ...args);
    if (file === member && !changed) {
      const nativeClose = handle.close.bind(handle);
      handle.close = async () => {
        await nativeClose();
        await fs.writeFile(f.file, '{"changed":true}\n');
        changed = true;
      };
    }
    return handle;
  };
  try {
    await assert.rejects(readSourceBundle(f.file, f.digest), { code: 'bundle_changed' });
  } finally {
    fs.open = nativeOpen;
  }
  assert.equal(changed, true);
});

test('rejects symlink members and symlink manifest', async (t) => {
  const f = await fixture(t);
  await fs.rename(path.join(f.root, 'input/model.json'), path.join(f.root, 'input/actual.json'));
  await fs.symlink('actual.json', path.join(f.root, 'input/model.json'));
  await assert.rejects(readSourceBundle(f.file, f.digest), { code: 'bundle_symlink_forbidden' });
  await fs.rename(f.file, path.join(f.root, 'actual-manifest.json'));
  await fs.symlink('actual-manifest.json', f.file);
  await assert.rejects(readSourceBundle(f.file, f.digest), { code: 'bundle_symlink_forbidden' });
});

test('rejects symlink directory and self-inclusion', async (t) => {
  const f = await fixture(t);
  await fs.rename(path.join(f.root, 'input'), path.join(f.root, 'actual-input'));
  await fs.symlink('actual-input', path.join(f.root, 'input'));
  await assert.rejects(readSourceBundle(f.file, f.digest), { code: 'bundle_symlink_forbidden' });
  await fs.unlink(path.join(f.root, 'input'));
  await fs.rename(path.join(f.root, 'actual-input'), path.join(f.root, 'input'));
  f.manifest.files.push({ path: 'manifest.json', bytes: 0, sha256: sha('') });
  await assert.rejects(readSourceBundle(f.file, await f.save()), { code: 'manifest_self_member' });
});

test('rejects inconsistent directory aliases before filesystem access', async (t) => {
  const f = await fixture(t);
  f.manifest.files = ['Directory/a', 'directory/b'].map((p) => ({
    ...f.manifest.files[0],
    path: p,
  }));
  assert.throws(() => validateManifest(f.manifest), { code: 'member_path_duplicate' });
});

test('uses UTF-8 component byte limits, not JavaScript character count', async (t) => {
  const f = await fixture(t);
  f.manifest.files[0].path = 'é'.repeat(128);
  assert.throws(() => validateManifest(f.manifest), { code: 'member_path_invalid' });
  f.manifest.files[0].path = 'é'.repeat(127) + 'a';
  assert.equal(validateManifest(f.manifest).files[0].path, f.manifest.files[0].path);
});
