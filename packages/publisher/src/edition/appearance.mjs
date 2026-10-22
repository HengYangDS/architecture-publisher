import { deepFreeze } from "../semantics/document.mjs";

export const INTERACTIVE_STYLES = deepFreeze(["editorial", "blueprint", "classic", "signal-flow"]);
export const INTERACTIVE_THEMES = deepFreeze(["light", "dark"]);

export const INTERACTIVE_APPEARANCE_SCHEMA = deepFreeze({
  type: "object",
  required: ["style", "theme"],
  properties: {
    style: { enum: INTERACTIVE_STYLES },
    theme: { enum: INTERACTIVE_THEMES },
  },
  additionalProperties: false,
});
