## Context

See proposal.md for why. The overview is a composition its author writes
beside the model and the publisher typesets and checks. The page has no such
composition: `src/map/explainer.mjs` writes an Archify explainer draft from the
model and delivers it with `archify finalize explainer`. An explainer draft is
already a composition format, with its own validation, writing checks and
repository verification.

## Goals / Non-Goals

**Goals:**

- A work publishes a guide its author writes as its page, checked by the
  publisher's Archify as strictly as the overview is checked by Typst.

**Non-Goals:**

- Browser evidence. It depends on the host's Chrome and would make the manifest
  differ by host; it belongs to acceptance, a later Change.
- Changing the page of a model without a guide.

## Decisions

- **Name the guide as the overview is named.** `guide` is a relative path to a
  `.archify.md` draft within the model's directory.
- **The guide is the page.** It replaces the generated page under the same
  `page` medium and `index.html`, so media, publication and acceptance stay as
  they are.
- **Stage only what the draft references.** The draft and the files its
  `@diagram source=`, `@chart data=` and `@image path=` arguments name, each a
  regular file in the draft's own directory. A link, another path or a missing
  file is refused, so nothing unreferenced or outside the guide enters a build.
- **Verify sources through a temporary shared clone.** Archify verifies a
  repository source against `origin` and the commit, and the described
  repository's own checkout often names its remotes otherwise. The clone shares
  the checkout's objects, points `origin` at the model's repository URL and
  `HEAD` at the model's revision, and is removed once the page is written; the
  checkout is only read.
- **One repository per work.** A draft's `@meta repo_url` and `repo_revision`,
  when present, must equal the model's repository URL and revision.
- **Writing checks follow the quality.** Strict at showcase, warnings at
  standard. The generated page keeps them off, because its prose is the
  model's.
- **The scaffold is today's page.** `scaffold guide` writes the draft and
  diagrams the publisher generates, for the author to edit; no second
  generator.

## Risks / Trade-offs

- [A guide's sources are verified only with a checkout] → Without `--repo` the
  manifest records them as declared, as it records the model's sources.
- [Archify 3.2.0 cuts an explainer check receipt at 64 KiB on macOS] → A guide
  keeps within Archify's four-diagram scale; the fix is on Archify's `dev`
  branch and arrives with its next release.
- [A guide goes stale as the code moves] → Archify verifies every cited file and
  line range at the model's revision, so a re-pin that moves cited lines is
  refused until the guide follows it.
