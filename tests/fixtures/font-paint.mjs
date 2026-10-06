export function observeGlyphPaintEnvelope(page, png, scale = 1) {
  return page.evaluate(
    async ({ base64, scale }) => {
      const image = new globalThis.Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = globalThis.document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
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
    { base64: png.toString('base64'), scale },
  );
}
