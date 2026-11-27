// references.mjs --check|--write [--root <repository>]: the tables of the reference documents that restate the source, written from it
// (the queue item `derived-references`), and the model's schema with the enumerations a table of the source owns
// filled in from that table. Each table stands between two comment lines that name it and its source; the rest of its
// document is the authors'. The document and the schema are formatted by the repository's Prettier, so a written
// table is aligned as a table set by hand is. The schema is written whole, as JSON then Prettier: its content outside
// the enumerations stays the authors', its layout is the writer's (an inline object or an escaped character that the
// format check accepts is written out again, and `check:generated` refuses it until `--write` is run).
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
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

// How a command ends, as the command line's table of outcomes states it (src/cli/outcomes.json), in the order of the
// exit statuses: each outcome's status, its name as the help gives it, what it means and the JSON object `--json`
// prints, `ok` first, a code the outcome fixes with its value, and `...` for the result of an outcome that names no
// keys of its own.
const outcomes = JSON.parse(await fs.readFile(path.join(root, "src/cli/outcomes.json"), "utf8"));
/** @param {any} row */
const objectOf = (row) => {
  const keys = row.keys?.map((/** @type {string} */ key) =>
    key === "code" && row.code ? `"code": "${row.code}"` : `"${key}"`,
  );
  return `\`{ ${[`"ok": ${row.ok}`, ...(keys ?? ["..."])].join(", ")} }\``;
};
const outcomesTable = () =>
  table(
    ["Exit status", "Outcome", "Means", "With `--json`"],
    Object.entries(outcomes).map(([name, row]) => [
      String(row.status),
      name,
      row.meaning,
      objectOf(row),
    ]),
  );
// The refusals reference's sentence on the failed outcomes: each one's status, with the code it prints, or every code
// of the registry's section its code comes from.
const failedStatuses = () => {
  const each = Object.values(outcomes)
    .filter((row) => !row.ok)
    .map((row) => `${row.status} for ${row.code ? `\`${row.code}\`` : `every ${row.section}`}`);
  return `A failed command names one code of the first table and exits with the status of its outcome: ${new Intl.ListFormat("en-GB").format(each)}.`;
};

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
/** The synopses under the role that runs them, as the help groups them: a group's line, then its commands. */
const byRole = () =>
  leaves(program).flatMap(([words, command], index, all) => {
    const group = program.commands.find(({ name }) => name === words[0]).group;
    const opens =
      index === 0 ||
      program.commands.find(({ name }) => name === all[index - 1][0][0]).group !== group;
    return [...(opens ? [`# ${group}`] : []), synopsis(words, command)];
  });
const usageBlock = () =>
  [
    "```text",
    ...byRole(),
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
// The schema's enumerations that a table of the source owns, each filled in from that table: its members in the
// table's order, and its default where the table states one. The units that draw read these tables and not the model,
// so a table, not the schema, is their one statement; the schema states the palettes' default itself, which only the
// model reads.
const SETS = [
  {
    at: "/properties/kinds/additionalProperties/properties/category",
    from: "src/categories.json",
    members: (/** @type {any} */ table) => Object.keys(table.categories),
    default: (/** @type {any} */ table) => table.kindless,
  },
  {
    at: "/properties/edition/properties/palette/oneOf/0",
    from: "src/house.json",
    members: (/** @type {any} */ table) => Object.keys(table.palettes),
  },
  {
    at: "/properties/locale",
    from: "src/locales.json",
    members: (/** @type {any} */ table) => table.languages,
    default: (/** @type {any} */ table) => table.default,
  },
];
/** Each table of the source the writer reads, parsed once by its path. */
const tables = new Map();
const tableOf = async (/** @type {string} */ file) => {
  if (!tables.has(file))
    tables.set(file, JSON.parse(await fs.readFile(path.join(root, file), "utf8")));
  return tables.get(file);
};
for (const set of SETS) {
  const node = set.at
    .split("/")
    .slice(1)
    .reduce((/** @type {any} */ value, key) => value?.[key], schema);
  if (!Array.isArray(node?.enum))
    throw new Error(`references_set_missing: the schema states no enumeration at ${set.at}`);
  const table = await tableOf(set.from);
  node.enum = set.members(table);
  if (set.default) node.default = set.default(table);
}
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
      ["A status", `one of ${schema.$defs.status.enum.map(code).join(", ")}`],
      [
        "A detail's name",
        `matches ${code(schema.$defs.details.propertyNames.pattern)}: no colon or line feed, and not digits alone`,
      ],
      [
        "A path",
        `${schema.$defs.path.minLength} to ${schema.$defs.path.maxLength} characters, counted as in a text, relative, with no backslash, line feed, carriage return or NUL, and no empty, \`.\` or \`..\` segment`,
      ],
    ],
  );

// The top-level fields of a model, as its schema states them: each field in the schema's order, whether it is
// required, and its meaning, which is the schema's description (the help an editor shows) with what the schema states
// of its value: a constant, the values it takes with the default, or the fewest items of a list.
const topFieldsTable = () =>
  table(
    ["Field", "Required", "Meaning"],
    Object.entries(schema.properties).map(([name, /** @type {any} */ field]) => {
      const required = schema.required.includes(name);
      const list = field.type === "array";
      const values = [
        ...(field.enum ? [`One of ${field.enum.map(code).join(", ")}`] : []),
        ...(field.default === undefined ? [] : [`${code(String(field.default))} by default`]),
      ];
      const meaning = [
        ...(field.const === undefined ? [] : [`Always ${code(String(field.const))}.`]),
        ...(field.description ? [field.description] : []),
        ...(values.length ? [`${values.join("; ")}.`] : []),
        ...(list && field.minItems
          ? [`At least ${field.minItems === 1 ? "one" : field.minItems}.`]
          : []),
        ...(list && !field.minItems && required ? ["May be empty."] : []),
      ].join(" ");
      if (!field.description && field.const === undefined)
        throw new Error(
          `references_description_missing: the schema's field ${name} says nothing of itself`,
        );
      return [code(name), required ? "yes" : "no", meaning];
    }),
  );

// The categories of a kind, as the schema states them with its default, and how each looks, as the table of looks
// states it (src/categories.json).
const looks = JSON.parse(await fs.readFile(path.join(root, "src/categories.json"), "utf8"));
const category = schema.properties.kinds.additionalProperties.properties.category;
const categoriesTable = () =>
  table(
    ["Category", "Default icon", "Drawn as"],
    category.enum.map((/** @type {string} */ name) => {
      const look = looks.categories[name];
      const drawn = [
        ...(look.outside ? ["outside the system boundary"] : []),
        `Archify's ${code(look.archify)} type`,
        ...(look.accent ? ["on plates, in the palette's accent"] : []),
        // The tiers figure's band (src/layout/fill.mjs); its rule is the operations reference's to state.
        ...(look.spans
          ? [
              "on plates, a lone card at the top or foot of a figure may be drawn as a [band](operations.md#layout-and-media)",
            ]
          : []),
        ...(name === category.default ? ["the default"] : []),
      ].join("; ");
      return [code(name), code(look.icon), `${drawn[0].toUpperCase()}${drawn.slice(1)}.`];
    }),
  );

// The built-in palettes, in the house's order, with their names and what their colours are (src/house.json), and the
// default the schema states.
const house = await tableOf("src/house.json");
/** A field of the house the writer prints, refused by name when the house lacks it. */
const said = (/** @type {any} */ value, /** @type {string} */ where) => {
  if (typeof value !== "string" || !value)
    throw new Error(`references_text_missing: src/house.json states no ${where}`);
  return value;
};
const palette = schema.properties.edition.properties.palette;
const palettesTable = () =>
  table(
    ["`palette`", "Name", "Colours"],
    Object.entries(house.palettes).map(([id, /** @type {any} */ each]) => [
      code(id),
      `${each.name["zh-CN"]} ${each.name.en}`,
      id === palette.default
        ? `${said(each.colours, `colours of the palette ${id}`).replace(/\.$/u, "")}; the default.`
        : said(each.colours, `colours of the palette ${id}`),
    ]),
  );

// The rows of the table of lines (src/house.json): what each means, how a plate draws it, the question it answers,
// whether a work has tested it, and what a delivery's page does for it.
const drawn = (/** @type {any} */ row) => {
  if (row.dash) {
    const pattern = `dashes of ${row.dash[0]} px, gaps of ${row.dash[1]} px`;
    return row.stroke ? `${pattern}; ${row.stroke} px` : pattern;
  }
  if (row.factor)
    return `continuous, ${row.factor} × the relation's weight; arrowhead ${row.arrow} × as large`;
  return "stroke" in row ? `continuous, ${row.stroke} px` : "a number";
};
const linesTable = () =>
  table(
    ["Row", "Means", "Drawn on a plate", "Answers", "Tested by a work", "On the page"],
    Object.entries(house.lines.rows).map(([id, /** @type {any} */ row]) => [
      code(id),
      said(row.meaning, `meaning of the line row ${id}`),
      drawn(row),
      said(row.answers, `question of the line row ${id}`),
      row.tested ? "yes" : "not yet tested by a work",
      said(row.page, `page of the line row ${id}`),
    ]),
  );

// A refusal as the terminal shows it: the command line run on the reference's sample model (refused-model.json, whose
// second component misspells its label), with no colour, as the writer runs it for the commands. Only the refusal the
// sample is built for is written: an accepted sample, a refusal of something else (a bundled supply that differs from
// its manifest) and a failure each stop the writer, naming what the command printed.
const refusalSample = async () => {
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-references-sample-"));
  try {
    await fs.copyFile(
      path.join(root, "docs/reference/refused-model.json"),
      path.join(scratch, "model.json"),
    );
    const run = spawnSync(
      process.execPath,
      [path.join(root, "src/cli/main.mjs"), "check", "model.json"],
      {
        cwd: scratch,
        encoding: "utf8",
        timeout: 60_000,
        env: { PATH: process.env.PATH ?? "", NO_COLOR: "1" },
      },
    );
    const printed = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim();
    if (run.status === outcomes.done.status)
      throw new Error("references_sample_accepted: the sample model was not refused");
    if (run.status !== outcomes.refused.status)
      throw new Error(
        `references_sample_unreadable: archpub check ended with ${run.status ?? run.signal ?? run.error}: ${printed}`,
      );
    if (!run.stdout.includes("model_invalid"))
      throw new Error(
        `references_sample_unexpected: archpub check refused something else: ${printed}`,
      );
    return ["```text", run.stdout.trimEnd(), "```"].join("\n");
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
};
const refusalBlock = await refusalSample();

const BLOCKS = [
  {
    file: "docs/reference/model.md",
    name: "fields",
    source: "src/model/schema.json",
    text: topFieldsTable,
  },
  {
    file: "docs/reference/model.md",
    name: "vocabulary",
    source: "src/model/schema.json",
    text: vocabularyTable,
  },
  {
    file: "docs/reference/model.md",
    name: "categories",
    source: "src/model/schema.json and src/categories.json",
    text: categoriesTable,
  },
  {
    file: "docs/reference/model.md",
    name: "palettes",
    source: "src/house.json and src/model/schema.json",
    text: palettesTable,
  },
  {
    file: "docs/reference/lines.md",
    name: "lines",
    source: "src/house.json",
    text: linesTable,
  },
  {
    file: "docs/reference/command-line.md",
    name: "outcomes",
    source: "src/cli/outcomes.json",
    text: outcomesTable,
  },
  {
    file: "docs/reference/command-line.md",
    name: "refusal",
    source: "archpub check on docs/reference/refused-model.json",
    text: () => refusalBlock,
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
    name: "statuses",
    source: "src/cli/outcomes.json",
    text: failedStatuses,
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
await settle("src/model/schema.json", "json", JSON.stringify(schema, null, 2));
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
