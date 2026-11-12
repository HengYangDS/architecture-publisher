import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, digestTree } from "../src/build.mjs";
import { acceptDelivery, publishDelivery, verifyAcceptance } from "../src/delivery.mjs";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";

const STATEMENT = "https://in-toto.io/Statement/v1";
const PREDICATE = "https://github.com/HengYangDS/architecture-publisher/acceptance/v2";
const workspace = (t) => temporaryDirectory(t, "archpub-delivery-");
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** An edition-only delivery of the minimal model in a new directory under root. */
async function editionDelivery(t, root) {
  const out = path.join(root, "delivery");
  await buildDelivery(await writeModel(t, minimalModel()), out, { media: ["edition"], png: [240] });
  return out;
}

/** A copy of a delivery under a new name beside it. */
async function copyOf(delivery, name) {
  const copy = path.join(path.dirname(delivery), name);
  await fs.cp(delivery, copy, { recursive: true });
  return copy;
}

/** Accept a delivery at a fixed time, as SOURCE_DATE_EPOCH sets it. */
async function acceptAt(epoch, directory, acceptance) {
  process.env.SOURCE_DATE_EPOCH = String(epoch);
  try {
    return await acceptDelivery(directory, acceptance);
  } finally {
    delete process.env.SOURCE_DATE_EPOCH;
  }
}

/** Write a changed acceptance record over the record in a delivery. */
async function rewrite(directory, change) {
  const file = path.join(directory, "acceptance.json");
  await fs.writeFile(file, JSON.stringify(change(await readJson(file))));
}

const sshKeygen = (args, options) => execFileSync("ssh-keygen", args, options);

/** A new ed25519 key without a passphrase, its public line and its fingerprint, as ssh-keygen writes them. */
async function sshKey(directory, name) {
  const key = path.join(directory, name);
  sshKeygen(["-q", "-t", "ed25519", "-N", "", "-C", name, "-f", key], { stdio: "ignore" });
  const listed = sshKeygen(["-l", "-E", "sha256", "-f", key], { encoding: "utf8" });
  return {
    key,
    publicLine: (await fs.readFile(`${key}.pub`, "utf8")).trim(),
    fingerprint: /SHA256:\S+/u.exec(listed)?.[0],
  };
}

test("acceptance writes an in-toto statement and a colophon page beside an unchanged delivery, and verify checks both", async (t) => {
  const root = await workspace(t);
  const out = await editionDelivery(t, root);
  const manifestBytes = await fs.readFile(path.join(out, "manifest.json"));
  await assert.rejects(acceptDelivery(out, { reviewer: "Yang HENG", sealName: " " }), {
    code: "acceptance_name_unset",
  });
  await assert.rejects(verifyAcceptance(out), { code: "acceptance_missing" });
  const accepted = await acceptAt(1794472215, out, {
    reviewer: "Yang HENG",
    sealName: "衡阳",
    note: "Looks right.",
  });
  const colophon = await fs.readFile(path.join(out, "colophon.pdf"));
  assert.deepEqual(await readJson(path.join(out, "acceptance.json")), {
    _type: STATEMENT,
    subject: [
      { name: "manifest.json", digest: { sha256: sha256(manifestBytes) } },
      { name: "colophon.pdf", digest: { sha256: sha256(colophon) } },
    ],
    predicateType: PREDICATE,
    predicate: {
      reviewer: "Yang HENG",
      sealName: "衡阳",
      note: "Looks right.",
      acceptedAt: "2026-11-12T08:30:15Z",
      model: "minimal",
    },
  });
  assert.deepEqual(accepted, {
    directory: out,
    manifest: sha256(manifestBytes),
    reviewer: "Yang HENG",
    acceptedAt: "2026-11-12T08:30:15Z",
    colophon: path.join(out, "colophon.pdf"),
    signer: null,
    signature: null,
  });
  // Accepting changes no artifact: the manifest still lists exactly the delivery's files.
  assert.deepEqual(
    await digestTree(out, new Set(["manifest.json", "acceptance.json", "colophon.pdf"])),
    JSON.parse(manifestBytes.toString("utf8")).artifacts,
  );
  assert.deepEqual(await verifyAcceptance(out), {
    directory: out,
    manifest: sha256(manifestBytes),
    reviewer: "Yang HENG",
    acceptedAt: "2026-11-12T08:30:15Z",
    signer: null,
    signature: "unsigned",
  });
  // A delivery is accepted once: a record, a colophon page or a signature already beside it is refused.
  const again = await copyOf(out, "again");
  const beside = ["acceptance.json", "colophon.pdf", "acceptance.sig"];
  const clear = () =>
    Promise.all(beside.map((file) => fs.rm(path.join(again, file), { force: true })));
  for (const file of beside) {
    await clear();
    await fs.writeFile(path.join(again, file), "");
    await assert.rejects(acceptDelivery(again, { reviewer: "Yang HENG" }), {
      code: "acceptance_exists",
    });
  }
  await clear();
  // Accepting the same delivery at the same time, by the same reviewer with the same note, sets the same page again.
  await acceptAt(1794472215, again, {
    reviewer: "Yang HENG",
    sealName: "衡阳",
    note: "Looks right.",
  });
  assert.ok((await fs.readFile(path.join(again, "colophon.pdf"))).equals(colophon));

  // Each link verify checks refuses on its own, and publish refuses as verify does.
  const published = path.join(root, "published");
  const refuseBoth = async (directory, expected) => {
    // Each refusal starts only when it is awaited, so neither goes unhandled.
    for (const refused of [
      () => verifyAcceptance(directory),
      () => publishDelivery(directory, published),
    ])
      await assert.rejects(refused, expected);
  };
  const edited = await copyOf(out, "edited");
  await fs.appendFile(path.join(edited, "colophon.pdf"), "%");
  await refuseBoth(
    edited,
    (error) => error.code === "acceptance_colophon_changed" && /colophon\.pdf/u.test(error.message),
  );
  await fs.rm(path.join(edited, "colophon.pdf"));
  await refuseBoth(edited, { code: "acceptance_colophon_changed" });
  // A record of an earlier release, or of another version of the predicate, is not read as this one.
  const older = await copyOf(out, "older");
  await fs.writeFile(
    path.join(older, "acceptance.json"),
    JSON.stringify({
      format: "architecture-publisher.acceptance",
      version: 1,
      manifest: sha256(manifestBytes),
      model: "minimal",
      reviewer: "Yang HENG",
    }),
  );
  await refuseBoth(older, { code: "acceptance_version_unsupported" });
  const later = await copyOf(out, "later");
  await rewrite(later, (fields) => ({ ...fields, predicateType: PREDICATE.replace(/v2$/u, "v3") }));
  await refuseBoth(later, { code: "acceptance_version_unsupported" });
  const other = await copyOf(out, "other");
  await rewrite(other, (fields) => ({
    ...fields,
    subject: [{ name: "manifest.json", digest: { sha256: "0".repeat(64) } }, fields.subject[1]],
  }));
  await refuseBoth(other, { code: "acceptance_manifest_mismatch" });
  for (const change of [
    (fields) => ({ ...fields, _type: "https://in-toto.io/Statement/v0.1" }),
    (fields) => ({ ...fields, predicate: { ...fields.predicate, reviewer: 7 } }),
    (fields) => ({ ...fields, subject: "manifest.json" }),
  ]) {
    await fs.cp(path.join(out, "acceptance.json"), path.join(other, "acceptance.json"));
    await rewrite(other, change);
    await refuseBoth(other, { code: "acceptance_invalid" });
  }
  await fs.writeFile(path.join(other, "acceptance.json"), "{");
  await refuseBoth(other, { code: "acceptance_invalid" });
  // A signature beside a record that names no signer is not a signature of it.
  const stray = await copyOf(out, "stray");
  await fs.writeFile(path.join(stray, "acceptance.sig"), "");
  await refuseBoth(stray, { code: "acceptance_signature_invalid" });
  const changed = await copyOf(out, "changed");
  await fs.appendFile(path.join(changed, "minimal.pdf"), "%");
  await refuseBoth(changed, { code: "delivery_changed" });
  assert.deepEqual(
    await fs.readdir(root),
    ["again", "changed", "delivery", "edited", "later", "older", "other", "stray"],
    "a refused publication writes nothing",
  );
});

test("a signed acceptance verifies for its reviewer with the allowed signers and is refused for any other", async (t) => {
  const root = await workspace(t);
  const out = await editionDelivery(t, root);
  const keys = await temporaryDirectory(t, "archpub-keys-");
  const reviewer = await sshKey(keys, "reviewer");
  const stranger = await sshKey(keys, "stranger");
  const allowed = async (name, lines) => {
    const file = path.join(keys, name);
    await fs.writeFile(file, `${lines.join("\n")}\n`);
    return file;
  };
  const listed = await allowed("allowed", [`"Yang HENG" ${reviewer.publicLine}`]);

  // A key ssh-keygen cannot use is refused, and nothing is written: not a key, a public key whose private half
  // neither lies beside it nor is held by ssh-agent, or no file at all.
  const garbage = path.join(keys, "garbage");
  await fs.writeFile(garbage, "not a key\n");
  const lone = path.join(await temporaryDirectory(t, "archpub-lone-"), "lone.pub");
  await fs.copyFile(`${reviewer.key}.pub`, lone);
  for (const key of [garbage, lone, path.join(keys, "absent")])
    await assert.rejects(acceptDelivery(out, { reviewer: "Yang HENG", sign: key }), {
      code: "acceptance_sign_failed",
    });
  assert.deepEqual((await fs.readdir(out)).sort(), ["images", "manifest.json", "minimal.pdf"]);

  const unsigned = await copyOf(out, "unsigned");
  await acceptDelivery(unsigned, { reviewer: "Yang HENG" });
  await assert.rejects(verifyAcceptance(unsigned, { allowedSigners: listed }), {
    code: "acceptance_signature_invalid",
  });

  const accepted = await acceptDelivery(out, { reviewer: "Yang HENG", sign: reviewer.key });
  const recordFile = path.join(out, "acceptance.json");
  const signatureFile = path.join(out, "acceptance.sig");
  const record = await readJson(recordFile);
  assert.equal(record.predicate.signer, reviewer.fingerprint);
  assert.deepEqual(
    [accepted.signer, accepted.signature],
    [reviewer.fingerprint, path.join(out, "acceptance.sig")],
  );
  assert.match(
    await fs.readFile(signatureFile, "utf8"),
    /^-----BEGIN SSH SIGNATURE-----\n[\s\S]+-----END SSH SIGNATURE-----\n$/u,
  );
  // The detached signature covers the record's exact bytes, in the acceptance namespace, as ssh-keygen checks it.
  sshKeygen(
    [
      "-Y",
      "verify",
      "-f",
      listed,
      "-I",
      "Yang HENG",
      "-n",
      "archpub-acceptance",
      "-s",
      signatureFile,
    ],
    { input: await fs.readFile(recordFile), stdio: ["pipe", "ignore", "ignore"] },
  );
  assert.equal((await verifyAcceptance(out)).signature, "unchecked");
  assert.deepEqual(await verifyAcceptance(out, { allowedSigners: listed }), {
    directory: out,
    manifest: record.subject[0].digest.sha256,
    reviewer: "Yang HENG",
    acceptedAt: record.predicate.acceptedAt,
    signer: reviewer.fingerprint,
    signature: "verified",
  });
  // Publication carries the signature with the record it signs.
  const published = await publishDelivery(out, path.join(root, "published"));
  assert.ok(
    (await fs.readFile(path.join(published.target, "acceptance.sig"))).equals(
      await fs.readFile(signatureFile),
    ),
  );
  for (const lines of [
    [`"Yang HENG" ${stranger.publicLine}`],
    [`"Someone Else" ${reviewer.publicLine}`],
  ])
    await assert.rejects(
      verifyAcceptance(out, { allowedSigners: await allowed("others", lines) }),
      { code: "acceptance_signature_invalid" },
    );
  // A record edited after it was signed no longer verifies.
  const edited = await copyOf(out, "edited");
  await rewrite(edited, (fields) => ({ ...fields, predicate: { ...fields.predicate, note: "x" } }));
  await assert.rejects(verifyAcceptance(edited, { allowedSigners: listed }), {
    code: "acceptance_signature_invalid",
  });
  // A key the signers allow for the reviewer, other than the one the record names, does not stand in for it.
  const swapped = await copyOf(out, "swapped");
  await fs.writeFile(
    path.join(swapped, "acceptance.sig"),
    sshKeygen(["-Y", "sign", "-f", stranger.key, "-n", "archpub-acceptance"], {
      input: await fs.readFile(recordFile),
      stdio: ["pipe", "pipe", "ignore"],
    }),
  );
  const both = await allowed("both", [
    `"Yang HENG" ${reviewer.publicLine}`,
    `"Yang HENG" ${stranger.publicLine}`,
  ]);
  await assert.rejects(verifyAcceptance(swapped, { allowedSigners: both }), {
    code: "acceptance_signature_invalid",
  });
  // A record that names a signer without its signature is refused even without the allowed signers.
  const bare = await copyOf(out, "bare");
  await fs.rm(path.join(bare, "acceptance.sig"));
  await assert.rejects(verifyAcceptance(bare), { code: "acceptance_signature_invalid" });
});
