import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { validateSvg } from "../packages/publisher/renderers/resvg/public.mjs";
import { rasterizeBundle as rasterize } from "../packages/publisher/src/rendering/raster.mjs";
import * as svg from "../packages/publisher/renderers/svg/index.mjs";
import { staticEditionScene } from "./fixtures/static-edition-scene.mjs";
import { writeSourceBundle } from "../packages/publisher/src/source/write.mjs";
import { figureIcons, linkedMixedScene } from "./fixtures/static-edition-svg.mjs";

test("an editorial-only scene remains truthful and does not manufacture structure", () => {
  const input = staticEditionScene();
  input.nodes = [];
  input.edges = [];
  input.bounds = null;
  input.sourceAssertionCarriers = [];
  input.editorialAssertions = [
    {
      id: "editorial-note",
      kind: "editorial",
      statement: "No source graph was selected.",
      proponent: "fixture-editor",
      semanticStatus: "editor-attributed-unverified",
    },
  ];
  const result = svg.composeStaticEditionSvg(input, { icons: figureIcons }).bytes.toString("utf8");
  assert.match(result, /No source graph was selected/u);
  assert.match(result, /fixture-editor/u);
  assert.match(result, /unverified/u);
  assert.match(result, /SOURCE STRUCTURE/u);
  assert.doesNotMatch(result, /SOURCE CLAIMS/u);
  assert.doesNotMatch(result, /data-graphic-id/u);
  for (const field of ["proponent", "semanticStatus"]) {
    const invalid = structuredClone(input);
    delete invalid.editorialAssertions[0][field];
    assert.throws(() => svg.composeStaticEditionSvg(invalid, { icons: figureIcons }), {
      code: "static_edition_editorial_invalid",
    });
  }
});

test("static claims factor only exact shared context while retaining each claim anchor", () => {
  const input = staticEditionScene();
  input.nodes = [];
  input.edges = [];
  input.bounds = null;
  input.claimCards = [
    {
      namespace: "fixture/claims",
      id: "first",
      sha256: "a".repeat(64),
      facts: [
        { label: "Claim plane", value: "implemented" },
        { label: "Subject", value: "Client" },
        { label: "Predicate", value: "calls" },
        { label: "Object", value: "Server" },
        { label: "Condition", value: "none declared" },
        { label: "Scope", value: "local" },
      ],
    },
    {
      namespace: "fixture/claims",
      id: "second",
      sha256: "a".repeat(64),
      facts: [
        { label: "Claim plane", value: "implemented" },
        { label: "Subject", value: "Gateway" },
        { label: "Predicate", value: "routes" },
        { label: "Object", value: "Worker" },
        { label: "Condition", value: "none declared" },
        { label: "Scope", value: "remote" },
      ],
    },
  ];
  input.sourceAssertionCarriers = input.claimCards.map(({ namespace, id, sha256 }) => ({
    assertionId: id,
    selectionId: id,
    kind: "claim",
    nodeRefs: [],
    relationRefs: [],
    claimRefs: [{ namespace, reference: id, sha256 }],
  }));

  const first = svg.composeStaticEditionSvg(input, { icons: figureIcons });
  const content = first.bytes.toString("utf8");
  assert.match(content, /COMMON TO ALL SELECTED CLAIMS/u);
  assert.equal((content.match(/Claim plane: implemented/gu) ?? []).length, 1);
  assert.equal((content.match(/Condition: none declared/gu) ?? []).length, 1);
  for (const value of ["Subject: Client", "Subject: Gateway", "Scope: local", "Scope: remote"])
    assert.match(content, new RegExp(value, "u"));
  assert.equal(first.carriers.claims.length, 2);

  const sameAnchors = structuredClone(input);
  sameAnchors.claimCards[1].facts.find(({ label }) => label === "Subject").value = "Client";
  sameAnchors.claimCards[1].facts.find(({ label }) => label === "Scope").value = "local";
  const anchored = svg
    .composeStaticEditionSvg(sameAnchors, { icons: figureIcons })
    .bytes.toString("utf8");
  assert.equal((anchored.match(/Subject: Client/gu) ?? []).length, 2);
  assert.equal((anchored.match(/Scope: local/gu) ?? []).length, 2);

  input.claimCards[1].facts[0].value = "observed";
  const changed = svg.composeStaticEditionSvg(input, { icons: figureIcons }).bytes.toString("utf8");
  assert.equal((changed.match(/Claim plane: implemented/gu) ?? []).length, 1);
  assert.equal((changed.match(/Claim plane: observed/gu) ?? []).length, 1);
});

test("a mixed graph and claim plate require exact source-bound links", () => {
  const input = linkedMixedScene();
  delete input.claimRelationLinks;
  assert.throws(() => svg.composeStaticEditionSvg(input, { icons: figureIcons }), {
    code: "static_edition_claim_relation_invalid",
  });
});

test("a static renderer refuses unbound claim and group authoring before painting", () => {
  for (const [name, mutate, code] of [
    [
      "duplicate claim fact",
      (scene) => {
        scene.claimCards[0].facts.push(structuredClone(scene.claimCards[0].facts[0]));
      },
      "static_edition_claim_invalid",
    ],
    [
      "missing question IDs",
      (scene) => {
        scene.questionIds = null;
      },
      "static_edition_question_invalid",
    ],
    [
      "degenerate authored group",
      (scene) => {
        scene.groups = [{ id: "scope", x: 0, y: 0, width: 0, height: 100 }];
      },
      "static_edition_geometry_invalid",
    ],
  ]) {
    const scene = linkedMixedScene();
    mutate(scene);
    assert.throws(() => svg.composeStaticEditionSvg(scene, { icons: figureIcons }), { code }, name);
  }
  const unlinked = staticEditionScene();
  unlinked.claimRelationLinks = [];
  assert.throws(() => svg.composeStaticEditionSvg(unlinked, { icons: figureIcons }), {
    code: "static_edition_claim_relation_invalid",
  });
});

test("mixed-plate subject links require one claim anchor and the same source identity", () => {
  for (const [name, mutate] of [
    ["malformed subject link", (scene) => (scene.claimSubjectLinks = [null])],
    [
      "unknown claim assertion",
      (scene) =>
        (scene.claimSubjectLinks = [
          {
            claimAssertionId: "unknown",
            subject: { namespace: "fixture/claims", id: "subject", sha256: "a".repeat(64) },
          },
        ]),
    ],
    [
      "cross-source subject",
      (scene) =>
        (scene.claimSubjectLinks = [
          {
            claimAssertionId: "claim",
            subject: { namespace: "foreign/source", id: "subject", sha256: "a".repeat(64) },
          },
        ]),
    ],
  ]) {
    const scene = linkedMixedScene();
    scene.claimRelationLinks = [];
    mutate(scene);
    assert.throws(
      () => svg.composeStaticEditionSvg(scene, { icons: figureIcons }),
      { code: "static_edition_claim_relation_invalid" },
      name,
    );
  }
});

test("mixed neutral composition flows graph and claims beside longer reader notes", () => {
  const input = linkedMixedScene();
  input.limitsByQuestion[input.questionIds[0]] = Array.from({ length: 15 }, (_, index) => ({
    kind: "scope",
    reason: `reader-${index}`,
  }));
  const output = svg.composeStaticEditionSvg(input, { icons: figureIcons }).bytes.toString("utf8");
  const at = (label) => {
    const match = new RegExp(`<text x="([\\d.]+)" y="([\\d.]+)"[^>]*>${label}<\\/text>`, "u").exec(
      output,
    );
    assert(match, label);
    return { x: Number(match[1]), y: Number(match[2]) };
  };
  const claims = at("SOURCE CLAIMS");
  const lastNote = at("reader-14");
  const notes = at("READER QUESTIONS");
  const transform = /<g transform="translate\(([\d.-]+) ([\d.-]+)\)">/u.exec(output);
  assert(transform);
  const card = /<g data-graphic-id="c-0">\s*<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/u.exec(
    output,
  );
  assert(card);
  assert(claims.y > Number(transform[2]) + input.bounds.height + 40);
  assert(claims.y < lastNote.y);
  assert(Number(card[1]) + Number(card[3]) < notes.x - 20);
});

test("an infeasible side candidate cannot discard a readable full-width claim", () => {
  const input = linkedMixedScene();
  input.limitsByQuestion[input.questionIds[0]] = Array.from({ length: 15 }, (_, index) => ({
    kind: "scope",
    reason: `reader-${index}`,
  }));
  input.claimCards[0].facts = [{ label: "Description", value: "x".repeat(700) }];
  const output = svg.composeStaticEditionSvg(input, { icons: figureIcons }).bytes.toString("utf8");
  assert.match(output, /SOURCE CLAIMS/u);
  assert.match(output, /Description:/u);
  const pieces = [...output.matchAll(/<text[^>]*>(x+)<\/text>/gu)].map((match) => match[1]);
  assert.equal(pieces.join(""), "x".repeat(700));
});

test("the static Edition SVG is admitted by the pinned raster profile", async () => {
  const output = svg.composeStaticEditionSvg(staticEditionScene(), { icons: figureIcons });
  const supply = await loadBundledFonts();
  const selected = supply.fonts
    .filter(({ weight }) => [400, 600].includes(weight))
    .map(({ bytes, weight }) => ({ bytes, weight, family: "JetBrains Mono" }));
  const validated = validateSvg(output.bytes, selected, output.rasterWidth);
  assert.equal(validated.width, 6000);
  assert(validated.height > 0);
  assert.equal(validated.fontCount, 2);
});

test("the selected-width PNG is rendered from the static SVG, not from HTML", async (t) => {
  const root = path.resolve("build/test-work");
  await fs.mkdir(root, { recursive: true });
  const work = await fs.mkdtemp(path.join(root, "static-edition-"));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const output = svg.composeStaticEditionSvg(staticEditionScene(), { icons: figureIcons });
  const supply = await loadBundledFonts();
  const selected = supply.fonts.filter(({ weight }) => [400, 600].includes(weight));
  const members = [
    { path: "edition.svg", content: output.bytes },
    ...selected.map(({ weight, bytes }) => ({ path: `fonts/${weight}.ttf`, content: bytes })),
  ];
  const bundle = await writeSourceBundle(
    path.join(work, "input"),
    { id: "static:edition", revision: "selected" },
    members,
  );
  const png = path.join(work, "edition.png");
  const result = await rasterize({
    manifest: bundle.manifestPath,
    manifestSha256: bundle.manifestSha256,
    svg: "edition.svg",
    fonts: selected.map(({ weight }) => ({
      path: `fonts/${weight}.ttf`,
      family: "JetBrains Mono",
      weight,
    })),
    width: output.rasterWidth,
    output: png,
  });
  assert.equal(result.status, "rendered");
  assert.equal(result.width, 6000);
  assert.deepEqual(
    (await fs.readFile(png)).subarray(0, 8),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
});
