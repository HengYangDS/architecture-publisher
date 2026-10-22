import { SELF_RELATIONS } from "../../editions/self/src/edition/relations.mjs";
import { architecturePublisherInteractiveScenes } from "../../editions/self/src/edition/interactive-scenes.mjs";
import { meaningFor, sceneFor } from "./authored-routes.mjs";
import { claimModel } from "./claim-model.mjs";

export function selfDocument() {
  const document = claimModel();
  const views = architecturePublisherInteractiveScenes();
  const ids = new Set(
    Object.values(views).flatMap(({ composition }) =>
      composition.groups.flatMap(({ entities }) => entities),
    ),
  );
  document.entities = Object.fromEntries(
    [...ids].map((id) => [
      id,
      {
        type: "component",
        label: id,
        provenance: ["contract"],
      },
    ]),
  );
  document.relations = structuredClone(SELF_RELATIONS);
  return document;
}

export function ordinaryMeaning() {
  const meaning = meaningFor("interactive");
  const scene = sceneFor(meaning, "interactive");
  scene.nodes = scene.nodes.map((node) =>
    node.adornment
      ? node
      : (({ id, position, size, semanticIds }) => ({
          id,
          position,
          size,
          semanticIds,
          label: id,
          visualRole: "backend",
          figureKind: "component",
        }))(node),
  );
  meaning.editorial.visualPolicy = {
    profile: "neutral",
    figureTypes: { component: "lucide:box" },
  };
  return meaning;
}
