import { DARKNESS, darkness } from "./balance.mjs";
import { fixed } from "./tokens.mjs";

/**
 * The lines of a figure's relations: each drawn in the weight and pattern the
 * table of lines gives its row, with its arrowhead, and where the edition draws
 * strips with the number of files its relation cites. The count and the view's hub are
 * read from the view's measured facts; nothing is measured here. The drawing
 * hands back, beside what it draws, each path it stroked with the relations it
 * is stroked for, in the numbers the SVG writes.
 */

/**
 * The part a point of a line stands on, by the layout's boxes: a line ends on a part's top or foot, or on its side
 * for a relation along a row.
 * @param {{ cards: Map<string, { x: number, y: number, width: number, height: number }> }} layout
 * @returns {(point: number[]) => string | undefined}
 */
function partAt(layout) {
  const near = (a, b) => Math.abs(a - b) < 0.5;
  const within = (value, low, high) => value > low - 0.5 && value < high + 0.5;
  return ([x, y]) =>
    [...layout.cards].find(
      ([, box]) =>
        ((near(y, box.y) || near(y, box.y + box.height)) && within(x, box.x, box.x + box.width)) ||
        ((near(x, box.x) || near(x, box.x + box.width)) && within(y, box.y, box.y + box.height)),
    )?.[0];
}

/**
 * The relations a path is stroked for. Every path of a wire carries all the wire's relations: of them, a path that
 * ends on a part is stroked for those that end on that part, so a fan's branch is its own relation's and its trunk
 * every relation's; a path that ends on no part of theirs, as a fan's bar does, is stroked for them all.
 * @param {{ relations: any[], points: number[][] }} path a path of the layout
 * @param {(point: number[]) => string | undefined} standsOn
 */
function strokedFor({ relations, points }, standsOn) {
  const ends = [standsOn(points[0]), standsOn(points[points.length - 1])];
  const own = relations.filter(({ from, to }) => ends.includes(from) || ends.includes(to));
  return own.length ? own : relations;
}

/** A relation as a path's report names it: its ends, its label and, for an overview's line, the relations it stands for. */
export const named = ({ id, from, to, label, relations }) => ({
  id,
  from,
  to,
  label,
  ...(relations ? { relations } : {}),
});

/**
 * Where each relation's count of cited files stands: on the part of its line
 * no other relation shares, from its source's end. A relation that shares its
 * first run with others, as a fan out of one part does, takes it on its own
 * branch, from where it leaves the others. Each run is a path of the layout,
 * keyed by its index, with whether it is read from its last point.
 * @param {(relation: { id: string }) => number | undefined} cited the number of files a relation cites, as the
 *   view's facts hold it
 * @param {{ cards: Map<string, { x: number, y: number, width: number, height: number }>,
 *   paths: Array<{ relations: any[], points: number[][] }> }} layout
 * @returns {Map<number, Array<{ id: string, count: number, reverse: boolean }>>}
 */
export function citationRuns(cited, layout) {
  const cardAt = partAt(layout);
  /** @type {Map<any, Array<{ index: number, last: boolean, card: string | undefined }>>} */
  const own = new Map();
  layout.paths.forEach(({ relations, points }, index) => {
    for (const last of [false, true]) {
      const card = cardAt(points[last ? points.length - 1 : 0]);
      const ending = relations.filter(({ from, to }) => from === card || to === card);
      if (ending.length === 1)
        own.set(ending[0], [...(own.get(ending[0]) ?? []), { index, last, card }]);
    }
  });
  /** @type {Map<number, Array<{ id: string, count: number, reverse: boolean }>>} */
  const runs = new Map();
  for (const [relation, ends] of own) {
    const count = cited(relation);
    if (!count) continue;
    const source = ends.find(({ card }) => card === relation.from);
    // Without a run of its own at its source, its run ends at its target: it is read from the other end.
    const { index, last } = source ?? { ...ends[0], last: !ends[0].last };
    runs.set(index, [...(runs.get(index) ?? []), { id: relation.id, count, reverse: last }]);
  }
  return runs;
}

/**
 * A count beside its line, in plate px: the first place is 12 px along the run
 * from its source end and each further place 5 px on; the count's line box
 * stands 9 px from the line, and a count is clear of another mark when 2 px of
 * paper lie between them. Its figures stand on their baseline, 0.7 em tall.
 */
const COUNT = Object.freeze({ from: 12, step: 5, clear: 9, paper: 2, figures: 0.7 });

/**
 * The places a count may take along a run, nearest its first point first:
 * clear of the run's corners and of its far end, where an arrowhead or the
 * next part stands; then the middle of the run's first stretch, for a run too
 * short to hold any other.
 * @param {number[][]} points
 * @param {number} radius the radius of the line's corners
 * @returns {Array<{ x: number, y: number, vertical: boolean }>}
 */
export function placesAlong(points, radius) {
  const places = [];
  let start = 0;
  /** @type {number} */
  let at = COUNT.from;
  for (let index = 1; index < points.length; index += 1) {
    const [x1, y1] = points[index - 1];
    const [x2, y2] = points[index];
    const length = Math.hypot(x2 - x1, y2 - y1);
    const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
    at = Math.max(at, start + (index > 1 ? radius : 0));
    const end = start + length - (index < points.length - 1 ? radius : COUNT.from);
    for (; at <= end; at += COUNT.step) {
      const share = (at - start) / length;
      places.push({ x: x1 + (x2 - x1) * share, y: y1 + (y2 - y1) * share, vertical });
    }
    start += length;
  }
  const [[x1, y1], [x2, y2]] = points;
  places.push({
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
    vertical: Math.abs(x2 - x1) < Math.abs(y2 - y1),
  });
  return places;
}

const touches = (a, b) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * Set a relation's count beside its run: at the first place along it where
 * its figures touch no other mark, right of a stretch that falls and above
 * one that crosses, in its line's colour and the smallest type. A count with
 * no clear place stands at the first and is reported. The count is text to
 * the balance measure.
 * @param {{ points: number[][], count: number, color: string, radius: number, style: any }} run
 * @param {Array<{ x: number, y: number, width: number, height: number }>} marks what a count may not touch
 * @param {{ text: Function, rects: any[], typefaces: any }} draw
 * @returns {boolean} whether the count stands clear
 */
export function drawCount(run, marks, draw) {
  const { style } = run;
  const value = String(run.count);
  const width = draw.typefaces.measure(value, style);
  const figures = COUNT.figures * style.size;
  const boxes = placesAlong(run.points, run.radius).map(({ x, y, vertical }) =>
    vertical
      ? { x: x + COUNT.clear, y: y - style.line / 2 }
      : { x: x - width / 2, y: y - COUNT.clear - style.line },
  );
  // What a reader sees of a count is its figures, from their tops to the baseline, not its line box.
  const figuresOf = ({ x, y }) => ({
    x,
    y: draw.typefaces.baseline(y, style) - figures,
    width,
    height: figures,
  });
  const padded = (rect) => ({
    x: rect.x - COUNT.paper,
    y: rect.y - COUNT.paper,
    width: rect.width + 2 * COUNT.paper,
    height: rect.height + 2 * COUNT.paper,
  });
  const clear = boxes.find((box) => !marks.some((mark) => touches(padded(figuresOf(box)), mark)));
  const { x, y } = clear ?? boxes[0];
  draw.text("labels", value, x, y, style, run.color);
  draw.rects.push({ x, y, width, height: style.line, kind: "mass", weight: 0 });
  // The next count keeps clear of this one's figures.
  marks.push(figuresOf({ x, y }));
  return Boolean(clear);
}

/** A path through `points` with rounded corners. */
function rounded(points, radius) {
  let d = `M${fixed(points[0][0])},${fixed(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const r = Math.min(radius, Math.hypot(cx - px, cy - py) / 2, Math.hypot(nx - cx, ny - cy) / 2);
    d +=
      ` L${fixed(cx - Math.sign(cx - px) * r)},${fixed(cy - Math.sign(cy - py) * r)}` +
      ` Q${fixed(cx)},${fixed(cy)} ${fixed(cx + Math.sign(nx - cx) * r)},${fixed(cy + Math.sign(ny - cy) * r)}`;
  }
  const last = points.at(-1);
  return `${d} L${fixed(last[0])},${fixed(last[1])}`;
}

/** The three corners of an arrowhead of one size, its tip first. */
function headOf({ x, y, direction }, size) {
  const a = size;
  const shapes = {
    down: [
      [x, y],
      [x - a / 2, y - a],
      [x + a / 2, y - a],
    ],
    up: [
      [x, y],
      [x - a / 2, y + a],
      [x + a / 2, y + a],
    ],
    right: [
      [x, y],
      [x - a, y - a / 2],
      [x - a, y + a / 2],
    ],
    left: [
      [x, y],
      [x + a, y - a / 2],
      [x + a, y + a / 2],
    ],
  };
  return shapes[/** @type {keyof typeof shapes} */ (direction)];
}

const statusOf = (relations) =>
  relations.some(({ status }) => status === "retired")
    ? "retired"
    : relations.some(({ status }) => status === "planned")
      ? "planned"
      : null;

/**
 * What a mark that stands for some relations carries by the table of lines, whether it is a line or a matrix's
 * cell: its relations' status, retired before planned; whether it carries emphasis, as a mark into the view's hub
 * does unless it is retired; its colour, faint for a retired mark and the oldest dye for an emphasised one; its
 * weight; its pattern, or none; and the rows of the table it draws.
 * @param {ReadonlyArray<{ to: string, status?: string | null }>} relations
 * @param {string | null} hub the view's hub, or none where the edition draws no strips
 * @param {ReturnType<typeof import("./tokens.mjs").linesOf>} lines
 * @param {{ faint: string, line: string, dye: readonly string[] }} colors
 */
export function lineLook(relations, hub, lines, colors) {
  const status = statusOf(relations);
  const heavy = hub !== null && status !== "retired" && relations.every(({ to }) => to === hub);
  return {
    status,
    heavy,
    color: status === "retired" ? colors.faint : heavy ? colors.dye[2] : colors.line,
    weight: lines.stroke(heavy),
    dash: status ? lines.status(status) : null,
    rows: [heavy ? "emphasis" : "relation", ...(status ? [status] : [])],
  };
}

/** A point moved toward another by a distance. */
const toward = ([x, y], [tx, ty], by) => {
  const length = Math.hypot(tx - x, ty - y);
  return [x + ((tx - x) / length) * by, y + ((ty - y) / length) * by];
};

/**
 * Draw every relation's line and arrowhead, and with the edition's measured
 * facts each relation's count of cited files. With those facts the lines into
 * the view's hub are drawn with emphasis, so a reader finds what the view
 * draws on: at the table's heavier stroke, in the oldest dye, with a larger
 * arrowhead that the line ends inside, so no round cap shows beside it. A
 * planned line into the hub is heavy too; a retired one keeps its faint colour,
 * its weight and its dots. Without them every line is drawn alike.
 * @param {any} layout
 * @param {{ view: any, facts?: import("./strip.mjs").Facts | null, styles: any, metrics: any,
 *   typefaces: any,
 *   colors: any, lines: ReturnType<typeof import("./tokens.mjs").linesOf>,
 *   at: (x: number) => number, down: (y: number) => number,
 *   text: Function, shapes: string[], rects: any[],
 *   marks: Array<{ x: number, y: number, width: number, height: number }> }} scene
 *   `marks` are the parts, labels and frame a count may not touch; `facts` are the edition's measured facts where
 *   it draws strips, which the lines read their view's hub and counts from, or none.
 * @returns {{ rows: Set<string>, touching: string[],
 *   paths: Array<{ relations: ReturnType<typeof named>[], points: number[][] }> }} the rows of the table drawn, the
 *   relations whose count has no clear place, and each path stroked, in the order drawn, with the relations it is
 *   stroked for and the points its path is written from
 */
export function drawLines(layout, scene) {
  const { view, styles, metrics, typefaces, colors: C, lines } = scene;
  const { at, down, text, shapes, rects } = scene;
  const seen = scene.facts ? scene.facts.view(view) : null;
  const hub = seen ? seen.hub : null;
  const look = (relations) => lineLook(relations, hub, lines, C);
  const arrows = layout.arrows.map((arrow) => {
    const { heavy, color } = look(arrow.relations);
    const size = metrics.wire.arrow * lines.arrow(heavy);
    const tip = { ...arrow, x: at(arrow.x), y: down(arrow.y) };
    return { heavy, size, tip, corners: headOf(tip, size), color };
  });
  const paths = layout.paths.map(({ relations, points }) => {
    const { heavy, weight } = look(relations);
    return {
      relations,
      heavy,
      moved: points.map(([x, y]) => [at(x), down(y)]),
      weight,
    };
  });
  /** @type {Set<string>} */
  const rows = new Set();
  // What a count may not touch: the marks the figure gives, every line's stretches and every arrowhead.
  const marks = [...scene.marks];
  for (const { moved, weight } of paths)
    for (let index = 1; index < moved.length; index += 1) {
      const [x1, y1] = moved[index - 1];
      const [x2, y2] = moved[index];
      marks.push({
        x: Math.min(x1, x2) - weight / 2,
        y: Math.min(y1, y2) - weight / 2,
        width: Math.abs(x2 - x1) + weight,
        height: Math.abs(y2 - y1) + weight,
      });
    }
  for (const { corners } of arrows) {
    const xs = corners.map(([x]) => x);
    const ys = corners.map(([, y]) => y);
    const [x, y] = [Math.min(...xs), Math.min(...ys)];
    marks.push({ x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y });
  }
  const runs = seen ? citationRuns(seen.cited, layout) : new Map();
  /** @type {string[]} */
  const touching = [];
  const standsOn = partAt(layout);
  const stroked = [];
  for (const [index, { relations, heavy, moved, weight }] of paths.entries()) {
    const { color, dash: pattern, rows: marked } = look(relations);
    const dash = pattern ? ` stroke-dasharray="${pattern}"` : "";
    const ink = { kind: "stroke", weight: DARKNESS.stroke * darkness(color, C.paper) };
    for (const row of marked) rows.add(row);
    // A heavy line stops half a head short of each tip it carries, inside the head.
    const headAt = (point) =>
      arrows.find(
        ({ tip }) => Math.abs(tip.x - point[0]) < 0.5 && Math.abs(tip.y - point[1]) < 0.5,
      );
    const drawn = heavy
      ? moved.map((point, place) => {
          const next =
            place === 0 ? moved[1] : place === moved.length - 1 ? moved[place - 1] : null;
          const head = next && headAt(point);
          return head ? toward(point, next, head.size / 2) : point;
        })
      : moved;
    shapes.push(
      `<path d="${rounded(drawn, metrics.wire.radius)}" fill="none" stroke="${color}" ` +
        `stroke-width="${weight}" stroke-linejoin="round" stroke-linecap="round"${dash}/>`,
    );
    stroked.push({
      relations: strokedFor(layout.paths[index], standsOn).map(named),
      points: drawn.map(([x, y]) => [fixed(x), fixed(y)]),
    });
    for (const [x, y] of moved)
      rects.push({ x: x - weight, y: y - weight, width: 2 * weight, height: 2 * weight, ...ink });
    // A wire fills its whole run, not just its corners: a long horizontal or
    // vertical stretch is ink a reader sees, so the balance measure counts it.
    for (let place = 1; place < moved.length; place += 1) {
      const [x1, y1] = moved[place - 1];
      const [x2, y2] = moved[place];
      rects.push({
        x: Math.min(x1, x2) - weight,
        y: Math.min(y1, y2) - weight,
        width: Math.max(Math.abs(x2 - x1), 2 * weight),
        height: Math.max(Math.abs(y2 - y1), 2 * weight),
        ...ink,
      });
    }
    for (const { id, count, reverse } of runs.get(index) ?? []) {
      rows.add("citations");
      const run = {
        points: reverse ? moved.toReversed() : moved,
        count,
        color,
        radius: metrics.wire.radius,
        style: styles.count,
      };
      if (!drawCount(run, marks, { text, rects, typefaces })) touching.push(id);
    }
  }
  for (const { corners, color } of arrows) {
    const [p, q, r] = corners;
    shapes.push(
      `<path d="M${fixed(p[0])},${fixed(p[1])} L${fixed(q[0])},${fixed(q[1])} L${fixed(r[0])},${fixed(r[1])} Z" ` +
        `fill="${color}"/>`,
    );
  }
  return { rows, touching, paths: stroked };
}
