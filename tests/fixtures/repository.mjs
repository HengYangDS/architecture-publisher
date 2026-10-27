import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { temporaryDirectory } from "./models.mjs";

export const MAIN = "export const main = 1;\n";
export const README = "# Read me\n";

/** A one-commit repository holding src/main.mjs and README.md. */
export async function repository(t) {
  const root = await temporaryDirectory("archpub-sources-");
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "src"));
  await fs.writeFile(path.join(root, "src/main.mjs"), MAIN);
  await fs.writeFile(path.join(root, "README.md"), README);
  const git = (...args) =>
    execFileSync("git", ["-C", root, "-c", "core.hooksPath=/dev/null", ...args], {
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" },
    }).trim();
  git("init", "--quiet", "--initial-branch=main");
  git("add", ".");
  git(
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@example.invalid",
    "-c",
    "commit.gpgsign=false",
    "commit",
    "--quiet",
    "--message=initial",
  );
  return { root, git, revision: git("rev-parse", "HEAD") };
}
