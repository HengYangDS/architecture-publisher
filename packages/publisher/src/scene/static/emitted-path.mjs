/** Parses only the exact absolute M/L/Q vocabulary emitted by these renderers.
 * Unsupported grammar fails closed rather than yielding a guessed geometry.
 */
function inspectPath(d) {
  const tokens = d.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/g) ?? [];
  const residual = d.replace(/[MLQ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?|[\s,]/g, '');
  if (residual) throw new Error('unsupported path syntax');
  let i = 0;
  const point = () => {
    const x = Number(tokens[i++]),
      y = Number(tokens[i++]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('invalid path coordinate');
    return { x, y };
  };
  let current,
    start,
    terminalStart,
    lastCommand = '';
  const samples = [];
  while (i < tokens.length) {
    const command = tokens[i++];
    if (command === 'M') {
      if (start) throw new Error('multiple path components');
      current = point();
      start = current;
      samples.push(current);
    } else if (command === 'L' && current) {
      terminalStart = current;
      current = point();
      samples.push(current);
    } else if (command === 'Q' && current) {
      const a = current,
        c = point(),
        z = point();
      for (let k = 1; k <= 16; k++) {
        const t = k / 16,
          u = 1 - t;
        samples.push({
          x: u * u * a.x + 2 * u * t * c.x + t * t * z.x,
          y: u * u * a.y + 2 * u * t * c.y + t * t * z.y,
        });
      }
      terminalStart = c;
      current = z;
    } else throw new Error('unsupported path command');
    lastCommand = command;
  }
  if (!start || !current || !terminalStart) throw new Error('incomplete path');
  const length = Math.hypot(current.x - terminalStart.x, current.y - terminalStart.y);
  if (length === 0) throw new Error('zero terminal segment');
  return {
    start,
    end: current,
    terminalLength: lastCommand === 'L' ? length : 0,
    terminalDirection: {
      x: (current.x - terminalStart.x) / length,
      y: (current.y - terminalStart.y) / length,
    },
    samples,
  };
}

/** Narrow emitted-geometry gate. Parses the actual native static path bytes;
 * metadata only supplies the intended identities and contacts. No browser claim. */
export function auditEmittedEdges(svg, scene, contract) {
  if (
    !Number.isFinite(contract.minimumTerminal) ||
    contract.minimumTerminal <= 0 ||
    !Number.isFinite(contract.endpointTolerance) ||
    contract.endpointTolerance < 0
  )
    throw Error('invalid emitted-edge limits');
  const intended = new Map(scene.edges.map((e) => [e.id, e])),
    seen = new Set();
  if (intended.size !== scene.edges.length) throw Error('duplicate intended edge identity');
  const failures = [],
    edges = [];
  for (const m of svg.matchAll(/<path\b[^>]*\bdata-edge="([^"]+)"[^>]*>/g)) {
    const id = m[1],
      edge = intended.get(id);
    if (!edge || seen.has(id)) throw Error('emitted edge identity mismatch');
    seen.add(id);
    const d = m[0].match(/\sd="([^"]+)"/)?.[1];
    if (!d) throw Error('emitted path geometry missing');
    const actual = inspectPath(d),
      arrow = /\smarker-end=/.test(m[0]);
    if (arrow !== (edge.arrow !== false)) throw Error('emitted arrow contract mismatch');
    if (edge.points.length < 2) throw Error('intended edge geometry missing');
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const delta = Math.max(
      distance(actual.start, edge.points[0]),
      distance(actual.end, edge.points.at(-1)),
    );
    if (delta > contract.endpointTolerance)
      failures.push({
        code: 'emitted-endpoint-mismatch',
        id,
        observed: delta,
        required: contract.endpointTolerance,
      });
    if (arrow && actual.terminalLength + 1e-9 < contract.minimumTerminal)
      failures.push({
        code: 'short-emitted-terminal',
        id,
        observed: actual.terminalLength,
        required: contract.minimumTerminal,
      });
    edges.push({
      id,
      arrow,
      endpointDelta: delta,
      terminalLength: actual.terminalLength,
      terminalDirection: actual.terminalDirection,
    });
  }
  if (seen.size !== intended.size) throw Error('emitted edge identity set mismatch');
  return {
    scope:
      'Actual emitted M/L/Q terminal lengths and intended endpoint equality; no browser, marker envelope or semantic acceptance',
    failures,
    edges,
  };
}
