# Repository configuration

Quality policy belongs in `checks/`. The root npm scripts select the native
tools; `.ethos/` selects their repository governance roles. Neither duplicates
the other's requirements.

| Owner                                                      | Consumer                                   |
| ---------------------------------------------------------- | ------------------------------------------ |
| `checks/coverage.json`                                     | c8 through `npm run test:coverage`         |
| `checks/knip.json`                                         | Knip through `npm run check:dead-code`     |
| `checks/markdownlint-cli2.jsonc` and `checks/markdown.mjs` | Markdownlint through `npm run check:docs`  |
| `checks/prettier.json`                                     | Prettier's native `package.json` reference |

Each retained root entry has a concrete native consumer. These are not
duplicates or forwarding wrappers.

| Root entry                             | Native responsibility                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `package.json` and `package-lock.json` | npm workspace, locked dependencies, scripts and native configuration references |
| `.gitignore` and `.gitattributes`      | Git checkout and file selection                                                 |
| `.node-version`                        | Runtime discovery; npm validates the same selection                             |
| `.prettierignore`                      | Formatter CLI and editor default discovery with root-relative paths             |
| `eslint.config.mjs`                    | ESLint CLI and editor discovery; one complete rule owner                        |
| `jsconfig.json`                        | JavaScript language-service discovery and native TypeScript checking            |
| `.gitlab-ci.yml`                       | The current configured Forge pipeline entry                                     |

Moving a native entry requires qualifying its actual consumer, not leaving a
forwarding file. Knip, c8 and Markdownlint file globs remain repository-relative;
Markdownlint's custom rule is configuration-relative. Prettier ignore rules
stay root-relative. No host path, copied policy or custom loader is needed.
