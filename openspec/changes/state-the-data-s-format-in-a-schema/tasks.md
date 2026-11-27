## 1. The schema

- [x] 1.1 State the data file's format in `src/pinned/data.schema.json` and shape each object the data writes from
      it; done when tests refuse an extra key, a wrong order, a missing key, a wrong type and a wrong list length, and
      hold every data file the light fixtures build to the schema. `src/pinned/data.schema.json` states the data file's format, and `src/pinned/format.mjs` shapes each object the data writes from it; tests refuse an extra key, a wrong order, a missing key, a wrong type and a wrong list length, and hold every data file the light fixtures build to the schema.
- [x] 1.2 Write the data reference's tables and its sentence on the four ids from the schema and `src/delivery.json`;
      done when `npm run check:generated` passes and a test finds the blocks rewritten when the schema changes. The data reference's tables and its sentence on the four ids are written from the schema and `src/delivery.json`; `npm run check:generated` passes and a test finds the blocks rewritten when the schema changes.
- [x] 1.3 Keep every output; done when the data files of every mix of language, checkout, typesetting, guide,
      overview and media, and the command lines that read them, are byte for byte as on dev. 96 data files of every mix of language, checkout, typesetting, guide, overview and media, and 11 command lines, are byte for byte as on dev, and each data file holds to the schema (2026-11-28).

## 2. Record and checks

- [x] 2.1 Record the change in the Changelog; done when its entry stands under the unreleased version. The Changelog's entry stands under the unreleased version.
- [x] 2.2 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
