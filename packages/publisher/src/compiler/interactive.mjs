import fs from "node:fs/promises";
import path from "node:path";
import { composeInteractiveDocument, neutralInteractiveFacts } from "./interactive-document.mjs";
import { canonical } from "../semantics/document.mjs";
import { fail } from "../protocol/values.mjs";
import { renderInteractiveEditionHtml } from "../../renderers/interactive/index.mjs";
import { renderArchitectureScene } from "../../renderers/archify/index.mjs";
import { loadBundledFonts } from "../../renderers/fonts/index.mjs";
import { resolveAuthoredFontSupply } from "../../renderers/resvg/font.mjs";
import { validateVisibleSelection } from "./coverage.mjs";
import { readImplementationSupply } from "./implementation-supply.mjs";
import { sha, artifact, checkedSupply } from "./media-record.mjs";
import { prepareSourceReader } from "../../renderers/interactive/source-reader.mjs";

async function authoredInteractiveMedium(selected, meaning, scratch, authored) {
  const bundledFonts = await loadBundledFonts();
  const pageRecords = [];
  const supplies = new Map();
  const reading = await prepareSourceReader(
    meaning.native.sourceReading,
    authored.pages,
    meaning.editorial.visualPolicy.figureTypes,
  );
  for (const page of authored.pages) {
    const fontSupply = await resolveAuthoredFontSupply({
      catalogue: meaning.editorial.visualPolicy.fonts,
      defaultFont: meaning.refinement.media.interactive.font,
      texts: page.scene.texts ?? [],
      readResource: selected.readEditionResource,
      bundled: bundledFonts,
      backendDefaults: true,
      includeFraming: false,
      nativeTextWeights:
        page.scene.typography && page.scene.nodes.some((node) => !node.primitives)
          ? ["400", "600"]
          : [],
    });
    const output = path.join(scratch, `${page.id}.html`);
    const rendered = await renderArchitectureScene({
      scene: page.scene,
      output,
      fontSupply,
      exploration: page.exploration,
      interaction: page.exploration.limits.length ? "occurrence" : "native",
    });
    const content = await fs.readFile(output);
    for (const supply of rendered.supplies) {
      const supplyId = ["runtime", "statement-fonts", "node-fonts"].includes(supply.id)
        ? `${page.id}/${supply.id}`
        : supply.id;
      const previous = supplies.get(supplyId);
      if (previous && previous.sha256 !== supply.sha256)
        fail("authored_interactive_supply_conflict");
      supplies.set(supplyId, { ...supply, id: supplyId });
    }
    pageRecords.push({
      id: page.id,
      label: page.label,
      shortLabel: page.id
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" "),
      purpose: page.purpose,
      path: `views/${page.id}.html`,
      sha256: sha(content),
      subjectNamespaces: page.subjectNamespaces,
      facts: page.facts,
      content,
    });
  }
  const bytes = composeInteractiveDocument(selected, meaning, pageRecords, reading);
  const file = { path: "interactive/architecture.html", content: bytes };
  return {
    files: [file],
    limits: authored.limits,
    record: {
      sceneSha256: sha(Buffer.from(canonical(authored.pages.map(({ scene }) => scene)))),
      carrierSha256: sha(Buffer.from(canonical(authored.carriers))),
      artifacts: [artifact("architecture-html", file.path, "text/html", bytes)],
      supplies: [
        ...[...supplies.values()].map((supply) =>
          checkedSupply(supply, "renderer-returned-check/v1"),
        ),
        ...reading.supplies.map((supply) =>
          checkedSupply(
            { ...supply, id: `source-reader/${supply.id}` },
            "renderer-returned-check/v1",
          ),
        ),
        await readImplementationSupply("interactive-authored"),
      ],
    },
  };
}

export async function interactiveMedium(selected, meaning, scratch, scene) {
  if (meaning.refinement?.media?.interactive?.kind === "authored-architecture")
    return authoredInteractiveMedium(selected, meaning, scratch, scene);
  const reading = await prepareSourceReader(
    meaning.native.sourceReading,
    scene.pages,
    meaning.editorial.visualPolicy.figureTypes,
  );
  const rendered = await renderInteractiveEditionHtml(scene, { composed: true });
  validateVisibleSelection(meaning, "interactive", scene, rendered.carriers);
  const pages = rendered.pages.map(({ content }, index) => ({
    id: scene.pages[index].id,
    label: scene.pages[index].questions[0].text,
    shortLabel: scene.pages[index].id
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" "),
    purpose: index === 0 ? "overview" : "mechanism",
    path: `views/${scene.pages[index].id}.html`,
    sha256: sha(content),
    content,
    ...neutralInteractiveFacts(scene.pages[index], reading.projection, meaning.edition),
  }));
  const file = {
    path: "interactive/architecture.html",
    content: composeInteractiveDocument(selected, meaning, pages, reading),
  };
  return {
    files: [file],
    record: {
      sceneSha256: sha(Buffer.from(canonical(scene))),
      carrierSha256: sha(Buffer.from(canonical(rendered.carriers))),
      artifacts: [artifact("architecture-html", file.path, "text/html", file.content)],
      supplies: [
        ...rendered.supplies.map((supply) => checkedSupply(supply, "renderer-returned-check/v1")),
        ...reading.supplies.map((supply) =>
          checkedSupply(
            { ...supply, id: `source-reader/${supply.id}` },
            "renderer-returned-check/v1",
          ),
        ),
        await readImplementationSupply("interactive-neutral"),
      ],
    },
  };
}
