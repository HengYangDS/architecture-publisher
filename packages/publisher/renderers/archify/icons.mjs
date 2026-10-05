import fs from 'node:fs/promises';
import path from 'node:path';
import { fail } from '../../src/protocol/values.mjs';
import { validateResolvedFigureIcons } from '../icons/index.mjs';

/** Extend the private native glyph seam with only the selected verified artwork. */
export async function adaptArchitectureIcons(native, scene, supply) {
  const typed = scene.nodes.some(
    (node) => node.figureKind !== undefined || node.icon?.startsWith('lucide:'),
  );
  if (!typed) return false;
  validateResolvedFigureIcons([scene], supply);
  const selected = [
    ...new Set(
      scene.nodes.filter((node) => !node.primitives && !node.adornment).map(({ icon }) => icon),
    ),
  ];
  if (!selected.length) return false;
  const glyphs = Object.fromEntries(selected.map((icon) => [icon, supply.icons[icon].artwork]));
  const schemaFile = path.join(native, 'schemas/common.schema.json');
  const schema = JSON.parse(await fs.readFile(schemaFile, 'utf8'));
  const incumbent = JSON.stringify(schema.$defs.nodeIcon.enum);
  schema.$defs.nodeIcon.enum.push(...selected);
  await fs.writeFile(schemaFile, JSON.stringify(schema));
  const validatorFile = path.join(native, 'renderers/shared/generated-validators.mjs');
  const validator = await fs.readFile(validatorFile, 'utf8');
  const predicate = ' || (data63 === "none")))';
  if (validator.split(incumbent).length !== 2 || validator.split(predicate).length !== 2)
    fail('render_icon_seam_invalid');
  const extensions = selected.map((icon) => ` || (data63 === ${JSON.stringify(icon)})`).join('');
  await fs.writeFile(
    validatorFile,
    validator
      .replace(incumbent, JSON.stringify(schema.$defs.nodeIcon.enum))
      .replace(predicate, ` || (data63 === "none")${extensions}))`),
  );
  const file = path.join(native, 'renderers/shared/utils.mjs');
  let source = await fs.readFile(file, 'utf8');
  const patches = [
    [
      'const SIGIL_SHAPE = {',
      `const PUBLISHER_GLYPHS = ${JSON.stringify(glyphs)};\nconst SIGIL_SHAPE = {`,
    ],
    [
      "const normalized = Object.hasOwn(SIGIL_SHAPE, selected) ? selected : 'neutral';",
      "const normalized = Object.hasOwn(PUBLISHER_GLYPHS, selected) ? selected : Object.hasOwn(SIGIL_SHAPE, selected) ? selected : 'neutral';",
    ],
    [
      'const scale = size / 16;',
      'const scale = size / (Object.hasOwn(PUBLISHER_GLYPHS, selected) ? 24 : 16);',
    ],
    ['${SIGIL_SHAPE[normalized]}', '${PUBLISHER_GLYPHS[normalized] ?? SIGIL_SHAPE[normalized]}'],
  ];
  for (const [before, after] of patches) {
    if (source.split(before).length !== 2) fail('render_icon_seam_invalid');
    source = source.replace(before, after);
  }
  await fs.writeFile(file, source);
  const rendererFile = path.join(native, 'renderers/architecture/render-architecture.mjs');
  const renderer = await fs.readFile(rendererFile, 'utf8');
  const end = '      </svg>`;';
  if (renderer.split(end).length !== 2) fail('render_icon_seam_invalid');
  const license = supply.license
    .toString('utf8')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('`', '&#96;')
    .replaceAll('${', '&#36;{');
  await fs.writeFile(
    rendererFile,
    renderer.replace(end, `<metadata id="figure-icon-license">${license}</metadata>\n${end}`),
  );
  return true;
}
