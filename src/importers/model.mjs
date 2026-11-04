import { MODEL_FORMAT, MODEL_VERSION, readModel, validateModel } from "../model/load.mjs";
import { refuse } from "../refusal.mjs";

/** The model version this importer reads: the one whose components cite a source catalog. */
const CATALOG_VERSION = 1;

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * A copy of an object with one key replaced in place, or left out when `entry` is null.
 * @param {Record<string, any>} object
 * @param {string} key
 * @param {[string, any] | null} entry
 */
function replaced(object, key, entry) {
  const out = {};
  for (const [name, value] of Object.entries(object)) {
    if (name !== key) out[name] = value;
    else if (entry) out[entry[0]] = entry[1];
  }
  return out;
}

/**
 * Read a model whose components and relations cite a source catalog and write it as the current
 * version: each component claims the files its sources name, in their order, and each relation
 * cites its sources' files. A file several components cite stays with the first of them; the
 * result names it with the components that no longer cite it. Every other field is kept where it
 * was, and the written model is validated.
 * @param {string} file
 */
export async function migrateModel(file) {
  const { parsed: model } = await readModel(file);
  if (!isRecord(model) || model.format !== MODEL_FORMAT || model.version !== CATALOG_VERSION)
    refuse(
      "migrate_version_unsupported",
      `Only a version ${CATALOG_VERSION} ${MODEL_FORMAT} is migrated; this model is not one.`,
    );
  const catalog = isRecord(model.sources) ? model.sources : {};
  const problems = [];
  const pathsOf = (entry, where) =>
    (Array.isArray(entry.sources) ? entry.sources : []).flatMap((id, index) => {
      const source = catalog[id];
      if (isRecord(source) && typeof source.path === "string") return [source.path];
      problems.push({
        code: "migrate_source_unknown",
        path: `${where}/sources/${index}`,
        message: `names no source with a path`,
      });
      return [];
    });
  const owners = new Map();
  const moved = new Map();
  const components = (Array.isArray(model.components) ? model.components : []).map(
    (component, index) => {
      if (!isRecord(component)) return component;
      const files = [];
      for (const claim of pathsOf(component, `/components/${index}`)) {
        if (!owners.has(claim)) {
          owners.set(claim, component.id);
          files.push(claim);
        } else if (owners.get(claim) !== component.id) {
          const entry = moved.get(claim) ?? {
            path: claim,
            owner: owners.get(claim),
            components: [],
          };
          entry.components.push(component.id);
          moved.set(claim, entry);
        }
      }
      return replaced(component, "sources", files.length ? ["files", files] : null);
    },
  );
  const relations = (Array.isArray(model.relations) ? model.relations : []).map(
    (relation, index) => {
      if (!isRecord(relation)) return relation;
      const files = [...new Set(pathsOf(relation, `/relations/${index}`))];
      return replaced(relation, "sources", files.length ? ["files", files] : null);
    },
  );
  if (problems.length)
    refuse(
      "migrate_source_unknown",
      "The model cites sources its catalog does not hold.",
      problems,
    );
  let migrated = replaced(model, "version", ["version", MODEL_VERSION]);
  migrated = replaced(migrated, "sources", null);
  migrated = replaced(migrated, "components", ["components", components]);
  migrated = replaced(migrated, "relations", ["relations", relations]);
  validateModel(migrated);
  return { model: migrated, moved: [...moved.values()] };
}
