## 1. One table of outcomes

- [ ] 1.1 State each outcome of a command once in `src/cli/outcomes.json` and read its exit status, help line, closing
      lines and JSON keys from there; done when a test moves the failure statuses in a copy and finds the exit
      statuses, the help line and the reports' closings moved with them, and no exit status is written as a number
      in `src/cli/`.
- [ ] 1.2 Write the command line and refusals references' outcomes from the table; done when `npm run check:generated`
      passes and a test finds the blocks rewritten when the table changes.
- [ ] 1.3 Keep every command's output; done when 36 command lines covering the four outcomes print the same exit
      status, standard output and standard error as on dev.

## 2. Record and checks

- [ ] 2.1 Record the change in the Changelog; done when its entry stands under the unreleased version.
- [ ] 2.2 Run the checks; done when every affected test and `npm run check:static` pass.
