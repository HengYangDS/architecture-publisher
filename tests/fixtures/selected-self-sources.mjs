import { SELF_SOURCE_SELECTION } from "../../editions/self/src/edition/sources.mjs";

export const selectedSelfSources = Object.freeze(
  Object.fromEntries(Object.entries(SELF_SOURCE_SELECTION).map(([id, value]) => [id, value.path])),
);
