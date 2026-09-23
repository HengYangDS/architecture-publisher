# Tasks

## 1. Reproduce the real Provider boundary

- [x] 1.1 Add an executable Provider fixture that declares and calls an allowed
      `architecture-publisher` public export; run the focused conformance test
      and verify it fails only during isolated relocation with
      `ERR_MODULE_NOT_FOUND`.
- [x] 1.2 Add an undeclared-Publisher-import case and verify dependency
      conformance rejects it before relocation.

## 2. Repair isolated relocation

- [x] 2.1 Stage the exact Publisher package executing the conformance profile
      under the relocation package-resolution root only when the Provider
      declares that dependency; verify deterministic and adjacent-checkout runs
      both pass.
- [x] 2.2 Preserve all existing forbidden-dependency, identity, resource-limit,
      output-schema and cleanup failures; run the complete Provider-focused test
      set under the declared `npm@11.19.1` toolchain.

## 3. Verify and close

- [x] 3.1 Record the unreleased fix, pass formatting, lint, types, imports,
      dead-code, documentation, strict OpenSpec and package checks with no
      unapproved warnings.
- [x] 3.2 Run the complete repository proof at one frozen signed commit; land,
      read back the accepted refs, and verify historical signed tags and release
      assets are unchanged.
