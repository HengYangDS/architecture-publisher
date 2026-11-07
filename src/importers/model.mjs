import { MODEL_FORMAT, MODEL_VERSION, readModel, validateModel } from "../model/load.mjs";
import { refuse } from "../refusal.mjs";

/** The model version whose components cite a source catalog. */
const CATALOG_VERSION = 1;
/** The model version that names its editors in a free-text attribution. */
const ATTRIBUTION_VERSION = 2;

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
 * Read a model of an earlier version and write it as the current one. A version 1 model's
 * components and relations cite a source catalog: each component then claims the files its
 * sources name, in their order, and each relation cites its sources' files; a file several
 * components cite stays with the first of them, and the result names it with the components that
 * no longer cite it. A version 1 or 2 model's attribution is replaced by the editors its author
 * declares beside it: the attribution is free text, so it is never parsed into names, and a model
 * that has one and declares no editors is refused. Every other field is kept where it was, and the
 * written model is validated.
 * @param {string} file
 */
export async function migrateModel(file) {
  const { parsed: model } = await readModel(file);
  if (
    !isRecord(model) ||
    model.format !== MODEL_FORMAT ||
    ![CATALOG_VERSION, ATTRIBUTION_VERSION].includes(model.version)
  )
    refuse(
      "migrate_version_unsupported",
      `Only a version ${CATALOG_VERSION} or ${ATTRIBUTION_VERSION} ${MODEL_FORMAT} is migrated; this model is not one.`,
    );
  if (typeof model.attribution === "string" && model.editors === undefined)
    refuse(
      "attribution_not_migrated",
      `The model's attribution, "${model.attribution}", names no editors. Declare \`editors\` beside it, ` +
        "each with a name, move any provenance it states into the summary or limits, and migrate again.",
      [{ code: "attribution_not_migrated", path: "/attribution", message: model.attribution }],
    );
  if (model.version === ATTRIBUTION_VERSION) {
    const migrated = replaced(
      replaced(model, "version", ["version", MODEL_VERSION]),
      "attribution",
      null,
    );
    validateModel(migrated);
    return { model: migrated, moved: [] };
  }
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
  migrated = replaced(migrated, "attribution", null);
  migrated = replaced(migrated, "sources", null);
  migrated = replaced(migrated, "components", ["components", components]);
  migrated = replaced(migrated, "relations", ["relations", relations]);
  validateModel(migrated);
  return { model: migrated, moved: [...moved.values()] };
}
