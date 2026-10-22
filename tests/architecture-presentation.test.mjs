import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { assembleArchitecturePage } from "../packages/publisher/renderers/archify/assembly.mjs";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { renderArchitectureScene as renderPublicArchitectureScene } from "../packages/publisher/renderers/archify/public.mjs";
import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";
import { loadFigureIconSupply } from "../packages/publisher/renderers/icons/index.mjs";
import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";
import { composeAuthoredInteractiveArchitecture } from "../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import { sourceReadingFixture } from "./fixtures/source-reading.mjs";
import { compose, meaningFor, sceneFor } from "./fixtures/authored-routes.mjs";

test("pure explanation documents retain the complete native style and have no executable reader", async () => {
  const meaning = meaningFor("interactive");
  const raw = sceneFor(meaning, "interactive");
  const fonts = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(fonts, raw.texts);
  raw.texts = raw.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  const page = compose(meaning, "interactive").pages[0];
  const options = {
    fonts,
    icons: await loadFigureIconSupply(),
    exploration: page.exploration,
  };
  const native = await assembleArchitecturePage(page.scene, options);
  const pure = await assembleArchitecturePage(page.scene, {
    ...options,
    interaction: "presentation",
  });
  const html = pure.bytes.toString("utf8");
  assert.doesNotMatch(html, /<script\b/iu);
  assert.match(html, /<html[^>]*\bdata-embed="true"/u);
  assert.match(html, /<meta name="publication-reader" content="presentation\/v1">/u);
  const figure = html.match(/<svg\b[^>]*\bdata-diagram-type="architecture"[\s\S]*?<\/svg>/u)?.[0];
  assert.ok(figure, "the complete explanatory architecture remains present");
  assert.match(figure, /data-reader-fit="authored-height"/u);
  assert.match(figure, /viewBox="0 0 960 500"/u);
  assert.doesNotMatch(
    figure.replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, ""),
    /data-inspect|data-focus|data-legend-bridge|data-relationship-queries/u,
  );
  assert.doesNotMatch(html, /\son[a-z]+\s*=|javascript:/iu);
  assert.doesNotMatch(html, /<li\b[^>]*\b(?:data-inspect-id|tabindex)=/u);
  const styles = (bytes) =>
    [...bytes.toString("utf8").matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/giu)].map(
      ([block]) => block,
    );
  assert.deepEqual(styles(pure.bytes), styles(native.bytes));
  const paint = (bytes) =>
    [...bytes.toString("utf8").matchAll(/<(?:rect|path|circle|polygon|polyline|text)\b[^>]*>/gu)]
      .map(([tag]) => tag)
      .filter((tag) => !tag.includes("data-logical-relation"))
      .map((tag) =>
        tag.replace(
          /\s(?:data-(?:graphic-id|text-id|text-label)|role|tabindex|aria-label)="[^"]*"/gu,
          "",
        ),
      );
  assert.deepEqual(paint(pure.bytes), paint(native.bytes));
  assert.deepEqual(pure.supplies, native.supplies);
  const template = await fs.readFile(
    new URL("../packages/publisher/renderers/archify/supply/assets/template.html", import.meta.url),
  );
  assert.match(template.toString("utf8"), /<script\b/iu);
  assert.doesNotMatch(template.toString("utf8"), /publication-reader/u);
});

test("incomplete source membership is refused before a native query document is emitted", async (t) => {
  const { root, meaning } = await sourceReadingFixture(t);
  const page = composeAuthoredInteractiveArchitecture(meaning).pages[0];
  assert.deepEqual(page.exploration.limits, ["nonbijective-source-membership"]);
  const fonts = await loadBundledFonts();
  const icons = await loadFigureIconSupply();
  for (const interaction of [undefined, "native"]) {
    await assert.rejects(
      assembleArchitecturePage(page.scene, {
        fonts,
        icons,
        exploration: page.exploration,
        interaction,
      }),
      { code: "render_native_exploration_unsupported" },
    );
    const output = path.join(root, `unsupported-${interaction ?? "default"}.html`);
    await assert.rejects(
      renderArchitectureScene({
        scene: page.scene,
        exploration: page.exploration,
        output,
        interaction,
      }),
      { code: "render_native_exploration_unsupported" },
    );
    await assert.rejects(fs.access(output), { code: "ENOENT" });
    assert.equal(
      (await fs.readdir(root)).some((name) => name.startsWith(".architecture-render-")),
      false,
    );
  }
  await assert.rejects(
    renderPublicArchitectureScene({
      scene: page.scene,
      exploration: page.exploration,
      output: path.join(root, "public-occurrences.html"),
      interaction: "occurrence",
    }),
    { code: "render_native_exploration_unsupported" },
  );
  await assert.rejects(fs.access(path.join(root, "public-occurrences.html")), { code: "ENOENT" });
  const occurrence = await assembleArchitecturePage(page.scene, {
    fonts,
    icons,
    exploration: page.exploration,
    interaction: "occurrence",
  });
  assert.match(occurrence.bytes.toString(), /<script\b/iu);
  assert.match(occurrence.bytes.toString(), /publication-reader" content="archify\/v1/u);
  assert.match(occurrence.bytes.toString(), /publication-source-reading" content="required/u);
  assert.doesNotMatch(occurrence.bytes.toString(), /data-edge-from=|data-edge-to=/u);
  const output = path.join(root, "presentation.html");
  await renderArchitectureScene({
    scene: page.scene,
    exploration: page.exploration,
    output,
    interaction: "presentation",
  });
  assert.ok((await fs.readFile(output)).length, "the complete figure remains renderable");
});
