import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";
import {
  arrowClassMap,
  edgeLabelAccent,
} from "../packages/publisher/renderers/archify/supply/renderers/shared/geometry.mjs";

for (const placement of ["intrinsic", "authored"]) {
  test(`${placement} relationships retain their declared native path, marker and caption style`, async (t) => {
    const root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), "archpub-relation-style-")),
    );
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    for (const [visualRole, [nativeClass, marker]] of Object.entries(arrowClassMap)) {
      await t.test(visualRole, async () => {
        const fixed = placement === "authored";
        const scene = {
          schema: "architecture.interactive-scene/v1",
          id: `relation-${visualRole}`,
          title: "Declared relationships",
          subtitle: "Preserve native relationship styles",
          ...(fixed ? { viewport: { width: 960, height: 540 } } : {}),
          nodes: ["source", "target"].map((id, index) => ({
            id,
            label: index ? "Target" : "Source",
            visualRole: "backend",
            ...(fixed
              ? {
                  position: { x: index ? 620 : 70, y: 180 },
                  size: { width: 220, height: 100 },
                }
              : {}),
          })),
          groups: [],
          edges: [
            {
              id: "deliver",
              from: "source",
              to: "target",
              label: "Delivers",
              visualRole,
              ...(fixed ? { fromSide: "right", toSide: "left", route: "straight" } : {}),
            },
          ],
        };
        const before = structuredClone(scene);
        const output = path.join(root, `${visualRole}.html`);
        await renderArchitectureScene({ scene, output });
        const html = await fs.readFile(output, "utf8");
        const paths = [...html.matchAll(/<path\b[^>]*data-composition-edge-from="source"[^>]*>/gu)];
        assert.equal(paths.length, 1);
        assert.equal(/class="([^"]+)"/u.exec(paths[0][0])?.[1], nativeClass);
        assert.equal(/marker-end="url\(#([^)]*)\)"/u.exec(paths[0][0])?.[1], marker);
        assert(html.includes(`<marker id="${marker}"`));
        const caption =
          /<g\b[^>]*data-intrinsic-relation-label="deliver"[^>]*>([\s\S]*?)<\/g>/u.exec(html)?.[1];
        assert(caption?.includes(`class="${edgeLabelAccent(visualRole)}"`));
        assert(caption.includes("Delivers"));
        assert.deepEqual(scene, before);
      });
    }
  });
}
