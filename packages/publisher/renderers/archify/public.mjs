import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export { renderArchitectureScene, renderDiagram, renderNativeDiagram } from './index.mjs';

/** Return the exact bundled backend notice selected by the renderer supply. */
export function readArchifyLicense() {
  return fs.readFile(fileURLToPath(new URL('./supply/LICENSE', import.meta.url)));
}
