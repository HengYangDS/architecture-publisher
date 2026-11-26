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

// What the publisher needs of its host and bundles, each version read from its own owner: the package's `engines`
// for Node.js and Typst, and the bundled Archify's supply manifest.
const manifest = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const archify = JSON.parse(
  await fs.readFile(path.join(root, "renderers/archify/supply/supply.json"), "utf8"),
);
const nodeFloor = /^>=(\d+\.\d+(?:\.\d+)?)$/u.exec(manifest.engines?.node ?? "")?.[1];
if (!nodeFloor || !manifest.engines?.typst || !archify.version)
  throw new Error(
    "references_source_unreadable: package.json engines (node as >=x.y, typst) or the Archify supply's version",
  );
/** A registered meaning as the reference prints it: `{typst}` is the Typst release the package needs. */
const meant = (/** @type {string} */ text) => text.replaceAll("{typst}", manifest.engines.typst);

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

const suppliesTable = () =>
  table(
    ["Supply", "Version", "For", "Stated in"],
    [
      [
        "Node.js",
        `${nodeFloor} or later`,
        "the npm package; a release archive brings its own",
        "`package.json`, `engines.node`",
      ],
      [
        "Typst",
        manifest.engines.typst,
        "the print edition, on the path; a release archive brings its own",
        "`package.json`, `engines.typst`",
      ],
      [
        "Archify",
        archify.version,
        "the page; bundled, unmodified",
        "`renderers/archify/supply/supply.json`",
      ],
    ],
  );

// The rules a model's value is held to, as its schema states them (src/model/schema.json): the patterns and the
// limits are the schema's own; the words that say what each rule refuses are the writer's.
const schema = JSON.parse(await fs.readFile(path.join(root, "src/model/schema.json"), "utf8"));
const code = (/** @type {string} */ value) => `\`${value}\``;
const vocabularyTable = () =>
  table(
    ["Value", "Rule"],
    [
      [
        "An id",
        `matches ${code(schema.$defs.id.pattern)}; the model's own id also matches no ${code(schema.properties.id.allOf[1].not.pattern)}, so it names no Windows device and does not end in a dot`,
      ],
      [
        "A text",
        `${schema.$defs.text.minLength} to ${schema.$defs.text.maxLength} characters, not blank, with no NUL character; a character outside the Basic Multilingual Plane, such as most emoji, counts as two`,
      ],
      [
        "A path",
        `${schema.$defs.path.minLength} to ${schema.$defs.path.maxLength} characters, counted as in a text, relative, with no backslash, line feed, carriage return or NUL, and no empty, \`.\` or \`..\` segment`,
      ],
    ],
  );

const BLOCKS = [
  {
    file: "docs/reference/model.md",
    name: "vocabulary",
    source: "src/model/schema.json",
    text: vocabularyTable,
  },
  {
    file: "docs/reference/operations.md",
    name: "supplies",
    source: "package.json and the bundled supplies",
    text: suppliesTable,
  },
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
        rowsOf("command", "refusal").map((row) => [named(row.codes), meant(row.meaning)]),
      ),
  },
  {
    file: "docs/reference/refusals.md",
    name: "problems",
    source: "src/refusal.json",
    text: () =>
      table(
        ["Code", "Carried by", "Meaning"],
        rowsOf("problem").map((row) => [
          named(row.codes),
          named(row.carriedBy ?? []),
          meant(row.meaning),
        ]),
      ),
  },
  {
    file: "docs/reference/refusals.md",
    name: "warnings",
    source: "src/refusal.json",
    text: () =>
      table(
        ["Code", "Meaning"],
        rowsOf("warning").map((row) => [named(row.codes), meant(row.meaning)]),
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
