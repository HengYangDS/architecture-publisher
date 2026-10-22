/** Parses only the exact absolute M/L/Q vocabulary emitted by these renderers.
 * Unsupported grammar fails closed rather than yielding a guessed geometry.
 */
function inspectPath(d) {
  const tokens = d.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/g) ?? [];
  const residual = d.replace(/[MLQ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?|[\s,]/g, "");
  if (residual) throw new Error("unsupported path syntax");
  let i = 0;
  const point = () => {
    const x = Number(tokens[i++]),
      y = Number(tokens[i++]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("invalid path coordinate");
    return { x, y };
  };
  let current,
    start,
    terminalStart,
    lastCommand = "";
  const samples = [];
  while (i < tokens.length) {
    const command = tokens[i++];
    if (command === "M") {
      if (start) throw new Error("multiple path components");
      current = point();
      start = current;
      samples.push(current);
    } else if (command === "L" && current) {
      terminalStart = current;
      current = point();
      samples.push(current);
    } else if (command === "Q" && current) {
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
    } else throw new Error("unsupported path command");
    lastCommand = command;
  }
  if (!start || !current || !terminalStart) throw new Error("incomplete path");
  const length = Math.hypot(current.x - terminalStart.x, current.y - terminalStart.y);
  if (length === 0) throw new Error("zero terminal segment");
  return {
    start,
    end: current,
    terminalLength: lastCommand === "L" ? length : 0,
    terminalDirection: {
      x: (current.x - terminalStart.x) / length,
      y: (current.y - terminalStart.y) / length,
    },
    samples,
  };
}

/** Narrow emitted-geometry gate. Parses the actual native static path bytes;
 * metadata only supplies the intended identities and contacts. No browser claim. */
function attribute(tag, name) {
  const values = [...tag.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "gu"))];
  if (values.length > 1) throw Error("duplicate emitted literal paint attribute");
  return values[0]?.[1];
}

function assertLiteralPaint(svg, raw, edge, actual) {
  if (
    actual.samples.length !== edge.points.length ||
    /[Q]/u.test(attribute(raw, "d")) ||
    actual.samples.some(
      (point, index) => point.x !== edge.points[index].x || point.y !== edge.points[index].y,
    ) ||
    attribute(raw, "fill") !== "none" ||
    !attribute(raw, "stroke") ||
    attribute(raw, "stroke") === "none" ||
    Number(attribute(raw, "stroke-width")) !== edge.strokeWidth ||
    ["transform", "style", "opacity", "filter", "display", "visibility", "stroke-opacity"].some(
      (name) => attribute(raw, name) !== undefined,
    )
  )
    throw Error("emitted literal route points or paint mismatch");
  if (!edge.arrow) return;
  const link = /^url\(#([a-z][a-z0-9-]*)\)$/u.exec(attribute(raw, "marker-end"));
  if (!link) throw Error("emitted literal arrow marker invalid");
  const markers = [...svg.matchAll(/<marker\b[^>]*>[\s\S]*?<\/marker>/gu)].filter(
    (match) => attribute(match[0].split(">")[0] + ">", "id") === link[1],
  );
  if (markers.length !== 1) throw Error("emitted literal arrow marker missing or ambiguous");
  const marker = markers[0][0],
    header = marker.slice(0, marker.indexOf(">") + 1);
  const geometry = edge.arrowGeometry;
  if (
    attribute(header, "markerUnits") !== "userSpaceOnUse" ||
    attribute(header, "orient") !== "auto" ||
    Number(attribute(header, "markerWidth")) !== geometry.length ||
    Number(attribute(header, "markerHeight")) !== geometry.halfWidth * 2 ||
    Number(attribute(header, "refX")) !== geometry.length ||
    Number(attribute(header, "refY")) !== geometry.halfWidth ||
    ["transform", "style", "opacity", "filter", "display", "visibility"].some(
      (name) => attribute(header, name) !== undefined,
    )
  )
    throw Error("emitted literal arrow geometry mismatch");
  const content = marker.slice(marker.indexOf(">") + 1, marker.lastIndexOf("</marker>")).trim();
  if (
    !/^<path\b[^>]*\/>$/u.test(content) ||
    attribute(content, "fill") !== "none" ||
    attribute(content, "stroke") !== attribute(raw, "stroke") ||
    Number(attribute(content, "stroke-width")) !== geometry.strokeWidth ||
    ["transform", "style", "opacity", "filter", "display", "visibility", "stroke-opacity"].some(
      (name) => attribute(content, name) !== undefined,
    )
  )
    throw Error("emitted literal arrow paint mismatch");
  const wing = inspectPath(attribute(content, "d") ?? "");
  const expected = [
    { x: 0, y: 0 },
    { x: geometry.length, y: geometry.halfWidth },
    { x: 0, y: geometry.halfWidth * 2 },
  ];
  if (
    wing.samples.length !== 3 ||
    wing.samples.some(
      (point, index) => point.x !== expected[index].x || point.y !== expected[index].y,
    )
  )
    throw Error("emitted literal arrow wing mismatch");
}

export function auditEmittedEdges(svg, scene, contract) {
  if (
    !Number.isFinite(contract.minimumTerminal) ||
    contract.minimumTerminal <= 0 ||
    !Number.isFinite(contract.endpointTolerance) ||
    contract.endpointTolerance < 0
  )
    throw Error("invalid emitted-edge limits");
  const intended = new Map(scene.edges.map((e) => [e.id, e])),
    seen = new Set();
  if (intended.size !== scene.edges.length) throw Error("duplicate intended edge identity");
  const failures = [],
    edges = [];
  const graphicAttribute = contract.graphicAttribute ?? "data-edge";
  if (!["data-edge", "data-literal-segment-id"].includes(graphicAttribute))
    throw Error("invalid emitted edge attribute");
  for (const m of svg.matchAll(
    new RegExp(`<path\\b[^>]*\\b${graphicAttribute}="([^"]+)"[^>]*>`, "gu"),
  )) {
    const id = m[1],
      edge = intended.get(id);
    if (!edge || seen.has(id)) throw Error("emitted edge identity mismatch");
    seen.add(id);
    const d = m[0].match(/\sd="([^"]+)"/)?.[1];
    if (!d) throw Error("emitted path geometry missing");
    const actual = inspectPath(d),
      arrow = /\smarker-end=/.test(m[0]);
    if (arrow !== (edge.arrow !== false)) throw Error("emitted arrow contract mismatch");
    if (edge.points.length < 2) throw Error("intended edge geometry missing");
    if (edge.adornment) assertLiteralPaint(svg, m[0], edge, actual);
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const delta = Math.max(
      distance(actual.start, edge.points[0]),
      distance(actual.end, edge.points.at(-1)),
    );
    if (delta > contract.endpointTolerance)
      failures.push({
        code: "emitted-endpoint-mismatch",
        id,
        observed: delta,
        required: contract.endpointTolerance,
      });
    if (arrow && actual.terminalLength + 1e-9 < contract.minimumTerminal)
      failures.push({
        code: "short-emitted-terminal",
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
  if (seen.size !== intended.size) throw Error("emitted edge identity set mismatch");
  return {
    scope:
      "Actual emitted M/L/Q terminals and endpoint equality; literal segments additionally bind all M/L points and marker paint; no browser perceptibility or source acceptance",
    failures,
    edges,
  };
}
