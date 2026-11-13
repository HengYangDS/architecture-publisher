/**
 * The languages a model may be read in, and the words the publisher sets in
 * each itself: the headings of a poster's notes, the legend's boundary and
 * statuses, the labels and details it derives, and how a detail, a list and a
 * sentence are punctuated. Each is a language Archify's page speaks, so the
 * posters and the page of one model read alike. Everything else a reader sees
 * is the model's own text.
 */

/** A model that names no language is read in English. */
export const DEFAULT_LOCALE = "en";

/**
 * @typedef {{
 *   editors: (names: string[]) => string,
 *   inside: (boundary: string) => string, outside: string,
 *   planned: string, retired: string, component: string, group: string,
 *   includes: string, relations: string, uses: string,
 *   overview: (title: string, views: number) => string,
 *   question: (title: string) => string,
 *   colon: string, comma: string, semicolon: string, stop: string, between: string,
 *   files: (count: number, size: string) => string, ownsNoFiles: string,
 *   sinceCommit: (days: number) => string, within: (days: number) => string, earlier: string,
 *   committed: (date: string) => string, length: (size: string) => string, ticks: string,
 *   drawsOn: (part: string) => string,
 * }} Words
 */

/** @type {Readonly<Record<string, Readonly<Words>>>} */
const WORDS = Object.freeze({
  en: Object.freeze({
    editors: (names) => `Edited by ${names.join(", ")}`,
    inside: (boundary) => `inside ${boundary}`,
    outside: "outside it",
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
    sinceCommit: (days) => `within ${days} ${days === 1 ? "day" : "days"} of the commit`,
    within: (days) => `within ${days} ${days === 1 ? "day" : "days"}`,
    earlier: "earlier",
    committed: (date) => `commit date ${date}`,
    length: (size) => `${size}: a strip's length is the code a part owns`,
    ticks: "one tick per file the relation cites",
    drawsOn: (part) => `draws on ${part}`,
  }),
  "zh-CN": Object.freeze({
    editors: (names) => `编辑：${names.join("、")}`,
    inside: (boundary) => `${boundary} 内部`,
    outside: "外部",
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
    ownsNoFiles: "不拥有文件",
    sinceCommit: (days) => `提交前 ${days} 日内`,
    within: (days) => `提交前 ${days} 日内`,
    earlier: "更早",
    committed: (date) => `提交日 ${date}`,
    length: (size) => `${size}：条长是组件拥有的代码量`,
    ticks: "每道刻痕：这条关系引用的一个源文件",
    drawsOn: (part) => `指向${part}`,
  }),
  "zh-TW": Object.freeze({
    editors: (names) => `編輯：${names.join("、")}`,
    inside: (boundary) => `${boundary} 內部`,
    outside: "外部",
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
    ownsNoFiles: "不擁有檔案",
    sinceCommit: (days) => `提交前 ${days} 日內`,
    within: (days) => `提交前 ${days} 日內`,
    earlier: "更早",
    committed: (date) => `提交日 ${date}`,
    length: (size) => `${size}：條長是元件擁有的程式碼量`,
    ticks: "每道刻痕：這條關係引用的一個原始檔",
    drawsOn: (part) => `指向${part}`,
  }),
  es: Object.freeze({
    editors: (names) => `Edición de ${names.join(", ")}`,
    inside: (boundary) => `dentro de ${boundary}`,
    outside: "fuera",
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
    sinceCommit: (days) =>
      days === 1 ? "en el día previo al commit" : `en los ${days} días previos al commit`,
    within: (days) => (days === 1 ? "en el día previo" : `en los ${days} días previos`),
    earlier: "antes",
    committed: (date) => `fecha del commit ${date}`,
    length: (size) => `${size}: el largo de una tira es el código que posee un componente`,
    ticks: "una marca por cada archivo que cita la relación",
    drawsOn: (part) => `recurre a ${part}`,
  }),
  ko: Object.freeze({
    editors: (names) => `편집: ${names.join(", ")}`,
    inside: (boundary) => `${boundary} 내부`,
    outside: "외부",
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
    sinceCommit: (days) => `커밋 전 ${days}일 이내`,
    within: (days) => `${days}일 이내`,
    earlier: "그 이전",
    committed: (date) => `커밋 날짜 ${date}`,
    length: (size) => `${size}: 띠의 길이는 구성 요소가 가진 코드의 양`,
    ticks: "눈금 하나: 관계가 인용하는 파일 하나",
    drawsOn: (part) => `${part}(으)로 향함`,
  }),
});

/** The languages a model may name, in the order the reference lists them. */
export const LOCALES = Object.freeze(Object.keys(WORDS));

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
