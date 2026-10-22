import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { claimModel } from "./claim-model.mjs";
import { sha, child } from "./installed-edition.mjs";

export async function verifyOccurrenceEdition({
  consumer,
  nodeEnvironment,
  modelBytes,
  claimProject,
  claimRequest,
}) {
  const occurrenceInputs = path.join(consumer, "occurrence-inputs");
  await fs.mkdir(path.join(occurrenceInputs, "edition"), { recursive: true });
  await fs.mkdir(path.join(occurrenceInputs, "sources"));
  await fs.writeFile(path.join(occurrenceInputs, "sources/model.json"), modelBytes);
  const occurrenceProject = structuredClone(claimProject);
  occurrenceProject.id = "installed-occurrences";
  occurrenceProject.scope.selections = [
    ["entity", "client"],
    ["entity", "server"],
    ["relation", "request"],
    ["claim", "intended"],
    ["claim", "observed"],
  ].map(([kind, id]) => ({
    id: `${kind}-${id}`,
    namespace: "example/claims",
    kind: "reference",
    reference: `${kind}:${id}`,
    questions: ["shape"],
  }));
  occurrenceProject.visualPolicy.override = "refinement.json";
  await fs.writeFile(
    path.join(occurrenceInputs, "edition/project.json"),
    JSON.stringify(occurrenceProject) + "\n",
  );
  const occurrenceRequest = { ...claimRequest, media: ["interactive"] };
  await fs.writeFile(
    path.join(occurrenceInputs, "build-request.json"),
    JSON.stringify(occurrenceRequest) + "\n",
  );
  const semantic = (kind, id) => JSON.stringify(["example/claims", kind, id]);
  const occurrenceNode = (id, entity, x) => ({
    id,
    position: { x, y: 160 },
    size: { width: 160, height: 80 },
    semanticIds: [semantic("entity", entity)],
    primitives: [
      {
        kind: "rect",
        box: { x: 0, y: 0, width: 160, height: 80 },
        fill: "paper",
        stroke: "ink",
        strokeWidth: 2,
      },
    ],
  });
  const occurrenceEdge = (id, from) => ({
    id,
    from,
    to: "server",
    label: "Source request",
    visualRole: "default",
    fromSide: "right",
    toSide: "left",
    route: "auto",
    semanticIds: [semantic("relation", "request")],
  });
  await fs.writeFile(
    path.join(occurrenceInputs, "edition/refinement.json"),
    JSON.stringify({
      schema: "architecture.scene-refinement/v1",
      media: {
        interactive: {
          kind: "authored-architecture",
          pages: [
            {
              id: "overview",
              label: "Repeated concepts",
              purpose: "overview",
              scene: {
                schema: "architecture.interactive-scene/v1",
                id: "overview",
                title: occurrenceProject.title,
                subtitle: "Repeated concepts",
                viewport: { width: 1000, height: 500 },
                groups: [],
                nodes: [
                  occurrenceNode("client-a", "client", 40),
                  occurrenceNode("client-b", "client", 320),
                  occurrenceNode("server", "server", 720),
                ],
                edges: [
                  occurrenceEdge("request-a", "client-a"),
                  occurrenceEdge("request-b", "client-b"),
                ],
              },
            },
          ],
        },
      },
    }) + "\n",
  );
  await fs.writeFile(
    path.join(consumer, "occurrence-run.mjs"),
    `
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compileEditionCandidateInput } from 'architecture-publisher/compiler';
const request = fileURLToPath(new URL('./occurrence-inputs/build-request.json', import.meta.url));
const output = fileURLToPath(new URL('./occurrence-candidate', import.meta.url));
const digest = createHash('sha256').update(await fs.readFile(request)).digest('hex');
const built = await compileEditionCandidateInput(request, digest, output);
const html = await fs.readFile(new URL('./occurrence-candidate/interactive/architecture.html', import.meta.url), 'utf8');
const work = JSON.parse(html.match(/<script id="architecture-interactive-data" type="application\\/json">([\\s\\S]*?)<\\/script>/u)[1]);
const page = work.pages.overview;
const painted = page.pieces.map((piece) => typeof piece === 'number' ? work.blocks[piece] : piece).join('');
for (const id of ['client-a', 'client-b', 'server']) {
  if (!painted.includes('data-inspect-id="' + id + '"') || !page.subjectSources[id]?.length || !page.facts.some((fact) => fact.graphicId === id)) throw Error('installed_primitive_identity_invalid:' + id);
}
const reading = work.sourceReading;
const reference = JSON.stringify(['example/claims', 'relation', 'request']);
const occurrence = reading.projection.pages.find((item) => item.id === 'overview').occurrences.find((item) => item.reference === reference);
if (JSON.stringify(occurrence?.graphicIds) !== JSON.stringify(['request-a', 'request-b'])) throw Error('installed_relation_occurrences_missing');
const relation = reading.projection.relations.find((item) => item.reference === reference);
const binding = reading.pages.overview.bindings[reference];
const sourcePage = reading.pages.overview.pieces.map((piece) => typeof piece === 'number' ? work.blocks[piece] : piece).join('');
if (!relation || binding?.kind !== 'relation' || !sourcePage.includes('data-edge-id="' + binding.id + '"')) throw Error('installed_native_source_relation_missing');
if (!painted.includes('stroke-linejoin="round"')) throw Error('installed_primitive_join_invalid');
if (/data-logical-relation="true"/.test(painted)) throw Error('installed_ambiguous_source_relation');
await fs.rm(output, { recursive: true });
console.log(JSON.stringify({ status: built.status, candidateSha256: built.candidateSha256,
  subjects: Object.keys(page.subjectSources),
  references: page.facts.map(({ reference, graphicId }) => ({ reference, graphicId })),
  selectedClaims: page.facts.filter(({ reference }) => JSON.parse(reference)[1] === 'claim').length }));
`,
  );
  const occurrenceRun = (directory) =>
    JSON.parse(
      child(
        process.execPath,
        [path.join(directory, "occurrence-run.mjs")],
        directory,
        nodeEnvironment,
      ).trim(),
    );
  const occurrenceFirst = occurrenceRun(consumer);
  assert.equal(occurrenceFirst.status, "built");
  assert.equal(occurrenceFirst.subjects.length, 5);
  assert.equal(occurrenceFirst.selectedClaims, 4);
  assert.equal(occurrenceFirst.references.length, 9);
  assert.equal(new Set(occurrenceFirst.references.map(({ reference }) => reference)).size, 5);
  return { semantic, occurrenceRun, occurrenceFirst };
}

export async function verifyStatementEdition({
  consumer,
  nodeEnvironment,
  claimProject,
  claimRequest,
  semantic,
}) {
  const statementInputs = path.join(consumer, "statement-inputs");
  await fs.mkdir(path.join(statementInputs, "edition"), { recursive: true });
  await fs.mkdir(path.join(statementInputs, "sources"));
  const statementModel = claimModel();
  statementModel.claims.published.dependsOn = [];
  statementModel.claims["second-statement"] = {
    ...structuredClone(statementModel.claims.published),
    value: { text: "The client retains the selected intent." },
  };
  const statementBytes = Buffer.from(JSON.stringify(statementModel));
  await fs.writeFile(path.join(statementInputs, "sources/model.json"), statementBytes);
  const statementProject = structuredClone(claimProject);
  statementProject.id = "installed-statements";
  statementProject.scope.selections = ["published", "second-statement"].map((id) => ({
    id: `claim-${id}`,
    namespace: "example/claims",
    kind: "reference",
    reference: `claim:${id}`,
    questions: ["shape"],
  }));
  statementProject.questions.push({
    id: "editorial",
    audience: "maintainer",
    text: "What is editorial judgment?",
  });
  statementProject.editorialAssertions = [
    {
      id: "editorial-choice",
      statement: "This Edition attributes source and editorial statements separately.",
      proponent: "fixture-editor",
      basis: ["claim-published"],
      questions: ["editorial"],
    },
  ];
  statementProject.presentation.interactive.views = [
    { id: "overview", questions: ["shape"] },
    { id: "editorial", questions: ["editorial"] },
  ];
  statementProject.presentation.static = {
    views: [{ id: "overview", questions: ["shape", "editorial"] }],
    intent: "Read source and editorial statements in one independent frame.",
    width: 1800,
  };
  statementProject.visualPolicy.override = "refinement.json";
  await fs.writeFile(
    path.join(statementInputs, "edition/project.json"),
    JSON.stringify(statementProject) + "\n",
  );
  const statementRequest = { ...claimRequest, media: ["static", "interactive"] };
  statementRequest.sources = [
    {
      ...claimRequest.sources[0],
      input: { kind: "pin", path: "sources/model.json", sha256: sha(statementBytes) },
    },
  ];
  await fs.writeFile(
    path.join(statementInputs, "build-request.json"),
    JSON.stringify(statementRequest) + "\n",
  );
  const statementRefinement = {
    schema: "architecture.scene-refinement/v1",
    media: {
      interactive: {
        kind: "authored-architecture",
        pages: [
          {
            id: "overview",
            label: "Source statements",
            purpose: "overview",
            scene: {
              schema: "architecture.interactive-scene/v1",
              id: "overview",
              title: statementProject.title,
              subtitle: "Source statements",
              viewport: { width: 1000, height: 500 },
              nodes: [],
              groups: [],
              edges: [],
              texts: ["published", "second-statement"].map((id, index) => ({
                id: `statement-${id}`,
                text: index === 0 ? "Literal $$ $& $' $`" : statementModel.claims[id].value.text,
                fontSize: 16,
                weight: "400",
                anchor: "start",
                tone: "ink",
                x: 60,
                baseline: 140 + index * 70,
                visible: true,
                semanticIds: [semantic("claim", id)],
                box: { x: 60, y: 124 + index * 70, width: 300, height: 16 },
              })),
              requiredSemanticIds: ["published", "second-statement"].map((id) =>
                semantic("claim", id),
              ),
            },
          },
          {
            id: "editorial",
            label: "Editorial judgment",
            purpose: "mechanism",
            scene: {
              schema: "architecture.interactive-scene/v1",
              id: "editorial",
              title: statementProject.title,
              subtitle: "Editorial judgment",
              viewport: { width: 1000, height: 500 },
              nodes: [],
              groups: [],
              edges: [],
              texts: [
                {
                  id: "editorial-text",
                  text: statementProject.editorialAssertions[0].statement,
                  fontSize: 16,
                  weight: "600",
                  anchor: "start",
                  tone: "ink",
                  x: 60,
                  baseline: 140,
                  visible: true,
                  semanticIds: [
                    JSON.stringify([statementProject.id, "editorial", "editorial-choice"]),
                  ],
                  box: { x: 60, y: 124, width: 500, height: 16 },
                },
              ],
              requiredSemanticIds: [
                JSON.stringify([statementProject.id, "editorial", "editorial-choice"]),
              ],
            },
          },
        ],
      },
    },
  };
  statementRefinement.media.static = {
    kind: "authored-canvas",
    scene: {
      schema: "architecture.authored-static-scene/v1",
      title: statementProject.title,
      subtitle: "Source and editorial statements",
      width: 1000,
      height: 500,
      referenceWidth: 1000,
      spine: [],
      paint: { paper: "#f3f0e8", ink: "#26362f" },
      nodes: [],
      edges: [],
      decorations: [],
      texts: [
        ...structuredClone(statementRefinement.media.interactive.pages[0].scene.texts),
        {
          ...structuredClone(statementRefinement.media.interactive.pages[1].scene.texts[0]),
          baseline: 310,
        },
      ],
      requiredSemanticIds: [
        ...statementRefinement.media.interactive.pages[0].scene.requiredSemanticIds,
        ...statementRefinement.media.interactive.pages[1].scene.requiredSemanticIds,
      ],
    },
  };
  const adornment = {
    id: "editorial-marker",
    semanticIds: [],
    adornment: true,
    primitives: [
      {
        kind: "circle",
        center: { x: 10, y: 10 },
        radius: 8,
        fill: "ink",
        stroke: null,
        strokeWidth: 0,
      },
    ],
  };
  statementRefinement.media.static.scene.nodes.push({
    ...adornment,
    box: { x: 760, y: 380, width: 20, height: 20 },
  });
  statementRefinement.media.interactive.pages[0].scene.nodes.push({
    ...adornment,
    position: { x: 760, y: 380 },
    size: { width: 20, height: 20 },
  });
  await fs.writeFile(
    path.join(consumer, "statement-run.mjs"),
    `
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createBundledTextMeasurer } from './node_modules/architecture-publisher/renderers/resvg/measurement.mjs';
import { loadBundledFonts } from 'architecture-publisher/renderers/fonts';
const root=fileURLToPath(new URL('./statement-inputs/',import.meta.url));
const refinement=${JSON.stringify(statementRefinement)};
const measurer=await createBundledTextMeasurer(await loadBundledFonts(), [...refinement.media.interactive.pages.flatMap(page=>page.scene.texts),...refinement.media.static.scene.texts]);
for(const page of refinement.media.interactive.pages)for(const text of page.scene.texts)text.box=measurer.box(text);
for(const text of refinement.media.static.scene.texts)text.box=measurer.box(text);
await fs.writeFile(root+'edition/refinement.json',JSON.stringify(refinement)+'\\n');
const request=await fs.readFile(root+'build-request.json');
console.log(createHash('sha256').update(request).digest('hex'));
`,
  );
  const statementDigest = child(
    process.execPath,
    [path.join(consumer, "statement-run.mjs")],
    consumer,
    nodeEnvironment,
  ).trim();
  const statementCandidate = path.join(consumer, "statement-candidate");
  child(
    process.execPath,
    [
      path.join(consumer, "node_modules/architecture-publisher/src/cli/main.mjs"),
      "edition",
      "build",
      path.join(statementInputs, "build-request.json"),
      "--sha256",
      statementDigest,
      "--output",
      statementCandidate,
    ],
    consumer,
    nodeEnvironment,
  );
  const statementHtml = await fs.readFile(
    path.join(statementCandidate, "interactive/architecture.html"),
    "utf8",
  );
  const statementWork = JSON.parse(
    statementHtml.match(
      /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
    )[1],
  );
  assert.deepEqual(statementWork.order, ["overview", "editorial"]);
  assert.equal(
    statementWork.pages.overview.facts.filter(
      ({ reference }) => JSON.parse(reference)[1] === "claim",
    ).length,
    2,
  );
  assert.deepEqual(statementWork.pages.editorial.sourceIds, []);
  assert.equal(
    statementWork.pages.editorial.facts[0].editionSha256,
    statementWork.build.editionSha256,
  );
  const statementOutput = statementWork.pages.overview.pieces
    .map((piece) => (typeof piece === "number" ? statementWork.blocks[piece] : piece))
    .join("");
  assert(
    statementOutput.includes("Literal $$ $&amp; $&#39; $`"),
    "Installed public CLI preserves exact dollar text",
  );
  const statementSvg = await fs.readFile(
    path.join(statementCandidate, "static/architecture.svg"),
    "utf8",
  );
  const statementPng = await fs.readFile(path.join(statementCandidate, "static/architecture.png"));
  assert(statementSvg.includes("Literal $$ $&amp; $' $`"));
  assert(statementSvg.includes('data-graphic-id="text:editorial-text"'));
  assert.equal(statementPng.readUInt32BE(16), 1800);
  assert.equal(/<circle\b[^>]*data-graphic-id="node:/u.test(statementSvg), false);
  assert(statementSvg.includes('data-graphic-id="node:editorial-marker" aria-hidden="true"'));
  assert.equal(statementOutput.includes('data-node-id="editorial-marker"'), false);
  assert.equal(
    statementWork.pages.overview.facts.some(({ graphicId }) => graphicId === "editorial-marker"),
    false,
  );
}
