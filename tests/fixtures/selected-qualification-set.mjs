import { createHash } from "node:crypto";
import path from "node:path";
import { compileEditionCandidateInput } from "../../packages/publisher/src/compiler/index.mjs";
import * as qualification from "../../packages/publisher/src/qualification/index.mjs";
import { canonical } from "../../packages/publisher/src/semantics/document.mjs";
import { readSourceBundle } from "../../packages/publisher/src/source/bundle.mjs";
import { selectedNativeEdition, sha } from "./selected-native-edition.mjs";

export async function selectedCandidate(t, options = {}) {
  const fixture = await selectedNativeEdition(t, { width: 1800, ...options });
  const built = await compileEditionCandidateInput(
    fixture.file,
    fixture.digest,
    path.join(fixture.root, "candidate"),
  );
  const bundle = await readSourceBundle(built.manifestPath, built.manifestSha256);
  const candidate = JSON.parse(
    bundle.members.find(({ path: member }) => member === "candidate.json").content,
  );
  const replay = await qualification.verifySelectedCandidateReplay({
    requestPath: fixture.file,
    requestSha256: fixture.digest,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  });
  return { candidate, replay };
}

export function questionRecord(candidate, medium) {
  return {
    id: `question.${medium}`,
    predicate: "visible-question",
    subject: {
      kind: "medium",
      sha256: createHash("sha256").update(canonical(candidate.media[medium])).digest("hex"),
    },
    scope: { kind: "question", medium, view: "overview", question: "shape" },
    verifier: {
      kind: "machine",
      id: "fixture-checker",
      implementationSha256: sha(Buffer.from("fixture-checker")),
    },
    method: "carrier-inspection/v1",
    observations: [{ name: "visible", value: true }],
    verdict: "PASS",
    limitations: [],
  };
}

export function selectedSet(replay, records) {
  return {
    schema: "architecture.qualification-set/v2",
    candidateSha256: replay.candidateSha256,
    inputLockSha256: replay.inputLockSha256,
    records,
  };
}

export function policyFor(candidate, replay, records) {
  return {
    schema: "architecture.qualification-policy/v1",
    id: "fixture-review-policy",
    accepter: "fixture-editor",
    candidateSha256: replay.candidateSha256,
    acceptedCandidateLimits: [...candidate.limits],
    requirements: records.map(({ predicate, scope, verifier, method }) => ({
      predicate,
      scope,
      verifier,
      method,
      allowedLimitations: [],
    })),
  };
}

export function visualReviewRecords(candidate) {
  return Object.entries(candidate.media).flatMap(([medium, { artifacts }]) =>
    artifacts
      .filter(({ mediaType }) => ["image/png", "text/html"].includes(mediaType))
      .flatMap((artifact) =>
        ["faithful", "intelligible", "aesthetic"].map((predicate) => ({
          ...questionRecord(candidate, medium),
          id: `review.${medium}.${predicate}`,
          predicate,
          scope: {
            kind: medium === "static" ? "physical" : "viewport",
            medium,
            artifact: artifact.id,
            width: medium === "static" ? 1800 : 1440,
            height: 1000,
          },
          subject: { kind: "artifact", sha256: artifact.sha256 },
          verifier: {
            kind: "human",
            id: "fixture-editor",
            implementationSha256: sha(Buffer.from("visual-review-rubric/v1")),
          },
          method: "visual-inspection/v1",
        })),
      ),
  );
}
