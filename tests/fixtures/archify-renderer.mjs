import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { serviceTopology } from "./diagrams.mjs";

export const sha = (b) => createHash("sha256").update(b).digest("hex");

export async function setup(t, diagram = serviceTopology()) {
  const base = new URL("../../build/test-work/", import.meta.url);
  await fs.mkdir(base, { recursive: true });
  const root = await fs.mkdtemp(new URL("render space-", base));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const input = path.join(root, "diagram.json"),
    bytes = Buffer.from(JSON.stringify(diagram, null, 2) + "\n");
  await fs.writeFile(input, bytes);
  return {
    root,
    diagram,
    input,
    bytes,
    plan: {
      type: diagram.diagram_type,
      input,
      inputSha256: sha(bytes),
      output: path.join(root, "diagram.html"),
    },
  };
}
