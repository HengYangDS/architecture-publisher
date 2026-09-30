import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fail } from '../../src/protocol/values.mjs';
import { interactiveGraphMarks as marks } from '../../src/scene/marks.mjs';
import { PROCESS_CLEANUP_MS, runOwnedProcess } from '../../src/runtime/process-tree.mjs';
import { loadElkSupply } from './supply.mjs';
import { measuredLabel } from './text.mjs';
import { decodeInteractiveLayoutReply, normalizeInteractiveGeometry } from './normalize.mjs';

const worker = fileURLToPath(new URL('./worker.mjs', import.meta.url));
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const invalid = () => fail('render_interactive_layout_invalid');

function editorialFailure(error, page) {
  if (
    !['render_interactive_text_infeasible', 'render_interactive_layout_infeasible'].includes(
      error.code,
    )
  )
    return error;
  return Object.assign(error, {
    hint: 'Regroup the selected view or provide a source-bound caption; do not omit or abbreviate required meaning.',
    diagnostics: [
      {
        view: page.id ?? null,
        questions: (page.questions ?? []).map(({ text }) => text),
        need: 'source-bound-caption-or-regrouping',
      },
    ],
  });
}

function preparePage(page, measure) {
  if (
    !page ||
    !Array.isArray(page.nodes) ||
    !page.nodes.length ||
    page.nodes.length > 512 ||
    !Array.isArray(page.relations) ||
    page.relations.length > 2048
  )
    invalid();
  const nodeIds = new Set();
  for (const node of page.nodes) {
    if (!text(node?.id) || !text(node.label) || nodeIds.has(node.id) || node.id === 'root')
      invalid();
    nodeIds.add(node.id);
  }
  const relationIds = new Set();
  for (const relation of page.relations) {
    if (
      !text(relation?.id) ||
      relationIds.has(relation.id) ||
      !nodeIds.has(relation.source) ||
      !nodeIds.has(relation.target) ||
      (relation.direction !== undefined &&
        !['forward', 'bidirectional'].includes(relation.direction))
    )
      invalid();
    relationIds.add(relation.id);
  }
  const grouped = page.groups !== undefined;
  if (grouped && (!Array.isArray(page.groups) || !page.groups.length || page.groups.length > 512))
    fail('render_interactive_group_invalid');
  const groupIds = new Set();
  const memberships = new Map();
  const groups = (page.groups ?? []).map((group) => {
    if (
      !text(group?.id) ||
      !text(group.label) ||
      group.id === 'root' ||
      nodeIds.has(group.id) ||
      groupIds.has(group.id) ||
      !Array.isArray(group.nodeIds) ||
      !group.nodeIds.length
    )
      fail('render_interactive_group_invalid');
    groupIds.add(group.id);
    for (const id of group.nodeIds) {
      if (!nodeIds.has(id) || memberships.has(id)) fail('render_interactive_group_invalid');
      memberships.set(id, group.id);
    }
    return {
      id: group.id,
      nodeIds: [...group.nodeIds],
      label: measuredLabel(group.label, measure),
    };
  });
  if (grouped && memberships.size !== nodeIds.size) fail('render_interactive_group_invalid');
  const measuredNodes = page.nodes.map((node) => ({
    id: node.id,
    groupId: memberships.get(node.id),
    label: measuredLabel(node.label, measure),
  }));
  const width = Math.max(170, ...measuredNodes.map(({ label }) => label.width + 24));
  const height = Math.max(64, ...measuredNodes.map(({ label }) => label.height + 16));
  const nodes = measuredNodes.map((node) => ({ ...node, width, height }));
  const relations = page.relations.map((relation) => ({
    id: relation.id,
    source: relation.source,
    target: relation.target,
    direction: relation.direction ?? 'forward',
    label: relation.graphLabel?.trim()
      ? measuredLabel(relation.graphLabel, measure, {
          fontSize: 13,
          weight: '400',
          maximumWidth: 220,
          maximumLines: 6,
        })
      : null,
  }));
  return { nodes, groups, relations };
}

function elkGraph(prepared, direction, wrapAspect = null) {
  const label = (id, plan) => ({
    id: `${id}-label`,
    text: plan.lines.join('\n'),
    width: plan.width,
    height: plan.height,
  });
  const leaf = (node) => ({
    id: node.id,
    width: node.width,
    height: node.height,
    labels: [label(node.id, node.label)],
    layoutOptions: { 'elk.nodeLabels.placement': '[INSIDE,H_CENTER,V_CENTER]' },
  });
  const byId = new Map(prepared.nodes.map((node) => [node.id, node]));
  const children = prepared.groups.length
    ? prepared.groups.map((group) => ({
        id: group.id,
        labels: [label(group.id, group.label)],
        children: group.nodeIds.map((id) => leaf(byId.get(id))),
        layoutOptions: {
          'elk.nodeLabels.placement': '[INSIDE,H_CENTER,V_TOP]',
          'elk.padding': '[top=24,left=24,bottom=24,right=24]',
        },
      }))
    : prepared.nodes.map(leaf);
  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.randomSeed': '1',
      'elk.spacing.nodeNode': '24',
      'elk.spacing.edgeNode': '20',
      'elk.spacing.edgeEdge': '16',
      'elk.spacing.labelNode': '16',
      'elk.layered.spacing.edgeNodeBetweenLayers': '24',
      'elk.layered.spacing.edgeEdgeBetweenLayers': '16',
      'elk.layered.spacing.nodeNodeBetweenLayers': '20',
      'elk.layered.nodePlacement.favorStraightEdges': 'false',
      ...(wrapAspect !== null
        ? { 'elk.layered.wrapping.strategy': 'MULTI_EDGE', 'elk.aspectRatio': String(wrapAspect) }
        : {}),
      'elk.edgeLabels.inline': 'false',
      'elk.layered.edgeLabels.sideSelection': 'ALWAYS_DOWN',
      'elk.padding': '[top=24,left=24,bottom=24,right=24]',
    },
    children,
    edges: prepared.relations.map((relation) => ({
      id: relation.id,
      sources: [relation.source],
      targets: [relation.target],
      ...(relation.label ? { labels: [label(relation.id, relation.label)] } : {}),
    })),
  };
}

function wrappingEligible(page) {
  if (
    page.groups.length ||
    page.nodes.length < 6 ||
    page.relations.some((relation) => relation.direction === 'bidirectional')
  )
    return false;
  const incoming = new Map(page.nodes.map(({ id }) => [id, 0]));
  const outgoing = new Map(page.nodes.map(({ id }) => [id, []]));
  for (const relation of page.relations) {
    incoming.set(relation.target, incoming.get(relation.target) + 1);
    outgoing.get(relation.source).push(relation.target);
  }
  const ready = [...incoming.keys()].filter((id) => incoming.get(id) === 0);
  let visited = 0;
  while (ready.length) {
    const id = ready.pop();
    visited++;
    for (const target of outgoing.get(id)) {
      incoming.set(target, incoming.get(target) - 1);
      if (incoming.get(target) === 0) ready.push(target);
    }
  }
  return visited === page.nodes.length;
}

/** One deep geometry seam; neither source selection nor browser routing occurs here. */
export async function layoutInteractivePages(pages, measure = null, options = {}) {
  if (!Array.isArray(pages) || !pages.length || pages.length > 64) invalid();
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maximumBytes = options.maximumBytes ?? 24 * 1024 * 1024;
  const temporaryDirectory = options.temporaryDirectory ?? os.tmpdir();
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > 25_000 ||
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes <= 0 ||
    maximumBytes > 32 * 1024 * 1024 ||
    !path.isAbsolute(temporaryDirectory)
  )
    fail('render_interactive_layout_execution_limit_invalid');
  const prepared = pages.map((page) => {
    try {
      return preparePage(page, measure);
    } catch (error) {
      throw editorialFailure(error, page);
    }
  });
  const supply = await loadElkSupply();
  const indexes = [];
  const graphs = prepared.flatMap((page) => {
    const candidates = [elkGraph(page, 'RIGHT'), elkGraph(page, 'DOWN')];
    if (wrappingEligible(page))
      candidates.push(elkGraph(page, 'RIGHT', 1.8), elkGraph(page, 'RIGHT', 3.2));
    indexes.push(candidates.length);
    return candidates;
  });
  const request = Buffer.from(
    JSON.stringify({ schema: 'architecture.interactive-layout-request/v1', graphs }),
  );
  if (request.length > 8 * 1024 * 1024) fail('render_interactive_layout_request_limit');
  const scratch = await fs.mkdtemp(path.join(temporaryDirectory, 'archpub-layout-'));
  try {
    const requestPath = path.join(scratch, 'request.json');
    await fs.writeFile(path.join(scratch, 'elk.cjs'), supply.script, { flag: 'wx' });
    await fs.writeFile(requestPath, request, { flag: 'wx' });
    const results = await runOwnedProcess({
      worker,
      nodeFlags: ['--max-old-space-size=512'],
      args: [String(timeoutMs + PROCESS_CLEANUP_MS + 1_000)],
      requestPath,
      scratch,
      timeoutMs,
      maximumBytes,
      failurePrefix: 'render_interactive_layout',
      decode: decodeInteractiveLayoutReply,
    });
    if (results.length !== graphs.length) fail('render_interactive_layout_response_invalid');
    let offset = 0;
    const layouts = prepared.map((page, index) => {
      const candidates = [];
      let lastFailure;
      const end = offset + indexes[index];
      for (let at = offset; at < end; at++) {
        try {
          candidates.push(normalizeInteractiveGeometry(results[at], page));
        } catch (error) {
          if (error.code !== 'render_interactive_layout_infeasible') throw error;
          lastFailure = error;
        }
      }
      offset = end;
      if (!candidates.length) throw editorialFailure(lastFailure, pages[index]);
      const readingWidth =
        Math.min(marks.desktopReadingWidth, marks.shellMaximumWidth) - marks.shellInset * 2;
      const assessment = (candidate) => {
        const scale = Math.min(1, readingWidth / (candidate.bounds.width + marks.graphInset * 2));
        const labels = [
          ...candidate.nodes,
          ...candidate.groups,
          ...candidate.relations.filter(({ label }) => label),
        ].map(({ label }) => label);
        const readable = labels.every(({ fontSize }) => fontSize * scale >= marks.minimumLabelSize);
        let routeLength = 0;
        let detour = 0;
        for (const { points } of candidate.relations) {
          const length = points
            .slice(1)
            .reduce(
              (sum, point, at) =>
                sum + Math.abs(point.x - points[at].x) + Math.abs(point.y - points[at].y),
              0,
            );
          const first = points[0];
          const last = points.at(-1);
          routeLength += length;
          detour += length - Math.abs(last.x - first.x) - Math.abs(last.y - first.y);
        }
        const readingCost =
          candidate.bounds.height + detour / Math.max(1, candidate.relations.length);
        return { readable, scale, readingCost, routeLength };
      };
      return candidates.reduce((best, candidate) => {
        const prior = assessment(best);
        const next = assessment(candidate);
        if (prior.readable !== next.readable) return next.readable ? candidate : best;
        if (!next.readable && next.scale !== prior.scale)
          return next.scale > prior.scale ? candidate : best;
        if (next.readingCost !== prior.readingCost)
          return next.readingCost < prior.readingCost ? candidate : best;
        return next.routeLength < prior.routeLength ? candidate : best;
      });
    });
    return { layouts, supplySha256: supply.manifestSha256, license: supply.license };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
