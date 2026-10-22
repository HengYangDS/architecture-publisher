import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { writeSourceBundle } from "../../packages/publisher/src/source/write.mjs";

export const root = fileURLToPath(new URL("../..", import.meta.url));

export const hash = (b) => createHash("sha256").update(b).digest("hex");

export const shape =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect width="200" height="100" fill="#f5f3ed"/><path d="M 20 50 H 180" stroke="#29372f" stroke-width="3"/></svg>';

export const withText = (text) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100"><rect width="240" height="100" fill="#f5f3ed"/><text x="16" y="56" font-family="JetBrains Mono" font-size="20" fill="#29372f">${text}</text></svg>`;

export async function api() {
  const entry = new URL("../../packages/publisher/src/rendering/raster.mjs", import.meta.url);
  await assert.doesNotReject(fs.access(entry), "public raster bundle operation exists");
  return (await import(entry)).rasterizeBundle;
}

export async function setup(t, svg = shape, fonts = false, extraMembers = []) {
  const base = path.join(root, "build/test-work");
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, "raster space-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const members = [{ path: "figure.svg", content: Buffer.from(svg) }, ...extraMembers];
  const selection = [];
  if (fonts) {
    members.push({
      path: "fonts/regular.ttf",
      content: await fs.readFile(
        path.join(root, "packages/publisher/renderers/fonts/supply/JetBrainsMono-Regular.ttf"),
      ),
    });
    selection.push({
      path: "fonts/regular.ttf",
      family: "JetBrains Mono",
      weight: 400,
    });
  }
  const bundle = await writeSourceBundle(
    path.join(dir, "input"),
    { id: "diagram:test", revision: "r1" },
    members,
  );
  return {
    dir,
    plan: {
      manifest: bundle.manifestPath,
      manifestSha256: bundle.manifestSha256,
      svg: "figure.svg",
      fonts: selection,
      width: 800,
      output: path.join(dir, "figure.png"),
    },
  };
}
