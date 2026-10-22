import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const manifestPath = path.join(root, "packages/publisher/renderers/resvg/supply/resvg/source.json");
const modes = ["--archive", "--inputs", "--outputs", "--registry-url", "--stage"];

async function check(file, selected, message) {
  const info = await fs.lstat(file);
  if (!info.isFile() || (selected.bytes !== undefined && info.size !== selected.bytes))
    throw new Error(message);
  const bytes = await fs.readFile(file);
  if (createHash("sha256").update(bytes).digest("hex") !== selected.sha256)
    throw new Error(message);
  return bytes;
}

function toolIdentity(tools) {
  const exact = (value, keys) =>
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
  if (!exact(tools, ["rustc", "cargo", "wasmBindgen"])) return null;
  const fields = ["release", "commit", "host"];
  for (const compiler of [tools.rustc, tools.cargo]) {
    if (
      !exact(compiler, fields) ||
      !/^\d+\.\d+\.\d+$/u.test(compiler.release) ||
      !/^[a-f0-9]{40}$/u.test(compiler.commit) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+){2,}$/u.test(compiler.host)
    )
      return null;
  }
  if (tools.rustc.host !== tools.cargo.host || !/^\d+\.\d+\.\d+$/u.test(tools.wasmBindgen))
    return null;
  return JSON.stringify([
    ...fields.map((field) => tools.rustc[field]),
    ...fields.map((field) => tools.cargo[field]),
    tools.wasmBindgen,
  ]);
}

async function nativeWitness(manifest, identityPath) {
  const info = await fs.lstat(identityPath);
  if (!info.isFile() || info.size > 8192) throw new Error("native tool identity not admitted");
  const identity = toolIdentity(JSON.parse(await fs.readFile(identityPath, "utf8")));
  const selected = (manifest.build.nativeWitnesses ?? []).filter(
    (witness) => identity !== null && toolIdentity(witness.tools) === identity,
  );
  if (selected.length !== 1) throw new Error("native tool identity not admitted");
  const witness = selected[0];
  if (
    witness.tools.rustc.release !== manifest.toolchain.rust ||
    witness.tools.cargo.release !== manifest.toolchain.rust ||
    witness.tools.wasmBindgen !== manifest.toolchain.wasmBindgen ||
    !Number.isSafeInteger(witness.wasm.bytes) ||
    witness.wasm.bytes <= 0 ||
    !/^[a-f0-9]{64}$/u.test(witness.wasm.sha256)
  )
    throw new Error("native witness invalid");
  return witness.wasm;
}

async function verify(mode, selectedPath, identityPath) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (mode === "--stage") {
    const destination = path.dirname(manifestPath);
    const source = path.resolve(selectedPath ?? destination);
    if (!(await fs.lstat(source)).isDirectory())
      throw new Error("prebuilt Raster directory invalid");
    const outputs = [];
    for (const selected of manifest.outputs) {
      const name = path.basename(selected.path);
      if (!["index.mjs", "index_bg.wasm"].includes(name))
        throw new Error("prebuilt Raster member invalid");
      outputs.push({
        name,
        bytes: await check(path.join(source, name), selected, `prebuilt Raster mismatch: ${name}`),
      });
    }
    if (new Set(outputs.map(({ name }) => name)).size !== 2)
      throw new Error("prebuilt Raster pair required");
    for (const { name } of outputs) {
      try {
        if (!(await fs.lstat(path.join(destination, name))).isFile())
          throw new Error("prebuilt Raster destination invalid");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    for (const { name, bytes } of outputs) {
      const file = path.join(destination, name);
      const present = await fs.readFile(file).catch((error) => {
        if (error.code !== "ENOENT") throw error;
        return null;
      });
      if (!present?.equals(bytes)) await fs.writeFile(file, bytes);
    }
    process.stdout.write("Canonical Raster pair prepared\n");
    return;
  }
  if (mode === "--registry-url") {
    const base = new URL(selectedPath);
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      !/^\/api\/v4\/?$/u.test(base.pathname)
    )
      throw new Error("source registry API base invalid");
    const registry = manifest.source.registry;
    if (registry.provider !== "gitlab") throw new Error("source registry provider invalid");
    const segments = [registry.projectPath, registry.package, registry.version, registry.file];
    if (segments.some((value) => typeof value !== "string" || !value))
      throw new Error("source registry identity invalid");
    const [project, name, version, file] = segments.map((value) => encodeURIComponent(value));
    process.stdout.write(
      `${base.origin}/api/v4/projects/${project}/packages/generic/${name}/${version}/${file}\n`,
    );
    return;
  }
  const directory = path.resolve(selectedPath);
  if (mode === "--archive") {
    await check(
      directory,
      { sha256: manifest.source.archiveSha256 },
      "source closure digest mismatch",
    );
    return;
  }
  if (mode === "--inputs") {
    for (const selected of manifest.build.inputs) {
      const relative = selected.path.slice("tools/raster/resvg/".length);
      if (
        !selected.path.startsWith("tools/raster/resvg/") ||
        !relative ||
        relative.split(/[\\/]/u).some((segment) => segment === ".." || segment === ".")
      )
        throw new Error("source closure input path invalid");
      await check(
        path.join(directory, relative),
        selected,
        `source closure input mismatch: ${selected.path}`,
      );
    }
    return;
  }
  const witness = identityPath ? await nativeWitness(manifest, identityPath) : undefined;
  for (const selected of manifest.outputs) {
    const bytes = await check(
      path.join(directory, selected.nativeFile),
      witness && selected.nativeFile === "index_bg.wasm" ? witness : selected,
      `generated output mismatch: ${selected.nativeFile}`,
    );
    process.stdout.write(
      `${createHash("sha256").update(bytes).digest("hex")}  ${selected.nativeFile}\n`,
    );
  }
}

const mode = process.argv[2];
const selectedPath =
  process.argv[3] ??
  (mode === "--registry-url"
    ? process.env.CI_API_V4_URL
    : mode === "--stage"
      ? process.env.ARCHPUB_RESVG_PREBUILT
      : undefined);
const identityPath = process.argv[4];
if (
  !modes.includes(mode) ||
  (!selectedPath && mode !== "--stage") ||
  process.argv.length > 5 ||
  (identityPath && mode !== "--outputs")
) {
  process.stderr.write(
    "usage: node verify.mjs <--archive|--inputs> <path> | --outputs <path> [tool-identity.json] | --registry-url [API_BASE] | --stage [prebuilt-directory]\n",
  );
  process.exitCode = 64;
} else {
  try {
    await verify(mode, selectedPath, identityPath);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 65;
  }
}
