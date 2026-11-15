import { createHash } from "node:crypto";
import path from "node:path";
import { CATALOGUE } from "./facts/catalogue.mjs";
import { archifyIds } from "./map/archify.mjs";
import { guideCitations, guideSummary, readGuide } from "./map/guide.mjs";
import { MODEL_FORMAT, MODEL_VERSION } from "./model/load.mjs";
import { dataCounts, editionData, serializeData } from "./pinned/data.mjs";
import { evidenceTable } from "./pinned/evidence.mjs";
import { plateEntry, plateScales } from "./pinned/face.mjs";
import {
  guideFigures,
  requireFaces,
  requireProjections,
  requireReaderIds,
} from "./pinned/invariants.mjs";
import { parseReader, readerFile } from "./pinned/reader.mjs";
import { HOUSE } from "./poster/tokens.mjs";
import { refuse } from "./refusal.mjs";
import { readAtPin } from "./sources/bind.mjs";
import { DELIVERY_FORMAT, DELIVERY_VERSION, PNG_WIDTHS, plateSummary } from "./manifest.mjs";

/**
 * The pinned edition of one build: what the build holds, handed as values to the unit that writes the data and the
 * reader file, and held to the model and to itself before anything is written. A check gathers it to report its
 * counts; a build gathers it again when the edition is typeset, with each plate's page, and writes it.
 */

/**
 * The ids that would give two files of a delivery one name, each with the name, the file the id names and the
 * file that has the name already.
 * @type {ReadonlyMap<string, readonly [string, string, string]>}
 */
const TAKEN = new Map([
  ["model", ["model.json", "its data", "the model the build read"]],
  ["manifest", ["manifest.json", "its data", "the manifest"]],
  ["acceptance", ["acceptance.json", "its data", "the record an acceptance writes"]],
  ["colophon", ["colophon.pdf", "its print edition", "the colophon page an acceptance writes"]],
]);

/**
 * Refuse a model whose id would name two files of its delivery alike: the data is `<model id>.json` and the print
 * edition `<model id>.pdf`, beside files the delivery names itself.
 * @param {string} id the model's id
 */
export function requireDeliveryNames(id) {
  const taken = TAKEN.get(id);
  if (!taken) return;
  const [file, named, held] = taken;
  const message = `\`${file}\` would be both ${named} and ${held}`;
  refuse(
    "delivery_name_taken",
    `A delivery of the model \`${id}\` would hold two files of one name: ${message}. Give the model another id.`,
    [{ code: "delivery_name_taken", path: "/id", message }],
  );
}

/**
 * The guide a model names, read once, whichever media are built: its draft and the files it names, its citations
 * and, with a checkout, what Git holds at the pin of the paths it alone cites, which join no binding. A path it
 * cites that is no file at the pin is refused here, before a view is planned or a page prepared: a delivery names
 * as evidence only what the build read. Without a checkout nothing is read at the pin and nothing is known to be
 * absent. None when the model names no guide.
 * @param {any} model
 * @param {string} modelPath
 * @param {{ records: ReadonlyArray<{ path: string }> }} binding
 * @param {string | null} repo the checkout the pin was read in, or none
 */
export async function guideOf(model, modelPath, binding, repo) {
  if (!model.guide) return null;
  const guide = await readGuide(path.resolve(path.dirname(modelPath), model.guide));
  const citations = guideCitations(guide.entries);
  if (!repo) return { ...guide, citations, read: new Map() };
  const { revision } = model.repository;
  const bound = new Set(binding.records.map((record) => record.path));
  const alone = citations.filter((citation) => !bound.has(citation.path));
  const read = readAtPin(
    repo,
    revision,
    alone.map((citation) => citation.path),
  );
  const missing = alone.filter((citation) => !read.has(citation.path));
  if (missing.length)
    refuse(
      "guide_file_missing",
      `The files the guide ${model.guide} cites do not hold at the model's revision.`,
      missing.map(({ where, path: file }) => ({
        code: "guide_file_missing",
        path: where,
        message: `${file} is not a file at ${revision}`,
      })),
    );
  return { ...guide, citations, read };
}

/**
 * The guide's record in the data: its draft, the files it names, whether a page verified its sources, and its
 * figures matched to the model. A build that delivers no page prepared none, and then no page verified them.
 */
function guideRecord(guide, page, evidence, model, pinned) {
  const documents = guide.entries
    .slice(1)
    .filter(({ name }) => name.endsWith(".json"))
    .map(({ name, bytes }) => ({ name, document: JSON.parse(bytes.toString("utf8")) }))
    .filter(({ document }) => document !== null);
  const summary = guideSummary(
    page?.kind === "guide"
      ? page
      : /** @type {any} */ ({ path: model.guide, entries: guide.entries, repo: null }),
  );
  return {
    path: summary.path,
    sha256: summary.sha256,
    files: summary.files,
    sources: summary.sources,
    figures: guideFigures({ documents, evidence, relations: model.relations, pinned }),
  };
}

/**
 * The ids the page the publisher generates draws, by the model's ids, read back from each diagram's document: a
 * card through the diagram's own table of nodes, a connection through the names Archify is given for the view's
 * relations, a line of an overview as the relations it stands for. A name that leads back to no id stands as it
 * is, and is then refused as one the data lacks. A guide is its author's document and is not read here.
 * @param {any} page the page as prepared, or none
 * @param {readonly any[]} views the planned views
 */
function pageProjections(page, views) {
  if (!page || page.kind === "guide") return [];
  return page.diagrams.map((diagram) => {
    const view = views.find(({ id }) => id === diagram.view);
    const parts = new Map([...diagram.nodes].map(([id, node]) => [node, id]));
    const lines = new Map(
      [...archifyIds(view.relations.map(({ id }) => id))].map(([id, line]) => [line, id]),
    );
    const grouped = new Set(view.components.filter(({ group }) => group).map(({ id }) => id));
    const drawn = diagram.document.components.map(({ id }) => parts.get(id) ?? id);
    return {
      projection: `page's diagram of ${diagram.view}`,
      components: drawn.filter((id) => !grouped.has(id)),
      groups: drawn.filter((id) => grouped.has(id)),
      relations: diagram.document.connections.flatMap(({ id }) => {
        const relation = view.relations.find((one) => one.id === lines.get(id));
        return relation ? (relation.relations ?? [relation.id]) : [id];
      }),
    };
  });
}

/**
 * Gather the pinned edition, hold it to its invariants and return it as the delivery's files. The reader file's
 * statement ids are the model's, each plate's face is its view's statement set, and no projection holds what the
 * data lacks: a difference refuses, before anything is written. Without the pages of a typeset edition no plate
 * carries one.
 * @param {{ loaded: { content: Uint8Array, sha256: string, bytes: number }, model: any, binding: any, facts: any,
 *   views: readonly any[], plates: readonly any[], styleRecord: Record<string, any>, media: readonly string[],
 *   overview: object | null, page: any, guide: Awaited<ReturnType<typeof guideOf>>, publisher: string }} held
 *   what the build prepared: the model as read and validated, the binding, the layer of facts, the plan, the plates
 *   as drawn, the style's record, the media, the overview when one is set, the page when one is prepared, the
 *   guide, and the publisher's version
 * @param {readonly number[]} widths the widths the edition's images are rendered at
 * @param {ReadonlyArray<{ number: number, page: number }> | null} [platePages] each plate's page in the PDF
 */
export function pinnedEdition(held, widths, platePages = null) {
  const { model, binding, facts, views, guide } = held;
  const evidence = evidenceTable({
    records: binding.records,
    citations: guide?.citations,
    read: guide?.read,
  });
  const pages = new Map(platePages?.map(({ number, page }) => [number, page]));
  const scales = plateScales({ longest: held.styleRecord.longest, scale: facts.scale });
  const data = editionData({
    delivery: { format: DELIVERY_FORMAT, version: DELIVERY_VERSION },
    publisher: { name: "architecture-publisher", version: held.publisher },
    model,
    file: {
      sha256: held.loaded.sha256,
      bytes: held.loaded.bytes,
      format: MODEL_FORMAT,
      version: MODEL_VERSION,
    },
    state: binding.state,
    views,
    plates: held.plates.map((plate) =>
      plateEntry(plate, {
        page: pages.get(plate.page),
        images: plateSummary(plate, widths).images,
        house: HOUSE,
        scales,
      }),
    ),
    facts: [...facts.all(), ...views.flatMap((view) => facts.view(view).all())],
    catalogue: CATALOGUE,
    evidence,
    guide: guide && guideRecord(guide, held.page, evidence, model, binding.state === "verified"),
    overview: held.overview && {
      composition: model.overview,
      images: widths.map((width) => ({
        width,
        file:
          width === PNG_WIDTHS[0] ? "images/00-overview.png" : `images/00-overview-${width}.png`,
      })),
    },
    media: held.media,
  });
  const json = Buffer.from(serializeData(data));
  const reader = readerFile(data, {
    sha256: createHash("sha256").update(json).digest("hex"),
    draft: guide?.entries[0].bytes,
  });
  const text = reader.toString("utf8");
  requireReaderIds(model, text);
  requireFaces(data);
  requireProjections(data, text, pageProjections(held.page, views));
  const { components, relations, groups } = parseReader(text, model.locale).stated;
  return {
    data,
    counts: dataCounts(data),
    reader,
    statements: components.length + relations.length + groups.length,
    /** The three files of the pinned edition, by name, as the delivery holds them. */
    files: /** @type {Array<[string, Uint8Array]>} */ ([
      ["model.json", held.loaded.content],
      [`${model.id}.json`, json],
      [`${model.id}.md`, reader],
    ]),
  };
}
