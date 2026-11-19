import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { editionRecord } from "../../src/edition/record.mjs";
import { childEnvironment } from "../../src/environment.mjs";
import { loadIcons } from "../../src/icons.mjs";
import { CJK, STAGED, stage } from "../../src/overview/typeset.mjs";
import { verifySupply } from "../../src/supply.mjs";
import { recordFacts } from "./record-facts.mjs";

const run = promisify(execFile);
const icons = await loadIcons();
const REVISION = "a".repeat(40);
const SHAPES =
  '<svg xmlns="http://www.w3.org/2000/svg" width="2256" height="1071" viewBox="0 0 2256 1071">' +
  '<rect x="20" y="20" width="300" height="80" rx="8" fill="#fbfaf6" stroke="#d6d1c4"/></svg>';

/**
 * A plate as the engine draws one, of the components it shows: a card's shape and one run a component, each wide
 * enough for any short name, so that no typeface is loaded to measure it.
 * @param {number} page
 * @param {readonly string[]} [components] the ids of the components the plate draws
 */
export function plateOf(page, components = ["a"]) {
  return {
    page,
    views: [`view-${page}`],
    width: 2256,
    share: 1,
    reading: "none",
    title: `View ${page}`,
    question: `What does view ${page} show?`,
    svg: SHAPES,
    runs: components.map((component, index) => ({
      text: component,
      x: 40,
      baseline: 60 + 30 * index,
      size: 18,
      weight: 600,
      color: "#29372f",
      width: 900,
      component,
    })),
    legend: [{ label: "component", shape: "boundary" }],
  };
}

/**
 * The record of a model's edition as a build writes it, of the plates given.
 * @param {{ model: any, plates?: any[], facts?: ReturnType<typeof recordFacts>, overview?: boolean }} input
 */
export const recordOf = ({
  model,
  plates = [],
  facts = recordFacts({ date: "2026-11-06" }),
  overview = Boolean(model.overview),
}) =>
  editionRecord({
    model,
    plates,
    icons,
    facts,
    publisher: "0.10.1",
    typst: "0.15.1",
    overview,
    page: `${model.id}.html`,
    time: 1793918078,
  });

/**
 * What the edition's pages set, read back from Typst: the number of pages, each outlined page by its label, every
 * text box with the page it stands on and the place of the box that holds it, every link with where it leads (a
 * page, a label or an address), the rules over the blocks of the contents' first page, the rule that closes the
 * contents' rows, and the rule that closes the index's parts.
 */
export const SET = `(
  pages: query(<archpub-end>).first().location().page(),
  outlined: query(heading.where(outlined: true)).map(it => (str(it.label), it.location().page())),
  boxes: query(<archpub-box>).map(it => (page: it.location().page(), left: it.location().position().x.pt(),
    top: it.location().position().y.pt(), ..it.value)),
  links: query(link).map(it => (page: it.location().page(),
    to: if type(it.dest) == label { str(it.dest) } else if type(it.dest) == location { it.dest.page() } else { it.dest })),
  rules: query(<archpub-front-rule>).map(it => (page: it.location().page(), left: it.location().position().x.pt(),
    top: it.location().position().y.pt(), length: repr(it.length))),
  ends: query(<archpub-contents-end>).map(it => (page: it.location().page(), left: it.location().position().x.pt(),
    top: it.location().position().y.pt(), length: repr(it.length))),
  indexEnds: query(<archpub-index-end>).map(it => (page: it.location().page(), left: it.location().position().x.pt(),
    top: it.location().position().y.pt(), length: repr(it.length))),
)`;

/**
 * Stage a model's edition as the publisher typesets it, the overview drawn from its statement where the model
 * states one, and evaluate an expression of the typeset document: what the house class records, read back from
 * Typst. A page the class refuses rejects with Typst's own words in `stderr`.
 * @param {import("node:test").TestContext} t
 * @param {Parameters<typeof recordOf>[0]} input
 * @param {string} expression a Typst expression, such as `query(<archpub-box>).map(it => it.value)`
 */
export async function evalEdition(t, input, expression) {
  const staged = await stage(Buffer.from(JSON.stringify(input.model)));
  t.after(() => fs.rm(staged.root, { recursive: true, force: true }));
  const own = path.join(staged.root, STAGED);
  await fs.writeFile(path.join(own, "edition.json"), JSON.stringify(recordOf(input)));
  await fs.mkdir(path.join(own, "plates"));
  for (const plate of input.plates ?? [])
    await fs.writeFile(
      path.join(own, "plates", `${String(plate.page).padStart(2, "0")}.svg`),
      plate.svg,
    );
  const entry = path.join(own, "edition.typ");
  await fs.writeFile(
    entry,
    [
      '#import "house.typ": edition',
      '#import "drawn.typ": drawn',
      '#let r = json("edition.json")',
      '#let stated = json("model.json").at("overview", default: none)',
      "#let numbers = r.plates.map(p => p.views.map(v => (v, p.number))).sum(default: ()).to-dict()",
      "#edition(r, overview: if stated == none { none } else { drawn(stated, written-from: r.words.writtenFrom, plates: numbers) })",
      "",
    ].join("\n"),
  );
  const [house, fonts] = await Promise.all([verifySupply("house"), verifySupply("fonts")]);
  const { stdout } = await run(
    "typst",
    [
      "eval",
      expression,
      "--in",
      entry,
      "--root",
      staged.root,
      "--ignore-system-fonts",
      "--ignore-embedded-fonts",
      "--font-path",
      house.root,
      "--font-path",
      path.join(fonts.root, CJK),
      "--input",
      "edition=true",
      "--input",
      `revision=${REVISION}`,
      "--input",
      "date=2026-11-06",
      "--format",
      "json",
    ],
    { cwd: staged.root, env: childEnvironment({}), maxBuffer: 64 * 1024 * 1024, timeout: 100_000 },
  );
  return JSON.parse(stdout);
}
