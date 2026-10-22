import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readSourceBundle } from "../packages/publisher/src/source/bundle.mjs";
import { validateEditionProject } from "../packages/publisher/src/edition/authoring.mjs";
import { validateClaimModel } from "../packages/publisher/src/semantics/document.mjs";
import { request } from "./fixtures/self-edition.mjs";

test("the evolution view carries semantic delta and distinct renewal obligations", async () => {
  const { architecturePublisherInteractiveScenes } =
    await import("../editions/self/src/edition/interactive-scenes.mjs");
  const evolution = architecturePublisherInteractiveScenes().evolution;
  const entities = new Set(evolution.composition.groups.flatMap((group) => group.entities));
  const relations = new Set(evolution.composition.relations.map((relation) => relation.id));
  for (const id of [
    "evolution-inputs",
    "semantic-delta",
    "affected-views",
    "rebuild-obligations",
    "semantic-verification-obligations",
    "medium-verification-obligations",
    "human-review-obligations",
    "acceptance-obligations",
    "publication-obligations",
  ])
    assert(entities.has(id), `evolution view missing ${id}`);
  for (const id of [
    "evolution-produces-delta",
    "delta-identifies-affected-views",
    "affected-views-require-rebuild",
    "affected-views-require-semantic-verification",
    "affected-views-require-medium-verification",
    "affected-views-require-human-review",
    "affected-views-require-acceptance",
    "affected-views-require-publication",
  ])
    assert(relations.has(id), `evolution view missing ${id}`);
});

test("self renewal edges express required work rather than performed effects", async (t) => {
  const { prepareArchitecturePublisherEdition } =
    await import("../editions/self/src/edition/prepare.mjs");
  const { architecturePublisherInteractiveScenes } =
    await import("../editions/self/src/edition/interactive-scenes.mjs");
  const { composeArchitecturePublisherInteractiveScene } =
    await import("../editions/self/src/edition/interactive-scene.mjs");
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), "publisher-self-obligations-"));
  t.after(() => fs.rm(parent, { recursive: true, force: true }));
  const prepared = await prepareArchitecturePublisherEdition(
    await request(path.join(parent, "prepared")),
  );
  const bundle = await readSourceBundle(prepared.sourceManifest, prepared.sourceSha256);
  const model = validateClaimModel(
    JSON.parse(bundle.members.find(({ path: name }) => name === "semantic.json").content),
  );
  const project = validateEditionProject(JSON.parse(await fs.readFile(prepared.project, "utf8")));
  const requiredWork = new Map([
    ["rebuild-obligations", "requires rebuild"],
    ["semantic-verification-obligations", "requires recheck"],
    ["medium-verification-obligations", "requires recheck"],
    ["human-review-obligations", "requires renewal"],
    ["acceptance-obligations", "requires renewal"],
    ["publication-obligations", "requires publication"],
  ]);
  const expected = new Set(
    Object.entries(model.relations)
      .filter(([, relation]) => requiredWork.has(relation.subject))
      .map(([id]) => id),
  );
  const observed = new Set();
  const catalog = architecturePublisherInteractiveScenes();
  for (const id of ["overview", "evolution"]) {
    const view = catalog[id];
    const scene = composeArchitecturePublisherInteractiveScene(model, project, {
      id,
      label: view.label,
      purpose: view.purpose,
      ...view.composition,
    });
    for (const edge of scene.edges) {
      const labels = new Set();
      for (const carrier of edge.semanticIds) {
        const relationId = carrier.slice("relation:".length);
        if (!expected.has(relationId)) continue;
        const subject = model.relations[relationId].subject;
        assert.equal(model.claims[`role-${subject}`].condition.effect, "planned-not-executed");
        labels.add(requiredWork.get(subject));
        observed.add(relationId);
      }
      if (labels.size)
        assert.equal(
          edge.label,
          labels.size === 1 ? [...labels][0] : "requires renewal",
          `${id}: ${edge.id}`,
        );
    }
    if (id === "evolution")
      assert.equal(
        scene.nodes.find((node) => node.id === "effect").detail,
        "planned · not executed",
      );
  }
  assert.deepEqual(observed, expected);
});

test("the semantics view connects uncertainty and claims to Edition authorship", async () => {
  const { architecturePublisherInteractiveScenes } =
    await import("../editions/self/src/edition/interactive-scenes.mjs");
  const semantics = architecturePublisherInteractiveScenes().semantics;
  const relations = new Set(semantics.composition.relations.map((relation) => relation.id));
  assert(relations.has("claims-inform-edition"));
  assert(relations.has("uncertainty-broadens-edition"));
});
