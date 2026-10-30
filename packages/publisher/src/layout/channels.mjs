import { refuse } from "../refusal.mjs";
/**
 * Wires between rows. Each channel between row g and row g + 1 holds, from top
 * to bottom: a stub, an upper band of horizontal tracks, label rows, a lower
 * band and an arrow stub. Every option for a wire names where each of its
 * verticals turns: in the upper band, on a label row, in the lower band or
 * nowhere.
 */

/**
 * @typedef {{ width: number, height: number, lines: Array<{ text: string, role: string }> }} LabelBox
 * @typedef {{ id: string | null, x: number, arrow: boolean, wire: Wire, toward: number }} End
 * @typedef {{ order: number, channel: number, type: string, relations: any[], label: LabelBox | null,
 *   corridor?: number, top: End[], bottom: End[] }} Wire
 * @typedef {{ id: string, x: number, width: number }} Beside
 * @typedef {{ index: number, wires: Wire[], edges?: number[],
 *   beside?: { upper: Beside[], lower: Beside[] } }} Channel
 */

/**
 * @typedef {{ relation: any, left: { x: number, width: number }, right: { x: number },
 *   label: LabelBox, fromLeft: boolean, row: number }} Straight
 */

/**
 * The relations between neighbours in a row that are drawn as one straight
 * arrow across the gap between them: one per gap, where the gap holds the
 * arrow's label and the row is tall enough for it.
 * @param {{ order: string[][], classes: any, box: Map<string, { x: number, cx: number, width: number }>,
 *   rowHeights: number[], spacing: any, label: (relation: any, maxWidth?: number) => LabelBox }} input
 * @returns {Straight[]}
 */
export function straightArrows(input) {
  const { order, classes, box, spacing } = input;
  const at = (id) => /** @type {{ x: number, cx: number, width: number }} */ (box.get(id));
  const gaps = new Set();
  const straights = [];
  for (const relation of classes.sameRow) {
    const row = classes.rowOf.get(relation.from);
    const [a, b] = [at(relation.from), at(relation.to)];
    const [left, right] = a.x < b.x ? [a, b] : [b, a];
    const neighbors =
      Math.abs(order[row].indexOf(relation.from) - order[row].indexOf(relation.to)) === 1;
    const gap = right.x - (left.x + left.width);
    const label = input.label(relation, Math.max(80, gap - 2 * spacing.clear));
    const key = `${row}:${left.x}`;
    if (
      neighbors &&
      !gaps.has(key) &&
      gap >= label.width + 2 * spacing.clear &&
      label.height <= input.rowHeights[row] - 16
    ) {
      gaps.add(key);
      straights.push({ relation, left, right, label, fromLeft: a === left, row });
    }
  }
  return straights;
}

/**
 * Build every wire, its ends and the card sides they use. Relations between
 * neighbours in a row that are not among `straights` take U wires.
 * @param {{ order: string[][], classes: any, box: Map<string, { x: number, cx: number, width: number }>, cardWidth: number,
 *   rowHeights: number[], contentWidth: number, columns: number, pitch: number, gridLeft: number, slots: number,
 *   frame: [number, number] | null, spacing: any, label: (relation: any, maxWidth?: number) => LabelBox,
 *   straights: Straight[], lanes?: boolean }} input `lanes` when the medium draws its own wires
 */
export function buildWires(input) {
  const { order, classes, box, straights } = input;
  const at = (id) => /** @type {{ x: number, cx: number, width: number }} */ (box.get(id));
  const rowCount = order.length;
  const channels = Array.from(
    { length: Math.max(0, rowCount - 1) },
    (_, index) => /** @type {Channel} */ ({ index, wires: [] }),
  );
  const sides = new Map();
  const wires = [];
  const passages = [];
  let sequence = 0;
  const wire = (channel, spec) => {
    const made = /** @type {Wire} */ ({ order: sequence++, channel, top: [], bottom: [], ...spec });
    // A view of one row routes its U wires through a trailing channel below the row.
    if (channel === channels.length) channels.push({ index: channel, wires: [] });
    channels[channel].wires.push(made);
    wires.push(made);
    return made;
  };
  const end = (made, where, id, toward, arrow = false) => {
    const point = { id, x: id ? at(id).cx : toward, arrow, wire: made, toward };
    made[where].push(point);
    if (id) {
      const key = `${id}:${where === "top" ? "bottom" : "top"}`;
      sides.set(key, [...(sides.get(key) ?? []), point]);
    }
  };
  for (const relation of classes.singles) {
    const down = classes.rowOf.get(relation.from) < classes.rowOf.get(relation.to);
    const [top, bottom] = down ? [relation.from, relation.to] : [relation.to, relation.from];
    const made = wire(classes.rowOf.get(top), {
      type: "single",
      relations: [relation],
      label: input.label(relation),
    });
    end(made, "top", top, at(bottom).cx, !down);
    end(made, "bottom", bottom, at(top).cx, down);
  }
  for (const bus of classes.buses) {
    const hubRow = classes.rowOf.get(bus.hub);
    const leafRow = classes.rowOf.get(bus.leaves[0]);
    const hubWhere = hubRow < leafRow ? "top" : "bottom";
    const made = wire(Math.min(hubRow, leafRow), {
      type: hubWhere === "top" ? "fan-down" : "fan-up",
      relations: bus.relations,
      label: input.label(bus.relations[0]),
    });
    const middle = bus.leaves.reduce((sum, id) => sum + at(id).cx, 0) / bus.leaves.length;
    end(made, hubWhere, bus.hub, middle, bus.type === "in");
    for (const leaf of bus.leaves)
      end(made, hubWhere === "top" ? "bottom" : "top", leaf, at(bus.hub).cx, bus.type === "out");
  }
  const straight = new Set(straights.map(({ relation }) => relation));
  for (const relation of classes.sameRow) {
    if (straight.has(relation)) continue;
    const row = classes.rowOf.get(relation.from);
    const [a, b] = [at(relation.from), at(relation.to)];
    const below = row < rowCount - 1 || rowCount === 1;
    const made = wire(below ? row : row - 1, {
      type: below ? "u-down" : "u-up",
      relations: [relation],
      label: input.label(relation),
    });
    end(made, below ? "top" : "bottom", relation.from, b.cx, false);
    end(made, below ? "top" : "bottom", relation.to, a.cx, true);
  }
  const taken = [];
  for (const relation of classes.long) {
    const down = classes.rowOf.get(relation.from) < classes.rowOf.get(relation.to);
    const [top, bottom] = down ? [relation.from, relation.to] : [relation.to, relation.from];
    const [first, last] = [classes.rowOf.get(top), classes.rowOf.get(bottom)];
    const x = corridor(input, first, last, at(top).cx, at(bottom).cx, taken, {
      channels,
      straights,
    });
    // The label sits in the channel holding the fewest labels so far, the one
    // nearest the relation's source when several hold as few.
    const passed = Array.from({ length: last - first }, (_, index) => first + index);
    const labels = (channel) => channels[channel].wires.filter((made) => made.label).length;
    const labelled = (down ? passed : passed.reverse()).reduce((best, channel) =>
      labels(channel) < labels(best) ? channel : best,
    );
    const labelIn = (channel) => (channel === labelled ? input.label(relation) : null);
    const head = wire(first, {
      type: "single",
      relations: [relation],
      label: labelIn(first),
      corridor: x,
    });
    end(head, "top", top, x, !down);
    end(head, "bottom", null, x);
    for (let channel = first + 1; channel < last - 1; channel += 1) {
      const pass = wire(channel, {
        type: "single",
        relations: [relation],
        label: labelIn(channel),
        corridor: x,
      });
      end(pass, "top", null, x);
      end(pass, "bottom", null, x);
    }
    const tail = wire(last - 1, {
      type: "single",
      relations: [relation],
      label: labelIn(last - 1),
      corridor: x,
    });
    end(tail, "top", null, x);
    end(tail, "bottom", bottom, x, down);
    passages.push({ relation, x, rows: [first + 1, last - 1] });
  }
  return { channels, wires, sides, straights, passages };
}

/**
 * A column gap, empty cell or lane beyond the outermost cards that is free in
 * every row a long relation passes; each is used once per row range. Of the
 * free ones, a corridor crosses the fewest wires, then runs shortest. A
 * corridor lies inside the content width: the lattice is centred on the
 * columns its cards use, so a gap past its last used column can fall outside
 * the figure, and a wire there runs off the page.
 * @param {any} input
 * @param {number} first
 * @param {number} last
 * @param {number} x1
 * @param {number} x2
 * @param {Array<{ x: number, first: number, last: number }>} taken
 * @param {{ channels: Channel[], straights: Array<{ row: number, left: { x: number, width: number },
 *   right: { x: number } }> }} wired the channels' wires and the straight arrows so far
 */
function corridor(input, first, last, x1, x2, taken, wired) {
  const { gridLeft, pitch, columns, slots, cardWidth, box, order, frame, spacing } = input;
  const gap = pitch - cardWidth;
  const candidates = [];
  for (let column = -1; column <= columns; column += 1)
    for (const offset of [0, -12, 12])
      candidates.push(gridLeft + column * pitch - gap / 2 + offset);
  for (let position = 0; position < slots; position += 1)
    candidates.push(gridLeft + (position / 2) * pitch + cardWidth / 2);
  // A lane beyond the outermost cards and the boundary, twice as far from them
  // as two parallel wires: where every gap a corridor could pass is crossed, it
  // runs around the figure instead. At one separation from the boundary it read
  // as a second, solid edge.
  const cards = [...box.values()];
  const [left, right] = frame ?? [
    Math.min(...cards.map((card) => card.x)),
    Math.max(...cards.map((card) => card.x + card.width)),
  ];
  candidates.push(left - 2 * spacing.separation, right + 2 * spacing.separation);
  const inside = (x) => x >= spacing.clear && x <= input.contentWidth - spacing.clear;
  // Within the boundary a corridor keeps one separation from its edge. Beyond
  // it, a wire the medium draws keeps the lane's two, or it reads as a second
  // edge; where Archify draws the routes, the corridor only reserves a gap.
  const beyond = input.lanes ? 2 : 1;
  const fromFrame = (x) =>
    !frame ||
    frame.every(
      (edge) =>
        Math.abs(edge - x) >= (x < frame[0] || x > frame[1] ? beyond : 1) * spacing.separation,
    );
  const free = (x) =>
    inside(x) &&
    order
      .slice(first + 1, last)
      .every((row) =>
        row.every((id) => x < box.get(id).x - 12 || x > box.get(id).x + box.get(id).width + 12),
      ) &&
    fromFrame(x) &&
    !taken.some(
      (use) =>
        Math.abs(use.x - x) < spacing.separation && use.first <= last - 1 && first <= use.last - 1,
    );
  const cost = (x) =>
    Math.abs(x1 - x) +
    Math.abs(x - x2) +
    (Math.abs(x - x1) > 0.5 ? 120 : 0) +
    (Math.abs(x - x2) > 0.5 ? 120 : 0);
  // A wire whose ends lie on either side of the corridor in a channel the
  // corridor runs through crosses it, as does a straight arrow across a gap it
  // passes; ports are not spread yet, so card centres stand for them.
  const crossings = (x) => {
    let count = 0;
    for (let index = first; index < last; index += 1) {
      const [top, bottom] = [index === first ? x1 : x, index === last - 1 ? x2 : x];
      for (const made of wired.channels[index]?.wires ?? [])
        if (crosses(made, top, bottom)) count += 1;
    }
    for (const straight of wired.straights)
      if (
        straight.row > first &&
        straight.row < last &&
        x > straight.left.x + straight.left.width &&
        x < straight.right.x
      )
        count += 1;
    return count;
  };
  const ranked = candidates
    .filter(free)
    .map((x) => ({ x, crossings: crossings(x), cost: cost(x) }))
    .sort((a, b) => a.crossings - b.crossings || a.cost - b.cost || a.x - b.x);
  const chosen = ranked[0]?.x;
  if (chosen === undefined)
    refuse(
      "layout_channel_unroutable",
      `A relation from row ${first + 1} to row ${last + 1} has no free corridor inside the figure. ` +
        "Reorder the tiers or split the view.",
    );
  taken.push({ x: chosen, first, last });
  return chosen;
}

/**
 * Whether a corridor running from x `top` to x `bottom` through a channel must
 * cross wire `made` there: a U wire whose span holds the corridor's end on its
 * side, or any other wire with a pair of ends the corridor separates.
 * @param {Wire} made
 * @param {number} top
 * @param {number} bottom
 */
function crosses(made, top, bottom) {
  if (made.type === "u-down" || made.type === "u-up") {
    const down = made.type === "u-down";
    const [a, b] = (down ? made.top : made.bottom).map(({ x }) => x).sort((p, q) => p - q);
    const end = down ? top : bottom;
    return end > a + 0.5 && end < b - 0.5;
  }
  return made.top.some(({ x: p }) => made.bottom.some(({ x: q }) => (top - p) * (bottom - q) < 0));
}

/**
 * Positions for ports in order that want `targets`, at least `apart` apart and
 * within [low, high]: the nearest to their targets in sum of squares. Shifting
 * the i-th port back by i × apart turns the spacing into plain order, which
 * pooling adjacent violators solves exactly.
 * @param {number[]} targets
 * @param {number} apart
 * @param {number} low
 * @param {number} high
 */
function settle(targets, apart, low, high) {
  /** @type {Array<{ sum: number, count: number }>} */
  const blocks = [];
  const mean = (block) => block.sum / block.count;
  targets.forEach((target, index) => {
    blocks.push({ sum: target - index * apart, count: 1 });
    while (blocks.length > 1 && mean(blocks[blocks.length - 2]) > mean(blocks[blocks.length - 1])) {
      const last = /** @type {{ sum: number, count: number }} */ (blocks.pop());
      blocks[blocks.length - 1].sum += last.sum;
      blocks[blocks.length - 1].count += last.count;
    }
  });
  const top = high - (targets.length - 1) * apart;
  const shifted = blocks.flatMap((block) =>
    Array(block.count).fill(Math.min(top, Math.max(low, mean(block)))),
  );
  return shifted.map((value, index) => value + index * apart);
}

/**
 * Where a side's one port stands instead of its card's centre, or null: a
 * centre in line with the one port on the far side of the card across the
 * channel, which the port's wire does not connect, would carry that card's wire
 * on through it, so where the medium keeps `axisClear` the port moves that far
 * toward where its wire goes, within its port margins.
 */
function offAxis(sides, key, card, point, spacing) {
  if (!spacing.axisClear) return null;
  const top = key.endsWith(":top");
  const own = key.slice(0, key.lastIndexOf(":"));
  const connected = new Set(point.wire.relations.flatMap(({ from, to }) => [from, to]));
  const across = top ? point.wire.channel - 1 : point.wire.channel + 1;
  const lined = [...sides].some(([other, ends]) => {
    const id = other.slice(0, other.lastIndexOf(":"));
    return (
      id !== own &&
      !connected.has(id) &&
      other.endsWith(top ? ":top" : ":bottom") &&
      ends.length === 1 &&
      ends[0].wire.channel === across &&
      Math.abs(ends[0].x - card.cx) < 0.5
    );
  });
  if (!lined) return null;
  const x = card.cx + (point.toward < card.cx ? -1 : 1) * spacing.axisClear;
  return Math.min(
    card.x + card.width - spacing.portMargin,
    Math.max(card.x + spacing.portMargin, x),
  );
}

/**
 * Set the ports of each card side, ordered by where their wires go. A side's
 * one port takes its centre, unless that lines a wire up with another card's
 * through it; several ports each move toward where their wire goes, at least
 * `gap` apart where the card has room, so a wire to the card straight across
 * runs straight and the others fan out to either side.
 */
export function spreadPorts(sides, box, spacing, gap, keys = [...sides.keys()]) {
  for (const key of keys) {
    const ends = sides.get(key);
    if (!ends) continue;
    const card = box.get(key.slice(0, key.lastIndexOf(":")));
    ends.sort((a, b) => a.toward - b.toward || a.wire.order - b.wire.order);
    if (ends.length === 1) {
      ends[0].x = offAxis(sides, key, card, ends[0], spacing) ?? card.cx;
      continue;
    }
    const [low, high] = [card.x + spacing.portMargin, card.x + card.width - spacing.portMargin];
    const apart = Math.min(gap, (high - low) / (ends.length - 1));
    const xs = settle(
      ends.map(({ toward }) => Math.min(high, Math.max(low, toward))),
      apart,
      low,
      high,
    );
    ends.forEach((point, index) => {
      point.x = xs[index];
    });
  }
  // A card's top ports facing the same channel's bottom ports at equal x would make two wires
  // share a vertical, or one seem to continue the other, so that side moves by half a gap, or
  // where its card has no room for that, by two wires' separation, staying within its port
  // margins.
  for (const key of keys) {
    const ends = sides.get(key);
    if (!ends || !key.endsWith(":top")) continue;
    const card = box.get(key.slice(0, key.lastIndexOf(":")));
    const facing = [...sides]
      .filter(([other]) => other.endsWith(":bottom"))
      .flatMap(([, points]) => points)
      .filter((point) => point.wire.channel === ends[0].wire.channel);
    const clash = (shift) =>
      ends.some((point) =>
        facing.some(
          (other) => other.wire !== point.wire && Math.abs(other.x - point.x - shift) < 1,
        ),
      );
    if (!clash(0)) continue;
    const fits = (shift) =>
      ends.every(
        (point) =>
          point.x + shift >= card.x + spacing.portMargin - 0.01 &&
          point.x + shift <= card.x + card.width - spacing.portMargin + 0.01,
      );
    const shift = [gap / 2, -gap / 2, spacing.separation, -spacing.separation].find(
      (candidate) => fits(candidate) && !clash(candidate),
    );
    if (shift !== undefined) for (const point of ends) point.x += shift;
  }
}

/**
 * Make a wire one straight vertical when its ends can share an x: a wire
 * between two cards that overlap across runs straight wherever one end can
 * move to the other's x and keep its side's ports apart.
 */
export function straighten(wires, sides, box, spacing) {
  const sideOf = (point) =>
    sides.get(`${point.id}:${point.wire.top.includes(point) ? "bottom" : "top"}`);
  const move = (point, x) => {
    const ends = sideOf(point);
    const card = box.get(point.id);
    if (
      x < card.x + spacing.portMargin - 0.01 ||
      x > card.x + card.width - spacing.portMargin + 0.01
    )
      return false;
    const index = ends.indexOf(point);
    if (
      (index > 0 && x - ends[index - 1].x < spacing.separation) ||
      (index < ends.length - 1 && ends[index + 1].x - x < spacing.separation)
    )
      return false;
    point.x = x;
    return true;
  };
  for (const made of wires)
    for (const point of [...made.top, ...made.bottom])
      if (!point.id) point.x = /** @type {number} */ (made.corridor);
  for (const made of wires.filter(({ type }) => type === "single")) {
    const [p, q] = [made.top[0], made.bottom[0]];
    if (Math.abs(p.x - q.x) < 0.5) continue;
    if (!p.id || !q.id) {
      const owned = p.id ? p : q.id ? q : null;
      if (owned && Math.abs(owned.x - /** @type {number} */ (made.corridor)) < spacing.minJog)
        move(owned, /** @type {number} */ (made.corridor));
      continue;
    }
    const [a, b] = [box.get(p.id), box.get(q.id)];
    const low = Math.max(a.x, b.x) + spacing.portMargin;
    const high = Math.min(a.x + a.width, b.x + b.width) - spacing.portMargin;
    if (low > high) continue;
    if (sideOf(p).length === 1 && sideOf(q).length === 1) {
      const x = Math.abs(a.cx - b.cx) < 0.5 ? a.cx : (low + high) / 2;
      p.x = x;
      q.x = x;
    } else if (!move(q, p.x)) move(p, q.x);
  }
}

/**
 * Geometry of one solved channel between y `top` (the upper row's card bottom)
 * and `bottom` (the lower row's card top); `offset` shifts its content down.
 */
export function channelGeometry(channel, solution, top, bottom, offset, spacing) {
  const paths = [];
  const labels = [];
  const arrows = [];
  const start = top + offset;
  const rowsTop = start + solution.rowsTop;
  const rowCenter = (row) =>
    rowsTop +
    solution.labelHeights
      .slice(0, row)
      .reduce((sum, height) => sum + (height ? height + spacing.labelRowGap : 0), 0) +
    solution.labelHeights[row] / 2;
  const upperY = (track) => start + solution.upperTop + track * spacing.track;
  const lowerY = (track) => start + solution.lowerTop + track * spacing.track;
  const labelRows = solution.labelHeights
    .map((height, row) => (height ? { center: rowCenter(row), height } : null))
    .filter(Boolean);
  channel.wires.forEach((made, i) => {
    const option = solution.combo[i];
    const relations = made.relations;
    if (option.label !== undefined) {
      const box = /** @type {LabelBox} */ (made.label);
      labels.push({
        relations,
        x: option.label - box.width / 2,
        y: rowCenter(option.row) - box.height / 2,
        width: box.width,
        height: box.height,
        lines: box.lines,
      });
    }
    const jog = option.jog
      ? rowCenter(option.row)
      : option.upper.length
        ? upperY(solution.upperTrack.get(i))
        : option.lower.length
          ? lowerY(solution.lowerTrack.get(i))
          : null;
    const tipTop = (point) =>
      point.arrow ? { relations, x: point.x, y: top, direction: "up" } : null;
    const tipBottom = (point) =>
      point.arrow ? { relations, x: point.x, y: bottom, direction: "down" } : null;
    if (made.type === "single") {
      const [p, q] = [made.top[0], made.bottom[0]];
      const points =
        jog === null || Math.abs(p.x - q.x) < 0.5
          ? [
              [p.x, top],
              [q.x, bottom],
            ]
          : [
              [p.x, top],
              [p.x, jog],
              [q.x, jog],
              [q.x, bottom],
            ];
      paths.push({ relations, points });
      for (const tip of [p.id ? tipTop(p) : null, q.id ? tipBottom(q) : null])
        if (tip) arrows.push(tip);
    } else if (made.type === "fan-down" || made.type === "fan-up") {
      const down = made.type === "fan-down";
      const hub = (down ? made.top : made.bottom)[0];
      const leaves = down ? made.bottom : made.top;
      const xs = [hub.x, ...leaves.map((point) => point.x)];
      paths.push({
        relations,
        points: [
          [hub.x, down ? top : bottom],
          [hub.x, /** @type {number} */ (jog)],
        ],
      });
      paths.push({
        relations,
        points: [
          [Math.min(...xs), /** @type {number} */ (jog)],
          [Math.max(...xs), /** @type {number} */ (jog)],
        ],
      });
      for (const point of leaves)
        paths.push({
          relations,
          points: [
            [point.x, /** @type {number} */ (jog)],
            [point.x, down ? bottom : top],
          ],
        });
      for (const tip of [
        down ? tipTop(hub) : tipBottom(hub),
        ...leaves.map((point) => (down ? tipBottom(point) : tipTop(point))),
      ])
        if (tip) arrows.push(tip);
    } else {
      const fromTop = made.type === "u-down";
      const edge = fromTop ? top : bottom;
      const [a, b] = fromTop ? made.top : made.bottom;
      paths.push({
        relations,
        points: [
          [a.x, edge],
          [a.x, /** @type {number} */ (jog)],
          [b.x, /** @type {number} */ (jog)],
          [b.x, edge],
        ],
      });
      if (b.arrow) arrows.push({ relations, x: b.x, y: edge, direction: fromTop ? "up" : "down" });
    }
  });
  return { paths, labels, arrows, labelRows };
}
