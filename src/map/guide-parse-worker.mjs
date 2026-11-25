// Runs inside a child Node process under the Permission Model, with read access to the verified Archify supply
// only. Reads `{ text }` on stdin, a guide's draft, and writes one JSON reply: the draft as Archify's own parser
// reads it, or the parser's findings.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const reply = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);

try {
  const { text } = JSON.parse(fs.readFileSync(0, "utf8"));
  const parser = await import(
    pathToFileURL(path.join(process.cwd(), "explainer", "parse.mjs")).href
  );
  const parsed = parser.parseExplainer(text, {});
  reply(
    parsed.document
      ? { status: "ok", document: parsed.document }
      : { status: "invalid", diagnostics: parsed.diagnostics ?? [] },
  );
} catch (error) {
  reply({
    status: "failed",
    message: String(/** @type {any} */ (error)?.message ?? error).slice(0, 2000),
  });
}
