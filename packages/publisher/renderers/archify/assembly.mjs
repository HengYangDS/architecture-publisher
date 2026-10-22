import fs from "node:fs/promises";
import { fail } from "../../src/protocol/values.mjs";
import { applyTemplate, renderCards } from "./supply/renderers/shared/utils.mjs";
import { registerLocale } from "./supply/renderers/shared/i18n.mjs";
import { architectureReaderTranslations } from "./semantics.mjs";
import { applyArchitectureTypeLabels } from "./legend.mjs";
import { renderArchitectureSvg } from "./assembly-svg.mjs";

function appearance(scene, fonts, icons, options) {
  const faces = fonts.fonts
    .map(
      ({ bytes, weight, family = "JetBrains Mono" }) =>
        `@font-face{font-family:${JSON.stringify(family).replaceAll("<", "\\3c ")};font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/ttf;base64,${bytes.toString("base64")}) format('truetype')}`,
    )
    .join("");
  const notices = [fonts.license, ...(fonts.distributions ?? [])]
    .filter(Boolean)
    .map(({ bytes }) => bytes.toString("utf8").replaceAll("*/", "* /").replaceAll("<", "\\3c "))
    .join("\n");
  const glyphs = [
    ...new Map(
      scene.nodes
        .filter((node) => !node.primitives && !node.adornment && icons.icons[node.icon])
        .map((node) => [node.figureKind, node.icon]),
    ),
  ];
  const typeStyles = glyphs
    .map(([kind, icon]) => {
      const artwork = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons.icons[icon].artwork}</svg>`,
      ).toString("base64");
      const selector = JSON.stringify(kind).replaceAll("<", "\\3c ");
      const finder = scene.nodes
        .filter((node) => node.figureKind === kind && node.icon === icon)
        .map(
          ({ id }) =>
            `.node-finder-result[data-node-id=${JSON.stringify(id).replaceAll("<", "\\3c ")}] small::before`,
        );
      return (
        [
          `.semantic-lens-kind[data-kind=${selector}]::before`,
          `html:has(svg [data-focus-selected][data-node-kind=${selector}]) #focus-kind::before`,
          ...finder,
        ].join(",") +
        `{content:"";display:inline-block;width:16px;height:16px;flex:none;background:currentColor;mask:url(data:image/svg+xml;base64,${artwork}) center/contain no-repeat}`
      );
    })
    .join("\n");
  // Native scale and chrome budgets remain authoritative. A resolved
  // automatic overview has no unmeasured outer canvas to reserve at that cap.
  const contentFrame =
    options.physical && options.readingContext === "overview"
      ? 'html[data-reader-area="true"] .diagram-container{min-height:0;width:fit-content;max-width:100%;margin-inline:auto}html[data-reader-area="true"] .diagram-container>svg{width:var(--archify-diagram-max-width);height:auto}'
      : "";
  return {
    fonts: `<style id="archify-fonts">/* ${notices} */\n${faces}\nsvg text{font-synthesis:none;white-space:pre;text-rendering:geometricPrecision}[data-note-card-id]{align-self:start}.card:has([data-note-item-id]) .card-header{margin-bottom:1rem}.card [data-note-item-id]{font-size:14px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}</style>`,
    svg: `<style>svg text.t-muted{fill:color-mix(in srgb,var(--text-muted) 75%,var(--text) 25%)}svg [data-intrinsic-relation-label] text{fill:var(--text)}svg path.a-default{stroke:var(--text-muted)}svg .semantic-sigil{color:var(--text-muted)}.header-row::before,.header-row::after,.diagram-container::before,.diagram-container::after{content:none!important}[data-legend-count-badge],.semantic-lens-kind>em,.semantic-lens-swatch{display:none!important}.semantic-lens-kind,.node-finder-result small{display:flex;align-items:center;gap:8px}#focus-kind{display:flex;align-items:center;gap:8px}.c-frontend,.c-backend,.c-database,.c-cloud,.c-security,.c-messagebus,.c-external{fill:var(--mask);stroke:var(--panel-border)}${typeStyles}${contentFrame}</style>`,
  };
}

/** Original reader assembly uses only SVG, cards, locale data and CSS slots. */
export async function assembleArchitecturePage(scene, options) {
  const presentation = options.interaction === "presentation";
  const occurrence = options.interaction === "occurrence";
  const graph = options.exploration ?? { nodes: [], relations: [], limits: [] };
  if (
    (!presentation && !occurrence && graph.limits.length) ||
    (occurrence && graph.relations.length)
  )
    fail("render_native_exploration_unsupported");
  const template = await fs.readFile(
    new URL("./supply/assets/template.html", import.meta.url),
    "utf8",
  );
  const locale = graph.limits.length ? "en-x-pub-figures" : "en-x-pub-graph";
  registerLocale(locale, await architectureReaderTranslations(graph));
  const painted = await renderArchitectureSvg(
    scene,
    occurrence ? { ...options, interaction: "native" } : options,
  );
  const style = appearance(scene, options.fonts, options.icons, options);
  const svg = painted.svg.replace("</svg>", `${style.svg}</svg>`);
  let cards = renderCards(
    (scene.notes ?? []).map(({ title, items }) => ({
      dot: "slate",
      title,
      items: items.map(({ text }) => text),
    })),
  );
  let cardIndex = -1,
    itemIndex = 0;
  cards = cards.replace(/<div class="card">|<li>([\s\S]*?)<\/li>/gu, (tag, content) => {
    if (tag.startsWith("<div")) {
      itemIndex = 0;
      const card = scene.notes[++cardIndex];
      return `<div class="card" data-note-card-id="${card.id}">`;
    }
    const item = scene.notes[cardIndex].items[itemIndex++];
    return item.semanticIds.length && !presentation
      ? `<li><span id="${item.id}" data-note-item-id="${item.id}" data-note-id="${item.id}" data-inspect-id="${item.id}" data-inspect-label="${item.id}" role="button" tabindex="0">${content}</span></li>`
      : `<li data-note-item-id="${item.id}">${content}</li>`;
  });
  const fontGroup = /<style id="archify-fonts">[\s\S]*?<\/style>/gu;
  if ([...template.matchAll(fontGroup)].length !== 1) fail("render_typography_seam_invalid");
  const html = applyTemplate(
    template.replace(fontGroup, () => style.fonts),
    {
      title: scene.title,
      subtitle: scene.subtitle,
      svg,
      cards: graph.limits.length
        ? `<p class="publication-query-limit">This figure preserves source occurrences. Its painted connections are not a source relationship graph. Explore the selected source relationships in Inspect; exact declarations remain unchanged.</p>${cards}`
        : cards,
      locale,
      visualPreset: "editorial",
    },
  );
  if (presentation)
    return {
      bytes: Buffer.from(
        html
          .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
          .replace("<html ", '<html data-embed="true" ')
          .replace("<head>", '<head>\n<meta name="publication-reader" content="presentation/v1">'),
      ),
      supplies: painted.supplies,
    };
  const bytes = applyArchitectureTypeLabels(
    Buffer.from(
      html.replace(
        "<head>",
        '<head>\n<meta name="publication-reader" content="archify/v1">' +
          (occurrence ? '\n<meta name="publication-source-reading" content="required">' : ""),
      ),
    ),
    scene,
  );
  return { bytes, supplies: painted.supplies };
}
