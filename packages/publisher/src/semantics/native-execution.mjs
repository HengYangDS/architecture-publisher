import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PROCESS_CLEANUP_MS, runOwnedProcess } from "../runtime/process-tree.mjs";
import { fail, isDigest } from "../protocol/values.mjs";
import { LIMITS } from "../file-input/contract.mjs";
import { deepFreeze, exact, jsonValue, record, text } from "./document.mjs";
import { validateLikeC4LayoutReply } from "./native-layout.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const worker = fileURLToPath(new URL("./native-worker.mjs", import.meta.url));
const sourceRoot = path.dirname(path.dirname(worker));
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_REPLY_BYTES = 16 * 1024 * 1024;

/** Only stable Permission Model versions are admitted for native execution. */
export function nativePermissionSupported(version = process.versions.node) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(version);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major >= 24 || (major === 23 && minor >= 5) || (major === 22 && minor >= 13);
}

function validOrigin(origin, sourceByNamespace) {
  if (!exact(origin, ["namespace", "sha256", "range", "quality"])) return false;
  const selected = sourceByNamespace.get(origin.namespace);
  const range = origin.range;
  return (
    selected?.sha256 === origin.sha256 &&
    ["point", "range"].includes(origin.quality) &&
    exact(range, ["start", "end"]) &&
    [range.start, range.end].every(
      (position) =>
        exact(position, ["line", "character"]) &&
        Number.isSafeInteger(position.line) &&
        position.line >= 0 &&
        Number.isSafeInteger(position.character) &&
        position.character >= 0,
    ) &&
    (range.end.line > range.start.line ||
      (range.end.line === range.start.line && range.end.character >= range.start.character)) &&
    origin.quality ===
      (range.start.line === range.end.line && range.start.character === range.end.character
        ? "point"
        : "range")
  );
}

function sourceIdentity({ namespace, claimant, format, revision, sha256 }) {
  return { namespace, claimant, format, revision, sha256 };
}

/**
 * Validate one explicit parent forest and index ancestry without interpreting names.
 * @template T
 * @param {Map<string, T>} items
 * @param {(item: T) => string | null} parentFor
 */
function parentForest(items, parentFor) {
  /** @type {Map<string, string[]>} */
  const children = new Map([...items.keys()].map((id) => [id, []]));
  const roots = [];
  for (const [id, item] of items) {
    const parent = parentFor(item);
    if (parent === null) roots.push(id);
    else {
      const siblings = children.get(parent);
      if (!siblings) fail("native_likec4_response_invalid");
      siblings.push(id);
    }
  }
  const spans = new Map();
  /** @type {[string, boolean][]} */
  const pending = roots.map((id) => [id, false]);
  let position = 0;
  for (let step = pending.pop(); step; step = pending.pop()) {
    const [id, closing] = step;
    if (closing) {
      const span = spans.get(id);
      if (!span) fail("native_likec4_response_invalid");
      span.end = position++;
    } else {
      spans.set(id, { start: position++, end: 0 });
      pending.push([id, true]);
      const childIds = children.get(id);
      if (!childIds) fail("native_likec4_response_invalid");
      for (const child of childIds) pending.push([child, false]);
    }
  }
  if (spans.size !== items.size) fail("native_likec4_response_invalid");
  return spans;
}

/** Check occurrence references against the already validated source model. */
function validateProjection(view, elements, relations, sourceAncestry, itemKey) {
  const nodes = new Map();
  for (const node of view.nodes) {
    if (
      !exact(node, ["id", "parent", "label", "element"]) ||
      !text(node.id) ||
      (node.parent !== null && !text(node.parent)) ||
      (node.label !== null && typeof node.label !== "string") ||
      (node.element !== null &&
        (!exact(node.element, ["namespace", "id"]) || !elements.has(itemKey(node.element)))) ||
      nodes.has(node.id)
    )
      fail("native_likec4_response_invalid");
    nodes.set(node.id, node);
  }
  parentForest(nodes, ({ parent }) => parent);
  const contains = (ancestor, descendant) => {
    if (ancestor === null) return false;
    const outer = sourceAncestry.get(itemKey(ancestor));
    const inner = sourceAncestry.get(itemKey(descendant));
    return outer.start <= inner.start && inner.end <= outer.end;
  };
  const edges = new Set();
  for (const edge of view.edges) {
    if (
      !exact(edge, ["id", "from", "to", "label", "relations"]) ||
      !text(edge.id) ||
      !nodes.has(edge.from) ||
      !nodes.has(edge.to) ||
      (edge.label !== null && typeof edge.label !== "string") ||
      !Array.isArray(edge.relations) ||
      !edge.relations.length ||
      edge.relations.some((id) => !relations.has(id)) ||
      new Set(edge.relations).size !== edge.relations.length ||
      edges.has(edge.id)
    )
      fail("native_likec4_response_invalid");
    for (const id of edge.relations) {
      const relation = relations.get(id);
      if (
        !contains(nodes.get(edge.from).element, relation.from) ||
        !contains(nodes.get(edge.to).element, relation.to)
      )
        fail("native_likec4_response_invalid");
    }
    edges.add(edge.id);
  }
}

/** Validate the child-owned index shape and its selected identities, not DSL meaning. */
export function validateNativeIndexReply(index, sources) {
  if (
    !exact(index, [
      "schema",
      "format",
      "closure",
      "sources",
      "elements",
      "relations",
      "views",
      "opaqueViews",
      "generatedViews",
      "semanticLimits",
    ]) ||
    index.schema !== "architecture.native-index/v2" ||
    index.format !== "likec4/dsl" ||
    index.closure !== "parsed-document-set-only" ||
    !Array.isArray(index.sources) ||
    !Array.isArray(index.elements) ||
    !Array.isArray(index.relations) ||
    !Array.isArray(index.views) ||
    !Array.isArray(index.opaqueViews) ||
    !Array.isArray(index.generatedViews) ||
    !Array.isArray(index.semanticLimits)
  )
    fail("native_likec4_response_invalid");
  try {
    jsonValue(index);
  } catch {
    fail("native_likec4_response_invalid");
  }
  const expected = sources
    .map(sourceIdentity)
    .sort((left, right) =>
      left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0,
    );
  if (JSON.stringify(index.sources) !== JSON.stringify(expected))
    fail("native_likec4_response_invalid");
  const expectedLimits = [
    "domain-metadata-opaque",
    "view-membership-upstream-computed-unqualified",
    ...(index.opaqueViews.length ? ["native-view-semantics-uninterpreted"] : []),
  ];
  if (JSON.stringify(index.semanticLimits) !== JSON.stringify(expectedLimits))
    fail("native_likec4_response_invalid");
  const sourceByNamespace = new Map(expected.map((source) => [source.namespace, source]));
  const itemKey = ({ namespace, id }) => JSON.stringify([namespace, id]);
  const elements = new Map();
  for (const element of index.elements) {
    if (
      ![
        ["id", "namespace", "kind", "label", "parent", "origin"],
        ["id", "namespace", "kind", "label", "parent", "opaqueMetadata", "origin"],
      ].some((fields) => exact(element, fields)) ||
      !text(element.id) ||
      !sourceByNamespace.has(element.namespace) ||
      (element.kind !== null && typeof element.kind !== "string") ||
      (element.label !== null && typeof element.label !== "string") ||
      (element.parent !== null && !exact(element.parent, ["namespace", "id"])) ||
      !validOrigin(element.origin, sourceByNamespace) ||
      element.origin.namespace !== element.namespace ||
      (Object.hasOwn(element, "opaqueMetadata") && !record(element.opaqueMetadata)) ||
      elements.has(itemKey(element))
    )
      fail("native_likec4_response_invalid");
    elements.set(itemKey(element), element);
  }
  const sourceAncestry = parentForest(elements, ({ parent }) =>
    parent === null ? null : itemKey(parent),
  );
  const relations = new Map();
  for (const relation of index.relations) {
    if (
      ![
        ["id", "identityScope", "from", "to", "kind", "direction", "label", "origin"],
        [
          "id",
          "identityScope",
          "from",
          "to",
          "kind",
          "direction",
          "label",
          "opaqueMetadata",
          "origin",
        ],
      ].some((fields) => exact(relation, fields)) ||
      !text(relation.id) ||
      relation.identityScope !== "parser-run" ||
      !exact(relation.from, ["namespace", "id"]) ||
      !exact(relation.to, ["namespace", "id"]) ||
      !elements.has(itemKey(relation.from)) ||
      !elements.has(itemKey(relation.to)) ||
      (relation.kind !== null && typeof relation.kind !== "string") ||
      !["forward", "bidirectional"].includes(relation.direction) ||
      (relation.label !== null && typeof relation.label !== "string") ||
      !validOrigin(relation.origin, sourceByNamespace) ||
      (Object.hasOwn(relation, "opaqueMetadata") && !record(relation.opaqueMetadata)) ||
      relations.has(relation.id)
    )
      fail("native_likec4_response_invalid");
    relations.set(relation.id, relation);
  }
  for (const view of index.views) {
    if (
      !exact(view, ["id", "namespace", "nodes", "edges", "origin"]) ||
      !text(view.id) ||
      !sourceByNamespace.has(view.namespace) ||
      !validOrigin(view.origin, sourceByNamespace) ||
      view.origin.namespace !== view.namespace ||
      !Array.isArray(view.nodes) ||
      !Array.isArray(view.edges)
    )
      fail("native_likec4_response_invalid");
    validateProjection(view, elements, relations, sourceAncestry, itemKey);
  }
  for (const view of index.opaqueViews)
    if (
      !exact(view, ["id", "namespace", "kind", "origin"]) ||
      !text(view.id) ||
      !text(view.kind) ||
      !sourceByNamespace.has(view.namespace) ||
      !validOrigin(view.origin, sourceByNamespace) ||
      view.origin.namespace !== view.namespace
    )
      fail("native_likec4_response_invalid");
  const viewIds = [
    ...index.views.map(({ id }) => id),
    ...index.opaqueViews.map(({ id }) => id),
    ...index.generatedViews,
  ];
  if (index.generatedViews.some((id) => !text(id)) || new Set(viewIds).size !== viewIds.length)
    fail("native_likec4_response_invalid");
  return index;
}

function decodeReply(raw, state, reason, closedBeforeCleanup, sources, view) {
  if (reason === "timeout") fail("native_likec4_timeout");
  if (reason === "overflow") fail("native_likec4_reply_size_invalid");
  if (state.stderrBytes) fail("native_likec4_stderr_invalid");
  if (state.spawnError || (closedBeforeCleanup && reason === "reply"))
    fail("native_likec4_execution_failed");
  let envelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    fail("native_likec4_response_invalid");
  }
  if (exact(envelope, ["status", "code"]) && envelope.status === "error") {
    if (typeof envelope.code !== "string" || !/^native_likec4_[a-z0-9_]+$/u.test(envelope.code))
      fail("native_likec4_response_invalid");
    fail(envelope.code);
  }
  if (
    !exact(envelope, view === null ? ["status", "index"] : ["status", "index", "layout"]) ||
    envelope.status !== "ok"
  )
    fail("native_likec4_response_invalid");
  const index = validateNativeIndexReply(envelope.index, sources);
  return view === null ? index : validateLikeC4LayoutReply(envelope.layout, index, view);
}

/** Execute only verified LikeC4 bytes in a bounded child; not a sandbox claim. */
async function executeLikeC4Operation(selected, supply, options, view) {
  if (!nativePermissionSupported()) fail("native_likec4_capability_unavailable");
  const parserBytes = Buffer.isBuffer(supply?.parserBytes) ? Buffer.from(supply.parserBytes) : null;
  if (
    !isDigest(supply?.sha256) ||
    !isDigest(supply?.parserSha256) ||
    !parserBytes ||
    sha(parserBytes) !== supply.parserSha256
  )
    fail("native_likec4_supply_invalid");
  if (!Array.isArray(selected) || !selected.length || selected.length > LIMITS.files)
    fail("native_likec4_selection_invalid");
  const sources = [];
  const requestSources = [];
  let total = 0;
  for (const item of selected) {
    if (
      !exact(item, ["source", "content"]) ||
      !record(item.source) ||
      !Buffer.isBuffer(item.content)
    )
      fail("native_likec4_selection_invalid");
    const source = sourceIdentity(item.source);
    let descriptorBytes;
    try {
      descriptorBytes = Buffer.byteLength(JSON.stringify(source));
    } catch {
      fail("native_likec4_selection_invalid");
    }
    if (descriptorBytes > 8_192) fail("native_likec4_selection_invalid");
    if (!text(source.namespace) || !isDigest(source.sha256) || sha(item.content) !== source.sha256)
      fail("native_likec4_digest_mismatch");
    total += item.content.length;
    if (item.content.length > LIMITS.memberBytes || total > LIMITS.totalBytes)
      fail("native_likec4_size_exceeded");
    sources.push(source);
    requestSources.push({ source, contentBase64: item.content.toString("base64") });
  }
  if (new Set(sources.map(({ namespace }) => namespace)).size !== sources.length)
    fail("native_likec4_selection_invalid");
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const replyBytes = options.replyBytes ?? DEFAULT_REPLY_BYTES;
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > 60_000 ||
    !Number.isSafeInteger(replyBytes) ||
    replyBytes <= 0 ||
    replyBytes > DEFAULT_REPLY_BYTES
  )
    fail("native_likec4_execution_limit_invalid");
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-native-"));
  try {
    for (const directory of ["config", "cache", "data", "tmp"])
      await fs.mkdir(path.join(scratch, directory));
    const parser = path.join(scratch, "parser.mjs");
    const requestPath = path.join(scratch, "request.json");
    await fs.writeFile(parser, parserBytes, { flag: "wx", mode: 0o600 });
    const request =
      view === null
        ? { schema: "architecture.native-parser-request/v1", selected: requestSources }
        : { schema: "architecture.native-layout-request/v1", selected: requestSources, view };
    await fs.writeFile(requestPath, JSON.stringify(request), { flag: "wx", mode: 0o600 });
    const index = await runOwnedProcess({
      worker,
      nodeFlags: ["--permission", `--allow-fs-read=${sourceRoot}`, `--allow-fs-read=${parser}`],
      args: [String(timeoutMs + PROCESS_CLEANUP_MS + 1_000)],
      requestPath,
      scratch,
      timeoutMs,
      maximumBytes: replyBytes,
      failurePrefix: "native_likec4",
      terminateTree: options.terminateTree,
      decode: (raw, state, reason, closedBeforeCleanup) =>
        decodeReply(raw, state, reason, closedBeforeCleanup, sources, view),
    });
    return deepFreeze({
      ...index,
      parserSupply: { id: "likec4-parser", sha256: supply.sha256 },
    });
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}

export async function executeLikeC4Native(selected, supply, options = {}) {
  return executeLikeC4Operation(selected, supply, options, null);
}

export async function executeLikeC4Layout(selected, supply, view, options = {}) {
  if (
    !exact(view, ["namespace", "id"]) ||
    !text(view.namespace) ||
    !text(view.id) ||
    Buffer.byteLength(view.namespace, "utf8") > 2048 ||
    Buffer.byteLength(view.id, "utf8") > 2048
  )
    fail("native_likec4_reference_invalid");
  return executeLikeC4Operation(selected, supply, options, {
    namespace: view.namespace,
    id: view.id,
  });
}
