import { guideSummary } from "./map/guide.mjs";

/**
 * The manifest of a delivery: the record of one build, which names every file the delivery holds with its digest.
 * The summaries it is made of are the ones a check reports of the same plan, so both are written here once.
 */

export const DELIVERY_FORMAT = "architecture-publisher.delivery";
export const DELIVERY_VERSION = 8;
/** The width the edition's images are rendered at by default. */
export const PNG_WIDTHS = Object.freeze([2400]);

/** The overview's inputs and Typst's reading of them, for the manifest and the check. */
export function overviewSummary(model, overview) {
  return {
    statement: { sha256: overview.statement },
    house: overview.house,
    typst: overview.typst,
    date: overview.date,
    texts: overview.texts.length,
  };
}

export function viewSummary(view, plates) {
  const plate = plates.find((one) => one.views.includes(view.id));
  return {
    id: view.id,
    title: view.title,
    question: view.question,
    origin: view.origin,
    tiers: view.tiers?.map(({ id }) => id) ?? null,
    components: view.components.map(({ id }) => id),
    relations: view.relations.map(({ id }) => id),
    plate: plate?.page ?? null,
  };
}

/** One view's diagram on the interactive page: its shape and Archify's route measures. */
export function diagramSummary(diagram) {
  return {
    view: diagram.view,
    rows: diagram.rows,
    width: diagram.width,
    height: diagram.height,
    sides: diagram.sides,
    resided: diagram.resided,
    pinned: diagram.pinned,
    beside: diagram.beside,
    candidates: diagram.candidates,
    metrics: diagram.metrics,
  };
}

/** One plate's images, composition and measures, and the balance gates it misses, for the manifest. */
export function plateSummary(plate, widths) {
  const name = `${String(plate.page).padStart(2, "0")}-${plate.views.join("+")}`;
  return {
    page: plate.page,
    views: plate.views,
    share: plate.share,
    reading: plate.reading,
    images: widths.map((width) => ({
      width,
      file: width === PNG_WIDTHS[0] ? `images/${name}.png` : `images/${name}-${width}.png`,
    })),
    composition: plate.composition,
    measures: plate.measures,
    ...(plate.misses.length ? { misses: plate.misses } : {}),
  };
}

/**
 * The manifest of one build, its keys in their order. The record of each cited file and the evidence of each
 * statement stand in the data, which the manifest names with its counts; the manifest keeps the binding's state
 * and the number of files it recorded.
 * @param {{
 *   prepared: any, chosen: { quality: string, png: readonly number[] },
 *   edition: any, page: any, dated: { by: string }, publisher: string,
 *   supplies: { fonts: { sha256: string }, house: { sha256: string }, opentype: { sha256: string } },
 *   pinned: { counts: object, reader: Uint8Array, statements: number },
 *   artifacts: Array<{ path: string, bytes: number, sha256: string }>,
 * }} build what the build prepared, chose, typeset and delivered; the publisher's version; the supplies it
 *   verified; the pinned edition it wrote; and the digest records of every file staged
 */
export function deliveryManifest(build) {
  const { prepared, chosen, edition, page, dated, pinned } = build;
  const { fonts, house, opentype } = build.supplies;
  const { overview, model } = prepared;
  return {
    format: DELIVERY_FORMAT,
    version: DELIVERY_VERSION,
    publisher: { name: "architecture-publisher", version: build.publisher },
    model: {
      id: prepared.model.id,
      title: prepared.model.title,
      locale: prepared.model.locale,
      file: "model.json",
      sha256: prepared.loaded.sha256,
      bytes: prepared.loaded.bytes,
    },
    repository: prepared.model.repository,
    quality: chosen.quality,
    media: prepared.media,
    style: prepared.styleRecord,
    sources: { state: prepared.binding.state, count: prepared.binding.records.length },
    supplies: {
      fonts: fonts.sha256,
      house: house.sha256,
      opentype: opentype.sha256,
      icons: prepared.icons.supplySha256,
      ...(page ? { archify: page.supplySha256 } : {}),
    },
    views: prepared.views.map((view) => viewSummary(view, prepared.plates)),
    edition: edition
      ? {
          file: `${model.id}.pdf`,
          pages: edition.pages,
          typst: edition.typst,
          house: edition.house,
          release: prepared.commit?.release ?? null,
          date: prepared.commit?.date ?? null,
          dated: dated.by,
          ...(overview
            ? {
                image: chosen.png.map((width) =>
                  width === PNG_WIDTHS[0]
                    ? "images/00-overview.png"
                    : `images/00-overview-${width}.png`,
                ),
              }
            : {}),
        }
      : null,
    plates: prepared.plates.map((plate) => plateSummary(plate, chosen.png)),
    page:
      !page || !prepared.page
        ? null
        : prepared.page.kind === "guide"
          ? {
              file: `${model.id}.html`,
              quality: page.receipt.quality,
              gates: page.receipt.gates,
              guide: guideSummary(prepared.page),
            }
          : {
              file: `${model.id}.html`,
              quality: page.receipt.quality,
              gates: page.receipt.gates,
              diagrams: prepared.page.diagrams.map(diagramSummary),
              withheld: prepared.page.withheld,
            },
    ...(overview ? { overview: overviewSummary(prepared.model, overview) } : {}),
    data: { file: `${model.id}.json`, ...pinned.counts },
    reader: { file: `${model.id}.md`, bytes: pinned.reader.length, statements: pinned.statements },
    artifacts: build.artifacts,
  };
}
