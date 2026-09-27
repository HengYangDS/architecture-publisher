import { createHash } from 'node:crypto';
import { validateEdition } from 'architecture-publisher/edition';
import { createMetricReader } from 'architecture-publisher/renderers/svg';
import { canonical, deepFreeze, validateClaimModel } from 'architecture-publisher/semantics';
import { parseStrictJson } from 'architecture-publisher/source';
import { architecturePublisherInteractiveScenes } from './interactive-scenes.mjs';
import { composeArchitecturePublisherInteractiveScene } from './interactive-scene.mjs';
import { SELF_NAMESPACE } from './project.mjs';
import { architecturePublisherStaticScene, staticAuthoringDigest } from './static-scene.mjs';
import { composeArchitecturePublisherFlagship } from './static/composition.mjs';
import { compileArchitecturePublisherStaticScene } from './static/scene.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fail(code) {
  throw Object.assign(new Error(code), { code });
}

function qualified(reference) {
  const match = /^(entity|relation):(.+)$/u.exec(reference);
  if (!match) fail('self_refinement_semantic_reference_invalid');
  return JSON.stringify([SELF_NAMESPACE, match[1], match[2]]);
}

function qualifyStaticScene(scene, edition, model) {
  const { coverage: _computedCoverage, ...selected } = scene;
  const strokeTones = { flow: 'line', trust: 'accent', renewal: 'proof', feedback: 'ghost' };
  const groups = new Map(
    edition.scenes.static.composition.groups.map(({ id, entities }) => [id, new Set(entities)]),
  );
  return {
    ...selected,
    schema: 'architecture.authored-static-scene/v1',
    requiredSemanticIds: scene.requiredSemanticIds.map(qualified),
    nodes: scene.nodes.map((node) => {
      const entities = groups.get(node.id);
      if (!entities) fail('self_refinement_group_missing');
      return { ...node, semanticIds: [...entities].map((id) => qualified(`entity:${id}`)) };
    }),
    texts: scene.texts.map((text) => ({
      ...text,
      semanticIds: text.semanticIds.map(qualified),
    })),
    edges: scene.edges.flatMap((edge) => {
      const from = groups.get(edge.source);
      const to = groups.get(edge.target);
      if (!from || !to || !strokeTones[edge.kind]) fail('self_refinement_edge_invalid');
      const related = edge.semanticIds.map((reference) => {
        const match = /^relation:(.+)$/u.exec(reference);
        const value = match && model.relations[match[1]];
        if (!value) fail('self_refinement_edge_invalid');
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
    nodes: scene.nodes.map((node) => ({
      ...node,
      ...(node.semanticIds ? { semanticIds: node.semanticIds.map(qualified) } : {}),
    })),
    edges: scene.edges.map((edge) => ({
      ...edge,
      ...(edge.semanticIds ? { semanticIds: edge.semanticIds.map(qualified) } : {}),
    })),
  };
}

/** Prepare selected art as data; the public compiler still decides source coverage. */
export function refinementFromSelfEdition(sourceModel, authoredEdition, metricBytes) {
  const model = validateClaimModel(sourceModel);
  const edition = validateEdition(model, authoredEdition);
  if (
    !Buffer.isBuffer(metricBytes) ||
    sha(metricBytes) !== model.sources['self-static-metrics']?.sha256
  )
    fail('self_refinement_metric_mismatch');
  if (
    canonical(edition.scenes.static) !==
      canonical(architecturePublisherStaticScene(staticAuthoringDigest(model.sources))) ||
    canonical(edition.scenes.interactive) !== canonical(architecturePublisherInteractiveScenes())
  )
    fail('self_refinement_authorship_mismatch');
  const metrics = parseStrictJson(
    metricBytes,
    'self_refinement_metric_invalid',
    'self_refinement_metric_json_duplicate_key',
  );
  const composition = composeArchitecturePublisherFlagship();
  if (canonical(edition.scenes.static.composition) !== canonical(composition.editionComposition))
    fail('self_refinement_authorship_mismatch');
  composition.labels.push({
    id: 'target-caveat',
    text: 'Target architecture · not a current-state claim',
    x: 1536,
    y: 119,
    size: 11,
    weight: '400',
    anchor: 'end',
    tone: 'muted',
    semantics: [],
  });
  const scene = compileArchitecturePublisherStaticScene(
    composition,
    createMetricReader(metrics).measure,
  );
  const pages = edition.narrative.map((id) => {
    const authored = edition.scenes.interactive[id];
    return {
      id,
      label: authored.label,
      purpose: authored.purpose,
      scene: qualifyInteractiveScene(
        composeArchitecturePublisherInteractiveScene(model, edition, {
          id,
          label: authored.label,
          purpose: authored.purpose,
          ...authored.composition,
        }),
      ),
    };
  });
  return deepFreeze({
    schema: 'architecture.scene-refinement/v1',
    media: {
      static: {
        kind: 'authored-canvas',
        scene: qualifyStaticScene(scene, edition, model),
      },
      interactive: { kind: 'authored-architecture', pages },
    },
  });
}
