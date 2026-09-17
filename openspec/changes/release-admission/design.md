## Context

`package.json` owns version `0.1.0-alpha.0`. `.ethos/workspace.toml` declares
`release_mirror = "independent"`; `.ethos/release.toml` currently declares no tags.
The owner has requested a signed `v0.1.0-alpha.0` release with the selected reader
assets. This Change admits that exact tag without expanding future permissions.

## Decisions

- Set `protected_refs.tags` to `["v0.1.0-alpha.0"]`; do not use wildcard patterns.
- Preserve branch protection, peer configuration and independent release policy.
- Use the native role classifier to check that this tag is eligible and adjacent
  or unrelated tags remain ineligible. Policy eligibility alone is not publication.
- Keep version interpretation in ETHOS and `package.json`; no parallel `VERSION`
  file, handwritten signed-object receipt or release command is introduced here.
- Keep the selected artwork and qualification inputs unchanged. A new policy
  commit requires its own repository proof; it does not replace artwork evidence.

## Validation

Compare the parsed policy before and after: the exact tag list is the only
change. Validate official OpenSpec artifacts, package-version equality, native
tag-role admission and repository gates with the already selected qualification
inputs. Archive through the native lifecycle, prove the final commit, and then
integrate and publish the accepted policy. Release effects consume that accepted
policy later; completing this Change does not claim main or Release convergence.
