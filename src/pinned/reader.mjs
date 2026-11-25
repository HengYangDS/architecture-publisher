import { detailText, wordsOf } from "../locale.mjs";
import { readerWordsOf } from "../reader-words.mjs";
import { FIGURES, IMAGES, MANIFEST, MODEL, filesOf } from "../names.mjs";
import { dataCounts } from "./data.mjs";

/**
 * The reader file: one Markdown document a reader starts from, at a Markdown viewer or as an agent, written in the
 * work's language from the data and from the guide as Archify reads it. Its generated parts state the work, its pin
 * and every statement of the model once under its id, with the facts the data holds for it; the guide follows one
 * heading as the last part, as prose. The data file is the one machine source: every word here is written from it,
 * and ids, paths, property names, values and units stand as code, as the data holds them, so a reader finds each
 * in the data. Nothing parses the file back but the check that it names each statement of the model
 * (`readerIds`). No time of writing is printed.
 *
 * A statement's item is `- <type> \`<id>\`<colon><text> · <fields>` where it first stands and `- <type> \`<id>\``
 * in each later view, the type in the work's language. A line of facts is `- <origin><colon>\`<property>\` <value>
 * <unit> · …`: under an item it states facts of that statement, and at the margin facts of the edition, in the head,
 * or of the view named above it. A list is stated by its length.
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

/**
 * A fact's value as a line states it, with its unit as the data holds it: a number, a list by its length, any other
 * value alone, each between backticks.
 * @param {unknown} value
 * @param {string} unit
 */
const valueText = (value, unit) =>
  code(
    Array.isArray(value)
      ? `${value.length} ${unit}`
      : typeof value === "number"
        ? `${value} ${unit}`
        : String(value),
  );

/**
 * The lines of facts of each subject, by subject: the facts of one origin on one line, in the data's order. A fact
 * whose value is none, such as a view without a hub, is not stated.
 * @param {ReadonlyArray<{ property: string, of: { kind: string, id?: string }, value: any, unit: string,
 *   origin: string, from?: string }>} facts
 * @param {import("../reader-words.mjs").ReaderWords} words
 * @param {string} colon
 * @returns {(of: { kind: string, id?: string }, indent?: string) => string[]}
 */
function factLines(facts, words, colon) {
  /** @type {Map<string, Map<string, string[]>>} */
  const held = new Map();
  for (const { property, of, value, unit, origin, from } of facts) {
    if (value === null) continue;
    const lead =
      origin === "stated" ? words.stated : from === "pin" ? words.measuredPin : words.measuredModel;
    const lines = held.get(subjectKey(of)) ?? new Map();
    held.set(subjectKey(of), lines);
    lines.set(lead, [...(lines.get(lead) ?? []), `${code(property)} ${valueText(value, unit)}`]);
  }
  return (of, indent = "") =>
    [...(held.get(subjectKey(of)) ?? [])].map(
      ([lead, stated]) => `${indent}- ${lead}${colon}${stated.join(FIELD)}`,
    );
}

/**
 * The reader file's bytes.
 * @param {any} data the data of the delivery, as `editionData` gives it
 * @param {{ sha256: string, guide?: string | null }} written the digest of the data's file, and the guide's part
 *   as Markdown (`guideText`) when the data records a guide
 * @returns {Buffer}
 */
export function readerFile(data, { sha256, guide }) {
  const { work, pin, statements } = data;
  const words = readerWordsOf(work.locale);
  const marks = wordsOf(work.locale);
  const files = filesOf(work.id);
  const factsOf = factLines(data.facts, words, marks.colon);
  const typeWord = (/** @type {string} */ type) =>
    words[/** @type {"component" | "relation" | "group"} */ (type)];
  /** A statement's item where it first stands: its text and fields, its details, its facts. */
  const item = (type, statement) => [
    `- ${typeWord(type)} ${code(statement.id)}${marks.colon}${[
      type === "relation"
        ? oneLine(statement.text)
        : [oneLine(statement.label), statement.kind].filter(Boolean).join(marks.comma),
      statement.status &&
        words[/** @type {"implemented" | "planned" | "retired"} */ (statement.status)],
      statement.origin === "stated" && words.stated,
      statement.files?.length && `${words.files} ${statement.files.map(code).join(", ")}`,
      statement.members && `${words.members} ${statement.members.map(code).join(", ")}`,
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
    `${words.version} ${data.model.version}`,
    `${data.model.bytes} ${words.bytes}`,
    `SHA-256 ${code(data.model.sha256)}`,
  ];
  const states = {
    verified: words.verified,
    unverified: words.unverified,
    none: words.noRepository,
  };
  const head = [
    `- ${words.pin}${marks.colon}${[
      pin.repository && `${code(oneLine(pin.repository.name))} ${code(pin.repository.revision)}`,
      states[/** @type {"verified" | "unverified" | "none"} */ (pin.state)],
      pin.date && `${words.date} ${pin.date}`,
      pin.release && `${words.release} ${code(pin.release)}`,
    ]
      .filter(Boolean)
      .join(FIELD)}`,
    `- ${words.model}${marks.colon}${modelFields.join(FIELD)}`,
    `- ${words.data}${marks.colon}${code(files.data)}${FIELD}SHA-256 ${code(sha256)}`,
    `- ${words.statements}${marks.colon}${Object.entries(counts)
      .map(
        ([key, count]) =>
          `${words[/** @type {"components" | "relations" | "groups" | "cited" | "unchecked" | "uncited"} */ (key)]} ${count}`,
      )
      .join(FIELD)}`,
    `- ${words.delivery}${marks.colon}${[
      ...data.media.flatMap((medium) =>
        medium === "edition" ? [files.edition, `${IMAGES}/`, `${FIGURES}/`] : [files.page],
      ),
      MANIFEST,
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
        if (stood.has(key)) return [`- ${typeWord(type)} ${code(id)}`];
        stood.add(key);
        return item(
          type,
          statements[list].find((statement) => statement.id === id),
        );
      }),
    );
    return section(heading, view.summary ? [oneLine(view.summary)] : [], [
      [
        `- ${words.view} ${code(view.id)}`,
        plate && `${words.plate} ${plate.number}`,
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
      `- ${words.check}${marks.colon}${code(`archpub check ${MODEL} --repo <checkout>`)}`,
    ]),
    ...(data.guide && guide ? [[`## ${words.guide}`], [guide.trimEnd()]] : []),
  ];
  return Buffer.from(`${blocks.map((lines) => lines.join("\n")).join("\n\n")}\n`);
}

/**
 * The statements a reader file names, as far as its generated parts go: the ids of the statements that stand with
 * an item, by type and in the file's order, a doubled item twice, and the ids later views name. An item is a line
 * `- <type> \`<id>\``, the type in the work's language, with its text after a colon or nothing; the reading stops
 * at the heading of the guide's part, so no line of the guide is taken for a statement.
 * @param {string} text
 * @param {string | null | undefined} locale the work's language
 * @param {boolean} [guided] whether the file holds a guide's part, whose heading is then its last of that name
 */
export function readerIds(text, locale, guided = true) {
  const words = readerWordsOf(locale);
  const lines = text.split("\n");
  // The guide's part is the last; a view headed by the same words stands before it, and a file without a guide has
  // no such part.
  const end = guided ? lines.lastIndexOf(`## ${words.guide}`) : -1;
  const stated = { components: [], relations: [], groups: [] };
  const named = { components: [], relations: [], groups: [] };
  const types = TYPES.map(
    ([list, type]) =>
      /** @type {const} */ ([
        list,
        words[/** @type {"component" | "relation" | "group"} */ (type)],
      ]),
  );
  for (const line of lines.slice(0, end === -1 ? undefined : end))
    for (const [list, word] of types) {
      const lead = `- ${word} \``;
      if (!line.startsWith(lead)) continue;
      const close = line.indexOf("`", lead.length);
      if (close < 0) continue;
      const id = line.slice(lead.length, close);
      const rest = line.slice(close + 1);
      /** @type {Record<string, string[]>} */ (rest ? stated : named)[list].push(id);
    }
  return { stated, named };
}
