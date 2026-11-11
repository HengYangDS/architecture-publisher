# Design

## Context

See [the proposal](proposal.md) for the failure and scope. npm exposes its
selected CLI through `npm_execpath`; publint accepts an existing tarball.
Its package-manager subprocess currently resolves npm from a PATH that prefers
the Node runtime's directory.

## Goals / Non-Goals

The existing `npm run check:package` entry will check the actual npm archive
without selecting another npm. The adapter owns only invocation, the temporary
archive and the result's exit status. npm owns packing; publint owns validation.
Product code and supply policy are unchanged.

## Decisions

Run the absolute `npm_execpath` through the current Node executable, with
installation scripts disabled and an owned temporary pack destination. Read
the one archive from that destination and pass its bytes to publint's public
tarball API. Report its messages and fail on errors, preserving the CLI's
default warning policy. Remove the destination in `finally`; cleanup failure
also fails the command.

Require execution through npm rather than adding another npm resolver. This
keeps the existing check entry authoritative on every platform. A PATH override
would depend on subprocess precedence; disabling developer admission would
hide the mismatch; modifying publint would introduce an unnecessary vendor
patch. None is needed.

## Risks / Trade-offs

- A direct Node invocation has no selected npm entrypoint: reject it clearly
  before creating temporary files.
- Packing or validation can fail: retain diagnostics and remove only the
  command's temporary destination.
- Archive validation reads packed bytes: exercise a package whose missing
  exported file must be rejected, alongside a valid package.

## Migration Plan

Replace the package-check command after its regression fails on the base and
passes with the adapter. Run the native quality graph and exact-source proof
before integration. Verify the published commit on both configured forges and
their hosted checks. Reverting this commit restores the previous command;
dependency and toolchain locks stay byte-identical.
