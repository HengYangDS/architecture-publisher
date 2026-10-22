import assert from "node:assert/strict";

import fs from "node:fs/promises";

import path from "node:path";

import test from "node:test";

import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from "../packages/publisher/src/compiler/index.mjs";

import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";

import { composeStaticEditionScene } from "../packages/publisher/src/scene/index.mjs";

import { composeStaticEditionSvg } from "../packages/publisher/renderers/svg/index.mjs";

import { claimModel } from "./fixtures/claim-model.mjs";

import { composeStaticSelectionLayout } from "../packages/publisher/src/scene/static/selection.mjs";

import { interactiveDocument } from "./fixtures/interactive-member.mjs";

import {
  figureIcons,
  modelNamespace,
  fixture,
  groupedMixedFixture,
} from "./fixtures/claim-selection.mjs";

test("ungrouped Claim Model entities and relations render without invented membership", async (t) => {
  for (const reference of ["entity:client", "relation:request"]) {
    const model = claimModel();
    model.relations.request.qualifiers = { phase: "selected" };
    const selected = await fixture(t, { model, reference });
    const output = path.join(selected.root, "candidate");
    await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
    const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
    const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json")));

    assert.match(svg, /data-graphic-id="static-view-0-n-0"/u);
    assert.match(svg, /data-static-view="overview"/u);
    assert.doesNotMatch(svg, /READING GROUPS/u);
    assert.equal(candidate.media.static.artifacts.length, 2);
    if (reference.startsWith("relation:")) {
      assert.match(svg, /data-graphic-id="static-view-0-r-0"/u);
      assert.match(svg, /phase: selected/u);
    } else {
      assert.doesNotMatch(svg, /data-graphic-id="static-view-0-r-0"/u);
    }
  }
});

test("a grouped static Scene retains relation and dependent claim as separate source assertions", async (t) => {
  const model = claimModel();
  model.relations.request.qualifiers = { phase: "selected", z: "tail", ä: "accent" };
  const selected = await groupedMixedFixture(t, { model });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeStaticSelectionLayout(meaning);
  const scene = composeStaticEditionScene(meaning, layout);
  assert.equal(scene.nativeView, null);
  assert.deepEqual(
    scene.nodes.map(({ id }) => id),
    ["client", "server"],
  );
  assert.deepEqual(
    scene.edges[0].relations.map(({ reference }) => reference),
    ["request"],
  );
  assert.equal(
    scene.edges[0].relations[0].label,
    "Source relation qualifiers (unverified): phase: selected · z: tail · ä: accent",
  );
  const fragment = composeStaticEditionSvg(scene, { icons: figureIcons, fragment: true });
  assert.equal(fragment.parts.relations[0].context, "Source relation qualifiers (unverified)");
  assert.equal(Object.hasOwn(fragment.parts.relations[0], "compactText"), false);
  assert.equal(scene.claimCards.length, 1);
  assert.deepEqual(scene.claimRelationLinks, [
    { claimAssertionId: "selected-claim", relationAssertionId: "selected-relation" },
  ]);
  assert.deepEqual(
    scene.sourceAssertionCarriers.map(({ kind }) => kind),
    ["relation", "claim"],
  );
  assert.deepEqual(scene.sourceAssertionCarriers[0].relationRefs, [
    {
      namespace: modelNamespace,
      reference: "request",
      sha256: meaning.native.selections[0].source.sha256,
    },
  ]);
  assert.deepEqual(scene.sourceAssertionCarriers[1].claimRefs, [
    {
      namespace: modelNamespace,
      reference: "intended",
      sha256: meaning.native.selections[1].source.sha256,
    },
  ]);
  const forged = structuredClone(layout);
  forged.edges[0].relations[0].reference = "missing-relation";
  assert.throws(() => composeStaticEditionScene(meaning, forged), {
    code: "static_scene_native_membership_mismatch",
  });
  const malformed = structuredClone(meaning);
  malformed.native.selections[0].members.relations[0].qualifiers = null;
  assert.throws(() => composeStaticEditionScene(malformed, layout), {
    code: "static_scene_relation_qualifiers_invalid",
  });
  const unlinked = structuredClone(meaning);
  unlinked.native.selections[1].members.claims[0].dependsOn = [
    { section: "relations", id: "unselected" },
  ];
  assert.throws(() => composeStaticEditionScene(unlinked, layout), {
    code: "static_scene_claim_relation_unbound",
  });
  const unboundSource = structuredClone(meaning);
  delete unboundSource.native.selections[1].source;
  assert.throws(() => composeStaticEditionScene(unboundSource, layout), {
    code: "static_scene_claim_relation_unbound",
  });
  const changedClaimant = structuredClone(meaning);
  changedClaimant.native.selections[1].source.claimant = "another-claimant";
  assert.throws(() => composeStaticEditionScene(changedClaimant, layout), {
    code: "static_scene_claim_relation_unbound",
  });
});

test("a grouped Claim Model refinement keeps its typed claim linked to selected source structure", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["static"] });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeStaticSelectionLayout(meaning);
  const refinement = {
    schema: "architecture.scene-refinement/v1",
    media: {
      static: {
        view: "overview",
        nodes: layout.nodes.map(({ namespace, id, x, y, width, height }) => ({
          namespace,
          id,
          x,
          y,
          width,
          height,
        })),
        edges: layout.edges.map(({ from, to, relations, points }) => ({
          from,
          to,
          relations: relations.map(({ namespace, reference }) => ({ namespace, reference })),
          points,
        })),
        groups: layout.groups.map(({ id, x, y, width, height }) => ({
          id,
          x,
          y,
          width,
          height,
        })),
      },
    },
  };
  selected.project.visualPolicy.override = "refinement.json";
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  await fs.writeFile(
    path.join(selected.root, "edition/refinement.json"),
    JSON.stringify(refinement) + "\n",
  );
  const output = path.join(selected.root, "refined-candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert.match(svg, /authorization: granted/u);
  assert.match(svg, /ON SOURCE RELATION/u);
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json"), "utf8"));
  assert.equal(candidate.obligations.static.views[0].assertionIds.length, 2);

  refinement.media.static.edges[0].relations[0].reference = "invented";
  await fs.writeFile(
    path.join(selected.root, "edition/refinement.json"),
    JSON.stringify(refinement) + "\n",
  );
  await assert.rejects(
    compileEditionCandidateInput(
      selected.requestPath,
      selected.requestSha256,
      path.join(selected.root, "forged-candidate"),
    ),
    { code: "scene_refinement_membership_mismatch" },
  );
});

test("a grouped entity may carry a scalar claim without inventing a source relation", async (t) => {
  const selected = await fixture(t, { reference: "entity:client" });
  selected.project.scope.selections[0].id = "selected-entity";
  selected.project.scope.selections.push({
    id: "selected-scalar",
    namespace: modelNamespace,
    kind: "reference",
    reference: "claim:observed",
    questions: ["condition"],
  });
  const groups = [
    {
      id: "client-group",
      label: "Client",
      elements: [{ namespace: modelNamespace, id: "client" }],
    },
  ];
  selected.project.presentation.static.views[0].groups = groups;
  selected.project.presentation.interactive.views[0].groups = structuredClone(groups);
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const output = path.join(selected.root, "entity-scalar-candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const html = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
  assert.match(svg, /ON SOURCE ENTITY/u);
  assert.match(html, /observed/u);
  assert.doesNotMatch(svg, /SOURCE RELATIONS<\/text>/u);
  const document = interactiveDocument(html);
  const reference = JSON.stringify([modelNamespace, "entity", "client"]);
  const occurrence = document.sourceReading.projection.pages[0].occurrences.find(
    (item) => item.reference === reference,
  );
  assert.deepEqual(occurrence.graphicIds, ["g-0", "n-0"]);
  assert.deepEqual(
    document.pages.overview.facts
      .filter((fact) => fact.reference === reference)
      .map((fact) => fact.graphicId)
      .sort(),
    occurrence.graphicIds,
  );
});

test("a view refuses an editor-declared forbidden group pair without inventing source truth", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["static"] });
  const view = selected.project.presentation.static.views[0];
  const separatedGroups = structuredClone(view.groups);
  view.forbiddenGroupPairs = [
    {
      members: [
        { namespace: modelNamespace, id: "client" },
        { namespace: modelNamespace, id: "server" },
      ],
      reason: "The selected client and server must remain separate stages.",
    },
  ];
  const compile = async () => {
    await fs.writeFile(
      path.join(selected.root, "edition/project.json"),
      JSON.stringify(selected.project) + "\n",
    );
    return compileEditionMeaning(
      await materializeBuildRequestInput(selected.requestPath, selected.requestSha256),
    );
  };
  await compile();

  view.groups = [
    {
      id: "merged",
      label: "One stage",
      elements: view.forbiddenGroupPairs[0].members,
    },
  ];
  await assert.rejects(compile(), { code: "edition_forbidden_group_pair" });

  view.groups = separatedGroups;
  view.forbiddenGroupPairs[0].members[1].id = "unselected";
  await assert.rejects(compile(), { code: "edition_forbidden_group_pair_unbound" });

  view.forbiddenGroupPairs[0].members[1].id = "server";
  view.forbiddenGroupPairs.push({
    ...structuredClone(view.forbiddenGroupPairs[0]),
    members: [...view.forbiddenGroupPairs[0].members].reverse(),
  });
  await assert.rejects(compile(), { code: "edition_project_invalid" });
});
