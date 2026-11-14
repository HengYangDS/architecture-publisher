import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";
import { buildDelivery, digestTree } from "../src/build.mjs";
import { reportResult } from "../src/cli/report.mjs";
import { runCli } from "../src/cli/run.mjs";
import { acceptDelivery } from "../src/delivery.mjs";
import { json } from "./fixtures/command-line.mjs";
import { BIG_BANK_MODEL } from "./fixtures/models.mjs";
import { FRAME, reportLines } from "./fixtures/report-lines.mjs";

/** Where the deliveries of these tests stand: `first` and `second` are two builds of one model, left as built. */
let root = "";
const delivery = (name) => path.join(root, name);

/** A plate's page images at the two widths the builds draw. */
const TIERS = "images/01-containers-tiers.png";
const TIERS_SMALL = "images/01-containers-tiers-1200.png";
const AUTOMATIC = "images/02-containers-automatic.png";

before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-compare-"));
  // Without a checkout a build is dated by SOURCE_DATE_EPOCH: one date source makes two builds comparable.
  process.env.SOURCE_DATE_EPOCH = "1793918078";
  try {
    for (const name of ["first", "second"])
      await buildDelivery(BIG_BANK_MODEL, delivery(name), { png: [1200, 2400] });
  } finally {
    delete process.env.SOURCE_DATE_EPOCH;
  }
});
after(() => fs.rm(root, { recursive: true, force: true }));

/** A report without its frame and spacing, so that a path a narrow terminal wraps reads whole. */
const unframed = (output) => output.replaceAll(FRAME.guide, "").replace(/\s/gu, "");

/** The digests of a delivery's files by path, its manifest among them. */
async function digests(directory) {
  return Object.fromEntries((await digestTree(directory)).map((file) => [file.path, file.sha256]));
}

/**
 * A copy of the second build that `change` edits, with its manifest brought into line with its files when
 * `aligned`, as a build of other bytes would have written it.
 */
async function changedCopy(name, change, aligned = true) {
  const copy = delivery(name);
  await fs.cp(delivery("second"), copy, { recursive: true });
  await change(copy);
  if (aligned) {
    const file = path.join(copy, "manifest.json");
    const manifest = JSON.parse(await fs.readFile(file, "utf8"));
    manifest.artifacts = await digestTree(copy, new Set(["manifest.json"]));
    await fs.writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  return copy;
}

test("one model built twice with one date source is identical, and the comparison writes nothing", async () => {
  const [first, second] = [delivery("first"), delivery("second")];
  const untouched = await digestTree(root);
  assert.deepEqual(await json(["compare", first, second]), {
    exitCode: 0,
    body: { ok: true, first, second, identical: true, plates: [], files: [] },
  });
  const { exitCode, output } = await runCli(["compare", first, second]);
  assert.equal(exitCode, 0);
  // The title names the first delivery as it was typed.
  assert.ok(unframed(output).startsWith(unframed(`${FRAME.start}archpub compare · ${first}`)));
  assert.deepEqual(reportLines(output).at(-1), ["closing", "The deliveries are identical."]);
  // A delivery compared with itself is identical too, and a path is resolved in the result alone.
  const near = path.relative(process.cwd(), first);
  assert.deepEqual((await json(["compare", near, first])).body, {
    ok: true,
    first,
    second: first,
    identical: true,
    plates: [],
    files: [],
  });
  assert.deepEqual(await digestTree(root), untouched);
  // An accepted delivery compares as it did before: its record and its colophon page are no part of the build.
  const accepted = delivery("accepted");
  await fs.cp(second, accepted, { recursive: true });
  await acceptDelivery(accepted, { reviewer: "Reviewer" });
  assert.equal((await json(["compare", first, accepted])).body.identical, true);
});

test("a delivery with one plate's image replaced lists exactly that plate", async () => {
  const first = delivery("first");
  const replaced = await changedCopy("replaced", (copy) =>
    fs.copyFile(path.join(copy, TIERS), path.join(copy, AUTOMATIC)),
  );
  const [held, found] = [await digests(first), await digests(replaced)];
  assert.equal(found[AUTOMATIC], held[TIERS]);
  const { exitCode, body } = await json(["compare", first, replaced]);
  assert.equal(exitCode, 0);
  assert.deepEqual(body, {
    ok: true,
    first,
    second: replaced,
    identical: false,
    plates: [
      {
        page: 2,
        views: ["containers-automatic"],
        files: [{ path: AUTOMATIC, first: held[AUTOMATIC], second: found[AUTOMATIC] }],
      },
    ],
    // The manifest records every file's digest, so it differs whenever a file does.
    files: [
      { path: "manifest.json", first: held["manifest.json"], second: found["manifest.json"] },
    ],
  });
  const report = await runCli(["compare", first, replaced]);
  assert.equal(report.exitCode, 0);
  assert.deepEqual(reportLines(report.output).at(-1), [
    "closing",
    "1 plate and 1 file of the whole edition differ.",
  ]);
});

test("a file in one delivery alone is named with the delivery that holds it, a plate's under its plate", async () => {
  const first = delivery("first");
  const other = await changedCopy("other", async (copy) => {
    await fs.rm(path.join(copy, TIERS_SMALL));
    await fs.copyFile(path.join(copy, AUTOMATIC), path.join(copy, TIERS));
    await fs.writeFile(path.join(copy, "notes.txt"), "notes");
  });
  const [held, found] = [await digests(first), await digests(other)];
  const plate = { page: 1, views: ["containers-tiers"] };
  const manifest = {
    path: "manifest.json",
    first: held["manifest.json"],
    second: found["manifest.json"],
  };
  const swapped = ({ path: file, first: one, second: two }) => ({
    path: file,
    first: two,
    second: one,
  });
  const files = [
    { path: TIERS_SMALL, first: held[TIERS_SMALL], second: null },
    { path: TIERS, first: held[TIERS], second: found[TIERS] },
  ];
  const whole = [manifest, { path: "notes.txt", first: null, second: found["notes.txt"] }];
  assert.deepEqual((await json(["compare", first, other])).body, {
    ok: true,
    first,
    second: other,
    identical: false,
    plates: [{ ...plate, files }],
    files: whole,
  });
  assert.deepEqual((await json(["compare", other, first])).body, {
    ok: true,
    first: other,
    second: first,
    identical: false,
    plates: [{ ...plate, files: files.map(swapped) }],
    files: whole.map(swapped),
  });
});

test("a delivery edited after its build, or a directory that is no delivery, is refused by name", async () => {
  const first = delivery("first");
  const edited = await changedCopy(
    "edited",
    (copy) => fs.writeFile(path.join(copy, AUTOMATIC), "edited"),
    false,
  );
  for (const args of [
    ["compare", first, edited],
    ["compare", edited, first],
  ]) {
    const { exitCode, body } = await json(args);
    assert.equal(exitCode, 1);
    assert.deepEqual(body, {
      ok: false,
      code: "delivery_changed",
      message: `The files of ${edited} differ from its manifest.`,
      problems: [{ code: "delivery_changed", message: `${AUTOMATIC} changed` }],
    });
  }
  const report = await runCli(["compare", first, edited]);
  assert.equal(report.exitCode, 1);
  assert.ok(unframed(report.output).includes(unframed(`${AUTOMATIC} changed`)));
  assert.deepEqual(reportLines(report.output).at(-1), ["closing", "Exit status 1: refused"]);

  const empty = delivery("empty");
  await fs.mkdir(empty);
  const missing = await json(["compare", first, empty]);
  assert.deepEqual(
    [missing.exitCode, missing.body.code, missing.body.message],
    [1, "delivery_manifest_missing", `${empty} has no manifest.json.`],
  );
  // A manifest that is none names its own file, so that the refusal says which of the two deliveries it is.
  const manifest = path.join(empty, "manifest.json");
  for (const [text, message] of [
    ["{", `${manifest} is not JSON.`],
    ['{"format":"other"}', `${manifest} is not an Architecture Publisher delivery.`],
  ]) {
    await fs.writeFile(manifest, text);
    const invalid = await json(["compare", empty, first]);
    assert.deepEqual(
      [invalid.exitCode, invalid.body.code, invalid.body.message],
      [1, "delivery_manifest_invalid", message],
    );
  }
  // One delivery, or three, is a usage error.
  for (const [args, message] of [
    [["compare", first], "missing required argument 'delivery'"],
    [
      ["compare", "a", "b", "c"],
      "too many arguments for 'compare'. Expected 2 arguments but got 3: a, b, c.",
    ],
  ])
    assert.deepEqual(await json(args), {
      exitCode: 2,
      body: { ok: false, code: "usage", message },
    });
});

/** A directory that holds the given files and a manifest of them, with the plates it records, if any. */
async function recorded(name, files, plates) {
  const directory = delivery(name);
  await fs.mkdir(path.join(directory, "images"), { recursive: true });
  for (const [file, text] of Object.entries(files))
    await fs.writeFile(path.join(directory, file), text);
  const manifest = {
    format: "architecture-publisher.delivery",
    ...(plates ? { plates } : {}),
    artifacts: await digestTree(directory),
  };
  await fs.writeFile(path.join(directory, "manifest.json"), JSON.stringify(manifest));
  return directory;
}

test("a page image belongs to the plate either manifest records it under, in the order of the plates' numbers", async () => {
  const plate = (page, view) => ({
    page,
    views: [view],
    images: [{ width: 2400, file: `images/${String(page).padStart(2, "0")}-${view}.png` }],
  });
  const images = { "images/100-z.png": "a", "images/11-y.png": "a", "images/loose.png": "a" };
  const first = await recorded("recorded-first", { ...images, "images/02-a.png": "a" }, [
    plate(100, "z"),
    plate(11, "y"),
    plate(2, "a"),
    // A plate whose record names no image has none to compare.
    { page: 3, views: ["c"] },
  ]);
  const second = await recorded(
    "recorded-second",
    {
      "images/100-z.png": "b",
      "images/11-y.png": "b",
      "images/loose.png": "b",
      "images/02-b.png": "b",
    },
    [plate(2, "b")],
  );
  const { body } = await json(["compare", first, second]);
  assert.deepEqual(
    body.plates.map(({ page, views, files }) => [page, views, files.map((file) => file.path)]),
    [
      [2, ["a"], ["images/02-a.png"]],
      [2, ["b"], ["images/02-b.png"]],
      [11, ["y"], ["images/11-y.png"]],
      [100, ["z"], ["images/100-z.png"]],
    ],
  );
  assert.deepEqual(
    body.files.map((file) => file.path),
    ["images/loose.png", "manifest.json"],
  );
  // A manifest that records no plates leaves its images to the other's records.
  const plain = await recorded("recorded-plain", {
    ...images,
    "images/02-a.png": "a",
    "images/11-y.png": "c",
  });
  const mixed = (await json(["compare", plain, first])).body;
  assert.deepEqual(
    [mixed.identical, mixed.plates.map(({ page }) => page), mixed.files.map((file) => file.path)],
    [false, [11], ["manifest.json"]],
  );
  // With no record of a plate on either side, an image is a file of the whole edition.
  const bare = await recorded("recorded-bare", { ...images, "images/02-a.png": "a" });
  const unrecorded = (await json(["compare", plain, bare])).body;
  assert.deepEqual(
    [unrecorded.plates, unrecorded.files.map((file) => file.path)],
    [[], ["images/11-y.png", "manifest.json"]],
  );
});

test("a comparison's report names both deliveries, each plate that differs and the edition's other files", () => {
  const file = (name, first = "a", second = "b") => ({ path: name, first, second });
  const compared = {
    first: "/work/first",
    second: "/work/second",
    identical: false,
    plates: [
      { page: 1, views: ["tiers"], files: [file("images/01-tiers.png")] },
      {
        page: 12,
        views: ["index", "internals"],
        files: [
          file("images/12-index+internals-1200.png", "a", null),
          file("images/12-index+internals.png", null, "b"),
        ],
      },
    ],
    files: [file("manifest.json"), file("shop.html", null, "b"), file("shop.pdf")],
  };
  assert.deepEqual(reportLines(reportResult("compare", compared, "first")), [
    ["title", "archpub compare · first"],
    ["heading", "Deliveries"],
    ["passed", "First", "/work/first · its files match its manifest"],
    ["passed", "Second", "/work/second · its files match its manifest"],
    ["heading", "Plates that differ"],
    ["attention", "01", "tiers · images/01-tiers.png differs"],
    [
      "attention",
      "12",
      "index, internals · images/12-index+internals-1200.png only in the first delivery, images/12-index+internals.png only in the second delivery",
    ],
    ["heading", "Files of the whole edition that differ"],
    ["attention", "manifest.json", "differs"],
    ["attention", "shop.html", "only in the second delivery"],
    ["attention", "shop.pdf", "differs"],
    ["closing", "2 plates and 3 files of the whole edition differ."],
  ]);
  const closing = (result) =>
    reportLines(reportResult("compare", { ...compared, ...result }, "first")).at(-1)[1];
  assert.equal(closing({ files: [] }), "2 plates differ.");
  assert.equal(closing({ plates: compared.plates.slice(0, 1), files: [] }), "1 plate differs.");
  assert.equal(
    closing({ plates: [], files: [file("manifest.json")] }),
    "1 file of the whole edition differs.",
  );
  // Identical deliveries keep the group that names them, and no other.
  assert.deepEqual(
    reportLines(
      reportResult("compare", { ...compared, identical: true, plates: [], files: [] }, "first"),
    ).map(([kind, text]) => `${kind} ${text}`),
    [
      "title archpub compare · first",
      "heading Deliveries",
      "passed First",
      "passed Second",
      "closing The deliveries are identical.",
    ],
  );
});
