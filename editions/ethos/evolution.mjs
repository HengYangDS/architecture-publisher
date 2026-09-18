import {
  sha256,
  stableStringify,
  validateProjectionEnvelope,
} from '../../src/integrations/ethos/projection.mjs';

const same = (a, b) => stableStringify(a) === stableStringify(b);
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
  const sections = (input) => ({
    nodes: input.semantics.nodes,
    relations: map(input.semantics.relations),
    assertions: input.documents.copy.assertions,
    documents: map(input.source.bindings),
    contracts: input.semantics.contracts,
    presentation: {
      title: input.title,
      authority: input.authority,
      quality: input.documents.quality_contract,
      view: input.view,
      viewProfile: input.documents.view_profile,
      copy: Object.fromEntries(
        Object.entries(input.documents.copy).filter(
          ([k]) => k !== 'assertions',
        ),
      ),
    },
  });
  const a = sections(before),
    b = sections(after);
  const added = {},
    removed = {},
    changed = {};
  for (const key of Object.keys(a)) {
    added[key] = Object.keys(b[key])
      .filter((id) => !Object.hasOwn(a[key], id))
      .sort();
    removed[key] = Object.keys(a[key])
      .filter((id) => !Object.hasOwn(b[key], id))
      .sort();
    changed[key] = Object.keys(a[key])
      .filter(
        (id) => Object.hasOwn(b[key], id) && !same(a[key][id], b[key][id]),
      )
      .sort();
  }
  const affected = (key) => [...added[key], ...removed[key], ...changed[key]];
  const required = ['nodes', 'relations', 'assertions'];
  const unrepresented = required.flatMap((key) =>
    [...added[key], ...changed[key]]
      .filter((id) => !views.some((v) => v[key].includes(id)))
      .map((id) => key + ':' + id),
  );
  const requiresCompleteReview =
    unrepresented.length > 0 ||
    ['documents', 'contracts', 'presentation'].some(
      (key) => affected(key).length > 0,
    );
  const affectedViews = views
    .filter(
      (view) =>
        requiresCompleteReview ||
        required.some((key) =>
          affected(key).some((id) => view[key].includes(id)),
        ),
    )
    .map((v) => v.id)
    .sort();
  return {
    schema: 'architecture.ethos-semantic-delta/v1',
    before: before.digest,
    after: after.digest,
    added,
    removed,
    changed,
    affectedViews,
    unrepresented,
    requiresCompleteReview,
    reuseAcceptance: false,
    semanticAcceptance: 'not-performed',
    scope:
      'Complete selected values and declared dependencies; not inferred equivalence, visual coverage or approval',
  };
}

/** Bind reviewed meaning to visible authored carriers; text truth needs review. */
export function verifyMeaningCarriers(input, bindings, carriers) {
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
    const meaning = sections[binding.kind]?.[binding.id];
    if (
      !meaning ||
      seen.has(key) ||
      sha256(stableStringify(meaning)) !== binding.sha256
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
