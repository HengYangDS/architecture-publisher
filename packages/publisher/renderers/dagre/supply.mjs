import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileEnvelope } from "../../src/file-input/read.mjs";
import { fail, hasExactFields } from "../../src/protocol/values.mjs";

const root = fileURLToPath(new URL("./supply/", import.meta.url));
const manifestSha256 = "390a3a0f156b78f284aca8aea242252a9db1eb4068da62b43c68559d54f50c1e";
const error = "render_dagre_supply_invalid";
const packages = [
  {
    name: "@dagrejs/dagre",
    version: "3.1.3",
    license: "MIT",
    integrity:
      "sha512-X4aUTwOReZvthaZWOVHqlJ52/ZdhZFEM4+Lh/uR4XooUSLE6p71bcy7MPGzYnNUcNh+nj+i/qJQpCMIdQnSmrg==",
  },
  {
    name: "@dagrejs/graphlib",
    version: "4.0.6",
    license: "MIT",
    integrity:
      "sha512-Hjv7hbfmSBMP4nVXMFt4gusqWWHghQF0qNT4V5KHo4Jatvd+2L5VHKFnnIjXVuDnaHIRz7ZuHSnlf0RuZkOwWA==",
  },
];

/** Verify the selected geometry implementation and its two locked package identities. */
export function validateDagreManifest(value) {
  if (
    !hasExactFields(value, ["schema", "packages", "files"]) ||
    value.schema !== "architecture.geometry-supply/v1" ||
    !Array.isArray(value.packages) ||
    value.packages.length !== packages.length ||
    value.packages.some(
      (item, index) =>
        !hasExactFields(item, ["name", "version", "license", "integrity"]) ||
        Object.entries(packages[index]).some(([key, expected]) => item[key] !== expected),
    ) ||
    !Array.isArray(value.files) ||
    value.files.length !== 2 ||
    value.files[0]?.path !== "dagre.min.js" ||
    value.files[1]?.path !== "LICENSE"
  )
    fail(error);
  return value;
}

/** Read only the exact geometry bytes carried by the installed product. */
export async function verifyDagreSupply(directory) {
  try {
    const selected = await readFileEnvelope(
      path.join(directory, "supply.json"),
      manifestSha256,
      validateDagreManifest,
      true,
    );
    return {
      version: "3.1.3",
      manifestSha256: selected.manifestSha256,
      script: Buffer.from(selected.members[0].content),
      license: Buffer.from(selected.members[1].content),
    };
  } catch (cause) {
    throw Object.assign(new Error(error, { cause }), { code: error });
  }
}

/** Prevent callers from replacing Publisher's selected geometry supply. */
export function loadDagreSupply() {
  if (arguments.length) fail(error);
  return verifyDagreSupply(root);
}
