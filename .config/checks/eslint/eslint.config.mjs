import js from "@eslint/js";
import globals from "globals";
import fs from "node:fs";
import { parse } from "smol-toml";

const fileBudget = parse(
  fs.readFileSync(new URL("../file-budget/policy.toml", import.meta.url), "utf8"),
);

export default [
  {
    ignores: [
      "build/**",
      "node_modules/**",
      "openspec/changes/archive/**",
      "packages/publisher/renderers/archify/supply/**",
      "packages/publisher/renderers/fonts/supply/**",
      "packages/publisher/renderers/resvg/supply/**",
      "packages/publisher/supplies/likec4/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
      sourceType: "module",
    },
    rules: {
      complexity: ["error", 80],
      eqeqeq: ["error", "always"],
      "max-depth": ["error", 5],
      "max-lines": ["error", { max: fileBudget.maximum, skipBlankLines: true, skipComments: true }],
      "no-duplicate-imports": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-const": "error",
    },
  },
];
