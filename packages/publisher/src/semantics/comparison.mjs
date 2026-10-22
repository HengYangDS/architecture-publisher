import { canonical, record } from "./document.mjs";

export const different = (left, right) => canonical(left) !== canonical(right);
export const sorted = (values) => [...new Set(values)].sort();
export const lexical = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

export function changedFieldNames(before, after) {
  if (!record(before) || !record(after)) return ["$"];
  return sorted([...Object.keys(before), ...Object.keys(after)]).filter((field) =>
    different(before[field], after[field]),
  );
}
