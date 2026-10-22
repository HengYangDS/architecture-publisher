import assert from "node:assert/strict";
import { claimModelDigest } from "../../packages/publisher/src/semantics/document.mjs";
import { editionFixture } from "./edition.mjs";

export async function api() {
  const module = await import("../../packages/publisher/src/edition/evolution.mjs").catch(
    () => ({}),
  );
  assert.equal(
    typeof module.compileEditionEvolution,
    "function",
    "Edition evolution compiler must exist",
  );
  return module;
}

export function pair() {
  const before = editionFixture(),
    after = editionFixture();
  return { before, after };
}

export function rebind(value, source = false) {
  value.edition.claimModel.digest = claimModelDigest(value.model);
  if (source) value.edition.source.manifestSha256 = "e".repeat(64);
  return value;
}

export function compile(compiler, before, after, correspondences = []) {
  return compiler({
    before: { claimModel: before.model, editions: [before.edition] },
    after: { claimModel: after.model, editions: [after.edition] },
    correspondences,
  });
}

export const obligationKeys = Object.freeze([
  "rebuild",
  "semanticVerification",
  "mediumVerification",
  "humanReview",
  "acceptance",
  "publication",
]);
