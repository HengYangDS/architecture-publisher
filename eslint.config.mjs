import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'build/**',
      'node_modules/**',
      'openspec/changes/archive/**',
      'packages/publisher/renderers/archify/supply/**',
      'packages/publisher/renderers/interactive/supply/**',
      'packages/publisher/renderers/dagre/supply/**',
      'packages/publisher/renderers/elk/supply/**',
      'packages/publisher/renderers/fonts/supply/**',
      'packages/publisher/renderers/resvg/supply/**',
      'packages/publisher/supplies/likec4/**',
      'packages/publisher/src/edition/generated/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
    rules: {
      complexity: ['error', 80],
      eqeqeq: ['error', 'always'],
      'max-depth': ['error', 5],
      'no-duplicate-imports': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: [
      'packages/publisher/src/rendering/interactive-html.mjs',
      'tests/aigw-adopter.test.mjs',
      'tools/qualification/semantic-browser.mjs',
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: [
      'packages/publisher/src/file-input/contract.mjs',
      'tests/fixtures/module-boundaries.mjs',
    ],
    rules: {
      'no-control-regex': 'off',
    },
  },
  {
    files: ['packages/publisher/src/provider/**/*.mjs'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '../publication/**',
            '../qualification/**',
            '../rendering/**',
            '../../renderers/**',
          ],
        },
      ],
    },
  },
];
