const DIGEST = 'a'.repeat(64);
const origin = {
  namespace: 'example/model',
  sha256: DIGEST,
  range: { start: { line: 1, character: 0 }, end: { line: 1, character: 8 } },
  quality: 'range',
};

export function staticEditionScene() {
  return structuredClone({
    schema: 'architecture.edition-static-scene/v1',
    completeness: 'unqualified-scene',
    edition: { id: 'source-portrait', editor: 'fixture-editor', sha256: 'b'.repeat(64) },
    title: 'Selected architecture',
    summary: 'A source-bound overview.',
    visualPolicy: { profile: 'neutral', figureTypes: { component: 'lucide:box' } },
    requestedWidth: 6000,
    editorialViewId: 'overview',
    nativeView: { namespace: 'example/views', id: 'overview', sha256: 'c'.repeat(64) },
    questionIds: ['shape'],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'What is connected?' }],
    limitsByQuestion: { shape: [{ kind: 'scope', reason: 'Runtime was not observed.' }] },
    bounds: { x: 0, y: 0, width: 420, height: 80 },
    nodes: [
      {
        namespace: 'example/model',
        id: 'a',
        sha256: DIGEST,
        x: 0,
        y: 0,
        width: 160,
        height: 80,
        kind: 'component',
        figureKind: 'component',
        icon: 'lucide:box',
        label: 'Alpha & one',
        origin,
      },
      {
        namespace: 'example/model',
        id: 'b',
        sha256: DIGEST,
        x: 260,
        y: 0,
        width: 160,
        height: 80,
        kind: 'component',
        figureKind: 'component',
        icon: 'lucide:box',
        label: 'Beta',
        origin,
      },
    ],
    edges: [
      {
        from: { namespace: 'example/model', id: 'a' },
        to: { namespace: 'example/model', id: 'b' },
        relations: [
          {
            namespace: 'example/model',
            reference: 'relation:4:2',
            sha256: DIGEST,
            label: 'calls',
            kind: null,
            direction: 'forward',
            origin,
          },
        ],
        points: [
          [160, 40],
          [260, 40],
        ],
      },
    ],
    sourceAssertionCarriers: [
      {
        assertionId: 'source-shape',
        kind: 'view',
        selectionId: 'overview',
        nodeRefs: [
          { namespace: 'example/model', id: 'a' },
          { namespace: 'example/model', id: 'b' },
        ],
        relationRefs: [{ namespace: 'example/model', reference: 'relation:4:2', sha256: DIGEST }],
      },
    ],
    editorialAssertions: [],
    limits: ['domain-metadata-opaque'],
  });
}
