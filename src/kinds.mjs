import fs from "node:fs";
import { wordsOf } from "./locale.mjs";

/**
 * How each category of the model looks in every medium, the category of a part that names no kind, and a group's
 * look: the table beside this module (src/categories.json), read once and read-only. The units that draw do not read
 * the model, so the model's schema states the categories and the default one as this table does: they are written
 * from it, as is the model reference's table of categories.
 * @type {{ categories: Readonly<Record<string, { icon: string, archify: string, outside: boolean, accent: boolean,
 *   spans: boolean }>>,
 *   kindless: string, group: { icon: string, category: string } }}
 */
const LOOKS = JSON.parse(
  fs.readFileSync(new URL("./categories.json", import.meta.url), "utf8"),
  (_key, value) => (value && typeof value === "object" ? Object.freeze(value) : value),
);
/**
 * How each category looks: its default icon, Archify's type, whether it lies outside, whether it takes the accent,
 * whether its lone end card may span a plate's figure.
 */
export const CATEGORY_LOOKS = LOOKS.categories;
/** The category of a part that names no kind: the model's default category. */
const KINDLESS_CATEGORY = LOOKS.kindless;
/** How a group that stands for its members looks: its own icon, and the category whose look it takes. */
const GROUP_LOOK = LOOKS.group;

/**
 * How one view component is presented in every medium: its legend entry,
 * category, icon, whether it lies outside the described system, and whether
 * its card may span a plate's figure as a band.
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
      spans: false,
    };
  const kind = model.kinds.find(({ id }) => id === component.kind);
  const category = kind?.category ?? KINDLESS_CATEGORY;
  const look = CATEGORY_LOOKS[category];
  return {
    kind: kind?.id ?? "component",
    label: kind?.label ?? words.component,
    category,
    icon: kind?.icon ?? look.icon,
    outside: look.outside,
    spans: look.spans,
  };
}
