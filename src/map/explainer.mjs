import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SPACE } from "../breaks.mjs";
import { DEFAULT_LOCALE, detailText, sentences, wordsOf } from "../locale.mjs";
import { refuse } from "../refusal.mjs";
import { archifyIds, keptAnswer, runArchify, viewCaption } from "./archify.mjs";
import { chooseDiagram } from "./choice.mjs";

/**
 * The interactive page: one native Archify explainer that answers the model's
 * question view by view. Each view is a panel with its native diagram, which
 * opens Archify's full viewer, and steps that light each component. Digests and
 * verification records stay in the manifest.
 */

/**
 * The page's sources are kept in a directory of this fixed name inside the
 * delivery while Archify builds the page, which records where they lay
 * relative to it; a fixed name keeps that record, and so the page, the same in
 * every build. The directory is removed once the page is written.
 */
const WORK = "explainer";
const DRAFT = "page.archify.md";
/** The most reasons an Archify explainer's conclusion holds: its schema's `/answer/reasons` maxItems. */
const MAXIMUM_REASONS = 4;

/** Spaces between words, folded into one; no-break spaces keep their words together on the page too. */
const SPACES = new RegExp(`${SPACE.source}+`, "gu");
/** Model text in the explainer's inline language: markup characters escaped, spaces folded. */
const text = (value) =>
  String(value)
    .replace(SPACES, " ")
    .trim()
    .replace(/[\\`*<>[\]|]/gu, "\\$&");
const quoted = (value) => JSON.stringify(text(value));
/** Model text for an argument Archify sets as plain text, such as a source's title. */
const plain = (value) => JSON.stringify(String(value).replace(SPACES, " ").trim());

/**
 * A view's components in its diagram's reading order, row by row from the top
 * and left to right, so that stepping through a panel walks its diagram.
 */
function readingOrder(view, diagram) {
  const at = new Map(diagram.document.components.map(({ id, pos }) => [id, pos]));
  const position = (component) => at.get(diagram.nodes.get(component.id));
  return [...view.components].sort((a, b) => {
    const [ax, ay] = position(a);
    const [bx, by] = position(b);
    return ay - by || ax - bx;
  });
}

/**
 * The draft of a page, the file each view's diagram is written to beside it
 * and the files it cites, in citation order. Every panel, diagram and step id
 * is drawn from one namespace, and the cited files are numbered `source-1`
 * onward, so none collide.
 * @param {any} model
 * @param {any[]} views
 * @param {any[]} diagrams one chosen diagram per view, in plan order
 * @param {Set<string>} [withheld] files the page may not cite
 * @param {(id: string) => readonly string[]} [owned] each component's files in citation order, as the layer of
 *   measured facts holds them; without one, as the model names them
 */
export function explainerDraft(
  model,
  views,
  diagrams,
  withheld = new Set(),
  owned = claimedFiles(model),
) {
  const words = wordsOf(model.locale);
  const raw = [
    `page-${model.id}`,
    ...views.flatMap((view) => [
      `view-${view.id}`,
      `diagram-${view.id}`,
      `steps-${view.id}`,
      ...view.components.map(({ id }) => `step-${view.id}-${id}`),
    ]),
  ];
  const ids = archifyIds(raw);
  const id = (key) => /** @type {string} */ (ids.get(key));
  // A file is pinned to the revision only when the model names the repository it lies in.
  const repository = model.repository?.url && model.repository?.revision ? model.repository : null;
  // A view that asks the model's own question, as an overview often does, is
  // titled with its title, so that the panel does not repeat the page heading.
  const heading = (view) => (view.question === model.question ? view.title : view.question);
  /** @type {string[]} */
  const cited = [];
  // A file is listed under the name of the component that owns it and cited
  // as its source number; a group of the overview owns none.
  const names = new Map();
  const sourceId = (file) => `source-${cited.indexOf(file) + 1}`;
  const sourceOf = (component) => {
    const [first] = repository ? owned(component.id).filter((file) => !withheld.has(file)) : [];
    if (first && !cited.includes(first)) {
      cited.push(first);
      names.set(first, component.label);
    }
    return first;
  };
  // A step carries every detail of its component, the card at most one. A
  // component without details names the file it is cited from instead, so its
  // step never shows a citation mark alone.
  const stepText = (component) => {
    const details = text(
      component.details
        .map(([name, values]) => detailText(words, name, values))
        .join(words.semicolon),
    );
    const file = sourceOf(component);
    if (!file) return details;
    const link = `source:${sourceId(file)}`;
    if (details) return `${details}[](${link})`;
    return `[${text(file)}](${link})`;
  };
  const panels = views.map((view, index) => {
    const diagram = diagrams[index];
    const steps = readingOrder(view, diagram).map(
      (component) =>
        `| ${id(`step-${view.id}-${component.id}`)} | ${text(component.label)} | ${stepText(
          component,
        )} | ${id(`diagram-${view.id}`)} | ${diagram.nodes.get(component.id)} |`,
    );
    return [
      `## ${text(heading(view))} {#${id(`view-${view.id}`)}}`,
      "",
      `@diagram architecture id=${id(`diagram-${view.id}`)} source=${diagramFile(id(`diagram-${view.id}`))} title=${quoted(viewCaption(model, view))}`,
      "",
      `@steps id=${id(`steps-${view.id}`)}`,
      ...steps,
    ].join("\n");
  });
  const scope = sentences(
    words,
    [
      model.scope,
      ...model.limits,
      model.editors.length ? words.editors(model.editors.map(({ name }) => name)) : null,
    ]
      .filter(Boolean)
      .map(String),
  );
  const sources = cited.map(
    (file) =>
      `@source ${sourceId(file)} title=${plain(names.get(file))} path=${JSON.stringify(file)}`,
  );
  // Beside the conclusion, a page of several views lists the questions its
  // panels answer, numbered as the panels are, each a way into its panel. The
  // list is the conclusion's reasons, which Archify caps, so a page of more
  // views lists none and its numbered panels follow on their own.
  const contents =
    views.length > 1 && views.length <= MAXIMUM_REASONS
      ? [...views.map((view) => `- [${text(heading(view))}](block:${id(`view-${view.id}`)})`), ""]
      : [];
  const draft = [
    `# ${text(model.question)} {#${id(`page-${model.id}`)}}`,
    "",
    text(model.summary ?? words.overview(model.title, views.length)),
    "",
    ...contents,
    ...(scope ? [`@answer scope=${quoted(scope)}`] : []),
    `@meta locale=${model.locale ?? DEFAULT_LOCALE}${
      repository
        ? ` repo_url=${JSON.stringify(repository.url)} repo_revision=${repository.revision}`
        : ""
    }`,
    ...sources,
    "",
    panels.join("\n\n"),
    "",
  ].join("\n");
  return { draft, files: views.map((view) => diagramFile(id(`diagram-${view.id}`))), cited };
}

/**
 * Each component's files as the model names them, without a checkout: the claims of one file,
 * since a claimed directory holds files only the revision lists.
 * @param {any} model
 */
const claimedFiles = (model) => {
  const claims = new Map(
    model.components.map(({ id, files }) => [id, files.filter((claim) => !claim.endsWith("/"))]),
  );
  return (id) => claims.get(id) ?? [];
};

/** The file a diagram's document is written to beside the draft. */
const diagramFile = (diagramId) => `${diagramId}.architecture.json`;

/**
 * Write a page into a directory, as Archify reads it: a guide's draft and the files it names, or
 * the generated draft and its diagrams. Returns the draft's path.
 * @param {any} page
 * @param {string} directory
 */
export async function writePage(page, directory) {
  if (page.kind === "guide") {
    for (const { name, bytes } of page.drawn ?? page.entries)
      await fs.writeFile(path.join(directory, name), bytes);
    return path.join(directory, page.entries[0].name);
  }
  const draft = path.join(directory, DRAFT);
  await fs.writeFile(draft, page.draft);
  for (const { file, document } of page.diagrams)
    await fs.writeFile(path.join(directory, file), `${JSON.stringify(document, null, 2)}\n`);
  return draft;
}

/**
 * Choose every view's diagram on Archify's own routes, write the page's draft
 * and validate it with Archify at the build's quality. Archify will not cite a
 * file in a sensitive class, such as a file under a `secrets` directory, on a
 * page; such a file is withheld from the page and stays in the manifest, and
 * the component that owns it cites its next file. Any other refusal is the
 * page's.
 *
 * With `deliver`, the page's file name in a delivery, as a build prepares its
 * page, Archify is asked once: it validates the page, writes it and checks what
 * it wrote, and the page holds that delivery for the build to write. Only a page
 * Archify refuses is then validated on its own, which names every finding where
 * a delivery names eight.
 * @param {any} model
 * @param {any[]} views
 * @param {{ quality?: "showcase" | "standard", owned?: (id: string) => readonly string[], deliver?: string }}
 *   [options] `owned` gives each component's files in citation order, as the layer of measured facts holds them
 */
export async function explainerPage(model, views, options = {}) {
  const quality = options.quality ?? "showcase";
  const diagrams = [];
  for (const view of views) diagrams.push(await chooseDiagram(model, view, quality));
  const withheld = new Set();
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-page-"));
  try {
    for (;;) {
      const { draft, files, cited } = explainerDraft(
        model,
        views,
        diagrams,
        withheld,
        options.owned,
      );
      const page = {
        kind: /** @type {const} */ ("generated"),
        draft,
        diagrams: diagrams.map((diagram, index) => ({ ...diagram, file: files[index] })),
        quality,
        withheld: [...withheld].sort(),
        delivered: /** @type {HeldDelivery | null} */ (null),
      };
      const held = options.deliver ? await holdDelivery(page, options.deliver) : null;
      if (held?.delivered) return { ...page, delivered: held.delivered };
      const { answer } = await runArchify([
        "validate",
        "explainer",
        await writePage(page, directory),
        "--json",
        "--quality",
        quality,
        "--writing",
        "off",
      ]);
      if (answer.ok === true) {
        // The page validates and its delivery was refused: the refusal is the delivery's.
        if (held) throw held.refusal;
        return page;
      }
      // Each pass withholds at least one more file or refuses, so the loop ends.
      const sensitive = sensitiveSources(answer, cited).filter((source) => !withheld.has(source));
      if (!sensitive.length) refusePage(answer);
      for (const source of sensitive) withheld.add(source);
    }
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

/**
 * A page's delivery as Archify wrote it: the file's name and bytes, the supply's digest and Archify's receipt.
 * @typedef {{ file: string, bytes: Buffer, supplySha256: string, receipt: any }} HeldDelivery
 */

/**
 * Deliver a page into a directory of its own and hold what Archify wrote, so that
 * one run of Archify validates the page and delivers it. Returns the held
 * delivery, the file's bytes with the supply's digest and Archify's receipt,
 * or the refusal when Archify refuses the page.
 * @param {any} page
 * @param {string} file the page's file name, `<model id>.html`
 * @param {{ repoRoot?: string | null }} [options]
 */
export async function holdDelivery(page, file, options = {}) {
  // A generated page delivered without a checkout depends on nothing but itself, this module and the supply: it is
  // kept as a candidate's answer is, its bytes as Base64. A refusal is never kept.
  if (page.kind === "generated" && !options.repoRoot) {
    const held = await keptAnswer(
      await pageParts(page, file),
      async () => {
        const one = await holdOnce(page, file, options);
        return one.delivered
          ? { ...one.delivered, bytes: one.delivered.bytes.toString("base64") }
          : one;
      },
      (answer) => typeof answer?.bytes === "string" && typeof answer?.supplySha256 === "string",
    );
    return typeof held?.bytes === "string"
      ? { delivered: { ...held, bytes: Buffer.from(held.bytes, "base64") } }
      : held;
  }
  return holdOnce(page, file, options);
}

/** The digest of this module's source, read once a process; a read that failed is tried again by the next page. */
let ownDigest = /** @type {Promise<string> | undefined} */ (undefined);

/**
 * What a kept page's delivery answers, beside the supply, Node.js and the platform its key adds: this module's own
 * source, which forms the publisher's verdict on the page, the receipt a delivery keeps and Archify's fixed
 * arguments, and the page's file, draft, diagrams, quality and writing level.
 * @param {any} page
 * @param {string} file
 */
export async function pageParts(page, file) {
  ownDigest ??= fs.readFile(new URL(import.meta.url)).then(
    (bytes) => createHash("sha256").update(bytes).digest("hex"),
    (error) => {
      ownDigest = undefined;
      throw error;
    },
  );
  return [
    await ownDigest,
    "page",
    file,
    page.draft,
    page.diagrams,
    page.quality,
    page.writing ?? null,
  ];
}

/**
 * One run of Archify that delivers the page and holds what it wrote, or the refusal.
 * @param {any} page
 * @param {string} file
 * @param {{ repoRoot?: string | null }} options
 */
async function holdOnce(page, file, options) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-page-held-"));
  try {
    const { output, supplySha256, receipt } = await deliverExplainer(
      page,
      directory,
      file,
      options,
    );
    // Archify writes a new file with the mode a new file gets, and so does the build that writes it again.
    const bytes = await fs.readFile(output);
    return { delivered: /** @type {HeldDelivery} */ ({ file, bytes, supplySha256, receipt }) };
  } catch (error) {
    if (/** @type {any} */ (error)?.code !== "page_refused") throw error;
    return { refusal: error };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

/**
 * Write the delivery a page holds into a staging directory, as Archify wrote
 * it: the same bytes under the same name.
 * @param {HeldDelivery} delivered
 * @param {string} directory a staging directory that receives the page
 */
export async function writeDelivery(delivered, directory) {
  const output = path.join(directory, delivered.file);
  await fs.writeFile(output, delivered.bytes);
  return { output, supplySha256: delivered.supplySha256, receipt: delivered.receipt };
}

/**
 * The files a page cites that Archify will not cite, named by its findings
 * through their position among the page's sources. A finding past the cited
 * files names none.
 * @param {any} answer Archify's validation answer
 * @param {string[]} cited the page's cited files, in citation order
 */
export function sensitiveSources(answer, cited) {
  return (answer.diagnostics ?? []).flatMap(({ code, subject }) => {
    const index = /^\/sources\/(\d+)\//u.exec(subject?.path ?? "")?.[1];
    const source = index === undefined ? undefined : cited[Number(index)];
    return code === "explainer/secret-path" && source !== undefined ? [source] : [];
  });
}

/** Refuse a page with Archify's diagnostics. */
export function refusePage(answer) {
  refuse(
    "page_refused",
    `Archify did not deliver the page: ${JSON.stringify(answer.diagnostics ?? answer.error ?? answer).slice(0, 4000)}`,
  );
}

/**
 * Deliver the page through the vendored Archify CLI: validated, written and
 * checked at the page's quality and writing level. The generated page keeps
 * Archify's writing checks off because its prose is the model's; a guide names
 * its own level and, with a checkout, the repository root its sources are
 * verified against. Its sources and Archify's receipts stay out of the
 * delivery.
 * @param {any} page
 * @param {string} directory a staging directory that receives the page
 * @param {string} file the page's file name, `<model id>.html`
 * @param {{ repoRoot?: string | null }} [options]
 */
export async function deliverExplainer(page, directory, file, options = {}) {
  // Archify records where the draft lay relative to the page after resolving
  // symbolic links, so a directory reached through one, such as macOS's /tmp,
  // would record a path up and out of it; resolving them first keeps the record
  // `explainer/page.archify.md`.
  const root = await fs.realpath(directory);
  const work = path.join(root, WORK);
  await fs.mkdir(work);
  const draft = await writePage(page, work);
  const output = path.join(root, file);
  // Archify writes its receipt beside the page, named for it.
  const receipt = output.replace(/\.html$/u, ".delivery.json");
  try {
    const { supply, answer } = await runArchify([
      "finalize",
      "explainer",
      draft,
      output,
      "--json",
      "--quality",
      page.quality ?? "showcase",
      "--writing",
      page.writing ?? "off",
      "--out-dir",
      work,
      ...(options.repoRoot ? ["--repo-root", options.repoRoot] : []),
    ]);
    if (answer.ok !== true || answer.status !== "pass") refusePage(answer);
    return {
      output: path.join(directory, file),
      supplySha256: supply.sha256,
      receipt: { quality: answer.quality, gates: answer.gates },
    };
  } finally {
    // The draft, its diagrams and Archify's receipts (with a random id and staging paths) stay out of the delivery.
    await fs.rm(work, { recursive: true, force: true });
    await fs.rm(receipt, { force: true });
  }
}
