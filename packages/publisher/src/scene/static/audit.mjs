import { fail } from '../../protocol/values.mjs';

/** Analytic screen-space checks over the same measured scene used by the renderer.
 * Text boxes must be measured glyph bounds, not character-count estimates.
 * Hidden metadata is traceability only and never a visible semantic witness.
 */

const authoredCanvasGeometry = Object.freeze({
  minimumFont: 10,
  ownerClearance: 8,
  textClearance: 5,
  textToTextClearance: 5,
  endpointTolerance: 1,
  minimumTerminal: 14,
  widthGrowth: 0,
  heightGrowth: 0,
});
const authoredCanvasContainment = Object.freeze({
  hard_gates: {
    geometry_each_scale: {
      canvas_clearance_source_units_min: 0,
      font_width_growth_fraction: 0,
      font_height_growth_fraction: 0,
    },
  },
});

/** The authored Scene, not its build coordinator, owns pre-render validity. */
export function assertAuthoredCanvasScene(scene) {
  const geometry = auditScene(scene, authoredCanvasGeometry);
  const canvas = auditCanvasEnvelope(scene, authoredCanvasContainment);
  if (geometry.failures.length || canvas.failures.length)
    fail(
      'authored_canvas_geometry_invalid',
      `authored_canvas_geometry_invalid:${[...geometry.failures, ...canvas.failures][0].code}`,
    );
  return { geometry, canvas, emittedContract: authoredCanvasGeometry };
}

const right = (b) => b.x + b.width,
  bottom = (b) => b.y + b.height;
const expand = (b, p) => ({
  x: b.x - p,
  y: b.y - p,
  width: b.width + 2 * p,
  height: b.height + 2 * p,
});
const overlaps = (a, b) =>
  Math.min(right(a), right(b)) > Math.max(a.x, b.x) &&
  Math.min(bottom(a), bottom(b)) > Math.max(a.y, b.y);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const boundaryDistance = (p, b) =>
  Math.min(
    Math.hypot(p.x - b.x, Math.max(b.y - p.y, 0, p.y - bottom(b))),
    Math.hypot(p.x - right(b), Math.max(b.y - p.y, 0, p.y - bottom(b))),
    Math.hypot(p.y - b.y, Math.max(b.x - p.x, 0, p.x - right(b))),
    Math.hypot(p.y - bottom(b), Math.max(b.x - p.x, 0, p.x - right(b))),
  );
function segmentHitsBox(a, b, box) {
  let lo = 0,
    hi = 1;
  const dx = b.x - a.x,
    dy = b.y - a.y;
  for (const [p, q] of [
    [-dx, a.x - box.x],
    [dx, right(box) - a.x],
    [-dy, a.y - box.y],
    [dy, bottom(box) - a.y],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) lo = Math.max(lo, t);
    else hi = Math.min(hi, t);
    if (lo > hi) return false;
  }
  return true;
}
export function auditScene(scene, contract) {
  const failures = [];
  const add = (code, id, other) => failures.push({ code, id, ...(other ? { other } : {}) });
  const scale = scene.referenceWidth / scene.width;
  const textToTextClearance = contract.textToTextClearance ?? 0;
  if (!Number.isFinite(textToTextClearance) || textToTextClearance < 0)
    throw new Error('invalid text-to-text clearance');
  if (
    ![scene.width, scene.height, scene.referenceWidth, scale].every(
      (n) => Number.isFinite(n) && n > 0,
    )
  )
    throw new Error('invalid scene extent');
  const b = (v) => ({
    x: v.x * scale,
    y: v.y * scale,
    width: v.width * scale,
    height: v.height * scale,
  });
  // Ports attach to semantic bounds; text must clear the actual painted mark.
  // Keeping the two envelopes separate avoids moving endpoints to clear ink.
  const nodes = scene.nodes.map((n) => ({
    ...n,
    box: b(n.box),
    paintBox: n.paintBox ? b(n.paintBox) : expand(b(n.box), ((n.strokeWidth ?? 0) * scale) / 2),
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  if (byId.size !== nodes.length) throw new Error('duplicate node identity');
  const texts = scene.texts
    .filter((t) => t.visible && t.text.trim())
    .map((t) => {
      const box = b(t.box);
      const growth = box.width * contract.widthGrowth,
        dx = t.anchor === 'middle' ? growth / 2 : t.anchor === 'end' ? growth : 0,
        dy = (box.height * contract.heightGrowth) / 2;
      return {
        ...t,
        box: {
          x: box.x - dx,
          y: box.y - dy,
          width: box.width + growth,
          height: box.height + 2 * dy,
        },
        fontSize: t.fontSize * scale,
      };
    });
  const shown = new Set();
  for (const t of texts) {
    if (![t.box.x, t.box.y, t.box.width, t.box.height, t.fontSize].every(Number.isFinite)) {
      add('invalid-geometry', t.id);
      continue;
    }
    if (t.fontSize < contract.minimumFont) add('font-too-small', t.id);
    if (t.box.width <= 0 || t.box.height <= 0) add('empty-glyph-bounds', t.id);
    else if (t.fontSize >= contract.minimumFont) for (const id of t.semanticIds) shown.add(id);
    if (
      t.box.x < 0 ||
      t.box.y < 0 ||
      right(t.box) > scene.referenceWidth ||
      bottom(t.box) > scene.height * scale
    )
      add('out-of-bounds', t.id);
    if (t.owner) {
      const owner = byId.get(t.owner);
      if (!owner) add('missing-text-owner', t.id);
      else {
        const margins = [
          t.box.x - owner.box.x,
          t.box.y - owner.box.y,
          right(owner.box) - right(t.box),
          bottom(owner.box) - bottom(t.box),
        ];
        if (Math.min(...margins) < contract.ownerClearance) add('owner-clearance', t.id);
      }
    }
    for (const n of nodes)
      if (n.id !== t.owner && overlaps(t.box, expand(n.paintBox, contract.textClearance)))
        add('text-nonowner-collision', t.id, n.id);
  }
  for (const id of scene.requiredSemanticIds)
    if (!shown.has(id)) add('missing-visible-semantic', id);
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++)
      if (overlaps(texts[i].box, texts[j].box)) add('text-overlap', texts[i].id, texts[j].id);
      else if (overlaps(expand(texts[i].box, textToTextClearance), texts[j].box))
        add('text-clearance', texts[i].id, texts[j].id);
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      if (overlaps(nodes[i].box, nodes[j].box)) add('node-overlap', nodes[i].id, nodes[j].id);
  for (const e of scene.edges) {
    const points = e.points.map((p) => ({ x: p.x * scale, y: p.y * scale }));
    if (points.length < 2) {
      add('empty-edge', e.id);
      continue;
    }
    for (const [id, p] of [
      [e.source, points[0]],
      [e.target, points.at(-1)],
    ]) {
      const n = byId.get(id);
      if (!n || boundaryDistance(p, n.box) > contract.endpointTolerance)
        add('endpoint-detached', e.id, id);
    }
    if (distance(points.at(-2), points.at(-1)) < contract.minimumTerminal)
      add('short-terminal', e.id);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        z = points[i];
      if (a.x !== z.x && a.y !== z.y) add('nonorthogonal-edge', e.id);
      for (const t of texts)
        if (
          segmentHitsBox(
            a,
            z,
            expand(t.box, contract.textClearance + ((e.strokeWidth ?? 1) * scale) / 2),
          )
        )
          add('edge-text-collision', e.id, t.id);
      for (const n of nodes)
        if (![e.source, e.target].includes(n.id) && segmentHitsBox(a, z, n.box))
          add('edge-node-collision', e.id, n.id);
    }
    if (e.arrowGeometry) {
      const geometry = e.arrowGeometry,
        tip = points.at(-1),
        prev = points.at(-2),
        length = distance(prev, tip);
      if (
        !length ||
        ![geometry.length, geometry.halfWidth, geometry.strokeWidth].every(
          (n) => Number.isFinite(n) && n > 0,
        )
      )
        throw new Error('invalid arrow geometry');
      const ux = (tip.x - prev.x) / length,
        uy = (tip.y - prev.y) / length;
      const wing = (sign) => ({
        x: tip.x - ux * geometry.length * scale - sign * uy * geometry.halfWidth * scale,
        y: tip.y - uy * geometry.length * scale + sign * ux * geometry.halfWidth * scale,
      });
      for (const t of texts) {
        const envelope = expand(t.box, contract.textClearance + (geometry.strokeWidth * scale) / 2);
        if (segmentHitsBox(wing(-1), tip, envelope) || segmentHitsBox(tip, wing(1), envelope))
          add('arrow-text-collision', e.id, t.id);
      }
    }
  }
  const segments = scene.edges.flatMap((e) =>
    e.points.slice(1).map((p, i) => ({ edge: e.id, a: e.points[i], z: p })),
  );
  const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (let i = 0; i < segments.length; i++)
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i],
        b = segments[j];
      if (a.edge === b.edge) continue;
      const ab = cross(a.a, a.z, b.a),
        az = cross(a.a, a.z, b.z),
        ba = cross(b.a, b.z, a.a),
        bz = cross(b.a, b.z, a.z);
      if (ab * az < 0 && ba * bz < 0) add('edge-crossing', a.edge, b.edge);
    }
  for (const line of scene.decorations ?? []) {
    const points = line.points.map((p) => ({ x: p.x * scale, y: p.y * scale }));
    for (let i = 1; i < points.length; i++)
      for (const t of texts) {
        if (
          segmentHitsBox(
            points[i - 1],
            points[i],
            expand(t.box, contract.textClearance + ((line.strokeWidth ?? 1) * scale) / 2),
          )
        )
          add('decoration-text-collision', line.id, t.id);
      }
  }
  return {
    failures,
    minimumEffectiveFont: texts.length ? Math.min(...texts.map((t) => t.fontSize)) : null,
    visibleTextCount: texts.length,
    visibleSemanticCount: shown.size,
    referenceScale: scale,
  };
}

/** Source-space canvas containment over the same measured envelopes. Values
 * come only from the imported quality contract; this is not browser paint. */
export function auditCanvasEnvelope(scene, quality) {
  const q = quality?.hard_gates?.geometry_each_scale;
  const inset = q?.canvas_clearance_source_units_min,
    wg = q?.font_width_growth_fraction,
    hg = q?.font_height_growth_fraction;
  if (
    ![inset, wg, hg].every((n) => Number.isFinite(n) && n >= 0) ||
    ![scene.width, scene.height].every((n) => Number.isFinite(n) && n > 0)
  )
    throw Error('Source canvas and growth values required');
  const envelopes = [];
  const add = (id, kind, box) => {
    if (
      ![box.x, box.y, box.width, box.height].every(Number.isFinite) ||
      box.width < 0 ||
      box.height < 0
    )
      throw Error('Invalid canvas envelope ' + id);
    envelopes.push({ id, kind, box });
  };
  for (const t of scene.texts.filter((t) => t.visible && t.text.trim())) {
    const dx = t.box.width * wg,
      dy = (t.box.height * hg) / 2;
    add(t.id, 'text', {
      x: t.box.x - (t.anchor === 'middle' ? dx / 2 : t.anchor === 'end' ? dx : 0),
      y: t.box.y - dy,
      width: t.box.width + dx,
      height: t.box.height + 2 * dy,
    });
  }
  // The trace renderer owns actual paint footprints; port boxes are not ink.
  for (const n of scene.nodes) {
    if (n.paintBox) add(n.id, 'node', n.paintBox);
    else if (Number.isFinite(n.strokeWidth) && n.strokeWidth >= 0)
      add(n.id, 'node', expand(n.box, n.strokeWidth / 2));
    else throw Error('Explicit node paint footprint required: ' + n.id);
  }
  const points = (id, kind, p, stroke) => {
    if (
      !p.length ||
      !Number.isFinite(stroke) ||
      stroke < 0 ||
      p.some((v) => !Number.isFinite(v.x) || !Number.isFinite(v.y))
    )
      throw Error('Invalid canvas path ' + id);
    const xs = p.map((v) => v.x),
      ys = p.map((v) => v.y);
    add(
      id,
      kind,
      expand(
        {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        },
        stroke / 2,
      ),
    );
  };
  for (const e of scene.edges) {
    points(e.id, 'edge', e.points, e.strokeWidth ?? 1);
    if (e.arrowGeometry) {
      const g = e.arrowGeometry,
        tip = e.points.at(-1),
        previous = e.points.at(-2);
      if (
        !tip ||
        !previous ||
        ![g.length, g.halfWidth, g.strokeWidth].every((n) => Number.isFinite(n) && n >= 0)
      )
        throw Error('Invalid arrow envelope ' + e.id);
      const d = Math.hypot(tip.x - previous.x, tip.y - previous.y);
      if (!d) throw Error('Zero arrow terminal ' + e.id);
      const ux = (tip.x - previous.x) / d,
        uy = (tip.y - previous.y) / d;
      const wing = (sign) => ({
        x: tip.x - ux * g.length - sign * uy * g.halfWidth,
        y: tip.y - uy * g.length + sign * ux * g.halfWidth,
      });
      points(e.id, 'arrow', [wing(-1), tip, wing(1)], g.strokeWidth);
    }
  }
  for (const line of scene.decorations ?? [])
    points(line.id, 'rule', line.points, line.strokeWidth ?? 1);
  const measured = envelopes.map((e) => ({
    ...e,
    clearance: Math.min(e.box.x, e.box.y, scene.width - right(e.box), scene.height - bottom(e.box)),
  }));
  return {
    sourceQualitySchema: quality.schema ?? null,
    insetSourceUnits: inset,
    minimumClearance: measured.length ? Math.min(...measured.map((e) => e.clearance)) : null,
    envelopes: measured,
    failures: measured
      .filter((e) => e.clearance < inset)
      .map((e) => ({
        code: 'canvas-clearance',
        id: e.id,
        kind: e.kind,
        actual: e.clearance,
        minimum: inset,
      })),
    scope:
      'Grown text, renderer-declared node paint boxes, complete path and arrow-wing envelopes, and rules in authored SVG units. Not a browser/CTM or aesthetic acceptance.',
  };
}
