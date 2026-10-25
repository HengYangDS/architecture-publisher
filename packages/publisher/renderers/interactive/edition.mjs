import { createHash } from "node:crypto";
import { loadBundledFonts } from "../fonts/index.mjs";
import { assembleArchitectureScene } from "../archify/index.mjs";
import { fail } from "../../src/protocol/values.mjs";
import { editorialFraming } from "../../src/scene/framing.mjs";
import {
  SOURCE_REPORTED_TOPOLOGY_NOTE,
  UNLINKED_RELATION_NOTE,
} from "../../src/scene/claim-relations.mjs";
import { projectInteractivePage } from "./model.mjs";
import { projectInteractiveInspection } from "./inspection.mjs";
import { factorCommonClaimContext } from "../../src/scene/claim-card.mjs";
import { interactiveAppearance } from "../../src/scene/appearance.mjs";
import { shell } from "../../src/rendering/document-shell.mjs";
import { pagePieces } from "../../src/rendering/document-input.mjs";
import { interactiveAppearanceCss, interactiveAppearanceScript } from "../reader/appearance.mjs";

const text = (value) => typeof value === "string" && value.trim().length > 0;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Adapt the existing public projection, without inventing source topology. */
function nativePage(page, title, editor, summary) {
  const notes = [];
  const item = (id, value, semanticIds = []) => ({ id, text: value, semanticIds });
  const add = (id, title, items) => {
    if (items.length) notes.push({ id, title, items });
  };
  add("reading-boundary", "Reading boundary", [
    ...(summary ? [item("publication-summary", summary)] : []),
    ...page.questions.flatMap((question, index) =>
      index || question.limits.length
        ? [item(`question-${index}`, [question.text, ...question.limits].join("\n"))]
        : [],
    ),
    ...(page.relations.some(({ direction }) => direction === "bidirectional")
      ? [
          item(
            "directed-reading",
            "Paths, Reach and relation counts describe directed traversals. A bidirectional source relationship offers both traversals; reverse reading does not reverse its source predicate.",
          ),
        ]
      : []),
  ]);
  const linked = new Set((page.claims ?? []).map(({ relationOrdinal }) => relationOrdinal));
  if (page.claims !== undefined && page.relations.some((_, index) => !linked.has(index + 1)))
    add("source-topology", "Selected source topology", [
      item(
        "source-topology-notice",
        page.claims.length ? UNLINKED_RELATION_NOTE : SOURCE_REPORTED_TOPOLOGY_NOTE,
      ),
    ]);
  const plain = !page.nodes.length;
  const texts = [];
  const statement = (id, value) =>
    texts.push({
      id,
      text: value,
      weight: "400",
      anchor: "middle",
      tone: "ink",
      visible: true,
      semanticIds: [id],
    });
  const context = factorCommonClaimContext(page.claims ?? []);
  add(
    "claim-common-context",
    "Shared by every selected Claim",
    context.common.map(({ label, value }, index) =>
      item(`claim-common-field-${index}`, `${label}: ${value}`),
    ),
  );
  for (const [index, claim] of (page.claims ?? []).entries()) {
    const facts = new Map(claim.facts.map(({ label, value }) => [label, value]));
    if (plain)
      statement(
        claim.graphicId,
        facts.get("Value") ?? facts.get("Predicate") ?? claim.facts[0].value,
      );
    add(
      `claim-card-${index}`,
      "Selected source Claim",
      claim.facts
        .filter(({ label }) => !context.commonLabels.has(label))
        .map(({ label, value }, at) =>
          item(
            !plain && at === 0 ? claim.graphicId : `claim-${index}-field-${at}`,
            `${label}: ${value}`,
            !plain && at === 0 ? [claim.graphicId] : [],
          ),
        ),
    );
  }
  const usedEditorial = new Set(
    [...(page.form?.roles ?? []), ...(page.form?.handoffs ?? [])]
      .filter(({ basis }) => basis.kind === "editorial")
      .map(({ basis }) => basis.graphicId),
  );
  for (const [index, assertion] of page.editorialAssertions.entries()) {
    if (usedEditorial.has(assertion.graphicId)) continue;
    if (plain) statement(assertion.graphicId, assertion.statement);
    add(`editorial-card-${index}`, "Editorial judgment", [
      item(
        !plain ? assertion.graphicId : `editorial-statement-${index}`,
        assertion.statement,
        !plain ? [assertion.graphicId] : [],
      ),
      item(
        `editorial-attribution-${index}`,
        `Editorial judgment · ${assertion.proponent} · unverified`,
      ),
    ]);
  }
  const nodeLabels = new Map(page.nodes.map(({ id, label }) => [id, label]));
  for (const [index, relation] of page.relations.entries())
    add(
      `relation-qualifiers-${index}`,
      "Source-reported relation qualifiers · unverified",
      relation.sourceQualifiers?.length
        ? [
            item(
              `relation-${index}-context`,
              `${nodeLabels.get(relation.source)} → ${nodeLabels.get(relation.target)}${relation.label ? ` · ${relation.label}` : ""}`,
            ),
            ...relation.sourceQualifiers.map(({ name, value }, at) =>
              item(`relation-${index}-qualifier-${at}`, `${name || '""'}: ${value}`),
            ),
          ]
        : [],
    );
  const groupById = new Map((page.groups ?? []).map((group) => [group.id, group]));
  for (const [index, role] of (page.form?.roles ?? []).entries())
    add(`role-${index}`, groupById.get(role.groupId).label, [
      item(
        `role-statement-${index}`,
        role.basis.kind === "editorial"
          ? `${role.basis.statement} · Editorial judgment · ${role.basis.proponent} · unverified`
          : role.basis.conditions.map(({ label, value }) => `${label}: ${value}`).join(" · "),
      ),
    ]);
  for (const [index, handoff] of (page.form?.handoffs ?? []).entries())
    add(`handoff-${index}`, "Attributed handoff", [
      item(
        `h-${index}`,
        `${groupById.get(handoff.fromGroup).label} → ${groupById.get(handoff.toGroup).label} · ${
          handoff.basis.kind === "editorial"
            ? `${handoff.basis.statement} · Editorial judgment · ${handoff.basis.proponent} · unverified`
            : handoff.basis.conditions.map(({ label, value }) => `${label}: ${value}`).join(" · ")
        }`,
        [`h-${index}`],
      ),
    ]);
  add("editorial-framing", "Editorial framing", [
    item("editorial-owner", editorialFraming(editor)),
  ]);
  const nodes = page.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    visualRole: "backend",
    figureKind: node.figureKind ?? node.kind ?? "component",
    ...(node.figureLabel === undefined ? {} : { figureLabel: node.figureLabel }),
    ...(node.icon === undefined ? {} : { icon: node.icon }),
  }));
  const edges = page.relations.map((relation) => ({
    id: relation.id,
    from: relation.source,
    to: relation.target,
    label: relation.label,
    visualRole: "default",
    semanticIds: [relation.id],
  }));
  return {
    scene: {
      schema: "architecture.interactive-scene/v1",
      id: page.id,
      title,
      subtitle: page.title,
      nodes,
      groups: page.groups ?? [],
      edges,
      notes,
      ...(texts.length ? { texts } : {}),
    },
    exploration: {
      nodes: nodes.map(({ id, label, figureKind: kind }) => ({ id, label, kind })),
      relations: edges.map(({ id, from, to, label }, index) => ({
        id,
        reference: id,
        from,
        to,
        label,
        edgeId: id,
        direction: page.relations[index].direction,
      })),
      limits: [],
    },
  };
}

/** Pack native pages using the existing navigation owner, without a second viewer. */
function standalone(scene, pages, appearance) {
  const blocks = [];
  const shared = new Map();
  const records = {};
  const inspections = scene.pages.map((page) => projectInteractiveInspection(page, scene.edition));
  const sources = {},
    sourceIds = new Map();
  for (const { sources: selected } of inspections)
    for (const source of selected) {
      const previous = sourceIds.get(source.namespace);
      if (previous) {
        if (sources[previous].sha256 !== source.sha256)
          fail("render_interactive_source_identity_ambiguous");
      } else {
        const id = `selected-${sourceIds.size + 1}`;
        sourceIds.set(source.namespace, id);
        sources[id] = source;
      }
    }
  for (const [index, page] of pages.entries()) {
    const selected = scene.pages[index];
    const inspection = inspections[index];
    const subjectSources = Object.fromEntries(
      Object.entries(inspection.subjectNamespaces).map(([id, namespaces]) => [
        id,
        namespaces.map((namespace) => sourceIds.get(namespace)),
      ]),
    );
    records[selected.id] = {
      id: selected.id,
      label: selected.questions[0].text,
      shortLabel: selected.id,
      purpose: index ? "mechanism" : "overview",
      nativeReader: "archify/v1",
      path: `views/${selected.id}.html`,
      sha256: sha(page.content),
      sourceIds: [...new Set(Object.values(subjectSources).flat())],
      subjectSources,
      facts: inspection.facts,
      pieces: pagePieces(page.content, shared, blocks),
    };
  }
  const data = {
    schema: "architecture.interactive-html/v1",
    title: scene.title,
    editionId: scene.edition.id,
    build: { editionSha256: scene.edition.sha256 },
    overview: scene.pages[0].id,
    order: scene.pages.map(({ id }) => id),
    pages: records,
    blocks,
    sources,
    state: {
      qualification: "not-performed",
      humanAcceptance: "not-performed",
      publication: "not-performed",
    },
    appearance,
    appearanceCss: interactiveAppearanceCss(),
    appearanceScript: interactiveAppearanceScript(),
  };
  return Buffer.from(shell({ ...scene, appearance, pages: Object.values(records) }, data));
}

export async function renderInteractiveEditionHtml(scene, options = undefined) {
  if (options !== undefined && (options?.composed !== true || Object.keys(options).length !== 1))
    fail("render_interactive_options_invalid");
  const appearance = interactiveAppearance(scene?.appearance);
  if (
    scene?.schema !== "architecture.edition-interactive-scene/v1" ||
    scene.completeness !== "unqualified-scene" ||
    !text(scene.title) ||
    (scene.summary !== undefined && !text(scene.summary)) ||
    !text(scene.edition?.editor) ||
    scene.visualPolicy?.profile !== "neutral" ||
    (scene.visualPolicy.override !== undefined && scene.visualPolicy.override !== null) ||
    !Array.isArray(scene.pages) ||
    !scene.pages.length ||
    scene.pages.length > 64 ||
    scene.pages.some((page) => !page || !text(page.id)) ||
    !Array.isArray(scene.limits) ||
    scene.limits.some((limit) => !text(limit))
  )
    fail("render_interactive_scene_invalid");
  if (new Set(scene.pages.map(({ id }) => id)).size !== scene.pages.length)
    fail("render_interactive_identity_ambiguous");
  if (scene.pages.some((page) => page.nodes?.length > 512 || page.relations?.length > 2048))
    fail("render_interactive_complexity_exceeded");
  const projected = scene.pages.map(projectInteractivePage);
  const fonts = await loadBundledFonts();
  const pages = [];
  const supplies = new Map();
  for (const { publicPage } of projected) {
    const native = nativePage(publicPage, scene.title, scene.edition.editor, scene.summary);
    const rendered = await assembleArchitectureScene(native.scene, {
      exploration: native.exploration,
      fontSupply: fonts,
    });
    pages.push({ content: rendered.bytes });
    for (const supply of rendered.supplies) {
      const previous = supplies.get(supply.id);
      if (previous && previous.sha256 !== supply.sha256) fail("render_interactive_supply_conflict");
      supplies.set(supply.id, supply);
    }
  }
  const bytes = standalone(scene, pages, appearance);
  if (bytes.length > 32 * 1024 * 1024) fail("render_interactive_output_limit");
  return {
    completeness: "unqualified-medium",
    bytes,
    supplies: [...supplies.values()],
    carriers: projected.map(({ carriers }) => carriers),
    ...(options?.composed ? { pages } : {}),
  };
}
