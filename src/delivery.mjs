import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { DELIVERY_FORMAT, digestTree } from "./build.mjs";
import { typesetColophon } from "./edition/colophon.mjs";
import { childEnvironment } from "./environment.mjs";
import { refuse } from "./refusal.mjs";

const ACCEPTANCE = "acceptance.json";
const COLOPHON = "colophon.pdf";
const MANIFEST = "manifest.json";
const ACCEPTANCE_FORMAT = "architecture-publisher.acceptance";
const ACCEPTANCE_VERSION = 2;
/** The SSH signature namespace of an acceptance, so a signature made for anything else never verifies as one. */
const NAMESPACE = "archpub-acceptance";
const run = promisify(execFile);
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
  const present = await digestTree(directory, new Set([MANIFEST, ACCEPTANCE, COLOPHON]));
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
 * Run ssh-keygen with the given standard input, closed after it, and a deadline. The agent's socket is passed with
 * the usual variables, so a key whose private half ssh-agent holds signs without a prompt.
 * @param {string[]} args
 * @param {string} input
 */
async function sshKeygen(args, input) {
  const agent = process.env.SSH_AUTH_SOCK;
  const pending = run("ssh-keygen", args, {
    env: childEnvironment(agent ? { SSH_AUTH_SOCK: agent } : {}),
    timeout: 120_000,
  });
  pending.child.stdin?.end(input);
  return pending.then(
    ({ stdout }) => ({ ok: true, stdout, stderr: "" }),
    (error) => ({ ok: false, stdout: `${error.stdout ?? ""}`, stderr: `${error.stderr || error}` }),
  );
}

/** The SHA-256 fingerprint of the key a reviewer signs with, before anything is signed. */
async function fingerprintOf(key) {
  const listed = await sshKeygen(["-l", "-E", "sha256", "-f", key], "");
  const signer = /\bSHA256:[A-Za-z0-9+/]+/u.exec(listed.stdout)?.[0];
  if (!signer)
    refuse("acceptance_sign_failed", `ssh-keygen cannot use ${key}: ${listed.stderr.trim()}`);
  return signer;
}

/** The armoured SSH signature of a manifest's digest, as 64 hexadecimal digits without a newline. */
async function signDigest(key, digest) {
  const signed = await sshKeygen(["-Y", "sign", "-f", key, "-n", NAMESPACE], digest);
  if (!signed.ok)
    refuse("acceptance_sign_failed", `ssh-keygen cannot sign with ${key}: ${signed.stderr.trim()}`);
  return signed.stdout;
}

/** The time of acceptance in UTC to the second: SOURCE_DATE_EPOCH when the caller sets one, as a build reads it. */
function acceptanceTime() {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  const time = epoch && /^\d+$/u.test(epoch) ? new Date(Number(epoch) * 1000) : new Date();
  return time.toISOString().replace(/\.\d{3}Z$/u, "Z");
}

/**
 * Record a reviewer's acceptance of an unchanged delivery: set its colophon page, sign the manifest's digest when
 * the reviewer names a key, and write the colophon page and the acceptance record beside the delivery.
 * @param {string} directory
 * @param {{ reviewer: string, sealName?: string | null, note?: string | null, sign?: string | null }} acceptance
 */
export async function acceptDelivery(
  directory,
  { reviewer, sealName = null, note = null, sign = null },
) {
  if (typeof reviewer !== "string" || !/\S/u.test(reviewer))
    refuse("acceptance_reviewer_missing", "Name the reviewer.");
  if (sealName !== null && !/\S/u.test(sealName))
    refuse("acceptance_name_unset", "The seal name is empty; give the mark a name or none.");
  const { manifest, manifestSha256 } = await verifyDelivery(directory);
  for (const file of [ACCEPTANCE, COLOPHON])
    if (await fs.lstat(path.join(directory, file)).catch(() => null))
      refuse("acceptance_exists", `${path.join(directory, file)} already exists.`);
  const acceptedAt = acceptanceTime();
  const signer = sign ? await fingerprintOf(sign) : null;
  // The page is set before the key signs, so a name the mark cannot set asks for no signature.
  const { pdf } = await typesetColophon({
    locale: manifest.model.locale,
    title: manifest.model.title,
    revision: manifest.repository?.revision ?? null,
    release: manifest.edition?.release ?? null,
    date: manifest.edition?.date ?? null,
    reviewer,
    sealName,
    acceptedAt,
    manifest: manifestSha256,
    signer,
  });
  const signature = sign ? await signDigest(sign, manifestSha256) : null;
  const record = {
    format: ACCEPTANCE_FORMAT,
    version: ACCEPTANCE_VERSION,
    manifest: manifestSha256,
    model: manifest.model.id,
    reviewer,
    ...(sealName ? { seal_name: sealName } : {}),
    ...(note ? { note } : {}),
    accepted_at: acceptedAt,
    colophon: sha256(pdf),
    ...(signature ? { signature, signer } : {}),
  };
  const colophon = path.join(directory, COLOPHON);
  await fs.writeFile(colophon, pdf, { flag: "wx" });
  await fs.writeFile(path.join(directory, ACCEPTANCE), `${JSON.stringify(record, null, 2)}\n`, {
    flag: "wx",
  });
  return {
    directory: path.resolve(directory),
    manifest: manifestSha256,
    reviewer,
    acceptedAt,
    colophon: path.resolve(colophon),
    signer,
  };
}

/**
 * A delivery's acceptance record, when it is version 2 and names the delivery's manifest and colophon page.
 * @param {string} directory
 * @param {string} manifestSha256
 * @param {string} unaccepted the code of a refusal for a delivery without a record
 */
async function readAcceptance(directory, manifestSha256, unaccepted) {
  let text;
  try {
    text = await fs.readFile(path.join(directory, ACCEPTANCE), "utf8");
  } catch (error) {
    if (/** @type {any} */ (error).code !== "ENOENT") throw error;
    refuse(unaccepted, "The delivery has no acceptance record; run archpub accept first.");
  }
  let record;
  try {
    record = JSON.parse(text);
  } catch {
    refuse("acceptance_invalid", `${ACCEPTANCE} is not JSON.`);
  }
  if (record?.format !== ACCEPTANCE_FORMAT || typeof record.reviewer !== "string")
    refuse(
      "acceptance_invalid",
      `${ACCEPTANCE} is not an Architecture Publisher acceptance record.`,
    );
  if (record.version !== ACCEPTANCE_VERSION)
    refuse(
      "acceptance_version_unsupported",
      `${ACCEPTANCE} is version ${record.version}; remove it and accept the delivery again to write version ${ACCEPTANCE_VERSION}.`,
    );
  if (record.manifest !== manifestSha256)
    refuse("acceptance_manifest_mismatch", "The acceptance record names another manifest.");
  const page = await fs.readFile(path.join(directory, COLOPHON)).catch(() => null);
  if (!page || sha256(page) !== record.colophon)
    refuse(
      "acceptance_colophon_changed",
      `${COLOPHON} is not the page the acceptance record names.`,
    );
  return record;
}

/**
 * Check an acceptance record's signature of the manifest's digest for its reviewer against an allowed signers file,
 * and that the key that signed is the signer the record names.
 */
async function checkSignature(record, digest, allowedSigners) {
  if (typeof record.signature !== "string")
    refuse("acceptance_signature_invalid", "The acceptance record is unsigned.");
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-signature-"));
  try {
    const file = path.join(directory, "acceptance.sig");
    await fs.writeFile(file, record.signature);
    const args = ["-Y", "verify", "-f", allowedSigners, "-I", record.reviewer, "-n", NAMESPACE];
    const checked = await sshKeygen([...args, "-s", file], digest);
    if (!checked.ok || !checked.stdout.includes(` ${record.signer}`))
      refuse(
        "acceptance_signature_invalid",
        `The signature does not verify as ${record.reviewer}'s with ${record.signer}: ${(checked.stderr || checked.stdout).trim()}`,
      );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

/**
 * Verify an accepted delivery: every artifact against the manifest, the acceptance record against the manifest and
 * the colophon page and, given allowed signers, the record's signature for its reviewer. The first link that fails
 * is refused.
 * @param {string} directory
 * @param {{ allowedSigners?: string | null }} [options]
 */
export async function verifyAcceptance(directory, options = {}) {
  const { manifestSha256 } = await verifyDelivery(directory);
  const record = await readAcceptance(directory, manifestSha256, "acceptance_missing");
  if (options.allowedSigners) await checkSignature(record, manifestSha256, options.allowedSigners);
  return {
    directory: path.resolve(directory),
    manifest: manifestSha256,
    reviewer: record.reviewer,
    acceptedAt: record.accepted_at,
    signer: record.signer ?? null,
    signature: options.allowedSigners ? "verified" : record.signature ? "unchecked" : "unsigned",
  };
}

/**
 * Copy an accepted delivery with its colophon page to `<root>/<model id>/<version>/`. An identical existing version
 * is left as it is; a different one is refused.
 * @param {string} directory
 * @param {string} root
 * @param {{ version?: string | null }} [options]
 */
export async function publishDelivery(directory, root, options = {}) {
  const { manifest, manifestSha256 } = await verifyDelivery(directory);
  await readAcceptance(directory, manifestSha256, "publish_unaccepted");
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
