## 1. Fields and tables

- [ ] 1.1 Describe every top-level field once in the schema and write the model reference's table of top-level fields
      from it; done when `node tools/docs/references.mjs --check` passes and the writer's test refuses the table
      changed by hand.
- [ ] 1.2 Write a detail's name into the table of values from its pattern; done when the model reference states no
      limit of a detail's name by hand.
- [ ] 1.3 Give the data reference's three refusal codes rows of their own in the registry; done when the refusal
      registry's test passes and the data reference holds no table of codes.

## 2. Record and checks

- [ ] 2.1 Record the change in the Changelog; done when its entry stands under the unreleased version.
- [ ] 2.2 Run the checks; done when every affected test and `npm run check:static` pass.
