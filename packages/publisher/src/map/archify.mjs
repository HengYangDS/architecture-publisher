import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { refuse } from "../refusal.mjs";
import { layoutView } from "../layout/grid.mjs";
import { presentation } from "../kinds.mjs";
import { verifySupply } from "../supply.mjs";

const run = promisify(execFile);

/**
 * The interactive map: one native Archify architecture document of the whole
 * model. Positions, sizes and connection sides come from the grid layout with
 * Archify's own text metrics; Archify routes the connections and places their
 * labels itself.
 */

/** Natural width of the map; Archify's reader renders its 11-unit labels at 14.8 CSS px at 1440 × 900. */
export const MAP_WIDTH = 1000;
/** Archify narrows canvases at or above this width-to-height ratio, which would shrink the labels. */
const WIDE_RATIO = 1.54;
const MARGIN = 40;
/** Room Archify needs below the content for its legend row. */
const LEGEND_BAND = 110;
const LABEL_FONT = 11;
const SUBLABEL_FONT = 9;
const WIDTH_FACTOR = 0.6;
const TEXT_PADDING = 8;
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
const FULLWIDTH = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;

/** Archify's text units: one per character, two for full-width characters. */
export const textUnits = (text) =>
  Array.from(String(text)).reduce((sum, character) => sum + (FULLWIDTH.test(character) ? 2 : 1), 0);

/** Model ids made valid Archify ids, unique and stable for one model. */
function archifyIds(ids) {
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

/** A first detail short enough for Archify's sublabel at its preferred size. */
function sublabel(component, width) {
  const [first] = component.details;
  if (!first) return undefined;
  const room = Math.floor((width - TEXT_PADDING) / (SUBLABEL_FONT * WIDTH_FACTOR));
  const full = `${first[0]}: ${first[1].join(", ")}`;
  if (textUnits(full) <= room) return full;
  const words = full.split(" ");
  while (words.length > 1 && textUnits(`${words.join(" ")} …`) > room) words.pop();
  let text = words.join(" ").replace(/[,:]$/u, "");
  while (textUnits(`${text} …`) > room) text = Array.from(text).slice(0, -1).join("");
  return `${text} …`;
}

/** The whole model as one view: groups become rows when they cover every component. */
function mapView(model) {
  const grouped = new Set(model.groups.flatMap(({ members }) => members));
  const tiers =
    model.groups.length && model.components.every(({ id }) => grouped.has(id))
      ? model.groups.map(({ id, label, members }) => ({ id, label, members }))
      : null;
  return {
    id: "map",
    title: model.title,
    question: model.question,
    summary: model.summary,
    origin: /** @type {const} */ ("complete"),
    tiers,
    components: model.components,
    relations: model.relations,
  };
}

function mapMetrics(model, bounded) {
  return {
    contentWidth: () => MAP_WIDTH - 2 * MARGIN,
    card: { minWidth: 120, maxWidth: 200, height: () => 64 },
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
      minJog: 40,
      clear: 10,
      minChannel: 56,
      rowPad: 12,
      boundaryPad: 30,
      boundaryBottom: 50,
      boundaryHead: 24,
    },
  };
}

function evidenceCards(model, binding) {
  const detail = (details) =>
    details.map(([name, values]) => `${name}: ${values.join(", ")}`).join("; ");
  const status = (item) => (item.status ? ` [${item.status}]` : "");
  const sources = new Map(binding.records.map((record) => [record.id, record]));
  const cited = (ids) =>
    ids.length ? ` Sources: ${ids.map((id) => sources.get(id)?.path ?? id).join(", ")}.` : "";
  const describe = (record) => {
    const digest = record.sha256 ?? record.declaredSha256;
    return `${record.id}: ${record.path}${digest ? ` sha256 ${digest}` : ""} (${record.state})`;
  };
  return [
    { dot: "cyan", title: "Question", items: [model.question, model.summary].filter(Boolean) },
    {
      dot: "slate",
      title: "Scope, limits and attribution",
      items: [
        model.scope,
        ...model.limits,
        model.attribution ? `Model by ${model.attribution}.` : null,
      ].filter(Boolean),
    },
    {
      dot: "emerald",
      title: "Components",
      items: model.components.map(
        (c) =>
          `${c.label} (${c.id})${status(c)}${c.details.length ? `: ${detail(c.details)}.` : "."}${cited(c.sources)}`,
      ),
    },
    {
      dot: "violet",
      title: "Relations",
      items: model.relations.map(
        (r) =>
          `${r.id}: ${r.from} ${r.label} ${r.to}${status(r)}${r.details.length ? `; ${detail(r.details)}` : ""}.${cited(r.sources)}`,
      ),
    },
    ...(binding.records.length
      ? [
          {
            dot: /** @type {const} */ ("amber"),
            title: "Sources",
            items: binding.records.map(describe),
          },
        ]
      : []),
  ];
}

/**
 * Build the Archify document for a model and its planned views.
 * @param {any} model
 * @param {import("../plan/views.mjs").View[]} views
 * @param {{ state: string, records: any[], origin?: boolean }} binding
 */
export function mapDocument(model, views, binding) {
  const view = mapView(model);
  const name = { boundaryName: model.repository?.name ?? model.title };
  const fits = (candidate) =>
    model.components.every(
      ({ label }) =>
        textUnits(label) * LABEL_FONT * WIDTH_FACTOR <= candidate.card.width - TEXT_PADDING,
    );
  // The system boundary can need spare columns; when its narrower cards cannot hold every label at
  // 14 px, the map omits the boundary and relies on Archify's external type instead.
  let layout = layoutView(view, mapMetrics(model, true), name);
  if (!fits(layout)) layout = layoutView(view, mapMetrics(model, false), name);
  const width = layout.card.width;
  const tooLong = model.components.filter(
    ({ label }) => textUnits(label) * LABEL_FONT * WIDTH_FACTOR > width - TEXT_PADDING,
  );
  if (tooLong.length)
    refuse(
      "map_label_too_long",
      `Some component labels do not fit a ${width}-unit map card at 14 px. Shorten them or reduce the widest row.`,
      tooLong.map(({ id, label }) => ({
        code: "map_label_too_long",
        path: `/components/${id}`,
        message: label,
      })),
    );
  const ids = archifyIds(model.components.map(({ id }) => id));
  const relationIds = archifyIds(model.relations.map(({ id }) => id));
  const rowOf = new Map(layout.rows.flatMap((row, index) => row.members.map((id) => [id, index])));
  const kinds = new Map();
  const components = model.components.map((component) => {
    const card = /** @type {any} */ (layout.cards.get(component.id));
    const style = presentation(model, component);
    const type = TYPES[/** @type {keyof typeof TYPES} */ (style.category)];
    kinds.set(type, [...new Set([...(kinds.get(type) ?? []), style.label])]);
    const text = sublabel(component, width);
    const references = binding.origin
      ? component.sources
          .slice(0, 3)
          .map((id) => ({ path: model.sources.find((source) => source.id === id).path }))
      : [];
    return {
      id: ids.get(component.id),
      type,
      label: component.label,
      ...(text ? { sublabel: text } : {}),
      tag: style.label,
      ...(references.length ? { sources: references } : {}),
      pos: [Math.round(card.x + MARGIN), Math.round(card.y + MARGIN)],
      size: [width, layout.card.height],
    };
  });
  const labelled = new Set();
  const connections = model.relations.map((relation) => {
    const [a, b] = [rowOf.get(relation.from), rowOf.get(relation.to)];
    const [from, to] = [relation.from, relation.to].map(
      (id) => /** @type {{ x: number }} */ (layout.cards.get(id)),
    );
    const sides =
      a < b
        ? ["bottom", "top"]
        : a > b
          ? ["top", "bottom"]
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
      fromSide: sides[0],
      toSide: sides[1],
    };
  });
  const internal = model.components.filter((component) => !presentation(model, component).outside);
  const entries = Object.fromEntries(
    [...kinds].map(([type, labels]) => [type, { label: labels.join(" / ").slice(0, 80) }]),
  );
  return {
    schema_version: 1,
    diagram_type: "architecture",
    meta: {
      title: model.title,
      output: "index.html",
      quality_profile: "showcase",
      viewBox: [
        MAP_WIDTH,
        Math.max(
          Math.ceil(layout.height + MARGIN + LEGEND_BAND),
          Math.ceil(MAP_WIDTH / WIDE_RATIO),
        ),
      ],
      legend: { entries },
      ...(binding.origin && model.repository
        ? {
            repository: {
              url: model.repository.url,
              revision: model.repository.revision,
              link_mode: "local-only",
            },
          }
        : {}),
      views: views
        .map((planned) => ({
          id: archifyIds([planned.id]).get(planned.id),
          label: (planned.title === model.title ? planned.question : planned.title).slice(0, 48),
          focus: planned.components
            .filter((component) => ids.has(component.id))
            .map((component) => ids.get(component.id)),
          note: planned.question.slice(0, 140),
        }))
        .filter((planned) => planned.focus.length),
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
    cards: evidenceCards(model, binding),
  };
}

/**
 * Deliver the document through the vendored Archify CLI at showcase quality.
 * Any error, warning or failed check refuses the build.
 * @param {any} document
 * @param {string} directory a staging directory that receives `map.json` and `index.html`
 */
export async function deliverMap(document, directory) {
  const supply = await verifySupply("archify");
  const input = path.join(directory, "map.json");
  const output = path.join(directory, "index.html");
  await fs.writeFile(input, `${JSON.stringify(document, null, 2)}\n`);
  let receipt;
  try {
    const { stdout } = await run(
      process.execPath,
      [
        path.join(supply.root, "bin", "archify.mjs"),
        "deliver",
        "architecture",
        input,
        output,
        "--quality",
        "showcase",
        "--json",
      ],
      {
        env: { ...process.env, ARCHIFY_UPDATE_CHECK_DISABLED: "1" },
        maxBuffer: 16 * 1024 * 1024,
        timeout: 300_000,
      },
    );
    receipt = JSON.parse(stdout);
  } catch (error) {
    const failure = /** @type {any} */ (error);
    let detail = String(failure.stdout ?? "").slice(0, 4000) || String(failure.message);
    try {
      const parsed = JSON.parse(failure.stdout);
      detail = JSON.stringify(parsed.diagnostics ?? parsed.validation ?? parsed).slice(0, 4000);
    } catch {
      // The raw output is the diagnostic.
    }
    refuse("map_refused", `Archify did not deliver the map: ${detail}`);
  }
  const validation = receipt.validation ?? {};
  if (
    !receipt.ok ||
    validation.errors ||
    validation.warnings ||
    validation.compositionStatus !== "pass"
  )
    refuse(
      "map_refused",
      `Archify reported ${validation.errors ?? "?"} errors and ${validation.warnings ?? "?"} warnings.`,
    );
  // The specification and Archify's receipt (with its random id and staging paths) stay out of the delivery.
  await fs.rm(input);
  await fs.rm(path.join(directory, "index.delivery.json"), { force: true });
  return {
    output,
    supplySha256: supply.sha256,
    receipt: {
      checks: validation.checkCount,
      profile: validation.compositionProfile,
      artifact: receipt.artifact,
    },
  };
}
