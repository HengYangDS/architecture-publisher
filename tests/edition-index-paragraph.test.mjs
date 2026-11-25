import assert from "node:assert/strict";
import test from "node:test";
import { validateModel } from "../src/model/load.mjs";
import { HOUSE } from "../src/house.mjs";
import { SET, evalEdition, plateOf, recordOf } from "./fixtures/edition-typeset.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { recordFacts } from "./fixtures/record-facts.mjs";

// The queue item `parts-index` (the owner's choice of 2026-11-25 18:06, option 3a): each part of the index is a short
// paragraph of what it is, what it relates to and the files it claims, which a part's name on a plate links to. The
// index's order, pages and pitch are `edition-index.test.mjs`'s.

/** A plate as the index cites it: its number and the label of its page. */
const drawnOn = (number) => ({ number, key: `plate-${number}` });

test("a part's paragraph states its kind, details, relations and paths; a part's name on a plate leads to it", async (t) => {
  // The queue item `parts-index` (the owner's choice of 2026-11-25 18:06, option 3a): a reader learns about a part
  // one link away from the plate, in the index, without a page of its own.
  const model = validateModel(
    minimalModel({
      kinds: { service: { label: "Service", category: "backend" } },
      components: [
        {
          id: "a",
          label: "Alpha",
          kind: "service",
          details: { owns: "the orders", refuses: "a second writer" },
          files: ["src/a/", "src/a.mjs"],
        },
        { id: "b", label: "Beta" },
      ],
      relations: [{ id: "ab", from: "a", to: "b", label: "calls" }],
      repository: {
        name: "minimal",
        url: "https://github.com/o/minimal.git",
        revision: "a".repeat(40),
      },
    }),
  );
  const plates = [plateOf(1, ["a", "b"])];
  const record = recordOf({ model, plates, facts: recordFacts({ read: 2 }) });
  assert.deepEqual(record.index[0], {
    key: "archpub-part-a",
    label: "Alpha",
    kind: "Service",
    details: [
      { name: "owns", text: "the orders" },
      { name: "refuses", text: "a second writer" },
    ],
    files: [
      { path: "src/a/", url: `https://github.com/o/minimal/blob/${"a".repeat(40)}/src/a/` },
      { path: "src/a.mjs", url: `https://github.com/o/minimal/blob/${"a".repeat(40)}/src/a.mjs` },
    ],
    more: null,
    out: [{ label: "calls", key: "archpub-part-b", other: "Beta" }],
    in: [],
    plates: [drawnOn("01")],
  });
  assert.deepEqual(record.index[1].in, [{ label: "calls", key: "archpub-part-a", other: "Alpha" }]);
  assert.deepEqual(record.plates[0].parts, { a: "archpub-part-a", b: "archpub-part-b" });
  // A part's paths past the house's number are counted, not listed: the reader file and the data hold them all.
  const many = validateModel(
    minimalModel({
      components: [
        {
          id: "a",
          label: "Alpha",
          files: Array.from({ length: HOUSE.edition.indexPaths + 6 }, (_, at) => `src/p${at}.mjs`),
        },
      ],
      relations: [],
    }),
  );
  const [crowded] = recordOf({ model: many, plates: [plateOf(1, ["a"])] }).index;
  assert.equal(crowded.files.length, HOUSE.edition.indexPaths);
  assert.equal(crowded.more, "and 6 more");
  const set = await evalEdition(t, { model, plates, facts: recordFacts({ read: 2 }) }, SET);
  const page = set.pages;
  const texts = set.boxes.filter((box) => box.page === page).map(({ text }) => text);
  for (const said of [
    "Alpha",
    "SERVICE",
    "owns",
    "the orders",
    "refuses",
    "a second writer",
    "→",
    "←",
  ])
    assert.ok(texts.includes(said), `${said}: ${texts.join(" | ")}`);
  // The plate's names lead to the paragraphs; the relations to the other part's; each path that names one file or
  // folder to the source at the pin.
  const from = (/** @type {number} */ at) =>
    set.links.filter((link) => link.page === at).map(({ to }) => String(to));
  assert.deepEqual(
    from(3)
      .filter((to) => to.startsWith("archpub-part-"))
      .sort(),
    ["archpub-part-a", "archpub-part-b"],
  );
  const onIndex = from(page);
  assert.ok(
    onIndex.includes("archpub-part-a") && onIndex.includes("archpub-part-b"),
    onIndex.join(" "),
  );
  assert.deepEqual(
    onIndex.filter((to) => to.startsWith("https://github.com/o/minimal/blob/")).length,
    2,
  );
  // The paragraph's first detail stands under its name at the text's pitch below the head line.
  const alpha = set.boxes.find((box) => box.page === page && box.text === "Alpha");
  const owns = set.boxes.find((box) => box.page === page && box.text === "the orders");
  assert.ok(
    owns.b > alpha.b && owns.x > alpha.x,
    "the detail stands under the name, after its term",
  );
});

test("a paragraph's rows never overprint: a long detail name, an overlong path, alike relations", async (t) => {
  // The independent review of the Change (2026-11-25): a detail name that wraps in its column overprinted the next
  // row, a path wider than the column ran past it, and two alike relations were listed twice.
  const long = "a rather long detail name of sixty four characters in total....";
  const deep = `src/${"averyverylongdirectoryname/".repeat(8)}`;
  const model = validateModel(
    minimalModel({
      components: [
        { id: "a", label: "Alpha", details: { [long]: "first", short: "second" }, files: [deep] },
        { id: "b", label: "Beta" },
      ],
      relations: [
        { id: "ab", from: "a", to: "b", label: "calls" },
        { id: "ab-again", from: "a", to: "b", label: "calls" },
      ],
      repository: {
        name: "minimal",
        url: "https://github.com/o/minimal.git",
        revision: "a".repeat(40),
      },
    }),
  );
  const plates = [plateOf(1, ["a", "b"])];
  const record = recordOf({ model, plates, facts: recordFacts({ read: 1 }) });
  assert.deepEqual(record.index[0].out, [{ label: "calls", key: "archpub-part-b", other: "Beta" }]);
  assert.equal(record.index[1].in.length, 1);
  const set = await evalEdition(t, { model, plates, facts: recordFacts({ read: 1 }) }, SET);
  const on = set.boxes.filter((box) => box.page === set.pages);
  const named = on.find((box) => box.text === long);
  const next = on.find((box) => box.text === "short");
  assert.ok(named.h > 20, "the long name wraps in its column");
  assert.ok(
    next.y >= named.y + named.h - 1,
    `the next row stands below the long name: ${next.y} < ${named.y + named.h}`,
  );
  // The path, wider than the column, may break after each of its slashes, and nowhere else: a break opportunity
  // (U+200B) follows every slash. Its height cannot tell a broken path from one that runs past the column.
  const [path] = on.filter(
    (box) => box.size === HOUSE.sizes.small && box.text.includes("averyverylong"),
  );
  assert.equal(path.text, deep.split("/").join("/\u200b"));
  const relations = on.filter((box) => box.text.includes("calls"));
  assert.ok(
    relations.every((box) => box.text.split("calls").length === 2),
    relations.map(({ text }) => text).join(" | "),
  );
});

test("a part of a path wider than the column, and a paragraph taller than a page, are refused", async (t) => {
  const refused = (/** @type {any} */ extra) =>
    evalEdition(
      t,
      {
        model: validateModel(minimalModel({ ...extra, relations: [] })),
        plates: [plateOf(1, ["a"])],
        facts: recordFacts({ read: 1 }),
      },
      SET,
    );
  await assert.rejects(
    refused({ components: [{ id: "a", label: "Alpha", files: [`src/${"x".repeat(160)}.mjs`] }] }),
    (error) => /edition_index_too_long: a part of the path/u.test(error.stderr),
  );
  const details = Object.fromEntries(
    Array.from({ length: 60 }, (_, at) => [`detail ${at}`, `value ${at}`]),
  );
  await assert.rejects(refused({ components: [{ id: "a", label: "Alpha", details }] }), (error) =>
    /edition_index_too_long: a part's paragraph/u.test(error.stderr),
  );
});

test("without a repository no path links; a part without a kind or files has neither; every plate's part has a paragraph", () => {
  const model = validateModel(
    minimalModel({
      components: [
        { id: "a", label: "Alpha", files: ["src/a.mjs"] },
        { id: "b", label: "Beta" },
      ],
      relations: [],
    }),
  );
  const record = recordOf({ model, plates: [plateOf(1, ["a", "b"])] });
  assert.deepEqual(record.index[0].files, [{ path: "src/a.mjs", url: null }]);
  assert.deepEqual(
    [record.index[1].kind, record.index[1].files, record.index[1].more],
    [null, [], null],
  );
  assert.ok(
    !`${record.words.readingNote.before}${record.words.readingNote.after}`.includes(
      "links its files",
    ),
  );
  const keys = new Set(record.index.map(({ key }) => key));
  for (const plate of record.plates)
    for (const key of Object.values(plate.parts)) assert.ok(keys.has(key), key);
});

test("a Chinese part's paragraph is set in its language", async (t) => {
  const model = validateModel(
    minimalModel({
      locale: "zh-CN",
      components: [
        { id: "a", label: "配置存储", details: { 管理: "配置文件、它的锁和备份" } },
        { id: "b", label: "同步器" },
      ],
      relations: [{ id: "ab", from: "a", to: "b", label: "供读取" }],
    }),
  );
  const set = await evalEdition(t, { model, plates: [plateOf(1, ["a", "b"])] }, SET);
  const texts = set.boxes.filter((box) => box.page === set.pages).map(({ text }) => text);
  for (const said of ["配置存储", "管理", "配置文件、它的锁和备份", "同步器"])
    assert.ok(texts.includes(said), `${said}: ${texts.join(" | ")}`);
});
