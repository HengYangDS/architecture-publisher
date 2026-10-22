import assert from "node:assert/strict";
import test from "node:test";
import {
  bindQualificationRecord,
  bindQualificationSet,
  qualificationSubject,
  qualificationSetDigest,
  validateQualificationSet,
} from "../packages/publisher/src/qualification/index.mjs";
import {
  exactDigest,
  authority,
  candidate,
  admit,
  recordsFor,
  record,
  set,
} from "./fixtures/qualification-set.mjs";

test("qualification set validates exact predicate-specific evidence without manufacturing acceptance", () => {
  const source = set();
  const selected = validateQualificationSet(source);
  assert.equal(selected.records[0].verdict, "PASS");
  assert.equal(selected.records[0].environment, null);
  assert.match(qualificationSetDigest(source), /^[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(selected, "status"), false);
  assert.equal(Object.hasOwn(selected, "accepted"), false);
});

test("qualification records fail closed on unknown fields, duplicate identities, and ambiguous subjects", () => {
  assert.throws(() => validateQualificationSet(set([{ ...record(), score: 100 }])), {
    code: "qualification_record_invalid",
  });
  assert.throws(() => validateQualificationSet(set([record(), record()])), {
    code: "qualification_record_duplicate",
  });
  assert.throws(
    () =>
      validateQualificationSet(
        set([record({ subject: { kind: "edition-candidate", sha256: "bad" } })]),
      ),
    { code: "qualification_subject_invalid" },
  );
});

test("externally supplied qualification fields fail closed at their exact boundary", () => {
  const recordCases = [
    ["scope", { scope: { kind: "document", value: "" } }, "qualification_scope_invalid"],
    [
      "environment",
      { environment: { kind: "host", value: "" } },
      "qualification_environment_invalid",
    ],
    [
      "verifier",
      { verifier: { kind: "machine", id: "", implementationSha256: exactDigest("verifier") } },
      "qualification_verifier_invalid",
    ],
    ["observations", { observations: [] }, "qualification_observations_invalid"],
    [
      "observation identity",
      { observations: [{ name: "", value: true }] },
      "qualification_observation_invalid",
    ],
    [
      "duplicate observation",
      {
        observations: [
          { name: "a", value: 1 },
          { name: "a", value: 2 },
        ],
      },
      "qualification_observation_duplicate",
    ],
    [
      "non-JSON observation",
      { observations: [{ name: "a", value: 1n }] },
      "qualification_observation_invalid",
    ],
    ["verdict", { verdict: "MAYBE" }, "qualification_verdict_invalid"],
    ["limitations type", { limitations: [1] }, "qualification_limitations_invalid"],
    [
      "duplicate limitation",
      { limitations: ["same", "same"] },
      "qualification_limitations_invalid",
    ],
    [
      "common identity",
      { subject: { kind: "claim-model", sha256: exactDigest("other") } },
      "qualification_identity_mismatch",
    ],
  ];
  for (const [name, overrides, code] of recordCases)
    assert.throws(() => validateQualificationSet(set([record(overrides)])), { code }, name);

  assert.throws(
    () =>
      validateQualificationSet(
        set([
          record({
            verifier: {
              kind: "human",
              id: "reviewer",
              implementationSha256: exactDigest("verifier"),
            },
          }),
        ]),
      ),
    { code: "qualification_machine_verifier_required" },
  );
  assert.throws(
    () =>
      validateQualificationSet(
        set([
          record({
            kind: "human",
            verifier: {
              kind: "machine",
              id: "machine",
              implementationSha256: exactDigest("verifier"),
            },
          }),
        ]),
      ),
    { code: "qualification_human_verifier_required" },
  );
  assert.throws(() => validateQualificationSet({ ...set(), records: [] }), {
    code: "qualification_set_invalid",
  });
  assert.throws(() => validateQualificationSet({ ...set(), schema: "unknown" }), {
    code: "qualification_set_invalid",
  });
});

test("binding and admission do not turn a selected candidate into verifier authority", () => {
  const selected = candidate();
  assert.throws(() => qualificationSubject(selected, "unknown"), {
    code: "qualification_kind_invalid",
  });
  assert.throws(() => bindQualificationRecord(selected, {}), {
    code: "qualification_result_invalid",
  });
  assert.throws(() => bindQualificationSet(selected, null), {
    code: "qualification_records_invalid",
  });
  const mismatched = set([record({}, selected)], selected);
  mismatched.candidateSha256 = exactDigest("other-candidate");
  assert.throws(() => admit(selected, mismatched), {
    code: "qualification_identity_mismatch",
  });
});

test("qualification records remain non-compensating and bind common identities", () => {
  const failed = validateQualificationSet(
    set([
      record(),
      record({
        id: "geometry.overlap",
        kind: "static",
        subject: qualificationSubject(candidate(), "static"),
        predicate: "painted-geometry",
        verdict: "FAIL",
      }),
    ]),
  );
  assert.deepEqual(
    failed.records.map(({ verdict }) => verdict),
    ["PASS", "FAIL"],
  );
  assert.throws(
    () =>
      validateQualificationSet(
        set([
          record({
            editionDigest: exactDigest("other-edition"),
          }),
        ]),
      ),
    { code: "qualification_identity_mismatch" },
  );
});

test("validated and admitted qualification values are deeply immutable", () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    qualification = validateQualificationSet(set(undefined, selectedCandidate)),
    admitted = admit(
      selectedCandidate,
      bindQualificationSet(selectedCandidate, recordsFor(selectedCandidate)),
      selected,
    );
  for (const value of [qualification, admitted, admitted.qualification])
    assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(qualification.records), true);
  assert.equal(Object.isFrozen(qualification.records[0]), true);
  assert.equal(Object.isFrozen(admitted.qualification.records[0]), true);
  assert.throws(() => {
    admitted.qualification.records[0].verdict = "FAIL";
  }, TypeError);
  assert.equal(admitted.verdict, "PASS");
  assert.equal(admitted.admitted, true);
});

test("human evidence binds a declared artifact and concrete viewing size", () => {
  const selectedCandidate = candidate(),
    human = bindQualificationRecord(selectedCandidate, {
      id: "human.faithful",
      kind: "human",
      verifier: {
        kind: "human",
        id: "reviewer:human",
        implementationSha256: exactDigest("review-rubric"),
      },
      predicate: "faithful",
      scope: {
        kind: "viewport",
        medium: "interactive",
        artifact: "atlas",
        width: 1440,
        height: 1000,
      },
      environment: null,
      observations: [{ name: "notes", value: "reviewed" }],
      verdict: "PASS",
      limitations: [],
    });
  assert.deepEqual(human.subject, {
    kind: "artifact",
    sha256: selectedCandidate.media.interactive.artifacts[0].sha256,
  });
  assert.throws(
    () =>
      bindQualificationRecord(selectedCandidate, {
        id: "human.unbound",
        kind: "human",
        verifier: {
          kind: "human",
          id: "reviewer:human",
          implementationSha256: exactDigest("review-rubric"),
        },
        predicate: "faithful",
        scope: { kind: "document", value: "candidate.json" },
        environment: null,
        observations: [{ name: "notes", value: "reviewed" }],
        verdict: "PASS",
        limitations: [],
      }),
    { code: "qualification_human_scope_invalid" },
  );
});

test("bound qualification sets reject forged subjects before admission", () => {
  const selectedCandidate = candidate(),
    semantic = bindQualificationRecord(selectedCandidate, {
      id: "semantic.bound",
      kind: "semantic",
      verifier: {
        kind: "machine",
        id: "verifier:semantic",
        implementationSha256: exactDigest("verifier:semantic"),
      },
      predicate: "semantic-integrity",
      scope: { kind: "document", value: "candidate.json" },
      environment: null,
      observations: [{ name: "result", value: "verified" }],
      verdict: "PASS",
      limitations: [],
    });
  assert.throws(
    () =>
      bindQualificationSet(selectedCandidate, [
        {
          ...semantic,
          subject: { kind: "nonsense", sha256: semantic.subject.sha256 },
        },
      ]),
    { code: "qualification_subject_mismatch" },
  );
});

test("qualification admission rederives obligations from exact Edition authority", () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    forgedCandidate = {
      ...selectedCandidate,
      obligations: selectedCandidate.obligations.map((obligation, index) =>
        index === 0 ? { ...obligation, predicate: "forged-approval" } : obligation,
      ),
    },
    qualification = bindQualificationSet(forgedCandidate, [
      bindQualificationRecord(forgedCandidate, {
        id: "semantic.authority",
        kind: "semantic",
        verifier: {
          kind: "machine",
          id: "verifier:semantic",
          implementationSha256: exactDigest("verifier:semantic"),
        },
        predicate: "claim-model-valid",
        scope: { kind: "document", value: "candidate.json" },
        environment: null,
        observations: [{ name: "result", value: "verified" }],
        verdict: "PASS",
        limitations: [],
      }),
    ]);

  assert.throws(() => admit(forgedCandidate, qualification, selected), {
    code: "candidate_obligation_mismatch",
  });
});

test("record binding derives exact identities for every qualification kind", () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    records = recordsFor(selectedCandidate),
    qualification = bindQualificationSet(selectedCandidate, records),
    admitted = admit(selectedCandidate, qualification, selected);
  assert.equal(admitted.complete, true);
  assert.equal(admitted.admitted, true);
  assert.equal(qualification.editionDigest, selectedCandidate.edition.digest);
  assert.equal(qualification.sourceManifestSha256, selectedCandidate.source.manifestSha256);
  assert.equal(qualification.claimModelDigest, selectedCandidate.claimModel.digest);
  assert.equal(
    qualificationSetDigest(qualification),
    qualificationSetDigest({ ...qualification, records: [...records].reverse() }),
  );
});

test("Edition obligations close exactly and no predicate can substitute for another", () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    records = recordsFor(selectedCandidate),
    complete = bindQualificationSet(selectedCandidate, records),
    admitted = admit(selectedCandidate, complete, selected);
  assert.equal(admitted.complete, true);
  assert.equal(admitted.verdict, "PASS");
  assert.equal(admitted.admitted, true);
  assert.deepEqual(admitted.missing, []);

  const omitted = selectedCandidate.obligations.at(-1),
    missing = admit(
      selectedCandidate,
      bindQualificationSet(selectedCandidate, records.slice(0, -1)),
      selected,
    );
  assert.equal(missing.complete, false);
  assert.equal(missing.verdict, "UNKNOWN");
  assert.equal(missing.admitted, false);
  assert.deepEqual(missing.missing, [omitted]);
});

test("Qualification admission rejects duplicate, undeclared and substituted obligations", () => {
  const selected = authority(),
    selectedCandidate = candidate(selected),
    records = recordsFor(selectedCandidate),
    staticRecord = records.find(({ kind }) => kind === "static");

  assert.throws(
    () =>
      admit(
        selectedCandidate,
        set([...records, { ...staticRecord, id: "static.geometry.again" }], selectedCandidate),
        selected,
      ),
    { code: "qualification_obligation_duplicate" },
  );
  assert.throws(
    () =>
      admit(
        selectedCandidate,
        set(
          [
            ...records,
            record(
              {
                id: "extra",
                kind: "coverage",
                subject: qualificationSubject(selectedCandidate, "coverage"),
                predicate: "not-declared",
              },
              selectedCandidate,
            ),
          ],
          selectedCandidate,
        ),
        selected,
      ),
    { code: "qualification_obligation_undeclared" },
  );
  assert.throws(
    () =>
      admit(
        selectedCandidate,
        set(
          [
            ...records,
            record(
              {
                id: "human.invalid",
                kind: "human",
                subject: qualificationSubject(selectedCandidate, "human", {
                  kind: "viewport",
                  medium: "interactive",
                  artifact: "atlas",
                  width: 1440,
                  height: 1000,
                }),
                predicate: "faithful",
                verifier: {
                  kind: "machine",
                  id: "verifier:invalid-human",
                  implementationSha256: exactDigest("invalid-human"),
                },
              },
              selectedCandidate,
            ),
          ],
          selectedCandidate,
        ),
        selected,
      ),
    { code: "qualification_human_verifier_required" },
  );
  assert.throws(
    () =>
      admit(
        selectedCandidate,
        set(
          records.map((selectedRecord) =>
            selectedRecord === staticRecord
              ? {
                  ...selectedRecord,
                  subject: qualificationSubject(selectedCandidate, "interactive"),
                }
              : selectedRecord,
          ),
          selectedCandidate,
        ),
        selected,
      ),
    { code: "qualification_subject_mismatch" },
  );
});
