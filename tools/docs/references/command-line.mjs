// The blocks references.mjs writes from the command line's sources: how a command ends (src/cli/outcomes.json), the
// codes it raises or reports (src/refusal.json), its commands as it catalogues them (`archpub --help --json`) and a
// refusal as the terminal shows it.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { code, listed, readJson, table } from "./text.mjs";

/** @param {readonly string[]} codes */
const named = (codes) => codes.map(code).join(", ");

/**
 * The command line's blocks, read from the tree at `root`.
 * @param {string} root
 */
export async function commandLineBlocks(root) {
  const { engines } = await readJson(root, "package.json");
  /** A registered meaning as the reference prints it: `{typst}` is the Typst release the package needs. */
  const meant = (/** @type {string} */ text) => text.replaceAll("{typst}", engines?.typst);

  // The registry holds each code once; a code `with` another shares that code's row, in the registry's order.
  const registry = await readJson(root, "src/refusal.json");
  const REFUSALS = [];
  for (const [each, entry] of Object.entries(registry)) {
    if (entry.with === undefined) REFUSALS.push({ ...entry, codes: [each] });
    else {
      const lead = REFUSALS.find((row) => row.codes[0] === entry.with);
      if (!lead)
        throw new Error(
          `references_registry_invalid: ${each} joins ${entry.with}, which leads no earlier row`,
        );
      lead.codes.push(each);
    }
  }
  /** @param {string[]} sections */
  const rowsOf = (...sections) => REFUSALS.filter((row) => sections.includes(row.section));

  // How a command ends, as the command line's table of outcomes states it (src/cli/outcomes.json), in the order of
  // the exit statuses: each outcome's status, its name as the help gives it, what it means and the JSON object
  // `--json` prints, `ok` first, a code the outcome fixes with its value, and `...` for the result of an outcome that
  // names no keys of its own.
  const outcomes = await readJson(root, "src/cli/outcomes.json");
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
  // The refusals reference's sentence on the failed outcomes: each one's status, with the code it prints, or every
  // code of the registry's section its code comes from.
  const failedStatuses = () => {
    const each = Object.values(outcomes)
      .filter((row) => !row.ok)
      .map((row) => `${row.status} for ${row.code ? `\`${row.code}\`` : `every ${row.section}`}`);
    return `A failed command names one code of the first table and exits with the status of its outcome: ${listed(each)}.`;
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
        { cause: error },
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

  // A refusal as the terminal shows it: the command line run on the reference's sample model (refused-model.json,
  // whose second component misspells its label), with no colour, as the writer runs it for the commands. Only the
  // refusal the sample is built for is written: an accepted sample, a refusal of something else (a bundled supply
  // that differs from its manifest) and a failure each stop the writer, naming what the command printed.
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

  return [
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
}
