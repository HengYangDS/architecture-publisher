import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fail } from "../../src/protocol/values.mjs";
import { interactiveGraphMarks as marks } from "../../src/scene/marks.mjs";
import { PROCESS_CLEANUP_MS, runOwnedProcess } from "../../src/runtime/process-tree.mjs";
import { loadElkSupply } from "./supply.mjs";
import { placeMeasuredLabel } from "./text.mjs";
import { preparePage } from "./input.mjs";
import { connectedComponents } from "./topology.mjs";
import {
  collapseCompoundGeometry,
  decodeInteractiveLayoutReply,
  normalizeInteractiveGeometry,
} from "./normalize.mjs";
import {
  admitNodeEnvelope,
  auditInteractiveGeometry,
  qualifiedSourceExpansion,
  readingApertureExpansion,
} from "./audit.mjs";
import { groupedPlacement } from "./packing.mjs";
import { elkGraph, separateGroupTracks } from "./graph.mjs";
import { maximumLayoutPages } from "./limits.mjs";
import {
  allocateEndpointFootprints,
  compositionDisruption,
  intrinsicPlacements,
  unpackGeometry,
} from "./placement.mjs";

const worker = fileURLToPath(new URL("./worker.mjs", import.meta.url));

const invalid = () => fail("render_interactive_layout_invalid");

function editorialFailure(error, page) {
  if (
    !["render_interactive_text_infeasible", "render_interactive_layout_infeasible"].includes(
      error.code,
    )
  )
    return error;
  return Object.assign(error, {
    hint: "The internal measured layout has no qualified candidate; resolve its geometric constraint without changing or abbreviating source meaning.",
    diagnostics: [
      {
        view: page.id ?? null,
        questions: (page.questions ?? []).map(({ text }) => text),
        need: "intrinsic-layout-resolution",
        constraint: error.message,
      },
    ],
  });
}

/** Connectivity is used only for physical packing, never to invent source groups. */
function packedCandidate(page, direction, options, readingWidth) {
  const components = connectedComponents(page);
  if (components.length === 1) return { graph: elkGraph(page, direction, options), containers: [] };
  const used = new Set([...page.nodes, ...page.groups].map(({ id }) => id));
  const containers = components.map((component, index) => {
    let id = `archpub:packing:${index}`;
    while (used.has(id)) id += ":";
    used.add(id);
    return id;
  });
  return {
    containers,
    graph: {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "rectpacking",
        "elk.rectpacking.widthApproximation.strategy": "TARGET_WIDTH",
        "elk.rectpacking.widthApproximation.targetWidth": String(readingWidth),
        "elk.rectpacking.whiteSpaceElimination.strategy": "NONE",
        "elk.spacing.nodeNode": "24",
        "elk.padding": "[top=0,left=0,bottom=0,right=0]",
      },
      children: components.map((component, index) => ({
        ...elkGraph(component, direction, options),
        id: containers[index],
      })),
    },
  };
}

/** Native rectangle packing is placement, not an assertion that ELK routed the graph. */
function wrappingEligible(page) {
  if (
    page.groups.length ||
    page.nodes.length < 6 ||
    page.relations.some((relation) => relation.direction === "bidirectional")
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
  if (!Array.isArray(pages) || !pages.length || pages.length > maximumLayoutPages) invalid();
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maximumBytes = options.maximumBytes ?? 24 * 1024 * 1024;
  const temporaryDirectory = options.temporaryDirectory ?? os.tmpdir();
  const readingWidth =
    options.readingWidth ??
    Math.min(marks.desktopReadingWidth, marks.shellMaximumWidth) - marks.shellInset * 2;
  const minimumLabelSize = options.minimumLabelSize ?? marks.minimumLabelSize;
  const readingViewport = options.readingViewport;
  const placementViewport = options.placementViewport;
  const sourceReading = options.readingContext === "source";
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > 25_000 ||
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes <= 0 ||
    maximumBytes > 32 * 1024 * 1024 ||
    !path.isAbsolute(temporaryDirectory) ||
    !Number.isFinite(readingWidth) ||
    readingWidth <= 0 ||
    !Number.isFinite(minimumLabelSize) ||
    minimumLabelSize <= 0 ||
    (options.readingContext !== undefined &&
      !["overview", "source"].includes(options.readingContext)) ||
    (readingViewport !== undefined &&
      (!readingViewport ||
        !Number.isFinite(readingViewport.width) ||
        readingViewport.width <= 0 ||
        !Number.isFinite(readingViewport.height) ||
        readingViewport.height <= 0)) ||
    (placementViewport !== undefined &&
      (!placementViewport ||
        !Number.isFinite(placementViewport.width) ||
        placementViewport.width <= 0 ||
        !Number.isFinite(placementViewport.height) ||
        placementViewport.height <= 0)) ||
    (options.nodeFootprints !== undefined &&
      (!Array.isArray(options.nodeFootprints) || options.nodeFootprints.length !== pages.length))
  )
    fail("render_interactive_layout_execution_limit_invalid");
  const prepared = pages.map((page, index) => {
    try {
      const prepared = preparePage(
        page,
        measure,
        options.nodeFootprints?.[index],
        options.relationFootprints?.[index],
        options.groupFootprints?.[index],
      );
      return prepared;
    } catch (error) {
      throw editorialFailure(error, page);
    }
  });
  const supply = await loadElkSupply();
  const indexes = [];
  const graphEntries = prepared.flatMap((page) => {
    const candidate = (direction, settings = {}) => {
      const prepared = allocateEndpointFootprints(page, direction);
      return {
        ...(options.groupTracks && page.groups.length
          ? separateGroupTracks(elkGraph(prepared, direction, settings), direction)
          : options.nodeFootprints
            ? packedCandidate(prepared, direction, settings, readingWidth)
            : { graph: elkGraph(prepared, direction, settings), containers: [] }),
        prepared,
      };
    };
    const candidates = options.groupTracks
      ? [candidate("RIGHT")]
      : [candidate("RIGHT"), candidate("DOWN")];
    if (
      page.groups.length &&
      options.nodeFootprints &&
      options.composePackedCandidate &&
      page.nodes.every((node) => !node.ports)
    )
      candidates.push(groupedPlacement(page, readingWidth, placementViewport ?? readingViewport));
    // Reading context changes admission, not the available structural layouts.
    if (!page.groups.length && options.nodeFootprints) {
      const peerWidth = Math.max(...page.nodes.map(({ width }) => width));
      const layerBound = Math.max(
        1,
        Math.floor((readingWidth - marks.graphInset * 2 - 48) / (peerWidth + 24)),
      );
      candidates.push(
        candidate("DOWN", { layerBound }),
        candidate("DOWN", { layerBound: 1 }),
        ...[1, 2, 3, 4].map((bound) =>
          candidate("DOWN", { layerBound: bound, placement: "SIMPLE" }),
        ),
      );
      if (options.composePackedCandidate && page.nodes.every((node) => !node.ports))
        candidates.push(
          ...intrinsicPlacements(
            page,
            readingWidth,
            (remainder) => elkGraph(remainder, "RIGHT", { wrapAspect: 1.8, placement: "SIMPLE" }),
            readingViewport,
          ),
        );
    }
    if (wrappingEligible(page))
      candidates.push(
        candidate("RIGHT", { wrapAspect: 1.8 }),
        candidate("RIGHT", { wrapAspect: 3.2 }),
      );
    indexes.push(candidates.length);
    return candidates;
  });
  const graphs = graphEntries.map(({ graph }) => graph);
  const request = Buffer.from(
    JSON.stringify({ schema: "architecture.interactive-layout-request/v1", graphs }),
  );
  if (request.length > 8 * 1024 * 1024) fail("render_interactive_layout_request_limit");
  const scratch = await fs.mkdtemp(path.join(temporaryDirectory, "archpub-layout-"));
  try {
    const requestPath = path.join(scratch, "request.json");
    await fs.writeFile(path.join(scratch, "elk.cjs"), supply.script, { flag: "wx" });
    await fs.writeFile(requestPath, request, { flag: "wx" });
    const results = await runOwnedProcess({
      worker,
      nodeFlags: ["--max-old-space-size=512"],
      args: [String(timeoutMs + PROCESS_CLEANUP_MS + 1_000)],
      requestPath,
      scratch,
      timeoutMs,
      maximumBytes,
      failurePrefix: "render_interactive_layout",
      decode: decodeInteractiveLayoutReply,
    });
    if (results.length !== graphs.length) fail("render_interactive_layout_response_invalid");
    let offset = 0;
    const layouts = [];
    for (const [index, page] of prepared.entries()) {
      const candidates = [];
      const evaluatedGeometry = new Set();
      let undisruptedExpansion = Infinity;
      let lastFailure;
      const end = offset + indexes[index];
      for (let at = offset; at < end; at++) {
        try {
          const entry = graphEntries[at];
          // Native options select placement; normalization consumes its exact geometry.
          const identity = JSON.stringify(
            [
              entry.placementOnly,
              entry.preserveGroups,
              entry.escape,
              entry.verticalEscape,
              entry.containers,
              results[at],
            ],
            (key, value) => (key === "layoutOptions" ? undefined : value),
          );
          if (evaluatedGeometry.has(identity)) continue;
          evaluatedGeometry.add(identity);
          const placement = entry.placementOnly
            ? unpackGeometry(results[at], entry.containers, !entry.preserveGroups)
            : null;
          const nativeIds = new Set((placement?.edges ?? []).map(({ id }) => id));
          const layout = entry.placementOnly
            ? normalizeInteractiveGeometry(
                placement,
                {
                  ...page,
                  relations: page.relations.filter(({ id }) => nativeIds.has(id)),
                  nodes: page.nodes.map((node) => ({
                    ...node,
                    width: node.width + entry.escape * 2,
                    height: node.height + (entry.verticalEscape ?? entry.escape) * 2,
                  })),
                },
                undefined,
                Boolean(options.composePackedCandidate),
                entry.expandTracks === true,
              )
            : normalizeInteractiveGeometry(
                entry.bindings
                  ? collapseCompoundGeometry(results[at], entry.bindings)
                  : unpackGeometry(results[at], entry.containers),
                entry.prepared,
                undefined,
                Boolean(options.composeCandidate),
              );
          if (entry.placementOnly) {
            layout.nodes.forEach((node) => {
              node.x += entry.escape;
              node.y += entry.verticalEscape ?? entry.escape;
              node.width -= entry.escape * 2;
              node.height -= (entry.verticalEscape ?? entry.escape) * 2;
            });
            const bodies = [...layout.nodes, ...layout.groups];
            layout.bounds.width =
              Math.max(...bodies.map((node) => node.x + node.width)) + marks.graphInset;
            layout.bounds.height =
              Math.max(...bodies.map((node) => node.y + node.height)) + marks.graphInset;
            const nativeRelations = new Map(
              layout.relations.map((relation) => [relation.id, relation]),
            );
            layout.relations = page.relations.map((relation) => {
              const native = nativeRelations.get(relation.id);
              return {
                ...relation,
                points: native?.points ?? [],
                label: relation.label
                  ? (native?.label ?? placeMeasuredLabel(relation.label, 0, 0))
                  : null,
              };
            });
          }
          const compose = entry.placementOnly
            ? options.composePackedCandidate
            : options.composeCandidate;
          if (compose && options.nodeFootprints && !sourceReading)
            admitNodeEnvelope(layout, readingWidth, readingViewport, minimumLabelSize);
          // Fixed node extents can prove a loss, never qualification. Equal bounds
          // still need full routing, paint admission and the remaining tie-breaks.
          if (
            sourceReading &&
            options.candidateLowerBound?.(layout).apertureExpansion > undisruptedExpansion
          )
            continue;
          if (compose) {
            await compose(layout);
            auditInteractiveGeometry(layout);
          }
          options.validateCandidate?.(layout);
          layout.compositionDisruption = compositionDisruption(page, layout);
          candidates.push(layout);
          if (sourceReading) {
            undisruptedExpansion = Math.min(
              undisruptedExpansion,
              qualifiedSourceExpansion(layout, options, minimumLabelSize),
            );
          }
        } catch (error) {
          if (error.code !== "render_interactive_layout_infeasible") throw error;
          lastFailure = error;
        }
      }
      offset = end;
      if (!candidates.length) throw editorialFailure(lastFailure, pages[index]);
      const assessment = (candidate) => {
        const footprint = options.candidateFootprint?.(candidate) ?? candidate.bounds;
        const scale = sourceReading
          ? 1
          : Math.min(
              1,
              readingWidth /
                (footprint.width + (options.nodeFootprints ? 0 : marks.graphInset * 2)),
              ...(readingViewport
                ? [
                    readingViewport.width / footprint.width,
                    readingViewport.height / footprint.height,
                  ]
                : []),
            );
        const labels = [
          ...candidate.nodes,
          ...candidate.groups,
          ...candidate.relations.filter(({ label }) => label),
        ].map(({ label }) => label);
        const readable =
          (sourceReading || !options.candidateFootprint || footprint.width <= readingWidth) &&
          labels.every(({ fontSize }) => fontSize * scale >= minimumLabelSize);
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
        const apertureExpansion = readingApertureExpansion(footprint, readingViewport);
        const proportional =
          page.relations.length &&
          (options.candidateFootprint || (options.nodeFootprints && !page.orderedFlow));
        const readingAspect = readingViewport
          ? readingViewport.width / readingViewport.height
          : marks.desktopReadingAspect;
        const readingHeight = proportional
          ? Math.max(footprint.height, footprint.width / readingAspect)
          : footprint.height;
        const readingArea = proportional
          ? readingAspect * readingHeight ** 2
          : footprint.width * footprint.height;
        const readingCost =
          readingHeight +
          readingArea / readingWidth +
          detour / Math.max(1, candidate.relations.length);
        const rows = new Set(candidate.nodes.map(({ y }) => y)).size;
        return { readable, apertureExpansion, readingCost, routeLength, rows };
      };
      const readable = candidates.filter((candidate) => assessment(candidate).readable);
      if (!readable.length) {
        const code = "render_interactive_layout_infeasible";
        const constraint = readingViewport
          ? `complete-desktop-frame-below-text-floor:${readingViewport.width}x${readingViewport.height}:${minimumLabelSize}px`
          : code;
        throw editorialFailure(Object.assign(new Error(constraint), { code }), pages[index]);
      }
      const selected = readable.reduce((best, candidate) => {
        if (candidate.compositionDisruption !== best.compositionDisruption)
          return candidate.compositionDisruption < best.compositionDisruption ? candidate : best;
        const prior = assessment(best);
        const next = assessment(candidate);
        if (next.apertureExpansion !== prior.apertureExpansion)
          return next.apertureExpansion < prior.apertureExpansion ? candidate : best;
        if (!page.relations.length && next.rows !== prior.rows)
          return next.rows < prior.rows ? candidate : best;
        if (next.readingCost !== prior.readingCost)
          return next.readingCost < prior.readingCost ? candidate : best;
        return next.routeLength < prior.routeLength ? candidate : best;
      });
      layouts.push({ ...selected, compositionCost: assessment(selected).readingCost });
    }
    return { layouts, supplySha256: supply.manifestSha256, license: supply.license };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
