import { AsyncLocalStorage } from "node:async_hooks";
import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { childEnvironment } from "../environment.mjs";
import { refuse } from "../refusal.mjs";
import { layoutView } from "../layout/grid.mjs";
import { viewRows, wrapRows } from "../layout/rows.mjs";
import { presentation } from "../kinds.mjs";
import { DEFAULT_LOCALE, detailText, wordsOf } from "../locale.mjs";
import { verifySupply } from "../supply.mjs";

const run = promisify(execFile);

/**
 * What a run of Archify reads of the work it runs in, where that work asked (`telling`): whom to tell as it begins,
 * and the signal that stops it.
 */
const beginning = /** @type {AsyncLocalStorage<{ started: () => void, signal: AbortSignal }>} */ (
  new AsyncLocalStorage()
);

/**
 * Do `work` and tell `started` as each run of Archify inside it begins, of any kind: a candidate's measure as well
 * as a page's own run. Once `signal` aborts, a run inside it is stopped and none starts: each throws
 * `archify_stopped`, never an answer, so nothing keeps it. A build waits for the first run, then lays its plates out
 * while the runs go on, and stops a page it no longer needs.
 * @template T
 * @param {() => void} started
 * @param {AbortSignal} signal
 * @param {() => T} work
 * @returns {T}
 */
export const telling = (started, signal, work) => beginning.run({ started, signal }, work);

/** The signal that stops the work this is called in (`telling`); none outside such work. */
export const stopSignal = () => beginning.getStore()?.signal;

/** What a run of stopped work throws. */
const stoppedRun = () =>
  Object.assign(new Error("Archify was stopped: the work that asked no longer needs it."), {
    code: "archify_stopped",
  });

/**
 * The view diagrams of the interactive page: one native Archify architecture
 * document per view. Positions, sizes and connection sides come from the grid
 * layout with Archify's own text metrics; Archify routes the connections,
 * places their labels and measures every candidate's routes itself.
 */

/**
 * Widths a view diagram is laid out at. At 1440 × 900 an explainer panel draws
 * a diagram up to about 1200 px wide and enlarges it at most 1.25 times, so a
 * diagram up to 960 wide that spans its panel sets its 11-unit labels at
 * 13.75 px; beside its steps, Archify draws it no narrower than its 9-unit
 * sublabels allow, which keeps those labels at 13.29 px or more.
 */
export const DIAGRAM_WIDTHS = Object.freeze([960, 840, 720]);
/** Row limits a view's rows are wrapped at; five cards fit the widest diagram at the minimum card width. */
const ROW_LIMITS = Object.freeze([5, 4, 3]);
/** Row limits tried when no row of three lays out, as when a label needs a card of its own width. */
const NARROW_LIMITS = Object.freeze([2, 1]);
/**
 * Widths and row limits tried as well when every other candidate stands above
 * its steps: rows of two, narrow enough for Archify's reader to set beside them.
 */
const BESIDE = Object.freeze({ widths: [720, 600], limits: [2] });
/** Archify narrows a reader canvas at or above this width-to-height ratio, which would shrink its labels. */
const WIDE_RATIO = 1.54;
const MARGIN = 40;
/** Grid refusals a candidate answers by omitting the boundary, and then by giving way to another candidate. */
const LAYOUT_REFUSALS = new Set([
  "layout_boundary_unplaced",
  "layout_channel_unroutable",
  "layout_row_too_wide",
  "layout_untidy",
]);
/** Room Archify needs below the content for its legend row. */
const LEGEND_BAND = 110;
const LABEL_FONT = 11;
const SUBLABEL_FONT = 9;
const WIDTH_FACTOR = 0.6;
const TEXT_PADDING = 8;
/**
 * Card widths: a card is at least as wide as its view's longest label needs and
 * at most 200 wide, unless that label needs more; a label wider than the
 * narrowest diagram's content cannot be drawn on one line.
 */
const CARD = Object.freeze({ minWidth: 120, maxWidth: 200 });
const WIDEST_CARD = Math.min(...DIAGRAM_WIDTHS) - 2 * MARGIN;
const TYPES = Object.freeze({
  person: "external",
  external: "external",
  frontend: "frontend",
  backend: "backend",
  database: "database",
  cloud: "cloud",
  messagebus: "messagebus",
  security: "security",
});
const FULLWIDTH = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;

/** Archify's text units: one per character, two for full-width characters. */
export const textUnits = (text) =>
  Array.from(String(text)).reduce((sum, character) => sum + (FULLWIDTH.test(character) ? 2 : 1), 0);

/** Ids made valid Archify ids, unique and stable for one list. */
export function archifyIds(ids) {
  const taken = new Set();
  const out = new Map();
  for (const id of ids) {
    const base = /^[a-zA-Z]/u.test(id)
      ? id.replace(/[^a-zA-Z0-9_-]/gu, "_")
      : `n-${id.replace(/[^a-zA-Z0-9_-]/gu, "_")}`;
    let candidate = base;
    for (let suffix = 2; taken.has(candidate); suffix += 1) candidate = `${base}-${suffix}`;
    taken.add(candidate);
    out.set(id, candidate);
  }
  return out;
}

/**
 * The first of a component's details that Archify's sublabel holds whole at its
 * preferred size, or none: a card never shows a cut detail, and the page's
 * steps carry every detail in full.
 */
function sublabel(words, component, width) {
  const room = Math.floor((width - TEXT_PADDING) / (SUBLABEL_FONT * WIDTH_FACTOR));
  return component.details
    .map(([key, values]) => detailText(words, key, values))
    .find((detail) => textUnits(detail) <= room);
}

/**
 * A view's own name on its diagram and in the full viewer: its title when it
 * has one apart from the model's, otherwise the question it asks, and the
 * model's title for a view that asks the model's own question.
 */
export function viewCaption(model, view) {
  if (view.title !== model.title) return view.title;
  return view.question && view.question !== model.question ? view.question : model.title;
}

/** The card width a label needs at Archify's 11-unit size. */
const labelWidth = (label) =>
  Math.ceil(textUnits(label) * LABEL_FONT * WIDTH_FACTOR + TEXT_PADDING);

/**
 * The grid metrics of a view's diagram. Cards are at least as wide as the
 * view's longest label needs, so the grid gives up a spare column before it
 * narrows a card below its label.
 */
function diagramMetrics(model, view, bounded, width) {
  const widest = Math.max(...view.components.map(({ label }) => labelWidth(label)));
  const maxWidth = Math.max(CARD.maxWidth, widest);
  return {
    contentWidth: () => width - 2 * MARGIN,
    card: {
      minWidth: Math.min(maxWidth, Math.max(CARD.minWidth, widest)),
      maxWidth,
      height: () => 64,
    },
    label: (relation) => ({
      width: Math.max(30, textUnits(relation.label) * 4.8 + 10) + 8,
      height: 18,
      lines: [{ text: relation.label, role: /** @type {const} */ ("label") }],
    }),
    external: (component) => bounded && presentation(model, component).outside,
    spacing: {
      column: 44,
      inset: 42,
      stub: 10,
      track: 10,
      bandGap: 4,
      arrowStub: 14,
      labelGap: 12,
      labelRowGap: 6,
      portSpacing: 24,
      portMargin: 20,
      separation: 18,
      labelClear: 8,
      minJog: 40,
      clear: 10,
      // Archify sets a 14 px label box on either side of a channel's turn, with its clearance.
      minChannel: 72,
      rowPad: 12,
      boundaryPad: 30,
      boundaryBottom: 50,
      boundaryHead: 24,
    },
  };
}

/**
 * One candidate layout of a view at one width and row wrapping. The system
 * boundary can need spare columns; when its cards would be narrower than the
 * labels need or its rows cannot be wired, the candidate omits the boundary and
 * relies on Archify's external type instead. Returns the layout, or the refusal
 * that ruled the candidate out.
 */
function candidateLayout(model, view, width) {
  const name = { boundaryName: model.repository?.name ?? model.title };
  // Without an outside component there is no boundary to omit.
  const outside = view.components.some((component) => presentation(model, component).outside);
  /** @type {any} */
  let refusal = null;
  for (const bounded of outside ? [true, false] : [false]) {
    try {
      return { layout: layoutView(view, diagramMetrics(model, view, bounded, width), name) };
    } catch (error) {
      const failure = /** @type {any} */ (error);
      if (!LAYOUT_REFUSALS.has(failure.code)) throw error;
      refusal ??= failure;
    }
  }
  return { refusal };
}

/**
 * The view as one Archify document from a candidate layout. Relations between
 * neighbors in a row are straight arrows only where the grid drew one, and a
 * relation that skips rows or passes cards in its row names no sides, so
 * Archify routes it around the cards between.
 */
function diagramDocument(model, view, layout, width, quality) {
  const ids = archifyIds(view.components.map(({ id }) => id));
  const relationIds = archifyIds(view.relations.map(({ id }) => id));
  const rowOf = new Map(layout.rows.flatMap((row, index) => row.members.map((id) => [id, index])));
  const words = wordsOf(model.locale);
  const kinds = new Map();
  const components = view.components.map((component) => {
    const card = /** @type {any} */ (layout.cards.get(component.id));
    const style = presentation(model, component);
    const type = TYPES[/** @type {keyof typeof TYPES} */ (style.category)];
    kinds.set(type, [...new Set([...(kinds.get(type) ?? []), style.label])]);
    const text = sublabel(words, component, card.width);
    return {
      id: ids.get(component.id),
      type,
      label: component.label,
      ...(text ? { sublabel: text } : {}),
      pos: [Math.round(card.x + MARGIN), Math.round(card.y + MARGIN)],
      size: [card.width, card.height],
    };
  });
  const labelled = new Set();
  const straight = new Set(
    layout.arrows
      .filter(({ direction }) => direction === "left" || direction === "right")
      .flatMap(({ relations }) => relations.map(({ id }) => id)),
  );
  const rowCount = layout.rows.length;
  const passes = (row, from, to) =>
    layout.rows[row].members.some((id) => {
      const { x } = /** @type {{ x: number }} */ (layout.cards.get(id));
      return x > Math.min(from.x, to.x) && x < Math.max(from.x, to.x);
    });
  const connections = view.relations.map((relation) => {
    const [a, b] = [rowOf.get(relation.from), rowOf.get(relation.to)];
    const [from, to] = [relation.from, relation.to].map(
      (id) => /** @type {{ x: number }} */ (layout.cards.get(id)),
    );
    const sides =
      a < b
        ? ["bottom", "top"]
        : a > b
          ? ["top", "bottom"]
          : !straight.has(relation.id)
            ? a < rowCount - 1 || rowCount === 1
              ? ["bottom", "bottom"]
              : ["top", "top"]
            : from.x < to.x
              ? ["right", "left"]
              : ["left", "right"];
    // Relations that share a source, label and details carry one label, as on the poster.
    const key = JSON.stringify([relation.from, relation.label, relation.details, relation.status]);
    const label = labelled.has(key) ? null : relation.label;
    labelled.add(key);
    return {
      id: relationIds.get(relation.id),
      from: ids.get(relation.from),
      to: ids.get(relation.to),
      ...(label ? { label } : {}),
      ...(relation.status === "planned" || relation.status === "retired"
        ? { variant: "dashed" }
        : {}),
      ...(Math.abs(a - b) > 1 || (a === b && passes(a, from, to))
        ? {}
        : { fromSide: sides[0], toSide: sides[1] }),
    };
  });
  const internal = view.components.filter((component) => !presentation(model, component).outside);
  const entries = Object.fromEntries(
    [...kinds].map(([type, labels]) => [type, { label: labels.join(" / ").slice(0, 80) }]),
  );
  const natural = Math.ceil(layout.height + MARGIN + LEGEND_BAND);
  return {
    nodes: ids,
    height: natural,
    document: {
      schema_version: 1,
      diagram_type: "architecture",
      meta: {
        title: viewCaption(model, view),
        // Archify's viewer speaks English unless a diagram names its language.
        ...(model.locale && model.locale !== DEFAULT_LOCALE ? { locale: model.locale } : {}),
        output: `${archifyIds([view.id]).get(view.id)}.html`,
        quality_profile: quality,
        viewBox: [width, Math.max(natural, Math.ceil(width / WIDE_RATIO))],
        legend: { entries },
      },
      components,
      ...(layout.boundary && internal.length
        ? {
            boundaries: [
              {
                kind: "region",
                label: layout.boundary.name,
                wraps: internal.map(({ id }) => ids.get(id)),
              },
            ],
          }
        : {}),
      connections,
    },
  };
}

/**
 * Every candidate diagram of a view: each width with each row wrapping, the
 * widest first, and narrower rows when no row of three lays out. A label longer
 * than the narrowest diagram's content refuses the view; a candidate the grid
 * cannot lay out is left out, and when none remains, the first refusal is the
 * view's. Each document is checked at the build's quality. With `beside`, only
 * the rows of two narrow enough to stand beside the steps, and none when they
 * do not lay out.
 * @param {any} model
 * @param {any} view
 * @param {"showcase" | "standard"} [quality]
 * @param {{ beside?: boolean }} [options]
 */
export function diagramCandidates(model, view, quality = "showcase", { beside = false } = {}) {
  const long = view.components.filter(({ label }) => labelWidth(label) > WIDEST_CARD);
  if (long.length)
    refuse(
      "page_label_too_long",
      `View ${view.id}: some component labels are longer than the widest diagram card, ` +
        `${WIDEST_CARD} units at Archify's label size. Shorten them.`,
      long.map(({ id, label }) => ({
        code: "page_label_too_long",
        path: `/components/${id}`,
        message: label,
      })),
    );
  const component = new Map(view.components.map((item) => [item.id, item]));
  const outside = (id) => presentation(model, /** @type {any} */ (component.get(id))).outside;
  const seen = new Set();
  const out = [];
  /** @type {any} */
  let refusal = null;
  const passes = beside
    ? [[BESIDE.limits, BESIDE.widths]]
    : [
        [ROW_LIMITS, DIAGRAM_WIDTHS],
        [NARROW_LIMITS, DIAGRAM_WIDTHS],
      ];
  for (const [limits, widths] of passes) {
    for (const width of widths)
      for (const limit of limits) {
        const rows = wrapRows(viewRows(view, limit, outside), limit);
        const key = JSON.stringify([width, rows.map(({ members }) => members)]);
        if (seen.has(key)) continue;
        seen.add(key);
        const tiered = {
          ...view,
          // Diagram rows carry no labels: the panel's steps name the components instead.
          tiers: rows.map(({ id, members }) => ({ id, label: "", members })),
        };
        const made = candidateLayout(model, tiered, width);
        if (!made.layout) {
          refusal ??= made.refusal;
          continue;
        }
        const diagram = diagramDocument(model, view, made.layout, width, quality);
        out.push({ width, rows: rows.map(({ members }) => members.length), ...diagram });
      }
    if (out.length || beside) return out;
  }
  return refuse(
    "page_layout_refused",
    `View ${view.id} cannot be drawn in a diagram without overlaps at its 14 px floor. ` +
      "Group the components so that related ones share adjacent rows, or shorten the relation labels concerned.",
    refusal.problems ?? [],
  );
}

/**
 * The environment variable that names a directory in which Archify's answers
 * to candidate diagrams are kept between processes.
 */
const ANSWERS = "ARCHPUB_ARCHIFY_ANSWERS";

/**
 * Archify's answer to one candidate document: its verdict with the route
 * measures, or its layout. The vendored Archify is verified and answers one
 * document one way, so where the environment names a directory for answers, an
 * answer is read from it by the supply's digest, the Node.js and platform that
 * run Archify, the kind of answer, the quality and the document, and written to
 * it when Archify has given one. The file the document lies in is no part of
 * that, though an answer names it, which no caller reads. Only a whole answer
 * is kept or read: a refusal, a failed run and a file that is no answer are
 * asked again, so nothing that went wrong once is told twice. A directory
 * that cannot be made refuses the work, since the caller named it; an answer
 * that cannot be written there afterwards is not kept, and the work goes on
 * with the answer it has.
 * @param {string} file the file the document is written to
 * @param {any} document
 * @param {{ layout: boolean, whole: (answer: any) => boolean }} kind whether the layout is asked, and what a whole
 *   answer of that kind is
 */
export async function candidateAnswer(file, document, { layout, whole }) {
  const quality = document.meta.quality_profile;
  const args = [
    "validate",
    "architecture",
    file,
    "--json",
    "--quality",
    quality,
    ...(layout ? ["--layout-json"] : []),
  ];
  return keptAnswer(
    [layout ? "layout" : "verdict", quality, document],
    async () => (await runArchify(args)).answer,
    whole,
  );
}

/**
 * An answer of Archify's kept in the directory the environment names, by a SHA-256 of the supply's digest, the
 * Node.js and platform that run Archify, and the parts given, which hold everything else the answer depends on: read
 * when a whole one is there, else asked and, when whole, kept. Without the directory, asked.
 * @param {readonly unknown[]} parts
 * @param {() => Promise<any>} ask
 * @param {(answer: any) => boolean} whole
 */
export async function keptAnswer(parts, ask, whole) {
  const store = process.env[ANSWERS];
  if (!store) return ask();
  await holdsAnswers(store);
  const supply = await verifySupply("archify");
  const key = createHash("sha256")
    .update(
      JSON.stringify([supply.sha256, process.version, process.platform, process.arch, ...parts]),
    )
    .digest("hex");
  const kept = path.join(store, `${key}.json`);
  try {
    const known = JSON.parse(await fs.readFile(kept, "utf8"));
    if (whole(known)) return known;
  } catch {
    // Not kept yet, or no answer: Archify is asked.
  }
  const answer = await ask();
  if (!whole(answer)) return answer;
  // Written beside its place and moved there, so no reader meets half an answer. A write that fails keeps
  // nothing: a full disk, a directory removed meanwhile or a file another program holds costs a later question.
  const partial = `${kept}.${randomUUID()}.partial`;
  try {
    await fs.mkdir(store, { recursive: true });
    await fs.writeFile(partial, JSON.stringify(answer));
    await fs.rename(partial, kept);
  } catch {
    await fs.rm(partial, { force: true }).catch(() => {});
  }
  return answer;
}

/** The directories for answers this process has made, each once. */
const made = new Map();

/**
 * Make the directory the caller names for answers, once a process, or refuse: a path that cannot be a directory
 * is a mistake of the caller's and is said before Archify is asked anything.
 * @param {string} store
 */
function holdsAnswers(store) {
  if (!made.has(store))
    made.set(
      store,
      fs
        .mkdir(store, { recursive: true })
        .catch((error) =>
          refuse(
            "answers_unkept",
            `No answers can be kept in ${store}, which ${ANSWERS} names: ${/** @type {Error} */ (error).message}`,
          ),
        ),
    );
  return made.get(store);
}

/**
 * Run the vendored Archify CLI and return its JSON answer, also when it exits
 * with a refusal. The work it runs in hears when Archify's process has begun, and
 * can stop it (`telling`): a run of stopped work throws `archify_stopped`.
 *
 * A run may take `limit` milliseconds. The limit is the module's own, not the
 * child's: a build lays its plates out while its page's run goes on, and the
 * layout holds the event loop, so the limit can expire while the run's output
 * waits unread. When it expires a grace follows, on a free loop, before the run
 * is aborted: a run that ended meanwhile is read.
 * @param {string[]} args
 * @param {{ limit?: number, grace?: number }} [options]
 */
export async function runArchify(args, options = {}) {
  const supply = await verifySupply("archify");
  const { limit = 300_000, grace = 10_000 } = options;
  const within = beginning.getStore();
  const abort = new AbortController();
  /** @param {string} message */
  const failed = (message) => ({
    supply,
    answer: {
      ok: false,
      diagnostics: [{ code: "archify_failed", message: message.slice(0, 4000) }],
    },
  });
  /** @type {ReturnType<typeof setTimeout>} */
  let timer = setTimeout(() => {
    timer = setTimeout(() => abort.abort(), grace);
  }, limit);
  try {
    if (within?.signal.aborted) throw stoppedRun();
    const running = run(process.execPath, [path.join(supply.root, "bin", "archify.mjs"), ...args], {
      env: childEnvironment({ ARCHIFY_UPDATE_CHECK_DISABLED: "1" }),
      maxBuffer: 16 * 1024 * 1024,
      signal: within ? AbortSignal.any([abort.signal, within.signal]) : abort.signal,
    });
    within?.started();
    const { stdout } = await running;
    return { supply, answer: JSON.parse(stdout) };
  } catch (error) {
    const failure = /** @type {any} */ (error);
    if (within?.signal.aborted) throw failure?.code === "archify_stopped" ? failure : stoppedRun();
    try {
      return { supply, answer: JSON.parse(failure.stdout) };
    } catch {
      return failed(
        abort.signal.aborted
          ? `Archify did not answer within its limit of ${limit} ms and a grace of ${grace} ms.`
          : String(failure.message),
      );
    }
  } finally {
    clearTimeout(timer);
  }
}
