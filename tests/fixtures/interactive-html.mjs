import { createHash } from "node:crypto";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const html = (title, link = "") =>
  Buffer.from(
    `<!DOCTYPE html><html lang="en"><head><title>${title}</title><style>body{color:#26362f}</style></head><body><svg role="group" data-diagram-type="architecture" data-page="${title}"><g data-node-id="compiler" data-node-label="Compiler"></g></svg>${link}<script>var Archify = {}; window.pageReady = true;</script></body></html>`,
  );

export function fixture() {
  const pages = [
    ["overview", "Overview", '<a href="semantics.html">Semantics</a>', "overview"],
    ["semantics", "Semantics", '<a href="overview.html">Overview</a>', "mechanism"],
  ].map(([id, label, link, purpose]) => {
    const content = html(label, link);
    return {
      id,
      label,
      shortLabel: label,
      purpose,
      path: `views/${id}.html`,
      sha256: sha256(content),
      sourceIds: ["selected-1"],
      subjectSources: { compiler: ["selected-1"] },
      facts: [
        {
          reference: '["fixture/claims","entity","compiler"]',
          sourceSha256: "f".repeat(64),
          graphicId: "compiler",
          title: "Compiler",
          facts: [{ label: "Source kind", value: "backend" }],
        },
      ],
      content,
    };
  });
  return {
    schema: "architecture.interactive-html-composition/v1",
    title: "Architecture Publisher",
    build: {
      lockSha256: "a".repeat(64),
      editionSha256: "b".repeat(64),
      semanticDigest: "c".repeat(64),
    },
    overview: "overview",
    pages,
    sources: [
      {
        id: "selected-1",
        kind: "native",
        namespace: "fixture/claims",
        sha256: "f".repeat(64),
        claimant: "fixture-maintainer",
      },
    ],
    state: {
      qualification: "not-performed",
      humanAcceptance: "not-performed",
      publication: "not-performed",
    },
  };
}

export function nativeSourceDocument() {
  const input = fixture();
  const reference = '["fixture/claims","entity","compiler"]';
  const content = Buffer.from(
    `<!DOCTYPE html><html><head><meta name="publication-reader" content="archify/v1"></head><body><svg><g data-node-id="n-0" data-node-label="Compiler" data-node-kind="backend" data-publication-source-reference="${reference.replaceAll('"', "&quot;")}"></g></svg></body></html>`,
  );
  input.sourceReading = {
    projection: {
      elements: [
        {
          reference,
          source: input.sources[0],
          sourceClass: "native",
          owner: "fixture-maintainer",
          kind: "backend",
          label: "Compiler",
          parent: null,
          record: { label: "Compiler" },
        },
      ],
      relations: [],
      claims: [],
      pages: input.pages.map(({ id, label }) => ({
        id,
        label,
        elements: [reference],
        relations: [],
        claims: [],
        occurrences: [{ reference, graphicIds: ["compiler"] }],
      })),
    },
    pages: input.pages.map(({ id }) => ({
      id,
      content,
      bindings: { [reference]: { kind: "entity", id: "n-0" } },
    })),
  };
  return input;
}
