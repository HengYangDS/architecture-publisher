import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { stripVTControlCharacters } from "node:util";
import { runCli } from "../src/cli/run.mjs";
import { json } from "./fixtures/command-line.mjs";

test("usage errors exit with status 2 and say what is wrong", async () => {
  for (const [args, message] of [
    [[], "a command is required"],
    [["draw"], "unknown command 'draw'"],
    [["import"], "a command is required"],
    [["import", "mermaid"], "unknown command 'mermaid'"],
    [["check", "--color", "red"], "unknown option '--color'"],
    [["check", "model.json", "--repo"], "option '--repo <checkout>' argument missing"],
    [["verify"], "missing required argument 'delivery'"],
    [["compare", "delivery"], "missing required argument 'delivery'"],
    [
      ["verify", "delivery", "--allowed-signers"],
      "option '--allowed-signers <file>' argument missing",
    ],
    [["build", "model.json"], "required option '--out <directory>' not specified"],
    [["scaffold", "guide", "model.json"], "required option '--out <directory>' not specified"],
    [["scaffold", "page"], "unknown command 'page'"],
    [["check"], "missing required argument 'model.json'"],
    [
      ["check", "one.json", "two.json"],
      "too many arguments for 'check'. Expected 1 argument but got 2: one.json, two.json.",
    ],
    [["accept", "delivery", "--reviewer", "R", "--seal", "R"], "unknown option '--seal'"],
    [
      ["check", "model.json", "--against", "main"],
      "option '--against <revision>' needs '--repo <checkout>'",
    ],
    [["build", "model.json", "--out", "x", "--against", "main"], "unknown option '--against'"],
    [
      ["check", "model.json", "--png", "2400,wide"],
      "option '--png <widths>' argument '2400,wide' is invalid. Give whole pixel widths separated by commas.",
    ],
  ]) {
    const { exitCode, body } = await json(args);
    assert.equal(exitCode, 2, args.join(" "));
    assert.deepEqual(body, { ok: false, code: "usage", message }, args.join(" "));
  }
  // A reader at a terminal gets the same message, and where the usage is.
  assert.deepEqual(await runCli(["draw"]), {
    exitCode: 2,
    output: "error: unknown command 'draw'\n(archpub --help lists the commands)\n",
  });
  assert.deepEqual(await runCli(["build", "model.json"]), {
    exitCode: 2,
    output:
      "error: required option '--out <directory>' not specified\n(archpub build --help explains the command)\n",
  });
  assert.match((await runCli([])).output, /^error: a command is required\n\nUsage: archpub /u);
});

test("a mistyped command or option names the nearest one", async () => {
  for (const [args, message] of [
    [["chek", "model.json"], "unknown command 'chek'\n(Did you mean check?)"],
    [["scaffold", "guid", "model.json"], "unknown command 'guid'\n(Did you mean guide?)"],
    [
      ["build", "model.json", "--out", "x", "--qualty", "standard"],
      "unknown option '--qualty'\n(Did you mean --quality?)",
    ],
    [
      ["accept", "delivery", "--reviewer", "R", "--sgn", "key"],
      "unknown option '--sgn'\n(Did you mean --sign?)",
    ],
  ]) {
    assert.deepEqual(await json(args), {
      exitCode: 2,
      body: { ok: false, code: "usage", message },
    });
    const text = await runCli(args);
    assert.equal(text.exitCode, 2);
    assert.ok(text.output.startsWith(`error: ${message}\n`), text.output);
  }
});

/** The commands the help lists under each heading that ends in a colon. */
function listedCommands(help) {
  /** @type {Record<string, string[]>} */
  const groups = {};
  let heading = "";
  for (const line of help.split("\n")) {
    if (/^\S.*:$/u.test(line)) groups[(heading = line.slice(0, -1))] = [];
    else if (heading && /^ {2}\S/u.test(line))
      groups[heading].push(line.slice(2).split(/ [[<]| {2}/u)[0]);
  }
  return groups;
}

/**
 * What the help says of each term in its lists, by the heading it stands under: a term, two spaces or more, and
 * words that may run on below.
 */
function described(help) {
  /** @type {Map<string, { heading: string, words: string }>} */
  const terms = new Map();
  let heading = "";
  let term = "";
  for (const line of help.split("\n")) {
    const [, named, words] = /^ {2}(\S.*?) {2,}(\S.*)$/u.exec(line) ?? [];
    if (/^\S.*:$/u.test(line)) heading = line.slice(0, -1);
    if (named) terms.set((term = named), { heading, words });
    else if (term && /^ {3,}\S/u.test(line)) terms.get(term).words += ` ${line.trim()}`;
    else term = "";
  }
  return terms;
}

/** Each command with the options commander refuses it without. */
const REQUIRED = [
  [["check"], []],
  [["build"], ["--out <directory>"]],
  [["scaffold", "guide"], ["--out <directory>"]],
  [
    ["import", "likec4"],
    ["--out <model.json>", "--id <id>"],
  ],
  [["migrate"], ["--out <model.json>"]],
  [["compare"], []],
  [["accept"], ["--reviewer <name>"]],
  [["verify"], []],
  [["publish"], ["--to <root>"]],
  [["skill"], []],
];

test("the help words every command as a sentence and every option as a fragment, and marks a required option", async () => {
  const root = (await runCli(["--help"])).output;
  const helps = [root];
  for (const command of [...REQUIRED.map(([words]) => words), ["scaffold"], ["import"]])
    helps.push((await runCli([...command, "--help"])).output);
  for (const help of helps) {
    const terms = described(help);
    // --json is an option of the program and of every command, and the foot keeps the exit statuses alone.
    assert.deepEqual(
      terms.get("--json"),
      { heading: "Options", words: "print one machine-readable result" },
      help.split("\n")[0],
    );
    assert.doesNotMatch(help, /Every command takes/u);
    assert.match(help, /\n\nExit status: 0 done, 1 refused, 2 usage, 3 internal\.\n$/u);
    for (const [term, { heading, words }] of terms) {
      assert.doesNotMatch(words, /\.$/u, `${term}: ${words}`);
      // An option's words are a lower-case fragment, a command's a capitalised sentence.
      if (heading === "Options") assert.match(words, /^[a-z]/u, `${term}: ${words}`);
      else if (heading !== "Arguments") assert.match(words, /^[A-Z]/u, `${term}: ${words}`);
    }
  }
  // An option commander refuses a command without stands in the usage line and says so, and no other option does.
  const options = async (command) => described((await runCli([...command, "--help"])).output);
  for (const [command, required] of REQUIRED) {
    const [usage] = (await runCli([...command, "--help"])).output.split("\n");
    assert.match(
      usage,
      new RegExp(
        `^Usage: archpub ${command.join(" ")} ${required.map((term) => `${term} `).join("")}\\[options\\]`,
        "u",
      ),
    );
    assert.deepEqual(usage.match(/--[a-z-]+ <[^>]+>/gu) ?? [], required, usage);
    assert.deepEqual(
      [...(await options(command))]
        .filter(([, { words }]) => / \(required\)$/u.test(words))
        .map(([term]) => term),
      required,
      command.join(" "),
    );
    if (required.length)
      assert.equal(
        (await json([...command, "x"])).body.message,
        `required option '${required[0]}' not specified`,
      );
  }
  // The words the review settled.
  const accept = await options(["accept"]);
  assert.ok(accept.has("--sign <key>"));
  assert.equal(
    accept.get("--seal-name <name>").words,
    "set this name in the seal in place of the reviewer's; the edition's typefaces must hold its characters",
  );
  // A build says what it delivers and draws, and a check, which writes nothing, what it checks and names.
  const build = await options(["build"]);
  const check = await options(["check"]);
  assert.equal(
    build.get("--media <list>").words,
    "deliver these media, separated by commas: edition (the print edition with its images) and page; both by default",
  );
  assert.equal(
    check.get("--media <list>").words,
    "check these media, separated by commas: edition (the print edition with its images) and page; both by default",
  );
  assert.equal(
    build.get("--png <widths>").words,
    "draw the edition's images at these widths in pixels, separated by commas; 2400 by default",
  );
  assert.equal(
    check.get("--png <widths>").words,
    "plan the edition's images at these widths in pixels, separated by commas; 2400 by default",
  );
  // Every other option the two share is worded once.
  for (const term of ["--repo <checkout>", "--quality <profile>"])
    assert.equal(check.get(term).words, build.get(term).words, term);
  assert.doesNotMatch((await runCli(["check", "--help"])).output, /deliver|draw /u);
  assert.equal(
    (await options(["publish"])).get("--version <name>").words,
    "publish under this version's name; the first twelve characters of the manifest's SHA-256 by default",
  );
  assert.equal(
    described(root).get("scaffold guide <model.json>").words,
    "Write the guide the publisher generates for a model, as a draft to edit",
  );
  assert.equal(
    (await options(["scaffold", "guide"])).get("model.json").words,
    "the model to write a guide for",
  );
});

test("help groups the commands by the role that runs them, and version answers without a command", async () => {
  const help = await runCli(["--help"]);
  assert.equal(help.exitCode, 0);
  for (const flag of ["-h", "help"]) assert.deepEqual(await runCli([flag]), help);
  assert.deepEqual((await json(["--help"])).body, { ok: true, usage: help.output });
  assert.match(help.output, /^Usage: archpub \[options\] \[command\]\n/u);
  const { Options: options, ...roles } = listedCommands(help.output);
  // A heading names a role, never a kind of holder; what every role runs stands under one heading.
  assert.deepEqual(roles, {
    Author: ["check", "build", "scaffold guide", "import likec4", "migrate"],
    Reviewer: ["compare", "accept", "verify"],
    Publisher: ["publish"],
    "Every role": ["skill", "help"],
  });
  assert.deepEqual(options, ["-V, --version", "--json", "-h, --help"]);
  // Every line of the help fits a terminal of 80 columns.
  assert.deepEqual(
    help.output.split("\n").filter((line) => line.length > 80),
    [],
  );
  // The help says how an agent reads a result, and what each exit status means.
  assert.match(help.output, /--json/u);
  assert.match(help.output, /0 done, 1 refused, 2 usage, 3 internal/u);
  // Without a terminal the help carries no control sequence.
  assert.equal(stripVTControlCharacters(help.output), help.output);
  const manifest = JSON.parse(
    await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  for (const flag of ["--version", "-V"])
    assert.deepEqual(await runCli([flag]), { exitCode: 0, output: `${manifest.version}\n` });
  assert.deepEqual((await json(["--version"])).body, { ok: true, version: manifest.version });
});

test("each command explains itself with --help", async () => {
  for (const [args, usage] of [
    [["build"], "Usage: archpub build --out <directory> [options] <model.json>"],
    [["check"], "Usage: archpub check [options] <model.json>"],
    [["compare"], "Usage: archpub compare [options] <delivery> <delivery>"],
    [["accept"], "Usage: archpub accept --reviewer <name> [options] <delivery>"],
    [["verify"], "Usage: archpub verify [options] <delivery>"],
    [["publish"], "Usage: archpub publish --to <root> [options] <delivery>"],
    [["migrate"], "Usage: archpub migrate --out <model.json> [options] <model.json>"],
    [
      ["import", "likec4"],
      "Usage: archpub import likec4 --out <model.json> --id <id> [options] <workspace>",
    ],
    [
      ["scaffold", "guide"],
      "Usage: archpub scaffold guide --out <directory> [options] <model.json>",
    ],
    [["skill"], "Usage: archpub skill [options]"],
  ]) {
    const { exitCode, output } = await runCli([...args, "--help"]);
    assert.equal(exitCode, 0, args.join(" "));
    assert.equal(output.split("\n")[0], usage);
    assert.ok(!output.includes("archpub publish") || args[0] === "publish", args.join(" "));
    assert.deepEqual((await json([...args, "--help"])).body, { ok: true, usage: output });
    // `archpub help <command>` is the same help; it takes one word, so a command inside a group has `--help` alone.
    if (args.length === 1)
      assert.deepEqual(await runCli(["help", ...args]), { exitCode: 0, output }, args.join(" "));
  }
  // A command's build options are explained where it takes them.
  const build = (await runCli(["build", "--help"])).output;
  assert.match(build, /--repo <checkout> /u);
  assert.match(build, /--out <directory> /u);
  assert.doesNotMatch((await runCli(["accept", "--help"])).output, /--repo/u);
  assert.doesNotMatch(build, /--against/u);
  assert.match((await runCli(["check", "--help"])).output, /--against <revision> /u);
  // A comparison explains each of its two arguments and the files it leaves out.
  const compare = (await runCli(["compare", "--help"])).output;
  assert.match(compare, /\n {2}delivery +the first delivery's directory\n/u);
  assert.match(compare, /\n {2}delivery +the second delivery's directory\n/u);
  assert.match(
    compare.replace(/\s+/gu, " "),
    /acceptance record, its signature and its colophon page are not compared/u,
  );
  // Accept and verify explain the options of acceptance.
  assert.match((await runCli(["accept", "--help"])).output, /--sign <key> /u);
  assert.match((await runCli(["verify", "--help"])).output, /--allowed-signers <file> /u);
  // Help asked for in the middle of a command line answers with the command's usage.
  assert.deepEqual(await runCli(["build", "model.json", "--help"]), { exitCode: 0, output: build });
  // A group of commands lists the ones it holds.
  assert.match((await runCli(["import", "--help"])).output, /^Usage: archpub import /u);
});
