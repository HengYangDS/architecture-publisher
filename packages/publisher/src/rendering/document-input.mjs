import { createHash } from "node:crypto";
import { fail, hasExactFields as exact, isDigest } from "../protocol/values.mjs";
import { portablePath } from "../file-input/contract.mjs";
import { canonical } from "../protocol/json.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export const text = (value) => typeof value === "string" && value.trim().length > 0;

export const identifier = (value) =>
  typeof value === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(value);

export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const scriptJson = (value) =>
  JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");

function selectedBytes(value, digest, mismatch) {
  if (!Buffer.isBuffer(value) || !isDigest(digest) || sha256(value) !== digest) fail(mismatch);
  return value;
}

export function pageHtml(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    fail("interactive_html_page_encoding_invalid");
  }
}

export function validatePage(page, ids, paths, sources, references, editionId, editionSha256) {
  const sourceIds = new Set(Object.keys(sources));
  if (
    !exact(
      page,
      ["id", "label", "shortLabel", "purpose", "path", "sha256", "sourceIds", "content", "facts"],
      ["subjectSources"],
    ) ||
    !identifier(page.id) ||
    ids.has(page.id) ||
    !text(page.label) ||
    !text(page.shortLabel) ||
    !["overview", "mechanism"].includes(page.purpose) ||
    !portablePath(page.path).endsWith(".html") ||
    paths.has(page.path) ||
    !Array.isArray(page.sourceIds) ||
    (!page.sourceIds.length && !page.facts?.some((fact) => fact.editionSha256 === editionSha256)) ||
    new Set(page.sourceIds).size !== page.sourceIds.length ||
    page.sourceIds.some((id) => !sourceIds.has(id)) ||
    (Object.hasOwn(page, "subjectSources") && !record(page.subjectSources))
  )
    fail("interactive_html_page_invalid");
  selectedBytes(page.content, page.sha256, "interactive_html_page_digest_mismatch");
  ids.add(page.id);
  paths.add(page.path);
  const nodes = {},
    pageSources = new Set(page.sourceIds);
  for (const [id, values] of Object.entries(page.subjectSources ?? {})) {
    if (
      !identifier(id) ||
      !Array.isArray(values) ||
      (!values.length &&
        !page.facts?.some(
          (fact) => fact.graphicId === id && fact.editionSha256 === editionSha256,
        )) ||
      new Set(values).size !== values.length ||
      values.some((sourceId) => !sourceIds.has(sourceId) || !pageSources.has(sourceId))
    )
      fail("interactive_html_page_source_invalid");
    nodes[id] = [...values];
  }
  const visibleSubjects = new Set(
    [
      ...pageHtml(page.content).matchAll(
        /\bdata-(?:inspect|node|edge|text|note)-id=["']([^"']+)["']/g,
      ),
    ].map((match) => match[1]),
  );
  for (const [, raw] of pageHtml(page.content).matchAll(/\bdata-graphic-id=["']([^"']+)["']/g)) {
    const id = raw.startsWith("text:") ? raw.slice(5) : raw;
    if (Object.hasOwn(nodes, id)) visibleSubjects.add(id);
  }
  for (const [, id] of pageHtml(page.content).matchAll(/\bdata-note-item-id=["']([^"']+)["']/g))
    if (Object.hasOwn(nodes, id)) visibleSubjects.add(id);
  if (
    visibleSubjects.size !== Object.keys(nodes).length ||
    [...visibleSubjects].some((id) => !Object.hasOwn(nodes, id))
  )
    fail("interactive_html_page_source_invalid");
  if (!Array.isArray(page.facts) || !page.facts.length || page.facts.length > 8192)
    fail("interactive_html_page_facts_invalid");
  const occurrences = new Set();
  for (const item of page.facts) {
    let reference;
    try {
      reference = JSON.parse(item?.reference);
    } catch {
      fail("interactive_html_page_facts_invalid");
    }
    const editorial = reference?.[1] === "editorial";
    if (
      !exact(item, [
        "reference",
        editorial ? "editionSha256" : "sourceSha256",
        "graphicId",
        "title",
        "facts",
      ]) ||
      !Array.isArray(reference) ||
      reference.length !== 3 ||
      reference.some((part) => !text(part)) ||
      !["entity", "relation", "claim", "editorial"].includes(reference[1]) ||
      JSON.stringify(reference) !== item.reference ||
      occurrences.has(JSON.stringify([item.reference, item.graphicId])) ||
      !(editorial
        ? reference[0] === editionId && item.editionSha256 === editionSha256
        : isDigest(item.sourceSha256)) ||
      !visibleSubjects.has(item.graphicId) ||
      !text(item.title) ||
      !Array.isArray(item.facts) ||
      !item.facts.length ||
      item.facts.length > 32 ||
      item.facts.some(
        (fact) => !exact(fact, ["label", "value"]) || !text(fact.label) || !text(fact.value),
      ) ||
      (!editorial &&
        !page.sourceIds.some(
          (id) =>
            sources[id].namespace === reference[0] && sources[id].sha256 === item.sourceSha256,
        ))
    )
      fail("interactive_html_page_facts_invalid");
    const semanticFacts = canonical({
      ...(editorial ? { editionSha256: item.editionSha256 } : { sourceSha256: item.sourceSha256 }),
      title: item.title,
      facts: item.facts,
    });
    if (references.has(item.reference) && references.get(item.reference) !== semanticFacts)
      fail("interactive_html_page_facts_invalid");
    references.set(item.reference, semanticFacts);
    occurrences.add(JSON.stringify([item.reference, item.graphicId]));
  }
  return nodes;
}

/** Parse the native start-tag carrier grammar without scanning quoted or raw-text content. */
export function pageStartTags(html, reject) {
  const tags = [];
  const start = /<!--[\s\S]*?-->|<([a-z][a-z0-9:-]*)(?:[^"'<>]|"[^"]*"|'[^']*')*>/giu;
  const token = /\s*([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/uy;
  let match;
  while ((match = start.exec(html))) {
    if (!match[1]) continue;
    const tag = match[0],
      name = match[1].toLowerCase();
    const body = tag.slice(match[1].length + 1).replace(/\/?\s*>$/u, "");
    const attributes = new Map();
    let at = 0;
    while (body.slice(at).trim()) {
      token.lastIndex = at;
      const attribute = token.exec(body);
      if (!attribute || attributes.has(attribute[1].toLowerCase())) reject();
      attributes.set(
        attribute[1].toLowerCase(),
        attribute[2] ?? attribute[3] ?? attribute[4] ?? "",
      );
      at = token.lastIndex;
    }
    let content = "";
    if (["script", "style", "textarea", "title"].includes(name)) {
      const closing = new RegExp(`</${name}\\s*>`, "giu");
      closing.lastIndex = start.lastIndex;
      const end = closing.exec(html);
      content = html.slice(start.lastIndex, end?.index ?? html.length);
      start.lastIndex = end ? closing.lastIndex : html.length;
    }
    tags.push({ tag, name, attributes, content });
  }
  return tags;
}

// Reject declared asset loads; executable page code still needs browser qualification.
function rejectDeclaredExternalResources(html) {
  const reject = () => fail("interactive_html_external_dependency");
  const styles = [];
  for (const { name, attributes, content } of pageStartTags(html, reject)) {
    if (
      ["iframe", "frame", "portal", "base"].includes(name) ||
      (name === "script" && attributes.has("src")) ||
      (name === "link" && attributes.has("href")) ||
      (name === "meta" && /^refresh\b/i.test(attributes.get("http-equiv") ?? ""))
    )
      reject();
    for (const [attribute, raw] of attributes) {
      const value = raw.trim();
      if (["src", "srcset", "poster", "background"].includes(attribute))
        if (attribute === "srcset" || !/^data:/i.test(value)) reject();
      if (
        ["image", "feimage", "use", "object"].includes(name) &&
        ["href", "xlink:href", "data"].includes(attribute) &&
        !(/^data:/i.test(value) || (["use", "feimage"].includes(name) && value.startsWith("#")))
      )
        reject();
    }
    if (name === "style") styles.push(content);
    if (attributes.has("style")) styles.push(attributes.get("style"));
  }
  for (const style of styles) {
    const css = style.replace(/\/\*[\s\S]*?\*\//g, "");
    if (/@import\b|(?:-webkit-)?image-set\s*\(/i.test(css))
      fail("interactive_html_external_dependency");
    const withoutUrls = css.replace(
      /\burl\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi,
      (all, double, single, bare) => {
        if (!/^(?:data:|#)/i.test((double ?? single ?? bare).trim()))
          fail("interactive_html_external_dependency");
        return "";
      },
    );
    if (/\burl\s*\(/i.test(withoutUrls)) fail("interactive_html_external_dependency");
  }
}

export function pagePieces(bytes, shared, blocks) {
  const html = pageHtml(bytes);
  rejectDeclaredExternalResources(html);
  const pieces = [];
  let cursor = 0;
  const expression = /<(?:style|script)\b[^>]*>[\s\S]*?<\/(?:style|script)>/gi;
  for (const match of html.matchAll(expression)) {
    if (match.index > cursor) pieces.push(html.slice(cursor, match.index));
    if (!shared.has(match[0])) {
      shared.set(match[0], blocks.length);
      blocks.push(match[0]);
    }
    pieces.push(shared.get(match[0]));
    cursor = match.index + match[0].length;
  }
  pieces.push(html.slice(cursor));
  return pieces;
}
