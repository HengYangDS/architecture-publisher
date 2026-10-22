import { fail, hasExactFields as exact, isDigest } from "../protocol/values.mjs";
import { LIMITS } from "../file-input/contract.mjs";
import { interactiveAppearance } from "../scene/appearance.mjs";
import {
  interactiveAppearanceCss,
  interactiveAppearanceScript,
} from "../../renderers/reader/appearance.mjs";
import { text, identifier, pageHtml, validatePage, pagePieces } from "./document-input.mjs";
import { validateSourceReading } from "../../renderers/interactive/source-contract.mjs";
import { shell } from "./document-shell.mjs";

function composeDocument(input) {
  const attributed = input?.schema === "architecture.interactive-html-composition/v2";
  if (
    !exact(
      input,
      [
        "schema",
        "title",
        "build",
        "overview",
        "pages",
        "sources",
        "state",
        ...(attributed ? ["framing"] : []),
      ],
      ["editionId", "appearance", "sourceReading"],
    ) ||
    (input.schema !== "architecture.interactive-html-composition/v1" && !attributed) ||
    (attributed && !text(input.framing)) ||
    (Object.hasOwn(input, "editionId") && !identifier(input.editionId)) ||
    !exact(input.build, ["lockSha256", "editionSha256", "semanticDigest"]) ||
    !Object.values(input.build).every(isDigest) ||
    !text(input.title) ||
    !identifier(input.overview) ||
    !Array.isArray(input.pages) ||
    !input.pages.length ||
    input.pages.length > 64 ||
    !Array.isArray(input.sources) ||
    !input.sources.length ||
    !exact(input.state, ["qualification", "humanAcceptance", "publication"]) ||
    Object.values(input.state).some((value) => value !== "not-performed")
  )
    fail("interactive_html_composition_invalid");
  const reading = input.sourceReading;

  const sources = {};
  const namespaces = new Set();
  for (const source of input.sources) {
    if (
      !exact(source, ["id", "kind", "namespace", "sha256", "claimant"]) ||
      !identifier(source.id) ||
      Object.hasOwn(sources, source.id) ||
      !["native", "derived"].includes(source.kind) ||
      !text(source.namespace) ||
      namespaces.has(source.namespace) ||
      !isDigest(source.sha256) ||
      !text(source.claimant)
    )
      fail("interactive_html_source_invalid");
    namespaces.add(source.namespace);
    sources[source.id] = {
      kind: source.kind,
      namespace: source.namespace,
      sha256: source.sha256,
      claimant: source.claimant,
    };
  }
  const ids = new Set();
  const paths = new Set();
  const references = new Map();
  const blocks = [];
  const shared = new Map();
  const pages = {};
  let total = 0;
  for (const page of input.pages) {
    const nodeSources = validatePage(
      page,
      ids,
      paths,
      sources,
      references,
      input.editionId,
      input.build.editionSha256,
    );
    total += page.content.length + Buffer.byteLength(JSON.stringify(page.facts));
    if (total > LIMITS.totalBytes) fail("interactive_html_size_exceeded");
    pages[page.id] = {
      id: page.id,
      label: page.label,
      shortLabel: page.shortLabel,
      purpose: page.purpose,
      path: page.path,
      sha256: page.sha256,
      sourceIds: [...page.sourceIds],
      subjectSources: nodeSources,
      facts: structuredClone(page.facts),
      nativeReader: /<meta name="publication-reader" content="archify\/v1">/i.test(
        pageHtml(page.content),
      )
        ? "archify/v1"
        : null,
      pieces: pagePieces(page.content, shared, blocks),
    };
  }
  if (
    !Object.hasOwn(input, "sourceReading") &&
    input.pages.some((page) =>
      /<meta name="publication-source-reading" content="required">/iu.test(pageHtml(page.content)),
    )
  )
    fail("interactive_html_source_reader_invalid");
  if (!Object.hasOwn(pages, input.overview)) fail("interactive_html_overview_missing");
  if (pages[input.overview].purpose !== "overview") fail("interactive_html_overview_invalid");
  if (Object.values(pages).filter(({ purpose }) => purpose === "overview").length !== 1)
    fail("interactive_html_overview_invalid");

  for (const page of Object.values(pages)) {
    const source = page.pieces
      .map((piece) => (typeof piece === "number" ? blocks[piece] : piece))
      .join("");
    for (const match of source.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
      const href = match[1];
      if (/^(?:#|mailto:|https?:)/i.test(href)) continue;
      const resolved = new URL(href, `https://interactive.invalid/${page.path}`);
      if (
        resolved.origin === "https://interactive.invalid" &&
        resolved.pathname.endsWith(".html") &&
        !Object.values(pages).some((candidate) => candidate.path === resolved.pathname.slice(1))
      )
        fail("interactive_html_navigation_target_missing");
    }
  }
  const data = {
    schema: "architecture.interactive-html/v1",
    title: input.title,
    build: structuredClone(input.build),
    ...(input.editionId ? { editionId: input.editionId } : {}),
    overview: input.overview,
    order: input.pages.map(({ id }) => id),
    pages,
    blocks,
    sources,
    state: structuredClone(input.state),
    appearance: interactiveAppearance(input.appearance),
    appearanceCss: interactiveAppearanceCss(),
    appearanceScript: interactiveAppearanceScript(),
  };
  if (Object.hasOwn(input, "sourceReading")) {
    if (!exact(reading, ["projection", "pages"]) || !Array.isArray(reading.pages))
      fail("interactive_html_source_reader_invalid");
    total +=
      Buffer.byteLength(JSON.stringify(reading.projection) ?? "") +
      reading.pages.reduce(
        (size, page) =>
          size +
          (Buffer.isBuffer(page?.content) ? page.content.length : 0) +
          Buffer.byteLength(JSON.stringify(page?.bindings) ?? ""),
        0,
      );
    if (total > LIMITS.totalBytes) fail("interactive_html_size_exceeded");
    validateSourceReading(reading, input.pages, sources);
    const selectedPages = {};
    for (const page of reading.pages) {
      selectedPages[page.id] = {
        id: page.id,
        bindings: structuredClone(page.bindings),
        pieces: pagePieces(page.content, shared, blocks),
      };
    }
    data.sourceReading = { projection: structuredClone(reading.projection), pages: selectedPages };
  }
  const bytes = Buffer.from(shell(input, data));
  if (bytes.length > LIMITS.totalBytes) fail("interactive_html_size_exceeded");
  return bytes;
}

/** Pack checked pages and selected public facts without embedding source files. */
export function composeInteractiveHtml(input) {
  return composeDocument(input);
}
