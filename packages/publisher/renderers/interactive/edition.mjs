import { loadBundledFonts } from '../fonts/index.mjs';
import { createBundledTextMeasurer } from '../resvg/measurement.mjs';
import { fail } from '../../src/protocol/values.mjs';
import { editorialFraming } from '../../src/scene/framing.mjs';
import { factorCommonClaimContext } from '../../src/scene/claim-card.mjs';
import {
  SOURCE_REPORTED_TOPOLOGY_NOTE,
  UNLINKED_RELATION_NOTE,
} from '../../src/scene/claim-relations.mjs';
import { layoutInteractivePages } from '../elk/layout.mjs';
import { interactiveLabelRequests } from '../elk/text.mjs';
import { projectInteractivePage } from './model.mjs';
import { loadInteractiveSupply } from './supply.mjs';
import { renderFigureTypeLegend, renderGraphSvg } from './graph-svg.mjs';
import { viewerScript } from './viewport.mjs';
import { interactiveGraphMarks as marks } from '../../src/scene/marks.mjs';
import { responsibilityCss, responsibilityPageHtml } from './responsibility.mjs';
import { claimWorkCss, claimWorkHtml } from './claim-work.mjs';
import { interactiveAppearance } from '../../src/scene/appearance.mjs';
import { loadFigureIconSupply, validateResolvedFigureIcons } from '../icons/index.mjs';
import {
  interactiveAppearanceControls,
  interactiveAppearanceCss,
  interactiveAppearanceScript,
} from '../reader/appearance.mjs';

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const scriptJson = (value) =>
  JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');

function evidenceSection(title, content, kind) {
  return content
    ? `<section class="evidence-section evidence-${kind}"><h3>${escape(title)}</h3>${content}</section>`
    : '';
}

function graphHeight(layout) {
  return Math.max(220, Math.ceil(layout.bounds.height + marks.graphInset * 2));
}

function repeatedKind(label, kind) {
  if (!kind) return false;
  const normalized = (value) => value.replace(/\s+/gu, ' ').trim().toLowerCase();
  const name = normalized(label);
  const suffix = normalized(kind);
  return name === suffix || name.endsWith(` ${suffix}`);
}

function pageHtml(page, index, methodLimits, icons) {
  if (page.form) return responsibilityPageHtml(page, index, methodLimits, icons);
  const nodes = new Map(page.nodes.map((node) => [node.id, node.label]));
  const mixed = Boolean(page.nodes.length && page.claims?.length);
  const relationOnly =
    page.claims !== undefined && page.claims.length === 0 && page.relations.length > 0;
  const linkedOrdinals = new Set((page.claims ?? []).map(({ relationOrdinal }) => relationOrdinal));
  const unlinkedRelation =
    page.claims !== undefined && page.relations.some((_, index) => !linkedOrdinals.has(index + 1));
  const questionItems = page.questions
    .map(
      (question) =>
        `<li><p>${escape(question.text)}</p>${question.limits.length ? `<ul class="limits">${question.limits.map((limit) => `<li>${escape(limit)}</li>`).join('')}</ul>` : ''}</li>`,
    )
    .join('');
  const nodeById = new Map(page.nodes.map((node, at) => [node.id, { node, at }]));
  const nodeItem = ({ node, at }) => {
    const ordinal = String(at + 1).padStart(2, '0');
    const kind = repeatedKind(node.label, node.kind) ? null : node.kind;
    const name = [ordinal, node.label, kind].filter(Boolean).join(' ');
    return `<li><button type="button" data-focus-node="${node.id}" aria-label="${escape(name)}" aria-pressed="false"><span class="ordinal">${ordinal}</span><span>${escape(node.label)}</span>${kind ? `<small>${escape(kind)}</small>` : ''}</button></li>`;
  };
  const nodeItems = page.groups?.length
    ? page.groups
        .map(
          (group) =>
            `<li class="node-group"><h4>${escape(group.label)}</h4><ul>${group.nodeIds.map((id) => nodeItem(nodeById.get(id))).join('')}</ul></li>`,
        )
        .join('')
    : page.nodes.map((node, at) => nodeItem({ node, at })).join('');
  const relationItems = page.relations
    .map((relation, at) => {
      const arrow = relation.direction === 'bidirectional' ? '↔' : '→';
      const words = `${nodes.get(relation.source)} ${arrow} ${nodes.get(relation.target)}${relation.label ? ` · ${relation.label}` : ''}`;
      const sourceQualifiers = relation.sourceQualifiers?.length
        ? `<dl class="relation-qualifiers">${relation.sourceQualifiers.map(({ name, value }) => `<dt>${escape(name || '""')}</dt><dd>${escape(value)}</dd>`).join('')}</dl>`
        : '';
      const ordinal = mixed ? String(at + 1).padStart(2, '0') : null;
      const name = ordinal ? `${ordinal} ${words}` : words;
      return `<li><button type="button" data-focus-relation="${relation.id}" aria-label="${escape(name)}" aria-pressed="false">${ordinal ? `<span class="ordinal">${ordinal}</span>` : ''}${escape(words)}</button>${sourceQualifiers}</li>`;
    })
    .join('');
  const qualifierNote = page.relations.some((relation) => relation.sourceQualifiers?.length)
    ? '<p class="relation-qualifier-note">Source-reported relation qualifiers · unverified</p>'
    : '';
  const editorial = page.editorialAssertions
    .map(
      ({ statement, proponent }) =>
        `<li><p>${escape(statement)}</p><small>Editorial judgment · ${escape(proponent)} · unverified</small></li>`,
    )
    .join('');
  const editorialStage = `<div class="empty-graph"><p class="eyebrow">Evidence boundary</p>${page.editorialAssertions.map(({ statement, proponent }) => `<div class="editorial-card"><blockquote>${escape(statement)}</blockquote><p>Editorial judgment · ${escape(proponent)} · unverified</p></div>`).join('')}</div>`;
  const { common, commonLabels } = factorCommonClaimContext(page.claims ?? []);
  const commonContext = common.length
    ? `<div class="claim-context"><p class="eyebrow">COMMON TO ALL SELECTED CLAIMS</p><dl>${common.map(({ label, value }) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl></div>`
    : '';
  const claimStage = `${commonContext}<div class="claim-stage">${(page.claims ?? [])
    .map(
      ({ graphicId, facts, relationOrdinal, sourceAnchor }) =>
        `<article class="claim-card" ${page.nodes.length ? 'data-inspect-graphic' : 'data-graphic-id'}="${graphicId}">${relationOrdinal ? `<p class="claim-link">ON SOURCE RELATION ${String(relationOrdinal).padStart(2, '0')}</p>` : sourceAnchor === 'entity' ? '<p class="claim-link">ON SOURCE ENTITY</p>' : ''}<dl class="claim-facts">${facts
          .filter(({ label }) => !commonLabels.has(label))
          .map(({ label, value }) => `<dt>${escape(label)}</dt><dd>${escape(value)}</dd>`)
          .join('')}</dl></article>`,
    )
    .join('')}</div>`;
  const sourceStatus = unlinkedRelation
    ? `<p class="source-note">${escape(relationOnly ? SOURCE_REPORTED_TOPOLOGY_NOTE : UNLINKED_RELATION_NOTE)}</p>`
    : '';
  const graphStyle = page.nodes.length
    ? ` style="--graph-height:${graphHeight(page.geometry)}px"`
    : '';
  const graphNaturalWidth = page.nodes.length
    ? Math.ceil(page.geometry.bounds.width + marks.graphInset * 2)
    : null;
  const boundaryQuestionItems = page.questions
    .map(({ text: question, limits }) => {
      const distinctQuestion = question === page.title ? '' : `<p>${escape(question)}</p>`;
      const boundaries = limits.length
        ? `<ul class="limits">${limits.map((limit) => `<li>${escape(limit)}</li>`).join('')}</ul>`
        : '';
      return distinctQuestion || boundaries ? `<li>${distinctQuestion}${boundaries}</li>` : '';
    })
    .join('');
  const pairedGraph =
    graphNaturalWidth !== null &&
    Boolean(
      boundaryQuestionItems ||
      sourceStatus ||
      editorial ||
      page.relations.some((relation) => relation.sourceQualifiers?.length),
    );
  const gridClass = page.nodes.length
    ? ` page-grid--graph${pairedGraph ? ' page-grid--paired' : ''}`
    : '';
  const gridStyle =
    graphNaturalWidth === null ? '' : ` style="--graph-natural-width:${graphNaturalWidth}px"`;
  const legend = renderFigureTypeLegend(page.nodes, icons);
  const stage = page.nodes.length
    ? `<div class="graph-wrap"><div class="graph" id="graph-${index}" aria-hidden="true"${graphStyle}>${renderGraphSvg(page, index, icons)}</div></div>${legend}<div class="graph-controls"><p class="graph-instruction">Pan and zoom to explore. Inspect provides complete source records and keyboard focus.</p><button class="fit" type="button" data-fit="${index}">Fit graph</button></div><p class="sr-only" role="status" aria-atomic="true" data-focus-status></p>`
    : page.claims?.length
      ? claimStage
      : editorialStage;
  const readingBoundary =
    pairedGraph && boundaryQuestionItems
      ? `<aside class="reading-boundary" aria-label="Reading boundary"><h3>Reading boundary</h3><ul>${boundaryQuestionItems}</ul></aside>`
      : '';
  const evidence = [
    pairedGraph
      ? ''
      : evidenceSection('Reader questions', `<ul>${questionItems}</ul>`, 'questions'),
    evidenceSection(
      'Source nodes',
      nodeItems ? `<ul class="node-list">${nodeItems}</ul>` : '',
      'nodes',
    ),
    evidenceSection(
      'Source relations',
      relationItems ? `${qualifierNote}<ul class="relation-list">${relationItems}</ul>` : '',
      'relations',
    ),
    evidenceSection(
      'Editorial assertions',
      editorial && (page.nodes.length || page.claims?.length) ? `<ul>${editorial}</ul>` : '',
      'editorial',
    ),
    evidenceSection(
      'Method limits',
      methodLimits.length
        ? `<ul class="method-limits">${methodLimits.map((limit) => `<li><code>${escape(limit)}</code></li>`).join('')}</ul>`
        : '',
      'methods',
    ),
  ].join('');
  const claimWork = mixed
    ? `<section class="claim-work" aria-label="Selected source claims" style="--claim-columns:${Math.min(4, page.claims.length)}"><h3>Selected source claims</h3>${claimWorkHtml(page)}</section>`
    : '';
  const relationQualifiers = page.relations.filter((relation) => relation.sourceQualifiers?.length);
  const qualifierWork = relationQualifiers.length
    ? `<section class="relation-work" aria-label="Source-reported relation qualifiers"><h3>Source-reported relation qualifiers · unverified</h3><div class="relation-articles">${relationQualifiers.map((relation) => `<article><h4>${escape(nodes.get(relation.source))} ${relation.direction === 'bidirectional' ? '↔' : '→'} ${escape(nodes.get(relation.target))}${relation.label ? ` · ${escape(relation.label)}` : ''}</h4><dl class="relation-qualifiers">${relation.sourceQualifiers.map(({ name, value }) => `<dt>${escape(name || '""')}</dt><dd>${escape(value)}</dd>`).join('')}</dl></article>`).join('')}</div></section>`
    : '';
  const sourceInspection = page.nodes.length
    ? `<details class="source-inspection"><summary>Inspect source and method</summary><aside class="notes" aria-label="Page evidence">${evidence}</aside>${mixed ? `<section class="linked-claims" aria-label="Complete source claims"><h3>Complete source claims</h3>${claimStage}</section>` : ''}</details>`
    : `<aside class="notes" aria-label="Page evidence">${sourceStatus}${evidence}</aside>`;
  const editorialWork =
    page.nodes.length && editorial
      ? `<section class="editorial-reading" aria-label="Selected editorial judgments"><ul>${editorial}</ul></section>`
      : '';
  const readingUnit =
    page.nodes.length && (readingBoundary || qualifierWork || editorialWork)
      ? `<aside class="reading-unit" aria-label="Diagram applicability">${readingBoundary}${qualifierWork}${editorialWork}</aside>`
      : '';
  return `<section class="edition-page" id="page-${index}" data-page="${index}" aria-labelledby="page-title-${index}">
    <header class="page-heading"><h2 id="page-title-${index}">${escape(page.navigationLabel)}</h2><p>${escape(page.title)}</p></header>
    ${page.nodes.length ? sourceStatus : ''}<div class="page-grid${gridClass}"${gridStyle}><div class="stage">${stage}</div>
    ${page.nodes.length ? readingUnit : sourceInspection}</div>${claimWork}${page.nodes.length ? sourceInspection : ''}</section>`;
}

function css(fonts) {
  const faces = fonts
    .map(
      ({ weight, bytes }) =>
        `@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/ttf;base64,${bytes.toString('base64')}) format('truetype')}`,
    )
    .join('\n');
  return `${faces}
  ${interactiveAppearanceCss()}
  :root{font-family:'JetBrains Mono',monospace;color:var(--reader-ink);background:var(--reader-paper)}
  *{box-sizing:border-box}body{margin:0}button{font:inherit;color:inherit;cursor:pointer}button:focus-visible{outline:2px solid var(--reader-accent);outline-offset:3px}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .shell{max-width:${marks.shellMaximumWidth}px;margin:auto;padding:32px ${marks.shellInset}px ${marks.shellInset}px}.masthead{border-bottom:1px solid var(--reader-rule);padding-bottom:16px}.masthead h1{font-size:clamp(28px,3vw,43px);line-height:1.15;margin:0}.masthead p{font-size:15px;color:var(--reader-muted);max-width:72ch;margin:8px 0 0}.masthead .editorial-framing{display:block;margin-top:9px;color:var(--reader-muted);font-size:11px;line-height:1.45;overflow-wrap:anywhere}
  .reader-navigation{display:flex;align-items:center;justify-content:space-between;gap:24px}.navigation{flex:1;min-width:0;display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.navigation button{border:1px solid var(--reader-rule);background:var(--reader-panel);border-radius:999px;padding:10px 18px;font-size:12px;text-align:left;max-width:35ch}.navigation button[aria-current=page]{background:var(--reader-accent);color:var(--reader-onAccent);border-color:var(--reader-accent)}
  .edition-page[hidden]{display:none}.page-heading{display:grid;grid-template-columns:minmax(150px,.18fr) minmax(0,1fr);align-items:baseline;gap:24px;margin:22px 0 20px}.page-heading h2{font-size:28px;line-height:1.3;margin:0}.page-heading>p{font-size:18px;line-height:1.5;margin:0;max-width:92ch;overflow-wrap:anywhere}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--reader-muted);margin:0;white-space:nowrap}
  .source-note{font-size:11px;line-height:1.45;color:var(--reader-muted);margin:0 0 12px;padding-left:12px;border-left:2px solid var(--reader-line)}
  .page-grid{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(320px,1fr);gap:32px}.page-grid--graph{grid-template-columns:minmax(0,1fr)}.page-grid--graph .stage{grid-column:1/-1;width:100%;max-width:var(--graph-natural-width);margin-inline:auto}.page-grid--paired{display:flex;flex-wrap:wrap;gap:${marks.readingGap}px;align-items:flex-start}.page-grid--paired .stage{flex:0 1 var(--graph-natural-width);max-width:100%;margin:0}.reading-unit{flex:1 0 ${marks.readingRailMinimumWidth}px;min-width:0;max-width:100%;display:flex;flex-wrap:wrap;gap:20px 28px;border-top:1px solid var(--reader-rule);padding-top:16px}.reading-unit>section{flex:1 0 ${marks.readingRailMinimumWidth}px;max-width:100%;min-width:0}.reading-unit .reading-boundary{flex:1 0 ${marks.readingRailMinimumWidth}px;min-width:0;max-width:100%}.stage{position:relative;min-width:0}.graph-wrap{position:relative}.graph,.empty-graph{border:1px solid var(--reader-rule);border-radius:18px;background:var(--reader-panel)}.graph{height:var(--graph-height,220px);overflow:hidden}.graph-svg{display:block;width:100%;height:100%;font-family:'JetBrains Mono';color:var(--reader-ink)}.graph-group>rect{fill:var(--reader-soft);fill-opacity:.24;stroke:var(--reader-line);stroke-width:${marks.groupStroke}}.graph-node>rect{fill:var(--reader-panel);stroke:var(--reader-line);stroke-width:${marks.nodeStroke}}.graph-label{fill:var(--reader-ink);pointer-events:none;white-space:pre;text-rendering:geometricPrecision;font-synthesis:none}.graph-label--relation{fill:var(--reader-ink)}.graph-route{fill:none;stroke:var(--reader-line);stroke-width:${marks.routeStroke}}.graph-hit{fill:none;stroke:transparent;stroke-width:${marks.hitStroke};pointer-events:stroke}.graph-svg marker path{fill:var(--reader-line)}.graph-node,.graph-relation{cursor:pointer}.graph-node.is-selected>rect{stroke:var(--reader-accent);stroke-width:${marks.selectedNodeStroke}}.graph-relation.is-selected>.graph-route{stroke:var(--reader-accent);stroke-width:${marks.selectedRouteStroke}}.empty-graph{min-height:320px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:25px;padding:44px 55px}.empty-graph blockquote{font-size:clamp(22px,2.3vw,34px);line-height:1.3;margin:0;max-width:30ch}.editorial-card p{font-size:12px;color:var(--reader-muted);margin:12px 0 0}.graph-controls{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:12px}.graph-instruction{font-size:11px;color:var(--reader-muted);margin:0;max-width:72ch}.fit{flex-shrink:0;border:1px solid var(--reader-rule);background:var(--reader-panel);border-radius:999px;padding:7px 12px;font-size:11px;z-index:2}
  .claim-stage{display:block}.claim-card{border-top:1px solid var(--reader-rule);padding:20px 0}.claim-card:last-child{border-bottom:1px solid var(--reader-rule)}.claim-facts{display:grid;grid-template-columns:minmax(120px,180px) minmax(0,1fr);gap:9px 16px;margin:0}.claim-facts dt{font-size:11px;color:var(--reader-muted)}.claim-facts dd{font-size:13px;line-height:1.45;margin:0;overflow-wrap:anywhere}
  .linked-claims{border-top:1px solid var(--reader-rule);margin-top:28px;padding-top:22px}.linked-claims h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--reader-muted);margin:0 0 16px}.claim-link{font-size:11px;color:var(--reader-muted);margin:0 0 16px}
  .claim-context{border-bottom:1px solid var(--reader-rule);margin-bottom:18px}.claim-context dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px 18px;margin:14px 0 20px}.claim-context dt{font-size:10px;color:var(--reader-muted)}.claim-context dd{font-size:12px;line-height:1.45;margin:4px 0 0;overflow-wrap:anywhere}
  .notes{border-left:1px solid var(--reader-rule);padding:0 0 0 28px;min-width:0}.notes .evidence-section+.evidence-section{margin-top:22px}.notes h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--reader-muted);margin:0 0 9px}.notes ul{list-style:none;margin:0;padding:0}.notes li{font-size:13px;line-height:1.55;overflow-wrap:anywhere}.notes li+li{margin-top:9px}.notes p{margin:0}.notes small{display:block;font-size:10px;color:var(--reader-muted);margin-top:3px}.notes button{display:flex;gap:11px;align-items:baseline;width:100%;text-align:left;background:none;border:0;padding:2px 0;line-height:1.5;font-size:13px}.notes button:hover{text-decoration:underline}.notes button small{margin-left:auto}.ordinal{font-size:10px;color:var(--reader-muted)}.limits{border-left:2px solid var(--reader-line);padding-left:10px!important;margin-top:7px!important;color:var(--reader-muted)}
  .notes button[aria-pressed=true]{background:var(--reader-soft);border-radius:4px}
  .node-group h4{font-size:12px;line-height:1.4;margin:0 0 7px;color:var(--reader-muted)}.node-group+.node-group{margin-top:16px!important}.node-group ul{padding-left:11px!important;border-left:1px solid var(--reader-line)}.node-group ul li+li{margin-top:5px}
  .page-grid--graph .notes{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1fr) minmax(0,1.6fr);gap:24px;border-left:0;border-top:1px solid var(--reader-rule);padding:20px 0 0}.page-grid--graph .notes .evidence-section+.evidence-section{margin-top:0}.page-grid--graph .evidence-methods{grid-column:1/-1;border-top:1px solid var(--reader-rule);padding-top:12px}.page-grid--graph .method-limits{display:flex;flex-wrap:wrap;gap:6px 20px}.page-grid--graph .method-limits li{margin:0}
  .reading-boundary h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--reader-muted);margin:0 0 12px}.reading-boundary ul{list-style:none;margin:0;padding:0}.reading-boundary li{font-size:14px;line-height:1.55;overflow-wrap:anywhere}.reading-boundary li p{margin:0}.reading-boundary li+li{margin-top:10px}.reading-boundary .limits{padding-left:12px!important}.reading-boundary .source-note{margin:14px 0 0;font-size:12px}.page-grid--paired .notes{grid-template-columns:minmax(0,1fr) minmax(0,1.55fr)}
  .relation-qualifier-note{font-size:11px;color:var(--reader-muted);margin:0 0 9px!important}.relation-qualifiers{display:grid;grid-template-columns:minmax(76px,.7fr) minmax(0,1.3fr);gap:4px 10px;margin:5px 0 0 12px;padding-left:10px;border-left:2px solid var(--reader-line)}.relation-qualifiers dt{font-size:11px;color:var(--reader-muted)}.relation-qualifiers dd{font-size:12px;margin:0;overflow-wrap:anywhere}.method-limits code{font:11px 'JetBrains Mono',monospace;color:var(--reader-muted);white-space:normal}
  dd,.form-map-role small{white-space:break-spaces}
  ${responsibilityCss}
  ${claimWorkCss}
  .editorial-reading{border-top:1px solid var(--reader-rule);margin-top:20px;padding-top:14px}.editorial-reading ul{list-style:none;margin:0;padding:0;display:grid;gap:14px 28px;grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}.editorial-reading li{min-width:0}.editorial-reading p{font-size:14px;line-height:1.5;margin:0;overflow-wrap:anywhere}.editorial-reading small{display:block;font-size:11px;color:var(--reader-muted);margin-top:5px}
  .relation-articles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:18px 28px;align-items:start}.relation-work>h3{font-size:12px;color:var(--reader-muted);font-weight:400;margin:0 0 18px}.relation-work h4{font-size:14px;line-height:1.5;margin:0 0 10px;overflow-wrap:anywhere}.relation-work .relation-qualifiers{margin:0}.relation-work .relation-qualifiers dt{font-size:12px;line-height:1.5}.relation-work .relation-qualifiers dd{font-size:14px;line-height:1.5}.reading-unit .editorial-reading{margin:0;border-top:0;padding:0}
  .source-inspection{margin-top:20px;border-top:1px solid var(--reader-rule);padding-top:14px}.source-inspection>summary{font-size:12px;color:var(--reader-muted);cursor:pointer}.source-inspection .notes{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.7fr);gap:22px 28px;border-left:0;padding:20px 0 0}.source-inspection .evidence-methods{grid-column:1/-1}.source-inspection .notes .evidence-section+.evidence-section{margin-top:0}
  .licenses{border-top:1px solid var(--reader-rule);margin-top:28px;padding-top:15px;font-size:11px;color:var(--reader-muted)}.licenses summary{cursor:pointer}.licenses pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;font:10px/1.5 monospace}
`;
}

/** Compile one unqualified standalone reading work from an independent Scene. */
export async function renderInteractiveEditionHtml(scene) {
  const appearance = interactiveAppearance(scene?.appearance);
  if (
    scene?.schema !== 'architecture.edition-interactive-scene/v1' ||
    scene.completeness !== 'unqualified-scene' ||
    !text(scene.title) ||
    !text(scene.summary) ||
    !text(scene.edition?.editor) ||
    scene.visualPolicy?.profile !== 'neutral' ||
    (scene.visualPolicy.override !== undefined && scene.visualPolicy.override !== null) ||
    !Array.isArray(scene.pages) ||
    !scene.pages.length ||
    scene.pages.length > 64 ||
    scene.pages.some((page) => !page || !text(page.id)) ||
    !Array.isArray(scene.limits) ||
    scene.limits.some((limit) => !text(limit))
  )
    fail('render_interactive_scene_invalid');
  if (new Set(scene.pages.map(({ id }) => id)).size !== scene.pages.length)
    fail('render_interactive_identity_ambiguous');
  if (scene.pages.some((page) => page.nodes?.length > 512 || page.relations?.length > 2048))
    fail('render_interactive_complexity_exceeded');

  const projected = scene.pages.map(projectInteractivePage);
  const icons = scene.pages.some((page) => page.nodes.length) ? await loadFigureIconSupply() : null;
  if (icons) validateResolvedFigureIcons(scene.pages, icons);
  const graphIndexes = projected.flatMap(({ publicPage }, index) =>
    publicPage.form || !publicPage.nodes.length ? [] : [index],
  );
  const hasGraph = graphIndexes.length > 0;
  const supply = hasGraph ? await loadInteractiveSupply() : null;
  const fontSupply = await loadBundledFonts();
  const graphPages = graphIndexes.map((index) => ({
    ...projected[index].publicPage,
    id: scene.pages[index].id,
  }));
  const measure = hasGraph
    ? await createBundledTextMeasurer(fontSupply, interactiveLabelRequests(graphPages))
    : null;
  const geometry = hasGraph ? await layoutInteractivePages(graphPages, measure) : null;
  const selectedFonts = fontSupply.fonts.filter(({ weight }) => [400, 600].includes(weight));
  if (selectedFonts.length !== 2 || !fontSupply.license?.bytes)
    fail('render_interactive_font_supply_invalid');
  const geometryByIndex = new Map(graphIndexes.map((index, at) => [index, geometry.layouts[at]]));
  const pages = projected.map(({ publicPage }, index) => ({
    ...publicPage,
    ...(geometryByIndex.has(index) ? { geometry: geometryByIndex.get(index) } : {}),
  }));
  const vendor = supply?.script.toString('utf8').replace(/<\/script/giu, '<\\/script') ?? '';
  const html = `<!doctype html><html lang="en" data-style="${appearance.style}" data-theme="${appearance.theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'"><link rel="icon" href="data:,"><title>${escape(scene.title)}</title><style>${css(selectedFonts)}.figure-types{display:flex;flex-wrap:wrap;gap:10px 24px;list-style:none;margin:14px 0 0;padding:0;font-size:11px;color:var(--reader-ink)}.figure-types li{display:flex;align-items:center;gap:8px}.figure-types svg{flex:none;overflow:visible}</style></head><body><div class="shell"><header class="masthead"><h1>${escape(scene.title)}</h1><p>${escape(scene.summary)}</p><small class="editorial-framing">${escape(editorialFraming(scene.edition.editor))}</small></header><div class="reader-navigation"><nav class="navigation" aria-label="Reading pages">${pages.map((page, index) => `<button type="button" data-page-index="${index}" aria-controls="page-${index}" aria-label="${escape(`${page.navigationLabel} — ${page.title}`)}">${escape(page.navigationLabel)}</button>`).join('')}</nav>${interactiveAppearanceControls(appearance)}</div><main>${pages.map((page, index) => pageHtml(page, index, scene.limits, icons)).join('')}</main><details class="licenses"><summary>Open-source licenses</summary><pre>${icons ? escape(icons.license.toString('utf8')) + '\n' : ''}${supply ? escape(supply.license.toString('utf8')) + '\n' : ''}${geometry ? escape(geometry.license.toString('utf8')) + '\n' : ''}${escape(fontSupply.license.bytes.toString('utf8'))}</pre></details></div>${vendor ? `<script>${vendor}</script>` : ''}<script type="application/json" id="edition-data">${scriptJson(pages)}</script><script>${viewerScript}</script><script>${interactiveAppearanceScript()}</script></body></html>\n`;
  const bytes = Buffer.from(html);
  if (bytes.length > 32 * 1024 * 1024) fail('render_interactive_output_limit');
  return {
    completeness: 'unqualified-medium',
    bytes,
    supplies: [
      ...(icons ? [{ id: 'figure-icons', sha256: icons.manifestSha256 }] : []),
      ...(supply ? [{ id: 'svg-pan-zoom', sha256: supply.manifestSha256 }] : []),
      ...(geometry ? [{ id: 'elk-layout', sha256: geometry.supplySha256 }] : []),
      ...(measure ? [measure.supply] : []),
      { id: 'font-supply', sha256: fontSupply.sha256 },
    ],
    carriers: projected.map(({ carriers }) => carriers),
  };
}
