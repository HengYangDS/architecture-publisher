## 1. Edition words and titles

- [x] 1.1 Write failing tests: a zh-CN edition's overview masthead sets 构建于 and no English build line, and a CJK cover title wider than its column breaks into balanced lines while an English title keeps its breaks; verify they fail on 0.10.0's class. `tests/edition-front.test.mjs` failed 2 of 4 on 0.10.0's class: the masthead printed "As built at", and no title recorded lines.
- [x] 1.2 Set the masthead's build line from the edition record and balance CJK cover titles in the house class; verify the new tests and the edition and overview suites pass. The front, overview, edition-class, locale and archive journey suites pass 32 of 32; the fixture overview of a model that pins no revision loses its bare "As built at", so its pinned image digest moves.

## 2. Release

- [x] 2.1 Record 0.10.1 in `CHANGELOG.md`, `VERSION`, `package.json` and `package-lock.json`; verify the changed files pass Prettier, ESLint, TypeScript, markdownlint, Vale and OpenSpec strict validation, and the full check runs in the proof. All pass at `35a2ae0a`; the Change and the nine specs validate strictly after a scratch archive.
- [x] 2.2 Rebuild the Chinese editions of the six published works with the lane's publisher; verify each overview's masthead reads 构建于 and no cover title leaves a lone character. All six build at `35a2ae0a` (11 plates for ETHOS, 6 for the others); every overview reads 构建于 with no English build line, and the covers read AIGW / 客户端投影 and 数据部门 / 工作指南.
