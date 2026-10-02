import fs from 'node:fs/promises';
import path from 'node:path';
import { fail } from '../../src/protocol/values.mjs';
import { validateAuthoredRouteGeometry } from '../../src/scene/routes.mjs';
import { renderLiteralSegment } from '../svg/segments.mjs';
import { pathToFileURL } from 'node:url';
import { auditEmittedEdges } from '../../src/scene/emitted-path.mjs';

const tones = new Map([
  ['ink', 'var(--text)'],
  ['muted', 'var(--text-muted)'],
]);

/** Checked literal-path override in the private verified Archify runtime, never the supply. */
export async function adaptArchitectureRoutes(native, scene) {
  validateAuthoredRouteGeometry(scene, 'interactive');
  const edges = scene.edges.filter((edge) => edge.adornment);
  if (!edges.length) return {};
  const { focusEdgeAttrs } = await import(
    pathToFileURL(path.join(native, 'renderers/shared/cli.mjs')).href
  );
  const markup = Object.fromEntries(
    edges.map((edge) => {
      if (!tones.has(edge.strokeTone)) fail('render_scene_route_tone_unsupported');
      const bound = scene.routes?.some((route) =>
        route.traversals.some((traversal) => traversal.edge === edge.id),
      );
      const attributes = bound
        ? `${focusEdgeAttrs(edge.from, edge.to, '', edge.id, edge.id)} data-composition-points="${edge.points.map(({ x, y }) => `${x},${y}`).join(';')}"`
        : 'aria-hidden="true"';
      return [
        edge.id,
        renderLiteralSegment(
          edge,
          attributes,
          tones.get(edge.strokeTone),
          `literal-arrow-${edge.id}`,
        ),
      ];
    }),
  );
  const file = path.join(native, 'renderers/architecture/render-architecture.mjs');
  let source = await fs.readFile(file, 'utf8');
  const declaration = 'const { pathFor, connectionSides, connectionEndpointSide } = createRouter(';
  const painting = 'function renderConnectionPath(conn, index) {\n';
  const checks = 'function hasAutomaticRouteGeometry(connection) {';
  const shortDistance = '      const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);';
  const componentPainting = "${[...components.values()].map(renderComponent).join('\\n\\n')}";
  if (
    [declaration, painting, checks, shortDistance, componentPainting].some(
      (needle) => source.split(needle).length !== 2,
    )
  )
    fail('render_scene_route_seam_invalid');
  const literal = JSON.stringify(
    Object.fromEntries(edges.map((edge) => [edge.id, edge])),
  ).replaceAll('<', '\\u003c');
  const painted = JSON.stringify(markup).replaceAll('<', '\\u003c');
  source = source.replace(
    declaration,
    'const { pathFor: nativePathFor, connectionSides, connectionEndpointSide } = createRouter(',
  );
  source = source.replace(
    checks,
    () =>
      `const literalSegments = new Map(Object.entries(${literal}));\nfunction pathFor(connection) {\n  const edge = literalSegments.get(connection.id);\n  if (!edge) return nativePathFor(connection);\n  const points = edge.points.map(({ x, y }) => [x, y]);\n  return { points, d: points.map(([x, y], index) => \`\${index ? 'L' : 'M'} \${x} \${y}\`).join(' ') };\n}\n${checks}`,
  );
  source = source.replace(
    painting,
    () =>
      `${painting}  const painted = ${painted};\n  if (Object.hasOwn(painted, conn.id)) return painted[conn.id];\n`,
  );
  source = source.replace(
    shortDistance,
    () =>
      `${shortDistance}\n      if (literalSegments.has(conn.id) && conn.from === conn.to) continue;`,
  );
  const deferred = edges.filter((edge) => edge.from === edge.to).map(({ id }) => id);
  source = source.replace(
    painting,
    () =>
      `${painting}  const deferred = new Set(${JSON.stringify(deferred)});\n  if (deferred.has(conn.id) && !afterComponents) return '';\n  if (!deferred.has(conn.id) && afterComponents) return '';\n`,
  );
  source = source.replace(
    'function renderConnectionPath(conn, index) {',
    'function renderConnectionPath(conn, index, afterComponents = false) {',
  );
  source = source.replace(
    "${asArray(arch.connections).map(renderConnectionPath).join('\\n')}",
    "${asArray(arch.connections).map((connection, index) => renderConnectionPath(connection, index)).join('\\n')}",
  );
  source = source.replace(
    componentPainting,
    () =>
      `${componentPainting}\n\${asArray(arch.connections).map((connection, index) => renderConnectionPath(connection, index, true)).join('\\n')}`,
  );
  await fs.writeFile(file, source);
  return {
    verifyRendered: (bytes) => {
      const audit = auditEmittedEdges(
        bytes.toString('utf8'),
        { edges },
        { minimumTerminal: 14, endpointTolerance: 1, graphicAttribute: 'data-literal-segment-id' },
      );
      if (audit.failures.length) fail('render_scene_route_paint_mismatch');
    },
  };
}
