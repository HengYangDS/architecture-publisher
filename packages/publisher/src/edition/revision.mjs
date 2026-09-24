import { createHash } from 'node:crypto';
import { canonical, jsonValue } from '../semantics/document.mjs';
import { fail } from '../source/manifest.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Require canonical UTF-8 JSON bytes, allowing exactly one terminal LF. */
function canonicalJson(bytes) {
  let value;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    jsonValue(value);
  } catch {
    fail('materialized_revision_json_invalid');
  }
  const serialized = canonical(value);
  const actual = bytes.toString('utf8');
  if (actual !== serialized && actual !== `${serialized}\n`)
    fail('materialized_revision_not_canonical');
  return Buffer.from(serialized);
}

/** Derive only the revision evidence supported by the selected root bytes. */
export function deriveSourceRevision(selection, content, vcsObject, vcsBlob) {
  if (selection.kind === 'content') {
    const canonicalization = selection.canonicalization ?? 'raw-bytes/v1';
    const selected = canonicalization === 'publisher-json/v1' ? canonicalJson(content) : content;
    return {
      kind: 'content',
      scope: 'selected-root',
      canonicalization,
      algorithm: selection.algorithm,
      value: sha(selected),
      verification: 'recomputed',
    };
  }
  if (selection.kind === 'vcs')
    return {
      kind: 'vcs',
      repository: selection.repository,
      ref: selection.ref,
      object: vcsObject,
      blob: vcsBlob,
      verification: vcsObject === null ? 'unverified' : 'selected-object-checked',
      method: vcsObject === null ? 'none' : 'git-commit-tree-blob/v1',
    };
  return {
    kind: 'opaque',
    value: selection.value,
    verification: 'attributed-only',
    method: 'none',
  };
}
