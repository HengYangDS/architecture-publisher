import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const remedaLicenseSha256 = "acf30083045d768ce20640237313ee31a45d548d66ef76df5bb5fb0745479535";
const khromaLicenseSha256 = "66b333b0f66759a0b710459e03f7029abe17f4358114a128d2c972e642961b49";

function packageLockPath(input) {
  const parts = input.replaceAll("\\", "/").split("/");
  const index = parts.lastIndexOf("node_modules");
  if (index < 0 || !parts[index + 1]) throw Error("likec4_supply_input_outside_packages");
  const count = parts[index + 1].startsWith("@") ? 2 : 1;
  if (!parts[index + count]) throw Error("likec4_supply_package_path_invalid");
  const selected = parts.slice(0, index + count + 1);
  if (selected.some((part) => part === ".." || part === ""))
    throw Error("likec4_supply_package_path_invalid");
  return selected.join("/");
}

async function licenseText(packagePath, manifest) {
  const directory = path.join(root, ...packagePath.split("/"));
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const notices = entries
    .filter(({ name }) => /^(?:licen[cs]e|copying|notice)(?:[._-]|$)/iu.test(name))
    .sort((left, right) => compare(left.name, right.name));
  if (!notices.length && manifest.name === "remeda" && manifest.version === "2.51.0") {
    const bytes = await fs.readFile(new URL("./licenses/remeda-LICENSE", import.meta.url));
    if (sha(bytes) !== remedaLicenseSha256) throw Error("likec4_supply_license_drift");
    return bytes.toString("utf8");
  }
  if (!notices.length) throw Error(`likec4_supply_license_missing:${manifest.name}`);
  const parts = [];
  for (const entry of notices) {
    if (!entry.isFile() || entry.isSymbolicLink()) throw Error("likec4_supply_license_invalid");
    const bytes = await fs.readFile(path.join(directory, entry.name));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!text.trim()) throw Error("likec4_supply_license_invalid");
    parts.push(text.trimEnd());
  }
  return parts.join("\n\n");
}

export async function includedPackages(metafile) {
  const lock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json"), "utf8"));
  const packagePaths = [...new Set(Object.keys(metafile.inputs).map(packageLockPath))].sort(
    compare,
  );
  const noticesByIdentity = new Map();
  const recordNotice = (entry, notice) => {
    const identity = `${entry.name}@${entry.version}`;
    const prior = noticesByIdentity.get(identity);
    if (prior && (prior.license !== entry.license || prior.text !== notice))
      throw Error("likec4_supply_license_conflict");
    noticesByIdentity.set(identity, { license: entry.license, text: notice });
  };
  const packages = [];
  for (const lockPath of packagePaths) {
    const locked = lock.packages?.[lockPath];
    if (!locked) throw Error(`likec4_supply_lock_mismatch:${lockPath}`);
    const manifest = JSON.parse(
      await fs.readFile(path.join(root, ...lockPath.split("/"), "package.json"), "utf8"),
    );
    if (
      !manifest.name ||
      !manifest.version ||
      !locked ||
      locked.version !== manifest.version ||
      typeof locked.integrity !== "string"
    )
      throw Error(`likec4_supply_lock_mismatch:${lockPath}`);
    const notice = await licenseText(lockPath, manifest);
    let license = manifest.license;
    if (license === undefined && manifest.name === "khroma" && manifest.version === "2.1.0") {
      const original = await fs.readFile(path.join(root, ...lockPath.split("/"), "license"));
      if (sha(original) !== khromaLicenseSha256) throw Error("likec4_supply_license_drift");
      license = "MIT";
    }
    if (typeof license !== "string" || !license) throw Error("likec4_supply_license_undeclared");
    const entry = {
      lockPath,
      name: manifest.name,
      version: manifest.version,
      license,
      integrity: locked.integrity,
      noticeSha256: sha(Buffer.from(notice)),
    };
    recordNotice(entry, notice);
    packages.push(entry);
  }
  const notices = Buffer.from(
    [...noticesByIdentity]
      .sort(([left], [right]) => compare(left, right))
      .map(([identity, { license, text }]) => `===== ${identity} (${license}) =====\n${text}\n`)
      .join("\n"),
  );
  return { packages, notices };
}
