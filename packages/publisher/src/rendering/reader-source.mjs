/** Display checked native pages; the host treats native query state as opaque. */
export function sourceReadingController(data, scriptJson) {
  /** Give native semantic focus its measured reading aperture inside the host pane. */
  function sourceReadingAperture() {
    const svg = globalThis.document.querySelector(".diagram-container > svg");
    let frame = null;
    const reveal = () => {
      frame = null;
      const native = globalThis.Archify;
      const active = native?.focus?.active();
      if (typeof active !== "string" || native.view.state().mode !== "semantic") return;
      const title = [...svg.querySelectorAll("g[data-node-id]")]
        .find((node) => node.dataset.nodeId === active)
        ?.querySelector("text[data-node-label]");
      const matrix = title?.getScreenCTM();
      const minimum = Number(svg.getAttribute("data-reader-primary-text"));
      const size = Number(title?.getAttribute("font-size")) * (matrix?.a ?? 0);
      if (!(size > 0) || !(minimum > 0) || size >= minimum) return;
      native.view.reveal([active], {
        includeNeighbors: false,
        maxScale: (minimum / size) * native.view.state().scale + 0.01,
        instant: true,
        reason: "source-reading-aperture",
      });
    };
    const schedule = () => {
      if (frame === null) frame = globalThis.requestAnimationFrame(reveal);
    };
    for (const event of ["load", "hashchange", "resize", "click", "keydown"])
      globalThis.addEventListener(event, schedule);
    new globalThis.ResizeObserver(schedule).observe(svg);
  }

  let selected = null;
  const fields = ["inspect", "source", "edition", "meaning", "sourceReader"];
  const clearAddress = () => {
    const url = new URL(globalThis.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    for (const field of fields) hash.delete(field);
    url.hash = hash.toString();
    globalThis.history.replaceState(null, "", url);
  };
  const readAddress = () => {
    const hash = new URLSearchParams(globalThis.location.hash.slice(1));
    if (
      !data.sourceReading ||
      [...fields, "page"].some((field) => hash.getAll(field).length !== 1) ||
      hash.get("edition") !== data.build.editionSha256 ||
      hash.get("meaning") !== data.build.semanticDigest
    )
      return null;
    const pageId = hash.get("page"),
      reference = hash.get("source"),
      graphicId = hash.get("inspect");
    const page = data.sourceReading.projection.pages.find((item) => item.id === pageId);
    const native = data.sourceReading.pages[pageId],
      state = hash.get("sourceReader");
    if (
      !native?.bindings[reference] ||
      !state ||
      state.length > 2048 ||
      !page?.occurrences.some(
        (item) => item.reference === reference && item.graphicIds.includes(graphicId),
      ) ||
      !data.pages[pageId]?.facts.some(
        (item) => item.reference === reference && item.graphicId === graphicId,
      )
    )
      return null;
    return { pageId, reference, graphicId, state };
  };
  const close = (clear = false) => {
    const current = selected;
    selected = null;
    if (current) {
      current.disclosure.open = false;
      current.frame.remove();
    }
    if (clear) clearAddress();
  };
  globalThis.document.addEventListener(
    "toggle",
    (event) => {
      if (
        selected &&
        event.target.tagName === "DETAILS" &&
        !event.target.open &&
        event.target.contains(selected.disclosure)
      )
        close(true);
    },
    true,
  );
  const build = (page, entry, graphicId) => {
    const native = data.sourceReading?.pages[page.id];
    const binding = native?.bindings[entry.reference];
    if (!binding || JSON.parse(entry.reference)[1] === "editorial") return null;
    const disclosure = globalThis.document.createElement("details");
    disclosure.className = "inspect-source-diagram";
    disclosure.dataset.sourceReference = entry.reference;
    disclosure.dataset.sourceGraphic = graphicId;
    const title = globalThis.document.createElement("summary");
    title.textContent = "Explore selected source relationships";
    const boundary = globalThis.document.createElement("p");
    boundary.textContent =
      "This view contains selected source declarations, not the publication’s repeated or aggregated figures. Native traversal follows declared directed relationships; it does not establish runtime effects.";
    const root = globalThis.document.createElement("div");
    root.dataset.sourceReaderRoot = "";
    disclosure.append(title, boundary, root);
    disclosure.addEventListener("toggle", () => {
      if (!disclosure.isConnected || !disclosure.closest("#interactive-inspector:not([hidden])"))
        return;
      if (!disclosure.open) {
        if (selected?.disclosure === disclosure) close(true);
        return;
      }
      if (root.querySelector("iframe")) return;
      close();
      const content = native.pieces
        .map((piece) => (typeof piece === "number" ? data.blocks[piece] : piece))
        .join("");
      const parsed = new globalThis.DOMParser().parseFromString(content, "text/html");
      const restored = readAddress();
      const addressed =
        restored?.pageId === page.id &&
        restored.reference === entry.reference &&
        restored.graphicId === graphicId;
      const state = addressed
        ? restored.state
        : (binding.kind === "claim" ? "" : binding.kind === "relation" ? "relation=" : "focus=") +
          encodeURIComponent(binding.id);
      const url = new URL(globalThis.location.href);
      const hash = new URLSearchParams();
      for (const [field, value] of Object.entries({
        page: page.id,
        inspect: graphicId,
        source: entry.reference,
        edition: data.build.editionSha256,
        meaning: data.build.semanticDigest,
      }))
        hash.set(field, value);
      url.hash = hash.toString() + "&sourceReader={state}";
      parsed.documentElement.setAttribute("data-reading-link-template", url.href);
      parsed.documentElement.setAttribute("data-publication-source", "true");
      parsed.documentElement.dataset.theme = globalThis.document.documentElement.dataset.theme;
      parsed.documentElement.dataset.style = globalThis.document.documentElement.dataset.style;
      const style = parsed.createElement("style");
      style.textContent =
        "html[data-publication-source] body{height:100vh;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:.6rem;padding:.65rem}html[data-publication-source] .header{display:none}html[data-publication-source] .toolbar{position:relative;inset:auto;width:fit-content;max-width:100%;margin:0 0 0 auto}html[data-publication-source] .container{display:block;width:100%;height:100%;min-height:0;margin:0;padding:0}html[data-publication-source] .diagram-container{display:grid;grid-template-rows:minmax(0,1fr) auto;gap:.6rem;height:100%;min-height:0;padding:1rem}html[data-publication-source] .diagram-container>svg{width:100%;height:100%;min-height:0;max-height:none}html[data-publication-source] .diagram-nav{position:static;inset:auto;transform:none;translate:none;margin:0 auto;width:max-content;max-width:100%}html[data-publication-source] li:target{outline:2px solid var(--text);outline-offset:4px;scroll-margin:16px}";
      parsed.head.appendChild(style);
      const address = parsed.createElement("script");
      address.textContent =
        'location.replace(location.href.replace(/#.*$/,"")+"#"+' + scriptJson(state) + ");";
      parsed.head.appendChild(address);
      const appearance = parsed.createElement("script");
      appearance.textContent = data.appearanceScript + `\n(${sourceReadingAperture.toString()})();`;
      parsed.body.appendChild(appearance);
      const frame = globalThis.document.createElement("iframe");
      frame.title = "Selected source relationships";
      frame.setAttribute("sandbox", "allow-scripts allow-downloads");
      frame.srcdoc = "<!DOCTYPE html>\n" + parsed.documentElement.outerHTML;
      root.appendChild(frame);
      selected = {
        pageId: page.id,
        reference: entry.reference,
        graphicId,
        state,
        addressed,
        disclosure,
        frame,
      };
    });
    return disclosure;
  };
  const restore = (showInspector) => {
    const state = readAddress();
    if (!state) {
      if (selected?.addressed) close();
      return false;
    }
    if (
      selected?.pageId === state.pageId &&
      selected.reference === state.reference &&
      selected.graphicId === state.graphicId &&
      selected.state === state.state
    ) {
      selected.addressed = true;
      return true;
    }
    if (!showInspector(state.graphicId)) return false;
    const disclosure = [...globalThis.document.querySelectorAll(".inspect-source-diagram")].find(
      (item) =>
        item.dataset.sourceReference === state.reference &&
        item.dataset.sourceGraphic === state.graphicId,
    );
    if (!disclosure) return false;
    disclosure.parentElement.open = true;
    disclosure.open = true;
    return true;
  };
  return { close, build, restore };
}
