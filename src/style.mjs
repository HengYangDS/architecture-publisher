import { resolvePalette } from "./model/edition.mjs";
import { refuse } from "./refusal.mjs";
import { ageBands, bandOf } from "./sources/ages.mjs";

/**
 * The print edition's style: the house style and palette the model chooses, and, for the woven style, every part's
 * files with the size and age band each was read with at the pin. One style holds for every plate of an edition, so
 * thickness and age bands keep one scale across it.
 */

/**
 * Whether a binding carries the facts a woven strip is drawn from: a checkout read at the pin and at least one file
 * a part owns.
 * @param {any} binding
 */
const weavable = (binding) =>
  binding.state === "verified" && [...binding.owned.values()].some((files) => files.length > 0);

/**
 * The edition's style, the warnings its choice raises, and its record for the manifest.
 * @param {any} model the validated model, with its optional `edition`
 * @param {any} binding the source binding, with its records, owned files, change times and pin time
 */
export function editionStyle(model, binding) {
  const chosen = model.edition?.style ?? null;
  const facts = weavable(binding);
  if (chosen === "bolts" && !facts)
    refuse(
      "style_needs_files",
      "The model asks for the bolts style, which weaves each part from the files it owns, but the build has none: " +
        "pass --repo with a checkout of the model's revision and let its components claim their files, or choose cards.",
    );
  const name = chosen ?? (facts ? "bolts" : "cards");
  const warnings =
    chosen === null && !facts
      ? [
          {
            code: "style_fallback",
            message:
              "The edition is set in cards: the bolts style weaves each part from the files it owns, and this build " +
              "reads none.",
          },
        ]
      : [];
  const palette = resolvePalette(model.edition?.palette ?? null);
  const style = { name, tokens: palette.tokens };
  const record = { style: name, palette: palette.name, roles: palette.roles };
  if (name === "cards") return { style, warnings, record };
  const bytes = new Map(binding.records.map((entry) => [entry.path, entry.bytes]));
  const owned = [...binding.owned.values()].flat();
  const ages = owned.map((file) => binding.pinTime - binding.times.get(file));
  const bands = ageBands(ages);
  /** @type {Map<string, { bytes: number, files: Array<{ path: string, bytes: number, band: 0 | 1 | 2 }> }>} */
  const parts = new Map();
  for (const [id, files] of binding.owned) {
    const woven = [...files].sort().map((file) => ({
      path: file,
      bytes: /** @type {number} */ (bytes.get(file)),
      band: bandOf(binding.pinTime - binding.times.get(file), bands),
    }));
    parts.set(id, { bytes: woven.reduce((sum, file) => sum + file.bytes, 0), files: woven });
  }
  const most = Math.max(1, ...[...parts.values()].map((part) => part.bytes));
  return {
    style: { ...style, parts, most, bands },
    warnings,
    record: { ...record, bands: { spans: bands.spans } },
  };
}
