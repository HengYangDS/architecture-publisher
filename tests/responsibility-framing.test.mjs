import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";
import { compileEditionCandidateInput } from "../packages/publisher/src/compiler/edition.mjs";
import { compileEditionMeaning } from "../packages/publisher/src/compiler/meaning.mjs";
import { composeStaticResponsibilityScene } from "../packages/publisher/src/scene/static/responsibility.mjs";
import { composeStaticResponsibilitySvg } from "../packages/publisher/renderers/svg/responsibility.mjs";
import { fixture, figureIcons } from "./fixtures/claim-selection.mjs";

test("one complete selected Claim builds PNG6000 without requiring unrelated source meaning", async (t) => {
  const selected = await fixture(t);
  for (const reference of ["entity:client", "entity:server", "relation:request"])
    selected.project.scope.selections.push({
      id: reference.replace(":", "-"),
      namespace: "fixture/claims",
      kind: "reference",
      reference,
      questions: ["condition"],
    });
  const view = selected.project.presentation.static.views[0];
  view.groups = ["client", "server"].map((id) => ({
    id,
    label: id,
    elements: [{ namespace: "fixture/claims", id }],
  }));
  view.form = {
    schema: "architecture.visual-form/v1",
    kind: "responsibility",
    roles: ["client", "server"].map((group) => ({ group, basis: "selected-claim" })),
    handoffs: [{ from: "client", to: "server", basis: "selected-claim" }],
  };
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.requestPath, selected.requestSha256),
  );
  const scene = composeStaticResponsibilityScene(meaning);
  assert.equal(scene.claimCards.length, 1);
  assert.equal(scene.claimCards[0].id, "intended");
  assert.equal(scene.claimCards[0].facts.length, 12);
  const original = structuredClone(scene);
  const composed = composeStaticResponsibilitySvg(scene, { icons: figureIcons });
  const svg = composed.bytes.toString("utf8");
  const rasterHeight = Math.ceil(
    (6000 * composed.scene.layout.height) / composed.scene.layout.width,
  );
  assert.ok(
    6000 * rasterHeight <= 32 * 1024 * 1024,
    `complete content must fit the existing pixel budget: 6000 × ${rasterHeight}`,
  );
  const text = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
    .map(([, value]) => value)
    .join(" ");
  for (const fact of scene.claimCards[0].facts) {
    assert.ok(text.includes(fact.label), fact.label);
    assert.ok(text.includes(fact.value), fact.value);
  }
  const sharedRow = ["target", "affirmed", "complete"].map(
    (value) => svg.match(new RegExp(`<text[^>]* y="([^"]+)"[^>]*>${value}</text>`, "u"))?.[1],
  );
  assert.ok(sharedRow.every((y) => y !== undefined));
  assert.equal(
    new Set(sharedRow).size,
    1,
    "one fact row shares its value baseline after wrapped labels",
  );
  assert.equal(composed.carriers.claims.length, 1);
  assert.equal(composed.carriers.claims[0].source.reference, "intended");
  for (const assertion of composed.carriers.assertions)
    for (const id of [
      ...assertion.nodeGraphicIds,
      ...assertion.relationGraphicIds,
      ...assertion.claimGraphicIds,
    ])
      assert.equal(typeof id, "string");
  assert.deepEqual(scene, original, "composition does not edit its selected source meaning");
  assert.deepEqual(composeStaticResponsibilitySvg(scene, { icons: figureIcons }), composed);
  const output = path.join(selected.root, "single-claim-candidate");
  const result = await compileEditionCandidateInput(
    selected.requestPath,
    selected.requestSha256,
    output,
  );
  assert.equal(result.status, "built");
  const png = await fs.readFile(path.join(output, "static/architecture.png"));
  assert.equal(png.readUInt32BE(16), 6000);
  assert.ok(png.readUInt32BE(16) * png.readUInt32BE(20) <= 32 * 1024 * 1024);
  const deliveredSvg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const claimMarkup = (value) => value.match(/<g data-graphic-id="c-0">[\s\S]*?<\/g>/u)?.[0];
  assert.equal(claimMarkup(deliveredSvg), claimMarkup(svg));
  assert.ok((await fs.stat(path.join(output, "interactive/architecture.html"))).size > 0);
});
