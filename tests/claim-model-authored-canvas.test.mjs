import assert from "node:assert/strict";

import fs from "node:fs/promises";

import path from "node:path";

import test from "node:test";

import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from "../packages/publisher/src/compiler/index.mjs";

import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";

import { composeAuthoredStaticCanvas } from "../packages/publisher/src/scene/static/authored-canvas.mjs";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import {
  modelNamespace,
  groupedMixedFixture,
  assertAuthoredFormCannotDisappear,
} from "./fixtures/claim-selection.mjs";

test("one authored canvas binds two views and selected relation endpoints without duplicate selections", async (t) => {
  const selected = await groupedMixedFixture(t, { media: ["static"] });
  selected.project.presentation.static.width = 1200;
  selected.project.questions.push({
    id: "shared-client",
    audience: "maintainer",
    text: "Which client is shared across the selected readings?",
  });
  selected.project.presentation.static.views.push({
    id: "shared-client",
    questions: ["shared-client"],
  });
  selected.project.scope.selections[0].questions.push("shared-client");
  selected.project.visualPolicy.override = "refinement.json";
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const semantic = (kind, id) => JSON.stringify([modelNamespace, kind, id]);
  const box = (x, y, width, height) => ({ x, y, width, height });
  const measurer = await createBundledTextMeasurer(
    await loadBundledFonts(),
    ["Client", "Server", "Calls", "All approve"].map((text) => ({
      text,
      fontSize: 16,
      weight: "600",
      anchor: "middle",
      x: 0,
      baseline: 0,
    })),
  );
  const node = (id, x) => ({
    id,
    kind: "stage",
    tone: "ink",
    center: { x, y: 200 },
    radius: 12,
    box: box(x - 12, 188, 24, 24),
    paintBox: box(x - 13, 187, 26, 26),
    strokeWidth: 2,
    semanticIds: [semantic("entity", id)],
  });
  const label = (id, value, x, y, bound) => ({
    id,
    text: value,
    fontSize: 16,
    weight: "600",
    anchor: "middle",
    tone: "ink",
    x,
    baseline: y,
    visible: true,
    semanticIds: [bound],
    box: measurer.box({
      text: value,
      fontSize: 16,
      weight: "600",
      anchor: "middle",
      x,
      baseline: y,
    }),
  });
  const resource = {
    schema: "architecture.scene-refinement/v1",
    media: {
      static: {
        kind: "authored-canvas",
        scene: {
          schema: "architecture.authored-static-scene/v1",
          title: selected.project.title,
          subtitle: selected.project.narrative.summary,
          width: 800,
          height: 400,
          referenceWidth: 800,
          spine: ["client", "server"],
          paint: { paper: "#f3f0e8", ink: "#26362f", line: "#7d9183" },
          nodes: [node("client", 100), node("server", 600)],
          texts: [
            label("client-label", "Client", 100, 150, semantic("entity", "client")),
            label("server-label", "Server", 600, 150, semantic("entity", "server")),
            label("relation-label", "Calls", 350, 180, semantic("relation", "request")),
          ],
          edges: [
            {
              id: "request",
              kind: "flow",
              source: "client",
              target: "server",
              points: [
                { x: 112, y: 200 },
                { x: 588, y: 200 },
              ],
              strokeWidth: 1.5,
              arrow: true,
              arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 1.2 },
              semanticIds: [semantic("relation", "request")],
              strokeTone: "line",
            },
          ],
          decorations: [],
          requiredSemanticIds: [
            semantic("entity", "client"),
            semantic("entity", "server"),
            semantic("relation", "request"),
          ],
        },
      },
    },
  };
  const resourcePath = path.join(selected.root, "edition/refinement.json");
  await fs.writeFile(resourcePath, JSON.stringify(resource) + "\n");
  const output = path.join(selected.root, "canvas-candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json")));
  assert(candidate.limits.includes("authored-canvas-claim-facts-not-exhaustively-painted"));
  assert(candidate.limits.includes("authored-canvas-text-meaning-unverified"));
  assert.equal(
    (await fs.readFile(path.join(output, "static/architecture.png"))).readUInt32BE(16),
    1200,
  );
  await assertAuthoredFormCannotDisappear(selected, "static");

  const overstated = structuredClone(resource);
  overstated.media.static.scene.texts[0] = label(
    "client-label",
    "All approve",
    100,
    150,
    semantic("entity", "client"),
  );
  await fs.writeFile(resourcePath, JSON.stringify(overstated) + "\n");
  try {
    const overstatedOutput = path.join(selected.root, "overstated-candidate");
    await compileEditionCandidateInput(
      selected.requestPath,
      selected.requestSha256,
      overstatedOutput,
    );
    const overstatedCandidate = JSON.parse(
      await fs.readFile(path.join(overstatedOutput, "candidate.json")),
    );
    assert.equal(overstatedCandidate.qualification, "unqualified");
    assert(overstatedCandidate.limits.includes("authored-canvas-text-meaning-unverified"));
    assert.match(
      await fs.readFile(path.join(overstatedOutput, "static/architecture.svg"), "utf8"),
      /All approve/u,
    );
  } finally {
    await fs.writeFile(resourcePath, JSON.stringify(resource) + "\n");
  }

  const collided = structuredClone(resource);
  collided.media.static.scene.texts[1].box = {
    ...collided.media.static.scene.texts[0].box,
  };
  await fs.writeFile(resourcePath, JSON.stringify(collided) + "\n");
  try {
    await assert.rejects(
      compileEditionCandidateInput(
        selected.requestPath,
        selected.requestSha256,
        path.join(selected.root, "collided-candidate"),
      ),
      { code: "authored_canvas_geometry_invalid" },
    );
  } finally {
    await fs.writeFile(resourcePath, JSON.stringify(resource) + "\n");
  }

  const cramped = structuredClone(resource);
  const clientLabel = cramped.media.static.scene.texts[0];
  const serverLabel = cramped.media.static.scene.texts[1];
  serverLabel.x = clientLabel.box.x + clientLabel.box.width + 2 + serverLabel.box.width / 2;
  serverLabel.box = measurer.box({
    text: serverLabel.text,
    fontSize: serverLabel.fontSize,
    weight: serverLabel.weight,
    anchor: serverLabel.anchor,
    x: serverLabel.x,
    baseline: serverLabel.baseline,
  });
  await fs.writeFile(resourcePath, JSON.stringify(cramped) + "\n");
  try {
    await assert.rejects(
      compileEditionCandidateInput(
        selected.requestPath,
        selected.requestSha256,
        path.join(selected.root, "cramped-candidate"),
      ),
      {
        code: "authored_canvas_geometry_invalid",
        message: /authored_canvas_geometry_invalid:text-clearance/u,
      },
    );
  } finally {
    await fs.writeFile(resourcePath, JSON.stringify(resource) + "\n");
  }

  const falselyMeasured = structuredClone(resource);
  falselyMeasured.media.static.scene.texts[0].text = "A".repeat(100);
  await fs.writeFile(resourcePath, JSON.stringify(falselyMeasured) + "\n");
  try {
    await assert.rejects(
      compileEditionCandidateInput(
        selected.requestPath,
        selected.requestSha256,
        path.join(selected.root, "falsely-measured-candidate"),
      ),
      { code: "authored_canvas_text_metrics_invalid" },
    );
  } finally {
    await fs.writeFile(resourcePath, JSON.stringify(resource) + "\n");
  }

  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.requestPath, selected.requestSha256),
  );
  const authored = composeAuthoredStaticCanvas(meaning);
  assert.equal(authored.scene.schema, "architecture.authored-static-scene/v1");
  assert.deepEqual(
    authored.carriers.views.map(({ id }) => id),
    ["overview", "shared-client"],
  );
  const canvas = (value) => value.refinement.media.static.scene;
  const firstAssertion = (value) =>
    value.assertions.find(({ id }) => value.media.static.views[0].assertionIds[0] === id);
  for (const [name, mutate, code] of [
    [
      "empty selected view",
      (value) => (value.media.static.views[1].assertionIds = []),
      "authored_canvas_input_invalid",
    ],
    [
      "claim cannot borrow a relation from another view",
      (value) => {
        const claim = value.assertions.find(
          ({ selection }) =>
            value.native.selections.find((item) => item.selectionId === selection)?.target.kind ===
            "claim",
        );
        value.media.static.views[1].assertionIds = [claim.id];
      },
      "authored_canvas_claim_unbound",
    ],
    [
      "duplicate assertion identity",
      (value) => value.assertions.push(structuredClone(value.assertions[0])),
      "authored_canvas_input_invalid",
    ],
    [
      "duplicate selection identity",
      (value) => value.native.selections.push(structuredClone(value.native.selections[0])),
      "authored_canvas_input_invalid",
    ],
    [
      "same source meaning selected under two assertion IDs",
      (value) => {
        const view = value.media.static.views[0];
        const assertion = value.assertions.find(
          (item) =>
            view.assertionIds.includes(item.id) &&
            value.native.selections.some(
              (selection) =>
                selection.selectionId === item.selection && selection.target.kind === "relation",
            ),
        );
        const selection = structuredClone(
          value.native.selections.find((item) => item.selectionId === assertion.selection),
        );
        selection.selectionId = "duplicate-source";
        value.native.selections.push(selection);
        value.assertions.push({
          ...assertion,
          id: "duplicate-source-assertion",
          selection: selection.selectionId,
        });
        view.assertionIds.push("duplicate-source-assertion");
      },
      "authored_canvas_membership_mismatch",
    ],
    [
      "editorial assertion as source",
      (value) => (firstAssertion(value).kind = "editorial"),
      "authored_canvas_editorial_unadmitted",
    ],
    [
      "unselected source assertion",
      (value) => (firstAssertion(value).selection = "missing"),
      "authored_canvas_source_unadmitted",
    ],
    [
      "relation endpoint with contradictory source digest",
      (value) => {
        const relation = value.native.selections.find(({ target }) => target.kind === "relation");
        relation.members.elements[0].sha256 = "0".repeat(64);
      },
      "authored_canvas_source_unadmitted",
    ],
    [
      "non-string source reference",
      (value) => (canvas(value).requiredSemanticIds[0] = 42),
      "authored_canvas_reference_invalid",
    ],
    [
      "malformed source reference",
      (value) => (canvas(value).requiredSemanticIds[0] = "not-json"),
      "authored_canvas_reference_invalid",
    ],
    [
      "noncanonical source reference",
      (value) =>
        (canvas(value).requiredSemanticIds[0] = '[ "fixture/claims", "entity", "client" ]'),
      "authored_canvas_reference_invalid",
    ],
    [
      "duplicate declared reference",
      (value) => canvas(value).requiredSemanticIds.push(canvas(value).requiredSemanticIds[0]),
      "authored_canvas_membership_mismatch",
    ],
    [
      "unselected declared reference",
      (value) => (canvas(value).requiredSemanticIds[0] = semantic("entity", "other")),
      "authored_canvas_membership_mismatch",
    ],
    [
      "duplicate node graphic",
      (value) => (canvas(value).nodes[1].id = canvas(value).nodes[0].id),
      "authored_canvas_graphic_ambiguous",
    ],
    [
      "repeated entity cannot replace a required distinct entity",
      (value) => (canvas(value).nodes[1].semanticIds = [...canvas(value).nodes[0].semanticIds]),
      "authored_canvas_membership_mismatch",
    ],
    [
      "missing entity carrier",
      (value) => (canvas(value).nodes[0].semanticIds = []),
      "authored_canvas_membership_mismatch",
    ],
    [
      "duplicate text graphic",
      (value) => (canvas(value).texts[1].id = canvas(value).texts[0].id),
      "authored_canvas_graphic_ambiguous",
    ],
    [
      "hidden source text",
      (value) => (canvas(value).texts[0].visible = false),
      "authored_canvas_membership_mismatch",
    ],
    [
      "repeated text reference cannot erase a required distinct member",
      (value) => (canvas(value).texts[1].semanticIds = [...canvas(value).texts[0].semanticIds]),
      "authored_canvas_membership_mismatch",
    ],
    [
      "missing relation text",
      (value) => (canvas(value).texts[2].semanticIds = []),
      "authored_canvas_membership_mismatch",
    ],
    [
      "duplicate edge graphic",
      (value) => canvas(value).edges.push(structuredClone(canvas(value).edges[0])),
      "authored_canvas_graphic_ambiguous",
    ],
    [
      "missing edge endpoint",
      (value) => (canvas(value).edges[0].target = "missing"),
      "authored_canvas_edge_binding_mismatch",
    ],
    [
      "edge without relation binding",
      (value) => (canvas(value).edges[0].semanticIds = []),
      "authored_canvas_edge_binding_mismatch",
    ],
    [
      "entity miscast as edge relation",
      (value) => (canvas(value).edges[0].semanticIds = [semantic("entity", "client")]),
      "authored_canvas_edge_binding_mismatch",
    ],
    [
      "relation with absent semantic endpoint",
      (value) => (canvas(value).edges[0].target = "client"),
      "authored_canvas_edge_binding_mismatch",
    ],
    [
      "relation rendered in reverse",
      (value) => {
        const edge = canvas(value).edges[0];
        [edge.source, edge.target] = [edge.target, edge.source];
      },
      "authored_canvas_edge_binding_mismatch",
    ],
    [
      "a repeated relation still rejects a reversed arrow",
      (value) => {
        const duplicate = structuredClone(canvas(value).edges[0]);
        duplicate.id = "request-copy";
        [duplicate.source, duplicate.target] = [duplicate.target, duplicate.source];
        canvas(value).edges.push(duplicate);
      },
      "authored_canvas_edge_binding_mismatch",
    ],
  ]) {
    const mutated = structuredClone(meaning);
    mutate(mutated);
    assert.throws(() => composeAuthoredStaticCanvas(mutated), { code }, name);
  }

  resource.media.static.scene.edges[0].semanticIds = [semantic("relation", "invented")];
  await fs.writeFile(resourcePath, JSON.stringify(resource) + "\n");
  await assert.rejects(
    compileEditionCandidateInput(
      selected.requestPath,
      selected.requestSha256,
      path.join(selected.root, "forged-canvas"),
    ),
    { code: "authored_canvas_edge_binding_mismatch" },
  );
});
