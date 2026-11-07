import fs from "node:fs/promises";
import path from "node:path";
import { buildDelivery, checkModel, scaffoldGuide } from "../build.mjs";
import { acceptDelivery, publishDelivery } from "../delivery.mjs";
import { importLikeC4 } from "../importers/likec4.mjs";
import { migrateModel } from "../importers/model.mjs";
import { Refusal } from "../refusal.mjs";

export const USAGE = `Usage:
  archpub build <model.json> --out <directory> [build options] [--json]
  archpub check <model.json> [build options] [--against <revision>] [--json]
  archpub import likec4 <workspace> --out <model.json> --id <id> [--title <text>]
    [--question <text>] [--locale <tag>] [--json]
  archpub scaffold guide <model.json> --out <directory> [--json]
  archpub migrate <model.json> --out <model.json> [--json]
  archpub accept <delivery> --reviewer <name> [--note <text>] [--json]
  archpub publish <delivery> --to <root> [--version <name>] [--json]
  archpub --help | --version

Build options:
  --repo <checkout>     Resolve and verify the model's files in this Git checkout.
  --media <list>        Media to deliver: edition, the print edition with its images,
                        and page (default both).
  --png <widths>        Widths of the edition's images, comma-separated (default 2400).
  --quality <profile>   The page's quality: showcase (default) or standard.

Check options:
  --against <revision>  With --repo, compare the model's revision with this one.
`;

class UsageError extends Error {}

/** "1 view", "2 views". */
const count = (number, noun) => `${number} ${noun}${number === 1 ? "" : "s"}`;

/** "a", "a and b", "a, b and c". */
const series = (items) =>
  items.length === 1 ? items[0] : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/** What a check found, as lines: admission, statements, coverage and currency. */
function checkText(result) {
  const lines = [
    `${result.model.id}: ${result.views.length} views admitted; files ${result.sources.state}.`,
  ];
  const statements = ({ components, relations }) =>
    `${count(components.length, "component")} and ${count(relations.length, "relation")}`;
  for (const [name, found] of Object.entries(result.statements))
    if (found.components.length || found.relations.length)
      lines.push(`${name[0].toUpperCase()}${name.slice(1)}: ${statements(found)}.`);
  const { coverage } = result;
  if (coverage) {
    const { files } = coverage;
    lines.push(
      `Coverage at ${coverage.revision.slice(0, 7)}: ${files.owned} of ${files.scope} files owned, ` +
        `${files.uncovered} uncovered, ${files.excluded} excluded.`,
    );
    if (coverage.largestUncovered.length)
      lines.push(
        `Largest uncovered: ${coverage.largestUncovered.map(({ path: directory, files: held }) => `${directory} (${count(held, "file")})`).join(", ")}.`,
      );
    const notes = [
      ...(coverage.unmatched.length ? [`Matching no file: ${coverage.unmatched.join(", ")}.`] : []),
      ...(coverage.citedOutsideScope.length
        ? [`Cited outside the scope: ${count(coverage.citedOutsideScope.length, "file")}.`]
        : []),
    ];
    if (notes.length) lines.push(notes.join(" "));
    const { currency } = coverage;
    if (currency) {
      const states = ["unchanged", "modified", "moved", "deleted"].map((state, index) => {
        const held = currency.files.filter((file) => file.state === state).length;
        return index ? `${held} ${state}` : `${count(held, "file")} ${state}`;
      });
      lines.push(
        `Currency against ${currency.against.revision} at ${currency.against.commit.slice(0, 7)}: ` +
          `${count(currency.commits, "commit")} since the pin` +
          `${currency.ancestor ? "" : ", which is not its ancestor"}; ${series(states)}.`,
      );
      lines.push(...worklistLines(currency.worklist, currency.against.commit));
    }
  }
  return `${lines.join("\n")}\n`;
}

/** A cited range as `10:12`, or nothing for a whole file. */
const range = (lines) => (lines ? ` ${lines[0]}:${lines[1]}` : "");

/**
 * The re-pin worklist as indented lines: each component with what changed in its files, the
 * relations whose files changed, what a build at the named commit refuses, the newly uncovered
 * files and every guide citation that is not the same.
 */
function worklistLines(worklist, commit) {
  const lines = ["Re-pin worklist:"];
  for (const { id, label, modified, moved, deleted, taken } of worklist.components) {
    const parts = [
      ...(modified.length ? [`${modified.length} modified`] : []),
      ...moved.map(
        ({ path: file, to, owner }) =>
          `${file} moved to ${to}, ${owner ? `owned by ${owner}` : "under no claim"}`,
      ),
      ...deleted.map((file) => `${file} deleted`),
      ...(taken.length ? [`takes in ${series(taken)}`] : []),
    ];
    lines.push(`  ${label} (${id}): ${parts.join("; ")}.`);
  }
  if (worklist.relations.length)
    lines.push(
      `  Relations whose files changed: ${series(worklist.relations.map(({ id, files }) => `${id} (${count(files.length, "file")})`))}.`,
    );
  if (worklist.refused.length)
    lines.push(
      `  Refused at ${commit.slice(0, 7)}: ${worklist.refused
        .map((entry) =>
          entry.code === "claim_unmatched"
            ? `${entry.claim} of ${entry.component} owns no file`
            : `${entry.file} of ${entry.relation} is gone${entry.to ? `, moved to ${entry.to}` : ""}`,
        )
        .join("; ")}.`,
    );
  if (worklist.uncovered.length) lines.push(`  Newly uncovered: ${series(worklist.uncovered)}.`);
  if (worklist.citations.length) {
    const fates = ["same", "shifted", "moved", "touched", "gone"]
      .map((fate) => [fate, worklist.citations.filter((citation) => citation.fate === fate).length])
      .filter(([, held]) => held)
      .map(([fate, held]) => `${held} ${fate}`);
    lines.push(`  Guide citations: ${worklist.citations.length}: ${series(fates)}.`);
    for (const { fate, where, path: file, lines: cited, to, at } of worklist.citations)
      if (fate !== "same")
        lines.push(
          `    ${fate}: ${where} ${file}${range(cited)}${at || to ? ` to${to ? ` ${to}` : ""}${range(at)}` : ""}`,
        );
  }
  if (lines.length === 1) lines[0] = "Re-pin worklist: nothing changes for the model.";
  return lines;
}

/** A comma-separated option value as its items. */
const list = (value) =>
  value === undefined ? undefined : value.split(",").map((item) => item.trim());

/** The build options a command line names. */
function buildArguments(options) {
  const widths = list(options.png);
  if (widths?.some((width) => !/^\d+$/u.test(width)))
    throw new UsageError("--png takes whole pixel widths separated by commas.");
  return {
    repo: options.repo ?? null,
    media: list(options.media),
    png: widths?.map(Number),
    quality: options.quality,
  };
}

/** The publisher's version, as its package declares it. */
async function version() {
  const manifest = JSON.parse(
    await fs.readFile(new URL("../../package.json", import.meta.url), "utf8"),
  );
  return manifest.version;
}

/** Split arguments, without `--json`, into positionals and `--name value` options. */
function parseArguments(args, allowed) {
  const positionals = [];
  /** @type {Record<string, string>} */
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith("--")) {
      const name = arg.slice(2);
      if (!allowed.includes(name)) throw new UsageError(`Unknown option ${arg}.`);
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--"))
        throw new UsageError(`${arg} needs a value.`);
      options[name] = value;
      index += 1;
    } else positionals.push(arg);
  }
  return { positionals, options };
}

function required(options, name) {
  if (options[name] === undefined) throw new UsageError(`--${name} is required.`);
  return options[name];
}

function one(positionals, what) {
  if (positionals.length !== 1) throw new UsageError(`Name exactly one ${what}.`);
  return positionals[0];
}

const COMMANDS = {
  build: {
    options: ["out", "repo", "media", "png", "quality"],
    run: ({ positionals, options }) =>
      buildDelivery(one(positionals, "model"), required(options, "out"), buildArguments(options)),
    text: (result) => {
      const media = [
        ...(result.media.includes("edition")
          ? [`the print edition of ${count(result.plates, "plate")}`]
          : []),
        ...(result.media.includes("page") ? ["the page"] : []),
      ];
      return `Built ${count(result.views.length, "view")} as ${series(media)} into ${result.out}.\n`;
    },
  },
  check: {
    options: ["repo", "media", "png", "quality", "against"],
    run: ({ positionals, options }) => {
      const model = one(positionals, "model");
      if (options.against !== undefined && options.repo === undefined)
        throw new UsageError("--against needs --repo.");
      return checkModel(model, { ...buildArguments(options), against: options.against ?? null });
    },
    text: checkText,
  },
  accept: {
    options: ["reviewer", "note"],
    run: ({ positionals, options }) =>
      acceptDelivery(one(positionals, "delivery"), {
        reviewer: required(options, "reviewer"),
        note: options.note ?? null,
      }),
    text: (result) => `Accepted ${result.directory} for ${result.reviewer}.\n`,
  },
  publish: {
    options: ["to", "version"],
    run: ({ positionals, options }) =>
      publishDelivery(one(positionals, "delivery"), required(options, "to"), {
        version: options.version ?? null,
      }),
    text: (result) => `${result.copied ? "Published" : "Already published"} ${result.target}.\n`,
  },
  "scaffold guide": {
    options: ["out"],
    run: ({ positionals, options }) =>
      scaffoldGuide(one(positionals, "model"), required(options, "out")),
    text: (result) =>
      `Wrote ${result.draft} and ${count(result.files.length, "diagram")} into ${result.out}.\n`,
  },
  migrate: {
    options: ["out"],
    run: async ({ positionals, options }) => {
      const out = required(options, "out");
      const { model, moved } = await migrateModel(one(positionals, "model"));
      await fs
        .writeFile(out, `${JSON.stringify(model, null, 2)}\n`, { flag: "wx" })
        .catch((error) => {
          if (error.code !== "EEXIST") throw error;
          throw new Refusal("migrate_output_exists", `${out} already exists.`);
        });
      const tally = (items) => items.reduce((sum, { files = [] }) => sum + files.length, 0);
      return {
        out: path.resolve(out),
        claims: tally(model.components),
        cited: tally(model.relations),
        moved,
      };
    },
    text: (result) =>
      `Wrote ${result.out}: components claim ${count(result.claims, "file")}, relations cite ${count(result.cited, "file")}.\n${result.moved.map((entry) => `kept with ${entry.owner}: ${entry.path}, no longer cited by ${series(entry.components)}\n`).join("")}`,
  },
  "import likec4": {
    options: ["out", "id", "title", "question", "locale"],
    run: async ({ positionals, options }) => {
      const out = required(options, "out");
      const result = await importLikeC4(one(positionals, "workspace"), {
        id: required(options, "id"),
        title: options.title,
        question: options.question,
        locale: options.locale,
      });
      await fs
        .writeFile(out, `${JSON.stringify(result.model, null, 2)}\n`, { flag: "wx" })
        .catch((error) => {
          if (error.code !== "EEXIST") throw error;
          throw new Refusal("import_output_exists", `${out} already exists.`);
        });
      return {
        out: path.resolve(out),
        components: result.model.components.length,
        relations: result.model.relations.length,
        warnings: result.warnings,
      };
    },
    text: (result) =>
      `Wrote ${result.out} with ${result.components} components and ${result.relations} relations.\n${result.warnings.map((warning) => `warning: ${warning.path}: ${warning.message}\n`).join("")}`,
  },
};

/**
 * Run one command. Exit status 0 means success, 1 a refused input, 2 a usage
 * error and 3 an internal error, any other failure, such as a file the command
 * cannot read or write.
 * @param {string[]} args
 * @returns {Promise<{ exitCode: number, output: string }>}
 */
export async function runCli(args) {
  const json = args.includes("--json");
  const words = args.filter((arg) => arg !== "--json");
  if (words.length === 1 && ["--help", "-h", "help"].includes(words[0]))
    return {
      exitCode: 0,
      output: json ? `${JSON.stringify({ ok: true, usage: USAGE })}\n` : USAGE,
    };
  if (words.length === 1 && words[0] === "--version") {
    const current = await version();
    return {
      exitCode: 0,
      output: json ? `${JSON.stringify({ ok: true, version: current })}\n` : `${current}\n`,
    };
  }
  // `import` and `scaffold` name what they import or write as a second word.
  const paired = ["import", "scaffold"].includes(words[0]);
  const name = paired ? `${words[0]} ${words[1] ?? ""}` : words[0];
  const rest = words.slice(paired ? 2 : 1);
  const command = COMMANDS[/** @type {keyof typeof COMMANDS} */ (name)];
  try {
    if (!command) throw new UsageError(name ? `Unknown command ${name}.` : "Name a command.");
    const result = await command.run(parseArguments(rest, command.options));
    return {
      exitCode: 0,
      output: json
        ? `${JSON.stringify({ ok: true, ...result })}\n`
        : command.text(/** @type {any} */ (result)),
    };
  } catch (error) {
    if (error instanceof UsageError)
      return {
        exitCode: 2,
        output: json
          ? `${JSON.stringify({ ok: false, code: "usage", message: error.message })}\n`
          : `${error.message}\n\n${USAGE}`,
      };
    if (error instanceof Refusal) {
      const body = {
        ok: false,
        code: error.code,
        message: error.message,
        problems: error.problems,
      };
      const text = `${error.message}\n${error.problems.map((problem) => `  ${problem.path ?? ""} ${problem.message}`.trimEnd() + "\n").join("")}`;
      return { exitCode: 1, output: json ? `${JSON.stringify(body)}\n` : text };
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
      exitCode: 3,
      output: json
        ? `${JSON.stringify({ ok: false, code: "internal_error", message })}\n`
        : `Internal error: ${message}\n`,
    };
  }
}
