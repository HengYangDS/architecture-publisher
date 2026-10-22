import test from "node:test";
import assert from "node:assert/strict";
import {
  editionDigest,
  interactiveSceneDigest,
  staticSceneDigest,
  validateEdition,
} from "../packages/publisher/src/edition/contract.mjs";
import { claimModelDigest } from "../packages/publisher/src/semantics/document.mjs";
import { editionFixture } from "./fixtures/edition.mjs";

test("Edition product versions conform to Semantic Versioning 2.0.0", () => {
  for (const version of ["0.0.0", "1.2.3", "0.3.0-alpha.0", "1.0.0-rc.1+build.20260922"]) {
    const { model, edition } = editionFixture();
    edition.product.version = version;
    assert.doesNotThrow(() => validateEdition(model, edition), version);
  }

  for (const version of [
    "v1.2.3",
    "01.2.3",
    "1.02.3",
    "1.2.03",
    "1.2.3-alpha.01",
    "1.2.3-alpha..1",
    "1.2.3+",
  ]) {
    const { model, edition } = editionFixture();
    edition.product.version = version;
    assert.throws(() => validateEdition(model, edition), /edition_identity_invalid/, version);
  }
});

test("static and interactive scenes have independent identities", () => {
  const { model, edition } = editionFixture(),
    staticBefore = staticSceneDigest(model, edition),
    interactiveBefore = interactiveSceneDigest(model, edition);
  edition.scenes.interactive.overview.label = "Changed interactive overview";
  assert.equal(staticSceneDigest(model, edition), staticBefore);
  assert.notEqual(interactiveSceneDigest(model, edition), interactiveBefore);
  validateEdition(model, edition);

  const aliased = editionFixture();
  aliased.edition.scenes.interactive.overview = aliased.edition.scenes.static;
  assert.throws(() => validateEdition(aliased.model, aliased.edition), /edition_json_alias/);
});

test("complete overview media carry the same semantic identities", () => {
  const missingUnclaimedEntity = editionFixture();
  missingUnclaimedEntity.model.entities.worker = {
    type: "component",
    label: "worker",
    qualifiers: {},
    provenance: ["contract"],
  };
  missingUnclaimedEntity.edition.claimModel.digest = claimModelDigest(missingUnclaimedEntity.model);

  assert.throws(
    () => validateEdition(missingUnclaimedEntity.model, missingUnclaimedEntity.edition),
    /edition_overview_incomplete/,
  );

  const missingUnclaimedRelation = editionFixture();
  missingUnclaimedRelation.model.relations.observes = {
    type: "calls",
    subject: "server",
    object: "other",
    qualifiers: {},
    provenance: ["contract"],
  };
  missingUnclaimedRelation.edition.claimModel.digest = claimModelDigest(
    missingUnclaimedRelation.model,
  );

  assert.throws(
    () => validateEdition(missingUnclaimedRelation.model, missingUnclaimedRelation.edition),
    /edition_overview_incomplete/,
  );

  const entityDrift = editionFixture();
  entityDrift.model.entities.worker = {
    type: "component",
    label: "worker",
    qualifiers: {},
    provenance: ["contract"],
  };
  entityDrift.edition.claimModel.digest = claimModelDigest(entityDrift.model);
  entityDrift.edition.scenes.static.composition.groups[0].entities.push("worker");

  assert.throws(
    () => validateEdition(entityDrift.model, entityDrift.edition),
    /edition_overview_carrier_drift/,
  );

  const relationDrift = editionFixture();
  relationDrift.model.relations.observes = {
    type: "calls",
    subject: "server",
    object: "other",
    qualifiers: {},
    provenance: ["contract"],
  };
  relationDrift.edition.claimModel.digest = claimModelDigest(relationDrift.model);
  relationDrift.edition.scenes.static.composition.relations.push({
    id: "observes",
    fromSide: "right",
    toSide: "left",
    route: "orthogonal-h",
  });

  assert.throws(
    () => validateEdition(relationDrift.model, relationDrift.edition),
    /edition_overview_carrier_drift/,
  );
});

test("rendered title participates in both medium identities", () => {
  const { model, edition } = editionFixture(),
    staticBefore = staticSceneDigest(model, edition),
    interactiveBefore = interactiveSceneDigest(model, edition);
  edition.title = "Changed rendered title";
  assert.notEqual(staticSceneDigest(model, edition), staticBefore);
  assert.notEqual(interactiveSceneDigest(model, edition), interactiveBefore);
});

test("medium identities bind selected semantic renderer inputs and normalize scene sets", () => {
  const baseline = editionFixture(),
    label = editionFixture(),
    endpoint = editionFixture(),
    reordered = editionFixture();

  label.model.entities.server.label = "Renamed rendered server";
  label.edition.claimModel.digest = claimModelDigest(label.model);
  assert.notEqual(
    staticSceneDigest(label.model, label.edition),
    staticSceneDigest(baseline.model, baseline.edition),
  );
  assert.notEqual(
    interactiveSceneDigest(label.model, label.edition),
    interactiveSceneDigest(baseline.model, baseline.edition),
  );

  [endpoint.model.relations.request.subject, endpoint.model.relations.request.object] = [
    "server",
    "client",
  ];
  for (const id of ["intended", "implemented", "governed"])
    [endpoint.model.claims[id].subject, endpoint.model.claims[id].object] = ["server", "client"];
  endpoint.edition.claimModel.digest = claimModelDigest(endpoint.model);
  assert.notEqual(
    staticSceneDigest(endpoint.model, endpoint.edition),
    staticSceneDigest(baseline.model, baseline.edition),
  );
  assert.notEqual(
    interactiveSceneDigest(endpoint.model, endpoint.edition),
    interactiveSceneDigest(baseline.model, baseline.edition),
  );

  reordered.edition.scenes.static.claims.reverse();
  for (const scene of Object.values(reordered.edition.scenes.interactive)) {
    scene.claims.reverse();
    scene.questions.reverse();
  }
  assert.equal(
    staticSceneDigest(reordered.model, reordered.edition),
    staticSceneDigest(baseline.model, baseline.edition),
  );
  assert.equal(
    interactiveSceneDigest(reordered.model, reordered.edition),
    interactiveSceneDigest(baseline.model, baseline.edition),
  );
});

test("Edition digest normalizes declared sets but preserves narrative order", () => {
  const first = editionFixture(),
    second = editionFixture();
  for (const fixture of [first, second]) {
    fixture.edition.questions.delivery = {
      audience: "maintainer",
      prompt: "How is implemented behavior delivered?",
      claims: ["implemented"],
      detail: "mechanism",
      risk: "Omission would hide the delivery boundary.",
    };
    fixture.edition.scenes.interactive.delivery = {
      label: "Delivery boundary",
      purpose: "mechanism",
      questions: ["delivery"],
      claims: ["implemented"],
      composition: {
        groups: [
          {
            id: "delivery",
            label: "Delivery",
            entities: ["client", "server"],
          },
        ],
        relations: [
          {
            id: "request",
            fromSide: "right",
            toSide: "left",
            route: "orthogonal-h",
          },
        ],
      },
    };
    fixture.edition.narrative = ["overview", "runtime", "delivery"];
  }
  second.edition.requiredClaims.reverse();
  second.edition.questions.system.claims.reverse();
  second.edition.qualification.semantic.reverse();
  assert.equal(
    editionDigest(first.model, first.edition),
    editionDigest(second.model, second.edition),
  );
  second.edition.narrative = ["overview", "delivery", "runtime"];
  assert.notEqual(
    editionDigest(first.model, first.edition),
    editionDigest(second.model, second.edition),
  );
});
