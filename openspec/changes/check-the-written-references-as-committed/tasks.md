## 1. Generation

- [ ] 1.1 Give the LikeC4 supply's generator a mode that writes only the parser, and have `npm run generate` run it
      alone; done when, on a copy, a table of a reference and the supply's manifest each changed by hand are refused
      by `npm run generate` followed by `npm run check:generated`, naming the file.
- [ ] 1.2 Say what generation does in the development reference and give the written tables one section in the
      configuration reference; done when `npm run check:docs` passes.

## 2. Checks

- [ ] 2.1 Run the checks; done when every affected test and `npm run check:static` pass.
