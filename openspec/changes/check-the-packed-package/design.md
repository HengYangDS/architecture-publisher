## Context

The quality entry already requires packed-package validation. Directory mode walks files outside the published package and follows directory symlinks; native npm packing uses the manifest's existing `files` selection.

## Goals / Non-Goals

- Make the package check validate what npm publishes and finish with retained runtime directories present.
- Preserve every other quality gate, the selected package file set, runtime payload and runtime binding. The published `package.json` changes only its check metadata.

## Decisions

Use `publint --pack npm` in the existing npm script. Publint owns packing and validation; npm owns package selection, and Mise supplies the locked Node/npm pair. No traversal wrapper, vendored patch, new dependency or cache deletion is needed.

Verification runs the original native package command with an excluded runtime directory containing a directory symlink back to the checkout, then compares its package selection with native npm packing. The earlier accepted-root traversal failure remains bound to its original runtime tree; a smaller linked-worktree fixture need not reproduce that full traversal. Existing archive tests retain package-content coverage.

## Risks / Trade-offs

Packing costs one temporary archive and can invoke package lifecycle scripts. This manifest declares no pack lifecycle scripts. The native locked npm must remain on child-process PATH; invoking Node alone can select Node's bundled npm and fail `devEngines` admission.
