import { resolvePalette } from "./model/edition.mjs";
import { refuse } from "./refusal.mjs";
import { BANDS, bandOf } from "./sources/ages.mjs";

/**
 * The print edition's style: the marks and palette the model chooses, and, for strips, every part's files with the
 * size and age band each was read with at the pin. One style holds for every plate of an edition, so strip lengths and
 * age bands keep one scale across it.
 */

/**
 * Whether a binding carries the facts a strip is drawn from: a checkout read at the pin and at least one file a part
 * owns.
 * @param {any} binding
 */
const hasFileFacts = (binding) =>
  binding.state === "verified" && [...binding.owned.values()].some((files) => files.length > 0);

/**
 * The edition's style, the warnings its choice raises, and its record for the manifest: the marks, the palette's name
 * (`custom` for the model's own), its names in Chinese and English, its resolved roles, and for strips the age bands'
 * spans and the pin's date.
 * @param {any} model the validated model, with its optional `edition`
 * @param {any} binding the source binding, with its records, owned files, change times and the pin's time and date
 */
export function editionStyle(model, binding) {
  const chosen = model.edition?.marks ?? null;
  const facts = hasFileFacts(binding);
  if (chosen === "strip" && !facts)
    refuse(
      "marks_need_files",
      "The model asks for strips, which are drawn from the files each part owns, but the build has none: pass " +
        "--repo with a checkout of the model's revision and let its components claim their files, or choose card marks.",
    );
  const name = chosen ?? (facts ? "strip" : "card");
  const warnings =
    chosen === null && !facts
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
  const style = { name, tokens: palette.tokens };
  const record = { marks: name, palette: palette.name, names: palette.names, roles: palette.roles };
  if (name === "card") return { style, warnings, record: { ...record, bands: null } };
  const bytes = new Map(binding.records.map((entry) => [entry.path, entry.bytes]));
  const bands = BANDS;
  /** @type {Map<string, { bytes: number, files: Array<{ path: string, bytes: number, band: 0 | 1 | 2 }> }>} */
  const parts = new Map();
  for (const [id, files] of binding.owned) {
    const segments = [...files].sort().map((file) => ({
      path: file,
      bytes: /** @type {number} */ (bytes.get(file)),
      band: bandOf(binding.pinTime - binding.times.get(file)),
    }));
    parts.set(id, { bytes: segments.reduce((sum, file) => sum + file.bytes, 0), files: segments });
  }
  const most = Math.max(1, ...[...parts.values()].map((part) => part.bytes));
  // The pin's date as its committer recorded it, the date the edition's foot prints beside the commit.
  const reference = binding.pinDate;
  return {
    style: { ...style, parts, most, bands, reference },
    warnings,
    record: { ...record, bands: { spans: [...bands.spans], reference } },
  };
}
