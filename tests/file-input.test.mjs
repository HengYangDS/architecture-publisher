import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { portablePath } from '../packages/publisher/src/file-input/contract.mjs';

test('portable member paths refuse ASCII controls without rejecting valid Unicode', () => {
  for (const code of [...Array.from({ length: 32 }, (_, index) => index), 127]) {
    assert.throws(() => portablePath(`nested/a${String.fromCharCode(code)}b.txt`), {
      code: 'member_path_invalid',
    });
  }
  assert.equal(portablePath('nested/source \u0394.txt'), 'nested/source \u0394.txt');
  assert.equal(portablePath('nested/a\u0080b.txt'), 'nested/a\u0080b.txt');
});

test('independent editors read bounded regular bytes and decode strict JSON without Source Bundle authority', async (t) => {
  const api = await import('../packages/publisher/src/file-input/index.mjs').catch(() => null);
  assert.equal(typeof api?.readBoundedFile, 'function');
  assert.equal(typeof api?.parseStrictJson, 'function');
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-file-input-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'selected.json');
  const bytes = Buffer.from('{"selected":true}\n');
  await fs.writeFile(file, bytes);
  assert.deepEqual(await api.readBoundedFile(file, bytes.length), bytes);
  await assert.rejects(api.readBoundedFile(file, bytes.length - 1), {
    code: 'file_size_exceeded',
  });
  await assert.rejects(api.readBoundedFile(file, -1), { code: 'file_size_limit_invalid' });
  await fs.symlink(file, path.join(root, 'linked.json'));
  await assert.rejects(api.readBoundedFile(path.join(root, 'linked.json'), bytes.length), {
    code: 'bundle_symlink_forbidden',
  });
  await assert.rejects(api.readBoundedFile(root, bytes.length), {
    code: 'bundle_type_unsupported',
  });
  const nested = path.join(root, 'nested');
  await fs.mkdir(nested);
  await fs.copyFile(file, path.join(nested, 'selected.json'));
  const linkedDirectory = path.join(root, 'linked-directory');
  await fs.symlink(nested, linkedDirectory, 'dir');
  await assert.rejects(
    api.readBoundedFile(path.join(linkedDirectory, 'selected.json'), bytes.length),
    { code: 'bundle_symlink_forbidden' },
  );
  assert.deepEqual(api.parseStrictJson(bytes, 'invalid_json', 'duplicate_key'), {
    selected: true,
  });
  assert.throws(
    () =>
      api.parseStrictJson(
        Buffer.from('{"selected":true,"selected":false}'),
        'invalid_json',
        'duplicate_key',
      ),
    { code: 'duplicate_key' },
  );
});
