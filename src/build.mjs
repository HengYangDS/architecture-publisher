import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  deliveryManifest,
  diagramSummary,
  overviewSummary,
  plateSummary,
  PNG_WIDTHS,
  viewSummary,
} from "./manifest.mjs";
import { guideOf, pinnedEdition, requireDeliveryNames } from "./projection.mjs";
import { editionFacts } from "./facts/edition.mjs";
import { loadIcons } from "./icons.mjs";
import { deliverExplainer, explainerPage, writePage } from "./map/explainer.mjs";
import { deliverGuide, guidePage, guideSummary } from "./map/guide.mjs";
import { loadModel } from "./model/load.mjs";
import { editionRecord } from "./edition/record.mjs";
import { typesetEdition } from "./edition/typeset.mjs";
import { checkOverview, typstVersion } from "./overview/typeset.mjs";
import { planViews, undrawnStatements } from "./plan/views.mjs";
import { admitsView, composePlates, lineWarnings } from "./poster/compose/plates.mjs";
import { longestOf, withStripLength } from "./poster/strip.mjs";
import { loadTypefaces, requireGlyphs } from "./poster/text.mjs";
import { refuse } from "./refusal.mjs";
import { bindSources } from "./sources/bind.mjs";
import { measureCoverage, uncitedStatements } from "./sources/coverage.mjs";
import { commitDate, commitOf, commitTime, releaseOf } from "./sources/git.mjs";
import { editionStyle } from "./style.mjs";
import { verifySupply } from "./supply.mjs";

export { DELIVERY_FORMAT } from "./manifest.mjs";
/** The media a delivery may carry: the print edition with its images, and the interactive page. */
const MEDIA = Object.freeze(["edition", "page"]);
/** The quality profiles a build may hold its media to. */
const QUALITIES = Object.freeze(["showcase", "standard"]);
/** The widest the edition's images may be rendered. */
const MAXIMUM_WIDTH = 6000;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/**
 * What a build produces and the quality it holds it to: the media to deliver,
 * each poster page's PNG widths, and the profile both media are checked at.
 * Showcase refuses a poster page that misses a gate, unless its model is too
 * small to fill it, and a page diagram that misses Archify's showcase checks;
 * standard delivers the closest pages as drafts that record what they miss.
 * @typedef {{ repo?: string | null, media?: readonly string[], png?: readonly number[],
 *   quality?: string }} BuildOptions
 * @typedef {(step: string) => void} StepListener told each step of a check or a build as it is reached
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
  const media = requested ? MEDIA.filter((name) => requested.includes(name)) : [...MEDIA];
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
  for (const key of ["title", "question", "summary", "scope"]) add(`/${key}`, model[key]);
  model.editors.forEach((editor, index) => add(`/editors/${index}/name`, editor.name));
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
      "The model names no overview composition; name one in `overview`.",
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
 * the build delivers are composed. The listener is told each step as it is reached.
 * @param {string} modelPath
 * @param {ReturnType<typeof buildOptions>} options
 * @param {StepListener} listener
 */
async function prepare(modelPath, options, listener) {
  listener("reading the model");
  const [icons, typefaces] = await Promise.all([loadIcons(), loadTypefaces()]);
  const loaded = await loadModel(modelPath, { icon: icons.has });
  const { model } = loaded;
  // A delivery names its files by the model's id: an id that takes the name of another file ends the work here.
  requireDeliveryNames(model.id);
  const { media } = options;
  const printed = media.includes("edition");
  // The edition is typeset by the pinned Typst; the page needs none.
  if (printed) await typstVersion("typst", "edition");
  const composition =
    printed && model.overview ? await compositionOf(modelPath, model.overview) : null;
  requireGlyphs(typefaces, drawnTexts(model));
  listener("verifying files");
  const binding = bindSources(model, options.repo);
  // The pin is read once, and every fact a plate, the record or the page shows is measured from it and the binding
  // here, before the plan: a view is admitted as its marks draw it.
  const commit = commitFacts(model, options.repo);
  // The guide is read whichever media are built: its citations are evidence and its draft ends the reader file. With
  // a checkout, a file it cites that the pin does not hold ends the work here.
  const guide = await guideOf(model, modelPath, binding, commit && options.repo);
  const facts = editionFacts(model, binding, commit);
  // A checkout the model gives no file to verify is named, not refused: a model may be checked before it claims any.
  // The edition's marks and palette are chosen once, before the plan, since a view is admitted as its marks draw it.
  const { style: chosen, warnings: styled, record: chosenRecord } = editionStyle(model, facts);
  const warnings = [
    ...(options.repo && binding.state === "none"
      ? [
          {
            code: "repo_unused",
            message: `--repo names ${options.repo}, but the model claims and cites no file, so none is verified there.`,
          },
        ]
      : []),
    ...styled,
  ];
  const overview = composition
    ? await checkOverview({
        composition,
        modelBytes: loaded.content,
        revision: model.repository?.revision ?? null,
        date: commit?.date ?? null,
        tokens: chosen.tokens,
      })
    : null;
  // Each view is one plate of the edition, laid out for its body, with the edition's strips as long as every view
  // can hold them.
  listener("planning views");
  const { style, views, plates } = await withStripLength(chosen, async (drawn) => {
    const planned = await planViews(model, async (view) =>
      admitsView(model, view, typefaces, icons, drawn),
    );
    if (!printed) return { style: drawn, views: planned, plates: [] };
    listener("laying out the plates");
    return {
      style: drawn,
      views: planned,
      plates: composePlates(model, planned, typefaces, icons, drawn),
    };
  });
  warnings.push(...lineWarnings(plates, style));
  // With strips, the manifest records the length the edition draws its largest part at.
  const styleRecord =
    style.name === "strip" ? { ...chosenRecord, longest: longestOf(style) } : chosenRecord;
  const { quality } = options;
  // The page is the work's guide when the model names one, and the generated page otherwise.
  const paged = media.includes("page");
  if (paged) listener("preparing the page");
  const page = !paged
    ? null
    : guide
      ? await guidePage(model, guide, { quality, repo: options.repo })
      : await explainerPage(model, views, { quality, owned: facts.owned });
  const held = {
    loaded,
    model,
    binding,
    facts,
    warnings,
    media,
    views,
    plates,
    page,
    composition,
    overview,
    commit,
    icons,
    typefaces,
    style,
    styleRecord,
    guide,
    publisher: await publisherVersion(),
  };
  // The pinned edition is gathered and held to its invariants before a check reports and before a build writes.
  return { ...held, pinned: pinnedEdition(held, options.png) };
}

/**
 * The model's revision in the checkout: its commit date and time and the release it is tagged as, or none without
 * a checkout.
 * @param {any} model
 * @param {string | null} repo
 */
function commitFacts(model, repo) {
  if (!repo || !model.repository?.revision) return null;
  const root = path.resolve(repo);
  const commit = commitOf(root, model.repository.revision, "source_revision_unknown");
  return {
    date: commitDate(root, commit),
    time: commitTime(root, commit),
    release: releaseOf(root, commit),
  };
}

/**
 * Check a model end to end without writing: validation, files, plan, layout and admission,
 * then what the plan leaves undrawn, what claims or cites no file and, with a checkout, the model's
 * coverage of it and, with `against`, its currency and re-pin worklist, which reads the guide's
 * citations when the model names a guide. A listener is told each step as the check reaches it.
 * @param {string} modelPath
 * @param {BuildOptions & { against?: string | null }} [options]
 * @param {StepListener} [listener]
 */
export async function checkModel(modelPath, options = {}, listener = () => {}) {
  const chosen = buildOptions(options);
  const against = options.against ?? null;
  if (against !== null && !chosen.repo)
    refuse(
      "coverage_repository_missing",
      "Measuring currency needs the repository checkout that --repo names.",
    );
  const prepared = await prepare(modelPath, chosen, listener);
  const { model } = prepared;
  // The worklist classifies the guide's citations.
  const citations = prepared.guide?.citations ?? [];
  return {
    model: { id: model.id, sha256: prepared.loaded.sha256 },
    quality: chosen.quality,
    media: prepared.media,
    sources: { state: prepared.binding.state, count: prepared.binding.records.length },
    views: prepared.views.map((view) => viewSummary(view, prepared.plates)),
    plates: prepared.plates.map((plate) => plateSummary(plate, chosen.png)),
    diagrams:
      prepared.page?.kind === "guide" ? [] : (prepared.page?.diagrams.map(diagramSummary) ?? []),
    guide: prepared.page?.kind === "guide" ? guideSummary(prepared.page) : null,
    overview: prepared.overview ? overviewSummary(model, prepared.overview) : null,
    statements: {
      undrawn: undrawnStatements(model, prepared.views),
      uncited: uncitedStatements(model),
    },
    data: prepared.pinned.counts,
    coverage: chosen.repo
      ? measureCoverage(model, prepared.binding, chosen.repo, { against, citations })
      : null,
    warnings: prepared.warnings,
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
 * and moved into place only when complete. A listener is told each step as the
 * build reaches it.
 * @param {string} modelPath
 * @param {string} out
 * @param {BuildOptions} [options]
 * @param {StepListener} [listener]
 */
export async function buildDelivery(modelPath, out, options = {}, listener = () => {}) {
  const chosen = buildOptions(options);
  const target = path.resolve(out);
  if (await exists(target))
    refuse("delivery_exists", `The output ${target} already exists; choose a new directory.`);
  const prepared = await prepare(modelPath, chosen, listener);
  const parent = path.dirname(target);
  await fs.mkdir(parent, { recursive: true });
  const staging = await fs.mkdtemp(path.join(parent, `.${path.basename(target)}.partial-`));
  try {
    const { overview, model } = prepared;
    // The edition is dated by its revision's commit; without the checkout, by SOURCE_DATE_EPOCH when the caller
    // sets one, as reproducible builds do; otherwise by the time it is typeset, and then it is not reproducible.
    const epoch = process.env.SOURCE_DATE_EPOCH;
    const dated = prepared.commit
      ? { by: "commit", time: prepared.commit.time }
      : epoch && /^\d+$/u.test(epoch)
        ? { by: "SOURCE_DATE_EPOCH", time: Number(epoch) }
        : { by: "typesetting", time: null };
    const printed = prepared.media.includes("edition");
    if (printed) listener("typesetting the edition");
    const edition = !printed
      ? null
      : await typesetEdition({
          record: editionRecord({
            model,
            plates: prepared.plates,
            icons: prepared.icons,
            facts: prepared.facts,
            modelSha256: prepared.loaded.sha256,
            publisher: await publisherVersion(),
            typst: "0.15.1",
            overview: Boolean(overview),
            page: `${model.id}.html`,
            time: dated.time,
          }),
          plates: prepared.plates,
          modelBytes: prepared.loaded.content,
          composition: prepared.composition,
          revision: model.repository?.revision ?? null,
          date: prepared.commit?.date ?? null,
          time: dated.time,
          widths: chosen.png,
          tokens: prepared.style.tokens,
        });
    if (edition) {
      await fs.writeFile(path.join(staging, `${model.id}.pdf`), edition.pdf);
      await fs.mkdir(path.join(staging, "images"));
      for (const { file, bytes } of edition.png)
        await fs.writeFile(path.join(staging, file), bytes);
    }
    if (prepared.page) listener("delivering the page");
    const page = !prepared.page
      ? null
      : prepared.page.kind === "guide"
        ? await deliverGuide(prepared.page, staging, `${model.id}.html`)
        : await deliverExplainer(prepared.page, staging, `${model.id}.html`);
    const [fonts, house, opentype] = await Promise.all([
      verifySupply("fonts"),
      verifySupply("house"),
      verifySupply("opentype"),
    ]);
    // With the edition typeset each plate's page is known: the pinned edition is gathered again and written.
    const pinned = pinnedEdition(prepared, chosen.png, edition?.platePages);
    for (const [file, bytes] of pinned.files) await fs.writeFile(path.join(staging, file), bytes);
    const manifest = deliveryManifest({
      prepared,
      chosen,
      edition,
      page,
      dated,
      publisher: prepared.publisher,
      supplies: { fonts, house, opentype },
      pinned,
      artifacts: await digestTree(staging),
    });
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
      plates: manifest.plates.length,
      artifacts: manifest.artifacts.length,
      warnings: prepared.warnings,
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
