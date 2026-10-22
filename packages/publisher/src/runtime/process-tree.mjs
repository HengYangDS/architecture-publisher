import { AsyncLocalStorage } from "node:async_hooks";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fail } from "../protocol/values.mjs";

export const PROCESS_CLEANUP_MS = 5_000;
const gatedWorker = fileURLToPath(new URL("./gated-worker.mjs", import.meta.url));

/** @typedef {{active: boolean, registerOwned: (pid: number) => Promise<void>, releaseOwned: (pid: number) => Promise<void>}} OwnedProcessScope */
/** @type {AsyncLocalStorage<OwnedProcessScope>} */
const ownedProcessScope = new AsyncLocalStorage();

/** Bind nested Publisher workers to one invocation without changing compiler inputs. */
export async function withOwnedProcessScope(owner, operation) {
  if (
    !owner ||
    typeof owner.registerOwned !== "function" ||
    typeof owner.releaseOwned !== "function" ||
    typeof operation !== "function" ||
    ownedProcessScope.getStore()
  )
    fail("owned_process_scope_invalid");
  const scope = { ...owner, active: true };
  return ownedProcessScope.run(scope, async () => {
    try {
      return await operation();
    } finally {
      scope.active = false;
    }
  });
}

/**
 * @typedef {{
 *   stdout: Buffer[], stdoutBytes: number, stderrBytes: number,
 *   exited: boolean, closed: {code: number | null, signal: NodeJS.Signals | null} | null,
 *   spawnError: Error | null
 * }} OwnedProcessState
 */

/**
 * @typedef {{
 *   worker: string, nodeFlags?: string[], args: string[], requestPath: string,
 *   scratch: string,
 *   timeoutMs: number, maximumBytes: number, failurePrefix: string,
 *   terminateTree?: (pid: number) => Promise<void>,
 *   registerOwned?: (pid: number, child: import('node:child_process').ChildProcess) => Promise<void>,
 *   releaseOwned?: (pid: number) => Promise<void>,
 *   retainIpc?: boolean,
 *   decode: (raw: string, state: OwnedProcessState, reason: string,
 *     closedBeforeCleanup: boolean) => unknown | Promise<unknown>
 * }} OwnedProcessPlan
 */

/** @param {string} scratch @param {string | null} selectedSystemRoot */
export function workerEnvironment(scratch, selectedSystemRoot = null) {
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
    ...(selectedSystemRoot ? { SystemRoot: selectedSystemRoot } : {}),
    ...(process.env.NODE_V8_COVERAGE ? { NODE_V8_COVERAGE: process.env.NODE_V8_COVERAGE } : {}),
  };
}

export async function terminatePosixGroup(pid, signal = process.kill) {
  try {
    signal(-pid, "SIGKILL");
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ESRCH"))
      throw error;
    let workerAlive = false;
    try {
      signal(pid, 0);
      workerAlive = true;
    } catch (workerError) {
      if (!(
        workerError &&
        typeof workerError === "object" &&
        "code" in workerError &&
        workerError.code === "ESRCH"
      ))
        throw workerError;
    }
    if (workerAlive)
      throw new Error("selected worker remains alive without its process group", {
        cause: error,
      });
  }
}

export async function resolveWindowsTaskkill(failurePrefix, systemRoot = process.env.SystemRoot) {
  const code = `${failurePrefix}_cleanup_unavailable`;
  if (!systemRoot || !path.isAbsolute(systemRoot)) fail(code);
  const tool = path.join(systemRoot, "System32", "taskkill.exe");
  try {
    if (!(await fs.stat(tool)).isFile()) fail(code);
  } catch {
    fail(code);
  }
  return tool;
}

function selectedWorkerPresent(child, state) {
  if (state.exited || child.exitCode !== null || child.signalCode !== null) return false;
  try {
    process.kill(child.pid, 0);
    return true;
  } catch {
    return false;
  }
}

function cleanupUnproved(failurePrefix, cause) {
  const code = `${failurePrefix}_cleanup_unproved`;
  return Object.assign(new Error(code, { cause }), { code });
}

export async function terminateWindowsTree(tool, child, state, failurePrefix) {
  if (!selectedWorkerPresent(child, state)) throw cleanupUnproved(failurePrefix);
  try {
    await new Promise((resolve, reject) => {
      const terminator = spawn(tool, ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      const deadline = setTimeout(() => {
        terminator.kill("SIGKILL");
        reject(new Error("native tree cleanup exceeded its deadline"));
      }, PROCESS_CLEANUP_MS);
      terminator.once("error", (error) => {
        clearTimeout(deadline);
        reject(error);
      });
      terminator.once("close", (code) => {
        clearTimeout(deadline);
        if (code === 0) resolve(undefined);
        else reject(new Error(`native tree cleanup exited ${code}`));
      });
    });
  } catch (error) {
    if (!selectedWorkerPresent(child, state)) throw cleanupUnproved(failurePrefix, error);
    throw error;
  }
}

function observe(child, maximumBytes, timeoutMs) {
  /** @type {OwnedProcessState} */
  const state = {
    stdout: [],
    stdoutBytes: 0,
    stderrBytes: 0,
    exited: false,
    closed: null,
    spawnError: null,
  };
  let resolveTrigger;
  let resolveClosed;
  let selected = false;
  const trigger = new Promise((resolve) => {
    resolveTrigger = resolve;
  });
  const closed = new Promise((resolve) => {
    resolveClosed = resolve;
  });
  const deadline = setTimeout(() => select("timeout"), timeoutMs);

  function select(reason) {
    if (selected) return;
    selected = true;
    clearTimeout(deadline);
    resolveTrigger(reason);
  }

  child.stdout.on("data", (chunk) => {
    state.stdoutBytes += chunk.length;
    if (state.stdoutBytes < maximumBytes) state.stdout.push(chunk);
    if (state.stdoutBytes >= maximumBytes) select("overflow");
    else if (chunk.includes(0x0a)) select("reply");
  });
  child.stderr.on("data", (chunk) => {
    state.stderrBytes += chunk.length;
    select("stderr");
  });
  child.once("error", (error) => {
    state.spawnError = error;
    select("spawn-error");
  });
  child.once("exit", () => {
    state.exited = true;
  });
  child.once("close", (code, signal) => {
    state.closed = { code, signal };
    resolveClosed(state.closed);
    select("closed");
  });
  return { state, trigger, closed };
}

async function waitForClose(closed) {
  let deadline;
  try {
    return await Promise.race([
      closed,
      new Promise((resolve) => {
        deadline = setTimeout(() => resolve(null), PROCESS_CLEANUP_MS);
      }),
    ]);
  } finally {
    clearTimeout(deadline);
  }
}

function cleanupFailure(failurePrefix, originalFailure, cause) {
  const code =
    cause?.code === `${failurePrefix}_cleanup_unproved`
      ? `${failurePrefix}_cleanup_unproved`
      : `${failurePrefix}_cleanup_failed`;
  return Object.assign(new Error(code), {
    code,
    originalFailure,
    cleanupFailure: cause?.code ?? cause?.message ?? "unobserved",
  });
}

/**
 * Supervise one owned child without interpreting its protocol reply.
 * @param {OwnedProcessPlan} plan
 */
export async function runOwnedProcess({
  worker,
  nodeFlags = [],
  args,
  requestPath,
  scratch,
  timeoutMs,
  maximumBytes,
  failurePrefix,
  terminateTree = undefined,
  registerOwned = undefined,
  releaseOwned = undefined,
  retainIpc = false,
  decode,
}) {
  const scope = ownedProcessScope.getStore();
  if (scope) {
    if (!scope.active) fail("owned_process_scope_expired");
    if (registerOwned !== undefined || releaseOwned !== undefined || retainIpc)
      fail("owned_process_scope_override_forbidden");
    registerOwned = scope.registerOwned;
    releaseOwned = scope.releaseOwned;
  }
  if (
    !path.isAbsolute(worker) ||
    !path.isAbsolute(requestPath) ||
    !path.isAbsolute(scratch) ||
    !Array.isArray(nodeFlags) ||
    nodeFlags.some((flag) => typeof flag !== "string") ||
    !Array.isArray(args) ||
    args.some((arg) => typeof arg !== "string") ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0 ||
    !Number.isSafeInteger(maximumBytes) ||
    maximumBytes <= 0 ||
    typeof failurePrefix !== "string" ||
    !/^[a-z][a-z0-9_]*$/u.test(failurePrefix) ||
    (registerOwned === undefined) !== (releaseOwned === undefined) ||
    (registerOwned !== undefined && typeof registerOwned !== "function") ||
    (releaseOwned !== undefined && typeof releaseOwned !== "function") ||
    typeof retainIpc !== "boolean" ||
    (retainIpc && registerOwned === undefined) ||
    typeof decode !== "function"
  )
    fail("owned_process_plan_invalid");
  const windowsTool =
    !terminateTree && process.platform === "win32"
      ? await resolveWindowsTaskkill(failurePrefix)
      : null;
  const selectedSystemRoot = windowsTool ? path.dirname(path.dirname(windowsTool)) : null;
  const handle = await fs.open(requestPath, "r");
  let child;
  try {
    const gated = registerOwned !== undefined;
    const selectedFlags =
      gated && nodeFlags.includes("--permission")
        ? [...nodeFlags, `--allow-fs-read=${gatedWorker}`]
        : nodeFlags;
    child = spawn(
      process.execPath,
      [
        ...selectedFlags,
        gated ? gatedWorker : worker,
        ...(gated ? [...(retainIpc ? ["--retain-ipc"] : []), worker] : []),
        ...args,
      ],
      {
        cwd: scratch,
        env: workerEnvironment(scratch, selectedSystemRoot),
        stdio: gated ? [handle.fd, "pipe", "pipe", "ipc"] : [handle.fd, "pipe", "pipe"],
        detached: process.platform !== "win32",
        windowsHide: true,
      },
    );
    const observation = observe(child, maximumBytes, timeoutMs);
    let registrationError;
    if (gated && child.pid && registerOwned) {
      const register = registerOwned;
      try {
        const registered = await Promise.race([
          Promise.resolve()
            .then(() => register(child.pid, child))
            .then(() => "registered"),
          observation.trigger.then(() => "worker-stopped"),
        ]);
        if (registered !== "registered") throw new Error("worker stopped before registration");
        const sent = await Promise.race([
          new Promise((resolve, reject) => {
            child.send("start", (error) => (error ? reject(error) : resolve("sent")));
          }),
          observation.trigger.then(() => "worker-stopped"),
        ]);
        if (sent !== "sent") throw new Error("worker stopped before start");
      } catch (error) {
        registrationError = error;
      }
    }
    const reason = registrationError ? "registration-failed" : await observation.trigger;
    const closedBeforeCleanup = observation.state.closed !== null;
    let cleanupError;
    if (child.pid) {
      try {
        if (terminateTree) await terminateTree(child.pid);
        else if (windowsTool)
          await terminateWindowsTree(windowsTool, child, observation.state, failurePrefix);
        else await terminatePosixGroup(child.pid);
      } catch (error) {
        cleanupError =
          error instanceof Error
            ? error
            : new Error("native tree cleanup rejected without an Error", { cause: error });
        child.kill("SIGKILL");
      }
    }
    const closed = await waitForClose(observation.closed);
    if (!closed) {
      child.kill("SIGKILL");
      cleanupError ??= new Error("selected worker did not close after cleanup");
    }
    if (!cleanupError && releaseOwned && child.pid) {
      try {
        await releaseOwned(child.pid);
      } catch (error) {
        cleanupError = cleanupUnproved(failurePrefix, error);
      }
    }
    if (registrationError) {
      if (cleanupError)
        throw cleanupFailure(failurePrefix, `${failurePrefix}_registration_failed`, cleanupError);
      fail(`${failurePrefix}_registration_failed`);
    }
    const raw = Buffer.concat(observation.state.stdout).toString("utf8");
    let result;
    try {
      result = await decode(raw, observation.state, reason, closedBeforeCleanup);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? error.code : reason;
      if (cleanupError) throw cleanupFailure(failurePrefix, code, cleanupError);
      throw error;
    }
    if (cleanupError) throw cleanupFailure(failurePrefix, null, cleanupError);
    return result;
  } finally {
    if (child && !child.killed && child.exitCode === null && child.signalCode === null)
      child.kill("SIGKILL");
    await handle.close();
  }
}
