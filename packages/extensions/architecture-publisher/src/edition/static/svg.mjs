const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const pathData = (points) =>
  points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');

export function renderArchitecturePublisherStaticSvg(scene) {
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${scene.width}" height="${scene.height}" viewBox="0 0 ${scene.width} ${scene.height}" role="img" aria-labelledby="title description">`,
    `<title id="title">${escape(scene.title)}</title>`,
    `<desc id="description">${escape(scene.subtitle)}. Target flagship composition; generation is not qualification or acceptance.</desc>`,
    `<defs><marker id="arrow-flow" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8" fill="none" stroke="${scene.paint.line}" stroke-width="1.2"/></marker><marker id="arrow-trust" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8" fill="none" stroke="${scene.paint.accent}" stroke-width="1.2"/></marker><marker id="arrow-renewal" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8" fill="none" stroke="${scene.paint.proof}" stroke-width="1.2"/></marker><marker id="arrow-feedback" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8" fill="none" stroke="${scene.paint.ghost}" stroke-width="1.2"/></marker></defs>`,
    `<rect width="${scene.width}" height="${scene.height}" fill="${scene.paint.paper}"/>`,
  ];
  for (const rule of scene.decorations)
    lines.push(
      `<path data-rule="${escape(rule.id)}" d="${pathData(rule.points)}" fill="none" stroke="${scene.paint[rule.tone]}" stroke-width="${rule.strokeWidth}"/>`,
    );
  for (const edge of scene.edges)
    lines.push(
      `<path data-edge="${escape(edge.id)}" data-source="${escape(edge.source)}" data-target="${escape(edge.target)}" d="${pathData(edge.points)}" fill="none" stroke="${edge.kind === 'renewal' ? scene.paint.proof : edge.kind === 'trust' ? scene.paint.accent : edge.kind === 'feedback' ? scene.paint.ghost : scene.paint.line}" stroke-width="${edge.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow-${edge.kind === 'feedback' ? 'feedback' : edge.kind === 'renewal' ? 'renewal' : edge.kind === 'trust' ? 'trust' : 'flow'})"/>`,
    );
  for (const node of scene.nodes) {
    const color = scene.paint[node.tone] ?? scene.paint.ink;
    lines.push(
      `<circle data-node="${escape(node.id)}" cx="${node.center.x}" cy="${node.center.y}" r="${node.radius}" fill="${scene.paint.paper}" stroke="${color}" stroke-width="${node.strokeWidth}"/>`,
      `<circle cx="${node.center.x}" cy="${node.center.y}" r="2.4" fill="${color}"/>`,
    );
  }
  for (const label of scene.texts)
    lines.push(
      `<text data-label="${escape(label.id)}" data-semantics="${escape(label.semanticIds.join(' '))}" x="${label.x}" y="${label.baseline}" text-anchor="${label.anchor}" font-family="JetBrains Mono" font-size="${label.fontSize}" font-weight="${label.weight}" fill="${scene.paint[label.tone] ?? scene.paint.ink}">${escape(label.text)}</text>`,
    );
  lines.push('</svg>', '');
  return Buffer.from(lines.join('\n'));
}

export function embedArchitecturePublisherStaticFonts(svg, fonts) {
  const fontCss = fonts
    .map(
      (font) =>
        `@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:${font.weight};font-display:block;src:url(data:font/ttf;base64,${font.bytes.toString('base64')}) format('truetype');}`,
    )
    .join('');
  const source = svg.toString('utf8');
  if (source.split('</svg>').length !== 2)
    throw Object.assign(new Error('self_flagship_svg_invalid'), {
      code: 'self_flagship_svg_invalid',
    });
  return Buffer.from(source.replace('</svg>', `<style>${fontCss}</style>\n</svg>`));
}
