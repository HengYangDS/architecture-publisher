import { DEFAULT_LOCALE } from "../locale.mjs";
import { normalizeCoverage } from "./paths.mjs";
import { DEFAULT_CATEGORY } from "./vocabulary.mjs";

/**
 * The model's normalized form: what every later stage reads once the model is valid. Optional fields take their
 * defaults, details become name and value lists, kinds are listed in the order the components first use them, and
 * the whole is frozen.
 */

const detailList = (details) =>
  Object.entries(details ?? {}).map(([name, value]) => [
    name,
    Array.isArray(value) ? value : [value],
  ]);

/**
 * The normalized, frozen model of a valid model and its resolved parts.
 * @param {any} value
 * @param {{ kinds: Map<string, any>, components: any[], relations: any[], groups: any[], views: any[] | null }} parts
 */
export function normalize(value, parts) {
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
      category: parts.kinds.get(id)?.category ?? DEFAULT_CATEGORY,
      icon: parts.kinds.get(id)?.icon ?? null,
    }));
  const element = (entry) => ({
    id: entry.id,
    label: entry.label,
    details: detailList(entry.details),
    status: entry.status ?? null,
    files: entry.files ?? [],
  });
  return deepFreeze({
    id: value.id,
    locale: value.locale ?? DEFAULT_LOCALE,
    title: value.title,
    question: value.question,
    summary: value.summary ?? null,
    editors: (value.editors ?? []).map(({ name, url }) => ({ name, url: url ?? null })),
    license: value.license ?? null,
    scope: value.scope ?? null,
    limits: value.limits ?? [],
    repository: value.repository
      ? {
          name: value.repository.name,
          url: value.repository.url ?? null,
          browse: value.repository.browse ?? browseOf(value.repository.url),
          revision: value.repository.revision,
        }
      : null,
    kinds,
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
        composition: view.composition ?? null,
      })) ?? null,
    coverage: normalizeCoverage(value.coverage),
    overview: value.overview ?? null,
    guide: value.guide ?? null,
  });
}

/**
 * The Forges whose address implies the address of one file: each host, the number of the address's segments it
 * takes (an owner and a name; a group's path and a name), and its path to a file at a revision.
 */
const FORGES = new Map([
  ["github.com", { takes: (count) => count === 2, file: "/blob/{revision}/{path}" }],
  ["gitlab.com", { takes: (count) => count >= 2, file: "/-/blob/{revision}/{path}" }],
]);

/**
 * The browse template a repository's address implies, or null: an `https` address on GitHub or GitLab, with no
 * user, port, query or fragment, implies itself without a trailing `.git`, followed by its Forge's path to one file
 * at one revision. Any other address implies none.
 * @param {string | undefined} url
 */
export function browseOf(url) {
  if (typeof url !== "string" || !URL.canParse(url)) return null;
  const address = new URL(url);
  const forge = FORGES.get(address.host);
  if (!forge || address.protocol !== "https:" || address.username || address.password) return null;
  if (address.search || address.hash || url.includes("?") || url.includes("#")) return null;
  const segments = address.pathname
    .replace(/\/$/u, "")
    .replace(/\.git$/u, "")
    .split("/")
    .slice(1);
  if (!forge.takes(segments.length) || segments.includes("")) return null;
  return `https://${address.host}/${segments.join("/")}${forge.file}`;
}

function deepFreeze(value) {
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) deepFreeze(item);
    Object.freeze(value);
  }
  return value;
}
