import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { installPairFiles } from "../packages/publisher/src/publication/files.mjs";
import { planPairFiles } from "../packages/publisher/src/publication/file-plan.mjs";

async function selected(t) {
  const root = new URL("../build/test-work/", import.meta.url);
  await fs.mkdir(root, { recursive: true });
  const scratch = await fs.mkdtemp(new URL("publication-durability-", root));
  t.after(() => fs.rm(scratch, { recursive: true, force: true }));
  const source = path.join(scratch, "source");
  const delivery = path.join(scratch, "delivery");
  await fs.mkdir(source);
  await fs.mkdir(delivery);
  const bytes = Buffer.from("Selected architecture publication.\n");
  const file = path.join(source, "architecture.txt");
  await fs.writeFile(file, bytes);
  const destinations = Object.fromEntries(
    ["native", "atlas"].map((medium) => [medium, path.join(delivery, medium)]),
  );
  for (const destination of Object.values(destinations)) {
    await fs.mkdir(destination);
    await fs.writeFile(path.join(destination, "keep.txt"), "Foreign bytes.\n");
  }
  const plan = await planPairFiles({
    options: {
      sourceRoots: [source],
      destinations,
      recoveryRoot: path.join(scratch, "recovery"),
    },
    source: { id: "durability-fixture" },
    payload: ["native", "atlas"].map((medium) => ({
      medium,
      path: "architecture.txt",
      source: file,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    })),
    entries: Object.fromEntries(
      ["native", "atlas"].map((medium) => [
        medium,
        { "index.html": "<p>Architecture</p>", "README.md": "Selected file publication.\n" },
      ]),
    ),
    dependencies: [],
  });
  return {
    scratch,
    destinations,
    plan,
    authorization: { decision: "AUTHORIZED", planSha256: plan.sha256 },
  };
}

test("file publication flushes newly written files through their writable handles", async (t) => {
  const input = await selected(t);
  const native = fs.writeFile;
  const writes = [];
  fs.writeFile = async (file, bytes, options) => {
    writes.push({ file, flush: options?.flush, flag: options?.flag });
    return native(file, bytes, options);
  };
  try {
    const result = await installPairFiles(input.plan, input.authorization);
    assert.equal(result.status, "INSTALLED");
    assert(writes.some(({ file }) => path.basename(file) === "owner.json"));
    assert(writes.some(({ file }) => path.basename(file) === "architecture.txt"));
    assert(writes.some(({ file }) => path.basename(file) === "delivery-manifest.json"));
    assert(writes.some(({ file }) => path.basename(file) === "SHA256SUMS"));
    assert.equal(
      writes.every(({ flush, flag }) => flush === true && flag === "wx"),
      true,
      "publication files were closed without required writable-handle flushing",
    );
  } finally {
    fs.writeFile = native;
  }
});

test("file publication reports its process-recovery and storage-durability boundary", async (t) => {
  const input = await selected(t);
  const result = await installPairFiles(input.plan, input.authorization);
  assert.deepEqual(result.durability, {
    fileFlush: "required-for-created-files",
    directoryFlush: process.platform === "win32" ? "unsupported" : "required",
    powerLossRecovery: "not-qualified",
  });
});

test("a required file flush error cannot admit installation or change delivery bytes", async (t) => {
  const input = await selected(t);
  const native = fs.writeFile;
  fs.writeFile = async (file, bytes, options) => {
    if (path.basename(file) === "owner.json") {
      assert.equal(options?.flush, true, "owner publication did not require a file flush");
      throw Object.assign(new Error("required owner file flush denied"), {
        code: "EPERM",
        syscall: "fsync",
      });
    }
    return native(file, bytes, options);
  };
  try {
    await assert.rejects(installPairFiles(input.plan, input.authorization), {
      code: "EPERM",
      syscall: "fsync",
    });
  } finally {
    fs.writeFile = native;
  }
  for (const destination of Object.values(input.destinations)) {
    assert.deepEqual(await fs.readdir(destination), ["keep.txt"]);
    assert.equal(await fs.readFile(path.join(destination, "keep.txt"), "utf8"), "Foreign bytes.\n");
  }
});

test(
  "a required directory flush error remains a failure rather than an ignored permission error",
  { skip: process.platform === "win32" },
  async (t) => {
    const input = await selected(t);
    const native = fs.open;
    fs.open = async (file, flags, mode) => {
      const handle = await native(file, flags, mode);
      if ((await handle.stat()).isDirectory()) {
        handle.sync = async () => {
          throw Object.assign(new Error("required directory flush denied"), { code: "EPERM" });
        };
      }
      return handle;
    };
    try {
      await assert.rejects(installPairFiles(input.plan, input.authorization), { code: "EPERM" });
    } finally {
      fs.open = native;
    }
    for (const destination of Object.values(input.destinations))
      assert.deepEqual(await fs.readdir(destination), ["keep.txt"]);
  },
);
