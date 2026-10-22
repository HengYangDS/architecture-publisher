import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { materializeBuildRequestInput } from "../packages/publisher/src/compiler/build-input.mjs";
import { readSelectedInput } from "../packages/publisher/src/source/materialize.mjs";
import { sha, editionProject, fixture } from "./fixtures/source-materialization.mjs";

test("duplicate Build Request and Edition Project authority keys fail on exact bytes", async (t) => {
  const f = await fixture(t);
  const requestBytes = Buffer.from(
    JSON.stringify(f.request).replace(
      "{",
      '{"edition":{"kind":"direct","root":"wrong","manifest":"other.json"},',
    ) + "\n",
  );
  await fs.writeFile(f.requestPath, requestBytes);
  await assert.rejects(materializeBuildRequestInput(f.requestPath, sha(requestBytes)), {
    code: "materialized_request_json_duplicate_key",
  });

  const projectBytes = Buffer.from(
    JSON.stringify(f.project).replace('"scope":', '"scope":{"sourceNamespaces":[]},"scope":') +
      "\n",
  );
  await fs.writeFile(f.projectPath, projectBytes);
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_edition_json_duplicate_key",
  });
});

test("formatted Build Request and Edition Project JSON remain valid", async (t) => {
  const f = await fixture(t);
  const requestBytes = Buffer.from(JSON.stringify(f.request, null, 2) + "\n");
  await fs.writeFile(f.requestPath, requestBytes);
  await fs.writeFile(f.projectPath, JSON.stringify(f.project, null, 2) + "\n");
  const result = await materializeBuildRequestInput(f.requestPath, sha(requestBytes));
  assert.equal(result.project.id, "example-atlas");
});

test("mutable authoring locator creates a new identity without carrying acceptance", async (t) => {
  const f = await fixture(t);
  const first = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(first.lock.schema, "architecture.materialized-input-lock/v1");
  assert.equal(sha(Buffer.from(first.lockJson)), first.lockSha256);
  assert.equal(first.closure, "selected-roots-only");
  assert(first.limits.includes("edition-dependency-closure-unchecked"));
  assert.equal(first.lock.sources[0].sha256, sha(Buffer.from('{"system":"first"}\n')));
  assert.equal(first.read("system-source").toString(), '{"system":"first"}\n');
  assert.equal(Object.hasOwn(first.lock, "acceptance"), false);
  const alteredLock = first.lock;
  alteredLock.sources[0].sha256 = "0".repeat(64);
  assert.equal(first.lock.sources[0].sha256, sha(Buffer.from('{"system":"first"}\n')));
  const mutable = first.read("system-source");
  mutable[0] = 0;
  assert.equal(first.read("system-source").toString(), '{"system":"first"}\n');

  await fs.writeFile(f.sourcePath, '{"system":"second"}\n');
  const second = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.notEqual(second.lockSha256, first.lockSha256);
  assert.notEqual(second.lock.sources[0].sha256, first.lock.sources[0].sha256);
  assert.equal(second.lock.edition.sha256, first.lock.edition.sha256);
});

test("source identity cannot collide with the Edition accessor", async (t) => {
  const f = await fixture(t);
  f.request.sources[0].id = "edition-project";
  const result = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(result.read("edition-project").toString(), '{"system":"first"}\n');
  assert.equal(result.readEdition().toString(), await fs.readFile(f.projectPath, "utf8"));
});

test("request-local source selector names do not alter selected source identity", async (t) => {
  const f = await fixture(t);
  const first = await materializeBuildRequestInput(f.requestPath, await f.save());
  f.request.sources[0].id = "renamed-selector";
  const second = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(second.lockSha256, first.lockSha256);
  assert.deepEqual(second.lock.sources, first.lock.sources);
  assert.equal(second.read("renamed-selector").toString(), '{"system":"first"}\n');
  assert.throws(() => second.read("system-source"), { code: "materialized_item_unknown" });
});

test("request list order and locator spelling do not change selected content identity", async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, "sources/other.json"), '{"other":true}\n');
  f.request.sources.push({
    id: "other-source",
    namespace: "other/source",
    format: { id: "example/native-json", version: "1" },
    claimant: "other-maintainer",
    revision: { kind: "content", algorithm: "sha256" },
    input: { kind: "locator", path: "sources/other.json" },
  });
  f.project.scope.sourceNamespaces.push("other/source");
  f.project.scope.selections.push({
    id: "other",
    namespace: "other/source",
    kind: "reference",
    reference: "other",
    questions: ["shape"],
  });
  await fs.writeFile(f.projectPath, JSON.stringify(f.project) + "\n");
  const first = await materializeBuildRequestInput(f.requestPath, await f.save());
  f.request.sources.reverse();
  f.request.media.reverse();
  const reordered = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(reordered.lockSha256, first.lockSha256);
  const selected = f.request.sources.find(({ id }) => id === "system-source");
  await fs.copyFile(
    path.join(f.root, selected.input.path),
    path.join(f.root, "sources/relocated.json"),
  );
  selected.input.path = "sources/relocated.json";
  selected.format = { version: "1", id: "example/native-json" };
  selected.revision = { algorithm: "sha256", kind: "content" };
  const respelled = await materializeBuildRequestInput(f.requestPath, await f.save());
  assert.equal(respelled.lockSha256, first.lockSha256);
});

test("portable aliases of selected root paths fail before platform-dependent reads", async (t) => {
  const f = await fixture(t);
  f.request.sources.push({
    id: "alias-source",
    namespace: "other/source",
    format: { id: "example/native-json", version: "1" },
    claimant: "other-maintainer",
    revision: { kind: "content", algorithm: "sha256" },
    input: { kind: "locator", path: "sources/SYSTEM.json" },
  });
  f.project.scope.sourceNamespaces.push("other/source");
  f.project.scope.selections.push({
    id: "other",
    namespace: "other/source",
    kind: "reference",
    reference: "other",
    questions: ["shape"],
  });
  await fs.writeFile(f.projectPath, JSON.stringify(f.project) + "\n");
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_path_alias",
  });

  f.request.sources.pop();
  f.request.sources[0].input.path = "edition/PROJECT.json";
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_path_alias",
  });

  f.request.sources[0].input.path = "BUILD-REQUEST.json";
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_path_alias",
  });
});

test("pin mismatch fails and exact selected inputs relocate without Git", async (t) => {
  const f = await fixture(t);
  const selected = await fs.readFile(f.sourcePath);
  f.request.sources[0].input = {
    kind: "pin",
    path: "sources/system.json",
    sha256: sha(selected),
  };
  const expected = await f.save();
  const first = await materializeBuildRequestInput(f.requestPath, expected);
  const moved = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-relocated-"));
  t.after(() => fs.rm(moved, { recursive: true, force: true }));
  await fs.cp(f.root, moved, { recursive: true });
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = "";
    const replay = await materializeBuildRequestInput(
      path.join(moved, "build-request.json"),
      expected,
    );
    assert.equal(replay.lockSha256, first.lockSha256);
    assert.deepEqual(replay.read("system-source"), selected);
  } finally {
    process.env.PATH = oldPath;
  }
  await fs.writeFile(f.sourcePath, '{"system":"changed"}\n');
  await assert.rejects(materializeBuildRequestInput(f.requestPath, expected), {
    code: "materialized_pin_mismatch",
  });
});

test("a pinned VCS claim remains an explicit provenance limit without Git", async (t) => {
  const f = await fixture(t);
  const content = await fs.readFile(f.sourcePath);
  f.request.sources[0].revision = {
    kind: "vcs",
    repository: "unavailable-repository",
    ref: "refs/heads/unavailable",
  };
  f.request.sources[0].input = {
    kind: "pin",
    path: "sources/system.json",
    sha256: sha(content),
  };
  const oldPath = process.env.PATH;
  try {
    process.env.PATH = "";
    const result = await materializeBuildRequestInput(f.requestPath, await f.save());
    assert.deepEqual(result.read("system-source"), content);
    assert.equal(result.lock.sources[0].revision.object, null);
    assert(result.limits.includes("vcs-provenance-unverified:example/source"));
  } finally {
    process.env.PATH = oldPath;
  }
});

test("missing selected Provider is rejected, never silently skipped", async (t) => {
  const f = await fixture(t);
  f.request.providers.push({
    id: "source-provider",
    manifest: "provider.json",
    sha256: "a".repeat(64),
  });
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "ENOENT",
  });
});

test("direct materialization rejects unselected sources and missing requested-media coverage", async (t) => {
  const f = await fixture(t);
  f.project.scope.sourceNamespaces = ["other/source"];
  f.project.scope.selections[0].namespace = "other/source";
  await fs.writeFile(f.projectPath, JSON.stringify(f.project) + "\n");
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_edition_sources_mismatch",
  });
  f.project = editionProject();
  f.project.questions.push({
    id: "hidden",
    audience: "maintainer",
    text: "Which evidence was selected?",
  });
  f.project.scope.selections[0].questions.push("hidden");
  f.project.presentation.interactive.views[0].questions.push("hidden");
  await fs.writeFile(f.projectPath, JSON.stringify(f.project) + "\n");
  f.request.media = ["static"];
  await assert.rejects(materializeBuildRequestInput(f.requestPath, await f.save()), {
    code: "materialized_selected_media_incomplete",
  });
});

test("selected input rejects a missing selector and malformed pin before opening bytes", async (t) => {
  const f = await fixture(t);
  for (const selection of [null, {}, { kind: "other", path: "sources/system.json" }])
    await assert.rejects(readSelectedInput(f.root, selection), {
      code: "materialized_selection_invalid",
    });
  await assert.rejects(
    readSelectedInput(f.root, {
      kind: "pin",
      path: "sources/system.json",
      sha256: "not-a-digest",
    }),
    { code: "materialized_pin_invalid" },
  );
  const bytes = await fs.readFile(f.sourcePath);
  const selected = await readSelectedInput(f.root, {
    kind: "pin",
    path: "sources/system.json",
    sha256: sha(bytes),
  });
  assert.deepEqual(selected.content, bytes);
  assert.equal(selected.vcsObject, null);
});
