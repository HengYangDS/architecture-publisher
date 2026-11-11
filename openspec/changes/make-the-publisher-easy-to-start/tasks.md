## 1. Commands

- [x] 1.1 Write failing tests for `archpub <command> --help` printing that command's usage with status 0, for `check` counting one view in the singular, for `$schema` accepted at the top of a model, for an unknown field naming its nearest field, and for `check` and `build` warning when `--repo` names a checkout but the model claims and cites no file; verify they fail on 0.11.0.
- [x] 1.2 Give each command its usage lines, print them for `--help`, count in the singular, accept `$schema`, name the nearest field and return `warnings` in results and text; verify the tests pass and `src/model/load.mjs` stays within 500 lines.

## 2. Skill

- [x] 2.1 Write failing tests that the package's files include `skills/architecture-publisher/SKILL.md`, that `archpub skill` prints it, and that every command, option and refusal code the Skill names exists in the command table and in `src/`; verify they fail on 0.11.0.
- [x] 2.2 Rewrite the Skill for the print edition, the guide, re-pinning and acceptance, ship it in the package and add `archpub skill`; verify the tests pass and the archive holds the Skill.

## 3. Platforms

- [x] 3.1 Lock Node.js, Typst, CUE and Taplo for `linux-x64` and `windows-x64` and declare Taplo's x86-64 assets; verify `mise install` resolves each locked platform's archive by its checksum.
- [x] 3.2 Add GitHub verification jobs on `ubuntu-24.04` and `windows-2025` from the pipeline's single source, assemble archives for every locked platform and add the npm provenance job gated by `NPM_PUBLISH`; verify the generated workflows match `pipeline.cue`, the archive tests cover the five platforms and the release refuses an unlocked one.

## 4. Readers

- [x] 4.1 Rewrite the README around a plate, a one-line install, the published works and the agent path; add a tutorial, how-to guides and a glossary; correct the reference where it no longer matches the code; verify every link resolves, `mise run check` passes and Vale reports nothing in the changed Markdown.
- [x] 4.2 Add bug, feature and documentation issue forms and a pull request template on GitHub, the same issue and merge request templates on GitLab, and give `CONTRIBUTING.md` an outside-contributor path, a private vulnerability report and a conduct section, since the repository paradigm admits no other root document; verify the checks pass on them.

## 5. Release

- [ ] 5.1 Record 0.12.0 in `CHANGELOG.md`, `VERSION`, `package.json` and `package-lock.json`; verify `mise run check` passes.
- [ ] 5.2 Build the twelve editions of the six works at publications' current `dev` with the lane's publisher and with 0.11.0; verify every edition, image and page is byte-identical and the manifests differ only in the publisher's version.
