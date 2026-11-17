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
 *   measures: Readonly<MeasureWords>,
 * }} Words
 * @typedef {{
 *   "file-age-band": Readonly<{ newest: (days: number) => string, middle: (days: number) => string, oldest: string }>,
 *   "pin-date": (date: string) => string,
 *   "owned-bytes": (size: string) => string,
 *   "cited-files": string,
 *   hub: (part: string) => string,
 * }} MeasureWords
 *   The words a plate's key sets of a measured fact, each under the property of that fact in the catalogue of
 *   `src/facts`: the three bands of a file's age, the pin's date, a strip's length, the count beside a relation
 *   and the lines into a view's hub. A word says what the fact measures and no more: bytes are a size and files
 *   are files, of whatever type.
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
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) => `within ${days} ${days === 1 ? "day" : "days"} of the commit`,
        middle: (days) => `within ${days} ${days === 1 ? "day" : "days"}`,
        oldest: "earlier",
      }),
      "pin-date": (date) => `commit date ${date}`,
      "owned-bytes": (size) => `${size}: a strip's length is the size of a part's files`,
      "cited-files": "number: the files this relation cites",
      hub: (part) => `heavy lines lead to ${part}`,
    }),
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
    ownsNoFiles: "没有所属文件",
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) => `提交前 ${days} 日内`,
        middle: (days) => `提交前 ${days} 日内`,
        oldest: "更早",
      }),
      "pin-date": (date) => `提交日 ${date}`,
      "owned-bytes": (size) => `${size}：条长是组件所属文件的大小`,
      "cited-files": "数字：这条关系引用的文件数",
      hub: (part) => `粗线：通向${part}`,
    }),
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
    ownsNoFiles: "沒有所屬檔案",
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) => `提交前 ${days} 日內`,
        middle: (days) => `提交前 ${days} 日內`,
        oldest: "更早",
      }),
      "pin-date": (date) => `提交日 ${date}`,
      "owned-bytes": (size) => `${size}：條長是元件所屬檔案的大小`,
      "cited-files": "數字：這條關係引用的檔案數",
      hub: (part) => `粗線：通向${part}`,
    }),
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
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) =>
          days === 1 ? "en el día previo al commit" : `en los ${days} días previos al commit`,
        middle: (days) => (days === 1 ? "en el día previo" : `en los ${days} días previos`),
        oldest: "antes",
      }),
      "pin-date": (date) => `fecha del commit ${date}`,
      "owned-bytes": (size) =>
        `${size}: el largo de una tira es el tamaño de los archivos del componente`,
      "cited-files": "número: los archivos que cita esta relación",
      hub: (part) => `las líneas gruesas llevan a ${part}`,
    }),
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
    measures: Object.freeze({
      "file-age-band": Object.freeze({
        newest: (days) => `커밋 전 ${days}일 이내`,
        middle: (days) => `${days}일 이내`,
        oldest: "그 이전",
      }),
      "pin-date": (date) => `커밋 날짜 ${date}`,
      "owned-bytes": (size) => `${size}: 띠의 길이는 구성 요소가 가진 파일의 크기`,
      "cited-files": "숫자: 이 관계가 인용하는 파일 수",
      hub: (part) => `굵은 선: ${part}(으)로 향함`,
    }),
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

/**
 * The words the publisher sets in a reader file: its headings, the labels of its head and the sentences of its
 * closing parts. The keys a reader file shares with the data are written alike in every language and are not
 * here: ids, paths, the type words `component`, `relation` and `group`, the origins, property names and units.
 * @typedef {{
 *   lead: (id: string, locale: string, version: string) => string,
 *   pin: string, model: string, data: string, statements: string, delivery: string, keys: string,
 *   scope: string, question: string, unselected: string, notCovered: string, checking: string, guide: string,
 *   excluded: string, unplated: (heading: string, count: number) => string, noEdition: string, noGuide: string,
 *   noCheckout: string, beyond: string, notCarried: string, transitional: string, verify: string, check: string,
 * }} ReaderWords
 */

/** @type {Readonly<Record<string, Readonly<ReaderWords>>>} */
const READER_WORDS = Object.freeze({
  en: Object.freeze({
    lead: (id, locale, version) =>
      `Reader file of the work \`${id}\` in \`${locale}\`, written by Architecture Publisher ${version}.`,
    pin: "Pin",
    model: "Model",
    data: "Data",
    statements: "Statements",
    delivery: "Also in this delivery",
    keys: "Keys: `stated` was written by the author; `measured (pin)` was measured by the publisher in the checkout at the pin, and `measured (model)` counted from the model. A statement is `cited` when the files it names were read at the pin, `unchecked` when the build had no checkout to read them in, and `uncited` when it names no file.",
    scope: "Scope and limits",
    question: "The question",
    unselected: "Statements no view selects",
    notCovered: "Not covered",
    checking: "Checking again",
    guide: "The guide's text",
    excluded: "Paths the model's scope excludes",
    unplated: (heading, count) =>
      `No plate draws the statements listed under "${heading}" (${count}).`,
    noEdition: "This delivery holds no print edition, so no plate draws a statement.",
    noGuide: "The model names no guide, so this file carries none.",
    noCheckout:
      "The build had no checkout of the repository: no file was read at the pin, and every statement that names files is unchecked.",
    beyond:
      "This file lists components, relations and groups and no other written statement, and it judges no statement supported.",
    notCarried:
      "The text of an overview page and of a guide's diagram documents is not carried; the files those diagrams cite stand in the data's evidence table, and the facts of single files in the data alone.",
    transitional:
      "The last part is the guide as its author wrote it, unchanged to the end of this file; it is a transitional part, which shrinks when the guide's sentences enter the model.",
    verify: "Verify the files of this delivery against its manifest",
    check: "Check the model against a checkout at the pin",
  }),
  "zh-CN": Object.freeze({
    lead: (id, locale, version) =>
      `作品 \`${id}\` 的读者文件，语言 \`${locale}\`，由 Architecture Publisher ${version} 写出。`,
    pin: "固定的提交",
    model: "模型",
    data: "数据",
    statements: "陈述",
    delivery: "本交付物另含",
    keys: "标记说明：`stated` 为作者所写；`measured (pin)` 为出版工具在固定提交的检出目录中测得，`measured (model)` 由模型统计得出。陈述所列文件均已在固定的提交中读到，记为 `cited`；构建时没有检出目录可读，记为 `unchecked`；未列任何文件，记为 `uncited`。",
    scope: "范围与局限",
    question: "问题",
    unselected: "没有视图选入的陈述",
    notCovered: "本文件未收入的内容",
    checking: "再次核对",
    guide: "导读原文",
    excluded: "模型范围排除的路径",
    unplated: (heading, count) => `「${heading}」下所列陈述（${count} 条）没有图版绘出。`,
    noEdition: "本交付物不含图册，因此没有图版绘出任何陈述。",
    noGuide: "模型未指定导读，本文件不附导读。",
    noCheckout: "构建时没有仓库的检出目录：未在固定的提交中读取任何文件，凡列有文件的陈述均未核对。",
    beyond: "本文件只列组件、关系和分组，不列其他文字陈述，也不判定任何陈述是否有据。",
    notCarried:
      "总览页的文字和导读中各幅图的文档文字未收入；这些图引用的文件见数据中的证据表，单个文件的事实只见于数据。",
    transitional:
      "最后一部分是作者所写的导读，原样收录至文件末尾；这是过渡部分，导读的内容并入模型后会缩短。",
    verify: "按清单核验本交付物的文件",
    check: "对照固定提交的检出目录核对模型",
  }),
  "zh-TW": Object.freeze({
    lead: (id, locale, version) =>
      `作品 \`${id}\` 的讀者檔案，語言 \`${locale}\`，由 Architecture Publisher ${version} 寫出。`,
    pin: "固定的提交",
    model: "模型",
    data: "資料",
    statements: "陳述",
    delivery: "本交付物另含",
    keys: "標記說明：`stated` 為作者所寫；`measured (pin)` 為出版工具在固定提交的簽出目錄中測得，`measured (model)` 由模型統計得出。陳述所列檔案均已在固定的提交中讀到，記為 `cited`；建置時沒有簽出目錄可讀，記為 `unchecked`；未列任何檔案，記為 `uncited`。",
    scope: "範圍與侷限",
    question: "問題",
    unselected: "沒有視圖選入的陳述",
    notCovered: "本檔案未收入的內容",
    checking: "再次核對",
    guide: "導讀原文",
    excluded: "模型範圍排除的路徑",
    unplated: (heading, count) => `「${heading}」下所列陳述（${count} 條）沒有圖版繪出。`,
    noEdition: "本交付物不含圖冊，因此沒有圖版繪出任何陳述。",
    noGuide: "模型未指定導讀，本檔案不附導讀。",
    noCheckout: "建置時沒有儲存庫的簽出目錄：未在固定的提交中讀取任何檔案，凡列有檔案的陳述均未核對。",
    beyond: "本檔案只列元件、關係和分組，不列其他文字陳述，也不判定任何陳述是否有據。",
    notCarried:
      "總覽頁的文字和導讀中各幅圖的文件文字未收入；這些圖引用的檔案見資料中的證據表，單一檔案的事實只見於資料。",
    transitional:
      "最後一部分是作者所寫的導讀，原樣收錄至檔案末尾；這是過渡部分，導讀的內容併入模型後會縮短。",
    verify: "按清單核驗本交付物的檔案",
    check: "對照固定提交的簽出目錄核對模型",
  }),
  es: Object.freeze({
    lead: (id, locale, version) =>
      `Archivo del lector de la obra \`${id}\` en \`${locale}\`, escrito por Architecture Publisher ${version}.`,
    pin: "Revisión fijada",
    model: "Modelo",
    data: "Datos",
    statements: "Enunciados",
    delivery: "También en esta entrega",
    keys: "Claves: `stated` lo escribió el autor; `measured (pin)` lo midió la herramienta de publicación en la copia de trabajo de la revisión fijada, y `measured (model)` lo contó a partir del modelo. Un enunciado es `cited` cuando los archivos que nombra se leyeron en la revisión fijada, `unchecked` cuando la compilación no tenía copia de trabajo donde leerlos y `uncited` cuando no nombra ningún archivo.",
    scope: "Alcance y límites",
    question: "La pregunta",
    unselected: "Enunciados que ninguna vista selecciona",
    notCovered: "Lo que este archivo no cubre",
    checking: "Comprobar de nuevo",
    guide: "El texto de la guía",
    excluded: "Rutas que el alcance del modelo excluye",
    unplated: (heading, count) =>
      `Ninguna lámina dibuja los enunciados listados en «${heading}» (${count}).`,
    noEdition:
      "Esta entrega no contiene edición impresa, así que ninguna lámina dibuja un enunciado.",
    noGuide: "El modelo no nombra ninguna guía, así que este archivo no lleva ninguna.",
    noCheckout:
      "La compilación no tenía copia de trabajo del repositorio: no se leyó ningún archivo en la revisión fijada, y todo enunciado que nombra archivos queda sin comprobar.",
    beyond:
      "Este archivo lista componentes, relaciones y grupos y ningún otro enunciado escrito, y no da por respaldado ningún enunciado.",
    notCarried:
      "No se incluye el texto de la página del panorama ni el de los documentos de diagramas de la guía; los archivos que citan esos diagramas están en la tabla de evidencia de los datos, y los hechos de archivos individuales solo en los datos.",
    transitional:
      "La última parte es la guía tal como la escribió su autor, sin cambios hasta el final de este archivo; es una parte transitoria, que se acortará cuando las frases de la guía entren en el modelo.",
    verify: "Verificar los archivos de esta entrega con su manifiesto",
    check: "Comprobar el modelo con una copia de trabajo en la revisión fijada",
  }),
  ko: Object.freeze({
    lead: (id, locale, version) =>
      `작품 \`${id}\`의 독자 파일, 언어 \`${locale}\`, Architecture Publisher ${version} 작성.`,
    pin: "고정 리비전",
    model: "모델",
    data: "데이터",
    statements: "진술",
    delivery: "이 산출물에 함께 있는 파일",
    keys: "키: `stated`는 저자가 쓴 것이고, `measured (pin)`은 출판 도구가 고정 리비전의 체크아웃에서 측정한 것이며, `measured (model)`은 모델에서 센 것입니다. 진술이 명시한 파일을 고정 리비전에서 모두 읽었으면 `cited`, 빌드에 읽을 체크아웃이 없었으면 `unchecked`, 파일을 명시하지 않았으면 `uncited`입니다.",
    scope: "범위와 한계",
    question: "질문",
    unselected: "어떤 뷰도 선택하지 않은 진술",
    notCovered: "이 파일이 다루지 않는 것",
    checking: "다시 확인하기",
    guide: "가이드 원문",
    excluded: "모델의 범위가 제외하는 경로",
    unplated: (heading, count) =>
      `"${heading}" 아래의 진술(${count}개)은 어떤 도판도 그리지 않습니다.`,
    noEdition: "이 산출물에는 인쇄판이 없으므로 어떤 도판도 진술을 그리지 않습니다.",
    noGuide: "모델이 가이드를 지정하지 않아 이 파일에는 가이드가 없습니다.",
    noCheckout:
      "빌드에 저장소 체크아웃이 없었습니다. 고정 리비전에서 읽은 파일이 없으며, 파일을 명시한 모든 진술은 확인되지 않았습니다.",
    beyond:
      "이 파일은 구성 요소, 관계, 그룹만 나열하고 그 밖의 서술된 진술은 나열하지 않으며, 어떤 진술도 뒷받침되었다고 판정하지 않습니다.",
    notCarried:
      "개요 페이지의 글과 가이드 다이어그램 문서의 글은 싣지 않습니다. 그 다이어그램이 인용하는 파일은 데이터의 증거 표에 있고, 개별 파일의 사실은 데이터에만 있습니다.",
    transitional:
      "마지막 부분은 저자가 쓴 가이드를 그대로 이 파일 끝까지 실은 것입니다. 가이드의 문장이 모델에 들어가면 줄어드는 과도기적 부분입니다.",
    verify: "매니페스트로 이 산출물의 파일을 검증",
    check: "고정 리비전의 체크아웃으로 모델을 확인",
  }),
});

/**
 * The reader file's words of one language.
 * @param {string | null | undefined} locale
 * @returns {Readonly<ReaderWords>}
 */
export function readerWordsOf(locale) {
  return READER_WORDS[locale ?? DEFAULT_LOCALE] ?? READER_WORDS[DEFAULT_LOCALE];
}
