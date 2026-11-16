import { resolvePalette } from "./model/edition.mjs";

/**
 * The print edition's style: the palette the model chooses, and the edition's measured facts, which the drawing reads
 * and never measures. One style holds for every plate of an edition, so strip lengths and age bands keep one scale
 * across it.
 */

/**
 * The edition's style and its record for the manifest: the palette's name (`custom` for the model's own), its names
 * in Chinese and English, its resolved roles, and where the edition draws strips the age bands' spans and the pin's
 * date. A strip is drawn from the files a part owns, so an edition draws strips where its facts hold the bytes of a
 * largest part: a checkout read at the pin and at least one file a part owns. Without them every part is drawn
 * without a strip, which is no fallback and raises no warning.
 * @param {any} model the validated model, with its optional `edition`
 * @param {ReturnType<typeof import("./facts/edition.mjs").editionFacts>} facts the edition's measured facts
 */
export function editionStyle(model, facts) {
  const palette = resolvePalette(model.edition?.palette ?? null);
  const style = { tokens: palette.tokens, facts };
  // The pin's date as its committer recorded it, the date the edition's foot prints beside the commit.
  const bands = facts.scale === null ? null : { spans: [...facts.spans], reference: facts.date };
  const record = { palette: palette.name, names: palette.names, roles: palette.roles, bands };
  return { style, record };
}
