import assert from "node:assert/strict";
import test from "node:test";
import { renderInteractiveEditionHtml } from "../packages/publisher/renderers/interactive/index.mjs";
import { interactiveEditionScene } from "./fixtures/interactive-edition-scene.mjs";
import { interactivePage, interactiveDocument } from "./fixtures/interactive-member.mjs";

test("the public native renderer retains exact labels and directed geometry without a private painter", async () => {
  const scene = interactiveEditionScene();
  scene.pages[0].nodes[0].label = "Input <exact>";
  scene.pages[0].nodes[1].label = "Output";
  Object.assign(scene.pages[0].relations[0], {
    label: "selects & binds",
    direction: "bidirectional",
  });
  scene.pages[0].groups = [
    {
      id: "boundary",
      label: "Reading boundary",
      elements: scene.pages[0].nodes.map(({ namespace, id }) => ({ namespace, id })),
    },
  ];
  const original = structuredClone(scene);
  const result = await renderInteractiveEditionHtml(scene);
  assert.deepEqual(scene, original);
  const html = interactivePage(result.bytes, "overview");
  assert.match(html, /<svg[^>]+viewBox="0 0 /u);
  assert.match(html, /Input &lt;exact&gt;/u);
  assert.match(html, /selects &amp; binds/u);
  assert.match(html, /data-group-id="g-0"/u);
  const graphic = html.match(/<svg\b[^>]*data-diagram-type="architecture"[\s\S]*?<\/svg>/u)?.[0];
  assert(graphic, "the selected native architecture has one canonical SVG");
  for (const id of ["n-0", "n-1"])
    assert.equal(
      [...graphic.matchAll(new RegExp(`<g\\b[^>]*data-node-id="${id}"`, "gu"))].length,
      1,
    );
  const route = html.match(/<path\b[^>]*data-composition-points="([^"]+)"[^>]*>/u)?.[0];
  assert(route, "the emitted route binds its composition points");
  const points = route.match(/data-composition-points="([^"]+)"/u)[1].split(";");
  const expected = points
    .map((point, index) => `${index ? "L" : "M"} ${point.replace(",", " ")}`)
    .join(" ");
  assert.equal(route.match(/\sd="([^"]+)"/u)[1], expected);
  assert.match(route, /marker-start="url\(#[^)]+\)"/u);
  assert.match(route, /marker-end="url\(#[^)]+\)"/u);
  assert.doesNotMatch(html, /class="graph-viewport"|class="graph-svg"|cytoscape/u);
  assert.equal(interactiveDocument(result.bytes).pages.overview.nativeReader, "archify/v1");
  const facts = interactiveDocument(result.bytes).pages.overview.facts;
  assert.equal(
    facts
      .find(({ graphicId }) => graphicId === "r-0")
      .facts.find(({ label }) => label === "Direction").value,
    "bidirectional",
  );
  assert.equal(result.completeness, "unqualified-medium");
});
