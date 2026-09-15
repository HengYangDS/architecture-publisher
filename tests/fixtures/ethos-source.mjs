import { createHash } from 'node:crypto';
export const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const encode = (value) => Buffer.from(JSON.stringify(value));
export function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  return (
    '{' +
    Object.keys(value)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + stable(value[k]))
      .join(',') +
    '}'
  );
}
export function fixture() {
  const commit = '1'.repeat(40),
    tree = '2'.repeat(40);
  const graph = {
    schema: 'synthetic',
    nodes: {},
    edges: [],
    invariants: [{ statement: 'All attempts preserve scope' }],
  };
  const copy = {
    assertions: { maturity: { text: 'Target design, not implementation' } },
  };
  const view = { node_projection: {}, omitted_nodes: {} };
  const quality =
    '{"schema":"synthetic-test-only","authority":{"consumers_may_override":false}}\n';
  const selected = {
    copy: 'system/copy.json',
    quality_contract: 'system/quality.json',
    semantic_graph: 'system/graph.json',
    view_profile: 'system/view.json',
  };
  const contents = {
    'docs/contract.md': Buffer.from(
      'All attempts MAY retry only after transient failure.\n',
    ),
    'system/copy.json': encode(copy),
    'system/quality.json': Buffer.from(quality),
    'system/graph.json': encode(graph),
    'system/view.json': encode(view),
  };
  const binding = {
    id: 'contract',
    path: 'docs/contract.md',
    sha256: sha(contents['docs/contract.md']),
    authority: 'synthetic test meaning',
  };
  const declaration = {
    schema: 'ethos.projection-declaration/v1',
    id: 'synthetic-ethos-contract',
    title: 'Synthetic contract',
    authority: {
      semantic_owner: 'docs/contract.md',
      scope: 'test only',
      effect_authority: false,
    },
    sources: [
      { id: binding.id, path: binding.path, authority: binding.authority },
    ],
    documents: selected,
  };
  const input = {
    schema: 'projection.input/v2',
    title: declaration.title,
    authority: declaration.authority,
    source: {
      id: declaration.id,
      revision: commit,
      git: { commit, tree },
      bindings: [binding],
      documents: Object.entries(selected).map(([id, path]) => ({
        id,
        path,
        sha256: sha(contents[path]),
      })),
    },
    documents: { copy, view_profile: view, quality_contract: quality },
    semantics: {
      nodes: {
        attempt: {
          label: 'Attempt',
          kind: 'subject',
          attributes: { quantifier: 'All', maturity: 'target' },
          provenance: ['contract'],
        },
      },
      relations: [
        {
          id: 'retry',
          from: 'attempt',
          to: 'attempt',
          kind: 'retry',
          attributes: {
            condition: 'transient failure',
            quantifier: 'Any',
            scope: 'attempt',
          },
          provenance: ['contract'],
        },
      ],
      contracts: { invariants: graph.invariants },
    },
    view: {
      nodes: { attempt: { project: { witness: 'maturity' } } },
      relations: { retry: { project: { witness: 'maturity' } } },
    },
  };
  const exporter = Buffer.from(
    '# Synthetic exporter fixture; never official ETHOS evidence\n',
  );
  const owner = Buffer.from('# Synthetic policy owner fixture\n');
  const members = [
    {
      path: 'source/LICENSE',
      content: Buffer.from('Synthetic fixture license notice\n'),
    },
    { path: 'projection-input.json', content: encode(input) },
    {
      path: 'source/system/projections/terminal-architecture/declaration.json',
      content: encode(declaration),
    },
    {
      path: 'source/tools/projection/export_terminal_architecture.py',
      content: exporter,
    },
    {
      path: 'source/src/ethos/repository/policy/projections.py',
      content: owner,
    },
    ...Object.entries(contents).map(([path, content]) => ({
      path: 'source/' + path,
      content,
    })),
  ];
  function refresh() {
    delete input.digest;
    input.digest = sha(stable(input) + '\n');
    members.find((m) => m.path === 'projection-input.json').content =
      encode(input);
    return input.digest;
  }
  refresh();
  return {
    input,
    declaration,
    members,
    contents,
    refresh,
    source: { id: input.source.id, revision: commit },
  };
}
