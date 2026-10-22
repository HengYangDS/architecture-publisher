const publisherRoot = new URL("../", import.meta.resolve("architecture-publisher/runtime"));

export const selectedFiles = Object.freeze({
  "public-cli": {
    locator: "packages/publisher/src/cli/main.mjs",
    source: new URL("src/cli/main.mjs", publisherRoot),
  },
  "source-bundle": {
    locator: "packages/publisher/src/source/bundle.mjs",
    source: new URL("src/source/bundle.mjs", publisherRoot),
  },
  "semantic-contract": {
    locator: "packages/publisher/src/semantics/document.mjs",
    source: new URL("src/semantics/document.mjs", publisherRoot),
  },
  "publication-coordinator": {
    locator: "packages/publisher/src/compiler/edition.mjs",
    source: new URL("src/compiler/edition.mjs", publisherRoot),
  },
  "static-compositor": {
    locator: "packages/publisher/renderers/svg/architecture.mjs",
    source: new URL("renderers/svg/architecture.mjs", publisherRoot),
  },
  "interactive-renderer": {
    locator: "packages/publisher/renderers/archify/index.mjs",
    source: new URL("renderers/archify/index.mjs", publisherRoot),
  },
  "raster-boundary": {
    locator: "packages/publisher/renderers/resvg/index.mjs",
    source: new URL("renderers/resvg/index.mjs", publisherRoot),
  },
  "publication-writer": {
    locator: "packages/publisher/src/publication/files.mjs",
    source: new URL("src/publication/files.mjs", publisherRoot),
  },
});
