import { loadBundledFonts } from '../fonts/index.mjs';
import { fail } from '../../src/protocol/values.mjs';
import { factorCommonClaimContext } from '../../src/scene/claim-card.mjs';
import {
  SOURCE_REPORTED_TOPOLOGY_NOTE,
  UNLINKED_RELATION_NOTE,
} from '../../src/scene/claim-relations.mjs';
import { layoutInteractivePages } from '../dagre/layout.mjs';
import { projectInteractivePage } from './model.mjs';
import { loadCytoscapeSupply } from './supply.mjs';

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

const viewerScript = String.raw`
const pages = JSON.parse(document.getElementById('edition-data').textContent);
const sections = [...document.querySelectorAll('.edition-page')];
const tabs = [...document.querySelectorAll('[data-page-index]')];
const graphs = new Map();
const observers = new Map();
function fitGraph(graph) {
  graph.fit(undefined, 24);
  if (graph.zoom() > 1) {
    graph.zoom(1);
    graph.center();
  }
}
function syncGraph(graph) {
  graph.resize();
  fitGraph(graph);
}
function reflectSelection(index, graph) {
  const section = sections[index];
  const selected = graph.$(':selected').first();
  const id = selected.length ? selected.id() : null;
  let control = null;
  section.querySelectorAll('[data-focus-node], [data-focus-relation]').forEach(button => {
    const active = (button.dataset.focusNode || button.dataset.focusRelation) === id;
    button.setAttribute('aria-pressed', String(active));
    if (active) control = button;
  });
  section.querySelector('[data-focus-status]').textContent = control
    ? 'Selected in diagram: ' + control.textContent.replace(/\s+/g, ' ').trim()
    : id
      ? 'Selected in diagram: ' + selected.data('label')
      : 'Diagram selection cleared.';
}
function graphFor(index) {
  if (graphs.has(index)) return graphs.get(index);
  const page = pages[index];
  if (!page.nodes.length) return null;
  const container = document.getElementById('graph-' + index);
  const selected = page.geometry;
  const parentByNode = new Map((page.groups || []).flatMap(group =>
    group.nodeIds.map(id => [id, group.id])
  ));
  const elements = [
    ...(page.groups || []).map(group => ({ data: {
      id: group.id, label: group.label, group: 'reading',
    } })),
    ...page.nodes.map(node => ({ data: {
      id: node.id, label: node.label,
      ...(parentByNode.has(node.id) ? { parent: parentByNode.get(node.id) } : {}),
    } })),
    ...page.relations.map(relation => ({ data: relation })),
  ];
  const graph = cytoscape({
    container, elements,
    selectionType: 'single',
    style: [
      { selector: 'node', style: {
        shape: 'round-rectangle', width: 170, height: 64,
        'background-color': '#fffefa', 'border-width': 2,
        'border-color': '#84978a', label: 'data(label)',
        'font-family': 'JetBrains Mono', 'font-size': 16,
        'font-weight': 600, color: '#21332a',
        'text-valign': 'center', 'text-halign': 'center',
        'text-wrap': 'wrap', 'text-max-width': 146,
      } },
      { selector: 'node[group]', style: {
        'background-color': '#e7eee6', 'background-opacity': 0.24,
        'border-color': '#879b89', 'border-width': 1,
        'border-style': 'dashed', 'padding': 18,
        'font-family': 'JetBrains Mono', 'font-size': 16,
        'font-weight': 600, color: '#314638',
        'text-valign': 'top', 'text-halign': 'center',
        'text-wrap': 'wrap', 'text-max-width': 210,
        'compound-sizing-wrt-labels': 'include',
      } },
      { selector: 'edge', style: {
        width: 2.5, 'line-color': '#60786a',
        'target-arrow-shape': 'triangle', 'target-arrow-color': '#60786a',
        'curve-style': 'bezier', label: 'data(graphLabel)',
        'font-family': 'JetBrains Mono', 'font-size': 13,
        color: '#27352e', 'text-background-color': '#fffefa',
        'text-background-opacity': 1, 'text-background-padding': 2,
      } },
      { selector: 'edge[direction = "bidirectional"]', style: {
        'source-arrow-shape': 'triangle', 'source-arrow-color': '#60786a',
      } },
      { selector: ':selected', style: { 'border-color': '#214f3c', 'line-color': '#214f3c' } },
    ],
    layout: {
      name: 'preset', fit: false, animate: false,
      positions: node => selected.positions[node.id()],
    },
  });
  graphs.set(index, graph);
  graph.on('select unselect', 'node, edge', () => reflectSelection(index, graph));
  const observer = new ResizeObserver(() => syncGraph(graph));
  observer.observe(container);
  observers.set(index, observer);
  container.dataset.rendered = 'true';
  return graph;
}
function show(index) {
  sections.forEach((section, at) => { section.hidden = at !== index; });
  tabs.forEach((tab, at) => {
    if (at === index) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  requestAnimationFrame(() => {
    const graph = graphFor(index);
    if (graph) syncGraph(graph);
  });
}
tabs.forEach((tab, index) => tab.addEventListener('click', () => show(index)));
document.querySelectorAll('[data-focus-node], [data-focus-relation]').forEach(button => {
  button.addEventListener('click', () => {
    const section = button.closest('.edition-page');
    const index = Number(section.dataset.page);
    const graph = graphFor(index);
    if (!graph) return;
    const id = button.dataset.focusNode || button.dataset.focusRelation;
    graph.$(':selected').unselect();
    const selected = graph.getElementById(id);
    selected.select();
    graph.zoom(1.35);
    graph.center(selected);
  });
});
document.querySelectorAll('[data-fit]').forEach(button => {
  button.addEventListener('click', () => {
    const graph = graphFor(Number(button.dataset.fit));
    if (graph) fitGraph(graph);
  });
});
document.fonts.ready.then(() => show(0));
`;

function evidenceSection(title, content, kind) {
  return content
    ? `<section class="evidence-section evidence-${kind}"><h3>${escape(title)}</h3>${content}</section>`
    : '';
}

function graphHeight(layout) {
  return Math.min(660, Math.max(220, Math.ceil(layout.bounds.height + 64)));
}

function pageHtml(page, index, methodLimits) {
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
  const nodeItem = ({ node, at }) =>
    `<li><button type="button" data-focus-node="${node.id}" aria-pressed="false"><span class="ordinal">${String(at + 1).padStart(2, '0')}</span><span>${escape(node.label)}</span>${node.kind ? `<small>${escape(node.kind)}</small>` : ''}</button></li>`;
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
      return `<li><button type="button" data-focus-relation="${relation.id}" aria-pressed="false">${mixed ? `<span class="ordinal">${String(at + 1).padStart(2, '0')}</span>` : ''}${escape(words)}</button>${sourceQualifiers}</li>`;
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
        `<article class="claim-card" data-graphic-id="${graphicId}">${relationOrdinal ? `<p class="claim-link">ON SOURCE RELATION ${String(relationOrdinal).padStart(2, '0')}</p>` : sourceAnchor === 'entity' ? '<p class="claim-link">ON SOURCE ENTITY</p>' : ''}<dl class="claim-facts">${facts
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
  const graphNaturalWidth = page.nodes.length ? Math.ceil(page.geometry.bounds.width + 64) : null;
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
    graphNaturalWidth <= 960 &&
    Boolean(boundaryQuestionItems || sourceStatus);
  const gridClass = page.nodes.length
    ? ` page-grid--graph${pairedGraph ? ' page-grid--paired' : ''}`
    : '';
  const gridStyle =
    graphNaturalWidth === null ? '' : ` style="--graph-natural-width:${graphNaturalWidth}px"`;
  const stage = page.nodes.length
    ? `<div class="graph-wrap"><div class="graph" id="graph-${index}" aria-hidden="true"${graphStyle}></div><button class="fit" type="button" data-fit="${index}">Fit graph</button></div><p class="graph-instruction">Edge numbers match the source relations below. Pan and zoom in the graph; the lists provide keyboard-accessible reading and focus.</p><p class="sr-only" role="status" aria-atomic="true" data-focus-status></p>`
    : page.claims?.length
      ? claimStage
      : editorialStage;
  const readingBoundary = pairedGraph
    ? `<aside class="reading-boundary" aria-label="Reading boundary"><h3>Reading boundary</h3>${boundaryQuestionItems ? `<ul>${boundaryQuestionItems}</ul>` : ''}${sourceStatus}</aside>`
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
      editorial && page.nodes.length ? `<ul>${editorial}</ul>` : '',
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
  return `<section class="edition-page" id="page-${index}" data-page="${index}" aria-labelledby="page-title-${index}">
    <header class="page-heading"><p class="eyebrow">Reading page ${index + 1}</p><h2 id="page-title-${index}">${escape(page.title)}</h2></header>
    <div class="page-grid${gridClass}"${gridStyle}><div class="stage">${page.nodes.length && !pairedGraph ? sourceStatus : ''}${stage}</div>
    ${readingBoundary}<aside class="notes" aria-label="Page evidence">${page.nodes.length ? '' : sourceStatus}${evidence}</aside></div>${mixed ? `<section class="linked-claims" aria-label="Source claims"><h3>Source claims</h3>${claimStage}</section>` : ''}</section>`;
}

function css(fonts) {
  const faces = fonts
    .map(
      ({ weight, bytes }) =>
        `@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/ttf;base64,${bytes.toString('base64')}) format('truetype')}`,
    )
    .join('\n');
  return `${faces}
  :root{color-scheme:light;font-family:'JetBrains Mono',monospace;color:#21332a;background:#f5f3ed}
  *{box-sizing:border-box}body{margin:0}button{font:inherit;color:inherit;cursor:pointer}button:focus-visible{outline:2px solid #214f3c;outline-offset:3px}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .shell{max-width:1720px;margin:auto;padding:32px 44px 44px}.masthead{border-bottom:1px solid #c4ccc2;padding-bottom:16px}.masthead h1{font-size:clamp(28px,3vw,43px);line-height:1.15;margin:0}.masthead p{font-size:15px;color:#53645a;max-width:72ch;margin:8px 0 0}
  .navigation{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.navigation button{border:1px solid #c4ccc2;background:#fffefa;border-radius:999px;padding:10px 18px;font-size:12px;text-align:left;max-width:35ch}.navigation button[aria-current=page]{background:#214f3c;color:#fffefa;border-color:#214f3c}
  .edition-page[hidden]{display:none}.page-heading{display:flex;align-items:baseline;gap:18px;margin:10px 0 14px}.page-heading h2{font-size:clamp(20px,2vw,28px);line-height:1.3;margin:0}.eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#4c5a50;margin:0;white-space:nowrap}
  .source-note{font-size:11px;line-height:1.45;color:#526158;margin:0 0 12px;padding-left:12px;border-left:2px solid #b3c4b6}
  .page-grid{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(320px,1fr);gap:32px}.page-grid--graph{grid-template-columns:minmax(0,1fr)}.page-grid--graph .stage{grid-column:1/-1;width:100%;max-width:var(--graph-natural-width);margin-inline:auto}.page-grid--paired{grid-template-columns:minmax(0,var(--graph-natural-width)) minmax(0,1fr);gap:24px;align-items:start}.page-grid--paired .stage{grid-column:1;grid-row:1;margin:0}.stage{position:relative;min-width:0}.graph-wrap{position:relative}.graph,.empty-graph{border:1px solid #c4ccc2;border-radius:18px;background:#fffefa}.graph{height:var(--graph-height,220px)}.empty-graph{min-height:320px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:25px;padding:44px 55px}.empty-graph blockquote{font-size:clamp(22px,2.3vw,34px);line-height:1.3;margin:0;max-width:30ch}.editorial-card p{font-size:12px;color:#526158;margin:12px 0 0}.graph-instruction{font-size:11px;color:#4c5a50;margin:10px 0 0}.fit{position:absolute;right:16px;top:16px;border:1px solid #c4ccc2;background:#fffefa;border-radius:999px;padding:7px 12px;font-size:11px;z-index:2}
  .claim-stage{display:block}.claim-card{border-top:1px solid #c4ccc2;padding:20px 0}.claim-card:last-child{border-bottom:1px solid #c4ccc2}.claim-facts{display:grid;grid-template-columns:minmax(120px,180px) minmax(0,1fr);gap:9px 16px;margin:0}.claim-facts dt{font-size:11px;color:#526158}.claim-facts dd{font-size:13px;line-height:1.45;margin:0;overflow-wrap:anywhere}
  .linked-claims{border-top:1px solid #c4ccc2;margin-top:28px;padding-top:22px}.linked-claims h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#4c5a50;margin:0 0 16px}.claim-link{font-size:11px;color:#4c5a50;margin:0 0 16px}
  .claim-context{border-bottom:1px solid #d3dbd1;margin-bottom:18px}.claim-context dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px 18px;margin:14px 0 20px}.claim-context dt{font-size:10px;color:#526158}.claim-context dd{font-size:12px;line-height:1.45;margin:4px 0 0;overflow-wrap:anywhere}
  .notes{border-left:1px solid #d3dbd1;padding:0 0 0 28px;min-width:0}.notes .evidence-section+.evidence-section{margin-top:22px}.notes h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#4c5a50;margin:0 0 9px}.notes ul{list-style:none;margin:0;padding:0}.notes li{font-size:13px;line-height:1.55;overflow-wrap:anywhere}.notes li+li{margin-top:9px}.notes p{margin:0}.notes small{display:block;font-size:10px;color:#4c5a50;margin-top:3px}.notes button{display:flex;gap:11px;align-items:baseline;width:100%;text-align:left;background:none;border:0;padding:2px 0;line-height:1.5;font-size:13px}.notes button:hover{text-decoration:underline}.notes button small{margin-left:auto}.ordinal{font-size:10px;color:#4c5a50}.limits{border-left:2px solid #b3c4b6;padding-left:10px!important;margin-top:7px!important;color:#526158}
  .notes button[aria-pressed=true]{background:#e7eee6;border-radius:4px}
  .node-group h4{font-size:12px;line-height:1.4;margin:0 0 7px;color:#314638}.node-group+.node-group{margin-top:16px!important}.node-group ul{padding-left:11px!important;border-left:1px solid #b3c4b6}.node-group ul li+li{margin-top:5px}
  .page-grid--graph .notes{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1fr) minmax(0,1.6fr);gap:24px;border-left:0;border-top:1px solid #d3dbd1;padding:20px 0 0}.page-grid--graph .notes .evidence-section+.evidence-section{margin-top:0}.page-grid--graph .evidence-methods{grid-column:1/-1;border-top:1px solid #d3dbd1;padding-top:12px}.page-grid--graph .method-limits{display:flex;flex-wrap:wrap;gap:6px 20px}.page-grid--graph .method-limits li{margin:0}
  .page-grid--paired .reading-boundary{grid-column:2;grid-row:1;min-width:0;border-left:1px solid #d3dbd1;padding:14px 0 0 24px}.reading-boundary h3{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#4c5a50;margin:0 0 12px}.reading-boundary ul{list-style:none;margin:0;padding:0}.reading-boundary li{font-size:14px;line-height:1.55}.reading-boundary li+li{margin-top:10px}.reading-boundary .limits{padding-left:12px!important}.reading-boundary .source-note{margin-top:16px}.page-grid--paired .notes{grid-row:2;grid-template-columns:minmax(0,1fr) minmax(0,1.55fr)}
  .relation-qualifier-note{font-size:11px;color:#526158;margin:0 0 9px!important}.relation-qualifiers{display:grid;grid-template-columns:minmax(76px,.7fr) minmax(0,1.3fr);gap:4px 10px;margin:5px 0 0 12px;padding-left:10px;border-left:2px solid #b3c4b6}.relation-qualifiers dt{font-size:11px;color:#526158}.relation-qualifiers dd{font-size:12px;margin:0;overflow-wrap:anywhere}.method-limits code{font:11px 'JetBrains Mono',monospace;color:#526158;white-space:normal}
  .licenses{border-top:1px solid #c4ccc2;margin-top:28px;padding-top:15px;font-size:11px;color:#4c5a50}.licenses summary{cursor:pointer}.licenses pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;font:10px/1.5 monospace}
  @media(max-width:1390px){.page-grid--paired{grid-template-columns:minmax(0,1fr)}.page-grid--paired .stage{grid-column:1;grid-row:1;margin-inline:auto}.page-grid--paired .reading-boundary{grid-column:1;grid-row:2;border-left:0;border-top:1px solid #d3dbd1;padding:18px 0 0}.page-grid--paired .notes{grid-column:1;grid-row:3}}
  @media(max-width:900px){.shell{padding:20px}.page-grid{grid-template-columns:minmax(0,1fr)}.notes{border-left:0;border-top:1px solid #d3dbd1;padding:22px 0 0}.page-grid--graph .notes,.page-grid--paired .notes{grid-template-columns:minmax(0,1fr);gap:22px}.page-grid--graph .evidence-methods,.page-grid--paired .evidence-methods{grid-column:auto}.empty-graph{min-height:280px;padding:30px}.page-heading{display:block}.page-heading h2{margin-top:7px}}`;
}

/** Compile one unqualified standalone reading work from an independent Scene. */
export async function renderInteractiveEditionHtml(scene) {
  if (
    scene?.schema !== 'architecture.edition-interactive-scene/v1' ||
    scene.completeness !== 'unqualified-scene' ||
    !text(scene.title) ||
    !text(scene.summary) ||
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
  const hasGraph = projected.some(({ publicPage }) => publicPage.nodes.length > 0);
  const supply = hasGraph ? await loadCytoscapeSupply() : null;
  const geometry = hasGraph
    ? await layoutInteractivePages(projected.map(({ publicPage }) => publicPage))
    : null;
  const fontSupply = await loadBundledFonts();
  const selectedFonts = fontSupply.fonts.filter(({ weight }) => [400, 600].includes(weight));
  if (selectedFonts.length !== 2 || !fontSupply.license?.bytes)
    fail('render_interactive_font_supply_invalid');
  const pages = projected.map(({ publicPage }, index) => ({
    ...publicPage,
    ...(publicPage.nodes.length ? { geometry: geometry.layouts[index] } : {}),
  }));
  const vendor = supply?.script.toString('utf8').replace(/<\/script/giu, '<\\/script') ?? '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'"><link rel="icon" href="data:,"><title>${escape(scene.title)}</title><style>${css(selectedFonts)}</style></head><body><div class="shell"><header class="masthead"><h1>${escape(scene.title)}</h1><p>${escape(scene.summary)}</p></header><nav class="navigation" aria-label="Reading pages">${pages.map((page, index) => `<button type="button" data-page-index="${index}" aria-controls="page-${index}" aria-label="${escape(`${page.navigationLabel} — ${page.title}`)}">${escape(page.navigationLabel)}</button>`).join('')}</nav><main>${pages.map((page, index) => pageHtml(page, index, scene.limits)).join('')}</main><details class="licenses"><summary>Open-source licenses</summary><pre>${supply ? escape(supply.license.toString('utf8')) + '\n' : ''}${geometry ? escape(geometry.license.toString('utf8')) + '\n' : ''}${escape(fontSupply.license.bytes.toString('utf8'))}</pre></details></div>${vendor ? `<script>${vendor}</script>` : ''}<script type="application/json" id="edition-data">${scriptJson(pages)}</script><script>${viewerScript}</script></body></html>\n`;
  const bytes = Buffer.from(html);
  if (bytes.length > 32 * 1024 * 1024) fail('render_interactive_output_limit');
  return {
    completeness: 'unqualified-medium',
    bytes,
    supplies: [
      ...(supply ? [{ id: 'cytoscape', sha256: supply.manifestSha256 }] : []),
      ...(geometry ? [{ id: 'dagre-layout', sha256: geometry.supplySha256 }] : []),
      { id: 'font-supply', sha256: fontSupply.sha256 },
    ],
    carriers: projected.map(({ carriers }) => carriers),
  };
}
