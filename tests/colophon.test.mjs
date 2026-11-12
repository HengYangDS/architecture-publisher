import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { typesetColophon } from "../src/edition/colophon.mjs";
import { editionWordsOf } from "../src/edition/words.mjs";
import { LOCALES } from "../src/locale.mjs";
import { temporaryDirectory } from "./fixtures/models.mjs";
import { readPdf } from "./fixtures/pdf.mjs";

const AT = "2026-11-12T08:30:15Z";
const REVISION = "a".repeat(40);

/** The colophon page of an acceptance of the Minimal edition, with the given fields. */
const colophon = (fields) =>
  typesetColophon({
    locale: "en",
    title: "Minimal",
    revision: REVISION,
    release: null,
    date: "2026-11-06",
    reviewer: "Yang HENG",
    sealName: null,
    note: null,
    acceptedAt: AT,
    manifest: "0".repeat(64),
    signer: null,
    ...fields,
  });

/** A PDF's text and inflated streams read as UTF-8, where its metadata is written. */
const metadataOf = (pdf) => Buffer.from(readPdf(pdf).text, "latin1").toString("utf8");

/** Whether the name, as Typst measured it, lies within the band: no wider than it and no taller than its room. */
const inBand = ({ fit }) => fit.width <= fit.bandWidth && fit.height <= fit.bandHeight;

test("the colophon page sets a Latin, a Han, a Hangul, a Cyrillic and a long name inside the band in English and Chinese editions", async () => {
  const names = [
    "Yang HENG",
    "衡阳",
    "김민준",
    "Александр Пушкин",
    "Hubert Blaine Wolfeschlegelsteinhausen",
  ];
  for (const [locale, word] of [
    ["en", "ACCEPTED"],
    ["zh-CN", "验收"],
  ])
    for (const reviewer of names) {
      const typeset = await colophon({ locale, reviewer });
      assert.equal(typeset.pdf.subarray(0, 5).toString(), "%PDF-", `${locale} ${reviewer}`);
      // The mark carries the publisher's word, the date and the name, and nothing else.
      assert.deepEqual(typeset.mark, {
        word,
        date: "2026-11-12",
        name: reviewer,
        alt: `${word} 2026-11-12: ${reviewer}`,
      });
      const metadata = metadataOf(typeset.pdf);
      assert.ok(metadata.includes(typeset.mark.alt), `${locale} ${reviewer}`);
      assert.match(metadata, /pdfaid:part/u);
      assert.ok(inBand(typeset), `${reviewer} leaves the band: ${JSON.stringify(typeset.fit)}`);
    }
});

test("a name takes the largest size on one line, wraps to two lines before it shrinks, and is refused when it cannot fit", async () => {
  const short = await colophon({});
  assert.deepEqual(short.fit.lines, ["Yang HENG"]);
  assert.equal(short.fit.size, Math.round(short.fit.mark * 0.13 * 100) / 100);
  // One line of this name fits above the smallest size, yet two lines are set larger.
  const wrapped = await colophon({ reviewer: "Александр Пушкин" });
  assert.deepEqual(wrapped.fit.lines, ["Александр", "Пушкин"]);
  assert.ok(wrapped.fit.size > wrapped.fit.mark * 0.07, JSON.stringify(wrapped.fit));
  // A name breaks where its two lines are most nearly even, after a hyphen as at a space.
  const hyphened = await colophon({ reviewer: "María José García-Fernández" });
  assert.deepEqual(hyphened.fit.lines, ["María José", "García-Fernández"]);
  const long = await colophon({ reviewer: "Hubert Blaine Wolfeschlegelsteinhausen" });
  assert.deepEqual(long.fit.lines, ["Hubert Blaine", "Wolfeschlegelsteinhausen"]);
  for (const typeset of [wrapped, hyphened, long]) assert.ok(inBand(typeset));
  await assert.rejects(
    colophon({ reviewer: "Wolfeschlegelsteinhausenbergerdorffwelchevoralternwaren" }),
    (error) =>
      error.code === "acceptance_name_too_long" &&
      error.message.includes("Wolfeschlegelsteinhausenbergerdorffwelchevoralternwaren") &&
      error.message.includes("--seal-name"),
  );
});

test("the acceptance slip names the reviewer, the time, the subject, the commit, the manifest and the signing key", async () => {
  const signer = "SHA256:Q0n6mJrSmEJ8SQhQ1d0Hj8v5WcNw7s0n9bqKZ3r5xYk";
  const chinese = await colophon({ locale: "zh-CN", release: "v1.2.0", signer, note: "已通读" });
  assert.deepEqual(
    chinese.facts.map(({ label, value }) => [label, value]),
    [
      ["验收人", "Yang HENG"],
      ["验收时间", "2026-11-12 08:30:15 UTC"],
      ["对象", "Minimal v1.2.0"],
      ["提交", REVISION],
      ["清单 SHA-256", "0".repeat(64)],
      ["签名密钥", signer],
      ["备注", "已通读"],
    ],
  );
  assert.equal(chinese.scope, "验收记载谁在何时接受了哪些字节，并不证明架构正确。");
  // The page names the files published with the edition, the signature among them only when there is one.
  assert.equal(
    chinese.note,
    "随本版发布的验收记录（acceptance.json 与 acceptance.sig）载有本页与清单的 SHA-256，可用 archpub verify 核验。",
  );
  // The commit is named as a commit, in the slip as in the foot.
  assert.equal(chinese.foot, "Minimal v1.2.0，提交 aaaaaaa，2026-11-06");
  // Without a signature, a revision or a note, the slip says the acceptance is unsigned and leaves out the rest.
  const english = await colophon({ revision: null });
  assert.deepEqual(
    english.facts.map(({ label, value }) => [label, value]),
    [
      ["Reviewer", "Yang HENG"],
      ["Accepted at", "2026-11-12 08:30:15 UTC"],
      ["Subject", "Minimal"],
      ["Manifest SHA-256", "0".repeat(64)],
      ["Signing key", "Unsigned"],
    ],
  );
  assert.equal(
    english.scope,
    "Acceptance records who accepted which bytes and when; it does not certify that the architecture is correct.",
  );
  assert.equal(
    english.note,
    "The acceptance record published with this edition (acceptance.json) holds the SHA-256 of this page and the manifest; check it with archpub verify.",
  );
  assert.equal(english.foot, "Minimal");
  // One acceptance is set as the same page again, and another manifest changes the slip but not the mark.
  assert.ok((await colophon({ revision: null })).pdf.equals(english.pdf), "a reprint differs");
  const other = await colophon({ revision: null, manifest: "9f".repeat(32) });
  assert.deepEqual(other.mark, english.mark);
  assert.notDeepEqual(other.facts, english.facts);
  assert.ok(!other.pdf.equals(english.pdf));
});

test("a name no house face draws is refused and names its characters; a seal name the faces draw is set instead", async (t) => {
  for (const reviewer of ["محمد عبد الله", "देवनागरी"])
    await assert.rejects(
      colophon({ reviewer }),
      (error) =>
        error.code === "acceptance_name_unset" &&
        error.message.includes(Array.from(reviewer)[0]) &&
        error.message.includes("--seal-name"),
    );
  await assert.rejects(colophon({ sealName: "محمد" }), { code: "acceptance_name_unset" });
  // The seal name stands on the mark and, where the faces cannot draw the reviewer's own name, in the slip.
  const sealed = await colophon({ reviewer: "محمد عبد الله", sealName: "Muhammad Abdullah" });
  assert.deepEqual(
    [sealed.mark.name, sealed.facts[0].value],
    ["Muhammad Abdullah", "Muhammad Abdullah"],
  );
  const han = await colophon({ sealName: "衡阳" });
  assert.deepEqual([han.mark.name, han.facts[0].value], ["衡阳", "Yang HENG"]);
  // A note in a script no face draws is refused by Typst's PDF/A check, which names the character.
  await assert.rejects(
    colophon({ note: "تم" }),
    (error) =>
      error.code === "colophon_typst_error" &&
      /could not be displayed/u.test(error.problems[0].message),
  );
  const absent = path.join(await temporaryDirectory(t, "archpub-colophon-"), "typst");
  await assert.rejects(colophon({ typst: absent }), { code: "colophon_typst_missing" });
});

test("every language names the record's files on the page, and the signature only when there is one", () => {
  for (const locale of LOCALES) {
    const words = editionWordsOf(locale);
    for (const signed of [true, false]) {
      const note = words.colophonNote(signed);
      assert.match(note, /acceptance\.json/u, locale);
      assert.equal(note.includes("acceptance.sig"), signed, `${locale} ${signed}`);
      assert.match(note, /archpub verify/u, locale);
    }
  }
});
