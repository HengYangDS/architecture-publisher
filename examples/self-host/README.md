# Self-hosted semantic publication

This example makes Architecture Publisher a user of its own public contract.
It selects package-owned source files, constructs a source-bound semantic
Claim Model and structural Edition, then emits a normal publication plan. The
Edition contains independent static and interactive scenes over shared semantic
identities; it does not reuse layout or artifact bytes between media.

Run it from an installed package:

```sh
node examples/self-host/build.mjs /absolute/output-directory
archpub publish semantic /absolute/output-directory/plan.json \
  --sha256 <reported-plan-sha256>
```

The example proves self-use and portability without Git or a source checkout.
It does not count as independent adopter evidence; AIGW retains that role.
