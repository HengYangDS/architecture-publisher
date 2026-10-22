import { createHash } from "node:crypto";
import path from "node:path";
import { compileNativeEditionEvolution } from "../edition/native-evolution.mjs";
import { compareEditionInput } from "../edition/input.mjs";
import { materializePreparedBuildRequestInput, prepareBuildRequestInput } from "./build-input.mjs";
import { exact, semanticError, text } from "../semantics/document.mjs";
import { noSymlinkAncestors, regularBytes } from "../file-input/read.mjs";
import { parseStrictJson } from "../protocol/json.mjs";
import { isDigest } from "../protocol/values.mjs";
import { portablePath } from "../file-input/contract.mjs";
import { compileEditionMeaning } from "./meaning.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function selectedPlan(file, digest) {
  if (!isDigest(digest)) semanticError("semantic_plan_digest_required");
  await noSymlinkAncestors(file);
  const bytes = await regularBytes(file, 1024 * 1024);
  if (sha(bytes) !== digest) semanticError("semantic_plan_digest_mismatch");
  return parseStrictJson(bytes, "semantic_plan_json_invalid", "semantic_plan_json_duplicate_key");
}

async function selectedNativeSide(planPath, value, executionChoice) {
  const selected = value?.request;
  if (
    !exact(value, ["request"]) ||
    !exact(selected, ["path", "sha256"]) ||
    !text(selected.path) ||
    !isDigest(selected.sha256)
  )
    semanticError("semantic_plan_invalid");
  try {
    portablePath(selected.path);
  } catch {
    semanticError("semantic_plan_invalid");
  }
  const requestPath = path.resolve(path.dirname(planPath), ...selected.path.split("/"));
  try {
    return await prepareBuildRequestInput(requestPath, selected.sha256, executionChoice);
  } catch (error) {
    if (
      error?.code === "materialized_provider_execution_choice_invalid" ||
      error?.code === "materialized_provider_execution_choice_mismatch"
    )
      semanticError("semantic_native_provider_comparison_unadmitted");
    throw error;
  }
}

function selectedProviderPackages(materialized) {
  if (!Array.isArray(materialized.invocations)) semanticError("semantic_execution_invalid");
  return materialized.invocations.flatMap((invocation) => {
    if (invocation.delivery === "declarative") return [];
    if (
      invocation.delivery !== "executable" ||
      !text(invocation.selection) ||
      !isDigest(invocation.packageContentSha256)
    )
      semanticError("semantic_execution_invalid");
    return [{ id: invocation.selection, sha256: invocation.packageContentSha256 }];
  });
}

/** Route one selected evolution plan through the existing Claim Model or native owner. */
export async function compareEvolutionInput(
  file,
  digest,
  executionChoice = { before: [], after: [] },
) {
  const planPath = path.resolve(file);
  const plan = await selectedPlan(planPath, digest);
  if (
    !exact(executionChoice, ["before", "after"]) ||
    !Array.isArray(executionChoice.before) ||
    !Array.isArray(executionChoice.after)
  )
    semanticError("semantic_native_provider_comparison_unadmitted");
  if (plan.schema !== "architecture.semantic-compare-input/v3") {
    if (executionChoice.before.length || executionChoice.after.length)
      semanticError("semantic_native_provider_comparison_unadmitted");
    return compareEditionInput(planPath, digest);
  }
  if (!exact(plan, ["schema", "before", "after"])) semanticError("semantic_plan_invalid");
  const before = await selectedNativeSide(planPath, plan.before, executionChoice.before);
  const after = await selectedNativeSide(planPath, plan.after, executionChoice.after);
  const materializedBefore = await materializePreparedBuildRequestInput(before);
  const materializedAfter = await materializePreparedBuildRequestInput(after);
  return compileNativeEditionEvolution(
    {
      before: {
        lock: materializedBefore.lock,
        meaning: await compileEditionMeaning(materializedBefore),
      },
      after: {
        lock: materializedAfter.lock,
        meaning: await compileEditionMeaning(materializedAfter),
      },
    },
    {
      before: selectedProviderPackages(materializedBefore),
      after: selectedProviderPackages(materializedAfter),
    },
  );
}
