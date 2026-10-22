import assert from "node:assert/strict";
import test from "node:test";
import { neutralInteractiveFacts } from "../packages/publisher/src/compiler/interactive-document.mjs";
import { composeInteractiveEditionScene } from "../packages/publisher/src/scene/interactive/edition.mjs";
import { projectSourceReading } from "../packages/publisher/renderers/interactive/source-reading.mjs";
import { sourceReadingFixture } from "./fixtures/source-reading.mjs";

test("authored and neutral public compilation use original Archify for figures and source reading", async (t) => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const { compileEditionCandidateInput } =
    await import("../packages/publisher/src/compiler/index.mjs");
  const { sha } = await import("./fixtures/source-reading.mjs");
  const template = await fs.readFile(
    new URL("../packages/publisher/renderers/archify/supply/assets/template.html", import.meta.url),
    "utf8",
  );
  const executable = (value) =>
    [...value.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)]
      .filter(([, attrs]) => !/type="application\/json"/u.test(attrs))
      .map(([, , body]) => body);
  for (const authored of [false, true]) {
    const { root } = await sourceReadingFixture(t, { authored });
    const input = path.join(root, "build-request.json");
    const output = path.join(root, "native-candidate");
    await compileEditionCandidateInput(input, sha(await fs.readFile(input)), output);
    const html = await fs.readFile(path.join(output, "interactive/architecture.html"), "utf8");
    const data = JSON.parse(
      html.match(
        /<script id="architecture-interactive-data" type="application\/json">([\s\S]*?)<\/script>/u,
      )[1],
    );
    assert(Object.values(data.pages).every(({ nativeReader }) => nativeReader === "archify/v1"));
    assert(
      !html.includes("ArchitectureSourceReader"),
      "a second graphical runtime is not the native integration",
    );
    for (const page of Object.values(data.sourceReading.pages)) {
      const content = page.pieces
        .map((piece) => (typeof piece === "number" ? data.blocks[piece] : piece))
        .join("");
      assert.match(content, /<meta name="publication-reader" content="archify\/v1">/u);
      assert.deepEqual(executable(content), executable(template));
    }
  }
});

test("automatic Inspect retains exact Claims and the authoritative editorial edition", async (t) => {
  const { meaning: original } = await sourceReadingFixture(t);
  const meaning = structuredClone(original);
  const editorial = {
    id: "editorial-release-boundary",
    kind: "editorial",
    statement: "Selected release Claims do not establish current runtime behavior.",
    proponent: meaning.edition.editor,
    semanticStatus: "editor-attributed-unverified",
    basis: ["release"],
    questions: ["release"],
  };
  meaning.assertions.push(editorial);
  meaning.media.interactive.views[1].assertionIds.push(editorial.id);
  const scene = composeInteractiveEditionScene(meaning);
  const projection = projectSourceReading(meaning.native.sourceReading, scene.pages);
  const page = scene.pages[1];
  const { facts, subjectNamespaces } = neutralInteractiveFacts(page, projection, meaning.edition);
  const claim = facts.find(({ graphicId }) => graphicId === "c-0");
  assert.equal(claim.reference, '["alpha","claim","release"]');
  assert.equal(
    claim.sourceSha256,
    projection.claims.find(({ reference }) => reference === claim.reference).source.sha256,
  );
  assert.deepEqual(claim.facts, page.claimCards[0].facts);
  assert.deepEqual(subjectNamespaces["c-0"], ["alpha"]);
  const judgment = facts.find(({ graphicId }) => graphicId === "editorial-0");
  assert.equal(judgment.reference, JSON.stringify([meaning.edition.id, "editorial", editorial.id]));
  assert.equal(judgment.editionSha256, meaning.edition.sha256);
  assert.equal(
    judgment.sourceSha256,
    undefined,
    "editorial judgments never acquire source authority",
  );
  assert.deepEqual(judgment.facts, [
    { label: "Statement", value: editorial.statement },
    { label: "Proponent", value: editorial.proponent },
    { label: "Status", value: "editor-attributed-unverified" },
  ]);
  assert.deepEqual(subjectNamespaces["editorial-0"], []);
});
