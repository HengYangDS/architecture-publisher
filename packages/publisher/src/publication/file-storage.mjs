import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

export const sha = (b) => createHash("sha256").update(b).digest("hex");

export const encode = (v) => JSON.stringify(v, null, 2) + "\n";

export const inside = (a, b) => a === b || b.startsWith(a + path.sep);

export const overlap = (a, b) => inside(a, b) || inside(b, a);

export const exists = (p) =>
  fs.lstat(p).then(
    () => true,
    (e) => {
      if (e.code === "ENOENT") return false;
      throw e;
    },
  );

export const equal = (a, b, why) => {
  if (a !== b) throw Error(why);
};

export const sameSet = (actual, expected, why) =>
  equal(JSON.stringify([...actual].sort()), JSON.stringify([...expected].sort()), why);

export function relative(root, file) {
  if (
    typeof file !== "string" ||
    !file ||
    path.isAbsolute(file) ||
    file.includes("\\") ||
    file.split("/").some((p) => !p || p === "." || p === "..")
  )
    throw Error("Invalid relative path");
  return path.join(root, file);
}

export async function noLinks(file) {
  for (let p = path.resolve(file); ; p = path.dirname(p)) {
    const s = await fs.lstat(p).catch((e) => {
      if (e.code === "ENOENT") return null;
      throw e;
    });
    if (s?.isSymbolicLink()) throw Error("Symbolic-link path refused: " + p);
    if (p === path.dirname(p)) break;
  }
}

export async function inventory(root) {
  await noLinks(root);
  if (!(await exists(root))) return { exists: false, entries: [] };
  if (!(await fs.lstat(root)).isDirectory()) throw Error("Destination is not a directory");
  const entries = [];
  async function walk(dir, rel = "") {
    for (const d of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const name = rel ? rel + "/" + d.name : d.name,
        p = path.join(dir, d.name),
        s = await fs.lstat(p);
      if (s.isSymbolicLink()) throw Error("Destination symlink refused: " + p);
      if (s.isDirectory()) {
        entries.push({ path: name, kind: "directory" });
        await walk(p, name);
      } else if (s.isFile()) {
        const b = await fs.readFile(p);
        entries.push({
          path: name,
          kind: "file",
          bytes: b.length,
          sha256: sha(b),
        });
      } else throw Error("Unsupported destination content: " + p);
    }
  }
  await walk(root);
  return { exists: true, entries };
}

export async function syncDirectory(directory) {
  // Node's Windows directory handles cannot supply FlushFileBuffers write access.
  // The effect result declares this limit; required file flush failures are not ignored.
  if (process.platform === "win32") return;
  const file = await fs.open(directory, "r");
  try {
    await file.sync();
  } finally {
    await file.close();
  }
}

export async function atomicJournal(file, bytes) {
  const temporary = file + "." + randomUUID() + ".tmp",
    handle = await fs.open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(temporary, file);
  await syncDirectory(path.dirname(file));
}
