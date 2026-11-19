import { editionWordsOf } from "./words.mjs";

/**
 * The record the house class typesets a delivery's print edition from: the model's own text, the facts the build
 * records, the edition's words in the model's language, each plate's figure, runs, key and links, and the index
 * of the parts by name.
 */

const two = (number) => String(number).padStart(2, "0");

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
export function editionRecord(input) {
  const { model, plates, icons, facts, time: datedAt } = input;
  const { release } = facts;
  const words = editionWordsOf(model.locale);
  const repository = model.repository;
  const short = repository ? repository.revision.slice(0, 7) : null;
  const { date } = facts;
  const editors = model.editors.map(({ name }) => name);
  const subject = `${repository?.name ?? model.title}${release ? ` ${release}` : ""}`;
  const at = short ? `${short}${date ? ` · ${date}` : ""}` : null;
  const plateRecords = plates.map((plate) => {
    const number = two(plate.page);
    const links = {};
    for (const run of plate.runs) {
      if (!run.component || !repository) continue;
      const url = linkOf(repository.browse, repository.revision, facts.owned(run.component)[0]);
      if (url) links[run.component] = url;
    }
    // Beside a figure that leaves part of the body: the view's summary, and where each component it shows lives,
    // as the model claims it.
    const shown = [...new Set(plate.runs.flatMap((run) => (run.component ? [run.component] : [])))];
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
      key: `plate-${number}`,
      number,
      views: plate.views,
      figureWidth: plate.width,
      figureHeight: plate.height,
      extent: plate.extent,
      summary: ["set", "above"].includes(plate.reading) ? (plate.summary ?? null) : null,
      // Above a figure that keeps the full width: the summary alone, and the lines the engine broke it into.
      standfirst: plate.reading === "above" ? plate.standfirst.lines : null,
      places,
      file: `plates/${number}.svg`,
      title: plate.title,
      question: plate.question,
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
  // The contents' rows are the plates alone; the overview has its own entry, `front`.
  /** @type {Record<string, { number: string, title: string, question: string }>} */
  const rows = {};
  for (const plate of plateRecords)
    rows[plate.key] = { number: plate.number, title: plate.title, question: plate.question };
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
    // The overview's own entry on the first page of the contents: a number, a name and one line, as a row has
    // them; the line is the claim the model states. The lead stands on the overview's own page.
    front: input.overview
      ? { number: "00", title: words.overview, claim: model.overview?.claim ?? null }
      : null,
    // The index: every part once, by name, with the numbers of the plates that draw it.
    index: model.components
      .map((component) => ({
        label: component.label,
        plates: plateRecords
          .filter((plate) => plate.runs.some((run) => run.component === component.id))
          .map((plate) => plate.number),
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
      { label: words.data, value: `${model.id}.json`, url: `${model.id}.json` },
    ],
    words: {
      edition: words.edition,
      contents: words.contents,
      overview: words.overview,
      writtenFrom: input.overview && facts.read ? words.writtenFrom(facts.read) : null,
      scope: words.scope,
      limits: words.limits,
      reading: words.reading,
      readingNote: words.readingNote(linked, input.page),
      // The plates a page of the contents lists; the house class writes the two numbers in, which only it knows.
      plateOnly: words.plateOnly("{from}"),
      plateRange: words.plateRange("{from}", "{to}"),
      plateRangeOf: words.plateRangeOf("{from}", "{to}", plates.length),
      index: words.index,
      indexLead: words.indexLead,
      places: words.places,
      attached: words.attached,
      built: at ? words.built(short ?? "", date) : null,
      foot: short ? words.foot(model.title, release, short, date) : model.title,
    },
    rows,
    plates: plateRecords,
  };
}
