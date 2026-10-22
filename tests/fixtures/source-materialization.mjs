import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function editionProject(namespace = "example/source") {
  return {
    schema: "architecture.edition-project/v1",
    id: "example-atlas",
    editor: "example-editor",
    title: "Example architecture",
    audiences: [{ id: "maintainer", label: "Maintainers" }],
    questions: [{ id: "shape", audience: "maintainer", text: "What is connected?" }],
    scope: {
      sourceNamespaces: [namespace],
      selections: [
        { id: "system", namespace, kind: "reference", reference: "system", questions: ["shape"] },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: "A bounded view of the selected system." },
    presentation: {
      static: { views: [{ id: "overview", questions: ["shape"] }], intent: "One clear overview." },
      interactive: {
        views: [{ id: "overview", questions: ["shape"] }],
        intent: "An explorable view.",
      },
    },
    visualPolicy: { profile: "neutral" },
  };
}

function buildRequest() {
  return {
    schema: "architecture.build-request/v1",
    edition: { kind: "direct", root: "edition", manifest: "project.json" },
    sources: [
      {
        id: "system-source",
        namespace: "example/source",
        format: { id: "example/native-json", version: "1" },
        claimant: "example-maintainer",
        revision: { kind: "content", algorithm: "sha256" },
        input: { kind: "locator", path: "sources/system.json" },
      },
    ],
    providers: [],
    media: ["static", "interactive"],
    toolchain: { profile: "portable" },
  };
}

export async function fixture(t) {
  const parent = await fs.realpath(os.tmpdir());
  const root = await fs.mkdtemp(path.join(parent, "archpub-materialize-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, "edition"));
  await fs.mkdir(path.join(root, "sources"));
  const project = editionProject();
  const request = buildRequest();
  const sourcePath = path.join(root, "sources/system.json");
  const projectPath = path.join(root, "edition/project.json");
  const requestPath = path.join(root, "build-request.json");
  await fs.writeFile(sourcePath, '{"system":"first"}\n');
  await fs.writeFile(projectPath, JSON.stringify(project) + "\n");
  const save = async () => {
    const bytes = Buffer.from(JSON.stringify(request) + "\n");
    await fs.writeFile(requestPath, bytes);
    return sha(bytes);
  };
  return { root, project, request, sourcePath, projectPath, requestPath, save };
}

export function git(repo, ...args) {
  const result = spawnSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    timeout: 10_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_NO_LAZY_FETCH: "1" },
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout.trim();
}

export async function vcsFixture(t) {
  const f = await fixture(t);
  const repo = path.join(f.root, "repo");
  await fs.mkdir(repo);
  git(repo, "init", "-q");
  git(repo, "config", "user.name", "Fixture");
  git(repo, "config", "user.email", "fixture@example.invalid");
  f.request.sources[0].revision = { kind: "vcs", repository: "repo", ref: "HEAD" };
  f.request.sources[0].input.path = "system.json";
  return { f, repo };
}
