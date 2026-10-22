import fs from "node:fs/promises";
import path from "node:path";
import { materializeBuildRequestInput } from "./build-input.mjs";
import { composeAuthoredInteractiveArchitecture } from "../scene/interactive/authored-architecture.mjs";
import { composeInteractiveEditionScene } from "../scene/interactive/edition.mjs";
import { resolveFigureTypes } from "../scene/figure-types.mjs";
import { composeAuthoredStaticCanvas } from "../scene/static/authored-canvas.mjs";
import { selectedStaticSourceSelections } from "../scene/static/selection.mjs";
import { canonical } from "../semantics/document.mjs";
import { readPublisherInstalledPackage } from "../runtime.mjs";
import { fail } from "../protocol/values.mjs";
import { writeSourceBundle } from "../source/write.mjs";
import {
  loadFigureIconSupply,
  validateFigureIconCatalog,
  validateResolvedFigureIcons,
} from "../../renderers/icons/index.mjs";
import { selectedEditionCandidateDigest, validateSelectedEditionCandidate } from "./candidate.mjs";
import { readImplementationSupply } from "./implementation-supply.mjs";
import { compileEditionMeaning } from "./meaning.mjs";
import { checkedSupply } from "./media-record.mjs";
import { staticMedium } from "./static.mjs";
import { interactiveMedium } from "./interactive.mjs";
import { projectSourceReading } from "../../renderers/interactive/source-reading.mjs";

function assertSelectedFormsRenderable(meaning, media) {
  for (const medium of media) {
    const selected = meaning.editorial.presentation[medium].views.some(
      (view) => view.form !== undefined,
    );
    if (!selected) continue;
    const refinement = meaning.refinement?.media?.[medium];
    if (medium === "interactive" && (!refinement || refinement.kind === "neutral")) continue;
    if (
      medium === "static" &&
      meaning.editorial.presentation.static.views.length === 1 &&
      (!refinement || refinement.kind === "neutral")
    )
      continue;
    fail("edition_visual_form_renderer_unavailable");
  }
}

async function destination(output) {
  const target = path.resolve(output);
  const parent = path.dirname(target);
  let parentStat;
  try {
    parentStat = await fs.lstat(parent);
    if (!parentStat.isDirectory() || parentStat.isSymbolicLink())
      fail("edition_candidate_output_parent_invalid");
    if ((await fs.realpath(parent)) !== parent) fail("edition_candidate_output_parent_invalid");
  } catch (error) {
    if (error?.code === "ENOENT") fail("edition_candidate_output_parent_invalid");
    throw error;
  }
  try {
    await fs.lstat(target);
    fail("edition_candidate_output_exists");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return { target, parent };
}

/** Compile selected native meaning to two independent, unqualified media. */
export async function compileSelectedEditionCandidateInput(
  requestPath,
  digest,
  output,
  executionChoice,
) {
  const { target, parent } = await destination(output);
  const installedPackage = await readPublisherInstalledPackage();
  const selected = await materializeBuildRequestInput(requestPath, digest, executionChoice);
  if (selected.lock.toolchain.profile !== "portable") fail("edition_toolchain_profile_unadmitted");
  const meaning = await compileEditionMeaning(selected);
  assertSelectedFormsRenderable(meaning, selected.lock.media);
  // Qualify the complete selected vocabulary before even a static-first renderer.
  const authored = meaning.refinement?.media?.interactive?.kind === "authored-architecture";
  const interactiveScene = selected.lock.media.includes("interactive")
    ? authored
      ? composeAuthoredInteractiveArchitecture(meaning)
      : composeInteractiveEditionScene(meaning)
    : null;
  const staticFigures = selected.lock.media.includes("static")
    ? meaning.refinement?.media?.static?.kind === "authored-canvas"
      ? // The closed canvas contract paints source-owned circles or finite primitives, not ordinary markers.
        [
          {
            nodes: composeAuthoredStaticCanvas(meaning).scene.nodes.filter(
              (node) => !node.primitives && !(node.center && Number.isFinite(node.radius)),
            ),
          },
        ]
      : meaning.media.static.views.map((view) => ({
          nodes: selectedStaticSourceSelections(meaning, view).flatMap((selection) =>
            selection.target.kind === "claim"
              ? []
              : selection.members.elements.map((node) => ({
                  ...node,
                  figureKind: node.kind ?? "source element",
                })),
          ),
        }))
    : [];
  const resolvedStaticFigures = resolveFigureTypes(
    staticFigures,
    meaning.editorial.visualPolicy?.figureTypes,
  );
  const sourceFigures = interactiveScene
    ? resolveFigureTypes(
        [
          {
            nodes: projectSourceReading(meaning.native.sourceReading, interactiveScene.pages)
              .elements.filter(({ label }) => label !== null)
              .map(({ reference, kind }) => ({ id: reference, kind })),
          },
        ],
        meaning.editorial.visualPolicy?.figureTypes,
      )
    : [];
  let icons = null;
  if (
    interactiveScene !== null ||
    staticFigures.some(({ nodes }) => nodes.length) ||
    meaning.editorial.visualPolicy?.figureTypes !== undefined
  ) {
    icons = await loadFigureIconSupply();
    validateFigureIconCatalog(meaning.editorial.visualPolicy?.figureTypes, icons);
    validateResolvedFigureIcons(
      [
        ...resolvedStaticFigures,
        ...sourceFigures,
        ...(interactiveScene
          ? authored
            ? interactiveScene.pages.map(({ scene }) => scene)
            : interactiveScene.pages
          : []),
      ],
      icons,
    );
  }
  const semanticProfile = selected.lock.sources.some(({ format }) => format.id === "likec4/dsl")
    ? "semantic-likec4"
    : "semantic-claim";
  const semanticImplementation = await readImplementationSupply(semanticProfile);
  const scratch = await fs.mkdtemp(path.join(parent, ".edition-candidate-"));
  try {
    const media = {};
    const files = [];
    const mediumLimits = [];
    for (const medium of selected.lock.media) {
      const rendered =
        medium === "static"
          ? await staticMedium(selected, meaning, scratch, icons)
          : await interactiveMedium(selected, meaning, scratch, interactiveScene);
      media[medium] = rendered.record;
      files.push(...rendered.files);
      mediumLimits.push(...(rendered.limits ?? []));
    }
    const candidate = validateSelectedEditionCandidate({
      schema: "architecture.edition-candidate/v2",
      qualification: "unqualified",
      input: {
        lockSha256: selected.lockSha256,
        editionSha256: selected.lock.edition.sha256,
        semanticDigest: meaning.native.semanticDigest,
        semanticSupplies: [
          ...(meaning.native.parserSupply === null
            ? []
            : [checkedSupply(meaning.native.parserSupply, "native-parser-returned-check/v1")]),
          semanticImplementation,
        ],
        closure: selected.closure,
      },
      media,
      obligations: Object.fromEntries(
        selected.lock.media.map((medium) => [medium, meaning.media[medium]]),
      ),
      limits: [...new Set([...meaning.limits, ...mediumLimits])],
    });
    const candidateBytes = Buffer.from(JSON.stringify(candidate, null, 2) + "\n");
    if (canonical(await readPublisherInstalledPackage()) !== canonical(installedPackage))
      fail("publisher_installed_package_changed_during_build");
    const written = await writeSourceBundle(
      target,
      { id: "edition-candidate", revision: selected.lockSha256 },
      [
        { path: "input-lock.json", content: Buffer.from(selected.lockJson) },
        { path: "candidate.json", content: candidateBytes },
        ...files,
      ],
    );
    return {
      status: "built",
      output: target,
      ...written,
      lockSha256: selected.lockSha256,
      requestSha256: digest,
      candidateSha256: selectedEditionCandidateDigest(candidate),
      installedPackage,
      media: Object.keys(media),
    };
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
