/** What a check finds in a model that needs attention everywhere a check can ask for it. */
export const ATTENDED = {
  model: { id: "shop", sha256: "0" },
  sources: { state: "verified", count: 6 },
  views: [{ id: "index" }, { id: "internals" }],
  plates: [
    { page: 1, views: ["index"], share: 1, reading: "above", misses: [] },
    {
      page: 2,
      views: ["internals", "more"],
      share: 0.8,
      reading: "set",
      misses: [
        { measure: "emptyShare", value: 0.19, limit: 0.12 },
        { measure: "blankBand", value: 112, limit: 96 },
      ],
    },
    { page: 3, views: ["last"], share: 0.65, reading: "omitted" },
    { page: 4, views: ["bare"], share: 0.5, reading: "none" },
  ],
  statements: {
    undrawn: { components: ["x"], relations: [] },
    uncited: { components: [], relations: [] },
  },
  data: {
    statements: { components: 6, relations: 5, groups: 1, cited: 9, unchecked: 0, uncited: 2 },
    facts: 31,
    evidence: { paths: 7, ranges: 1 },
    faces: [
      { plate: 1, components: 3, groups: 1, relations: 4 },
      { plate: 2, components: 4, groups: 0, relations: 5 },
      { plate: 3, components: 2, groups: 0, relations: 1 },
      { plate: 4, components: 1, groups: 0, relations: 0 },
    ],
    figures: {
      state: "verified",
      matched: { nodes: 2, connections: 1 },
      unmatched: {
        nodes: [{ file: "parts.architecture.json", id: "parts-readme" }],
        connections: [],
      },
    },
  },
  coverage: {
    revision: "1234567890abcdef",
    files: { scope: 6, owned: 3, uncovered: 3, excluded: 1 },
    largestUncovered: [
      { path: "src/tools/", files: 2 },
      { path: "docs/", files: 1 },
    ],
    unmatched: ["src/generated/"],
    citedOutsideScope: ["a.md"],
    currency: {
      against: { revision: "main", commit: "abcdef1234567890" },
      commits: 2,
      ancestor: false,
      files: [
        { state: "unchanged" },
        { state: "modified" },
        { state: "moved" },
        { state: "deleted" },
      ],
      worklist: {
        components: [
          {
            id: "a",
            label: "Alpha",
            modified: ["src/a.mjs"],
            moved: [
              { path: "src/b.mjs", to: "src/lib/b.mjs", owner: null },
              { path: "src/c.mjs", to: "src/d.mjs", owner: "b" },
            ],
            deleted: ["src/e.mjs"],
            taken: ["src/f.mjs"],
          },
          { id: "b", label: "Beta", modified: [], moved: [], deleted: ["src/g.mjs"], taken: [] },
        ],
        relations: [{ id: "a-b", files: ["x"] }],
        refused: [
          { code: "claim_unmatched", claim: "src/old/", component: "old" },
          {
            code: "citation_gone",
            file: "src/rel/gone.go",
            relation: "b-old",
            to: "src/rel/new.go",
          },
          { code: "citation_gone", file: "src/rel/lost.go", relation: "b-old" },
        ],
        uncovered: ["tools/new.go"],
        citations: [
          { fate: "same", where: "@source keep", path: "docs/keep.md", lines: [1, 2] },
          {
            fate: "shifted",
            where: "@source cite",
            path: "docs/cite.md",
            lines: [10, 12],
            at: [12, 14],
          },
          {
            fate: "moved",
            where: "@source move",
            path: "docs/move.md",
            lines: null,
            to: "docs/moved.md",
          },
          { fate: "gone", where: "@source gone", path: "docs/gone.md", lines: [3, 4] },
        ],
      },
    },
  },
  warnings: [
    { code: "marks_fallback", message: "The edition draws its parts as cards." },
    { code: "likec4_skipped", path: "model.c4:24", message: "Skipped." },
  ],
};

/** What a check finds in a model whose every fact passes. */
export const TIDY = {
  model: { id: "tidy", sha256: "0" },
  sources: { state: "none", count: 0 },
  views: [{ id: "only" }],
  plates: [],
  statements: {
    undrawn: { components: [], relations: [] },
    uncited: { components: [], relations: [] },
  },
  data: {
    statements: { components: 2, relations: 1, groups: 0, cited: 0, unchecked: 0, uncited: 3 },
    facts: 1,
    evidence: { paths: 0, ranges: 0 },
    faces: [],
  },
  coverage: {
    revision: "1234567890abcdef",
    files: { scope: 2, owned: 2, uncovered: 0, excluded: 0 },
    largestUncovered: [],
    unmatched: [],
    citedOutsideScope: [],
    currency: {
      against: { revision: "main", commit: "abcdef1234567890" },
      commits: 0,
      ancestor: true,
      files: [{ state: "unchanged" }],
      worklist: { components: [], relations: [], refused: [], uncovered: [], citations: [] },
    },
  },
  warnings: [],
};

/**
 * A stream that answers as a terminal of the given width.
 * @param {number} columns
 */
export const terminal = (columns) => ({ isTTY: true, columns });
