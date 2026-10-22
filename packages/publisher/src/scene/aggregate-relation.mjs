/** Classify one selected relation, never infer an edge from graph reachability. */
export function classifyAggregateRelation(from, to, subject, object) {
  const cross = from.has(subject) && to.has(object);
  const fromContext = from.has(subject) && from.has(object);
  const toContext = to.has(subject) && to.has(object);
  const reverse = to.has(subject) && from.has(object);
  if (reverse || Number(cross) + Number(fromContext) + Number(toContext) !== 1) return null;
  return cross ? "cross" : fromContext ? "from-context" : "to-context";
}
