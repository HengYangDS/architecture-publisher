## 1. One source for each set

- [x] 1.1 Read the archive's members from `tools/release/archive/members.json` in the assembly and the declaration,
      and a child's variables from `src/environment.json`; done when tests build an archive and a child's
      environment from changed tables and find them followed. The assembly and the declaration read the archive's members from `tools/release/archive/members.json`, and `src/environment.mjs` a child's variables from `src/environment.json`; tests build an archive and a child's environment from changed tables and find them followed.
- [x] 1.2 Write the platforms, members, dependencies and variables into the operations reference, and the platforms
      into the README and the how-to, from their sources; done when `npm run check:generated` passes and a test
      finds every block rewritten when its source changes. The operations reference's platforms, members, dependencies and variables and the README's and the how-to's platforms are written from their sources; `npm run check:generated` passes and a test finds every block rewritten when its source changes.
- [x] 1.3 Keep every output; done when 16 command lines and a child's environment under 12 caller variables are byte
      for byte as on dev, and the archive assembled for each locked platform holds every path, mode and byte it
      held, with `src/environment.json` beside them. 16 command lines and a child's environment under 12 caller variables are byte for byte as on dev, and the archive assembled for each of the three locked platforms holds every path, mode and byte it held, with `src/environment.json` beside them (2026-11-28).

## 2. Record and checks

- [x] 2.1 Record the change in the Changelog; done when its entry stands under the unreleased version. The Changelog's entry stands under the unreleased version.
- [x] 2.2 Run the checks; done when every affected test and `npm run check:static` pass. Every affected test and `npm run check:static` pass.
