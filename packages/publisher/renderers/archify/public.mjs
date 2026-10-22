import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { fail } from "../../src/protocol/values.mjs";
import { renderArchitectureScene as renderScene } from "./index.mjs";

export { renderDiagram, renderNativeDiagram } from "./index.mjs";

/** Raw rendering cannot publish a figure that needs source-page composition. */
export async function renderArchitectureScene(plan) {
  if (plan?.interaction === "occurrence") fail("render_native_exploration_unsupported");
  return renderScene(plan);
}

/** Return the exact bundled backend notice selected by the renderer supply. */
export function readArchifyLicense() {
  return fs.readFile(fileURLToPath(new URL("./supply/LICENSE", import.meta.url)));
}
