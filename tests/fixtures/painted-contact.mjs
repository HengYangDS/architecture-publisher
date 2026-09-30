async function observePaintedLayers(page, firstPng, secondPng, witnesses = null) {
  return page.evaluate(
    async ([textBase64, marksBase64, witnesses]) => {
      const pixels = async (base64) => {
        const image = new globalThis.Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = globalThis.document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return {
          width: canvas.width,
          height: canvas.height,
          data: context.getImageData(0, 0, canvas.width, canvas.height).data,
        };
      };
      const text = await pixels(textBase64);
      const marks = await pixels(marksBase64);
      if (text.width !== marks.width || text.height !== marks.height)
        throw Error('painted_mask_dimensions_mismatch');
      if (witnesses !== null)
        return witnesses
          .filter(({ x, y, width, height }) => {
            for (
              let yy = Math.max(0, Math.floor(y));
              yy < Math.min(text.height, Math.ceil(y + height));
              yy++
            )
              for (
                let xx = Math.max(0, Math.floor(x));
                xx < Math.min(text.width, Math.ceil(x + width));
                xx++
              ) {
                const offset = (yy * text.width + xx) * 4;
                if (
                  text.data[offset + 3] > 16 &&
                  Math.abs(text.data[offset + 3] - marks.data[offset + 3]) > 16
                )
                  return false;
              }
            return true;
          })
          .map(({ id }) => id);
      let contact = 0;
      let withinTwoPixels = 0;
      for (let y = 0; y < text.height; y++)
        for (let x = 0; x < text.width; x++) {
          if (text.data[(y * text.width + x) * 4 + 3] <= 16) continue;
          if (marks.data[(y * marks.width + x) * 4 + 3] > 16) contact++;
          let near = false;
          for (let dy = -2; dy <= 2 && !near; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const xx = x + dx;
              const yy = y + dy;
              if (
                xx >= 0 &&
                yy >= 0 &&
                xx < marks.width &&
                yy < marks.height &&
                marks.data[(yy * marks.width + xx) * 4 + 3] > 16
              ) {
                near = true;
                break;
              }
            }
          if (near) withinTwoPixels++;
        }
      return { contact, withinTwoPixels };
    },
    [firstPng.toString('base64'), secondPng.toString('base64'), witnesses],
  );
}

export function paintedContactCounts(page, textPng, marksPng) {
  return observePaintedLayers(page, textPng, marksPng);
}

export function missingPaintedWitnesses(page, presentPng, absentPng, witnesses) {
  return observePaintedLayers(page, presentPng, absentPng, witnesses);
}
