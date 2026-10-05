import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileEnvelope } from '../../src/file-input/read.mjs';
import { parseStrictJson } from '../../src/protocol/json.mjs';
import { fail, hasExactFields } from '../../src/protocol/values.mjs';
import { ICON_SUPPLY_SHA256 } from './identity.mjs';

const root = fileURLToPath(new URL('./supply/', import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Read only the finite, integrity-bound artwork and its complete notice. */
export async function loadFigureIconSupply() {
  const envelope = await readFileEnvelope(
    path.join(root, 'supply.json'),
    ICON_SUPPLY_SHA256,
    (manifest) => {
      if (
        !hasExactFields(manifest, ['schema', 'package', 'files']) ||
        manifest.schema !== 'architecture.icon-supply/v1' ||
        manifest.files?.length !== 2 ||
        manifest.files[0]?.path !== 'artwork.json' ||
        manifest.files[1]?.path !== 'LICENSE'
      )
        fail('figure_icon_supply_invalid');
      return manifest;
    },
    true,
  );
  const data = parseStrictJson(
    envelope.members[0].content,
    'figure_icon_supply_invalid',
    'figure_icon_supply_invalid',
  );
  if (
    !hasExactFields(data, ['viewBox', 'icons']) ||
    JSON.stringify(data.viewBox) !== '[0,0,24,24]' ||
    !data.icons ||
    typeof data.icons !== 'object' ||
    Array.isArray(data.icons)
  )
    fail('figure_icon_supply_invalid');
  for (const [id, glyph] of Object.entries(data.icons)) {
    if (
      !/^lucide:[a-z0-9-]+$/u.test(id) ||
      !hasExactFields(glyph, ['artwork', 'sha256']) ||
      typeof glyph.artwork !== 'string' ||
      sha(glyph.artwork) !== glyph.sha256
    )
      fail('figure_icon_supply_invalid');
  }
  return {
    icons: data.icons,
    license: Buffer.from(envelope.members[1].content),
    manifestSha256: envelope.manifestSha256,
  };
}

/** Identity aliases never qualify as visually distinct architecture types. */
export function validateFigureIconCatalog(catalog, supply) {
  if (catalog === undefined) return;
  const seen = new Set();
  for (const icon of Object.values(catalog)) {
    const glyph = supply.icons[icon];
    if (!glyph) fail('figure_type_glyph_unsupported');
    if (seen.has(glyph.sha256)) fail('figure_type_glyph_conflict');
    seen.add(glyph.sha256);
  }
}

/** Qualify checked scene IR without adding a second type-mapping authority. */
export function validateResolvedFigureIcons(pages, supply) {
  const kinds = new Map();
  const glyphs = new Map();
  for (const node of pages.flatMap(({ nodes }) => nodes)) {
    if (node.primitives || node.adornment) continue;
    const kind = node.figureKind ?? node.kind;
    const glyph = supply.icons[node.icon];
    if (typeof kind !== 'string' || !kind.trim()) fail('figure_type_missing');
    if (!glyph) fail('figure_type_glyph_unsupported');
    if (
      (kinds.has(kind) && kinds.get(kind) !== node.icon) ||
      (glyphs.has(glyph.sha256) && glyphs.get(glyph.sha256) !== kind)
    )
      fail('figure_type_glyph_conflict');
    kinds.set(kind, node.icon);
    glyphs.set(glyph.sha256, kind);
  }
}

/** The same upstream artwork paints nodes, keys and canonical SVG exports. */
export function renderFigureIcon(icon, supply, { x = 0, y = 0, size = 11 } = {}) {
  const glyph = supply.icons[icon];
  if (!glyph) fail('figure_type_glyph_unsupported');
  return `<g aria-hidden="true" data-semantic-sigil="${icon}" transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph.artwork}</g>`;
}
