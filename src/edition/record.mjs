import { OVERVIEW_KEY, filesOf, plateKey, shortRevision, stagedPlate, two } from "../names.mjs";
import { editionWordsOf } from "./words.mjs";

/**
 * The record the house class typesets a delivery's print edition from: the model's own text, the facts the build
 * records, the edition's words in the model's language, each plate's figure, runs, key and links, and the index
 * of the parts by name.
 */

/** The components a plate draws, each once, in the order of its runs. */
const partsOf = (plate) => [
  ...new Set(plate.runs.flatMap((run) => (run.component ? [run.component] : []))),
];

/**
 * A name as the words an index sorts it by: each word, and within a word each run of one script, since a name
 * such as "Agent技能" is read as two words whether or not a space parts them.
 * @param {string} name
 */
const runsOf = (name) =>
  name
    .split(/\s+/u)
    .flatMap((word) => word.match(/[\p{Script=Latin}\p{Nd}]+|[^\p{Script=Latin}\p{Nd}]+/gu) ?? [])
    .map((run) => ({ run, latin: /^[\p{Script=Latin}\p{Nd}]/u.test(run) }));

/**
 * The order of two names in an index: word by word, a word in Latin letters or digits before any other, two of one
 * script as the model's language sorts them, and a name that begins another before it. Two names of the same words
 * stand in the order of their characters, so that no two names are equal.
 * @param {string} one
 * @param {string} other
 * @param {string} locale the model's language
 */
export function compareNames(one, other, locale) {
  const [a, b] = [runsOf(one), runsOf(other)];
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index].latin !== b[index].latin) return a[index].latin ? -1 : 1;
    const order = a[index].run.localeCompare(b[index].run, locale, { numeric: true });
    if (order !== 0) return order;
  }
  if (a.length !== b.length) return a.length - b.length;
  return one < other ? -1 : one > other ? 1 : 0;
}

/**
 * A file's address in the model's repository browser, or null when the model names none.
 * @param {string | null} browse a URL template with `{revision}` and `{path}`
 * @param {string} revision
 * @param {string | undefined} file
 */
function linkOf(browse, revision, file) {
  if (!browse || !file) return null;
  const encoded = file.split("/").map(encodeURIComponent).join("/");
  return browse.split("{revision}").join(revision).split("{path}").join(encoded);
}

/**
 * The edition's record.
 * @param {{
 *   model: any, plates: any[], icons: any,
 *   facts: { owned: (id: string) => readonly string[], read: number, date: string | null,
 *     release: string | null },
 *   publisher: string, typst: string, overview: boolean, page: string,
 *   time: number | null,
 * }} input
 *   `facts` are the edition's measured facts: each part's files in claim order, the first of which its title links
 *   to, the number of files read, and the pin's date and release. `time` is the time the edition is dated by, in
 *   seconds, or none.
 */
/**
 * A plate's line back to the overview: the words of the first element of the statement that names one of its
 * views (a block's title, a point's label or the label of the part it names), or the edition's word for the
 * overview where those words are the plate's title; null where no element names one.
 * @param {any} model
 * @param {readonly string[]} views
 * @param {string} title
 * @param {string} overview the edition's word for the overview
 */
function backOf(model, views, title, overview) {
  /** @type {string | null} */
  let found = null;
  const walk = (/** @type {any} */ node) => {
    if (found !== null || !node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node.view === "string" && views.includes(node.view)) {
      const part = model.components.find((/** @type {any} */ one) => one.id === node.part);
      found = node.title ?? node.label ?? part?.label ?? overview;
      return;
    }
    for (const value of Object.values(node)) walk(value);
  };
  walk(model.overview);
  return found === title ? overview : found;
}

export function editionRecord(input) {
  const { model, plates, icons, facts, time: datedAt } = input;
  const { release } = facts;
  const words = editionWordsOf(model.locale);
  const repository = model.repository;
  const short = repository ? shortRevision(repository.revision) : null;
  const { date } = facts;
  const editors = model.editors.map(({ name }) => name);
  const subject = `${repository?.name ?? model.title}${release ? ` ${release}` : ""}`;
  const at = short ? `${short}${date ? ` · ${date}` : ""}` : null;
  const drawn = plates.map(partsOf);
  const plateRecords = plates.map((plate, index) => {
    const number = two(plate.page);
    const links = {};
    for (const run of plate.runs) {
      if (!run.component || !repository) continue;
      const url = linkOf(repository.browse, repository.revision, facts.owned(run.component)[0]);
      if (url) links[run.component] = url;
    }
    // Beside a figure that leaves part of the body: the view's summary, and where each component it shows lives,
    // as the model claims it.
    const shown = drawn[index];
    const places =
      plate.reading === "set"
        ? shown.flatMap((id) => {
            const component = model.components.find((one) => one.id === id);
            return component?.files?.length
              ? [{ label: component.label, files: component.files }]
              : [];
          })
        : [];
    return {
      key: plateKey(plate.page),
      number,
      views: plate.views,
      figureWidth: plate.width,
      figureHeight: plate.height,
      extent: plate.extent,
      summary: ["set", "above"].includes(plate.reading) ? (plate.summary ?? null) : null,
      // A figure that keeps the full body and sets no summary above it: the answer stands in the plate's head.
      answer: plate.reading === "omitted" ? (plate.summary ?? null) : null,
      // Above a figure that keeps the full width: the summary alone, and the lines the engine broke it into.
      standfirst: plate.reading === "above" ? plate.standfirst.lines : null,
      places,
      file: stagedPlate(plate.page),
      title: plate.title,
      question: plate.question,
      back: input.overview ? backOf(model, plate.views, plate.title, words.overview) : null,
      alt: words.plate(number, plate.title, plate.question),
      runs: plate.runs,
      // A kind's mark is its icon; every other mark is its legend entry as the plate drew it, so the house class
      // sets each sample (a band's dye, a strip's length, a count) at the plate's own scale.
      marks: plate.legend.map((entry) =>
        entry.icon
          ? { label: entry.label, artwork: icons.artwork(entry.icon), color: entry.color }
          : { ...entry },
      ),
      links,
    };
  });
  const linked = plateRecords.some(({ links }) => Object.keys(links).length > 0);
  // The reading note about the page's name: the name is one word of it, which the class never breaks. Every
  // language names the page once.
  const note = words.readingNote(linked, input.page).split(input.page);
  if (note.length !== 2) throw new Error("The reading note names the page once.");
  const [before, after] = note;
  const { data } = filesOf(model.id);
  const url = repository?.url ? repository.url.replace(/\.git$/u, "") : null;
  return {
    locale: model.locale,
    title: model.title,
    question: model.question,
    summary: model.summary,
    scope: model.scope,
    limits: model.limits,
    editors,
    keywords: [...new Set([model.id, repository?.name ?? model.id])],
    committed:
      datedAt !== null
        ? (() => {
            const time = new Date(datedAt * 1000);
            return [
              time.getUTCFullYear(),
              time.getUTCMonth() + 1,
              time.getUTCDate(),
              time.getUTCHours(),
              time.getUTCMinutes(),
              time.getUTCSeconds(),
            ];
          })()
        : null,
    subject: { date },
    byline: [
      { label: words.subject, value: subject, note: at },
      ...(editors.length
        ? [
            {
              label: words.edited,
              value: editors.join(words.list),
              note: model.license ? words.license(model.license) : null,
            },
          ]
        : []),
      {
        label: words.published,
        value: `Architecture Publisher ${input.publisher}`,
        note: `Typst ${input.typst} · ${words.standards}`,
      },
    ],
    // The overview's own entry on the first page of the contents: where it leads, its name and one line, the claim
    // the model states. It has no number, which would read as a plate's. The lead stands on the overview's own
    // page. The contents' rows are the plates themselves.
    front: input.overview
      ? {
          key: OVERVIEW_KEY,
          title: words.overview,
          claim: model.overview?.claim ?? null,
        }
      : null,
    // The index: every part once, by name, with the plates that draw it, each by its number and its page's label.
    index: model.components
      .map((component) => ({
        label: component.label,
        plates: plateRecords
          .filter((_, index) => drawn[index].includes(component.id))
          .map(({ number, key }) => ({ number, key })),
      }))
      .sort((one, other) => compareNames(one.label, other.label, model.locale)),
    // The line that closes the index: the repository by the one address the model states, or by its name alone;
    // the files read; and the edition's two other carriers, the page and the data, beside this file.
    closing: [
      ...(repository
        ? [
            {
              label: words.repository,
              value: url ? url.replace(/^https?:\/\//u, "") : repository.name,
              url,
            },
          ]
        : []),
      ...(facts.read ? [{ label: words.read, value: words.readValue(facts.read), url: null }] : []),
      { label: words.page, value: input.page, url: input.page },
      { label: words.data, value: data, url: data },
    ],
    words: {
      edition: words.edition,
      contents: words.contents,
      overview: words.overview,
      writtenFrom: input.overview && facts.read ? words.writtenFrom(facts.read) : null,
      scope: words.scope,
      limits: words.limits,
      reading: words.reading,
      readingNote: { before, name: input.page, after },
      // Under the title of each page of contents that take more than one.
      plateCount: words.plateCount(plates.length),
      index: words.index,
      indexLead: words.indexLead,
      places: words.places,
      attached: words.attached,
      built: at ? words.built(short ?? "", date) : null,
      foot: short ? words.foot(model.title, release, short, date) : model.title,
    },
    plates: plateRecords,
  };
}
