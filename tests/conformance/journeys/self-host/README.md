# Structural self-use

This bounded example makes Architecture Publisher consume its own public
contracts. It selects installed package-owned source files, builds a source-bound
Claim Model and structural Edition, emits a closed declarative Provider manifest,
and writes the provider form of the ordinary Edition build request.

```sh
node tests/conformance/journeys/self-host/build.mjs /absolute/input-directory
archpub edition build /absolute/input-directory/plan.json \
  --sha256 <reported-plan-digest>
```

The generated `provider.json` selects only the portable Source Bundle and Edition
values. Provider materialization adds provenance to the outer bundle but does not
change the Claim Model, Edition, scene, or Candidate identities. The output is an
`Edition Candidate`, not source-product acceptance or publication authority.

The conformance journey packs and relocates the generic core and self Edition,
runs with empty user configuration and no Git executable, and checks build,
qualification, recoverable publication, replacement, and recovery. It is not
independent adopter evidence; AIGW retains that separate role.
