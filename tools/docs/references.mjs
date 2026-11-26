// references.mjs --check|--write [--root <repository>]: the tables of the reference documents that restate the source, written from it
// (the queue item `derived-references`). Each table stands between two comment lines that name it and its
// source; the rest of its document is the authors'. The document is formatted by the repository's Prettier, so a
// written table is aligned as a table set by hand is.
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

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

// The commands and their options, as the command line catalogues them (`archpub --help --json`). The tools import
// no module of the product's; the writer runs the command line, in its own process with no environment but the
// path, and reads what it prints, as an agent does.
const { commands: program } = (() => {
  try {
    return JSON.parse(
      execFileSync(process.execPath, [path.join(root, "src/cli/main.mjs"), "--help", "--json"], {
        cwd: root,
        encoding: "utf8",
        timeout: 60_000,
        env: { PATH: process.env.PATH ?? "" },
      }),
    );
  } catch (error) {
    throw new Error(
      `references_catalogue_unreadable: archpub --help --json failed: ${error.message}`,
      {
        cause: error,
      },
    );
  }
})();
/** The long flag of an option and its value, as `--repo <checkout>`; `-V, --version` is `--version`. */
const flag = (/** @type {{ flags: string }} */ option) => option.flags.split(", ").at(-1);
/** A command's synopsis: its words, its arguments, then its options, an optional one in brackets. */
const synopsis = (/** @type {string[]} */ words, /** @type {any} */ command) =>
  [
    "archpub",
    ...words,
    ...command.arguments.map(({ name, required }) => (required ? `<${name}>` : `[${name}]`)),
    ...command.options
      .filter(({ flags }) => !flags.endsWith("--help"))
      .map((option) => (option.required ? flag(option) : `[${flag(option)}]`)),
  ].join(" ");
/** Every command that runs, in the help's order, by its words: `import likec4` stands for its group's one command. */
const leaves = (/** @type {any} */ command, /** @type {string[]} */ words = []) =>
  command.commands
    .filter(({ name }) => name !== "help")
    .flatMap((held) => {
      const inner = held.commands.filter(({ name }) => name !== "help");
      return inner.length ? leaves(held, [...words, held.name]) : [[[...words, held.name], held]];
    });
const helpCommand = program.commands.find(({ name }) => name === "help");
const programFlags = program.options.map(flag);
const usageBlock = () =>
  [
    "```text",
    ...leaves(program).map(([words, command]) => synopsis(words, command)),
    `archpub <command> --help | archpub ${helpCommand.name} ${helpCommand.usage.replace(/^\[options\] ?/u, "")}`.trimEnd(),
    `archpub ${programFlags.filter((each) => each !== "--json").join(" | ")}${programFlags.includes("--json") ? " [--json]" : ""}`,
    "```",
  ].join("\n");

// A delivery's files, as the table beside the names states them (src/delivery.json), with the default width it
// states and the delivered model's name the shared table gives (src/shared.json).
const delivery = JSON.parse(await fs.readFile(path.join(root, "src/delivery.json"), "utf8"));
const shared = JSON.parse(await fs.readFile(path.join(root, "src/shared.json"), "utf8"));
const defaultWidth = String(delivery.defaultWidth);
/** A file's name as the reference prints it: `{id}` as `<model id>`, a part of a pattern in angle brackets. */
const shown = (/** @type {string} */ name) =>
  name
    .split(", ")
    .map(
      (part) =>
        `\`${part
          .replace("{shared}", shared.delivered.model)
          .replace("{id}", "<model id>")
          .replace("{NN}", "NN")
          .replace(/\{(\w+)\}/gu, "<$1>")}\``,
    )
    .join(", ");
const deliveryTable = () =>
  table(
    ["File", "Written", "Content"],
    delivery.files.map((/** @type {any} */ row) => [
      shown(row.name),
      row.when,
      row.holds.replace("{default}", defaultWidth),
    ]),
  );

const BLOCKS = [
  {
    file: "docs/reference/operations.md",
    name: "delivery",
    source: "src/delivery.json",
    text: deliveryTable,
  },
  {
    file: "docs/reference/operations.md",
    name: "commands",
    source: "archpub --help --json",
    text: usageBlock,
  },
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
