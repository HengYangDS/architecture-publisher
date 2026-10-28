import path from "node:path";
import { buildDelivery, checkModel } from "../build.mjs";
import { acceptDelivery, publishDelivery } from "../delivery.mjs";
import { importLikeC4 } from "../importers/likec4.mjs";
import { Refusal } from "../refusal.mjs";

export const USAGE = `Usage:
  archpub build <model.json> --out <directory> [--repo <checkout>] [--json]
  archpub check <model.json> [--repo <checkout>] [--json]
  archpub import likec4 <workspace> --out <model.json> --id <id> [--title <text>] [--question <text>] [--json]
  archpub accept <delivery> --reviewer <name> [--note <text>] [--json]
  archpub publish <delivery> --to <root> [--version <name>] [--json]
`;

class UsageError extends Error {}

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
    options: ["out", "repo"],
    run: ({ positionals, options }) =>
      buildDelivery(one(positionals, "model"), required(options, "out"), {
        repo: options.repo ?? null,
      }),
    text: (result) => `Built ${result.views.length} views and the page into ${result.out}.\n`,
  },
  check: {
    options: ["repo"],
    run: ({ positionals, options }) =>
      checkModel(one(positionals, "model"), { repo: options.repo ?? null }),
    text: (result) =>
      `${result.model.id}: ${result.views.length} views admitted; sources ${result.sources.state}.\n`,
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
  "import likec4": {
    options: ["out", "id", "title", "question"],
    run: async ({ positionals, options }) => {
      const out = required(options, "out");
      const result = await importLikeC4(one(positionals, "workspace"), {
        id: required(options, "id"),
        title: options.title,
        question: options.question,
      });
      const { writeFile } = await import("node:fs/promises");
      await writeFile(out, `${JSON.stringify(result.model, null, 2)}\n`, { flag: "wx" }).catch(
        () => {
          throw new Refusal("import_output_exists", `${out} already exists.`);
        },
      );
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
 * Run one command. Exit status 0 means success, 1 a refused input, 2 a usage error.
 * @param {string[]} args
 * @returns {Promise<{ exitCode: number, output: string }>}
 */
export async function runCli(args) {
  const json = args.includes("--json");
  const words = args.filter((arg) => arg !== "--json");
  const name = words[0] === "import" ? `import ${words[1] ?? ""}` : words[0];
  const rest = words.slice(words[0] === "import" ? 2 : 1);
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
    throw error;
  }
}
