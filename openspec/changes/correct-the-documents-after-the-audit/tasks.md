## 1. The research pages

- [x] 1.1 Replace the nine pages of `docs/research/` with the corrected pages. Done when `npm run check:docs` and `npm run check:format` pass and no page has more than 500 nonblank lines. Observed at 192b71ef: `npm run check:static`, which runs both, exits 0; the longest page has 455 nonblank lines.

## 2. The README and the tutorial

- [x] 2.1 Remove the duration of a first work from `README.md` and `docs/tutorial.md`. Done when neither file says "fifteen minutes" and `npm run check:docs` passes. Observed at 192b71ef: no line of either file holds the words, and the check exits 0.

## 3. Record

- [x] 3.1 Record the corrections under `Unreleased` in `CHANGELOG.md`. Done when `npm run check:static` passes. Observed at 192b71ef: exit 0, 14 specifications valid.
- [x] 3.2 Rehearse the archive of this Change without applying it. Done when the rehearsal accepts it. Rehearsed at the head that ticks this task.
