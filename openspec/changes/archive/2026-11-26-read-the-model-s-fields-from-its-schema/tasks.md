## 1. Characterisation

- [x] 1.1 Record the problems of a model wrong in each object's fields and each list's fewest items from the loader
      as it was; done when the characterisation test passes on that loader for every case but a spur without `at`. The problems of 118 bad models were recorded from the loader before the change (2026-11-26, in the copy); all but a spur without `at` are unchanged by it.

## 2. Fields and lengths

- [x] 2.1 Read every object's fields and every list's fewest items from the schema, and give the schema a spur's view
      and the loader's order of fields; done when the characterisation, vocabulary and plates tests pass, an object
      or a list left unread fails the vocabulary test, and fields written by hand fail the type check. The characterisation, vocabulary and plates tests pass; fields written by hand in `paths.mjs` failed the vocabulary test and the type check, a number written for the coverage's included paths failed the vocabulary test, and a spur's view taken from the schema failed the plates test (2026-11-26, in the copy).

## 3. Record and checks

- [x] 3.1 Record the change in the Changelog; done when its entry stands under the unreleased version. The Changelog's entry stands under the unreleased version.
- [x] 3.2 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
