import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const worker = fileURLToPath(
  new URL("../../packages/publisher/src/provider/worker.mjs", import.meta.url),
);

export const provider = fileURLToPath(
  new URL("./providers/executable/package/provider.mjs", import.meta.url),
);

const source = new URL("./providers/executable/inputs/source.json", import.meta.url);

export const evidence = new URL("../../build/test-work", import.meta.url);

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

export async function waitForExit(pid, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!alive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return !alive(pid);
}

export async function reclaimWorker(child, closed, request, scratch) {
  if (child && alive(child.pid)) child.kill("SIGKILL");
  let deadline;
  try {
    const observed = await Promise.race([
      closed.then(() => true),
      new Promise((resolve) => {
        deadline = setTimeout(() => resolve(false), 2_000);
      }),
    ]);
    assert.equal(observed, true, `worker close unproved; retained scratch: ${scratch}`);
  } finally {
    clearTimeout(deadline);
    await request?.close();
  }
  await fs.rm(scratch, { recursive: true, force: true });
}

export async function requestFile(scratch, scenario = undefined, replyDelayMs = undefined) {
  for (const name of ["config", "cache", "data", "tmp"]) await fs.mkdir(path.join(scratch, name));
  let bytes = await fs.readFile(source);
  const selected = JSON.parse(bytes);
  if (scenario || replyDelayMs !== undefined) {
    if (scenario) selected.scenario = scenario;
    if (replyDelayMs !== undefined) selected.replyDelayMs = replyDelayMs;
    bytes = Buffer.from(JSON.stringify(selected));
  }
  const input = {
    schema: "architecture.edition-provider-request/v1",
    provider: { id: "fixture-executable-provider", revision: "1.0.0" },
    subject: {
      id: selected.reply.source.id,
      revision: selected.reply.source.revision,
    },
    inputs: [
      {
        id: "source",
        mediaType: "application/json",
        bytes: bytes.length,
        sha256: sha(bytes),
        contentBase64: bytes.toString("base64"),
      },
    ],
  };
  const requestPath = path.join(scratch, "request.json");
  await fs.writeFile(requestPath, JSON.stringify(input));
  return requestPath;
}

export function workerEnvironment(scratch) {
  return {
    HOME: scratch,
    PATH: scratch,
    XDG_CONFIG_HOME: path.join(scratch, "config"),
    XDG_CACHE_HOME: path.join(scratch, "cache"),
    XDG_DATA_HOME: path.join(scratch, "data"),
    TMPDIR: path.join(scratch, "tmp"),
    TMP: path.join(scratch, "tmp"),
    TEMP: path.join(scratch, "tmp"),
    LANG: "C.UTF-8",
  };
}
