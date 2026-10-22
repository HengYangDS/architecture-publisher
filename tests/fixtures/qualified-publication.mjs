import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compileEditionCandidateInput } from "../../packages/publisher/src/compiler/index.mjs";
import { verifyQualificationInput } from "../../packages/publisher/src/qualification/index.mjs";
import { readSourceBundle } from "../../packages/publisher/src/source/bundle.mjs";
import {
  selectedFixtureRequirements,
  selectedNativeEdition,
  sha,
  submittedFixtureRecords,
} from "./selected-native-edition.mjs";

export const root = fileURLToPath(new URL("../..", import.meta.url));

export async function fixture(t, { media, claimants, title } = {}) {
  const selected = await selectedNativeEdition(t, {
    width: 1800,
    ...(media ? { media } : {}),
    ...(title ? { title } : {}),
  });
  if (claimants) {
    assert.equal(claimants.length, selected.request.sources.length);
    selected.request.sources.forEach((source, index) => {
      source.claimant = claimants[index];
    });
    const bytes = Buffer.from(JSON.stringify(selected.request) + "\n");
    await fs.writeFile(selected.file, bytes);
    selected.digest = sha(bytes);
  }
  const built = await compileEditionCandidateInput(
    selected.file,
    selected.digest,
    path.join(selected.root, "candidate"),
  );
  const bundle = await readSourceBundle(built.manifestPath, built.manifestSha256);
  const members = new Map(bundle.members.map(({ path: name, content }) => [name, content]));
  const candidate = JSON.parse(members.get("candidate.json"));
  const requirements = selectedFixtureRequirements(candidate);
  const policy = {
    schema: "architecture.qualification-policy/v1",
    id: "fixture-policy",
    accepter: selected.project.editor,
    candidateSha256: built.candidateSha256,
    acceptedCandidateLimits: candidate.limits,
    requirements,
  };
  const records = submittedFixtureRecords(candidate, requirements);
  const set = {
    schema: "architecture.qualification-set/v2",
    candidateSha256: built.candidateSha256,
    inputLockSha256: built.lockSha256,
    records,
  };
  const write = async (name, value) => {
    const bytes = Buffer.from(JSON.stringify(value) + "\n");
    const file = path.join(selected.root, name);
    await fs.writeFile(file, bytes);
    return { file, sha256: sha(bytes) };
  };
  const selectedSet = await write("qualification-set.json", set);
  const selectedPolicy = await write("qualification-policy.json", policy);
  const qualificationInput = await write("qualification-input.json", {
    schema: "architecture.qualification-input/v2",
    request: { path: "build-request.json", sha256: selected.digest },
    candidate: { path: "candidate/manifest.json", sha256: built.manifestSha256 },
    qualification: { path: "qualification-set.json", sha256: selectedSet.sha256 },
  });
  const report = await verifyQualificationInput(
    qualificationInput.file,
    qualificationInput.sha256,
    [],
    { file: selectedPolicy.file, sha256: selectedPolicy.sha256 },
  );
  assert.equal(report.submittedVerdict, "PASS");
  assert.equal(report.admitted, false);
  const selectedReport = await write("qualification-report.json", report);
  await fs.mkdir(path.join(selected.root, "delivery"));
  const request = {
    schema: "architecture.qualified-file-publication/v1",
    candidate: { manifest: "candidate/manifest.json", sha256: built.manifestSha256 },
    qualifications: {
      set: { file: "qualification-set.json", sha256: selectedSet.sha256 },
      policy: { file: "qualification-policy.json", sha256: selectedPolicy.sha256 },
      report: { file: "qualification-report.json", sha256: selectedReport.sha256 },
    },
    roles: {
      releaseOwner: null,
      custodian: "fixture-custodian",
      effectAuthorizer: "fixture-operator",
    },
    options: {
      destinations: { static: "delivery/static", interactive: "delivery/interactive" },
      recoveryRoot: "recovery",
    },
    entries: {
      static: { "index.html": "<p>Static Edition</p>", "README.md": "Static Edition\n" },
      interactive: {
        "index.html": "<p>Interactive Edition</p>",
        "README.md": "Interactive Edition\n",
      },
    },
  };
  return { selected, built, candidate, bundle, policy, report, request, write };
}

export function authorizationFor(f, plan) {
  return {
    schema: "architecture.qualified-file-authorization/v1",
    planSha256: plan.sha256,
    acceptance: {
      decision: "ACCEPTED",
      accepter: f.policy.accepter,
      candidateSha256: f.built.candidateSha256,
      qualificationSetDigest: f.report.qualificationSetDigest,
      policySha256: f.report.policySha256,
    },
    effect: { decision: "AUTHORIZED", authorizer: f.request.roles.effectAuthorizer },
  };
}
