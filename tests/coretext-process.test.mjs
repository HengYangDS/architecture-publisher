import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { inspect } from "node:util";
import {
  runOwnedProcess,
  terminatePosixGroup,
  workerEnvironment,
} from "../packages/publisher/src/runtime/process-tree.mjs";

const worker = fileURLToPath(
  new URL("../packages/publisher/renderers/svg/coretext-worker.mjs", import.meta.url),
);

async function fixture(t, source) {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-coretext-process-"),
  );
  const program = path.join(scratch, "compiler.mjs");
  await fs.writeFile(program, source);
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  return { scratch, program };
}
async function selectedStage(t, source, options = {}) {
  const fixtureValue = await fixture(t, source);
  const stage = options.stage ?? "compile";
  const selected = {
    stage,
    executable: process.execPath,
    args: [fixtureValue.program],
    env: { HOME: fixtureValue.scratch, PATH: fixtureValue.scratch },
    input: "",
    timeoutMs: stage === "compile" ? 120_000 : 30_000,
    maximumBytes: 65536,
    ...fixtureValue,
    ...options,
  };
  const api = await import("../packages/publisher/renderers/svg/coretext-process.mjs");
  return { selected, run: () => api.runCoreTextStage(selected) };
}
function live(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if (e.code === "ESRCH") return false;
    throw e;
  }
}

async function replyingWorker(t, beforeRemove = () => {}) {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "archpub-coretext-process-"),
  );
  const state = { child: null, exited: null };
  const reclaim = async () => {
    if (state.child) {
      if (state.child.exitCode === null && state.child.signalCode === null)
        state.child.kill("SIGKILL");
      let deadline;
      try {
        const closed = await Promise.race([
          state.exited.then(() => true),
          new Promise((resolve) => {
            deadline = setTimeout(() => resolve(false), 5_000);
          }),
        ]);
        assert.equal(closed, true, `worker closure unproved; retained scratch: ${scratch}`);
      } finally {
        clearTimeout(deadline);
      }
    }
    await beforeRemove();
    await fs.rm(scratch, { recursive: true, force: true });
  };
  t.after(reclaim);
  const program = path.join(scratch, "compiler.mjs");
  await fs.writeFile(program, "process.stdout.write('completed');");
  const child = spawn(process.execPath, [worker, "30000"], {
    cwd: scratch,
    env: workerEnvironment(scratch),
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  state.child = child;
  let stdout = "";
  const reply = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.includes("\n")) resolve(JSON.parse(stdout.trim()));
    });
  });
  child.stderr.resume();
  const exited = new Promise((resolve) => child.once("close", (code) => resolve(code)));
  state.exited = exited;
  child.stdin.end(
    JSON.stringify({
      executable: process.execPath,
      args: [program],
      scratch,
      env: { HOME: scratch, PATH: scratch },
      input: "",
      maximumBytes: 65536,
    }),
  );
  return { child, exited, reply, scratch, reclaim };
}

test(
  "CoreText reply retains a live worker until delayed owner reclamation",
  { skip: process.platform === "win32" },
  async (t) => {
    const stage = await selectedStage(t, "process.stdout.write('completed');");
    const requestPath = path.join(stage.selected.scratch, "lifetime-request.json");
    await fs.writeFile(requestPath, JSON.stringify(stage.selected));
    let pid;
    const result = await runOwnedProcess({
      worker,
      requestPath,
      scratch: stage.selected.scratch,
      args: ["126000"],
      timeoutMs: 30_000,
      maximumBytes: 65536,
      failurePrefix: "coretext_stage",
      async terminateTree(selectedPid) {
        pid = selectedPid;
        await new Promise((resolve) => setTimeout(resolve, 50));
        const alive = live(pid);
        await terminatePosixGroup(pid);
        assert.equal(alive, true, "replying worker exited before owner reclamation");
      },
      decode: (raw) => JSON.parse(raw),
    });
    assert.equal(result.exitCode, 0);
    assert.equal(Buffer.from(result.stdoutBase64, "base64").toString(), "completed");
    assert.equal(live(pid), false, "owned worker remains after group reclamation");
  },
);

test("CoreText replying worker self-expires without an owner", { timeout: 40_000 }, async (t) => {
  const { child, exited, reply } = await replyingWorker(t);
  let deadline;
  let expiryDeadline;
  try {
    const first = await Promise.race([
      reply.then(() => "reply"),
      exited.then(() => "closed"),
      new Promise((resolve) => {
        deadline = setTimeout(() => resolve("timeout"), 35_000);
      }),
    ]);
    assert.equal(first, "reply");
    assert.equal((await reply).exitCode, 0);
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(live(child.pid), true, "replying worker is not available for owner cleanup");
    assert.equal(
      await Promise.race([
        exited,
        new Promise((resolve) => {
          expiryDeadline = setTimeout(() => resolve("timeout"), 35_000);
        }),
      ]),
      1,
      "worker lacks a finite unsuccessful self-expiry",
    );
  } finally {
    clearTimeout(deadline);
    clearTimeout(expiryDeadline);
  }
});

test("CoreText direct-worker cleanup closes a live worker before removing scratch", async (t) => {
  let closed = false;
  const { child, reply, scratch, reclaim } = await replyingWorker(t, () => {
    assert.equal(closed, true, "scratch removal ran before the worker close event");
    assert.equal(live(child.pid), false);
  });
  child.once("close", () => {
    closed = true;
  });
  assert.equal((await reply).exitCode, 0);
  assert.equal(live(child.pid), true);
  await fs.access(scratch);
  await reclaim();
  assert.equal(live(child.pid), false);
  await assert.rejects(fs.access(scratch), { code: "ENOENT" });
});

test("CoreText worker rejects invalid lifetimes before launching selected code", async (t) => {
  const stage = await selectedStage(
    t,
    "import fs from 'node:fs';fs.writeFileSync(process.argv[2],'started');",
  );
  const marker = path.join(stage.selected.scratch, "started");
  stage.selected.args.push(marker);
  for (const value of [undefined, "", "0", "-1", "1.5", "NaN", "126001"]) {
    const result = spawnSync(process.execPath, [worker, ...(value === undefined ? [] : [value])], {
      cwd: stage.selected.scratch,
      env: workerEnvironment(stage.selected.scratch),
      input: JSON.stringify(stage.selected),
      encoding: "utf8",
      timeout: 30_000,
      windowsHide: true,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "");
    await assert.rejects(fs.access(marker), { code: "ENOENT" });
  }
});

test("CoreText worker flushes enabled coverage before owner SIGKILL", async (t) => {
  const stage = await selectedStage(t, "process.stdout.write('completed');");
  const requestPath = path.join(stage.selected.scratch, "coverage-request.json");
  await fs.writeFile(requestPath, JSON.stringify(stage.selected));
  const coverage = path.join(stage.selected.scratch, "coverage");
  await fs.mkdir(coverage);
  const original = process.env.NODE_V8_COVERAGE;
  process.env.NODE_V8_COVERAGE = coverage;
  try {
    await runOwnedProcess({
      worker,
      requestPath,
      scratch: stage.selected.scratch,
      args: ["126000"],
      timeoutMs: 30_000,
      maximumBytes: 65536,
      failurePrefix: "coretext_stage",
      decode: (raw) => JSON.parse(raw),
    });
    const reports = await Promise.all(
      (await fs.readdir(coverage)).map(async (name) =>
        JSON.parse(await fs.readFile(path.join(coverage, name), "utf8")),
      ),
    );
    assert(
      reports.some((report) =>
        report.result.some(
          (script) =>
            script.url.endsWith("/coretext-worker.mjs") &&
            script.functions.some((fn) => fn.ranges.some((range) => range.count > 0)),
        ),
      ),
      "SIGKILL lost the completed CoreText worker coverage",
    );
  } finally {
    if (original === undefined) delete process.env.NODE_V8_COVERAGE;
    else process.env.NODE_V8_COVERAGE = original;
  }
});
test(
  "CoreText stage reclaims a selected compiler descendant before returning failure",
  { skip: process.platform === "win32" },
  async (t) => {
    const stage = await selectedStage(
      t,
      `import {spawn} from 'node:child_process';import fs from 'node:fs';const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(process.argv[2],String(child.pid));child.unref();process.stderr.write('selected-compiler-diagnostic');process.exit(17);`,
    );
    const target = path.join(stage.selected.scratch, "pid");
    stage.selected.args.push(target);
    t.after(async () => {
      if (
        await fs.access(target).then(
          () => true,
          () => false,
        )
      ) {
        const pid = Number(await fs.readFile(target, "utf8"));
        if (live(pid)) process.kill(pid, "SIGKILL");
      }
    });
    await assert.rejects(
      stage.run,
      (err) =>
        err.code === "coretext_compile_failed" &&
        err.exitCode === 17 &&
        err.diagnostics === "selected-compiler-diagnostic",
    );
    const pid = Number(await fs.readFile(target, "utf8"));
    assert(
      !live(pid),
      "owned compiler descendant must be absent on return, before scratch cleanup",
    );
    await fs.rm(stage.selected.scratch, { recursive: true });
    await assert.rejects(fs.access(stage.selected.scratch), { code: "ENOENT" });
  },
);

test("CoreText stage deadline retains observed diagnostics from an unresponsive child", async (t) => {
  const stage = await selectedStage(
    t,
    "import fs from 'node:fs';fs.writeFileSync(process.argv[2],'started');process.stderr.write('compiler entered');process.on('SIGTERM',()=>{});setInterval(()=>{},1000);",
    { timeoutMs: 5000 },
  );
  const started = path.join(stage.selected.scratch, "started");
  stage.selected.args.push(started);
  let failure;
  try {
    await stage.run();
  } catch (error) {
    failure = error;
  }
  assert.equal(await fs.readFile(started, "utf8"), "started");
  assert.equal(failure?.code, "coretext_compile_failed", inspect(failure, { depth: 5 }));
  assert.equal(failure?.processError, "ETIMEDOUT");
  assert.equal(failure?.diagnostics, "compiler entered");
});

test("CoreText compile stage preserves successful stderr without treating it as supervisor protocol", async (t) => {
  const stage = await selectedStage(
    t,
    "process.stderr.write('selected warning');process.stdout.write('compiled');",
  );
  const result = await stage.run();
  assert.equal(result.stdout, "compiled");
  assert.equal(result.diagnostics, "selected warning");
  assert.equal(result.exitCode, 0);
});

test("CoreText finite compile and measurement use their existing stage ceilings", async (t) => {
  for (const kind of ["compile", "execution"]) {
    const stage = await selectedStage(
      t,
      "import fs from 'node:fs';fs.writeFileSync(process.argv[2],'started');setTimeout(()=>{process.stderr.write('selected tail');process.stdout.write('completed');},5100);",
      { stage: kind },
    );
    const started = path.join(stage.selected.scratch, "started");
    stage.selected.args.push(started);
    let result;
    let failure;
    try {
      result = await stage.run();
    } catch (error) {
      failure = error;
    }
    assert.equal(await fs.readFile(started, "utf8"), "started");
    assert.ifError(failure);
    assert.equal(result.stdout, "completed");
    assert.equal(result.diagnostics, "selected tail");
    assert.equal(result.exitCode, 0);
  }
});

test("CoreText stages preserve selected completed stdin and nonzero process diagnostics", async (t) => {
  const stage = await selectedStage(
    t,
    "import fs from 'node:fs';process.stdout.write(fs.readFileSync(0,'utf8'));",
    { stage: "execution", input: '{"fonts":[],"requests":[]}' },
  );
  const result = await stage.run();
  assert.equal(result.stdout, stage.selected.input);
  const failure = await selectedStage(t, "process.stderr.write('bad input');process.exit(19);", {
    stage: "execution",
  });
  const rejected = await failure.run();
  assert.equal(rejected.exitCode, 19);
  assert.equal(rejected.diagnostics, "bad input");
});

test("CoreText stages reject invalid bounds before any worker starts", async (t) => {
  const stage = await selectedStage(t, "process.exit(0);");
  const { runCoreTextStage } =
    await import("../packages/publisher/renderers/svg/coretext-process.mjs");
  for (const value of [
    { stage: "other" },
    { executable: "relative" },
    { scratch: "relative" },
    { args: [null] },
    { env: { HOME: null } },
    { timeoutMs: 120_001 },
    { maximumBytes: 16 * 1024 * 1024 + 1 },
    { input: "x".repeat(64 * 1024 * 1024 + 1) },
  ])
    await assert.rejects(runCoreTextStage({ ...stage.selected, ...value }), {
      code: "coretext_stage_plan_invalid",
    });
  assert.deepEqual((await fs.readdir(stage.selected.scratch)).sort(), ["compiler.mjs"]);
});

test("CoreText compiler output remains bounded and signal failures remain typed", async (t) => {
  const overflow = await selectedStage(t, "process.stdout.write('x'.repeat(4096));", {
    maximumBytes: 128,
  });
  await assert.rejects(
    overflow.run,
    (error) => error.code === "coretext_compile_failed" && error.processError === "ENOBUFS",
  );
  if (process.platform !== "win32") {
    const signaled = await selectedStage(t, "process.kill(process.pid,'SIGKILL');");
    await assert.rejects(
      signaled.run,
      (error) => error.code === "coretext_compile_failed" && error.signal === "SIGKILL",
    );
  }
});

test("CoreText diagnostic tails are bounded without dropping child output", async (t) => {
  const stage = await selectedStage(
    t,
    "process.stderr.write('x'.repeat(6000)+'selected tail');process.stdout.write('compiled');",
  );
  const result = await stage.run();
  assert.equal(result.diagnostics.length, 4000);
  assert(result.diagnostics.endsWith("selected tail"));
  assert.equal(result.stdout, "compiled");
});

test("CoreText compiler stderr overflow retains the existing stage byte limit", async (t) => {
  const stage = await selectedStage(t, "process.stderr.write('x'.repeat(4096));", {
    maximumBytes: 128,
  });
  await assert.rejects(
    stage.run,
    (error) => error.code === "coretext_compile_failed" && error.processError === "ENOBUFS",
  );
});

test("CoreText stage deadline has one parent owner and no worker execution timer", async (t) => {
  const stage = await selectedStage(t, "setTimeout(()=>process.stdout.write('completed'),200);");
  const requestPath = path.join(stage.selected.scratch, "parent-owned-deadline.json");
  const request = {
    executable: stage.selected.executable,
    args: stage.selected.args,
    env: stage.selected.env,
    input: stage.selected.input,
    scratch: stage.selected.scratch,
    maximumBytes: stage.selected.maximumBytes,
  };
  await fs.writeFile(requestPath, JSON.stringify(request));
  const result = await runOwnedProcess({
    worker,
    args: ["11000"],
    requestPath,
    scratch: stage.selected.scratch,
    timeoutMs: 5000,
    maximumBytes: 131072,
    failurePrefix: "coretext_stage",
    decode: (raw) => JSON.parse(raw),
  });
  assert.equal(result.processError, null, inspect(result));
  assert.equal(result.exitCode, 0);
  assert.equal(Buffer.from(result.stdoutBase64, "base64").toString(), "completed");

  assert.equal((await stage.run()).stdout, "completed");
  const selectedRequest = JSON.parse(
    await fs.readFile(path.join(stage.selected.scratch, "coretext-compile-request.json"), "utf8"),
  );
  assert.deepEqual(Object.keys(selectedRequest).sort(), Object.keys(request).sort());
});

test("CoreText diagnostic observation errors do not replace the stage timeout", async (t) => {
  const stage = await selectedStage(t, "setInterval(()=>{},1000);", { timeoutMs: 250 });
  const original = fs.readFile;
  fs.readFile = async (...args) => {
    if (String(args[0]).endsWith("coretext-stage-diagnostics.txt"))
      throw Object.assign(new Error("checkpoint inaccessible"), { code: "EACCES" });
    return original(...args);
  };
  try {
    let failure;
    try {
      await stage.run();
    } catch (error) {
      failure = error;
    }
    assert.equal(failure?.code, "coretext_compile_failed", inspect(failure, { depth: 5 }));
    assert.equal(failure?.processError, "ETIMEDOUT");
    assert.equal(failure?.diagnosticsObservation, "unobserved:EACCES");
  } finally {
    fs.readFile = original;
  }
});

test(
  "CoreText group uncertainty retains the primary failure and scratch",
  { skip: process.platform === "win32" },
  async (t) => {
    const stage = await selectedStage(
      t,
      "process.stderr.write('primary diagnostics');process.exit(17);",
    );
    const original = process.kill;
    process.kill = function (pid, signal) {
      if (pid < 0 && signal === 0)
        throw Object.assign(new Error("group probe denied"), { code: "EACCES" });
      return original(pid, signal);
    };
    try {
      await assert.rejects(
        stage.run,
        (error) =>
          error.code === "coretext_stage_cleanup_failed" &&
          error.primaryFailure?.code === "coretext_compile_failed" &&
          error.primaryFailure?.diagnostics === "primary diagnostics" &&
          error.scratch === stage.selected.scratch,
      );
      assert((await fs.stat(stage.selected.scratch)).isDirectory());
    } finally {
      process.kill = original;
    }
  },
);
