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

import { validateVisibleSelection } from "../packages/publisher/src/compiler/coverage.mjs";

import { composeStaticEditionSvg } from "../packages/publisher/renderers/svg/index.mjs";

import { verifySelectedCandidateReplay } from "../packages/publisher/src/qualification/index.mjs";

import { claimModel } from "./fixtures/claim-model.mjs";

import { composeStaticSelectionLayout } from "../packages/publisher/src/scene/static/selection.mjs";

import { claimCard } from "../packages/publisher/src/scene/claim-card.mjs";
import { composeStaticGeometry } from "../packages/publisher/src/compiler/static-geometry.mjs";

import {
  figureIcons,
  modelNamespace,
  fixture,
  groupedMixedFixture,
  twoRelationClaimModel,
} from "./fixtures/claim-selection.mjs";

test("typed claim dimensions use stable code-point order instead of host collation", async (t) => {
  const model = claimModel();
  model.claims.intended.condition = { z: "tail", ä: "accent" };
  const selected = await fixture(t, { model });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const condition = claimCard(meaning.native.selections[0]).facts.find(
    ({ label }) => label === "Condition",
  );
  assert.equal(condition.value, 'z: tail · "ä": accent');
});

test("static entity meaning is allocated once to its measured node, not repeated in each claim", async (t) => {
  const model = twoRelationClaimModel();
  model.entities.server.qualifiers = { operations: ["discover", "inspect", "apply", "verify"] };
  const selected = await groupedMixedFixture(t, { model });
  selected.project.scope.selections.push(
    {
      id: "second-relation",
      namespace: modelNamespace,
      kind: "reference",
      reference: "relation:second",
      questions: ["condition"],
    },
    {
      id: "second-claim",
      namespace: modelNamespace,
      kind: "reference",
      reference: "claim:aaa",
      questions: ["condition"],
    },
  );
  for (const medium of ["static", "interactive"])
    selected.project.presentation[medium].views[0].groups?.push({
      id: "other-group",
      label: "Other",
      elements: [{ namespace: modelNamespace, id: "other" }],
    });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  for (const grouped of [true, false]) {
    const scoped = structuredClone(meaning);
    if (!grouped) delete scoped.editorial.presentation.static.views[0].groups;
    let textMeasurer;
    const layout = await composeStaticSelectionLayout(scoped, async (geometry) => {
      const result = await composeStaticGeometry(geometry);
      textMeasurer = result.textMeasurer;
      return result;
    });
    const scene = composeStaticEditionScene(scoped, layout);
    const rendered = composeStaticEditionSvg(scene, { icons: figureIcons, textMeasurer });
    const content = rendered.bytes.toString("utf8");
    const node = scene.nodes.find(({ id }) => id === "server");
    assert.deepEqual(node.qualifiers, model.entities.server.qualifiers);
    const description = 'operations: ["discover","inspect","apply","verify"]';
    const painted = [...content.matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
      .map(([, text]) => text.replaceAll("&quot;", '"'))
      .join("");
    assert.equal(
      painted.split(description).length - 1,
      1,
      "one exact entity carrier owns its complete qualifiers",
    );
    for (const claim of scene.claimCards) {
      assert(!claim.facts.some(({ value }) => value.includes(description)));
      assert.equal(claim.facts.find(({ label }) => label === "Scope").value, "environment: local");
    }
    assert.equal(rendered.carriers.nodes.length, 3);
    assert.equal(rendered.carriers.claims.length, 2);
    assert.doesNotThrow(() => validateVisibleSelection(scoped, "static", scene, rendered.carriers));
    const lost = structuredClone(scene);
    delete lost.nodes.find(({ id }) => id === "server").qualifiers;
    assert.throws(() => composeStaticEditionSvg(lost, { icons: figureIcons, textMeasurer }), {
      code: "static_edition_node_unrepresentable",
    });
    assert.throws(() => validateVisibleSelection(scoped, "static", lost, rendered.carriers), {
      code: "edition_visible_coverage_mismatch",
    });
    const clipped = structuredClone(scene);
    clipped.nodes.find(({ id }) => id === "server").textLayout.body.pop();
    assert.throws(() => composeStaticEditionSvg(clipped, { icons: figureIcons, textMeasurer }), {
      code: "static_edition_node_unrepresentable",
    });
    const overflow = structuredClone(scene);
    overflow.nodes.find(({ id }) => id === "server").textLayout.baselines.at(-1).baseline += 10000;
    assert.throws(() => composeStaticEditionSvg(overflow, { icons: figureIcons, textMeasurer }), {
      code: "static_edition_node_unrepresentable",
    });
    const complete = claimCard(
      meaning.native.selections.find(({ target }) => target.id === "intended"),
    );
    assert(
      complete.facts.some(({ value }) => value.includes(description)),
      "unallocated and Inspect records stay complete",
    );
  }
});

test("typed claim dimensions cannot collide across scalar types or display separators", async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const source = meaning.native.selections[0];
  const projected = (condition) => {
    const changed = structuredClone(source);
    changed.members.claims[0].condition = condition;
    return claimCard(changed).facts.find(({ label }) => label === "Condition").value;
  };
  assert.notEqual(projected({ enabled: true }), projected({ enabled: "true" }));
  assert.notEqual(projected({ a: "1 · b: 2" }), projected({ a: "1", b: "2" }));
  assert.notEqual(projected({ "a: 1 · b": "2" }), projected({ a: "1", b: "2" }));
  assert.notEqual(projected({ count: 1 }), projected({ count: "1" }));
  assert.notEqual(projected({ value: null }), projected({ value: "null" }));
  assert.equal(projected({ mode: "selected" }), "mode: selected");
  assert.equal(projected({ enabled: "true" }), 'enabled: "true"');
  assert.notEqual(projected({ value: "" }), projected({}));
  assert.notEqual(projected({ value: " selected" }), projected({ value: "selected" }));
});

test("static claim card order is stable across host collation settings", async (t) => {
  const model = claimModel();
  model.claims.z = structuredClone(model.claims.intended);
  model.claims.z.condition.case = "z";
  model.claims.ä = structuredClone(model.claims.intended);
  model.claims.ä.condition.case = "accent";
  const selected = await fixture(t, { model, reference: "claim:z" });
  selected.project.scope.selections.push({
    id: "accented-claim",
    namespace: modelNamespace,
    kind: "reference",
    reference: "claim:ä",
    questions: ["condition"],
  });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeStaticEditionScene(meaning, null);
  assert.deepEqual(
    scene.claimCards.map(({ id }) => id),
    ["z", "ä"],
  );
});

test("a selected relation and dependent claim build a source-bound static Candidate", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["static"] });
  const output = path.join(selected.root, "candidate");
  const built = await compileEditionCandidateInput(
    selected.requestPath,
    selected.requestSha256,
    output,
  );
  assert.deepEqual(built.media, ["static"]);
  const replay = await verifySelectedCandidateReplay({
    requestPath: selected.requestPath,
    requestSha256: selected.requestSha256,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  });
  assert.equal(replay.verdict, "match");
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json")));
  assert.deepEqual(Object.keys(candidate.media), ["static"]);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const painted = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
    .map((match) => match[1])
    .join(" ");
  assert(painted.includes("SOURCE CLAIMS"));
  assert(painted.includes("When may the client call?"));
  assert.match(painted, /calls/u);
  assert.deepEqual(
    [...svg.matchAll(/data-graphic-id="([^"]+)"/gu)].map((match) => match[1]).sort(),
    ["static-view-0-c-0", "static-view-0-n-0", "static-view-0-n-1", "static-view-0-r-0"],
  );
  assert.match(painted, /Claim plane: intended/u);
  assert.match(painted, /authorization: granted/u);
  assert(!svg.includes("fixture/claims"), "private source identity leaked into static SVG");
  assert.equal(selected.project.requiredAssertions, undefined);
});

test("two static views become one figure without merging their source assertions", async (t) => {
  const selected = await groupedMixedFixture(t, {
    model: twoRelationClaimModel(),
    media: ["static"],
  });
  selected.project.questions.push({
    id: "followup",
    audience: "maintainer",
    text: "When may the server call?",
  });
  selected.project.scope.selections.push(
    {
      id: "second-relation",
      namespace: modelNamespace,
      kind: "reference",
      reference: "relation:second",
      questions: ["followup"],
    },
    {
      id: "second-claim",
      namespace: modelNamespace,
      kind: "reference",
      reference: "claim:aaa",
      questions: ["followup"],
    },
  );
  selected.project.presentation.static.views.push({
    id: "followup",
    questions: ["followup"],
    groups: [
      {
        id: "shared-server",
        label: "Shared server",
        elements: [{ namespace: modelNamespace, id: "server" }],
      },
      {
        id: "other-target",
        label: "Other target",
        elements: [{ namespace: modelNamespace, id: "other" }],
      },
    ],
  });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );

  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json")));
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  assert.deepEqual(
    candidate.obligations.static.views.map(({ id }) => id),
    ["overview", "followup"],
  );
  assert.equal((svg.match(/<svg\b/gu) ?? []).length, 1);
  assert.equal((svg.match(/data-static-view=/gu) ?? []).length, 2);
  assert.equal((svg.match(/METHOD LIMITS/gu) ?? []).length, 0);
  assert(candidate.limits.includes("claim-model-provenance-unverified"));
  assert.doesNotMatch(svg, /claim-model-provenance-unverified/u);
  assert.equal((svg.match(/READER QUESTIONS/gu) ?? []).length, 0);
  assert.match(svg, /data-graphic-id="static-view-0-r-0"/u);
  assert.match(svg, /data-graphic-id="static-view-1-r-0"/u);
  assert.match(svg, /When may the client call\?/u);
  assert.match(svg, /When may the server call\?/u);
  assert.equal(candidate.media.static.artifacts.length, 2);
  assert(!svg.includes(modelNamespace), "private source identity leaked into static SVG");
});

test("one mixed static claim keeps complete facts in one ordered receiving column", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["static"] });
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeStaticEditionScene(meaning, composeStaticSelectionLayout(meaning));
  const rendered = composeStaticEditionSvg(scene, { icons: figureIcons });
  const svg = rendered.bytes.toString("utf8");
  const claim = /<g data-graphic-id="c-0">([\s\S]*?)<\/g>/u.exec(svg)?.[1];
  assert(claim);
  const separator = /<line x1="([\d.]+)"[^>]*x2="([\d.]+)"/u.exec(claim);
  assert(separator);
  assert(Number(separator[2]) - Number(separator[1]) >= rendered.width - 121);
  const subject = /<text x="([\d.]+)" y="([\d.]+)"[^>]*>Subject:/u.exec(claim);
  const claimant = /<text x="([\d.]+)" y="([\d.]+)"[^>]*>Selected claimant:/u.exec(claim);
  assert(subject && claimant);
  assert.equal(claimant[1], subject[1]);
  assert(Number(claimant[2]) > Number(subject[2]));
  const text = [...claim.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/gu)];
  for (const row of text) assert.equal(row[1], separator[1]);
  for (let index = 1; index < text.length; index++)
    assert(Number(text[index][2]) > Number(text[index - 1][2]));
  const visible = text
    .map(([, , , value]) => value.replaceAll("&amp;", "&").replaceAll("&quot;", '"'))
    .join("");
  for (const { label, value } of scene.claimCards[0].facts)
    assert(visible.includes(`${label}: ${value}`), label);
  assert.equal(rendered.carriers.claims.length, 1);
});

test("mixed static claims follow source-relation reading order rather than claim IDs", async (t) => {
  const selected = await groupedMixedFixture(t, { model: twoRelationClaimModel() });
  selected.project.scope.selections.push(
    {
      id: "second-relation",
      namespace: modelNamespace,
      kind: "reference",
      reference: "relation:second",
      questions: ["condition"],
    },
    {
      id: "first-claim",
      namespace: modelNamespace,
      kind: "reference",
      reference: "claim:aaa",
      questions: ["condition"],
    },
  );
  selected.project.presentation.static.views[0].groups.push({
    id: "other-group",
    label: "Other",
    elements: [{ namespace: modelNamespace, id: "other" }],
  });
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const scene = composeStaticEditionScene(meaning, composeStaticSelectionLayout(meaning));
  const rendered = composeStaticEditionSvg(scene, { icons: figureIcons });
  assert.doesNotThrow(() => validateVisibleSelection(meaning, "static", scene, rendered.carriers));
  const svg = rendered.bytes.toString("utf8");
  const first = svg.indexOf("ON SOURCE RELATION 01");
  const second = svg.indexOf("ON SOURCE RELATION 02");
  assert(first >= 0 && second >= 0);
  assert(first < second, "claims must follow visible relation numbering");
});

test("mixed static media rejects a forged graphic link or source dependency", async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeStaticSelectionLayout(meaning);
  const scene = composeStaticEditionScene(meaning, layout);
  const rendered = composeStaticEditionSvg(scene, { icons: figureIcons });
  assert.doesNotThrow(() => validateVisibleSelection(meaning, "static", scene, rendered.carriers));

  const forged = structuredClone(scene);
  forged.claimRelationLinks[0].relationAssertionId = "not-selected";
  assert.throws(() => composeStaticEditionSvg(forged, { icons: figureIcons }), {
    code: "static_edition_claim_relation_invalid",
  });
  const malformed = structuredClone(scene);
  malformed.claimRelationLinks[0] = null;
  assert.throws(() => composeStaticEditionSvg(malformed, { icons: figureIcons }), {
    code: "static_edition_claim_relation_invalid",
  });

  const retargeted = structuredClone(scene);
  retargeted.edges[0].relations[0].reference = "invented";
  retargeted.sourceAssertionCarriers[0].relationRefs[0].reference = "invented";
  const retargetedCarriers = composeStaticEditionSvg(retargeted, { icons: figureIcons }).carriers;
  assert.throws(() => validateVisibleSelection(meaning, "static", retargeted, retargetedCarriers), {
    code: "edition_visible_coverage_mismatch",
  });

  const falseDependency = structuredClone(meaning);
  falseDependency.native.selections[1].members.claims[0].dependsOn = [];
  assert.throws(
    () => validateVisibleSelection(falseDependency, "static", scene, rendered.carriers),
    { code: "edition_visible_coverage_mismatch" },
  );

  const svg = rendered.bytes.toString("utf8");
  const cardY = Number(/<g data-graphic-id="c-0">\s*<text[^>]* y="([^"]+)"/u.exec(svg)?.[1]);
  const translatedY = Number(/<g transform="translate\([^ ]+ ([^)]+)\)"/u.exec(svg)?.[1]);
  assert(Number.isFinite(cardY) && Number.isFinite(translatedY));
  assert(cardY > translatedY + scene.bounds.y + scene.bounds.height + 60);
});

test("static composition retains renderer defaults when optional editorial copy and width are absent", async (t) => {
  for (const structural of [false, true]) {
    const selected = structural ? await groupedMixedFixture(t) : await fixture(t);
    delete selected.project.narrative.summary;
    delete selected.project.presentation.static.width;
    await fs.writeFile(
      path.join(selected.root, "edition/project.json"),
      JSON.stringify(selected.project) + "\n",
    );
    const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
    const meaning = await compileEditionMeaning(input);
    const layout = structural ? composeStaticSelectionLayout(meaning) : null;
    const scene = composeStaticEditionScene(meaning, layout);
    assert.equal(scene.requestedWidth, 6000);
    assert.equal(Object.hasOwn(scene, "summary"), false);
    const rendered = composeStaticEditionSvg(scene, { icons: figureIcons });
    assert.equal(rendered.rasterWidth, 6000);
    assert.equal(rendered.carriers.claims.length, 1);
    assert.equal(rendered.carriers.nodes.length, structural ? 2 : 0);
  }
});

test("static source binding rejects contradictory selected identities before geometry can conceal them", async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeStaticSelectionLayout(meaning);
  const conflicting = structuredClone(meaning);
  const claimAssertion = conflicting.assertions.find(
    (assertion) => assertion.selection === conflicting.native.selections[1].selectionId,
  );
  conflicting.media.static.views[0].assertionIds =
    conflicting.media.static.views[0].assertionIds.filter((id) => id !== claimAssertion.id);
  const relation = structuredClone(conflicting.native.selections[0]);
  relation.selectionId = "contradictory-source";
  relation.members.elements[0].label = "A different source claim";
  conflicting.native.selections.push(relation);
  conflicting.assertions.push({ id: "conflict", kind: "source", selection: relation.selectionId });
  conflicting.media.static.views[0].assertionIds.push("conflict");
  assert.throws(() => composeStaticEditionScene(conflicting, layout), {
    code: "static_scene_semantic_conflict",
  });
});

test("static composition refuses invalid route-caption bounds instead of emitting a cropped figure", async (t) => {
  const selected = await groupedMixedFixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const layout = composeStaticSelectionLayout(meaning);
  for (const caption of [null, [], { box: { x: 0, y: 0, w: 0, h: 24 } }]) {
    const changed = structuredClone(layout);
    changed.edges[0].caption = caption;
    assert.throws(() => composeStaticEditionScene(meaning, changed), {
      code: "static_scene_geometry_invalid",
    });
  }
  const unsupported = structuredClone(meaning);
  unsupported.editorial.presentation.static.views[0].form = { kind: "unimplemented" };
  assert.throws(() => composeStaticEditionScene(unsupported, layout), {
    code: "edition_visual_form_renderer_unavailable",
  });
});
