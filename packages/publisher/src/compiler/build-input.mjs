import path from "node:path";
import { readBuildRequestSelection, readDirectSelectedInputs } from "../edition/materialize.mjs";
import { deriveSourceRevision } from "../edition/revision.mjs";
import { assembleEditionSelection } from "../edition/selection.mjs";
import { exact } from "../semantics/document.mjs";
import { fail, isDigest } from "../protocol/values.mjs";
import { materializeSelectedDeclarativeFiles } from "../provider/declarative-selection.mjs";
import {
  materializePreparedExecutableInputs,
  prepareSelectedExecutableInputs,
} from "../provider/executable-selection.mjs";
import { readSelectedProviderManifest } from "../provider/manifest.mjs";

function selectedExecutionChoice(choice) {
  if (choice === undefined) return new Map();
  if (!Array.isArray(choice)) fail("materialized_provider_execution_choice_invalid");
  const selected = new Map();
  for (const item of choice) {
    if (
      !exact(item, ["id", "manifestSha256"]) ||
      typeof item.id !== "string" ||
      !item.id ||
      !isDigest(item.manifestSha256)
    )
      fail("materialized_provider_execution_choice_invalid");
    if (selected.has(item.id)) fail("materialized_provider_execution_choice_invalid");
    selected.set(item.id, item.manifestSha256);
  }
  return selected;
}

/** Pin every selected input before an executable Provider may run. */
export async function prepareBuildRequestInput(requestPath, expectedSha256, executionChoice) {
  const offered = selectedExecutionChoice(executionChoice);
  const { file, root, request } = await readBuildRequestSelection(requestPath, expectedSha256);
  const direct = await readDirectSelectedInputs({ file, root, request });
  const providers = [];
  for (const selection of request.providers) {
    const manifestPath = path.resolve(root, ...selection.manifest.split("/"));
    let selectedManifest;
    try {
      selectedManifest = await readSelectedProviderManifest(manifestPath, selection.sha256);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "edition_provider_v2_invalid"
      ) {
        Object.assign(error, {
          diagnostics: [
            {
              code: "edition_provider_v2_invalid",
              severity: "error",
              message: "Selected Provider manifest violates the v2 contract.",
              predicate: "provider-manifest-schema",
              subject: {
                kind: "provider-manifest",
                selectionId: selection.id,
                sha256: selection.sha256,
              },
              responsibility: { role: "provider-author", declaredOwner: null },
              evidence: {},
              supportedFixes: [],
            },
          ],
        });
      }
      throw error;
    }
    providers.push({ selection, selectedManifest });
  }
  const executable = providers.filter(
    ({ selectedManifest }) => selectedManifest.manifest.delivery.kind === "executable",
  );
  const required = new Map(executable.map(({ selection }) => [selection.id, selection.sha256]));
  if (
    required.size !== executable.length ||
    offered.size !== required.size ||
    [...offered].some(([id, digest]) => required.get(id) !== digest)
  )
    fail("materialized_provider_execution_choice_mismatch");

  const prepared = [];
  for (const { selection, selectedManifest } of providers) {
    let provider;
    if (selectedManifest.manifest.delivery.kind === "declarative") {
      if (Object.hasOwn(selection, "packageRoot"))
        fail("materialized_provider_package_root_invalid");
      provider = await materializeSelectedDeclarativeFiles(selectedManifest, selection.sha256);
    } else {
      if (!Object.hasOwn(selection, "packageRoot"))
        fail("materialized_provider_package_root_required");
      const packageRoot = path.resolve(root, ...selection.packageRoot.split("/"));
      provider = await prepareSelectedExecutableInputs(
        selectedManifest,
        selection.sha256,
        packageRoot,
      );
    }
    prepared.push({ selection, selectedManifest, provider });
  }
  return { request, direct, providers: prepared };
}

/** Materialize one Build Request across direct, declarative, and executable inputs. */
export async function materializeBuildRequestInput(requestPath, expectedSha256, executionChoice) {
  return materializePreparedBuildRequestInput(
    await prepareBuildRequestInput(requestPath, expectedSha256, executionChoice),
  );
}

/** Reuse prepared inputs; no new source selection is admitted here. */
export async function materializePreparedBuildRequestInput({ request, direct, providers }) {
  /** @type {{content: Buffer, resources: {ref: string, content: Buffer}[], expected: {id: string, editor: string} | null} | null} */
  let edition = direct.edition;
  const sources = [...direct.sources];
  const derived = [];
  const observations = [...direct.observations];
  const limits = [...direct.limits];
  const invocations = [];

  for (const { selection, selectedManifest, provider: prepared } of providers) {
    const provider =
      selectedManifest.manifest.delivery.kind === "declarative"
        ? prepared
        : await materializePreparedExecutableInputs(prepared);
    const selected = provider.selected;
    const invocation = provider.invocation;
    const inputMethod =
      invocation.delivery === "executable"
        ? "provider-input-sha256/v2"
        : "filesystem-read-sha256/v1";
    const derivedMethod =
      invocation.delivery === "executable"
        ? "provider-reply-sha256/v2"
        : "filesystem-read-sha256/v1";
    if (selected.edition !== null) {
      if (
        edition !== null ||
        request.edition.kind !== "provider" ||
        request.edition.provider !== selection.id
      )
        fail("materialized_edition_ambiguous");
      edition = {
        content: provider.read("edition", selected.edition.id),
        resources: selected.edition.resources.map(({ ref }) => ({
          ref,
          content: provider.read("edition-resource", ref),
        })),
        expected: { id: selected.edition.id, editor: selected.edition.editor },
      };
      observations.push({
        kind: "edition",
        key: selected.edition.id,
        method: inputMethod,
      });
      for (const { ref } of selected.edition.resources)
        observations.push({ kind: "edition-resource", key: ref, method: inputMethod });
    }
    for (const item of selected.native) {
      const content = provider.read("native", item.id);
      sources.push({
        namespace: item.namespace,
        format: item.format,
        claimant: item.claimant,
        revisionEvidence: deriveSourceRevision(item.revision, content, null, null),
        content,
      });
      if (item.revision.kind === "vcs") limits.push(`vcs-provenance-unverified:${item.namespace}`);
      observations.push({
        kind: "native",
        key: item.namespace,
        method: inputMethod,
      });
    }
    for (const item of selected.derived) {
      derived.push({
        namespace: item.namespace,
        claimant: item.claimant,
        format: item.format,
        derivedFrom: item.derivedFrom.map(({ namespace, sha256 }) => ({ namespace, sha256 })),
        adapter: item.adapter,
        method: item.method,
        content: provider.read("derived", item.id),
      });
      observations.push({
        kind: "derived",
        key: `${selection.id}/${item.id}`,
        method: derivedMethod,
      });
    }
    for (const limit of provider.limits)
      limits.push(
        limit.startsWith("adapter-code-unverified:")
          ? `adapter-code-unverified:${selection.id}/${limit.slice("adapter-code-unverified:".length)}`
          : limit,
      );
    invocations.push({
      selection: selection.id,
      manifest: selection.manifest,
      ...invocation,
    });
  }
  if (request.edition.kind === "provider" && edition === null)
    fail("materialized_provider_edition_missing");
  return assembleEditionSelection({
    request,
    edition,
    sources,
    derived,
    limits,
    observations,
    invocations,
  });
}
