## 1. Edition words and titles

- [ ] 1.1 Write failing tests: a zh-CN edition's overview masthead sets 构建于 and no English build line, and a CJK cover title wider than its column breaks into balanced lines while an English title keeps its breaks; verify they fail on 0.10.0's class.
- [ ] 1.2 Set the masthead's build line from the edition record and balance CJK cover titles in the house class; verify the new tests and the edition and overview suites pass.

## 2. Release

- [ ] 2.1 Record 0.10.1 in `CHANGELOG.md`, `VERSION` and `package.json`; verify `mise run check` passes.
- [ ] 2.2 Rebuild the Chinese editions of the six published works with the lane's publisher; verify each overview's masthead reads 构建于 and no cover title leaves a lone character.
