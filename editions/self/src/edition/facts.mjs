export const OWNER = "architecture-publisher:self-edition";

export const PRODUCT_CONTRACT = "product-contract";

const PRODUCT_SCOPE = Object.freeze({ product: "architecture-publisher" });

export const fact = (plane, maturity, condition, coverage = "complete") =>
  Object.freeze({
    plane,
    maturity,
    validity: "affirmed",
    condition: Object.freeze(condition),
    scope: PRODUCT_SCOPE,
    coverage,
  });

export const entity = (type, label, sourceId, responsibility, claim) =>
  Object.freeze({ type, label, sourceId, responsibility, claim });

export const relation = (type, subject, object, sourceId, claim) =>
  Object.freeze({ type, subject, object, sourceId, claim });
