const PAINT = Object.freeze({
  paper: '#f3f0e8',
  ink: '#26362f',
  muted: '#68716a',
  line: '#7d9183',
  accent: '#9b6f43',
  proof: '#75664d',
  ghost: '#c7cbc0',
  wash: '#e3e8df',
});
const ARROW = Object.freeze({ length: 8, halfWidth: 4, strokeWidth: 1.2 });

function metricBox(label, measure) {
  const measured = measure(label.text, label.size, label.weight),
    origin =
      label.anchor === 'middle'
        ? label.x - measured.width / 2
        : label.anchor === 'end'
          ? label.x - measured.width
          : label.x,
    glyph = measured.glyph;
  return {
    x: origin + glyph.x,
    y: label.y - glyph.y - glyph.height,
    width: glyph.width,
    height: glyph.height,
  };
}

export function compileArchitecturePublisherStaticScene(composition, measure) {
  return {
    schema: 'architecture.publisher-static-scene/v1',
    title: composition.title,
    subtitle: composition.subtitle,
    description: composition.description,
    width: composition.width,
    height: composition.height,
    referenceWidth: composition.width,
    spine: [...composition.spine],
    paint: { ...PAINT },
    nodes: composition.marks.map((mark) => ({
      id: mark.id,
      kind: mark.id.startsWith('feedback-return')
        ? 'feedback'
        : mark.id.startsWith('evolution') ||
            [
              'semantic-delta',
              'affected-views',
              'rebuild-verification',
              'review-publication',
            ].includes(mark.id)
          ? 'evolution'
          : 'spine',
      tone: mark.tone,
      center: { x: mark.x, y: mark.y },
      radius: mark.r,
      box: {
        x: mark.x - mark.r,
        y: mark.y - mark.r,
        width: mark.r * 2,
        height: mark.r * 2,
      },
      paintBox: {
        x: mark.x - mark.r - 1,
        y: mark.y - mark.r - 1,
        width: mark.r * 2 + 2,
        height: mark.r * 2 + 2,
      },
      strokeWidth: 2,
    })),
    texts: composition.labels.map((label) => ({
      id: label.id,
      text: label.text,
      fontSize: label.size,
      weight: label.weight,
      anchor: label.anchor,
      tone: label.tone,
      x: label.x,
      baseline: label.y,
      visible: true,
      semanticIds: [...label.semantics],
      box: metricBox(label, measure),
    })),
    edges: composition.relations.map((edge) => ({
      id: edge.id,
      kind: edge.kind,
      source: edge.source,
      target: edge.target,
      points: edge.points.map((point) => ({ ...point })),
      strokeWidth: edge.kind === 'trust' ? 2 : edge.kind === 'feedback' ? 1.2 : 1.5,
      arrow: true,
      arrowGeometry: { ...ARROW },
      semanticIds: [...edge.semantics],
    })),
    decorations: composition.rules.map((rule) => ({
      id: rule.id,
      role: 'rule',
      tone: 'ghost',
      points: rule.points.map((point) => ({ ...point })),
      strokeWidth: 1,
    })),
    requiredSemanticIds: [...composition.requiredSemanticIds],
    coverage: structuredClone(composition.coverage),
  };
}
