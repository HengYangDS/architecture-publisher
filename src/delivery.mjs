import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { DELIVERY_FORMAT, digestTree } from "./build.mjs";
import { typesetColophon } from "./edition/colophon.mjs";
import { childEnvironment } from "./environment.mjs";
import { refuse } from "./refusal.mjs";

const ACCEPTANCE = "acceptance.json";
const SIGNATURE = "acceptance.sig";
const COLOPHON = "colophon.pdf";
const MANIFEST = "manifest.json";
/**
 * The acceptance record is an in-toto Statement: its subjects are the bytes accepted, the manifest and the colophon
 * page, by digest, and its predicate says who accepted them and when, so attestation tools read it as they read any
 * other statement.
 */
const STATEMENT = "https://in-toto.io/Statement/v1";
const PREDICATES = "https://github.com/HengYangDS/architecture-publisher/acceptance/";
const PREDICATE = `${PREDICATES}v2`;
/** The record format of the releases before the Statement, which named its version beside it. */
const EARLIER_FORMAT = "architecture-publisher.acceptance";
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
  const present = await digestTree(directory, new Set([MANIFEST, ACCEPTANCE, SIGNATURE, COLOPHON]));
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
 * @param {string | Buffer} input
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

/** The armoured SSH signature of the acceptance record's exact bytes. */
async function signRecord(key, bytes) {
  const signed = await sshKeygen(["-Y", "sign", "-f", key, "-n", NAMESPACE], bytes);
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
 * Record a reviewer's acceptance of an unchanged delivery: set its colophon page, write the acceptance record as an
 * in-toto Statement of the manifest and the page and, when the reviewer names a key, sign the record's exact bytes
 * into a detached signature beside it.
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
  for (const file of [ACCEPTANCE, SIGNATURE, COLOPHON])
    if (await fs.lstat(path.join(directory, file)).catch(() => null))
      refuse("acceptance_exists", `${path.join(directory, file)} already exists.`);
  const acceptedAt = acceptanceTime();
  // The slip names the signing key, so the key is read before the page is set.
  const signer = sign ? await fingerprintOf(sign) : null;
  const { pdf } = await typesetColophon({
    locale: manifest.model.locale,
    title: manifest.model.title,
    revision: manifest.repository?.revision ?? null,
    release: manifest.edition?.release ?? null,
    date: manifest.edition?.date ?? null,
    reviewer,
    sealName,
    note,
    acceptedAt,
    manifest: manifestSha256,
    signer,
  });
  const statement = {
    _type: STATEMENT,
    subject: [
      { name: MANIFEST, digest: { sha256: manifestSha256 } },
      { name: COLOPHON, digest: { sha256: sha256(pdf) } },
    ],
    predicateType: PREDICATE,
    predicate: {
      reviewer,
      ...(sealName ? { sealName } : {}),
      ...(note ? { note } : {}),
      acceptedAt,
      model: manifest.model.id,
      ...(signer ? { signer } : {}),
    },
  };
  const bytes = Buffer.from(`${JSON.stringify(statement, null, 2)}\n`);
  // The key signs before anything is written, so a key that cannot sign leaves the delivery as it was.
  const signature = sign ? await signRecord(sign, bytes) : null;
  const colophon = path.join(directory, COLOPHON);
  const signatureFile = path.join(directory, SIGNATURE);
  await fs.writeFile(colophon, pdf, { flag: "wx" });
  await fs.writeFile(path.join(directory, ACCEPTANCE), bytes, { flag: "wx" });
  if (signature) await fs.writeFile(signatureFile, signature, { flag: "wx" });
  return {
    directory: path.resolve(directory),
    manifest: manifestSha256,
    reviewer,
    acceptedAt,
    colophon: path.resolve(colophon),
    signer,
    signature: signature ? path.resolve(signatureFile) : null,
  };
}

/** The digest a Statement records for one of its subjects, by name. */
const subjectDigest = (statement, name) =>
  statement.subject.find((subject) => subject?.name === name)?.digest?.sha256;

/**
 * A delivery's acceptance record and its exact bytes, when it is an acceptance Statement whose subjects are the
 * delivery's manifest and colophon page, and whose signature is beside it exactly when it names a signer.
 * @param {string} directory
 * @param {string} manifestSha256
 * @param {string} unaccepted the code of a refusal for a delivery without a record
 */
async function readAcceptance(directory, manifestSha256, unaccepted) {
  let bytes;
  try {
    bytes = await fs.readFile(path.join(directory, ACCEPTANCE));
  } catch (error) {
    if (/** @type {any} */ (error).code !== "ENOENT") throw error;
    refuse(unaccepted, "The delivery has no acceptance record; run archpub accept first.");
  }
  let statement;
  try {
    statement = JSON.parse(bytes.toString("utf8"));
  } catch {
    refuse("acceptance_invalid", `${ACCEPTANCE} is not JSON.`);
  }
  const earlier = statement?.format === EARLIER_FORMAT;
  if (
    earlier ||
    (statement?.predicateType?.startsWith?.(PREDICATES) && statement.predicateType !== PREDICATE)
  )
    refuse(
      "acceptance_version_unsupported",
      `${ACCEPTANCE} is ${earlier ? `the version ${statement.version} record of an earlier release` : `a ${statement.predicateType} statement`}; remove it and accept the unchanged delivery again to write ${PREDICATE}.`,
    );
  if (
    statement?._type !== STATEMENT ||
    statement.predicateType !== PREDICATE ||
    !Array.isArray(statement.subject) ||
    typeof statement.predicate?.reviewer !== "string"
  )
    refuse("acceptance_invalid", `${ACCEPTANCE} is not an in-toto Statement of ${PREDICATE}.`);
  if (subjectDigest(statement, MANIFEST) !== manifestSha256)
    refuse("acceptance_manifest_mismatch", `${ACCEPTANCE} names another ${MANIFEST}.`);
  const page = await fs.readFile(path.join(directory, COLOPHON)).catch(() => null);
  if (!page || sha256(page) !== subjectDigest(statement, COLOPHON))
    refuse("acceptance_colophon_changed", `${COLOPHON} is not the page ${ACCEPTANCE} names.`);
  const signed = Boolean(await fs.lstat(path.join(directory, SIGNATURE)).catch(() => null));
  const signer = statement.predicate.signer ?? null;
  if (signed !== Boolean(signer))
    refuse(
      "acceptance_signature_invalid",
      signer
        ? `${ACCEPTANCE} names the signing key ${signer}, but ${SIGNATURE} is missing.`
        : `${SIGNATURE} lies beside ${ACCEPTANCE}, which names no signing key.`,
    );
  return { statement, bytes, signer };
}

/**
 * Check the detached signature against the record's exact bytes for its reviewer with an allowed signers file, and
 * that the key that signed is the signing key the record names.
 */
async function checkSignature(directory, { statement, bytes, signer }, allowedSigners) {
  const { reviewer } = statement.predicate;
  if (!signer) refuse("acceptance_signature_invalid", `${ACCEPTANCE} is unsigned.`);
  const file = path.join(directory, SIGNATURE);
  const args = ["-Y", "verify", "-f", allowedSigners, "-I", reviewer, "-n", NAMESPACE, "-s", file];
  const checked = await sshKeygen(args, bytes);
  if (!checked.ok || !checked.stdout.includes(` ${signer}`))
    refuse(
      "acceptance_signature_invalid",
      `${SIGNATURE} does not verify ${ACCEPTANCE} as ${reviewer}'s with ${signer}: ${(checked.stderr || checked.stdout).trim()}`,
    );
}

/**
 * Verify an accepted delivery: every artifact against the manifest, the acceptance record against the manifest and
 * the colophon page, the signature's presence against the record and, given allowed signers, the signature against
 * the record's bytes for its reviewer. The first link that fails is refused.
 * @param {string} directory
 * @param {{ allowedSigners?: string | null }} [options]
 */
export async function verifyAcceptance(directory, options = {}) {
  const { manifestSha256 } = await verifyDelivery(directory);
  const accepted = await readAcceptance(directory, manifestSha256, "acceptance_missing");
  if (options.allowedSigners) await checkSignature(directory, accepted, options.allowedSigners);
  return {
    directory: path.resolve(directory),
    manifest: manifestSha256,
    reviewer: accepted.statement.predicate.reviewer,
    acceptedAt: accepted.statement.predicate.acceptedAt,
    signer: accepted.signer,
    signature: options.allowedSigners ? "verified" : accepted.signer ? "unchecked" : "unsigned",
  };
}

/**
 * Copy an accepted delivery with its colophon page, its acceptance record and any signature to
 * `<root>/<model id>/<version>/`. An identical existing version
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
