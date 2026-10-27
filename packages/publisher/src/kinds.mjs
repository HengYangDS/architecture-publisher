import { CATEGORY_ICONS, GROUP_ICON } from "./icons.mjs";

/** Categories whose components lie outside the described system. */
const OUTSIDE = new Set(["person", "external"]);

/**
 * How one view component is presented in every medium: its legend entry,
 * category, icon and whether it lies outside the described system.
 * @param {{ kinds: Array<{ id: string, label: string, category: string, icon: string | null }> }} model
 * @param {{ kind: string | null, group?: boolean }} component
 */
export function presentation(model, component) {
  if (component.group)
    return { kind: "group", label: "group", category: "backend", icon: GROUP_ICON, outside: false };
  const kind = model.kinds.find(({ id }) => id === component.kind);
  const category = kind?.category ?? "backend";
  return {
    kind: kind?.id ?? "component",
    label: kind?.label ?? "component",
    category,
    icon: kind?.icon ?? CATEGORY_ICONS[/** @type {keyof typeof CATEGORY_ICONS} */ (category)],
    outside: OUTSIDE.has(category),
  };
}
