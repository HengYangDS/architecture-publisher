## 1. One source for each set

- [ ] 1.1 Read the archive's members from `tools/release/archive/members.json` in the assembly and the declaration,
      and a child's variables from `src/environment.json`; done when tests build an archive and a child's
      environment from changed tables and find them followed.
- [ ] 1.2 Write the platforms, members, dependencies and variables into the operations reference, and the platforms
      into the README and the how-to, from their sources; done when `npm run check:generated` passes and a test
      finds every block rewritten when its source changes.
- [ ] 1.3 Keep every output; done when 16 command lines and a child's environment under 12 caller variables are byte
      for byte as on dev, and the archive assembled for each locked platform holds every path, mode and byte it
      held, with `src/environment.json` beside them.

## 2. Record and checks

- [ ] 2.1 Record the change in the Changelog; done when its entry stands under the unreleased version.
- [ ] 2.2 Run the checks; done when every affected test and `npm run check:static` pass.
