import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters, styleText } from "node:util";
import { Command, CommanderError, InvalidArgumentError } from "commander";
import { PNG_WIDTHS, buildDelivery, checkModel, scaffoldGuide } from "../build.mjs";
import {
  acceptDelivery,
  compareDeliveries,
  publishDelivery,
  verifyAcceptance,
} from "../delivery.mjs";
import { importLikeC4 } from "../importers/likec4.mjs";
import { MIGRATION, migrateModel } from "../importers/model.mjs";
import { ACCEPTANCE, SIGNATURE } from "../names.mjs";
import { Refusal } from "../refusal.mjs";
import { OUTCOMES, resultOf } from "./outcome.mjs";
import { reportFailure, reportProgress, reportRefusal, reportResult } from "./report.mjs";

/** The publisher's version, as its package declares it. */
async function version() {
  const manifest = JSON.parse(
    await fs.readFile(new URL("../../package.json", import.meta.url), "utf8"),
  );
  return manifest.version;
}

/** The agent Skill this version carries, beside its source. */
const SKILL = fileURLToPath(
  new URL("../../skills/architecture-publisher/SKILL.md", import.meta.url),
);

/** A comma-separated option value as its items. */
const list = (value) => value.split(",").map((item) => item.trim());

/** The widths `--png` names, as numbers. */
function pixelWidths(value) {
  const widths = list(value);
  if (widths.some((width) => !/^\d+$/u.test(width)))
    throw new InvalidArgumentError("Give whole pixel widths separated by commas.");
  return widths.map(Number);
}

/** The build options a command line names. */
const buildArguments = (options) => ({
  repo: options.repo ?? null,
  media: options.media,
  png: options.png,
  quality: options.quality,
});

/** A command's name with those of the commands above it, as `archpub scaffold guide`. */
const fullName = (command) =>
  command.parent ? `${fullName(command.parent)} ${command.name()}` : command.name();

/** The command the help lists for a group that holds one, as `guide` for `scaffold`; any other command is itself. */
const listed = (command) => command.commands.find((held) => held.name() !== "help") ?? command;

/**
 * Write a new file, refusing with `code` when one is already there.
 * @param {string} file
 * @param {string} text
 * @param {import("../refusal.mjs").Code} code
 */
async function writeNew(file, text, code) {
  await fs.writeFile(file, text, { flag: "wx" }).catch((error) => {
    if (error.code !== "EEXIST") throw error;
    throw new Refusal(code, `${file} already exists.`);
  });
}

/**
 * The commands, their options and their help, grouped by the role that runs them. Each command hands what it
 * returns to `action`, a check and a build tell `listener` their steps, and commander writes its help, the
 * version and every usage error through `write`.
 * @param {{
 *   version: string,
 *   write: (text: string) => void,
 *   action: (name: string, run: (...given: any[]) => Promise<object>) => (...given: any[]) => Promise<void>,
 *   listener: ((step: string) => void) | undefined,
 * }} seam
 */
function commands({ version: current, write, action, listener }) {
  const program = new Command("archpub")
    .description(
      "Publish a repository's architecture model as a print edition and an interactive page, each part checked against one commit.",
    )
    .version(current, "-V, --version", "print the version")
    .commandsGroup("Every role:")
    .helpCommand("help [command]", "Print a command's usage, what it does and the options it takes")
    .enablePositionalOptions()
    .exitOverride()
    .configureOutput({ writeOut: write, writeErr: write })
    .showHelpAfterError("(archpub --help lists the commands)")
    .configureHelp({
      styleTitle: (title) => styleText("bold", title),
      styleCommandText: (text) => styleText("cyan", text),
      styleSubcommandText: (text) => styleText("cyan", text),
      subcommandTerm: (command) => {
        const held = listed(command);
        const name = held === command ? command.name() : `${command.name()} ${held.name()}`;
        // The list names a command and its arguments; its own help adds the options it cannot run without.
        return `${name} ${held.usage().replace(/^.*\[options\] ?/u, "")}`.trimEnd();
      },
      subcommandDescription: (command) => listed(command).description(),
    })
    .addHelpText(
      "afterAll",
      `\nExit status: ${Object.entries(OUTCOMES)
        .map(([outcome, { status }]) => `${status} ${outcome}`)
        .join(", ")}.`,
    );

  /** A command under `parent` whose usage errors say where its usage is. */
  const command = (parent, name, summary) => {
    const made = parent.command(name).description(summary);
    return made.showHelpAfterError(`(${fullName(made)} --help explains the command)`);
  };
  /**
   * The options that say what a build delivers, which a check takes too. Each command gives the verbs for what it
   * does with the media and with the edition's images: a build delivers and draws, a check checks and plans.
   */
  const withBuildOptions = (made, does) =>
    made
      .option("--repo <checkout>", "resolve and verify the model's files in this Git checkout")
      .option(
        "--media <list>",
        `${does.media} these media, separated by commas: edition (the print edition with its images) and page; both by default`,
        list,
      )
      .option(
        "--png <widths>",
        `${does.images} the edition's images at these widths in pixels, separated by commas; ${PNG_WIDTHS[0]} by default`,
        pixelWidths,
      )
      .option(
        "--quality <profile>",
        "hold the page to this quality: showcase or standard; showcase by default",
      );

  program.commandsGroup("Author:");
  withBuildOptions(
    command(
      program,
      "check",
      "Check a model as a build would, verifying its files with --repo, and write nothing",
    ).argument("<model.json>", "the model to check"),
    { media: "check", images: "plan" },
  )
    .option("--against <revision>", "compare the model's revision with this one; needs --repo")
    .action(
      action("check", async (model, options, made) => {
        if (options.against !== undefined && options.repo === undefined)
          made.error("error: option '--against <revision>' needs '--repo <checkout>'");
        return checkModel(
          model,
          { ...buildArguments(options), against: options.against ?? null },
          listener,
        );
      }),
    );
  withBuildOptions(
    command(
      program,
      "build",
      "Check a model as check does and write its delivery into a new directory",
    )
      .argument("<model.json>", "the model to build")
      .requiredOption("--out <directory>", "write the delivery into this new directory"),
    { media: "deliver", images: "draw" },
  ).action(
    action("build", (model, options) =>
      buildDelivery(model, options.out, buildArguments(options), listener),
    ),
  );
  const scaffold = program
    .command("scaffold")
    .description("Write a starting point for an authored part");
  command(
    scaffold,
    "guide",
    "Write the guide the publisher generates for a model, as a draft to edit",
  )
    .argument("<model.json>", "the model to write a guide for")
    .requiredOption("--out <directory>", "write the guide into this new directory")
    .action(action("scaffold guide", (model, options) => scaffoldGuide(model, options.out)));
  const importer = program.command("import").description("Write a model from another notation");
  command(
    importer,
    "likec4",
    "Write a model from a LikeC4 workspace, naming each construct it cannot represent",
  )
    .argument("<workspace>", "the directory of the LikeC4 workspace")
    .requiredOption("--out <model.json>", "write the model into this new file")
    .requiredOption("--id <id>", "give the model this id")
    .option("--title <text>", "give the model this title")
    .option("--question <text>", "give the model this question to answer")
    .option("--locale <tag>", "write the model in the language of this locale")
    .action(
      action("import likec4", async (workspace, options) => {
        const { out, id, title, question, locale } = options;
        const result = await importLikeC4(workspace, { id, title, question, locale });
        await writeNew(out, `${JSON.stringify(result.model, null, 2)}\n`, "import_output_exists");
        return {
          out: path.resolve(out),
          components: result.model.components.length,
          relations: result.model.relations.length,
          warnings: result.warnings,
        };
      }),
    );
  command(
    program,
    "migrate",
    `Write a version ${MIGRATION.from.join(" or ")} model as version ${MIGRATION.to} into a new file`,
  )
    .argument("<model.json>", "the model to migrate")
    .requiredOption("--out <model.json>", "write the model into this new file")
    .action(
      action("migrate", async (input, { out }) => {
        const { model, moved } = await migrateModel(input);
        await writeNew(out, `${JSON.stringify(model, null, 2)}\n`, "migrate_output_exists");
        const tally = (items) => items.reduce((sum, { files = [] }) => sum + files.length, 0);
        return {
          out: path.resolve(out),
          claims: tally(model.components),
          cited: tally(model.relations),
          moved,
        };
      }),
    );

  program.commandsGroup("Reviewer:");
  command(
    program,
    "compare",
    "Report which files of two deliveries differ in bytes, plate by plate, and write nothing",
  )
    .argument("<delivery>", "the first delivery's directory")
    .argument("<delivery>", "the second delivery's directory")
    .addHelpText(
      "after",
      [
        "",
        "Each delivery is first checked against its own manifest. Every file a manifest",
        "lists is compared, and the manifest itself. A delivery's acceptance record, its",
        "signature and its colophon page are not compared: accepting writes them after",
        "the build. Two builds of one model are the same bytes only when one platform",
        "built them with one date source.",
      ].join("\n"),
    )
    .action(action("compare", (first, second) => compareDeliveries(first, second)));
  command(
    program,
    "accept",
    "Record a named reviewer's acceptance of an unchanged delivery and set its colophon page",
  )
    .argument("<delivery>", "the delivery's directory")
    .requiredOption("--reviewer <name>", "name this reviewer in the acceptance")
    .option(
      "--seal-name <name>",
      "set this name in the seal in place of the reviewer's; the edition's typefaces must hold its characters",
    )
    .option("--note <text>", "record this note in the acceptance")
    .option(
      "--sign <key>",
      `sign ${ACCEPTANCE} into ${SIGNATURE} with this SSH key, or the key ssh-agent holds for this public key`,
    )
    .action(
      action("accept", (delivery, options) =>
        acceptDelivery(delivery, {
          reviewer: options.reviewer,
          sealName: options.sealName ?? null,
          note: options.note ?? null,
          sign: options.sign ?? null,
        }),
      ),
    );
  command(
    program,
    "verify",
    "Check an accepted delivery against its manifest, acceptance record and colophon page",
  )
    .argument("<delivery>", "the delivery's directory")
    .option(
      "--allowed-signers <file>",
      `check ${SIGNATURE} against ${ACCEPTANCE} for the reviewer with this ssh-keygen allowed signers file`,
    )
    .action(
      action("verify", (delivery, options) =>
        verifyAcceptance(delivery, { allowedSigners: options.allowedSigners ?? null }),
      ),
    );

  program.commandsGroup("Publisher:");
  command(program, "publish", "Copy an accepted delivery to <root>/<model id>/<version>/")
    .argument("<delivery>", "the delivery's directory")
    .requiredOption("--to <root>", "copy the delivery under this publication root")
    .option(
      "--version <name>",
      "publish under this version's name; the first twelve characters of the manifest's SHA-256 by default",
    )
    .action(
      action("publish", (delivery, options) =>
        publishDelivery(delivery, options.to, { version: options.version ?? null }),
      ),
    );

  program.commandsGroup("Every role:");
  command(
    program,
    "skill",
    "Print the agent Skill for writing, checking and publishing a model with this version",
  ).action(action("skill", async () => ({ file: SKILL, skill: await fs.readFile(SKILL, "utf8") })));

  /** The program and every command under it. */
  const every = (made) => [made, ...made.commands.flatMap(every)];
  for (const made of every(program)) {
    // `--json` is taken out before commander parses; it is declared so that every help lists it.
    made.option("--json", "print one machine-readable result");
    // An option a command cannot run without stands in its usage line and says so where it is explained.
    const required = made.options.filter((option) => option.mandatory);
    for (const option of required) option.description += " (required)";
    if (required.length)
      made.usage(`${required.map((option) => option.flags).join(" ")} ${made.usage()}`);
  }
  return program;
}

/**
 * A command as data, with the commands it holds: its name, the group the help lists it under, what it does, its
 * arguments and its options, as its help shows them. `--help --json` prints the program's beside the help's text,
 * so that an agent reads the commands without parsing that text; the reference's list of commands is written from
 * it (`tools/docs/references.mjs`).
 * @param {Command} command
 * @returns {Catalogue}
 * @typedef {{ name: string, usage: string, group?: string, description: string,
 *   arguments: Array<{ name: string, required: boolean, description: string }>,
 *   options: Array<{ flags: string, required: boolean, description: string }>,
 *   commands: Catalogue[] }} Catalogue
 */
function catalogue(command) {
  const help = command.createHelp();
  const group = command.helpGroup();
  return {
    name: command.name(),
    usage: command.usage(),
    ...(group ? { group: group.replace(/:$/u, "") } : {}),
    description: command.description(),
    arguments: help.visibleArguments(command).map((argument) => ({
      name: argument.name(),
      required: argument.required,
      description: argument.description,
    })),
    options: help.visibleOptions(command).map((option) => ({
      flags: option.flags,
      required: Boolean(option.mandatory),
      description: option.description,
    })),
    commands: help.visibleCommands(command).map(catalogue),
  };
}

/**
 * Run one command. How it ends, its outcome, sets the exit status, as the table
 * of outcomes states it (`outcome.mjs`). `--json` may stand anywhere and
 * selects one JSON object as the output, of the keys the outcome names; without
 * it the output is a report for a reader at a terminal. A check or a build
 * whose standard error is a terminal draws its steps there, unless `--json` is
 * given; the output is the same either way.
 * @param {string[]} args
 * @returns {Promise<{ exitCode: number, output: string }>}
 */
export async function runCli(args) {
  const json = args.includes("--json");
  /** What commander writes: a help, the version or a usage error. */
  let written = "";
  /** The command that ran, the argument it was given and what it returned. */
  const ran = {
    command: "",
    subject: /** @type {string | undefined} */ (undefined),
    typed: {},
    result: {},
  };
  /** @type {ReturnType<typeof reportProgress> | undefined} */
  let progress;
  const program = commands({
    listener:
      process.stderr.isTTY && !json
        ? (step) => {
            progress ??= reportProgress(`archpub ${ran.command}`, process.stderr);
            progress.step(step);
          }
        : undefined,
    version: await version(),
    write: (text) => {
      written += text;
    },
    action:
      (name, run) =>
      async (...given) => {
        // Commander hands over the arguments, then the options as they were typed, then the command itself.
        const [first] = given;
        Object.assign(ran, {
          command: name,
          subject: typeof first === "string" ? first : undefined,
          typed: given.at(-2),
        });
        ran.result = await run(...given);
      },
  });
  /**
   * What the command prints as it ends: its outcome's exit status, and with `--json` the outcome's JSON object of
   * what it ended with, otherwise its report, drawn only then.
   * @param {import("./outcome.mjs").Outcome} outcome
   * @param {object} ended what the command ended with: its result, its refusal or the message of its failure
   * @param {() => string} report
   */
  const end = (outcome, ended, report) => ({
    exitCode: OUTCOMES[outcome].status,
    output: json ? `${JSON.stringify(resultOf(outcome, ended))}\n` : report(),
  });
  try {
    await program.parseAsync(
      args.filter((arg) => arg !== "--json"),
      { from: "user" },
    );
    progress?.done();
    return end("done", ran.result, () =>
      reportResult(ran.command, ran.result, ran.subject, process.stdout, ran.typed),
    );
  } catch (error) {
    progress?.stopped();
    // Commander ends with its own exit code 0 when it has written the help or the version.
    if (error instanceof CommanderError && error.exitCode === 0) {
      const body =
        error.code === "commander.version"
          ? { version: error.message }
          : { usage: stripVTControlCharacters(written), commands: catalogue(program) };
      return end("done", body, () => written);
    }
    if (error instanceof CommanderError) {
      // Asked for no command, commander writes the help and names no error.
      const unnamed = error.code === "commander.help";
      const message = unnamed ? "a command is required" : error.message.replace(/^error: /u, "");
      return end("usage", { message }, () => `${unnamed ? `error: ${message}\n\n` : ""}${written}`);
    }
    if (error instanceof Refusal)
      return end("refused", error, () =>
        reportRefusal(ran.command, error, process.stdout, ran.subject),
      );
    const message = error instanceof Error ? error.message : String(error);
    return end("internal", { message }, () =>
      reportFailure(ran.command, message, process.stdout, ran.subject),
    );
  }
}
