import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { materializeBuildRequestInput } from "../../packages/publisher/src/compiler/build-input.mjs";
import { compileEditionMeaning } from "../../packages/publisher/src/compiler/index.mjs";
import { claimModel } from "./claim-model.mjs";
import { loadBundledFonts } from "../../packages/publisher/renderers/fonts/index.mjs";
import { createBundledTextMeasurer } from "../../packages/publisher/renderers/resvg/measurement.mjs";

export const sha = (value) => createHash("sha256").update(value).digest("hex");
export const sourceReference = (namespace, kind, id) => JSON.stringify([namespace, kind, id]);

/** Native source hierarchy and opaque metadata are not editorial groups or claims. */
export async function nativeSourceReadingFixture(t) {
  const root = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-native-reading-"),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "sources"));
  await fs.mkdir(path.join(root, "edition"));
  const model = Buffer.from(
    "specification { element module\n element component }\nmodel { root = module 'Root' { a = component 'Alpha' { metadata { policy 'requires-review' } }\n b = component 'Beta'\n c = component 'Global only'\n a -> b 'Calls' { metadata { contract 'exact-source' } }\n b -> c 'Global call' } }\n",
  );
  const views = Buffer.from(
    "views { view selected { group 'Reader group' { include root.a with { title 'Figure A' } include root.b } } }\n",
  );
  const sources = [
    { id: "model", namespace: "native/model", content: model, path: "sources/model.c4" },
    { id: "views", namespace: "native/views", content: views, path: "sources/views.c4" },
  ];
  const project = {
    schema: "architecture.edition-project/v1",
    id: "native-source-reading",
    editor: "native-source-editor",
    title: "Native source reading",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "calls", audience: "maintainer", text: "Which source calls are selected?" }],
    scope: {
      sourceNamespaces: sources.map(({ namespace }) => namespace),
      selections: [
        {
          id: "selected",
          namespace: "native/views",
          kind: "reference",
          reference: "view:selected",
          questions: ["calls"],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: {
      summary: "Source hierarchy, exact relations and metadata retain their original meaning.",
    },
    presentation: {
      static: {
        views: [{ id: "calls", questions: ["calls"] }],
        intent: "Explain the selected calls.",
      },
      interactive: {
        views: [{ id: "calls", questions: ["calls"] }],
        intent: "Read the selected source calls.",
      },
    },
    visualPolicy: {
      profile: "neutral",
      figureTypes: { module: "lucide:layers", component: "lucide:box" },
    },
  };
  for (const { path: locator, content } of sources)
    await fs.writeFile(path.join(root, locator), content);
  await fs.writeFile(path.join(root, "edition/project.json"), JSON.stringify(project) + "\n");
  const request = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: sources.map(({ id, namespace, path: locator, content }) => ({
      id,
      namespace,
      format: { id: "likec4/dsl", version: "unversioned" },
      claimant: "native-source-owner",
      revision: { kind: "content", algorithm: "sha256" },
      input: { kind: "pin", path: locator, sha256: sha(content) },
    })),
    providers: [],
    media: ["interactive"],
    toolchain: { profile: "portable" },
  };
  const bytes = Buffer.from(JSON.stringify(request) + "\n");
  const file = path.join(root, "build-request.json");
  await fs.writeFile(file, bytes);
  const selected = await materializeBuildRequestInput(file, sha(bytes));
  return { root, selected, meaning: await compileEditionMeaning(selected) };
}

/** Two disconnected source Bs share one explanatory figure, never a query identity. */
export async function sourceReadingFixture(
  t,
  {
    authored = true,
    editorialAssertions = [],
    repeatMember = false,
    entityKind = "component",
  } = {},
) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-reading-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "sources"));
  await fs.mkdir(path.join(root, "edition"));
  const alpha = claimModel();
  const beta = claimModel();
  const entity = (label) => ({
    type: entityKind,
    label,
    qualifiers: {},
    provenance: ["contract"],
  });
  const relation = (subject, object) => ({
    type: "calls",
    subject,
    object,
    qualifiers: {},
    provenance: ["contract"],
  });
  alpha.owner = "alpha-owner";
  alpha.vocabulary.entities = [entityKind];
  alpha.entities = { a: entity("A"), b: entity("Alpha B") };
  alpha.relations = { r: relation("a", "b") };
  alpha.claims = {
    release: {
      ...alpha.claims.published,
      subject: "b",
      condition: { approval: "required" },
      scope: { audience: "operators", environment: "production" },
      value: { text: "Release remains conditional." },
      dependsOn: [{ section: "entities", id: "b" }],
      coverage: "unknown",
    },
  };
  alpha.context = { purpose: "Release approval belongs to the source owner." };
  beta.owner = "beta-owner";
  beta.vocabulary.entities = [entityKind];
  beta.entities = { b: entity("Beta B"), c: entity("C"), d: entity("Global only") };
  beta.relations = { r: relation("b", "c"), unselected: relation("c", "d") };
  beta.claims = {
    unselected: {
      ...beta.claims.published,
      subject: "c",
      dependsOn: [{ section: "entities", id: "c" }],
    },
  };
  const ref = sourceReference;
  const node = (id, x, semanticIds) => ({
    id,
    label: id.toUpperCase(),
    visualRole: "backend",
    position: { x, y: 210 },
    size: { width: 150, height: 75 },
    semanticIds,
  });
  const edge = (id, from, to, reference) => ({
    id,
    from,
    to,
    label: "Calls",
    visualRole: "default",
    fromSide: "right",
    toSide: "left",
    route: "auto",
    semanticIds: [reference],
  });
  const page = (id, label, purpose, nodes, edges, texts, requiredSemanticIds) => ({
    id,
    label,
    purpose,
    scene: {
      schema: "architecture.interactive-scene/v1",
      id,
      title: "Source reading",
      subtitle: label,
      viewport: { width: 960, height: 440 },
      nodes,
      groups: [],
      edges,
      texts,
      requiredSemanticIds,
    },
  });
  const refinement = {
    schema: "architecture.scene-refinement/v1",
    media: {
      interactive: {
        kind: "authored-architecture",
        pages: [
          page(
            "connections",
            "Two independent calls",
            "overview",
            [
              node("a", 70, [ref("alpha", "entity", "a")]),
              node("b", 400, [ref("alpha", "entity", "b"), ref("beta", "entity", "b")]),
              node("c", 730, [ref("beta", "entity", "c")]),
            ],
            [
              edge("alpha-call", "a", "b", ref("alpha", "relation", "r")),
              edge("beta-call", "b", "c", ref("beta", "relation", "r")),
            ],
            [],
            [
              ref("alpha", "entity", "a"),
              ref("alpha", "entity", "b"),
              ref("alpha", "relation", "r"),
              ref("beta", "entity", "b"),
              ref("beta", "entity", "c"),
              ref("beta", "relation", "r"),
            ],
          ),
          page(
            "release",
            "Conditional release",
            "mechanism",
            [],
            [],
            [
              {
                id: "release-statement",
                text: "Release remains conditional.",
                fontSize: 16,
                weight: "400",
                anchor: "start",
                tone: "ink",
                x: 70,
                baseline: 180,
                visible: true,
                semanticIds: [ref("alpha", "claim", "release")],
                box: { x: 70, y: 164, width: 400, height: 16 },
              },
            ],
            [ref("alpha", "claim", "release")],
          ),
        ],
      },
    },
  };
  if (repeatMember) {
    const scene = refinement.media.interactive.pages[0].scene;
    scene.nodes.push({
      ...structuredClone(scene.nodes[0]),
      id: "a-copy",
      label: "A COPY",
      position: { x: 70, y: 330 },
    });
  }
  const project = {
    schema: "architecture.edition-project/v1",
    id: "source-reading",
    editor: "fixture-editor",
    title: "Source reading",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [
      { id: "connections", audience: "maintainer", text: "Which calls are selected?" },
      { id: "release", audience: "maintainer", text: "What qualifies release?" },
    ],
    scope: {
      sourceNamespaces: ["alpha", "beta"],
      selections: [
        {
          id: "alpha-call",
          namespace: "alpha",
          reference: "relation:r",
          questions: ["connections"],
        },
        { id: "beta-call", namespace: "beta", reference: "relation:r", questions: ["connections"] },
        { id: "release", namespace: "alpha", reference: "claim:release", questions: ["release"] },
      ].map((item) => ({ ...item, kind: "reference" })),
      limits: [],
    },
    omissions: [],
    narrative: { summary: "Source identities do not inherit explanatory figure identity." },
    presentation: {
      static: {
        views: [
          { id: "connections", questions: ["connections"] },
          { id: "release", questions: ["release"] },
        ],
        intent: "Explain the selected source architecture.",
      },
      interactive: {
        views: [
          { id: "connections", questions: ["connections"] },
          { id: "release", questions: ["release"] },
        ],
        intent: "Read selected relationships and a qualified statement.",
      },
    },
    visualPolicy: {
      profile: "neutral",
      override: "refinement.json",
      figureTypes: { [entityKind]: "lucide:box" },
    },
  };
  if (!authored) delete project.visualPolicy.override;
  if (editorialAssertions.length) project.editorialAssertions = editorialAssertions;
  const labels = refinement.media.interactive.pages.flatMap((page) => page.scene.texts ?? []);
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), labels);
  for (const label of labels) label.box = measurer.box(label);
  const sourceBytes = {
    alpha: Buffer.from(JSON.stringify(alpha)),
    beta: Buffer.from(JSON.stringify(beta)),
  };
  for (const [namespace, bytes] of Object.entries(sourceBytes))
    await fs.writeFile(path.join(root, "sources", `${namespace}.json`), bytes);
  await fs.writeFile(path.join(root, "edition/project.json"), JSON.stringify(project) + "\n");
  await fs.writeFile(path.join(root, "edition/refinement.json"), JSON.stringify(refinement) + "\n");
  const request = {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: Object.entries(sourceBytes).map(([namespace, bytes]) => ({
      id: namespace,
      namespace,
      format: { id: "architecture.claim-model", version: "2" },
      claimant: `${namespace}-owner`,
      revision: { kind: "content", algorithm: "sha256" },
      input: { kind: "pin", path: `sources/${namespace}.json`, sha256: sha(bytes) },
    })),
    providers: [],
    media: ["interactive"],
    toolchain: { profile: "portable" },
  };
  const requestBytes = Buffer.from(JSON.stringify(request) + "\n");
  const file = path.join(root, "build-request.json");
  await fs.writeFile(file, requestBytes);
  const selected = await materializeBuildRequestInput(file, sha(requestBytes));
  return { root, selected, meaning: await compileEditionMeaning(selected) };
}
