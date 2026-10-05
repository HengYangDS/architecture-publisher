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

## Job-local native tools

Mise discovers `mise.ci.toml` and its native lockfile here when `MISE_ENV=ci`.
The Forge projection requires locked installation and keeps tool supply under
the job's ignored `build/runtime/tool-cache/`, separate from host installations.
The generated `mise/locks/` files belong to Mise's npm lock closure; they are not
another package manifest or product interface.

Node selection comes from `.node-version`. The selected npm, Rust target and
wasm-bindgen versions serve native execution, not an alternative quality gate.
Playwright owns Chromium installation; the npm test preload requires the exact
selected executable in CI. The Raster source manifest owns archive identity and
registry coordinates; `tools/raster/resvg/verify.mjs` derives its retrieval URL
from the caller's Forge API base and verifies bytes before the frozen journey.
