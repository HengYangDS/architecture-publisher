import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileEnvelope } from "../../src/file-input/read.mjs";
import { fail, hasExactFields } from "../../src/protocol/values.mjs";

const root = fileURLToPath(new URL("./supply/", import.meta.url));
const manifestSha256 = "0882609cd092f85688113fdc0a9049a6737068a2ab42e3ef945d988fe287ebc7";
const error = "render_elk_supply_invalid";
const identity = Object.freeze({
  name: "elkjs",
  version: "0.12.0",
  license: "EPL-2.0 OR GPL-3.0-or-later",
  integrity:
    "sha512-YZcKynxVxYoKIOEpywEPwCFdg+BTbxQRNf3pbwdDCvc8O3kQD8bmIwSxKU1eOTVc4Xo+VG9Te+575mlfvOrhEQ==",
});

export function validateElkManifest(value) {
  if (
    !hasExactFields(value, ["schema", "packages", "files"]) ||
    value.schema !== "architecture.geometry-supply/v1" ||
    !Array.isArray(value.packages) ||
    value.packages.length !== 1 ||
    !hasExactFields(value.packages[0], Object.keys(identity)) ||
    Object.entries(identity).some(([key, expected]) => value.packages[0][key] !== expected) ||
    !Array.isArray(value.files) ||
    value.files.length !== 2 ||
    value.files[0]?.path !== "elk.cjs" ||
    value.files[1]?.path !== "LICENSE"
  )
    fail(error);
  return value;
}

export async function verifyElkSupply(directory) {
  try {
    const selected = await readFileEnvelope(
      path.join(directory, "supply.json"),
      manifestSha256,
      validateElkManifest,
      true,
    );
    return {
      version: identity.version,
      manifestSha256: selected.manifestSha256,
      script: Buffer.from(selected.members[0].content),
      license: Buffer.from(selected.members[1].content),
    };
  } catch (cause) {
    throw Object.assign(new Error(error, { cause }), { code: error });
  }
}

export function loadElkSupply() {
  if (arguments.length) fail(error);
  return verifyElkSupply(root);
}
