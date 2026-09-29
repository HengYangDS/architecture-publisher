import { createHash } from 'node:crypto';
import { fail, hasExactFields as exact, isDigest } from '../protocol/values.mjs';
import { LIMITS, portablePath } from '../file-input/contract.mjs';

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
    fail('interactive_html_page_encoding_invalid');
  }
}

function validatePage(page, ids, paths, sources) {
  const sourceIds = new Set(Object.keys(sources));
  if (
    !exact(
      page,
      ['id', 'label', 'shortLabel', 'purpose', 'path', 'sha256', 'sourceIds', 'content', 'facts'],
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
    fail('interactive_html_page_invalid');
  selectedBytes(page.content, page.sha256, 'interactive_html_page_digest_mismatch');
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
      fail('interactive_html_page_source_invalid');
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
    fail('interactive_html_page_source_invalid');
  if (!Array.isArray(page.facts) || !page.facts.length || page.facts.length > 8192)
    fail('interactive_html_page_facts_invalid');
  const references = new Set();
  for (const item of page.facts) {
    let reference;
    try {
      reference = JSON.parse(item?.reference);
    } catch {
      fail('interactive_html_page_facts_invalid');
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
        (id) => sources[id].namespace === reference[0] && sources[id].sha256 === item.sourceSha256,
      )
    )
      fail('interactive_html_page_facts_invalid');
    references.add(item.reference);
  }
  return nodes;
}

// Reject declared asset loads; executable page code still needs browser qualification.
function rejectDeclaredExternalResources(html) {
  if (
    /<(?:iframe|frame|portal|base)\b/i.test(html) ||
    /<script\b[^>]*\bsrc\s*=/i.test(html) ||
    /<link\b[^>]*\bhref\s*=/i.test(html) ||
    /<meta\b[^>]*\bhttp-equiv\s*=\s*["']?refresh\b/i.test(html)
  )
    fail('interactive_html_external_dependency');

  for (const match of html.matchAll(/<[a-z][^>]*>/gi)) {
    for (const attribute of match[0].matchAll(
      /\s(src|srcset|poster|background)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    )) {
      const value = (attribute[2] ?? attribute[3] ?? attribute[4]).trim();
      if (attribute[1].toLowerCase() === 'srcset' || !/^data:/i.test(value))
        fail('interactive_html_external_dependency');
    }
  }

  for (const match of html.matchAll(/<(?:image|feimage|use|object)\b[^>]*>/gi)) {
    const fragmentAllowed = /^<(?:use|feimage)\b/i.test(match[0]);
    for (const attribute of match[0].matchAll(
      /\s(href|xlink:href|data)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    )) {
      const value = (attribute[2] ?? attribute[3] ?? attribute[4]).trim();
      if (!(/^data:/i.test(value) || (fragmentAllowed && value.startsWith('#'))))
        fail('interactive_html_external_dependency');
    }
  }

  const styles = [
    ...[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1]),
    ...[...html.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)].map(
      (match) => match[1] ?? match[2] ?? match[3],
    ),
  ];
  for (const style of styles) {
    const css = style.replace(/\/\*[\s\S]*?\*\//g, '');
    if (/@import\b|(?:-webkit-)?image-set\s*\(/i.test(css))
      fail('interactive_html_external_dependency');
    const withoutUrls = css.replace(
      /\burl\s*\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi,
      (all, double, single, bare) => {
        if (!/^(?:data:|#)/i.test((double ?? single ?? bare).trim()))
          fail('interactive_html_external_dependency');
        return '';
      },
    );
    if (/\burl\s*\(/i.test(withoutUrls)) fail('interactive_html_external_dependency');
  }
}

function pagePieces(bytes, shared, blocks) {
  const html = pageHtml(bytes);
  rejectDeclaredExternalResources(html);
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

function interactiveReader() {
  'use strict';
  const payload = document.getElementById('architecture-interactive-data');
  const data = JSON.parse(payload.textContent);
  const frame = document.getElementById('interactive-frame');
  const pageLabel = document.getElementById('interactive-page-label');
  const main = document.getElementById('interactive-main');
  const inspector = document.getElementById('interactive-inspector');
  const inspectTitle = document.getElementById('interactive-inspect-title');
  const inspectContext = document.getElementById('interactive-inspect-context');
  const inspectSearch = document.getElementById('interactive-inspect-search');
  const inspectIndex = document.getElementById('interactive-inspect-index');
  const inspectEmpty = document.getElementById('interactive-inspect-empty');
  const inspectContent = document.getElementById('interactive-inspect-content');
  const inspectBasis = document.getElementById('interactive-inspect-basis');
  const inspectToggle = document.getElementById('interactive-inspect');
  const inspectBack = document.getElementById('interactive-inspect-back');
  const error = document.getElementById('interactive-error');
  let active = null;
  let subjectLabels = new Map();
  let returnToGraphic = null;

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
  const setLocation = (id, replace) => {
    const url = new URL(location.href);
    url.hash = 'page=' + encodeURIComponent(id);
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
  };
  const showBasis = (sourceIds) => {
    inspectBasis.replaceChildren();
    const details = document.createElement('details');
    details.id = 'interactive-inspect-basis-details';
    const summary = document.createElement('summary');
    summary.textContent = 'Source identity';
    details.appendChild(summary);
    const note = document.createElement('p');
    note.textContent =
      'These are selected input identities, not embedded source files or verified domain truth.';
    details.appendChild(note);
    for (const id of sourceIds) {
      const source = data.sources[id];
      if (!source) continue;
      const record = document.createElement('dl');
      for (const [label, value] of [
        ['Namespace', source.namespace],
        ['Claimant', source.claimant],
        ['Input kind', source.kind],
        ['SHA-256', source.sha256],
      ]) {
        const term = document.createElement('dt');
        const definition = document.createElement('dd');
        term.textContent = label;
        definition.textContent = value;
        record.append(term, definition);
      }
      details.appendChild(record);
    }
    inspectBasis.appendChild(details);
  };
  const showSelection = (graphicId, label) => {
    const selected = page();
    const entries = graphicId ? selected.facts.filter((fact) => fact.graphicId === graphicId) : [];
    inspectContent.replaceChildren();
    inspectContext.textContent = selected.label;
    inspectTitle.textContent = graphicId
      ? subjectLabels.get(graphicId) || label || entries[0]?.title || 'Selected graphic'
      : 'Inspect this diagram';
    const intro = document.createElement('p');
    intro.className = 'inspect-intro';
    intro.textContent = graphicId
      ? entries.length
        ? `${entries.length} selected meaning records. Open a record for its exact fields.`
        : 'This graphic has a selected source binding but no typed assertion in this Edition.'
      : 'Choose a component or relationship to read its selected meaning and source identity.';
    inspectContent.appendChild(intro);
    for (const [index, entry] of entries.entries()) {
      const details = document.createElement('details');
      details.open = index === 0;
      const summary = document.createElement('summary');
      summary.textContent = entry.title;
      details.appendChild(summary);
      const fields = document.createElement('dl');
      for (const fact of entry.facts) {
        const term = document.createElement('dt');
        const definition = document.createElement('dd');
        term.textContent = fact.label;
        definition.textContent = fact.value;
        fields.append(term, definition);
      }
      details.appendChild(fields);
      inspectContent.appendChild(details);
    }
    const sources = graphicId ? selected.subjectSources[graphicId] : selected.sourceIds;
    showBasis(sources);
    for (const button of inspectIndex.querySelectorAll('button'))
      button.setAttribute(
        'aria-current',
        button.dataset.graphicId === graphicId ? 'true' : 'false',
      );
  };
  const showIndex = () => {
    const selected = page();
    const factsByGraphic = new Map();
    for (const fact of selected.facts) {
      const previous = factsByGraphic.get(fact.graphicId);
      if (previous) previous.count += 1;
      else factsByGraphic.set(fact.graphicId, { count: 1, firstTitle: fact.title });
    }
    inspectIndex.replaceChildren();
    inspectEmpty.hidden = true;
    for (const graphicId of Object.keys(selected.subjectSources)) {
      const facts = factsByGraphic.get(graphicId);
      const count = facts?.count ?? 0;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.graphicId = graphicId;
      const title = document.createElement('strong');
      title.textContent = subjectLabels.get(graphicId) || facts?.firstTitle || graphicId;
      const detail = document.createElement('small');
      detail.textContent = `${count} selected ${count === 1 ? 'record' : 'records'}`;
      button.append(title, detail);
      button.addEventListener('click', () => showSelection(graphicId));
      inspectIndex.appendChild(button);
    }
  };
  const showInspector = (graphicId, label) => {
    if (graphicId && !Object.prototype.hasOwnProperty.call(page().subjectSources, graphicId))
      return false;
    returnToGraphic = graphicId ?? null;
    inspectSearch.value = '';
    showIndex();
    showSelection(graphicId ?? Object.keys(page().subjectSources)[0], label);
    inspector.hidden = false;
    main.dataset.reading = 'inspect';
    frame.inert = true;
    frame.setAttribute('aria-hidden', 'true');
    inspectToggle.setAttribute('aria-expanded', 'true');
    inspectBack.focus();
    return true;
  };
  const closeInspector = (restoreFocus = true) => {
    const graphicId = restoreFocus ? returnToGraphic : null;
    returnToGraphic = null;
    inspector.hidden = true;
    delete main.dataset.reading;
    frame.inert = false;
    frame.removeAttribute('aria-hidden');
    inspectToggle.setAttribute('aria-expanded', 'false');
    if (graphicId)
      frame.contentWindow.postMessage(
        { type: 'architecture-interactive:restore-focus', page: active, subject: graphicId },
        '*',
      );
    else if (restoreFocus) inspectToggle.focus();
  };
  const hydrate = (selected) => {
    const parsed = new DOMParser().parseFromString(rebuild(selected), 'text/html');
    const nodeLabels = new Map();
    for (const node of parsed.querySelectorAll('[data-node-id]')) {
      const id = node.getAttribute('data-node-id');
      const label = node.getAttribute('data-node-label');
      if (id && label && !nodeLabels.has(id)) nodeLabels.set(id, label);
    }
    subjectLabels = new Map(nodeLabels);
    for (const edge of parsed.querySelectorAll('[data-edge-id]')) {
      const id = edge.getAttribute('data-edge-id');
      if (!id || subjectLabels.has(id)) continue;
      const from = nodeLabels.get(edge.getAttribute('data-edge-from'));
      const to = nodeLabels.get(edge.getAttribute('data-edge-to'));
      if (from && to)
        subjectLabels.set(
          id,
          `${from} → ${to}${edge.getAttribute('data-edge-label') ? ` · ${edge.getAttribute('data-edge-label')}` : ''}`,
        );
    }
    parsed.documentElement.setAttribute('data-interactive-member', 'true');
    parsed.documentElement.setAttribute('data-theme', 'light');
    const style = parsed.createElement('style');
    style.textContent =
      'html[data-interactive-member]{height:100%;overflow:hidden}html[data-interactive-member] body{height:100%;min-height:0;padding:.65rem;background:#f3f0e8;overflow:hidden}html[data-interactive-member] .toolbar,html[data-interactive-member] .header,html[data-interactive-member] .no-print,html[data-interactive-member] .archify-toast{display:none!important}html[data-interactive-member] .container{height:100%;max-width:none;margin:0;padding:0}html[data-interactive-member] .diagram-container{display:flex;height:100%;min-height:0;margin:0;padding:.5rem;align-items:center;justify-content:center;overflow:hidden}html[data-interactive-member] .diagram-container>svg{width:100%;height:100%;max-height:100%;object-fit:contain}';
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
        const target=new URL(anchor.getAttribute('href'),'https://interactive.invalid/'+pagePath);
        const id=target.origin==='https://interactive.invalid'?pathToId[target.pathname.slice(1)]:null;
        if(!id)return;
        event.preventDefault();parent.postMessage({type:'architecture-interactive:navigate',page:id},'*');
      },true);
      function inspect(subject){const id=subject.getAttribute('data-node-id')||subject.getAttribute('data-edge-id');parent.postMessage({type:'architecture-interactive:inspect',page:page,subject:id,label:subject.getAttribute('data-node-label')||subject.getAttribute('data-edge-label')||id},'*');}
      document.addEventListener('dblclick',function(event){const subject=event.target.closest&&event.target.closest('[data-node-id],[data-edge-id]');if(subject)inspect(subject);},true);
      document.addEventListener('keydown',function(event){const subject=event.target.closest&&event.target.closest('[data-node-id],[data-edge-id]');if(subject&&(event.key==='i'||event.key==='I')){event.preventDefault();inspect(subject);}},true);
      window.addEventListener('message',function(event){
        const message=event.data;
        if(event.source!==parent||!message||message.type!=='architecture-interactive:restore-focus'||message.page!==page||typeof message.subject!=='string'||!/^[a-z][a-z0-9-]{0,79}$/.test(message.subject))return;
        const id=message.subject;
        const subject=document.querySelector('[data-node-id="'+id+'"][tabindex], [data-edge-id="'+id+'"][tabindex]');
        if(subject)subject.focus();
      });
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
    for (const button of document.querySelectorAll('[data-interactive-page]'))
      button.setAttribute('aria-current', button.dataset.interactivePage === id ? 'page' : 'false');
    if (id === active) return;
    if (!inspector.hidden) closeInspector(false);
    active = id;
    frame.srcdoc = hydrate(selected);
  };
  const navigate = (id) => {
    if (!Object.prototype.hasOwnProperty.call(data.pages, id)) return false;
    if (!inspector.hidden) closeInspector(false);
    setLocation(id, false);
    render();
    return true;
  };

  for (const button of document.querySelectorAll('[data-interactive-page]'))
    button.addEventListener('click', () => navigate(button.dataset.interactivePage));
  inspectToggle.addEventListener('click', () => {
    if (inspector.hidden) showInspector();
    else closeInspector();
  });
  inspectBack.addEventListener('click', () => closeInspector());
  inspectSearch.addEventListener('input', () => {
    const query = inspectSearch.value.trim().toLocaleLowerCase();
    let matches = 0;
    for (const button of inspectIndex.querySelectorAll('button')) {
      button.hidden = !button.textContent.toLocaleLowerCase().includes(query);
      if (!button.hidden) matches += 1;
    }
    inspectEmpty.hidden = matches !== 0;
  });
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !inspector.hidden) {
      event.preventDefault();
      closeInspector();
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
    if (event.data.type === 'architecture-interactive:navigate') navigate(event.data.page);
    if (
      event.data.type === 'architecture-interactive:inspect' &&
      event.data.page === active &&
      typeof event.data.subject === 'string' &&
      /^[a-z][a-z0-9-]{0,79}$/.test(event.data.subject)
    ) {
      showInspector(
        event.data.subject,
        typeof event.data.label === 'string' && event.data.label.length <= 160
          ? event.data.label
          : undefined,
      );
    }
  });
  addEventListener('hashchange', render);
  window.__architectureInteractive = {
    navigate,
    active: () => active,
    pageIds: () => data.order.slice(),
    frame: () => frame.contentWindow,
    openInspect: (graphicId) => showInspector(graphicId),
    closeInspect: closeInspector,
  };
  try {
    if (!location.hash) setLocation(data.overview, true);
    render();
  } catch (cause) {
    error.hidden = false;
    error.textContent = 'The interactive architecture could not open: ' + cause.message;
    frame.hidden = true;
  }
}

function shell(input, data) {
  const contentPolicy = [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    'font-src data:',
    'img-src data: blob:',
    'media-src data: blob:',
    "connect-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    'worker-src blob:',
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  const navigation = input.pages
    .map(
      (page) =>
        `<button type="button" data-interactive-page="${escapeHtml(page.id)}">${escapeHtml(page.shortLabel)}</button>`,
    )
    .join('\n');
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${contentPolicy}"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>${escapeHtml(input.title)} — Interactive architecture</title><style>
:root { color-scheme: light; --paper: #f3f0e8; --panel: #faf8f2; --ink: #26362f; --muted: #58675e; --rule: #c8c7bb; --accent: #456a59; }
* { box-sizing: border-box; }
html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: var(--paper); color: var(--ink); font-family: system-ui, -apple-system, sans-serif; }
body { display: grid; grid-template-rows: auto minmax(0, 1fr); }
header { display: grid; grid-template-columns: minmax(13rem, 1fr) minmax(0, 4fr) auto; align-items: center; gap: 1rem; padding: .72rem 1rem; border-bottom: 1px solid var(--rule); background: color-mix(in srgb, var(--panel) 94%, transparent); }
.identity { min-width: 0; }
.identity strong { display: block; font: 600 clamp(.82rem, 1.2vw, 1rem)/1.25 system-ui, sans-serif; letter-spacing: .01em; }
.identity small, #interactive-page-label { color: var(--muted); font-size: .68rem; }
.chapters { display: flex; min-width: 0; gap: .34rem; overflow-x: auto; scrollbar-width: thin; padding: .1rem; }
.chapters button, #interactive-inspect, #interactive-inspect-back, #interactive-inspect-index button { border: 1px solid transparent; background: transparent; color: var(--muted); font: 600 .74rem/1.3 system-ui, sans-serif; cursor: pointer; }
.chapters button { white-space: nowrap; padding: .42rem .58rem; border-radius: .35rem; }
.chapters button:hover, .chapters button[aria-current="page"] { border-color: var(--rule); background: var(--panel); color: var(--ink); }
.actions { display: flex; align-items: center; }
#interactive-inspect, #interactive-inspect-back { padding: .5rem .75rem; border-color: var(--rule); border-radius: .35rem; color: var(--accent); background: var(--panel); }
button:focus-visible, input:focus-visible, summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
main { position: relative; min-height: 0; }
iframe { display: block; width: 100%; height: 100%; border: 0; background: var(--paper); }
main[data-reading="inspect"] iframe { visibility: hidden; pointer-events: none; }
#interactive-error { margin: 2rem; padding: 1rem; border-left: 3px solid #8b443c; background: var(--panel); }
[hidden] { display: none !important; }
#interactive-inspector { position: absolute; inset: 0; z-index: 2; overflow: auto; padding: clamp(1.25rem, 2.7vw, 2.6rem); background: var(--paper); }
.inspect-shell { max-width: 1320px; margin: 0 auto; }
.inspect-head { display: flex; align-items: start; justify-content: space-between; gap: 2rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--rule); }
.inspect-head p { margin: 0; color: var(--muted); font-size: .78rem; line-height: 1.5; }
.inspect-head h1 { margin: .22rem 0 .35rem; font: 600 clamp(1.4rem, 2.3vw, 2.1rem)/1.18 system-ui, sans-serif; letter-spacing: -.02em; }
.inspect-head .inspect-eyebrow { color: var(--accent); font: 600 .68rem/1.2 system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
#interactive-inspect-back { white-space: nowrap; }
.inspect-layout { display: grid; grid-template-columns: minmax(15rem, 20rem) minmax(0, 1fr); gap: clamp(1.5rem, 4vw, 4rem); align-items: start; padding-top: 1.5rem; }
.inspect-navigation, .inspect-reading { min-width: 0; }
.inspect-navigation label { display: block; margin: 0 0 .55rem; color: var(--muted); font-size: .72rem; font-weight: 600; }
#interactive-inspect-search { display: block; width: 100%; min-height: 2.4rem; margin-bottom: .8rem; padding: .45rem .65rem; border: 1px solid var(--rule); border-radius: .35rem; background: var(--panel); color: var(--ink); font: .82rem/1.35 system-ui, sans-serif; }
#interactive-inspect-index { display: grid; gap: .3rem; max-height: calc(100vh - 17rem); overflow: auto; padding: .1rem .2rem .1rem .1rem; }
#interactive-inspect-index button { display: grid; gap: .18rem; width: 100%; padding: .7rem .75rem; border-color: var(--rule); border-radius: .35rem; text-align: left; background: var(--panel); }
#interactive-inspect-index button:hover, #interactive-inspect-index button[aria-current="true"] { border-color: var(--accent); background: #ebf0e9; color: var(--ink); }
#interactive-inspect-index strong { font-size: .78rem; font-weight: 600; line-height: 1.4; }
#interactive-inspect-index small { color: var(--muted); font-size: .67rem; }
#interactive-inspect-empty { margin: .7rem 0 0; color: var(--muted); font-size: .78rem; }
#interactive-inspect-content { display: grid; align-content: start; gap: .55rem; }
.inspect-intro { margin: 0 0 .55rem; max-width: 65ch; color: var(--muted); font-size: .86rem; line-height: 1.55; }
#interactive-inspect-content details, #interactive-inspect-basis details { min-width: 0; border: 1px solid var(--rule); border-radius: .4rem; background: var(--panel); }
#interactive-inspect-content summary, #interactive-inspect-basis summary { padding: .75rem .9rem; color: var(--ink); font-size: .82rem; font-weight: 600; line-height: 1.4; cursor: pointer; }
#interactive-inspect-content details[open] summary, #interactive-inspect-basis details[open] summary { border-bottom: 1px solid var(--rule); }
#interactive-inspect-content dl, #interactive-inspect-basis dl { display: grid; grid-template-columns: minmax(9rem, .7fr) minmax(0, 1.3fr); gap: .5rem 1rem; margin: 0; padding: .85rem .9rem 1rem; }
#interactive-inspect-content dt, #interactive-inspect-basis dt { color: var(--muted); font-size: .72rem; line-height: 1.45; }
#interactive-inspect-content dd, #interactive-inspect-basis dd { min-width: 0; margin: 0; overflow-wrap: anywhere; font-size: .78rem; line-height: 1.45; }
#interactive-inspect-basis { margin: 0 0 1.2rem; }
#interactive-inspect-basis p { margin: 0; padding: .75rem .9rem 0; color: var(--muted); font-size: .76rem; line-height: 1.5; }
#interactive-inspect-basis dl + dl { border-top: 1px solid var(--rule); }
@media (max-width: 900px) { header { grid-template-columns: 1fr auto; } .chapters { grid-column: 1 / -1; grid-row: 2; } .identity small { display: none; } .inspect-layout { grid-template-columns: minmax(0, 1fr); } #interactive-inspect-index { grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); max-height: none; overflow: visible; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; animation: none !important; transition: none !important; } }
</style></head><body><header><div class="identity"><strong>${escapeHtml(input.title)}</strong><small id="interactive-page-label"></small></div><nav class="chapters" aria-label="Interactive chapters">${navigation}</nav><div class="actions"><button id="interactive-inspect" type="button" aria-expanded="false" aria-controls="interactive-inspector">Inspect</button></div></header><main id="interactive-main"><p id="interactive-error" hidden></p><iframe id="interactive-frame" title="${escapeHtml(input.title)} interactive architecture" sandbox="allow-scripts allow-downloads"></iframe><section id="interactive-inspector" hidden aria-labelledby="interactive-inspect-title"><div class="inspect-shell"><div class="inspect-head"><div><p class="inspect-eyebrow">Selected meaning</p><h1 id="interactive-inspect-title">Inspect this diagram</h1><p id="interactive-inspect-context"></p></div><button id="interactive-inspect-back" type="button">Back to diagram</button></div><div class="inspect-layout"><div class="inspect-navigation"><label for="interactive-inspect-search">Find a component or relationship</label><input id="interactive-inspect-search" type="search" autocomplete="off"><nav id="interactive-inspect-index" aria-label="Diagram subjects"></nav><p id="interactive-inspect-empty" hidden>No matching subject.</p></div><div class="inspect-reading"><div id="interactive-inspect-basis"></div><div id="interactive-inspect-content"></div></div></div></div></section></main><noscript>This interactive architecture requires JavaScript for navigation and inspection; source files are not embedded.</noscript><script id="architecture-interactive-data" type="application/json">${scriptJson(data)}</script><script>(${interactiveReader.toString()})();</script></body></html>\n`;
}

function composeDocument(input) {
  if (
    !exact(input, ['schema', 'title', 'build', 'overview', 'pages', 'sources', 'state']) ||
    input.schema !== 'architecture.interactive-html-composition/v1' ||
    !exact(input.build, ['lockSha256', 'editionSha256', 'semanticDigest']) ||
    !Object.values(input.build).every(isDigest) ||
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
    fail('interactive_html_composition_invalid');

  const sources = {};
  const namespaces = new Set();
  for (const source of input.sources) {
    if (
      !exact(source, ['id', 'kind', 'namespace', 'sha256', 'claimant']) ||
      !identifier(source.id) ||
      Object.hasOwn(sources, source.id) ||
      !['native', 'derived'].includes(source.kind) ||
      !text(source.namespace) ||
      namespaces.has(source.namespace) ||
      !isDigest(source.sha256) ||
      !text(source.claimant)
    )
      fail('interactive_html_source_invalid');
    namespaces.add(source.namespace);
    sources[source.id] = {
      kind: source.kind,
      namespace: source.namespace,
      sha256: source.sha256,
      claimant: source.claimant,
    };
  }
  const ids = new Set();
  const paths = new Set();
  const blocks = [];
  const shared = new Map();
  const pages = {};
  let total = 0;
  for (const page of input.pages) {
    const nodeSources = validatePage(page, ids, paths, sources);
    total += page.content.length + Buffer.byteLength(JSON.stringify(page.facts));
    if (total > LIMITS.totalBytes) fail('interactive_html_size_exceeded');
    pages[page.id] = {
      id: page.id,
      label: page.label,
      shortLabel: page.shortLabel,
      purpose: page.purpose,
      path: page.path,
      sha256: page.sha256,
      sourceIds: [...page.sourceIds],
      subjectSources: nodeSources,
      facts: structuredClone(page.facts),
      pieces: pagePieces(page.content, shared, blocks),
    };
  }
  if (!Object.hasOwn(pages, input.overview)) fail('interactive_html_overview_missing');
  if (pages[input.overview].purpose !== 'overview') fail('interactive_html_overview_invalid');
  if (Object.values(pages).filter(({ purpose }) => purpose === 'overview').length !== 1)
    fail('interactive_html_overview_invalid');

  for (const page of Object.values(pages)) {
    const source = page.pieces
      .map((piece) => (typeof piece === 'number' ? blocks[piece] : piece))
      .join('');
    for (const match of source.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
      const href = match[1];
      if (/^(?:#|mailto:|https?:)/i.test(href)) continue;
      const resolved = new URL(href, `https://interactive.invalid/${page.path}`);
      if (
        resolved.origin === 'https://interactive.invalid' &&
        resolved.pathname.endsWith('.html') &&
        !Object.values(pages).some((candidate) => candidate.path === resolved.pathname.slice(1))
      )
        fail('interactive_html_navigation_target_missing');
    }
  }
  const data = {
    schema: 'architecture.interactive-html/v1',
    title: input.title,
    build: structuredClone(input.build),
    overview: input.overview,
    order: input.pages.map(({ id }) => id),
    pages,
    blocks,
    sources,
    state: structuredClone(input.state),
  };
  return Buffer.from(shell(input, data));
}

/** Pack checked pages and selected public facts without embedding source files. */
export function composeInteractiveHtml(input) {
  return composeDocument(input);
}
