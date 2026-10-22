import { interactiveDocument, interactivePage } from "./fixtures/interactive-member.mjs";
import assert from "node:assert/strict";

import fs from "node:fs/promises";

import os from "node:os";

import path from "node:path";

import test from "node:test";

import { loadBundledFonts } from "../packages/publisher/renderers/fonts/index.mjs";

import { createBundledTextMeasurer } from "../packages/publisher/renderers/resvg/measurement.mjs";

import { compileSelectedEditionCandidateInput } from "../packages/publisher/src/compiler/successor.mjs";

import { renderArchitectureScene } from "../packages/publisher/renderers/archify/index.mjs";

import { claimModel } from "./fixtures/claim-model.mjs";

import { meaningFor } from "./fixtures/authored-routes.mjs";

import { sha, fontInput } from "./fixtures/authored-fonts.mjs";

test("intrinsic rendering refuses infeasible complete text and does not swallow font failures", async (t) => {
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "archpub-intrinsic-boundary-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const fonts = await loadBundledFonts();
  const source = JSON.stringify(["fixture/typesetting", "entity", "source"]);
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "overview",
    title: "Exact source fields",
    subtitle: "Publisher-owned typesetting",
    typography: { minimumTextPx: 32 },
    nodes: [
      { id: "source", label: "W".repeat(2048), visualRole: "backend", semanticIds: [source] },
    ],
    groups: [],
    edges: [],
  };
  const before = structuredClone(scene);
  const output = path.join(root, "infeasible");
  await assert.rejects(renderArchitectureScene({ scene, output, fontSupply: fonts }), {
    code: "render_node_text_infeasible",
  });
  assert.deepEqual(scene, before, "No candidate may shorten or rewrite source meaning");
  await assert.rejects(fs.stat(output), { code: "ENOENT" });

  const selected = structuredClone(scene);
  selected.nodes[0].label = "Exact source";
  selected.typography.minimumTextPx = 12;
  const selectedBefore = structuredClone(selected);
  const refused = path.join(root, "unselected-font");
  await assert.rejects(
    renderArchitectureScene({
      scene: selected,
      output: refused,
      fontSupply: { ...fonts, defaultFamily: "Unselected Family" },
    }),
    { code: "authored_canvas_font_identity_mismatch" },
  );
  assert.deepEqual(selected, selectedBefore, "Supplier errors are not layout retries");
  await assert.rejects(fs.stat(refused), { code: "ENOENT" });
});

test("the public build keeps intrinsic source input separate from resolved font identity", async (t) => {
  const input = await fontInput(t);
  input.project.title = "Source reading";
  input.project.visualPolicy.figureTypes = { component: "lucide:box" };
  input.project.scope.selections.push({
    ...input.project.scope.selections[0],
    id: "telemetry",
    reference: "relation:telemetry",
  });
  const model = claimModel();
  model.relations.telemetry = {
    ...structuredClone(model.relations.request),
    qualifiers: { purpose: "telemetry" },
  };
  const reference = (kind, id) => JSON.stringify(["fixture/routes", kind, id]);
  const scene = {
    schema: "architecture.interactive-scene/v1",
    id: "overview",
    title: "Source reading",
    subtitle: "Geometry is Publisher-owned",
    typography: { minimumTextPx: 12 },
    nodes: ["client", "server"].map((id) => ({
      id,
      label: id === "client" ? "Client" : "Server",
      visualRole: "backend",
      semanticIds: [reference("entity", id)],
    })),
    groups: [],
    edges: ["request", "telemetry"].map((id) => ({
      id,
      from: "client",
      to: "server",
      label: id === "request" ? "Request" : "Telemetry",
      visualRole: "default",
      semanticIds: [reference("relation", id)],
    })),
    texts: [
      {
        id: "source-statement",
        text: "Request  detail\r\n\r\nTelemetry\tcontext\n",
        weight: "500",
        anchor: "middle",
        tone: "muted",
        visible: true,
        semanticIds: [reference("relation", "request")],
      },
    ],
  };
  const refinementBytes = Buffer.from(
    JSON.stringify({
      schema: "architecture.scene-refinement/v1",
      media: {
        interactive: {
          kind: "authored-architecture",
          font: "reading",
          pages: [{ id: "overview", label: scene.subtitle, purpose: "overview", scene }],
        },
      },
    }),
  );
  input.resources.set("refinement.json", refinementBytes);
  await input.save();
  const modelBytes = Buffer.from(JSON.stringify(model));
  await fs.writeFile(path.join(input.root, "sources/model.json"), modelBytes);
  const requestPath = path.join(input.root, "build-request.json");
  const request = JSON.parse(await fs.readFile(requestPath, "utf8"));
  request.sources[0].format = { id: "architecture.claim-model", version: "2" };
  request.sources[0].claimant = model.owner;
  request.sources[0].input.sha256 = sha(modelBytes);
  request.media = ["interactive"];
  const requestBytes = Buffer.from(JSON.stringify(request));
  await fs.writeFile(requestPath, requestBytes);
  const output = path.join(input.root, "candidate");
  await compileSelectedEditionCandidateInput(requestPath, sha(requestBytes), output);
  const html = interactivePage(
    await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
  );
  assert.match(html, /data-intrinsic-text=\\?"source-statement/u);
  const statement = html.match(
    /<text[^>]*data-intrinsic-text="source-statement"[^>]*>([\s\S]*?)<\/text>/u,
  )?.[1];
  assert.equal(statement?.replace(/<[^>]*>/gu, ""), "Request  detailTelemetry    context");
  assert.deepEqual(
    await fs.readFile(path.join(input.root, "edition/refinement.json")),
    refinementBytes,
  );
  assert.deepEqual(await fs.readFile(path.join(input.root, "sources/model.json")), modelBytes);
});

test("one public build measures embeds and rasterizes exact authored 500 and 700 font resources", async (t) => {
  const input = await fontInput(t);
  const bundled = await loadBundledFonts();
  input.project.title = "Shared routes";
  input.project.scope.selections.push({
    ...input.project.scope.selections[0],
    id: "telemetry",
    reference: "relation:telemetry",
  });
  const model = claimModel();
  model.relations.telemetry = {
    ...structuredClone(model.relations.request),
    qualifiers: { purpose: "telemetry" },
  };
  const modelBytes = Buffer.from(JSON.stringify(model));
  const refinement = {
    schema: "architecture.scene-refinement/v1",
    media: {
      static: meaningFor("static").refinement.media.static,
      interactive: meaningFor("interactive").refinement.media.interactive,
    },
  };
  refinement.media.static.font = "reading";
  refinement.media.interactive.font = "reading";
  refinement.media.interactive.pages[0].scene.typography = { minimumTextPx: 10 };
  const scenes = [refinement.media.static.scene, refinement.media.interactive.pages[0].scene];
  for (const scene of scenes) {
    scene.texts[0].weight = "500";
    scene.texts[1].weight = "700";
    scene.texts.push({
      ...scene.texts[0],
      id: "graphic-mark",
      text: "Architecture mark",
      baseline: 340,
      semanticIds: [],
    });
  }
  const measurer = await createBundledTextMeasurer(
    bundled,
    scenes.flatMap(({ texts }) => texts),
  );
  for (const scene of scenes) {
    scene.texts = scene.texts.map((label) => ({ ...label, box: measurer.box(label) }));
  }
  const secondScene = structuredClone(refinement.media.interactive.pages[0].scene);
  secondScene.id = "relations";
  secondScene.subtitle = "Shared relation reading";
  secondScene.texts[0].weight = "400";
  const secondMeasurer = await createBundledTextMeasurer(bundled, secondScene.texts);
  secondScene.texts = secondScene.texts.map((label) => ({
    ...label,
    box: secondMeasurer.box(label),
  }));
  refinement.media.interactive.pages.push({
    id: "relations",
    label: secondScene.subtitle,
    purpose: "mechanism",
    scene: secondScene,
  });
  input.project.presentation.interactive.views.push({ id: "relations", questions: ["shape"] });
  input.resources.set("refinement.json", Buffer.from(JSON.stringify(refinement)));
  await input.save();
  await fs.writeFile(path.join(input.root, "sources/model.json"), modelBytes);
  const requestPath = path.join(input.root, "build-request.json");
  const request = JSON.parse(await fs.readFile(requestPath, "utf8"));
  request.sources[0].format = { id: "architecture.claim-model", version: "2" };
  request.sources[0].claimant = model.owner;
  request.sources[0].input.sha256 = sha(modelBytes);
  const requestBytes = Buffer.from(JSON.stringify(request));
  await fs.writeFile(requestPath, requestBytes);
  const output = path.join(input.root, "candidate");
  await compileSelectedEditionCandidateInput(requestPath, sha(requestBytes), output);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const document = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
  const html = interactivePage(document);
  assert.match(
    svg,
    /<text[^>]*data-graphic-id="text:graphic-mark"[^>]*>Architecture mark<\/text>/u,
  );
  const interactiveWork = interactiveDocument(document);
  const interactive = interactiveWork.pages.overview;
  const painted = interactive.pieces
    .map((piece) => (typeof piece === "number" ? interactiveWork.blocks[piece] : piece))
    .join("");
  const mark = /<text[^>]*data-graphic-id="text:graphic-mark"[^>]*>Architecture mark<\/text>/u.exec(
    painted,
  )?.[0];
  assert(mark, "Nonsemantic text still paints in the independent interactive medium");
  assert.doesNotMatch(
    mark,
    /data-inspect-id|data-inspect-label|data-text-id|data-text-label|role=|tabindex=|aria-label=/u,
  );
  assert.equal(Object.hasOwn(interactive.subjectSources, "graphic-mark"), false);
  assert.match(painted, /<text[^>]*data-text-id="client-label"/u);
  for (const weight of [500, 700]) {
    const face = bundled.fonts.find((item) => item.weight === weight);
    assert.equal(svg.includes(face.bytes.toString("base64")), true);
  }
  assert.equal(html.includes("Architecture Statement"), false);
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json"), "utf8"));
  assert.equal(
    candidate.media.static.supplies.some(({ id }) => id === "selected-fonts"),
    true,
  );
  assert.equal(
    candidate.media.interactive.supplies.some(({ id }) => id === "overview/statement-fonts"),
    true,
  );
  for (const id of ["overview/node-fonts", "relations/node-fonts"]) {
    assert(candidate.media.interactive.supplies.some((supply) => supply.id === id));
  }
  assert.equal(
    (await fs.readFile(path.join(output, "static/architecture.png")))
      .subarray(0, 8)
      .toString("hex"),
    "89504e470d0a1a0a",
  );
});
