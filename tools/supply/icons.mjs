import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const policy = parse(
  await fs.readFile(path.join(root, ".config/release/icons/policy.toml"), "utf8"),
);
const mode = process.argv[2];
if (process.argv.length !== 3 || !["--check", "--write"].includes(mode))
  throw Error("icon_supply_mode_required");
const lock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json"), "utf8"));
const selected = lock.packages?.[`node_modules/${policy.package}`];
if (
  ["version", "license", "integrity"].some((key) => selected?.[key] !== policy[key]) ||
  selected?.hasInstallScript ||
  selected?.dependencies
)
  throw Error("icon_supply_lock_mismatch");
const installed = path.resolve(
  path.dirname(fileURLToPath(import.meta.resolve("lucide-static"))),
  "../..",
);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const icons = {};
for (const name of (await fs.readdir(path.join(installed, "icons"))).sort()) {
  if (!/^[a-z0-9-]+\.svg$/u.test(name)) throw Error("icon_supply_filename_invalid");
  const raw = await fs.readFile(path.join(installed, "icons", name), "utf8");
  const match = /<svg\b[^>]*viewBox="0 0 24 24"[^>]*>([\s\S]*?)<\/svg>\s*$/u.exec(raw);
  if (!match) throw Error("icon_supply_viewbox_invalid");
  const artwork = match[1]
    .trim()
    .replace(/\s+/gu, " ")
    .replace(/\s+\/>/gu, "/>");
  if (
    !/^(?:<(?:path|rect|circle|ellipse|line|polyline|polygon)\b[^<>]*\/> ?)+$/u.test(artwork) ||
    /(?:\bon\w+\s*=|(?:href|url|style|class|id|stroke)\s*=|fill="(?!currentColor"|none"))/iu.test(
      artwork,
    )
  )
    throw Error("icon_supply_artwork_invalid:" + name);
  icons[`lucide:${name.slice(0, -4)}`] = { artwork, sha256: sha(artwork) };
}
const artwork = Buffer.from(JSON.stringify({ viewBox: policy.viewBox, icons }, null, 2) + "\n");
const license = await fs.readFile(path.join(installed, "LICENSE"));
const files = [
  ["artwork.json", artwork],
  ["LICENSE", license],
];
const manifest = Buffer.from(
  JSON.stringify(
    {
      schema: "architecture.icon-supply/v1",
      package: policy,
      files: files.map(([name, bytes]) => ({
        path: name,
        bytes: bytes.length,
        sha256: sha(bytes),
      })),
    },
    null,
    2,
  ) + "\n",
);
const target = path.join(root, "packages/publisher/renderers/icons/supply");
for (const [name, bytes] of [...files, ["supply.json", manifest]]) {
  if (mode === "--write") {
    await fs.mkdir(path.dirname(path.join(target, name)), { recursive: true });
    await fs.writeFile(path.join(target, name), bytes);
  } else if (!(await fs.readFile(path.join(target, name))).equals(bytes))
    throw Error("icon_supply_input_drift");
}
process.stdout.write(
  `Lucide ${policy.version} SVG artwork supply ${mode === "--write" ? "generated" : "verified"}\n`,
);
