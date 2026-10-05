import { fail } from '../protocol/values.mjs';

const precise = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= 2048 &&
  value === value.trim() &&
  [...value].every((char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127);

/** Keep Edition type authority while removing sibling-only visual refinement. */
export function neutralFigurePolicy(policy) {
  return {
    profile: 'neutral',
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
    typeof catalog !== 'object' ||
    Array.isArray(catalog) ||
    !Object.keys(catalog).length ||
    Object.keys(catalog).length > 512
  )
    fail('figure_types_required');
  const glyphKinds = new Map();
  for (const [kind, icon] of Object.entries(catalog)) {
    if (!precise(kind) || typeof icon !== 'string' || !/^lucide:[a-z0-9-]+$/u.test(icon))
      fail('figure_type_invalid');
    if (glyphKinds.has(icon)) fail('figure_type_glyph_conflict');
    glyphKinds.set(icon, kind);
  }
  return pages.map((page) => ({
    ...page,
    nodes: page.nodes.map((node) => {
      if (node.primitives || node.adornment) return node;
      const kind = node.figureKind ?? (node.kind === null ? 'source element' : node.kind);
      if (!precise(kind) || !Object.hasOwn(catalog, kind)) fail('figure_type_missing');
      if (Object.hasOwn(node, 'icon')) fail('figure_type_occurrence_override');
      return { ...node, figureKind: kind, icon: catalog[kind] };
    }),
  }));
}
