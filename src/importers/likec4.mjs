import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wordsOf } from "../locale.mjs";
import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  ID,
  MODEL_FORMAT,
  MODEL_VERSION,
  TEXT,
  validateModel,
} from "../model/load.mjs";
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

/**
 * The longest id the model's id pattern accepts, found by trying it, since the pattern states it inside itself. The
 * trial stops at the longest text, and a pattern that still accepts an id that long is refused at import. It assumes
 * what the pattern says today: a character an id may hold may stand anywhere after the first, and each is one code
 * point.
 */
const ID_MOST = (() => {
  let most = 1;
  while (most < TEXT.most && ID.test("a".repeat(most + 1))) most += 1;
  if (most === TEXT.most) throw new Error("the model's id pattern states no longest id");
  return most;
})();
if (!ID.test("a-"))
  throw new Error("the model's id pattern refuses the hyphen the importer joins with");

/**
 * Lowercase model ids, unique and stable for one import, held to the model's id pattern: each run of characters an id
 * may not hold becomes a hyphen, the id starts at the first character an id may begin with, and it is cut to the
 * longest id, a suffix that keeps it unique included. Every id the import makes passes here: a component's from its
 * element's full name, a group's, a relation's from its two ends, a view's.
 */
function idMaker() {
  const taken = new Set();
  return (raw) => {
    /** @type {string[]} */
    const kept = [];
    let gap = false;
    for (const character of String(raw).toLowerCase()) {
      if (!ID.test(`a${character}`)) gap = true;
      else {
        if (gap) kept.push("-");
        kept.push(character);
        gap = false;
      }
    }
    if (gap) kept.push("-");
    const start = kept.findIndex((character) => ID.test(character));
    const base = start < 0 ? ["i", "t", "e", "m"] : kept.slice(start, start + ID_MOST);
    let id = base.join("");
    for (let suffix = 2; taken.has(id); suffix += 1) {
      const tail = `-${suffix}`;
      id = `${base.slice(0, ID_MOST - tail.length).join("")}${tail}`;
    }
    taken.add(id);
    return id;
  };
}

/** The category of a LikeC4 kind from the words of its name, the first that match; each is a category of the model. */
const KIND_WORDS = /** @type {ReadonlyArray<readonly [RegExp, string]>} */ (
  Object.freeze([
    [/person|actor|user|customer/u, "person"],
    [/external/u, "external"],
    [/database|db|store|storage|cache/u, "database"],
    [/queue|topic|bus|broker|stream/u, "messagebus"],
    [/web|ui|app|mobile|frontend|browser|spa/u, "frontend"],
    [/cloud|cdn|bucket/u, "cloud"],
    [/auth|security|gateway|firewall/u, "security"],
  ])
);
for (const [, category] of KIND_WORDS)
  if (!CATEGORIES.includes(category))
    throw new Error(`the LikeC4 importer names ${category}, which is no category of the model`);

/** A category from common LikeC4 kind names; anything else takes the model's default. */
function categoryOf(kind) {
  const name = String(kind).toLowerCase();
  return KIND_WORDS.find(([words]) => words.test(name))?.[1] ?? DEFAULT_CATEGORY;
}

const where = (location) => (location ? `${location.file}:${location.line}` : "workspace");

/**
 * Convert a LikeC4 workspace into a model. Leaf elements become components,
 * parents of leaves become groups and element views become member views.
 * The words the import supplies itself, such as an unnamed relation's label
 * and a missing question, are set in the model's language.
 * @param {string} workspace
 * @param {{ id: string, title?: string, question?: string, locale?: string }} identity
 */
export async function importLikeC4(workspace, identity) {
  const words = wordsOf(identity.locale);
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
      label: relation.title ?? words.uses,
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
    views.push({ id: idMaker()(view.id), ...(view.title ? { title: view.title } : {}), members });
  }
  const model = {
    format: MODEL_FORMAT,
    version: MODEL_VERSION,
    id: identity.id,
    ...(identity.locale ? { locale: identity.locale } : {}),
    title: identity.title ?? identity.id,
    question: identity.question ?? words.question(identity.title ?? identity.id),
    ...(Object.keys(kinds).length ? { kinds } : {}),
    components,
    relations,
    ...(groups.length ? { groups } : {}),
    ...(views.length ? { views } : {}),
  };
  validateModel(model);
  return { model, warnings, supplySha256 };
}
