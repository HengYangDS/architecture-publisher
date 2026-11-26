## 1. Fields and tables

- [x] 1.1 Describe every top-level field once in the schema and write the model reference's table of top-level fields
      from it; done when `node tools/docs/references.mjs --check` passes and the writer's test refuses the table
      changed by hand. Every top-level field of the schema carries a description; `node tools/docs/references.mjs --check` passes and the writer's test refuses the table of top-level fields changed by hand.
- [x] 1.2 Write a detail's name into the table of values from its pattern; done when the model reference states no
      limit of a detail's name by hand. A detail's name stands in the table of values, written from its pattern; the details' prose points to it.
- [x] 1.3 Give the data reference's three refusal codes rows of their own in the registry; done when the refusal
      registry's test passes and the data reference holds no table of codes. The three codes have rows of their own; the refusal registry's test passes and the data reference holds no table of codes.

## 2. Record and checks

- [x] 2.1 Record the change in the Changelog; done when its entry stands under the unreleased version. The Changelog's entry stands under the unreleased version.
- [x] 2.2 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
