## 1. Owners

- [x] 1.1 State the Typst release in `package.json`'s `engines` and read `TYPST_VERSION` from it; done when the tests
      of the overview and of one source pass and `npm run check:package` passes. `engines.typst` states the release and `src/names.mjs` reads it; the overview's and one source's tests pass, and `npm run check:package` passes.

## 2. Reference

- [x] 2.1 Write the table of what the publisher needs and fill the registry's meanings; done when the check of
      generated inputs runs the writer's check and passes, and no reference document names a version outside a
      written table. `npm run check:static` runs the writer's check and passes; no reference document names a version outside a written table.

## 3. Record and checks

- [x] 3.1 Record the change in the Changelog; done when every affected test, the writer's among them, and
      `npm run check:static` pass. The Changelog's entry is written; every affected test and `npm run check:static` pass.
