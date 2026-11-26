// references.mjs --check|--write: the tables of the reference documents that restate the source, written from it
// (the queue item `derived-references`). Each table stands between two comment lines that name it and its
// source; the rest of its document is the authors'. The document is formatted by the repository's Prettier, so a
// written table is aligned as a table set by hand is.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mode = process.argv[2];
if (process.argv.length !== 3 || !["--check", "--write"].includes(mode))
  throw new Error("references_mode_required: run with --check or --write");

/** @param {readonly string[]} codes */
const named = (codes) => codes.map((code) => `\`${code}\``).join(", ");
/** @param {readonly string[]} head @param {ReadonlyArray<readonly string[]>} rows */
const table = (head, rows) =>
  [head, head.map(() => "---"), ...rows]
    .map((row) => `| ${row.map((cell) => cell.replaceAll("|", "\\|")).join(" | ")} |`)
    .join("\n");
// The registry holds each code once; a code `with` another shares that code's row, in the registry's order.
const registry = JSON.parse(await fs.readFile(path.join(root, "src/refusal.json"), "utf8"));
const REFUSALS = [];
for (const [code, entry] of Object.entries(registry)) {
  if (entry.with === undefined) REFUSALS.push({ ...entry, codes: [code] });
  else {
    const lead = REFUSALS.find((row) => row.codes[0] === entry.with);
    if (!lead)
      throw new Error(
        `references_registry_invalid: ${code} joins ${entry.with}, which leads no earlier row`,
      );
    lead.codes.push(code);
  }
}
/** @param {string[]} sections */
const rowsOf = (...sections) => REFUSALS.filter((row) => sections.includes(row.section));

const BLOCKS = [
  {
    file: "docs/reference/refusals.md",
    name: "refusals",
    source: "src/refusal.json",
    text: () =>
      table(
        ["Code", "Meaning"],
        rowsOf("command", "refusal").map((row) => [named(row.codes), row.meaning]),
      ),
  },
  {
    file: "docs/reference/refusals.md",
    name: "problems",
    source: "src/refusal.json",
    text: () =>
      table(
        ["Code", "Carried by", "Meaning"],
        rowsOf("problem").map((row) => [named(row.codes), named(row.carriedBy ?? []), row.meaning]),
      ),
  },
  {
    file: "docs/reference/refusals.md",
    name: "warnings",
    source: "src/refusal.json",
    text: () =>
      table(
        ["Code", "Meaning"],
        rowsOf("warning").map((row) => [named(row.codes), row.meaning]),
      ),
  },
];

const begin = ({ name, source }) =>
  `<!-- ${name}: written from ${source} by tools/docs/references.mjs; do not edit -->`;
const end = ({ name }) => `<!-- end of ${name} -->`;

let drift = 0;
for (const file of [...new Set(BLOCKS.map((block) => block.file))]) {
  const target = path.join(root, file);
  let text = await fs.readFile(target, "utf8");
  for (const block of BLOCKS.filter((each) => each.file === file)) {
    const from = text.indexOf(begin(block));
    const to = text.indexOf(end(block), from);
    if (from < 0 || to < from) throw new Error(`references_block_missing: ${file} ${block.name}`);
    text = `${text.slice(0, from)}${begin(block)}\n\n${block.text()}\n\n${text.slice(to)}`;
  }
  const policy = await resolveConfig(target, {
    config: path.join(root, ".config/checks/prettier/prettier.toml"),
    editorconfig: false,
  });
  const written = await format(text, { ...policy, parser: "markdown" });
  if (written === (await fs.readFile(target, "utf8"))) continue;
  if (mode === "--check") {
    process.stderr.write(`references_drift: ${file}: run node tools/docs/references.mjs --write\n`);
    drift += 1;
  } else await fs.writeFile(target, written);
}
if (drift) throw new Error("references_drift");
process.stdout.write(`reference tables ${mode === "--check" ? "verified" : "written"}\n`);
