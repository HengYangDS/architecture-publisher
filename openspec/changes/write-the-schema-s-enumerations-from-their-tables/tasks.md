## 1. Sets written from their tables

- [ ] 1.1 Write the schema's categories, palettes and languages with their defaults from `src/categories.json`,
      `src/house.json` and `src/locales.json`; done when `node tools/docs/references.mjs --check` passes and the
      writer's test refuses the schema changed by hand and writes a table's change into it.
- [ ] 1.2 Read the languages and the default language from `src/locales.json` and hold each table of words to them
      at import; done when the test of the languages passes and refuses a table keyed otherwise.
- [ ] 1.3 State the default palette once, in the schema, and read it there; done when no module names a default
      palette and the palettes' tests pass.

## 2. Defaults and texts

- [ ] 2.1 Hand the overview drawn alone the loader's language; done when `src/overview/house.typ` names no default
      language and the overview's tests pass.
- [ ] 2.2 Hold a track's name to the rule of a text; done when the overview statement's test refuses a NUL character
      and an overlong name.

## 3. Record and checks

- [ ] 3.1 Record the change in the Changelog; done when its entry stands under the unreleased version.
- [ ] 3.2 Run the checks; done when every affected test and `npm run check:static` pass.
