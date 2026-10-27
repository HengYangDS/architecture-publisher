# Architecture Publisher

`archpub` draws the architecture of any repository from an explicit
Architecture Model: a poster for each view, one interactive map of the whole
model and a manifest that binds every artifact to its inputs.

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
and up to five views. `--repo` verifies every source at that revision through
Git without changing the checkout.

Posters are SVG and PNG at 1800 and 6000 px: 1800 × at most 1350 px with no text
below 14 px. The map is a standalone document delivered by the bundled,
unmodified Archify. A view that cannot be drawn without overlaps is refused with
the relations concerned. Every command accepts `--json` and exits with 0 on
success, 1 on a refused input and 2 on a usage error.

The package needs Node.js 22.13 or later and has no runtime npm dependencies;
fonts, icons, the raster renderer, Archify and the LikeC4 parser are bundled
with their licenses and digests.
