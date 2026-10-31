import { POSTER } from "../tokens.mjs";
import { crossingsOf } from "./ranking.mjs";

const C = POSTER.color;

/**
 * Assemble one composed page's SVG: figure shapes, page shapes, then outlined text.
 * @param {any} model
 * @param {any} typefaces
 * @param {any} icons
 * @param {any} chosen one page of the edition, as composeEdition returns it
 */
export function renderSheet(model, typefaces, icons, chosen) {
  const page = /** @type {any} */ (chosen.page);
  const made = /** @type {any[]} */ (chosen.made);
  const shapes = [...made.flatMap((one) => one.figure.shapes)];
  for (const glyph of page.glyphs) {
    if (glyph.shape === "icon")
      shapes.push(
        `<g transform="translate(${glyph.x},${glyph.top}) scale(${glyph.size / 24})" fill="none" ` +
          `stroke="${glyph.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
          `${icons.artwork(glyph.icon)}</g>`,
      );
    else if (glyph.shape === "boundary")
      shapes.push(
        `<rect x="${glyph.x}" y="${glyph.top + 4}" width="22" height="14" rx="4" fill="none" ` +
          `stroke="${C.boundary}" stroke-dasharray="4 3"/>`,
      );
    else if (glyph.shape === "outside")
      shapes.push(
        `<rect x="${glyph.x}" y="${glyph.top + 4}" width="22" height="14" rx="4" ` +
          `fill="${C.external}" stroke="${C.externalStroke}"/>`,
      );
    else
      shapes.push(
        `<line x1="${glyph.x}" y1="${glyph.top + 11}" x2="${glyph.x + 22}" y2="${glyph.top + 11}" ` +
          `stroke="${glyph.shape === "retired" ? C.faint : C.line}" stroke-width="${POSTER.wire.stroke}" ` +
          `stroke-dasharray="${glyph.shape === "retired" ? "1.5 3.5" : "6 4"}"/>`,
      );
  }
  for (const rule of page.rules)
    shapes.push(
      `<line x1="${rule.x1}" y1="${rule.y1}" x2="${rule.x2}" y2="${rule.y2}" stroke="${C.rule}"/>`,
    );
  const layers = new Map();
  for (const run of [...page.runs, ...made.flatMap((one) => one.figure.runs)]) {
    const key = `${run.layer}\u0000${run.color}`;
    const path = typefaces.outline(
      run.value,
      run.x,
      typefaces.baseline(run.top, run.style),
      run.style,
    );
    layers.set(key, (layers.get(key) ?? "") + path);
  }
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER.width}" height="${POSTER.height}" viewBox="0 0 ${POSTER.width} ${POSTER.height}">`,
    `<rect width="${POSTER.width}" height="${POSTER.height}" fill="${C.paper}"/>`,
    ...shapes,
    ...[...layers].map(
      ([key, d]) => `<path fill="${key.slice(key.indexOf("\u0000") + 1)}" d="${d}"/>`,
    ),
    "</svg>",
    "",
  ].join("\n");
  return {
    page: chosen.position.index + 1,
    views: chosen.views.map(({ id }) => id),
    title: chosen.views.length === 1 ? chosen.views[0].title : model.title,
    width: POSTER.width,
    height: POSTER.height,
    fits: true,
    position: chosen.position,
    admission: chosen.admission,
    misses: chosen.fails,
    composition: chosen.composition,
    measures: {
      crossings: crossingsOf(chosen),
      routes: made.reduce((sum, one) => sum + one.layout.measures.routes, 0),
      bends: made.reduce((sum, one) => sum + one.layout.measures.bends, 0),
      emptyShare: chosen.balance.emptyShare,
      emptyRectangle: chosen.balance.emptyRectangle,
      blankBand: chosen.balance.band.height,
      holes: chosen.balance.holes,
      centroid: chosen.balance.centroid,
    },
    svg,
  };
}
