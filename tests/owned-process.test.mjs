import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runOwnedProcess } from "../packages/publisher/src/runtime/process-tree.mjs";

const gatedWorker = fileURLToPath(
  new URL("../packages/publisher/src/runtime/gated-worker.mjs", import.meta.url),
);

test("selected Windows system root reaches nested workers without ambient configuration", async () => {
  const runtime = await import("../packages/publisher/src/runtime/process-tree.mjs");
  assert.equal(typeof runtime.workerEnvironment, "function");
  const env = runtime.workerEnvironment("/isolated/scratch", "C:\\Windows");
  assert.equal(env.SystemRoot, "C:\\Windows");
  assert.equal(env.HOME, "/isolated/scratch");
  assert.equal(env.PATH, "/isolated/scratch");
  assert.equal(env.USERPROFILE, undefined);
});

async function fixture(t, workerSource) {
  const scratch = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-owned-"));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const worker = path.join(scratch, "worker.mjs");
  const requestPath = path.join(scratch, "request.json");
  await fs.writeFile(worker, workerSource);
  await fs.writeFile(requestPath, "{}");
  return { worker, requestPath, scratch };
}

async function directGatedWorker(t, selected, send) {
  const child = spawn(process.execPath, [gatedWorker, selected.worker, "selected-argument"], {
    cwd: selected.scratch,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  });
  let stdout = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  const exited = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code, stdout }));
  });
  await new Promise((resolve) => child.once("spawn", resolve));
  await send(child);
  return exited;
}

test("gated bootstrap imports selected code only after the start message", async (t) => {
  const selected = await fixture(
    t,
    "process.stdout.write(JSON.stringify({ argument: process.argv[2] }) + '\\n');",
  );
  const result = await directGatedWorker(t, selected, async (child) => {
    await new Promise((resolve) => setTimeout(resolve, 25));
    child.send("start");
  });
  assert.deepEqual(result, {
    code: 0,
    stdout: '{"argument":"selected-argument"}\n',
  });
});

test("gated bootstrap does not import selected code after IPC disconnect", async (t) => {
  const selected = await fixture(t, "process.stdout.write('selected\\n');");
  const result = await directGatedWorker(t, selected, async (child) => {
    child.disconnect();
  });
  assert.deepEqual(result, { code: 1, stdout: "" });
});

test("gated bootstrap rejects a message other than start", async (t) => {
  const selected = await fixture(t, "process.stdout.write('selected\\n');");
  const result = await directGatedWorker(t, selected, async (child) => {
    child.send("deny");
  });
  assert.deepEqual(result, { code: 1, stdout: "" });
});

test("gated bootstrap rejects execution without an owner channel", async (t) => {
  const selected = await fixture(t, "process.stdout.write('selected\\n');");
  const child = spawn(process.execPath, [gatedWorker, selected.worker], {
    cwd: selected.scratch,
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  assert.equal(code, 1);
});

test("neutral owned process validates one reply after bounded tree cleanup", async (t) => {
  const selected = await fixture(
    t,
    "import fs from 'node:fs'; const request = fs.readFileSync(0, 'utf8'); process.stdout.write(JSON.stringify({ status: 'ok', request, home: process.env.HOME, path: process.env.PATH }) + '\\n'); setInterval(() => {}, 1000);",
  );
  const result = await runOwnedProcess({
    ...selected,
    args: [],
    timeoutMs: 2_000,
    maximumBytes: 1024,
    failurePrefix: "native_likec4",
    decode(raw, state, reason) {
      assert.equal(reason, "reply");
      assert.equal(state.stderrBytes, 0);
      return JSON.parse(raw);
    },
  });
  assert.deepEqual(result, {
    status: "ok",
    request: "{}",
    home: selected.scratch,
    path: selected.scratch,
  });
});

test("registration rejection prevents selected worker code from starting", async (t) => {
  const marker = path.join(os.tmpdir(), `archpub-registration-${process.pid}-${Date.now()}`);
  t.after(() => fs.rm(marker, { force: true }));
  const selected = await fixture(
    t,
    `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, 'started'); process.stdout.write('{"status":"ok"}\\n'); setInterval(() => {}, 1000);`,
  );
  await assert.rejects(
    runOwnedProcess({
      ...selected,
      args: [],
      timeoutMs: 2_000,
      maximumBytes: 1024,
      failurePrefix: "native_likec4",
      registerOwned: async () => {
        throw new Error("registration rejected");
      },
      releaseOwned: async () => {},
      decode: (raw) => JSON.parse(raw),
    }),
    { code: "native_likec4_registration_failed" },
  );
  await assert.rejects(fs.access(marker), { code: "ENOENT" });
});

test("registered worker starts only after acknowledgement and releases after cleanup", async (t) => {
  const marker = path.join(os.tmpdir(), `archpub-acknowledged-${process.pid}-${Date.now()}`);
  t.after(() => fs.rm(marker, { force: true }));
  const selected = await fixture(
    t,
    `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, 'started'); process.stdout.write('{"status":"ok"}\\n'); setInterval(() => {}, 1000);`,
  );
  let acknowledge;
  let registered;
  const seen = new Promise((resolve) => {
    registered = resolve;
  });
  const release = [];
  const pending = runOwnedProcess({
    ...selected,
    args: [],
    timeoutMs: 2_000,
    maximumBytes: 1024,
    failurePrefix: "native_likec4",
    registerOwned: (pid) => {
      registered(pid);
      return new Promise((resolve) => {
        acknowledge = resolve;
      });
    },
    releaseOwned: async (pid) => {
      release.push(pid);
    },
    decode: (raw) => JSON.parse(raw),
  });
  const pid = await seen;
  await assert.rejects(fs.access(marker), { code: "ENOENT" });
  acknowledge();
  assert.deepEqual(await pending, { status: "ok" });
  assert.equal(await fs.readFile(marker, "utf8"), "started");
  assert.deepEqual(release, [pid]);
});

test("registered worker can retain owner IPC for nested ownership messages", async (t) => {
  const selected = await fixture(
    t,
    `if (typeof process.send !== 'function') throw Error('owner channel missing');
     process.once('message', (reply) => {
       process.stdout.write(JSON.stringify({ reply }) + '\\n');
       setInterval(() => {}, 1000);
     });
     process.send({ kind: 'nested-worker', pid: process.pid });`,
  );
  const messages = [];
  const result = await runOwnedProcess({
    ...selected,
    args: [],
    timeoutMs: 2_000,
    maximumBytes: 1024,
    failurePrefix: "native_likec4",
    retainIpc: true,
    registerOwned: async (_pid, child) => {
      child.on("message", (message) => {
        messages.push(message);
        child.send("acknowledged");
      });
    },
    releaseOwned: async () => {},
    decode: (raw) => JSON.parse(raw),
  });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].kind, "nested-worker");
  assert.deepEqual(result, { reply: "acknowledged" });
});

test("retained owner IPC is unavailable without prior registration", async (t) => {
  const selected = await fixture(t, "process.stdout.write('selected\\n');");
  await assert.rejects(
    runOwnedProcess({
      ...selected,
      args: [],
      timeoutMs: 2_000,
      maximumBytes: 1024,
      failurePrefix: "native_likec4",
      retainIpc: true,
      decode: (raw) => JSON.parse(raw),
    }),
    { code: "owned_process_plan_invalid" },
  );
});

test("retained owner IPC loss terminates selected ordinary worker code", async (t) => {
  const selected = await fixture(
    t,
    "process.stdout.write('ready\\n'); setInterval(() => {}, 1000);",
  );
  const child = spawn(process.execPath, [gatedWorker, "--retain-ipc", selected.worker], {
    cwd: selected.scratch,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });
  t.after(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  });
  const exited = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  const ready = new Promise((resolve) => {
    child.stdout.once("data", resolve);
  });
  child.send("start");
  await ready;
  child.disconnect();
  assert.equal(await exited, 1);
});

test("invocation scope registers nested workers without changing their public callers", async (t) => {
  const runtime = await import("../packages/publisher/src/runtime/process-tree.mjs");
  assert.equal(typeof runtime.withOwnedProcessScope, "function");
  const selected = await fixture(
    t,
    'process.stdout.write(\'{"status":"ok"}\\n\'); setInterval(() => {}, 1000);',
  );
  const registrations = [];
  const releases = [];
  const result = await runtime.withOwnedProcessScope(
    {
      registerOwned: async (pid) => {
        registrations.push(pid);
      },
      releaseOwned: async (pid) => {
        releases.push(pid);
      },
    },
    () =>
      runOwnedProcess({
        ...selected,
        args: [],
        timeoutMs: 2_000,
        maximumBytes: 1024,
        failurePrefix: "native_likec4",
        decode: (raw) => JSON.parse(raw),
      }),
  );
  assert.deepEqual(result, { status: "ok" });
  assert.equal(registrations.length, 1);
  assert.deepEqual(releases, registrations);
});

test("invocation scope cannot be replaced by nested process options", async (t) => {
  const { withOwnedProcessScope } =
    await import("../packages/publisher/src/runtime/process-tree.mjs");
  const selected = await fixture(t, "process.stdout.write('selected\\n');");
  const owner = { registerOwned: async () => {}, releaseOwned: async () => {} };
  await assert.rejects(
    withOwnedProcessScope(owner, () =>
      runOwnedProcess({
        ...selected,
        args: [],
        timeoutMs: 2_000,
        maximumBytes: 1024,
        failurePrefix: "native_likec4",
        registerOwned: async () => {},
        releaseOwned: async () => {},
        decode: (raw) => JSON.parse(raw),
      }),
    ),
    { code: "owned_process_scope_override_forbidden" },
  );
  await assert.rejects(
    withOwnedProcessScope(owner, () => withOwnedProcessScope(owner, () => {})),
    {
      code: "owned_process_scope_invalid",
    },
  );
});

test("work scheduled inside a completed invocation cannot start an unowned worker", async (t) => {
  const { withOwnedProcessScope } =
    await import("../packages/publisher/src/runtime/process-tree.mjs");
  const selected = await fixture(t, "process.stdout.write('selected\\n');");
  let release;
  let late;
  const owner = { registerOwned: async () => {}, releaseOwned: async () => {} };
  await withOwnedProcessScope(owner, () => {
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    late = gate.then(() =>
      runOwnedProcess({
        ...selected,
        args: [],
        timeoutMs: 2_000,
        maximumBytes: 1024,
        failurePrefix: "native_likec4",
        decode: (raw) => JSON.parse(raw),
      }),
    );
  });
  release();
  await assert.rejects(late, { code: "owned_process_scope_expired" });
});

test("unacknowledged registration cannot extend the selected worker deadline", async (t) => {
  const marker = path.join(os.tmpdir(), `archpub-unacknowledged-${process.pid}-${Date.now()}`);
  t.after(() => fs.rm(marker, { force: true }));
  const selected = await fixture(
    t,
    `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(marker)}, 'started'); process.stdout.write('{"status":"ok"}\\n');`,
  );
  const start = Date.now();
  await assert.rejects(
    runOwnedProcess({
      ...selected,
      args: [],
      timeoutMs: 80,
      maximumBytes: 1024,
      failurePrefix: "native_likec4",
      registerOwned: () => new Promise(() => {}),
      releaseOwned: async () => {},
      decode: (raw) => JSON.parse(raw),
    }),
    { code: "native_likec4_registration_failed" },
  );
  assert(Date.now() - start < 1_000, "registration outlived the worker deadline");
  await assert.rejects(fs.access(marker), { code: "ENOENT" });
});

test("released registration failure withholds a selected reply", async (t) => {
  const selected = await fixture(
    t,
    'process.stdout.write(\'{"status":"ok"}\\n\'); setInterval(() => {}, 1000);',
  );
  await assert.rejects(
    runOwnedProcess({
      ...selected,
      args: [],
      timeoutMs: 2_000,
      maximumBytes: 1024,
      failurePrefix: "native_likec4",
      registerOwned: async () => {},
      releaseOwned: async () => {
        throw new Error("release acknowledgement lost");
      },
      decode: (raw) => JSON.parse(raw),
    }),
    { code: "native_likec4_cleanup_unproved" },
  );
});

test("neutral owned process withholds success on timeout or unproved cleanup", async (t) => {
  const waiting = await fixture(t, "setInterval(() => {}, 1000);");
  await assert.rejects(
    runOwnedProcess({
      ...waiting,
      args: [],
      timeoutMs: 80,
      maximumBytes: 1024,
      failurePrefix: "native_likec4",
      decode(_raw, _state, reason) {
        assert.equal(reason, "timeout");
        throw Object.assign(new Error("native_likec4_timeout"), { code: "native_likec4_timeout" });
      },
    }),
    { code: "native_likec4_timeout" },
  );

  const responding = await fixture(
    t,
    'process.stdout.write(\'{"status":"ok"}\\n\'); setInterval(() => {}, 1000);',
  );
  await assert.rejects(
    runOwnedProcess({
      ...responding,
      args: [],
      timeoutMs: 2_000,
      maximumBytes: 1024,
      failurePrefix: "native_likec4",
      terminateTree: async () => {
        throw Object.assign(new Error("cleanup unavailable"), {
          code: "native_likec4_cleanup_unproved",
        });
      },
      decode: () => ({ status: "ok" }),
    }),
    { code: "native_likec4_cleanup_unproved" },
  );
});

test("owned worker keeps inherited input available while explicit Node permissions deny ambient reads", async (t) => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13) || (major === 23 && minor < 5)) {
    t.skip("stable Node Permission Model requires Node 22.13 or newer");
    return;
  }
  const selected = await fixture(
    t,
    "import fs from 'node:fs'; let denied = false; try { fs.readFileSync(process.argv[2]); } catch (error) { denied = error.code === 'ERR_ACCESS_DENIED'; } process.stdout.write(JSON.stringify({ denied, request: fs.readFileSync(0, 'utf8') }) + '\\n'); setInterval(() => {}, 1000);",
  );
  const ambient = path.join(selected.scratch, "ambient.txt");
  await fs.writeFile(ambient, "unselected");
  for (const gated of [false, true]) {
    const result = await runOwnedProcess({
      ...selected,
      nodeFlags: ["--permission", `--allow-fs-read=${selected.worker}`],
      args: [ambient],
      timeoutMs: 2_000,
      maximumBytes: 1024,
      failurePrefix: "native_likec4",
      ...(gated ? { registerOwned: async () => {}, releaseOwned: async () => {} } : {}),
      decode(raw, _state, reason) {
        assert.equal(reason, "reply");
        return JSON.parse(raw);
      },
    });
    assert.deepEqual(result, { denied: true, request: "{}" });
  }
});
