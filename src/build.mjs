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
import { explainerPage, writeDelivery, writePage } from "./map/explainer.mjs";
import { guidePage, guideSummary } from "./map/guide.mjs";
import { loadModel } from "./model/load.mjs";
import { FIGURES, IMAGES, MANIFEST, TYPST_VERSION, filesOf, two } from "./names.mjs";
import { editionRecord } from "./edition/record.mjs";
import { editionWordsOf } from "./edition/words.mjs";
import { typesetEdition } from "./edition/typeset.mjs";
import { checkOverview, typstVersion } from "./overview/typeset.mjs";
import { planViews, undrawnStatements } from "./plan/views.mjs";
import { admitsView, composePlates, lineWarnings } from "./poster/compose/plates.mjs";
import { longestOf, measuredOf, withStripLength } from "./poster/strip.mjs";
import { loadTypefaces, requireGlyphs } from "./poster/text.mjs";
import { refuse } from "./refusal.mjs";
import { bindSources } from "./sources/bind.mjs";
import { measureCoverage, uncitedStatements } from "./sources/coverage.mjs";
import { commitDate, commitOf, commitTime, releaseOf } from "./sources/git.mjs";
import { editionStyle } from "./style.mjs";
import { verifySupply } from "./supply.mjs";

export { DELIVERY_FORMAT, PNG_WIDTHS } from "./manifest.mjs";
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
 * The views a model declares that nothing on its overview names, each as a problem at its path: the overview is
 * the edition's map, and a view it does not reach is a plate a reader finds only in the contents.
 * @param {any} model
 */
function unreachedViews(model) {
  /** @type {Set<string>} */
  const named = new Set();
  const walk = (/** @type {unknown} */ value) => {
    if (!value || typeof value !== "object") return;
    for (const [key, item] of Object.entries(value))
      if (key === "view" && typeof item === "string") named.add(item);
      else walk(item);
  };
  walk(model.overview);
  return (model.views ?? []).flatMap((view, index) =>
    named.has(view.id)
      ? []
      : [
          {
            code: "overview_view_unreached",
            path: `/views/${index}`,
            message: `Nothing on the overview names the view ${view.id}; name it in the step or block it enlarges.`,
          },
        ],
  );
}

/**
 * The overview's lines that are not spread to their measure, each as a warning for the statement's author: the
 * line would open more than the overview allows, or holds one word with no place to open.
 * @param {Array<{ text: string, line: string, opening: number | null }>} loose
 */
const looseLines = (loose) =>
  loose.map(({ text, line, opening }) => ({
    code: "overview_line_loose",
    path: "/overview",
    message:
      opening === null
        ? `The overview leaves the line "${line}" short of its measure: it has no place to open. It is a line of the text "${text}".`
        : `The overview leaves the line "${line}" short of its measure: spread, it would open ${opening.toFixed(2)} em at each place. It is a line of the text "${text}".`,
  }));

/**
 * Start a page and wait until its first run of Archify has begun, or until the page is done without one: the work
 * that follows holds this process, and Archify's run goes on beside it in a process of its own.
 * @param {(started: () => void) => Promise<any>} start
 */
async function begun(start) {
  /** @type {() => void} */
  let started = () => {};
  const running = new Promise((resolve) => {
    started = () => resolve(undefined);
  });
  const work = start(started);
  work.catch(() => {});
  await Promise.race([
    running,
    work.then(
      () => {},
      () => {},
    ),
  ]);
  // Held in an object: an async function that returned the promise itself would wait for it.
  return { work };
}

/**
 * Validate, bind, plan and compose without writing anything. Only the media
 * the build delivers are composed. The listener is told each step as it is reached.
 * A build's page is prepared with its delivery, which Archify validates, writes and
 * checks in one run; a check's page is validated alone.
 * @param {string} modelPath
 * @param {ReturnType<typeof buildOptions>} options
 * @param {StepListener} listener
 * @param {{ deliver?: boolean }} [page]
 */
async function prepare(modelPath, options, listener, { deliver = false } = {}) {
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
  requireGlyphs(typefaces, drawnTexts(model));
  listener("verifying files");
  const binding = bindSources(model, options.repo);
  // The pin is read once, and every fact a plate, the record or the page shows is measured from it and the binding
  // here, before the plan: a view is admitted as its parts are drawn.
  const commit = commitFacts(model, options.repo);
  // The guide is read whichever media are built: its citations are evidence and its draft ends the reader file. With
  // a checkout, a file it cites that the pin does not hold ends the work here.
  const guide = await guideOf(model, modelPath, binding, commit && options.repo);
  const facts = editionFacts(model, binding, commit);
  // A checkout the model gives no file to verify is named, not refused: a model may be checked before it claims any.
  // The edition's palette is resolved once, before the plan, since a view is admitted in the edition's one style.
  const { style: chosen, record: chosenRecord } = editionStyle(model, facts);
  const warnings =
    options.repo && binding.state === "none"
      ? [
          {
            code: "repo_unused",
            message: `--repo names ${options.repo}, but the model claims and cites no file, so none is verified there.`,
          },
        ]
      : [];
  const { quality } = options;
  // The page is the work's guide when the model names one, and the generated page otherwise.
  const paged = media.includes("page");
  const deliverAs = deliver ? filesOf(model.id).page : undefined;
  /** @param {any[]} planned @returns {(started: () => void) => Promise<any>} */
  const pageOf = (planned) => (started) =>
    guide
      ? guidePage(model, guide, { quality, repo: options.repo, deliver: deliverAs, started })
      : explainerPage(model, planned, { quality, owned: facts.owned, deliver: deliverAs, started });
  /** The page's work once started; set inside the plan, so held in an object the checker reads as it is typed. */
  const begunPage = /** @type {{ work: Promise<any> | null }} */ ({ work: null });
  // The overview is the edition's map: an edition that sets a stated overview refuses a view it does not reach,
  // before any view is planned.
  const unreached = printed && model.overview ? unreachedViews(model) : [];
  if (unreached.length)
    refuse(
      "overview_view_unreached",
      `Nothing on the overview names ${unreached.length === 1 ? "one view" : `${unreached.length} views`}: ` +
        "name each in the step or block it enlarges.",
      unreached,
    );
  // Each view is one plate of the edition, laid out for its body, with the edition's strips as long as every view
  // can hold them.
  listener("planning views");
  const { style, views, plates } = await withStripLength(chosen, async (drawn) => {
    const planned = await planViews(model, async (view) =>
      admitsView(model, view, typefaces, icons, drawn),
    );
    // The page needs the planned views and not the plates: it starts here, and its run of Archify goes on beside the
    // plates' layout, which holds this process. A guide needs no view and starts once; a generated page starts again
    // where shorter strips plan the views again.
    if (paged && !(guide && begunPage.work)) begunPage.work = (await begun(pageOf(planned))).work;
    if (!printed) return { style: drawn, views: planned, plates: [] };
    listener("laying out the plates");
    return {
      style: drawn,
      views: planned,
      plates: composePlates(model, planned, typefaces, icons, drawn),
    };
  });
  warnings.push(...lineWarnings(plates, style));
  // The overview is the edition's map: where a step or a block names a view, the page sets that view's plate number.
  const plateNumbers = Object.fromEntries(
    plates.flatMap((plate) => plate.views.map((view) => [view, two(plate.page)])),
  );
  const overview =
    printed && model.overview
      ? await checkOverview({
          modelBytes: loaded.content,
          plates: plateNumbers,
          writtenFrom: facts.read ? editionWordsOf(model.locale).writtenFrom(facts.read) : null,
          revision: model.repository?.revision ?? null,
          date: commit?.date ?? null,
          tokens: chosen.tokens,
        })
      : null;
  if (overview) warnings.push(...looseLines(overview.loose));
  // Where the edition draws strips, the manifest records the length it draws its largest part at.
  const styleRecord = measuredOf(style)
    ? { ...chosenRecord, longest: longestOf(style) }
    : chosenRecord;
  if (paged) listener("preparing the page");
  // A build's page is made beside its plates and its edition: the build awaits it to write the page, after the
  // edition is typeset, where a page that fails fails. A check awaits it here.
  const pageWork = begunPage.work;
  const page = deliver ? null : await pageWork;
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
    overview,
    commit,
    icons,
    typefaces,
    style,
    styleRecord,
    guide,
    publisher: await publisherVersion(),
  };
  // The pinned edition is gathered and held to its invariants before a check reports and before a build writes;
  // a build gathers it again with its page.
  return { ...held, pinned: pinnedEdition(held, options.png), pageWork: deliver ? pageWork : null };
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
  const prepared = await prepare(modelPath, chosen, listener, { deliver: true });
  const parent = path.dirname(target);
  await fs.mkdir(parent, { recursive: true });
  const staging = await fs.mkdtemp(path.join(parent, `.${path.basename(target)}.partial-`));
  try {
    const { overview, model } = prepared;
    const files = filesOf(model.id);
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
            publisher: await publisherVersion(),
            typst: TYPST_VERSION,
            overview: Boolean(overview),
            page: files.page,
            time: dated.time,
          }),
          plates: prepared.plates,
          modelBytes: prepared.loaded.content,
          revision: model.repository?.revision ?? null,
          date: prepared.commit?.date ?? null,
          time: dated.time,
          widths: chosen.png,
          alone: true,
          tokens: prepared.style.tokens,
        });
    if (edition) {
      await fs.writeFile(path.join(staging, files.edition), edition.pdf);
      await fs.mkdir(path.join(staging, IMAGES));
      for (const { file, bytes } of edition.png)
        await fs.writeFile(path.join(staging, file), bytes);
      await fs.mkdir(path.join(staging, FIGURES));
      for (const { file, bytes } of edition.figures)
        await fs.writeFile(path.join(staging, file), bytes);
    }
    // The page was started once its views were planned, beside the plates' layout and the edition's typesetting.
    prepared.page = await prepared.pageWork;
    if (prepared.page) listener("delivering the page");
    // The page was delivered when it was prepared, in the one run of Archify that validated it: a build's page
    // holds its delivery.
    const page = prepared.page
      ? await writeDelivery(
          /** @type {import("./map/explainer.mjs").HeldDelivery} */ (prepared.page.delivered),
          staging,
        )
      : null;
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
    await fs.writeFile(path.join(staging, MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
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
