import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { VISUAL_REVIEW_PREDICATES } from "../../packages/publisher/src/edition/contract.mjs";
import { editionProviderPackageDigest } from "../../packages/publisher/src/provider/index.mjs";
import { canonical } from "../../packages/publisher/src/semantics/document.mjs";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function selectedFixtureRequirements(candidate, checkerId = "fixture-checker") {
  return Object.entries(candidate.media).flatMap(([medium, { artifacts }]) => [
    ...candidate.obligations[medium].views.flatMap((view) =>
      view.questionIds.map((question) => ({
        predicate: "visible-question",
        scope: { kind: "question", medium, view: view.id, question },
        verifier: {
          kind: "machine",
          id: checkerId,
          implementationSha256: sha(Buffer.from(checkerId)),
        },
        method: "carrier-inspection/v1",
        allowedLimitations: [],
      })),
    ),
    ...artifacts
      .filter(({ mediaType }) => ["image/png", "text/html"].includes(mediaType))
      .flatMap((artifact) =>
        VISUAL_REVIEW_PREDICATES.map((predicate) => ({
          predicate,
          scope: {
            kind: artifact.mediaType === "image/png" ? "physical" : "viewport",
            medium,
            artifact: artifact.id,
            width: medium === "static" ? 1800 : 1440,
            height: 1000,
          },
          verifier: {
            kind: "human",
            id: "fixture-editor",
            implementationSha256: sha(Buffer.from("visual-review-rubric/v1")),
          },
          method: "visual-inspection/v1",
          allowedLimitations: [],
        })),
      ),
  ]);
}

/** Synthetic submissions exercise policy matching, not artwork acceptance. */
export function submittedFixtureRecords(candidate, requirements) {
  return requirements.map((requirement, index) => {
    const medium = candidate.media[requirement.scope.medium];
    const artifact = medium.artifacts.find(({ id }) => id === requirement.scope.artifact);
    return {
      id: `submitted-${index}`,
      predicate: requirement.predicate,
      subject: artifact
        ? { kind: "artifact", sha256: artifact.sha256 }
        : { kind: "medium", sha256: sha(Buffer.from(canonical(medium))) },
      scope: requirement.scope,
      verifier: requirement.verifier,
      method: requirement.method,
      observations: [{ name: "synthetic-fixture", value: true }],
      verdict: "PASS",
      limitations: [],
    };
  });
}

export async function selectedNativeEdition(t, options = {}) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-selected-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "sources"));
  await fs.mkdir(path.join(root, "edition"));
  const model = Buffer.from(
    "specification { element component }\nmodel { alpha = component 'Alpha'\n beta = component 'Beta'\n alpha -> beta }\n",
  );
  const views = Buffer.from("views { view overview { include * } }\n");
  const namespaces = ["fixture/model", "fixture/views"];
  const project = {
    schema: "architecture.edition-project/v1",
    id: "selected-atlas",
    editor: "fixture-editor",
    title: options.title ?? "Selected architecture",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "shape", audience: "maintainer", text: "What is connected?" }],
    scope: {
      sourceNamespaces: namespaces,
      selections: [
        {
          id: "overview",
          namespace: namespaces[1],
          kind: "reference",
          reference: "view:overview",
          questions: ["shape"],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: "One selected structural view." },
    presentation: {
      static: {
        views: [{ id: "overview", questions: ["shape"] }],
        intent: "Show the selected source structure.",
        width: options.width ?? 6000,
      },
      interactive: {
        views: [{ id: "overview", questions: ["shape"] }],
        intent: "Explore the selected source structure.",
      },
    },
    visualPolicy: { profile: "neutral", figureTypes: { component: "lucide:box" } },
  };
  const request = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: [
      { id: "model", namespace: namespaces[0], path: "sources/model.c4", bytes: model },
      { id: "views", namespace: namespaces[1], path: "sources/views.c4", bytes: views },
    ].map(({ id, namespace, path: locator, bytes }) => ({
      id,
      namespace,
      format: { id: "likec4/dsl", version: "unversioned" },
      claimant: "fixture-maintainer",
      revision: { kind: "content", algorithm: "sha256" },
      input: { kind: "pin", path: locator, sha256: sha(bytes) },
    })),
    providers: [],
    media: options.media ?? ["static", "interactive"],
    toolchain: { profile: options.profile ?? "portable" },
  };
  await fs.writeFile(path.join(root, "sources/model.c4"), model);
  await fs.writeFile(path.join(root, "sources/views.c4"), views);
  await fs.writeFile(path.join(root, "edition/project.json"), JSON.stringify(project) + "\n");
  const file = path.join(root, "build-request.json");
  const bytes = Buffer.from(JSON.stringify(request) + "\n");
  await fs.writeFile(file, bytes);
  return { root, file, digest: sha(bytes), request, project, model, views };
}

export async function moveModelToProvider(
  fixture,
  content = fixture.model,
  delivery = "declarative",
) {
  const model = fixture.request.sources.find(({ id }) => id === "model");
  if (!model) throw new Error("fixture_model_missing");
  const directory = path.join(fixture.root, "provider");
  await fs.mkdir(directory);
  await fs.writeFile(path.join(directory, "model.c4"), content);
  const manifest = {
    schema: "architecture.edition-provider/v2",
    provider: { id: "model-provider", revision: "1" },
    selected: {
      native: [
        {
          id: "model",
          namespace: model.namespace,
          claimant: model.claimant,
          format: model.format,
          revision: model.revision,
          bytes: content.length,
          sha256: sha(content),
        },
      ],
      derived: [],
      edition: null,
    },
    delivery:
      delivery === "declarative"
        ? { kind: delivery, files: [{ kind: "native", id: "model", path: "model.c4" }] }
        : {
            kind: delivery,
            package: {
              name: "@fixture/model-provider",
              version: "1.0.0",
              packageJsonSha256: sha("package-json"),
              contentSha256: sha("package"),
              entrypoint: "./provider",
            },
            inputs: [
              {
                id: "model-input",
                path: "model.c4",
                mediaType: "text/plain",
                bytes: content.length,
                sha256: sha(content),
              },
            ],
            nativeInputs: [{ item: "model", input: "model-input" }],
            editionInput: null,
            editionResourceInputs: [],
          },
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest) + "\n");
  await fs.writeFile(path.join(directory, "provider.json"), manifestBytes);
  fixture.request.sources = fixture.request.sources.filter(({ id }) => id !== "model");
  fixture.request.providers = [
    {
      id: "model-provider",
      manifest: "provider/provider.json",
      sha256: sha(manifestBytes),
      ...(delivery === "executable" ? { packageRoot: "provider/package" } : {}),
    },
  ];
  const requestBytes = Buffer.from(JSON.stringify(fixture.request) + "\n");
  await fs.writeFile(fixture.file, requestBytes);
  fixture.digest = sha(requestBytes);
}

export async function executableModelProvider(fixture) {
  await moveModelToProvider(fixture, fixture.model, "executable");
  const packageRoot = path.join(fixture.root, "provider/package");
  const executionMarker = path.join(fixture.root, "provider-executed");
  await fs.mkdir(packageRoot);
  const packageJson = Buffer.from(
    JSON.stringify({
      name: "@fixture/model-provider",
      version: "1.0.0",
      type: "module",
      exports: { "./provider": "./provider.mjs" },
    }) + "\n",
  );
  await fs.writeFile(path.join(packageRoot, "package.json"), packageJson);
  await fs.writeFile(
    path.join(packageRoot, "provider.mjs"),
    `import fs from 'node:fs/promises';\nexport async function materializeEditionProvider() { await fs.writeFile(${JSON.stringify(executionMarker)}, String(process.ppid)); return { schema: 'architecture.edition-provider-reply/v2', derived: [] }; }\n`,
  );
  const manifestPath = path.join(fixture.root, "provider/provider.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest.delivery.package.packageJsonSha256 = sha(packageJson);
  manifest.delivery.package.contentSha256 = await editionProviderPackageDigest(packageRoot);
  const manifestBytes = Buffer.from(JSON.stringify(manifest) + "\n");
  await fs.writeFile(manifestPath, manifestBytes);
  const manifestSha256 = sha(manifestBytes);
  fixture.request.providers[0].sha256 = manifestSha256;
  const requestBytes = Buffer.from(JSON.stringify(fixture.request) + "\n");
  await fs.writeFile(fixture.file, requestBytes);
  fixture.digest = sha(requestBytes);
  return { executionMarker, manifestSha256 };
}
