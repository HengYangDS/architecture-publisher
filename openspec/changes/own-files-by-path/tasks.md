## 1. Model

- [x] 1.1 Accept model version 2 with `files` on components and relations, and drop the source catalog; verify validation keeps a directory and a file claim in order, and refuses version 1 naming `archpub migrate`, a path claimed twice, a glob claim and a directory among a relation's files at their JSON paths. Validation keeps `src/model/` and `README.md` in order and refuses version 1 naming `archpub migrate`, a path claimed twice, a glob claim and a directory among a relation's files at their JSON paths.

## 2. Binding

- [x] 2.1 Resolve ownership at the revision, giving each file in the scope to its most specific claim, and refuse a claim that owns no file in the scope and a relation file absent at the revision; verify on a fixture repository a nested claim, an empty claim, a claim the scope excludes, a claim that deeper claims leave empty and an absent relation file. On fixture repositories `src/lib/b.go` goes to the deeper of two claims, and an empty claim, a claim the scope excludes, a claim that deeper claims leave empty and an absent relation file are refused together with `files_unresolved`.
- [x] 2.2 Record every cited file in the manifest, version 5, with its digest, owner and citing relations, and every declared path as unverified without a checkout; verify the delivery and source-binding tests. The version 5 manifest records `src/main.mjs` once with its digest, owner `client` and relation `r1`; without a checkout every declared path is unverified.

## 3. Readers

- [x] 3.1 Cite each component's first owned file on the generated page as a numbered source, and its next file when Archify withholds one; verify the page tests, including a first claim of a directory. The page cites the first file of a component's first claim as `source-1` and its next file when the first is withheld; a directory claim cites its first file at the revision.
- [x] 3.2 Count owned files in the coverage report, list the components and relations without files as uncited, report currency for every cited file and print them in `archpub check`; verify the coverage and command tests. The coverage report counts owned files, `check` prints `3 of 6 files owned` and the currency of every cited file, and lists the components and relations without files.
- [x] 3.3 Write version 2 models from the LikeC4 import and the guide scaffold; verify their tests. The LikeC4 import and the guide scaffold write version 2 models; their tests pass.

## 4. Migration

- [x] 4.1 Add `archpub migrate <model> --out <file>`; verify it converts the fixture models into valid version 2 models that cite the same files, reports a file two components cite and refuses an existing output. `archpub migrate` converts the five fixture models into valid version 2 models, names each file several components cited, and refuses an existing output with `migrate_output_exists`.

## 5. Documentation

- [x] 5.1 Describe claims, cited files, the manifest's file records and migration in the model and operations references, the product contract, the README, the product skill and the changelog; verify the documentation checks. The model and operations references, the product contract, the README, the product skill and the changelog describe claims, cited files, the manifest's records and migration; the docs and spec checks pass.

## 6. Verification

- [x] 6.1 Run `npm run check`; verify it passes at or above the coverage floors. Passed at `1ce5718` with 99.55% statements, 95.57% branches, 99.82% functions and 99.55% lines.
- [x] 6.2 Migrate the three corpus works and build them against their checkouts; verify every poster and overview is byte-identical to this Change's base build of the version 1 models, and each page cites the same file for each component. At `32de322`'s tree the migrated ETHOS, AIGW and Architecture Publisher works build every poster and overview byte-identical to the base build of their version 1 models, every cited file with the base digest, and each page cites the same file under the same component.
