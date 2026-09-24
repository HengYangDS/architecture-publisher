import { createHash } from 'node:crypto';
import { deepFreeze } from './document.mjs';
import { fail, isDigest, LIMITS } from '../source/manifest.mjs';

const sha = (value) => createHash('sha256').update(value).digest('hex');
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
// Native .c4 files do not declare the parser package's release version.
const NATIVE_FORMAT_VERSION = 'unversioned';

function selectedSources(selection) {
  if (
    selection?.lock?.schema !== 'architecture.materialized-input-lock/v1' ||
    !Array.isArray(selection.lock.sources) ||
    typeof selection.readSource !== 'function'
  )
    fail('native_likec4_selection_invalid');

  const sources = selection.lock.sources
    .filter(({ format }) => format?.id === 'likec4/dsl')
    .sort((left, right) => compare(left.namespace, right.namespace));
  if (!sources.length) fail('native_likec4_sources_missing');

  const files = {};
  const byFile = new Map();
  let total = 0;
  for (const source of sources) {
    if (
      source.format.version !== NATIVE_FORMAT_VERSION ||
      typeof source.namespace !== 'string' ||
      !source.namespace ||
      !isDigest(source.sha256)
    )
      fail('native_likec4_selection_invalid');
    const bytes = selection.readSource(source.namespace);
    if (!Buffer.isBuffer(bytes) || sha(bytes) !== source.sha256)
      fail('native_likec4_digest_mismatch');
    total += bytes.length;
    if (bytes.length > LIMITS.memberBytes || total > LIMITS.totalBytes)
      fail('native_likec4_size_exceeded');
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      fail('native_likec4_utf8_invalid');
    }
    const name = `${sha(source.namespace)}.c4`;
    if (byFile.has(name)) fail('native_likec4_selection_invalid');
    files[name] = text;
    byFile.set(name, { ...source, text });
  }
  return { files, byFile, sources };
}

function sourceForPath(file, byFile) {
  if (typeof file !== 'string') fail('native_likec4_source_reference_invalid');
  const normalized = file.replaceAll('\\', '/');
  if (!normalized.startsWith('/workspace/')) fail('native_likec4_source_reference_unselected');
  const name = normalized.slice('/workspace/'.length);
  const source = byFile.get(name);
  if (!source) fail('native_likec4_source_reference_unselected');
  return source;
}

function originFor(parser, query, byFile) {
  const location = parser.languageServices.locate(query);
  if (location === null) return null;
  let uri;
  try {
    uri = new URL(location.uri);
  } catch {
    fail('native_likec4_source_reference_invalid');
  }
  if (uri.protocol !== 'virtual:') fail('native_likec4_source_reference_invalid');
  let pathname;
  try {
    pathname = decodeURIComponent(uri.pathname);
  } catch {
    fail('native_likec4_source_reference_invalid');
  }
  const source = sourceForPath(pathname, byFile);
  const range = location.range;
  for (const position of [range?.start, range?.end])
    if (
      !Number.isSafeInteger(position?.line) ||
      position.line < 0 ||
      !Number.isSafeInteger(position?.character) ||
      position.character < 0
    )
      fail('native_likec4_source_reference_invalid');
  if (
    range.end.line < range.start.line ||
    (range.end.line === range.start.line && range.end.character < range.start.character)
  )
    fail('native_likec4_source_reference_invalid');
  const lines = source.text.split(/\r\n|\n|\r/u);
  for (const position of [range.start, range.end])
    if (position.line >= lines.length || position.character > lines[position.line].length)
      fail('native_likec4_source_reference_invalid');
  return {
    namespace: source.namespace,
    sha256: source.sha256,
    range: structuredClone(range),
    quality:
      range.start.line === range.end.line && range.start.character === range.end.character
        ? 'point'
        : 'range',
  };
}

/** Import selected LikeC4 bytes through one explicitly supplied upstream parser. */
export async function importLikeC4Native(selection, fromSources) {
  if (typeof fromSources !== 'function') fail('native_likec4_parser_required');
  const { files, byFile, sources } = selectedSources(selection);
  let parser;
  try {
    parser = await fromSources(files, {
      printErrors: false,
      throwIfInvalid: false,
      configureLogger: false,
    });
  } catch {
    fail('native_likec4_parse_invalid');
  }
  const paths = parser.documentPaths();
  const expectedPaths = new Set([...byFile.keys()].map((name) => `/workspace/${name}`));
  if (
    !Array.isArray(paths) ||
    paths.length !== expectedPaths.size ||
    new Set(paths.map((file) => typeof file === 'string' && file.replaceAll('\\', '/'))).size !==
      expectedPaths.size ||
    paths.some((file) => typeof file !== 'string' || !expectedPaths.has(file.replaceAll('\\', '/')))
  )
    fail('native_likec4_document_set_mismatch');
  if (parser.languageServices.getErrors().length) fail('native_likec4_parse_invalid');

  let model;
  try {
    parser.ensureSingleProject();
    model = parser.syncComputedModel();
  } catch {
    fail('native_likec4_model_invalid');
  }
  const elements = [...model.elements()].map((element) => {
    const origin = originFor(parser, { element: element.id }, byFile);
    if (!origin) fail('native_likec4_source_reference_missing');
    return {
      id: element.id,
      namespace: origin.namespace,
      kind: element.kind ?? null,
      label: element.title ?? null,
      origin,
    };
  });
  elements.sort((left, right) => compare(left.id, right.id));
  const elementById = new Map(elements.map((element) => [element.id, element]));
  const relations = [...model.relationships()].map((relation) => {
    const origin = originFor(parser, { relation: relation.id }, byFile);
    const from = elementById.get(relation.source.id);
    const to = elementById.get(relation.target.id);
    if (!origin || !from || !to) fail('native_likec4_source_reference_missing');
    return {
      id: relation.id,
      identityScope: 'parser-run',
      from: { namespace: from.namespace, id: from.id },
      to: { namespace: to.namespace, id: to.id },
      kind: relation.kind ?? null,
      direction: relation.isBidirectional ? 'bidirectional' : 'forward',
      label: relation.title ?? null,
      origin,
    };
  });
  relations.sort(
    (left, right) =>
      compare(left.origin.namespace, right.origin.namespace) ||
      left.origin.range.start.line - right.origin.range.start.line ||
      left.origin.range.start.character - right.origin.range.start.character ||
      compare(left.id, right.id),
  );
  const relationIds = new Set(relations.map(({ id }) => id));
  const unlocatedViews = [];
  const views = [];
  for (const view of model.views()) {
    const origin = originFor(parser, { view: view.id }, byFile);
    if (!origin) {
      unlocatedViews.push(view.id);
      continue;
    }
    const members = [...view.elements()].map((element) => {
      const selected = elementById.get(element.id);
      if (!selected) fail('native_likec4_view_element_unselected');
      return { namespace: selected.namespace, id: selected.id };
    });
    members.sort(
      (left, right) => compare(left.namespace, right.namespace) || compare(left.id, right.id),
    );
    const relationships = [
      ...new Set(
        [...view.edges()].flatMap((edge) => [...edge.relationships()].map(({ id }) => id)),
      ),
    ].sort(compare);
    if (relationships.some((id) => !relationIds.has(id)))
      fail('native_likec4_view_relation_unselected');
    views.push({
      id: view.id,
      namespace: origin.namespace,
      elements: members,
      relations: relationships,
      origin,
    });
  }
  views.sort((left, right) => compare(left.id, right.id));
  unlocatedViews.sort(compare);
  return deepFreeze({
    schema: 'architecture.native-index/v1',
    format: 'likec4/dsl',
    closure: 'parsed-document-set-only',
    sources: sources.map(({ namespace, claimant, format, revision, sha256 }) => ({
      namespace,
      claimant,
      format: structuredClone(format),
      revision: structuredClone(revision),
      sha256,
    })),
    elements,
    relations,
    views,
    unlocatedViews,
    semanticLimits: ['domain-metadata-opaque', 'view-membership-upstream-computed-unqualified'],
  });
}
