export const ref = (section, id) => ({ section, id });

export function semanticDocument() {
  const provenance = ['contract'];
  return {
    schema: 'architecture.semantic-document/v1',
    owner: 'example:system',
    vocabulary: { entities: ['component'], relations: ['calls'] },
    sources: {
      contract: {
        sha256: '1'.repeat(64),
        locator: 'contract.md',
        authority: 'Declared product contract',
      },
    },
    entities: Object.fromEntries(
      ['client', 'server', 'other'].map((id) => [
        id,
        {
          type: 'component',
          label: id,
          qualifiers: { maturity: 'target' },
          provenance: [...provenance],
        },
      ]),
    ),
    relations: {
      request: {
        type: 'calls',
        subject: 'client',
        object: 'server',
        qualifiers: {
          condition: 'authorized',
          quantifier: 'one',
          scope: 'local',
        },
        provenance: [...provenance],
      },
    },
    assertions: {
      admission: {
        value: { text: 'Only authorized requests call the server' },
        proposition: {
          subject: 'client',
          predicate: 'calls',
          object: 'server',
          polarity: 'positive',
          qualifiers: { condition: 'authorized' },
        },
        dependsOn: [ref('relations', 'request')],
        coverage: 'complete',
        provenance: [...provenance],
      },
    },
    context: {},
  };
}

export const semanticViews = () => [
  {
    id: 'claim',
    dependsOn: [ref('assertions', 'admission')],
    views: [],
    coverage: 'complete',
  },
  { id: 'detail', dependsOn: [], views: ['claim'], coverage: 'complete' },
  {
    id: 'other',
    dependsOn: [ref('entities', 'other')],
    views: [],
    coverage: 'complete',
  },
];
