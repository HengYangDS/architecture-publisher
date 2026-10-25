import { interactivePage } from "./fixtures/interactive-member.mjs";
import assert from "node:assert/strict";

import fs from "node:fs/promises";

import path from "node:path";

import test from "node:test";

import {
  compileEditionCandidateInput,
  compileEditionMeaning,
} from "../packages/publisher/src/compiler/index.mjs";

import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";

import {
  composeInteractiveEditionScene,
  composeStaticEditionScene,
} from "../packages/publisher/src/scene/index.mjs";

import { verifySelectedCandidateReplay } from "../packages/publisher/src/qualification/index.mjs";

import { claimModel } from "./fixtures/claim-model.mjs";

import {
  sha,
  modelFormat,
  modelNamespace,
  fixture,
  disagreementFixture,
} from "./fixtures/claim-selection.mjs";

test("a typed claim builds independent media with visible qualifiers and no fake parser", async (t) => {
  const selected = await fixture(t);
  const output = path.join(selected.root, "candidate");
  const built = await compileEditionCandidateInput(
    selected.requestPath,
    selected.requestSha256,
    output,
  );
  assert.equal(built.status, "built");
  const replay = await verifySelectedCandidateReplay({
    requestPath: selected.requestPath,
    requestSha256: selected.requestSha256,
    candidateManifestPath: built.manifestPath,
    candidateManifestSha256: built.manifestSha256,
  });
  assert.equal(replay.verdict, "match");
  assert.equal(replay.candidateSha256, built.candidateSha256);
  assert.equal(replay.qualification, "not-performed");
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json")));
  assert.deepEqual(
    candidate.input.semanticSupplies.map(({ id }) => id),
    ["publisher-semantic-file-set"],
  );
  assert.deepEqual(Object.keys(candidate.media).sort(), ["interactive", "static"]);
  assert.deepEqual(
    candidate.media.interactive.supplies.map(({ id }) => id),
    [
      "archify",
      "figure-icons",
      "font-measurement",
      "intrinsic-layout",
      "node-fonts",
      "publisher-interactive-media-file-set",
      "runtime",
      "source-reader/archify",
      "source-reader/figure-icons",
      "source-reader/font-measurement",
      "source-reader/intrinsic-layout",
      "source-reader/node-fonts",
      "source-reader/runtime",
      "statement-fonts",
    ],
  );
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const html = interactivePage(
    await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
  );
  const painted = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
    .map((match) => match[1])
    .join(" ");
  const reading =
    html.match(
      /<div class="card" data-note-card-id="claim-card-0">[\s\S]*?<ul>([\s\S]*?)<\/ul>/u,
    )?.[1] ?? "";
  for (const phrase of [
    "intended",
    "client",
    "calls",
    "server",
    "authorization: granted",
    "environment: local",
    "target",
    "affirmed",
    "Declared product contract",
  ]) {
    assert(painted.includes(phrase), `static claim omits ${phrase}`);
    assert(reading.includes(phrase), `interactive claim omits ${phrase}`);
  }
  assert(painted.includes("Selected claimant: fixture-maintainer"));
  assert(painted.includes("Declared model owner: example:system"));
  assert(painted.includes("Claim plane: intended"));
  assert(painted.includes("Claimant-declared validity: affirmed"));
  assert(!painted.includes("Claim validity: affirmed"));
  assert(painted.includes("Declared dependency coverage: complete"));
  assert(reading.includes("Selected claimant: fixture-maintainer"));
  assert(reading.includes("Declared model owner: example:system"));
  assert(reading.includes("Claim plane: intended"));
  assert(reading.includes("Claimant-declared validity: affirmed"));
  assert.doesNotMatch(svg, /fixture\/claims|contract\.md/u);
  assert.doesNotMatch(html, /contract\.md/u);
});

test("member-flow quantifiers keep source and editorial authority distinct", async (t) => {
  const model = claimModel();
  model.vocabulary.predicates.memberFlow = {
    valueKind: "scalar",
    cardinality: "single",
    values: ["some-member", "all-member"],
    provenance: ["contract"],
  };
  const some = {
    ...structuredClone(model.claims.observed),
    predicate: "memberFlow",
    plane: "intended",
    condition: {},
    scope: { group: "client", target: "server" },
    maturity: "target",
    value: "some-member",
  };
  model.claims.memberFlowSome = some;
  model.claims.memberFlowForbidden = {
    ...structuredClone(some),
    value: "all-member",
    validity: "refuted",
  };
  const selected = await fixture(t, { model, reference: "claim:memberFlowSome" });
  selected.project.questions[0].text = "Which member-flow quantifier is source-declared?";
  selected.project.scope.selections.push({
    id: "selected-forbidden",
    namespace: modelNamespace,
    kind: "reference",
    reference: "claim:memberFlowForbidden",
    questions: ["condition"],
  });
  selected.project.editorialAssertions = [
    {
      id: "proposed-all",
      statement: "All members approve.",
      proponent: "fixture-editor",
      basis: ["selected-claim"],
      questions: ["condition"],
    },
  ];
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );
  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const candidate = JSON.parse(await fs.readFile(path.join(output, "candidate.json")));
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const html = interactivePage(
    await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
  );
  assert.equal(candidate.qualification, "unqualified");
  assert(candidate.limits.includes("claim-model-provenance-unverified"));
  const painted = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
    .map((match) => match[1])
    .join(" ");
  for (const text of ["some-member", "all-member", "refuted"]) {
    assert(painted.includes(text), `static source claim omitted ${text}`);
    assert(html.includes(text), `interactive source claim omitted ${text}`);
  }
  const editorialStart = svg.indexOf("EDITORIAL ASSERTIONS");
  assert(editorialStart >= 0);
  const editorialPaint = [...svg.slice(editorialStart).matchAll(/<text\b[^>]*>([^<]*)<\/text>/gu)]
    .map(([, row]) => row)
    .join("");
  assert(
    editorialPaint.includes(
      "All members approve. · Editorial judgment · fixture-editor · unverified",
    ),
    "the complete painted statement retains its editorial attribution across line breaks",
  );
  assert.match(
    html,
    /data-note-item-id="editorial-attribution-0"[^>]*>Editorial judgment · fixture-editor · unverified<\/li>/u,
  );
  assert.match(html, /data-note-card-id="editorial-card-0"/u);
  assert(html.includes("All members approve."));

  const contradicted = structuredClone(model);
  contradicted.claims.memberFlowForbidden.validity = "affirmed";
  const invalid = await fixture(t, { model: contradicted, reference: "claim:memberFlowSome" });
  await assert.rejects(
    compileEditionCandidateInput(
      invalid.requestPath,
      invalid.requestSha256,
      path.join(invalid.root, "invalid-candidate"),
    ),
    { code: "semantic_contradiction" },
  );
});

test("claim Scenes use typed cards rather than graph nodes or arrows", async (t) => {
  const selected = await fixture(t);
  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  const interactive = composeInteractiveEditionScene(meaning);
  const staticScene = composeStaticEditionScene(meaning, null);
  for (const scene of [interactive.pages[0], staticScene]) {
    assert.deepEqual(scene.nodes, []);
    assert.deepEqual(scene.relations ?? scene.edges, []);
    assert.equal(scene.claimCards.length, 1);
    assert.deepEqual(scene.sourceAssertionCarriers[0].claimRefs, [
      {
        namespace: modelNamespace,
        reference: "intended",
        sha256: sha(Buffer.from(JSON.stringify(selected.model) + "\n")),
      },
    ]);
  }
  assert.throws(
    () =>
      composeStaticEditionScene(meaning, {
        closure: "upstream-layout-unqualified",
        nodes: [],
        edges: [],
      }),
    { code: "static_scene_composition_ambiguous" },
  );
});

test("claim condition and plane changes alter both visible media without changing graph size", async (t) => {
  const changedCondition = claimModel();
  changedCondition.claims.intended.condition.authorization = "denied";
  const changedPlane = claimModel();
  changedPlane.claims.intended.plane = "observed";
  const fixtures = [
    await fixture(t),
    await fixture(t, { model: changedCondition }),
    await fixture(t, { model: changedPlane }),
  ];
  const built = [];
  for (const selected of fixtures) {
    const output = path.join(selected.root, "candidate");
    await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
    built.push({
      candidate: JSON.parse(await fs.readFile(path.join(output, "candidate.json"))),
      svg: await fs.readFile(path.join(output, "static/architecture.svg"), "utf8"),
      html: interactivePage(
        await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
      ),
    });
  }
  for (const changed of built.slice(1)) {
    assert.notEqual(
      changed.candidate.media.static.artifacts[0].sha256,
      built[0].candidate.media.static.artifacts[0].sha256,
    );
    assert.notEqual(
      changed.candidate.media.interactive.artifacts[0].sha256,
      built[0].candidate.media.interactive.artifacts[0].sha256,
    );
  }
  assert.match(built[1].svg, /authorization: denied/u);
  assert.match(built[1].html, /authorization: denied/u);
  assert.match(built[2].svg, /Claim plane: observed/u);
  assert(built[2].html.includes("Claim plane: observed"));
});

test("intended and implemented disagreement remains two attributed visible claims", async (t) => {
  const selected = await disagreementFixture(t);

  const input = await materializeBuildRequestInput(selected.requestPath, selected.requestSha256);
  const meaning = await compileEditionMeaning(input);
  assert.deepEqual(
    meaning.native.selections.map(({ target }) => target.id),
    ["intended", "implemented"],
  );
  for (const scene of [
    composeStaticEditionScene(meaning, null),
    composeInteractiveEditionScene(meaning).pages[0],
  ]) {
    assert.equal(scene.claimCards.length, 2);
    assert.deepEqual(
      scene.sourceAssertionCarriers.map(({ claimRefs }) => claimRefs[0].reference),
      ["intended", "implemented"],
    );
  }

  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, selected.requestSha256, output);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const html = interactivePage(
    await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
  );
  for (const phrase of [
    "Claim plane: intended",
    "Claim plane: implemented",
    "Claimant-declared validity: affirmed",
    "Claimant-declared validity: refuted",
  ])
    assert(svg.includes(phrase), `static claim omits ${phrase}`);
  for (const phrase of [
    "Claim plane: intended",
    "Claim plane: implemented",
    "Claimant-declared validity: affirmed",
    "Claimant-declared validity: refuted",
  ])
    assert(html.includes(phrase), `interactive claim omits ${phrase}`);
});

test("two source claimants can disagree without merging equal native claim IDs", async (t) => {
  const selected = await fixture(t);
  const otherNamespace = "fixture/other-claims";
  const otherModel = claimModel();
  otherModel.owner = "example:other-system";
  otherModel.claims.intended.validity = "refuted";
  const otherBytes = Buffer.from(JSON.stringify(otherModel) + "\n");
  await fs.writeFile(path.join(selected.root, "sources/other-model.json"), otherBytes);

  const request = JSON.parse(await fs.readFile(selected.requestPath, "utf8"));
  request.sources.push({
    id: "other-model",
    namespace: otherNamespace,
    format: modelFormat,
    claimant: "other-maintainer",
    revision: { kind: "content", algorithm: "sha256" },
    input: { kind: "pin", path: "sources/other-model.json", sha256: sha(otherBytes) },
  });
  const requestBytes = Buffer.from(JSON.stringify(request) + "\n");
  await fs.writeFile(selected.requestPath, requestBytes);
  selected.project.scope.sourceNamespaces.push(otherNamespace);
  selected.project.scope.selections.push({
    id: "other-source-claim",
    namespace: otherNamespace,
    kind: "reference",
    reference: "claim:intended",
    questions: ["condition"],
  });
  selected.project.questions[0].text = "How do the two claimants differ?";
  await fs.writeFile(
    path.join(selected.root, "edition/project.json"),
    JSON.stringify(selected.project) + "\n",
  );

  const output = path.join(selected.root, "candidate");
  await compileEditionCandidateInput(selected.requestPath, sha(requestBytes), output);
  const svg = await fs.readFile(path.join(output, "static/architecture.svg"), "utf8");
  const html = interactivePage(
    await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8"),
  );
  for (const claimant of ["fixture-maintainer", "other-maintainer"]) {
    assert(svg.includes(`Selected claimant: ${claimant}`));
    assert(html.includes(`Selected claimant: ${claimant}`));
  }
  for (const validity of ["affirmed", "refuted"]) {
    assert(svg.includes(`Claimant-declared validity: ${validity}`));
    assert(html.includes(`Claimant-declared validity: ${validity}`));
  }
});
