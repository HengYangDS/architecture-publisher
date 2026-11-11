import zlib from "node:zlib";

/**
 * The pixels of a PNG as Typst writes it: 8-bit, non-interlaced, greyscale or RGB with or without alpha.
 * @param {Buffer} png
 * @returns {{ width: number, height: number, channels: number, pixels: Buffer }}
 */
export function readPng(png) {
  let width = 0;
  let height = 0;
  let channels = 0;
  const data = [];
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at);
    const type = png.toString("latin1", at + 4, at + 8);
    const body = png.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      if (body[8] !== 8 || body[12] !== 0) throw Error("png_unsupported");
      channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[body[9]];
    } else if (type === "IDAT") data.push(body);
    at += 12 + length;
  }
  const raw = zlib.inflateSync(Buffer.concat(data));
  const stride = width * channels;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const corner = x >= channels && y > 0 ? pixels[(y - 1) * stride + x - channels] : 0;
      const guess = left + up - corner;
      const nearest =
        Math.abs(guess - left) <= Math.abs(guess - up) &&
        Math.abs(guess - left) <= Math.abs(guess - corner)
          ? left
          : Math.abs(guess - up) <= Math.abs(guess - corner)
            ? up
            : corner;
      const predicted = [0, left, up, (left + up) >> 1, nearest][filter];
      pixels[y * stride + x] = (line[x] + predicted) & 0xff;
    }
  }
  return { width, height, channels, pixels };
}

/**
 * The lines of ink in a region of a page image, top to bottom, each with the rightmost column it inks. Rows of a
 * line that antialiasing leaves pale, a few at most, do not split it.
 * @param {ReturnType<typeof readPng>} image
 * @param {{ left: number, right: number, top: number, bottom: number }} region pixel bounds
 */
export function inkLines(image, { left, right, top, bottom }) {
  const { width, channels, pixels } = image;
  const dark = (x, y) => pixels[(y * width + x) * channels] < 192;
  const lines = [];
  let current = null;
  for (let y = top; y < bottom; y += 1) {
    let edge = -1;
    for (let x = right - 1; x >= left && edge < 0; x -= 1) if (dark(x, y)) edge = x;
    if (edge < 0) continue;
    if (!current || y - current.bottom > 4)
      lines.push((current = { top: y, bottom: y, right: edge }));
    current.bottom = y;
    current.right = Math.max(current.right, edge);
  }
  return lines;
}
