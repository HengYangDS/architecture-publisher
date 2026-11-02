## 1. Diagnostics

- [x] 1.1 Make every path in Typst's diagnostics relative to the staged root; verify a Windows verbatim path, a resolved temporary path and a relative path each name `overview.typ:<line>`. Before the fix the Windows and resolved forms named the temporary file; all three name `overview.typ:7`.

## 2. Verification

- [ ] 2.1 Run `npm run check`; verify it passes at or above the coverage floors.
