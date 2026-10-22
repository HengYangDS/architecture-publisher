import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectedSelfSources } from "./selected-self-sources.mjs";

export const root = fileURLToPath(new URL("../../", import.meta.url));

export const packageRoot = path.join(root, "editions/self");

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export const encode = (value) => Buffer.from(JSON.stringify(value, null, 2) + "\n");

export const selectedSources = selectedSelfSources;

export async function request(output, sourceRoot = root) {
  const sources = {};
  for (const [id, relative] of Object.entries(selectedSources)) {
    const file = path.join(sourceRoot, relative);
    sources[id] = { path: file, sha256: sha256(await fs.readFile(file)) };
  }
  return {
    schema: "architecture.publisher-self-input/v1",
    source: { id: "architecture-publisher", revision: "test-source-revision" },
    sources,
    output,
  };
}

export function directedPath(relations, from, to) {
  const pending = [[from, []]],
    seen = new Set();
  while (pending.length) {
    const [current, path] = pending.shift();
    if (current === to) return path;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const [id, relation] of Object.entries(relations))
      if (relation.subject === current) pending.push([relation.object, [...path, id]]);
  }
  return null;
}
