import assert from "node:assert/strict";

import { loadBundledFonts } from "../../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../../packages/publisher/renderers/resvg/measurement.mjs";

import { interactiveLabelRequests } from "../../packages/publisher/renderers/elk/text.mjs";

export const page = () => ({
  nodes: ["Alpha", "Beta", "Gamma"].map((label, index) => ({ id: `n-${index}`, label })),
  relations: [
    ["n-0", "n-1", "selects"],
    ["n-0", "n-1", "observes"],
    ["n-1", "n-2", "controls"],
    ["n-2", "n-0", "returns"],
    ["n-2", "n-2", "retries"],
  ].map(([source, target, graphLabel], index) => ({
    id: `r-${index}`,
    source,
    target,
    graphLabel,
    direction: "forward",
  })),
});

export async function measurePages(pages) {
  return createBundledTextMeasurer(await loadBundledFonts(), interactiveLabelRequests(pages));
}

export async function selected() {
  const module = await import("../../packages/publisher/renderers/elk/layout.mjs").catch(
    () => null,
  );
  assert.equal(
    typeof module?.layoutInteractivePages,
    "function",
    "one exact interactive geometry owner must exist",
  );
  return { ...module, measure: await measurePages([page()]) };
}
