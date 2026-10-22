import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { LIMITS } from "../packages/publisher/src/file-input/contract.mjs";
import { writeSourceBundle } from "../packages/publisher/src/source/write.mjs";

const source = Object.freeze({ id: "source-write-fixture", revision: "selected" });
const member = () => ({ path: "nested/value.json", content: Buffer.from('{"selected":true}\n') });

test("source writer creates one exclusive directory without replacing accepted bytes", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-write-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const output = path.join(root, "bundle");
  const created = await writeSourceBundle(output, source, [member()]);
  assert.equal(created.memberCount, 1);
  assert.deepEqual(await fs.readFile(path.join(output, "nested/value.json")), member().content);
  assert.match(created.manifestSha256, /^[a-f0-9]{64}$/);
  await assert.rejects(writeSourceBundle(output, source, [member()]), { code: "output_exists" });
  assert.deepEqual(await fs.readFile(path.join(output, "nested/value.json")), member().content);
});

test("source writer rejects ambiguous input and unsafe destination parents", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-write-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const output = path.join(root, "bundle");
  const cases = [
    ["relative output", "bundle", [member()], "output_path_required"],
    ["missing members", output, [], "members_invalid"],
    [
      "non-buffer bytes",
      output,
      [{ path: "value.json", content: "text" }],
      "member_content_invalid",
    ],
    [
      "manifest collision",
      output,
      [{ path: "manifest.json", content: Buffer.from("x") }],
      "manifest_self_member",
    ],
    [
      "manifest descendant",
      output,
      [{ path: "manifest.json/child", content: Buffer.from("x") }],
      "manifest_self_member",
    ],
  ];
  for (const [name, selectedOutput, members, code] of cases)
    await assert.rejects(writeSourceBundle(selectedOutput, source, members), { code }, name);

  const parentFile = path.join(root, "parent-file");
  await fs.writeFile(parentFile, "owned");
  await assert.rejects(writeSourceBundle(path.join(parentFile, "bundle"), source, [member()]), {
    code: "output_parent_invalid",
  });
  const linkedParent = path.join(root, "linked-parent");
  await fs.symlink(root, linkedParent);
  await assert.rejects(writeSourceBundle(path.join(linkedParent, "bundle"), source, [member()]), {
    code: "output_parent_invalid",
  });
  await assert.rejects(fs.stat(output), { code: "ENOENT" });
});

test("source writer enforces bounded member bytes and preserves unexpected I/O errors", async (t) => {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "archpub-write-")));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const output = path.join(root, "bundle");
  await assert.rejects(
    writeSourceBundle(output, source, [
      { path: "large.bin", content: Buffer.alloc(LIMITS.memberBytes + 1) },
    ]),
    { code: "member_size_invalid" },
  );

  const nativeMkdir = fs.mkdir;
  fs.mkdir = async (selected, ...args) => {
    if (selected === output)
      throw Object.assign(new Error("selected output refused"), { code: "EACCES" });
    return nativeMkdir(selected, ...args);
  };
  try {
    await assert.rejects(writeSourceBundle(output, source, [member()]), { code: "EACCES" });
  } finally {
    fs.mkdir = nativeMkdir;
  }
  await assert.rejects(fs.stat(output), { code: "ENOENT" });
});
