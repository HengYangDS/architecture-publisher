import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { loadElkSupply } from "../packages/publisher/renderers/elk/supply.mjs";
import {
  PROCESS_CLEANUP_MS,
  runOwnedProcess,
  terminatePosixGroup,
  workerEnvironment,
} from "../packages/publisher/src/runtime/process-tree.mjs";

const worker = fileURLToPath(
  new URL("../packages/publisher/renderers/elk/worker.mjs", import.meta.url),
);
const parent = new URL("../build/test-work/", import.meta.url);

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    throw error;
  }
}

async function selected(t, registerRemoval = true) {
  await fs.mkdir(parent, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("elk-worker-lifetime-", parent));
  if (registerRemoval) t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const supply = await loadElkSupply();
  await fs.writeFile(path.join(scratch, "elk.cjs"), supply.script);
  const requestPath = path.join(scratch, "request.json");
  await fs.writeFile(
    requestPath,
    JSON.stringify({
      schema: "architecture.interactive-layout-request/v1",
      graphs: [
        {
          id: "root",
          children: [{ id: "node", width: 100, height: 50 }],
        },
      ],
    }),
  );
  return { scratch, requestPath };
}

test("ELK reply retains its worker until delayed owner reclamation", async (t) => {
  const input = await selected(t);
  let pid;
  const reply = await runOwnedProcess({
    worker,
    ...input,
    args: ["35000"],
    timeoutMs: 10_000,
    maximumBytes: 65536,
    failurePrefix: "render_interactive_layout",
    async terminateTree(selectedPid) {
      pid = selectedPid;
      await new Promise((resolve) => setTimeout(resolve, 75));
      const retained = alive(pid);
      if (process.platform === "win32") process.kill(pid, "SIGKILL");
      else await terminatePosixGroup(pid);
      assert.equal(retained, true, "replying ELK worker exited before owner reclamation");
    },
    decode: (raw) => JSON.parse(raw),
  });
  assert.equal(reply.status, "ok");
  assert.equal(reply.layouts[0].children[0].id, "node");
  assert.equal(alive(pid), false, "ELK worker remains after owner reclamation");
});

test("ELK worker rejects invalid lifetime bounds before reading inputs", async (t) => {
  const input = await selected(t);
  for (const bound of [undefined, "", "0", "-1", "1.5", "NaN", "35001"]) {
    const result = spawnSync(process.execPath, [worker, ...(bound === undefined ? [] : [bound])], {
      cwd: input.scratch,
      input: "invalid input must remain unread",
      encoding: "utf8",
      timeout: 10_000,
      windowsHide: true,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "");
  }
});

test("ELK error reply retains its worker for the same owner reclamation", async (t) => {
  const input = await selected(t);
  await fs.writeFile(input.requestPath, "{}");
  const reply = await runOwnedProcess({
    worker,
    ...input,
    args: ["35000"],
    timeoutMs: 10_000,
    maximumBytes: 65536,
    failurePrefix: "render_interactive_layout",
    async terminateTree(pid) {
      await new Promise((resolve) => setTimeout(resolve, 75));
      const retained = alive(pid);
      if (process.platform === "win32") process.kill(pid, "SIGKILL");
      else await terminatePosixGroup(pid);
      assert.equal(retained, true, "ELK error reply lost the selected reclamation root");
    },
    decode: (raw) => JSON.parse(raw),
  });
  assert.deepEqual(reply, { status: "error", code: "render_interactive_layout_execution_failed" });
});

test("ELK success and error replies flush enabled coverage before forced cleanup", async (t) => {
  const input = await selected(t);
  const coverage = path.join(input.scratch, "coverage");
  await fs.mkdir(coverage);
  const original = process.env.NODE_V8_COVERAGE;
  process.env.NODE_V8_COVERAGE = coverage;
  try {
    for (const valid of [true, false]) {
      if (!valid) await fs.writeFile(input.requestPath, "{}");
      const prior = new Set(await fs.readdir(coverage));
      await runOwnedProcess({
        worker,
        ...input,
        args: ["35000"],
        timeoutMs: 10_000,
        maximumBytes: 65536,
        failurePrefix: "render_interactive_layout",
        decode: (raw) => JSON.parse(raw),
      });
      const reports = await Promise.all(
        (await fs.readdir(coverage))
          .filter((name) => !prior.has(name))
          .map(async (name) => JSON.parse(await fs.readFile(path.join(coverage, name), "utf8"))),
      );
      assert(
        reports.some((report) =>
          report.result.some(
            (script) =>
              script.url.endsWith("/elk/worker.mjs") &&
              script.functions.some((fn) => fn.ranges.some((range) => range.count > 0)),
          ),
        ),
        "forced reclamation lost the completed ELK worker coverage",
      );
    }
  } finally {
    if (original === undefined) delete process.env.NODE_V8_COVERAGE;
    else process.env.NODE_V8_COVERAGE = original;
  }
});

test("ELK replying worker self-expires when the owner does not reclaim it", async (t) => {
  const input = await selected(t, false);
  const state = { child: null, closed: null, request: null, reclaimed: false };
  const reclaim = async () => {
    if (state.reclaimed) return;
    if (state.child) {
      if (state.child.exitCode === null && state.child.signalCode === null)
        state.child.kill("SIGKILL");
      let deadline;
      try {
        const proved = await Promise.race([
          state.closed.then(() => true),
          new Promise((resolve) => {
            deadline = setTimeout(() => resolve(false), PROCESS_CLEANUP_MS);
          }),
        ]);
        assert.equal(proved, true, `ELK closure unproved; retained scratch: ${input.scratch}`);
      } finally {
        clearTimeout(deadline);
      }
    }
    await state.request?.close();
    await fs.rm(input.scratch, { recursive: true, force: true });
    state.reclaimed = true;
  };
  t.after(reclaim);
  const request = await fs.open(input.requestPath, "r");
  state.request = request;
  const child = spawn(process.execPath, [worker, "2500"], {
    cwd: input.scratch,
    env: workerEnvironment(input.scratch),
    stdio: [request.fd, "pipe", "pipe"],
    windowsHide: true,
  });
  let timer;
  let output = "";
  const closed = new Promise((resolve) => child.once("close", (code) => resolve(code)));
  state.child = child;
  state.closed = closed;
  try {
    await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error("ELK reply deadline exceeded")), 10_000);
      child.once("error", reject);
      child.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.includes("\n")) resolve();
      });
      child.once("close", () => reject(new Error("ELK worker exited before replying")));
    });
    clearTimeout(timer);
    assert.equal(JSON.parse(output).status, "ok");
    await new Promise((resolve) => setTimeout(resolve, 75));
    assert.equal(alive(child.pid), true, "ELK worker has no bounded post-reply lifetime");
    const exitCode = await Promise.race([
      closed,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("ELK worker failed to expire")), 5_000);
      }),
    ]);
    assert.equal(exitCode, 1);
    assert.equal(alive(child.pid), false);
  } finally {
    clearTimeout(timer);
    await reclaim();
  }
});
