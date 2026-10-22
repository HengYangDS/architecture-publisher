export function inspectFieldList(canonical) {
  const structuredValue = (value) => {
    if (value.length > 16384) return null;
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    let remaining = 256;
    const fits = (item, depth) =>
      --remaining >= 0 &&
      depth <= 8 &&
      (item === null ||
        typeof item !== "object" ||
        Object.values(item).every((child) => fits(child, depth + 1)));
    return fits(parsed, 0) && canonical(parsed) === value ? parsed : null;
  };
  const valueTree = (value) => {
    if (value === null || typeof value !== "object" || !Object.keys(value).length) {
      const scalar = globalThis.document.createElement("code");
      scalar.textContent = JSON.stringify(value);
      return scalar;
    }
    const container = globalThis.document.createElement("div");
    container.className = "inspect-value-container";
    const kind = globalThis.document.createElement("span");
    kind.className = "inspect-container-kind";
    kind.textContent = Array.isArray(value) ? "Array" : "Object";
    const fields = globalThis.document.createElement("dl");
    fields.className = "inspect-value-tree";
    const keys = Array.isArray(value) ? Object.keys(value) : Object.keys(value).sort();
    for (const key of keys) {
      const term = globalThis.document.createElement("dt");
      term.textContent = Array.isArray(value) ? `[${key}]` : key;
      const definition = globalThis.document.createElement("dd");
      const child = valueTree(value[key]);
      if (child.className === "inspect-value-container") {
        term.className = "inspect-container-key";
        definition.className = "inspect-structured-value";
      }
      definition.appendChild(child);
      fields.append(term, definition);
    }
    container.append(kind, fields);
    return container;
  };
  const fieldList = (facts) => {
    const fields = globalThis.document.createElement("dl");
    for (const fact of facts) {
      const term = globalThis.document.createElement("dt");
      const definition = globalThis.document.createElement("dd");
      term.textContent = fact.label;
      const value = structuredValue(fact.value);
      if (value === null) definition.textContent = fact.value;
      else {
        definition.className = "inspect-structured-value";
        const disclosure = globalThis.document.createElement("details");
        disclosure.className = "inspect-structured-disclosure";
        const summary = globalThis.document.createElement("summary");
        const tree = valueTree(value);
        const kind = tree.querySelector(":scope > .inspect-container-kind");
        if (kind) summary.append(kind, " value");
        else summary.textContent = Array.isArray(value) ? "Array value" : "Object value";
        const original = globalThis.document.createElement("details");
        original.className = "inspect-original-value";
        const originalSummary = globalThis.document.createElement("summary");
        originalSummary.textContent = "Original value";
        const text = globalThis.document.createElement("pre");
        text.textContent = fact.value;
        original.append(originalSummary, text);
        disclosure.append(summary, tree, original);
        definition.appendChild(disclosure);
      }
      fields.append(term, definition);
    }
    return fields;
  };
  return fieldList;
}

export function inspectIdentity(data, sourceIds, editorial = !sourceIds.length) {
  const details = globalThis.document.createElement("details");
  details.id = "interactive-inspect-basis-details";
  const summary = globalThis.document.createElement("summary");
  summary.textContent = sourceIds.length
    ? editorial
      ? "Source and Edition identities"
      : "Source identity"
    : "Edition identity";
  details.appendChild(summary);
  const note = globalThis.document.createElement("p");
  note.textContent = sourceIds.length
    ? "These are selected input identities, not embedded source files or verified domain truth."
    : "This statement belongs to the selected Edition, not a source-endorsed fact.";
  details.appendChild(note);
  const identities = sourceIds
    .map((id) => data.sources[id])
    .filter(Boolean)
    .map((source) => [
      ["Namespace", source.namespace],
      ...(source.claimant ? [["Claimant", source.claimant]] : []),
      ["Input kind", source.kind],
      ["SHA-256", source.sha256],
    ]);
  if (editorial)
    identities.push([
      ["Edition", data.editionId],
      ["SHA-256", data.build.editionSha256],
    ]);
  for (const identity of identities) {
    const record = globalThis.document.createElement("dl");
    for (const [label, value] of identity) {
      const term = globalThis.document.createElement("dt");
      const definition = globalThis.document.createElement("dd");
      term.textContent = label;
      definition.textContent = value;
      record.append(term, definition);
    }
    details.appendChild(record);
  }
  return details;
}
