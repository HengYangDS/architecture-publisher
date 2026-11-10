## 1. Standfirst

- [x] 1.1 Write failing tests: a view with a summary whose figure wires worse at 80 percent but no worse at the height a 32 em standfirst leaves is set with `reading: "above"`, the full width and that height; one that wires worse there leaves its reading out; a plate that narrows today is set as in 0.10.2; verify they fail on 0.10.2.
- [x] 1.2 Measure and break the summary in Source Serif 4 at 17 points within 32 em in the engine, with Typst's spacing between Han and Latin text, and choose the standfirst in the width rule; verify the tests pass and the engine breaks the summaries of the published works into no fewer lines than Typst sets them flush left and no line Typst sets wider, naming each summary it breaks into more lines (3 of 82, for want of the faces' kerning).
- [x] 1.3 Record the standfirst's lines and the figure's height, set them in the house class at the claim column, and report the reading in `archpub check`; verify the edition, front, overview and CLI suites pass and the standfirst's text can be extracted from its plate.

## 2. Release

- [x] 2.1 Describe the standfirst in `docs/reference/operations.md` and record 0.11.0 in `CHANGELOG.md`, `VERSION`, `package.json` and `package-lock.json`; verify `mise run check` passes and Vale reports nothing in the changed Markdown.
- [x] 2.2 Build the twelve editions of the six works at publications' current `dev` with the lane's publisher and with 0.10.2; verify every plate set beside its figure and every overview is the same image in both, report how many plates set their summary, measured at 78 of 82, naming any plate that differs from the measurement and why, and read the standfirst plates in both languages.
