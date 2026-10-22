import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import { translateMessage } from "../packages/publisher/renderers/archify/supply/renderers/shared/i18n.mjs";

test("native reader uses valid English locale tags without mixing graph and occurrence wording", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-reader-locale-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "source",
    title: "Source evidence",
    subtitle: "Selected facts retain their authority",
    viewport: { width: 1100, height: 620 },
    nodes: [
      {
        id: "source",
        label: "Source evidence",
        visualRole: "external",
        figureKind: "source",
        icon: "lucide:workflow",
        position: { x: 250, y: 240 },
        size: { width: 196, height: 92 },
      },
    ],
    groups: [],
    edges: [],
  };
  const english = translateMessage("en", "viewer.finder.title");
  for (const [index, limits] of [[], ["nonbijective-source-membership"], []].entries()) {
    const output = path.join(root, `reader-${index}.html`);
    await renderArchitectureScene({
      scene,
      output,
      ...(limits.length ? { interaction: "presentation" } : {}),
      exploration: {
        nodes: [{ id: "source", label: "Source evidence", kind: "external" }],
        relations: [],
        limits,
      },
    });
    const html = await fs.readFile(output, "utf8");
    const locale = html.match(/<html\b[^>]*\blang="([^"]+)"/u)?.[1];
    assert.ok(locale);
    assert.doesNotThrow(() => Intl.getCanonicalLocales(locale));
    assert.match(locale, /^en(?:-|$)/u);
    assert.equal(translateMessage("en", "viewer.finder.title"), english);
    if (limits.length) {
      assert.doesNotMatch(html, /<script\b/iu);
      continue;
    }
    const data = JSON.parse(
      html.match(/<script id="archify-i18n-data" type="application\/json">([^<]+)<\/script>/u)[1],
    );
    assert.equal(data.locale, locale);
    assert.equal(data.messages["viewer.finder.title"], english);
    assert.equal(translateMessage("en", "viewer.finder.title"), english);
  }
});
