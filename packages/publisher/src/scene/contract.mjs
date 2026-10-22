import { validateEdition } from "../edition/contract.mjs";

export function semanticArchitectureProjections(document, edition) {
  validateEdition(document, edition);
  const overviewId = edition.narrative[0],
    staticScene = {
      id: overviewId,
      label: edition.scenes.static.label,
      ...edition.scenes.static.composition,
    },
    interactiveScenes = edition.narrative.map((id) => ({
      id,
      label: edition.scenes.interactive[id].label,
      purpose: edition.scenes.interactive[id].purpose,
      ...edition.scenes.interactive[id].composition,
    }));
  return {
    staticScene,
    interactiveScenes,
  };
}
