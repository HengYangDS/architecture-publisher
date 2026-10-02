import fs from 'node:fs/promises';
import path from 'node:path';
import { fail } from '../../src/protocol/values.mjs';
import { loadBundledFonts } from '../fonts/index.mjs';
import { verifyAuthoredCanvasTextBoxes } from '../resvg/measurement.mjs';
import { pathToFileURL } from 'node:url';

const tones = new Map([
  ['ink', 't-primary'],
  ['muted', 't-muted'],
]);
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function assertTextLayout(
  texts,
  components,
  boundaries,
  labels,
  paths,
  viewBox,
  overlaps,
  intersects,
  minimumReadable,
) {
  for (const [index, text] of texts.entries()) {
    const box = text.box;
    if (
      text.fontSize < Math.max(10, minimumReadable(viewBox[0])) ||
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > viewBox[0] ||
      box.y + box.height > viewBox[1]
    )
      throw Error(`authored_interactive_text_geometry_invalid:${text.id}:bounds`);
    if (
      [...components, ...boundaries.map((boundary) => boundary.title), ...labels].some((owner) =>
        overlaps(box, owner, 5),
      ) ||
      texts.slice(0, index).some((other) => overlaps(box, other.box, 5)) ||
      paths.some((points) =>
        points.slice(1).some((point, i) => intersects({ start: points[i], end: point }, box, 6)),
      )
    )
      throw Error(`authored_interactive_text_geometry_invalid:${text.id}:collision`);
  }
}

/** Extend only the existing checked Archify runtime with finite measured text. */
export async function adaptArchitectureTexts(native, scene, selectedFonts = null) {
  const labels = (scene.texts ?? []).filter(({ visible }) => visible);
  if (!labels.length) return { supplies: [] };
  const { rectsOverlap, segmentIntersectsRect } = await import(
    pathToFileURL(path.join(native, 'renderers/shared/geometry.mjs')).href
  );
  const { minimumReadableSourceTextPx } = await import(
    pathToFileURL(path.join(native, 'renderers/shared/desktop-readability.mjs')).href
  );
  if (labels.some(({ tone }) => !tones.has(tone))) fail('render_scene_text_tone_unsupported');
  if (
    selectedFonts === null &&
    labels.some(({ font, family }) => font !== undefined || family !== undefined)
  )
    fail('authored_canvas_font_unselected');
  const fonts = selectedFonts ?? (await loadBundledFonts());
  const measurer = await verifyAuthoredCanvasTextBoxes({ texts: scene.texts }, fonts);
  assertTextLayout(
    labels,
    scene.nodes.map(({ position, size, paintBox }) => paintBox ?? { ...position, ...size }),
    [],
    [],
    [],
    [scene.viewport.width, scene.viewport.height],
    rectsOverlap,
    segmentIntersectsRect,
    minimumReadableSourceTextPx,
  );
  const fontCss = fonts.fonts
    .map(
      ({ bytes, weight, family = 'JetBrains Mono' }) =>
        `@font-face{font-family:${JSON.stringify(family).replaceAll('<', '\\3c ')};font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/ttf;base64,${bytes.toString('base64')}) format('truetype')}`,
    )
    .join('');
  const markup = labels
    .map((label) => {
      const identity = label.semanticIds.length
        ? `data-text-id="${escape(label.id)}" data-text-label="${escape(label.text)}" role="button" tabindex="0" aria-label="Inspect ${escape(label.text)}"`
        : `data-graphic-id="text:${escape(label.id)}"`;
      return `<text ${identity} x="${label.x}" y="${label.baseline}" font-family="${escape(JSON.stringify(label.family ?? fonts.defaultFamily ?? 'JetBrains Mono'))}" font-size="${label.fontSize}" font-weight="${label.weight}" text-anchor="${label.anchor}" xml:space="preserve" text-rendering="geometricPrecision" class="${tones.get(label.tone)}">${escape(label.text)}</text>`;
    })
    .join('\n');
  const file = path.join(native, 'renderers/architecture/render-architecture.mjs');
  let source = await fs.readFile(file, 'utf8');
  const geometryImport = "import { segmentIntersectsRect } from '../shared/geometry.mjs';\n";
  if (!source.includes(geometryImport)) source = geometryImport + source;
  const checks = '  if (problems.length) {\n';
  const painting = '      </svg>`;';
  if (source.split(checks).length !== 2 || source.split(painting).length !== 2)
    fail('render_scene_text_seam_invalid');
  const selected = JSON.stringify(labels).replaceAll('<', '\\u003c');
  const paintOwners = JSON.stringify(
    scene.nodes.filter((node) => node.paintBox).map(({ id, paintBox }) => [id, paintBox]),
  );
  source = source
    .replace(
      checks,
      () =>
        `  const textPaintOwners = new Map(${paintOwners});\n  (${assertTextLayout.toString()})(${selected}, [...components.values()].map((c) => textPaintOwners.get(c.id) ?? c), boundaries, connectionLabels, asArray(arch.connections).map((conn) => pathFor(conn).points), viewBox, rectsOverlap, segmentIntersectsRect, minimumReadableSourceTextPx);\n${checks}`,
    )
    .replace(
      painting,
      () => '${' + JSON.stringify(markup).replaceAll('<', '\\u003c') + '}\n' + painting,
    );
  await fs.writeFile(file, source);
  const schemaFile = path.join(native, 'schemas/architecture.schema.json');
  const schema = JSON.parse(await fs.readFile(schemaFile, 'utf8'));
  if (schema.properties?.components?.minItems !== 1) fail('render_scene_text_seam_invalid');
  schema.properties.components.minItems = 0;
  await fs.writeFile(schemaFile, JSON.stringify(schema));
  const validatorFile = path.join(native, 'renderers/shared/generated-validators.mjs');
  const validator = await fs.readFile(validatorFile, 'utf8');
  const componentSchema = '"components":{"type":"array","minItems":1,';
  const componentCheck =
    'if(data56.length < 1){const err139 = {instancePath:instancePath+"/components",schemaPath:"#/properties/components/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items"}';
  if (validator.split(componentSchema).length !== 2 || validator.split(componentCheck).length !== 2)
    fail('render_scene_text_seam_invalid');
  await fs.writeFile(
    validatorFile,
    validator
      .replace(componentSchema, '"components":{"type":"array","minItems":0,')
      .replace(
        componentCheck,
        componentCheck
          .replace('length < 1', 'length < 0')
          .replace('limit: 1', 'limit: 0')
          .replace('fewer than 1', 'fewer than 0'),
      ),
  );
  const templateFile = path.join(native, 'assets/template.html');
  const template = await fs.readFile(templateFile, 'utf8');
  const fontGroup = /<style id="archify-fonts">[\s\S]*?<\/style>/gu;
  if ([...template.matchAll(fontGroup)].length !== 1) fail('render_scene_text_seam_invalid');
  const distribution = (fonts.distributions ?? [])
    .map(({ bytes }) => escape(bytes.toString('utf8')))
    .join('\n');
  const notices = [fonts.license, ...(fonts.distributions ?? [])]
    .filter(Boolean)
    .map(({ bytes }) => bytes.toString('utf8').replaceAll('*/', '* /').replaceAll('<', '\\3c '))
    .join('\n');
  await fs.writeFile(
    templateFile,
    template
      .replace(
        fontGroup,
        () =>
          `<style id="archify-fonts">/* ${notices} */\n${fontCss}\nsvg text{font-synthesis:none;white-space:pre;text-rendering:geometricPrecision}</style>`,
      )
      .replace(
        '</body>',
        () =>
          `${distribution ? `<details><summary>Selected font distribution evidence</summary><pre>${distribution}</pre></details>` : ''}</body>`,
      ),
  );
  return { supplies: [{ id: 'statement-fonts', sha256: fonts.sha256 }, measurer.supply] };
}
