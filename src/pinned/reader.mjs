import { detailText, readerWordsOf, wordsOf } from "../locale.mjs";
import { dataCounts } from "./data.mjs";

/**
 * The reader file: one Markdown text a reader starts from, written from the data and the guide's draft in the
 * work's language. Its generated parts state the work, its pin and every statement of the model once under its id,
 * with the facts the data holds for it; the guide's draft follows one heading, byte for byte, as the last part.
 * The lines that carry ids and facts are written in keys every language shares, and the parser reads them back, so
 * that what is about to be delivered can be held to the model and to the data. No time of writing is printed.
 *
 * A statement's item is `- <type> \`<id>\`: <text> · <fields>` where it first stands and `- <type> \`<id>\`` in
 * each later view. A line of facts is `- <origin>: \`<property>\` <value> <unit> · …`, the origin `stated` or
 * `measured (pin)` or `measured (model)`: under an item it states facts of that statement, and at the margin facts
 * of the edition, in the head, or of the view named above it. A list is stated by its length.
 */

const FIELD = " · ";
const code = (text) => `\`${text}\``;

/**
 * A text of the model on one line: a line break in it reads as a space, so no text of the model begins a line of
 * the file and none can be taken for an item, a line of facts or a heading.
 * @param {string} text
 */
const oneLine = (text) => text.split(/\s*[\r\n]+\s*/u).join(" ");

/** The type word of each list of statements, in the order a section lists them. */
const TYPES = Object.freeze([
  ["components", "component"],
  ["groups", "group"],
  ["relations", "relation"],
]);

/** What the layer calls the subject a type of statement is: a component is a part. */
const SUBJECT = Object.freeze({ component: "part", group: "group", relation: "relation" });

/**
 * A subject as one key: the edition, or a view, a part, a group or a relation by id.
 * @param {{ kind: string, id?: string }} of
 */
const subjectKey = ({ kind, id }) => `${kind}\u0000${id}`;

/** A fact's value as a line states it: a number, a list by its length, any other value between backticks. */
const valueText = (value) =>
  Array.isArray(value)
    ? String(value.length)
    : typeof value === "number"
      ? String(value)
      : code(value);

/**
 * The lines of facts of each subject, by subject: the facts of one origin on one line, in the data's order. A fact
 * whose value is none, such as a view without a hub, is not stated.
 * @param {ReadonlyArray<{ property: string, of: { kind: string, id?: string }, value: any, unit: string,
 *   origin: string, from?: string }>} facts
 * @returns {(of: { kind: string, id?: string }, indent?: string) => string[]}
 */
function factLines(facts) {
  /** @type {Map<string, Map<string, string[]>>} */
  const held = new Map();
  for (const { property, of, value, unit, origin, from } of facts) {
    if (value === null) continue;
    const lead = from ? `${origin} (${from})` : origin;
    const lines = held.get(subjectKey(of)) ?? new Map();
    held.set(subjectKey(of), lines);
    lines.set(lead, [...(lines.get(lead) ?? []), `${code(property)} ${valueText(value)} ${unit}`]);
  }
  return (of, indent = "") =>
    [...(held.get(subjectKey(of)) ?? [])].map(
      ([lead, stated]) => `${indent}- ${lead}: ${stated.join(FIELD)}`,
    );
}

/**
 * The reader file's bytes.
 * @param {any} data the data of the delivery, as `editionData` gives it
 * @param {{ sha256: string, draft?: Uint8Array | null }} written the digest of the data's file, and the guide's
 *   draft when the data records a guide
 * @returns {Buffer}
 */
export function readerFile(data, { sha256, draft }) {
  const { work, pin, statements } = data;
  const words = readerWordsOf(work.locale);
  const marks = wordsOf(work.locale);
  const factsOf = factLines(data.facts);
  /** A statement's item where it first stands: its text and fields, its details, its facts. */
  const item = (type, statement) => [
    `- ${type} ${code(statement.id)}: ${[
      type === "relation"
        ? oneLine(statement.text)
        : [oneLine(statement.label), statement.kind].filter(Boolean).join(", "),
      statement.status,
      statement.origin,
      statement.files?.length && `files ${statement.files.map(code).join(", ")}`,
      statement.members && `members ${statement.members.map(code).join(", ")}`,
    ]
      .filter(Boolean)
      .join(FIELD)}`,
    ...Object.entries(statement.details ?? {}).map(
      ([name, values]) => `  - ${detailText(marks, name, values.map(oneLine))}`,
    ),
    ...factsOf({ kind: SUBJECT[type], id: statement.id }, "  "),
  ];
  /** A section: its heading and the blocks that hold a line; none when no block does. */
  const section = (heading, ...blocks) => {
    const body = blocks.filter(({ length }) => length);
    return body.length ? [[`## ${heading}`], ...body] : [];
  };
  const counts = dataCounts(data).statements;
  const modelFields = [
    code(data.model.file),
    `version ${data.model.version}`,
    `bytes ${data.model.bytes}`,
    `sha256 ${code(data.model.sha256)}`,
  ];
  const head = [
    `- ${words.pin}${marks.colon}${[
      pin.repository && `${code(oneLine(pin.repository.name))} ${code(pin.repository.revision)}`,
      `state ${pin.state}`,
      pin.date && `date ${pin.date}`,
      pin.release && `release ${code(pin.release)}`,
    ]
      .filter(Boolean)
      .join(FIELD)}`,
    `- ${words.model}${marks.colon}${modelFields.join(FIELD)}`,
    `- ${words.data}${marks.colon}${code(`${work.id}.json`)}${FIELD}sha256 ${code(sha256)}`,
    `- ${words.statements}${marks.colon}${Object.entries(counts)
      .map(([key, count]) => `${key} ${count}`)
      .join(FIELD)}`,
    `- ${words.delivery}${marks.colon}${[
      ...data.media.flatMap((medium) =>
        medium === "edition" ? [`${work.id}.pdf`, "images/", "figures/"] : [`${work.id}.html`],
      ),
      "manifest.json",
    ]
      .map(code)
      .join(", ")}`,
    ...factsOf({ kind: "edition" }),
  ];
  // Each statement stands with its item once, in the first view that selects it, and by type and id after that.
  /** @type {Set<string>} */
  const stood = new Set();
  /** @type {Set<string>} */
  const asked = new Set();
  const plates = new Map(data.plates.map((plate) => [plate.number, plate]));
  const views = data.views.flatMap((view) => {
    const heading = oneLine(
      view.question && !asked.has(view.question) ? view.question : view.title,
    );
    asked.add(view.question);
    const plate = plates.get(view.plate);
    const items = TYPES.flatMap(([list, type]) =>
      view[list].flatMap((id) => {
        const key = subjectKey({ kind: type, id });
        if (stood.has(key)) return [`- ${type} ${code(id)}`];
        stood.add(key);
        return item(
          type,
          statements[list].find((statement) => statement.id === id),
        );
      }),
    );
    return section(heading, view.summary ? [oneLine(view.summary)] : [], [
      [
        `- view ${code(view.id)}`,
        plate && `plate ${plate.number}`,
        plate && code(plate.images[0].file),
        ...(plate?.figures ?? []).map(({ file }) => code(file)),
      ]
        .filter(Boolean)
        .join(FIELD),
      ...factsOf({ kind: "view", id: view.id }),
      ...items,
    ]);
  });
  const unselected = TYPES.flatMap(([list, type]) =>
    statements[list]
      .filter(({ id }) => !stood.has(subjectKey({ kind: type, id })))
      .map((statement) => item(type, statement)),
  );
  const excluded = work.coverage?.exclude ?? [];
  const uncovered = [
    ...(excluded.length
      ? [
          `- ${words.excluded}${marks.colon.trimEnd()}`,
          ...excluded.map(({ path, reason }) => `  - ${code(path)}: ${oneLine(reason)}`),
        ]
      : []),
    data.plates.length
      ? unselected.length && `- ${words.unplated(words.unselected, unselected.length)}`
      : `- ${words.noEdition}`,
    !data.guide && `- ${words.noGuide}`,
    pin.state === "unverified" && `- ${words.noCheckout}`,
    `- ${words.beyond}`,
    `- ${words.notCarried}`,
    data.guide && `- ${words.transitional}`,
  ].filter(Boolean);
  const blocks = [
    [`# ${oneLine(work.title)}`],
    [words.lead(work.id, work.locale, data.publisher.version)],
    head,
    [words.keys],
    ...section(
      words.scope,
      work.scope ? [oneLine(work.scope)] : [],
      work.limits.map((limit, index) => `${index + 1}. ${oneLine(limit)}`),
    ),
    ...section(
      words.question,
      [oneLine(work.question)],
      work.summary ? [oneLine(work.summary)] : [],
    ),
    ...views,
    ...section(words.unselected, unselected.flat()),
    ...section(words.notCovered, uncovered),
    ...section(words.checking, [
      `- ${words.verify}${marks.colon}${code("archpub verify <delivery>")}`,
      `- ${words.check}${marks.colon}${code("archpub check model.json --repo <checkout>")}`,
    ]),
    ...(data.guide ? [[`## ${words.guide}`]] : []),
  ];
  const generated = `${blocks.map((lines) => lines.join("\n")).join("\n\n")}\n`;
  // The guide's draft follows its heading and one empty line, and nothing follows the draft.
  return data.guide
    ? Buffer.concat([Buffer.from(`${generated}\n`), /** @type {Uint8Array} */ (draft)])
    : Buffer.from(generated);
}

const STATEMENT = /^- (component|relation|group) `([^`]+)`(: |$)/u;
const VIEW = /^- view `([^`]+)`/u;
const FACTS = /^( {2})?- (?:(stated)|measured \((pin|model)\)): (.+)$/u;
const FACT = /^`([a-z-]+)` (-?\d+(?:\.\d+)?|`[^`]*`) (\S+)$/u;

/**
 * Read a reader file's text back, as far as its generated parts go: the ids of the statements that stand with an
 * item, by type and in the file's order, a doubled item twice; the ids later views name; and every stated fact
 * with what it is a fact of. The reading stops at the heading of the guide's text, so no line of the guide is
 * taken for a statement. A line is a line of facts only when each of its parts is one, and it states facts of the
 * statement it hangs under, or at the margin of the edition or of the view named above it.
 * @param {string} text
 * @param {string | null | undefined} locale the work's language, whose heading the guide's text stands under
 */
export function parseReader(text, locale) {
  const lines = text.split("\n");
  const end = lines.indexOf(`## ${readerWordsOf(locale).guide}`);
  const stated = { components: [], relations: [], groups: [] };
  const named = { components: [], relations: [], groups: [] };
  /** @type {Array<{ property: string, of: { kind: string, id?: string }, value: string | number, unit: string,
   *   origin: string, from?: string }>} */
  const facts = [];
  /** @type {{ kind: string, id?: string }} */
  let margin = { kind: "edition" };
  /** @type {{ kind: string, id: string } | null} */
  let hung = null;
  for (const line of lines.slice(0, end === -1 ? undefined : end)) {
    const statement = STATEMENT.exec(line);
    const view = VIEW.exec(line);
    const stating = FACTS.exec(line);
    if (statement) {
      const [, type, id, text] = statement;
      (text ? stated : named)[`${type}s`].push(id);
      hung = { kind: SUBJECT[type], id };
    } else if (view) {
      margin = { kind: "view", id: view[1] };
      hung = null;
    } else if (stating) {
      const [, indent, author, from, rest] = stating;
      const of = indent ? hung : margin;
      const parts = rest.split(FIELD).map((part) => FACT.exec(part));
      if (!of || !parts.every(Boolean)) continue;
      for (const [, property, value, unit] of /** @type {RegExpExecArray[]} */ (parts))
        facts.push({
          property,
          of,
          value: value.startsWith("`") ? value.slice(1, -1) : Number(value),
          unit,
          ...(author ? { origin: "stated" } : { origin: "measured", from }),
        });
    } else if (!line.startsWith("  ")) hung = null;
  }
  return { stated, named, facts };
}
