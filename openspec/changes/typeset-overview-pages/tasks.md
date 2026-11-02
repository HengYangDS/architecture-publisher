## 1. Supplies

- [x] 1.1 Add Source Serif 4 4.005 and Source Sans 3 3.052 as a house font supply, unmodified, with their licences and origins; verify the supply check passes and each added file's digest equals that of the release member it came from.
- [x] 1.2 Pin Typst 0.15.1 in the toolchain for the three CI platforms; verify `mise exec -- typst --version` prints 0.15.1 and the lockfile records each platform's checksum.

## 2. Overview

- [x] 2.1 Accept the optional `overview` composition in the model and its schema; verify a relative `.typ` path is kept and an absolute, escaping or non-Typst path is refused with its JSON path.
- [x] 2.2 Add the house class with its masthead, imprint and primitives for heads, text, definition lists, rules, lines, stations and arrowheads; verify a fixture composition typesets with only the bundled fonts and the four type sizes.
- [x] 2.3 Typeset the overview in a sealed Typst compile and refuse text outside the live area, overlapping text, characters no face draws, unknown components, sizes, faces, colours or imports of the composition's own, and Typst warnings; verify each refusal on a fixture and that two builds give identical bytes.
- [x] 2.4 Add `overview` to the build options, the staged output, the check and the manifest; verify a model with a composition delivers `overview.svg` and its PNGs and a model without one delivers as before.

## 3. Documentation

- [x] 3.1 Update the model, operations and development references, the product contract, the README and the changelog; verify the Markdown, prose and strict OpenSpec checks pass.

## 4. Verification

- [ ] 4.1 Run `npm run check`; verify it passes at or above the coverage floors.
- [ ] 4.2 Build the corpus models; verify every poster and page is byte-identical to the published 0.7.0 deliveries.
- [x] 4.3 Record the fixture overview's SVG and PNG digests in the test every CI platform runs; verify the official and the Homebrew builds of Typst 0.15.1 both reproduce them here.
