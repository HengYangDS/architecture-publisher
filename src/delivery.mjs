import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DELIVERY_FORMAT, digestTree } from "./build.mjs";
import { refuse } from "./refusal.mjs";

const ACCEPTANCE = "acceptance.json";
const MANIFEST = "manifest.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Read a delivery's manifest and verify that its files are exactly the listed artifacts. */
async function verifyDelivery(directory) {
  let bytes;
  try {
    bytes = await fs.readFile(path.join(directory, MANIFEST));
  } catch (error) {
    if (/** @type {any} */ (error).code !== "ENOENT") throw error;
    refuse("delivery_manifest_missing", `${directory} has no ${MANIFEST}.`);
  }
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString("utf8"));
  } catch {
    refuse("delivery_manifest_invalid", `${MANIFEST} is not JSON.`);
  }
  if (manifest?.format !== DELIVERY_FORMAT)
    refuse("delivery_manifest_invalid", `${MANIFEST} is not an Architecture Publisher delivery.`);
  const present = await digestTree(directory, new Set([MANIFEST, ACCEPTANCE]));
  if (JSON.stringify(present) !== JSON.stringify(manifest.artifacts))
    refuse(
      "delivery_changed",
      "The delivery's files differ from its manifest.",
      diff(manifest.artifacts, present).map((message) => ({ code: "delivery_changed", message })),
    );
  return { manifest, manifestSha256: sha256(bytes) };
}

function diff(expected, actual) {
  const listed = new Map(expected.map((item) => [item.path, item.sha256]));
  const found = new Map(actual.map((item) => [item.path, item.sha256]));
  return [
    ...[...listed].filter(([file]) => !found.has(file)).map(([file]) => `${file} is missing`),
    ...[...found]
      .filter(([file]) => !listed.has(file))
      .map(([file]) => `${file} is not in the manifest`),
    ...[...found]
      .filter(([file, digest]) => listed.has(file) && listed.get(file) !== digest)
      .map(([file]) => `${file} changed`),
  ];
}

/**
 * Record a reviewer's acceptance of an unchanged delivery.
 * @param {string} directory
 * @param {{ reviewer: string, note?: string | null }} acceptance
 */
export async function acceptDelivery(directory, { reviewer, note = null }) {
  if (typeof reviewer !== "string" || !/\S/u.test(reviewer))
    refuse("acceptance_reviewer_missing", "Name the reviewer.");
  const { manifest, manifestSha256 } = await verifyDelivery(directory);
  const file = path.join(directory, ACCEPTANCE);
  const record = {
    format: "architecture-publisher.acceptance",
    version: 1,
    manifest: manifestSha256,
    model: manifest.model.id,
    reviewer,
    ...(note ? { note } : {}),
  };
  try {
    await fs.writeFile(file, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  } catch (error) {
    if (/** @type {any} */ (error).code !== "EEXIST") throw error;
    refuse("acceptance_exists", `${file} already exists.`);
  }
  return { directory: path.resolve(directory), manifest: manifestSha256, reviewer };
}

/**
 * Copy an accepted delivery to `<root>/<model id>/<version>/`. An identical
 * existing version is left as it is; a different one is refused.
 * @param {string} directory
 * @param {string} root
 * @param {{ version?: string | null }} [options]
 */
export async function publishDelivery(directory, root, options = {}) {
  const { manifest, manifestSha256 } = await verifyDelivery(directory);
  let text;
  try {
    text = await fs.readFile(path.join(directory, ACCEPTANCE), "utf8");
  } catch (error) {
    if (/** @type {any} */ (error).code !== "ENOENT") throw error;
    refuse(
      "publish_unaccepted",
      "The delivery has no acceptance record; run archpub accept first.",
    );
  }
  let acceptance;
  try {
    acceptance = JSON.parse(text);
  } catch {
    refuse("publish_unaccepted", `${ACCEPTANCE} is not JSON.`);
  }
  if (acceptance.manifest !== manifestSha256)
    refuse("publish_unaccepted", "The acceptance record names another manifest.");
  const version = options.version ?? manifestSha256.slice(0, 12);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u.test(version))
    refuse("publish_version_invalid", `${version} is not a valid version name.`);
  const target = path.join(path.resolve(root), manifest.model.id, version);
  const source = await digestTree(directory);
  try {
    await fs.lstat(target);
    const existing = await digestTree(target);
    if (JSON.stringify(existing) !== JSON.stringify(source))
      refuse("publish_conflict", `${target} already holds a different delivery.`);
    return { target, version, copied: false };
  } catch (error) {
    // Only a version that does not exist yet is copied.
    if (/** @type {any} */ (error).code !== "ENOENT") throw error;
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  const staging = await fs.mkdtemp(path.join(path.dirname(target), `.${version}.partial-`));
  try {
    for (const { path: file } of source) {
      await fs.mkdir(path.dirname(path.join(staging, file)), { recursive: true });
      await fs.copyFile(path.join(directory, file), path.join(staging, file));
    }
    if (JSON.stringify(await digestTree(staging)) !== JSON.stringify(source))
      refuse("publish_copy_invalid", "The copied files differ from the delivery.");
    await fs.rename(staging, target);
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
  return { target, version, copied: true };
}
