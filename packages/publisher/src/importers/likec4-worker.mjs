// Runs inside a child Node process under the Permission Model, with read access
// to the verified parser supply only. Reads `{ files }` on stdin and writes one
// JSON reply with the parsed elements, relationships and views.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const reply = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);

try {
  const { files } = JSON.parse(fs.readFileSync(0, "utf8"));
  const parser = await import(pathToFileURL(path.join(process.cwd(), "parser.mjs")).href);
  const parsed = await parser.fromSources(files, {
    printErrors: false,
    throwIfInvalid: false,
    configureLogger: false,
    useFileSystem: false,
    manualLayouts: false,
    watch: false,
    graphviz: "wasm",
  });
  try {
    const locate = (query) => {
      const location = parsed.languageServices.locate(query);
      if (!location) return null;
      const file = decodeURIComponent(new URL(location.uri).pathname).replace(
        /^\/workspace\//u,
        "",
      );
      return { file, line: location.range.start.line + 1 };
    };
    const errors = parsed.languageServices.getErrors().map((error) => ({
      message: String(error.message ?? error),
      file: error.sourceFsPath ? String(error.sourceFsPath).replace(/^\/workspace\//u, "") : null,
      line: Number.isSafeInteger(error.range?.start?.line) ? error.range.start.line + 1 : null,
    }));
    if (errors.length) {
      reply({ status: "invalid", errors });
    } else {
      parsed.ensureSingleProject();
      const model = parsed.syncComputedModel();
      const elements = [...model.elements()].map((element) => ({
        id: element.id,
        kind: element.kind ?? null,
        title: element.title ?? element.id,
        technology: element.technology ?? null,
        description:
          typeof element.description === "string"
            ? element.description
            : (element.description?.text ?? null),
        parent: element.parent?.id ?? null,
        location: locate({ element: element.id }),
      }));
      const relations = [...model.relationships()].map((relation) => ({
        source: relation.source.id,
        target: relation.target.id,
        title: relation.title ?? null,
        technology: relation.technology ?? null,
        bidirectional: Boolean(relation.isBidirectional),
        location: locate({ relation: relation.id }),
      }));
      const views = [...model.views()].map((view) => ({
        id: view.id,
        type: view.$view?._type ?? null,
        title: view.title ?? null,
        generated: view.$view?.sourcePath === undefined,
        elements: [...view.nodes()].map((node) => node.element?.id ?? null),
        location: locate({ view: view.id }),
      }));
      reply({ status: "ok", elements, relations, views });
    }
  } finally {
    await parsed.dispose?.();
  }
} catch (error) {
  reply({ status: "failed", message: String(/** @type {Error} */ (error)?.message ?? error) });
  process.exitCode = 1;
}
