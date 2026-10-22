import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const installedRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.resolve("svg-pan-zoom"))),
  "..",
);
const packageIdentity = {
  name: "svg-pan-zoom",
  version: "3.6.2",
  license: "BSD-2-Clause",
  integrity:
    "sha512-JwnvRWfVKw/Xzfe6jriFyfey/lWJLq4bUh2jwoR5ChWQuQoOH8FEh1l/bEp46iHHKHEJWIyFJETbazraxNWECg==",
};
const mode = process.argv[2];
if (process.argv.length !== 3 || !["--check", "--write"].includes(mode))
  throw new Error("interactive_supply_mode_required");
const lock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json"), "utf8"));
const selected = lock.packages?.["node_modules/svg-pan-zoom"];
if (
  Object.entries(packageIdentity).some(
    ([key, value]) => key !== "name" && selected?.[key] !== value,
  )
)
  throw new Error("interactive_supply_lock_mismatch");
const target = path.join(root, "packages/publisher/renderers/interactive/supply");
const files = [];
for (const [input, output] of [
  ["dist/svg-pan-zoom.min.js", "svg-pan-zoom.min.js"],
  ["LICENSE", "LICENSE"],
]) {
  const bytes = await fs.readFile(path.join(installedRoot, input));
  files.push({
    path: output,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
  if (mode === "--write") {
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, output), bytes);
  } else if (!(await fs.readFile(path.join(target, output))).equals(bytes))
    throw new Error("interactive_supply_input_drift");
}
const manifest =
  JSON.stringify(
    { schema: "architecture.viewport-supply/v1", packages: [packageIdentity], files },
    null,
    2,
  ) + "\n";
if (mode === "--write") await fs.writeFile(path.join(target, "supply.json"), manifest);
else if ((await fs.readFile(path.join(target, "supply.json"), "utf8")) !== manifest)
  throw new Error("interactive_supply_manifest_drift");
process.stdout.write(
  `SVG pan/zoom ${packageIdentity.version} supply ${mode === "--write" ? "generated" : "verified"}\n`,
);
