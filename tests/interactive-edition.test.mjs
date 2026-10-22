import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { projectInteractivePage } from "../packages/publisher/renderers/interactive/model.mjs";
import { interactiveEditionScene } from "./fixtures/interactive-edition-scene.mjs";
import { interactiveDocument, interactivePage } from "./fixtures/interactive-member.mjs";

function svgTextRuns(html) {
  return [...html.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gu)].map(([, runs]) =>
    runs.replace(/<\/?tspan\b[^>]*>/gu, ""),
  );
}

test("both public rendering forms retain the original native Archify runtime on every page", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const template = await fs.readFile(
    new URL("../packages/publisher/renderers/archify/supply/assets/template.html", import.meta.url),
    "utf8",
  );
  const executable = (value) =>
    [...value.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)]
      .filter(([, attributes]) => !/type="application\/json"/u.test(attributes))
      .map(([, , source]) => source);
  const scene = interactiveEditionScene();
  const original = structuredClone(scene);
  const result = await renderInteractiveEditionHtml(scene, { composed: true });
  assert.equal(result.pages.length, scene.pages.length);
  for (const [index, page] of result.pages.entries()) {
    const html = page.content.toString("utf8");
    assert.match(html, /<meta name="publication-reader" content="archify\/v1">/u);
    assert.deepEqual(executable(html), executable(template), "native scripts must remain original");
    assert.doesNotMatch(html, /presentation\/v1|svgPanZoom|data-page-index/u);
    assert(html.includes(scene.pages[index].questions[0].text));
  }
  assert(result.supplies.some(({ id }) => id === "archify"));
  assert(!result.supplies.some(({ id }) => id === "svg-pan-zoom"));
  assert.deepEqual(scene, original, "reading must not rewrite selected meaning");
  const standalone = await renderInteractiveEditionHtml(scene);
  assert.match(standalone.bytes.toString("utf8"), /"nativeReader":"archify\/v1"/u);
});

test("standalone native reading retains exact selected identities and Inspect without fabricated build proof", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].sourceQualifiers = [{ name: "enabled", value: "false" }];
  const { bytes } = await renderInteractiveEditionHtml(scene);
  const html = bytes.toString("utf8");
  const data = JSON.parse(
    html.match(
      /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
    )[1],
  );
  const selected = data.pages.overview;
  assert.equal(
    selected.facts.find(({ graphicId }) => graphicId === "n-0").reference,
    '["private/model","entity","secret-alpha"]',
  );
  const relation = selected.facts.find(({ graphicId }) => graphicId === "r-0");
  assert.equal(relation.reference, '["private/model","relation","relation:4:2"]');
  assert(relation.facts.some(({ label, value }) => label === "Direction" && value === "forward"));
  assert(relation.facts.some(({ label, value }) => label === "enabled" && value === "false"));
  const judgment = data.pages.limit.facts.find(({ graphicId }) => graphicId === "editorial-0");
  assert.equal(judgment.editionSha256, scene.edition.sha256);
  assert.deepEqual(data.pages.limit.subjectSources["editorial-0"], []);
  assert(!Object.hasOwn(data.build, "lockSha256"));
  assert(!Object.hasOwn(data.build, "semanticDigest"));
  assert.equal(data.build.editionSha256, scene.edition.sha256);
  assert.equal(typeof data.appearanceScript, "string");
  assert.deepEqual(data.state, {
    qualification: "not-performed",
    humanAcceptance: "not-performed",
    publication: "not-performed",
  });
});

test("a neutral standalone HTML keeps every page complete without source-byte disclosure", async () => {
  const renderer = await import("../packages/publisher/renderers/interactive/index.mjs").catch(
    () => null,
  );
  assert.equal(typeof renderer?.renderInteractiveEditionHtml, "function");
  const result = await renderer.renderInteractiveEditionHtml(interactiveEditionScene());
  const html = result.bytes.toString("utf8");

  assert.equal(result.completeness, "unqualified-medium");
  assert.deepEqual(
    result.supplies.map(({ id }) => id),
    [
      "intrinsic-layout",
      "font-measurement",
      "archify",
      "runtime",
      "node-fonts",
      "figure-icons",
      "statement-fonts",
    ],
  );
  assert.match(html, /<!doctype html>/iu);
  assert.match(html, /Selected architecture/u);
  assert.match(html, /What is connected\?/u);
  assert.match(html, /What remains uncertain\?/u);
  assert.match(interactivePage(result.bytes, "overview"), /Alpha &amp; one/u);
  assert.match(html, /Beta/u);
  assert.match(html, /calls/u);
  assert.match(html, /Runtime safety is not established\./u);
  assert.match(html, /No runtime observation was selected\./u);
  const data = interactiveDocument(result.bytes);
  const firstPage = interactivePage(result.bytes, "overview");
  assert.equal(data.pages.overview.nativeReader, "archify/v1");
  assert.match(firstPage, /<svg[^>]*data-relationship-queries="complete"/u);
  assert.match(firstPage, /data-note-card-id="reading-boundary"/u);
  assert.match(firstPage, /data-node-id="n-0"/u);
  assert.match(firstPage, /data-node-id="n-1"/u);
  assert.match(firstPage, /data-logical-relation="true"/u);
  assert.doesNotMatch(html, /Edge numbers match/u);
  assert.doesNotMatch(firstPage, /class="evidence-section evidence-questions"/u);
  assert.match(firstPage, /SIL OPEN FONT LICENSE/u);
  assert.match(firstPage, /id="figure-icon-license"/u);
  assert.match(firstPage, /Copyright \(c\) 2026 tt-a1i \(Archify\)/u);
  assert.match(firstPage, /Permission is hereby granted, free of charge/u);
  assert.doesNotMatch(firstPage, /private\/model|secret-alpha|secret-beta|relation:4:2/u);
  assert.equal(data.pages.overview.facts[0].reference, '["private/model","entity","secret-alpha"]');
  assert.match(firstPage, /data-legend-kind="component" data-legend-label="component"/u);
  const limitPage = interactivePage(result.bytes, "limit");
  assert.match(limitPage, /data-note-card-id="editorial-card-0"/u);
  assert.match(limitPage, /Runtime safety is not established\./u);
  assert.deepEqual(
    result.carriers[0].nodes.map(({ graphicId }) => graphicId),
    ["n-0", "n-1"],
  );
  assert.deepEqual(result.carriers[1].nodes, []);
});

test("a short path uses the same selected geometry owner rather than a special chain layout", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label = null;
  scene.pages[0].relations[0].kind = null;
  const result = await renderInteractiveEditionHtml(scene);
  assert(!result.bytes.toString("utf8").includes("graph--chain"));
  assert(result.supplies.some(({ id }) => id === "intrinsic-layout"));
  assert.equal(interactiveDocument(result.bytes).pages.overview.nativeReader, "archify/v1");
});

test("authored interactive groups become visible reading sections with bound graphic members", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].groups = [
    {
      id: "input",
      label: "Input <selected>",
      elements: [{ namespace: "private/model", id: "secret-alpha" }],
    },
    {
      id: "effect",
      label: "Effect",
      elements: [{ namespace: "private/model", id: "secret-beta" }],
    },
  ];
  const rendered = await renderInteractiveEditionHtml(scene);
  const html = interactivePage(rendered.bytes, "overview");
  const labels = svgTextRuns(html);
  assert(labels.includes("Input &lt;selected&gt;"));
  assert(labels.includes("Effect"));
  assert.doesNotMatch(html, /Input <selected>/u);
  assert.equal([...html.matchAll(/data-boundary-label=""/gu)].length, 2);
  assert.deepEqual(
    rendered.carriers[0].groups.map(({ graphicId, nodeIds }) => [graphicId, nodeIds]),
    [
      ["g-0", ["n-0"]],
      ["g-1", ["n-1"]],
    ],
  );
});

test("a source claim preserves the unchanged graph reading width", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  const revision = "a".repeat(64);
  const claim = { namespace: "private/model", id: "claim-one", sha256: revision };
  const graphViewport = (html) => html.match(/<svg viewBox="([^"]+)"/u)?.[1];
  const overview = interactivePage((await renderInteractiveEditionHtml(scene)).bytes, "overview");
  assert(graphViewport(overview), "the native page has a complete graph aperture");

  scene.pages[0].claimCards = [
    { ...claim, facts: [{ label: "Claim plane", value: "implemented" }] },
  ];
  scene.pages[0].sourceAssertionCarriers.push(
    {
      assertionId: "relation-assertion",
      kind: "relation",
      nodeRefs: [],
      relationRefs: [{ namespace: claim.namespace, reference: "relation:4:2", sha256: revision }],
    },
    {
      assertionId: "claim-assertion",
      kind: "claim",
      nodeRefs: [],
      relationRefs: [],
      claimRefs: [{ namespace: claim.namespace, reference: claim.id, sha256: revision }],
    },
  );
  scene.pages[0].claimRelationLinks = [
    { claimAssertionId: "claim-assertion", relationAssertionId: "relation-assertion" },
  ];
  const detailed = await renderInteractiveEditionHtml(scene);
  const detail = interactivePage(detailed.bytes, "overview");
  assert.equal(graphViewport(detail), graphViewport(overview));
  assert.match(detail, /data-note-card-id="claim-card-0"/u);
  assert.equal([...detail.matchAll(/data-note-id="c-0"/gu)].length, 1);
  assert.match(detail, /data-inspect-id="c-0"/u);
  assert.equal(
    interactiveDocument(detailed.bytes).pages.overview.facts.find(
      ({ graphicId }) => graphicId === "c-0",
    ).reference,
    '["private/model","claim","claim-one"]',
  );
  scene.pages[0].limitsByQuestion.shape = [];
  const primary = interactivePage((await renderInteractiveEditionHtml(scene)).bytes, "overview");
  assert(
    !primary.includes('data-note-item-id="limit-0-0"'),
    "empty applicability must not create an empty note",
  );
  assert(
    primary.includes(scene.summary),
    "the publication summary remains meaningful without limits",
  );
});

test("required editorial meaning remains in the primary graph reading state", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].editorialAssertions.push({
    id: "editorial-reading-boundary",
    kind: "editorial",
    statement: "These selected claims do not establish current runtime behavior.",
    proponent: "comparison-editor",
    basis: ["overview"],
    questions: ["shape"],
    semanticStatus: "editor-attributed-unverified",
  });
  const primary = interactivePage((await renderInteractiveEditionHtml(scene)).bytes, "overview");
  assert(primary.includes("These selected claims do not establish current runtime behavior."));
  assert(primary.includes("Editorial judgment · comparison-editor · unverified"));
});

test("selected qualifiers and limits stay in one contiguous diagram reading region", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].sourceQualifiers = [
    { name: "compensation", value: '"created-by-operation-only"' },
  ];
  const reading = interactivePage((await renderInteractiveEditionHtml(scene)).bytes, "overview");
  assert.match(reading, /<svg[^>]*data-relationship-queries="complete"/u);
  assert.equal([...reading.matchAll(/data-note-card-id="relation-qualifiers-0"/gu)].length, 1);
  assert.match(reading, /data-note-item-id="relation-0-context"/u);
  assert.match(reading, /data-note-item-id="relation-0-qualifier-0"/u);
  assert.match(reading, /data-note-card-id="reading-boundary"/u);
  assert(reading.includes("created-by-operation-only"));
  assert(reading.includes("Runtime was not observed."));
  assert(!reading.includes("Reading page 1"), "page numbering is not the reader question");
});

test("long unbroken selected text is internally typeset without truncating its view or meaning", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  for (const id of ["overview", "another-overview"]) {
    const scene = interactiveEditionScene();
    scene.pages[0].id = id;
    scene.pages[0].nodes[0].label = "x".repeat(200);
    const original = structuredClone(scene);
    const rendered = await renderInteractiveEditionHtml(scene);
    const member = interactivePage(rendered.bytes, id);
    assert(svgTextRuns(member).includes(scene.pages[0].nodes[0].label));
    assert(member.includes("What is connected?"));
    const fact = interactiveDocument(rendered.bytes).pages[id].facts.find(
      ({ graphicId }) => graphicId === "n-0",
    );
    assert.equal(fact.title, scene.pages[0].nodes[0].label);
    assert.deepEqual(scene, original);
  }
});

test("malformed or excessive Scenes fail before loading renderer supply", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const cases = [
    ["null scene", () => null, "render_interactive_scene_invalid"],
    [
      "wrong schema",
      (scene) => ({ ...scene, schema: "other" }),
      "render_interactive_scene_invalid",
    ],
    [
      "wrong completeness",
      (scene) => ({ ...scene, completeness: "accepted" }),
      "render_interactive_scene_invalid",
    ],
    ["missing title", (scene) => ({ ...scene, title: "" }), "render_interactive_scene_invalid"],
    ["missing summary", (scene) => ({ ...scene, summary: "" }), "render_interactive_scene_invalid"],
    [
      "unsupported profile",
      (scene) => ({ ...scene, visualPolicy: { profile: "flagship" } }),
      "render_interactive_scene_invalid",
    ],
    [
      "unselected override",
      (scene) => ({ ...scene, visualPolicy: { profile: "neutral", override: "art.css" } }),
      "render_interactive_scene_invalid",
    ],
    ["missing pages", (scene) => ({ ...scene, pages: null }), "render_interactive_scene_invalid"],
    ["empty pages", (scene) => ({ ...scene, pages: [] }), "render_interactive_scene_invalid"],
    ["null page", (scene) => ({ ...scene, pages: [null] }), "render_interactive_scene_invalid"],
    [
      "too many pages",
      (scene) => ({ ...scene, pages: Array.from({ length: 65 }, () => scene.pages[0]) }),
      "render_interactive_scene_invalid",
    ],
    ["missing limits", (scene) => ({ ...scene, limits: null }), "render_interactive_scene_invalid"],
    ["invalid limit", (scene) => ({ ...scene, limits: [""] }), "render_interactive_scene_invalid"],
    [
      "duplicate page",
      (scene) => ({ ...scene, pages: [scene.pages[0], scene.pages[0]] }),
      "render_interactive_identity_ambiguous",
    ],
    [
      "too many nodes",
      (scene) => {
        scene.pages[0].nodes.push(
          ...Array.from({ length: 511 }, (_, index) => ({
            ...scene.pages[0].nodes[0],
            id: `extra-${index}`,
          })),
        );
        return scene;
      },
      "render_interactive_complexity_exceeded",
    ],
    [
      "too many relations",
      (scene) => {
        scene.pages[0].relations.push(
          ...Array.from({ length: 2048 }, (_, index) => ({
            ...scene.pages[0].relations[0],
            id: `relation:${index}`,
          })),
        );
        return scene;
      },
      "render_interactive_complexity_exceeded",
    ],
  ];
  for (const [name, alter, code] of cases)
    await assert.rejects(
      renderInteractiveEditionHtml(alter(interactiveEditionScene())),
      { code },
      name,
    );
});

test("HTML escaping preserves authored text without executable or raw source disclosure", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].nodes[0].label = "</script><script>x";
  scene.pages[0].relations[0].direction = "bidirectional";
  scene.pages[0].relations[0].label = null;
  scene.pages[0].relations[0].kind = "peer";
  scene.pages[0].editorialAssertions.push(scene.pages[1].editorialAssertions[0]);
  scene.limits = [];
  const rendered = await renderInteractiveEditionHtml(scene);
  const html = rendered.bytes.toString("utf8");
  const member = interactivePage(rendered.bytes, "overview");
  assert(svgTextRuns(member).includes("&lt;/script&gt;&lt;script&gt;x"));
  assert.match(html, /\\u003c\/script\\u003e/u);
  assert.doesNotMatch(html, /<script>globalThis\.injection=1<\/script>/u);
  const relation = interactiveDocument(rendered.bytes).pages.overview.facts.find(
    ({ graphicId }) => graphicId === "r-0",
  );
  assert.equal(relation.title, "</script><script>x ↔ Beta");
  assert(
    relation.facts.some(({ label, value }) => label === "Direction" && value === "bidirectional"),
  );
  assert(svgTextRuns(member).includes("peer"));
  assert.match(member, /data-note-card-id="editorial-card-0"/u);
});

test("an untyped source node keeps its source kind and its distinct figure role in the Legend", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].nodes[0].kind = null;
  scene.pages[0].nodes[0].figureKind = "source element";
  scene.pages[0].nodes[0].icon = "lucide:circle";
  scene.visualPolicy.figureTypes["source element"] = "lucide:circle";
  scene.pages[0].relations[0].label = null;
  scene.pages[0].relations[0].kind = null;
  const rendered = await renderInteractiveEditionHtml(scene);
  const html = interactivePage(rendered.bytes, "overview");
  const facts = interactiveDocument(rendered.bytes).pages.overview.facts;
  const node = facts.find(({ graphicId }) => graphicId === "n-0");
  const declared = JSON.parse(
    node.facts.find(({ label }) => label === "Selected source fields").value,
  );
  assert.equal(declared.kind, null);
  assert.equal(declared.figureKind, "source element");
  assert.equal(facts.find(({ graphicId }) => graphicId === "r-0").title, "Alpha & one → Beta");
  assert.equal(scene.pages[0].relations[0].kind, null);
  assert.equal(scene.pages[0].relations[0].label, null);
  assert.equal(projectInteractivePage(scene.pages[0], 0).publicPage.relations[0].label, "");
  assert.match(
    html,
    /data-legend-kind="source element" data-legend-label="source element"[^>]*>[\s\S]*?data-semantic-sigil="lucide:circle"/u,
  );
  assert.match(
    html,
    /data-legend-kind="component" data-legend-label="component"[^>]*>[\s\S]*?data-semantic-sigil="lucide:box"/u,
  );
  assert.doesNotMatch(html, /data-legend-kind="null"/u);
});

test("diagram labels retain the selected relation meaning directly", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label =
    "Source relation qualifiers (unverified): state: desired client bindings";
  scene.pages[0].relations[0].kind = "configures";
  const { publicPage } = projectInteractivePage(scene.pages[0], 0);
  const relation = publicPage.relations[0];
  assert.equal(
    relation.label,
    "Source relation qualifiers (unverified): state: desired client bindings · configures",
  );
  assert.equal(relation.graphLabel, relation.label);

  const rendered = await renderInteractiveEditionHtml(scene);
  const member = interactivePage(rendered.bytes, "overview");
  assert.match(member, /data-intrinsic-relation-label="r-0"/u);
  assert(svgTextRuns(member).includes(relation.graphLabel));
  const inspected = interactiveDocument(rendered.bytes).pages.overview.facts.find(
    ({ graphicId }) => graphicId === "r-0",
  );
  assert.equal(inspected.title, `Alpha & one → Beta · ${scene.pages[0].relations[0].label}`);
  assert(
    inspected.facts.some(({ label, value }) => label === "Relation kind" && value === "configures"),
  );
});

test("a short authored relation is readable in the diagram", () => {
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label = "calls";
  scene.pages[0].relations[0].kind = "dependency";
  const { publicPage } = projectInteractivePage(scene.pages[0], 0);
  assert.equal(publicPage.relations[0].graphLabel, "calls · dependency");
  assert.equal(publicPage.relations[0].label, "calls · dependency");
});

test("a long relation retains its full meaning in the graph and inspection", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].label = "synchronizes all selected native client registrations";
  scene.pages[0].relations[0].kind = null;
  const { publicPage } = projectInteractivePage(scene.pages[0], 0);
  assert.equal(publicPage.relations[0].graphLabel, scene.pages[0].relations[0].label);
  assert.equal(publicPage.relations[0].label, scene.pages[0].relations[0].label);
  const rendered = await renderInteractiveEditionHtml(scene);
  const member = interactivePage(rendered.bytes, "overview");
  assert(svgTextRuns(member).includes(scene.pages[0].relations[0].label));
  const inspected = interactiveDocument(rendered.bytes).pages.overview.facts.find(
    ({ graphicId }) => graphicId === "r-0",
  );
  assert.equal(inspected.title, `Alpha & one → Beta · ${scene.pages[0].relations[0].label}`);
});

test("source-reported qualifier fields are visible and HTML-escaped beside their relation", async () => {
  const { renderInteractiveEditionHtml } =
    await import("../packages/publisher/renderers/interactive/index.mjs");
  const scene = interactiveEditionScene();
  scene.pages[0].relations[0].sourceQualifiers = [
    { name: "scope", value: '"<script>globalThis.injection=1</script>"' },
    { name: "enabled", value: "false" },
  ];
  const rendered = await renderInteractiveEditionHtml(scene);
  const html = interactivePage(rendered.bytes, "overview");
  assert(html.includes("Source-reported relation qualifiers · unverified"));
  assert(
    html.includes(
      '<li data-note-item-id="relation-0-qualifier-0">scope: &quot;&lt;script&gt;globalThis.injection=1&lt;/script&gt;&quot;</li>',
    ),
  );
  assert(html.includes('<li data-note-item-id="relation-0-qualifier-1">enabled: false</li>'));
  const inspected = interactiveDocument(rendered.bytes).pages.overview.facts.find(
    ({ graphicId }) => graphicId === "r-0",
  );
  for (const { name, value } of scene.pages[0].relations[0].sourceQualifiers)
    assert(inspected.facts.some((field) => field.label === name && field.value === value));
  assert(!html.includes("<script>globalThis.injection=1</script>"));
});
