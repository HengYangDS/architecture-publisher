import assert from "node:assert/strict";
import test from "node:test";
import TABLE from "../src/delivery.json" with { type: "json" };
import SHARED from "../src/shared.json" with { type: "json" };
import {
  ACCEPTANCE,
  COLOPHON,
  DEFAULT_WIDTH,
  figureFiles,
  filesOf,
  imageFile,
  MANIFEST,
  MODEL,
  OVERVIEW_PAGE,
  SIGNATURE,
} from "../src/names.mjs";

// The queue item `derived-references`: a delivery's files are named in one table (src/delivery.json), which the
// operations reference's table is written from. This holds the names the source forms to the table's rows, and
// the one name the house class shares (the delivered model) to its row.

const row = Object.fromEntries(
  TABLE.files.map((each) => [
    each.role,
    each.name === "{shared}" ? SHARED.delivered.model : each.name,
  ]),
);

test("the table holds each file of a delivery once, by a role of its own", () => {
  const roles = TABLE.files.map(({ role }) => role);
  assert.equal(new Set(roles).size, roles.length);
  for (const each of TABLE.files)
    for (const field of ["role", "name", "when", "holds"])
      assert.ok(typeof each[field] === "string" && each[field].length > 0, `${each.role} ${field}`);
});

test("every name the source forms is the table's", () => {
  const id = "shop";
  assert.deepEqual(filesOf(id), {
    edition: row.edition.replace("{id}", id),
    page: row.page.replace("{id}", id),
    data: row.data.replace("{id}", id),
    reader: row.reader.replace("{id}", id),
  });
  assert.deepEqual(
    [MANIFEST, MODEL, ACCEPTANCE, SIGNATURE, COLOPHON],
    [row.manifest, row.model, row.acceptance, row.signature, row.colophon],
  );
  assert.equal(DEFAULT_WIDTH, TABLE.defaultWidth);
  assert.equal(imageFile(DEFAULT_WIDTH, OVERVIEW_PAGE), row.overviewImage);
  assert.equal(
    imageFile(DEFAULT_WIDTH, "03-orders"),
    row.plateImage.replace("{NN}-{view}", "03-orders"),
  );
  assert.equal(
    imageFile(1600, "03-orders"),
    row.otherImage.replace("{name}-{width}", "03-orders-1600"),
  );
  const [png, svg] = figureFiles("03-orders");
  assert.equal(`${png.file}, .${svg.format}`, row.figure.replace("{NN}-{view}", "03-orders"));
});
