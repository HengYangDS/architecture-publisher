import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { loadIcons } from "./icons.mjs";
import { deliverExplainer, explainerPage, writePage } from "./map/explainer.mjs";
import { deliverGuide, guideCitations, guidePage, guideSummary, readGuide } from "./map/guide.mjs";
import { loadModel } from "./model/load.mjs";
import { typesetOverview } from "./overview/typeset.mjs";
import { planViews, undrawnStatements } from "./plan/views.mjs";
import { admitsView } from "./poster/compose/candidates.mjs";
import { composePosters } from "./poster/compose/edition.mjs";
import { MAXIMUM_WIDTH, rasterize } from "./poster/raster.mjs";
import { loadTypefaces, requireGlyphs } from "./poster/text.mjs";
import { POSTER } from "./poster/tokens.mjs";
import { refuse } from "./refusal.mjs";
import { bindSources } from "./sources/bind.mjs";
import { measureCoverage, uncitedStatements } from "./sources/coverage.mjs";
import { commitDate, commitOf } from "./sources/git.mjs";
import { verifySupply } from "./supply.mjs";

export const DELIVERY_FORMAT = "architecture-publisher.delivery";
const DELIVERY_VERSION = 5;
/** The media a delivery may carry: the poster pages, the interactive page and the overview. */
const MEDIA = Object.freeze(["posters", "page", "overview"]);
/** The quality profiles a build may hold its media to. */
const QUALITIES = Object.freeze(["showcase", "standard"]);
/** The PNG widths a poster page is rasterized at by default: its own width. */
const PNG_WIDTHS = Object.freeze([POSTER.width]);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/**
 * What a build produces and the quality it holds it to: the media to deliver,
 * each poster page's PNG widths, and the profile both media are checked at.
 * Showcase refuses a poster page that misses a gate, unless its model is too
 * small to fill it, and a page diagram that misses Archify's showcase checks;
 * standard delivers the closest pages as drafts that record what they miss.
 * @typedef {{ repo?: string | null, media?: readonly string[], png?: readonly number[],
 *   quality?: string }} BuildOptions
 */

/**
 * The build options with their defaults, checked.
 * @param {BuildOptions} options
 */
function buildOptions(options = {}) {
  const requested = options.media ?? null;
  const png = [...new Set(options.png ?? PNG_WIDTHS)].sort((a, b) => a - b);
  const quality = options.quality ?? "showcase";
  if (requested && (!requested.length || requested.some((name) => !MEDIA.includes(name))))
    refuse("build_media_invalid", `Media must be one or more of ${MEDIA.join(", ")}.`);
  // Without --media, the model decides whether the overview is delivered.
  const media = requested ? MEDIA.filter((name) => requested.includes(name)) : null;
  if (
    !png.length ||
    png.some((width) => !Number.isInteger(width) || width < 1 || width > MAXIMUM_WIDTH)
  )
    refuse(
      "build_png_invalid",
      `PNG widths must be whole numbers from 1 to ${MAXIMUM_WIDTH} pixels.`,
    );
  if (!QUALITIES.includes(quality))
    refuse("build_quality_invalid", `Quality must be one of ${QUALITIES.join(", ")}.`);
  return {
    repo: options.repo ?? null,
    media,
    png,
    quality: /** @type {"showcase" | "standard"} */ (quality),
  };
}

/** The files of one poster page: its SVG and one PNG per width, the page's own width unsuffixed. */
const posterFiles = (page, widths) => ({
  svg: `page-${page}.svg`,
  png: widths.map((width) => ({
    width,
    file: width === POSTER.width ? `page-${page}.png` : `page-${page}-${width}.png`,
  })),
});

/** The publisher's own version, recorded in every manifest. */
async function publisherVersion() {
  const manifest = JSON.parse(
    await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  return manifest.version;
}

/** Every text a poster can draw, with its JSON path, so missing glyphs are refused up front. */
function drawnTexts(model) {
  const texts = [];
  const add = (where, value) => value && texts.push({ path: where, text: value });
  for (const key of ["title", "question", "summary", "scope", "attribution"])
    add(`/${key}`, model[key]);
  model.limits.forEach((limit, index) => add(`/limits/${index}`, limit));
  if (model.repository) add("/repository/name", model.repository.name);
  model.kinds.forEach((kind) => add(`/kinds/${kind.id}/label`, kind.label));
  const element = (where, item) => {
    add(`${where}/label`, item.label);
    for (const [name, values] of item.details) {
      add(`${where}/details/${name}`, name);
      values.forEach((value, index) => add(`${where}/details/${name}/${index}`, value));
    }
  };
  model.components.forEach((component, index) => element(`/components/${index}`, component));
  model.relations.forEach((relation, index) => element(`/relations/${index}`, relation));
  model.groups.forEach((group, index) => add(`/groups/${index}/label`, group.label));
  (model.views ?? []).forEach((view, index) => {
    for (const key of ["title", "question", "summary"]) add(`/views/${index}/${key}`, view[key]);
    (view.tiers ?? []).forEach((tier, position) =>
      add(`/views/${index}/tiers/${position}/label`, tier.label),
    );
  });
  return texts;
}

/**
 * The model's overview composition, resolved beside the model, refused when the
 * model names none or no file is there.
 * @param {string} modelPath
 * @param {string | null} named the model's `overview`
 */
async function compositionOf(modelPath, named) {
  if (!named)
    refuse(
      "overview_composition_missing",
      "The model names no overview composition; name one in `overview` or leave the overview out of --media.",
    );
  const composition = path.resolve(path.dirname(modelPath), named);
  if (!(await fs.stat(composition).catch(() => null))?.isFile())
    refuse(
      "overview_composition_missing",
      `The model names the overview composition ${named}, but no file is at ${composition}.`,
    );
  return composition;
}

/**
 * Validate, bind, plan and compose without writing anything. Only the media
 * the build delivers are composed.
 * @param {string} modelPath
 * @param {ReturnType<typeof buildOptions>} options
 */
async function prepare(modelPath, options) {
  const [icons, typefaces] = await Promise.all([loadIcons(), loadTypefaces()]);
  const loaded = await loadModel(modelPath, { icon: icons.has });
  const { model } = loaded;
  const media = options.media ?? MEDIA.filter((name) => name !== "overview" || model.overview);
  const composition = media.includes("overview")
    ? await compositionOf(modelPath, model.overview)
    : null;
  requireGlyphs(typefaces, drawnTexts(model));
  const binding = bindSources(model, options.repo);
  const overview = composition
    ? await typesetOverview({
        composition,
        modelBytes: loaded.content,
        revision: model.repository?.revision ?? null,
        date: revisionDate(model, options.repo),
        widths: options.png,
      })
    : null;
  const views = await planViews(model, async (view) => admitsView(model, view, typefaces, icons));
  const { quality } = options;
  // Pages are composed for the edition as a whole: a sparse view shares a page
  // with its neighbour, so a poster is a page, not a view.
  const posters = media.includes("posters")
    ? composePosters(model, views, typefaces, icons, { quality })
    : [];
  // The page is the work's guide when the model names one, and the generated page otherwise.
  const page = !media.includes("page")
    ? null
    : model.guide
      ? await guidePage(model, modelPath, { quality, repo: options.repo })
      : await explainerPage(model, views, { quality, owned: binding.owned });
  return { loaded, model, binding, media, views, posters, page, overview, icons, typefaces };
}

/** The commit date of the model's revision in the checkout, or none without one. */
function revisionDate(model, repo) {
  if (!repo || !model.repository?.revision) return null;
  const root = path.resolve(repo);
  return commitDate(root, commitOf(root, model.repository.revision, "source_revision_unknown"));
}

/** The overview's inputs and Typst's reading of them, for the manifest and the check. */
function overviewSummary(model, overview) {
  return {
    composition: { path: model.overview, sha256: overview.composition },
    house: overview.house,
    typst: overview.typst,
    date: overview.date,
    texts: overview.texts.length,
  };
}

function viewSummary(view, posters) {
  const page = posters.find((poster) => poster.views.includes(view.id));
  return {
    id: view.id,
    title: view.title,
    question: view.question,
    origin: view.origin,
    tiers: view.tiers?.map(({ id }) => id) ?? null,
    components: view.components.map(({ id }) => id),
    relations: view.relations.map(({ id }) => id),
    poster: page?.page ?? null,
  };
}

/** One view's diagram on the interactive page: its shape and Archify's route measures. */
function diagramSummary(diagram) {
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

/**
 * The evidence behind every component and relation, which the delivery keeps
 * out of its drawings: details, statuses and the files each one claims or cites.
 * @param {any} model
 */
function evidenceOf(model) {
  const element = (item) => ({
    id: item.id,
    label: item.label,
    ...(item.status ? { status: item.status } : {}),
    details: Object.fromEntries(item.details),
    files: item.files,
  });
  return {
    components: model.components.map((component) => ({
      ...element(component),
      kind: component.kind,
    })),
    relations: model.relations.map((relation) => ({
      ...element(relation),
      from: relation.from,
      to: relation.to,
    })),
  };
}

/** One poster page's files, composition and measures, and the gates it misses, for the manifest. */
function posterSummary(poster, widths) {
  return {
    page: poster.page,
    ...posterFiles(poster.page, widths),
    views: poster.views,
    admission: poster.admission,
    ...(poster.misses.length ? { misses: poster.misses } : {}),
    composition: poster.composition,
    measures: poster.measures,
  };
}

/**
 * Check a model end to end without writing: validation, files, plan, layout and admission,
 * then what the plan leaves undrawn, what claims or cites no file and, with a checkout, the model's
 * coverage of it and, with `against`, its currency and re-pin worklist, which reads the guide's
 * citations when the model names a guide.
 * @param {string} modelPath
 * @param {BuildOptions & { against?: string | null }} [options]
 */
export async function checkModel(modelPath, options = {}) {
  const chosen = buildOptions(options);
  const against = options.against ?? null;
  if (against !== null && !chosen.repo)
    refuse(
      "coverage_repository_missing",
      "Measuring currency needs the repository checkout that --repo names.",
    );
  const prepared = await prepare(modelPath, chosen);
  const { model } = prepared;
  // The worklist classifies the guide's citations, read here when the page was not prepared.
  const guided = against !== null && model.guide;
  const entries = !guided
    ? null
    : prepared.page?.kind === "guide"
      ? prepared.page.entries
      : (await readGuide(path.resolve(path.dirname(modelPath), model.guide))).entries;
  const citations = entries ? guideCitations(entries) : [];
  return {
    model: { id: model.id, sha256: prepared.loaded.sha256 },
    quality: chosen.quality,
    media: prepared.media,
    sources: { state: prepared.binding.state, count: prepared.binding.records.length },
    views: prepared.views.map((view) => viewSummary(view, prepared.posters)),
    posters: prepared.posters.map((poster) => posterSummary(poster, chosen.png)),
    diagrams:
      prepared.page?.kind === "guide" ? [] : (prepared.page?.diagrams.map(diagramSummary) ?? []),
    guide: prepared.page?.kind === "guide" ? guideSummary(prepared.page) : null,
    overview: prepared.overview ? overviewSummary(model, prepared.overview) : null,
    statements: {
      undrawn: undrawnStatements(model, prepared.views),
      uncited: uncitedStatements(model),
    },
    coverage: chosen.repo
      ? measureCoverage(model, prepared.binding, chosen.repo, { against, citations })
      : null,
  };
}

async function exists(file) {
  try {
    await fs.lstat(file);
    return true;
  } catch {
    return false;
  }
}

/** Digest records of every regular file under a directory, sorted by relative path. */
export async function digestTree(root, skip = new Set()) {
  const out = [];
  const walk = async (directory) => {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      const relative = path.relative(root, full).split(path.sep).join("/");
      if (skip.has(relative)) continue;
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) {
        const bytes = await fs.readFile(full);
        out.push({ path: relative, bytes: bytes.length, sha256: sha256(bytes) });
      } else refuse("delivery_entry_invalid", `${relative} is neither a file nor a directory.`);
    }
  };
  await walk(root);
  return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/**
 * Build a delivery into `out`, which must not exist. Output is staged beside it
 * and moved into place only when complete.
 * @param {string} modelPath
 * @param {string} out
 * @param {BuildOptions} [options]
 */
export async function buildDelivery(modelPath, out, options = {}) {
  const chosen = buildOptions(options);
  const target = path.resolve(out);
  if (await exists(target))
    refuse("delivery_exists", `The output ${target} already exists; choose a new directory.`);
  const prepared = await prepare(modelPath, chosen);
  const parent = path.dirname(target);
  await fs.mkdir(parent, { recursive: true });
  const staging = await fs.mkdtemp(path.join(parent, `.${path.basename(target)}.partial-`));
  try {
    for (const poster of prepared.posters) {
      const files = posterFiles(poster.page, chosen.png);
      await fs.writeFile(path.join(staging, files.svg), poster.svg);
      for (const { width, file } of files.png)
        await fs.writeFile(
          path.join(staging, file),
          await rasterize(poster.svg, width, poster.height, poster.width),
        );
    }
    const { overview } = prepared;
    if (overview) {
      await fs.writeFile(path.join(staging, overview.files.svg), overview.svg);
      for (const { file, bytes } of overview.png)
        await fs.writeFile(path.join(staging, file), bytes);
    }
    const page = !prepared.page
      ? null
      : prepared.page.kind === "guide"
        ? await deliverGuide(prepared.page, staging)
        : await deliverExplainer(prepared.page, staging);
    const [fonts, resvg] = await Promise.all([verifySupply("fonts"), verifySupply("resvg")]);
    const manifest = {
      format: DELIVERY_FORMAT,
      version: DELIVERY_VERSION,
      publisher: { name: "architecture-publisher", version: await publisherVersion() },
      model: {
        id: prepared.model.id,
        title: prepared.model.title,
        locale: prepared.model.locale,
        sha256: prepared.loaded.sha256,
        bytes: prepared.loaded.bytes,
      },
      repository: prepared.model.repository,
      quality: chosen.quality,
      media: prepared.media,
      sources: { state: prepared.binding.state, records: prepared.binding.records },
      supplies: {
        fonts: fonts.sha256,
        icons: prepared.icons.supplySha256,
        resvg: resvg.sha256,
        ...(page ? { archify: page.supplySha256 } : {}),
        ...(overview ? { house: overview.supply } : {}),
      },
      views: prepared.views.map((view) => viewSummary(view, prepared.posters)),
      posters: prepared.posters.map((poster) => posterSummary(poster, chosen.png)),
      page:
        !page || !prepared.page
          ? null
          : prepared.page.kind === "guide"
            ? {
                quality: page.receipt.quality,
                gates: page.receipt.gates,
                guide: guideSummary(prepared.page),
              }
            : {
                quality: page.receipt.quality,
                gates: page.receipt.gates,
                diagrams: prepared.page.diagrams.map(diagramSummary),
                withheld: prepared.page.withheld,
              },
      ...(overview
        ? { overview: { ...overviewSummary(prepared.model, overview), ...overview.files } }
        : {}),
      evidence: evidenceOf(prepared.model),
      artifacts: await digestTree(staging),
    };
    await fs.writeFile(
      path.join(staging, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    await fs.rename(staging, target);
    return {
      out: target,
      model: manifest.model,
      media: prepared.media,
      views: manifest.views.map(({ id }) => id),
      posters: manifest.posters.length,
      artifacts: manifest.artifacts.length,
    };
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
}

/** The draft a scaffold writes; the diagrams it names are written beside it. */
const GUIDE_DRAFT = "guide.archify.md";

/**
 * Write the page the publisher generates for a model as a starting guide: its draft and one
 * architecture document per view, into `out`, which must not exist. Its prose is the model's, which
 * Archify's strict writing checks may hold to shorter sentences, each reported at its line. The
 * output is staged beside it and moved into place only when complete.
 * @param {string} modelPath
 * @param {string} out
 */
export async function scaffoldGuide(modelPath, out) {
  const target = path.resolve(out);
  if (await exists(target))
    refuse(
      "scaffold_output_exists",
      `The output ${target} already exists; choose a new directory.`,
    );
  const [icons, typefaces] = await Promise.all([loadIcons(), loadTypefaces()]);
  const { model } = await loadModel(modelPath, { icon: icons.has });
  const views = await planViews(model, async (view) => admitsView(model, view, typefaces, icons));
  const page = await explainerPage(model, views);
  const parent = path.dirname(target);
  await fs.mkdir(parent, { recursive: true });
  const staging = await fs.mkdtemp(path.join(parent, `.${path.basename(target)}.partial-`));
  try {
    await fs.rename(await writePage(page, staging), path.join(staging, GUIDE_DRAFT));
    await fs.rename(staging, target);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
  return { out: target, draft: GUIDE_DRAFT, files: page.diagrams.map(({ file }) => file) };
}
