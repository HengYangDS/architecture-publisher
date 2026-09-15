## Why

The successor can verify portable files but cannot yet consume the exact ETHOS
input behind the accepted poster and atlas without using old build machinery.
Separate explicit source-code replay from ordinary read-only consumption so
renderers can migrate without inheriting Git/Python or developer paths.

## What Changes

- Add an ETHOS-specific import operation that requires an exact source commit,
  expected exporter and policy-owner digests, expected projection digest, and
  explicit Git/Python executables. It replays only the selected, verified code.
- Package original projection, declaration, source documents and replay source
  bytes into the existing closed source-bundle envelope, without rewriting
  domain meaning or changing the accepted artwork.
- Add an offline ETHOS source reader that validates all byte bindings and
  returns the entire projection unchanged. It never invokes a process.
- Keep default source verification independent of the ETHOS integration by
  loading the integration only for explicit ETHOS commands.

## Capabilities

### New Capabilities

- `ethos-input`: explicit source replay and independently consumable, byte-bound ETHOS input.

### Modified Capabilities

None; the generic `source-intake` envelope and existing command retain their behavior.

## Impact

New integration modules, one source-bundle writer, CLI dispatch and bounded
integration tests. The accepted source is revision 8f2e829fed3877c5375cd8636bea45bee583f6c4,
not the old default authoring selection or current product HEAD. No ETHOS product
code, old renderer, original artifact, source specification or old evidence is edited.
