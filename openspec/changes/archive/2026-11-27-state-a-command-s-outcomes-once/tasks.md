## 1. One table of outcomes

- [x] 1.1 State each outcome of a command once in `src/cli/outcomes.json` and read its exit status, help line, closing
      lines and JSON keys from there; done when a test moves the failure statuses in a copy and finds the exit
      statuses, the help line and the reports' closings moved with them, and no exit status is written as a number
      in `src/cli/`. Each outcome of a command stands once in `src/cli/outcomes.json`, which the program reads for its exit statuses, its help line, its reports' closings and its JSON keys; a test moves the failure statuses in a copy and finds them all moved, and no exit status is written as a number in `src/cli/`.
- [x] 1.2 Write the command line and refusals references' outcomes from the table; done when `npm run check:generated`
      passes and a test finds the blocks rewritten when the table changes. The command line and refusals references' outcomes are written from the table; `npm run check:generated` passes and a test finds the blocks rewritten when the table changes.
- [x] 1.3 Keep every command's output; done when 36 command lines covering the four outcomes print the same exit
      status, standard output and standard error as on dev. 36 command lines covering the four outcomes print the same exit status, standard output and standard error as on dev (2026-11-28, compared byte for byte).

## 2. Record and checks

- [x] 2.1 Record the change in the Changelog; done when its entry stands under the unreleased version. The Changelog's entry stands under the unreleased version.
- [x] 2.2 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
