import sax from './supply/sax/sax.cjs';
import { parse as parseFont } from './supply/opentype/opentype.mjs';
import { fail } from '../../src/source/manifest.mjs';
import { RASTER_LIMITS } from './limits.mjs';
import { isSvgAttribute, validateSvgValues } from './values.mjs';

const SVG = 'http://www.w3.org/2000/svg',
  XLINK = 'http://www.w3.org/1999/xlink',
  XML = 'http://www.w3.org/XML/1998/namespace',
  XMLNS = 'http://www.w3.org/2000/xmlns/';
const tags = new Set([
  'svg',
  'g',
  'defs',
  'symbol',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'use',
  'clipPath',
  'marker',
  'linearGradient',
  'radialGradient',
  'stop',
  'text',
  'tspan',
  'title',
  'desc',
]);
const positive = (value) => {
  if (typeof value !== 'string' || !/^(?:\d+(?:\.\d*)?|\.\d+)(?:px)?$/.test(value)) return NaN;
  return Number(value.replace(/px$/, ''));
};
const familyName = (value) => value.trim().replace(/^(['"])(.*?)\1$/, '$2');
const gradients = new Set(['linearGradient', 'radialGradient']);

function validReferenceTarget(source, kind, target) {
  if (kind === 'fill' || kind === 'stroke') return gradients.has(target);
  if (kind === 'clip-path') return target === 'clipPath';
  if (kind.startsWith('marker-')) return target === 'marker';
  if (kind === 'href' && gradients.has(source)) return gradients.has(target);
  // The parser already restricts use targets to the supported SVG namespace.
  return kind === 'href' && source === 'use';
}

function selectedFonts(fonts) {
  const known = new Map();
  for (const selected of fonts) {
    let font;
    try {
      const b = selected.bytes;
      font = parseFont(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
    } catch {
      fail('raster_font_invalid');
    }
    const names = new Set();
    for (const platform of Object.values(font.names))
      for (const key of ['fontFamily', 'preferredFamily', 'typographicFamily'])
        for (const text of Object.values(platform[key] ?? {})) names.add(text);
    if (
      !names.has(selected.family) ||
      font.tables.os2?.usWeightClass !== selected.weight ||
      font.tables.post?.italicAngle !== 0
    )
      fail('raster_font_identity_mismatch');
    const key = JSON.stringify([selected.family, selected.weight]);
    if (known.has(key)) fail('raster_font_duplicate');
    known.set(key, font);
  }
  return known;
}

/** A declared static SVG profile. Unsupported content is rejected, not sanitized. */
export function validateSvg(bytes, fonts, width) {
  if (bytes.length > RASTER_LIMITS.svgBytes) fail('raster_svg_size_exceeded');
  let source;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    fail('raster_svg_invalid');
  }
  const knownFonts = selectedFonts(fonts),
    usedFonts = new Set();
  const parser = sax.parser(true, {
    xmlns: true,
    strictEntities: true,
    position: false,
  });
  const stack = [],
    ids = new Map(),
    references = [],
    graph = new Map(),
    nodes = new Map();
  let count = 0,
    extent,
    rootSeen = false;
  const reject = () => fail('raster_svg_unsupported');
  parser.onerror = () => fail('raster_svg_invalid');
  parser.ondoctype = reject;
  parser.onprocessinginstruction = (instruction) => {
    if (instruction.name !== 'xml') reject();
  };
  parser.onopentag = (node) => {
    if (++count > RASTER_LIMITS.elements || stack.length >= RASTER_LIMITS.depth)
      fail('raster_svg_limit');
    if (node.uri !== SVG || !tags.has(node.local)) reject();
    if (!stack.length) {
      if (rootSeen || node.local !== 'svg') reject();
      rootSeen = true;
    } else if (node.local === 'svg') reject();
    const parent = stack.at(-1),
      inherited = parent?.font ?? {
        family: '',
        weight: '400',
        style: 'normal',
      };
    const values = {};
    for (const attribute of Object.values(node.attributes)) {
      if (attribute.uri === XMLNS) {
        if (![SVG, XLINK, XML].includes(attribute.value)) reject();
        continue;
      }
      if (attribute.uri === XML) {
        if (attribute.local !== 'space' || !['default', 'preserve'].includes(attribute.value))
          reject();
        continue;
      }
      if (attribute.uri && !(attribute.uri === XLINK && attribute.local === 'href')) reject();
      const key = attribute.local,
        value = attribute.value;
      if (key === 'href') {
        if (
          !['use', 'linearGradient', 'radialGradient'].includes(node.local) ||
          !/^#[A-Za-z_][\w.:-]*$/.test(value)
        )
          reject();
        references.push({ from: count, to: value.slice(1), kind: 'href' });
      } else if (!isSvgAttribute(key)) reject();
      if (Object.hasOwn(values, key)) reject();
      values[key] = value;
      if (
        ['fill', 'stroke', 'clip-path', 'marker-start', 'marker-mid', 'marker-end'].includes(key) &&
        /url\s*\(/i.test(value)
      ) {
        const match = /^url\(\s*#([A-Za-z_][\w.:-]*)\s*\)$/.exec(value);
        if (!match) reject();
        references.push({ from: count, to: match[1], kind: key });
      }
      if (/\\|@import|expression\s*\(/i.test(value) && !/^data-|^aria-/.test(key)) reject();
    }
    if (values.id !== undefined) {
      if (!/^[A-Za-z_][\w.:-]*$/.test(values.id) || ids.has(values.id))
        fail('raster_svg_identity_invalid');
      ids.set(values.id, count);
    }
    graph.set(count, []);
    if (parent) graph.get(parent.index).push(count);
    if (!parent) {
      const w = positive(values.width),
        h = positive(values.height);
      if (
        !Number.isFinite(w) ||
        !Number.isFinite(h) ||
        w <= 0 ||
        h <= 0 ||
        w > 100000 ||
        h > 100000
      )
        fail('raster_dimensions_invalid');
      if (values.viewBox !== undefined) {
        const box = values.viewBox
          .trim()
          .split(/[\s,]+/)
          .map(Number);
        if (box.length !== 4 || box.some((n) => !Number.isFinite(n)) || box[2] <= 0 || box[3] <= 0)
          fail('raster_dimensions_invalid');
      }
      const height = Math.round((width * h) / w);
      if (height < 1 || height > RASTER_LIMITS.height || width * height > RASTER_LIMITS.pixels)
        fail('raster_dimensions_invalid');
      extent = { width, height };
    }
    validateSvgValues(node.local, values);
    const font = {
      family: values['font-family'] ?? inherited.family,
      weight: values['font-weight'] ?? inherited.weight,
      style: values['font-style'] ?? inherited.style,
    };
    const entry = {
      index: count,
      tag: node.local,
      values,
      inherited,
      font,
      children: [],
      references: [],
      chunks: [],
      text: ['text', 'tspan'].includes(node.local),
      metadata: ['title', 'desc'].includes(node.local) || parent?.metadata,
    };
    nodes.set(count, entry);
    if (parent) parent.children.push(count);
    stack.push(entry);
    if (references.length > RASTER_LIMITS.references) fail('raster_svg_limit');
  };
  parser.onclosetag = () => {
    stack.pop();
  };
  const text = (value) => {
    const node = stack.at(-1);
    if (node?.metadata || !value.trim()) return;
    if (!node?.text) fail('raster_svg_unsupported');
    node.chunks.push(value);
  };
  const checkText = (value, selection) => {
    const family = familyName(selection.family),
      weight =
        selection.weight === 'normal'
          ? 400
          : selection.weight === 'bold'
            ? 700
            : Number(selection.weight);
    if (!family || family.includes(',') || selection.style !== 'normal')
      fail('raster_font_unbound');
    const key = JSON.stringify([family, weight]),
      font = knownFonts.get(key);
    if (!font) fail('raster_font_unbound');
    usedFonts.add(key);
    for (const char of value)
      if (!/\s/u.test(char) && !font.charToGlyphIndex(char)) fail('raster_glyph_missing');
  };
  parser.ontext = text;
  parser.oncdata = text;
  // Bounded chunks let SAX enforce its buffer limit rather than one unbounded write.
  for (let offset = 0; offset < source.length; offset += 32768)
    parser.write(source.slice(offset, offset + 32768));
  parser.close();
  if (!rootSeen || !extent || stack.length) fail('raster_svg_invalid');
  for (const reference of references) {
    const target = ids.get(reference.to);
    if (!target) fail('raster_svg_reference_missing');
    if (!validReferenceTarget(nodes.get(reference.from).tag, reference.kind, nodes.get(target).tag))
      fail('raster_svg_reference_type_invalid');
    graph.get(reference.from).push(target);
    nodes.get(reference.from).references.push({ target, kind: reference.kind });
  }
  const active = new Set(),
    heights = new Map();
  function visit(id, depth = 0) {
    if (active.has(id)) fail('raster_svg_reference_cycle');
    if (depth > RASTER_LIMITS.referenceDepth) fail('raster_svg_limit');
    if (heights.has(id)) return heights.get(id);
    active.add(id);
    let height = 0;
    for (const next of graph.get(id)) height = Math.max(height, 1 + visit(next, depth + 1));
    active.delete(id);
    if (height > RASTER_LIMITS.referenceDepth) fail('raster_svg_limit');
    heights.set(id, height);
    return height;
  }
  for (const id of graph.keys()) visit(id);
  // Definitions do not paint in place. A use instance inherits from its host,
  // not from the referenced element's original ancestors. Explicit declarations
  // inside the referenced subtree still override that inherited context.
  const definitions = new Set([
    'defs',
    'symbol',
    'clipPath',
    'marker',
    'linearGradient',
    'radialGradient',
    'stop',
  ]);
  const contexts = new Set();
  function checkInstance(id, inherited) {
    const node = nodes.get(id);
    if (node.metadata) return;
    const font = {
      family: node.values['font-family'] ?? inherited.family,
      weight: node.values['font-weight'] ?? inherited.weight,
      style: node.values['font-style'] ?? inherited.style,
    };
    const key = JSON.stringify([id, font.family, font.weight, font.style]);
    if (contexts.has(key)) return;
    if (contexts.size >= RASTER_LIMITS.fontContexts) fail('raster_svg_limit');
    contexts.add(key);
    for (const chunk of node.chunks) checkText(chunk, font);
    for (const child of node.children)
      if (!definitions.has(nodes.get(child).tag)) checkInstance(child, font);
    for (const { target, kind } of node.references)
      checkInstance(
        target,
        node.tag === 'use' && kind === 'href' ? font : nodes.get(target).inherited,
      );
  }
  checkInstance(1, { family: '', weight: '400', style: 'normal' });
  return { ...extent, elements: count, fontCount: usedFonts.size };
}
