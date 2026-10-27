import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { refuse } from "../refusal.mjs";

export const MODEL_FORMAT = "architecture-publisher.model";
export const MODEL_VERSION = 1;
export const MAXIMUM_VIEWS = 5;
const STATUSES = Object.freeze(["implemented", "planned", "retired"]);
export const CATEGORIES = Object.freeze([
  "person",
  "external",
  "frontend",
  "backend",
  "database",
  "cloud",
  "messagebus",
  "security",
]);
const ICON = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const ID = /^[a-z0-9][a-z0-9._-]{0,127}$/u;
const DIGEST = /^[0-9a-f]{64}$/u;
const REVISION = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;
const DETAIL_NAME = /^(?![0-9]+$)[^:\n]{1,64}$/u;
const MAXIMUM_MODEL_BYTES = 4 * 1024 * 1024;

const TOP = {
  required: ["format", "version", "id", "title", "question", "components", "relations"],
  optional: ["summary", "attribution", "scope", "limits", "repository", "kinds", "sources"].concat([
    "groups",
    "views",
  ]),
};

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isText = (value) =>
  typeof value === "string" && value.length <= 2000 && /\S/u.test(value) && !/\0/u.test(value);

function isRelativePath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1024 &&
    !value.startsWith("/") &&
    !/[\\\0\n\r]/u.test(value) &&
    value.split("/").every((part) => part !== "" && part !== "." && part !== "..")
  );
}

/** Collects every problem in one pass so authors fix them together. */
class Problems {
  constructor() {
    /** @type {Array<{ code: string, path: string, message: string }>} */
    this.items = [];
  }

  add(code, path, message) {
    this.items.push({ code, path, message });
  }

  fields(value, path, required, optional) {
    if (!isRecord(value)) {
      this.add("model_object_required", path, "must be an object");
      return false;
    }
    for (const key of required)
      if (!(key in value)) this.add("model_field_required", `${path}/${key}`, "is required");
    for (const key of Object.keys(value))
      if (!required.includes(key) && !optional.includes(key))
        this.add("model_field_unknown", `${path}/${key}`, "is not a model field");
    return true;
  }

  text(value, path, optional = false) {
    if (value === undefined && optional) return;
    if (!isText(value))
      this.add("model_text_invalid", path, "must be non-blank text of at most 2000 characters");
  }

  id(value, path) {
    if (typeof value !== "string" || !ID.test(value))
      this.add("model_id_invalid", path, "must match ^[a-z0-9][a-z0-9._-]{0,127}$");
  }
}

function checkDetails(problems, value, path) {
  if (value === undefined) return;
  if (!isRecord(value)) return problems.add("model_details_invalid", path, "must be an object");
  for (const [name, detail] of Object.entries(value)) {
    if (!DETAIL_NAME.test(name))
      problems.add("model_detail_name_invalid", `${path}/${name}`, "names a detail invalidly");
    const items = Array.isArray(detail) ? detail : [detail];
    if (!items.length || !items.every(isText))
      problems.add("model_detail_invalid", `${path}/${name}`, "must be text or a list of text");
  }
}

function checkReferences(problems, value, path, known, label, { optional = true } = {}) {
  if (value === undefined && optional) return [];
  if (!Array.isArray(value) || (!optional && !value.length)) {
    problems.add("model_references_invalid", path, `must be a non-empty list of ${label} ids`);
    return [];
  }
  const seen = new Set();
  value.forEach((item, index) => {
    if (seen.has(item))
      problems.add("model_reference_duplicate", `${path}/${index}`, `repeats ${label} ${item}`);
    seen.add(item);
    if (!known.has(item))
      problems.add("model_reference_unknown", `${path}/${index}`, `names no declared ${label}`);
  });
  return value;
}

function checkTop(problems, model) {
  if (!problems.fields(model, "", TOP.required, TOP.optional)) return false;
  if (model.format !== MODEL_FORMAT)
    problems.add("model_format_unsupported", "/format", `must be ${MODEL_FORMAT}`);
  if (model.version !== MODEL_VERSION)
    problems.add("model_version_unsupported", "/version", `supported version is ${MODEL_VERSION}`);
  problems.id(model.id, "/id");
  for (const key of ["title", "question"]) problems.text(model[key], `/${key}`);
  for (const key of ["summary", "attribution", "scope"]) problems.text(model[key], `/${key}`, true);
  if (model.limits !== undefined) {
    if (!Array.isArray(model.limits)) problems.add("model_limits_invalid", "/limits", "list");
    else model.limits.forEach((limit, index) => problems.text(limit, `/limits/${index}`));
  }
  if (model.repository !== undefined) {
    const repository = model.repository;
    if (problems.fields(repository, "/repository", ["name", "revision"], ["url"])) {
      problems.text(repository.name, "/repository/name");
      problems.text(repository.url, "/repository/url", true);
      if (typeof repository.revision !== "string" || !REVISION.test(repository.revision))
        problems.add("model_revision_invalid", "/repository/revision", "must be a full commit id");
    }
  }
  return true;
}

function checkCatalog(problems, value, path, check) {
  if (value === undefined) return new Map();
  if (!isRecord(value)) {
    problems.add("model_object_required", path, "must be an object");
    return new Map();
  }
  for (const [key, entry] of Object.entries(value)) {
    problems.id(key, `${path}/${key}`);
    check(entry, `${path}/${key}`);
  }
  return new Map(Object.entries(value));
}

function checkList(problems, value, path, check, { minimum = 0 } = {}) {
  if (!Array.isArray(value) || value.length < minimum) {
    problems.add("model_list_invalid", path, `must be a list of at least ${minimum} items`);
    return [];
  }
  const ids = new Set();
  value.forEach((item, index) => {
    if (!check(item, `${path}/${index}`)) return;
    if (ids.has(item.id))
      problems.add("model_id_duplicate", `${path}/${index}/id`, `repeats ${item.id}`);
    ids.add(item.id);
  });
  return value.filter(isRecord);
}

function checkStatus(problems, value, path) {
  if (value !== undefined && !STATUSES.includes(value))
    problems.add("model_status_invalid", path, `must be one of ${STATUSES.join(", ")}`);
}

/**
 * Validate a parsed model and return its normalized, frozen form. `icon`
 * tells whether a Lucide icon name exists in the bundled artwork.
 * @param {unknown} model
 * @param {{ icon?: (name: string) => boolean }} [options]
 */
export function validateModel(model, options = {}) {
  const problems = new Problems();
  if (!checkTop(problems, model)) refuse("model_invalid", "The model is invalid.", problems.items);
  const value = /** @type {Record<string, any>} */ (model);
  const kinds = checkCatalog(problems, value.kinds, "/kinds", (entry, path) => {
    if (!problems.fields(entry, path, [], ["label", "category", "icon"])) return;
    problems.text(entry.label, `${path}/label`, true);
    if (entry.category !== undefined && !CATEGORIES.includes(entry.category))
      problems.add("model_category_invalid", `${path}/category`, CATEGORIES.join(", "));
    if (
      entry.icon !== undefined &&
      (typeof entry.icon !== "string" ||
        !ICON.test(entry.icon) ||
        options.icon?.(entry.icon) === false)
    )
      problems.add(
        "model_icon_unknown",
        `${path}/icon`,
        "names no icon in the bundled Lucide artwork",
      );
  });
  const sources = checkCatalog(problems, value.sources, "/sources", (entry, path) => {
    if (!problems.fields(entry, path, ["path"], ["sha256", "note"])) return;
    if (!isRelativePath(entry.path))
      problems.add("model_source_path_invalid", `${path}/path`, "must be a relative path");
    if (
      entry.sha256 !== undefined &&
      (typeof entry.sha256 !== "string" || !DIGEST.test(entry.sha256))
    )
      problems.add("model_digest_invalid", `${path}/sha256`, "must be lowercase SHA-256 hex");
    problems.text(entry.note, `${path}/note`, true);
  });
  const sourceIds = new Set(sources.keys());
  const element = (required, optional) => (entry, path) => {
    if (!problems.fields(entry, path, required, optional)) return false;
    problems.id(entry.id, `${path}/id`);
    problems.text(entry.label, `${path}/label`);
    checkDetails(problems, entry.details, `${path}/details`);
    checkStatus(problems, entry.status, `${path}/status`);
    checkReferences(problems, entry.sources, `${path}/sources`, sourceIds, "source");
    return true;
  };
  const components = checkList(
    problems,
    value.components,
    "/components",
    (entry, path) => {
      if (!element(["id", "label"], ["kind", "details", "status", "sources"])(entry, path))
        return false;
      if (entry.kind !== undefined) problems.id(entry.kind, `${path}/kind`);
      return true;
    },
    { minimum: 1 },
  );
  const componentIds = new Set(components.map(({ id }) => id));
  const relations = checkList(problems, value.relations, "/relations", (entry, path) => {
    if (!element(["id", "from", "to", "label"], ["details", "status", "sources"])(entry, path))
      return false;
    for (const end of ["from", "to"])
      if (!componentIds.has(entry[end]))
        problems.add("model_endpoint_unknown", `${path}/${end}`, "names no declared component");
    if (entry.from === entry.to)
      problems.add("model_relation_self", path, "connects a component to itself");
    return true;
  });
  const membership = new Map();
  const groups = checkList(problems, value.groups ?? [], "/groups", (entry, path) => {
    if (!problems.fields(entry, path, ["id", "label", "members"], [])) return false;
    problems.id(entry.id, `${path}/id`);
    problems.text(entry.label, `${path}/label`);
    if (componentIds.has(entry.id))
      problems.add("model_group_id_conflict", `${path}/id`, "is also a component id");
    const members = checkReferences(
      problems,
      entry.members,
      `${path}/members`,
      componentIds,
      "component",
      { optional: false },
    );
    members.forEach((member, index) => {
      if (membership.has(member))
        problems.add(
          "model_group_overlap",
          `${path}/members/${index}`,
          `is already in ${membership.get(member)}`,
        );
      else membership.set(member, entry.id);
    });
    return true;
  });
  const groupIds = new Set(groups.map(({ id }) => id));
  const views =
    value.views === undefined ? null : checkViews(problems, value.views, componentIds, groupIds);
  if (problems.items.length) refuse("model_invalid", "The model is invalid.", problems.items);
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const resolved = views?.map((view, index) => ({
    ...view,
    tiers: view.tiers ? resolveTiers(problems, view, groupMap, index) : null,
  }));
  if (problems.items.length) refuse("model_invalid", "The model is invalid.", problems.items);
  return normalize(value, {
    kinds,
    sources,
    components,
    relations,
    groups,
    views: resolved ?? null,
  });
}

function checkViews(problems, value, componentIds, groupIds) {
  if (Array.isArray(value) && value.length > MAXIMUM_VIEWS)
    problems.add("model_views_exceeded", "/views", `declares more than ${MAXIMUM_VIEWS} views`);
  return checkList(
    problems,
    value,
    "/views",
    (entry, path) => {
      if (
        !problems.fields(entry, path, ["id"], ["title", "question", "summary", "tiers", "members"])
      )
        return false;
      problems.id(entry.id, `${path}/id`);
      for (const key of ["title", "question", "summary"])
        problems.text(entry[key], `${path}/${key}`, true);
      if ("tiers" in entry === "members" in entry)
        problems.add(
          "model_view_shape_invalid",
          path,
          "must declare exactly one of tiers or members",
        );
      if ("tiers" in entry)
        checkTiers(problems, entry.tiers, `${path}/tiers`, componentIds, groupIds);
      if ("members" in entry)
        checkReferences(problems, entry.members, `${path}/members`, componentIds, "component", {
          optional: false,
        });
      return true;
    },
    { minimum: 1 },
  );
}

/** A tier is a declared group id or an inline `{ id, label, members }` band local to its view. */
function checkTiers(problems, tiers, path, componentIds, groupIds) {
  if (!Array.isArray(tiers) || !tiers.length)
    return problems.add("model_references_invalid", path, "must be a non-empty list of tiers");
  const ids = new Set();
  tiers.forEach((tier, index) => {
    const where = `${path}/${index}`;
    if (typeof tier === "string") {
      if (!groupIds.has(tier))
        problems.add("model_reference_unknown", where, "names no declared group");
    } else if (problems.fields(tier, where, ["id", "label", "members"], [])) {
      problems.id(tier.id, `${where}/id`);
      problems.text(tier.label, `${where}/label`);
      checkReferences(problems, tier.members, `${where}/members`, componentIds, "component", {
        optional: false,
      });
    }
    const id = typeof tier === "string" ? tier : tier?.id;
    if (ids.has(id)) problems.add("model_id_duplicate", where, `repeats tier ${id}`);
    ids.add(id);
  });
}

/** Resolve each tier to `{ id, label, members }` and refuse a component placed in two tiers. */
function resolveTiers(problems, view, groups, index) {
  const placed = new Map();
  const tiers = view.tiers.map((tier) => (typeof tier === "string" ? groups.get(tier) : tier));
  tiers.forEach((tier, position) =>
    tier.members.forEach((member) => {
      if (placed.has(member))
        problems.add(
          "model_tier_overlap",
          `/views/${index}/tiers/${position}`,
          `places ${member} in a second tier`,
        );
      placed.set(member, tier.id);
    }),
  );
  return tiers.map(({ id, label, members }) => ({ id, label, members: [...members] }));
}

const detailList = (details) =>
  Object.entries(details ?? {}).map(([name, value]) => [
    name,
    Array.isArray(value) ? value : [value],
  ]);

function normalize(value, parts) {
  const order = [];
  for (const id of parts.kinds.keys()) order.push(id);
  for (const component of parts.components)
    if (component.kind !== undefined && !order.includes(component.kind)) order.push(component.kind);
  const used = new Set(parts.components.map(({ kind }) => kind).filter(Boolean));
  const kinds = order
    .filter((id) => used.has(id))
    .map((id) => ({
      id,
      label: parts.kinds.get(id)?.label ?? id,
      category: parts.kinds.get(id)?.category ?? "backend",
      icon: parts.kinds.get(id)?.icon ?? null,
    }));
  const element = (entry) => ({
    id: entry.id,
    label: entry.label,
    details: detailList(entry.details),
    status: entry.status ?? null,
    sources: entry.sources ?? [],
  });
  return deepFreeze({
    id: value.id,
    title: value.title,
    question: value.question,
    summary: value.summary ?? null,
    attribution: value.attribution ?? null,
    scope: value.scope ?? null,
    limits: value.limits ?? [],
    repository: value.repository
      ? {
          name: value.repository.name,
          url: value.repository.url ?? null,
          revision: value.repository.revision,
        }
      : null,
    kinds,
    sources: [...parts.sources].map(([id, source]) => ({
      id,
      path: source.path,
      sha256: source.sha256 ?? null,
      note: source.note ?? null,
    })),
    components: parts.components.map((entry) => ({ ...element(entry), kind: entry.kind ?? null })),
    relations: parts.relations.map((entry) => ({
      ...element(entry),
      from: entry.from,
      to: entry.to,
    })),
    groups: parts.groups.map(({ id, label, members }) => ({ id, label, members: [...members] })),
    views:
      parts.views?.map((view) => ({
        id: view.id,
        title: view.title ?? null,
        question: view.question ?? null,
        summary: view.summary ?? null,
        tiers: view.tiers,
        members: view.members ? [...view.members] : null,
      })) ?? null,
  });
}

function deepFreeze(value) {
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) deepFreeze(item);
    Object.freeze(value);
  }
  return value;
}

/**
 * Read, parse and validate one model file.
 * @param {string} file
 * @param {{ icon?: (name: string) => boolean }} [options]
 */
export async function loadModel(file, options = {}) {
  let bytes;
  try {
    bytes = await fs.readFile(file);
  } catch (error) {
    refuse("model_unreadable", `Cannot read the model: ${/** @type {Error} */ (error).message}`);
  }
  if (bytes.length > MAXIMUM_MODEL_BYTES)
    refuse("model_too_large", `The model exceeds ${MAXIMUM_MODEL_BYTES} bytes.`);
  let parsed;
  try {
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    refuse(
      "model_json_invalid",
      `The model is not valid UTF-8 JSON: ${/** @type {Error} */ (error).message}`,
    );
  }
  return {
    model: validateModel(parsed, options),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  };
}
