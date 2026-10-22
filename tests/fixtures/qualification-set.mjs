import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  admitQualificationSet,
  bindQualificationRecord,
  bindQualificationSet,
  qualificationSubject,
} from "../../packages/publisher/src/qualification/index.mjs";
import {
  createEditionCandidate,
  editionCandidateDigest,
} from "../../packages/publisher/src/compiler/candidate.mjs";
import {
  interactiveSceneDigest,
  staticSceneDigest,
} from "../../packages/publisher/src/edition/contract.mjs";
import { editionFixture } from "./edition.mjs";

export const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const exactDigest = (value) => digest(Buffer.from(value));

export const root = path.resolve(import.meta.dirname, "../..");

export const cli = path.join(root, "packages/publisher/src/cli/main.mjs");

export function authority() {
  const { model, edition } = editionFixture();
  return { model, edition };
}

export function candidate(selected = authority()) {
  return createEditionCandidate({
    sourceManifestSha256: selected.edition.source.manifestSha256,
    claimModelSha256: exactDigest("claim-model-bytes"),
    claimModel: selected.model,
    editionSha256: exactDigest("edition"),
    edition: selected.edition,
    media: {
      static: {
        sceneSha256: staticSceneDigest(selected.model, selected.edition),
        artifacts: [
          {
            id: "overview-png",
            mediaType: "image/png",
            bytes: 1,
            path: "static/architecture-publisher-6000.png",
            sha256: exactDigest("png"),
          },
        ],
        supplies: [{ id: "raster", sha256: exactDigest("raster") }],
      },
      interactive: {
        sceneSha256: interactiveSceneDigest(selected.model, selected.edition),
        artifacts: [
          {
            id: "atlas",
            mediaType: "text/html",
            bytes: 1,
            path: "interactive/architecture-publisher.html",
            sha256: exactDigest("html"),
          },
        ],
        supplies: [{ id: "archify", sha256: exactDigest("archify") }],
      },
    },
  });
}

export function admit(candidateValue, qualificationValue, selected = authority()) {
  return admitQualificationSet(
    selected.model,
    selected.edition,
    candidateValue,
    qualificationValue,
  );
}

export function recordsFor(selectedCandidate) {
  return selectedCandidate.obligations.map(({ kind, predicate, scope }, index) =>
    bindQualificationRecord(selectedCandidate, {
      id: `${kind}.${index}`,
      kind,
      verifier: {
        kind: kind === "human" ? "human" : "machine",
        id: kind === "human" ? "reviewer:human" : `verifier:${kind}`,
        implementationSha256: exactDigest(`verifier:${kind}`),
      },
      predicate,
      scope: kind === "human" ? structuredClone(scope) : { kind: "fixture", value: predicate },
      environment: null,
      observations: [{ name: "result", value: "verified" }],
      verdict: "PASS",
      limitations: [],
    }),
  );
}

export async function qualificationInputFixture(directory) {
  const selected = authority(),
    claimModelBytes = Buffer.from(JSON.stringify(selected.model, null, 2) + "\n"),
    editionBytes = Buffer.from(JSON.stringify(selected.edition, null, 2) + "\n"),
    selectedCandidate = createEditionCandidate({
      sourceManifestSha256: selected.edition.source.manifestSha256,
      claimModelSha256: digest(claimModelBytes),
      claimModel: selected.model,
      editionSha256: digest(editionBytes),
      edition: selected.edition,
      media: {
        static: {
          sceneSha256: staticSceneDigest(selected.model, selected.edition),
          artifacts: [
            {
              id: "overview-png",
              mediaType: "image/png",
              bytes: 1,
              path: "static/architecture-publisher-6000.png",
              sha256: exactDigest("png"),
            },
          ],
          supplies: [{ id: "raster", sha256: exactDigest("raster") }],
        },
        interactive: {
          sceneSha256: interactiveSceneDigest(selected.model, selected.edition),
          artifacts: [
            {
              id: "atlas",
              mediaType: "text/html",
              bytes: 1,
              path: "interactive/architecture-publisher.html",
              sha256: exactDigest("html"),
            },
          ],
          supplies: [{ id: "archify", sha256: exactDigest("archify") }],
        },
      },
    }),
    qualification = bindQualificationSet(selectedCandidate, recordsFor(selectedCandidate)),
    candidateBytes = Buffer.from(JSON.stringify(selectedCandidate, null, 2) + "\n"),
    qualificationBytes = Buffer.from(JSON.stringify(qualification, null, 2) + "\n"),
    files = {
      "claim-model.json": claimModelBytes,
      "edition.json": editionBytes,
      "candidate.json": candidateBytes,
      "qualification.json": qualificationBytes,
    };
  await Promise.all(
    Object.entries(files).map(([name, bytes]) => fs.writeFile(path.join(directory, name), bytes)),
  );
  const request = {
      schema: "architecture.qualification-input/v1",
      claimModel: {
        path: "claim-model.json",
        sha256: digest(claimModelBytes),
      },
      edition: {
        path: "edition.json",
        sha256: digest(editionBytes),
      },
      candidate: {
        path: "candidate.json",
        sha256: digest(candidateBytes),
      },
      qualification: {
        path: "qualification.json",
        sha256: digest(qualificationBytes),
      },
    },
    requestBytes = Buffer.from(JSON.stringify(request, null, 2) + "\n"),
    requestPath = path.join(directory, "request.json");
  await fs.writeFile(requestPath, requestBytes);
  return {
    requestPath,
    requestSha256: digest(requestBytes),
    qualificationPath: path.join(directory, "qualification.json"),
    qualificationSha256: digest(qualificationBytes),
    recordCount: qualification.records.length,
  };
}

export function record(overrides = {}, selectedCandidate = candidate()) {
  const kind = overrides.kind ?? "semantic",
    scope =
      overrides.scope ??
      (kind === "human"
        ? {
            kind: "viewport",
            medium: "interactive",
            artifact: "atlas",
            width: 1440,
            height: 1000,
          }
        : { kind: "document", value: "candidate.json" });
  return {
    id: "semantic.integrity",
    kind,
    subject: qualificationSubject(selectedCandidate, kind, scope),
    editionDigest: selectedCandidate.edition.digest,
    sourceManifestSha256: selectedCandidate.source.manifestSha256,
    claimModelDigest: selectedCandidate.claimModel.digest,
    verifier: {
      kind: kind === "human" ? "human" : "machine",
      id: kind === "human" ? "reviewer:human" : "architecture-publisher.semantic-verifier",
      implementationSha256: exactDigest("verifier"),
    },
    predicate: "semantic-integrity",
    scope,
    environment: null,
    observations: [{ name: "claim-model", value: "valid" }],
    verdict: "PASS",
    limitations: [],
    ...overrides,
  };
}

export function set(records, selectedCandidate = candidate()) {
  const selectedRecords = records ?? [record({}, selectedCandidate)];
  return {
    schema: "architecture.qualification-set/v1",
    candidateSha256: editionCandidateDigest(selectedCandidate),
    editionDigest: selectedCandidate.edition.digest,
    sourceManifestSha256: selectedCandidate.source.manifestSha256,
    claimModelDigest: selectedCandidate.claimModel.digest,
    records: selectedRecords,
  };
}
