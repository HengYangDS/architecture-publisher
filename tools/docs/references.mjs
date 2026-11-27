// references.mjs --check|--write [--root <repository>]: the tables and lists of the documents that restate the
// source, written from it (the queue item `derived-references`), and the model's schema with the enumerations a table
// of the source owns filled in from that table. Each block stands between two comment lines that name it and its
// source; the rest of its document is the authors'. The document and the schema are formatted by the repository's
// Prettier, so a written table is aligned as a table set by hand is. The schema is written whole, as JSON then
// Prettier: its content outside the enumerations stays the authors', its layout is the writer's (an inline object or
// an escaped character that the format check accepts is written out again, and `check:generated` refuses it until
// `--write` is run). Each family of sources states its blocks in a module of its own under references/: the model's
// (model.mjs), the command line's (command-line.mjs), what the command needs, bundles, releases and delivers
// (operations.mjs), and the data's format (data.mjs), the last three reading a delivery's files through delivery.mjs;
// this module reads the tree, finds each block between its comment lines and writes or checks it.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import { commandLineBlocks } from "./references/command-line.mjs";
import { dataBlocks } from "./references/data.mjs";
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
  ...(await commandLineBlocks(root)),
  ...operations,
  ...(await dataBlocks(root)),
];

const begin = ({ name, source }) =>
  `<!-- ${name}: written from ${source} by tools/docs/references.mjs; do not edit -->`;
const end = ({ name }) => `<!-- end of ${name} -->`;

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
  let text = await fs.readFile(path.join(root, file), "utf8");
  for (const block of BLOCKS.filter((each) => each.file === file)) {
    const from = text.indexOf(begin(block));
    const to = text.indexOf(end(block), from);
    if (from < 0 || to < from) throw new Error(`references_block_missing: ${file} ${block.name}`);
    text = `${text.slice(0, from)}${begin(block)}\n\n${block.text()}\n\n${text.slice(to)}`;
  }
  await settle(file, "markdown", text);
}
if (drift) throw new Error("references_drift");
process.stdout.write(`reference tables ${mode === "--check" ? "verified" : "written"}\n`);
