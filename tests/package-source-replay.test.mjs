import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import * as identity from "./fixtures/package-identity.mjs";

test("package source archives preserve immutable bytes under ambient checkout conversion", async (t) => {
  const parent = new URL("../build/test-work/", import.meta.url);
  await fs.mkdir(parent, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("package-source-archive-", parent));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const repository = path.join(scratch, "git");
  const root = path.join(scratch, "source");
  await fs.mkdir(repository);
  await fs.mkdir(root);
  const git = (args, input) =>
    execFileSync("git", args, { cwd: repository, input, encoding: "utf8", timeout: 10_000 }).trim();
  git(["init", "--quiet"]);
  git(["config", "core.autocrlf", "true"]);
  const bytes = Buffer.from("Selected source bytes.\n");
  const blob = git(["hash-object", "-w", "--stdin"], bytes);
  const tree = git(["mktree"], `100644 blob ${blob}\tselected.txt\n`);
  const archive = identity.archivePackageSource({ repository, tree });
  execFileSync("tar", ["-xf", "-", "-C", root], { input: archive, timeout: 10_000 });
  assert.deepEqual(await fs.readFile(path.join(root, "selected.txt")), bytes);
  await identity.assertPackageSourceReplay({ repository, tree, root, files: ["selected.txt"] });
  assert.equal(git(["config", "--get", "core.autocrlf"]), "true");
});

test("package source replay verifies every selected byte and the complete Git file set", async (t) => {
  assert.equal(typeof identity.assertPackageSourceReplay, "function");
  const parent = new URL("../build/test-work/", import.meta.url);
  await fs.mkdir(parent, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("package-source-replay-", parent));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const repository = path.join(scratch, "git");
  const root = path.join(scratch, "package");
  await fs.mkdir(repository);
  await fs.mkdir(root);
  const git = (args, input) =>
    execFileSync("git", args, { cwd: repository, input, encoding: "utf8", timeout: 10_000 }).trim();
  git(["init", "--quiet"]);
  const bytes = Buffer.from("Selected source bytes.\n");
  const oid = git(["hash-object", "-w", "--stdin"], bytes);
  const tree = git(["mktree"], `100644 blob ${oid}\tselected.txt\n`);
  await fs.writeFile(path.join(root, "selected.txt"), bytes);
  const options = { repository, tree, root, files: ["selected.txt"] };
  await identity.assertPackageSourceReplay(options);
  await fs.writeFile(path.join(root, "selected.txt"), "changed");
  await assert.rejects(identity.assertPackageSourceReplay(options), /source bytes/u);
  await fs.writeFile(path.join(root, "selected.txt"), bytes);
  await assert.rejects(
    identity.assertPackageSourceReplay({ ...options, files: [] }),
    /source file set/u,
  );
  await fs.writeFile(path.join(root, "extra.txt"), "extra");
  await assert.rejects(identity.assertPackageSourceReplay(options), /source file set/u);
  await assert.rejects(
    identity.assertPackageSourceReplay({ ...options, files: ["selected.txt", "extra.txt"] }),
    /source file set/u,
  );
  await fs.unlink(path.join(root, "extra.txt"));
  await fs.unlink(path.join(root, "selected.txt"));
  await fs.writeFile(path.join(scratch, "external.txt"), bytes);
  await fs.symlink(path.join(scratch, "external.txt"), path.join(root, "selected.txt"), "file");
  await assert.rejects(identity.assertPackageSourceReplay(options), /unsupported source entry/u);
});

test("package source replay inventories nested paths and rejects directory and root links", async (t) => {
  const parent = new URL("../build/test-work/", import.meta.url);
  await fs.mkdir(parent, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("package-source-nested-", parent));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const repository = path.join(scratch, "git");
  const root = path.join(scratch, "package");
  await fs.mkdir(repository);
  await fs.mkdir(path.join(root, "nested"), { recursive: true });
  const git = (args, input) =>
    execFileSync("git", args, { cwd: repository, input, encoding: "utf8", timeout: 10_000 }).trim();
  git(["init", "--quiet"]);
  const bytes = Buffer.from("Nested source bytes.\n");
  const blob = git(["hash-object", "-w", "--stdin"], bytes);
  const nestedTree = git(["mktree"], `100644 blob ${blob}\tselected.txt\n`);
  const tree = git(["mktree"], `040000 tree ${nestedTree}\tnested\n`);
  await fs.writeFile(path.join(root, "nested/selected.txt"), bytes);
  const options = { repository, tree, root, files: ["nested/selected.txt"] };
  await identity.assertPackageSourceReplay(options);
  await fs.writeFile(path.join(root, "nested/unreported.txt"), "unreported");
  await assert.rejects(identity.assertPackageSourceReplay(options), /source file set/u);
  await fs.unlink(path.join(root, "nested/unreported.txt"));
  const external = path.join(scratch, "external");
  await fs.rename(path.join(root, "nested"), external);
  const linkType = process.platform === "win32" ? "junction" : "dir";
  await fs.symlink(external, path.join(root, "nested"), linkType);
  await assert.rejects(identity.assertPackageSourceReplay(options), /unsupported source entry/u);
  await fs.unlink(path.join(root, "nested"));
  await fs.rename(external, path.join(root, "nested"));
  const rootLink = path.join(scratch, "linked-package");
  await fs.symlink(root, rootLink, linkType);
  await assert.rejects(
    identity.assertPackageSourceReplay({ ...options, root: rootLink }),
    /unsupported source entry: root/u,
  );
});
