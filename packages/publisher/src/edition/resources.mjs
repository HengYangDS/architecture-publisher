import { fail } from '../protocol/values.mjs';
import { portableKey, portablePath } from '../file-input/contract.mjs';

/** One exact logical resource closure, independent of its delivery mode. */
export function selectedEditionResources(project) {
  const resources = new Map();
  const keys = new Map();
  const add = (ref, sha256 = null) => {
    portablePath(ref);
    const key = portableKey(ref);
    if (keys.has(key) && keys.get(key) !== ref) fail('edition_project_invalid');
    keys.set(key, ref);
    const previous = resources.get(ref);
    if (previous && previous.sha256 !== sha256) fail('edition_project_invalid');
    resources.set(ref, { ref, sha256 });
  };
  const override = project.visualPolicy.override ?? null;
  if (override !== null) add(override);
  const fonts = project.visualPolicy.fonts ?? [];
  const ids = new Set();
  for (const font of fonts) {
    if (ids.has(font.id)) fail('edition_project_invalid');
    ids.add(font.id);
    const weights = new Set();
    for (const face of font.faces) {
      if (weights.has(face.weight)) fail('edition_project_invalid');
      weights.add(face.weight);
      add(face.ref, face.sha256);
    }
    for (const evidence of font.distribution) add(evidence.ref, evidence.sha256);
  }
  if (resources.size > 64) fail('edition_project_invalid');
  return [...resources.values()];
}
