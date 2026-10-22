import { validateFileMembers } from "../file-input/contract.mjs";
import { fail, hasExactFields } from "../protocol/values.mjs";

/** Source Bundle identity and source ownership, separate from file integrity. */
export function validateManifest(value) {
  if (!hasExactFields(value, ["schema", "source", "files"])) fail("manifest_fields_invalid");
  if (value.schema !== "architecture.source-bundle/v1") fail("schema_unsupported");
  if (
    !hasExactFields(value.source, ["id"], ["revision"]) ||
    typeof value.source.id !== "string" ||
    !value.source.id.trim() ||
    (Object.hasOwn(value.source, "revision") &&
      (typeof value.source.revision !== "string" || !value.source.revision.trim()))
  )
    fail("source_invalid");
  validateFileMembers(value.files);
  return structuredClone(value);
}
