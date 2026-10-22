import { fail, hasExactFields as fields } from "../../protocol/values.mjs";

const finite = (n) => Number.isFinite(n) && Math.abs(n) <= 1e7;
const invalid = () => fail("measurement_invalid");

/** Recorded measurement data is not an executable measurer or fresh evidence. */
export function createRecordedMetricReader(input) {
  if (
    !fields(input, ["schema", "provenance", "records"]) ||
    input.schema !== "architecture.text-metrics/v1" ||
    !fields(input.provenance, ["method", "environment", "fonts"]) ||
    input.provenance.method !== "recorded" ||
    typeof input.provenance.environment !== "string" ||
    !input.provenance.environment.trim() ||
    !Array.isArray(input.provenance.fonts) ||
    !input.provenance.fonts.length ||
    input.provenance.fonts.some((x) => typeof x !== "string" || !x.trim()) ||
    !Array.isArray(input.records) ||
    !input.records.length ||
    input.records.length > 20000
  )
    invalid();
  const records = new Map(),
    used = new Set();
  for (const row of input.records) {
    if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== "string") invalid();
    const [key, value] = row;
    let parts;
    try {
      parts = JSON.parse(key);
    } catch {
      invalid();
    }
    if (
      !Array.isArray(parts) ||
      parts.length !== 3 ||
      JSON.stringify(parts) !== key ||
      typeof parts[0] !== "string" ||
      !parts[0] ||
      parts[0].length > 20000 ||
      !Number.isFinite(parts[1]) ||
      parts[1] <= 0 ||
      parts[1] > 1024 ||
      typeof parts[2] !== "string" ||
      !parts[2] ||
      parts[2].length > 128 ||
      records.has(key) ||
      !fields(value, ["width", "height", "ascent", "descent", "glyph"]) ||
      !fields(value.glyph, ["x", "y", "width", "height"]) ||
      ![
        value.width,
        value.height,
        value.ascent,
        value.descent,
        ...Object.values(value.glyph),
      ].every(finite) ||
      value.width < 0 ||
      value.height <= 0 ||
      value.ascent < 0 ||
      value.descent < 0 ||
      value.glyph.width < 0 ||
      value.glyph.height < 0
    )
      invalid();
    records.set(key, Object.freeze({ ...value, glyph: Object.freeze({ ...value.glyph }) }));
  }
  return {
    recordCount: records.size,
    get usedCount() {
      return used.size;
    },
    measure(text, size, weight = "400") {
      const key = JSON.stringify([text, size, weight]),
        value = records.get(key);
      if (!value) fail("measurement_missing");
      used.add(key);
      return value;
    },
  };
}
