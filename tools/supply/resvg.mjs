import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mode = process.argv[2];
if (process.argv.length !== 3 || !["--check", "--write"].includes(mode))
  throw Error("raster_supply_mode_required");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const supply = path.join(root, "packages/publisher/renderers/resvg/supply");
const manifestPath = path.join(supply, "supply.json");
const source = JSON.parse(await fs.readFile(path.join(supply, "resvg/source.json"), "utf8"));
const noticesPath = path.join(supply, "resvg/THIRD-PARTY-NOTICES.txt");
const noticesText = await fs.readFile(noticesPath, "utf8");
if (
  [...noticesText.matchAll(/^Source closure: .+$/gmu)].length !== 1 ||
  [...noticesText.matchAll(/^Source archive SHA-256: [a-f0-9]{64}$/gmu)].length !== 1
)
  throw Error("raster_supply_source_notice_invalid");
const registry = source.source.registry;
const sourceLocation =
  `gitlab-generic://${registry.projectPath}/${registry.package}/` +
  `${registry.version}/${registry.file}`;
const notices = Buffer.from(
  noticesText
    .replace(/^Source closure: .+$/mu, `Source closure: ${sourceLocation}`)
    .replace(
      /^Source archive SHA-256: [a-f0-9]{64}$/mu,
      `Source archive SHA-256: ${source.source.archiveSha256}`,
    ),
);
const manifestBytes = await fs.readFile(manifestPath);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const selected = new Set(["supply.json"]);
const files = [];
for (const file of manifest.files) {
  if (
    typeof file.path !== "string" ||
    !/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/u.test(file.path) ||
    file.path.split("/").some((part) => part === "." || part === "..") ||
    selected.has(file.path)
  )
    throw Error("raster_supply_member_invalid");
  selected.add(file.path);
  const member = path.join(supply, file.path);
  if (!(await fs.lstat(member)).isFile()) throw Error("raster_supply_member_invalid");
  const bytes = await fs.readFile(member);
  if (
    file.path !== "resvg/source.json" &&
    (file.bytes !== bytes.length || file.sha256 !== sha(bytes))
  )
    throw Error("raster_supply_member_drift:" + file.path);
  const projected = file.path === "resvg/THIRD-PARTY-NOTICES.txt" ? notices : bytes;
  files.push({ ...file, bytes: projected.length, sha256: sha(projected) });
}
if (!selected.has("resvg/source.json")) throw Error("raster_supply_source_required");
for (const name of await fs.readdir(supply, { recursive: true })) {
  const info = await fs.lstat(path.join(supply, name));
  if (info.isDirectory()) continue;
  if (!info.isFile() || !selected.delete(name.split(path.sep).join("/")))
    throw Error("raster_supply_inventory_invalid");
}
if (selected.size) throw Error("raster_supply_inventory_invalid");
for (const output of source.outputs) {
  const member = files.find(
    (file) => output.path === "packages/publisher/renderers/resvg/supply/" + file.path,
  );
  if (!member || member.bytes !== output.bytes || member.sha256 !== output.sha256)
    throw Error("raster_supply_output_drift");
}
const result = spawnSync(
  process.execPath,
  [
    path.join(root, "tools/raster/resvg/verify.mjs"),
    "--inputs",
    path.join(root, "tools/raster/resvg"),
  ],
  { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000 },
);
if (result.error) throw result.error;
if (result.status !== 0) throw Error(result.stderr.trim() || "raster_supply_source_invalid");
const content = Buffer.from(JSON.stringify({ ...manifest, files }, null, 2) + "\n");
if (mode === "--write") {
  if (!Buffer.from(noticesText).equals(notices)) await fs.writeFile(noticesPath, notices);
  await fs.writeFile(manifestPath, content);
} else if (!manifestBytes.equals(content)) throw Error("raster_supply_drift");
process.stdout.write(`Raster supply ${mode === "--write" ? "generated" : "verified"}\n`);
