## 1. Refusal

- [x] 1.1 Refuse an overview composition that is not a file with `overview_composition_missing` before staging or Typst runs; verify that a model naming a missing `overview.typ` and one naming `art/overview.typ` without `art/` are refused by `archpub check` and `archpub build` with the code and both paths, that the build writes nothing, and that the existing overview tests pass. Before the fix `archpub check` refused a missing `overview.typ` with `overview_typst_error` and failed on `art/overview.typ` with `ENOENT`; with it both are refused with `overview_composition_missing`, naming the model's value and the path looked at, the build writes nothing and the 12 overview tests pass.

## 2. Documentation

- [x] 2.1 Add the case to the operations reference and the changelog; verify the documentation checks. The operations reference and the changelog name the case; Prettier and markdownlint pass on the repository.

## 3. Verification

- [ ] 3.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 3.2 Check the three published works with this publisher against their repositories; verify each check passes with its overview typeset as before.
