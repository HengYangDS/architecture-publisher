## Why

On 2026-11-20 the owner made one source for each fact a hard requirement of everything built here. The census of
that day (`docs/research/one-source.md`, "A model's repository, in the published works") found that every published
work states its repository's address twice: `repository.url`, and `repository.browse`, which is the same address
without `.git` followed by `/blob/{revision}/{path}`, in all twelve models of the six works. The template says
nothing the address does not, on the two Forges whose file addresses follow from a repository's address; a model
that changed one and not the other would link its cards to another repository than the one it names.

## What Changes

- When a model's repository declares no `browse` and its `url` is an `https` address on GitHub (an owner and a name)
  or GitLab (a group's path and a name), with no user, port, query or fragment, the publisher derives the template:
  the address without a trailing `.git`, followed by `/blob/{revision}/{path}` on GitHub or
  `/-/blob/{revision}/{path}` on GitLab. The normalized model carries it, so the cards' links, the manifest and the
  data read it as they read a declared one.
- A declared template stands as it is, and any other address implies none: a model that states `browse` builds as it
  did, and a model on another host still needs it for links.
- `tests/one-source.test.mjs` refuses a bundled example, fixture or test that declares the template its address
  implies; one test model drops it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `architecture-model`: a repository's address on GitHub or GitLab implies its browse template.
- `edition-delivery`: cards link to their files when the template is declared or implied.

## Impact

Changed: `src/model/normalize.mjs`, `src/model/schema.json` (the template's description);
`tests/model-input.test.mjs`, `tests/edition-class.test.mjs`, `tests/one-source.test.mjs`;
`docs/reference/model.md` and `CHANGELOG.md`. Not breaking: every model valid
before is valid and builds as it did when it declares `browse` or states no GitHub or GitLab address. A model with
such an address and no template, which had no links, gains them, and its manifest and data name the template. No
bundled example or published work changes: the six works declare the template their address implies, and the
bundled examples state no repository. The publications may then drop the template from their twelve models.

It also records release 0.17.0: `VERSION`, its projections and the changelog's dated section. It is the last of
five lanes that land in a train and publish `dev` once, and the release follows that `dev`.

Queue: `one-source`.
