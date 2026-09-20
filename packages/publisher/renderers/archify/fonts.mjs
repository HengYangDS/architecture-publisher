import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { fail } from '../../src/source/manifest.mjs';
const root = fileURLToPath(new URL('../../assets/fonts/', import.meta.url));
const digest =
  'fdf4df13d28e4161b937162bbe31ef05be3c4db88d82f490fa1305a6e353d08a';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const escape = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Shared verified font bytes; presentation aliases remain edition-owned. */
export async function loadBundledFonts() {
  const raw = await fs.readFile(path.join(root, 'supply.json'));
  if (sha(raw) !== digest) fail('render_font_supply_invalid');
  const supply = JSON.parse(raw),
    fonts = [];
  let license;
  for (const file of supply.files) {
    const name = path.join(root, file.path),
      stat = await fs.lstat(name);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== file.bytes)
      fail('render_font_supply_invalid');
    const bytes = await fs.readFile(name);
    if (sha(bytes) !== file.sha256) fail('render_font_supply_invalid');
    if (file.weight) fonts.push({ ...file, bytes });
    else license = { ...file, bytes };
  }
  return { fonts, license, manifest: supply, sha256: digest };
}

/** Adapt a private pinned template before native rendering and validation. */
export async function embedFonts(template) {
  const { fonts, license } = await loadBundledFonts();
  const block = /  <!-- Async font load:[\s\S]*?<\/noscript>\n/;
  const local =
    /        \/\/ Prepend a local\(\)-only @font-face block[\s\S]*?        \}\)\.join\('\\n'\);/;
  if (
    !block.test(template) ||
    !local.test(template) ||
    template.split('</body>').length !== 2
  )
    fail('render_font_seam_invalid');
  const css = fonts
    .map(
      (font) =>
        `@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:${font.weight};font-display:block;src:url(data:font/ttf;base64,${font.bytes.toString('base64')}) format('truetype');}`,
    )
    .join('\n');
  return template
    .replace(block, `  <style id="architecture-font-supply">${css}</style>\n`)
    .replace(
      local,
      "        var fontFallback = document.getElementById('architecture-font-supply').textContent;",
    )
    .replace(
      '</body>',
      `<details class="no-print" style="margin:24px auto;max-width:1100px;font:12px/1.5 system-ui"><summary>Font license</summary><pre style="white-space:pre-wrap">${escape(license.bytes.toString('utf8'))}</pre></details>\n</body>`,
    );
}
