## 1. OpenSpec

- [ ] 1.1 Move `@fission-ai/openspec` in `package.json` to 2.0.0 and update the npm lock with the pinned npm; verify only it and the transitive entries it needs move, OSV names no advisory for them, and `openspec update --dry-run` would change nothing.
- [ ] 1.2 Record the move in the changelog; verify `mise run check` passes, `npm run check:spec` with OpenSpec 2.0.0 included.
