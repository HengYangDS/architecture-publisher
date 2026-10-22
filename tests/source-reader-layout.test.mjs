import assert from "node:assert/strict";
import test from "node:test";
import { composeAuthoredInteractiveArchitecture } from "../packages/publisher/src/scene/interactive/authored-architecture.mjs";
import {
  nativeSourceReadingFixture,
  sourceReadingFixture,
  sourceReference,
} from "./fixtures/source-reading.mjs";
import { composeInteractiveEditionScene } from "../packages/publisher/src/scene/interactive/edition.mjs";
import { projectSourceReading } from "../packages/publisher/renderers/interactive/source-reading.mjs";
import { prepareSourceReader } from "../packages/publisher/renderers/interactive/source-reader.mjs";
import { validateSourceReading } from "../packages/publisher/renderers/interactive/source-contract.mjs";
import { escapeHtml, pageStartTags } from "../packages/publisher/src/rendering/document-input.mjs";

test("published source reading excludes unselected records and discloses ancestors by identity only", async (t) => {
  const { meaning } = await sourceReadingFixture(t);
  const projection = projectSourceReading(
    meaning.native.sourceReading,
    composeAuthoredInteractiveArchitecture(meaning).pages,
  );
  assert.deepEqual(
    projection.elements.map(({ reference }) => reference),
    ["alpha:a", "alpha:b", "beta:b", "beta:c"].map((item) => {
      const [namespace, id] = item.split(":");
      return sourceReference(namespace, "entity", id);
    }),
  );
  assert.deepEqual(
    projection.claims.map(({ reference }) => reference),
    [sourceReference("alpha", "claim", "release")],
  );
  assert.deepEqual(
    projection.relations.map(({ reference }) => reference),
    [sourceReference("alpha", "relation", "r"), sourceReference("beta", "relation", "r")],
  );
  assert.equal(projection.imported, undefined, "complete imports remain private compiler state");
  const native = await nativeSourceReadingFixture(t);
  const hierarchical = projectSourceReading(
    native.meaning.native.sourceReading,
    composeInteractiveEditionScene(native.meaning).pages,
  );
  const parent = hierarchical.elements.find(({ parent }) => parent === null);
  assert.equal(parent.reference, sourceReference("native/model", "entity", "root"));
  assert.equal(parent.record, null, "a required hierarchy identifier does not disclose raw input");
  assert.equal(parent.label, null, "an unselected source label is not silently published");
  assert.equal(JSON.stringify(hierarchical).includes("Global only"), false);
  assert.equal(hierarchical.elements.length, 3);
  assert.equal(hierarchical.relations.length, 1);
});

test("the original Archify reader retains exact source relationships and selected scope", async (t) => {
  const { meaning } = await sourceReadingFixture(t);
  const pages = composeAuthoredInteractiveArchitecture(meaning).pages;
  const reading = await prepareSourceReader(
    meaning.native.sourceReading,
    pages,
    meaning.editorial.visualPolicy.figureTypes,
  );
  assert.equal(reading.projection.elements.length, 4);
  assert.equal(reading.projection.relations.length, 2);
  assert.equal(reading.projection.claims.length, 1);
  assert.equal(
    reading.projection.imported,
    undefined,
    "do not duplicate complete import documents",
  );
  const exact = sourceReference("alpha", "relation", "r");
  const connection = reading.pages.find(({ id }) => id === "connections");
  assert.deepEqual(connection.bindings[exact], { kind: "relation", id: "r-0" });
  const html = connection.content.toString("utf8");
  assert.equal((html.match(/<g\b[^>]*data-node-id=/gu) ?? []).length, 4);
  assert.equal((html.match(/<path\b[^>]*data-logical-relation="true"/gu) ?? []).length, 2);
  assert(html.includes(`data-publication-source-reference="${exact.replaceAll('"', "&quot;")}"`));
  const release = reading.pages.find(({ id }) => id === "release");
  assert.equal(Object.values(release.bindings).filter(({ kind }) => kind === "relation").length, 0);
  assert.equal(Object.values(release.bindings).filter(({ kind }) => kind === "claim").length, 1);
  assert(reading.supplies.some(({ id }) => id === "archify"));
  for (const { sha256 } of reading.supplies) assert.match(sha256, /^[0-9a-f]{64}$/u);
  const sources = Object.fromEntries(
    meaning.native.sourceReading.claimModels.map(({ source, sourceClass }) => [
      source.namespace,
      { ...source, kind: sourceClass },
    ]),
  );
  const selectedReading = { projection: reading.projection, pages: reading.pages };
  assert.doesNotThrow(() => validateSourceReading(selectedReading, pages, sources));
  const claim = sourceReference("alpha", "claim", "release");
  const carrier = pageStartTags(release.content.toString("utf8"), assert.fail).find(
    ({ attributes }) => attributes.get("data-note-id") === release.bindings[claim].id,
  );
  assert.equal(carrier.name, "span");
  assert.equal(carrier.attributes.get("role"), "button");
  assert.equal(carrier.attributes.get("tabindex"), "0");
  assert.equal(carrier.attributes.get("data-publication-source-reference"), escapeHtml(claim));
  const changed = {
    ...selectedReading,
    pages: reading.pages.map((page) =>
      page.id !== release.id
        ? page
        : {
            ...page,
            content: Buffer.from(
              page.content
                .toString("utf8")
                .replace(` data-publication-source-reference="${escapeHtml(claim)}"`, ""),
            ),
          },
    ),
  };
  assert.throws(() => validateSourceReading(changed, pages, sources), {
    code: "interactive_html_source_reader_invalid",
  });
});

test("native hierarchy remains exact without adding unselected ancestors to the figure", async (t) => {
  const { meaning } = await nativeSourceReadingFixture(t);
  const reading = await prepareSourceReader(
    meaning.native.sourceReading,
    composeInteractiveEditionScene(meaning).pages,
    meaning.editorial.visualPolicy.figureTypes,
  );
  const selected = reading.projection.pages[0].elements;
  assert.equal(selected.length, 2);
  assert.equal(reading.projection.elements.length, 3);
  const page = reading.pages[0];
  const html = page.content.toString("utf8");
  assert.equal((html.match(/<g\b[^>]*data-node-id=/gu) ?? []).length, 2);
  assert.equal((html.match(/<path\b[^>]*data-logical-relation="true"/gu) ?? []).length, 1);
  for (const reference of selected) {
    const element = reading.projection.elements.find((item) => item.reference === reference);
    assert.ok(element.parent);
    const parent = reading.projection.elements.find((item) => item.reference === element.parent);
    assert.equal(element.backendId.slice(0, element.backendId.lastIndexOf(".")), parent.backendId);
    assert.equal(parent.record, null);
    assert.equal(parent.label, null);
    assert.equal(page.bindings[parent.reference], undefined);
    assert.equal(
      html.includes(
        `data-publication-source-reference="${parent.reference.replaceAll('"', "&quot;")}"`,
      ),
      false,
      "omitted source ancestor is not an invented visual container",
    );
    assert.equal(page.bindings[reference].kind, "entity");
  }
});
