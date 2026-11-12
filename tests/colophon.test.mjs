import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { typesetColophon } from "../src/edition/colophon.mjs";
import { temporaryDirectory } from "./fixtures/models.mjs";
import { readPdf } from "./fixtures/pdf.mjs";

const AT = "2026-11-12T08:30:15Z";

/** The colophon page of an acceptance of the Minimal edition, with the given fields. */
const colophon = (fields) =>
  typesetColophon({
    locale: "en",
    title: "Minimal",
    revision: "a".repeat(40),
    release: null,
    date: "2026-11-06",
    reviewer: "Yang HENG",
    sealName: null,
    acceptedAt: AT,
    manifest: "0".repeat(64),
    signer: null,
    ...fields,
  });

/** A PDF's text and inflated streams read as UTF-8, where its metadata is written. */
const metadataOf = (pdf) => Buffer.from(readPdf(pdf).text, "latin1").toString("utf8");

test("the colophon page sets a Latin, a Han, a Hangul and a long name in English and Chinese editions", async () => {
  const names = ["Yang HENG", "衡阳", "김민준", "Hubert Blaine Wolfeschlegelsteinhausen"];
  for (const [locale, word] of [
    ["en", "ACCEPTED"],
    ["zh-CN", "验收"],
  ])
    for (const reviewer of names) {
      const { pdf, mark, facts } = await colophon({ locale, reviewer });
      assert.equal(pdf.subarray(0, 5).toString(), "%PDF-", `${locale} ${reviewer}`);
      // The rim reads the publisher's word and the date, the band the name, and the figure says so.
      assert.deepEqual([mark.word, mark.date, mark.name], [word, "2026-11-12", reviewer]);
      const metadata = metadataOf(pdf);
      assert.ok(metadata.includes(`${word} 2026-11-12: ${reviewer}`), `${locale} ${reviewer}`);
      assert.match(metadata, /pdfaid:part/u);
      assert.equal(facts[0].value, reviewer);
    }
});

test("the facts name the reviewer, the time, the edition, the manifest and the signer, in the edition's language", async () => {
  const signer = "SHA256:Q0n6mJrSmEJ8SQhQ1d0Hj8v5WcNw7s0n9bqKZ3r5xYk";
  const { facts } = await colophon({ locale: "zh-CN", release: "v1.2.0", signer });
  assert.deepEqual(
    facts.map(({ label, value }) => [label, value]),
    [
      ["验收人", "Yang HENG"],
      ["日期", "2026-11-12 08:30:15 UTC"],
      ["主题", "Minimal v1.2.0 · aaaaaaa"],
      ["清单", "0".repeat(64)],
      ["签名", signer],
    ],
  );
  // Without a signature or a revision the page says it is unsigned and names the title alone.
  const unsigned = await colophon({ revision: null });
  assert.deepEqual(
    unsigned.facts.slice(2).map(({ value }) => value),
    ["Minimal", "0".repeat(64), "Unsigned"],
  );
});

test("each manifest wears the ring differently, and one acceptance is set as the same page again", async () => {
  const first = await colophon({});
  const second = await colophon({ manifest: "9f".repeat(32) });
  assert.notDeepEqual(first.mark.chips, second.mark.chips);
  assert.equal(first.mark.chips.length, 4);
  for (const [angle, span, depth] of second.mark.chips) {
    assert.ok(angle >= 0 && angle < 360 && span >= 8 && span <= 28, `${angle} ${span}`);
    assert.ok(depth >= 0.5 && depth <= 1, `${depth}`);
  }
  assert.ok((await colophon({})).pdf.equals(first.pdf), "a reprint differs");
});

test("a name no house face draws is refused and names its characters; a seal name the faces draw is set instead", async () => {
  for (const reviewer of ["محمد عبد الله", "देवनागरी"])
    await assert.rejects(
      colophon({ reviewer }),
      (error) =>
        error.code === "acceptance_name_unset" &&
        error.message.includes(Array.from(reviewer)[0]) &&
        error.message.includes("--seal-name"),
    );
  await assert.rejects(colophon({ sealName: "محمد" }), { code: "acceptance_name_unset" });
  // The seal name stands on the mark and, where the faces cannot draw the reviewer's own name, in the facts.
  const sealed = await colophon({ reviewer: "محمد عبد الله", sealName: "Muhammad Abdullah" });
  assert.deepEqual(
    [sealed.mark.name, sealed.facts[0].value],
    ["Muhammad Abdullah", "Muhammad Abdullah"],
  );
  const han = await colophon({ sealName: "衡阳" });
  assert.deepEqual([han.mark.name, han.facts[0].value], ["衡阳", "Yang HENG"]);
});

test("a name too long for the band at the smallest size is refused", async (t) => {
  await assert.rejects(
    colophon({ reviewer: "Wolfeschlegelsteinhausenbergerdorffwelchevoralternwaren" }),
    (error) =>
      error.code === "acceptance_name_too_long" &&
      /^archpub\/colophon\.typ:\d+$/u.test(error.problems[0].path),
  );
  const absent = path.join(await temporaryDirectory(t, "archpub-colophon-"), "typst");
  await assert.rejects(colophon({ typst: absent }), { code: "colophon_typst_missing" });
});
