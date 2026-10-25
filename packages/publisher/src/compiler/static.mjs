import { composeAuthoredStaticCanvas } from "../scene/static/authored-canvas.mjs";
import {
  composeStaticSelectionLayout,
  composeSelectedStaticRefinementLayout,
  selectedStaticNativeViews,
  selectedStaticSourceSelections,
} from "../scene/static/selection.mjs";
import { composeStaticEditionScene } from "../scene/static/edition.mjs";
import { composeStaticResponsibilityScene } from "../scene/static/responsibility.mjs";
import { assertAuthoredCanvasScene } from "../scene/static/audit.mjs";
import { auditEmittedEdges } from "../scene/emitted-path.mjs";
import { importLikeC4Layout } from "../semantics/native-likec4.mjs";
import { canonical } from "../semantics/document.mjs";
import { fail } from "../protocol/values.mjs";
import { composeStaticGeometry } from "./static-geometry.mjs";
import { loadBundledFonts } from "../../renderers/fonts/index.mjs";
import { resolveAuthoredFontSupply } from "../../renderers/resvg/font.mjs";
import {
  createBundledTextMeasurer,
  verifyAuthoredCanvasTextBoxes,
} from "../../renderers/resvg/measurement.mjs";
import { authoredCanvasFramingRequest } from "../../renderers/svg/canvas.mjs";
import { measureStaticPeerCapacity } from "../../renderers/svg/edition-structure.mjs";
import {
  composeStaticEditionSvg,
  composeStaticFigureSvg,
  composeStaticResponsibilitySvg,
  renderAuthoredCanvasSvg,
} from "../../renderers/svg/index.mjs";
import { validateVisibleSelection } from "./coverage.mjs";
import { readImplementationSupply } from "./implementation-supply.mjs";
import { embedFonts, rasterizeSvg } from "./media.mjs";
import { sha, artifact, checkedSupply } from "./media-record.mjs";

function staticViewMeaning(meaning, index) {
  const view = meaning.media.static.views[index];
  const authored = meaning.editorial.presentation.static.views[index];
  if (!view || !authored || view.id !== authored.id) fail("static_figure_view_mismatch");
  return {
    ...meaning,
    editorial: {
      ...meaning.editorial,
      presentation: {
        ...meaning.editorial.presentation,
        static: { ...meaning.editorial.presentation.static, views: [authored] },
      },
    },
    media: { ...meaning.media, static: { ...meaning.media.static, views: [view] } },
  };
}

async function staticView(selected, meaning, fontSupply, options = {}) {
  const staticRefinement = meaning.refinement?.media?.static;
  const authoredCanvas = staticRefinement?.kind === "authored-canvas";
  if (meaning.editorial.presentation.static.views[0].form !== undefined) {
    const scene = composeStaticResponsibilityScene(meaning);
    const rendered = composeStaticResponsibilitySvg(scene, { icons: options.icons });
    return {
      scene: rendered.scene,
      rendered,
      limits: [],
      implementationProfile: "static-responsibility",
    };
  }
  const claimMode = meaning.native.selections.some(
    ({ format }) => format === "architecture.claim-model/v2",
  );
  let implementationProfile = "static-claim";
  let layout = null;
  let textMeasurer;
  const staticGeometry = async (input) => {
    const selected = await composeStaticGeometry(input, fontSupply);
    textMeasurer = selected.textMeasurer;
    return selected;
  };
  if (authoredCanvas) implementationProfile = "static-authored";
  else if (staticRefinement && staticRefinement.kind !== "neutral") {
    implementationProfile = "static-refinement";
    layout = composeSelectedStaticRefinementLayout(meaning, meaning.refinement);
  } else if (meaning.editorial.presentation.static.views[0].groups !== undefined) {
    implementationProfile = "static-structural";
    layout = await composeStaticSelectionLayout(meaning, staticGeometry);
  } else if (
    (claimMode || selectedStaticNativeViews(meaning, meaning.media.static.views[0]).length !== 1) &&
    selectedStaticSourceSelections(meaning, meaning.media.static.views[0]).some(
      ({ target }) => target.kind !== "claim",
    )
  ) {
    implementationProfile = "static-structural";
    layout = await composeStaticSelectionLayout(meaning, staticGeometry);
  } else if (!claimMode) {
    implementationProfile = "static-likec4";
    const views = selectedStaticNativeViews(meaning, meaning.media.static.views[0]);
    if (views.length !== 1) fail("static_scene_composition_ambiguous");
    const view = { namespace: views[0].source.namespace, id: views[0].target.id };
    const measured = await measureStaticPeerCapacity(
      views[0].members.elements,
      fontSupply,
      createBundledTextMeasurer,
    );
    textMeasurer = measured.textMeasurer;
    layout = await importLikeC4Layout({
      lock: selected.lock,
      readSource: selected.readSource,
      view,
      nodeSize: measured.nodeSize,
    });
  }
  let scene;
  let rendered;
  let limits = [];
  let authoredFonts = null;
  if (authoredCanvas) {
    const authored = composeAuthoredStaticCanvas(meaning);
    authoredFonts = await resolveAuthoredFontSupply({
      catalogue: meaning.editorial.visualPolicy.fonts,
      defaultFont: staticRefinement.font,
      texts: authored.scene.texts,
      readResource: selected.readEditionResource,
      bundled: fontSupply,
    });
    scene = { ...authored.scene, texts: authoredFonts.texts };
    const { emittedContract } = assertAuthoredCanvasScene(scene);
    const measurer = await verifyAuthoredCanvasTextBoxes(scene, authoredFonts, [
      authoredCanvasFramingRequest(meaning.edition.editor),
    ]);
    const rasterWidth = meaning.editorial.presentation.static.width;
    if (!Number.isSafeInteger(rasterWidth)) fail("authored_canvas_width_required");
    const svg = renderAuthoredCanvasSvg(scene, meaning.edition.editor, measurer);
    const emitted = auditEmittedEdges(svg.toString("utf8"), scene, emittedContract);
    if (emitted.failures.length)
      fail("authored_canvas_emitted_geometry_invalid", emitted.failures[0].code);
    rendered = {
      bytes: svg,
      rasterWidth,
      carriers: authored.carriers,
    };
    limits = authored.limits;
  } else {
    scene = composeStaticEditionScene(meaning, layout);
    rendered = composeStaticEditionSvg(scene, {
      ...options,
      raster: true,
      ...(textMeasurer ? { textMeasurer } : {}),
    });
  }
  return { scene, rendered, limits, implementationProfile, authoredFonts };
}

export async function staticMedium(selected, meaning, scratch, icons) {
  const views = meaning.media.static.views;
  if (!Array.isArray(views) || !views.length) fail("static_figure_views_invalid");
  const firstViewTargets = selectedStaticSourceSelections(meaning, views[0]).map(
    ({ target }) => target.kind,
  );
  const firstViewHasRawStructure = firstViewTargets.some((kind) =>
    ["entity", "relation"].includes(kind),
  );
  const wholeAuthoredCanvas = meaning.refinement?.media?.static?.kind === "authored-canvas";
  const useFigure =
    !wholeAuthoredCanvas &&
    (views.length > 1 ||
      (meaning.editorial.presentation.static.views[0].form === undefined &&
        (firstViewHasRawStructure ||
          selectedStaticNativeViews(meaning, views[0]).length > 1 ||
          meaning.editorial.presentation.static.views[0].groups !== undefined)));
  if (
    views.length > 1 &&
    meaning.refinement?.media?.static !== undefined &&
    !["neutral", "authored-canvas"].includes(meaning.refinement.media.static.kind)
  )
    fail("static_figure_refinement_unadmitted");
  const fontSupply = await loadBundledFonts();
  const parts = [];
  if (wholeAuthoredCanvas) {
    parts.push({
      id: "whole-medium",
      ...(await staticView(selected, meaning, fontSupply, { icons })),
    });
  } else {
    for (const [index, view] of views.entries()) {
      const scoped = views.length === 1 ? meaning : staticViewMeaning(meaning, index);
      parts.push({
        id: view.id,
        ...(await staticView(
          selected,
          scoped,
          fontSupply,
          useFigure ? { icons, idPrefix: `static-view-${index}-`, fragment: true } : { icons },
        )),
      });
    }
  }
  let scene;
  let rendered;
  if (!useFigure) {
    ({ scene, rendered } = parts[0]);
    if (meaning.refinement?.media?.static?.kind !== "authored-canvas")
      validateVisibleSelection(meaning, "static", scene, rendered.carriers);
  } else {
    const figure = composeStaticFigureSvg({
      title: meaning.editorial.title,
      summary: meaning.editorial.narrative.summary,
      rasterWidth: meaning.editorial.presentation.static.width ?? 1800,
      views: parts.map(({ id, scene: part, rendered: fragment }) => ({
        id,
        scene: part,
        rendered: fragment,
      })),
    });
    scene = {
      schema: "architecture.edition-static-figure/v1",
      edition: meaning.edition,
      title: meaning.editorial.title,
      views: parts.map(({ scene: part }) => part),
      placements: figure.placements,
    };
    rendered = { ...figure, carriers: parts.map(({ rendered: fragment }) => fragment.carriers) };
    validateVisibleSelection(meaning, "static", scene, rendered.carriers);
  }
  const limits = parts.flatMap((part) => part.limits);
  const implementationProfile = !useFigure
    ? parts[0].implementationProfile
    : [...new Set(parts.map((part) => part.implementationProfile)), "static-figure"];
  const authoredFonts = wholeAuthoredCanvas ? parts[0].authoredFonts : null;
  const fonts =
    authoredFonts?.fonts ?? fontSupply.fonts.filter(({ weight }) => [400, 600].includes(weight));
  if ((!authoredFonts && fonts.length !== 2) || !fontSupply.license?.bytes)
    fail("static_edition_font_supply_invalid");
  const svg = embedFonts(rendered.bytes, fonts, fontSupply.license, authoredFonts?.distributions);
  const png = await rasterizeSvg(scratch, rendered.bytes, fonts, rendered.rasterWidth);
  const files = [
    { path: "static/architecture.svg", content: svg },
    { path: "static/architecture.png", content: png.bytes },
  ];
  return {
    files,
    limits,
    record: {
      sceneSha256: sha(Buffer.from(canonical(scene))),
      carrierSha256: sha(Buffer.from(canonical(rendered.carriers))),
      artifacts: [
        artifact("architecture-svg", files[0].path, "image/svg+xml", svg),
        artifact("architecture-png", files[1].path, "image/png", png.bytes),
      ],
      supplies: [
        checkedSupply({ id: "font-supply", sha256: fontSupply.sha256 }, "bundled-file-check/v1"),
        ...(authoredFonts
          ? [
              checkedSupply(
                { id: "selected-fonts", sha256: authoredFonts.sha256 },
                "renderer-returned-check/v1",
              ),
            ]
          : []),
        checkedSupply(
          { id: "raster-supply", sha256: png.result.supply.sha256 },
          "bundled-file-check/v1",
        ),
        ...(parts.some(({ scene: part }) =>
          part.nodes?.some((node) => node.icon?.startsWith("lucide:")),
        )
          ? [
              checkedSupply(
                { id: "figure-icons", sha256: icons.manifestSha256 },
                "bundled-file-check/v1",
              ),
            ]
          : []),
        await readImplementationSupply(implementationProfile),
      ],
    },
  };
}
