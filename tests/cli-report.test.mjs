import assert from "node:assert/strict";
import test from "node:test";
import { reportFailure, reportRefusal, reportResult } from "../src/cli/report.mjs";
import { Refusal } from "../src/refusal.mjs";
import { ATTENDED, TIDY, terminal } from "./fixtures/check-results.mjs";
import { reportLines } from "./fixtures/report-lines.mjs";

/** The data of the tidy check, as its report states it: no plate was drawn and the model names no guide. */
const TIDY_DATA = [
  ["heading", "Data"],
  [
    "noted",
    "Statements",
    "2 components, 1 relation and 0 groups: 0 cited, 0 unchecked and 3 uncited",
  ],
  ["noted", "Facts", "1 fact"],
  ["noted", "Evidence", "0 paths with 0 cited ranges"],
];

test("a check's report marks what passed, what needs attention and what a build would refuse", () => {
  assert.deepEqual(reportLines(reportResult("check", ATTENDED, "model.json")), [
    ["title", "archpub check · shop"],
    ["heading", "Model"],
    ["passed", "Views", "2 views admitted"],
    ["passed", "Files", "6 files verified"],
    ["attention", "Undrawn", "1 component (x)"],
    ["heading", "Plates"],
    ["passed", "01", "index · figure 100% of the body, its reading above the figure"],
    [
      "attention",
      "02",
      "internals, more · figure 80% of the body, beside its reading · misses emptyShare 0.19 (limit 0.12) and blankBand 112 (limit 96)",
    ],
    ["passed", "03", "last · figure 65% of the body, its reading in its head"],
    ["passed", "04", "bare · figure 50% of the body"],
    ["heading", "Data"],
    [
      "noted",
      "Statements",
      "6 components, 5 relations and 1 group: 9 cited, 0 unchecked and 2 uncited",
    ],
    ["noted", "Facts", "31 facts"],
    ["noted", "Evidence", "7 paths with 1 cited range"],
    ["passed", "Faces", "4 plates, each its view's statements"],
    ["noted", "Guide figures", "2 of 3 nodes and 1 of 1 connection matched to the model"],
    ["heading", "Coverage at 1234567"],
    ["attention", "Files", "3 of 6 owned, 3 uncovered, 1 excluded"],
    ["attention", "Largest uncovered", "src/tools/ (2 files), docs/ (1 file)"],
    ["attention", "Matching no file", "src/generated/"],
    ["attention", "Cited outside the scope", "1 file"],
    ["heading", "Currency against main at abcdef1"],
    ["attention", "Commits", "2 commits since the pin, which is not its ancestor"],
    ["attention", "Files", "1 file unchanged, 1 modified, 1 moved and 1 deleted"],
    ["heading", "Re-pin worklist"],
    [
      "attention",
      "Alpha (a)",
      "1 file modified; src/b.mjs moved to src/lib/b.mjs, under no claim; src/c.mjs moved to src/d.mjs, owned by b; src/e.mjs deleted; now owns src/f.mjs",
    ],
    ["attention", "Beta (b)", "src/g.mjs deleted"],
    ["attention", "Relations", "files changed in a-b (1 file)"],
    [
      "refused",
      "Refused at abcdef1",
      "src/old/ of old owns no file; src/rel/gone.go of b-old is gone, moved to src/rel/new.go; src/rel/lost.go of b-old is gone",
    ],
    ["attention", "Newly uncovered", "tools/new.go"],
    ["heading", "Citations"],
    ["attention", "Guide", "4 citations: 1 same, 1 shifted, 1 moved and 1 gone"],
    ["attention", "shifted", "@source cite docs/cite.md 10:12 to 12:14"],
    ["attention", "moved", "@source move docs/move.md to docs/moved.md"],
    ["attention", "gone", "@source gone docs/gone.md 3:4"],
    ["heading", "Warnings"],
    [
      "attention",
      "line_row_untested",
      "Plates 01 draw the pattern of a planned relation, which no work has tested.",
    ],
    ["attention", "model.c4:24", "Skipped."],
    ["closing", "Next: archpub build model.json --out <directory>"],
  ]);
  // A check that read a checkout names it in the command to run next, as it was typed.
  const next = (repo) =>
    reportLines(reportResult("check", ATTENDED, "model.json", terminal(80), { repo })).at(-1)[1];
  assert.equal(next("../shop"), "Next: archpub build model.json --repo ../shop --out <directory>");
  assert.equal(
    next("../my shop"),
    'Next: archpub build model.json --repo "../my shop" --out <directory>',
  );
  // Several files of one component are counted as files.
  const several = structuredClone(ATTENDED);
  several.coverage.currency.worklist.components[0].modified.push(
    "src/h.mjs",
    "src/i.mjs",
    "src/j.mjs",
  );
  assert.match(
    reportLines(reportResult("check", several, "model.json")).find(
      ([, label]) => label === "Alpha (a)",
    )[2],
    /^4 files modified; /u,
  );
});

test("a check with nothing to attend to marks every fact as passed", () => {
  assert.deepEqual(reportLines(reportResult("check", TIDY, "tidy.json")), [
    ["title", "archpub check · tidy"],
    ["heading", "Model"],
    ["passed", "Views", "1 view admitted"],
    ["noted", "Files", "none claimed or cited"],
    ...TIDY_DATA,
    ["heading", "Coverage at 1234567"],
    ["passed", "Files", "2 of 2 owned, 0 uncovered, 0 excluded"],
    ["heading", "Currency against main at abcdef1"],
    ["passed", "Commits", "0 commits since the pin"],
    ["passed", "Files", "1 file unchanged, 0 modified, 0 moved and 0 deleted"],
    ["heading", "Re-pin worklist"],
    ["passed", "Model", "nothing changes"],
    ["closing", "Next: archpub build tidy.json --out <directory>"],
  ]);
  // Without a checkout the files are named as unverified and no coverage is reported; citations that all stand
  // where they stood pass.
  const unverified = {
    ...TIDY,
    sources: { state: "unverified", count: 1 },
    statements: { ...TIDY.statements, uncited: { components: ["a"], relations: ["a-b", "b-a"] } },
    coverage: null,
  };
  assert.deepEqual(reportLines(reportResult("check", unverified, "tidy.json")).slice(1, -1), [
    ["heading", "Model"],
    ["passed", "Views", "1 view admitted"],
    ["attention", "Files", "1 file unverified without --repo"],
    ["attention", "Uncited", "1 component (a) and 2 relations (a-b, b-a)"],
    ...TIDY_DATA,
  ]);
  const cited = structuredClone(TIDY);
  cited.coverage.currency.worklist.citations.push({
    fate: "same",
    where: "@source keep",
    path: "a.md",
  });
  assert.deepEqual(reportLines(reportResult("check", cited, "tidy.json")).slice(-5, -1), [
    ["heading", "Re-pin worklist"],
    ["passed", "Model", "nothing changes"],
    ["heading", "Citations"],
    ["passed", "Guide", "1 citation: 1 same"],
  ]);
  // A miss that stands at its limit says so; the command line knows no measure by name.
  const reached = structuredClone(ATTENDED);
  reached.plates[1].misses = [
    { measure: "blankBand", value: 96, limit: 96 },
    { measure: "anyMeasure", value: 0.5, limit: 0.4 },
  ];
  assert.match(
    reportLines(reportResult("check", reached, "model.json")).find(
      ([, label]) => label === "02",
    )[2],
    / · misses blankBand 96 \(limit 96, reached\) and anyMeasure 0\.5 \(limit 0\.4\)$/u,
  );
  // A checkout without a revision to compare with reports coverage alone.
  const pinned = { ...TIDY, coverage: { ...TIDY.coverage, currency: null } };
  assert.deepEqual(reportLines(reportResult("check", pinned, "tidy.json")).at(-2), [
    "passed",
    "Files",
    "2 of 2 owned, 0 uncovered, 0 excluded",
  ]);
});

test("a refusal names itself and lists each problem on a line with its path", () => {
  const refusal = new Refusal("model_invalid", "The model has 2 problems.", [
    {
      code: "model_relation_self",
      path: "/relations/0",
      message: "A relation joins a part to itself.",
    },
    { code: "model_view_empty", message: "A view draws nothing." },
  ]);
  assert.deepEqual(reportLines(reportRefusal("check", refusal)), [
    ["title", "archpub check"],
    ["heading", "Refused"],
    ["refused", "model_invalid", "The model has 2 problems."],
    ["heading", "Problems"],
    ["refused", "/relations/0", "A relation joins a part to itself."],
    ["refused", "model_view_empty", "A view draws nothing."],
    ["closing", "Exit status 1: refused"],
  ]);
  assert.deepEqual(
    reportLines(reportRefusal("build", new Refusal("delivery_exists", "The output exists."))),
    [
      ["title", "archpub build"],
      ["heading", "Refused"],
      ["refused", "delivery_exists", "The output exists."],
      ["closing", "Exit status 1: refused"],
    ],
  );
  assert.deepEqual(reportLines(reportFailure("accept", "EISDIR: illegal operation")), [
    ["title", "archpub accept"],
    ["heading", "Internal error"],
    ["refused", "Error", "EISDIR: illegal operation"],
    ["closing", "Exit status 3: internal error"],
  ]);
  // A refusal and a failure name the command's first argument as it was typed, when it has one.
  const title = (report) => reportLines(report)[0];
  assert.deepEqual(title(reportRefusal("check", refusal, terminal(80), "model.json")), [
    "title",
    "archpub check · model.json",
  ]);
  assert.deepEqual(
    title(reportRefusal("build", refusal, terminal(80), "examples/big-bank/model.json")),
    ["title", "archpub build · examples/big-bank/model.json"],
  );
  assert.deepEqual(title(reportFailure("accept", "EISDIR", terminal(80), "../delivery")), [
    "title",
    "archpub accept · ../delivery",
  ]);
});

test("each command's result names what was done and the command to run next", () => {
  const built = {
    out: "/work/delivery",
    model: { id: "shop" },
    media: ["edition", "page"],
    views: ["index", "internals"],
    plates: 2,
    artifacts: 9,
    warnings: [
      {
        code: "line_row_untested",
        message: "Plates 01 draw the pattern of a planned relation, which no work has tested.",
      },
    ],
  };
  assert.deepEqual(reportLines(reportResult("build", built, "model.json")), [
    ["title", "archpub build · shop"],
    ["heading", "Delivery"],
    ["passed", "Views", "2 views"],
    ["passed", "Edition", "2 plates in shop.pdf"],
    ["passed", "Page", "shop.html"],
    ["passed", "Files", "9 files"],
    ["passed", "Directory", "/work/delivery"],
    ["heading", "Warnings"],
    [
      "attention",
      "line_row_untested",
      "Plates 01 draw the pattern of a planned relation, which no work has tested.",
    ],
    ["closing", "Next: archpub accept /work/delivery --reviewer <name>"],
  ]);
  const labels = (media) =>
    reportLines(reportResult("build", { ...built, media, plates: 1, warnings: [] }, "model.json"))
      .slice(2, -1)
      .map(([, label, value]) => `${label} ${value}`);
  assert.deepEqual(labels(["edition"]), [
    "Views 2 views",
    "Edition 1 plate in shop.pdf",
    "Files 9 files",
    "Directory /work/delivery",
  ]);
  assert.deepEqual(labels(["page"]), [
    "Views 2 views",
    "Page shop.html",
    "Files 9 files",
    "Directory /work/delivery",
  ]);

  const accepted = {
    directory: "/work/delivery",
    reviewer: "Reviewer",
    acceptedAt: "2026-11-14T08:00:00Z",
    colophon: "/work/delivery/colophon.pdf",
    signer: null,
    signature: null,
  };
  assert.deepEqual(reportLines(reportResult("accept", accepted, "delivery")), [
    ["title", "archpub accept · /work/delivery"],
    ["heading", "Acceptance"],
    ["passed", "Reviewer", "Reviewer"],
    ["noted", "Signature", "unsigned"],
    ["passed", "Colophon", "/work/delivery/colophon.pdf"],
    ["closing", "Next: archpub verify /work/delivery"],
  ]);
  const signed = { ...accepted, signer: "SHA256:abc", signature: "/work/delivery/acceptance.sig" };
  assert.deepEqual(reportLines(reportResult("accept", signed, "delivery"))[3], [
    "passed",
    "Signature",
    "signed by SHA256:abc in /work/delivery/acceptance.sig",
  ]);

  const verified = { ...accepted, signer: "SHA256:abc", signature: "verified" };
  assert.deepEqual(reportLines(reportResult("verify", verified, "delivery")), [
    ["title", "archpub verify · /work/delivery"],
    ["heading", "Acceptance"],
    [
      "passed",
      "Delivery",
      "its files match the manifest, the acceptance record names this manifest, and the colophon page is the one the record names",
    ],
    ["passed", "Reviewer", "Reviewer at 2026-11-14T08:00:00Z"],
    ["passed", "Signature", "signed by SHA256:abc and checked against the allowed signers"],
    ["closing", "Next: archpub publish /work/delivery --to <root>"],
  ]);
  for (const [signature, line] of [
    [
      "unchecked",
      ["attention", "Signature", "signed by SHA256:abc, unchecked without --allowed-signers"],
    ],
    ["unsigned", ["noted", "Signature", "unsigned"]],
  ])
    assert.deepEqual(
      reportLines(reportResult("verify", { ...verified, signature }, "delivery"))[4],
      line,
    );

  const published = { target: "/site/shop/v1", version: "v1", copied: true };
  assert.deepEqual(reportLines(reportResult("publish", published, "delivery")), [
    ["title", "archpub publish · delivery"],
    ["heading", "Publication"],
    ["passed", "Published", "/site/shop/v1"],
    ["closing", "Done."],
  ]);
  assert.deepEqual(
    reportLines(reportResult("publish", { ...published, copied: false }, "delivery"))[2],
    ["noted", "Already published", "/site/shop/v1"],
  );

  const imported = {
    out: "/work/shop.json",
    components: 6,
    relations: 5,
    warnings: [{ code: "likec4_skipped", path: "model.c4:24", message: "Skipped." }],
  };
  assert.deepEqual(reportLines(reportResult("import likec4", imported, "workspace")), [
    ["title", "archpub import likec4 · workspace"],
    ["heading", "Model"],
    ["passed", "Components", "6"],
    ["passed", "Relations", "5"],
    ["passed", "File", "/work/shop.json"],
    ["heading", "Warnings"],
    ["attention", "model.c4:24", "Skipped."],
    ["closing", "Next: archpub check /work/shop.json"],
  ]);

  const migrated = {
    out: "/work/model.json",
    claims: 2,
    cited: 1,
    moved: [{ owner: "a", path: "README.md", components: ["b", "c"] }],
  };
  assert.deepEqual(reportLines(reportResult("migrate", migrated, "old.json")), [
    ["title", "archpub migrate · old.json"],
    ["heading", "Model"],
    ["passed", "Claims", "components claim 2 files"],
    ["passed", "Citations", "relations cite 1 file"],
    ["passed", "File", "/work/model.json"],
    ["noted", "Kept with a", "README.md, no longer cited by b and c"],
    ["closing", "Next: archpub check /work/model.json"],
  ]);

  // The Skill is the agent's entry and is printed as it is written.
  assert.equal(
    reportResult("skill", { file: "/s/SKILL.md", skill: "# Skill\n" }, undefined),
    "# Skill\n",
  );
});
