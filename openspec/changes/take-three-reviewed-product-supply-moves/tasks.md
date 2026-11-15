## 1. Baseline

- [x] 1.1 Build the three works before any move; done when each delivery is built with one
      `SOURCE_DATE_EPOCH` and kept outside the lane. Built 14:51-15:08 in one host ticket: big-bank
      and the LikeC4 shop with SOURCE_DATE_EPOCH of 46e4e06c, the publisher's work in Chinese with
      --repo at 4be4dd77; kept in the lane's work directory outside the tree.

## 2. Moves

- [ ] 2.1 Pin `lucide-static` 1.73.0, move the icon policy and generate the icon supply again; done
      when `mise run check` passes, the icon check names no changed artwork of a compared work, and
      `archpub compare` reports every work identical.
- [x] 2.2 Pin `playwright-core` 1.65.1; done when `mise run check` passes with the browser test run
      against a browser and `archpub compare` reports every work identical. `mise run check` passes
      with the browser test run against Google Chrome (6+398 tests pass, 0+0 skipped);
      `archpub compare`: big-bank: identical=True; shop: identical=True; publisher-zh:
      identical=True.

## Workflow follow-up

- Archive this Change and prove the archived head once.
- Publish the proposal under one host ticket, wait for both forges' review jobs, and land on the
  landing owner's go for the exact head after `fact-layer` has landed.
