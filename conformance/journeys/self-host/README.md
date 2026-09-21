# Structural self-use

This bounded example makes Architecture Publisher consume its own public
contracts. It selects package-owned source files, builds a source-bound Claim
Model and structural Edition, and writes an exact Edition build request.

```sh
node conformance/journeys/self-host/build.mjs /absolute/input-directory
archpub edition build /absolute/input-directory/plan.json \
  --sha256 <reported-plan-digest>
```

The output is an `Edition Candidate`, not a publication. It proves generic
self-use and installed portability without Git or a source checkout. It is not
the final first-party flagship self-Edition and not independent adopter evidence;
AIGW retains that separate role.
