import { staticEditionScene } from "./static-edition-scene.mjs";
import { loadFigureIconSupply } from "../../packages/publisher/renderers/icons/index.mjs";

export const figureIcons = await loadFigureIconSupply();

export function linkedMixedScene() {
  const input = staticEditionScene();
  input.claimCards = [
    {
      namespace: "fixture/claims",
      id: "claim",
      sha256: "a".repeat(64),
      facts: [{ label: "Claim plane", value: "implemented" }],
    },
  ];
  input.sourceAssertionCarriers.push({
    assertionId: "claim",
    selectionId: "claim",
    kind: "claim",
    nodeRefs: [],
    relationRefs: [],
    claimRefs: [{ namespace: "fixture/claims", reference: "claim", sha256: "a".repeat(64) }],
  });
  input.sourceAssertionCarriers[0].kind = "relation";
  input.claimRelationLinks = [{ claimAssertionId: "claim", relationAssertionId: "source-shape" }];
  return input;
}
