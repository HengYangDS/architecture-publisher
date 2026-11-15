import { resolvePalette } from "./model/edition.mjs";
import { refuse } from "./refusal.mjs";

/**
 * The print edition's style: the marks and palette the model chooses, and the edition's measured facts, which the
 * drawing reads and never measures. One style holds for every plate of an edition, so strip lengths and age bands keep
 * one scale across it.
 */

/**
 * The edition's style, the warnings its choice raises, and its record for the manifest: the marks, the palette's name
 * (`custom` for the model's own), its names in Chinese and English, its resolved roles, and for strips the age bands'
 * spans and the pin's date. A strip is drawn from the files a part owns, so strips need the bytes of a largest part:
 * a checkout read at the pin and at least one file a part owns.
 * @param {any} model the validated model, with its optional `edition`
 * @param {ReturnType<typeof import("./facts/edition.mjs").editionFacts>} facts the edition's measured facts
 */
export function editionStyle(model, facts) {
  const chosen = model.edition?.marks ?? null;
  const measured = facts.scale !== null;
  if (chosen === "strip" && !measured)
    refuse(
      "marks_need_files",
      "The model asks for strips, which are drawn from the files each part owns, but the build has none: pass " +
        "--repo with a checkout of the model's revision and let its components claim their files, or choose card marks.",
    );
  const name = chosen ?? (measured ? "strip" : "card");
  const warnings =
    chosen === null && !measured
      ? [
          {
            code: "marks_fallback",
            message:
              "The edition draws its parts as cards: a strip is drawn from the files a part owns, and this build " +
              "reads none.",
          },
        ]
      : [];
  const palette = resolvePalette(model.edition?.palette ?? null);
  const style = { name, tokens: palette.tokens, facts };
  const record = { marks: name, palette: palette.name, names: palette.names, roles: palette.roles };
  // The pin's date as its committer recorded it, the date the edition's foot prints beside the commit.
  const bands = name === "card" ? null : { spans: [...facts.spans], reference: facts.date };
  return { style, warnings, record: { ...record, bands } };
}
