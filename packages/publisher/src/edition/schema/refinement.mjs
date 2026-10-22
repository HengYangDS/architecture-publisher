import { deepFreeze } from "../../semantics/document.mjs";
import { closed } from "./fields.mjs";
import { staticGeometryRefinement, staticCanvasRefinement } from "./static.mjs";
import { interactiveArchitectureRefinement } from "./interactive.mjs";

const neutralRefinement = closed(["kind"], { kind: { const: "neutral" } });

export const SCENE_REFINEMENT_SCHEMA = deepFreeze({
  $id: "architecture.scene-refinement/v1",
  $schema: "http://json-schema.org/draft-07/schema#",
  ...closed(["schema", "media"], {
    schema: { const: "architecture.scene-refinement/v1" },
    media: {
      ...closed([], {
        static: { oneOf: [staticGeometryRefinement, staticCanvasRefinement, neutralRefinement] },
        interactive: { oneOf: [interactiveArchitectureRefinement, neutralRefinement] },
      }),
      minProperties: 1,
    },
  }),
});
