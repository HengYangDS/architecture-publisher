import fs from 'node:fs/promises';
import path from 'node:path';
import { rasterizeBytes } from '../../renderers/resvg/index.mjs';

/** Bind exact font bytes and their license into a standalone SVG artifact. */
export function embedFonts(svg, fonts, license) {
  const xml = (value) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const css = fonts
    .map(
      (font) =>
        "@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:" +
        font.weight +
        ';font-display:block;src:url(data:font/ttf;base64,' +
        font.bytes.toString('base64') +
        ") format('truetype');}",
    )
    .join('\n');
  return Buffer.from(
    svg
      .toString('utf8')
      .replace(
        '</svg>',
        '<style>' +
          css +
          '</style><metadata id="font-license">' +
          xml(license.bytes.toString('utf8')) +
          '</metadata></svg>',
      ),
  );
}

/** Rasterize one independently composed SVG through the pinned resvg supply. */
export async function rasterizeSvg(scratch, svg, fonts, width) {
  const output = path.join(scratch, 'overview.png');
  const result = await rasterizeBytes({
    svg,
    fonts: fonts.map((font) => ({
      family: 'JetBrains Mono',
      weight: font.weight,
      bytes: font.bytes,
    })),
    width,
    output,
  });
  return { bytes: await fs.readFile(output), result };
}
