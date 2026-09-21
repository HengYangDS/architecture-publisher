import { fail } from '../../src/source/manifest.mjs';
import { loadBundledFonts } from '../fonts/index.mjs';
const escape = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Adapt a private pinned template before native rendering and validation. */
export async function embedFonts(template) {
  const selected = await loadBundledFonts(),
    { fonts, license } = selected,
    block = / {2}<!-- Async font load:[\s\S]*?<\/noscript>\n/,
    local = / {8}\/\/ Prepend a local\(\)-only @font-face block[\s\S]*? {8}\}\)\.join\('\\n'\);/;
  if (!block.test(template) || !local.test(template) || template.split('</body>').length !== 2)
    fail('render_font_seam_invalid');
  const css = fonts
      .map(
        (font) =>
          `@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:${font.weight};font-display:block;src:url(data:font/ttf;base64,${font.bytes.toString('base64')}) format('truetype');}`,
      )
      .join('\n'),
    html = template
      .replace(block, `  <style id="architecture-font-supply">${css}</style>\n`)
      .replace(
        local,
        "        var fontFallback = document.getElementById('architecture-font-supply').textContent;",
      )
      .replace(
        '</body>',
        `<details class="no-print" style="margin:24px auto;max-width:1100px;font:12px/1.5 system-ui"><summary>Font license</summary><pre style="white-space:pre-wrap">${escape(license.bytes.toString('utf8'))}</pre></details>\n</body>`,
      );
  return {
    html,
    supply: Object.freeze({ id: 'font-supply', sha256: selected.sha256 }),
  };
}
