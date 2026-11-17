/**
 * Remember what a pure function answered, under a key of everything it was given. A plate tries many candidates
 * that hand the channel solver the very same channel, since they differ in what stands inside the cards; the
 * solver reads only its arguments, so an equal input has an equal answer.
 */

/** How many results the store holds before its oldest leaves. */
const BOUND = 4096;

/**
 * The exact key of a value: every own property in its order. A reference back to an enclosing object, as a wire's
 * points name their wire, is written as the depth it returns to, so two inputs with one key are equal in
 * everything a reader can reach. A function has no key: an input that holds one is refused.
 * @param {unknown} value
 * @param {object[]} within the objects that enclose `value`, outermost first
 * @returns {string}
 */
function keyOf(value, within = []) {
  if (typeof value === "function")
    throw new TypeError("an input that holds a function is not remembered");
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  const depth = within.indexOf(value);
  if (depth >= 0) return `^${depth}`;
  within.push(value);
  const key = Array.isArray(value)
    ? `[${value.map((item) => keyOf(item, within)).join(",")}]`
    : `{${Object.keys(value)
        .map((name) => `${JSON.stringify(name)}:${keyOf(value[name], within)}`)
        .join(",")}}`;
  within.pop();
  return key;
}

/** Freeze a result through, so that no caller it is given to can change what the next is given. */
function frozen(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const item of Object.values(value)) frozen(item);
  return value;
}

/**
 * A function that answers an equal input from what it answered before. Results are frozen; when the store holds
 * `bound` of them, the oldest leaves.
 * @template {(...given: any[]) => any} F
 * @param {F} solve a function of its arguments alone
 * @param {number} [bound]
 * @returns {F}
 */
export function remembered(solve, bound = BOUND) {
  /** @type {Map<string, any>} */
  const known = new Map();
  return /** @type {F} */ (
    (...given) => {
      const key = keyOf(given);
      if (known.has(key)) return known.get(key);
      const result = frozen(solve(...given));
      if (known.size >= bound)
        for (const oldest of known.keys()) {
          known.delete(oldest);
          break;
        }
      known.set(key, result);
      return result;
    }
  );
}
