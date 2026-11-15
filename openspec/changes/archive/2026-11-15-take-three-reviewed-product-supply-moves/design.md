## Context

See [proposal.md](proposal.md). The icon artwork is a generated supply that ships in the package;
`playwright-core` drives the browser in the test suite's page measurements. `archpub compare`
reports whether two deliveries hold the same bytes and, if not, which plates and files differ.

Read from the upstream releases on 2026-11-15:

- LikeC4 v1.61.0 (published 2026-11-14 16:49 UTC, `github.com/likec4/likec4` release notes) is a
  feature release whose fixes can change a parse (#3375, #3382, #3519). Measured in this lane on
  2026-11-15: the repository's supply guard refuses it with `likec4_supply_external_import_changed`;
  its node entry bundles to 8,052,351 bytes (5,262,461 at 1.60.0) with 68 external imports, all Node
  builtins, and no `pnpapi`, the one external the guard admits; the lock gains twelve packages,
  among them fontkit for measuring labels. It is held at 1.60.0 by the landing owner's ruling.
- Lucide 1.71.0 to 1.73.0 (published 2026-11-10 to 2026-11-14, `github.com/lucide-icons/lucide`) add
  icons and rename the `circle-arrow-*` and `square-arrow-*` families (#5168); the `route` icon is
  flipped (#4729). A renamed or redrawn icon that a work uses changes its delivery.
- Playwright v1.65.1 (published 2026-11-13 21:46 UTC, `github.com/microsoft/playwright`) fixes two
  test-runner regressions and pins Chromium 159.0.8154.6 (`browsers.json` revision 1255; 1.65.0
  pinned 158.0.8127.18, revision 1254).

## Goals / Non-Goals

**Goals:**

- Take the newest stable releases of the three packages without an unseen change of any delivery.

**Non-Goals:**

- Moving the CI image, `@likec4/language-services`, any other package or `mute-stream`.
- Changing any source of the layout, plate, page, overview or edition.

## Decisions

- Build the three works before any move, with one `SOURCE_DATE_EPOCH`, so before and after differ
  only by the moved package. The publisher's own work is built from a disposable clone of the
  publications repository with `--repo` a disposable clone of the publisher at the revision its
  model pins.
- After each move: refresh the lock, `mise run bootstrap`, generate the moved supply, run
  `mise run check`, build the three works again and compare each with its baseline. Identical:
  commit the move. Different: stop and list the differing plates and files per work.
- If the icon supply redraws an icon that a published work or an example uses, that is a delivered
  change even when the compared works are identical. Measured for Lucide 1.73.0: 37 icons added,
  none removed, 19 redrawn (the question-mark family, `route`, two `square-arrow-right-*`), and none
  of the 19 is among the 44 icons that the publications' works and the examples name.

### Alternatives considered

- **One commit for both moves:** rejected; the owner's method is one move at a time, so a changed
  byte names its cause.
- **Move the CI image with playwright-core:** rejected for this lane by the landing owner; each
  platform's preparation installs the Chromium the package pins, and the image's lag is its own
  item. The proposal's Linux review job tests whether the v1.64.1 image runs Chromium 159.
- **Accept the playwright move by comparing deliveries:** not sufficient; `playwright-core` is a
  development dependency imported only by `tests/map-browser.test.mjs` and
  `tests/fixtures/npm-environment.mjs`, and a delivery's `browser-check` gate is the renderer's own,
  recorded `not-run` in every baseline build. Its acceptance is that browser test run against a real
  browser: locally with `ARCHPUB_BROWSER_EXECUTABLE` set to the installed Google Chrome, in CI with
  the Chromium that the package pins. The deliveries are still compared, as for every move.
- **Compare only the bundled example:** rejected; the example does not import LikeC4, so the LikeC4
  shop through `archpub import likec4` and a real work are compared too.

Scope: the three packages and their generated supplies. Not the CI image, not `mute-stream`, not the
bundled runtime dependencies, which are current.

## Risks / Trade-offs

- [Chromium 159 needs a library the v1.64.1 CI image lacks] → The proposal's Linux review job is
  that test; on such a failure the lane stops and the image move becomes its own lane.
- [A moved supply changes an icon or a parse that no compared work uses] → The supply checks run in
  `mise run check`, and the icon check names every changed icon.

## Migration Plan

Baseline, three moves with their comparisons, archive, prove, propose under one host ticket, land on
the landing owner's go after `fact-layer` has landed. To roll back, revert the lane's commits.
