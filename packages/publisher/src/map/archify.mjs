import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { refuse } from "../refusal.mjs";
import { layoutView } from "../layout/grid.mjs";
import { viewRows, wrapRows } from "../layout/rows.mjs";
import { presentation } from "../kinds.mjs";
import { verifySupply } from "../supply.mjs";

const run = promisify(execFile);

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
const CARD = Object.freeze({ minWidth: 120, maxWidth: 200 });
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
function sublabel(component, width) {
  const room = Math.floor((width - TEXT_PADDING) / (SUBLABEL_FONT * WIDTH_FACTOR));
  return component.details
    .map(([key, values]) => `${key}: ${values.join(", ")}`)
    .find((detail) => textUnits(detail) <= room);
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
  return {
    contentWidth: () => width - 2 * MARGIN,
    card: {
      minWidth: Math.min(CARD.maxWidth, Math.max(CARD.minWidth, widest)),
      maxWidth: CARD.maxWidth,
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
function diagramDocument(model, view, layout, width) {
  const ids = archifyIds(view.components.map(({ id }) => id));
  const relationIds = archifyIds(view.relations.map(({ id }) => id));
  const rowOf = new Map(layout.rows.flatMap((row, index) => row.members.map((id) => [id, index])));
  const kinds = new Map();
  const components = view.components.map((component) => {
    const card = /** @type {any} */ (layout.cards.get(component.id));
    const style = presentation(model, component);
    const type = TYPES[/** @type {keyof typeof TYPES} */ (style.category)];
    kinds.set(type, [...new Set([...(kinds.get(type) ?? []), style.label])]);
    const text = sublabel(component, card.width);
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
        title: view.title,
        output: `${archifyIds([view.id]).get(view.id)}.html`,
        quality_profile: "showcase",
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
 * widest first. A label longer than the widest card refuses the view; a
 * candidate the grid cannot lay out is left out, and when none remains, the
 * first refusal is the view's.
 */
export function diagramCandidates(model, view) {
  const long = view.components.filter(({ label }) => labelWidth(label) > CARD.maxWidth);
  if (long.length)
    refuse(
      "map_label_too_long",
      `View ${view.id}: some component labels are longer than the widest diagram card, ` +
        `${CARD.maxWidth} units at Archify's label size. Shorten them.`,
      long.map(({ id, label }) => ({
        code: "map_label_too_long",
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
  for (const width of DIAGRAM_WIDTHS)
    for (const limit of ROW_LIMITS) {
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
      const diagram = diagramDocument(model, view, made.layout, width);
      out.push({ width, rows: rows.map(({ members }) => members.length), ...diagram });
    }
  if (out.length) return out;
  return refuse(
    "map_layout_refused",
    `View ${view.id} cannot be drawn in a diagram without overlaps at its 14 px floor. ` +
      "Group the components so that related ones share adjacent rows, or shorten the relation labels concerned.",
    refusal.problems ?? [],
  );
}

/**
 * Run the vendored Archify CLI and return its JSON answer, also when it exits
 * with a refusal.
 * @param {string[]} args
 */
export async function runArchify(args) {
  const supply = await verifySupply("archify");
  try {
    const { stdout } = await run(
      process.execPath,
      [path.join(supply.root, "bin", "archify.mjs"), ...args],
      {
        env: { ...process.env, ARCHIFY_UPDATE_CHECK_DISABLED: "1" },
        maxBuffer: 16 * 1024 * 1024,
        timeout: 300_000,
      },
    );
    return { supply, answer: JSON.parse(stdout) };
  } catch (error) {
    const failure = /** @type {any} */ (error);
    try {
      return { supply, answer: JSON.parse(failure.stdout) };
    } catch {
      return {
        supply,
        answer: {
          ok: false,
          diagnostics: [
            { code: "archify_failed", message: String(failure.message).slice(0, 4000) },
          ],
        },
      };
    }
  }
}
