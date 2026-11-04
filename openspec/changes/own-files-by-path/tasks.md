## 1. Model

- [ ] 1.1 Accept model version 2 with `files` on components and relations, and drop the source catalog; verify validation keeps a directory and a file claim in order, and refuses version 1 naming `archpub migrate`, a path claimed twice, a glob claim and a directory among a relation's files at their JSON paths.

## 2. Binding

- [ ] 2.1 Resolve ownership at the revision, giving each file in the scope to its most specific claim, and refuse a claim that holds no file in the scope and a relation file absent at the revision; verify on a fixture repository a nested claim, an empty claim, a claim the scope excludes and an absent relation file.
- [ ] 2.2 Record every cited file in the manifest, version 5, with its digest, owner and citing relations, and every declared path as unverified without a checkout; verify the delivery and source-binding tests.

## 3. Readers

- [ ] 3.1 Cite each component's first owned file on the generated page as a numbered source, and its next file when Archify withholds one; verify the page tests, including a first claim of a directory.
- [ ] 3.2 Count owned files in the coverage report, list the components and relations without files as uncited, report currency for every cited file and print them in `archpub check`; verify the coverage and command tests.
- [ ] 3.3 Write version 2 models from the LikeC4 import and the guide scaffold; verify their tests.

## 4. Migration

- [ ] 4.1 Add `archpub migrate <model> --out <file>`; verify it converts the fixture models into valid version 2 models that cite the same files, reports a file two components cite and refuses an existing output.

## 5. Documentation

- [ ] 5.1 Describe claims, cited files, the manifest's file records and migration in the model and operations references, the product contract, the README, the product skill and the changelog; verify the documentation checks.

## 6. Verification

- [ ] 6.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 6.2 Migrate the three corpus works and build them against their checkouts; verify every poster and overview is byte-identical to this Change's base build of the version 1 models, and each page cites the same file for each component.
