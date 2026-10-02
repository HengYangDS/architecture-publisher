import fs from 'node:fs/promises';
import path from 'node:path';
import { fail } from '../../src/protocol/values.mjs';
import {
  assertPrimitiveContrast,
  resolvePrimitiveNodes,
  resolvePrimitivePaint,
} from '../../src/scene/primitives.mjs';
import { renderPrimitives } from '../svg/primitives.mjs';

const tones = new Map([
  ['paper', 'var(--bg)'],
  ['ink', 'var(--text)'],
  ['muted', 'var(--text-muted)'],
]);

function assertPaintLayout(
  marks,
  components,
  boundaries,
  labels,
  connections,
  paths,
  viewBox,
  rectsOverlap,
  segmentIntersectsRect,
) {
  const owners = new Map(components.map((component) => [component.id, component]));
  for (const mark of marks) {
    const box = mark.paintBox;
    if (box.x < 0 || box.y < 0 || box.x + box.width > viewBox[0] || box.y + box.height > viewBox[1])
      throw Error(`authored_interactive_paint_geometry_invalid:${mark.id}:bounds`);
    for (const owner of owners.values())
      if (owner.id !== mark.id && rectsOverlap(box, owner.paintBox ?? owner, 8))
        throw Error(`authored_interactive_paint_geometry_invalid:${mark.id}:node`);
    if (
      [...boundaries.map((boundary) => boundary.title), ...labels].some((owner) =>
        rectsOverlap(box, owner, 5),
      )
    )
      throw Error(`authored_interactive_paint_geometry_invalid:${mark.id}:label`);
    for (const [index, points] of paths.entries()) {
      if ([connections[index].from, connections[index].to].includes(mark.id)) continue;
      if (
        points
          .slice(1)
          .some((point, i) => segmentIntersectsRect({ start: points[i], end: point }, box, 1))
      )
        throw Error(`authored_interactive_paint_geometry_invalid:${mark.id}:route`);
    }
  }
}

/** Replace native component paint while retaining its measured ports, router and inspection site. */
export async function adaptArchitecturePrimitives(native, scene) {
  const nodes = resolvePrimitiveNodes(scene.nodes, 'interactive');
  const marks = nodes.filter((node) => node.primitives);
  if (!marks.length) return;
  assertPrimitiveContrast(
    marks,
    (name) => {
      if (!tones.has(name)) fail('render_scene_primitive_tone_unsupported');
      return tones.get(name);
    },
    tones.get('paper'),
  );
  const markup = Object.fromEntries(
    marks.map((node) => [
      node.id,
      renderPrimitives(resolvePrimitivePaint(node, node.position).primitives, (name) => {
        if (!tones.has(name)) fail('render_scene_primitive_tone_unsupported');
        return tones.get(name);
      }),
    ]),
  );
  const file = path.join(native, 'renderers/architecture/render-architecture.mjs');
  let source = await fs.readFile(file, 'utf8');
  const painting = 'function renderComponent(c) {\n';
  const checks = '  if (problems.length) {\n';
  const legacyLabel = '    const estLabelW = textUnits(c.label) * 6.6;';
  if (
    source.split(painting).length !== 2 ||
    source.split(checks).length !== 2 ||
    source.split(legacyLabel).length !== 2
  )
    fail('render_scene_primitive_seam_invalid');
  const selected = JSON.stringify(marks).replaceAll('<', '\\u003c');
  const painted = JSON.stringify(markup).replaceAll('<', '\\u003c');
  const paintOwners = JSON.stringify(marks.map(({ id, paintBox }) => [id, paintBox]));
  source = source.replace(
    painting,
    () =>
      `${painting}  const painted = ${painted};\n  const mark = ${selected}.find((node) => node.id === c.id);\n  if (mark) return mark.adornment ? painted[c.id] : \`<g \${focusNodeAttrs(c.id, c.label, {}, arch.meta.locale)}>\${painted[c.id]}</g>\`;\n`,
  );
  source = source.replace(
    checks,
    () =>
      `  const paintedOwners = new Map(${paintOwners});\n  (${assertPaintLayout.toString()})(${selected}, [...components.values()].map((c) => ({ ...c, paintBox: paintedOwners.get(c.id) })), boundaries, connectionLabels, asArray(arch.connections), asArray(arch.connections).map((conn) => pathFor(conn).points), viewBox, rectsOverlap, segmentIntersectsRect);\n${checks}`,
  );
  source = source.replace(
    legacyLabel,
    () => `    if (c.type === 'paint') continue;\n${legacyLabel}`,
  );
  source = "import { segmentIntersectsRect } from '../shared/geometry.mjs';\n" + source;
  await fs.writeFile(file, source);
  const schemaFile = path.join(native, 'schemas/common.schema.json');
  const schema = JSON.parse(await fs.readFile(schemaFile, 'utf8'));
  if (schema.$defs?.componentType?.enum?.length !== 7) fail('render_scene_primitive_seam_invalid');
  const incumbent = JSON.stringify(schema.$defs.componentType.enum);
  schema.$defs.componentType.enum.push('paint');
  await fs.writeFile(schemaFile, JSON.stringify(schema));
  const validatorFile = path.join(native, 'renderers/shared/generated-validators.mjs');
  const validator = await fs.readFile(validatorFile, 'utf8');
  const predicate = ' || (data59 === "external")))';
  if (validator.split(incumbent).length !== 2 || validator.split(predicate).length !== 2)
    fail('render_scene_primitive_seam_invalid');
  await fs.writeFile(
    validatorFile,
    validator
      .replace(incumbent, JSON.stringify(schema.$defs.componentType.enum))
      .replace(predicate, ' || (data59 === "external") || (data59 === "paint")))'),
  );
}
