## 1. Guide

- [ ] 1.1 Accept `guide` in the model and refuse an invalid path at `/guide`; verify validation keeps `guide/guide.archify.md` and refuses a path that leaves the model's directory or does not end in `.archify.md`.
- [ ] 1.2 Stage a guide's draft and the files it references, refusing a link, another path and a missing file; verify a fixture draft stages exactly its referenced files.
- [ ] 1.3 Deliver the guide as the page through a shared clone at the model's revision, with strict writing at showcase, refusing a draft that names another repository; verify a fixture guide builds with its cited lines pinned, the checkout is unchanged, and a mismatched `@meta` and a writing violation are refused.
- [ ] 1.4 Record the guide's inputs in the manifest; verify it lists the draft's and each staged file's digest, the writing level and the verification state, and that two builds are byte-identical.
- [ ] 1.5 Add `archpub scaffold guide`; verify it writes today's page as a draft with its diagrams, refuses an existing directory, and the written guide of a model with short prose builds.
- [ ] 1.6 Document the guide in the model and operations references, the product contract, the README, the product skill and the changelog; verify the docs and spec checks pass.

## 2. Verification

- [ ] 2.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 2.2 Build the three corpus works; verify every poster, page and overview is byte-identical to its published 0.7.0 delivery.
