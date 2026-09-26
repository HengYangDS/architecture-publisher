import { createHash } from 'node:crypto';
import {
  fail,
  hasExactFields as exact,
  isDigest,
  LIMITS,
  portablePath,
} from '../source/manifest.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const identifier = (value) => typeof value === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const scriptJson = (value) =>
  JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');

function selectedBytes(value, digest, mismatch) {
  if (!Buffer.isBuffer(value) || !isDigest(digest) || sha256(value) !== digest) fail(mismatch);
  return value;
}

function pageHtml(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    fail('atlas_page_encoding_invalid');
  }
}

function validatePage(page, ids, paths, sources, metadataOnly) {
  const sourceIds = new Set(Object.keys(sources));
  if (
    !exact(
      page,
      [
        'id',
        'label',
        'shortLabel',
        'purpose',
        'path',
        'sha256',
        'sourceIds',
        'content',
        ...(metadataOnly ? ['facts'] : []),
      ],
      ['subjectSources'],
    ) ||
    !identifier(page.id) ||
    ids.has(page.id) ||
    !text(page.label) ||
    !text(page.shortLabel) ||
    !['overview', 'mechanism'].includes(page.purpose) ||
    !portablePath(page.path).endsWith('.html') ||
    paths.has(page.path) ||
    !Array.isArray(page.sourceIds) ||
    !page.sourceIds.length ||
    new Set(page.sourceIds).size !== page.sourceIds.length ||
    page.sourceIds.some((id) => !sourceIds.has(id)) ||
    (Object.hasOwn(page, 'subjectSources') && !record(page.subjectSources))
  )
    fail('atlas_page_invalid');
  selectedBytes(page.content, page.sha256, 'atlas_page_digest_mismatch');
  ids.add(page.id);
  paths.add(page.path);
  const nodes = {},
    pageSources = new Set(page.sourceIds);
  for (const [id, values] of Object.entries(page.subjectSources ?? {})) {
    if (
      !identifier(id) ||
      !Array.isArray(values) ||
      !values.length ||
      new Set(values).size !== values.length ||
      values.some((sourceId) => !sourceIds.has(sourceId) || !pageSources.has(sourceId))
    )
      fail('atlas_page_source_invalid');
    nodes[id] = [...values];
  }
  const visibleSubjects = new Set(
    [...pageHtml(page.content).matchAll(/\bdata-(?:node|edge)-id=["']([^"']+)["']/g)].map(
      (match) => match[1],
    ),
  );
  if (
    visibleSubjects.size !== Object.keys(nodes).length ||
    [...visibleSubjects].some((id) => !Object.hasOwn(nodes, id))
  )
    fail('atlas_page_source_invalid');
  if (metadataOnly) {
    if (!Array.isArray(page.facts) || !page.facts.length || page.facts.length > 8192)
      fail('atlas_page_facts_invalid');
    const references = new Set();
    for (const item of page.facts) {
      let reference;
      try {
        reference = JSON.parse(item?.reference);
      } catch {
        fail('atlas_page_facts_invalid');
      }
      if (
        !exact(item, ['reference', 'sourceSha256', 'graphicId', 'title', 'facts']) ||
        !Array.isArray(reference) ||
        reference.length !== 3 ||
        reference.some((part) => !text(part)) ||
        !['entity', 'relation', 'claim'].includes(reference[1]) ||
        JSON.stringify(reference) !== item.reference ||
        references.has(item.reference) ||
        !isDigest(item.sourceSha256) ||
        !visibleSubjects.has(item.graphicId) ||
        !text(item.title) ||
        !Array.isArray(item.facts) ||
        !item.facts.length ||
        item.facts.length > 32 ||
        item.facts.some(
          (fact) => !exact(fact, ['label', 'value']) || !text(fact.label) || !text(fact.value),
        ) ||
        !page.sourceIds.some(
          (id) =>
            sources[id].namespace === reference[0] && sources[id].sha256 === item.sourceSha256,
        )
      )
        fail('atlas_page_facts_invalid');
      references.add(item.reference);
    }
  }
  return nodes;
}

function pagePieces(bytes, shared, blocks) {
  const html = pageHtml(bytes);
  if (/<(?:script|iframe)\b[^>]*\bsrc\s*=/i.test(html) || /<link\b[^>]*\bhref\s*=/i.test(html))
    fail('atlas_external_dependency');
  const pieces = [];
  let cursor = 0;
  const expression = /<(?:style|script)\b[^>]*>[\s\S]*?<\/(?:style|script)>/gi;
  for (const match of html.matchAll(expression)) {
    if (match.index > cursor) pieces.push(html.slice(cursor, match.index));
    if (!shared.has(match[0])) {
      shared.set(match[0], blocks.length);
      blocks.push(match[0]);
    }
    pieces.push(shared.get(match[0]));
    cursor = match.index + match[0].length;
  }
  pieces.push(html.slice(cursor));
  return pieces;
}

function atlasReader() {
  'use strict';
  const payload =
    document.getElementById('architecture-interactive-data') ||
    document.getElementById('architecture-atlas-data');
  const data = JSON.parse(payload.textContent);
  const frame = document.getElementById('atlas-frame');
  const pageLabel = document.getElementById('atlas-page-label');
  const sourcePanel = document.getElementById('atlas-source-panel');
  const sourceTitle = document.getElementById('atlas-source-title');
  const sourceContext = document.getElementById('atlas-source-context');
  const sourceList = document.getElementById('atlas-source-list');
  const sourceCode = document.getElementById('atlas-source-code');
  const sourceMeta = document.getElementById('atlas-source-meta');
  const sourceToggle = document.getElementById('atlas-sources');
  const sourceClose = document.getElementById('atlas-source-close');
  const sourceSection = document.getElementById('atlas-source-section');
  const meaningToggle = document.getElementById('interactive-meaning');
  const factsPanel = document.getElementById('interactive-facts');
  const error = document.getElementById('atlas-error');
  let active = null;
  let activeSourceIds = [];

  const selectedId = () => {
    try {
      const value = new URL(location.href).hash.match(/^#page=([^&]+)/)?.[1];
      const decoded = value ? decodeURIComponent(value) : data.overview;
      return Object.prototype.hasOwnProperty.call(data.pages, decoded) ? decoded : data.overview;
    } catch (_) {
      return data.overview;
    }
  };
  const page = () => data.pages[selectedId()];
  const rebuild = (selected) =>
    selected.pieces
      .map((piece) => (typeof piece === 'number' ? data.blocks[piece] : piece))
      .join('');
  const decodeSource = (source) => {
    if (typeof source.base64 !== 'string')
      return 'Source bytes are not embedded. Inspect the selected source by its namespace and digest.';
    try {
      const raw = atob(source.base64);
      const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (_) {
      return '[Binary source; inspect the digest-bound Source Bundle.]';
    }
  };
  const setLocation = (id, replace) => {
    const url = new URL(location.href);
    url.hash = 'page=' + encodeURIComponent(id);
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
  };
  const renderSource = (id) => {
    const source = data.sources[id];
    if (!source) return false;
    sourceTitle.textContent = id;
    sourceMeta.textContent =
      (source.path || source.namespace) + ' · sha256:' + source.sha256.slice(0, 12);
    sourceCode.textContent = decodeSource(source);
    for (const button of sourceList.querySelectorAll('[data-atlas-source]'))
      button.setAttribute('aria-current', button.dataset.atlasSource === id ? 'true' : 'false');
    return true;
  };
  const showSources = (ids, context) => {
    activeSourceIds = ids.filter((id) => Object.prototype.hasOwnProperty.call(data.sources, id));
    sourcePanel.dataset.mode = 'sources';
    sourceList.hidden = false;
    sourceSection.hidden = false;
    if (factsPanel) factsPanel.hidden = true;
    if (meaningToggle) meaningToggle.setAttribute('aria-expanded', 'false');
    sourceContext.textContent = context;
    sourceList.textContent = '';
    for (const id of activeSourceIds) {
      const source = data.sources[id];
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.atlasSource = id;
      button.innerHTML = '<strong></strong><small></small>';
      button.querySelector('strong').textContent = id;
      button.querySelector('small').textContent =
        source.authority || source.kind + ' · ' + source.claimant;
      button.addEventListener('click', () => renderSource(id));
      sourceList.appendChild(button);
    }
    sourcePanel.hidden = false;
    sourceToggle.setAttribute('aria-expanded', 'true');
    if (activeSourceIds.length) renderSource(activeSourceIds[0]);
    else {
      sourceTitle.textContent = 'No bound source';
      sourceMeta.textContent = '';
      sourceCode.textContent = 'This selection has no source binding.';
    }
    sourceClose.focus();
  };
  const showMeaning = (graphicId) => {
    if (!meaningToggle || !factsPanel) return false;
    const selected = page();
    const entries = graphicId
      ? selected.facts.filter((fact) => fact.graphicId === graphicId)
      : selected.facts;
    if (!entries.length) return false;
    sourcePanel.dataset.mode = 'meaning';
    sourceTitle.textContent = 'Selected meaning';
    sourceContext.textContent = selected.label;
    sourceList.hidden = true;
    sourceSection.hidden = true;
    factsPanel.hidden = false;
    factsPanel.replaceChildren();
    for (const entry of entries) {
      const article = document.createElement('article');
      const title = document.createElement('h3');
      title.textContent = entry.title;
      article.appendChild(title);
      const dl = document.createElement('dl');
      for (const fact of entry.facts) {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = fact.label;
        dd.textContent = fact.value;
        dl.append(dt, dd);
      }
      article.appendChild(dl);
      factsPanel.appendChild(article);
    }
    sourcePanel.hidden = false;
    sourceToggle.setAttribute('aria-expanded', 'false');
    meaningToggle.setAttribute('aria-expanded', 'true');
    sourceClose.focus();
    return true;
  };
  const closeSources = () => {
    const target = sourcePanel.dataset.mode === 'meaning' ? meaningToggle : sourceToggle;
    sourcePanel.hidden = true;
    sourceToggle.setAttribute('aria-expanded', 'false');
    if (meaningToggle) meaningToggle.setAttribute('aria-expanded', 'false');
    target.focus();
  };
  const hydrate = (selected) => {
    const parsed = new DOMParser().parseFromString(rebuild(selected), 'text/html');
    parsed.documentElement.setAttribute('data-atlas-member', 'true');
    parsed.documentElement.setAttribute('data-theme', 'light');
    const style = parsed.createElement('style');
    style.textContent =
      'html[data-atlas-member]{height:100%;overflow:hidden}html[data-atlas-member] body{height:100%;min-height:0;padding:.65rem;background:#f3f0e8;overflow:hidden}html[data-atlas-member] .toolbar,html[data-atlas-member] .header,html[data-atlas-member] .no-print,html[data-atlas-member] .archify-toast{display:none!important}html[data-atlas-member] .container{height:100%;max-width:none;margin:0;padding:0}html[data-atlas-member] .diagram-container{display:flex;height:100%;min-height:0;margin:0;padding:.5rem;align-items:center;justify-content:center;overflow:hidden}html[data-atlas-member] .diagram-container>svg{width:100%;height:100%;max-height:100%;object-fit:contain}';
    parsed.head.appendChild(style);
    for (const script of parsed.scripts) {
      if (script.src) throw new Error('External script is not embedded');
      if (script.type && !['text/javascript', 'application/javascript'].includes(script.type))
        continue;
      script.textContent = script.textContent.replace(
        'var Archify = {};',
        'var Archify = window.Archify = {};',
      );
    }
    const pathToId = Object.fromEntries(
      Object.entries(data.pages).map(([id, candidate]) => [candidate.path, id]),
    );
    const bridge = parsed.createElement('script');
    bridge.textContent = `(function(){
      const page=${JSON.stringify(selected.id)},pagePath=${JSON.stringify(selected.path)},pathToId=${JSON.stringify(pathToId)};
      document.addEventListener('click',function(event){
        const anchor=event.target.closest&&event.target.closest('a[href]');
        if(!anchor)return;
        const target=new URL(anchor.getAttribute('href'),'https://atlas.invalid/'+pagePath);
        const id=target.origin==='https://atlas.invalid'?pathToId[target.pathname.slice(1)]:null;
        if(!id)return;
        event.preventDefault();parent.postMessage({type:'architecture-atlas:navigate',page:id},'*');
      },true);
      function inspect(subject){const id=subject.getAttribute('data-node-id')||subject.getAttribute('data-edge-id');parent.postMessage({type:'architecture-atlas:sources',page:page,subject:id,label:subject.getAttribute('data-node-label')||subject.getAttribute('data-edge-label')||id},'*');}
      document.addEventListener('dblclick',function(event){const subject=event.target.closest&&event.target.closest('[data-node-id],[data-edge-id]');if(subject)inspect(subject);},true);
      document.addEventListener('keydown',function(event){const subject=event.target.closest&&event.target.closest('[data-node-id],[data-edge-id]');if(subject&&(event.key==='i'||event.key==='I')){event.preventDefault();inspect(subject);}},true);
    })();`;
    parsed.body.appendChild(bridge);
    return '<!DOCTYPE html>\n' + parsed.documentElement.outerHTML;
  };
  const render = () => {
    const id = selectedId();
    const selected = data.pages[id];
    error.hidden = true;
    frame.hidden = false;
    pageLabel.textContent = selected.label;
    for (const button of document.querySelectorAll('[data-atlas-page]'))
      button.setAttribute('aria-current', button.dataset.atlasPage === id ? 'page' : 'false');
    if (id === active) return;
    active = id;
    frame.srcdoc = hydrate(selected);
  };
  const navigate = (id) => {
    if (!Object.prototype.hasOwnProperty.call(data.pages, id)) return false;
    if (!sourcePanel.hidden) closeSources();
    setLocation(id, false);
    render();
    return true;
  };

  for (const button of document.querySelectorAll('[data-atlas-page]'))
    button.addEventListener('click', () => navigate(button.dataset.atlasPage));
  sourceToggle.addEventListener('click', () => {
    if (sourcePanel.hidden || sourcePanel.dataset.mode !== 'sources')
      showSources(page().sourceIds, page().label);
    else closeSources();
  });
  if (meaningToggle)
    meaningToggle.addEventListener('click', () => {
      if (sourcePanel.hidden || sourcePanel.dataset.mode !== 'meaning') showMeaning();
      else closeSources();
    });
  sourceClose.addEventListener('click', closeSources);
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !sourcePanel.hidden) {
      event.preventDefault();
      closeSources();
    }
  });
  frame.addEventListener('load', () => {
    frame.title = page().label;
  });
  addEventListener('message', (event) => {
    if (
      event.source !== frame.contentWindow ||
      !event.data ||
      typeof event.data !== 'object' ||
      Array.isArray(event.data)
    )
      return;
    if (event.data.type === 'architecture-atlas:navigate') navigate(event.data.page);
    if (
      event.data.type === 'architecture-atlas:sources' &&
      event.data.page === active &&
      typeof event.data.subject === 'string' &&
      /^[a-z][a-z0-9-]{0,79}$/.test(event.data.subject)
    ) {
      const selected = page();
      if (!showMeaning(event.data.subject))
        showSources(
          selected.subjectSources[event.data.subject] ?? selected.sourceIds,
          typeof event.data.label === 'string' && event.data.label.trim()
            ? event.data.label
            : event.data.subject,
        );
    }
  });
  addEventListener('hashchange', render);
  window.__architectureAtlas = {
    navigate,
    active: () => active,
    pageIds: () => data.order.slice(),
    sourceIds: () => activeSourceIds.slice(),
    openSources: () => showSources(page().sourceIds, page().label),
    closeSources,
    frame: () => frame.contentWindow,
  };
  if (meaningToggle)
    window.__architectureInteractive = {
      ...window.__architectureAtlas,
      openMeaning: () => showMeaning(),
      closeMeaning: closeSources,
    };
  try {
    if (!location.hash) setLocation(data.overview, true);
    render();
  } catch (cause) {
    error.hidden = false;
    error.textContent = 'The Atlas could not open: ' + cause.message;
    frame.hidden = true;
  }
}

function shell(input, data) {
  const metadataOnly = input.schema === 'architecture.interactive-html-composition/v1';
  const navigation = input.pages
    .map(
      (page) =>
        `<button type="button" data-atlas-page="${escapeHtml(page.id)}">${escapeHtml(page.shortLabel)}</button>`,
    )
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)} — ${metadataOnly ? 'Interactive architecture' : 'Interactive Atlas'}</title><style>
:root{color-scheme:light;--paper:#f3f0e8;--panel:#faf8f2;--ink:#26362f;--muted:#636e67;--rule:#c8c7bb;--accent:#456a59;--warm:#9b7145}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--paper);color:var(--ink);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}body{display:grid;grid-template-rows:auto minmax(0,1fr)}header{display:grid;grid-template-columns:minmax(13rem,1fr) minmax(0,4fr) auto;align-items:center;gap:1rem;padding:.72rem 1rem;border-bottom:1px solid var(--rule);background:color-mix(in srgb,var(--panel) 94%,transparent)}.identity{min-width:0}.identity strong{display:block;font:600 clamp(.82rem,1.2vw,1rem)/1.25 system-ui,sans-serif;letter-spacing:.01em}.identity small,#atlas-page-label{color:var(--muted);font-size:.68rem}.chapters{display:flex;min-width:0;gap:.34rem;overflow-x:auto;scrollbar-width:thin;padding:.1rem}.chapters button,#atlas-sources,#interactive-meaning,#atlas-source-close,#atlas-source-list button{border:1px solid transparent;background:transparent;color:var(--muted);font:600 .69rem/1.2 inherit;cursor:pointer}.chapters button{white-space:nowrap;padding:.42rem .58rem;border-radius:.35rem}.chapters button:hover,.chapters button:focus-visible,.chapters button[aria-current="page"]{border-color:var(--rule);background:var(--panel);color:var(--ink);outline:none}.actions{display:flex;align-items:center;gap:.65rem}#atlas-sources,#interactive-meaning{padding:.5rem .7rem;border-color:var(--rule);border-radius:.35rem;color:var(--accent)}#atlas-sources:focus-visible,#interactive-meaning:focus-visible,#atlas-source-close:focus-visible,#atlas-source-list button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}main{position:relative;min-height:0}iframe{display:block;width:100%;height:100%;border:0;background:var(--paper)}#atlas-error{margin:2rem;padding:1rem;border-left:3px solid #8b443c;background:var(--panel)}[hidden]{display:none!important}aside{position:fixed;z-index:10;inset:4.2rem 1rem 1rem auto;width:min(34rem,calc(100vw - 2rem));display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:.8rem;padding:1rem;border:1px solid var(--rule);border-radius:.55rem;background:rgba(250,248,242,.98);box-shadow:0 1.2rem 3.4rem rgba(38,54,47,.18)}aside>*{min-width:0}aside>section{display:grid;grid-template-rows:auto minmax(0,1fr);min-width:0;min-height:0;overflow:hidden}.source-head{display:flex;justify-content:space-between;align-items:start;gap:1rem}.source-head strong{display:block;font:600 1rem/1.25 system-ui,sans-serif}.source-head small,#atlas-source-meta{display:block;color:var(--muted);font-size:.66rem;margin-top:.25rem}#atlas-source-close{font-size:1.2rem;color:var(--ink)}#atlas-source-list{display:flex;gap:.35rem;overflow-x:auto;padding:.1rem}#atlas-source-list button{display:grid;gap:.16rem;min-width:10rem;text-align:left;padding:.48rem .58rem;border-color:var(--rule);border-radius:.35rem}#atlas-source-list button strong{color:var(--ink);font-size:.68rem}#atlas-source-list button small{color:var(--muted);font-size:.58rem;white-space:normal}#atlas-source-list button[aria-current="true"]{border-color:var(--accent);background:#edf1ea}pre{margin:0;width:100%;max-width:100%;height:100%;min-width:0;min-height:0;overflow:auto;padding:.85rem;border:1px solid var(--rule);border-radius:.4rem;background:#ebe8df;color:#2c3932;font:500 .68rem/1.55 inherit;white-space:pre;tab-size:2}aside[data-mode="meaning"]{grid-template-rows:auto minmax(0,1fr)}#interactive-facts{min-height:0;overflow:auto;display:grid;align-content:start;gap:1rem}#interactive-facts article{padding:.8rem;border:1px solid var(--rule);border-radius:.4rem;background:var(--panel)}#interactive-facts h3{margin:0 0 .7rem;font:600 .84rem/1.35 system-ui,sans-serif}#interactive-facts dl{display:grid;grid-template-columns:minmax(7rem,.7fr) minmax(0,1.3fr);gap:.4rem .8rem;margin:0}#interactive-facts dt{font-size:.65rem;color:var(--muted)}#interactive-facts dd{margin:0;font-size:.68rem;line-height:1.45;overflow-wrap:anywhere}@media(max-width:900px){header{grid-template-columns:1fr auto}.chapters{grid-column:1/-1;grid-row:2}.identity small{display:none}aside{inset:7.8rem .5rem .5rem;width:calc(100vw - 1rem)}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
</style></head><body><header><div class="identity"><strong>${escapeHtml(input.title)}</strong><small id="atlas-page-label"></small></div><nav class="chapters" aria-label="${metadataOnly ? 'Interactive chapters' : 'Atlas chapters'}">${navigation}</nav><div class="actions">${metadataOnly ? '<button id="interactive-meaning" type="button" aria-expanded="false" aria-controls="atlas-source-panel">Selected meaning</button>' : ''}<button id="atlas-sources" type="button" aria-expanded="false" aria-controls="atlas-source-panel">${metadataOnly ? 'Source references' : 'Sources'}</button></div></header><main><p id="atlas-error" hidden></p><iframe id="atlas-frame" title="${escapeHtml(input.title)} ${metadataOnly ? 'interactive architecture' : 'interactive Atlas'}" sandbox="allow-scripts allow-downloads"></iframe></main><aside id="atlas-source-panel" hidden role="dialog" aria-labelledby="atlas-source-title"><div class="source-head"><span><strong id="atlas-source-title">${metadataOnly ? 'Source references' : 'Sources'}</strong><small id="atlas-source-context"></small></span><button id="atlas-source-close" type="button" aria-label="Close source inspection">×</button></div><div id="atlas-source-list"></div><section id="atlas-source-section"><small id="atlas-source-meta"></small><pre id="atlas-source-code" tabindex="0"></pre></section>${metadataOnly ? '<div id="interactive-facts" hidden></div>' : ''}</aside><noscript>${metadataOnly ? 'This interactive architecture requires JavaScript. Pages and source references are embedded; source bytes are not.' : 'This interactive Atlas requires JavaScript. Every page and source is embedded in this file.'}</noscript><script id="${metadataOnly ? 'architecture-interactive-data' : 'architecture-atlas-data'}" type="application/json">${scriptJson(data)}</script><script>(${atlasReader.toString()})();</script></body></html>\n`;
}

function composeDocument(input) {
  const metadataOnly = input?.schema === 'architecture.interactive-html-composition/v1';
  if (
    !(metadataOnly
      ? exact(input, ['schema', 'title', 'build', 'overview', 'pages', 'sources', 'state']) &&
        exact(input.build, ['lockSha256', 'editionSha256', 'semanticDigest']) &&
        Object.values(input.build).every(isDigest)
      : exact(input, [
          'schema',
          'title',
          'source',
          'semanticDigest',
          'editionSha256',
          'editionDigest',
          'overview',
          'pages',
          'sources',
          'state',
        ]) &&
        input.schema === 'architecture.atlas-composition/v1' &&
        exact(input.source, ['id'], ['revision', 'manifestSha256']) &&
        text(input.source.id) &&
        (!Object.hasOwn(input.source, 'manifestSha256') || isDigest(input.source.manifestSha256)) &&
        isDigest(input.semanticDigest) &&
        isDigest(input.editionSha256) &&
        isDigest(input.editionDigest)) ||
    !text(input.title) ||
    !identifier(input.overview) ||
    !Array.isArray(input.pages) ||
    !input.pages.length ||
    input.pages.length > 64 ||
    !Array.isArray(input.sources) ||
    !input.sources.length ||
    !exact(input.state, ['qualification', 'humanAcceptance', 'publication']) ||
    Object.values(input.state).some((value) => value !== 'not-performed')
  )
    fail('atlas_composition_invalid');

  const sources = {};
  const namespaces = new Set();
  let total = 0;
  for (const source of input.sources) {
    if (!identifier(source?.id) || Object.hasOwn(sources, source.id)) fail('atlas_source_invalid');
    if (metadataOnly) {
      if (
        !exact(source, ['id', 'kind', 'namespace', 'sha256', 'claimant']) ||
        !['native', 'derived'].includes(source.kind) ||
        !text(source.namespace) ||
        namespaces.has(source.namespace) ||
        !isDigest(source.sha256) ||
        !text(source.claimant)
      )
        fail('atlas_source_invalid');
      namespaces.add(source.namespace);
      sources[source.id] = {
        kind: source.kind,
        namespace: source.namespace,
        sha256: source.sha256,
        claimant: source.claimant,
      };
    } else {
      if (
        !exact(source, ['id', 'path', 'sha256', 'authority', 'content']) ||
        !portablePath(source.path) ||
        !text(source.authority)
      )
        fail('atlas_source_invalid');
      const content = selectedBytes(source.content, source.sha256, 'atlas_source_digest_mismatch');
      total += content.length;
      sources[source.id] = {
        path: source.path,
        sha256: source.sha256,
        authority: source.authority,
        base64: content.toString('base64'),
      };
    }
  }
  const ids = new Set(),
    paths = new Set(),
    blocks = [],
    shared = new Map(),
    pages = {};
  for (const page of input.pages) {
    const nodeSources = validatePage(page, ids, paths, sources, metadataOnly);
    total +=
      page.content.length + (metadataOnly ? Buffer.byteLength(JSON.stringify(page.facts)) : 0);
    if (total > LIMITS.totalBytes) fail('atlas_size_exceeded');
    pages[page.id] = {
      id: page.id,
      label: page.label,
      shortLabel: page.shortLabel,
      purpose: page.purpose,
      path: page.path,
      sha256: page.sha256,
      sourceIds: [...page.sourceIds],
      subjectSources: nodeSources,
      ...(metadataOnly ? { facts: structuredClone(page.facts) } : {}),
      pieces: pagePieces(page.content, shared, blocks),
    };
  }
  if (!Object.hasOwn(pages, input.overview)) fail('atlas_overview_missing');
  if (pages[input.overview].purpose !== 'overview') fail('atlas_overview_invalid');
  if (Object.values(pages).filter(({ purpose }) => purpose === 'overview').length !== 1)
    fail('atlas_overview_invalid');

  for (const page of Object.values(pages)) {
    const source = page.pieces
      .map((piece) => (typeof piece === 'number' ? blocks[piece] : piece))
      .join('');
    for (const match of source.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
      const href = match[1];
      if (/^(?:#|mailto:|https?:)/i.test(href)) continue;
      const resolved = new URL(href, `https://atlas.invalid/${page.path}`);
      if (
        resolved.origin === 'https://atlas.invalid' &&
        resolved.pathname.endsWith('.html') &&
        ![...Object.values(pages)].some(
          (candidate) => candidate.path === resolved.pathname.slice(1),
        )
      )
        fail('atlas_navigation_target_missing');
    }
  }

  const data = metadataOnly
    ? {
        schema: 'architecture.interactive-html/v1',
        title: input.title,
        build: structuredClone(input.build),
        overview: input.overview,
        order: input.pages.map(({ id }) => id),
        pages,
        blocks,
        sources,
        state: structuredClone(input.state),
      }
    : {
        schema: 'architecture.standalone-atlas/v1',
        title: input.title,
        source: structuredClone(input.source),
        semanticDigest: input.semanticDigest,
        editionSha256: input.editionSha256,
        editionDigest: input.editionDigest,
        overview: input.overview,
        order: input.pages.map(({ id }) => id),
        pages,
        blocks,
        sources,
        state: structuredClone(input.state),
      };
  return Buffer.from(shell(input, data));
}

/** Preserve the historical raw-source Atlas protocol. */
export function composeStandaloneAtlas(input) {
  if (input?.schema !== 'architecture.atlas-composition/v1') fail('atlas_composition_invalid');
  return composeDocument(input);
}

/** Pack checked pages and selected public facts without embedding source files. */
export function composeInteractiveHtml(input) {
  if (input?.schema !== 'architecture.interactive-html-composition/v1')
    fail('interactive_html_composition_invalid');
  return composeDocument(input);
}
