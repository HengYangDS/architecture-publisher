import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SPACE } from "../breaks.mjs";
import { DEFAULT_LOCALE, detailText, sentences, wordsOf } from "../locale.mjs";
import { refuse } from "../refusal.mjs";
import { archifyIds, runArchify, viewCaption } from "./archify.mjs";
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
const PAGE = "index.html";
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
 * @param {Map<string, string[]>} [owned] each component's files in citation order
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
    const [first] = repository
      ? (owned.get(component.id) ?? []).filter((file) => !withheld.has(file))
      : [];
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
const claimedFiles = (model) =>
  new Map(
    model.components.map(({ id, files }) => [id, files.filter((claim) => !claim.endsWith("/"))]),
  );

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
    for (const { name, bytes } of page.entries)
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
 * @param {any} model
 * @param {any[]} views
 * @param {{ quality?: "showcase" | "standard", owned?: Map<string, string[]> }} [options]
 *   `owned` holds each component's files in citation order, as binding resolved them
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
        draft,
        diagrams: diagrams.map((diagram, index) => ({ ...diagram, file: files[index] })),
      };
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
      if (answer.ok === true)
        return {
          kind: /** @type {const} */ ("generated"),
          ...page,
          quality,
          withheld: [...withheld].sort(),
        };
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
 * @param {string} directory a staging directory that receives `index.html`
 * @param {{ repoRoot?: string | null }} [options]
 */
export async function deliverExplainer(page, directory, options = {}) {
  // Archify records where the draft lay relative to the page after resolving
  // symbolic links, so a directory reached through one, such as macOS's /tmp,
  // would record a path up and out of it; resolving them first keeps the record
  // `explainer/page.archify.md`.
  const root = await fs.realpath(directory);
  const work = path.join(root, WORK);
  await fs.mkdir(work);
  const draft = await writePage(page, work);
  const output = path.join(root, PAGE);
  const receipt = path.join(root, "index.delivery.json");
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
      output: path.join(directory, PAGE),
      supplySha256: supply.sha256,
      receipt: { quality: answer.quality, gates: answer.gates },
    };
  } finally {
    // The draft, its diagrams and Archify's receipts (with a random id and staging paths) stay out of the delivery.
    await fs.rm(work, { recursive: true, force: true });
    await fs.rm(receipt, { force: true });
  }
}
