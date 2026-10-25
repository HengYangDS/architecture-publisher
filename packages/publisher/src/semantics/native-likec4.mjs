import { createHash } from "node:crypto";
import { deepFreeze, jsonValue, record, text } from "./document.mjs";
import { executeLikeC4Layout, executeLikeC4Native } from "./native-execution.mjs";
import { readLikeC4ParserSupply } from "./supply.mjs";
import { fail, hasExactFields, isDigest } from "../protocol/values.mjs";
import { LIMITS } from "../file-input/contract.mjs";
import { validateLikeC4NodeSize } from "./native-layout.mjs";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
// Native .c4 files do not declare the parser package's release version.
const NATIVE_FORMAT_VERSION = "unversioned";

function opaqueMetadata(value) {
  if (!record(value)) fail("native_likec4_metadata_invalid");
  try {
    jsonValue(value, 0, new Set(), { nodes: 0, bytes: 0 }, new Set());
    return Object.keys(value).length ? structuredClone(value) : null;
  } catch {
    fail("native_likec4_metadata_invalid");
  }
}

function selectedSources(selection) {
  if (
    selection?.lock?.schema !== "architecture.materialized-input-lock/v1" ||
    !Array.isArray(selection.lock.sources) ||
    typeof selection.readSource !== "function"
  )
    fail("native_likec4_selection_invalid");

  const sources = selection.lock.sources
    .filter(({ format }) => format?.id === "likec4/dsl")
    .sort((left, right) => compare(left.namespace, right.namespace));
  if (!sources.length) fail("native_likec4_sources_missing");

  const files = {};
  const byFile = new Map();
  const contents = new Map();
  let total = 0;
  for (const source of sources) {
    if (
      source.format.version !== NATIVE_FORMAT_VERSION ||
      typeof source.namespace !== "string" ||
      !source.namespace ||
      !isDigest(source.sha256)
    )
      fail("native_likec4_selection_invalid");
    const bytes = selection.readSource(source.namespace);
    if (!Buffer.isBuffer(bytes) || sha(bytes) !== source.sha256)
      fail("native_likec4_digest_mismatch");
    contents.set(source.namespace, Buffer.from(bytes));
    total += bytes.length;
    if (bytes.length > LIMITS.memberBytes || total > LIMITS.totalBytes)
      fail("native_likec4_size_exceeded");
    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      fail("native_likec4_utf8_invalid");
    }
    const name = `${sha(source.namespace)}.c4`;
    if (byFile.has(name)) fail("native_likec4_selection_invalid");
    files[name] = text;
    byFile.set(name, {
      ...source,
      lineLengths: text.split(/\r\n|\n|\r/u).map((line) => line.length),
    });
  }
  return { files, byFile, sources, contents };
}

function sourceForPath(file, byFile) {
  if (typeof file !== "string") fail("native_likec4_source_reference_invalid");
  const normalized = file.replaceAll("\\", "/");
  if (!normalized.startsWith("/workspace/")) fail("native_likec4_source_reference_unselected");
  const name = normalized.slice("/workspace/".length);
  const source = byFile.get(name);
  if (!source) fail("native_likec4_source_reference_unselected");
  return source;
}

function originFor(parser, query, byFile) {
  const location = parser.languageServices.locate(query);
  if (location === null) return null;
  let uri;
  try {
    uri = new URL(location.uri);
  } catch {
    fail("native_likec4_source_reference_invalid");
  }
  if (uri.protocol !== "virtual:") fail("native_likec4_source_reference_invalid");
  let pathname;
  try {
    pathname = decodeURIComponent(uri.pathname);
  } catch {
    fail("native_likec4_source_reference_invalid");
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
      fail("native_likec4_source_reference_invalid");
  if (
    range.end.line < range.start.line ||
    (range.end.line === range.start.line && range.end.character < range.start.character)
  )
    fail("native_likec4_source_reference_invalid");
  for (const position of [range.start, range.end])
    if (
      position.line >= source.lineLengths.length ||
      position.character > source.lineLengths[position.line]
    )
      fail("native_likec4_source_reference_invalid");
  return {
    namespace: source.namespace,
    sha256: source.sha256,
    range: structuredClone(range),
    quality:
      range.start.line === range.end.line && range.start.character === range.end.character
        ? "point"
        : "range",
  };
}

/** Internal parser seam for adversarial conformance tests; not a package export. */
export async function importLikeC4NativeWithParser(selection, fromSources) {
  if (typeof fromSources !== "function") fail("native_likec4_parser_required");
  const { files, byFile, sources } = selectedSources(selection);
  let parser;
  try {
    parser = await fromSources(files, {
      printErrors: false,
      throwIfInvalid: false,
      configureLogger: false,
      useFileSystem: false,
      manualLayouts: false,
      watch: false,
      graphviz: "wasm",
    });
  } catch {
    fail("native_likec4_parse_invalid");
  }
  const paths = parser.documentPaths();
  const expectedPaths = new Set([...byFile.keys()].map((name) => `/workspace/${name}`));
  if (
    !Array.isArray(paths) ||
    paths.length !== expectedPaths.size ||
    new Set(paths.map((file) => typeof file === "string" && file.replaceAll("\\", "/"))).size !==
      expectedPaths.size ||
    paths.some((file) => typeof file !== "string" || !expectedPaths.has(file.replaceAll("\\", "/")))
  )
    fail("native_likec4_document_set_mismatch");
  if (parser.languageServices.getErrors().length) fail("native_likec4_parse_invalid");

  let model;
  try {
    parser.ensureSingleProject();
    model = parser.syncComputedModel();
  } catch {
    fail("native_likec4_model_invalid");
  }
  const nativeElements = [...model.elements()];
  const elements = nativeElements.map((element) => {
    const origin = originFor(parser, { element: element.id }, byFile);
    if (!origin) fail("native_likec4_source_reference_missing");
    const metadata = opaqueMetadata(element.metadata);
    return {
      id: element.id,
      namespace: origin.namespace,
      kind: element.kind ?? null,
      label: element.title ?? null,
      parent: /** @type {{ namespace: string, id: string } | null} */ (null),
      ...(metadata === null ? {} : { opaqueMetadata: metadata }),
      origin,
    };
  });
  elements.sort((left, right) => compare(left.id, right.id));
  const elementById = new Map(elements.map((element) => [element.id, element]));
  for (const element of nativeElements) {
    if (!element.parent) continue;
    const current = elementById.get(element.id);
    const parent = elementById.get(element.parent.id);
    if (!current || !parent) fail("native_likec4_source_reference_missing");
    current.parent = { namespace: parent.namespace, id: parent.id };
  }
  const relations = [...model.relationships()].map((relation) => {
    const origin = originFor(parser, { relation: relation.id }, byFile);
    const from = elementById.get(relation.source.id);
    const to = elementById.get(relation.target.id);
    if (!origin || !from || !to) fail("native_likec4_source_reference_missing");
    const metadata = opaqueMetadata(relation.metadata);
    return {
      id: relation.id,
      identityScope: "parser-run",
      from: { namespace: from.namespace, id: from.id },
      to: { namespace: to.namespace, id: to.id },
      kind: relation.kind ?? null,
      direction: relation.isBidirectional ? "bidirectional" : "forward",
      label: relation.title ?? null,
      ...(metadata === null ? {} : { opaqueMetadata: metadata }),
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
  const generatedViews = [];
  const views = [];
  const opaqueViews = [];
  for (const view of model.views()) {
    const origin = originFor(parser, { view: view.id }, byFile);
    if (typeof view.$view?._type !== "string" || !view.$view._type)
      fail("native_likec4_view_type_invalid");
    const declaredPath = view.$view.sourcePath;
    if (declaredPath === undefined) {
      if (origin || view.$view._type !== "element") fail("native_likec4_source_reference_invalid");
      generatedViews.push(view.id);
      continue;
    }
    if (!origin) fail("native_likec4_source_reference_missing");
    if (typeof declaredPath !== "string" || !declaredPath)
      fail("native_likec4_source_reference_invalid");
    const declaredSource = sourceForPath(`/workspace/${declaredPath}`, byFile);
    if (declaredSource.namespace !== origin.namespace)
      fail("native_likec4_source_reference_invalid");
    if (view.$view._type !== "element") {
      opaqueViews.push({
        id: view.id,
        namespace: origin.namespace,
        kind: view.$view._type,
        origin,
      });
      continue;
    }
    const nodes = [...view.nodes()].map((node) => {
      const element = node.element;
      const selected = element ? elementById.get(element.id) : null;
      if (element && !selected) fail("native_likec4_view_element_unselected");
      if (!element && !node.isGroup()) fail("native_likec4_view_node_unrepresentable");
      return {
        id: node.id,
        parent: node.parent?.id ?? null,
        label: node.title,
        element: selected ? { namespace: selected.namespace, id: selected.id } : null,
      };
    });
    nodes.sort((left, right) => compare(left.id, right.id));
    const edges = [...view.edges()].map((edge) => {
      const relationships = [...edge.relationships()].map(({ id }) => id).sort(compare);
      if (relationships.some((id) => !relationIds.has(id)))
        fail("native_likec4_view_relation_unselected");
      return {
        id: edge.id,
        from: edge.source.id,
        to: edge.target.id,
        label: edge.label,
        relations: relationships,
      };
    });
    edges.sort((left, right) => compare(left.id, right.id));
    views.push({
      id: view.id,
      namespace: origin.namespace,
      nodes,
      edges,
      origin,
    });
  }
  views.sort((left, right) => compare(left.id, right.id));
  opaqueViews.sort((left, right) => compare(left.id, right.id));
  generatedViews.sort(compare);
  return deepFreeze({
    schema: "architecture.native-index/v2",
    format: "likec4/dsl",
    closure: "parsed-document-set-only",
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
    opaqueViews,
    generatedViews,
    semanticLimits: [
      "domain-metadata-opaque",
      "view-membership-upstream-computed-unqualified",
      ...(opaqueViews.length ? ["native-view-semantics-uninterpreted"] : []),
    ],
  });
}

/** Public native import selects only the verified parser bundled with Publisher. */
export async function importLikeC4Native(selection) {
  if (arguments.length !== 1) fail("native_likec4_parser_override_forbidden");
  const { sources, contents } = selectedSources(selection);
  const supply = await readLikeC4ParserSupply();
  return executeLikeC4Native(
    sources.map((source) => ({ source, content: contents.get(source.namespace) })),
    supply,
  );
}

/** Resolve only one authored structural view through the verified parser supply. */
export async function importLikeC4Layout(selection) {
  if (arguments.length !== 1) fail("native_likec4_parser_override_forbidden");
  const view = selection?.view;
  if (
    !record(view) ||
    !hasExactFields(view, ["id", "namespace"]) ||
    !text(view.namespace) ||
    !text(view.id) ||
    Buffer.byteLength(view.namespace, "utf8") > 2048 ||
    Buffer.byteLength(view.id, "utf8") > 2048
  )
    fail("native_likec4_reference_invalid");
  const selectedView = { namespace: view.namespace, id: view.id };
  const nodeSize = validateLikeC4NodeSize(selection.nodeSize);
  const { sources, contents } = selectedSources(selection);
  const supply = await readLikeC4ParserSupply();
  return executeLikeC4Layout(
    sources.map((source) => ({ source, content: contents.get(source.namespace) })),
    supply,
    selectedView,
    nodeSize ? { nodeSize } : {},
  );
}
