// references.mjs --check|--write [--root <repository>]: the tables and lists of the documents that restate the
// source, written from it (the queue item `derived-references`), and the model's schema with the enumerations a table
// of the source owns filled in from that table. Each block stands between two comment lines that name it and its
// source; the rest of its document is the authors'. The document and the schema are formatted by the repository's
// Prettier, so a written table is aligned as a table set by hand is. The schema is written whole, as JSON then
// Prettier: its content outside the enumerations stays the authors', its layout is the writer's (an inline object or
// an escaped character that the format check accepts is written out again, and `check:generated` refuses it until
// `--write` is run). Each family of sources states its blocks in a module of its own under references/: the model's
// (model.mjs), the command line's (command-line.mjs), what the command needs, bundles, releases and delivers
// (operations.mjs), the data's format (data.mjs), the last three reading a delivery's files through delivery.mjs, and
// the measures the code states as constants of its own modules (measures.mjs); this module reads the tree, finds each
// block between its comment lines and writes or checks it. A Markdown document marks a block with HTML comments and
// sets it apart as a paragraph; a YAML file marks it with comment lines, its entries at the first marker's indent.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import { commandLineBlocks } from "./references/command-line.mjs";
import { dataBlocks } from "./references/data.mjs";
import { measuresBlocks } from "./references/measures.mjs";
import { modelBlocks } from "./references/model.mjs";
import { operationsBlocks } from "./references/operations.mjs";

// `--root` names another tree of the repository, as a test's copy; the repository's own is the default.
const [mode, ...rest] = process.argv.slice(2);
if (
  !["--check", "--write"].includes(mode) ||
  !(rest.length === 0 || (rest.length === 2 && rest[0] === "--root"))
)
  throw new Error(
    "references_mode_required: run with --check or --write, and --root <repository> or none",
  );
const root = rest.length
  ? path.resolve(rest[1])
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const operations = await operationsBlocks(root);
const model = await modelBlocks(root);
const BLOCKS = [
  ...model.blocks,
  ...(await measuresBlocks(root)),
  ...(await commandLineBlocks(root)),
  ...operations,
  ...(await dataBlocks(root)),
];

/** Each kind of document a block stands in, by its extension: how a comment line is written, what sets a block apart
 * from its comment lines, and the parser that formats the document. */
const FORMS = Object.freeze({
  ".md": {
    comment: (/** @type {string} */ said) => `<!-- ${said} -->`,
    apart: "\n\n",
    parser: "markdown",
  },
  ".yml": { comment: (/** @type {string} */ said) => `# ${said}`, apart: "\n", parser: "yaml" },
});
/** The form of a document, refused by name when no form is stated for its kind. */
const formOf = (/** @type {string} */ file) => {
  const form = FORMS[/** @type {keyof typeof FORMS} */ (path.extname(file))];
  if (!form) throw new Error(`references_form_unknown: ${file}`);
  return form;
};
const begin = ({ name, source }, { comment }) =>
  comment(`${name}: written from ${source} by tools/docs/references.mjs; do not edit`);
const end = ({ name }, { comment }) => comment(`end of ${name}`);

let drift = 0;
/** Write a file in the repository's Prettier form, or in a check refuse the file when it differs from that. */
const settle = async (
  /** @type {string} */ file,
  /** @type {string} */ parser,
  /** @type {string} */ text,
) => {
  const target = path.join(root, file);
  const policy = await resolveConfig(target, {
    config: path.join(root, ".config/checks/prettier/prettier.toml"),
    editorconfig: false,
  });
  const written = await format(text, { ...policy, parser });
  if (written === (await fs.readFile(target, "utf8"))) return;
  if (mode === "--check") {
    process.stderr.write(`references_drift: ${file}: run node tools/docs/references.mjs --write\n`);
    drift += 1;
  } else await fs.writeFile(target, written);
};
await settle("src/model/schema.json", "json", JSON.stringify(model.schema, null, 2));
for (const file of [...new Set(BLOCKS.map((block) => block.file))]) {
  const form = formOf(file);
  let text = await fs.readFile(path.join(root, file), "utf8");
  for (const block of BLOCKS.filter((each) => each.file === file)) {
    const from = text.indexOf(begin(block, form));
    const to = text.indexOf(end(block, form), from);
    if (from < 0 || to < from) throw new Error(`references_block_missing: ${file} ${block.name}`);
    // The block's lines and its closing comment stand at its opening comment's indent.
    const indent = text.slice(text.lastIndexOf("\n", from) + 1, from);
    const lines = block
      .text()
      .split("\n")
      .map((line) => (line ? `${indent}${line}` : line))
      .join("\n");
    text = `${text.slice(0, from)}${begin(block, form)}${form.apart}${lines}${form.apart}${indent}${text.slice(to)}`;
  }
  await settle(file, form.parser, text);
}
if (drift) throw new Error("references_drift");
process.stdout.write(`reference tables ${mode === "--check" ? "verified" : "written"}\n`);
