import { createHash } from "node:crypto";

const digest = (value) => createHash("sha256").update(value).digest("hex");

export const A = "a".repeat(64);

const B = "b".repeat(64);

export const C = "c".repeat(64);

const D = "d".repeat(64);

function identity(id) {
  return { id, revision: `${id}:revision` };
}

export function manifest(kind = "declarative") {
  const delivery =
    kind === "declarative"
      ? {
          kind,
          sourceManifest: "source/manifest.json",
          sourceManifestSha256: A,
          semanticMember: "semantic.json",
          edition: "edition.json",
          editionSha256: B,
          evolution: null,
          evolutionSha256: null,
        }
      : {
          kind,
          package: {
            name: "@example/architecture-provider",
            version: "1.2.3",
            packageJsonSha256: A,
            contentSha256: B,
            entrypoint: "./provider",
          },
          inputs: [
            {
              id: "repository-facts",
              path: "inputs/repository.json",
              mediaType: "application/json",
              bytes: 3,
              sha256: digest("{}\n"),
            },
          ],
        };
  return {
    schema: "architecture.edition-provider/v1",
    provider: identity("example-provider"),
    subject: identity("example-product"),
    contracts: {
      sourceBundle: "architecture.source-bundle/v1",
      claimModel: "architecture.claim-model/v2",
      edition: "architecture.edition/v2",
      evolution: null,
    },
    delivery,
    expected: {
      sourceManifestSha256: A,
      claimModelDigest: C,
      editionDigest: D,
      evolutionSha256: null,
    },
    limits: {
      inputs: 16,
      inputBytes: 1024 * 1024,
      replyBytes: 2 * 1024 * 1024,
      timeoutMs: 10_000,
    },
  };
}

export function requestFixture() {
  const content = Buffer.from("{}\n");
  return {
    schema: "architecture.edition-provider-request/v1",
    provider: identity("example-provider"),
    subject: identity("example-product"),
    inputs: [
      {
        id: "repository-facts",
        mediaType: "application/json",
        bytes: content.length,
        sha256: digest(content),
        contentBase64: content.toString("base64"),
      },
    ],
  };
}

export function replyFixture() {
  return {
    schema: "architecture.edition-provider-reply/v1",
    source: {
      id: "example-product",
      revision: "example-product:revision",
      members: [
        {
          path: "semantic.json",
          contentBase64: Buffer.from("{}\n").toString("base64"),
        },
      ],
    },
    semanticMember: "semantic.json",
    edition: { contentBase64: Buffer.from("{}\n").toString("base64") },
    evolution: null,
  };
}

export function receiptFixture() {
  return {
    schema: "architecture.edition-provider-materialization/v1",
    provider: identity("example-provider"),
    subject: identity("example-product"),
    delivery: "declarative",
    inputs: [{ id: "provider-manifest", bytes: 1024, sha256: A }],
    materialized: {
      sourceManifestSha256: A,
      claimModelDigest: C,
      editionDigest: D,
      evolutionSha256: null,
    },
    producer: { name: "architecture-publisher", version: "0.3.0-alpha.1" },
    execution: { kind: "declarative", durationMs: 0, deterministic: true },
  };
}
