import * as groupedGeometry from "../../packages/publisher/src/scene/static/architecture.mjs";
import { loadFigureIconSupply } from "../../packages/publisher/renderers/icons/index.mjs";

export const figureIcons = await loadFigureIconSupply();

export const { composeStaticArchitectureScene } = groupedGeometry;

export function fixture() {
  return {
    document: {
      entities: Object.fromEntries(
        ["left", "center", "right", "target"].map((id) => [id, { label: id, type: "component" }]),
      ),
      relations: Object.fromEntries(
        ["left", "center", "right"].map((id) => [
          id,
          { subject: id, object: "target", type: "calls" },
        ]),
      ),
    },
    edition: {
      title: "Converging calls",
      visualGrammar: {
        entityTypes: { component: "backend" },
        relationTypes: { calls: { label: "calls", variant: "default" } },
      },
    },
    view: {
      label: "Three distinct callers",
      groups: [
        { id: "inputs", label: "Callers", entities: ["left", "center", "right"] },
        { id: "output", label: "Target", entities: ["target"] },
      ],
      relations: ["left", "center", "right"].map((id) => ({
        id,
        fromSide: "bottom",
        toSide: "top",
        route: "orthogonal-v",
      })),
    },
  };
}

export function unlabeledGraph() {
  const { document, view } = fixture();
  return groupedGeometry.composeGroupedGeometry({
    nodes: Object.entries(document.entities).map(([id, entity]) => ({
      id,
      label: entity.label,
    })),
    groups: view.groups.map(({ id, label, entities }) => ({ id, label, members: entities })),
    relations: view.relations.map((relation) => ({
      ...relation,
      from: document.relations[relation.id].subject,
      to: document.relations[relation.id].object,
      text: "",
    })),
  });
}
