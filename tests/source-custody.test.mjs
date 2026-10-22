import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";

const root = fileURLToPath(new URL("../", import.meta.url));
const receivedMembers = [
  ["renderers/avoid/supply/router.mjs", "libavoid-js", "dist/index-node.mjs"],
  ["renderers/avoid/supply/libavoid.wasm", "libavoid-js", "dist/libavoid.wasm"],
  ["renderers/avoid/supply/LICENSE", "libavoid-js", "LICENSE"],
  ["renderers/dagre/supply/dagre.min.js", "@dagrejs/dagre", "dist/dagre.min.js"],
  ["renderers/dagre/supply/LICENSE", "@dagrejs/dagre", "LICENSE"],
  ["renderers/elk/supply/elk.cjs", "elkjs", "lib/elk.bundled.js"],
  ["renderers/elk/supply/LICENSE", "elkjs", "LICENSE.md"],
  ["renderers/interactive/supply/svg-pan-zoom.min.js", "svg-pan-zoom", "dist/svg-pan-zoom.min.js"],
  ["renderers/interactive/supply/LICENSE", "svg-pan-zoom", "LICENSE"],
  ["renderers/resvg/supply/sax/sax.cjs", "sax", "lib/sax.js"],
  ["renderers/resvg/supply/sax/LICENSE.md", "sax", "LICENSE.md"],
  ["renderers/resvg/supply/sax/package.json", "sax", "package.json"],
  ["renderers/resvg/supply/opentype/opentype.mjs", "opentype.js", "dist/opentype.mjs"],
  ["renderers/resvg/supply/opentype/LICENSE", "opentype.js", "LICENSE"],
  ["renderers/resvg/supply/opentype/package.json", "opentype.js", "package.json"],
  ["src/edition/generated/LICENSE.schemasafe", "@exodus/schemasafe", "LICENSE"],
];

test("received npm artifacts bind their unchanged native members to the integrity provider", async () => {
  const { proof } = parse(await fs.readFile(path.join(root, ".ethos/profile.toml"), "utf8"));
  const lock = JSON.parse(await fs.readFile(path.join(root, "package-lock.json"), "utf8"));
  for (const [relative, owner, member] of receivedMembers) {
    const artifact = `packages/publisher/${relative}`;
    const contracts = (proof.source_contracts ?? []).filter((item) => item.members[artifact]);
    assert.equal(contracts.length, 1, `${artifact} requires one authentic source owner`);
    const [contract] = contracts;
    const reference = `package-lock.json#packages/node_modules/${owner}`;
    assert.equal(contract.kind, "upstream");
    assert.deepEqual(contract.members[artifact], [reference, `package/${member}`]);
    assert(contract.input_refs.includes(reference));
    assert.match(lock.packages[`node_modules/${owner}`].integrity, /^sha512-/u);
    assert.deepEqual(
      await fs.readFile(path.join(root, artifact)),
      await fs.readFile(path.join(root, "node_modules", owner, member)),
      `${artifact} must not become a locally modified supplier file`,
    );
    const gate = proof.gates.find(({ id }) => id === contract.integrity_gate);
    assert(gate, `${artifact} requires an executable integrity gate`);
    assert.equal(gate.trust_bearing, true);
    assert.equal(gate.network_policy, "offline");
    assert.deepEqual(gate.providers, [
      "ethos.adapters.gates.provenance.observation:integrity_report",
    ]);
  }
  const generation = proof.gates.find(({ id }) => id === "runtime-generation");
  assert.deepEqual(generation.depends_on, ["source-integrity"]);
  for (const id of proof.code_correctness_gates)
    assert.deepEqual(proof.gates.find((item) => item.id === id).depends_on, [generation.id]);
});
