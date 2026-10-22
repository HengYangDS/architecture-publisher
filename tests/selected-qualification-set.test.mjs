import assert from "node:assert/strict";
import test from "node:test";
import * as qualification from "../packages/publisher/src/qualification/index.mjs";
import { assessSelectedQualificationPolicy } from "../packages/publisher/src/qualification/policy.mjs";
import { sha } from "./fixtures/selected-native-edition.mjs";
import {
  selectedCandidate,
  questionRecord,
  selectedSet,
  policyFor,
  visualReviewRecords,
} from "./fixtures/selected-qualification-set.mjs";

test("technical policy coverage cannot bypass either output's three visual review duties", async (t) => {
  const { candidate, replay } = await selectedCandidate(t);
  const records = [questionRecord(candidate, "static"), questionRecord(candidate, "interactive")];
  const before = structuredClone(candidate);
  assert.throws(
    () =>
      assessSelectedQualificationPolicy(
        candidate,
        replay,
        selectedSet(replay, records),
        policyFor(candidate, replay, records),
      ),
    { code: "selected_qualification_policy_visual_review_missing" },
  );
  assert.deepEqual(candidate, before);
});

test("artifact-only judgments cannot complete the visual review policy without display sizes", async (t) => {
  const { candidate, replay } = await selectedCandidate(t);
  const records = [
    questionRecord(candidate, "static"),
    questionRecord(candidate, "interactive"),
    ...visualReviewRecords(candidate).map((record) => ({
      ...record,
      scope: { kind: "artifact", medium: record.scope.medium, artifact: record.scope.artifact },
      observations: [{ name: "judgment", value: "PASS" }],
    })),
  ];
  const before = structuredClone(records);
  assert.throws(
    () =>
      assessSelectedQualificationPolicy(
        candidate,
        replay,
        selectedSet(replay, records),
        policyFor(candidate, replay, records),
      ),
    { code: "selected_qualification_policy_visual_review_missing" },
  );
  assert.deepEqual(records, before);
});

test("visual review binds each declared PNG size and HTML viewport without independent-review claims", async (t) => {
  const { candidate, replay } = await selectedCandidate(t);
  const records = [
    questionRecord(candidate, "static"),
    questionRecord(candidate, "interactive"),
    ...visualReviewRecords(candidate).map((record) => ({
      ...record,
      scope: {
        ...record.scope,
        kind: record.scope.medium === "static" ? "physical" : "viewport",
        width: record.scope.medium === "static" ? 1800 : 1440,
        height: 1000,
      },
    })),
  ];
  const policy = policyFor(candidate, replay, records);
  const assess = (submitted) =>
    assessSelectedQualificationPolicy(candidate, replay, selectedSet(replay, submitted), policy);
  const valid = assess(records);
  assert.equal(valid.completeness, "submitted-policy-complete");
  assert.equal(valid.submittedVerdict, "PASS");
  assert.equal(valid.admitted, false);
  assert.equal(valid.acceptance, "not-performed");
  assert.equal(valid.policyAttribution, "invoker-selected-unverified");
  for (const field of ["width", "height"]) {
    const mismatched = structuredClone(records);
    mismatched.find(({ predicate }) => predicate === "faithful").scope[field]++;
    const result = assess(mismatched);
    assert.equal(result.completeness, "submitted-policy-incomplete");
    assert.equal(result.submittedVerdict, "UNKNOWN");
    assert.equal(result.admitted, false);
  }
});

test("selected visual review requires every declared display scope to have all three predicates", async (t) => {
  const { candidate, replay } = await selectedCandidate(t);
  const records = [
    questionRecord(candidate, "static"),
    questionRecord(candidate, "interactive"),
    ...visualReviewRecords(candidate),
  ];
  const assess = (submitted) =>
    assessSelectedQualificationPolicy(
      candidate,
      replay,
      selectedSet(replay, submitted),
      policyFor(candidate, replay, submitted),
    );
  const split = structuredClone(records);
  split.slice(2).forEach((record, index) => {
    record.scope.width += index;
  });
  const before = structuredClone(split);
  assert.throws(() => assess(split), {
    code: "selected_qualification_policy_visual_review_missing",
  });
  assert.deepEqual(split, before);
  const additional = [
    ...records,
    ...visualReviewRecords(candidate).map((record) => ({
      ...record,
      id: `${record.id}.additional`,
      scope: { ...record.scope, width: record.scope.width + 100 },
    })),
  ];
  assert.equal(assess(additional).submittedVerdict, "PASS");
  additional.pop();
  assert.throws(() => assess(additional), {
    code: "selected_qualification_policy_visual_review_missing",
  });
});

test("publication policy requires human review of every selected output artifact", async (t) => {
  const { candidate, replay } = await selectedCandidate(t);
  const reviews = visualReviewRecords(candidate);
  const records = [
    questionRecord(candidate, "static"),
    questionRecord(candidate, "interactive"),
    ...reviews,
  ];
  const policy = policyFor(candidate, replay, records);
  const assess = (value) =>
    assessSelectedQualificationPolicy(candidate, replay, selectedSet(replay, records), value);
  assert.equal(assess(policy).completeness, "submitted-policy-complete");
  assert.equal(assess(policy).admitted, false);
  for (const review of reviews) {
    const incomplete = structuredClone(policy);
    incomplete.requirements = incomplete.requirements.filter(
      ({ predicate, scope }) =>
        predicate !== review.predicate || scope.medium !== review.scope.medium,
    );
    const before = structuredClone(incomplete);
    assert.throws(() => assess(incomplete), {
      code: "selected_qualification_policy_visual_review_missing",
    });
    assert.deepEqual(incomplete, before);
  }
  for (const kind of ["candidate", "medium", "question"]) {
    const broad = structuredClone(policy);
    const requirement = broad.requirements[2];
    requirement.scope =
      kind === "candidate"
        ? { kind }
        : kind === "medium"
          ? { kind, medium: requirement.scope.medium }
          : { kind, medium: requirement.scope.medium, view: "overview", question: "shape" };
    assert.throws(() => assess(broad), {
      code: "selected_qualification_policy_visual_review_missing",
    });
  }
  const machineReview = structuredClone(policy);
  for (const requirement of machineReview.requirements.slice(2))
    requirement.verifier.kind = "machine";
  assert.throws(() => assess(machineReview), {
    code: "selected_qualification_policy_visual_review_missing",
  });
});

test("uniform review applies to a single selected medium without inventing another", async (t) => {
  for (const medium of ["static", "interactive"]) {
    const { candidate, replay } = await selectedCandidate(t, { media: [medium] });
    const records = [questionRecord(candidate, medium), ...visualReviewRecords(candidate)];
    assert.equal(records.length, 4);
    const result = assessSelectedQualificationPolicy(
      candidate,
      replay,
      selectedSet(replay, records),
      policyFor(candidate, replay, records),
    );
    assert.equal(result.completeness, "submitted-policy-complete");
    assert.equal(result.submittedVerdict, "PASS");
    assert.equal(result.acceptance, "not-performed");
  }
});

test("a submitted PASS binds exact artifact bytes but cannot grant qualification", async (t) => {
  const { candidate, replay } = await selectedCandidate(t);
  const artifact = candidate.media.static.artifacts.find(({ id }) => id === "architecture-png");
  const set = {
    schema: "architecture.qualification-set/v2",
    candidateSha256: replay.candidateSha256,
    inputLockSha256: replay.inputLockSha256,
    records: [
      {
        id: "review.static.png",
        predicate: "visual-readability",
        subject: { kind: "artifact", sha256: artifact.sha256 },
        scope: { kind: "artifact", medium: "static", artifact: "architecture-png" },
        verifier: {
          kind: "human",
          id: "fixture-reviewer",
          implementationSha256: sha(Buffer.from("fixture-review-method")),
        },
        method: "visual-inspection/v1",
        observations: [{ name: "judgment", value: "legible" }],
        verdict: "PASS",
        limitations: [],
      },
    ],
  };
  const result = qualification.bindSelectedQualificationSet(candidate, replay, set);
  assert.equal(result.candidateSha256, replay.candidateSha256);
  assert.equal(result.inputLockSha256, replay.inputLockSha256);
  assert.equal(result.records, 1);
  assert.equal(result.attribution, "submitted-unverified");
  assert.equal(result.completeness, "not-assessed-no-policy");
  assert.equal(result.admitted, false);
  assert.deepEqual(result.missingSubmittedPassQuestionScopes, [
    { kind: "question", medium: "interactive", view: "overview", question: "shape" },
    { kind: "question", medium: "static", view: "overview", question: "shape" },
  ]);
});
