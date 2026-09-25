const MODEL = 'a'.repeat(64);
const origin = {
  namespace: 'private/model',
  sha256: MODEL,
  range: { start: { line: 2, character: 0 }, end: { line: 2, character: 12 } },
  quality: 'range',
};

export function interactiveEditionScene() {
  return structuredClone({
    schema: 'architecture.edition-interactive-scene/v1',
    completeness: 'unqualified-scene',
    edition: { id: 'source-atlas', editor: 'fixture-editor', sha256: 'b'.repeat(64) },
    title: 'Selected architecture',
    summary: 'A source-bound overview.',
    readingOrder: ['shape', 'risk'],
    visualPolicy: { profile: 'neutral' },
    pages: [
      {
        id: 'overview',
        questionIds: ['shape'],
        questions: [{ id: 'shape', audience: 'maintainer', text: 'What is connected?' }],
        limitsByQuestion: { shape: [{ kind: 'scope', reason: 'Runtime was not observed.' }] },
        nodes: [
          {
            namespace: 'private/model',
            id: 'secret-alpha',
            sha256: MODEL,
            kind: 'component',
            label: 'Alpha & one',
            origin,
          },
          {
            namespace: 'private/model',
            id: 'secret-beta',
            sha256: MODEL,
            kind: 'component',
            label: 'Beta',
            origin,
          },
        ],
        relations: [
          {
            id: 'relation:4:2',
            from: { namespace: 'private/model', id: 'secret-alpha' },
            to: { namespace: 'private/model', id: 'secret-beta' },
            kind: null,
            direction: 'forward',
            label: 'calls',
            origin,
          },
        ],
        sourceAssertionCarriers: [
          {
            assertionId: 'source-shape',
            selectionId: 'overview',
            kind: 'view',
            nodeRefs: [
              { namespace: 'private/model', id: 'secret-alpha' },
              { namespace: 'private/model', id: 'secret-beta' },
            ],
            relationRefs: [
              { namespace: 'private/model', reference: 'relation:4:2', sha256: MODEL },
            ],
          },
        ],
        editorialAssertions: [],
      },
      {
        id: 'limit',
        questionIds: ['risk'],
        questions: [{ id: 'risk', audience: 'maintainer', text: 'What remains uncertain?' }],
        limitsByQuestion: {
          risk: [{ kind: 'scope', reason: 'No runtime observation was selected.' }],
        },
        nodes: [],
        relations: [],
        sourceAssertionCarriers: [],
        editorialAssertions: [
          {
            id: 'editorial-risk',
            kind: 'editorial',
            statement: 'Runtime safety is not established.',
            proponent: 'fixture-editor',
            basis: ['overview'],
            questions: ['risk'],
            semanticStatus: 'editor-attributed-unverified',
          },
        ],
      },
    ],
    limits: ['domain-metadata-opaque'],
  });
}
