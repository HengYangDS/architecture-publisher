## 1. Generation

- [x] 1.1 Give the LikeC4 supply's generator a mode that writes only the parser, and have `npm run generate` run it
      alone; done when, on a copy, a table of a reference and the supply's manifest each changed by hand are refused
      by `npm run generate` followed by `npm run check:generated`, naming the file. On the copy, a table of the refusals reference and the supply's manifest, each changed by hand, were refused by `npm run generate` then `npm run check:generated` (`references_drift`, `likec4_supply_file_drift:supply.json`); the old `generate` let the table pass (2026-11-26).
- [x] 1.2 Say what generation does in the development reference and give the written tables one section in the
      configuration reference; done when `npm run check:docs` passes. The development reference says what generation does; the configuration reference holds the written tables' section; `npm run check:docs` passes.

## 2. Checks

- [x] 2.1 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
