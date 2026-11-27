## 1. The schema

- [ ] 1.1 State the data file's format in `src/pinned/data.schema.json` and shape each object the data writes from
      it; done when tests refuse an extra key, a wrong order, a missing key, a wrong type and a wrong list length, and
      hold every data file the light fixtures build to the schema.
- [ ] 1.2 Write the data reference's tables and its sentence on the four ids from the schema and `src/delivery.json`;
      done when `npm run check:generated` passes and a test finds the blocks rewritten when the schema changes.
- [ ] 1.3 Keep every output; done when the data files of every mix of language, checkout, typesetting, guide,
      overview and media, and the command lines that read them, are byte for byte as on dev.

## 2. Record and checks

- [ ] 2.1 Record the change in the Changelog; done when its entry stands under the unreleased version.
- [ ] 2.2 Run the checks; done when every affected test and `npm run check:static` pass.
