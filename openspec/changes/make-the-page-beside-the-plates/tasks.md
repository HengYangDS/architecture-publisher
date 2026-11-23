## 1. The page beside the plates

- [ ] 1.1 Have `runArchify` tell its caller when Archify's process has begun, pass that on through the page and the guide, and start a build's page once its views are planned, in `src/map/archify.mjs`, `src/map/explainer.mjs`, `src/map/guide.mjs` and `src/build.mjs`; add a test to `tests/media-side-by-side.test.mjs`. Done when the test fails without the change and passes with it, with the progress, page, delivery and guide tests.

## 2. The twelve works

- [ ] 2.1 Build the twelve published works with the base and with the head under one ticket and compare each pair file by file, and build ETHOS's Chinese edition alone twice each with its child processes recorded. Done when all twelve pairs are identical and the head is faster than its base.

## 3. The record

- [ ] 3.1 Record the measurement in `docs/research/build-and-suite-time.md` and the change under `Unreleased` in `CHANGELOG.md`. Done when `npm run check:static` passes.

## 4. The item's end

- [ ] 4.1 Tick `performance` in `docs/product-contract.md`, record how it ended in `docs/research/build-and-suite-time.md` and its state in `docs/research/README.md`, and say so in `CHANGELOG.md`, in a second commit. Done when `tests/evolution-queue.test.mjs` and `npm run check:static` pass.
