/** Strict Publisher wire values; no domain or filesystem authority. */
/** @returns {never} */
export function fail(code, message = code) {
  throw Object.assign(new Error(message), { code });
}

export function isDigest(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function hasExactFields(value, required, optional = []) {
  return (
    record(value) &&
    required.every((key) => Object.hasOwn(value, key)) &&
    Reflect.ownKeys(value).every(
      (key) => typeof key === "string" && (required.includes(key) || optional.includes(key)),
    )
  );
}
