## 1. References

- [x] 1.1 Name the moved project in the Raster source record, derive the manifest's package archive and integrity from it and regenerate the supply files; verify `node tools/supply/resvg.mjs --check` and `npm run check:ci` pass, `--check` refuses a manifest with the old archive, and the closure downloaded from the new path has the recorded digest. The source record names `dig/misc/tools/architecture/architecture-publisher`; the generator derives the manifest's archive and integrity; `resvg.mjs --check` and `check:ci` pass, `--check` refuses the old archive with `raster_supply_drift`, and the closure downloaded from the new path has the recorded digest.
- [x] 1.2 Link the early tags at the new path and record the move in the changelog; verify the docs checks pass. The 25 links to the early tags name the new path and the changelog records the move; the docs checks pass.

## 2. Verification

- [ ] 2.1 Run `npm run check`; verify it passes at or above the coverage floors.
