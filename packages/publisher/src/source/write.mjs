import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { LIMITS, portableKey } from "../file-input/contract.mjs";
import { fail } from "../protocol/values.mjs";
import { validateManifest } from "./manifest.mjs";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Exclusive new-directory writer. Incomplete output is retained, never promoted. */
export async function writeSourceBundle(output, source, members) {
  if (typeof output !== "string" || !path.isAbsolute(output)) fail("output_path_required");
  if (!Array.isArray(members) || !members.length || members.length > LIMITS.files)
    fail("members_invalid");
  let total = 0;
  const copied = members.map((member) => {
    if (!Buffer.isBuffer(member?.content)) fail("member_content_invalid");
    if (member.content.length > LIMITS.memberBytes) fail("member_size_invalid");
    total += member.content.length;
    if (total > LIMITS.totalBytes) fail("bundle_size_exceeded");
    return { path: member.path, content: Buffer.from(member.content) };
  });
  const manifest = validateManifest({
    schema: "architecture.source-bundle/v1",
    source,
    files: copied.map((m) => ({
      path: m.path,
      bytes: m.content.length,
      sha256: sha(m.content),
    })),
  });
  if (
    manifest.files.some(
      (m) =>
        portableKey(m.path) === "manifest.json" || portableKey(m.path).startsWith("manifest.json/"),
    )
  )
    fail("manifest_self_member");
  const directories = new Set();
  for (const member of manifest.files) {
    const parts = member.path.split("/");
    for (let i = 1; i < parts.length; i++) directories.add(parts.slice(0, i).join("/"));
  }
  if (1 + manifest.files.length + directories.size > LIMITS.entries)
    fail("bundle_entries_exceeded");
  const raw = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
  if (raw.length > LIMITS.manifestBytes) fail("manifest_size_exceeded");
  const parent = path.dirname(output),
    parentStat = await fs.lstat(parent);
  if (
    !parentStat.isDirectory() ||
    parentStat.isSymbolicLink() ||
    (await fs.realpath(parent)) !== parent
  )
    fail("output_parent_invalid");
  try {
    await fs.mkdir(output);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST")
      fail("output_exists");
    throw error;
  }
  for (const member of copied) {
    const file = path.join(output, ...member.path.split("/"));
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, member.content, { flag: "wx" });
  }
  const manifestPath = path.join(output, "manifest.json");
  await fs.writeFile(manifestPath, raw, { flag: "wx" });
  return { manifestPath, manifestSha256: sha(raw), memberCount: copied.length };
}
