import { wordsOf } from "./locale.mjs";

/**
 * How each category of the model looks in every medium: its default Lucide icon, Archify's type for it, whether its
 * parts lie outside the described system, and whether it takes the palette's accent. The model's schema states the
 * categories and the default one; this table states how each looks, and a test holds the two to each other (the units
 * that draw do not read the model).
 */
export const CATEGORY_LOOKS = Object.freeze({
  person: Object.freeze({ icon: "user", archify: "external", outside: true, accent: false }),
  external: Object.freeze({ icon: "box", archify: "external", outside: true, accent: false }),
  frontend: Object.freeze({
    icon: "app-window",
    archify: "frontend",
    outside: false,
    accent: false,
  }),
  backend: Object.freeze({ icon: "server", archify: "backend", outside: false, accent: false }),
  database: Object.freeze({ icon: "database", archify: "database", outside: false, accent: false }),
  cloud: Object.freeze({ icon: "cloud", archify: "cloud", outside: false, accent: false }),
  messagebus: Object.freeze({
    icon: "waypoints",
    archify: "messagebus",
    outside: false,
    accent: false,
  }),
  security: Object.freeze({
    icon: "shield-check",
    archify: "security",
    outside: false,
    accent: true,
  }),
});
/** The category of a part that names no kind: the model's default category, which the test holds to the schema's. */
export const KINDLESS_CATEGORY = "backend";
/** How a group that stands for its members looks: its own icon, and the category whose look it takes. */
const GROUP_LOOK = Object.freeze({ icon: "layers", category: "backend" });

/**
 * How one view component is presented in every medium: its legend entry,
 * category, icon and whether it lies outside the described system.
 * @param {{ locale?: string, kinds: Array<{ id: string, label: string, category: string, icon: string | null }> }} model
 * @param {{ kind: string | null, group?: boolean }} component
 */
export function presentation(model, component) {
  const words = wordsOf(model.locale);
  if (component.group)
    return {
      kind: "group",
      label: words.group,
      category: GROUP_LOOK.category,
      icon: GROUP_LOOK.icon,
      outside: false,
    };
  const kind = model.kinds.find(({ id }) => id === component.kind);
  const category = kind?.category ?? KINDLESS_CATEGORY;
  const look = CATEGORY_LOOKS[/** @type {keyof typeof CATEGORY_LOOKS} */ (category)];
  return {
    kind: kind?.id ?? "component",
    label: kind?.label ?? words.component,
    category,
    icon: kind?.icon ?? look.icon,
    outside: look.outside,
  };
}
