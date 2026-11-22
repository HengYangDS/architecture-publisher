## Context

See [proposal.md](proposal.md) and the research page `docs/research/one-source.md`, "A model's repository, in the
published works": in all twelve models of the six works, `repository.browse` is `repository.url` without `.git`
followed by `/blob/{revision}/{path}`. This is the fifth Change of the item `one-source`, and the first that changes
what a model may leave out; it adds its search to `tests/one-source.test.mjs`, which the first Change wrote. It
depends on none of the second to fourth.

The template is read in one place: `src/model/normalize.mjs` gives every later stage `repository.browse`, declared or
null, and `src/edition/record.mjs` fills it for each card's first file. The manifest (`src/manifest.mjs`) and the
data (`src/pinned/data.mjs`) record the normalized repository, template included.

## Goals / Non-Goals

**Goals:**

- A model on GitHub or GitLab states its repository's address once; the template its cards link by follows from it.
- Every model valid before builds as it did when it declares the template or states no GitHub or GitLab address.
- A test refuses a bundled example, fixture or test that declares the template its address implies.

**Non-Goals:**

- Dropping the template from the published works: the publications do it once they pin a release that holds this
  Change (the item's sixth Change), and their pages, images and figures should then keep their bytes, since the
  manifest and the data record the template the address implies, the one they declared.
- Refusing a declared template the address implies: that would refuse a model another release accepted, a breaking
  change the holder decides after the publications have dropped theirs (the item's seventh Change).
- An address of another host, an SSH address or a self-hosted GitLab: their file addresses do not follow from the
  repository's address alone, so such a model keeps declaring its template.

## Decisions

- **Derived in the normalized model, not where a link is made.** `browseOf(url)` in `src/model/normalize.mjs` fills
  `repository.browse` when the model declares none, so the cards, the manifest and the data read one template.
  Deriving it in `src/edition/record.mjs` alone would leave the manifest and the data without the template the
  edition links by, and the publications' sixth Change would then change both files of every work.
- **Only an address that names a repository and nothing more.** The address must be `https`, on `github.com` or
  `gitlab.com`, with no user, password, port, query or fragment; on GitHub it has exactly an owner and a name, on
  GitLab a group's path of any depth and a name. One trailing slash and one trailing `.git` are dropped. Anything
  else implies no template, so no model gains a link that leads elsewhere than its repository.
- **The host as the URL parser writes it.** `new URL` writes the host in lower case, and so does the template;
  GitHub and GitLab read hosts without regard to case.
- **The search reads every object of the bundled files.** The test reads the JSON and JavaScript under `examples/`
  and `tests/`, itself aside, finds each innermost object with a quoted `url` and `browse` (a template's
  placeholders set aside, since they are braces too), and refuses one whose `browse` is what `browseOf(url)` gives.
  `tests/edition-class.test.mjs` declared one and drops it; its model now links by the template it implies.

## Risks / Trade-offs

- A model with a GitHub or GitLab address and no template, which built an edition without links, now builds one with
  links, a reading note that says so, and a manifest and data that name the template. That is the requirement this
  Change adds; the changelog lists it under Added. The bundled fixtures with such an address (`aigw.json`,
  `architecture-publisher.json`, `browser-use.json`, `context-mode.json`) gain links in the builds the heavy tests
  make; the lane runs those tests.
- A repository renamed on its Forge keeps its old address in a model, and the Forge redirects both the repository
  and its files; nothing here reads the network.
- No bundled example or published work changes: the lane builds `examples/big-bank` and the publications'
  `architecture-publisher` work in both languages at its base and its head, and `archpub compare` reports each pair
  identical.
