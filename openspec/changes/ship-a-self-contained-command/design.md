## Context

See [proposal.md](proposal.md). archpub is pure JavaScript and WebAssembly with
vendored supplies. It runs Git and Typst from the path, and runs Archify and the
LikeC4 parser as child processes of `process.execPath`. The CI verifies Linux,
macOS and Windows on ARM64. `.config/mise/mise.lock` pins Node.js 26.13.0 and
Typst 0.15.1 for exactly those platforms, with each official archive's URL and
SHA-256. ETHOS already ships to these repositories as per-platform archives with
a published `ethos-<version>.mise.toml`.

## Goals / Non-Goals

**Goals:**

- One archive per verified platform that needs nothing installed but Git.
- The same bytes from the archive as from the package on the same platform, and
  the same archive from the same inputs.

**Non-Goals:**

- Publishing to the npm registry, a Node.js single executable or a container
  image.
- A Homebrew formula; it can wrap the archive later.
- Changing what a build produces.

## Decisions

- **Platforms come from the lock.** An archive is assembled only for a platform
  for which `mise.lock` pins both Node.js and Typst: today `linux-arm64`,
  `macos-arm64` and `windows-arm64`, the CI's platforms. Any other platform is
  refused, so no unverified platform can be offered.
- **Layout.** One top directory, `archpub/`:
  - `bin/archpub`, a POSIX `sh` launcher, or `bin/archpub.cmd` on Windows.
  - `libexec/node` and `libexec/typst` (`.exe` on Windows): the executables
    alone, without npm or headers.
  - `lib/architecture-publisher/`: the package as `npm pack` writes it.
  - `licenses/node/LICENSE`, `licenses/typst/LICENSE` and
    `licenses/typst/NOTICE`.
- **The launcher.**
  - It resolves its own path through symlinks, as mise's links point to it.
  - It puts `libexec` first on the path, so the overview finds the bundled Typst.
  - It runs `src/cli/main.mjs` with the bundled Node.js and passes the arguments
    and the exit status through.
  - archpub's own child processes already use `process.execPath`, which is the
    bundled Node.js.
- **Deterministic archives.** A small ustar writer in the tool writes the
  entries sorted by path:
  - directories are listed explicitly;
  - the launcher and executables get mode 0755 and everything else 0644;
  - owner 0, a modification time from `SOURCE_DATE_EPOCH` (default 0), and gzip
    at level 9 with no header time.

  A path the ustar name and prefix fields cannot hold is refused; the longest
  today is 110 bytes.

- **Two sources for the executables.**
  - On each CI platform, the tool takes the Node.js and Typst that mise installed
    from the lock, with their license files beside them.
  - For a release on macOS, it downloads each platform's official archives from
    the lock's URLs, refuses any whose SHA-256 differs, and extracts the
    executables and licenses with the system's `tar`.

  Both read the same official files, so they produce the same archive.

- **The declaration.** `architecture-publisher-<version>.mise.toml` names
  `[tools."http:archpub"]` with each platform's URL under the release, its
  SHA-256 and `bin_path = "archpub/bin"`, in the form ETHOS publishes.
- **Verification.** A conformance journey assembles the running platform's
  archive from the checkout, unpacks it, and runs `archpub --version` and a build
  of a small model with an overview, with a path that holds no Node.js or Typst.
  It then compares every delivered file with the same build from the checkout.
  The CI runs it on each platform, beside the raster journey.

- **The first release is part of this Change.** An archive no release delivers
  serves no one, and a second lane would repeat a full proof and both Forges' CI
  for a version bump. The changelog carries the tag's date, 2026-11-06, and the
  tag waits for that day.

## Risks / Trade-offs

- [A Forge's Release fails after `main` and the tag are published] → The tag is
  the release; the Release is created again from the same tag and the same
  assets, which are read back by digest.
- [Each archive is about 100 MB, mostly Node.js] → It is a third of ETHOS's, and
  the npm tarball stays for anyone who has Node.js.
- [macOS marks a browser-downloaded binary as quarantined] → mise and curl
  downloads are not quarantined. The official Node.js and Typst binaries keep
  their own signatures, which the archive does not alter.
