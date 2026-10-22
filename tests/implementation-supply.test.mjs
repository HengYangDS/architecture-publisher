import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import * as implementation from "../packages/publisher/src/compiler/implementation-supply.mjs";

const product = fileURLToPath(new URL("../packages/publisher/", import.meta.url));
const readImplementationSupply = implementation.readImplementationSupply;
const verifyImplementationSupplyAtRoot = implementation.verifyImplementationSupplyAtRoot;

test("intrinsic interactive implementation supply includes native placement and routing workers", async () => {
  const manifest = JSON.parse(
    await fs.readFile(path.join(product, "supplies/implementation.json"), "utf8"),
  );
  const authored = manifest.profiles["interactive-authored"].map(({ path: file }) => file);
  assert(authored.includes("renderers/elk/worker.mjs"));
  assert(authored.includes("renderers/avoid/worker.mjs"));
  const neutral = manifest.profiles["interactive-neutral"].map(({ path: file }) => file);
  assert(neutral.includes("renderers/elk/worker.mjs"));
  assert(!neutral.some((file) => file.startsWith("renderers/avoid/")));
});

test("generated implementation profiles select owned code without package or sibling-media noise", async () => {
  const manifest = JSON.parse(
    await fs.readFile(path.join(product, "supplies/implementation.json"), "utf8"),
  );
  assert.equal(manifest.schema, "architecture.publisher-implementation-supply/v1");
  for (const [name, files] of Object.entries(manifest.profiles)) {
    assert(files.length > 0, name);
    assert(
      files.every(({ path: file }) => /^(?:src|renderers)\//u.test(file)),
      name,
    );
    assert(
      files.every(({ path: file }) => !file.includes("/supply/")),
      name,
    );
    assert.match((await readImplementationSupply(name)).sha256, /^[a-f0-9]{64}$/u);
  }
  assert(
    manifest.profiles["static-claim"].every(
      ({ path: file }) => !file.startsWith("renderers/interactive/"),
    ),
  );
  assert(
    manifest.profiles["interactive-neutral"].some(
      ({ path: file }) => file === "renderers/archify/assembly.mjs",
    ),
  );
  assert(
    manifest.profiles["static-likec4"].some(
      ({ path: file }) => file === "src/semantics/native-worker.mjs",
    ),
  );
  assert(Array.isArray(manifest.profiles["semantic-likec4"]));
  assert(Array.isArray(manifest.profiles["semantic-claim"]));
  assert(Array.isArray(manifest.profiles["static-structural"]));
  const structural = manifest.profiles["static-structural"].map(({ path: file }) => file);
  const refinement = manifest.profiles["static-refinement"].map(({ path: file }) => file);
  assert(structural.includes("renderers/dagre/static.mjs"));
  assert(!refinement.some((file) => file.startsWith("renderers/dagre/")));
  assert(
    manifest.profiles["semantic-likec4"].some(
      ({ path: file }) => file === "src/semantics/native-worker.mjs",
    ),
  );
  const claim = manifest.profiles["semantic-claim"].map(({ path: file }) => file);
  assert.deepEqual(
    claim.filter((file) => file.startsWith("renderers/")),
    ["renderers/icons/identity.mjs", "renderers/icons/index.mjs"],
  );
  assert(!claim.includes("src/semantics/native-worker.mjs"));
  await assert.rejects(readImplementationSupply("unknown"), {
    code: "publisher_implementation_profile_invalid",
  });
});

test("a static figure binds the union of selected media code as one supply", async () => {
  const manifest = JSON.parse(
    await fs.readFile(path.join(product, "supplies/implementation.json"), "utf8"),
  );
  const selected = await readImplementationSupply(["static-structural", "static-figure"]);
  assert.equal(selected.id, "publisher-static-media-file-set");
  assert.match(selected.sha256, /^[a-f0-9]{64}$/u);
  assert.notEqual(selected.sha256, (await readImplementationSupply("static-structural")).sha256);
  const paths = new Set(
    ["static-structural", "static-figure"].flatMap((name) =>
      manifest.profiles[name].map(({ path: file }) => file),
    ),
  );
  assert(paths.has("renderers/svg/figure.mjs"));
  assert(!paths.has("renderers/interactive/edition.mjs"));
  await assert.rejects(readImplementationSupply(["static-structural", "interactive-neutral"]), {
    code: "publisher_implementation_profile_invalid",
  });
});

test("a selected implementation profile set rejects absent, repeated, and oversized authority", async () => {
  for (const invalid of [
    null,
    [],
    Array(9).fill("static-claim"),
    ["static-claim", "static-claim"],
    ["static-claim", "unknown"],
    ["semantic-claim", "static-claim"],
  ]) {
    await assert.rejects(readImplementationSupply(invalid), {
      code: "publisher_implementation_profile_invalid",
    });
  }
});

test("selected installed code drifts fail, while README and unselected media do not change a supply", async (t) => {
  const temp = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-code-supply-"));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const copy = path.join(temp, "publisher");
  await fs.cp(product, copy, { recursive: true });
  const checked = (profile) => verifyImplementationSupplyAtRoot(copy, profile);
  const before = await checked("static-claim");
  await fs.appendFile(path.join(copy, "README.md"), "\nUnrelated package note.\n");
  assert.deepEqual(await checked("static-claim"), before);
  await fs.appendFile(path.join(copy, "renderers/interactive/edition.mjs"), "\n// drift\n");
  assert.deepEqual(await checked("static-claim"), before);
  await assert.rejects(checked("interactive-neutral"), {
    code: "publisher_implementation_supply_invalid",
  });
  await fs.appendFile(path.join(copy, "renderers/svg/edition.mjs"), "\n// drift\n");
  await assert.rejects(checked("static-claim"), {
    code: "publisher_implementation_supply_invalid",
  });
});

test("an installed implementation manifest cannot omit, alias, or misstate selected files", async (t) => {
  const temp = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "archpub-code-plan-"));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const copy = path.join(temp, "publisher");
  await fs.cp(product, copy, { recursive: true });
  const checked = (profile) => verifyImplementationSupplyAtRoot(copy, profile);
  const manifestPath = path.join(copy, "supplies/implementation.json");
  const original = await fs.readFile(manifestPath, "utf8");
  const baseline = JSON.parse(original);
  const invalid = [
    "{",
    original.replace('"schema":', '"schema":"duplicate","schema":'),
    JSON.stringify({ ...baseline, schema: "unrecognized" }),
    JSON.stringify({ ...baseline, profiles: null }),
    JSON.stringify({
      ...baseline,
      profiles: {
        ...baseline.profiles,
        "static-claim": baseline.profiles["static-claim"].filter(
          ({ path: file }) => file !== "renderers/svg/edition.mjs",
        ),
      },
    }),
    JSON.stringify({
      ...baseline,
      profiles: { ...baseline.profiles, "static-claim": [] },
    }),
    JSON.stringify({
      ...baseline,
      profiles: {
        ...baseline.profiles,
        "static-claim": [{ ...baseline.profiles["static-claim"][0], path: "../escape.mjs" }],
      },
    }),
  ];
  for (const content of invalid) {
    await fs.writeFile(manifestPath, content);
    await assert.rejects(checked("static-claim"), {
      code: "publisher_implementation_supply_invalid",
    });
  }
  await fs.writeFile(manifestPath, original);
  assert.match((await checked("static-claim")).sha256, /^[a-f0-9]{64}$/u);
});
