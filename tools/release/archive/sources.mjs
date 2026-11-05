import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Where an archive's Node.js and Typst come from: the executables mise installed
 * for the running platform, or each platform's official archives at the lock's URLs.
 */

async function readOne(candidates, what) {
  for (const candidate of candidates) {
    const bytes = await fs.readFile(candidate).catch(() => null);
    if (bytes) return bytes;
  }
  throw Error(`archive_license_missing:${what}`);
}

/**
 * The Node.js and Typst executables at the given paths, with the license files their
 * distributions keep beside them.
 * @param {{ node: string, typst: string }} executables
 */
export async function installedSource({ node, typst }) {
  const nodeDir = path.dirname(node);
  const typstDir = path.dirname(typst);
  return {
    node: {
      executable: await fs.readFile(node),
      license: await readOne(
        [path.join(nodeDir, "LICENSE"), path.join(nodeDir, "..", "LICENSE")],
        "node/LICENSE",
      ),
    },
    typst: {
      executable: await fs.readFile(typst),
      license: await readOne([path.join(typstDir, "LICENSE")], "typst/LICENSE"),
      notice: await readOne([path.join(typstDir, "NOTICE")], "typst/NOTICE"),
    },
  };
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Download `url`, retrying a server error or a dropped connection twice, a few seconds apart. */
async function download(url, name) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(url).catch((error) => ({
      ok: false,
      status: String(error.cause?.code ?? error),
    }));
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    const transient = typeof response.status !== "number" || response.status >= 500;
    if (!transient || attempt === 3)
      throw Error(`archive_source_unavailable:${name}:${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 5000 * attempt));
  }
}

/** The archive at `url`, from the cache or downloaded into it, refused unless its SHA-256 is `checksum`. */
async function fetchVerified({ url, checksum }, cache, online) {
  const name = path.basename(new URL(url).pathname);
  const file = path.join(cache, name);
  let bytes = await fs.readFile(file).catch(() => null);
  if (!bytes) {
    if (!online) throw Error(`archive_source_missing:${name}`);
    bytes = await download(url, name);
    if (`sha256:${sha256(bytes)}` !== checksum) throw Error(`archive_checksum_mismatch:${name}`);
    await fs.mkdir(cache, { recursive: true });
    await fs.writeFile(file, bytes);
  }
  if (`sha256:${sha256(bytes)}` !== checksum) throw Error(`archive_checksum_mismatch:${name}`);
  return file;
}

/** Every file below `directory`, as absolute paths. */
async function walk(directory) {
  const entries = await fs.readdir(directory, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
}

function extract(archive, into, tar) {
  const result = spawnSync(tar, ["-xf", archive, "-C", into], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0)
    throw Error(`archive_extract_failed:${path.basename(archive)}:${result.stderr.trim()}`);
}

async function pick(files, name, what) {
  const found = files.filter((file) => path.basename(file) === name);
  if (found.length !== 1) throw Error(`archive_source_unexpected:${what}`);
  return found[0];
}

/**
 * One platform's Node.js and Typst from their official archives at the lock's URLs,
 * verified by the lock's SHA-256 and extracted with the system's `tar`, which must
 * read tar.gz, tar.xz and zip archives, as macOS's does.
 * @param {{ node: { url: string, checksum: string }, typst: { url: string, checksum: string } }} locked
 * @param {{ cache: string, download?: boolean, tar?: string }} options
 */
export async function officialSource(locked, { cache, download = true, tar = "tar" }) {
  const nodeArchive = await fetchVerified(locked.node, cache, download);
  const typstArchive = await fetchVerified(locked.typst, cache, download);
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-official-"));
  try {
    await fs.mkdir(path.join(work, "node"));
    await fs.mkdir(path.join(work, "typst"));
    extract(nodeArchive, path.join(work, "node"), tar);
    extract(typstArchive, path.join(work, "typst"), tar);
    const nodeFiles = await walk(path.join(work, "node"));
    const typstFiles = await walk(path.join(work, "typst"));
    const windows = locked.node.url.endsWith(".zip");
    const node = await pick(nodeFiles, windows ? "node.exe" : "node", "node");
    const typst = await pick(typstFiles, windows ? "typst.exe" : "typst", "typst");
    return await installedSource({ node, typst });
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
}
