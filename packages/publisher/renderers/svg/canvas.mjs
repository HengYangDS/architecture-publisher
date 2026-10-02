import { fail } from '../../src/protocol/values.mjs';
import { editorialFraming } from '../../src/scene/framing.mjs';
import {
  assertPrimitiveContrast,
  resolvePrimitiveNodes,
  resolvePrimitivePaint,
} from '../../src/scene/primitives.mjs';
import { renderPrimitives } from './primitives.mjs';
import { renderLiteralSegment } from './segments.mjs';

const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const pathData = (points) =>
  points.map(({ x, y }, index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');

/** One static-only framing request for preparation and painting. */
export function authoredCanvasFramingRequest(editor) {
  return {
    text: editorialFraming(editor),
    fontSize: 11,
    weight: '400',
    anchor: 'start',
    x: 64,
    baseline: -16,
  };
}

/** Paint one already source-checked authored canvas without source bytes or code execution. */
export function renderAuthoredCanvasSvg(scene, editor, measurer) {
  if (scene?.schema !== 'architecture.authored-static-scene/v1')
    fail('authored_canvas_scene_invalid');
  if (typeof editor !== 'string' || !editor.trim() || editor.trim() !== editor)
    fail('authored_canvas_editor_invalid');
  if (typeof measurer?.box !== 'function') fail('authored_canvas_measurer_required');
  const framingRequest = authoredCanvasFramingRequest(editor);
  const framing = framingRequest.text;
  const framingBox = measurer.box(framingRequest);
  if (
    framingBox.x < 56 ||
    framingBox.x + framingBox.width > scene.width - 64 ||
    framingBox.y < -36 ||
    framingBox.y + framingBox.height > -8
  )
    fail('authored_canvas_framing_unrepresentable');
  const description = scene.description ?? scene.subtitle;
  if (typeof description !== 'string' || !description.trim() || description.trim() !== description)
    fail('authored_canvas_description_invalid');
  const tone = (name) => {
    const value = scene.paint?.[name];
    if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/u.test(value))
      fail('authored_canvas_tone_invalid');
    return value;
  };
  assertPrimitiveContrast(
    scene.nodes,
    (name) => tone(name).toLowerCase(),
    tone('paper').toLowerCase(),
  );
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height + 42}" viewBox="0 -42 ${scene.width} ${scene.height + 42}" role="img" aria-labelledby="canvas-title" aria-describedby="canvas-description" xml:space="preserve" text-rendering="geometricPrecision" font-family="${escape(JSON.stringify(measurer.defaultFamily ?? 'JetBrains Mono'))}">`,
    `<title id="canvas-title">${escape(scene.title)}</title>`,
    `<desc id="canvas-description">${escape(description)} ${escape(framing)}</desc>`,
    `<rect y="-42" width="${scene.width}" height="${scene.height + 42}" fill="${tone('paper')}"/>`,
    `<text data-role="editorial-framing" x="64" y="-16" font-size="11" font-weight="400" fill="${tone('ink')}" opacity="0.7">${escape(framing)}</text>`,
    `<line x1="64" y1="-1" x2="${scene.width - 64}" y2="-1" stroke="${tone('ink')}" stroke-width="0.6" opacity="0.4"/>`,
  ];
  for (const rule of scene.decorations)
    lines.push(
      `<path d="${pathData(rule.points)}" fill="none" stroke="${tone(rule.tone)}" stroke-width="${rule.strokeWidth}"/>`,
    );
  const deferredSegments = [];
  for (const [index, edge] of scene.edges.entries()) {
    const color = tone(edge.strokeTone);
    if (edge.adornment) {
      const target = edge.source === edge.target ? deferredSegments : lines;
      target.push(
        renderLiteralSegment(
          edge,
          `data-edge="${escape(edge.id)}" data-source="${escape(edge.source)}" data-target="${escape(edge.target)}" data-graphic-id="edge:${escape(edge.id)}"`,
          color,
          `canvas-arrow-${index}`,
        ),
      );
      continue;
    }
    if (edge.arrow) {
      const { length, halfWidth, strokeWidth } = edge.arrowGeometry;
      lines.push(
        `<defs><marker id="canvas-arrow-${index}" markerUnits="userSpaceOnUse" markerWidth="${length}" markerHeight="${halfWidth * 2}" refX="${length}" refY="${halfWidth}" orient="auto"><path d="M 0 0 L ${length} ${halfWidth} L 0 ${halfWidth * 2}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/></marker></defs>`,
      );
    }
    lines.push(
      `<path data-edge="${escape(edge.id)}" data-source="${escape(edge.source)}" data-target="${escape(edge.target)}" data-graphic-id="edge:${escape(edge.id)}" d="${pathData(edge.points)}" fill="none" stroke="${color}" stroke-width="${edge.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${edge.arrow ? ` marker-end="url(#canvas-arrow-${index})"` : ''}/>`,
    );
  }
  for (const node of resolvePrimitiveNodes(scene.nodes, 'static')) {
    if (node.primitives) {
      const { primitives } = resolvePrimitivePaint(node, { x: node.box.x, y: node.box.y });
      lines.push(
        `<g data-graphic-id="node:${escape(node.id)}"${node.adornment ? ' aria-hidden="true"' : ''}>${renderPrimitives(primitives, tone)}</g>`,
      );
      continue;
    }
    const color = tone(node.tone);
    lines.push(
      `<circle data-graphic-id="node:${escape(node.id)}" cx="${node.center.x}" cy="${node.center.y}" r="${node.radius}" fill="${tone('paper')}" stroke="${color}" stroke-width="${node.strokeWidth}"/>`,
      `<circle cx="${node.center.x}" cy="${node.center.y}" r="2.4" fill="${color}"/>`,
    );
  }
  lines.push(...deferredSegments);
  for (const label of scene.texts) {
    if (!label.visible) continue;
    lines.push(
      `<text data-graphic-id="text:${escape(label.id)}" x="${label.x}" y="${label.baseline}" text-anchor="${label.anchor}" font-size="${label.fontSize}" font-weight="${label.weight}"${label.family ? ` font-family="${escape(JSON.stringify(label.family))}"` : ''} fill="${tone(label.tone)}">${escape(label.text)}</text>`,
    );
  }
  lines.push('</svg>', '');
  return Buffer.from(lines.join('\n'));
}
