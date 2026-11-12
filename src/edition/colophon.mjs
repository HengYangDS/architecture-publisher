import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { childEnvironment } from "../environment.mjs";
import { requireOverviewGlyphs } from "../overview/glyphs.mjs";
import { CJK, STAGED, stage, typstProblems, typstVersion } from "../overview/typeset.mjs";
import { refuse } from "../refusal.mjs";
import { verifySupply } from "../supply.mjs";
import { editionWordsOf } from "./words.mjs";

/**
 * The colophon page of an accepted delivery: the house class sets the acceptance mark and the record's facts on one
 * page in the edition's size and language, with the pinned Typst in the same sealed root as the edition, so the page
 * is the same bytes whenever the same acceptance is set again.
 */

const run = promisify(execFile);
const PAGE = fileURLToPath(new URL("./colophon.typ", import.meta.url));

/** The characters of a text that no face Typst may use draws, as the overview's own check finds them. */
async function undrawn(text) {
  const missing = [];
  for (const character of new Set(Array.from(text))) {
    try {
      await requireOverviewGlyphs([{ text: character, x: 0, y: 0 }]);
    } catch (error) {
      if (/** @type {any} */ (error).code !== "overview_glyph_missing") throw error;
      missing.push(character);
    }
  }
  return missing;
}

const round = (value) => Math.round(value * 100) / 100;

/**
 * Where the ring thins: one bite in each quarter of the ring, its angle, span in degrees and depth read from
 * successive bytes of the manifest's digest.
 * @param {string} digest the manifest's SHA-256 in hexadecimal
 */
function wearOf(digest) {
  const bytes = Buffer.from(digest, "hex");
  return [0, 1, 2, 3].map((quarter) => [
    round(quarter * 90 + (bytes[3 * quarter] / 256) * 90),
    round(8 + (bytes[3 * quarter + 1] / 255) * 20),
    round(0.5 + (bytes[3 * quarter + 2] / 255) * 0.5),
  ]);
}

/**
 * Typeset the colophon page of an accepted delivery. The mark sets the seal name, or else the reviewer's name; the
 * facts name the reviewer, or the seal name when no house face draws the reviewer's name. A name no face draws is
 * refused, since Typst would set it as empty boxes.
 * @param {{ locale: string, title: string, revision: string | null, release: string | null, date: string | null,
 *   reviewer: string, sealName: string | null, acceptedAt: string, manifest: string, signer: string | null,
 *   typst?: string }} input
 */
export async function typesetColophon(input) {
  const words = editionWordsOf(input.locale);
  const name = input.sealName ?? input.reviewer;
  const missing = await undrawn(name);
  if (missing.length)
    refuse(
      "acceptance_name_unset",
      `No house face draws ${missing.join(" ")} of ${JSON.stringify(name)}; give the mark a name the faces draw with --seal-name.`,
    );
  const reviewer =
    input.sealName && (await undrawn(input.reviewer)).length ? input.sealName : input.reviewer;
  const typst = input.typst ?? "typst";
  await typstVersion(typst, "colophon");
  const time = new Date(input.acceptedAt);
  const date = input.acceptedAt.slice(0, 10);
  // The rim sets the word in capitals, as the edition sets its labels.
  const word = words.accepted.toLocaleUpperCase(input.locale);
  const short = input.revision ? input.revision.slice(0, 7) : null;
  const record = {
    locale: input.locale,
    title: `${words.colophon}: ${input.title}`,
    author: [input.reviewer],
    time: [
      time.getUTCFullYear(),
      time.getUTCMonth() + 1,
      time.getUTCDate(),
      time.getUTCHours(),
      time.getUTCMinutes(),
      time.getUTCSeconds(),
    ],
    words: { edition: words.edition, colophon: words.colophon, note: words.colophonNote },
    mark: { word, date, name, chips: wearOf(input.manifest), alt: `${word} ${date}: ${name}` },
    facts: [
      { label: words.reviewer, value: reviewer },
      { label: words.acceptedOn, value: `${date} ${input.acceptedAt.slice(11, 19)} UTC` },
      {
        label: words.subject,
        value: `${input.title}${input.release ? ` ${input.release}` : ""}${short ? ` · ${short}` : ""}`,
      },
      { label: words.manifest, value: input.manifest },
      { label: words.signature, value: input.signer ?? words.unsigned },
    ],
    foot: short ? words.foot(input.title, input.release, short, input.date) : input.title,
  };
  const [house, fonts] = await Promise.all([verifySupply("house"), verifySupply("fonts")]);
  // The class reads a model when it is imported; the colophon page sets none of it.
  const staged = await stage(null, Buffer.from("{}"));
  const out = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-colophon-out-"));
  try {
    const own = path.join(staged.root, STAGED);
    await fs.copyFile(PAGE, path.join(own, "colophon.typ"));
    await fs.writeFile(path.join(own, "colophon.json"), JSON.stringify(record));
    const roots = [staged.root, await fs.realpath(staged.root)];
    const file = path.join(out, "colophon.pdf");
    const pending = run(
      typst,
      [
        "compile",
        "--root",
        staged.root,
        "--ignore-system-fonts",
        "--ignore-embedded-fonts",
        "--font-path",
        house.root,
        "--font-path",
        path.join(fonts.root, CJK),
        "--creation-timestamp",
        String(Math.floor(time.getTime() / 1000)),
        "--pdf-standard",
        "a-3a,ua-1",
        path.join(own, "colophon.typ"),
        file,
      ],
      {
        cwd: staged.root,
        env: childEnvironment({ TYPST_PACKAGE_PATH: out, TYPST_PACKAGE_CACHE_PATH: out }),
        maxBuffer: 16 * 1024 * 1024,
        timeout: 300_000,
      },
    );
    pending.child.stdin?.end();
    // A refusal of the class, such as a name too long for the band, fails the run with Typst's diagnostics.
    const result = await pending.catch((/** @type {any} */ error) => {
      if (typeof error.stderr !== "string") throw error;
      return error;
    });
    const problems = typstProblems(result.stderr, roots, "colophon");
    if (problems.length)
      refuse(problems[0].code, "Typst did not typeset the colophon page cleanly.", problems);
    if (result instanceof Error) throw result;
    return { pdf: await fs.readFile(file), mark: record.mark, facts: record.facts };
  } finally {
    await fs.rm(staged.root, { recursive: true, force: true });
    await fs.rm(out, { recursive: true, force: true });
  }
}
