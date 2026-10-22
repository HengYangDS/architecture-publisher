import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { noSymlinkAncestors, regularBytes } from "../file-input/read.mjs";
import { parseStrictJson } from "../protocol/json.mjs";
import { fail, isDigest } from "../protocol/values.mjs";
import { LIMITS, portableKey, portablePath } from "../file-input/contract.mjs";
import { readSelectedInput } from "../source/materialize.mjs";
import {
  EDITION_AUTHORING_FILE_BYTES,
  validateBuildRequest,
  validateEditionProject,
} from "./authoring.mjs";
import { deriveSourceRevision } from "./revision.mjs";
import { selectedEditionResources } from "./resources.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function selectedRootPaths(request, requestFile, resources) {
  const requestName = path.basename(requestFile);
  try {
    portablePath(requestName);
  } catch {
    fail("materialized_request_path_invalid");
  }
  const selected = [requestName, ...request.providers.map(({ manifest }) => manifest)];
  if (request.edition.kind === "direct") {
    selected.push(path.posix.join(request.edition.root, request.edition.manifest));
    for (const { ref } of resources) selected.push(path.posix.join(request.edition.root, ref));
  }
  for (const source of request.sources) {
    selected.push(
      source.revision.kind === "vcs" && source.input.kind === "locator"
        ? path.posix.join(source.revision.repository, source.input.path)
        : source.input.path,
    );
  }
  const aliases = new Map();
  for (const selectedPath of selected) {
    const key = portableKey(selectedPath);
    if (aliases.has(key) && aliases.get(key) !== selectedPath) fail("materialized_path_alias");
    aliases.set(key, selectedPath);
  }
}

/** Read one exact Build Request without granting it authority over selected facts. */
export async function readBuildRequestSelection(requestPath, expectedSha256) {
  if (typeof requestPath !== "string" || !requestPath) fail("materialized_request_path_required");
  if (!isDigest(expectedSha256)) fail("materialized_request_digest_required");
  const file = path.resolve(requestPath);
  await noSymlinkAncestors(file);
  const root = await fs.realpath(path.dirname(file));
  const requestBytes = await regularBytes(file, LIMITS.manifestBytes);
  if (sha(requestBytes) !== expectedSha256) fail("materialized_request_digest_mismatch");
  const request = validateBuildRequest(
    parseStrictJson(
      requestBytes,
      "materialized_request_json_invalid",
      "materialized_request_json_duplicate_key",
    ),
  );
  return { file, root, request };
}

/** Read only directly selected authoring bytes; the Edition join is separate. */
export async function readDirectSelectedInputs({ file, root, request }) {
  /** @type {{ content: Buffer, resources: { ref: string, content: Buffer }[], expected: null } | null} */
  let edition = null;
  /** @type {{ ref: string, sha256: string | null }[]} */
  let resources = [];
  const observations = [];
  if (request.edition.kind === "direct") {
    const editionPath = path.resolve(
      root,
      ...request.edition.root.split("/"),
      ...request.edition.manifest.split("/"),
    );
    await noSymlinkAncestors(editionPath);
    const content = await regularBytes(editionPath, EDITION_AUTHORING_FILE_BYTES);
    const project = validateEditionProject(
      parseStrictJson(
        content,
        "materialized_edition_json_invalid",
        "materialized_edition_json_duplicate_key",
      ),
    );
    resources = selectedEditionResources(project);
    edition = { content, resources: [], expected: null };
    observations.push({ kind: "edition", key: project.id, method: "filesystem-read-sha256/v1" });
  }
  selectedRootPaths(request, file, resources);
  if (request.edition.kind === "direct" && edition !== null) {
    for (const { ref, sha256 } of resources) {
      const selected = path.resolve(root, ...request.edition.root.split("/"), ...ref.split("/"));
      await noSymlinkAncestors(selected);
      const content = await regularBytes(selected, EDITION_AUTHORING_FILE_BYTES);
      if (sha256 !== null && sha(content) !== sha256)
        fail("materialized_edition_resource_digest_mismatch");
      edition.resources.push({ ref, content });
      observations.push({
        kind: "edition-resource",
        key: ref,
        method: "filesystem-read-sha256/v1",
      });
    }
  }

  const sources = [];
  const limits = [
    "native-dependency-closure-unchecked",
    "edition-dependency-closure-unchecked",
    "rendering-supplies-unchecked",
    "path-confinement-under-concurrent-mutation-unproved",
  ];
  let totalBytes =
    (edition?.content.length ?? 0) +
    (edition?.resources.reduce((total, resource) => total + resource.content.length, 0) ?? 0);
  if (totalBytes > LIMITS.totalBytes) fail("bundle_size_exceeded");
  for (const source of request.sources) {
    const selected = await readSelectedInput(root, {
      ...source.input,
      ...(source.revision.kind === "vcs" ? { vcs: source.revision } : {}),
    });
    totalBytes += selected.content.length;
    if (totalBytes > LIMITS.totalBytes) fail("bundle_size_exceeded");
    if (source.revision.kind === "vcs" && selected.vcsObject === null)
      limits.push(`vcs-provenance-unverified:${source.namespace}`);
    observations.push({
      kind: "native",
      key: source.namespace,
      method: selected.vcsObject === null ? "filesystem-read-sha256/v1" : "git-selected-blob/v1",
    });
    sources.push({
      id: source.id,
      namespace: source.namespace,
      format: source.format,
      claimant: source.claimant,
      revisionEvidence: deriveSourceRevision(
        source.revision,
        selected.content,
        selected.vcsObject,
        selected.vcsBlob,
      ),
      content: selected.content,
    });
  }
  return { edition, sources, observations, limits };
}
