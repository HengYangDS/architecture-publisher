import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileEnvelope } from "../../src/file-input/read.mjs";
import { fail, hasExactFields } from "../../src/protocol/values.mjs";

const root = fileURLToPath(new URL("./supply/", import.meta.url));
const digest = "29c3a1eaab20bce1dc96d856eada567be70fbac3dbfee48f882ff88286f6b33c";
const identity = {
  name: "libavoid-js",
  version: "0.4.5",
  license: "LGPL-2.1-or-later",
  integrity:
    "sha512-9BrYRXAQ+nmLuHZSqf4z52YN8TroBPxyqo6A6h6Pj03j5UYNx/Hhnd/rg+kiLVrE76wzBeBVO3OW7kaEpzYC9Q==",
};

function validateManifest(value) {
  if (
    !hasExactFields(value, ["schema", "packages", "files"]) ||
    value.schema !== "architecture.geometry-supply/v1" ||
    value.packages?.length !== 1 ||
    !hasExactFields(value.packages[0], Object.keys(identity)) ||
    Object.entries(identity).some(([key, expected]) => value.packages[0][key] !== expected) ||
    value.files?.length !== 3 ||
    value.files.some(
      (file, index) => file.path !== ["router.mjs", "libavoid.wasm", "LICENSE"][index],
    )
  )
    fail("render_avoid_supply_invalid");
  return value;
}

export async function loadAvoidSupply() {
  const selected = await readFileEnvelope(
    path.join(root, "supply.json"),
    digest,
    validateManifest,
    true,
  );
  return {
    id: "native-obstacle-routing",
    sha256: selected.manifestSha256,
    members: selected.members,
  };
}
