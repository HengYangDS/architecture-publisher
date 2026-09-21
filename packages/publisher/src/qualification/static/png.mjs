import { inflateSync } from 'node:zlib';

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const fail = (code) => {
  throw Object.assign(new Error(code), { code });
};
const paeth = (left, above, upperLeft) => {
  const estimate = left + above - upperLeft,
    leftDistance = Math.abs(estimate - left),
    aboveDistance = Math.abs(estimate - above),
    upperLeftDistance = Math.abs(estimate - upperLeft);
  return leftDistance <= aboveDistance && leftDistance <= upperLeftDistance
    ? left
    : aboveDistance <= upperLeftDistance
      ? above
      : upperLeft;
};

function decodeRgbaPng(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.subarray(0, 8).equals(signature))
    fail('png_canvas_invalid');
  const chunks = [],
    ids = [];
  let offset = 8,
    width,
    height;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) fail('png_canvas_invalid');
    const length = bytes.readUInt32BE(offset),
      type = bytes.subarray(offset + 4, offset + 8).toString('ascii'),
      end = offset + 12 + length;
    if (end > bytes.length) fail('png_canvas_invalid');
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    ids.push(type);
    if (type === 'IHDR') {
      if (
        width !== undefined ||
        length !== 13 ||
        data[8] !== 8 ||
        data[9] !== 6 ||
        data[10] !== 0 ||
        data[11] !== 0 ||
        data[12] !== 0
      )
        fail('png_canvas_unsupported');
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') chunks.push(data);
    else if (type === 'IEND') {
      offset = end;
      break;
    } else if (type[0] === type[0].toUpperCase()) fail('png_canvas_unsupported');
    offset = end;
  }
  if (
    offset !== bytes.length ||
    ids[0] !== 'IHDR' ||
    ids.at(-1) !== 'IEND' ||
    !chunks.length ||
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1
  )
    fail('png_canvas_invalid');
  let raw;
  try {
    raw = inflateSync(Buffer.concat(chunks), {
      maxOutputLength: height * (width * 4 + 1),
    });
  } catch {
    fail('png_canvas_invalid');
  }
  const stride = width * 4;
  if (raw.length !== height * (stride + 1)) fail('png_canvas_invalid');
  const pixels = Buffer.alloc(width * height * 4),
    row = Buffer.alloc(stride),
    previous = Buffer.alloc(stride);
  let source = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[source++];
    for (let x = 0; x < stride; x++) {
      const encoded = raw[source++],
        before = x >= 4 ? row[x - 4] : 0,
        above = previous[x],
        upperLeft = x >= 4 ? previous[x - 4] : 0;
      row[x] =
        filter === 0
          ? encoded
          : filter === 1
            ? (encoded + before) & 255
            : filter === 2
              ? (encoded + above) & 255
              : filter === 3
                ? (encoded + Math.floor((before + above) / 2)) & 255
                : filter === 4
                  ? (encoded + paeth(before, above, upperLeft)) & 255
                  : fail('png_canvas_unsupported');
    }
    row.copy(pixels, y * stride);
    row.copy(previous);
  }
  return { width, height, pixels };
}

function color(value) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value))
    fail('png_elements_scene_invalid');
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
    255,
  ];
}

function pixelDistance(pixels, offset, expected) {
  return Math.hypot(
    pixels[offset] - expected[0],
    pixels[offset + 1] - expected[1],
    pixels[offset + 2] - expected[2],
    pixels[offset + 3] - expected[3],
  );
}

function matchesPaint(pixels, offset, background, paint, tolerance) {
  const direction = paint.map((value, index) => value - background[index]),
    observed = background.map((value, index) => pixels[offset + index] - value),
    magnitude = direction.reduce((sum, value) => sum + value * value, 0);
  if (!magnitude) return false;
  const alpha = Math.max(
    0,
    Math.min(
      1,
      observed.reduce((sum, value, index) => sum + value * direction[index], 0) / magnitude,
    ),
  );
  if (alpha < 0.015) return false;
  return (
    Math.hypot(...observed.map((value, index) => value - alpha * direction[index])) <= tolerance
  );
}

const expanded = (box, padding) => ({
  x: box.x - padding,
  y: box.y - padding,
  width: box.width + 2 * padding,
  height: box.height + 2 * padding,
});
const pathBox = (points, padding) => {
  const xs = points.map(({ x }) => x),
    ys = points.map(({ y }) => y);
  return expanded(
    {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    },
    padding,
  );
};

function arrowPoints(edge) {
  const tip = edge.points.at(-1),
    previous = edge.points.at(-2),
    geometry = edge.arrowGeometry,
    length = tip && previous ? Math.hypot(tip.x - previous.x, tip.y - previous.y) : 0;
  if (
    !edge.arrow ||
    !geometry ||
    !length ||
    ![geometry.length, geometry.halfWidth, geometry.strokeWidth].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    fail('png_elements_scene_invalid');
  const ux = (tip.x - previous.x) / length,
    uy = (tip.y - previous.y) / length,
    wing = (sign) => ({
      x: tip.x - ux * geometry.length - sign * uy * geometry.halfWidth,
      y: tip.y - uy * geometry.length + sign * ux * geometry.halfWidth,
    });
  return [wing(-1), tip, wing(1)];
}

function sceneRegions(scene, padding) {
  if (
    !scene ||
    !Number.isFinite(scene.width) ||
    !Number.isFinite(scene.height) ||
    scene.width <= 0 ||
    scene.height <= 0 ||
    !scene.paint ||
    !Array.isArray(scene.texts) ||
    !Array.isArray(scene.nodes) ||
    !Array.isArray(scene.edges) ||
    !Array.isArray(scene.decorations)
  )
    fail('png_elements_scene_invalid');
  const tone = (name) => color(scene.paint[name]);
  return [
    ...scene.texts
      .filter((label) => label.visible && label.text.trim())
      .map((label) => ({
        id: `text:${label.id}`,
        kind: 'glyph',
        paint: tone(label.tone),
        box: expanded(label.box, padding),
      })),
    ...scene.nodes.map((node) => ({
      id: `node:${node.id}`,
      kind: 'node',
      paint: tone(node.tone),
      box: expanded(node.paintBox ?? node.box, padding),
    })),
    ...scene.edges.flatMap((edge) => {
      const edgeTone =
        edge.kind === 'renewal'
          ? 'proof'
          : edge.kind === 'trust'
            ? 'accent'
            : edge.kind === 'feedback'
              ? 'ghost'
              : 'line';
      return [
        {
          id: `edge:${edge.id}:stroke`,
          kind: 'stroke',
          paint: tone(edgeTone),
          box: pathBox(edge.points, padding + (edge.strokeWidth ?? 1) / 2),
        },
        {
          id: `edge:${edge.id}:arrow`,
          kind: 'arrowhead',
          paint: tone(edgeTone),
          box: pathBox(arrowPoints(edge), padding + edge.arrowGeometry.strokeWidth / 2),
        },
      ];
    }),
    ...scene.decorations.map((rule) => ({
      id: `rule:${rule.id}`,
      kind: 'stroke',
      paint: tone(rule.tone),
      box: pathBox(rule.points, padding + (rule.strokeWidth ?? 1) / 2),
    })),
  ];
}

function pixelBox(box, scaleX, scaleY, width, height) {
  const left = Math.max(0, Math.floor(box.x * scaleX)),
    top = Math.max(0, Math.floor(box.y * scaleY)),
    right = Math.min(width - 1, Math.ceil((box.x + box.width) * scaleX) - 1),
    bottom = Math.min(height - 1, Math.ceil((box.y + box.height) * scaleY) - 1);
  if (right < left || bottom < top) fail('png_elements_scene_invalid');
  return { left, top, right, bottom };
}

/** Inspect actual deterministic RGBA PNG pixels. This does not identify glyphs,
 * nodes or edges and therefore is not complete painted-geometry qualification. */
export function inspectRgbaPngCanvas(bytes, contract = {}) {
  const { width, height, pixels } = decodeRgbaPng(bytes);
  if (
    contract.background !== undefined &&
    (!Array.isArray(contract.background) ||
      contract.background.length !== 4 ||
      contract.background.some((value) => !Number.isSafeInteger(value) || value < 0 || value > 255))
  )
    fail('png_canvas_contract_invalid');
  const background = contract.background ? [...contract.background] : [],
    threshold = Number.isFinite(contract.colorDistance) ? contract.colorDistance : 8,
    minimumClearance = Number.isSafeInteger(contract.minimumClearance)
      ? contract.minimumClearance
      : 0,
    minimumEnvelopeFraction = Number.isFinite(contract.minimumEnvelopeFraction)
      ? contract.minimumEnvelopeFraction
      : 0,
    maximumCenterOffsetFraction = Number.isFinite(contract.maximumCenterOffsetFraction)
      ? contract.maximumCenterOffsetFraction
      : 0.5;
  if (
    minimumEnvelopeFraction < 0 ||
    minimumEnvelopeFraction > 1 ||
    maximumCenterOffsetFraction < 0 ||
    maximumCenterOffsetFraction > 0.5
  )
    fail('png_canvas_contract_invalid');
  let inkPixels = 0,
    left = width,
    top = height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < height; y++) {
    if (!background.length) background.push(...pixels.subarray(0, 4));
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4,
        distance = pixelDistance(pixels, index, background);
      if (distance <= threshold) continue;
      inkPixels++;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (!inkPixels) fail('png_canvas_empty');
  const clearance = {
      left,
      top,
      right: width - 1 - right,
      bottom: height - 1 - bottom,
    },
    actualMinimum = Math.min(...Object.values(clearance)),
    envelopeFraction = ((right - left + 1) * (bottom - top + 1)) / (width * height),
    centerOffset = {
      x: Math.abs((left + right) / 2 - (width - 1) / 2) / width,
      y: Math.abs((top + bottom) / 2 - (height - 1) / 2) / height,
    },
    failures = [
      ...(actualMinimum < minimumClearance
        ? [
            {
              code: 'png-canvas-clearance',
              actual: actualMinimum,
              minimum: minimumClearance,
            },
          ]
        : []),
      ...(envelopeFraction < minimumEnvelopeFraction
        ? [
            {
              code: 'png-canvas-fill',
              actual: envelopeFraction,
              minimum: minimumEnvelopeFraction,
            },
          ]
        : []),
      ...(Math.max(centerOffset.x, centerOffset.y) > maximumCenterOffsetFraction
        ? [
            {
              code: 'png-canvas-balance',
              actual: centerOffset,
              maximum: maximumCenterOffsetFraction,
            },
          ]
        : []),
    ];
  return {
    width,
    height,
    colorType: 'rgba',
    bitDepth: 8,
    background,
    inkPixels,
    inkFraction: inkPixels / (width * height),
    envelope: { left, top, right, bottom },
    envelopeFraction,
    centerOffset,
    clearance,
    failures,
    scope:
      'Actual RGBA raster pixels, non-background canvas envelope, fill and center balance. Not per-element glyph, stroke, route, endpoint or aesthetic acceptance.',
  };
}

/** Bind actual raster ink to renderer-declared element envelopes. This proves
 * delivery-resolution paint presence and absence of stray paint; it does not
 * prove semantic correctness, perceptual quality or formal qualification. */
export function inspectRgbaPngElements(bytes, scene, contract = {}) {
  const { width, height, pixels } = decodeRgbaPng(bytes),
    background = contract.background ?? [pixels[0], pixels[1], pixels[2], pixels[3]];
  if (
    !Array.isArray(background) ||
    background.length !== 4 ||
    background.some((value) => !Number.isSafeInteger(value) || value < 0 || value > 255) ||
    !Number.isFinite(contract.sourcePadding ?? 2) ||
    (contract.sourcePadding ?? 2) < 0 ||
    !Number.isFinite(contract.paintTolerance ?? 18) ||
    (contract.paintTolerance ?? 18) < 0
  )
    fail('png_elements_contract_invalid');
  const threshold = Number.isFinite(contract.colorDistance) ? contract.colorDistance : 8,
    sourcePadding = contract.sourcePadding ?? 2,
    paintTolerance = contract.paintTolerance ?? 18,
    scaleX = width / scene.width,
    scaleY = height / scene.height,
    regions = sceneRegions(scene, sourcePadding).map((region) => ({
      ...region,
      pixelBox: pixelBox(region.box, scaleX, scaleY, width, height),
      inkPixels: 0,
    })),
    ids = new Set(regions.map(({ id }) => id));
  if (ids.size !== regions.length) fail('png_elements_scene_invalid');
  const byRow = Array.from({ length: height }, () => []);
  for (let index = 0; index < regions.length; index++) {
    const { top, bottom } = regions[index].pixelBox;
    for (let y = top; y <= bottom; y++) byRow[y].push(index);
  }
  let inkPixels = 0,
    unassignedInkPixels = 0;
  const unassignedSamples = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      if (pixelDistance(pixels, offset, background) <= threshold) continue;
      inkPixels++;
      let assigned = false;
      for (const index of byRow[y]) {
        const region = regions[index],
          box = region.pixelBox;
        if (x < box.left || x > box.right) continue;
        assigned = true;
        if (matchesPaint(pixels, offset, background, region.paint, paintTolerance))
          region.inkPixels++;
      }
      if (!assigned) {
        unassignedInkPixels++;
        if (unassignedSamples.length < 16)
          unassignedSamples.push({
            x,
            y,
            rgba: [...pixels.subarray(offset, offset + 4)],
          });
      }
    }
  const summaries = regions.map(({ id, kind, pixelBox: box, inkPixels: count }) => ({
    id,
    kind,
    box,
    inkPixels: count,
  }));
  return {
    width,
    height,
    inkPixels,
    unassignedInkPixels,
    regions: summaries,
    failures: [
      ...summaries
        .filter((region) => region.inkPixels === 0)
        .map((region) => ({ code: 'png-element-empty', id: region.id })),
      ...(unassignedInkPixels
        ? [
            {
              code: 'png-unassigned-ink',
              pixels: unassignedInkPixels,
              samples: unassignedSamples,
            },
          ]
        : []),
    ],
    scope:
      'Actual delivery-resolution RGBA paint presence within renderer-declared element envelopes and absence of stray paint. Not semantic, perceptual or formal flagship qualification.',
  };
}
