/**
 * The words the print edition sets itself, in each language a model may be read in: the edition's name, the
 * contents and the plates a page of them lists, its reading note, the index and the labels of the facts under it,
 * and its foot; and on the colophon page of an accepted delivery the word on the mark's rim and the labels of the
 * acceptance's facts. Everything else in the edition is the model's own text or a fact the publisher records. The
 * reading note calls the page in a browser by `page`, the word that labels it under the index, and the colophon's
 * note names the acceptance record and its signature by the names it is given.
 */

import { DEFAULT_LOCALE, keyedByLanguage } from "../locale.mjs";

/**
 * @typedef {{
 *   edition: string, contents: string, overview: string, scope: string, limits: string,
 *   plateCount: (count: number) => string,
 *   reading: string, readingNote: (links: boolean, page: string) => string,
 *   index: string, indexLead: string, morePaths: (count: number) => string, page: string, data: string,
 *   subject: string, repository: string, read: string, readValue: (files: number) => string,
 *   writtenFrom: (files: number) => string,
 *   attached: string, edited: string, license: (license: string) => string,
 *   published: string, standards: string,
 *   foot: (title: string, release: string | null, revision: string, date: string | null) => string,
 *   plate: (number: string, title: string, question: string) => string,
 *   places: string, list: string,
 *   colophon: string, accepted: string, reviewer: string, acceptedAt: string, object: string, commit: string,
 *   manifest: string, signingKey: string, unsigned: string, note: string, colophonScope: string,
 *   colophonNote: (record: string, signature: string | null) => string,
 * }} EditionWords
 */

/** @type {Readonly<Record<string, Readonly<EditionWords>>>} */
const WORDS = Object.freeze({
  en: Object.freeze({
    edition: "Architecture edition",
    contents: "Contents",
    overview: "Overview",
    scope: "Scope",
    limits: "What it leaves out",
    reading: "Reading this edition",
    plateCount: (count) => `${count} ${count === 1 ? "plate" : "plates"}`,
    readingNote: (links, page) =>
      `Each plate answers the question under its title. A card's title links to its component in the index at the end, which states each component's kind, details and relations${links ? ", links its files to the source" : ""} and names the plates that draw it. The page ${page} gives sources for the claims.`,
    index: "Index",
    indexLead: "Each component, what it relates to, its files and the plates that draw it",
    morePaths: (count) => `and ${count} more`,
    page: "Page",
    data: "Data",
    subject: "Subject",
    repository: "Repository",
    read: "Built from",
    readValue: (files) => `${files} ${files === 1 ? "file" : "files"}`,
    writtenFrom: (files) =>
      `Built from ${files} ${files === 1 ? "file" : "files"}, each cited by its SHA-256.`,
    attached: "The Architecture Model this edition is built from",
    edited: "Edited by",
    license: (license) => `edition licensed under ${license}`,
    published: "Published with",
    standards: "PDF/A-3a and PDF/UA-1",
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""} at ${revision}${date ? ` · ${date}` : ""}`,
    plate: (number, title, question) => `Plate ${number}: ${title}. ${question}`,
    places: "Files",
    list: ", ",
    colophon: "Acceptance record",
    accepted: "Accepted",
    reviewer: "Reviewer",
    acceptedAt: "Accepted at",
    object: "Subject",
    commit: "Commit",
    manifest: "Manifest SHA-256",
    signingKey: "Signing key",
    unsigned: "Unsigned",
    note: "Note",
    colophonScope:
      "Acceptance records who accepted which bytes and when; it does not certify that the architecture is correct.",
    colophonNote: (record, signature) =>
      `The acceptance record published with this edition (${signature ? `${record} and ${signature}` : record}) holds the SHA-256 of this page and the manifest; check it with archpub verify.`,
  }),
  "zh-CN": Object.freeze({
    edition: "架构图册",
    contents: "目录",
    overview: "总览",
    scope: "范围",
    limits: "未涵盖",
    reading: "阅读说明",
    plateCount: (count) => `共 ${count} 幅图版`,
    readingNote: (links, page) =>
      `每幅图版回答其标题下方的问题。卡片标题链接到册末索引中的该组件；索引按名称写出每个组件的类别、说明和关系${links ? "，文件链接到源码" : ""}，并列出其所在图版。陈述的出处见网页 ${page}。`,
    index: "索引",
    indexLead: "每个组件的说明、关系、文件及其所在图版",
    morePaths: (count) => `另有 ${count} 个`,
    page: "网页",
    data: "数据",
    subject: "对象",
    repository: "仓库",
    read: "依据",
    readValue: (files) => `${files} 个文件`,
    writtenFrom: (files) => `依据 ${files} 个文件写成，每个文件都注明 SHA-256。`,
    attached: "本图册据以生成的架构模型",
    edited: "编辑",
    license: (license) => `图册许可证：${license}`,
    published: "出版工具",
    standards: "PDF/A-3a 与 PDF/UA-1",
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""}，提交 ${revision}${date ? ` · ${date}` : ""}`,
    plate: (number, title, question) => `图版 ${number}：${title}。${question}`,
    places: "文件位置",
    list: "、",
    colophon: "验收记录",
    accepted: "验收",
    reviewer: "审阅者",
    acceptedAt: "验收时间",
    object: "对象",
    commit: "提交",
    manifest: "清单 SHA-256",
    signingKey: "签名密钥",
    unsigned: "未签名",
    note: "备注",
    colophonScope: "验收记录写明谁在何时验收了哪些字节，并不证明架构正确。",
    colophonNote: (record, signature) =>
      `随本图册出版的验收记录（${signature ? `${record} 与 ${signature}` : record}）载有本页与清单的 SHA-256，可用 archpub verify 核验。`,
  }),
  "zh-TW": Object.freeze({
    edition: "架構圖冊",
    contents: "目錄",
    overview: "總覽",
    scope: "範圍",
    limits: "未涵蓋",
    reading: "閱讀說明",
    plateCount: (count) => `共 ${count} 幅圖版`,
    readingNote: (links, page) =>
      `每幅圖版回答其標題下方的問題。卡片標題連結到冊末索引中的該元件；索引依名稱寫出每個元件的類別、說明和關係${links ? "，檔案連結到原始碼" : ""}，並列出其所在圖版。陳述的出處見網頁 ${page}。`,
    index: "索引",
    indexLead: "每個元件的說明、關係、檔案及其所在圖版",
    morePaths: (count) => `另有 ${count} 個`,
    page: "網頁",
    data: "資料",
    subject: "對象",
    repository: "儲存庫",
    read: "依據",
    readValue: (files) => `${files} 個檔案`,
    writtenFrom: (files) => `依據 ${files} 個檔案寫成，每個檔案都註明 SHA-256。`,
    attached: "本圖冊據以生成的架構模型",
    edited: "編輯",
    license: (license) => `圖冊授權條款：${license}`,
    published: "出版工具",
    standards: "PDF/A-3a 與 PDF/UA-1",
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""}，提交 ${revision}${date ? ` · ${date}` : ""}`,
    plate: (number, title, question) => `圖版 ${number}：${title}。${question}`,
    places: "檔案位置",
    list: "、",
    colophon: "驗收記錄",
    accepted: "驗收",
    reviewer: "審閱者",
    acceptedAt: "驗收時間",
    object: "對象",
    commit: "提交",
    manifest: "清單 SHA-256",
    signingKey: "簽章金鑰",
    unsigned: "未簽章",
    note: "備註",
    colophonScope: "驗收記錄寫明誰在何時驗收了哪些位元組，並不證明架構正確。",
    colophonNote: (record, signature) =>
      `隨本圖冊出版的驗收記錄（${signature ? `${record} 與 ${signature}` : record}）載有本頁與清單的 SHA-256，可用 archpub verify 核驗。`,
  }),
  es: Object.freeze({
    edition: "Edición de arquitectura",
    contents: "Contenido",
    overview: "Panorama",
    scope: "Alcance",
    limits: "Lo que no abarca",
    reading: "Cómo leer esta edición",
    plateCount: (count) => `${count} ${count === 1 ? "lámina" : "láminas"}`,
    readingNote: (links, page) =>
      `Cada lámina responde a la pregunta bajo su título. El título de cada tarjeta enlaza con su componente en el índice final, que indica el tipo, los detalles y las relaciones de cada componente${links ? ", enlaza sus archivos con el código fuente" : ""} y nombra las láminas que lo dibujan. La página ${page} indica las fuentes de las afirmaciones.`,
    index: "Índice",
    indexLead: "Cada componente, sus relaciones, sus archivos y las láminas que lo dibujan",
    morePaths: (count) => `y ${count} más`,
    page: "Página",
    data: "Datos",
    subject: "Objeto",
    repository: "Repositorio",
    read: "A partir de",
    readValue: (files) => `${files} ${files === 1 ? "archivo" : "archivos"}`,
    writtenFrom: (files) =>
      `Escrito a partir de ${files} ${files === 1 ? "archivo" : "archivos"}, cada uno citado por su SHA-256.`,
    attached: "El modelo de arquitectura del que se genera esta edición",
    edited: "Edición de",
    license: (license) => `edición con licencia ${license}`,
    published: "Publicado con",
    standards: "PDF/A-3a y PDF/UA-1",
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""} en ${revision}${date ? ` · ${date}` : ""}`,
    plate: (number, title, question) => `Lámina ${number}: ${title}. ${question}`,
    places: "Ubicación",
    list: ", ",
    colophon: "Registro de aceptación",
    accepted: "Aceptado",
    reviewer: "Revisor",
    acceptedAt: "Aceptado el",
    object: "Objeto",
    commit: "Commit",
    manifest: "SHA-256 del manifiesto",
    signingKey: "Clave de firma",
    unsigned: "Sin firmar",
    note: "Nota",
    colophonScope:
      "La aceptación registra quién aceptó qué bytes y cuándo; no certifica que la arquitectura sea correcta.",
    colophonNote: (record, signature) =>
      `El registro de aceptación publicado con esta edición (${signature ? `${record} y ${signature}` : record}) contiene el SHA-256 de esta página y del manifiesto; compruébelo con archpub verify.`,
  }),
  ko: Object.freeze({
    edition: "아키텍처 판",
    contents: "목차",
    overview: "개요",
    scope: "범위",
    limits: "다루지 않는 것",
    reading: "이 판을 읽는 법",
    plateCount: (count) => `도판 ${count}점`,
    readingNote: (links, page) =>
      `각 도판은 제목 아래의 질문에 답합니다. 카드 제목은 끝에 있는 색인의 해당 구성 요소로 연결됩니다. 색인은 구성 요소마다 종류, 세부 사항, 관계를 적고${links ? " 파일을 소스로 연결하며" : ""} 그것을 그린 도판을 함께 싣습니다. 웹 페이지 ${page}에 주장의 출처가 있습니다.`,
    index: "색인",
    indexLead: "구성 요소별 세부 사항, 관계, 파일과 그것을 그린 도판",
    morePaths: (count) => `외 ${count}개`,
    page: "웹 페이지",
    data: "데이터",
    subject: "대상",
    repository: "저장소",
    read: "근거",
    readValue: (files) => `파일 ${files}개`,
    writtenFrom: (files) => `파일 ${files}개로 작성, 각각 SHA-256으로 인용.`,
    attached: "이 판을 만든 아키텍처 모델",
    edited: "편집",
    license: (license) => `이 판의 라이선스: ${license}`,
    published: "출판 도구",
    standards: "PDF/A-3a 및 PDF/UA-1",
    foot: (title, release, revision, date) =>
      `${title}${release ? ` ${release}` : ""}, 커밋 ${revision}${date ? ` · ${date}` : ""}`,
    plate: (number, title, question) => `도판 ${number}: ${title}. ${question}`,
    places: "파일 위치",
    list: ", ",
    colophon: "승인 기록",
    accepted: "승인",
    reviewer: "검토자",
    acceptedAt: "승인 일시",
    object: "대상",
    commit: "커밋",
    manifest: "매니페스트 SHA-256",
    signingKey: "서명 키",
    unsigned: "서명 없음",
    note: "메모",
    colophonScope:
      "승인은 누가 언제 어떤 바이트를 승인했는지 기록하며, 아키텍처가 옳음을 보증하지는 않습니다.",
    colophonNote: (record, signature) =>
      `이 판과 함께 발행된 승인 기록(${signature ? `${record} 및 ${signature}` : record})에는 이 쪽과 매니페스트의 SHA-256이 담겨 있으며, archpub verify로 확인할 수 있습니다.`,
  }),
});
keyedByLanguage("print edition's words", WORDS);

/**
 * The edition's words in a model's language; an unknown or absent language reads as English.
 * @param {string | null | undefined} locale
 * @returns {Readonly<EditionWords>}
 */
export function editionWordsOf(locale) {
  return WORDS[locale ?? DEFAULT_LOCALE] ?? WORDS[DEFAULT_LOCALE];
}
