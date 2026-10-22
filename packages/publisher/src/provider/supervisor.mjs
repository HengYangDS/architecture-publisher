import { fileURLToPath } from "node:url";
import { fail, hasExactFields as exact } from "../protocol/values.mjs";
import {
  PROCESS_CLEANUP_MS,
  resolveWindowsTaskkill as resolveOwnedWindowsTaskkill,
  runOwnedProcess,
  terminateWindowsTree as terminateOwnedWindowsTree,
} from "../runtime/process-tree.mjs";

export { terminatePosixGroup } from "../runtime/process-tree.mjs";

const worker = fileURLToPath(new URL("./worker.mjs", import.meta.url));

function responseLimit(bytes) {
  return Math.ceil(bytes / 3) * 4 + 64 * 1024;
}

export async function resolveWindowsTaskkill(systemRoot = process.env.SystemRoot) {
  return resolveOwnedWindowsTaskkill("edition_provider", systemRoot);
}

export async function terminateWindowsTree(tool, child, state) {
  return terminateOwnedWindowsTree(tool, child, state, "edition_provider");
}

function decodeReply(raw, state, reason, closedBeforeCleanup, validateReply, replyBytes) {
  if (reason === "timeout") fail("edition_provider_timeout");
  if (reason === "overflow" || state.stdoutBytes >= responseLimit(replyBytes))
    fail("edition_provider_reply_size_invalid");
  if (state.stderrBytes) fail("edition_provider_stderr_invalid");
  if (state.spawnError || (closedBeforeCleanup && reason === "reply"))
    fail("edition_provider_process_failed");
  if (!raw)
    fail(
      state.closed?.code === 0
        ? "edition_provider_response_invalid"
        : "edition_provider_process_failed",
    );
  let envelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    fail("edition_provider_response_invalid");
  }
  if (exact(envelope, ["status", "code"]) && envelope.status === "error") {
    if (typeof envelope.code !== "string" || !/^edition_provider_[a-z0-9_]+$/u.test(envelope.code))
      fail("edition_provider_response_invalid");
    fail(envelope.code);
  }
  if (!exact(envelope, ["status", "reply"]) || envelope.status !== "ok")
    fail("edition_provider_response_invalid");
  return validateReply(envelope.reply);
}

/** Run one selected Provider worker under the shared process-tree lifecycle. */
export async function runProviderWorker({
  entrypoint,
  requestPath,
  scratch,
  limits,
  terminateTree = undefined,
  validateReply,
}) {
  if (typeof validateReply !== "function") fail("edition_provider_reply_validator_required");
  return runOwnedProcess({
    worker,
    args: [entrypoint, String(limits.timeoutMs + PROCESS_CLEANUP_MS + 1_000)],
    requestPath,
    scratch,
    timeoutMs: limits.timeoutMs,
    maximumBytes: responseLimit(limits.replyBytes),
    failurePrefix: "edition_provider",
    terminateTree,
    decode(raw, state, reason, closedBeforeCleanup) {
      const reply = decodeReply(
        raw,
        state,
        reason,
        closedBeforeCleanup,
        validateReply,
        limits.replyBytes,
      );
      return { raw, reply };
    },
  });
}
