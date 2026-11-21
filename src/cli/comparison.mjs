import { two } from "../names.mjs";
import { attention, count, near, passed, series } from "./facts.mjs";

/** How a file differs between two deliveries: in its bytes, or by standing in one of them alone. */
const difference = ({ first, second }) =>
  first === null
    ? "only in the second delivery"
    : second === null
      ? "only in the first delivery"
      : "differs";

/**
 * What a comparison of two deliveries found, as the groups of its report and its closing line: the two deliveries,
 * each checked against its own manifest before anything was compared, every plate with a page image or a file of
 * its figure alone that differs, named by its number and its views as a check names it, and every other file that
 * differs, as a file of the whole edition. The closing line says how many differ, or that the deliveries are identical.
 * @param {{
 *   first: string,
 *   second: string,
 *   identical: boolean,
 *   plates: { page: number, views: string[], files: { path: string, first: string | null, second: string | null }[] }[],
 *   files: { path: string, first: string | null, second: string | null }[],
 * }} result
 * @returns {{ groups: import("./facts.mjs").Group[], closing: string }}
 */
export function comparisonReport({ first, second, identical, plates, files }) {
  const differing = () =>
    series([
      ...(plates.length ? [count(plates.length, "plate")] : []),
      ...(files.length ? [`${count(files.length, "file")} of the whole edition`] : []),
    ]);
  return {
    groups: [
      {
        heading: "Deliveries",
        facts: [
          passed("First", `${near(first)} · its files match its manifest`),
          passed("Second", `${near(second)} · its files match its manifest`),
        ],
      },
      {
        heading: "Plates that differ",
        facts: plates.map((plate) =>
          attention(
            two(plate.page),
            `${plate.views.join(", ")} · ${plate.files
              .map((file) => `${file.path} ${difference(file)}`)
              .join(", ")}`,
          ),
        ),
      },
      {
        heading: "Files of the whole edition that differ",
        facts: files.map((file) => attention(file.path, difference(file))),
      },
    ],
    closing: identical
      ? "The deliveries are identical."
      : `${differing()} ${plates.length + files.length === 1 ? "differs" : "differ"}.`,
  };
}
