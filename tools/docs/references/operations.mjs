// The blocks references.mjs writes from what the command needs, bundles, releases and delivers: its supplies and
// runtime dependencies (package.json and the bundled Archify's supply), the platforms a release has an archive for
// (the mise lock) and an archive's members (tools/release/archive/members.json), the variables a child process
// receives (src/environment.json) and a delivery's files (src/delivery.json).
import fs from "node:fs/promises";
import path from "node:path";
import { lockedPlatforms } from "../../release/archive/assemble.mjs";
import { code, listed, readJson, stated, table } from "./text.mjs";

// mise names a platform by its system and its processor; a reader knows each by the words below, and a platform of
// another word stops the writer rather than print a name it cannot vouch for.
const SYSTEMS = Object.freeze({ linux: "Linux", macos: "macOS" });
const PROCESSORS = Object.freeze({ arm64: "ARM64", x64: "x86-64" });

/**
 * The blocks of what the command needs, bundles, releases and delivers, read from the tree at `root`.
 * @param {string} root
 */
export async function operationsBlocks(root) {
  // What the publisher needs of its host and bundles, each version read from its own owner: the package's `engines`
  // for Node.js and Typst and its `dependencies`, and the bundled Archify's supply manifest.
  const manifest = await readJson(root, "package.json");
  const archify = await readJson(root, "renderers/archify/supply/supply.json");
  const nodeFloor = /^>=(\d+\.\d+(?:\.\d+)?)$/u.exec(manifest.engines?.node ?? "")?.[1];
  if (
    !nodeFloor ||
    !manifest.engines?.typst ||
    !Object.keys(manifest.dependencies ?? {}).length ||
    !archify.version
  )
    throw new Error(
      "references_source_unreadable: package.json engines (node as >=x.y, typst) and dependencies, or the Archify supply's version",
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
  // The npm dependencies the package bundles, each at the version package.json gives it.
  const dependenciesList = () =>
    `${listed(Object.entries(manifest.dependencies).map(([name, version]) => `${code(name)} ${version}`))}.`;

  // The platforms a release delivers the command for: those the mise lock pins both Node.js and Typst for, as the
  // release reads them (tools/release/archive/assemble.mjs).
  const machines = Object.keys(
    lockedPlatforms(await fs.readFile(path.join(root, ".config/mise/mise.lock"), "utf8")),
  ).map((platform) => {
    const [, system, processor] = /^([a-z]+)-([a-z0-9]+)$/u.exec(platform) ?? [];
    if (!Object.hasOwn(SYSTEMS, system) || !Object.hasOwn(PROCESSORS, processor))
      throw new Error(
        `references_platform_unnamed: ${platform}: name its system and processor in tools/docs/references/operations.mjs`,
      );
    return { platform, system: SYSTEMS[system], processor: PROCESSORS[processor] };
  });
  if (!machines.length)
    throw new Error(
      "references_source_unreadable: the mise lock pins no platform for both Node.js and Typst",
    );
  /** The platforms by mise's names, each with the machine a reader knows it as: `linux-x64` (Linux on x86-64). */
  const platformsList = () =>
    `${listed(machines.map(({ platform, system, processor }) => `${code(platform)} (${system} on ${processor})`))}.`;
  /** The platforms as a sentence names them, by system: `for Linux on ARM64 and x86-64 and for macOS on ARM64`. */
  const platformsSentence = () => {
    const systems = [...new Set(machines.map(({ system }) => system))];
    const each = systems.map(
      (system) =>
        `for ${system} on ${listed(machines.filter((machine) => machine.system === system).map(({ processor }) => processor))}`,
    );
    return `Each release has an archive ${listed(each)}.`;
  };

  // A release archive's members, as the table beside the code that assembles one states them: what each holds, in
  // its place below the archive's top directory. A field the sentence prints and the table lacks stops the writer.
  const MEMBERS = "tools/release/archive/members.json";
  const archive = await readJson(root, MEMBERS);
  const members = Object.entries(archive.members ?? {}).map(
    ([role, /** @type {any} */ member]) => ({
      place: `${stated(MEMBERS, archive.top, "top")}/${stated(MEMBERS, member?.path, `path of the member ${role}`)}`,
      holds: stated(MEMBERS, member?.holds, `holds of the member ${role}`),
    }),
  );
  if (!members.length) throw new Error(`references_text_missing: ${MEMBERS} states no members`);
  const archiveSentence = () =>
    `An archive holds ${listed(members.map(({ place, holds }) => `${holds} in ${code(place)}`))}.`;

  // The variables of its caller's environment that a child process receives, as the table beside the module that
  // passes them states them.
  const VARIABLES = "src/environment.json";
  const { passed } = await readJson(root, VARIABLES);
  if (!Array.isArray(passed) || !passed.length)
    throw new Error(`references_text_missing: ${VARIABLES} states no passed variables`);
  const variables = passed.map((name) => stated(VARIABLES, name, "name of a passed variable"));
  const variablesList = () => `${listed(variables.map(code))}.`;

  // A delivery's files, as the table beside the names states them (src/delivery.json), with the default width it
  // states and the delivered model's name the shared table gives (src/shared.json).
  const delivery = await readJson(root, "src/delivery.json");
  const shared = await readJson(root, "src/shared.json");
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

  return [
    {
      file: "README.md",
      name: "platforms",
      source: ".config/mise/mise.lock",
      text: platformsSentence,
    },
    {
      file: "docs/how-to.md",
      name: "platforms",
      source: ".config/mise/mise.lock",
      text: platformsSentence,
    },
    {
      file: "docs/reference/operations.md",
      name: "archives",
      source: ".config/mise/mise.lock and tools/release/archive/members.json",
      text: () => `${platformsList()}\n\n${archiveSentence()}`,
    },
    {
      file: "docs/reference/operations.md",
      name: "dependencies",
      source: "package.json",
      text: dependenciesList,
    },
    {
      file: "docs/reference/operations.md",
      name: "variables",
      source: "src/environment.json",
      text: variablesList,
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
  ];
}
