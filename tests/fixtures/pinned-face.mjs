/**
 * A small work drawn three ways for the tests of a plate's data face: as strips in one complete view, as cards in one
 * complete view, and as strips in an overview with its group's view; the grouped work typeset as a small edition; and
 * the SHA-256 of every byte of them a reader sees.
 */
import { createHash } from "node:crypto";
import { editionRecord } from "../../src/edition/record.mjs";
import { typesetEdition } from "../../src/edition/typeset.mjs";
import { planViews } from "../../src/plan/views.mjs";
import { admitsView, composePlates } from "../../src/poster/compose/plates.mjs";
import { recordFacts } from "./record-facts.mjs";
import { INDIGO, PARTS, icons, platesIn, stripModel, stripStyle, typefaces } from "./strips.mjs";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const two = (number) => String(number).padStart(2, "0");

/** The small work's four stages as one group, so its overview draws the four relations into the supplies as one line. */
const GROUPED = Object.freeze({
  groups: [
    { id: "pipeline", label: "Pipeline", members: ["builder", "composer", "words", "record"] },
  ],
});

/** The small work in one complete view, drawn as strips. */
export async function stripWork() {
  const model = stripModel();
  const style = stripStyle();
  return { model, style, ...(await platesIn(model, style)) };
}

/** The small work in one complete view, drawn as cards in the house's tokens. */
export async function cardWork() {
  const model = stripModel();
  return { model, style: null, ...(await platesIn(model, undefined)) };
}

/**
 * The small work with its stages grouped, planned as a work too large for one view is: an overview, whose lines
 * stand for the relations between its group and the other parts, and the group's own view. Both are drawn as strips.
 */
export async function groupedWork() {
  const model = stripModel("en", GROUPED);
  const style = stripStyle(INDIGO, PARTS, model);
  const views = await planViews(model, async (view) =>
    view.origin === "complete"
      ? { fits: false, width: 0, height: 0 }
      : admitsView(model, view, typefaces, icons, style),
  );
  return { model, style, views, plates: composePlates(model, views, typefaces, icons, style) };
}

/** A view's statement set, as the plan put it in the view: an overview's line counts as the relations it stands for. */
const statementsOfView = (view) => ({
  components: view.components.filter(({ group }) => !group).map(({ id }) => id),
  groups: view.components.filter(({ group }) => group).map(({ id }) => id),
  relations: view.relations.flatMap((relation) => relation.relations ?? [relation.id]),
});

/** A face's statement set, as the drawing reported it. */
export const statementsOfFace = (face) => ({
  components: face.components.map(({ id }) => id),
  groups: face.groups.map(({ id }) => id),
  relations: face.relations.flatMap((relation) => relation.relations ?? [relation.id]),
});

/**
 * The ids on one side only of a view's statement set and its plate's face, by type: the small comparison these tests
 * hold a face to. The product's own stands with the data's invariants.
 */
export function differences(view, face) {
  const [planned, drawn] = [statementsOfView(view), statementsOfFace(face)];
  return Object.fromEntries(
    Object.keys(planned).flatMap((type) => {
      const undrawn = planned[type].filter((id) => !drawn[type].includes(id));
      const unplanned = drawn[type].filter((id) => !planned[type].includes(id));
      return undrawn.length || unplanned.length ? [[type, { undrawn, unplanned }]] : [];
    }),
  );
}

/** The image width the small edition is rendered at. */
export const IMAGE_WIDTH = 960;

/**
 * Typeset a work's plates as a small edition: a title page, the contents, the overview's page when a composition is
 * given, and one page for each plate, with one image of each page after the contents.
 * @param {{ model: any, style: { tokens: any } | null, plates: any[] }} work
 * @param {string | null} [composition] the path of an overview's composition
 */
export function typesetWork({ model, style, plates }, statement = null) {
  const time = 1_794_000_000;
  const record = editionRecord({
    model,
    plates,
    icons,
    facts: recordFacts({ date: "2026-11-10" }),
    modelSha256: "0".repeat(64),
    publisher: "0.0.0",
    typst: "0.0.0",
    overview: Boolean(statement),
    page: `${model.id}.html`,
    time,
  });
  return typesetEdition({
    record,
    plates,
    modelBytes: Buffer.from(JSON.stringify(statement ? { ...model, overview: statement } : model)),
    revision: null,
    date: "2026-11-10",
    time,
    widths: [IMAGE_WIDTH],
    ...(style ? { tokens: style.tokens } : {}),
  });
}

/**
 * The SHA-256 of what a reader sees of the works: each plate's shapes, its text runs and its key, and the typeset
 * edition's PDF and images.
 * @param {Record<string, { plates: any[] }>} works each work by a name
 * @param {{ work: string, pdf: Buffer, png: Array<{ file: string, bytes: Buffer }> }} typeset the edition of one of them
 * @returns {Record<string, string>}
 */
export function digestsOf(works, typeset) {
  /** @type {Record<string, string>} */
  const digests = {};
  for (const [name, { plates }] of Object.entries(works))
    for (const plate of plates) {
      const key = `${name}/${two(plate.page)}-${plate.views.join("+")}`;
      digests[`${key}.svg`] = sha256(plate.svg);
      digests[`${key}.runs`] = sha256(JSON.stringify(plate.runs));
      digests[`${key}.legend`] = sha256(JSON.stringify(plate.legend));
    }
  digests[`${typeset.work}/edition.pdf`] = sha256(typeset.pdf);
  for (const { file, bytes } of typeset.png) digests[`${typeset.work}/${file}`] = sha256(bytes);
  return digests;
}
