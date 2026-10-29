import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
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

/** Model text in the explainer's inline language: markup characters escaped, whitespace folded. */
const text = (value) =>
  String(value)
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/[\\`*<>[\]|]/gu, "\\$&");
const quoted = (value) => JSON.stringify(text(value));
/** Model text for an argument Archify sets as plain text, such as a source's title. */
const plain = (value) => JSON.stringify(String(value).replace(/\s+/gu, " ").trim());

/** One detail as a step reads it. */
const detailText = ([name, values]) => `${name}: ${values.join(", ")}`;

/** A text ended as a sentence, so that the parts of one scope read apart. */
const sentence = (value) => {
  const trimmed = String(value).trim();
  if (/[.!?。！？]$/u.test(trimmed)) return trimmed;
  return /\p{Script=Han}$/u.test(trimmed) ? `${trimmed}。` : `${trimmed}.`;
};

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
 * and the sources it cites, in citation order. Every id is drawn from one
 * namespace, so panels, diagrams, steps and sources never collide.
 * @param {any} model
 * @param {any[]} views
 * @param {any[]} diagrams one chosen diagram per view, in plan order
 * @param {Set<string>} [withheld] sources the page may not cite
 */
export function explainerDraft(model, views, diagrams, withheld = new Set()) {
  const raw = [
    `page-${model.id}`,
    ...views.flatMap((view) => [
      `view-${view.id}`,
      `diagram-${view.id}`,
      `steps-${view.id}`,
      ...view.components.map(({ id }) => `step-${view.id}-${id}`),
    ]),
    ...model.sources.map(({ id }) => `source-${id}`),
  ];
  const ids = archifyIds(raw);
  const id = (key) => /** @type {string} */ (ids.get(key));
  // A source is pinned to the revision only when the model names the repository it lies in.
  const repository = model.repository?.url && model.repository?.revision ? model.repository : null;
  // A view that asks the model's own question, as an overview often does, is
  // titled with its title, so that the panel does not repeat the page heading.
  const heading = (view) => (view.question === model.question ? view.title : view.question);
  /** @type {string[]} */
  const cited = [];
  // A source is listed under the name of the first component that cites it;
  // its path follows from the repository position.
  const names = new Map();
  const sourceOf = (component) => {
    const [first] = repository
      ? (component.sources ?? []).filter((source) => !withheld.has(source))
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
    const details = text(component.details.map(detailText).join("; "));
    const source = sourceOf(component);
    if (!source) return details;
    const link = `source:${id(`source-${source}`)}`;
    if (details) return `${details}[](${link})`;
    const { path: file } = model.sources.find((entry) => entry.id === source);
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
  const scope = [
    model.scope,
    ...model.limits,
    model.attribution ? `Model by ${model.attribution}` : null,
  ]
    .filter(Boolean)
    .map(sentence)
    .join(" ");
  const sources = cited.map((sourceId) => {
    const source = model.sources.find((entry) => entry.id === sourceId);
    return `@source ${id(`source-${sourceId}`)} title=${plain(names.get(sourceId))} path=${JSON.stringify(source.path)}`;
  });
  // Beside the conclusion, a page of several views lists the questions its
  // panels answer, numbered as the panels are, each a way into its panel.
  const contents =
    views.length > 1
      ? [...views.map((view) => `- [${text(heading(view))}](block:${id(`view-${view.id}`)})`), ""]
      : [];
  const draft = [
    `# ${text(model.question)} {#${id(`page-${model.id}`)}}`,
    "",
    text(model.summary ?? `${model.title} in ${views.length} views.`),
    "",
    ...contents,
    ...(scope ? [`@answer scope=${quoted(scope)}`] : []),
    `@meta locale=en${
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

/** The file a diagram's document is written to beside the draft. */
const diagramFile = (diagramId) => `${diagramId}.architecture.json`;

/** Write a page's draft and diagrams into a directory, as Archify reads them. */
async function writePage(page, directory) {
  const draft = path.join(directory, DRAFT);
  await fs.writeFile(draft, page.draft);
  for (const { file, document } of page.diagrams)
    await fs.writeFile(path.join(directory, file), `${JSON.stringify(document, null, 2)}\n`);
  return draft;
}

/**
 * Choose every view's diagram on Archify's own routes, write the page's draft
 * and validate it with Archify. Archify will not cite a source in a sensitive
 * file class, such as a file under a `secrets` directory, on a page; such a
 * source is withheld from the page and stays in the manifest, and a component
 * that cites it cites its next source. Any other refusal is the page's.
 * @param {any} model
 * @param {any[]} views
 */
export async function explainerPage(model, views) {
  const diagrams = [];
  for (const view of views) diagrams.push(await chooseDiagram(model, view));
  const withheld = new Set();
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-page-"));
  try {
    for (;;) {
      const { draft, files, cited } = explainerDraft(model, views, diagrams, withheld);
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
        "showcase",
        "--writing",
        "off",
      ]);
      if (answer.ok === true) return { ...page, withheld: [...withheld].sort() };
      // Each pass withholds at least one more source or refuses, so the loop ends.
      const sensitive = sensitiveSources(answer, cited).filter((source) => !withheld.has(source));
      if (!sensitive.length) refusePage(answer);
      for (const source of sensitive) withheld.add(source);
    }
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

/**
 * The sources a page cites that Archify will not cite, named by its findings
 * through their position among the cited sources. A finding past the cited
 * sources names none.
 * @param {any} answer Archify's validation answer
 * @param {string[]} cited the page's cited source ids, in citation order
 */
export function sensitiveSources(answer, cited) {
  return (answer.diagnostics ?? []).flatMap(({ code, subject }) => {
    const index = /^\/sources\/(\d+)\//u.exec(subject?.path ?? "")?.[1];
    const source = index === undefined ? undefined : cited[Number(index)];
    return code === "explainer/secret-path" && source !== undefined ? [source] : [];
  });
}

/** Refuse a page with Archify's diagnostics. */
function refusePage(answer) {
  refuse(
    "page_refused",
    `Archify did not deliver the page: ${JSON.stringify(answer.diagnostics ?? answer.error ?? answer).slice(0, 4000)}`,
  );
}

/**
 * Deliver the page through the vendored Archify CLI: validated, written and
 * checked at showcase quality, with Archify's own writing checks off because
 * the prose is the model's. Its sources and Archify's receipts stay out of the
 * delivery.
 * @param {{ draft: string, diagrams: Array<{ file: string, document: any }> }} page
 * @param {string} directory a staging directory that receives `index.html`
 */
export async function deliverExplainer(page, directory) {
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
      "showcase",
      "--writing",
      "off",
      "--out-dir",
      work,
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
