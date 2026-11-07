import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "build/**",
      "node_modules/**",
      "openspec/changes/archive/**",
      "renderers/archify/supply/**",
      "renderers/fonts/supply/**",
      "renderers/opentype/supply/**",
      "supplies/likec4/**",
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
      "no-duplicate-imports": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-const": "error",
    },
  },
];
