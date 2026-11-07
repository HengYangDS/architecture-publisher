/**
 * The words the print edition sets itself, in each language a model may be read in: the edition's name, the
 * contents, the labels of its facts, its reading note and its foot. Everything else in the edition is the model's
 * own text or a fact the publisher records.
 */

import { DEFAULT_LOCALE } from "../locale.mjs";

/**
 * @typedef {{
 *   edition: string, contents: string, overview: string, overviewNote: string, scope: string, limits: string,
 *   reading: string, readingNote: (links: boolean, page: string) => string,
 *   subject: string, repository: string, read: string, readValue: (files: number) => string,
 *   model: string, attached: string, edited: string, license: (license: string) => string,
 *   published: string, typeset: string, standards: string,
 *   built: (revision: string, date: string | null) => string,
 *   foot: (title: string, release: string | null, revision: string, date: string | null) => string,
 *   plate: (number: string, title: string, question: string) => string,
 *   places: string, list: string,
 * }} EditionWords
 */

/** @type {Readonly<Record<string, Readonly<EditionWords>>>} */
const WORDS = Object.freeze({
  en: Object.freeze({
    edition: "Architecture edition",
    contents: "Contents",
    overview: "Overview",
    overviewNote: "The whole work on one page.",
    scope: "Scope",
    limits: "What it leaves out",
    reading: "Reading this edition",
    readingNote: (links, page) =>
      `Each plate answers the question named beside it here.${links ? " A card's title links to the file it was read from." : ""} The interactive edition, ${page} beside this file, cites every claim.`,
    subject: "Subject",
    repository: "Repository",
    read: "Read from",
    readValue: (files) => `${files} ${files === 1 ? "file" : "files"}, each cited by its SHA-256`,
    model: "Model",
    attached: "The Architecture Model this edition is built from",
    edited: "Edited by",
    license: (license) => `licensed under ${license}`,
    published: "Published with",
    typeset: "Typeset",
    standards: "PDF/A-3a and PDF/UA-1",
    built: (revision, date) => `As built at ${revision}${date ? ` · ${date}` : ""}`,
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""} at ${revision}${date ? `, ${date}` : ""}`,
    plate: (number, title, question) => `Plate ${number}: ${title}. ${question}`,
    places: "Where it lives",
    list: ", ",
  }),
  "zh-CN": Object.freeze({
    edition: "架构图册",
    contents: "目录",
    overview: "总览",
    overviewNote: "全貌，一页读完。",
    scope: "范围",
    limits: "未涵盖",
    reading: "阅读说明",
    readingNote: (links, page) =>
      `每幅图版回答目录中写在它旁边的问题。${links ? "卡片标题链接到它所依据的文件。" : ""}与本文件同处的交互版 ${page} 为每项陈述注明出处。`,
    subject: "主题",
    repository: "仓库",
    read: "读取",
    readValue: (files) => `${files} 个文件，各附 SHA-256`,
    model: "模型",
    attached: "本图册据以生成的架构模型",
    edited: "编辑",
    license: (license) => `许可：${license}`,
    published: "出版工具",
    typeset: "排版",
    standards: "PDF/A-3a 与 PDF/UA-1",
    built: (revision, date) => `构建于 ${revision}${date ? ` · ${date}` : ""}`,
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""}，修订 ${revision}${date ? `，${date}` : ""}`,
    plate: (number, title, question) => `图版 ${number}：${title}。${question}`,
    places: "文件位置",
    list: "、",
  }),
  "zh-TW": Object.freeze({
    edition: "架構圖冊",
    contents: "目錄",
    overview: "總覽",
    overviewNote: "全貌，一頁讀完。",
    scope: "範圍",
    limits: "未涵蓋",
    reading: "閱讀說明",
    readingNote: (links, page) =>
      `每幅圖版回答目錄中寫在它旁邊的問題。${links ? "卡片標題連結到它所依據的檔案。" : ""}與本檔案同處的互動版 ${page} 為每項陳述註明出處。`,
    subject: "主題",
    repository: "儲存庫",
    read: "讀取",
    readValue: (files) => `${files} 個檔案，各附 SHA-256`,
    model: "模型",
    attached: "本圖冊據以生成的架構模型",
    edited: "編輯",
    license: (license) => `授權：${license}`,
    published: "出版工具",
    typeset: "排版",
    standards: "PDF/A-3a 與 PDF/UA-1",
    built: (revision, date) => `建置於 ${revision}${date ? ` · ${date}` : ""}`,
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""}，修訂 ${revision}${date ? `，${date}` : ""}`,
    plate: (number, title, question) => `圖版 ${number}：${title}。${question}`,
    places: "檔案位置",
    list: "、",
  }),
  es: Object.freeze({
    edition: "Edición de arquitectura",
    contents: "Contenido",
    overview: "Panorama",
    overviewNote: "La obra entera en una página.",
    scope: "Alcance",
    limits: "Lo que no abarca",
    reading: "Cómo leer esta edición",
    readingNote: (links, page) =>
      `Cada lámina responde a la pregunta escrita junto a ella aquí.${links ? " El título de cada tarjeta enlaza con el archivo del que se leyó." : ""} La edición interactiva, ${page}, junto a este archivo, cita cada afirmación.`,
    subject: "Tema",
    repository: "Repositorio",
    read: "Leído de",
    readValue: (files) =>
      `${files} ${files === 1 ? "archivo" : "archivos"}, cada uno citado por su SHA-256`,
    model: "Modelo",
    attached: "El modelo de arquitectura del que se genera esta edición",
    edited: "Edición de",
    license: (license) => `con licencia ${license}`,
    published: "Publicado con",
    typeset: "Composición",
    standards: "PDF/A-3a y PDF/UA-1",
    built: (revision, date) => `Generado en ${revision}${date ? ` · ${date}` : ""}`,
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""} en ${revision}${date ? `, ${date}` : ""}`,
    plate: (number, title, question) => `Lámina ${number}: ${title}. ${question}`,
    places: "Ubicación",
    list: ", ",
  }),
  ko: Object.freeze({
    edition: "아키텍처 판",
    contents: "목차",
    overview: "개요",
    overviewNote: "작업 전체를 한 쪽에.",
    scope: "범위",
    limits: "다루지 않는 것",
    reading: "이 판을 읽는 법",
    readingNote: (links, page) =>
      `각 도판은 여기 옆에 적힌 질문에 답합니다.${links ? " 카드 제목은 그 내용을 읽은 파일로 연결됩니다." : ""} 이 파일 옆의 대화형 판 ${page}은 모든 주장의 출처를 밝힙니다.`,
    subject: "주제",
    repository: "저장소",
    read: "읽은 파일",
    readValue: (files) => `파일 ${files}개, 각각 SHA-256으로 인용`,
    model: "모델",
    attached: "이 판을 만든 아키텍처 모델",
    edited: "편집",
    license: (license) => `라이선스: ${license}`,
    published: "출판 도구",
    typeset: "조판",
    standards: "PDF/A-3a 및 PDF/UA-1",
    built: (revision, date) => `${revision}에서 빌드${date ? ` · ${date}` : ""}`,
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""}, 리비전 ${revision}${date ? `, ${date}` : ""}`,
    plate: (number, title, question) => `도판 ${number}: ${title}. ${question}`,
    places: "파일 위치",
    list: ", ",
  }),
});

/**
 * The edition's words in a model's language; an unknown or absent language reads as English.
 * @param {string | null | undefined} locale
 * @returns {Readonly<EditionWords>}
 */
export function editionWordsOf(locale) {
  return WORDS[locale ?? DEFAULT_LOCALE] ?? WORDS[DEFAULT_LOCALE];
}
