import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { claimModel, ref } from "./fixtures/claim-model.mjs";
import {
  CLAIM_PLANES,
  claimModelDigest,
  validateClaimModel,
} from "../packages/publisher/src/semantics/document.mjs";

test("v2 admits one explicit claim in every plane without mutating input", () => {
  const model = claimModel(),
    before = structuredClone(model);
  assert.deepEqual(CLAIM_PLANES, ["intended", "implemented", "observed", "governed", "published"]);
  assert.deepEqual(validateClaimModel(model), model);
  assert.deepEqual(model, before);
  assert.equal(claimModelDigest(model).length, 64);
  assert.deepEqual(
    [...new Set(Object.values(model.claims).map((claim) => claim.plane))].sort(),
    [...CLAIM_PLANES].sort(),
  );
});

test("v2 rejects v1 and closes every semantic shape", () => {
  const base = claimModel();
  for (const mutate of [
    (p) => (p.schema = "architecture.semantic-document/v1"),
    (p) => (p.extra = true),
    (p) => (p.vocabulary.extra = []),
    (p) => (p.entities.client.extra = true),
    (p) => (p.relations.request.extra = true),
    (p) => (p.claims.intended.extra = true),
    (p) => (p.sources.contract.extra = true),
    (p) => (p.claims.intended.plane = "desired"),
    (p) => (p.claims.intended.subject = "missing"),
    (p) => (p.claims.intended.object = "missing"),
    (p) => (p.claims.intended.predicate = "undeclared"),
    (p) => (p.vocabulary.predicates.calls.valueKind = "prose"),
    (p) => (p.vocabulary.predicates.calls.cardinality = "many"),
    (p) => (p.vocabulary.predicates.calls.provenance = ["missing"]),
    (p) => (p.claims.intended.provenance = ["missing"]),
    (p) => (p.claims.intended.dependsOn = [ref("claims", "missing")]),
    (p) => (p.claims.intended.condition = undefined),
    (p) => (p.claims.intended.scope = undefined),
    (p) => (p.claims.intended.maturity = ""),
    (p) => (p.claims.intended.validity = ""),
    (p) => (p.claims.intended.coverage = "partial"),
    (p) => {
      p.claims.intended.object = null;
      p.claims.intended.value = null;
    },
    (p) => {
      p.claims.intended.object = "server";
      p.claims.intended.value = { duplicate: true };
    },
  ]) {
    const invalid = structuredClone(base);
    mutate(invalid);
    assert.throws(() => validateClaimModel(invalid), /semantic_/);
  }
});

test("semantic admission bounds nested JSON and section cardinality before interpretation", () => {
  const deeplyNested = claimModel();
  let nested = "leaf";
  for (let index = 0; index < 65; index++) nested = [nested];
  deeplyNested.context.deep = nested;
  assert.throws(() => validateClaimModel(deeplyNested), {
    code: "semantic_depth_exceeded",
  });

  const malformedSection = claimModel();
  malformedSection.context = null;
  assert.throws(() => validateClaimModel(malformedSection), {
    code: "semantic_section_invalid",
  });

  const oversizedSection = claimModel();
  oversizedSection.context = Object.fromEntries(
    Array.from({ length: 20_001 }, (_, index) => [`context-${index}`, "selected"]),
  );
  assert.throws(() => validateClaimModel(oversizedSection), {
    code: "semantic_size_exceeded",
  });
});

test("a claim cannot inherit truth from an empty or incomplete source authority", () => {
  const noSources = claimModel();
  noSources.sources = {};
  assert.throws(() => validateClaimModel(noSources), {
    code: "semantic_provenance_required",
  });

  const incompletePredicate = claimModel();
  incompletePredicate.sources.observation = {
    sha256: "2".repeat(64),
    locator: "observation.json",
    authority: "Separate runtime observation",
  };
  incompletePredicate.vocabulary.predicates.calls.provenance.push("observation");
  assert.throws(() => validateClaimModel(incompletePredicate), {
    code: "semantic_claim_provenance_incomplete",
  });
});

test("unknown coverage preserves opaque value and cannot pretend formal dependency knowledge", () => {
  const model = claimModel();
  model.claims.published.dependsOn = [];
  assert.deepEqual(validateClaimModel(model), model);
  model.claims.published.coverage = "complete";
  assert.throws(() => validateClaimModel(model), /semantic_claim_coverage_unknown_required/);
});

test("complete object and literal claims require dependencies matching their meaning", () => {
  const objectClaim = claimModel();
  objectClaim.claims.intended.dependsOn = [ref("entities", "client")];
  assert.throws(
    () => validateClaimModel(objectClaim),
    /semantic_claim_dependency_required.*intended/,
  );

  const literalClaim = claimModel();
  literalClaim.claims.observed.dependsOn = [ref("entities", "server")];
  assert.throws(
    () => validateClaimModel(literalClaim),
    /semantic_(claim_dependency_required|dependency_invalid).*observed/,
  );

  const undeclaredLiteral = claimModel();
  undeclaredLiteral.vocabulary.predicates.statement.valueKind = "scalar";
  assert.throws(
    () => validateClaimModel(undeclaredLiteral),
    /semantic_claim_value_invalid.*published/,
  );
});

test("claim dependencies require a future typed relation and are not inferred", () => {
  const model = claimModel();
  model.claims.published.dependsOn = [ref("entities", "client"), ref("claims", "observed")];
  assert.throws(() => validateClaimModel(model), /semantic_dependency_invalid.*published/);
});

test("claim provenance covers every meaning-bearing dependency source", () => {
  const mismatched = claimModel();
  mismatched.sources.observation = {
    sha256: "2".repeat(64),
    locator: "observation.json",
    authority: "Selected runtime observation",
  };
  mismatched.relations.request.provenance = ["observation"];
  mismatched.entities.client.provenance = ["observation"];
  mismatched.claims.governed.provenance.push("observation");
  mismatched.claims.implemented.provenance.push("observation");
  mismatched.claims.observed.provenance = ["observation"];
  mismatched.claims.published.provenance = ["observation"];
  mismatched.claims.tagged.provenance = ["observation"];
  assert.throws(
    () => validateClaimModel(mismatched),
    /semantic_claim_provenance_incomplete.*intended.*observation/,
  );
});

test("plane is part of meaning and no cross-plane equivalence is invented", () => {
  const model = claimModel(),
    digest = claimModelDigest(model);
  model.claims.implemented.plane = "observed";
  assert.notEqual(claimModelDigest(model), digest);

  const duplicate = claimModel();
  duplicate.claims.secondIntention = structuredClone(duplicate.claims.intended);
  assert.throws(
    () => validateClaimModel(duplicate),
    /semantic_claim_duplicate.*intended.*secondIntention/,
  );
});

test("contradiction is scoped by plane, condition, scope and maturity", () => {
  const model = claimModel();
  model.claims.denial = structuredClone(model.claims.intended);
  model.claims.denial.validity = "refuted";
  assert.throws(() => validateClaimModel(model), /semantic_contradiction.*denial.*intended/);
  model.claims.denial.condition.authorization = "denied";
  assert.doesNotThrow(() => validateClaimModel(model));
  model.claims.denial.condition.authorization = "granted";
  model.claims.denial.plane = "observed";
  assert.doesNotThrow(() => validateClaimModel(model));
});

test("claims with incompatible literal values contradict at the same semantic position", () => {
  const model = claimModel();
  model.claims.unhealthy = structuredClone(model.claims.observed);
  model.claims.unhealthy.value = "unhealthy";
  assert.throws(() => validateClaimModel(model), /semantic_contradiction.*observed.*unhealthy/);
});

test("single entity predicates contradict when affirmed targets differ", () => {
  const model = claimModel();
  model.relations.alternate = {
    ...structuredClone(model.relations.request),
    object: "other",
  };
  model.claims.alternate = {
    ...structuredClone(model.claims.intended),
    object: "other",
    dependsOn: [ref("relations", "alternate")],
  };
  assert.throws(() => validateClaimModel(model), /semantic_contradiction.*alternate.*intended/);
});

test("validity contradictions depend on proposition target and predicate cardinality", () => {
  const sameTarget = claimModel();
  sameTarget.claims.denial = structuredClone(sameTarget.claims.tagged);
  sameTarget.claims.denial.validity = "refuted";
  assert.throws(() => validateClaimModel(sameTarget), /semantic_contradiction.*denial.*tagged/);

  const differentTarget = claimModel();
  differentTarget.claims.denial = structuredClone(differentTarget.claims.observed);
  differentTarget.claims.denial.value = "unhealthy";
  differentTarget.claims.denial.validity = "refuted";
  assert.doesNotThrow(() => validateClaimModel(differentTarget));

  differentTarget.claims.denial.validity = "affirmed";
  assert.throws(
    () => validateClaimModel(differentTarget),
    /semantic_contradiction.*denial.*observed/,
  );
});

test("multi-valued predicates do not invent a single-valued contradiction", () => {
  const model = claimModel();
  model.claims.secondTag = structuredClone(model.claims.tagged);
  model.claims.secondTag.value = "supported";
  assert.doesNotThrow(() => validateClaimModel(model));
});

test("overlapping applicability never passes as a consistent complete model", () => {
  const conditionOverlap = claimModel();
  conditionOverlap.claims.unhealthy = structuredClone(conditionOverlap.claims.observed);
  conditionOverlap.claims.unhealthy.value = "unhealthy";
  conditionOverlap.claims.unhealthy.condition.region = "us";
  assert.throws(
    () => validateClaimModel(conditionOverlap),
    /semantic_contradiction.*observed.*unhealthy/,
  );

  const scopeOverlap = claimModel();
  scopeOverlap.claims.unhealthy = structuredClone(scopeOverlap.claims.observed);
  scopeOverlap.claims.unhealthy.value = "unhealthy";
  scopeOverlap.claims.unhealthy.scope.region = "us";
  assert.throws(
    () => validateClaimModel(scopeOverlap),
    /semantic_contradiction.*observed.*unhealthy/,
  );

  scopeOverlap.claims.unhealthy.scope.environment = "remote";
  assert.doesNotThrow(() => validateClaimModel(scopeOverlap));
});

test("condition and scope dimensions are closed scalar conjunctions", () => {
  const nestedCondition = claimModel();
  nestedCondition.claims.intended.condition.authorization = {
    mode: "granted",
  };
  assert.throws(
    () => validateClaimModel(nestedCondition),
    /semantic_claim_condition_invalid.*intended/,
  );

  const arrayScope = claimModel();
  arrayScope.claims.intended.scope.environment = ["local"];
  assert.throws(() => validateClaimModel(arrayScope), /semantic_claim_scope_invalid.*intended/);
});

test("opaque unknown claims are preserved without speculative contradiction checks", () => {
  const model = claimModel();
  model.claims.secondPublication = structuredClone(model.claims.published);
  model.claims.secondPublication.value.text =
    "A different unformalized statement for the same reader context.";
  assert.doesNotThrow(() => validateClaimModel(model));
});

test("non-enumerable and accessor properties cannot escape validation or identity", () => {
  const topLevelHidden = claimModel();
  Object.defineProperty(topLevelHidden, "hiddenMeaning", {
    value: "not canonicalized",
    enumerable: false,
  });
  assert.throws(() => validateClaimModel(topLevelHidden), /semantic_json_required/);

  const topLevelAccessor = claimModel();
  Object.defineProperty(topLevelAccessor, "owner", {
    get() {
      return "example:system";
    },
    enumerable: true,
  });
  assert.throws(() => validateClaimModel(topLevelAccessor), /semantic_json_required/);

  const hidden = claimModel();
  Object.defineProperty(hidden.claims.intended, "hiddenMeaning", {
    value: "not canonicalized",
    enumerable: false,
  });
  assert.throws(() => validateClaimModel(hidden), /semantic_json_required/);

  const accessor = claimModel();
  Object.defineProperty(accessor.claims.intended, "maturity", {
    get() {
      return "target";
    },
    enumerable: true,
  });
  assert.throws(() => validateClaimModel(accessor), /semantic_json_required/);

  const nullPrototype = claimModel();
  nullPrototype.claims.intended = Object.assign(Object.create(null), nullPrototype.claims.intended);
  nullPrototype.claims.second = Object.assign(Object.create(null), nullPrototype.claims.intended);
  assert.throws(() => validateClaimModel(nullPrototype), /semantic_/);
});

test("shared object identities cannot make digest depend on non-JSON topology", () => {
  const shared = claimModel();
  const values = ["contract"];
  shared.claims.published.value.alias = values;
  shared.claims.published.provenance = values;
  const copied = claimModel();
  copied.claims.published.value.alias = [...values];
  copied.claims.published.provenance = [...values];
  assert.equal(JSON.stringify(shared), JSON.stringify(copied));
  assert.throws(() => claimModelDigest(shared), /semantic_json_alias/);
  assert.equal(claimModelDigest(copied).length, 64);
});

test("canonical digest normalizes declared sets but retains semantic array order", () => {
  const a = claimModel();
  a.sources.second = { ...a.sources.contract, locator: "second.md" };
  a.claims.intended.provenance.push("second");
  a.claims.intended.dependsOn.push(ref("entities", "client"));
  a.vocabulary.entities.push("process");
  a.claims.intended.value = null;
  a.context.samples = ["first", "second"];
  const b = structuredClone(a);
  b.claims = Object.fromEntries(Object.entries(b.claims).reverse());
  b.entities = Object.fromEntries(Object.entries(b.entities).reverse());
  b.claims.intended.provenance.reverse();
  b.claims.intended.dependsOn.reverse();
  b.vocabulary.entities.reverse();
  assert.equal(claimModelDigest(a), claimModelDigest(b));
  b.context.samples.reverse();
  assert.notEqual(claimModelDigest(a), claimModelDigest(b));
});

test("a Claim Model contains at least one claim", () => {
  const model = claimModel();
  model.claims = {};
  assert.throws(() => validateClaimModel(model), /semantic_claim_required/);
});

test("hostile JSON, cycles, excessive depth and size fail closed within bounded work", () => {
  const model = claimModel();
  const sparse = new Array(2);
  sparse[0] = "visible";
  sparse.extra = "hidden";
  model.context.samples = sparse;
  assert.throws(() => validateClaimModel(model), /semantic_json_required/);

  delete model.context.samples;
  model.context.loop = model;
  assert.throws(() => validateClaimModel(model), /semantic_json_cycle/);

  const program = `
    import { validateClaimModel } from './packages/publisher/src/semantics/document.mjs';
    import { claimModel } from './tests/fixtures/claim-model.mjs';
    const model = claimModel();
    let shared = 'x';
    for (let i = 0; i < 35; i++) shared = [shared, shared];
    model.context.shared = shared;
    try { validateClaimModel(model); process.exitCode = 2; }
    catch (error) { process.stdout.write(error.code); }
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", program], {
    cwd: new URL("../", import.meta.url),
    encoding: "utf8",
    timeout: 2000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "semantic_json_alias");

  const oversized = claimModel();
  oversized.context.long = "x".repeat(16 * 1024 * 1024);
  assert.throws(() => validateClaimModel(oversized), /semantic_size_exceeded/);
});
