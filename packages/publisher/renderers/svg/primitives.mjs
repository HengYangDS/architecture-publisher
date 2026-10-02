/** Paint only resolved, validated standard primitives; ports and semantic identities stay outside. */
export function renderPrimitives(primitives, tone) {
  return primitives
    .map((primitive) => {
      const paint = `fill="${primitive.fill === null ? 'none' : tone(primitive.fill)}" stroke="${primitive.stroke === null ? 'none' : tone(primitive.stroke)}" stroke-width="${primitive.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill-rule="nonzero"`;
      if (primitive.kind === 'circle')
        return `<circle cx="${primitive.center.x}" cy="${primitive.center.y}" r="${primitive.radius}" ${paint}/>`;
      if (primitive.kind === 'rect')
        return `<rect x="${primitive.box.x}" y="${primitive.box.y}" width="${primitive.box.width}" height="${primitive.box.height}" ${paint}/>`;
      if (primitive.kind === 'line')
        return `<line x1="${primitive.start.x}" y1="${primitive.start.y}" x2="${primitive.end.x}" y2="${primitive.end.y}" ${paint}/>`;
      const tag = primitive.closed ? 'polygon' : 'polyline';
      return `<${tag} points="${primitive.points.map(({ x, y }) => `${x},${y}`).join(' ')}" ${paint}/>`;
    })
    .join('\n');
}
