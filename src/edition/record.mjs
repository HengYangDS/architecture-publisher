import { editionWordsOf } from "./words.mjs";

/**
 * The record the house class typesets a delivery's print edition from: the model's own text, the facts the build
 * records, the edition's words in the model's language, and each plate's figure, runs, key and links.
 */

const two = (number) => String(number).padStart(2, "0");

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
 *   model: any, plates: any[], icons: any, owned: Map<string, string[]>, files: number,
 *   modelSha256: string, publisher: string, typst: string, overview: boolean, page: string,
 *   commit: { date: string | null, time: number } | null, release: string | null,
 * }} input
 */
export function editionRecord(input) {
  const { model, plates, icons, owned, commit, release } = input;
  const words = editionWordsOf(model.locale);
  const repository = model.repository;
  const short = repository ? repository.revision.slice(0, 7) : null;
  const date = commit?.date ?? null;
  const editors = model.editors.map(({ name }) => name);
  const subject = `${repository?.name ?? model.title}${release ? ` ${release}` : ""}`;
  const at = short ? `${short}${date ? ` · ${date}` : ""}` : null;
  const plateRecords = plates.map((plate) => {
    const number = two(plate.page);
    const links = {};
    for (const run of plate.runs) {
      if (!run.component || !repository) continue;
      const url = linkOf(repository.browse, repository.revision, owned.get(run.component)?.[0]);
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
      figureWidth: plate.width,
      figureHeight: plate.height,
      summary: ["set", "above"].includes(plate.reading) ? (plate.summary ?? null) : null,
      // Above a figure that keeps the full width: the summary alone, and the lines the engine broke it into.
      standfirst: plate.reading === "above" ? plate.standfirst.lines : null,
      places,
      file: `plates/${number}.svg`,
      title: plate.title,
      question: plate.question,
      alt: words.plate(number, plate.title, plate.question),
      runs: plate.runs,
      marks: plate.legend.map((entry) =>
        entry.icon
          ? { label: entry.label, artwork: icons.artwork(entry.icon), color: entry.color }
          : { label: entry.label, shape: entry.shape },
      ),
      links,
    };
  });
  const linked = plateRecords.some(({ links }) => Object.keys(links).length > 0);
  /** @type {Record<string, { number: string, title: string, question: string }>} */
  const rows = {};
  if (input.overview)
    rows["plate-00"] = { number: "00", title: words.overview, question: words.overviewNote };
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
    committed: commit
      ? (() => {
          const time = new Date(commit.time * 1000);
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
    facts: [
      { label: words.subject, value: at ? `${subject} · ${at}` : subject, url: null },
      ...(url ? [{ label: words.repository, value: url.replace(/^https?:\/\//u, ""), url }] : []),
      ...(input.files
        ? [{ label: words.read, value: words.readValue(input.files), url: null }]
        : []),
      {
        label: words.model,
        value: `${model.id} · SHA-256 ${input.modelSha256.slice(0, 16)}…`,
        url: null,
      },
      ...(editors.length || model.license
        ? [
            {
              label: words.edited,
              value: [editors.join(words.list), model.license ? words.license(model.license) : null]
                .filter(Boolean)
                .join(" · "),
              url: null,
            },
          ]
        : []),
      {
        label: words.typeset,
        value: `Typst ${input.typst} · ${words.standards}`,
        url: null,
      },
    ],
    words: {
      edition: words.edition,
      contents: words.contents,
      overview: words.overview,
      scope: words.scope,
      limits: words.limits,
      reading: words.reading,
      readingNote: words.readingNote(linked, input.page),
      places: words.places,
      attached: words.attached,
      built: at ? words.built(short ?? "", date) : null,
      foot: short ? words.foot(model.title, release, short, date) : model.title,
    },
    rows,
    plates: plateRecords,
  };
}
