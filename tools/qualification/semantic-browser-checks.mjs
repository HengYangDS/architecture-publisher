export function validateHtmlObservation(observed, view, errors) {
  assertSet(observed.nodeIds, view.nodeIds, 'node');
  assertSet(
    observed.edges.map((edge) => edge.id),
    view.relationIds,
    'relation',
  );
  assertEdges(observed.edges, view.relations, 'HTML');
  assertAttachment(observed.edges, view.relations, 'HTML');
  if (
    observed.edges.some((edge) => !edge.path?.startsWith('M ') || !edge.from || !edge.to) ||
    observed.overlap.length ||
    observed.overflow.length ||
    observed.minimumFont < 8 ||
    observed.scrollWidth > observed.viewportWidth ||
    observed.surfaceBadges.some((value) => !['none', 'normal', '""'].includes(value)) ||
    errors.length
  )
    throw Error('Browser geometry failed: ' + JSON.stringify(observed));
}

export function validateStaticObservation(observed, overview, errors) {
  if (!Array.isArray(observed.labelStrokeOverlap) || !Array.isArray(observed.edgeNodeOverlap))
    throw Error('Static SVG stroke coverage missing');
  if (
    !Array.isArray(observed.fontFaces) ||
    !['400', '600'].every((weight) =>
      observed.fontFaces.some(
        (font) =>
          font.family.replaceAll(/["']/g, '') === 'JetBrains Mono' &&
          font.weight === weight &&
          font.status === 'loaded',
      ),
    )
  )
    throw Error('Static SVG embedded fonts missing');
  assertSet(observed.nodeIds, overview.nodeIds, 'static SVG node');
  assertSet(
    observed.edges.map((edge) => edge.id),
    overview.relationIds,
    'static SVG relation',
  );
  assertEdges(observed.edges, overview.relations, 'static SVG');
  assertAttachment(observed.edges, overview.relations, 'static SVG');
  if (
    errors.length ||
    observed.root !== 'svg' ||
    observed.width <= 0 ||
    observed.height <= 0 ||
    observed.viewBox[2] <= 0 ||
    observed.viewBox[3] <= 0 ||
    observed.overlap.length ||
    observed.labelNodeOverlap.length ||
    observed.labelStrokeOverlap.length ||
    observed.edgeNodeOverlap.length ||
    observed.overflow.length ||
    observed.minimumFont < 8 ||
    observed.edges.some(
      (edge) => !edge.path?.startsWith('M ') || !edge.from || !edge.to || edge.stroke === 'none',
    )
  )
    throw Error('Static SVG paint failed: ' + JSON.stringify(observed));
}

function assertSet(actual, expected, label) {
  if (JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort()))
    throw Error(`Browser ${label} identity mismatch`);
}

function assertEdges(actual, expected, label) {
  if (!Array.isArray(expected)) throw Error(`${label} relation contract missing`);
  const selected = (values) =>
    values
      .map(({ id, from, to }) => ({ id, from, to }))
      .sort((left, right) => left.id.localeCompare(right.id));
  if (JSON.stringify(selected(actual)) !== JSON.stringify(selected(expected)))
    throw Error(`${label} directed endpoint mismatch`);
}

function assertAttachment(actual, expected, label) {
  const declared = new Map(expected.map((edge) => [edge.id, edge]));
  for (const edge of actual) {
    const contract = declared.get(edge.id);
    if (
      !contract ||
      distanceToSide(edge.start, edge.fromBox, contract.fromSide) > 1 ||
      distanceToSide(edge.end, edge.toBox, contract.toSide) > 1
    )
      throw Error(`${label} endpoint attachment mismatch: ${edge.id}`);
  }
}

function distanceToSide(point, box, side) {
  const between = (value, minimum, maximum) => value >= minimum - 1 && value <= maximum + 1;
  if (side === 'left')
    return between(point.y, box.y, box.bottom) ? Math.abs(point.x - box.x) : Infinity;
  if (side === 'right')
    return between(point.y, box.y, box.bottom) ? Math.abs(point.x - box.right) : Infinity;
  if (side === 'top')
    return between(point.x, box.x, box.right) ? Math.abs(point.y - box.y) : Infinity;
  return between(point.x, box.x, box.right) ? Math.abs(point.y - box.bottom) : Infinity;
}
