import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { refuse } from "./refusal.mjs";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const verified = new Map();

/** The vendored supplies this package executes; each directory holds a `supply.json`. */
export const SUPPLIES = Object.freeze({
  archify: "renderers/archify/supply",
  fonts: "renderers/fonts/supply",
  icons: "renderers/icons/supply",
  likec4: "supplies/likec4",
  resvg: "renderers/resvg/supply",
});

/**
 * Verify every file a supply manifest lists and return the manifest identity.
 * This is installed-package integrity, not protection against a malicious installer.
 * @param {keyof typeof SUPPLIES} name
 */
export async function verifySupply(name) {
  if (verified.has(name)) return verified.get(name);
  const root = path.join(packageRoot, SUPPLIES[name]);
  const manifestBytes = await fs.readFile(path.join(root, "supply.json"));
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  for (const file of manifest.files ?? []) {
    const bytes = await fs.readFile(path.join(root, file.path));
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256)
      refuse("supply_invalid", `The ${name} supply file ${file.path} does not match its manifest.`);
  }
  const identity = Object.freeze({ name, root, manifest, sha256: sha256(manifestBytes) });
  verified.set(name, identity);
  return identity;
}
