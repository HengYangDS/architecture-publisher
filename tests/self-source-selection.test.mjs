import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));

test("self source selection binds the complete authored preparation graph", async () => {
  const { SELF_SOURCE_SELECTION } = await import("../editions/self/src/edition/sources.mjs");
  const selected = new Set(Object.values(SELF_SOURCE_SELECTION).map(({ path }) => path));
  const result = await build({
    absWorkingDir: root,
    entryPoints: ["editions/self/src/edition/prepare.mjs"],
    bundle: true,
    write: false,
    metafile: true,
    platform: "node",
    format: "esm",
    packages: "external",
    logLevel: "silent",
  });
  const owners = Object.keys(result.metafile.inputs)
    .map((file) => file.replaceAll(path.sep, "/"))
    .filter((file) => file.startsWith("editions/self/src/edition/"));
  assert.ok(owners.length);
  assert.deepEqual(
    owners.filter((file) => !selected.has(file)),
    [],
  );
  for (const value of Object.values(SELF_SOURCE_SELECTION)) {
    assert.deepEqual(Object.keys(value).sort(), ["authority", "path"]);
    assert.equal(path.isAbsolute(value.path), false);
    assert.ok(value.authority.trim());
  }
});
