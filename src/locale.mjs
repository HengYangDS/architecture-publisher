/**
 * The languages a model may be read in, and the words the publisher sets in
 * each itself: the headings of a poster's notes, the legend's boundary and
 * statuses, the labels and details it derives, and how a detail, a list and a
 * sentence are punctuated. Each is a language Archify's page speaks, so the
 * posters and the page of one model read alike. Everything else a reader sees
 * is the model's own text.
 */
import fs from "node:fs";

/**
 * The languages a model may be written in and the language of a model that names none: the table beside this module
 * (src/locales.json), from which the model's schema is written.
 * @type {{ languages: string[], default: string }}
 */
const LANGUAGES = JSON.parse(fs.readFileSync(new URL("./locales.json", import.meta.url), "utf8"));
/** The languages a model may name, in the order the reference lists them. */
export const LOCALES = Object.freeze(LANGUAGES.languages);
/** The language of a model that names none. */
export const DEFAULT_LOCALE = LANGUAGES.default;
if (!LOCALES.includes(DEFAULT_LOCALE))
  throw new Error(`src/locales.json names a default language it does not list: ${DEFAULT_LOCALE}`);

/**
 * Refuse, at import, a table keyed by language that does not hold exactly the languages a model may name, in their
 * order: every language a model names has its words, and no table holds words for another.
 * @param {string} name what the table holds
 * @param {Readonly<Record<string, unknown>>} table
 */
export function keyedByLanguage(name, table) {
  const keys = Object.keys(table);
  if (keys.length !== LOCALES.length || keys.some((key, index) => key !== LOCALES[index]))
    throw new Error(
      `the ${name} are not keyed by the languages of src/locales.json: ${keys.join(", ")}`,
    );
}

/**
 * @typedef {{
 *   editors: (names: string[]) => string,
 *   inside: (boundary: string) => string, outside: string, context: string,
 *   planned: string, retired: string, component: string, group: string,
 *   includes: string, relations: string, uses: string,
 *   overview: (title: string, views: number) => string,
 *   question: (title: string) => string,
 *   colon: string, comma: string, semicolon: string, stop: string, between: string,
 *   files: (count: number, size: string) => string, ownsNoFiles: string,
 *   matrix: Readonly<{ corner: string }>,
 *   spine: Readonly<{ path: string }>,
 *   measures: Readonly<MeasureWords>,
 * }} Words
 *   `matrix` holds what a plate drawn as a matrix says of itself: the mark in its empty corner that tells its rows,
 *   the parts its relations leave, from its columns, the parts they reach. `spine` holds what a plate drawn as a
 *   spine says of itself: the key's name for its heavy line, the path along its stations.
 * @typedef {{
 *   "file-age-band": Readonly<{ newest: (days: number) => string, middle: (from: number, to: number) => string,
 *     oldest: (days: number) => string }>,
 *   "pin-date": (date: string | null) => string,
 *   "owned-bytes": (size: string) => string,
 *   "cited-files": string,
 *   hub: (part: string) => string,
 * }} MeasureWords
 *   The words a plate's key sets of a measured fact, each under the property of that fact in the catalogue of
 *   `src/facts`: the three bands of a file's age, each a bound in days and a unit; the commit they count from,
 *   with its date or, for a page whose foot states the date, without it; a strip's length; the count beside a
 *   relation; and the lines into a view's hub. A word says what the fact measures and no more: bytes are a size
 *   and files are files, of whatever type.
 */

/** @type {Readonly<Record<string, Readonly<Words>>>} */
const WORDS = Object.freeze({
  en: Object.freeze({
    editors: (names) => `Edited by ${names.join(", ")}`,
    inside: (boundary) => boundary,
    outside: "outside",
    context: "outside this group",
    planned: "planned",
    retired: "retired",
    component: "component",
    group: "group",
    includes: "includes",
    relations: "relations",
    uses: "uses",
    overview: (title, views) => `${title} in ${views} views.`,
    question: (title) => `How is ${title} structured?`,
    colon: ": ",
    comma: ", ",
    semicolon: "; ",
    stop: ".",
    between: " ",
    files: (count, size) => `${count} ${count === 1 ? "file" : "files"}, ${size}`,
    ownsNoFiles: "owns no files",
    matrix: Object.freeze({ corner: "from ↓ to →" }),
    spine: Object.freeze({ path: "main path" }),
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) => `≤ ${days} d`,
        middle: (from, to) => `${from}–${to} d`,
        oldest: (days) => `> ${days} d`,
      }),
      "pin-date": (date) =>
        date ? `last changed before commit @ ${date}:` : "last changed before commit:",
      "owned-bytes": (size) => `file size ${size}`,
      "cited-files": "cited files",
      hub: (part) => `to ${part}`,
    }),
  }),
  "zh-CN": Object.freeze({
    editors: (names) => `编辑：${names.join("、")}`,
    inside: (boundary) => boundary,
    outside: "外部",
    context: "本组之外",
    planned: "计划中",
    retired: "已退役",
    component: "组件",
    group: "分组",
    includes: "包含",
    relations: "关系数",
    uses: "使用",
    overview: (title, views) => `${title}，共 ${views} 个视图。`,
    question: (title) => `${title} 由哪些部分组成？`,
    colon: "：",
    comma: "、",
    semicolon: "；",
    stop: "。",
    between: "",
    files: (count, size) => `${count} 个文件，${size}`,
    ownsNoFiles: "没有所属文件",
    matrix: Object.freeze({ corner: "从 ↓ 到 →" }),
    spine: Object.freeze({ path: "主线" }),
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) => `≤ ${days} 天`,
        middle: (from, to) => `${from}–${to} 天`,
        oldest: (days) => `> ${days} 天`,
      }),
      "pin-date": (date) => (date ? `改动距提交 @ ${date}：` : "改动距提交："),
      "owned-bytes": (size) => `文件大小 ${size}`,
      "cited-files": "个引用文件",
      hub: (part) => `通向${part}`,
    }),
  }),
  "zh-TW": Object.freeze({
    editors: (names) => `編輯：${names.join("、")}`,
    inside: (boundary) => boundary,
    outside: "外部",
    context: "本組之外",
    planned: "規劃中",
    retired: "已退役",
    component: "元件",
    group: "分組",
    includes: "包含",
    relations: "關係數",
    uses: "使用",
    overview: (title, views) => `${title}，共 ${views} 個視圖。`,
    question: (title) => `${title} 由哪些部分組成？`,
    colon: "：",
    comma: "、",
    semicolon: "；",
    stop: "。",
    between: "",
    files: (count, size) => `${count} 個檔案，${size}`,
    ownsNoFiles: "沒有所屬檔案",
    matrix: Object.freeze({ corner: "從 ↓ 到 →" }),
    spine: Object.freeze({ path: "主線" }),
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) => `≤ ${days} 天`,
        middle: (from, to) => `${from}–${to} 天`,
        oldest: (days) => `> ${days} 天`,
      }),
      "pin-date": (date) => (date ? `改動距提交 @ ${date}：` : "改動距提交："),
      "owned-bytes": (size) => `檔案大小 ${size}`,
      "cited-files": "個引用檔案",
      hub: (part) => `通向${part}`,
    }),
  }),
  es: Object.freeze({
    editors: (names) => `Edición de ${names.join(", ")}`,
    inside: (boundary) => boundary,
    outside: "fuera",
    context: "fuera de este grupo",
    planned: "planificado",
    retired: "retirado",
    component: "componente",
    group: "grupo",
    includes: "incluye",
    relations: "relaciones",
    uses: "usa",
    overview: (title, views) => `${title} en ${views} vistas.`,
    question: (title) => `¿Cómo está estructurado ${title}?`,
    colon: ": ",
    comma: ", ",
    semicolon: "; ",
    stop: ".",
    between: " ",
    files: (count, size) => `${count} ${count === 1 ? "archivo" : "archivos"}, ${size}`,
    ownsNoFiles: "no posee archivos",
    matrix: Object.freeze({ corner: "de ↓ a →" }),
    spine: Object.freeze({ path: "recorrido principal" }),
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) => `≤ ${days} d`,
        middle: (from, to) => `${from}–${to} d`,
        oldest: (days) => `> ${days} d`,
      }),
      "pin-date": (date) =>
        date ? `último cambio antes del commit @ ${date}:` : "último cambio antes del commit:",
      "owned-bytes": (size) => `tamaño de archivos ${size}`,
      "cited-files": "archivos citados",
      hub: (part) => `a ${part}`,
    }),
  }),
  ko: Object.freeze({
    editors: (names) => `편집: ${names.join(", ")}`,
    inside: (boundary) => boundary,
    outside: "외부",
    context: "이 그룹 밖",
    planned: "계획됨",
    retired: "폐기됨",
    component: "구성 요소",
    group: "그룹",
    includes: "포함",
    relations: "관계 수",
    uses: "사용",
    overview: (title, views) => `${title}: 뷰 ${views}개.`,
    question: (title) => `${title}은(는) 어떻게 구성되어 있나요?`,
    colon: ": ",
    comma: ", ",
    semicolon: "; ",
    stop: ".",
    between: " ",
    files: (count, size) => `파일 ${count}개, ${size}`,
    ownsNoFiles: "소유한 파일 없음",
    matrix: Object.freeze({ corner: "↓에서 →로" }),
    spine: Object.freeze({ path: "주 경로" }),
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) => `≤ ${days}일`,
        middle: (from, to) => `${from}–${to}일`,
        oldest: (days) => `> ${days}일`,
      }),
      "pin-date": (date) => (date ? `커밋 @ ${date} 이전 마지막 변경:` : "커밋 이전 마지막 변경:"),
      "owned-bytes": (size) => `파일 크기 ${size}`,
      "cited-files": "인용 파일",
      hub: (part) => `${part}(으)로`,
    }),
  }),
});

keyedByLanguage("publisher's words", WORDS);

/** The languages written without spaces between words, whose lines spread evenly between their characters. */
const UNSPACED = new Set(["zh-CN", "zh-TW"]);

/**
 * Whether a language is written without spaces between words.
 * @param {string | null | undefined} locale
 */
export const writtenUnspaced = (locale) => UNSPACED.has(locale ?? DEFAULT_LOCALE);

/**
 * The words of one language.
 * @param {string | null | undefined} locale
 * @returns {Readonly<Words>}
 */
export function wordsOf(locale) {
  return WORDS[locale ?? DEFAULT_LOCALE] ?? WORDS[DEFAULT_LOCALE];
}

/**
 * The words one language sets of the measured facts, by the fact's property.
 * @param {string | null | undefined} locale
 * @returns {Readonly<MeasureWords>}
 */
export const measureWordsOf = (locale) => wordsOf(locale).measures;

/**
 * One named detail as a reader reads it: its name, then its values as a list.
 * @param {Readonly<Words>} words
 * @param {string} name
 * @param {readonly string[]} values
 */
export const detailText = (words, name, values) =>
  `${name}${words.colon}${values.join(words.comma)}`;

/**
 * The pieces a detail is set in when it wraps: its name and first value, then
 * each further value, every piece but the last carrying the list mark, and the
 * space set between pieces on one line. A list item breaks only between pieces
 * unless it is wider than its line on its own.
 * @param {Readonly<Words>} words
 * @param {string} name
 * @param {readonly string[]} values
 */
export function detailPieces(words, name, values) {
  const mark = words.comma.trimEnd();
  const gap = words.comma.slice(mark.length);
  const pieces = values.map(
    (value, index) =>
      `${index ? "" : `${name}${words.colon}`}${value}${index < values.length - 1 ? mark : ""}`,
  );
  return { pieces, gap };
}

/** Sentence-ending punctuation of every language a model may name. */
const ENDED = /[.!?。！？]$/u;
/** Han and Kana, whose sentences end with the ideographic full stop. */
const IDEOGRAPHIC_END = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u;

/**
 * Text ended as a sentence, so that several texts read apart when they are
 * set one after another: a text ending in Han or Kana with the ideographic full
 * stop, any other with the model language's own.
 * @param {Readonly<Words>} words
 * @param {string} text
 */
export function sentence(words, text) {
  const trimmed = String(text).trim();
  if (ENDED.test(trimmed)) return trimmed;
  return `${trimmed}${IDEOGRAPHIC_END.test(trimmed) ? "。" : words.stop}`;
}

/**
 * Texts set as sentences one after another, spaced as the model's language
 * spaces sentences; a sentence that ends with a Latin stop is always followed
 * by a space.
 * @param {Readonly<Words>} words
 * @param {readonly string[]} texts
 */
export function sentences(words, texts) {
  let out = "";
  for (const text of texts) {
    const next = sentence(words, text);
    out = out ? `${out}${/[.!?]$/u.test(out) ? " " : words.between}${next}` : next;
  }
  return out;
}
