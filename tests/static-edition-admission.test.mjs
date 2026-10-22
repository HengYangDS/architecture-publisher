import assert from "node:assert/strict";
import test from "node:test";
import * as svg from "../packages/publisher/renderers/svg/index.mjs";
import { wrapStaticText } from "../packages/publisher/renderers/svg/text.mjs";
import { staticEditionScene } from "./fixtures/static-edition-scene.mjs";
import { figureIcons, linkedMixedScene } from "./fixtures/static-edition-svg.mjs";

test("static rendering rejects unselected options and insufficient glyph clearance", () => {
  for (const options of [
    { idPrefix: 1 },
    { idPrefix: "invalid/" },
    { fragment: "yes" },
    { color: "red" },
  ]) {
    assert.throws(
      () => svg.composeStaticEditionSvg(staticEditionScene(), { icons: figureIcons, ...options }),
      { code: "static_edition_render_options_invalid" },
    );
  }
  const scene = staticEditionScene();
  scene.nodes[0].height = 63;
  scene.bounds.height = 80;
  assert.throws(() => svg.composeStaticEditionSvg(scene, { icons: figureIcons }), {
    code: "static_edition_node_unrepresentable",
  });
  scene.nodes[0].height = 80;
  scene.nodes[0].width = 95;
  assert.throws(() => svg.composeStaticEditionSvg(scene, { icons: figureIcons }), {
    code: "static_edition_node_unrepresentable",
  });
});

test("the renderer rejects infeasible geometry without cropping selected meaning", () => {
  const cases = [
    [
      "nonfinite node",
      (input) => (input.nodes[0].x = Number.NaN),
      "static_edition_geometry_invalid",
    ],
    [
      "unbounded node",
      (input) => (input.nodes[0].x = 11_000_000),
      "static_edition_geometry_invalid",
    ],
    ["negative width", (input) => (input.nodes[0].width = -1), "static_edition_geometry_invalid"],
    ["negative height", (input) => (input.nodes[0].height = -1), "static_edition_geometry_invalid"],
    ["missing route", (input) => (input.edges[0].points = null), "static_edition_geometry_invalid"],
    [
      "one route point",
      (input) => (input.edges[0].points = [[160, 40]]),
      "static_edition_geometry_invalid",
    ],
    [
      "malformed point",
      (input) => (input.edges[0].points[0] = [160]),
      "static_edition_geometry_invalid",
    ],
    [
      "absent endpoint",
      (input) => (input.edges[0].to.id = "absent"),
      "static_edition_relation_endpoint_missing",
    ],
    [
      "unsupported direction",
      (input) => (input.edges[0].relations[0].direction = "inverse"),
      "static_edition_direction_unrepresentable",
    ],
    [
      "mixed directions",
      (input) => {
        const relation = {
          ...input.edges[0].relations[0],
          reference: "relation:5:2",
          direction: "bidirectional",
        };
        input.edges[0].relations.push(relation);
        input.sourceAssertionCarriers[0].relationRefs.push({
          namespace: relation.namespace,
          reference: relation.reference,
          sha256: relation.sha256,
        });
      },
      "static_edition_direction_unrepresentable",
    ],
    ["narrow node", (input) => (input.nodes[0].width = 95), "static_edition_node_unrepresentable"],
    ["short node", (input) => (input.nodes[0].height = 63), "static_edition_node_unrepresentable"],
    [
      "huge canvas",
      (input) => {
        input.nodes[1].x = 11_500;
        input.edges[0].points[1][0] = 11_500;
        input.bounds.width = 11_660;
      },
      "static_edition_geometry_invalid",
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), { code }, name);
  }
});

test("source carriers cannot duplicate, forge, or omit visible graph members", () => {
  const cases = [
    [
      "duplicate node identity",
      (input) => input.nodes.push(structuredClone(input.nodes[0])),
      "static_edition_carrier_ambiguous",
    ],
    [
      "duplicate relation identity",
      (input) => input.edges[0].relations.push(structuredClone(input.edges[0].relations[0])),
      "static_edition_carrier_ambiguous",
    ],
    [
      "duplicate claim identity",
      (input) => {
        const claim = {
          namespace: "fixture/claims",
          id: "same",
          sha256: "a".repeat(64),
          facts: [{ label: "Claim plane", value: "implemented" }],
        };
        input.claimCards = [claim, structuredClone(claim)];
      },
      "static_edition_carrier_ambiguous",
    ],
    [
      "empty assertion identity",
      (input) => (input.sourceAssertionCarriers[0].assertionId = ""),
      "static_edition_carrier_invalid",
    ],
    [
      "duplicate assertion identity",
      (input) =>
        input.sourceAssertionCarriers.push(structuredClone(input.sourceAssertionCarriers[0])),
      "static_edition_carrier_invalid",
    ],
    [
      "unbound assertion",
      (input) => {
        input.sourceAssertionCarriers[0].nodeRefs = [];
        input.sourceAssertionCarriers[0].relationRefs = [];
      },
      "static_edition_carrier_invalid",
    ],
    [
      "malformed node reference",
      (input) => (input.sourceAssertionCarriers[0].nodeRefs[0] = null),
      "static_edition_carrier_invalid",
    ],
    [
      "invented node reference",
      (input) => (input.sourceAssertionCarriers[0].nodeRefs[0].id = "invented"),
      "static_edition_carrier_invalid",
    ],
    [
      "malformed relation reference",
      (input) => (input.sourceAssertionCarriers[0].relationRefs[0] = null),
      "static_edition_carrier_invalid",
    ],
    [
      "invented relation reference",
      (input) => (input.sourceAssertionCarriers[0].relationRefs[0].reference = "invented"),
      "static_edition_carrier_invalid",
    ],
    [
      "malformed claim reference",
      (input) => (input.sourceAssertionCarriers[0].claimRefs = [null]),
      "static_edition_carrier_invalid",
    ],
    [
      "invented claim reference",
      (input) =>
        (input.sourceAssertionCarriers[0].claimRefs = [
          { namespace: "fixture/claims", reference: "invented", sha256: "a".repeat(64) },
        ]),
      "static_edition_carrier_invalid",
    ],
    [
      "unclaimed node",
      (input) => input.sourceAssertionCarriers[0].nodeRefs.pop(),
      "static_edition_carrier_unclaimed",
    ],
    [
      "unclaimed relation",
      (input) => (input.sourceAssertionCarriers[0].relationRefs = []),
      "static_edition_carrier_unclaimed",
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), { code }, name);
  }
});

test("long text wraps without truncating source language or hiding editorial scope", () => {
  const input = staticEditionScene();
  input.title = `${"x".repeat(52)} Y`;
  input.nodes[0].label = "Alpha service one";
  input.nodes[0].kind = null;
  input.nodes[0].height = 86;
  input.bounds.height = 86;
  input.editorialAssertions.push({
    id: "editorial-note",
    kind: "editorial",
    statement: "Editorial judgment remains attributed.",
    proponent: "fixture-editor",
    semanticStatus: "editor-attributed-unverified",
  });
  input.limitsByQuestion.shape.push({
    kind: "scope",
    reason: "view-membership-upstream-computed-unqualified",
  });
  const result = svg.composeStaticEditionSvg(input, { icons: figureIcons }).bytes.toString("utf8");
  assert.match(result, /Alpha service/u);
  assert.match(result, /one/u);
  assert.match(result, /Editorial judgment remains attributed/u);
  assert.match(result, /view-membership-/u);
  assert.match(result, /upstream-computed-/u);
  const titleLines = [...result.matchAll(/<text[^>]*font-size="34"[^>]*>(.*?)<\/text>/gu)];
  assert.equal(titleLines.map(([, line]) => line).join(""), input.title);
  assert.equal(titleLines.at(-1)[1].trim(), "Y");
});

test("two label lines cannot collide with a kind label inside a short node", () => {
  const input = staticEditionScene();
  input.nodes[0].height = 64;
  input.nodes[0].label = "Alpha service one";
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_node_unrepresentable",
  });
});

test("static wrapping preserves exact source whitespace across every line break", () => {
  const source = '"alpha  beta   gamma - delta"';
  const lines = wrapStaticText(source, 90, 14);
  assert(lines.length > 1);
  assert.equal(lines.join(""), source);
  assert.equal(wrapStaticText(source, 1000, 14).join(""), source);
  const input = linkedMixedScene();
  input.claimCards[0].facts = [{ label: "Value", value: source }];
  const result = svg.composeStaticEditionSvg(input, { icons: figureIcons }).bytes.toString("utf8");
  assert(result.includes("&quot;alpha  beta   gamma - delta&quot;"));
  assert.match(result, /xml:space="preserve"/u);
});

test("unspaced reader limits wrap without changing characters or inventing relation qualifiers", () => {
  const input = staticEditionScene();
  input.limitsByQuestion.shape.push({ kind: "scope", reason: "x".repeat(100) });
  input.edges[0].relations[0].label = null;
  input.edges[0].relations[0].kind = null;
  const result = svg.composeStaticEditionSvg(input, { icons: figureIcons }).bytes.toString("utf8");
  const pieces = [...result.matchAll(/<text[^>]*>(x+)<\/text>/gu)].map((match) => match[1]);
  assert.equal(pieces.join(""), "x".repeat(100));
  assert.match(result, /Alpha &amp; one → Beta<\/text>/u);
  assert.doesNotMatch(result, /Alpha &amp; one → Beta ·/u);
});

test("absence of a width selects a generic default, not a named adopter preset", () => {
  const input = staticEditionScene();
  input.requestedWidth = null;
  assert.equal(svg.composeStaticEditionSvg(input, { icons: figureIcons }).rasterWidth, 1800);
});

test("missing or excessive text and an overlong poster fail rather than truncate", () => {
  const cases = [
    ["missing title", (input) => (input.title = ""), "static_edition_text_unrepresentable"],
    [
      "missing node label",
      (input) => (input.nodes[0].label = null),
      "static_edition_text_unrepresentable",
    ],
    [
      "too many title lines",
      (input) => (input.title = "word ".repeat(500)),
      "static_edition_text_unrepresentable",
    ],
    [
      "too many reader limits",
      (input) =>
        (input.limitsByQuestion.shape = Array.from({ length: 600 }, (_, index) => ({
          kind: "scope",
          reason: `limit ${index}`,
        }))),
      "static_edition_geometry_invalid",
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), { code }, name);
  }
});
