import { Refusal, refuse } from "../refusal.mjs";
import { MAXIMUM_VIEWS } from "../model/load.mjs";

/**
 * A view is the unit both media render: its components, its relations and
 * optional ordered tiers. Context components are neighbors shown for orientation.
 * @typedef {{ id: string, label: string, kind: string | null, details: Array<[string, string[]]>,
 *   status: string | null, sources: string[], context?: boolean, group?: boolean }} ViewComponent
 * @typedef {{ id: string, from: string, to: string, label: string,
 *   details: Array<[string, string[]]>, status: string | null, sources: string[],
 *   relations?: string[] }} ViewRelation
 * @typedef {{ id: string, title: string, question: string, summary: string | null,
 *   origin: "declared" | "complete" | "overview" | "group",
 *   tiers: Array<{ id: string, label: string, members: string[] }> | null,
 *   components: ViewComponent[], relations: ViewRelation[] }} View
 */

const byIds = (items) => new Map(items.map((item) => [item.id, item]));

function viewOf(model, base, memberIds, tiers, contextIds = []) {
  const members = new Set(memberIds);
  const context = new Set(contextIds.filter((id) => !members.has(id)));
  const shown = new Set([...members, ...context]);
  const components = model.components
    .filter(({ id }) => shown.has(id))
    .map((component) => (context.has(component.id) ? { ...component, context: true } : component));
  const relations = model.relations.filter(
    ({ from, to }) => shown.has(from) && shown.has(to) && (members.has(from) || members.has(to)),
  );
  return {
    id: base.id,
    title: base.title ?? model.title,
    question: base.question ?? model.question,
    summary: base.summary ?? (base.origin === "complete" ? model.summary : null),
    origin: base.origin,
    tiers,
    components,
    relations,
  };
}

/** @returns {View[]} */
function declaredViews(model) {
  return model.views.map((view, index) => {
    const members = view.tiers ? view.tiers.flatMap(({ members: ids }) => ids) : view.members;
    // The first view opens the edition, so it carries the model summary unless it has its own.
    const summary = view.summary ?? (index === 0 ? model.summary : null);
    return viewOf(model, { ...view, summary, origin: "declared" }, members, view.tiers);
  });
}

/** One node per group plus ungrouped components; one aggregated relation per ordered pair. */
function overviewView(model) {
  const owner = new Map();
  for (const group of model.groups) for (const member of group.members) owner.set(member, group.id);
  const components = byIds(model.components);
  const nodes = [
    ...model.groups.map((group) => ({
      id: group.id,
      label: group.label,
      kind: null,
      details: [["includes", group.members.map((id) => components.get(id).label)]],
      status: null,
      sources: [],
      group: true,
    })),
    ...model.components.filter(({ id }) => !owner.has(id)),
  ];
  const pairs = new Map();
  for (const relation of model.relations) {
    const from = owner.get(relation.from) ?? relation.from;
    const to = owner.get(relation.to) ?? relation.to;
    if (from === to) continue;
    const key = `${from}\u0000${to}`;
    if (!pairs.has(key)) pairs.set(key, { from, to, labels: [], relations: [] });
    const pair = pairs.get(key);
    if (!pair.labels.includes(relation.label)) pair.labels.push(relation.label);
    pair.relations.push(relation.id);
  }
  const relations = [...pairs.values()].map((pair, index) => ({
    id: `overview-${index + 1}`,
    from: pair.from,
    to: pair.to,
    label: pair.labels.join(" / "),
    details: pair.relations.length > 1 ? [["relations", [String(pair.relations.length)]]] : [],
    status: null,
    sources: [],
    relations: pair.relations,
  }));
  return {
    id: "overview",
    title: model.title,
    question: model.question,
    summary: model.summary,
    origin: /** @type {const} */ ("overview"),
    tiers: null,
    components: nodes,
    relations,
  };
}

function groupViews(model) {
  return model.groups.map((group) => {
    const members = new Set(group.members);
    const neighbors = model.relations.flatMap(({ from, to }) =>
      members.has(from) && !members.has(to)
        ? [to]
        : members.has(to) && !members.has(from)
          ? [from]
          : [],
    );
    return viewOf(
      model,
      { id: group.id, title: group.label, question: null, origin: "group" },
      group.members,
      null,
      neighbors,
    );
  });
}

/**
 * Choose the views to render. `admit` composes one poster and reports its size.
 * @param {any} model
 * @param {(view: View) => Promise<{ fits: boolean, width: number, height: number }>} admit
 */
export async function planViews(model, admit) {
  if (model.views) {
    const views = declaredViews(model);
    await admitAll(views, admit);
    return views;
  }
  const complete = viewOf(
    model,
    { id: "architecture", origin: "complete" },
    model.components.map(({ id }) => id),
    null,
  );
  const measured = await measure(complete, admit);
  if (measured.fits) return [complete];
  if (!model.groups.length)
    refuse(
      "plan_requires_structure",
      unadmitted(complete, measured, "Add groups or declare views."),
      measured.refusal ? viewProblems(complete, measured) : [],
    );
  const views = [overviewView(model), ...groupViews(model)];
  if (views.length > MAXIMUM_VIEWS)
    refuse(
      "plan_views_exceeded",
      `${unadmitted(complete, measured, "")}An overview plus ${model.groups.length} group views exceeds ` +
        `${MAXIMUM_VIEWS} views. Declare at most ${MAXIMUM_VIEWS} views or use fewer groups.`,
    );
  await admitAll(views, admit);
  return views;
}

/**
 * @typedef {{ fits: boolean, width?: number, height?: number, refusal?: Refusal }} Measurement
 */

/**
 * Admit one view. A view whose layout or composition is refused is not admitted;
 * its refusal is kept so that the plan can report every unadmitted view.
 * @param {View} view
 * @param {(view: View) => Promise<Measurement>} admit
 * @returns {Promise<Measurement>}
 */
async function measure(view, admit) {
  try {
    return await admit(view);
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    return { fits: false, refusal: error };
  }
}

/**
 * Refuse with the first unadmitted view's refusal, naming that view, and with the
 * problems of every unadmitted view under its `/views/<id>` path.
 */
async function admitAll(views, admit) {
  const refused = [];
  for (const view of views) {
    const measured = await measure(view, admit);
    if (!measured.fits) refused.push({ view, measured });
  }
  if (!refused.length) return;
  const [{ view, measured }, ...others] = refused;
  const ids = others.map(({ view: other }) => other.id);
  const rest = ids.length
    ? ` ${ids.length === 1 ? "View" : "Views"} ${series(ids)} ${ids.length === 1 ? "is" : "are"} refused too.`
    : "";
  refuse(
    measured.refusal?.code ?? "plan_not_admitted",
    (measured.refusal
      ? `View ${view.id}: ${measured.refusal.message}`
      : `View ${view.id} does not fit its poster frame.`) + rest,
    refused.flatMap((each) => viewProblems(each.view, each.measured)),
  );
}

/** @param {View} view @param {Measurement} measured */
function viewProblems(view, measured) {
  if (measured.refusal)
    return measured.refusal.problems.map((problem) => ({
      ...problem,
      path: `/views/${view.id}${problem.path ?? ""}`,
    }));
  return [
    {
      code: "view_not_admitted",
      path: `/views/${view.id}`,
      message: oversized(view, measured, "Split the view or reduce its components."),
    },
  ];
}

/** @param {View} view @param {Measurement} measured @param {string} remedy */
function unadmitted(view, measured, remedy) {
  if (!measured.refusal) return oversized(view, measured, remedy);
  return (
    `View ${view.id} with ${view.components.length} components and ${view.relations.length} ` +
    `relations cannot be laid out: ${measured.refusal.message} ${remedy}`
  );
}

/** @param {View} view @param {Measurement} measured @param {string} remedy */
function oversized(view, measured, remedy) {
  return (
    `View ${view.id} with ${view.components.length} components and ` +
    `${view.relations.length} relations cannot be laid out on a ` +
    `${measured.width} × ${measured.height} px page. ${remedy}`
  );
}

/** "a", "a and b", "a, b and c". */
const series = (items) =>
  items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
