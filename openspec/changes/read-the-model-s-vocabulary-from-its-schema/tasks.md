## 1. Characterisation

- [ ] 1.1 Record the problems of the bad models from the loader as it was; done when the characterisation test passes
      on the loader before the change.

## 2. Vocabulary

- [ ] 2.1 Read the model's vocabulary from the schema, and give the schema the loader's rules of one value; done when
      the characterisation and vocabulary tests pass, and a pattern or a longest length written again in a model
      module fails the latter.
- [ ] 2.2 Write the model reference's rules of ids, text and paths from the schema; done when
      `node tools/docs/references.mjs --check` passes and the writer's test refuses a rule changed by hand.

## 3. Record and checks

- [ ] 3.1 Record the change in the Changelog; done when its entry stands under the unreleased version.
- [ ] 3.2 Run the checks; done when every affected test and `npm run check:static` pass.
