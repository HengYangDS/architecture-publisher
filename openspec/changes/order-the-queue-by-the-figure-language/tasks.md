## 1. The contract and the roadmap

- [x] 1.1 State in the Product section of `docs/product-contract.md` what the edition and the page are each for, and correct the Boundaries' line on slides. Done when the section names both media and says each draws its own figures, and no line says that slides are not produced. The Product section gained one paragraph on the two media; the Boundaries say that the landscape pages are made to be shown as slides.
- [x] 1.2 Rewrite the queue in `docs/product-contract.md`: the six finished items without the owner's remarks, the eight open items in order, the sentence on acceptance, and no rule against new palettes, styles and compositions. Done when `tests/evolution-queue.test.mjs` passes and the queue holds fourteen items in their order, six ticked. The queue test passes (three tests); the contract lists fourteen items, six ticked.
- [x] 1.3 Say at the head of `docs/roadmap.md` which of its steps no longer direct work. Done when `npm run check:docs` and `npm run check:format` pass. Both pass, as parts of `npm run check:static`.

## 2. Record

- [x] 2.1 Record the change under `Unreleased` in `CHANGELOG.md`. Done when `npm run check:static` passes. Recorded as the first entry under Changed; `npm run check:static` passes in the lane.
- [ ] 2.2 Rehearse the archive of this Change without applying it. Done when the rehearsal accepts it.
