import { insideLength } from "../../layout/measure.mjs";
import { POSTER } from "../tokens.mjs";
import {
  FAULTS,
  borderToward,
  cardsAt,
  compareRanks,
  drawFree,
  drawnRelations,
  headingOf,
  labelClearance,
  measureFree,
  middleOf,
  near,
  pairsOf,
  rankFree,
  tiesOf,
} from "./free.mjs";

/**
 * The radial figure: a view drawn round its centre, the part related to the most others, where the radial rule
 * (`plates.mjs`) takes the view or its author names the composition. The centre stands in the middle of the body; the
 * other parts stand round it on an ellipse as wide and as tall as the body allows, each the centre relates to joined
 * to it by a straight line at any slant, a spoke. A relation between two parts on the ellipse is a chord: straight
 * where it passes no card, or bent once outward, away from the centre, where it would pass one. The parts are ordered
 * round the ellipse so that its chords cross as few as they can and join neighbours; parts outside the repository
 * take the places at the ellipse's left and right ends, beyond the boundary, which encloses the centre and the parts
 * inside. A centre outside the repository cannot stand in the middle of a boundary that holds only the parts inside,
 * so a view whose ring holds such parts is not drawn round it. Its cards, labels and lines are sized, measured and
 * drawn as `free.mjs` does for any figure off the grid.
 */

const RADIAL = Object.freeze({
  /** How many orders of the ring, the fewest crossing chords first, are laid out at each step. */
  orders: 24,
  /**
   * The most orders of the ring weighed one by one: every order of a ring of up to ten parts. A larger ring starts
   * from the view's order and swaps two places while that lowers the order's cost.
   */
  weighed: 362_880,
  /** How far a bent chord's corner may stand out from the straight chord, as shares of the ring's height. */
  bends: Object.freeze([0.12, 0.2, 0.3, 0.45]),
});

/**
 * The part a radial figure is drawn round, and how the view's relations gather on it: the part related to the most
 * others, counting each other part once whichever way their relations run, then to the most relations, then the first
 * in the view. With it, the share of the view's other parts it relates to, the largest share any other part relates
 * to, and how many of its relations go out from it and come into it. Null for a view of fewer than three parts, which
 * has no ring. Read from the view's parts and relations alone, it is the same in every language.
 * @param {import("../../plan/views.mjs").View} view
 */
export function ringOf(view) {
  const ids = view.components.map(({ id }) => id);
  if (ids.length < 3) return null;
  const relations = drawnRelations(view);
  const ties = tiesOf(ids, relations);
  const of = (/** @type {string} */ id) => /** @type {Map<string, number>} */ (ties.get(id));
  const score = (/** @type {string} */ id) => [
    of(id).size,
    [...of(id).values()].reduce((sum, count) => sum + count, 0),
  ];
  let centre = ids[0];
  for (const id of ids) if (compareRanks(score(centre), score(id)) < 0) centre = id;
  const ring = ids.filter((id) => id !== centre);
  return {
    centre,
    ring,
    share: of(centre).size / ring.length,
    second: Math.max(...ring.map((id) => of(id).size)) / ring.length,
    out: relations.filter(({ from }) => from === centre).length,
    into: relations.filter(({ to }) => to === centre).length,
    ties: (/** @type {string} */ a, /** @type {string} */ b) => of(a).get(b) ?? 0,
  };
}

/**
 * The cost of one order of the ring: chords crossing each other, then spokes a chord passes, then the chords' length
 * round the ring, each chord taking the shorter way.
 * @param {string[]} order
 * @param {Array<[string, string]>} chords
 * @param {Set<string>} spoked
 */
function costOf(order, chords, spoked) {
  const m = order.length;
  const place = new Map(order.map((id, index) => [id, index]));
  const spans = chords.map(([a, b]) => {
    const [i, j] = [/** @type {number} */ (place.get(a)), /** @type {number} */ (place.get(b))];
    return [Math.min(i, j), Math.max(i, j)];
  });
  let crossings = 0;
  for (let x = 0; x < spans.length; x += 1)
    for (let y = x + 1; y < spans.length; y += 1) {
      const [[a, b], [c, d]] = [spans[x], spans[y]];
      if (a === c || a === d || b === c || b === d) continue;
      if ((a < c && c < b) !== (a < d && d < b)) crossings += 1;
    }
  let spokes = 0;
  let length = 0;
  for (const [i, j] of spans) {
    const inner = j - i - 1;
    const outer = m - (j - i) - 1;
    const between =
      inner <= outer ? order.slice(i + 1, j) : [...order.slice(j + 1), ...order.slice(0, i)];
    spokes += between.filter((id) => spoked.has(id)).length;
    length += Math.min(inner, outer) + 1;
  }
  return [crossings, spokes, length];
}

/**
 * Every order of some parts with the first fixed, as a ring is the same turned round.
 * @param {string[]} parts
 */
function* ringOrders(parts) {
  const [first, ...rest] = parts;
  const permute = function* (/** @type {string[]} */ left, /** @type {string[]} */ taken) {
    if (!left.length) {
      yield [first, ...taken];
      return;
    }
    for (let index = 0; index < left.length; index += 1)
      yield* permute([...left.slice(0, index), ...left.slice(index + 1)], [...taken, left[index]]);
  };
  yield* permute(rest, []);
}

/**
 * The orders of the ring a plate weighs, best first by `costOf`: every order where they are few enough to weigh
 * (`RADIAL.weighed`), the best `RADIAL.orders` of them kept; for a larger ring, the view's order improved by swapping
 * two places while that lowers its cost.
 * @param {string[]} ring
 * @param {Array<[string, string]>} chords the pairs of ring parts related to each other
 * @param {Set<string>} spoked the ring parts the centre relates to
 */
function bestOrders(ring, chords, spoked) {
  let orders = 1;
  for (let count = 2; count < ring.length; count += 1) orders *= count;
  if (orders > RADIAL.weighed) {
    let order = [...ring];
    let cost = costOf(order, chords, spoked);
    for (let better = true; better;) {
      better = false;
      for (let i = 1; i < order.length; i += 1)
        for (let j = i + 1; j < order.length; j += 1) {
          const swapped = [...order];
          [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
          const lower = costOf(swapped, chords, spoked);
          if (compareRanks(lower, cost) < 0) [order, cost, better] = [swapped, lower, true];
        }
    }
    return [order];
  }
  /** @type {Array<{ order: string[], cost: number[] }>} */
  const kept = [];
  for (const order of ringOrders(ring)) {
    const cost = costOf(order, chords, spoked);
    if (kept.length >= RADIAL.orders && compareRanks(cost, kept[kept.length - 1].cost) >= 0)
      continue;
    kept.push({ order, cost });
    kept.sort((a, b) => compareRanks(a.cost, b.cost));
    if (kept.length > RADIAL.orders) kept.pop();
  }
  return kept.map(({ order }) => order);
}

/**
 * The ring laid out at one type step in one order and one turn, in a field at the origin: the centre in the middle, the
 * ring's cards round it, the spokes, the chords, their arrows, labels and the boundary; or the fault that stops it
 * (`FAULTS`). The frame keeps the grid's row padding from the field's edges, which holds its name's tab above it; a
 * label stands where `labelClearance` admits it.
 * @param {NonNullable<ReturnType<typeof cardsAt>>} cards
 * @param {NonNullable<ReturnType<typeof ringOf>>} plan
 * @param {string[]} order the ring's parts, clockwise from the place at `start`
 * @param {number} start the angle of the first place, in radians from the right, clockwise
 * @param {any[]} relations
 * @param {{ width: number, height: number }} field
 * @param {string} name the boundary's name
 */
function layoutRadial(cards, plan, order, start, relations, field, name) {
  const { sizes, metrics, label, outside } = cards;
  const { spacing, wire } = metrics;
  const { width: W, height: H } = field;
  const parts = [plan.centre, ...order];
  const bounded = parts.some(outside) && parts.some((id) => !outside(id));
  // A centre outside the repository would stand inside the boundary that encloses only the parts inside it, or be
  // moved out of the middle: either way the figure would not tell the truth, so it is not drawn.
  if (bounded && outside(plan.centre)) return { fault: "boundary" };
  const edge = bounded ? spacing.rowPad : 0;
  const head = bounded ? edge + spacing.boundaryPad + spacing.boundaryHead : 0;
  const foot = bounded ? edge + spacing.boundaryBottom : 0;
  const size = (id) => /** @type {{ width: number, height: number }} */ (sizes.get(id));
  /** @type {Map<string, { x: number, y: number, width: number, height: number }>} */
  const boxes = new Map();
  const middle = size(plan.centre);
  const [cx, cy] = [W / 2, (head + H - foot) / 2];
  boxes.set(plan.centre, { x: cx - middle.width / 2, y: cy - middle.height / 2, ...middle });
  // The ellipse as large as the field holds the ring's widest and tallest cards round it.
  const a = W / 2 - Math.max(...order.map((id) => size(id).width)) / 2;
  const b = (H - head - foot) / 2 - Math.max(...order.map((id) => size(id).height)) / 2;
  if (a <= middle.width / 2 || b <= middle.height / 2) return { fault: "cards" };
  order.forEach((id, index) => {
    const angle = start + (2 * Math.PI * index) / order.length;
    const card = size(id);
    const margin = bounded && !outside(id) ? edge + spacing.boundaryPad : 0;
    const [x, y] = [cx + a * Math.cos(angle), cy + b * Math.sin(angle)];
    boxes.set(id, {
      x: Math.min(W - margin - card.width, Math.max(margin, x - card.width / 2)),
      y: Math.min(H - foot - card.height, Math.max(head, y - card.height / 2)),
      ...card,
    });
  });
  // Cards keep apart by at least the least distance between two lines.
  const all = [...boxes.values()];
  for (let i = 0; i < all.length; i += 1)
    for (let j = i + 1; j < all.length; j += 1)
      if (near(all[i], all[j], spacing.separation)) return { fault: "cards" };
  /** @type {{ x: number, y: number, width: number, height: number, name: string } | null} */
  let boundary = null;
  if (bounded) {
    const inside = [...boxes].filter(([id]) => !outside(id)).map(([, box]) => box);
    const left = Math.min(...inside.map((box) => box.x)) - spacing.boundaryPad;
    const right = Math.max(...inside.map((box) => box.x + box.width)) + spacing.boundaryPad;
    const upper =
      Math.min(...inside.map((box) => box.y)) - spacing.boundaryPad - spacing.boundaryHead;
    const lower = Math.max(...inside.map((box) => box.y + box.height)) + spacing.boundaryBottom;
    boundary = { x: left, y: upper, width: right - left, height: lower - upper, name };
    // A part outside within the frame moves out across it, to the side its place on the ring is on, and stands as
    // far from the frame as the frame stands from the cards it encloses.
    for (const [id, box] of boxes) {
      if (!outside(id) || !near(box, boundary, spacing.boundaryPad)) continue;
      box.x =
        box.x + box.width / 2 < cx
          ? left - spacing.boundaryPad - box.width
          : right + spacing.boundaryPad;
      if (box.x < 0 || box.x + box.width > W || near(box, boundary, spacing.boundaryPad - 1))
        return { fault: "boundary" };
    }
  }

  // The lines: each relation with the centre a spoke, each other a chord; two relations of one pair side by side.
  const clear = (/** @type {number[][]} */ points, /** @type {string[]} */ joined) =>
    points
      .slice(1)
      .every((point, index) =>
        [...boxes].every(
          ([id, box]) => joined.includes(id) || insideLength(points[index], point, box) <= 0,
        ),
      );
  /** @type {Array<{ relation: any, points: number[][], spoke: boolean }>} */
  const lines = [];
  for (const group of pairsOf(relations).values())
    group.forEach((relation, index) => {
      const offset = (index - (group.length - 1) / 2) * spacing.separation;
      const [from, to] = [
        /** @type {any} */ (boxes.get(relation.from)),
        /** @type {any} */ (boxes.get(relation.to)),
      ];
      const spoke = relation.from === plan.centre || relation.to === plan.centre;
      // One side of the line between the pair for one relation, whichever way it runs.
      const sign = relation.from < relation.to ? 1 : -1;
      const joined = [relation.from, relation.to];
      let points = [
        borderToward(from, middleOf(to), sign * offset),
        borderToward(to, middleOf(from), -sign * offset),
      ];
      if (!spoke && !clear(points, joined)) {
        // One bend outward, away from the centre, at the first height that clears every card.
        const [mx, my] = [
          (middleOf(from)[0] + middleOf(to)[0]) / 2,
          (middleOf(from)[1] + middleOf(to)[1]) / 2,
        ];
        const length = Math.hypot(mx - cx, my - cy) || 1;
        for (const share of RADIAL.bends) {
          const corner = [
            mx + ((mx - cx) / length) * share * H,
            my + ((my - cy) / length) * share * H,
          ];
          const bent = [
            borderToward(from, corner, sign * offset),
            corner,
            borderToward(to, corner, -sign * offset),
          ];
          if (
            corner[0] >= 0 &&
            corner[0] <= W &&
            corner[1] >= 0 &&
            corner[1] <= H &&
            clear(bent, joined)
          ) {
            points = bent;
            break;
          }
        }
      }
      lines.push({ relation, points, spoke });
    });
  const paths = lines.map(({ relation, points }) => ({ relations: [relation], points }));
  const arrows = lines.map(({ relation, points }) => {
    const [before, last] = points.slice(-2);
    return { relations: [relation], x: last[0], y: last[1], direction: headingOf(before, last) };
  });

  // The labels: on their own line, spokes first and the steepest first. A label is wider than it is tall, so on a
  // steep spoke it stands across the fan of spokes, and on a body wider than it is tall a steep spoke is also the
  // shorter: its label has the least room. A spoke's label goes toward its ring end, where the spokes stand furthest
  // apart.
  /** @type {any[]} */
  const labels = [];
  /** @type {string[]} */
  const unplaced = [];
  const placed = labelClearance(field, spacing, { marks: all, lines, boundary, labels });
  const slope = ({ points }) =>
    Math.abs(points[1][1] - points[0][1]) / (Math.abs(points[1][0] - points[0][0]) + 1);
  const ordered = [...lines].sort(
    (x, y) => Number(y.spoke) - Number(x.spoke) || slope(y) - slope(x),
  );
  for (const { relation, points, spoke } of ordered) {
    if (!relation.label) continue;
    const box = label(relation);
    const shares = !spoke
      ? [0.5, 0.35, 0.65, 0.25, 0.75]
      : relation.from === plan.centre
        ? [0.6, 0.5, 0.7, 0.4, 0.78, 0.3, 0.85]
        : [0.4, 0.5, 0.3, 0.6, 0.22, 0.7, 0.15];
    const candidates = points.slice(1).flatMap((q, index) => {
      const p = points[index];
      return shares.map((share) => ({
        x: p[0] + (q[0] - p[0]) * share - box.width / 2,
        y: p[1] + (q[1] - p[1]) * share - box.height / 2,
        width: box.width,
        height: box.height,
      }));
    });
    const found = candidates.find((candidate) => placed(candidate, relation, points));
    if (!found) unplaced.push(relation.id);
    labels.push({ relations: [relation], ...(found ?? candidates[0]), lines: box.lines });
  }
  return { cards: boxes, paths, arrows, labels, boundary, arrow: wire.arrow, unplaced };
}

/**
 * The radial figures a plate may draw of a view in a field round its centre (`ringOf`), best first by `rankFree`, and,
 * where none is drawn, the furthest fault (`FAULTS`) any of its layouts came to. At each type step from the largest
 * down to the first that draws one: the best orders of its ring (`bestOrders`), each read both ways round and turned
 * so that its parts outside stand nearest the ellipse's ends, or from two starts where it has none; the best of that
 * step then with its cards' details, where they fit.
 * @param {{ model: any, typefaces: any, icons: any, style: any }} scene
 * @param {import("../../plan/views.mjs").View} view
 * @param {{ width: number, height: number }} field
 * @param {NonNullable<ReturnType<typeof ringOf>>} plan
 */
export function rings(scene, view, field, plan) {
  const relations = drawnRelations(view);
  const name = scene.model.repository?.name ?? scene.model.title;
  const spoked = new Set(plan.ring.filter((id) => plan.ties(id, plan.centre)));
  /** @type {Map<string, [string, string]>} */
  const chords = new Map();
  for (const { from, to } of relations)
    if (from !== plan.centre && to !== plan.centre)
      chords.set([from, to].sort().join("\u0000"), [from, to]);
  const orders = bestOrders(plan.ring, [...chords.values()], spoked);
  const m = plan.ring.length;
  let furthest = 0;
  const reached = (/** @type {string} */ fault) => {
    furthest = Math.max(furthest, FAULTS.indexOf(fault));
  };
  const turns = (/** @type {string[]} */ order, /** @type {(id: string) => boolean} */ outside) => {
    const all = [order, [order[0], ...order.slice(1).reverse()]].flatMap((way) =>
      way.flatMap((_, shift) => {
        const turned = [...way.slice(shift), ...way.slice(0, shift)];
        return [-Math.PI / 2, -Math.PI / 2 + Math.PI / m].map((start) => ({
          order: turned,
          start,
          ends: turned.reduce(
            (sum, id, place) =>
              sum + (outside(id) ? Math.abs(Math.sin(start + (2 * Math.PI * place) / m)) : 0),
            0,
          ),
        }));
      }),
    );
    const least = Math.min(...all.map(({ ends }) => ends));
    // Without parts outside every turn reads alike up to its start: two starts of one turn are enough.
    return view.components.some(({ id }) => outside(id))
      ? all.filter(({ ends }) => ends <= least + 1e-9)
      : all.slice(0, 2);
  };
  const atStep = (/** @type {number} */ index, /** @type {boolean} */ details, only = null) => {
    const cards = cardsAt(scene, view, index, details);
    if (!cards) {
      reached("cards");
      return [];
    }
    const found = [];
    for (const turn of only ? [only] : orders.flatMap((order) => turns(order, cards.outside))) {
      const layout = layoutRadial(cards, plan, turn.order, turn.start, relations, field, name);
      if (layout.fault !== undefined) {
        reached(layout.fault);
        continue;
      }
      const measured = measureFree(layout);
      if (measured.fault) reached(measured.fault);
      else found.push({ cards, layout, measured, turn });
    }
    const fewest = Math.min(...found.map(({ measured }) => measured.crossings));
    const drawn = [];
    for (const candidate of found
      .filter(({ measured }) => measured.crossings === fewest)
      .slice(0, 12)) {
      const figure = drawFree(scene, view, candidate.cards, candidate.layout, field);
      if (figure.fault) reached(figure.fault);
      else drawn.push({ ...candidate, drawn: figure });
    }
    return drawn;
  };
  for (let index = POSTER.steps.length - 1; index >= 0; index -= 1) {
    const compact = atStep(index, false);
    if (!compact.length) continue;
    const [best] = compact.sort((x, y) => compareRanks(rankFree(x), rankFree(y)));
    const detailed = view.components.some((component) => component.details.length)
      ? atStep(index, true, best.turn)
      : [];
    const figures = [...compact, ...detailed].sort((x, y) =>
      compareRanks(rankFree(x), rankFree(y)),
    );
    return { figures, fault: null };
  }
  return { figures: [], fault: FAULTS[furthest] };
}
