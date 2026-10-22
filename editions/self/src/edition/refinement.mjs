import { createHash } from "node:crypto";
import { validateEditionProject } from "architecture-publisher/edition";
import { createRecordedMetricReader } from "architecture-publisher/scene";
import { canonical, deepFreeze, validateClaimModel } from "architecture-publisher/semantics";
import { parseStrictJson } from "architecture-publisher/file-input";
import { architecturePublisherInteractiveScenes } from "./interactive-scenes.mjs";
import { composeArchitecturePublisherInteractiveScene } from "./interactive-scene.mjs";
import { projectFromSelfModel, SELF_NAMESPACE } from "./project.mjs";
import { composeArchitecturePublisherStaticComposition } from "./static/composition.mjs";
import { compileArchitecturePublisherStaticScene } from "./static/scene.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

function qualified(reference) {
  const match = /^(entity|relation):(.+)$/u.exec(reference);
  if (!match) fail("self_refinement_semantic_reference_invalid");
  return JSON.stringify([SELF_NAMESPACE, match[1], match[2]]);
}

function qualifyStaticScene(scene, groupDefinitions, model) {
  const selected = { ...scene };
  delete selected.coverage;
  const strokeTones = { flow: "line", trust: "accent", renewal: "proof", feedback: "ghost" };
  const groups = new Map(
    groupDefinitions.map(({ id, elements }) => [
      id,
      new Set(elements.map(({ id: member }) => member)),
    ]),
  );
  return {
    ...selected,
    schema: "architecture.authored-static-scene/v1",
    requiredSemanticIds: scene.requiredSemanticIds.map(qualified),
    nodes: scene.nodes.map((node) => {
      const entities = groups.get(node.id);
      if (!entities) fail("self_refinement_group_missing");
      return { ...node, semanticIds: [...entities].map((id) => qualified(`entity:${id}`)) };
    }),
    texts: scene.texts.map((text) => ({
      ...text,
      semanticIds: text.semanticIds.map(qualified),
    })),
    edges: scene.edges.flatMap((edge) => {
      const from = groups.get(edge.source);
      const to = groups.get(edge.target);
      if (!from || !to || !strokeTones[edge.kind]) fail("self_refinement_edge_invalid");
      const related = edge.semanticIds.map((reference) => {
        const match = /^relation:(.+)$/u.exec(reference);
        const value = match && model.relations[match[1]];
        if (!value) fail("self_refinement_edge_invalid");
        return { reference, value };
      });
      const selected = related.filter(
        ({ value }) =>
          (from.has(value.subject) || to.has(value.subject)) &&
          (from.has(value.object) || to.has(value.object)),
      );
      if (!selected.some(({ value }) => from.has(value.subject) && to.has(value.object))) return [];
      return [
        {
          ...edge,
          strokeTone: strokeTones[edge.kind],
          semanticIds: selected.map(({ reference }) => qualified(reference)),
        },
      ];
    }),
    decorations: scene.decorations,
  };
}

function qualifyInteractiveScene(scene) {
  return {
    ...scene,
    nodes: scene.nodes.map((node) => {
      const authored = { ...node };
      delete authored.icon;
      return {
        ...authored,
        ...(node.semanticIds ? { semanticIds: node.semanticIds.map(qualified) } : {}),
      };
    }),
    edges: scene.edges.map((edge) => ({
      ...edge,
      ...(edge.semanticIds ? { semanticIds: edge.semanticIds.map(qualified) } : {}),
    })),
  };
}

function buildRefinement(
  model,
  metricBytes,
  groupDefinitions,
  pageDefinitions,
  title,
  composition,
) {
  if (
    !Buffer.isBuffer(metricBytes) ||
    sha(metricBytes) !== model.sources["self-static-metrics"]?.sha256
  )
    fail("self_refinement_metric_mismatch");
  const metrics = parseStrictJson(
    metricBytes,
    "self_refinement_metric_invalid",
    "self_refinement_metric_json_duplicate_key",
  );
  composition.labels.push({
    id: "target-caveat",
    text: "Target architecture · not a current-state claim",
    x: 1536,
    y: 119,
    size: 11,
    weight: "400",
    anchor: "end",
    tone: "muted",
    semantics: [],
  });
  const scene = compileArchitecturePublisherStaticScene(
    composition,
    createRecordedMetricReader(metrics).measure,
  );
  const pages = pageDefinitions.map(({ id, label, purpose, composition: viewComposition }) => {
    return {
      id,
      label,
      purpose,
      scene: qualifyInteractiveScene(
        composeArchitecturePublisherInteractiveScene(
          model,
          { title },
          {
            id,
            label,
            purpose,
            ...viewComposition,
          },
        ),
      ),
    };
  });
  return deepFreeze({
    schema: "architecture.scene-refinement/v1",
    media: {
      static: {
        kind: "authored-canvas",
        scene: qualifyStaticScene(scene, groupDefinitions, model),
      },
      interactive: { kind: "authored-architecture", pages },
    },
  });
}

/** Prepare the current art from the sole authored Edition Project. */
export function refinementFromSelfProject(sourceModel, authoredProject, metricBytes) {
  const model = validateClaimModel(sourceModel);
  const project = validateEditionProject(authoredProject);
  if (canonical(project) !== canonical(projectFromSelfModel(model)))
    fail("self_refinement_authorship_mismatch");
  const interactive = architecturePublisherInteractiveScenes();
  return buildRefinement(
    model,
    metricBytes,
    project.presentation.static.views[0].groups,
    project.presentation.interactive.views.map(({ id }) => ({ id, ...interactive[id] })),
    project.title,
    composeArchitecturePublisherStaticComposition(),
  );
}
