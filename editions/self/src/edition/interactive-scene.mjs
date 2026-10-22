import { validateInteractiveArchitectureInput } from "architecture-publisher/scene";
import { FIGURE_KINDS, DETAILS } from "./interactive-nodes.mjs";
import { architecturePublisherInteractiveScenes } from "./interactive-scenes.mjs";
import {
  OVERVIEW_CLUSTERS,
  OVERVIEW_RELATIONS,
  EDITION_RELATIONS,
  ADOPTION_RELATIONS,
  EVOLUTION_RELATIONS,
} from "./interactive-routes.mjs";

const sceneIds = new Set(Object.keys(architecturePublisherInteractiveScenes()));

function groupsFor(view) {
  return new Map(view.groups.map((group) => [group.id, group]));
}

function relationEndpoints(document, view) {
  const entityGroup = new Map();
  for (const group of view.groups) for (const id of group.entities) entityGroup.set(id, group.id);
  return new Map(
    view.relations.map(({ id }) => {
      const relation = document.relations[id];
      return [
        id,
        {
          from: entityGroup.get(relation.subject),
          to: entityGroup.get(relation.object),
        },
      ];
    }),
  );
}

function defaultClusters(view) {
  return view.groups.map(({ id, label }) => [id, label, [id]]);
}

function defaultRelations(document, view) {
  const endpoints = relationEndpoints(document, view),
    pairs = new Map();
  for (const { id } of view.relations) {
    const { from, to } = endpoints.get(id);
    if (from === to) continue;
    const key = from + "\u0000" + to,
      values = pairs.get(key) ?? [];
    values.push(id);
    pairs.set(key, values);
  }
  return [...pairs.entries()].map(([key, relationIds], index) => {
    const [from, to] = key.split("\u0000"),
      labels = [...new Set(relationIds.map((id) => document.relations[id].type))];
    return ["flow-" + (index + 1), from, to, labels.join(" · "), relationIds];
  });
}

function programFor(document, view) {
  if (view.id === "overview") return { clusters: OVERVIEW_CLUSTERS, relations: OVERVIEW_RELATIONS };
  if (view.id === "edition")
    return { clusters: defaultClusters(view), relations: EDITION_RELATIONS };
  if (view.id === "adoption")
    return { clusters: defaultClusters(view), relations: ADOPTION_RELATIONS };
  if (view.id === "evolution")
    return { clusters: defaultClusters(view), relations: EVOLUTION_RELATIONS };
  return {
    clusters: defaultClusters(view),
    relations: defaultRelations(document, view),
  };
}

function assertExactCoverage(expected, actual, code) {
  const sortedExpected = [...expected].sort(),
    sortedActual = [...actual].sort();
  if (
    sortedExpected.length !== sortedActual.length ||
    sortedExpected.some((value, index) => value !== sortedActual[index])
  )
    throw Object.assign(new Error(code), {
      code,
      expected: sortedExpected,
      actual: sortedActual,
    });
}

export function composeArchitecturePublisherInteractiveScene(document, edition, view) {
  if (!sceneIds.has(view.id))
    throw Object.assign(new Error("self_interactive_layout_missing"), {
      code: "self_interactive_layout_missing",
    });
  const groupMap = groupsFor(view),
    endpoints = relationEndpoints(document, view),
    program = programFor(document, view),
    nodeByGroup = new Map(),
    representedGroups = [],
    representedRelations = new Set(),
    nodes = program.clusters.map(([id, label, groupIds]) => {
      const entities = [];
      for (const groupId of groupIds) {
        const group = groupMap.get(groupId);
        if (!group)
          throw Object.assign(new Error("self_interactive_group_missing"), {
            code: "self_interactive_group_missing",
          });
        representedGroups.push(groupId);
        entities.push(...group.entities);
        nodeByGroup.set(groupId, id);
      }
      const semanticIds = entities.map((entity) => "entity:" + entity);
      for (const { id: relationId } of view.relations) {
        const endpoint = endpoints.get(relationId);
        if (groupIds.includes(endpoint.from) && groupIds.includes(endpoint.to)) {
          semanticIds.push("relation:" + relationId);
          representedRelations.add(relationId);
        }
      }
      const figureKind = FIGURE_KINDS[id];
      return {
        id,
        label,
        detail: DETAILS[id] ?? `${entities.length} semantic subjects`,
        // This neutral adapter paint token declares no source kind or external ownership.
        visualRole: "external",
        figureKind,
        semanticIds,
      };
    }),
    nodeMap = new Map(nodes.map((node) => [node.id, node])),
    edges = program.relations.map(([id, from, to, label, relationIds]) => {
      if (!nodeMap.has(from) || !nodeMap.has(to))
        throw Object.assign(new Error("self_interactive_edge_endpoint_missing"), {
          code: "self_interactive_edge_endpoint_missing",
        });
      for (const relationId of relationIds) {
        if (!endpoints.has(relationId) || representedRelations.has(relationId))
          throw Object.assign(new Error("self_interactive_relation_invalid"), {
            code: "self_interactive_relation_invalid",
          });
        representedRelations.add(relationId);
      }
      return {
        id,
        from,
        to,
        label,
        visualRole: relationIds.some(
          (relationId) =>
            document.relations[relationId].type === "requires" ||
            document.relations[relationId].type === "gates" ||
            document.relations[relationId].type === "authorizes",
        )
          ? "security"
          : relationIds.some(
                (relationId) =>
                  document.relations[relationId].type === "returns" ||
                  document.relations[relationId].type === "renews" ||
                  document.relations[relationId].type === "excludes",
              )
            ? "dashed"
            : relationIds.some(
                  (relationId) =>
                    document.relations[relationId].type === "binds" ||
                    document.relations[relationId].type === "authors" ||
                    document.relations[relationId].type === "compiles" ||
                    document.relations[relationId].type === "derives" ||
                    document.relations[relationId].type === "propagates",
                )
              ? "emphasis"
              : "default",
        semanticIds: relationIds.map((relationId) => "relation:" + relationId),
      };
    });
  assertExactCoverage(
    groupMap.keys(),
    representedGroups,
    "self_interactive_group_coverage_invalid",
  );
  assertExactCoverage(
    view.relations.map(({ id }) => id),
    representedRelations,
    "self_interactive_relation_coverage_invalid",
  );
  return validateInteractiveArchitectureInput({
    schema: "architecture.interactive-scene/v1",
    id: view.id,
    title: edition.title,
    subtitle: view.label,
    nodes,
    groups: [],
    edges,
  });
}
