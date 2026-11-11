## 1. Package check

- [x] 1.1 Select native npm packing in `check:package`; verify the original command finishes, validates the npm-selected archive and preserves an excluded runtime symlink. Evidence: `window33-publisher-packed-check-terminal.json`.

## 2. Verification

- [x] 2.1 Run the native static checks and existing archive tests on the changed lane; verify they pass and the dependency lock and product source remain unchanged. Evidence: `window33-publisher-packed-check-native-verification.log`.
