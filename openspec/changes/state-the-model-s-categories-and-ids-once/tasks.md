## 1. One statement each

- [x] 1.1 Gather how each category looks into one table in `src/kinds.mjs` and hold it to the schema's categories
      and default; done when the categories' test passes and fails with a category's look taken out. The categories' looks stand in one table in `src/kinds.mjs`, held to the schema's categories and default by a test that failed when a category's look was taken out (2026-11-26, in the copy).
- [x] 1.2 State the default category in the schema, read it in the model and the LikeC4 importer, hold the
      importer's categories to the schema's, and write the earlier versions once; done when the model, import and
      command-line tests pass. The schema states the default category; the model's normalizing and the LikeC4 importer read it, the importer's categories are held to the schema's at import, and the earlier versions are written once, the help of `migrate` reading them.
- [x] 1.3 Read an id's characters and longest length from its pattern in the LikeC4 importer; done when names the
      old rule did not cut give the ids they gave and ten long names give the longest id, each suffix within it. The LikeC4 importer's ids read the id's characters and longest length from its pattern: 200,000 names of up to 60 characters give the ids they gave (2026-11-26 20:2x, in the copy), and ten names past 128 characters give the longest id, each suffix within it.

## 2. Record and checks

- [x] 2.1 Record the change in the Changelog; done when its entry stands under the unreleased version. The Changelog's entry stands under the unreleased version.
- [x] 2.2 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
