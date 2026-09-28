import { fail } from '../../src/protocol/values.mjs';

const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const pathData = (points) =>
  points.map(({ x, y }, index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');

/** Paint one already source-checked authored canvas without source bytes or code execution. */
export function renderAuthoredCanvasSvg(scene) {
  if (scene?.schema !== 'architecture.authored-static-scene/v1')
    fail('authored_canvas_scene_invalid');
  const tone = (name) => {
    const value = scene.paint?.[name];
    if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/u.test(value))
      fail('authored_canvas_tone_invalid');
    return value;
  };
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-labelledby="canvas-title canvas-description" font-family="JetBrains Mono">`,
    `<title id="canvas-title">${escape(scene.title)}</title>`,
    `<desc id="canvas-description">${escape(scene.subtitle)}</desc>`,
    `<rect width="${scene.width}" height="${scene.height}" fill="${tone('paper')}"/>`,
  ];
  for (const rule of scene.decorations)
    lines.push(
      `<path d="${pathData(rule.points)}" fill="none" stroke="${tone(rule.tone)}" stroke-width="${rule.strokeWidth}"/>`,
    );
  for (const [index, edge] of scene.edges.entries()) {
    const color = tone(edge.strokeTone);
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
  for (const node of scene.nodes) {
    const color = tone(node.tone);
    lines.push(
      `<circle data-graphic-id="node:${escape(node.id)}" cx="${node.center.x}" cy="${node.center.y}" r="${node.radius}" fill="${tone('paper')}" stroke="${color}" stroke-width="${node.strokeWidth}"/>`,
      `<circle cx="${node.center.x}" cy="${node.center.y}" r="2.4" fill="${color}"/>`,
    );
  }
  for (const label of scene.texts) {
    if (!label.visible) continue;
    lines.push(
      `<text data-graphic-id="text:${escape(label.id)}" x="${label.x}" y="${label.baseline}" text-anchor="${label.anchor}" font-size="${label.fontSize}" font-weight="${label.weight}" fill="${tone(label.tone)}">${escape(label.text)}</text>`,
    );
  }
  lines.push('</svg>', '');
  return Buffer.from(lines.join('\n'));
}
