import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { compileEditionMeaning } from "../../packages/publisher/src/compiler/index.mjs";
import { materializeBuildRequestInput } from "../../packages/publisher/src/compiler/build-input.mjs";
import { compileNativeSelectionDelta } from "../../packages/publisher/src/semantics/native-change.mjs";
import { canonical } from "../../packages/publisher/src/protocol/json.mjs";
import { sha } from "./selected-native-edition.mjs";

export async function snapshot(fixture) {
  const selected = await materializeBuildRequestInput(fixture.file, fixture.digest);
  const meaning = await compileEditionMeaning(selected);
  return { lock: selected.lock, meaning };
}

export async function nativeDelta(before, after) {
  const prior = await snapshot(before);
  const next = await snapshot(after);
  return compileNativeSelectionDelta(
    { lock: prior.lock, native: prior.meaning.native },
    { lock: next.lock, native: next.meaning.native },
  );
}

export function resealNativeSide(side) {
  side.native.semanticDigest = sha(canonical(side.native.selections));
  side.native.subjectLockSha256 = sha(canonical(side.lock));
  return side;
}

export async function replaceSource(fixture, source, bytes) {
  const entry = fixture.request.sources.find(({ id }) => id === source);
  assert(entry);
  await fs.writeFile(path.join(fixture.root, entry.input.path), bytes);
  entry.input.sha256 = sha(bytes);
  await rewriteRequest(fixture);
}

export async function rewriteRequest(fixture) {
  const requestBytes = Buffer.from(JSON.stringify(fixture.request) + "\n");
  await fs.writeFile(fixture.file, requestBytes);
  fixture.digest = sha(requestBytes);
}

export async function rewriteProject(fixture) {
  await fs.writeFile(
    path.join(fixture.root, "edition/project.json"),
    JSON.stringify(fixture.project) + "\n",
  );
}

export function addOperationQuestion(fixture) {
  fixture.project.questions.push({
    id: "operation",
    audience: "maintainer",
    text: "What operation is selected?",
  });
  fixture.project.scope.selections[0].questions.push("operation");
}

export async function comparisonPlan(t, before, after) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-evolution-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.cp(before.root, path.join(root, "before"), { recursive: true });
  await fs.cp(after.root, path.join(root, "after"), { recursive: true });
  const plan = {
    schema: "architecture.semantic-compare-input/v3",
    before: { request: { path: "before/build-request.json", sha256: before.digest } },
    after: { request: { path: "after/build-request.json", sha256: after.digest } },
  };
  const file = path.join(root, "comparison.json");
  const bytes = Buffer.from(JSON.stringify(plan) + "\n");
  await fs.writeFile(file, bytes);
  return { root, file, plan, digest: sha(bytes) };
}
