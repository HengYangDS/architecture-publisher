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
Mise exposes each selected tool as either a map or an array. Both environment
templates resolve the native shape before selecting its installation path.
Linux ARM64 additionally selects official Pixi through Mise's lock. The native
`ci/linux/` manifest and lock provide C compilation and xz without root package
installation. CI copies their inputs and the Pixi configuration into ignored
`build/runtime/work/` state; Pixi owns the environment and generated activation.
Its cache stays in `build/runtime/tool-cache/pixi/` on the Runner's native
filesystem. These prerequisites do not change the public product's runtime.
The Pixi-generated lock retains native bytes as a Git snapshot and is excluded
from editorial formatting; authored manifest and configuration remain config.

Playwright owns Chromium installation; the npm test preload requires the exact
selected executable in CI. The Raster source manifest owns archive identity and
registry coordinates; `tools/raster/resvg/verify.mjs` derives its retrieval URL
from the caller's Forge API base and verifies bytes before the frozen journey.

`ci/linux/Dockerfile` changes only the immutable official Playwright image's
default to `pwuser`. Runner's native checkout ownership inspection uses that
image configuration, not the job's late user override. The recipe introduces
no filesystem layer, package installer, repository content or runtime command.
CI may select its immutable digest only after registry readback; actual hosted
ownership and sandboxed browser execution remain separate acceptance predicates.
