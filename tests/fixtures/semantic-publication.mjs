import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { writeSourceBundle } from "../../packages/publisher/src/source/write.mjs";
import { claimModelDigest } from "../../packages/publisher/src/semantics/document.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + "\n");

export async function fixture(t, mutateDocument = () => {}) {
  const parent = path.join(root, "build/test-work");
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, "semantic-atlas-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const source = Buffer.from("type Registry struct { ids []string }\n");
  const document = {
    schema: "architecture.claim-model/v2",
    owner: "example:control-plane",
    vocabulary: {
      entities: ["component"],
      relations: ["delegates"],
      maturities: ["implemented"],
      predicates: {
        delegates: {
          valueKind: "entity",
          cardinality: "multiple",
          values: [],
          provenance: ["registry-source"],
        },
      },
    },
    entities: {
      cli: {
        type: "component",
        label: "CLI",
        qualifiers: {},
        provenance: ["registry-source"],
      },
      registry: {
        type: "component",
        label: "Client registry",
        qualifiers: {},
        provenance: ["registry-source"],
      },
      adapter: {
        type: "component",
        label: "Client adapter",
        qualifiers: {},
        provenance: ["registry-source"],
      },
    },
    relations: {
      "cli-registry": {
        type: "delegates",
        subject: "cli",
        object: "registry",
        qualifiers: {},
        provenance: ["registry-source"],
      },
      "registry-adapter": {
        type: "delegates",
        subject: "registry",
        object: "adapter",
        qualifiers: {},
        provenance: ["registry-source"],
      },
    },
    claims: {
      "cli-registry": {
        subject: "cli",
        predicate: "delegates",
        object: "registry",
        value: null,
        plane: "implemented",
        condition: {},
        scope: {},
        maturity: "implemented",
        validity: "affirmed",
        dependsOn: [{ section: "relations", id: "cli-registry" }],
        coverage: "complete",
        provenance: ["registry-source"],
      },
      "registry-adapter": {
        subject: "registry",
        predicate: "delegates",
        object: "adapter",
        value: null,
        plane: "implemented",
        condition: {},
        scope: {},
        maturity: "implemented",
        validity: "affirmed",
        dependsOn: [{ section: "relations", id: "registry-adapter" }],
        coverage: "complete",
        provenance: ["registry-source"],
      },
    },
    sources: {
      "registry-source": {
        sha256: sha(source),
        locator: "source/internal/client/registry.go",
        authority: "selected repository source at an exact revision",
      },
    },
    context: {},
  };
  mutateDocument(document);
  const sourceBundle = await writeSourceBundle(
    path.join(directory, "source"),
    { id: document.owner, revision: "1".repeat(40) },
    [
      { path: "semantic.json", content: encode(document) },
      { path: "source/internal/client/registry.go", content: source },
    ],
  );
  const edition = {
    schema: "architecture.edition/v2",
    id: "bounded-control-plane",
    owner: document.owner,
    product: {
      name: "Architecture Publisher",
      schema: "architecture.publisher/v1",
      version: "0.2.0-alpha.0",
    },
    source: { manifestSha256: sourceBundle.manifestSha256 },
    claimModel: {
      schema: "architecture.claim-model/v2",
      digest: (() => {
        try {
          return claimModelDigest(document);
        } catch {
          return "0".repeat(64);
        }
      })(),
    },
    title: "A bounded control plane",
    audiences: {
      maintainer: { label: "Maintainers" },
    },
    questions: {
      system: {
        audience: "maintainer",
        prompt: "How does the complete control plane delegate work?",
        claims: ["cli-registry", "registry-adapter"],
        detail: "overview",
        risk: "Omission would hide a declared delegation.",
      },
      registry: {
        audience: "maintainer",
        prompt: "How does the registry delegate to the adapter?",
        claims: ["registry-adapter"],
        detail: "mechanism",
        risk: "Omission would hide the selected registry mechanism.",
      },
    },
    requiredClaims: ["cli-registry", "registry-adapter"],
    omissions: {},
    narrative: ["overview", "registry-flow"],
    visualGrammar: {
      entityTypes: { component: "backend" },
      relationTypes: {
        delegates: { label: "delegates", variant: "emphasis" },
      },
      principles: ["Complete overview", "Independent media composition", "No decorative meaning"],
    },
    scenes: {
      static: {
        label: "Complete static overview",
        questions: ["system"],
        claims: ["cli-registry", "registry-adapter"],
        composition: {
          groups: [
            {
              id: "control",
              label: "Control plane",
              entities: ["cli", "registry", "adapter"],
            },
          ],
          relations: [
            {
              id: "cli-registry",
              fromSide: "right",
              toSide: "left",
              route: "orthogonal-h",
            },
            {
              id: "registry-adapter",
              fromSide: "right",
              toSide: "left",
              route: "orthogonal-h",
            },
          ],
        },
      },
      interactive: {
        overview: {
          label: "Complete overview",
          purpose: "overview",
          questions: ["system"],
          claims: ["cli-registry", "registry-adapter"],
          composition: {
            groups: [
              {
                id: "control",
                label: "Control plane",
                entities: ["cli", "registry", "adapter"],
              },
            ],
            relations: [
              {
                id: "cli-registry",
                fromSide: "right",
                toSide: "left",
                route: "orthogonal-h",
              },
              {
                id: "registry-adapter",
                fromSide: "right",
                toSide: "left",
                route: "orthogonal-h",
              },
            ],
          },
        },
        "registry-flow": {
          label: "Registry mechanism",
          purpose: "mechanism",
          questions: ["registry"],
          claims: ["registry-adapter"],
          composition: {
            groups: [
              {
                id: "dispatch",
                label: "Ordered dispatch",
                entities: ["registry", "adapter"],
              },
            ],
            relations: [
              {
                id: "registry-adapter",
                fromSide: "right",
                toSide: "left",
                route: "orthogonal-h",
              },
            ],
          },
        },
      },
    },
    qualification: {
      semantic: ["claim-model-valid"],
      coverage: ["required-claims-visible"],
      static: ["static-geometry"],
      interactive: ["browser-behavior"],
      accessibility: ["keyboard-and-reduced-motion"],
      installed: ["offline-reproduction"],
      recovery: [],
      human: ["faithful", "intelligible", "aesthetic"].flatMap((predicate) => [
        {
          predicate,
          scope: {
            kind: "physical",
            medium: "static",
            artifact: "overview-png",
            width: 6000,
            height: 3375,
          },
        },
        ...["overview", "registry-flow"].map((artifact) => ({
          predicate,
          scope: { kind: "viewport", medium: "interactive", artifact, width: 1440, height: 1000 },
        })),
      ]),
    },
    scope: "Explicit fixture structure; no repository inference or approval",
  };
  const editionFile = path.join(directory, "edition.json");
  await fs.writeFile(editionFile, encode(edition));
  return {
    directory,
    document,
    edition,
    plan: {
      sourceManifest: sourceBundle.manifestPath,
      sourceSha256: sourceBundle.manifestSha256,
      semanticMember: "semantic.json",
      edition: editionFile,
      editionSha256: sha(await fs.readFile(editionFile)),
      output: path.join(directory, "publication"),
    },
  };
}
