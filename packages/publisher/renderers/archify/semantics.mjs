import { fail, hasExactFields } from "../../src/protocol/values.mjs";

export function validatedExploration(value, scene) {
  const nodes = scene.nodes.filter((node) => !node.adornment);
  if (
    !hasExactFields(value, ["nodes", "relations", "limits"]) ||
    !Array.isArray(value.nodes) ||
    value.nodes.length !== nodes.length ||
    !Array.isArray(value.relations) ||
    !Array.isArray(value.limits) ||
    value.limits.some(
      (limit) =>
        ![
          "nonbijective-source-membership",
          "nonunique-relation-carrier",
          "nonbijective-relation-membership",
          "undrawable-source-relation",
        ].includes(limit),
    ) ||
    (value.limits.length && value.relations.length)
  )
    fail("render_exploration_invalid");
  const ids = new Set();
  for (const node of value.nodes) {
    if (
      !hasExactFields(node, ["id", "label", "kind"]) ||
      ids.has(node.id) ||
      !nodes.some((candidate) => candidate.id === node.id) ||
      typeof node.label !== "string" ||
      !node.label.trim() ||
      typeof node.kind !== "string" ||
      !node.kind.trim()
    )
      fail("render_exploration_invalid");
    ids.add(node.id);
  }
  const relations = new Set();
  for (const relation of value.relations) {
    if (
      !hasExactFields(
        relation,
        ["id", "reference", "from", "to", "label"],
        [relation.edgeId ? "edgeId" : "routeId", "direction"],
      ) ||
      typeof relation.reference !== "string" ||
      relations.has(relation.reference) ||
      !ids.has(relation.from) ||
      !ids.has(relation.to) ||
      typeof relation.label !== "string" ||
      !["forward", "bidirectional"].includes(relation.direction ?? "forward")
    )
      fail("render_exploration_invalid");
    relations.add(relation.reference);
    if (relation.edgeId) {
      const edge = scene.edges.find((edge) => edge.id === relation.edgeId && !edge.adornment);
      if (
        !edge ||
        relation.id !== edge.id ||
        edge.from !== relation.from ||
        edge.to !== relation.to ||
        edge.semanticIds?.length !== 1 ||
        edge.semanticIds[0] !== relation.reference
      )
        fail("render_exploration_invalid");
    } else {
      const route = scene.routes?.find((route) => route.id === relation.routeId);
      if (
        !route ||
        relation.id !== route.id ||
        route.reference !== relation.reference ||
        route.source !== relation.from ||
        route.target !== relation.to
      )
        fail("render_exploration_invalid");
    }
  }
  return value;
}

/** Native query identities are directed traversals, not additional source assertions. */
export function nativeRelationTraversals(relations, nodes) {
  const labels = new Map(nodes.map(({ id, label }) => [id, label]));
  const reserved = new Set([
    ...labels.keys(),
    ...relations.flatMap(({ id, reference }) => [id, reference]),
  ]);
  let next = 0;
  const allocate = () => {
    let id;
    do id = `traversal-${next++}`;
    while (reserved.has(id));
    reserved.add(id);
    return id;
  };
  return relations.flatMap((relation) => {
    const forward = { ...relation, key: relation.reference, reverse: false };
    if (relation.direction !== "bidirectional" || relation.from === relation.to) return [forward];
    const id = allocate();
    return [
      forward,
      {
        ...relation,
        id,
        key: id,
        from: relation.to,
        to: relation.from,
        label: `Reverse traversal · Source assertion: ${labels.get(relation.from)} → ${labels.get(relation.to)}${relation.label ? ` · ${relation.label}` : ""}`,
        reverse: true,
      },
    ];
  });
}

function occurrenceWording() {
  return {
    "viewer.finder.title": "Find in this figure",
    "viewer.finder.close": "Close figure finder",
    "viewer.finder.search": "Search figure occurrences",
    "viewer.finder.results": "Figure occurrences",
    "viewer.finder.empty": "No matching figure occurrences",
    "viewer.finder.noun.nodes": "figure occurrences",
    "viewer.outline.title": "Figure index",
    "viewer.lens.title": "Compare figure kinds",
    "viewer.lens.instruction":
      "Choose up to two figure kinds. Highlighting preserves the drawing; exact relationship queries are unavailable.",
    "viewer.lens.choose": "Choose a kind to highlight its figure occurrences.",
    "viewer.lens.kinds": "Figure kinds",
    "viewer.guide.fact.node.one": "{count} figure occurrence",
    "viewer.guide.fact.node.other": "{count} figure occurrences",
    "viewer.guide.facts": "{nodes} · {relationships} · Complete relationship queries unavailable",
    "viewer.finder.link.one": "{count} queryable relation",
    "viewer.finder.link.other": "{count} queryable relations",
    "viewer.finder.result.focus.one":
      "Focus {label}, figure occurrence; {count} queryable relation",
    "viewer.finder.result.focus.other":
      "Focus {label}, figure occurrence; {count} queryable relations",
    "viewer.finder.status.empty": "No matching figure occurrences",
    "viewer.finder.status.count.one": "{count} matching figure occurrence",
    "viewer.finder.status.count.other": "{count} matching figure occurrences",
    "viewer.lens.kind.count.one": "{label}, {count} figure occurrence",
    "viewer.lens.kind.count.other": "{label}, {count} figure occurrences",
    "viewer.lens.node.one": "{count} {label} figure occurrence",
    "viewer.lens.node.other": "{count} {label} figure occurrences",
    "viewer.lens.single": "{nodes} · {relationships} · Complete relationship queries unavailable",
    "viewer.lens.compare.one":
      "{first} and {second} figure occurrences · {forward} forward / {reverse} reverse · {count} queryable relation; complete queries unavailable",
    "viewer.lens.compare.other":
      "{first} and {second} figure occurrences · {forward} forward / {reverse} reverse · {count} queryable relations; complete queries unavailable",
    "viewer.intent.summary":
      "{label}, figure occurrence. {out} outgoing / {in} incoming{loops}; {total} queryable relations. Complete relationship queries unavailable.",
    "viewer.radar.fullMap": "{count} figure occurrences · Viewport overview",
    "viewer.radar.nodes": "Figure occurrences",
    "viewer.focus.selectedNodes": "{count} selected figure occurrences",
    "viewer.passport.relationship.summary":
      "Figure occurrence · relationship queries unavailable (queryable records: {out} outgoing, {in} incoming{loops})",
    "viewer.passport.relationship.none": "Relationship queries unavailable",
    "viewer.passport.reach.noUpstream": "Upstream relationship queries unavailable",
    "viewer.passport.reach.noDownstream": "Downstream relationship queries unavailable",
    "viewer.route.unreachable": "Relationship queries unavailable for {label}",
    "viewer.route.unreachable.detail":
      "The figure does not establish a query from {source} to {target} along its painted lines.",
  };
}

export async function architectureReaderTranslations(exploration) {
  const { catalogKeys, translateMessage, validateTranslations } =
    await import("./supply/renderers/shared/i18n.mjs");
  const translations = {
    ...Object.fromEntries(catalogKeys().map((key) => [key, translateMessage("en", key)])),
    "viewer.nav.route": "Path: trace a directed route",
    "viewer.nav.radar": "Map: open semantic radar",
    "viewer.motion.pause": "Live: pause motion",
    "viewer.motion.resume": "Still: resume motion",
    "viewer.motion.reduced": "Still: motion paused by reduced-motion preference",
    "viewer.motion.hidden": "Still: motion paused while this page is hidden",
    "viewer.motion.yielding": "Live: pause motion; currently yielding to {owner}",
    "viewer.lens.instruction":
      "Choose up to two figure kinds. One highlights its directed traversals; two compare direct traversals, not additional source assertions.",
    "viewer.guide.lens.hint": "Count figure kinds and compare direct source-bound traversals.",
    "viewer.passport.relations.show": "Show connected traversals",
    "viewer.passport.relations.hide": "Hide connected traversals",
    "viewer.passport.relations.list": "Connected traversals",
    "viewer.passport.relationship.none": "No connected traversals",
    "viewer.passport.relationship.show.one": "Show {count} connected traversal",
    "viewer.passport.relationship.show.other": "Show {count} connected traversals",
    "viewer.passport.relationship.explorer": "Directed traversal explorer",
    "viewer.passport.relationship.pinned": "Pinned traversal · {from} → {to} · {label}",
    "viewer.passport.relationship.inspect":
      "Inspect traversal {index} of {total}: {from} to {to}, {label}. Press Enter for details.",
    "viewer.passport.reach.status":
      "{direction} · {nodes} nodes · {links} directed traversals · max {hops} hops",
    "viewer.lens.compare.one":
      "{first} → {second}: {forward} · {second} → {first}: {reverse} · {count} direct traversal",
    "viewer.lens.compare.other":
      "{first} → {second}: {forward} · {second} → {first}: {reverse} · {count} direct traversals",
    "viewer.export.card.reachSummary":
      "Source-bound {direction} from {origin} · {nodes} · {links} · max {hops}",
    "viewer.export.card.routeSummary.one": "Path: {source} → {target} · {count} directed traversal",
    "viewer.export.card.routeSummary.other":
      "Path: {source} → {target} · {count} directed traversals",
    ...Object.fromEntries(
      [
        "viewer.export.card.link",
        "viewer.finder.link",
        "viewer.guide.fact.relationship",
        "viewer.lens.relationship",
      ].flatMap((key) =>
        [
          ["one", "directed traversal"],
          ["other", "directed traversals"],
        ].map(([form, label]) => [`${key}.${form}`, `{count} ${label}`]),
      ),
    ),
    "viewer.lens.legend.inspect.one": "Inspect {label}, {count} figure",
    "viewer.lens.legend.inspect.other": "Inspect {label}, {count} figures",
    ...(exploration.limits.length ? occurrenceWording() : {}),
  };
  const report = validateTranslations(translations);
  if (report.missingKeys.length || report.unknownKeys.length || report.placeholderMismatches.length)
    fail("render_exploration_translations_invalid");
  return translations;
}
