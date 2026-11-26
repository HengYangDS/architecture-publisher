## 1. Tables written from their sources

- [x] 1.1 Write the model reference's table of palettes and the lines reference's table from `src/house.json`; done
      when `node tools/docs/references.mjs --check` passes and the writer's test refuses each changed by hand. The palettes' and the lines' tables are written from `src/house.json`; `node tools/docs/references.mjs --check` passes and the writer's test refuses each changed by hand.
- [x] 1.2 Read the data's members and an evidence row's keys from the data reference in the tests; done when the
      data's and the evidence's tests pass without a literal list of them. The data's and the evidence's tests read the data reference's keys; no literal list of them remains.
- [x] 1.3 Point the data reference's files, the configuration reference's carriers and the command line reference's
      roles at their sources; done when `npm run check:docs` passes and no table of them remains. The files, the carriers and the roles point at their sources; `npm run check:docs` passes.

## 2. The item's end

- [x] 2.1 Record how the item ended in the research page and mark it finished in the contract; done when the queue's
      test passes. The research page records how the item ended, the contract marks it finished, and the queue's test passes.

## 3. Record and checks

- [x] 3.1 Record the change in the Changelog; done when its entry stands under the unreleased version. The Changelog's entry stands under the unreleased version.
- [x] 3.2 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
