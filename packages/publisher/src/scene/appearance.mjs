import { fail, hasExactFields } from "../protocol/values.mjs";
import { INTERACTIVE_STYLES, INTERACTIVE_THEMES } from "../edition/appearance.mjs";

/** Resolve finite paint choices without accepting scripts, CSS or geometry. */
export function interactiveAppearance(value) {
  if (value === undefined) return Object.freeze({ style: "editorial", theme: "light" });
  if (
    !hasExactFields(value, ["style", "theme"]) ||
    !INTERACTIVE_STYLES.includes(value.style) ||
    !INTERACTIVE_THEMES.includes(value.theme)
  )
    fail("interactive_appearance_invalid");
  return Object.freeze({ style: value.style, theme: value.theme });
}
