import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import { parse } from "smol-toml";
import { stringify } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mode = process.argv[2];
if (process.argv.length !== 3 || !["--check", "--write"].includes(mode))
  throw new Error("ci_projection_mode_required");
const source = ".config/ci/pipeline.cue";
const raster = "packages/publisher/renderers/resvg/supply/resvg/source.json";
const options = {
  cwd: root,
  encoding: "utf8",
  timeout: 30_000,
  maxBuffer: 2 * 1024 * 1024,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, CUE_REGISTRY: "none", CUE_EXPERIMENT: "", CUE_DEBUG: "" },
};
const toolchain = parse(await fs.readFile(path.join(root, ".config/mise/config.toml"), "utf8"));
const selected = toolchain.tools?.cue;
if (
  !selected ||
  !execFileSync("cue", ["version"], options).startsWith(`cue version v${selected}\n`)
)
  throw new Error("ci_projection_cue_version_mismatch");
execFileSync("cue", ["fmt", "--check", source], options);
const compiled = JSON.parse(
  execFileSync("cue", ["export", source, raster, "-e", "compiled"], options),
);
const policy = await resolveConfig(path.join(root, ".gitlab-ci.yml"), {
  config: path.join(root, ".config/checks/prettier/prettier.toml"),
  editorconfig: false,
});
const outputs = [];
for (const [peer, projection] of Object.entries(compiled)) {
  if (
    !/^[a-z][a-z0-9-]*$/u.test(peer) ||
    !projection ||
    typeof projection.path !== "string" ||
    !/^\.(?:gitlab-ci\.yml|github\/workflows\/[a-z0-9-]+\.yml)$/u.test(projection.path) ||
    !projection.document ||
    typeof projection.document !== "object" ||
    Array.isArray(projection.document)
  )
    throw new Error("ci_projection_identity_invalid");
  const content =
    `# Generated from ${source}. Do not edit.\n\n` +
    (await format(stringify(projection.document), { ...policy, parser: "yaml" }));
  const target = path.join(root, projection.path);
  outputs.push({ peer, target, content });
}
if (!outputs.length || new Set(outputs.map(({ target }) => target)).size !== outputs.length)
  throw new Error("ci_projection_selection_invalid");
if (mode === "--check") {
  for (const { target, content } of outputs)
    if ((await fs.readFile(target, "utf8")) !== content)
      throw new Error(`ci_projection_drift: ${path.relative(root, target)}`);
} else {
  for (const { target, content } of outputs) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }
}
process.stdout.write(`CI projections ${mode === "--check" ? "verified" : "generated"}\n`);
