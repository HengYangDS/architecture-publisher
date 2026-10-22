export function interactiveReader(
  canonical,
  fieldList,
  identity,
  sourceController,
  bindGraphics,
  scriptJson,
) {
  "use strict";
  const payload = globalThis.document.getElementById("architecture-interactive-data");
  const data = JSON.parse(payload.textContent);
  let frame = globalThis.document.getElementById("interactive-frame");
  const pageLabel = globalThis.document.getElementById("interactive-page-label");
  const main = globalThis.document.getElementById("interactive-main");
  const inspector = globalThis.document.getElementById("interactive-inspector");
  const inspectTitle = globalThis.document.getElementById("interactive-inspect-title");
  const inspectContext = globalThis.document.getElementById("interactive-inspect-context");
  const inspectSearch = globalThis.document.getElementById("interactive-inspect-search");
  const inspectIndex = globalThis.document.getElementById("interactive-inspect-index");
  const inspectEmpty = globalThis.document.getElementById("interactive-inspect-empty");
  const inspectContent = globalThis.document.getElementById("interactive-inspect-content");
  const inspectIntro = globalThis.document.getElementById("interactive-inspect-intro");
  const inspectDescription = globalThis.document.getElementById("interactive-inspect-description");
  const inspectReading = globalThis.document.querySelector(".inspect-reading-scroll");
  const inspectBasis = globalThis.document.getElementById("interactive-inspect-basis");
  const inspectToggle = globalThis.document.getElementById("interactive-inspect");
  const inspectBack = globalThis.document.getElementById("interactive-inspect-back");
  const error = globalThis.document.getElementById("interactive-error");
  let active = null;
  let activeReading = null;
  let subjectLabels = new Map();
  let subjectDescriptions = new Map();
  let returnToGraphic = null;
  const referenceKinds = new Map([
    ["entity", "Entity"],
    ["relation", "Relationship"],
    ["claim", "Claim"],
    ["editorial", "Editorial statement"],
  ]);
  const referenceKind = (entry) => JSON.parse(entry.reference)[1];
  const declarationTitle = (graphicId, fallback) =>
    page().facts.find((entry) => entry.graphicId === graphicId)?.title || fallback;

  const selectedId = () => {
    try {
      const value = new URL(globalThis.location.href).hash.match(/^#page=([^&]+)/)?.[1];
      const decoded = value ? decodeURIComponent(value) : data.overview;
      return Object.prototype.hasOwnProperty.call(data.pages, decoded) ? decoded : data.overview;
    } catch {
      return data.overview;
    }
  };
  const readingHash = () => {
    const value = new URLSearchParams(globalThis.location.hash.slice(1)).get("reader") || "";
    return value.length <= 2048 ? value : "";
  };
  const page = () => data.pages[selectedId()];
  const rebuild = (selected) =>
    selected.pieces
      .map((piece) => (typeof piece === "number" ? data.blocks[piece] : piece))
      .join("");
  const sourceReading = sourceController(data, scriptJson);
  const setLocation = (id, replace) => {
    const url = new URL(globalThis.location.href);
    url.searchParams.delete("relationships");
    url.searchParams.delete("relationshipsScope");
    url.hash = "page=" + encodeURIComponent(id);
    globalThis.history[replace ? "replaceState" : "pushState"](null, "", url);
  };
  const showBasis = (sourceIds, editorial = !sourceIds.length) => {
    inspectBasis.replaceChildren();
    inspectBasis.appendChild(identity(data, sourceIds, editorial));
  };
  const showSelection = (graphicId, label) => {
    const selected = page();
    const entries = graphicId ? selected.facts.filter((fact) => fact.graphicId === graphicId) : [];
    sourceReading.close();
    inspectContent.replaceChildren();
    inspectContext.textContent = selected.label;
    inspectTitle.textContent = graphicId
      ? subjectLabels.get(graphicId) || label || entries[0]?.title || "Selected graphic"
      : "Inspect this diagram";
    inspectDescription.replaceChildren();
    const descriptions = subjectDescriptions.get(graphicId) ?? [];
    if (descriptions.length) {
      const heading = globalThis.document.createElement("h2");
      heading.textContent = "Diagram text";
      inspectDescription.appendChild(heading);
    }
    for (const description of descriptions) {
      const paragraph = globalThis.document.createElement("p");
      paragraph.textContent = description;
      inspectDescription.appendChild(paragraph);
    }
    inspectDescription.hidden = !inspectDescription.childElementCount;
    inspectIntro.textContent = graphicId
      ? entries.length
        ? "Selected declarations are grouped by type. Their presence is not acceptance."
        : "This graphic has a selected source binding but no typed assertion in this Edition."
      : "Choose a graphic or statement to read its selected meaning and attribution.";
    for (const [kind, label] of referenceKinds) {
      const members = entries.filter((entry) => referenceKind(entry) === kind);
      if (!members.length) continue;
      const group = globalThis.document.createElement("section");
      group.dataset.referenceKind = kind;
      const heading = globalThis.document.createElement("h2");
      heading.textContent = label;
      group.appendChild(heading);
      for (const entry of members) {
        const details = globalThis.document.createElement("details");
        details.open = members.length === 1;
        const summary = globalThis.document.createElement("summary");
        summary.textContent = entry.title;
        details.append(summary, fieldList(entry.facts));
        const diagram = sourceReading.build(selected, entry, graphicId);
        if (diagram) details.appendChild(diagram);
        group.appendChild(details);
      }
      inspectContent.appendChild(group);
    }
    const sources = graphicId ? selected.subjectSources[graphicId] : selected.sourceIds;
    showBasis(
      sources,
      !sources.length || entries.some((entry) => referenceKind(entry) === "editorial"),
    );
    inspectReading.scrollTop = 0;
    for (const button of inspectIndex.querySelectorAll("button")) {
      button.setAttribute(
        "aria-current",
        button.dataset.graphicId === graphicId ? "true" : "false",
      );
      if (!inspector.hidden && button.dataset.graphicId === graphicId)
        button.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };
  const showIndex = () => {
    const selected = page();
    const factsByGraphic = new Map();
    for (const fact of selected.facts) {
      const searchText = [fact.title, ...fact.facts.flatMap(({ label, value }) => [label, value])];
      const previous = factsByGraphic.get(fact.graphicId);
      if (previous) {
        previous.kinds.add(referenceKind(fact));
        previous.searchText.push(...searchText);
      } else
        factsByGraphic.set(fact.graphicId, {
          kinds: new Set([referenceKind(fact)]),
          firstTitle: fact.title,
          searchText,
        });
    }
    inspectIndex.replaceChildren();
    inspectEmpty.hidden = true;
    for (const graphicId of Object.keys(selected.subjectSources)) {
      const facts = factsByGraphic.get(graphicId);
      const button = globalThis.document.createElement("button");
      button.type = "button";
      button.dataset.graphicId = graphicId;
      button.setAttribute("aria-controls", "interactive-inspect-content");
      const title = globalThis.document.createElement("strong");
      title.textContent = subjectLabels.get(graphicId) || facts?.firstTitle || graphicId;
      const detail = globalThis.document.createElement("small");
      detail.textContent =
        [...referenceKinds]
          .filter(([kind]) => facts?.kinds.has(kind))
          .map(([, label]) => label)
          .join(" · ") || "Selected source binding";
      button.dataset.searchText = [
        graphicId,
        title.textContent,
        detail.textContent,
        ...(facts?.searchText ?? []),
      ]
        .join("\n")
        .toLocaleLowerCase();
      button.append(title, detail);
      button.addEventListener("click", () => showSelection(graphicId));
      inspectIndex.appendChild(button);
    }
    inspectIndex.appendChild(inspectEmpty);
    inspectIndex.scrollTop = 0;
  };
  const showInspector = (graphicId, label) => {
    if (graphicId && !Object.prototype.hasOwnProperty.call(page().subjectSources, graphicId))
      return false;
    returnToGraphic = graphicId ?? null;
    inspectSearch.value = "";
    showIndex();
    showSelection(graphicId ?? Object.keys(page().subjectSources)[0], label);
    inspector.hidden = false;
    inspectIndex.scrollTop = 0;
    inspectReading.scrollTop = 0;
    main.dataset.reading = "inspect";
    frame.inert = true;
    frame.setAttribute("aria-hidden", "true");
    inspectToggle.setAttribute("aria-expanded", "true");
    inspectIndex
      .querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    inspectBack.focus();
    return true;
  };
  const closeInspector = (restoreFocus = true) => {
    sourceReading.close(restoreFocus);
    const graphicId = restoreFocus ? returnToGraphic : null;
    returnToGraphic = null;
    inspector.hidden = true;
    delete main.dataset.reading;
    frame.inert = false;
    frame.removeAttribute("aria-hidden");
    inspectToggle.setAttribute("aria-expanded", "false");
    if (graphicId)
      frame.contentWindow.postMessage(
        {
          type: "architecture-interactive:restore-focus",
          page: active,
          subject: graphicId,
        },
        "*",
      );
    else if (restoreFocus) inspectToggle.focus();
  };
  const hydrate = (selected) => {
    const parsed = new globalThis.DOMParser().parseFromString(rebuild(selected), "text/html");
    subjectDescriptions = new Map();
    const bindInspect = (element, id, label) => {
      const previous = element.getAttribute("data-inspect-id");
      if (previous && previous !== id) throw new Error("Graphic identity mismatch");
      element.setAttribute("data-inspect-id", id);
      if (label) element.setAttribute("data-inspect-label", label);
    };
    const nodeLabels = new Map();
    bindGraphics(parsed, selected, bindInspect);
    for (const node of parsed.querySelectorAll("[data-node-id],g[data-inspect-id]")) {
      const id = node.getAttribute("data-node-id") || node.getAttribute("data-inspect-id");
      const label = node.getAttribute("data-inspect-label") || node.getAttribute("data-node-label");
      if (id) bindInspect(node, id, label);
      if (id && label && !nodeLabels.has(id)) nodeLabels.set(id, label);
      if (id && !subjectDescriptions.has(id))
        subjectDescriptions.set(
          id,
          ["data-node-sublabel", "data-node-tag", "data-node-context"]
            .map((attribute) => node.getAttribute(attribute))
            .filter((value) => typeof value === "string" && value.trim()),
        );
    }
    subjectLabels = new Map(nodeLabels);
    for (const text of parsed.querySelectorAll("[data-text-id]")) {
      const id = text.getAttribute("data-text-id");
      if (id) {
        const label = text.getAttribute("data-text-label") || text.textContent;
        bindInspect(text, id, label);
        subjectLabels.set(id, declarationTitle(id, label));
      }
    }
    for (const item of parsed.querySelectorAll("[data-note-id]")) {
      const id = item.getAttribute("data-note-id");
      const label = item.getAttribute("data-note-label") || item.textContent;
      bindInspect(item, id, label);
      subjectLabels.set(id, declarationTitle(id, label));
    }
    for (const edge of parsed.querySelectorAll("[data-edge-id]")) {
      const id = edge.getAttribute("data-edge-id");
      if (!id) continue;
      bindInspect(edge, id, edge.getAttribute("data-edge-label"));
      if (subjectLabels.has(id)) continue;
      const from = nodeLabels.get(edge.getAttribute("data-edge-from"));
      const to = nodeLabels.get(edge.getAttribute("data-edge-to"));
      if (from && to)
        subjectLabels.set(
          id,
          `${from} → ${to}${edge.getAttribute("data-edge-label") ? ` · ${edge.getAttribute("data-edge-label")}` : ""}`,
        );
    }
    const publicationUri = new URL(globalThis.location.href);
    publicationUri.hash = "page=" + encodeURIComponent(selected.id) + "&reader={state}";
    parsed.documentElement.setAttribute("data-reading-link-template", publicationUri.href);
    if (readingHash()) {
      const addressed = parsed.createElement("script");
      addressed.textContent =
        'location.replace(location.href.replace(/#.*$/,"")+"#"+' +
        JSON.stringify(readingHash()).replaceAll("<", "\\u003c") +
        ");";
      parsed.head.appendChild(addressed);
    }
    parsed.documentElement.setAttribute("data-interactive-member", selected.id);
    for (const property of ["style", "theme"]) {
      const value = globalThis.document.documentElement.dataset[property];
      parsed.documentElement.setAttribute(`data-${property}`, value);
      parsed.documentElement.setAttribute(`data-appearance-${property}`, value);
    }
    if (selected.nativeReader === "archify/v1") {
      // The native reader budgets its own header, not host-flow siblings.
      // Reuse that chrome region for the toolbar while the host owns titles.
      const nativeHeader = parsed.querySelector(".container > .header");
      const nativeToolbar = parsed.querySelector(".toolbar");
      if (nativeHeader && nativeToolbar) nativeHeader.appendChild(nativeToolbar);
      const preference = parsed.createElement("script");
      preference.textContent =
        '(() => { const url = new URL(location.href); url.searchParams.set("theme", document.documentElement.dataset.appearanceTheme); history.replaceState(null, "", url.href); })();';
      parsed.head.prepend(preference);
    }
    const style = parsed.createElement("style");
    style.textContent =
      'html[data-interactive-member]{min-height:100%}html[data-interactive-member] body{min-height:100%;padding:.65rem;background:var(--bg)}html[data-interactive-member] .header{display:none!important}html[data-interactive-member] .container{max-width:none;margin:0;padding:0}html[data-interactive-member]:not([data-present="true"]){height:auto;overflow:auto}html[data-interactive-member]:not([data-present="true"]) body{height:auto;display:block;overflow:auto}html[data-interactive-member]:not([data-present="true"]) .toolbar{position:relative;inset:auto;width:fit-content;max-width:100%;margin:0 0 .6rem auto}html[data-interactive-member]:not([data-present="true"]) .container{height:auto;display:block;width:100%;max-width:var(--archify-reader-width,1440px);margin:0 auto}html[data-interactive-member]:not([data-present="true"]) .diagram-container{height:auto;display:block;overflow:hidden;margin:0;padding:.5rem .5rem calc(.5rem + var(--archify-nav-reserve,0px))}html[data-interactive-member]:not([data-present="true"]) .diagram-container>svg{display:block;width:100%;height:auto;max-height:none}html[data-interactive-member]:not([data-present="true"]) .publication-query-limit{margin:.5rem 0 0}';
    if (selected.nativeReader !== "archify/v1") {
      const svg = parsed.querySelector(".diagram-container > svg");
      const viewBox = svg?.getAttribute("viewBox")?.trim().split(/\s+/).map(Number);
      const valid = viewBox?.length === 4 && viewBox.every(Number.isFinite);
      if (valid && Math.min(viewBox[2], viewBox[3]) > 0) {
        const minimum = Number(svg.getAttribute("data-reader-min-text"));
        const primary = Number(svg.getAttribute("data-reader-primary-text"));
        let minimumScale = 0;
        for (const text of svg.querySelectorAll("text")) {
          const fontSize = Number(text.getAttribute("font-size"));
          if (!(fontSize > 0)) continue;
          const target =
            text.hasAttribute("data-node-label") || text.hasAttribute("data-boundary-label")
              ? Math.max(minimum, primary)
              : minimum;
          if (Number.isFinite(target) && target > 0)
            minimumScale = Math.max(minimumScale, target / fontSize);
        }
        const readingWidth = Math.ceil(viewBox[2] * Math.min(1, minimumScale));
        // Reserve embedded body/diagram padding; keep tall text-readable figures scrollable.
        style.textContent += `html[data-interactive-member]:not([data-present="true"]) .diagram-container>svg{width:min(100%,max(${readingWidth}px,calc((100svh - 2.4rem) * ${viewBox[2] / viewBox[3]})));height:auto;max-height:none;margin-inline:auto}`;
      }
    }
    if (selected.nativeReader === "archify/v1")
      style.textContent =
        'html[data-interactive-member]{min-height:100%}html[data-interactive-member] body{min-height:100%;padding:.65rem;background:var(--bg)}html[data-interactive-member] .header{display:block;min-height:0;margin:0 0 .6rem;padding:0}html[data-interactive-member] .header>:not(.toolbar){display:none}html[data-interactive-member]:not([data-present="true"]) .toolbar{position:relative;inset:auto;width:fit-content;max-width:100%;margin:0 0 0 auto}html[data-interactive-member]:not([data-present="true"]) .container{margin:0 auto;padding:0}html[data-interactive-member]:not([data-present="true"]) .publication-query-limit{margin:.5rem 0 0}';
    parsed.head.appendChild(style);
    const appearanceScript = parsed.createElement("script");
    appearanceScript.textContent = data.appearanceScript;
    parsed.body.appendChild(appearanceScript);
    for (const script of parsed.scripts) {
      if (script.src) throw new Error("External script is not embedded");
    }
    const pathToId = Object.fromEntries(
      Object.entries(data.pages).map(([id, candidate]) => [candidate.path, id]),
    );
    const bridge = parsed.createElement("script");
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
      function inspect(subject){const id=subject.getAttribute('data-inspect-id');parent.postMessage({type:'architecture-interactive:inspect',page:page,subject:id,label:subject.getAttribute('data-inspect-label')||id},'*');}
      let pointerOrigin=null;
      document.addEventListener('click',function(event){
        const subject=event.target.closest&&event.target.closest('[data-inspect-id]');
        if(event.detail===1)pointerOrigin=subject?{subject:subject,x:event.clientX,y:event.clientY}:null;
        else if(event.detail!==2||!pointerOrigin||event.clientX!==pointerOrigin.x||event.clientY!==pointerOrigin.y)pointerOrigin=null;
        if(subject&&subject.hasAttribute('data-note-id')){event.preventDefault();inspect(subject);}
      },true);
      // Native focus may move the drawing between clicks; inspect the initiating occurrence.
      document.addEventListener('dblclick',function(event){const subject=pointerOrigin&&event.clientX===pointerOrigin.x&&event.clientY===pointerOrigin.y?pointerOrigin.subject:event.target.closest&&event.target.closest('[data-inspect-id]');pointerOrigin=null;if(subject)inspect(subject);},true);
      document.addEventListener('keydown',function(event){const subject=event.target.closest&&event.target.closest('[data-inspect-id]');if(subject&&(event.key==='i'||event.key==='I'||(!subject.hasAttribute('data-node-id')&&(event.key==='Enter'||event.key===' ')))){event.preventDefault();inspect(subject);}},true);
      window.addEventListener('message',function(event){
        const message=event.data;
        if(event.source!==parent||!message||message.type!=='architecture-interactive:restore-focus'||message.page!==page||typeof message.subject!=='string'||!/^[a-z][a-z0-9-]{0,79}$/.test(message.subject))return;
        const id=message.subject;
        const subject=document.querySelector('[data-inspect-id="'+id+'"][tabindex]');
        if(subject)subject.focus();
      });
    })();`;
    parsed.body.appendChild(bridge);
    return "<!DOCTYPE html>\n" + parsed.documentElement.outerHTML;
  };
  const render = () => {
    const id = selectedId();
    const selected = data.pages[id];
    error.hidden = true;
    frame.hidden = false;
    pageLabel.textContent = selected.label;
    for (const button of globalThis.document.querySelectorAll("[data-interactive-page]"))
      button.setAttribute("aria-current", button.dataset.interactivePage === id ? "page" : "false");
    const reading = readingHash();
    if (id === active && reading === activeReading) {
      sourceReading.restore(showInspector);
      return;
    }
    if (!inspector.hidden) closeInspector(false);
    active = id;
    activeReading = reading;
    const successor = frame.cloneNode(false);
    successor.dataset.page = id;
    successor.title = selected.label;
    successor.srcdoc = hydrate(selected);
    frame.replaceWith(successor);
    frame = successor;
    sourceReading.restore(showInspector);
  };
  const navigate = (id) => {
    if (!Object.prototype.hasOwnProperty.call(data.pages, id)) return false;
    if (!inspector.hidden) closeInspector(false);
    setLocation(id, false);
    render();
    return true;
  };

  for (const button of globalThis.document.querySelectorAll("[data-interactive-page]"))
    button.addEventListener("click", () => navigate(button.dataset.interactivePage));
  inspectToggle.addEventListener("click", () => {
    if (inspector.hidden) showInspector();
    else closeInspector();
  });
  inspectBack.addEventListener("click", () => closeInspector());
  inspectSearch.addEventListener("input", () => {
    const query = inspectSearch.value.trim().toLocaleLowerCase();
    let matches = 0;
    for (const button of inspectIndex.querySelectorAll("button")) {
      button.hidden = !button.dataset.searchText.includes(query);
      if (!button.hidden) matches += 1;
    }
    inspectEmpty.hidden = matches !== 0;
    inspectIndex.scrollTop = 0;
  });
  globalThis.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !inspector.hidden &&
      !event.defaultPrevented &&
      !event
        .composedPath()
        .some(
          (element) =>
            element instanceof globalThis.Element &&
            element.matches('dialog[open], [role="dialog"][aria-modal="true"]'),
        )
    ) {
      event.preventDefault();
      closeInspector();
    }
  });
  globalThis.addEventListener("message", (event) => {
    if (
      event.source !== frame.contentWindow ||
      !event.data ||
      typeof event.data !== "object" ||
      Array.isArray(event.data)
    )
      return;
    if (event.data.type === "architecture-interactive:navigate") navigate(event.data.page);
    if (
      event.data.type === "architecture-interactive:inspect" &&
      event.data.page === active &&
      typeof event.data.subject === "string" &&
      /^[a-z][a-z0-9-]{0,79}$/.test(event.data.subject)
    ) {
      showInspector(
        event.data.subject,
        typeof event.data.label === "string" && event.data.label.length <= 160
          ? event.data.label
          : undefined,
      );
    }
  });
  globalThis.addEventListener("popstate", render);
  globalThis.addEventListener("hashchange", render);
  globalThis.window.__architectureInteractive = {
    navigate,
    active: () => active,
    pageIds: () => data.order.slice(),
    frame: () => frame.contentWindow,
    openInspect: (graphicId) => showInspector(graphicId),
    closeInspect: closeInspector,
  };
  try {
    if (!globalThis.location.hash) setLocation(data.overview, true);
    render();
  } catch (cause) {
    error.hidden = false;
    error.textContent = "The interactive architecture could not open: " + cause.message;
    frame.hidden = true;
  }
}
