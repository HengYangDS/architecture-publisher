## 1. Registry and references

- [x] 1.1 Move the categories' looks into `src/categories.json`, read by `src/kinds.mjs`; done when the categories'
      looks test and the module boundaries test pass. The categories' looks stand in `src/categories.json`, read by `src/kinds.mjs`; the categories' looks and module boundaries tests pass.
- [x] 1.2 Write the model reference's table of categories and row of statuses, and the command line reference's sample
      refusal, from their sources; done when `node tools/docs/references.mjs --check` passes and the writer's test
      refuses each of them changed by hand. `node tools/docs/references.mjs --check` passes; the writer's test refuses the table of values, which holds the row of statuses, the table of categories and the sample refusal, each changed by hand.
- [x] 1.3 Move the model reference's overview section to its own page, and name the earlier versions only in the model
      reference's section on them; done when `npm run check:docs` passes, `docs/reference/model.md` holds at most 500
      non-blank lines and no other document or the Skill names an earlier version's number. The overview stands in `docs/reference/overview.md`; `npm run check:docs` passes, the model reference holds 424 non-blank lines, and only its section on earlier versions names their numbers.

## 2. Faces after the model

- [x] 2.1 Load the faces only once a model is admitted; done when a check of the sample refusal takes under 0.2 s
      and the tests of a check and a build pass. A check of the sample refusal took 0.12 s, where it took 0.79 s (2026-11-26, in the copy); the tests of a check and a build passed in the heavy pre-run.

## 3. Record and checks

- [x] 3.1 Record the change in the Changelog; done when its entry stands under the unreleased version. The Changelog's entry stands under the unreleased version.
- [x] 3.2 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
