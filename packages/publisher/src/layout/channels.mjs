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
 * @typedef {{ index: number, wires: Wire[], edges?: number[] }} Channel
 */

/**
 * Build every wire, its ends and the card sides they use.
 * @param {{ order: string[][], classes: any, box: Map<string, { x: number, cx: number }>, cardWidth: number,
 *   cardHeight: number, columns: number, pitch: number, gridLeft: number, slots: number,
 *   frame: [number, number] | null, spacing: any, label: (relation: any, maxWidth?: number) => LabelBox }} input
 */
export function buildWires(input) {
  const { order, classes, box, spacing } = input;
  const rowCount = order.length;
  const channels = Array.from(
    { length: Math.max(0, rowCount - 1) },
    (_, index) => /** @type {Channel} */ ({ index, wires: [] }),
  );
  const sides = new Map();
  const wires = [];
  const straights = [];
  const passages = [];
  let sequence = 0;
  const wire = (channel, spec) => {
    const made = /** @type {Wire} */ ({ order: sequence++, channel, top: [], bottom: [], ...spec });
    channels[channel].wires.push(made);
    wires.push(made);
    return made;
  };
  const end = (made, where, id, toward, arrow = false) => {
    const point = { id, x: id ? box.get(id).cx : toward, arrow, wire: made, toward };
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
    end(made, "top", top, box.get(bottom).cx, !down);
    end(made, "bottom", bottom, box.get(top).cx, down);
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
    const middle = bus.leaves.reduce((sum, id) => sum + box.get(id).cx, 0) / bus.leaves.length;
    end(made, hubWhere, bus.hub, middle, bus.type === "in");
    for (const leaf of bus.leaves)
      end(
        made,
        hubWhere === "top" ? "bottom" : "top",
        leaf,
        box.get(bus.hub).cx,
        bus.type === "out",
      );
  }
  for (const relation of classes.sameRow) {
    const row = classes.rowOf.get(relation.from);
    const [a, b] = [box.get(relation.from), box.get(relation.to)];
    const [left, right] = a.x < b.x ? [a, b] : [b, a];
    const neighbors =
      Math.abs(order[row].indexOf(relation.from) - order[row].indexOf(relation.to)) === 1;
    const gap = right.x - (left.x + input.cardWidth);
    const label = input.label(relation, Math.max(80, gap - 2 * spacing.clear));
    if (
      neighbors &&
      gap >= label.width + 2 * spacing.clear &&
      label.height <= input.cardHeight - 16
    ) {
      straights.push({ relation, left, right, label, fromLeft: a === left, row });
      continue;
    }
    const below = row < rowCount - 1;
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
    const x = corridor(input, first, last, box.get(top).cx, box.get(bottom).cx, taken);
    const head = wire(first, {
      type: "single",
      relations: [relation],
      label: down ? input.label(relation) : null,
      corridor: x,
    });
    end(head, "top", top, x, !down);
    end(head, "bottom", null, x);
    for (let channel = first + 1; channel < last - 1; channel += 1) {
      const pass = wire(channel, {
        type: "single",
        relations: [relation],
        label: null,
        corridor: x,
      });
      end(pass, "top", null, x);
      end(pass, "bottom", null, x);
    }
    const tail = wire(last - 1, {
      type: "single",
      relations: [relation],
      label: down ? null : input.label(relation),
      corridor: x,
    });
    end(tail, "top", null, x);
    end(tail, "bottom", bottom, x, down);
    passages.push({ relation, x, rows: [first + 1, last - 1] });
  }
  return { channels, wires, sides, straights, passages };
}

/** A column gap or empty cell free in every row a long relation passes; each is used once per row range. */
function corridor(input, first, last, x1, x2, taken) {
  const { gridLeft, pitch, columns, slots, cardWidth, box, order, frame } = input;
  const gap = pitch - cardWidth;
  const candidates = [];
  for (let column = -1; column <= columns; column += 1)
    for (const offset of [0, -12, 12])
      candidates.push(gridLeft + column * pitch - gap / 2 + offset);
  for (let position = 0; position < slots; position += 1)
    candidates.push(gridLeft + (position / 2) * pitch + cardWidth / 2);
  const free = (x) =>
    order
      .slice(first + 1, last)
      .every((row) =>
        row.every((id) => x < box.get(id).x - 12 || x > box.get(id).x + cardWidth + 12),
      ) &&
    (!frame || frame.every((edge) => Math.abs(edge - x) > 10)) &&
    !taken.some(
      (use) => Math.abs(use.x - x) < 10 && use.first <= last - 1 && first <= use.last - 1,
    );
  const cost = (x) =>
    Math.abs(x1 - x) +
    Math.abs(x - x2) +
    (Math.abs(x - x1) > 0.5 ? 120 : 0) +
    (Math.abs(x - x2) > 0.5 ? 120 : 0);
  const chosen = candidates.filter(free).sort((a, b) => cost(a) - cost(b) || a - b)[0];
  taken.push({ x: chosen, first, last });
  return chosen;
}

/** Spread the ports of each card side symmetrically, ordered by where their wires go. */
export function spreadPorts(sides, box, cardWidth, spacing, gap, keys = [...sides.keys()]) {
  for (const key of keys) {
    const ends = sides.get(key);
    if (!ends) continue;
    const center = box.get(key.slice(0, key.lastIndexOf(":"))).cx;
    ends.sort((a, b) => a.toward - b.toward || a.wire.order - b.wire.order);
    const span =
      ends.length > 1 ? Math.min(gap * (ends.length - 1), cardWidth - 2 * spacing.portMargin) : 0;
    ends.forEach((point, index) => {
      point.x = ends.length === 1 ? center : center - span / 2 + (span * index) / (ends.length - 1);
    });
  }
}

/** Make a wire one straight vertical when its ends can share an x. */
export function straighten(wires, sides, box, cardWidth, spacing) {
  const sideOf = (point) =>
    sides.get(`${point.id}:${point.wire.top.includes(point) ? "bottom" : "top"}`);
  const move = (point, x) => {
    const ends = sideOf(point);
    const card = box.get(point.id);
    if (
      x < card.x + spacing.portMargin - 0.01 ||
      x > card.x + cardWidth - spacing.portMargin + 0.01
    )
      return false;
    const index = ends.indexOf(point);
    if (
      (index > 0 && x - ends[index - 1].x < 18) ||
      (index < ends.length - 1 && ends[index + 1].x - x < 18)
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
    const high = Math.min(a.x, b.x) + cardWidth - spacing.portMargin;
    if (low > high) continue;
    if (sideOf(p).length === 1 && sideOf(q).length === 1) {
      const x = Math.abs(a.cx - b.cx) < 0.5 ? a.cx : (low + high) / 2;
      p.x = x;
      q.x = x;
    } else if (Math.abs(p.x - q.x) < spacing.minJog && !move(q, p.x)) move(p, q.x);
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
  const rowsTop =
    start + spacing.stub + solution.upperHeight + (solution.rowsHeight ? spacing.bandGap : 0);
  const rowCenter = (row) =>
    rowsTop +
    solution.labelHeights
      .slice(0, row)
      .reduce((sum, height) => sum + (height ? height + spacing.labelRowGap : 0), 0) +
    solution.labelHeights[row] / 2;
  const upperY = (track) => start + spacing.stub + track * spacing.track;
  const lowerY = (track) =>
    rowsTop +
    solution.rowsHeight +
    (solution.rowsHeight ? spacing.bandGap : 0) +
    track * spacing.track;
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
