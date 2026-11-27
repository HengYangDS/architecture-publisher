// A delivery's files as the table beside the names states them (src/delivery.json), with the delivered model's name
// the shared table gives (src/shared.json), as the blocks of references.mjs print them: the operations reference's
// table of the files, and the ids a model may not take, which the tree's own src/names.mjs computes and the data and
// the refusals references name.
import { exported, readJson } from "./text.mjs";

/**
 * A delivery's files, read from the tree at `root`.
 * @param {string} root
 */
export async function deliveryFiles(root) {
  const delivery = await readJson(root, "src/delivery.json");
  const shared = await readJson(root, "src/shared.json");
  /** A file's name or pattern, the delivered model's name in place of `{shared}`. */
  const named = (/** @type {any} */ row) => row.name.replace("{shared}", shared.delivered.model);
  /** A file's name as a reference prints it: `{id}` as `<model id>`, any other part of a pattern in angle brackets. */
  const shown = (/** @type {any} */ row) =>
    named(row)
      .split(", ")
      .map(
        (/** @type {string} */ part) =>
          `\`${part
            .replace("{id}", "<model id>")
            .replace("{NN}", "NN")
            .replace(/\{(\w+)\}/gu, "<$1>")}\``,
      )
      .join(", ");
  // The ids a model may not take, as the tree's publisher computes them and refuses them: the computation is the
  // publisher's, and a table would state its result a second time.
  const TAKEN = await exported(root, "src/names.mjs", "TAKEN");
  /** What a refusal calls the file of one role: the table's. */
  const called = (/** @type {string} */ role) =>
    delivery.files.find((/** @type {any} */ row) => row.role === role).called;
  return {
    rows: delivery.files,
    defaultWidth: delivery.defaultWidth,
    shown,
    /** The ids a model may not take, and each name two files would share, with what a refusal calls each. */
    taken: {
      ids: [...new Set(TAKEN.map((/** @type {any} */ { id }) => id))],
      clashes: TAKEN.map((/** @type {any} */ { file, role, takes }) => ({
        file,
        one: called(role),
        other: called(takes),
      })),
    },
  };
}
