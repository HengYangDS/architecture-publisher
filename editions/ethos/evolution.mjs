import {
  sha256,
  stableStringify,
  validateProjectionEnvelope,
} from '../../src/integrations/ethos/projection.mjs';
import { ethosSemanticDocument } from '../../src/integrations/ethos/semantics.mjs';
import { compileSemanticChange } from '../../src/semantics/change.mjs';

const map = (rows) => Object.fromEntries(rows.map((row) => [row.id, row]));

/** Complete-value comparison, not a graph-count or implementation claim. */
export function compareEthosMeaning(before, after, views) {
  validateProjectionEnvelope(before, before?.digest);
  validateProjectionEnvelope(after, after?.digest);
  if (before.source.id !== after.source.id)
    throw Error('Semantic source owner changed');
  if (
    !Array.isArray(views) ||
    new Set(views.map((v) => v.id)).size !== views.length
  )
    throw Error('Distinct authored view identities required');
  for (const view of views) {
    if (
      typeof view.id !== 'string' ||
      !view.id ||
      ['nodes', 'relations', 'assertions'].some(
        (key) =>
          !Array.isArray(view[key]) ||
          view[key].some((id) => typeof id !== 'string' || !id),
      )
    )
      throw Error('Explicit authored view dependencies required');
  }
  const compilation = compileSemanticChange(
    ethosSemanticDocument(before),
    ethosSemanticDocument(after),
    views.map((v) => ({
      id: v.id,
      coverage: 'complete',
      views: [],
      dependsOn: ['nodes', 'relations', 'assertions'].flatMap((section) =>
        [...new Set(v[section])].map((id) => ({
          section: section === 'nodes' ? 'entities' : section,
          id,
        })),
      ),
    })),
  );
  const project = (delta) => ({
    nodes: delta.entities,
    relations: delta.relations,
    assertions: delta.assertions,
    documents: [
      ...delta.sources.filter((id) => id !== 'document:copy'),
      ...delta.context
        .filter((id) => id.startsWith('documents:'))
        .map((id) => id.slice(10)),
    ].sort(),
    contracts: delta.context
      .filter((id) => id.startsWith('contracts:'))
      .map((id) => id.slice(10)),
    presentation: delta.context
      .filter((id) => id.startsWith('presentation:'))
      .map((id) => id.slice(13)),
  });
  return {
    schema: 'architecture.ethos-semantic-delta/v1',
    before: before.digest,
    after: after.digest,
    added: project(compilation.added),
    removed: project(compilation.removed),
    changed: project(compilation.changed),
    affectedViews: compilation.affectedViews,
    unrepresented: compilation.unrepresented.map((id) =>
      id.replace(/^entities:/, 'nodes:'),
    ),
    requiresCompleteReview: compilation.requiresCompleteReview,
    obligations: compilation.obligations,
    compilation,
    reuseAcceptance: false,
    semanticAcceptance: 'not-performed',
    scope:
      'Complete selected values and declared dependencies; not inferred equivalence, visual coverage or approval',
  };
}

/** Bind reviewed meaning to visible authored carriers; text truth needs review. */
export function verifyMeaningCarriers(
  input,
  bindings,
  carriers,
  sourceDocuments = [],
) {
  if (!Array.isArray(bindings) || !carriers || typeof carriers !== 'object')
    throw Error('Explicit meaning carriers required');
  const sections = {
    node: input.semantics.nodes,
    relation: map(input.semantics.relations),
    assertion: input.documents.copy.assertions,
  };
  const seen = new Set();
  for (const binding of bindings) {
    const key = binding.kind + ':' + binding.id;
    const document = binding.kind === 'document';
    const meaning = document
      ? input.source.bindings.find((d) => d.id === binding.id)
      : sections[binding.kind]?.[binding.id];
    if (document) {
      const selected = sourceDocuments.filter((d) => d.id === binding.id);
      if (
        !meaning ||
        selected.length !== 1 ||
        !Buffer.isBuffer(selected[0].content) ||
        selected[0].path !== meaning.path ||
        selected[0].sha256 !== meaning.sha256 ||
        sha256(selected[0].content) !== meaning.sha256
      )
        throw Error('Missing or stale source document: ' + binding.id);
      if (
        typeof binding.excerpt !== 'string' ||
        !binding.excerpt.trim() ||
        !selected[0].content.toString('utf8').includes(binding.excerpt)
      )
        throw Error('Missing exact document excerpt: ' + binding.id);
    }
    if (
      !meaning ||
      seen.has(key) ||
      (document ? meaning.sha256 : sha256(stableStringify(meaning))) !==
        binding.sha256
    )
      throw Error('Stale, unknown or duplicate meaning binding: ' + key);
    seen.add(key);
    if (
      !Array.isArray(binding.carriers) ||
      !binding.carriers.length ||
      new Set(binding.carriers).size !== binding.carriers.length ||
      binding.carriers.some(
        (id) => typeof carriers[id] !== 'string' || !carriers[id].trim(),
      )
    )
      throw Error('Missing visible semantic carrier: ' + key);
  }
  return [...seen].sort();
}
