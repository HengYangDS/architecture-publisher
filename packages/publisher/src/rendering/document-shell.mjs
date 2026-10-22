import { canonical } from "../protocol/json.mjs";
import { interactiveAppearance } from "../scene/appearance.mjs";
import {
  interactiveAppearanceControls,
  interactiveAppearanceCss,
  interactiveAppearanceScript,
} from "../../renderers/reader/appearance.mjs";
import { escapeHtml, scriptJson } from "./document-input.mjs";
import { interactiveReader } from "./document-reader.mjs";
import { inspectFieldList, inspectIdentity } from "./reader-values.mjs";
import { sourceReadingController } from "./reader-source.mjs";
import { bindInspectableGraphics } from "./reader-graphics.mjs";

export function shell(input, data) {
  const appearance = interactiveAppearance(input.appearance);
  const nativeReader = Object.values(data.pages).every(
    (page) => page.nativeReader === "archify/v1",
  );
  const attributed = input.schema === "architecture.interactive-html-composition/v2";
  const framing = attributed ? `<p class="editorial-framing">${escapeHtml(input.framing)}</p>` : "";
  const framingStyle = attributed
    ? ".editorial-framing { grid-column: 1 / -1; margin: -.2rem 0 0; color: var(--muted); font-size: .68rem; line-height: 1.4; overflow-wrap: anywhere; }"
    : "";
  const contentPolicy = [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    "font-src data:",
    "img-src data: blob:",
    "media-src data: blob:",
    "connect-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "worker-src blob:",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
  const navigation = input.pages
    .map(
      (page) =>
        `<button type="button" data-interactive-page="${escapeHtml(page.id)}">${escapeHtml(page.shortLabel)}</button>`,
    )
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en" data-style="${appearance.style}" data-theme="${appearance.theme}"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${contentPolicy}"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>${escapeHtml(input.title)} — Interactive architecture</title><style>
${interactiveAppearanceCss()}
:root { color-scheme: light; --paper: #f3f0e8; --panel: #faf8f2; --ink: #26362f; --muted: #58675e; --rule: #c8c7bb; --accent: #456a59; }
* { box-sizing: border-box; }
html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: var(--paper); color: var(--ink); font-family: system-ui, -apple-system, sans-serif; }
body { display: grid; grid-template-rows: auto minmax(0, 1fr); }
header { display: grid; grid-template-columns: minmax(13rem, 1fr) minmax(0, 4fr) auto; align-items: center; gap: 1rem; padding: .72rem 1rem; border-bottom: 1px solid var(--rule); background: color-mix(in srgb, var(--panel) 94%, transparent); }
.identity { min-width: 0; }
.identity strong { display: block; font: 600 clamp(.82rem, 1.2vw, 1rem)/1.25 system-ui, sans-serif; letter-spacing: .01em; }
.identity small, #interactive-page-label { color: var(--muted); font-size: .68rem; }${framingStyle}
.chapters { display: flex; min-width: 0; gap: .34rem; overflow-x: auto; scrollbar-width: thin; padding: .1rem; }
.chapters button, #interactive-inspect, #interactive-inspect-back, #interactive-inspect-index button { border: 1px solid transparent; background: transparent; color: var(--muted); font: 600 .74rem/1.3 system-ui, sans-serif; cursor: pointer; }
.chapters button { white-space: nowrap; padding: .42rem .58rem; border-radius: .35rem; }
.chapters button:hover, .chapters button[aria-current="page"] { border-color: var(--rule); background: var(--panel); color: var(--ink); }
.actions { display: flex; align-items: center; gap: .8rem; }
#interactive-inspect, #interactive-inspect-back { padding: .5rem .75rem; border-color: var(--rule); border-radius: .35rem; color: var(--accent); background: var(--panel); }
button:focus-visible, input:focus-visible, summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
main { position: relative; min-height: 0; }
iframe { display: block; width: 100%; height: 100%; border: 0; background: var(--paper); }
main[data-reading="inspect"] > #interactive-frame { visibility: hidden; pointer-events: none; }
#interactive-error { margin: 2rem; padding: 1rem; border-left: 3px solid #8b443c; background: var(--panel); }
[hidden] { display: none !important; }
#interactive-inspector { position: absolute; inset: 0; z-index: 2; overflow: hidden; padding: clamp(1.25rem, 2.7vw, 2.6rem); background: var(--paper); }
.inspect-shell { display: grid; grid-template-rows: auto minmax(0, 1fr); height: 100%; max-width: 1320px; margin: 0 auto; }
.inspect-head { display: flex; align-items: center; justify-content: space-between; gap: 2rem; padding-bottom: .85rem; border-bottom: 1px solid var(--rule); }
.inspect-head > div { display: flex; align-items: baseline; gap: .75rem; min-width: 0; }
.inspect-head p { margin: 0; color: var(--muted); font-size: .78rem; line-height: 1.5; }
#interactive-inspect-title { margin: 0; align-self: center; font: 600 clamp(1.05rem, 1.5vw, 1.35rem)/1.3 system-ui, sans-serif; letter-spacing: -.01em; overflow-wrap: anywhere; }
.inspect-head .inspect-eyebrow { color: var(--reader-ink); font: 600 .68rem/1.2 system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
#interactive-inspect-back { white-space: nowrap; }
.inspect-layout { display: grid; grid-template-columns: minmax(18rem, 22rem) minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); gap: 1rem 2rem; min-height: 0; padding-top: 1rem; }
.inspect-navigation, .inspect-reading { min-width: 0; min-height: 0; }
.inspect-navigation, .inspect-reading { display: grid; grid-row: 1 / -1; grid-template-rows: subgrid; }
.inspect-navigation { grid-column: 1; }
.inspect-reading { grid-column: 2; }
.inspect-controls { display: grid; grid-template-rows: auto minmax(2.5rem, auto); align-content: start; gap: .5rem; }
.inspect-controls label, .inspect-section-label { display: block; margin: 0; color: var(--muted); font-size: .75rem; font-weight: 600; line-height: 1.4; }
.inspect-reading-scroll { min-width: 0; min-height: 0; overflow: auto; scrollbar-gutter: stable; padding: .15rem; }
.inspect-source-diagram { margin: .9rem 0 1.2rem; border-top: 1px solid var(--rule); padding-top: .75rem; }
.inspect-source-diagram summary { cursor: pointer; color: var(--ink); font-size: .8rem; font-weight: 600; }
.inspect-source-diagram [data-source-reader-root] { height: clamp(24rem, 48vh, 34rem); width: 100%; min-width: 0; margin-top: .65rem; border: 1px solid var(--rule); border-radius: .4rem; overflow: hidden; }
#interactive-inspect-search { display: block; width: 100%; min-height: 2.5rem; margin: 0; padding: .5rem .75rem; border: 1px solid var(--rule); border-radius: .35rem; background: var(--panel); color: var(--ink); font: .82rem/1.35 system-ui, sans-serif; }
#interactive-inspect-search::placeholder { color: var(--muted); opacity: 1; }
#interactive-inspect-index { display: grid; grid-auto-rows: max-content; align-content: start; min-height: 0; gap: 0; overflow: auto; scrollbar-gutter: stable; scroll-padding-block: .15rem; padding: .15rem; }
#interactive-inspect-index button { display: grid; align-content: center; gap: .2rem; width: 100%; min-height: 3.5rem; padding: .65rem .9rem; border: 0; border-bottom: 1px solid var(--rule); border-radius: 0; text-align: left; background: transparent; }
#interactive-inspect-index button:hover { background: var(--panel); color: var(--ink); }
#interactive-inspect-index button[aria-current="true"] { background: var(--reader-soft); color: var(--ink); box-shadow: inset 3px 0 0 var(--accent); }
#interactive-inspect-index button:focus-visible { outline-offset: -2px; }
#interactive-inspect-index strong { color: var(--ink); font-size: .82rem; font-weight: 600; line-height: 1.4; }
#interactive-inspect-index small { color: inherit; font-size: .68rem; line-height: 1.4; }
#interactive-inspect-empty { margin: 0; padding: .75rem .9rem; color: var(--muted); font-size: .82rem; line-height: 1.4; }
#interactive-inspect-description { max-width: 72ch; margin: 0 0 .85rem; padding: .1rem 0 .7rem; border-bottom: 1px solid var(--rule); }
#interactive-inspect-description h2 { margin: 0 0 .4rem; color: var(--muted); font-size: .75rem; font-weight: 600; line-height: 1.4; }
#interactive-inspect-description p { margin: 0; color: var(--ink); white-space: break-spaces; overflow-wrap: anywhere; font-size: .86rem; line-height: 1.5; }
#interactive-inspect-description p + p { margin-top: .3rem; }
#interactive-inspect-content { display: grid; grid-template-columns: 9rem fit-content(12rem) minmax(0, 1fr); align-content: start; gap: .55rem; }
#interactive-inspect-content > section { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; gap: 0; min-width: 0; }
#interactive-inspect-content > section > h2 { grid-column: 1 / -1; }
#interactive-inspect-content > section > details { grid-column: 1 / -1; border: 0; border-bottom: 1px solid var(--rule); border-radius: 0; background: transparent; }
#interactive-inspect-content > section > details[open] { display: grid; grid-template-columns: subgrid; }
#interactive-inspect-content > section > details::details-content { display: grid; grid-template-columns: subgrid; grid-column: 1 / -1; }
#interactive-inspect-content > section > details > summary { grid-column: 1 / -1; padding: .8rem 0; }
#interactive-inspect-content > section > details[open] > summary { border-bottom: 0; }
#interactive-inspect-content > section > details > dl { grid-column: 1 / -1; grid-template-columns: subgrid; padding: .2rem 0 .85rem; }
#interactive-inspect-content > section > details > .inspect-source-diagram { grid-column: 1 / -1; }
#interactive-inspect-content h2 { margin: .7rem 0 0; color: var(--muted); font-size: .82rem; font-weight: 600; line-height: 1.4; }
.inspect-intro { margin: 0 0 .65rem; max-width: 72ch; color: var(--muted); font-size: .78rem; line-height: 1.45; }
#interactive-inspect-content details, #interactive-inspect-basis details { min-width: 0; border: 1px solid var(--rule); border-radius: .4rem; background: var(--panel); }
#interactive-inspect-content summary, #interactive-inspect-basis summary { padding: .75rem .9rem; color: var(--ink); font-size: .82rem; font-weight: 600; line-height: 1.4; cursor: pointer; }
#interactive-inspect-content details[open] > summary, #interactive-inspect-basis details[open] > summary { border-bottom: 1px solid var(--rule); }
#interactive-inspect-content dl, #interactive-inspect-basis dl { display: grid; gap: .5rem 1rem; margin: 0; padding: .85rem .9rem 1rem; }
#interactive-inspect-content dl { grid-template-columns: 9rem fit-content(12rem) minmax(0, 1fr); }
#interactive-inspect-basis dl { grid-template-columns: 9rem minmax(0, 1fr); }
#interactive-inspect-content dt, #interactive-inspect-basis dt { color: var(--muted); font-size: .72rem; line-height: 1.45; }
#interactive-inspect-content dt { min-width: 0; overflow-wrap: anywhere; }
#interactive-inspect-content dd, #interactive-inspect-basis dd { min-width: 0; margin: 0; overflow-wrap: anywhere; white-space: break-spaces; font-size: .78rem; line-height: 1.45; }
#interactive-inspect-content dd { grid-column: 2 / -1; }
#interactive-inspect-content .inspect-structured-value { display: grid; grid-template-columns: subgrid; column-gap: .75rem; align-content: start; }
#interactive-inspect-content .inspect-structured-disclosure { grid-column: 1 / -1; display: block; border: 0; border-radius: 0; background: transparent; }
#interactive-inspect-content .inspect-structured-disclosure[open] { display: grid; grid-template-columns: subgrid; }
#interactive-inspect-content .inspect-structured-disclosure::details-content { display: grid; grid-template-columns: subgrid; grid-column: 1 / -1; }
#interactive-inspect-content .inspect-structured-disclosure > summary { grid-column: 1 / -1; padding: 0; font-size: .78rem; font-weight: 400; border-bottom: 0; }
#interactive-inspect-content .inspect-structured-disclosure > summary .inspect-container-kind { display: inline; margin: 0; font: inherit; color: inherit; }
#interactive-inspect-content .inspect-value-container { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; min-width: 0; }
#interactive-inspect-content dl.inspect-value-tree { grid-column: 1 / -1; grid-template-columns: subgrid; gap: .35rem .75rem; padding: .1rem 0; }
#interactive-inspect-content .inspect-value-tree > dd.inspect-structured-value { grid-column: 1 / -1; grid-template-columns: subgrid; margin-inline-start: .5rem; }
#interactive-inspect-content .inspect-container-key { grid-column: 1 / -1; }
#interactive-inspect-content .inspect-structured-value > code { grid-column: 1 / -1; }
#interactive-inspect-content .inspect-container-kind { display: block; grid-column: 1 / -1; margin-bottom: .3rem; color: var(--muted); font-size: .7rem; line-height: 1.4; }
#interactive-inspect-content .inspect-original-value { grid-column: 1 / -1; margin-top: .55rem; }
#interactive-inspect-content .inspect-original-value summary { padding: .45rem .6rem; font-size: .7rem; }
#interactive-inspect-content .inspect-original-value pre { margin: 0; padding: .6rem; white-space: break-spaces; overflow-wrap: anywhere; font-size: .7rem; line-height: 1.5; }
#interactive-inspect-basis { margin: 1.25rem 0 0; }
#interactive-inspect-basis > details { border: 0; border-top: 1px solid var(--rule); border-radius: 0; background: transparent; }
#interactive-inspect-basis > details > summary { padding: .8rem 0; }
#interactive-inspect-basis > details[open] > summary { border-bottom: 0; }
#interactive-inspect-basis p { margin: 0; padding: .75rem .9rem 0; color: var(--muted); font-size: .76rem; line-height: 1.5; }
#interactive-inspect-basis dl + dl { border-top: 1px solid var(--rule); }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; animation: none !important; transition: none !important; } }
</style></head><body><header><div class="identity"><strong>${escapeHtml(input.title)}</strong><small id="interactive-page-label"></small></div><nav class="chapters" aria-label="Interactive chapters">${navigation}</nav><div class="actions">${nativeReader ? "" : interactiveAppearanceControls(appearance)}<button id="interactive-inspect" type="button" aria-expanded="false" aria-controls="interactive-inspector">Inspect</button></div>${framing}</header><main id="interactive-main"><p id="interactive-error" hidden></p><iframe id="interactive-frame" title="${escapeHtml(input.title)} interactive architecture" sandbox="allow-scripts allow-downloads"></iframe><section id="interactive-inspector" hidden aria-labelledby="interactive-inspect-title"><div class="inspect-shell"><div class="inspect-head"><div><p class="inspect-eyebrow">Inspect</p><p id="interactive-inspect-context"></p></div><button id="interactive-inspect-back" type="button">Back to diagram</button></div><div class="inspect-layout"><div class="inspect-navigation"><div class="inspect-controls"><label for="interactive-inspect-search">Find a component or relationship</label><input id="interactive-inspect-search" type="search" placeholder="Search this diagram" aria-controls="interactive-inspect-index" autocomplete="off"></div><nav id="interactive-inspect-index" aria-label="Diagram subjects"><p id="interactive-inspect-empty" hidden>No matching subject.</p></nav></div><div class="inspect-reading"><div class="inspect-controls"><p class="inspect-section-label">Selected object</p><h1 id="interactive-inspect-title">Inspect this diagram</h1></div><div class="inspect-reading-scroll"><section id="interactive-inspect-description" aria-label="Diagram text" hidden></section><p id="interactive-inspect-intro" class="inspect-intro"></p><div id="interactive-inspect-content"></div><div id="interactive-inspect-basis"></div></div></div></div></div></section></main><noscript>This interactive architecture requires JavaScript for navigation and inspection; source files are not embedded.</noscript><script id="architecture-interactive-data" type="application/json">${scriptJson(data)}</script><script>${interactiveAppearanceScript()}</script><script>(${interactiveReader.toString()})(${canonical.toString()}, (${inspectFieldList.toString()})(${canonical.toString()}), ${inspectIdentity.toString()}, ${sourceReadingController.toString()}, ${bindInspectableGraphics.toString()}, ${scriptJson.toString()});</script></body></html>\n`;
}
