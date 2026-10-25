/** Bind existing graphics to one keyboard-readable Inspect surface without changing paint. */
export function bindInspectableGraphics(parsed, selected, bindInspect) {
  for (const graphic of parsed.querySelectorAll(
    "[data-graphic-id],[data-note-item-id],path[data-edge-id]:not([data-logical-relation])",
  )) {
    const raw =
      graphic.getAttribute("data-graphic-id") ||
      graphic.getAttribute("data-note-item-id") ||
      graphic.getAttribute("data-edge-id");
    const id = raw.startsWith("text:") ? raw.slice(5) : raw;
    if (!Object.hasOwn(selected.subjectSources, id)) continue;
    if (graphic.hasAttribute("data-logical-relation")) continue;
    const title =
      graphic.getAttribute("data-inspect-label") ||
      selected.facts.find((fact) => fact.graphicId === id)?.title ||
      id;
    bindInspect(graphic, id, title);
    const heading = graphic.querySelector("h1,h2,h3,h4,h5,h6,strong");
    const hasHeading =
      graphic.namespaceURI === "http://www.w3.org/1999/xhtml" &&
      heading &&
      !heading.querySelector("a,button,input,select,textarea,summary");
    let trigger = graphic;
    if (hasHeading) {
      trigger = parsed.createElement("button");
      trigger.type = "button";
      trigger.setAttribute("style", "all:unset;cursor:pointer");
      trigger.setAttribute("class", "publication-inspect-trigger");
      trigger.append(...heading.childNodes);
      heading.appendChild(trigger);
      bindInspect(trigger, id, title);
    }
    const visibleLabel = (graphic.getAttribute("data-node-label") || trigger.textContent)
      .trim()
      .replace(/\s+/gu, " ");
    if (!hasHeading) trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-label", `Inspect ${visibleLabel || title}`);
    const svg = graphic.closest("svg");
    if (svg) {
      svg.removeAttribute("aria-hidden");
      svg.setAttribute("role", "group");
    }
  }
  if (parsed.querySelector(".publication-inspect-trigger")) {
    const focus = parsed.createElement("style");
    focus.textContent =
      ".publication-inspect-trigger:focus-visible{outline:2px solid currentColor!important;outline-offset:3px}";
    parsed.head.appendChild(focus);
  }
}
