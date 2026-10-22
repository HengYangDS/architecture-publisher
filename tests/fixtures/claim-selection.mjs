import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from "../../packages/publisher/src/compiler/index.mjs";
import { materializeBuildRequestInput } from "../../packages/publisher/src/compiler/build-input.mjs";
import { claimModel } from "./claim-model.mjs";
import { loadFigureIconSupply } from "../../packages/publisher/renderers/icons/index.mjs";

export const figureIcons = await loadFigureIconSupply();
export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const modelFormat = { id: "architecture.claim-model", version: "2" };
export const modelNamespace = "fixture/claims";
export const rawNamespace = "fixture/raw";
export async function fixture(
  t,
  { delivery = "native", model = claimModel(), reference = "claim:intended" } = {},
) {
  const root = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-claim-selection-"),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "edition"));
  await fs.mkdir(path.join(root, "sources"));
  const modelBytes = Buffer.from(JSON.stringify(model) + "\n");
  const raw = Buffer.from("attributed native input\n");
  const project = {
    schema: "architecture.edition-project/v1",
    id: "claim-atlas",
    editor: "fixture-editor",
    title: "Typed claims",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "condition", audience: "maintainer", text: "When may the client call?" }],
    scope: {
      sourceNamespaces: [delivery === "native" ? modelNamespace : rawNamespace],
      ...(delivery === "derived" ? { projectionNamespaces: [modelNamespace] } : {}),
      selections: [
        {
          id: "selected-claim",
          namespace: modelNamespace,
          kind: "reference",
          reference,
          questions: ["condition"],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: {
      summary: "Keep the authorization condition visible.",
    },
    presentation: {
      static: { views: [{ id: "overview", questions: ["condition"] }], intent: "One overview." },
      interactive: {
        views: [{ id: "overview", questions: ["condition"] }],
        intent: "One explorable view.",
      },
    },
    visualPolicy: { profile: "neutral", figureTypes: { component: "lucide:box" } },
  };
  await fs.writeFile(path.join(root, "edition/project.json"), JSON.stringify(project) + "\n");
  const request = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: [],
    providers: [],
    media: ["static", "interactive"],
    toolchain: { profile: "portable" },
  };
  if (delivery === "native") {
    await fs.writeFile(path.join(root, "sources/model.json"), modelBytes);
    request.sources.push({
      id: "model",
      namespace: modelNamespace,
      format: modelFormat,
      claimant: "fixture-maintainer",
      revision: { kind: "content", algorithm: "sha256" },
      input: { kind: "pin", path: "sources/model.json", sha256: sha(modelBytes) },
    });
  } else {
    await fs.mkdir(path.join(root, "provider"));
    await fs.writeFile(path.join(root, "provider/raw.src"), raw);
    await fs.writeFile(path.join(root, "provider/model.json"), modelBytes);
    const manifest = {
      schema: "architecture.edition-provider/v2",
      provider: { id: "claim-provider", revision: "1" },
      selected: {
        native: [
          {
            id: "raw",
            namespace: rawNamespace,
            claimant: "fixture-maintainer",
            format: { id: "example/opaque-source", version: "1" },
            revision: { kind: "content", algorithm: "sha256" },
            bytes: raw.length,
            sha256: sha(raw),
          },
        ],
        derived: [
          {
            id: "model",
            namespace: modelNamespace,
            claimant: "adapter-maintainer",
            format: modelFormat,
            derivedFrom: ["raw"],
            adapter: { id: "claim-adapter", version: "1", contentSha256: sha("adapter") },
            method: "project/v1",
            bytes: modelBytes.length,
            sha256: sha(modelBytes),
          },
        ],
        edition: null,
      },
      delivery: {
        kind: "declarative",
        files: [
          { kind: "native", id: "raw", path: "raw.src" },
          { kind: "derived", id: "model", path: "model.json" },
        ],
      },
    };
    const manifestBytes = Buffer.from(JSON.stringify(manifest) + "\n");
    await fs.writeFile(path.join(root, "provider/provider.json"), manifestBytes);
    request.providers.push({
      id: "claim-selection",
      manifest: "provider/provider.json",
      sha256: sha(manifestBytes),
    });
  }
  const requestBytes = Buffer.from(JSON.stringify(request) + "\n");
  const requestPath = path.join(root, "build-request.json");
  await fs.writeFile(requestPath, requestBytes);
  return { root, requestPath, requestSha256: sha(requestBytes), project, model };
}
export async function groupedMixedFixture(
  t,
  { model = claimModel(), media = ["static", "interactive"] } = {},
) {
  const selected = await fixture(t, { model, reference: "relation:request" });
  selected.project.scope.selections[0].id = "selected-relation";
  selected.project.scope.selections.push({
    id: "selected-claim",
    namespace: modelNamespace,
    kind: "reference",
    reference: "claim:intended",
    questions: ["condition"],
  });
  selected.project.presentation.static.views[0].groups = [
    {
      id: "client-group",
      label: "Client",
      elements: [{ namespace: modelNamespace, id: "client" }],
    },
    {
      id: "server-group",
      label: "Server",
      elements: [{ namespace: modelNamespace, id: "server" }],
    },
  ];
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const request = JSON.parse(await fs.readFile(selected.requestPath, "utf8"));
  request.media = media;
  const requestBytes = Buffer.from(JSON.stringify(request) + "\n");
  await fs.writeFile(selected.requestPath, requestBytes);
  return { ...selected, requestSha256: sha(requestBytes) };
}
export async function assertAuthoredFormCannotDisappear(selected, medium) {
  const view = selected.project.presentation[medium].views[0];
  assert.equal(view.groups.length, 2);
  view.form = {
    schema: "architecture.visual-form/v1",
    kind: "responsibility",
    roles: view.groups.map(({ id }) => ({ group: id, basis: "selected-claim" })),
    handoffs: [
      {
        from: view.groups[0].id,
        to: view.groups[1].id,
        basis: "selected-claim",
      },
    ],
  };
  const projectPath = path.join(selected.root, "edition/project.json");
  await fs.writeFile(projectPath, JSON.stringify(selected.project) + "\n");
  const output = path.join(selected.root, `form-authored-${medium}`);
  try {
    await assert.rejects(
      compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output),
      { code: "edition_visual_form_renderer_unavailable" },
    );
    await assert.rejects(fs.access(output), { code: "ENOENT" });
  } finally {
    delete view.form;
    await fs.writeFile(projectPath, JSON.stringify(selected.project) + "\n");
  }
}
export function twoRelationClaimModel() {
  const model = claimModel();
  model.relations.second = {
    type: "calls",
    subject: "server",
    object: "other",
    qualifiers: {},
    provenance: ["contract"],
  };
  model.claims.aaa = {
    ...structuredClone(model.claims.intended),
    subject: "server",
    object: "other",
    dependsOn: [{ section: "relations", id: "second" }],
  };
  return model;
}
export async function evolutionSide(selected) {
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  return { lock: input.lock, meaning: await compileEditionMeaning(input) };
}
export async function disagreementFixture(t) {
  const model = claimModel();
  model.claims.implemented.validity = "refuted";
  const selected = await fixture(t, { model });
  selected.project.questions[0].text = "How do intended and implemented calls differ?";
  selected.project.scope.selections.push({
    id: "implemented-claim",
    namespace: modelNamespace,
    kind: "reference",
    reference: "claim:implemented",
    questions: ["condition"],
  });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  return selected;
}
