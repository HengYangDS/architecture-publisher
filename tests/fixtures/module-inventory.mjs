import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../../", import.meta.url));

export const runtimeRoots = [
  "packages/publisher/src",
  "packages/publisher/renderers",
  "packages/publisher/supplies",
  "editions/self/src",
  "tests/conformance/journeys/self-host",
];

export async function declaredPackageExports() {
  const exports = new Map();
  for (const directory of ["packages/publisher", "editions/self"]) {
    const manifest = JSON.parse(await fs.readFile(path.join(root, directory, "package.json")));
    for (const [subpath, target] of Object.entries(manifest.exports)) {
      assert.equal(typeof target, "string", `${manifest.name}:${subpath}`);
      const specifier = subpath === "." ? manifest.name : `${manifest.name}/${subpath.slice(2)}`;
      exports.set(specifier, path.posix.join(directory, target));
    }
  }
  return exports;
}

/** Build tools may consume only declared dependencies and their public package exports. */
export async function declaredDependencyImports(dependencies) {
  const imports = new Set(Object.keys(dependencies));
  for (const name of Object.keys(dependencies)) {
    const manifest = JSON.parse(
      await fs.readFile(path.join(root, "node_modules", name, "package.json")),
    );
    for (const subpath of Object.keys(manifest.exports ?? {}))
      if (subpath.startsWith("./") && !subpath.includes("*"))
        imports.add(`${name}/${subpath.slice(2)}`);
  }
  return imports;
}

export async function inventory(roots, resourceRoots = []) {
  const paths = new Set(["", "packages/publisher/", "editions/self/"]);
  const modules = [];
  async function visit(relative, collectModules) {
    paths.add(`${relative.replace(/\/$/, "")}/`);
    for (const entry of await fs.readdir(path.join(root, relative), {
      withFileTypes: true,
    })) {
      const file = path.posix.join(relative, entry.name);
      assert(!entry.isSymbolicLink(), `Unexpected source link: ${file}`);
      if (entry.isDirectory()) {
        paths.add(`${file}/`);
        await visit(file, collectModules);
      } else {
        paths.add(file);
        if (
          collectModules &&
          !/packages\/publisher\/renderers\/[^/]+\/supply\//.test(file) &&
          !file.startsWith("packages/publisher/supplies/") &&
          /\.(?:mjs|cjs|js)$/.test(file)
        )
          modules.push(file);
      }
    }
  }
  for (const directory of roots) await visit(directory, true);
  for (const directory of resourceRoots) await visit(directory, false);
  return { paths, modules };
}
