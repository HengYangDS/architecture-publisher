import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { temporaryDirectory } from "./models.mjs";

export const MAIN = "export const main = 1;\n";
export const README = "# Read me\n";

/** A one-commit repository holding src/main.mjs and README.md. */
export async function repository(t) {
  const root = await temporaryDirectory(t, "archpub-sources-");
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

/**
 * A one-commit repository of Go files with tests beside them, one test spelt in upper case, and a
 * documentation file outside src/. The commit is built from Git objects, not a working tree, so
 * names that differ only in case stay distinct on a case-insensitive file system.
 */
export async function globRepository(t, objectFormat = "sha1") {
  const root = await temporaryDirectory(t, "archpub-glob-");
  const files = [
    "docs/x.md",
    "src/A_TEST.GO",
    "src/a.go",
    "src/a_test.go",
    "src/lib/b.go",
    "src/lib/b_test.go",
    "src/net/c.go",
  ];
  const git = (args, input) =>
    execFileSync("git", ["-C", root, "-c", "core.hooksPath=/dev/null", ...args], {
      encoding: "utf8",
      input,
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" },
    }).trim();
  git(["init", "--quiet", "--initial-branch=main", `--object-format=${objectFormat}`]);
  const blob = git(["hash-object", "-w", "--stdin"], "x\n");
  const index = files.map((file) => `100644 blob ${blob}\t${file}`).join("\n");
  git(["update-index", "--index-info"], `${index}\n`);
  const tree = git(["write-tree"]);
  const commit = git(
    [
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "commit-tree",
      tree,
      "-m",
      "initial",
    ],
    "",
  );
  git(["update-ref", "refs/heads/main", commit]);
  return { root, pinned: commit };
}

/**
 * A repository for a re-pin. Its first commit holds two components' directories, a directory
 * with one file, a relation's file, a tool and documents a guide cites; the second moves a file
 * between the two directories, adds a file to one and a tool, deletes the lone file and the
 * relation's file, modifies a cited file, inserts two lines atop one document, changes line 11
 * of another, renames a third unchanged and deletes a fourth.
 */
export async function repinRepository(t) {
  const root = await temporaryDirectory(t, "archpub-repin-");
  // Every file's lines are its own, so Git pairs a rename only where the text moved unchanged.
  const lines = (prefix, count) =>
    Array.from({ length: count }, (_, index) => `${prefix} ${index + 1}\n`).join("");
  const write = async (file, text) => {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), text);
  };
  const files = {
    "src/a/x.go": lines("// src/a/x.go", 2),
    "src/a/y.go": lines("// src/a/y.go", 2),
    "src/b/z.go": lines("// src/b/z.go", 2),
    "src/old/only.go": lines("// src/old/only.go", 2),
    "src/rel/gone.go": lines("// src/rel/gone.go", 2),
    "tools/keep.go": lines("// tools/keep.go", 2),
    "docs/cite.md": lines("cite", 20),
    "docs/touch.md": lines("touch", 20),
    "docs/move.md": lines("move", 5),
    "docs/gone.md": lines("gone", 3),
    "docs/same.md": lines("same", 4),
  };
  for (const [file, text] of Object.entries(files)) await write(file, text);
  const git = (...args) =>
    execFileSync("git", ["-C", root, "-c", "core.hooksPath=/dev/null", ...args], {
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" },
    }).trim();
  const commit = (message) =>
    git(
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      `--message=${message}`,
    );
  git("init", "--quiet", "--initial-branch=main");
  git("add", ".");
  commit("initial");
  const pinned = git("rev-parse", "HEAD");
  git("mv", "src/a/x.go", "src/b/x.go");
  git("mv", "docs/move.md", "docs/moved.md");
  git("rm", "--quiet", "src/old/only.go", "src/rel/gone.go", "docs/gone.md");
  await write("src/a/new.go", lines("// src/a/new.go", 2));
  await write("tools/new.go", lines("// tools/new.go", 2));
  await write("src/b/z.go", lines("// src/b/z.go, changed", 2));
  await write("docs/cite.md", `${lines("inserted", 2)}${files["docs/cite.md"]}`);
  await write("docs/touch.md", files["docs/touch.md"].replace("touch 11\n", "touched 11\n"));
  git("add", ".");
  commit("re-pin");
  return { root, git, pinned, head: git("rev-parse", "HEAD") };
}

/**
 * A repository whose first commit holds cited, uncited, vendored and documentation
 * files, followed by two commits that modify one cited file, move another and
 * delete a third.
 */
export async function historyRepository(t) {
  const root = await temporaryDirectory(t, "archpub-history-");
  const files = {
    "README.md": README,
    "docs/guide.md": "# Guide\n",
    "src/a.mjs": "export const a = 1;\n",
    "src/b.mjs": "export const b = 2;\n",
    "src/c.mjs": "export const c = 3;\n",
    "src/d.mjs": "export const d = 4;\n",
    "src/tools/e.mjs": "export const e = 5;\n",
    "src/tools/f.mjs": "export const f = 6;\n",
    "src/vendor/v.mjs": "export const v = 7;\n",
  };
  for (const [file, text] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), text);
  }
  const git = (...args) =>
    execFileSync("git", ["-C", root, "-c", "core.hooksPath=/dev/null", ...args], {
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" },
    }).trim();
  const commit = (message) =>
    git(
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--quiet",
      `--message=${message}`,
    );
  git("init", "--quiet", "--initial-branch=main");
  git("add", ".");
  commit("initial");
  const pinned = git("rev-parse", "HEAD");
  await fs.writeFile(path.join(root, "src/a.mjs"), "export const a = 10;\n");
  await fs.mkdir(path.join(root, "src/lib"));
  git("mv", "src/b.mjs", "src/lib/b.mjs");
  git("add", ".");
  commit("modify a and move b");
  git("rm", "--quiet", "src/c.mjs");
  commit("delete c");
  return { root, git, pinned, head: git("rev-parse", "HEAD"), files };
}
