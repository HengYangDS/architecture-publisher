import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL_FORMAT, MODEL_VERSION, MAXIMUM_VIEWS, validateModel } from "../model/load.mjs";
import { refuse } from "../refusal.mjs";
import { verifySupply } from "../supply.mjs";

const worker = fileURLToPath(new URL("./likec4-worker.mjs", import.meta.url));
const EXTENSIONS = new Set([".c4", ".likec4"]);
const MAXIMUM_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 60_000;

/** Every LikeC4 source under a workspace directory, by relative path. */
async function readWorkspace(root) {
  const files = {};
  let total = 0;
  const walk = async (directory) => {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
        const text = await fs.readFile(full, "utf8");
        total += Buffer.byteLength(text);
        if (total > MAXIMUM_BYTES)
          refuse(
            "likec4_too_large",
            `The workspace exceeds ${MAXIMUM_BYTES} bytes of LikeC4 sources.`,
          );
        files[path.relative(root, full).split(path.sep).join("/")] = text;
      }
    }
  };
  await walk(root);
  if (!Object.keys(files).length)
    refuse("likec4_sources_missing", `No .c4 or .likec4 files were found under ${root}.`);
  return files;
}

/** Parse in a child process that may read only the verified parser supply. */
async function parse(files) {
  const supply = await verifySupply("likec4");
  const reply = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--permission", `--allow-fs-read=${supply.root}`, `--allow-fs-read=${worker}`, worker],
      {
        cwd: supply.root,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: TIMEOUT_MS,
      },
    );
    let stdout = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.on("error", reject);
    child.on("close", () => {
      try {
        resolve(JSON.parse(stdout.trim().split("\n").at(-1) ?? ""));
      } catch {
        resolve({ status: "failed", message: "the parser returned no reply" });
      }
    });
    child.stdin.end(JSON.stringify({ files }));
  });
  if (reply.status === "invalid")
    refuse(
      "likec4_invalid",
      "The LikeC4 workspace has errors.",
      reply.errors.map((error) => ({
        code: "likec4_error",
        path: error.file ? `${error.file}:${error.line}` : "workspace",
        message: error.message,
      })),
    );
  if (reply.status !== "ok")
    refuse("likec4_parse_failed", `The LikeC4 parser failed: ${reply.message}`);
  return { reply, supplySha256: supply.sha256 };
}

/** Lowercase model ids, unique and stable for one import. */
function idMaker() {
  const taken = new Set();
  return (raw) => {
    const base =
      String(raw)
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/gu, "-")
        .replace(/^[^a-z0-9]+/u, "")
        .slice(0, 120) || "item";
    let id = base;
    for (let suffix = 2; taken.has(id); suffix += 1) id = `${base}-${suffix}`;
    taken.add(id);
    return id;
  };
}

/** A category from common LikeC4 kind names; anything else is a backend. */
function categoryOf(kind) {
  const name = String(kind).toLowerCase();
  if (/person|actor|user|customer/u.test(name)) return "person";
  if (/external/u.test(name)) return "external";
  if (/database|db|store|storage|cache/u.test(name)) return "database";
  if (/queue|topic|bus|broker|stream/u.test(name)) return "messagebus";
  if (/web|ui|app|mobile|frontend|browser|spa/u.test(name)) return "frontend";
  if (/cloud|cdn|bucket/u.test(name)) return "cloud";
  if (/auth|security|gateway|firewall/u.test(name)) return "security";
  return "backend";
}

const where = (location) => (location ? `${location.file}:${location.line}` : "workspace");

/**
 * Convert a LikeC4 workspace into a model. Leaf elements become components,
 * parents of leaves become groups and element views become member views.
 * @param {string} workspace
 * @param {{ id: string, title?: string, question?: string }} identity
 */
export async function importLikeC4(workspace, identity) {
  const files = await readWorkspace(workspace);
  const { reply, supplySha256 } = await parse(files);
  const warnings = [];
  const parents = new Set(reply.elements.map((element) => element.parent).filter(Boolean));
  const leaves = reply.elements.filter((element) => !parents.has(element.id));
  const componentId = idMaker();
  const ids = new Map(leaves.map((element) => [element.id, componentId(element.id)]));
  const kinds = {};
  const kindId = idMaker();
  const kindIds = new Map();
  const components = leaves.map((element) => {
    if (element.kind && !kindIds.has(element.kind)) kindIds.set(element.kind, kindId(element.kind));
    const kind = element.kind ? /** @type {string} */ (kindIds.get(element.kind)) : null;
    if (kind && !kinds[kind])
      kinds[kind] = { label: element.kind, category: categoryOf(element.kind) };
    const details = {};
    if (element.technology) details.technology = element.technology;
    if (element.description) details.description = element.description.replace(/\s+/gu, " ").trim();
    return {
      id: /** @type {string} */ (ids.get(element.id)),
      label: element.title,
      ...(kind ? { kind } : {}),
      ...(Object.keys(details).length ? { details } : {}),
    };
  });
  for (const element of reply.elements.filter(
    (item) =>
      parents.has(item.id) &&
      reply.elements.some((child) => child.parent === item.id && parents.has(child.id)),
  ))
    warnings.push({
      code: "likec4_nested_parent",
      path: where(element.location),
      message: `${element.id} contains other parents; only its direct leaf children form a group`,
    });
  const groupId = idMaker();
  for (const id of ids.values()) groupId(id);
  const groups = reply.elements
    .filter((element) => parents.has(element.id))
    .map((element) => ({
      id: groupId(`group-${element.id}`),
      label: element.title,
      members: leaves
        .filter((leaf) => leaf.parent === element.id)
        .map((leaf) => /** @type {string} */ (ids.get(leaf.id))),
    }))
    .filter((group) => group.members.length);
  const relationId = idMaker();
  const relations = [];
  for (const relation of reply.relations) {
    const from = ids.get(relation.source);
    const to = ids.get(relation.target);
    if (!from || !to || from === to) {
      warnings.push({
        code: "likec4_relation_unrepresented",
        path: where(relation.location),
        message: `${relation.source} -> ${relation.target} does not connect two different leaf elements`,
      });
      continue;
    }
    if (relation.bidirectional)
      warnings.push({
        code: "likec4_relation_bidirectional",
        path: where(relation.location),
        message: `${relation.source} <-> ${relation.target} is imported in its declared direction only`,
      });
    relations.push({
      id: relationId(`${from}-${to}`),
      from,
      to,
      label: relation.title ?? "uses",
      ...(relation.technology ? { details: { technology: relation.technology } } : {}),
    });
  }
  // A parent shown in a view stands for the components inside it, which the model draws as a group.
  const children = new Map();
  for (const element of reply.elements)
    if (element.parent)
      children.set(element.parent, [...(children.get(element.parent) ?? []), element.id]);
  const inside = (id) =>
    ids.has(id) ? [ids.get(id)] : (children.get(id) ?? []).flatMap((child) => inside(child));
  const views = [];
  for (const view of reply.views) {
    if (view.generated) continue;
    if (view.type !== "element") {
      warnings.push({
        code: "likec4_view_unsupported",
        path: where(view.location),
        message: `${view.id} is a ${view.type} view`,
      });
      continue;
    }
    const members = [...new Set(view.elements.flatMap((id) => (id ? inside(id) : [])))];
    if (!members.length) continue;
    if (views.length === MAXIMUM_VIEWS) {
      warnings.push({
        code: "likec4_view_limit",
        path: where(view.location),
        message: `${view.id} exceeds the ${MAXIMUM_VIEWS}-view limit`,
      });
      continue;
    }
    views.push({ id: idMaker()(view.id), ...(view.title ? { title: view.title } : {}), members });
  }
  const model = {
    format: MODEL_FORMAT,
    version: MODEL_VERSION,
    id: identity.id,
    title: identity.title ?? identity.id,
    question: identity.question ?? `How is ${identity.title ?? identity.id} structured?`,
    attribution: "imported from LikeC4",
    ...(Object.keys(kinds).length ? { kinds } : {}),
    components,
    relations,
    ...(groups.length ? { groups } : {}),
    ...(views.length ? { views } : {}),
  };
  validateModel(model);
  return { model, warnings, supplySha256 };
}
