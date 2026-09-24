/** File-envelope values only; source semantics and approval stay outside this module. */
export const LIMITS = Object.freeze({
  manifestBytes: 1024 * 1024,
  memberBytes: 32 * 1024 * 1024,
  totalBytes: 128 * 1024 * 1024,
  files: 4096,
  entries: 8192,
  depth: 32,
});
/** @returns {never} */
export function fail(code, message = code) {
  throw Object.assign(new Error(message), { code });
}
export function isDigest(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}
function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function keys(value, required, optional = []) {
  return (
    record(value) &&
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => required.includes(key) || optional.includes(key))
  );
}
export function portablePath(value) {
  if (
    typeof value !== 'string' ||
    !value ||
    Buffer.byteLength(value, 'utf8') > 2048 ||
    /[\uD800-\uDFFF]/u.test(value) ||
    /[\\\x00-\x1f\x7f:<>"|?*]/.test(value)
  )
    fail('member_path_invalid');
  const parts = value.split('/');
  if (
    parts.length > LIMITS.depth ||
    parts.some(
      (part) =>
        !part ||
        Buffer.byteLength(part, 'utf8') > 255 ||
        part === '.' ||
        part === '..' ||
        /[. ]$/.test(part) ||
        /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(part),
    )
  )
    fail('member_path_invalid');
  return value;
}
export function portableKey(value) {
  return value.normalize('NFC').toLowerCase();
}
export function validateManifest(value) {
  if (!keys(value, ['schema', 'source', 'files'])) fail('manifest_fields_invalid');
  if (value.schema !== 'architecture.source-bundle/v1') fail('schema_unsupported');
  if (
    !keys(value.source, ['id'], ['revision']) ||
    typeof value.source.id !== 'string' ||
    !value.source.id.trim() ||
    (Object.hasOwn(value.source, 'revision') &&
      (typeof value.source.revision !== 'string' || !value.source.revision.trim()))
  )
    fail('source_invalid');
  validateFileMembers(value.files);
  return structuredClone(value);
}

/** Common file-list constraints, independent of producer metadata. */
export function validateFileMembers(files) {
  if (!Array.isArray(files) || !files.length || files.length > LIMITS.files)
    fail('members_invalid');
  const names = new Set();
  const directories = new Map();
  let total = 0;
  for (const member of files) {
    if (!keys(member, ['path', 'bytes', 'sha256'])) fail('member_fields_invalid');
    const name = portableKey(portablePath(member.path));
    const parts = member.path.split('/');
    for (let i = 1; i < parts.length; i++) {
      const directory = parts.slice(0, i).join('/');
      const key = portableKey(directory);
      if (directories.has(key) && directories.get(key) !== directory) fail('member_path_duplicate');
      directories.set(key, directory);
    }
    if (names.has(name)) fail('member_path_duplicate');
    names.add(name);
    if (
      !Number.isSafeInteger(member.bytes) ||
      member.bytes < 0 ||
      member.bytes > LIMITS.memberBytes
    )
      fail('member_size_invalid');
    total += member.bytes;
    if (total > LIMITS.totalBytes) fail('bundle_size_exceeded');
    if (!isDigest(member.sha256)) fail('member_digest_invalid');
  }
  for (const name of names) {
    const parts = name.split('/');
    for (let i = 1; i < parts.length; i++)
      if (names.has(parts.slice(0, i).join('/'))) fail('member_path_duplicate');
  }
  return structuredClone(files);
}
