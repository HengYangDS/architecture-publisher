## 1. Registry

- [ ] 1.1 Hold every code in `src/refusal.json` and type every raise by it; done when `npm run check:types`
      passes and a raise of an unregistered code fails it.
- [ ] 1.2 Refuse an unregistered Typst refusal and a registered code nothing raises; done when
      `tests/refusal-registry.test.mjs` passes and fails for a code added to the registry alone.

## 2. Reference

- [ ] 2.1 Write the refusals reference's tables from the registry; done when the check of generated inputs
      runs `node tools/docs/references.mjs --check` and passes, and the configuration and development
      references name the writer.

## 3. Record and checks

- [ ] 3.1 Record the census on the research page and the change in the Changelog; done when every affected test
      and `npm run check:static` pass.
