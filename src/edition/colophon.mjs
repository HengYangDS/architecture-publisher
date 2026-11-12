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
 * The colophon page of an accepted delivery: the house class sets the acceptance mark and the acceptance slip on one
 * page in the edition's size and language, with the pinned Typst in the same sealed root as the edition, so the page
 * is the same bytes whenever the same acceptance is set again.
 */

const run = promisify(execFile);
const PAGE = fileURLToPath(new URL("./colophon.typ", import.meta.url));
const round = (value) => Math.round(value * 100) / 100;

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

/**
 * The record the page is set from: the mark's word, date and name, and the slip's facts in the edition's language.
 * The slip names the reviewer, or the seal name when no house face draws the reviewer's own name.
 */
function colophonRecord(input, reviewer) {
  const words = editionWordsOf(input.locale);
  const time = new Date(input.acceptedAt);
  const date = input.acceptedAt.slice(0, 10);
  const name = input.sealName ?? input.reviewer;
  // The rim sets the word in capitals, as the edition sets its labels.
  const word = words.accepted.toLocaleUpperCase(input.locale);
  return {
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
    words: { edition: words.edition, colophon: words.colophon },
    mark: { word, date, name, alt: `${word} ${date}: ${name}` },
    facts: [
      { label: words.reviewer, value: reviewer },
      { label: words.acceptedAt, value: `${date} ${input.acceptedAt.slice(11, 19)} UTC` },
      { label: words.object, value: `${input.title}${input.release ? ` ${input.release}` : ""}` },
      ...(input.revision ? [{ label: words.commit, value: input.revision }] : []),
      { label: words.manifest, value: input.manifest },
      { label: words.signingKey, value: input.signer ?? words.unsigned },
      ...(input.note ? [{ label: words.note, value: input.note }] : []),
    ],
    scope: words.colophonScope,
    note: words.colophonNote(Boolean(input.signer)),
    foot: input.revision
      ? words.foot(input.title, input.release, input.revision.slice(0, 7), input.date)
      : input.title,
  };
}

/**
 * Typeset the colophon page of an accepted delivery. The mark sets the seal name, or else the reviewer's name. A name
 * no face draws is refused, since Typst would set it as empty boxes, and so is a name the class cannot fit inside
 * the mark's band, as Typst measured it.
 * @param {{ locale: string, title: string, revision: string | null, release: string | null, date: string | null,
 *   reviewer: string, sealName: string | null, note: string | null, acceptedAt: string, manifest: string,
 *   signer: string | null, typst?: string }} input
 */
export async function typesetColophon(input) {
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
  const record = colophonRecord(input, reviewer);
  const [house, fonts] = await Promise.all([verifySupply("house"), verifySupply("fonts")]);
  // The class reads a model when it is imported; the colophon page sets none of it.
  const staged = await stage(null, Buffer.from("{}"));
  const out = await fs.mkdtemp(path.join(os.tmpdir(), "archpub-colophon-out-"));
  try {
    const own = path.join(staged.root, STAGED);
    const entry = path.join(own, "colophon.typ");
    await fs.copyFile(PAGE, entry);
    await fs.writeFile(path.join(own, "colophon.json"), JSON.stringify(record));
    const roots = [staged.root, await fs.realpath(staged.root)];
    const common = [
      "--root",
      staged.root,
      "--ignore-system-fonts",
      "--ignore-embedded-fonts",
      "--font-path",
      house.root,
      "--font-path",
      path.join(fonts.root, CJK),
    ];
    const typeset = async (args) => {
      const pending = run(typst, [...args.slice(0, 1), ...common, ...args.slice(1)], {
        cwd: staged.root,
        env: childEnvironment({ TYPST_PACKAGE_PATH: out, TYPST_PACKAGE_CACHE_PATH: out }),
        maxBuffer: 16 * 1024 * 1024,
        timeout: 300_000,
      });
      pending.child.stdin?.end();
      // A failed run rejects with Typst's diagnostics, which name the problem as a successful run names a warning.
      const result = await pending.catch((/** @type {any} */ error) => error);
      const problems = typstProblems(`${result.stderr}`, roots, "colophon");
      if (problems.length)
        refuse(problems[0].code, "Typst did not typeset the colophon page cleanly.", problems);
      if (result instanceof Error) throw result;
      return result.stdout;
    };
    const [measured] = JSON.parse(
      await typeset([
        "eval",
        "query(<archpub-mark>).map(it => it.value)",
        "--in",
        entry,
        "--format",
        "json",
      ]),
    );
    const fit = Object.fromEntries(
      Object.entries(measured).map(([key, value]) => [key, key === "lines" ? value : round(value)]),
    );
    if (measured.width > measured.bandWidth || measured.height > measured.bandHeight)
      refuse(
        "acceptance_name_too_long",
        `${JSON.stringify(name)} does not fit the mark's band on two lines at ${fit.size} pt; give the mark a shorter name with --seal-name.`,
      );
    const file = path.join(out, "colophon.pdf");
    await typeset([
      "compile",
      "--creation-timestamp",
      String(Math.floor(new Date(input.acceptedAt).getTime() / 1000)),
      "--pdf-standard",
      "a-3a,ua-1",
      entry,
      file,
    ]);
    return {
      pdf: await fs.readFile(file),
      mark: record.mark,
      facts: record.facts,
      scope: record.scope,
      note: record.note,
      foot: record.foot,
      fit,
    };
  } finally {
    await fs.rm(staged.root, { recursive: true, force: true });
    await fs.rm(out, { recursive: true, force: true });
  }
}
