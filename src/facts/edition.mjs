import { BANDS, bandOf } from "./ages.mjs";
import { factOf, factSet } from "./catalogue.mjs";
import { viewFacts } from "./view.mjs";

/**
 * The edition's facts: what the publisher measures of a model's parts before any view is planned. For each part
 * the files it owns, their bytes and each file's share and age band; for each group the overview draws as one
 * part, its members' files together; for the edition the bytes of its largest part, the pin's date and release
 * and the number of files read. A view's facts, which exist only once the view is planned, are measured when the
 * view is first asked for. Every projection reads this layer and measures nothing itself.
 *
 * @typedef {import("./catalogue.mjs").Fact} Fact
 * @typedef {import("./view.mjs").Part} Part
 */

/** @type {import("./catalogue.mjs").Subject} */
const EDITION = Object.freeze({ kind: "edition" });

/** A part that owns no files, as a strip draws it. */
const NO_FILES = Object.freeze({ bytes: 0, files: Object.freeze([]) });

/**
 * The files the given parts own, each part's in claim order: as the binding resolved them at the pin, or, without
 * a checkout, as the model declares them.
 * @param {{ owned: Map<string, string[]> }} binding
 * @param {readonly string[]} ids
 * @returns {string[]}
 */
function ownedFiles(binding, ids) {
  return ids.flatMap((id) => binding.owned.get(id) ?? []);
}

/**
 * What the given parts claim, as their author wrote it: files, and directories ending in a slash. Without a checkout
 * no claim is resolved to the files it holds, so the claims themselves are what is stated.
 * @param {{ components: Array<{ id: string, files: string[] }> }} model
 * @param {readonly string[]} ids
 * @returns {string[]}
 */
function statedClaims(model, ids) {
  const claims = new Map(model.components.map(({ id, files }) => [id, files]));
  return ids.flatMap((id) => /** @type {string[]} */ (claims.get(id)));
}

/**
 * The bytes the given files hold together at the pin.
 * @param {ReadonlyArray<{ bytes: number }>} files
 */
function ownedBytes(files) {
  return files.reduce((sum, { bytes }) => sum + bytes, 0);
}

/**
 * A file's share of the bytes of the part it is drawn in; the files of a part that holds no byte share it evenly.
 * @param {number} bytes the file's
 * @param {number} whole the part's
 * @param {number} count the part's number of files
 */
function fileShare(bytes, whole, count) {
  return whole > 0 ? bytes / whole : 1 / count;
}

/**
 * The bytes the edition's longest strip stands for: its largest part's, or a group's that the overview draws,
 * when the group's members together own more; one byte at least, so every strip can be measured on it.
 * @param {ReadonlyArray<{ bytes: number }>} parts every part and every group
 */
function largestPart(parts) {
  return Math.max(1, ...parts.map(({ bytes }) => bytes));
}

/**
 * The pin's date as its committer recorded it.
 * @param {{ date: string }} commit
 */
function pinDate(commit) {
  return commit.date;
}

/**
 * The release the pin is tagged as, or none.
 * @param {{ release: string | null }} commit
 */
function pinRelease(commit) {
  return commit.release;
}

/**
 * The number of files the binding records: read at the pin, or, without a checkout, declared by the model.
 * @param {{ records: readonly unknown[] }} binding
 */
function filesRead(binding) {
  return binding.records.length;
}

/**
 * Measure the edition's facts. With a checkout read at the pin every fact is measured; without one the layer holds
 * each part's claims as stated, as its author wrote them, and no bytes, share, band, largest part, date or release, and never a zero or a
 * default in their place. The pin is taken once, from the commit facts: a file's age is the pin's time less that
 * of its last change.
 * @param {any} model the validated model, with its groups
 * @param {any} binding the source binding: its state, its records, each component's files and each file's time
 * @param {{ date: string, time: number, release: string | null } | null} commit the pin's commit facts, or none
 *   without a checkout
 */
export function editionFacts(model, binding, commit) {
  const pinned = binding.state === "verified";
  /** @type {Fact[]} */
  const facts = [];
  /** @type {Map<string, number>} */
  const sizes = new Map(binding.records.map((entry) => [entry.path, entry.bytes]));
  /**
   * A part as its strip is drawn, from the files it owns: in path order, each with its bytes, its band and its
   * share of the part.
   * @param {{ kind: "part" | "group", id: string }} of
   * @param {readonly string[]} paths
   * @returns {Part}
   */
  const measured = (of, paths) => {
    if (!paths.length) return NO_FILES;
    const read = [...paths].sort().map((path) => ({
      path,
      bytes: /** @type {number} */ (sizes.get(path)),
      band: bandOf(/** @type {{ time: number }} */ (commit).time - binding.times.get(path)),
    }));
    const bytes = ownedBytes(read);
    const files = read.map((file) => ({
      ...file,
      share: fileShare(file.bytes, bytes, read.length),
    }));
    facts.push(factOf("owned-bytes", of, bytes));
    for (const { path, share, band } of files) {
      const file = /** @type {const} */ ({ kind: "file", id: path, part: of.id });
      facts.push(factOf("file-share", file, share), factOf("file-age-band", file, band));
    }
    return { bytes, files };
  };
  /** @type {Map<string, string[]>} */
  const claimed = new Map();
  /** @type {Map<string, Part>} */
  const parts = new Map();
  /** @type {Map<string, Part>} */
  const groups = new Map();
  // Parts in the order the binding gives them; a part's ownership in claim order, a group's in path order.
  // Without a checkout a part's owned files are its claims as stated, a directory among them as a directory.
  for (const id of binding.owned.keys()) {
    const of = /** @type {const} */ ({ kind: "part", id });
    const paths = ownedFiles(binding, [id]);
    claimed.set(id, paths);
    facts.push(
      pinned
        ? factOf("owned-files", of, paths)
        : factOf("owned-files", of, statedClaims(model, [id]), true),
    );
    if (pinned) parts.set(id, measured(of, paths));
  }
  for (const { id, members } of model.groups) {
    const of = /** @type {const} */ ({ kind: "group", id });
    const paths = ownedFiles(binding, members).sort();
    facts.push(
      pinned
        ? factOf("owned-files", of, paths)
        : factOf("owned-files", of, statedClaims(model, members).sort(), true),
    );
    if (pinned) groups.set(id, measured(of, paths));
  }
  const drawn = [...parts.values(), ...groups.values()];
  if (drawn.some(({ files }) => files.length))
    facts.push(factOf("largest-part", EDITION, largestPart(drawn)));
  if (commit)
    facts.push(
      factOf("pin-date", EDITION, pinDate(commit)),
      factOf("pin-release", EDITION, pinRelease(commit)),
    );
  facts.push(factOf("files-read", EDITION, filesRead(binding), !pinned));
  const set = factSet(facts);
  /** The value of a fact of the edition, or none where the layer holds none. */
  const held = (property) => set.fact(property, EDITION)?.value ?? null;
  /**
   * @param {{ id: string, group?: boolean }} component
   * @returns {Part}
   */
  const strip = (component) =>
    parts.get(component.id) ??
    (component.group ? /** @type {Part} */ (groups.get(component.id)) : NO_FILES);
  /** @type {WeakMap<object, ReturnType<typeof viewFacts>>} */
  const views = new WeakMap();
  return {
    ...set,
    /**
     * A part as a strip draws it: its bytes and its files in path order, each with its bytes, band and share. A
     * group is its members' files together, where a view draws it as one part; a part that owns no files is the
     * empty part. None without a checkout read at the pin.
     * @param {{ id: string, group?: boolean }} component
     * @returns {Part | null}
     */
    part: (component) => (pinned ? strip(component) : null),
    /**
     * A component's files in claim order, the first being the one its title links to and the page cites. A group
     * has none of its own.
     * @param {string} id
     * @returns {readonly string[]}
     */
    owned: (id) => claimed.get(id) ?? [],
    /** @type {number | null} the bytes of the largest part, which every strip is measured on */
    scale: held("largest-part"),
    /** @type {string | null} the pin's date */
    date: held("pin-date"),
    /** @type {string | null} the release the pin is tagged as */
    release: held("pin-release"),
    /** @type {number} the number of files read */
    read: held("files-read"),
    /** The two spans of the age bands, in seconds. */
    spans: BANDS.spans,
    /**
     * A planned view's facts, measured once for each view.
     * @param {{ id: string, components: any[], relations: any[] }} view
     */
    view: (view) => {
      let seen = views.get(view);
      if (!seen) views.set(view, (seen = viewFacts(model, view, pinned ? strip : null)));
      return seen;
    },
  };
}
