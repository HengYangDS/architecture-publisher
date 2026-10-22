import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { evidence, alive, waitForExit } from "./fixtures/provider-worker-lifetime.mjs";

test(
  "tree terminator scopes a native-tool invocation to the selected PID",
  {
    skip: process.platform === "win32",
  },
  async () => {
    await fs.mkdir(evidence, { recursive: true });
    const scratch = await fs.mkdtemp(new URL("provider-native-tool-", evidence));
    const tool = path.join(scratch, "taskkill.exe");
    const marker = path.join(scratch, "invocation");
    let selected;
    let sentinel;
    try {
      await fs.writeFile(
        tool,
        `#!/bin/sh\nprintf '%s\\n' "$*" > ${JSON.stringify(marker)}\n` +
          '[ "$1" = /PID ] && [ "$3" = /T ] && [ "$4" = /F ] || exit 7\n' +
          'kill -KILL "$2"\n',
      );
      await fs.chmod(tool, 0o700);
      selected = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
        stdio: "ignore",
      });
      sentinel = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
        stdio: "ignore",
      });
      const { terminateWindowsTree } =
        await import("../packages/publisher/src/provider/supervisor.mjs");
      await terminateWindowsTree(tool, selected, { exited: false });
      assert.equal(await waitForExit(selected.pid), true);
      assert.equal(alive(sentinel.pid), true, "unrelated process was killed");
      assert.equal(await fs.readFile(marker, "utf8"), `/PID ${selected.pid} /T /F\n`);
    } finally {
      if (selected && alive(selected.pid)) selected.kill("SIGKILL");
      if (sentinel && alive(sentinel.pid)) sentinel.kill("SIGKILL");
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test(
  "tree terminator never invokes a native tool after the root exits",
  {
    skip: process.platform === "win32",
  },
  async () => {
    await fs.mkdir(evidence, { recursive: true });
    const scratch = await fs.mkdtemp(new URL("provider-root-gone-", evidence));
    const tool = path.join(scratch, "taskkill.exe");
    const marker = path.join(scratch, "invoked");
    const selected = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      stdio: "ignore",
    });
    const completed = spawn(process.execPath, ["-e", "process.exit(0)"], {
      stdio: "ignore",
    });
    const completedClosed = new Promise((resolve) => completed.once("close", resolve));
    try {
      await fs.writeFile(tool, `#!/bin/sh\ntouch ${JSON.stringify(marker)}\n`);
      await fs.chmod(tool, 0o700);
      const selectedClosed = new Promise((resolve) => selected.once("close", resolve));
      selected.kill("SIGKILL");
      await selectedClosed;
      await completedClosed;
      const { terminateWindowsTree } =
        await import("../packages/publisher/src/provider/supervisor.mjs");
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: true }), {
        code: "edition_provider_cleanup_unproved",
      });
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: false }), {
        code: "edition_provider_cleanup_unproved",
      });
      await assert.rejects(terminateWindowsTree(tool, completed, { exited: false }), {
        code: "edition_provider_cleanup_unproved",
      });
      await assert.rejects(
        terminateWindowsTree(
          tool,
          { pid: selected.pid, exitCode: null, signalCode: null },
          { exited: false },
        ),
        { code: "edition_provider_cleanup_unproved" },
      );
      await assert.rejects(fs.access(marker), { code: "ENOENT" });
    } finally {
      if (alive(selected.pid)) selected.kill("SIGKILL");
      if (alive(completed.pid)) completed.kill("SIGKILL");
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test("native tool resolution rejects missing candidates before execution", async (t) => {
  const scratch = await fs.mkdtemp(
    path.join(await fs.realpath(os.tmpdir()), "provider-tool-resolution-"),
  );
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const { resolveWindowsTaskkill } =
    await import("../packages/publisher/src/provider/supervisor.mjs");
  await assert.rejects(resolveWindowsTaskkill(""), {
    code: "edition_provider_cleanup_unavailable",
  });
  await assert.rejects(resolveWindowsTaskkill("relative-system-root"), {
    code: "edition_provider_cleanup_unavailable",
  });
  await assert.rejects(resolveWindowsTaskkill(scratch), {
    code: "edition_provider_cleanup_unavailable",
  });
  const system32 = path.join(scratch, "System32");
  await fs.mkdir(system32);
  const tool = path.join(system32, "taskkill.exe");
  await fs.mkdir(tool);
  await assert.rejects(resolveWindowsTaskkill(scratch), {
    code: "edition_provider_cleanup_unavailable",
  });
  await fs.rmdir(tool);
  await fs.writeFile(tool, "");
  assert.equal(await resolveWindowsTaskkill(scratch), tool);
});

test(
  "native tree tool spawn failure rejects cleanup while the selected root survives",
  { skip: process.platform === "win32" },
  async () => {
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), "provider-tool-spawn-error-"),
    );
    const selected = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      stdio: "ignore",
    });
    try {
      const { terminateWindowsTree } =
        await import("../packages/publisher/src/provider/supervisor.mjs");
      await assert.rejects(
        terminateWindowsTree(path.join(scratch, "missing-taskkill.exe"), selected, {
          exited: false,
        }),
        { code: "ENOENT" },
      );
      assert.equal(alive(selected.pid), true);
    } finally {
      if (alive(selected.pid)) selected.kill("SIGKILL");
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test(
  "native tool failure after root loss reports cleanup as unproved",
  { skip: process.platform === "win32" },
  async () => {
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), "provider-tool-root-race-"),
    );
    const tool = path.join(scratch, "taskkill.exe");
    const selected = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      stdio: "ignore",
    });
    try {
      await fs.writeFile(tool, '#!/bin/sh\nkill -KILL "$2"\nsleep 1\nexit 7\n');
      await fs.chmod(tool, 0o700);
      const { terminateWindowsTree } =
        await import("../packages/publisher/src/provider/supervisor.mjs");
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: false }), {
        code: "edition_provider_cleanup_unproved",
      });
      assert.equal(await waitForExit(selected.pid), true);
    } finally {
      if (alive(selected.pid)) selected.kill("SIGKILL");
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test(
  "native tree tool nonzero exit cannot claim cleanup",
  { skip: process.platform === "win32" },
  async () => {
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), "provider-tool-failure-"),
    );
    const tool = path.join(scratch, "taskkill.exe");
    const selected = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      stdio: "ignore",
    });
    try {
      await fs.writeFile(tool, "#!/bin/sh\nexit 7\n");
      await fs.chmod(tool, 0o700);
      const { terminateWindowsTree } =
        await import("../packages/publisher/src/provider/supervisor.mjs");
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: false }), {
        message: "native tree cleanup exited 7",
      });
      assert.equal(alive(selected.pid), true);
    } finally {
      if (alive(selected.pid)) selected.kill("SIGKILL");
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);

test(
  "native tree tool deadline kills the tool and rejects cleanup",
  {
    skip: process.platform === "win32",
  },
  async () => {
    const scratch = await fs.mkdtemp(
      path.join(await fs.realpath(os.tmpdir()), "provider-tool-timeout-"),
    );
    const tool = path.join(scratch, "taskkill.exe");
    const marker = path.join(scratch, "tool.pid");
    const selected = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      stdio: "ignore",
    });
    let toolPid;
    try {
      await fs.writeFile(tool, `#!/bin/sh\necho $$ > ${JSON.stringify(marker)}\nexec sleep 30\n`);
      await fs.chmod(tool, 0o700);
      const { terminateWindowsTree } =
        await import("../packages/publisher/src/provider/supervisor.mjs");
      await assert.rejects(terminateWindowsTree(tool, selected, { exited: false }), {
        message: "native tree cleanup exceeded its deadline",
      });
      toolPid = Number(await fs.readFile(marker, "utf8"));
      assert.equal(await waitForExit(toolPid), true, "timed-out native tool survived");
    } finally {
      if (toolPid && alive(toolPid)) process.kill(toolPid, "SIGKILL");
      if (alive(selected.pid)) selected.kill("SIGKILL");
      await fs.rm(scratch, { recursive: true, force: true });
    }
  },
);
