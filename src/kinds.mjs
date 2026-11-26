import fs from "node:fs";
import { wordsOf } from "./locale.mjs";

/**
 * How each category of the model looks in every medium, the category of a part that names no kind, and a group's
 * look: the table beside this module (src/categories.json), read once and read-only. The model's schema states the
 * categories and the default one; the units that draw do not read the model, so a test holds the table to the schema,
 * and the model reference's table of categories is written from both.
 * @type {{ categories: Readonly<Record<string, { icon: string, archify: string, outside: boolean, accent: boolean }>>,
 *   kindless: string, group: { icon: string, category: string } }}
 */
const LOOKS = JSON.parse(
  fs.readFileSync(new URL("./categories.json", import.meta.url), "utf8"),
  (_key, value) => (value && typeof value === "object" ? Object.freeze(value) : value),
);
/** How each category looks: its default icon, Archify's type, whether it lies outside, whether it takes the accent. */
export const CATEGORY_LOOKS = LOOKS.categories;
/** The category of a part that names no kind: the model's default category, which the test holds to the schema's. */
export const KINDLESS_CATEGORY = LOOKS.kindless;
/** How a group that stands for its members looks: its own icon, and the category whose look it takes. */
const GROUP_LOOK = LOOKS.group;

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
  const look = CATEGORY_LOOKS[category];
  return {
    kind: kind?.id ?? "component",
    label: kind?.label ?? words.component,
    category,
    icon: kind?.icon ?? look.icon,
    outside: look.outside,
  };
}
