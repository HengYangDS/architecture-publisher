import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export * from './index.mjs';

/** Return the exact bundled backend notice selected by the renderer supply. */
export function readArchifyLicense() {
  return fs.readFile(
    fileURLToPath(new URL('../../assets/archify/LICENSE', import.meta.url)),
  );
}
