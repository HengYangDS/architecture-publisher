import assert from "node:assert/strict";
import test from "node:test";
import {
  composeStaticEditionSvg,
  composeStaticFigureSvg,
  loadFigureIconSupply,
} from "../packages/publisher/renderers/svg/index.mjs";
import { staticEditionScene } from "./fixtures/static-edition-scene.mjs";
import { selectMeasuredComposition } from "../packages/publisher/renderers/svg/composition.mjs";
import { rasterDimensions } from "../packages/publisher/renderers/resvg/public.mjs";

const icons = await loadFigureIconSupply();

function selectedClaims() {
  const scene = staticEditionScene();
  const relation = scene.sourceAssertionCarriers[0].relationRefs[0];
  scene.sourceAssertionCarriers[0].kind = "relation";
  scene.claimCards = Array.from({ length: 11 }, (_, index) => ({
    namespace: relation.namespace,
    id: `claim-${index}`,
    sha256: relation.sha256,
    facts: [
      { label: "Claim plane", value: "implemented" },
      { label: "Subject", value: "Alpha & one · component · role: selected source" },
      { label: "Predicate", value: "calls · entity · multiple" },
      { label: "Object", value: "Beta · component · role: selected destination" },
      { label: "Condition", value: "none declared" },
      { label: "Scope", value: `case ${index}: selected caller and exact destination only` },
      { label: "Claimed maturity", value: "implemented" },
      { label: "Claimant-declared validity", value: "affirmed" },
      { label: "Declared dependency coverage", value: "complete" },
      { label: "Selected claimant", value: "fixture-author" },
      { label: "Declared model owner", value: "fixture-owner" },
      { label: "Declared evidence authority", value: `Evidence ${index}: selected source bytes` },
    ],
  }));
  scene.claimRelationLinks = scene.claimCards.map((claim) => {
    const assertionId = `assertion-${claim.id}`;
    scene.sourceAssertionCarriers.push({
      assertionId,
      kind: "claim",
      nodeRefs: [],
      relationRefs: [],
      claimRefs: [{ namespace: claim.namespace, reference: claim.id, sha256: claim.sha256 }],
    });
    return { claimAssertionId: assertionId, relationAssertionId: "source-shape" };
  });
  return {
    id: scene.editorialViewId,
    scene,
    rendered: composeStaticEditionSvg(scene, { icons, idPrefix: "static-view-0-", fragment: true }),
  };
}

function visibleText(markup) {
  return [...markup.matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
    .map(([, value]) => value.replaceAll("&amp;", "&"))
    .join("");
}

function figure(selected, rasterWidth) {
  return composeStaticFigureSvg({
    title: "Selected source claims",
    summary: "Read the architecture before its exact evidence.",
    rasterWidth,
    views: [selected],
  });
}

test("the receiving figure reflows complete claims instead of inheriting their provisional width", () => {
  const selected = selectedClaims();
  const before = structuredClone(selected.scene);
  const result = figure(selected, 1000);
  const svg = result.bytes.toString("utf8");

  assert(result.width <= 1000);
  assert.equal(result.placements.length, 1);
  for (const [index, claim] of selected.scene.claimCards.entries()) {
    const markup = svg.match(
      new RegExp(`<g data-graphic-id="static-view-0-c-${index}">([\\s\\S]*?)</g>`, "u"),
    )?.[1];
    assert(markup, claim.id);
    const content = visibleText(markup);
    for (const { label, value } of claim.facts) {
      const text = `${label}: ${value}`;
      assert(content.includes(text) || visibleText(svg).includes(text), text);
    }
  }
  assert.deepEqual(selected.scene, before);
  assert.equal(selected.rendered.carriers.claims.length, 11);
});

test("the primary architecture spans its reading area before claim detail", () => {
  const selected = selectedClaims();
  const result = figure(selected, 2400);
  const svg = result.bytes.toString("utf8");

  assert.doesNotMatch(svg, /data-claim-placement="beside-source"/u);
  const structure = svg.match(
    /<g data-static-structure="true" transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)">/u,
  );
  assert(structure, "the complete primary graph needs one uniform receiving-area transform");
  const [, x, y, scale] = structure.map(Number);
  const bounds = selected.rendered.parts.bounds;
  assert(Math.abs(x + bounds.x * scale) <= 0.02);
  assert(Math.abs(bounds.width * scale - result.placements[0].width) <= 0.05);
  const detail = svg.match(
    /data-claim-placement="below-source" transform="translate\([-\d.]+ ([-\d.]+)\)"/u,
  );
  assert(detail);
  assert(Number(detail[1]) > y + (bounds.y + bounds.height) * scale);
});

test("a tall narrow architecture fits both reading-frame axes without shrinking or losing claims", () => {
  const selected = selectedClaims();
  selected.scene.nodes[1].x = 0;
  selected.scene.nodes[1].y = 640;
  selected.scene.edges[0].points = [
    [80, 80],
    [80, 640],
  ];
  selected.scene.bounds = { x: 0, y: 0, width: 160, height: 720 };
  const before = structuredClone(selected.scene);
  selected.rendered = composeStaticEditionSvg(selected.scene, {
    icons,
    idPrefix: "static-view-0-",
    fragment: true,
  });
  const result = figure(selected, 6000);
  const svg = result.bytes.toString("utf8");
  const structure = svg.match(
    /<g data-static-structure="true" transform="translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)">/u,
  );
  assert(structure);
  const [, x, , scale] = structure.map(Number);
  const bounds = selected.rendered.parts.bounds;
  const receivingWidth = result.placements[0].width;

  assert(scale >= 1, "native graph typography must not be reduced");
  assert(bounds.width * scale <= receivingWidth);
  assert(bounds.height * scale <= (3 / 4) * receivingWidth + 0.05 || scale === 1);
  assert(Math.abs(x + bounds.x * scale - (receivingWidth - bounds.width * scale) / 2) <= 0.02);
  assert.doesNotThrow(() => rasterDimensions(result.width, result.height, result.rasterWidth));
  assert(svg.includes(selected.rendered.parts.graph), "the complete routed graph is unchanged");
  assert.equal((svg.match(/data-graphic-id="static-view-0-c-\d+"/gu) ?? []).length, 11);
  assert.deepEqual(selected.scene, before);
});

test("an infeasible smaller canvas cannot discard a raster-feasible receiving frame", () => {
  const small = { width: 620, height: 1000, rasterWidth: 6000 };
  const complete = { width: 2000, height: 1100, rasterWidth: 6000 };
  const result = selectMeasuredComposition([small, complete], (candidate) => candidate, []);

  assert.equal(result, complete);
  assert.deepEqual(rasterDimensions(result.width, result.height, result.rasterWidth), {
    width: 6000,
    height: 3300,
  });
});

test("shared claim context uses the available width without a tall left-only block", () => {
  const selected = selectedClaims();
  const markup = selected.rendered.parts.claim.reflow(1800).markup;
  const positions = ["Claim plane", "Condition", "Claimed maturity"].map((label) => {
    const match = markup.match(
      new RegExp(`<text x="([-\\d.]+)" y="([-\\d.]+)"[^>]*>${label}:`, "u"),
    );
    assert(match, label);
    return match.slice(1).map(Number);
  });

  assert(positions[0][0] < positions[1][0]);
  assert(positions[1][0] < positions[2][0]);
  assert.equal(positions[0][1], positions[1][1]);
  assert.equal(positions[0][1], positions[2][1]);
  for (const label of ["Claim plane", "Condition", "Claimed maturity"])
    assert.equal((visibleText(markup).match(new RegExp(`${label}:`, "gu")) ?? []).length, 1);
});

test("claim records share a measured row height despite different fact lengths", () => {
  const selected = selectedClaims();
  selected.scene.claimCards[0].facts.find(({ label }) => label === "Scope").value =
    "Only selected callers and exact destinations are covered; the observed state does not establish runtime behavior. ".repeat(
      3,
    );
  selected.rendered = composeStaticEditionSvg(selected.scene, {
    icons,
    idPrefix: "static-view-0-",
    fragment: true,
  });
  const records = [
    ...selected.rendered.parts.claim
      .reflow(1800)
      .markup.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/gu),
  ].map(([, x, y, width, height]) => ({ x: Number(x), y, width, height }));

  assert.equal(records.length, 11);
  for (const y of new Set(records.map((record) => record.y))) {
    const row = records.filter((record) => record.y === y);
    assert.equal(new Set(row.map((record) => record.height)).size, 1);
    assert.equal(new Set(row.map((record) => record.width)).size, 1);
  }
});
