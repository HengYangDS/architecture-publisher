import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateProviderReply } from "../packages/publisher/src/provider/protocol.mjs";
import { EDITION_PROVIDER_LIMITS } from "../packages/publisher/src/provider/limits.mjs";
import { PROCESS_CLEANUP_MS } from "../packages/publisher/src/runtime/process-tree.mjs";
import {
  worker,
  provider,
  evidence,
  alive,
  waitForExit,
  reclaimWorker,
  requestFile,
  workerEnvironment,
} from "./fixtures/provider-worker-lifetime.mjs";

test("worker requires an explicit reply contract before opening inputs", async () => {
  const { runProviderWorker } = await import("../packages/publisher/src/provider/supervisor.mjs");
  await assert.rejects(
    runProviderWorker({
      entrypoint: provider,
      requestPath: path.join(os.tmpdir(), "missing-provider-request.json"),
      scratch: os.tmpdir(),
      limits: { timeoutMs: 1_000, replyBytes: 1_024 },
    }),
    { code: "edition_provider_reply_validator_required" },
  );
});

test("direct Provider worker teardown awaits native close before removing scratch", async (t) => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("provider-worker-close-", evidence));
  const child = spawn(process.execPath, ["-e", "process.exit(0)"], {
    cwd: scratch,
    stdio: "ignore",
    windowsHide: true,
  });
  await new Promise((resolve) => child.once("close", resolve));
  let observed = false;
  const closed = new Promise((resolve) => {
    setImmediate(() => {
      observed = true;
      resolve();
    });
  });
  const remove = fs.rm;
  const observer = t.mock.method(fs, "rm", async (...args) => {
    assert.equal(observed, true, "PID absence was mistaken for native close observation");
    return remove(...args);
  });
  try {
    await reclaimWorker(child, closed, undefined, scratch);
    await assert.rejects(fs.access(scratch), { code: "ENOENT" });
  } finally {
    observer.mock.restore();
    await closed;
    await remove(scratch, { recursive: true, force: true });
  }
});

test("unproved direct Worker close preserves scratch and closes the request descriptor", async (t) => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("provider-worker-close-unproved-", evidence));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const request = await fs.open(path.join(scratch, "request.json"), "wx+");
  await request.writeFile("retained request");
  await assert.rejects(reclaimWorker(undefined, new Promise(() => {}), request, scratch), {
    code: "ERR_ASSERTION",
    message: `worker close unproved; retained scratch: ${scratch}\n\nfalse !== true\n`,
  });
  assert.equal(await fs.readFile(path.join(scratch, "request.json"), "utf8"), "retained request");
  assert.equal(request.fd, -1);
});

test("unreclaimed Provider worker stays available for cleanup, then self-expires", async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("provider-worker-lifetime-", evidence));
  let request;
  let child;
  let closed = Promise.resolve();
  try {
    const requestPath = await requestFile(scratch, undefined, 750);
    request = await fs.open(requestPath, "r");
    child = spawn(process.execPath, [worker, provider, String(PROCESS_CLEANUP_MS)], {
      cwd: scratch,
      env: workerEnvironment(scratch),
      stdio: [request.fd, "pipe", "pipe"],
      windowsHide: true,
    });
    closed = new Promise((resolve) => child.once("close", resolve));
    let output = "";
    await new Promise((resolve, reject) => {
      const deadline = setTimeout(
        () => reject(new Error("worker reply deadline")),
        PROCESS_CLEANUP_MS,
      );
      const done = () => {
        clearTimeout(deadline);
        resolve();
      };
      child.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.includes("\n")) done();
      });
      child.once("close", done);
    });
    assert.ok(output.endsWith("\n"), "worker closed without a framed reply");
    assert.equal(JSON.parse(output.trim()).status, "ok");
    await new Promise((resolve) => setTimeout(resolve, 25));
    assert.equal(alive(child.pid), true, "worker exited before its owner could reclaim the tree");
    assert.equal(output.endsWith("\n"), true, "worker reply is not framed");
    assert.equal(
      await waitForExit(child.pid, PROCESS_CLEANUP_MS),
      true,
      "worker lacks a self-expiring deadline",
    );
  } finally {
    await reclaimWorker(child, closed, request, scratch);
  }
});

test("worker self-deadline survives synchronous Provider code", async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("provider-worker-blocked-", evidence));
  let request;
  let child;
  let closed = Promise.resolve();
  try {
    const requestPath = await requestFile(scratch, "blocked-event-loop");
    request = await fs.open(requestPath, "r");
    child = spawn(process.execPath, [worker, provider, "500"], {
      cwd: scratch,
      env: workerEnvironment(scratch),
      stdio: [request.fd, "ignore", "ignore"],
      windowsHide: true,
    });
    closed = new Promise((resolve) => child.once("close", resolve));
    assert.equal(
      await waitForExit(child.pid),
      true,
      "synchronous Provider code blocked the worker self-deadline",
    );
  } finally {
    await reclaimWorker(child, closed, request, scratch);
  }
});

test("unavailable tree cleanup cannot admit a valid Provider reply", async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("provider-cleanup-unavailable-", evidence));
  let selectedPid;
  try {
    const requestPath = await requestFile(scratch);
    const { runProviderWorker } = await import("../packages/publisher/src/provider/supervisor.mjs");
    await assert.rejects(
      runProviderWorker({
        entrypoint: provider,
        requestPath,
        scratch,
        limits: { timeoutMs: EDITION_PROVIDER_LIMITS.timeoutMs, replyBytes: 2 * 1024 * 1024 },
        validateReply: validateProviderReply,
        terminateTree: async (pid) => {
          selectedPid = pid;
          throw new Error("simulated native cleanup failure");
        },
      }),
      { code: "edition_provider_cleanup_failed" },
    );
    assert.equal(Number.isSafeInteger(selectedPid), true);
    assert.equal(await waitForExit(selectedPid), true, "worker survived cleanup failure");
  } finally {
    if (selectedPid && alive(selectedPid)) process.kill(selectedPid, "SIGKILL");
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test("unproved tree cleanup remains distinct from ordinary cleanup failure", async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("provider-cleanup-unproved-", evidence));
  let selectedPid;
  try {
    const requestPath = await requestFile(scratch);
    const { runProviderWorker } = await import("../packages/publisher/src/provider/supervisor.mjs");
    await assert.rejects(
      runProviderWorker({
        entrypoint: provider,
        requestPath,
        scratch,
        limits: { timeoutMs: EDITION_PROVIDER_LIMITS.timeoutMs, replyBytes: 2 * 1024 * 1024 },
        validateReply: validateProviderReply,
        terminateTree: async (pid) => {
          selectedPid = pid;
          process.kill(pid, "SIGKILL");
          throw Object.assign(new Error("selected root exited before tree cleanup"), {
            code: "edition_provider_cleanup_unproved",
          });
        },
      }),
      { code: "edition_provider_cleanup_unproved" },
    );
    assert.equal(await waitForExit(selectedPid), true);
  } finally {
    if (selectedPid && alive(selectedPid)) process.kill(selectedPid, "SIGKILL");
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test("a rejected reply and failed cleanup retain both precise causes", async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("provider-dual-failure-", evidence));
  let selectedPid;
  try {
    const requestPath = await requestFile(scratch, "malformed");
    const { runProviderWorker } = await import("../packages/publisher/src/provider/supervisor.mjs");
    await assert.rejects(
      runProviderWorker({
        entrypoint: provider,
        requestPath,
        scratch,
        limits: { timeoutMs: EDITION_PROVIDER_LIMITS.timeoutMs, replyBytes: 2 * 1024 * 1024 },
        validateReply: validateProviderReply,
        terminateTree: async (pid) => {
          selectedPid = pid;
          throw new Error("simulated native cleanup failure");
        },
      }),
      {
        code: "edition_provider_cleanup_failed",
        originalFailure: "edition_provider_response_invalid",
        cleanupFailure: "simulated native cleanup failure",
      },
    );
    assert.equal(await waitForExit(selectedPid), true);
  } finally {
    if (selectedPid && alive(selectedPid)) process.kill(selectedPid, "SIGKILL");
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test("a cleanup rejection without an Error never admits the Provider reply", async () => {
  await fs.mkdir(evidence, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("provider-empty-cleanup-error-", evidence));
  let selectedPid;
  try {
    const requestPath = await requestFile(scratch);
    const { runProviderWorker } = await import("../packages/publisher/src/provider/supervisor.mjs");
    await assert.rejects(
      runProviderWorker({
        entrypoint: provider,
        requestPath,
        scratch,
        limits: { timeoutMs: EDITION_PROVIDER_LIMITS.timeoutMs, replyBytes: 2 * 1024 * 1024 },
        validateReply: validateProviderReply,
        terminateTree: async (pid) => {
          selectedPid = pid;
          throw undefined;
        },
      }),
      { code: "edition_provider_cleanup_failed" },
    );
    assert.equal(await waitForExit(selectedPid), true);
  } finally {
    if (selectedPid && alive(selectedPid)) process.kill(selectedPid, "SIGKILL");
    await fs.rm(scratch, { recursive: true, force: true });
  }
});

test("POSIX group loss cannot pass while the selected worker is still present", async () => {
  const { terminatePosixGroup } = await import("../packages/publisher/src/provider/supervisor.mjs");
  const calls = [];
  const signal = (target, kind) => {
    calls.push([target, kind]);
    if (target < 0) throw Object.assign(new Error("group absent"), { code: "ESRCH" });
  };
  await assert.rejects(terminatePosixGroup(4242, signal), {
    message: "selected worker remains alive without its process group",
  });
  assert.deepEqual(calls, [
    [-4242, "SIGKILL"],
    [4242, 0],
  ]);
});

test("POSIX cleanup distinguishes an absent tree from unexpected signal failures", async () => {
  const { terminatePosixGroup } = await import("../packages/publisher/src/provider/supervisor.mjs");
  await terminatePosixGroup(4242, () => {
    throw Object.assign(new Error("already absent"), { code: "ESRCH" });
  });
  await assert.rejects(
    terminatePosixGroup(4242, (target) => {
      throw Object.assign(new Error("permission denied"), {
        code: target < 0 ? "ESRCH" : "EPERM",
      });
    }),
    { code: "EPERM" },
  );
  await assert.rejects(
    terminatePosixGroup(4242, () => {
      throw Object.assign(new Error("group signal denied"), { code: "EPERM" });
    }),
    { code: "EPERM" },
  );
});
