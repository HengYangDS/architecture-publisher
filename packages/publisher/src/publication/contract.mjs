import { hasExactFields } from "../protocol/values.mjs";

export const QUALIFIED_SOURCE = "architecture.qualified-edition-source/v1";

export function exactFields(value, names, message, code) {
  if (!hasExactFields(value, names)) throw Object.assign(new Error(message), code ? { code } : {});
}

export function requireExplicitAcceptance(acceptance, planSha256, decision, message) {
  if (
    !acceptance ||
    typeof acceptance !== "object" ||
    Array.isArray(acceptance) ||
    acceptance.decision !== decision ||
    acceptance.planSha256 !== planSha256
  )
    throw Error(message);
  return acceptance;
}
