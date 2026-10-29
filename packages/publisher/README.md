# Architecture Publisher

`archpub` draws the architecture of any repository from an explicit
Architecture Model: posters of its views, one interactive page that answers
the model's question view by view, and a manifest that binds every artifact to
its inputs.

```sh
archpub check model.json [--repo <checkout>]
archpub build model.json --out <new-directory> [--repo <checkout>]
archpub import likec4 <workspace> --out model.json --id <id>
archpub accept <delivery> --reviewer <name>
archpub publish <delivery> --to <root>
```

A model is one JSON file with `format: "architecture-publisher.model"`,
`version: 1`, an `id`, a `title`, a `question`, `components` and `relations`,
and optionally kinds, details, sources pinned to a repository revision, groups
and up to four views. `--repo` verifies every source at that revision through
Git without changing the checkout.

Posters are 2400 × 1350 px pages of one to three views, as SVG and as PNG at
2400 and 6000 px, with no text below 14 px. The page is a standalone Archify
explainer delivered by the bundled, unmodified Archify, with one native diagram
per view. A layout with an overlap is never drawn, and a view that no layout
draws or no balanced page holds is refused. Every command accepts `--json` and
exits with 0 on success, 1 on a refused input, 2 on a usage error and 3 on any
other failure.

The package needs Node.js 22.13 or later and has no runtime npm dependencies;
fonts, icons, the raster renderer, Archify and the LikeC4 parser are bundled
with their licenses and digests.
