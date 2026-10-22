import { fail } from "../protocol/values.mjs";
import { EDITION_PROJECT_SCHEMA } from "../edition/schema.mjs";

const precise = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  value.length <= 2048 &&
  value === value.trim() &&
  [...value].every((char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127);

const neutralGlyphs = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "hexagon",
  "octagon",
  "pentagon",
  "circle-dot",
  "square-dot",
  "circle-dashed",
  "square-dashed",
  "asterisk",
  "move",
  "plus",
  "equal",
  "slash",
  "grid-2x2",
  "grid-3x3",
  "command",
  "cross",
  "hash",
  "disc",
];

/** Encode declared kinds, not an inferred domain taxonomy or status vocabulary. */
export function deriveFigureTypeCatalog(pages, catalog, supply) {
  if (catalog !== undefined) return structuredClone(catalog);
  const sourceKindsByRole = new Map();
  for (const node of pages.flatMap(({ nodes }) =>
    nodes.filter((item) => !item.primitives && !item.adornment),
  )) {
    const role = node.figureKind ?? (node.kind === null ? "source element" : node.kind);
    const sourceKinds = sourceKindsByRole.get(role) ?? new Set();
    if (node.figureKind === undefined || node.figureKind === null) sourceKinds.add(node.kind);
    if (sourceKinds.size > 1) fail("figure_type_label_conflict");
    sourceKindsByRole.set(role, sourceKinds);
  }
  const kinds = [...sourceKindsByRole.keys()].sort();
  if (!kinds.length) return undefined;
  if (kinds.some((kind) => !precise(kind))) fail("figure_type_invalid");
  if (new Set(kinds.map((kind) => kind.toLocaleLowerCase("en"))).size !== kinds.length)
    fail("figure_type_label_conflict");
  const capacity =
    EDITION_PROJECT_SCHEMA.properties.visualPolicy.properties.figureTypes.maxProperties;
  if (kinds.length > capacity) fail("figure_type_encoding_capacity_exceeded");
  if (!supply?.icons) fail("figure_icon_supply_required");
  const candidates = [
    ...neutralGlyphs.map((glyph) => `lucide:${glyph}`),
    ...Object.keys(supply.icons).sort(),
  ];
  const artwork = new Set();
  const glyphs = candidates.filter((icon) => {
    const glyph = supply.icons[icon];
    if (!glyph || artwork.has(glyph.sha256)) return false;
    artwork.add(glyph.sha256);
    return true;
  });
  if (kinds.length > glyphs.length) fail("figure_type_encoding_capacity_exceeded");
  return Object.fromEntries(kinds.map((kind, index) => [kind, glyphs[index]]));
}

/** Keep Edition type authority while removing sibling-only visual refinement. */
export function neutralFigurePolicy(policy) {
  return {
    profile: "neutral",
    ...(policy?.figureTypes === undefined ? {} : { figureTypes: policy.figureTypes }),
  };
}

/** Resolve one Edition-wide type vocabulary; rendering validates pinned artwork. */
export function resolveFigureTypes(pages, catalog) {
  const ordinary = pages.flatMap(({ nodes }) =>
    nodes.filter((node) => !node.primitives && !node.adornment),
  );
  if (!ordinary.length && catalog === undefined) return pages;
  if (
    !catalog ||
    typeof catalog !== "object" ||
    Array.isArray(catalog) ||
    !Object.keys(catalog).length ||
    Object.keys(catalog).length > 512
  )
    fail("figure_types_required");
  const glyphKinds = new Map();
  const labels = new Set();
  const entries = new Map();
  for (const [kind, entry] of Object.entries(catalog)) {
    const icon = typeof entry === "string" ? entry : entry?.icon;
    const label = typeof entry === "string" ? kind : entry?.label;
    if (
      !precise(kind) ||
      !precise(label) ||
      typeof icon !== "string" ||
      !/^lucide:[a-z0-9-]+$/u.test(icon) ||
      (typeof entry !== "string" &&
        (!entry ||
          Object.keys(entry).length !== 2 ||
          !Object.hasOwn(entry, "icon") ||
          !Object.hasOwn(entry, "label")))
    )
      fail("figure_type_invalid");
    if (glyphKinds.has(icon)) fail("figure_type_glyph_conflict");
    const identity = label.toLocaleLowerCase("en");
    if (labels.has(identity)) fail("figure_type_label_conflict");
    labels.add(identity);
    entries.set(kind, { icon, ...(typeof entry === "string" ? {} : { figureLabel: label }) });
    glyphKinds.set(icon, kind);
  }
  return pages.map((page) => ({
    ...page,
    nodes: page.nodes.map((node) => {
      if (node.primitives || node.adornment) return node;
      const kind = node.figureKind ?? (node.kind === null ? "source element" : node.kind);
      if (!precise(kind) || !Object.hasOwn(catalog, kind)) fail("figure_type_missing");
      if (Object.hasOwn(node, "icon") || Object.hasOwn(node, "figureLabel"))
        fail("figure_type_occurrence_override");
      return { ...node, figureKind: kind, ...entries.get(kind) };
    }),
  }));
}
