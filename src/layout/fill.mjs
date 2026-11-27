import { Refusal, refuse } from "../refusal.mjs";

/**
 * The fill of the tiers figure (docs/research/tiers-fill.md): what a plate draws into the blank its rows of cards
 * leave. It acts after placement has set the cards on their column lattice and before anything is wired, so the
 * router draws the wires to the cards it moved as it draws any other.
 *
 * - The band: a lone card of the figure's first or last row whose kind may span the figure (`spans` in
 *   src/categories.json: a thing outside the code that parts use), and to which at least the band's share of the
 *   cards of its neighbouring row relate, is drawn across the whole figure, from the left edge of the leftmost other
 *   card to the right edge of the rightmost. Each wire to it from its neighbouring row enters straight at its other
 *   end's column, and a bus into it is drawn as single wires; a relation from further away enters where its route
 *   reaches it. Its text stays set in its own column's width at its left, so its caption takes the form the other
 *   cards' take.
 * - Justify: each row of two or more cards is spread across the figure's width, its first and last card at its
 *   insets and equal gaps between, in the order placement gave them. A row that mixes outside and inside parts
 *   keeps its places, since one boundary must still enclose its inside parts alone.
 * - The guard: a figure keeps its bands only where they wire no worse than the same figure drawn plain, and a plate
 *   only where its figure wires no worse than the plate drawn plain (src/poster/compose/plates.mjs).
 * - The boundary: a filled figure whose system boundary would enclose a `person` card or an outside system is not drawn.
 */

/**
 * The band's rule: the least share of the cards of its neighbouring row that relate to a lone end card for it to
 * span the figure. Decided on 2026-11-27 by the owner's delegate, on a committee of three, and measured over the 65
 * plates of the twelve published editions drawn as tiers (docs/research/tiers-fill.md).
 */
const BAND = Object.freeze({ share: 0.5 });

/**
 * The cards of a figure that the band's rule draws across it: each lone card of its first or last row whose kind
 * may span the figure and to which at least the band's share of its neighbouring row relate, either way.
 * @param {ReadonlyArray<readonly string[]>} rows the ids of each row's cards, from the top
 * @param {ReadonlyArray<{ from: string, to: string }>} relations
 * @param {(id: string) => boolean} spans whether a card's kind may span the figure
 * @returns {string[]}
 */
export function bandsOf(rows, relations, spans) {
  if (rows.length < 2) return [];
  return [...new Set([0, rows.length - 1])].flatMap((index) => {
    const [id, ...others] = rows[index];
    if (others.length || !spans(id)) return [];
    const neighbours = rows[index ? index - 1 : 1];
    const related = neighbours.filter((other) =>
      relations.some(
        ({ from, to }) => (from === id && to === other) || (from === other && to === id),
      ),
    );
    return related.length >= BAND.share * neighbours.length ? [id] : [];
  });
}

/**
 * A figure with its bands where they wire no worse, the guard of the fill: a figure whose bands give it more
 * crossings or more route defects than the same figure drawn plain, or which cannot be drawn at all, is drawn plain
 * and names the bands it gave up as `unbanded`. A justified figure keeps the bands it is drawn with: it answers to
 * the terms its plate takes it on (`takesJustified`, src/poster/compose/gates.mjs).
 * @template {{ measures: { crossings: number, routes: number } }} L
 * @param {(bands: string[]) => L} draw the figure drawn with the bands given
 * @param {string[]} bands the cards the band's rule draws across it
 * @param {boolean} justify
 * @returns {L & { unbanded?: string[] }}
 */
export function keptBands(draw, bands, justify) {
  if (!bands.length || justify) return draw(bands);
  let banded;
  try {
    banded = draw(bands);
  } catch (error) {
    if (error instanceof Refusal) return { ...draw([]), unbanded: bands };
    throw error;
  }
  let plain;
  try {
    plain = draw([]);
  } catch (error) {
    if (error instanceof Refusal) return banded;
    throw error;
  }
  return wiresNoMore(banded.measures, plain.measures) ? banded : { ...plain, unbanded: bands };
}

/**
 * Whether a figure wires no worse than another: no more crossings and no more route defects. A fill is kept on it,
 * per figure and per plate, and it is one of the terms a plate takes a justified figure on.
 * @param {{ crossings: number, routes: number }} figure
 * @param {{ crossings: number, routes: number }} other
 */
export function wiresNoMore(figure, other) {
  return figure.crossings <= other.crossings && figure.routes <= other.routes;
}

/**
 * Move a figure's cards as its fill draws them, in place: its rows justified where it asks for them, then its bands
 * across the cards as they then stand. A band keeps, as `content`, the width its text is set in; a card the rest of
 * the figure is no wider than, as in a figure one column wide, stays a card.
 * @param {{ order: string[][], box: Map<string, { x: number, cx: number, width: number, content?: number }>,
 *   external: (id: string) => boolean, bands: readonly string[], justify: boolean, contentWidth: number,
 *   inset: number }} input
 * @returns {string[]} the cards drawn as bands
 */
export function fillRows({ order, box, external, bands, justify, contentWidth, inset }) {
  const card = (/** @type {string} */ id) =>
    /** @type {{ x: number, cx: number, width: number }} */ (box.get(id));
  const place = (
    /** @type {string} */ id,
    /** @type {number} */ x,
    /** @type {number} */ width,
    /** @type {{ content?: number }} */ set = {},
  ) => box.set(id, { ...card(id), ...set, x, width, cx: x + width / 2 });
  if (justify)
    for (const members of order) {
      if (members.length < 2 || new Set(members.map(external)).size > 1) continue;
      const widths = members.map((id) => card(id).width);
      const spare = contentWidth - 2 * inset - widths.reduce((sum, width) => sum + width, 0);
      let x = inset;
      members.forEach((id, index) => {
        place(id, x, widths[index]);
        x += widths[index] + spare / (members.length - 1);
      });
    }
  return bands.filter((id) => {
    const own = card(id);
    const others = [...box].flatMap(([other, at]) => (other === id ? [] : [at]));
    const left = Math.min(...others.map(({ x }) => x));
    const right = Math.max(...others.map(({ x, width }) => x + width));
    if (right - left <= own.width) return false;
    place(id, left, right - left, { content: own.width });
    return true;
  });
}

/**
 * Refuse a filled figure whose system boundary would enclose an outside card. A band of one of the system's own
 * kinds, or a row of its own parts justified across the width, widens the boundary to its extent; where a `person`
 * card or an outside system of the boundary's rows stands within that, the figure is not drawn. The guard then
 * draws the figure plain (`keptBands`), and a plate drops a justified figure it cannot draw.
 * @param {string[][]} order the ids of each row's cards, from the top
 * @param {[number, number]} rows the first and last row the boundary encloses
 * @param {Map<string, { x: number, width: number }>} box
 * @param {(id: string) => boolean} external
 * @param {[number, number]} frame the boundary's left and right edges
 */
export function keepOutsideOut(order, [first, last], box, external, frame) {
  const enclosed = order.flatMap((members, row) =>
    row < first || row > last
      ? []
      : members
          .filter((id) => {
            const { x, width } = /** @type {{ x: number, width: number }} */ (box.get(id));
            return external(id) && x < frame[1] && x + width > frame[0];
          })
          .map((id) => ({
            code: /** @type {const} */ ("layout_boundary_unplaced"),
            path: `/rows/${row}`,
            message: id,
          })),
  );
  if (enclosed.length)
    refuse(
      "layout_boundary_unplaced",
      "The tiers figure's fill would bring outside components inside the system's boundary.",
      enclosed,
    );
}

/**
 * The wiring's classes with every bus whose hub is drawn as a band taken apart into single wires.
 * @template {{ buses: Array<{ hub: string, relations: any[] }>, singles: any[] }} T
 * @param {T} classes
 * @param {readonly string[]} bands
 * @returns {T}
 */
export function unbusBands(classes, bands) {
  if (!bands.length) return classes;
  const parted = classes.buses.filter(({ hub }) => bands.includes(hub));
  return {
    ...classes,
    buses: classes.buses.filter(({ hub }) => !bands.includes(hub)),
    singles: [...classes.singles, ...parted.flatMap(({ relations }) => relations)],
  };
}

/**
 * Where a long relation may pass the rows a fill justified off the lattice: midway between each two neighbouring
 * cards of the rows it passes.
 * @param {string[][]} rows the rows it passes
 * @param {Map<string, { x: number, width: number }>} box
 */
export function gapsBetween(rows, box) {
  return rows.flatMap((members) =>
    members.slice(1).map((id, index) => {
      const before = /** @type {{ x: number, width: number }} */ (box.get(members[index]));
      const after = /** @type {{ x: number, width: number }} */ (box.get(id));
      return (before.x + before.width + after.x) / 2;
    }),
  );
}
