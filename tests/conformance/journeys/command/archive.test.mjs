import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { assemble, lockedPlatforms } from "../../../../tools/release/archive/assemble.mjs";
import { installedSource } from "../../../../tools/release/archive/sources.mjs";
import { gunzip, readTar } from "../../../../tools/release/archive/tar.mjs";
import { minimalModel, writeModel } from "../../../fixtures/models.mjs";
import { parseNpmPackRecord, spawnNativeSync } from "../../../fixtures/npm-pack-report.mjs";

const root = path.resolve(import.meta.dirname, "../../../..");
const windows = process.platform === "win32";
const platform = `${{ darwin: "macos", linux: "linux", win32: "windows" }[process.platform]}-${process.arch}`;

/** A composition with the house masthead, a head, a model label, a definition list and the imprint. */
const COMPOSITION = [
  '#import "/archpub/house.typ": *',
  "#show: overview",
  "#masthead([Minimal], [Two components and one call], [A model written to test the overview.])",
  "#head(48pt, 140pt, [The call])",
  '#tx(48pt, 170pt, label-of("a"), weight: "semibold")',
  "#dl(48pt, 200pt, 90pt, 600pt, (([Alpha], [calls Beta]), ([Beta], [answers])))",
  "#imprint([Each view has its plate.])",
].join("\n");

/** The first file named `name` on `searchPath`, or null. */
async function onPath(name, searchPath) {
  for (const directory of searchPath.split(path.delimiter).filter(Boolean)) {
    for (const candidate of windows ? [`${name}.exe`, `${name}.cmd`] : [name]) {
      const file = path.join(directory, candidate);
      if (
        await fs.stat(file).then(
          (stat) => stat.isFile(),
          () => false,
        )
      )
        return file;
    }
  }
  return null;
}

/**
 * A path on which no Node.js or Typst is found, whatever the machine has installed: on
 * Windows the system directories, and elsewhere links to the system's `dirname` and
 * `readlink`, the only programs the launcher runs. `/usr/bin` is not enough, as images
 * built for browsers install a Node.js there.
 */
async function barePath(work) {
  if (windows) {
    const system = process.env.SystemRoot ?? "C:\\Windows";
    return [path.join(system, "System32"), system].join(path.delimiter);
  }
  const bin = path.join(work, "bare-path");
  await fs.mkdir(bin);
  for (const name of ["dirname", "readlink"]) {
    const found = await onPath(name, process.env.PATH ?? "");
    assert.ok(found, `the launcher needs ${name} on the path`);
    await fs.symlink(found, path.join(bin, name));
  }
  return bin;
}

function run(command, args, env) {
  const result =
    windows && command.endsWith(".cmd")
      ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/c", command, ...args], {
          env,
          encoding: "utf8",
          timeout: 600_000,
          windowsHide: true,
        })
      : spawnSync(command, args, { env, encoding: "utf8", timeout: 600_000, windowsHide: true });
  assert.equal(result.error, undefined, `${command}: ${result.error}`);
  assert.equal(result.status, 0, `${command} ${args.join(" ")}: ${result.stdout}${result.stderr}`);
  return result.stdout;
}

/** Every file of a delivery, by its path relative to the delivery, with its bytes. */
async function files(directory) {
  const names = (await fs.readdir(directory, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(directory, path.join(entry.parentPath, entry.name)))
    .map((name) => name.split(path.sep).join("/"))
    .sort();
  return Promise.all(
    names.map(async (name) => [name, await fs.readFile(path.join(directory, name))]),
  );
}

test("this platform's archive runs with no Node.js or Typst on the path and builds what the checkout builds", async (t) => {
  const platforms = lockedPlatforms(
    await fs.readFile(path.join(root, ".config/mise/mise.lock"), "utf8"),
  );
  assert.ok(platforms[platform], `the lock pins no archive for ${platform}`);
  const typst = await onPath("typst", process.env.PATH ?? "");
  assert.ok(typst, "the journey needs the locked Typst on the path, as mise exec provides");
  const parent = path.join(root, "build/test-work");
  await fs.mkdir(parent, { recursive: true });
  const work = await fs.mkdtemp(path.join(parent, "command-archive-"));
  t.after(() => fs.rm(work, { recursive: true, force: true }));

  const packed = spawnNativeSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", work],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 300_000,
      env: {
        ...process.env,
        npm_config_cache: path.join(work, "npm-cache"),
        npm_config_update_notifier: "false",
      },
    },
  );
  assert.equal(packed.status, 0, packed.stdout + packed.stderr);
  const record = parseNpmPackRecord(packed.stdout);
  const archive = assemble({
    platform,
    platforms,
    packageArchive: await fs.readFile(path.join(work, record.filename)),
    ...(await installedSource({ node: process.execPath, typst })),
  });

  const unpacked = path.join(work, "unpacked");
  for (const entry of readTar(gunzip(archive.bytes))) {
    const target = path.join(unpacked, ...entry.path.split("/").filter(Boolean));
    if (!entry.data) await fs.mkdir(target, { recursive: true });
    else {
      await fs.writeFile(target, entry.data);
      if (!windows) await fs.chmod(target, entry.mode);
    }
  }
  const command = path.join(unpacked, "archpub", "bin", windows ? "archpub.cmd" : "archpub");
  // A model without a checkout dates its edition by SOURCE_DATE_EPOCH, so both builds are the same bytes.
  const epoch = "1793918078";
  const env = {
    PATH: await barePath(work),
    SOURCE_DATE_EPOCH: epoch,
    ...(windows
      ? { SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP }
      : { HOME: work, TMPDIR: process.env.TMPDIR ?? "/tmp" }),
  };
  assert.equal(await onPath("node", env.PATH), null, "the bare path holds a Node.js");
  assert.equal(await onPath("typst", env.PATH), null, "the bare path holds a Typst");
  const version = (await fs.readFile(path.join(root, "VERSION"), "utf8")).trim();
  assert.equal(run(command, ["--version"], env).trim(), version);
  // The archive carries the agent Skill of its version.
  assert.equal(
    run(command, ["skill"], env),
    await fs.readFile(path.join(root, "skills/architecture-publisher/SKILL.md"), "utf8"),
  );

  const model = await writeModel(t, minimalModel({ overview: "overview.typ" }));
  await fs.writeFile(path.join(path.dirname(model), "overview.typ"), COMPOSITION);
  const fromArchive = path.join(work, "from-archive");
  const fromCheckout = path.join(work, "from-checkout");
  run(command, ["build", model, "--out", fromArchive, "--json"], env);
  run(
    process.execPath,
    [path.join(root, "src/cli/main.mjs"), "build", model, "--out", fromCheckout, "--json"],
    { ...process.env, SOURCE_DATE_EPOCH: epoch },
  );
  const archived = await files(fromArchive);
  // The archive's own Typst set the edition, overview included, and its images.
  for (const name of ["minimal.pdf", "minimal.html", "images/00-overview.png", "manifest.json"])
    assert.ok(
      archived.some(([file]) => file === name),
      `the archive's build delivers no ${name}`,
    );
  assert.deepEqual(archived, await files(fromCheckout));
});
