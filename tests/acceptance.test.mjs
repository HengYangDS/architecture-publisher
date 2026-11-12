import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildDelivery, digestTree } from "../src/build.mjs";
import { acceptDelivery, publishDelivery, verifyAcceptance } from "../src/delivery.mjs";
import { minimalModel, temporaryDirectory, writeModel } from "./fixtures/models.mjs";

const workspace = (t) => temporaryDirectory(t, "archpub-delivery-");
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function editionDelivery(t, root) {
  const out = path.join(root, "delivery");
  await buildDelivery(await writeModel(t, minimalModel()), out, { media: ["edition"], png: [240] });
  return out;
}
async function copyOf(delivery, name) {
  const copy = path.join(path.dirname(delivery), name);
  await fs.cp(delivery, copy, { recursive: true });
  return copy;
}
async function acceptAt(epoch, directory, acceptance) {
  process.env.SOURCE_DATE_EPOCH = String(epoch);
  try {
    return await acceptDelivery(directory, acceptance);
  } finally {
    delete process.env.SOURCE_DATE_EPOCH;
  }
}
async function rewrite(directory, change) {
  const file = path.join(directory, "acceptance.json");
  await fs.writeFile(file, JSON.stringify(change(await readJson(file))));
}
const sshKeygen = (args, options) => execFileSync("ssh-keygen", args, options);
async function sshKey(directory, name) {
  const key = path.join(directory, name);
  sshKeygen(["-q", "-t", "ed25519", "-N", "", "-C", name, "-f", key], {
    stdio: "ignore",
  });
  const listed = sshKeygen(["-l", "-E", "sha256", "-f", key], {
    encoding: "utf8",
  });
  return {
    key,
    publicLine: (await fs.readFile(`${key}.pub`, "utf8")).trim(),
    fingerprint: /SHA256:\S+/u.exec(listed)?.[0],
  };
}

test("acceptance writes record version 2 and a colophon page beside an unchanged delivery, and verify checks both", async (t) => {
  const root = await workspace(t);
  const out = await editionDelivery(t, root);
  const manifest = await readJson(path.join(out, "manifest.json"));
  await assert.rejects(acceptDelivery(out, { reviewer: "Yang HENG", sealName: " " }), {
    code: "acceptance_name_unset",
  });
  await assert.rejects(verifyAcceptance(out), { code: "acceptance_missing" });
  const accepted = await acceptAt(1794472215, out, {
    reviewer: "Yang HENG",
    sealName: "衡阳",
    note: "Looks right.",
  });
  const record = await readJson(path.join(out, "acceptance.json"));
  const colophon = await fs.readFile(path.join(out, "colophon.pdf"));
  assert.deepEqual(record, {
    format: "architecture-publisher.acceptance",
    version: 2,
    manifest: accepted.manifest,
    model: "minimal",
    reviewer: "Yang HENG",
    seal_name: "衡阳",
    note: "Looks right.",
    accepted_at: "2026-11-12T08:30:15Z",
    colophon: sha256(colophon),
  });
  assert.deepEqual(
    [accepted.acceptedAt, accepted.colophon, accepted.signer],
    ["2026-11-12T08:30:15Z", path.join(out, "colophon.pdf"), null],
  );
  // Accepting changes no artifact: the manifest still lists exactly the delivery's files.
  assert.deepEqual(
    await digestTree(out, new Set(["manifest.json", "acceptance.json", "colophon.pdf"])),
    manifest.artifacts,
  );
  assert.deepEqual(await verifyAcceptance(out), {
    directory: out,
    manifest: accepted.manifest,
    reviewer: "Yang HENG",
    acceptedAt: "2026-11-12T08:30:15Z",
    signer: null,
    signature: "unsigned",
  });
  await assert.rejects(acceptDelivery(out, { reviewer: "Yang HENG" }), {
    code: "acceptance_exists",
  });
  // Accepting the same delivery at the same time sets the same colophon page again.
  const again = await copyOf(out, "again");
  await fs.rm(path.join(again, "acceptance.json"));
  await assert.rejects(acceptDelivery(again, { reviewer: "Yang HENG" }), {
    code: "acceptance_exists",
  });
  await fs.rm(path.join(again, "colophon.pdf"));
  await acceptAt(1794472215, again, { reviewer: "Yang HENG", sealName: "衡阳" });
  assert.ok((await fs.readFile(path.join(again, "colophon.pdf"))).equals(colophon));

  // Each link verify checks refuses on its own.
  const published = path.join(root, "published");
  const edited = await copyOf(out, "edited");
  await fs.appendFile(path.join(edited, "colophon.pdf"), "%");
  // Each refusal is started only when it is awaited, so neither goes unhandled.
  for (const refused of [() => verifyAcceptance(edited), () => publishDelivery(edited, published)])
    await assert.rejects(
      refused,
      (error) =>
        error.code === "acceptance_colophon_changed" && /colophon\.pdf/u.test(error.message),
    );
  await fs.rm(path.join(edited, "colophon.pdf"));
  await assert.rejects(verifyAcceptance(edited), { code: "acceptance_colophon_changed" });
  const older = await copyOf(out, "older");
  await rewrite(older, ({ format, manifest: digest, model, reviewer }) => ({
    format,
    version: 1,
    manifest: digest,
    model,
    reviewer,
  }));
  for (const refused of [() => verifyAcceptance(older), () => publishDelivery(older, published)])
    await assert.rejects(refused, { code: "acceptance_version_unsupported" });
  const other = await copyOf(out, "other");
  await rewrite(other, (fields) => ({ ...fields, manifest: "0".repeat(64) }));
  await assert.rejects(verifyAcceptance(other), { code: "acceptance_manifest_mismatch" });
  await rewrite(other, (fields) => ({ ...fields, format: "other" }));
  await assert.rejects(verifyAcceptance(other), { code: "acceptance_invalid" });
  await fs.writeFile(path.join(other, "acceptance.json"), "{");
  await assert.rejects(verifyAcceptance(other), { code: "acceptance_invalid" });
  const changed = await copyOf(out, "changed");
  await fs.appendFile(path.join(changed, "minimal.pdf"), "%");
  await assert.rejects(verifyAcceptance(changed), { code: "delivery_changed" });
  assert.deepEqual(
    await fs.readdir(root),
    ["again", "changed", "delivery", "edited", "older", "other"],
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
  const record = await readJson(path.join(out, "acceptance.json"));
  assert.match(
    record.signature,
    /^-----BEGIN SSH SIGNATURE-----\n[\s\S]+-----END SSH SIGNATURE-----\n$/u,
  );
  assert.equal(record.signer, reviewer.fingerprint);
  assert.equal(accepted.signer, reviewer.fingerprint);
  // The signature covers the manifest's digest as text, in the acceptance namespace.
  const signature = path.join(keys, "acceptance.sig");
  await fs.writeFile(signature, record.signature);
  sshKeygen(
    ["-Y", "verify", "-f", listed, "-I", "Yang HENG", "-n", "archpub-acceptance", "-s", signature],
    { input: record.manifest, stdio: ["pipe", "ignore", "ignore"] },
  );
  assert.equal((await verifyAcceptance(out)).signature, "unchecked");
  assert.deepEqual(await verifyAcceptance(out, { allowedSigners: listed }), {
    directory: out,
    manifest: record.manifest,
    reviewer: "Yang HENG",
    acceptedAt: record.accepted_at,
    signer: reviewer.fingerprint,
    signature: "verified",
  });
  for (const lines of [
    [`"Yang HENG" ${stranger.publicLine}`],
    [`"Someone Else" ${reviewer.publicLine}`],
  ])
    await assert.rejects(
      verifyAcceptance(out, { allowedSigners: await allowed("others", lines) }),
      { code: "acceptance_signature_invalid" },
    );
  // A record that claims another signer than the key that signed is refused too.
  const claimed = await copyOf(out, "claimed");
  await rewrite(claimed, (fields) => ({ ...fields, signer: stranger.fingerprint }));
  await assert.rejects(verifyAcceptance(claimed, { allowedSigners: listed }), {
    code: "acceptance_signature_invalid",
  });
});
