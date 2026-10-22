import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const installed = path.dirname(fileURLToPath(import.meta.resolve("libavoid-js")));
const identity = {
  name: "libavoid-js",
  version: "0.4.5",
  license: "LGPL-2.1-or-later",
  integrity:
    "sha512-9BrYRXAQ+nmLuHZSqf4z52YN8TroBPxyqo6A6h6Pj03j5UYNx/Hhnd/rg+kiLVrE76wzBeBVO3OW7kaEpzYC9Q==",
};
const mode = process.argv[2];
if (process.argv.length !== 3 || !["--check", "--write"].includes(mode))
  throw Error("avoid_supply_mode_required");
const lock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json")));
if (
  Object.entries(identity).some(
    ([key, value]) => key !== "name" && lock.packages["node_modules/libavoid-js"][key] !== value,
  )
)
  throw Error("avoid_supply_lock_mismatch");
const target = path.join(root, "packages/publisher/renderers/avoid/supply");
const files = [];
for (const [input, output] of [
  [path.join(installed, "index-node.mjs"), "router.mjs"],
  [path.join(installed, "libavoid.wasm"), "libavoid.wasm"],
  [path.join(root, "tools/supply/notices/libavoid/LICENSE"), "LICENSE"],
]) {
  const bytes = await fs.readFile(input);
  files.push({
    path: output,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  if (mode === "--write") {
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, output), bytes);
  } else if (!(await fs.readFile(path.join(target, output))).equals(bytes))
    throw Error("avoid_supply_input_drift");
}
const manifest =
  JSON.stringify(
    { schema: "architecture.geometry-supply/v1", packages: [identity], files },
    null,
    2,
  ) + "\n";
if (mode === "--write") await fs.writeFile(path.join(target, "supply.json"), manifest);
else if ((await fs.readFile(path.join(target, "supply.json"), "utf8")) !== manifest)
  throw Error("avoid_supply_manifest_drift");
process.stdout.write(
  `libavoid ${identity.version} supply ${mode === "--write" ? "generated" : "verified"}\n`,
);
