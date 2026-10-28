import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { loadIcons } from "./icons.mjs";
import { deliverExplainer, explainerPage } from "./map/explainer.mjs";
import { loadModel } from "./model/load.mjs";
import { planViews } from "./plan/views.mjs";
import { admitsView, composePosters } from "./poster/compose.mjs";
import { rasterize } from "./poster/raster.mjs";
import { loadTypefaces, requireGlyphs } from "./poster/text.mjs";
import { POSTER } from "./poster/tokens.mjs";
import { refuse } from "./refusal.mjs";
import { bindSources } from "./sources/bind.mjs";
import { verifySupply } from "./supply.mjs";

export const DELIVERY_FORMAT = "architecture-publisher.delivery";
const DELIVERY_VERSION = 3;
/** The poster's own width and a large print width; the first is the default PNG. */
const PNG_WIDTHS = Object.freeze([POSTER.width, 6000]);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

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
 * Validate, bind, plan and compose without writing anything.
 * @param {string} modelPath
 * @param {{ repo?: string | null }} [options]
 */
async function prepare(modelPath, options = {}) {
  const [icons, typefaces] = await Promise.all([loadIcons(), loadTypefaces()]);
  const loaded = await loadModel(modelPath, { icon: icons.has });
  const { model } = loaded;
  requireGlyphs(typefaces, drawnTexts(model));
  const binding = bindSources(model, options.repo ?? null);
  const views = await planViews(model, async (view) =>
    admitsView(model, view, typefaces, icons),
  );
  // Pages are composed for the edition as a whole: a sparse view shares a page
  // with its neighbour, so a poster is a page, not a view.
  const posters = composePosters(model, views, typefaces, icons);
  const page = await explainerPage(model, views);
  return { loaded, model, binding, views, posters, page, icons, typefaces };
}

function viewSummary(view, posters) {
  const page = posters.findIndex((poster) => poster.views.includes(view.id));
  return {
    id: view.id,
    title: view.title,
    question: view.question,
    origin: view.origin,
    tiers: view.tiers?.map(({ id }) => id) ?? null,
    components: view.components.map(({ id }) => id),
    relations: view.relations.map(({ id }) => id),
    poster: page >= 0 ? posters[page].view : null,
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
    candidates: diagram.candidates,
    metrics: diagram.metrics,
  };
}

/**
 * The evidence behind every component and relation, which the delivery keeps
 * out of its drawings: details, statuses and the sources each one cites.
 * @param {any} model
 */
function evidenceOf(model) {
  const element = (item) => ({
    id: item.id,
    label: item.label,
    ...(item.status ? { status: item.status } : {}),
    details: Object.fromEntries(item.details),
    sources: item.sources,
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

/** One page's composition and the measures it passed, for the manifest. */
function posterSummary(poster) {
  return {
    id: poster.view,
    views: poster.views,
    composition: poster.composition,
    measures: poster.measures,
  };
}

/**
 * Check a model end to end without writing: validation, sources, plan, layout and admission.
 * @param {string} modelPath
 * @param {{ repo?: string | null }} [options]
 */
export async function checkModel(modelPath, options = {}) {
  const prepared = await prepare(modelPath, options);
  return {
    model: { id: prepared.model.id, sha256: prepared.loaded.sha256 },
    sources: { state: prepared.binding.state, count: prepared.binding.records.length },
    views: prepared.views.map((view) => viewSummary(view, prepared.posters)),
    posters: prepared.posters.map(posterSummary),
    diagrams: prepared.page.diagrams.map(diagramSummary),
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
 * @param {{ repo?: string | null }} [options]
 */
export async function buildDelivery(modelPath, out, options = {}) {
  const target = path.resolve(out);
  if (await exists(target))
    refuse("delivery_exists", `The output ${target} already exists; choose a new directory.`);
  const prepared = await prepare(modelPath, options);
  const parent = path.dirname(target);
  await fs.mkdir(parent, { recursive: true });
  const staging = await fs.mkdtemp(path.join(parent, `.${path.basename(target)}.partial-`));
  try {
    for (const poster of prepared.posters) {
      await fs.writeFile(path.join(staging, `${poster.view}.svg`), poster.svg);
      for (const width of PNG_WIDTHS) {
        const name = width === POSTER.width ? `${poster.view}.png` : `${poster.view}-${width}.png`;
        await fs.writeFile(
          path.join(staging, name),
          await rasterize(poster.svg, width, poster.height, poster.width),
        );
      }
    }
    const page = await deliverExplainer(prepared.page, staging);
    const [fonts, resvg] = await Promise.all([verifySupply("fonts"), verifySupply("resvg")]);
    const manifest = {
      format: DELIVERY_FORMAT,
      version: DELIVERY_VERSION,
      publisher: { name: "architecture-publisher", version: await publisherVersion() },
      model: {
        id: prepared.model.id,
        title: prepared.model.title,
        sha256: prepared.loaded.sha256,
        bytes: prepared.loaded.bytes,
      },
      repository: prepared.model.repository,
      sources: { state: prepared.binding.state, records: prepared.binding.records },
      supplies: {
        fonts: fonts.sha256,
        icons: prepared.icons.supplySha256,
        resvg: resvg.sha256,
        archify: page.supplySha256,
      },
      views: prepared.views.map((view) => viewSummary(view, prepared.posters)),
      posters: prepared.posters.map(posterSummary),
      page: {
        quality: page.receipt.quality,
        gates: page.receipt.gates,
        diagrams: prepared.page.diagrams.map(diagramSummary),
        withheld: prepared.page.withheld,
      },
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
      views: manifest.views.map(({ id }) => id),
      artifacts: manifest.artifacts.length,
    };
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
}
