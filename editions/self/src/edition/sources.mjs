const selected = (path, authority) => Object.freeze({ path, authority });

/** Explicit source-owned membership; paths are repository-relative, never discovery rules. */
export const SELF_SOURCE_SELECTION = Object.freeze({
  "product-contract": selected(
    "docs/product-contract.md",
    "Canonical product meaning and authority boundary",
  ),
  "core-package": selected(
    "packages/publisher/package.json",
    "Installed generic product identity and public package surface",
  ),
  "self-source-selection-owner": selected(
    "editions/self/src/edition/sources.mjs",
    "Explicit source-owned preparation membership",
  ),
  "self-prepare-owner": selected(
    "editions/self/src/edition/prepare.mjs",
    "Explicit self-Edition source selection and preparation",
  ),
  "self-model-owner": selected(
    "editions/self/src/edition/model.mjs",
    "First-party product self-model authorship",
  ),
  "self-facts-owner": selected(
    "editions/self/src/edition/facts.mjs",
    "Source-owned claim construction and product scope",
  ),
  "self-entities-owner": selected(
    "editions/self/src/edition/entities.mjs",
    "Source-owned entity meaning and responsibilities",
  ),
  "self-relations-owner": selected(
    "editions/self/src/edition/relations.mjs",
    "Source-owned directed relationships and conditions",
  ),
  "self-project-owner": selected(
    "editions/self/src/edition/project.mjs",
    "First-party Edition Project authorship",
  ),
  "self-refinement-owner": selected(
    "editions/self/src/edition/refinement.mjs",
    "Independent per-medium input preparation",
  ),
  "self-figure-types-owner": selected(
    "editions/self/src/edition/figure-types.mjs",
    "Global source-owned figure-kind and glyph selection",
  ),
  "self-static-composition-owner": selected(
    "editions/self/src/edition/static/composition.mjs",
    "Source-owned static authored composition",
  ),
  "self-static-program-owner": selected(
    "editions/self/src/edition/static/program.mjs",
    "Source-owned static visual program",
  ),
  "self-static-compiler-owner": selected(
    "editions/self/src/edition/static/scene.mjs",
    "Source-owned measured scene compiler",
  ),
  "static-renderer-owner": selected(
    "packages/publisher/renderers/svg/canvas.mjs",
    "Generic authored SVG renderer",
  ),
  "self-static-metrics": selected(
    "editions/self/src/edition/static/authoring/metrics.json",
    "Recorded typography input; not fresh runtime observation",
  ),
  "self-interactive-scene-owner": selected(
    "editions/self/src/edition/interactive-scenes.mjs",
    "Independent source-owned interactive scene authorship",
  ),
  "self-interactive-composition-owner": selected(
    "editions/self/src/edition/interactive-scene.mjs",
    "Source-owned automatic interactive composition input",
  ),
  "self-interactive-nodes-owner": selected(
    "editions/self/src/edition/interactive-nodes.mjs",
    "Source-owned interactive figure meaning and detail",
  ),
  "self-interactive-routes-owner": selected(
    "editions/self/src/edition/interactive-routes.mjs",
    "Source-owned directed interactive relationship selection",
  ),
  "interactive-compositor-owner": selected(
    "packages/publisher/src/rendering/interactive-html.mjs",
    "Generic standalone interactive HTML compositor",
  ),
  "source-owner": selected(
    "packages/publisher/src/source/write.mjs",
    "Source Bundle validation and exclusive output implementation",
  ),
  "claim-owner": selected(
    "packages/publisher/src/semantics/document.mjs",
    "Claim Model schema, validation, and canonical identity owner",
  ),
  "evolution-owner": selected(
    "packages/publisher/src/edition/evolution.mjs",
    "Semantic delta and Edition evolution obligation compiler",
  ),
  "compiler-owner": selected(
    "packages/publisher/src/compiler/edition.mjs",
    "Edition candidate compilation implementation",
  ),
  "interactive-renderer-owner": selected(
    "packages/publisher/renderers/archify/index.mjs",
    "Interactive HTML renderer implementation",
  ),
  "qualification-owner": selected(
    "packages/publisher/src/qualification/contract.mjs",
    "Qualification schema and validation owner",
  ),
  "publication-owner": selected(
    "packages/publisher/src/publication/files.mjs",
    "Recoverable publication effect implementation",
  ),
  "installed-test-owner": selected(
    "tests/self-hosted-adopter.test.mjs",
    "Installed-use test implementation; not an execution observation",
  ),
});
