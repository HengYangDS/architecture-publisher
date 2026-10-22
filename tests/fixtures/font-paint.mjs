import assert from "node:assert/strict";

export function observeGlyphPaintEnvelope(page, png, scale = 1) {
  return page.evaluate(
    async ({ base64, scale }) => {
      const image = new globalThis.Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = globalThis.document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const columns = Array(canvas.width).fill(0);
      const rows = Array(canvas.height).fill(0);
      const samples = [0, 127].map((threshold) => {
        let left = canvas.width;
        let top = canvas.height;
        let right = -1;
        let bottom = -1;
        let count = 0;
        for (let y = 0; y < canvas.height; y++)
          for (let x = 0; x < canvas.width; x++) {
            const alpha = pixels[(y * canvas.width + x) * 4 + 3];
            columns[x] = Math.max(columns[x], alpha);
            rows[y] = Math.max(rows[y], alpha);
            if (alpha <= threshold) continue;
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
            count++;
          }
        return {
          threshold,
          count,
          envelope: { left, top, right, bottom },
          logical: {
            x: left / scale,
            y: top / scale,
            width: (right + 1 - left) / scale,
            height: (bottom + 1 - top) / scale,
          },
        };
      });
      const edge = samples[0].envelope;
      return {
        width: canvas.width,
        height: canvas.height,
        scale,
        samples,
        edgeAlpha: {
          left: columns.slice(Math.max(0, edge.left - 1), edge.left + 2),
          right: columns.slice(edge.right, edge.right + 3),
          top: rows.slice(Math.max(0, edge.top - 1), edge.top + 2),
          bottom: rows.slice(edge.bottom, edge.bottom + 3),
        },
      };
    },
    { base64: png.toString("base64"), scale },
  );
}

export function assertGlyphPaintBounds(
  observation,
  expected,
  allowance,
  { originX = 0, originY = 0, scaleX = observation.scale, scaleY = observation.scale } = {},
) {
  const sample = observation.samples.find(({ threshold }) => threshold === 0);
  assert(sample?.count > 0, "The exact text must have a nonzero-alpha footprint");
  const { left, top, right, bottom } = sample.envelope;
  const edges = {
    left: originX + left / scaleX,
    top: originY + top / scaleY,
    right: originX + (right + 1) / scaleX,
    bottom: originY + (bottom + 1) / scaleY,
  };
  const declared = {
    left: expected.x,
    top: expected.y,
    right: expected.x + expected.width,
    bottom: expected.y + expected.height,
  };
  for (const edge of ["left", "top", "right", "bottom"])
    assert(
      Math.abs(edges[edge] - declared[edge]) <= allowance,
      `${edge}: ${JSON.stringify({ edges, declared, allowance, sample })}`,
    );
  return edges;
}

/** Inspect browser-shaped ink, not typographic advances; pixel witnesses validate it. */
export function observeDiagramGlyphContainment(surface, minimumInset = 4) {
  return surface.evaluate((minimumInset) => {
    const svg = globalThis.document.querySelector(".diagram-container > svg");
    const root = svg.viewBox.baseVal;
    const visible = (element) => {
      const style = globalThis.getComputedStyle(element);
      return (
        style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0
      );
    };
    const local = (element, box = element.getBBox()) => {
      const matrix = svg.getCTM().inverse().multiply(element.getCTM());
      const points = [
        [box.x, box.y],
        [box.x + box.width, box.y],
        [box.x, box.y + box.height],
        [box.x + box.width, box.y + box.height],
      ].map(([x, y]) => new globalThis.DOMPoint(x, y).matrixTransform(matrix));
      const xs = points.map(({ x }) => x),
        ys = points.map(({ y }) => y);
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
    };
    const context = globalThis.document.createElement("canvas").getContext("2d");
    const ink = (element) => {
      const lines = element.querySelectorAll("tspan").length
        ? [...element.querySelectorAll("tspan")]
        : [element];
      const boxes = lines
        .filter((line) => line.textContent.trim())
        .map((line) => {
          const style = globalThis.getComputedStyle(line);
          context.font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(
            " ",
          );
          context.textBaseline = "alphabetic";
          context.textAlign = "start";
          context.fontKerning = style.fontKerning;
          context.direction = style.direction;
          context.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
          context.wordSpacing = style.wordSpacing === "normal" ? "0px" : style.wordSpacing;
          const metrics = context.measureText(line.textContent);
          const position = line.getStartPositionOfChar(0);
          return local(line, {
            x: position.x - metrics.actualBoundingBoxLeft,
            y: position.y - metrics.actualBoundingBoxAscent,
            width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
            height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
          });
        });
      if (!boxes.length) return { x: 0, y: 0, width: 0, height: 0 };
      const left = Math.min(...boxes.map(({ x }) => x));
      const top = Math.min(...boxes.map(({ y }) => y));
      return {
        x: left,
        y: top,
        width: Math.max(...boxes.map(({ x, width }) => x + width)) - left,
        height: Math.max(...boxes.map(({ y, height }) => y + height)) - top,
      };
    };
    const nodes = [...svg.querySelectorAll("g[data-node-id]")].filter(visible).map((element) => {
      const rect = element.querySelector("rect");
      return {
        id: element.dataset.nodeId,
        box: rect ? local(rect) : local(element),
        text: [...element.querySelectorAll("text")]
          .filter(visible)
          .map((text) => ({ text: text.textContent, box: ink(text), typographicBox: local(text) })),
      };
    });
    const glyphs = [...svg.querySelectorAll("text")].filter(visible).map((element) => ({
      text: element.textContent,
      owner: element.closest("[data-node-id]")?.dataset.nodeId,
      relationship: element.closest("[data-intrinsic-relation-label]")?.dataset
        .intrinsicRelationLabel,
      box: ink(element),
    }));
    const clipped = glyphs.filter(
      ({ box }) =>
        box.x < root.x - 1 ||
        box.y < root.y - 1 ||
        box.x + box.width > root.x + root.width + 1 ||
        box.y + box.height > root.y + root.height + 1,
    );
    const outside = nodes.flatMap((node) =>
      node.text
        .filter(
          ({ box }) =>
            box.x < node.box.x + minimumInset ||
            box.y < node.box.y + minimumInset ||
            box.x + box.width > node.box.x + node.box.width - minimumInset ||
            box.y + box.height > node.box.y + node.box.height - minimumInset,
        )
        .map((text) => ({ node: node.id, ...text })),
    );
    const grouped = Map.groupBy(nodes, ({ box }) => box.y.toFixed(3));
    return {
      geometry: "browser-shaped-ink",
      viewBox: { width: root.width, height: root.height },
      nodes,
      glyphs,
      glyphCount: glyphs.length,
      clipped,
      outside,
      rows: [...grouped]
        .filter(([, row]) => row.length > 1)
        .map(([y, row]) => ({
          y,
          ids: row.map(({ id }) => id),
          widths: row.map(({ box }) => box.width),
          heights: row.map(({ box }) => box.height),
        })),
    };
  }, minimumInset);
}
