## 1. Supply

- [ ] 1.1 Move knip, lucide-static and playwright-core in `package.json` and update the npm lock with the pinned npm at a cutoff 24 hours back; verify only the measured entries move and OSV names no advisory for them.
- [ ] 1.2 Move the CI's mise to 2026.11.5 and jdx/mise-action to 5.2.7 by its release commit in the pipeline declaration, and regenerate the workflow; verify `npm run check:ci` passes and only those lines change.
- [ ] 1.3 Record the move in the changelog; verify `mise run check` passes with a freshly bootstrapped lane under the workstation's mise 2026.11.5.
