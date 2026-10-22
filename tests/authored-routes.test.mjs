import assert from "node:assert/strict";
import test from "node:test";
import { parseSelectedSceneRefinement } from "../packages/publisher/src/edition/refinement.mjs";
import { sha, meaningFor, sceneFor, compose, composedScene } from "./fixtures/authored-routes.mjs";

test("geometry-free scenes bind repeated occurrences and directed shared routes before layout", () => {
  const meaning = meaningFor("interactive", false);
  meaning.editorial.visualPolicy = { figureTypes: { component: "lucide:box" } };
  const scene = sceneFor(meaning, "interactive");
  delete scene.viewport;
  scene.nodes = scene.nodes.map(({ id, semanticIds, adornment, primitives }) =>
    adornment
      ? { id, semanticIds, adornment, primitives }
      : { id, semanticIds, label: id === "client" ? "Client" : "Server", visualRole: "external" },
  );
  scene.edges = scene.edges.map((edge) => {
    const value = { ...edge };
    delete value.points;
    delete value.arrowGeometry;
    return value;
  });
  scene.texts = scene.texts.map((label) => {
    const value = { ...label };
    for (const key of ["x", "baseline", "box", "fontSize"]) delete value[key];
    return value;
  });
  scene.nodes.push({ ...scene.nodes[0], id: "client-again" });
  const before = structuredClone(meaning);
  const refinement = meaning.refinement.media.interactive;
  const bytes = Buffer.from(
    JSON.stringify({
      schema: "architecture.scene-refinement/v1",
      media: { interactive: refinement },
    }),
  );
  assert.doesNotThrow(() => parseSelectedSceneRefinement(bytes, ["interactive"], sha(bytes)));
  const result = compose(meaning, "interactive");
  assert.deepEqual(meaning, before);
  const next = composedScene(result, "interactive");
  assert.equal(next.nodes.length, 4);
  assert.deepEqual(next.routes, scene.routes);
  assert.deepEqual(next.nodes[0].semanticIds, next.nodes[3].semanticIds);
  assert(
    next.nodes.every((node) => !Object.hasOwn(node, "position") && !Object.hasOwn(node, "size")),
  );
  assert.equal(
    result.pages[0].facts.filter(({ graphicId }) => ["client", "client-again"].includes(graphicId))
      .length,
    2,
  );
});

test("partial literal geometry is rejected instead of guessing layout intent", () => {
  const meaning = meaningFor("interactive");
  const scene = sceneFor(meaning, "interactive");
  delete scene.viewport;
  assert.throws(() => compose(meaning, "interactive"), /interactive_scene_/u);
});

test("one generated refinement schema admits exact routes in both independent media", () => {
  const refinement = {
    schema: "architecture.scene-refinement/v1",
    media: {
      static: meaningFor("static").refinement.media.static,
      interactive: meaningFor("interactive").refinement.media.interactive,
    },
  };
  const bytes = Buffer.from(JSON.stringify(refinement));
  assert.equal(
    parseSelectedSceneRefinement(bytes, ["static", "interactive"], sha(bytes)).media.static.scene
      .routes.length,
    2,
  );
});
