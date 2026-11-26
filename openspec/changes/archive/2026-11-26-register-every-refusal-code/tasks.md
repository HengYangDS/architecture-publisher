## 1. Registry

- [x] 1.1 Hold every code in `src/refusal.json` and type every raise by it; done when `npm run check:types`
      passes and a raise of an unregistered code fails it. `npm run check:types` passes; a raise of `supply_invalidd` failed it at its line (2026-11-26, in the copy).
- [x] 1.2 Refuse an unregistered Typst refusal and a registered code nothing raises; done when
      `tests/refusal-registry.test.mjs` passes and fails for a code added to the registry alone. The registry test passes; a code added to the registry alone failed it (2026-11-26, in the copy).

## 2. Reference

- [x] 2.1 Write the refusals reference's tables from the registry; done when the check of generated inputs
      runs `node tools/docs/references.mjs --check` and passes, and the configuration and development
      references name the writer. `npm run check:static` runs `references.mjs --check` and passes; the configuration and development references name the writer.

## 3. Record and checks

- [x] 3.1 Record the census on the research page and the change in the Changelog; done when every affected test
      and `npm run check:static` pass. The research page's section and the Changelog's entry are written; every affected test and `npm run check:static` pass.
