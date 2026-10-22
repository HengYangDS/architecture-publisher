import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import schemaSafe from "@exodus/schemasafe";
import {
  BUILD_REQUEST_SCHEMA,
  EDITION_PROJECT_SCHEMA,
} from "../packages/publisher/src/edition/schema.mjs";
import { SCENE_REFINEMENT_SCHEMA } from "../packages/publisher/src/edition/schema/refinement.mjs";
import {
  PRIMITIVE_SCHEMA,
  LITERAL_SEGMENT_SCHEMA,
  AUTHORED_ROUTES_SCHEMA,
} from "../packages/publisher/src/edition/schema/primitive.mjs";
import { INTERACTIVE_ARCHITECTURE_INPUT_SCHEMA } from "../packages/publisher/src/edition/schema/interactive.mjs";
import { prose } from "../packages/publisher/src/edition/schema/fields.mjs";

const target = fileURLToPath(
  new URL("../packages/publisher/src/edition/generated/validators.mjs", import.meta.url),
);
const licenseTarget = fileURLToPath(
  new URL("../packages/publisher/src/edition/generated/LICENSE.schemasafe", import.meta.url),
);
const upstreamLicense = await fs.readFile(
  new URL("../LICENSE", import.meta.resolve("@exodus/schemasafe")),
);
const options = { mode: "strong", includeErrors: true };
const moduleFor = (schema) => schemaSafe.validator(schema, options).toModule();
const modules = [
  moduleFor(BUILD_REQUEST_SCHEMA),
  moduleFor(EDITION_PROJECT_SCHEMA),
  moduleFor(SCENE_REFINEMENT_SCHEMA),
  moduleFor({ $schema: "http://json-schema.org/draft-07/schema#", ...PRIMITIVE_SCHEMA }),
  moduleFor({ $schema: "http://json-schema.org/draft-07/schema#", ...LITERAL_SEGMENT_SCHEMA }),
  moduleFor({ $schema: "http://json-schema.org/draft-07/schema#", ...AUTHORED_ROUTES_SCHEMA }),
  moduleFor({
    $schema: "http://json-schema.org/draft-07/schema#",
    ...INTERACTIVE_ARCHITECTURE_INPUT_SCHEMA,
  }),
  moduleFor({ $schema: "http://json-schema.org/draft-07/schema#", ...prose }),
];
if (modules.some((source) => source.includes("require(") || source.includes("import ")))
  throw Error("generated_validator_has_runtime_dependency");

const output = [
  "// Generated from edition/schema.mjs by tools/generate-authoring-validators.mjs.",
  "// Generator license: edition/generated/LICENSE.schemasafe.",
  "// @ts-nocheck",
  `export const buildRequestValid = ${modules[0]};`,
  `export const editionProjectValid = ${modules[1]};`,
  `export const sceneRefinementValid = ${modules[2]};`,
  `export const primitiveValid = ${modules[3]};`,
  `export const literalSegmentValid = ${modules[4]};`,
  `export const authoredRoutesValid = ${modules[5]};`,
  `export const interactiveArchitectureInputValid = ${modules[6]};`,
  `export const proseValid = ${modules[7]};`,
  "",
].join("\n");

if (process.argv.length !== 3 || !["--write", "--check"].includes(process.argv[2]))
  throw Error("usage: generate-authoring-validators.mjs --write|--check");
if (process.argv[2] === "--write") {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, output);
  await fs.writeFile(licenseTarget, upstreamLicense);
} else if (
  (await fs.readFile(target, "utf8")) !== output ||
  !(await fs.readFile(licenseTarget)).equals(upstreamLicense)
)
  throw Error("generated_validator_drift");
