import assert from "node:assert/strict";
import test from "node:test";
import { orphan } from "../src/breaks.mjs";
import { HOUSE } from "../src/house.mjs";
import { validateModel } from "../src/model/load.mjs";
import { planViews } from "../src/plan/views.mjs";
import { DARKNESS } from "../src/poster/balance.mjs";
import { flowOrder } from "../src/poster/compose/flow.mjs";
import { TINT } from "../src/poster/compose/matrix-draw.mjs";
import { matrices, matrixKey } from "../src/poster/compose/matrix.mjs";
import { TABLE } from "./fixtures/line-tables.mjs";
import { denseModel } from "./fixtures/matrix.mjs";
import { minimalModel } from "./fixtures/models.mjs";
import { HOUSE_TOKENS, files, icons, part, stripStyle, typefaces } from "./fixtures/strips.mjs";

// The matrix: a view whose figure in tiers would tangle, drawn as a design structure matrix, one row and one column
// for each of its parts in the order of its relations' flow, each relation a cell tinted as the line it replaces.

/** The edition's body in plate px, where a matrix is drawn within the whole of it. */
const FIELD = Object.freeze({ x: 0, y: 0, width: 2256, height: 1071 });

test("parts stand in their relations' flow, a cycle together, and the model's order where the flow leaves a choice", () => {
  const ids = (view) => flowOrder(view).map(({ id }) => id);
  const relation = ([from, to]) => ({ from, to });
  // p4 leads to p3, which leads into the cycle of p0 and p1, which leads to p2.
  const flow = {
    components: ["p0", "p1", "p2", "p3", "p4"].map((id) => ({ id })),
    relations: [
      ["p3", "p0"],
      ["p0", "p1"],
      ["p1", "p0"],
      ["p1", "p2"],
      ["p4", "p3"],
    ].map(relation),
  };
  assert.deepEqual(ids(flow), ["p4", "p3", "p0", "p1", "p2"]);
  assert.deepEqual(ids({ components: flow.components, relations: [] }), [
    "p0",
    "p1",
    "p2",
    "p3",
    "p4",
  ]);
});

/** A model's one view, its scene in a style with measured facts and a table of lines, and its matrices. */
async function matricesOf(model, lines = TABLE) {
  const [view] = await planViews(model, async () => ({ fits: true, width: 1, height: 1 }));
  const parts = new Map(model.components.map(({ id }) => [id, part([[`src/${id}.mjs`, 4000, 0]])]));
  const style = { ...stripStyle(HOUSE_TOKENS, parts, model), lines };
  const drawn = [...matrices({ model, typefaces, icons, style }, view, FIELD)];
  return { model, view, style, drawn };
}

test("a matrix has no crossing, route or bend, and its acyclic flow sets every mark above the diagonal", async () => {
  const { view, drawn } = await matricesOf(denseModel());
  assert.ok(drawn.length > 0, "the dense view fits the body as a matrix");
  for (const one of drawn) {
    assert.deepEqual(one.layout.measures, { crossings: 0, routes: 0, bends: 0 });
    assert.deepEqual([one.limit, one.flat, one.details], [null, false, false]);
    const { figure } = one;
    const rows = figure.report.parts.map(({ id }) => id);
    assert.deepEqual(rows.toSorted(), view.components.map(({ id }) => id).toSorted());
    const reported = figure.report.paths.flatMap(({ relations }) => relations);
    assert.deepEqual(
      reported.map(({ id }) => id).toSorted(),
      view.relations.map(({ id }) => id).toSorted(),
    );
    for (const { from, to } of reported)
      assert.ok(rows.indexOf(from) < rows.indexOf(to), `${from} ${to}`);
    // The balance gates read the content: the heads' cards, their strips and the cells' tints, all mass; no rule,
    // diagonal or bracket is ink to them.
    assert.ok(figure.rects.every(({ kind }) => kind === "mass"));
    assert.equal(figure.rects.filter(({ weight }) => weight === DARKNESS.card).length, rows.length);
    for (const rect of figure.rects) {
      assert.ok(rect.x >= FIELD.x && rect.x + rect.width <= FIELD.x + FIELD.width + 1, "across");
      assert.ok(rect.y >= FIELD.y && rect.y + rect.height <= FIELD.y + FIELD.height + 1, "down");
    }
  }
});

test("each relation's cell stands in the row of the part it leaves and under the column of the part it reaches", async () => {
  const { drawn } = await matricesOf(denseModel());
  for (const one of drawn) {
    const { parts, paths } = one.figure.report;
    const heads = new Map(parts.map(({ id, box }) => [id, box]));
    // The columns' names stand above the first row's head, and every row's own words below it.
    const first = Math.min(...parts.map(({ box }) => box.y));
    const columns = one.figure.runs.filter(
      ({ layer, component, top, style }) =>
        layer === "cards" && component && top + style.line <= first,
    );
    for (const {
      relations: [{ id, from, to }],
      points: [[x, y], , [right, bottom]],
    } of paths) {
      const head = /** @type {{ y: number, height: number }} */ (heads.get(from));
      assert.ok(head.y >= y && head.y + head.height <= bottom, `${id} in the row of ${from}`);
      const names = columns.filter(({ component }) => component === to);
      assert.ok(names.length > 0, `the column of ${to}`);
      for (const name of names) {
        const middle = name.x + typefaces.measure(name.value, name.style) / 2;
        assert.ok(Math.abs(middle - (x + right) / 2) < 1, `${id} under the column of ${to}`);
      }
    }
  }
});

/** Each cell's fill and its edge's pattern as the SVG draws them, by the relations its report names. */
function cellsOf(one) {
  const svg = one.figure.shapes.join("\n");
  const fills = [
    ...svg.matchAll(
      /<rect x="([\d.]+)" y="([\d.]+)" width="[\d.]+" height="[\d.]+" fill="(#[0-9a-f]+)" fill-opacity="([\d.]+)"\/>/gu,
    ),
  ];
  const edges = [
    ...svg.matchAll(
      /<rect x="([\d.]+)" y="([\d.]+)" [^>]*fill="none" stroke="(#[0-9a-f]+)" stroke-width="([\d.]+)" stroke-dasharray="([^"]+)"\/>/gu,
    ),
  ];
  return new Map(
    one.figure.report.paths.map(({ relations, points: [[x, y]] }) => {
      const fill = fills.find((match) => Number(match[1]) === x && Number(match[2]) === y);
      assert.ok(fill, `the fill of ${relations[0].id}`);
      const edge = edges.find(
        (match) => Math.abs(Number(match[1]) - x) < 3 && Math.abs(Number(match[2]) - y) < 3,
      );
      return [
        relations.map(({ id }) => id).join(" "),
        {
          fill: fill[3],
          opacity: Number(fill[4]),
          edge: edge ? { color: edge[3], weight: Number(edge[4]), dash: edge[5] } : null,
        },
      ];
    }),
  );
}

test("a cell is tinted as its line by the table of lines, its edge dashed when planned and dotted when retired", async () => {
  // A table of other values than the house's, so a weight or a dash written into the matrix would show.
  const table = structuredClone(TABLE);
  table.rows.relation.stroke = 2.4;
  table.rows.planned.dash = [7, 3];
  table.rows.retired.dash = [2, 5];
  const { model, view, style, drawn } = await matricesOf(denseModel(), table);
  const [one] = drawn;
  const cells = cellsOf(one);
  const { dye, figure, palette } = HOUSE_TOKENS;
  for (const id of ["r5", "r6", "r8"])
    assert.deepEqual(cells.get(id), { fill: dye.old, opacity: TINT, edge: null }, id);
  assert.deepEqual(cells.get("r7"), {
    fill: dye.old,
    opacity: TINT,
    edge: { color: dye.old, weight: 2.4, dash: "7 3" },
  });
  assert.deepEqual(cells.get("r11"), {
    fill: figure.retired,
    opacity: TINT,
    edge: { color: figure.retired, weight: 2.4, dash: "2 5" },
  });
  assert.deepEqual(cells.get("r1"), { fill: palette.mid, opacity: TINT, edge: null });
  // No other outline: the inner outline of a mark is gone.
  assert.equal(
    one.figure.shapes
      .join("\n")
      .match(/<rect [^>]*fill="none" stroke="#[0-9a-f]+" stroke-width="[\d.]+"\/>/gu),
    null,
  );
  assert.deepEqual(one.figure.lines.toSorted(), [
    "boundary",
    "citations",
    "emphasis",
    "planned",
    "relation",
    "retired",
  ]);
  // The key names the cells' tints, and holds no sample of a line and no word for the diagonal.
  const key = matrixKey(model, view, style, one.figure.lines, one.figure.matrix);
  assert.deepEqual(
    key
      .filter(({ shape: mark }) => mark === "cell")
      .map(({ label, tint, count }) => [label, tint, count ?? null]),
    [
      ["cited files", palette.mid, 3],
      ["to Model store", dye.old, null],
    ],
  );
  assert.ok(!key.some(({ shape: mark }) => ["count", "hub"].includes(mark)));
  // Each sample is ruled round as the matrix rules its cells.
  for (const sample of key.filter(({ shape: mark }) => mark === "cell"))
    assert.equal(sample.rule, palette.rule);
});

test("each cell sets its relations' label and their count after it, and a label its column repeats is said once", async () => {
  const reads = { r5: "reads", r6: "reads", r7: "reads", r8: "reads" };
  const { view, drawn } = await matricesOf(denseModel(reads));
  const [one] = drawn;
  const runs = one.figure.runs.filter(({ layer }) => layer === "labels");
  const relation = (id) => /** @type {any} */ (view.relations.find((each) => each.id === id));
  const said = one.figure.report.labels.find(({ relations }) => relations.includes("r5"));
  assert.deepEqual(said?.relations.toSorted(), ["r5", "r6", "r7", "r8"]);
  assert.equal(runs.filter(({ value }) => value === "reads").length, 1);
  for (const { relations, box } of one.figure.report.labels) {
    if (relations.length > 1) continue;
    const inside = runs.filter(
      ({ x, top }) =>
        x >= box.x && x < box.x + box.width && top >= box.y && top < box.y + box.height,
    );
    const { label, files: cited } = relation(relations[0]);
    assert.equal(inside.at(-1)?.value, String(cited.length));
    assert.equal(
      inside
        .slice(0, -1)
        .map(({ value }) => value)
        .join(" "),
      label,
    );
  }
  // The cells whose label the column says keep their counts.
  const counts = runs.filter(({ value }) => /^\d+$/u.test(value)).map(({ value }) => value);
  assert.deepEqual(
    counts.toSorted(),
    view.relations.map(({ files: cited }) => String(cited.length)).toSorted(),
  );
});

test("the inside parts are bracketed on both axes and the bracket named as the boundary; the corner says the way", async () => {
  const { drawn } = await matricesOf(denseModel());
  const [one] = drawn;
  const svg = one.figure.shapes.join("\n");
  const { boundary } = HOUSE_TOKENS.figure;
  assert.equal(svg.match(new RegExp(`stroke="${boundary}"[^>]*stroke-dasharray`, "gu"))?.length, 3);
  const words = one.figure.runs.filter(({ layer }) => layer === "figure").map(({ value }) => value);
  assert.ok(words.includes("Dense"));
  assert.ok(words.includes("from ↓ to →"));
  // The matrix's box holds its brackets and its rules, which are not ink, for the figure set alone: the diagonal
  // ends at the grid's far corner, on the box's edges, and every rectangle of ink lies within the box.
  const { x, y, width, height } = one.figure.frame;
  const corner = svg.match(
    / L([\d.]+),([\d.]+)" fill="none" stroke="#[0-9a-f]+" stroke-width="([\d.]+)"/u,
  );
  assert.ok(corner, "the diagonal");
  // The rules and the diagonal are drawn at their strokes of the house.
  assert.equal(Number(corner[3]), HOUSE.strokes.diagonal);
  assert.match(
    svg,
    new RegExp(
      ` V[\\d.]+" fill="none" stroke="#[0-9a-f]+" stroke-width="${HOUSE.strokes.cellRule}"`,
      "u",
    ),
  );
  assert.ok(
    Math.abs(Number(corner[1]) - (x + width)) < 1 && Math.abs(Number(corner[2]) - (y + height)) < 1,
  );
  for (const rect of one.figure.rects) {
    assert.ok(rect.x >= x && rect.y >= y, "after the box's corner");
    assert.ok(
      rect.x + rect.width <= x + width + 0.5 && rect.y + rect.height <= y + height + 0.5,
      "within it",
    );
  }
});

/** Ten parts in a chain, each relation's label written in Chinese and citing two files. */
function chineseModel() {
  const labels = [
    "仓库变更与发布",
    "长期决策的理由",
    "换种子朗读、绑定重录",
    "维护者转到这里",
    "一个智能体入口",
    "试音与脚本修改",
    "canvas 与浏览器",
    "一张任务地图",
    "读取模型",
  ];
  return validateModel(
    minimalModel({
      id: "chain",
      locale: "zh-CN",
      components: labels
        .concat("终点")
        .map((_, index) => ({ id: `p${index}`, label: `部件${index + 1}` })),
      relations: labels.map((label, index) => ({
        id: `r${index}`,
        from: `p${index}`,
        to: `p${index + 1}`,
        label,
        files: files(2),
      })),
    }),
  );
}

test("Chinese in a cell leaves no character alone on a line and no count alone on a line", async () => {
  const { drawn } = await matricesOf(chineseModel());
  let broken = 0;
  for (const one of drawn) {
    const runs = one.figure.runs.filter(({ layer }) => layer === "labels");
    for (const { box } of one.figure.report.labels) {
      const inside = runs.filter(
        ({ x, top }) =>
          x >= box.x && x < box.x + box.width && top >= box.y && top < box.y + box.height,
      );
      const lines = inside.slice(0, -1);
      const count = /** @type {any} */ (inside.at(-1));
      if (lines.length > 1) broken += 1;
      for (const line of lines) assert.ok(lines.length < 2 || !orphan(line.value), line.value);
      // The count follows the last line's words on its baseline.
      const last = /** @type {any} */ (lines.at(-1));
      const baseline = (run) => typefaces.baseline(run.top, run.style);
      assert.ok(count.x > last.x && Math.abs(baseline(count) - baseline(last)) < 0.5);
    }
    // The corner says the way in the model's language.
    assert.ok(
      one.figure.runs.some(({ layer, value }) => layer === "figure" && value === "从 ↓ 到 →"),
    );
  }
  assert.ok(broken > 0, "some step breaks a label");
});

/**
 * Eight clients outside a repository of the name given and the one part inside it, which their relations make the
 * last in flow order: the run of columns inside is one column, at the grid's right.
 * @param {string} name
 */
function insideLastModel(name) {
  const clients = Array.from({ length: 8 }, (_, index) => `u${index}`);
  return validateModel(
    minimalModel({
      kinds: {
        stage: { label: "stage", category: "backend", icon: "server" },
        person: { label: "person", category: "person", icon: "user" },
      },
      repository: {
        name,
        url: "https://github.com/o/r",
        revision: "0123456789abcdef".repeat(2) + "01234567",
      },
      components: [
        ...clients.map((id) => ({ id, label: `Client ${id}`, kind: "person" })),
        { id: "core", label: "Core", kind: "stage" },
      ],
      relations: clients.map((id, index) => ({
        id: `r${index}`,
        from: id,
        to: "core",
        label: "uses",
      })),
    }),
  );
}

test("the boundary's name stands within the field, ending at its run's right end where it would run past it", async () => {
  const name = "architecture-publisher";
  const { drawn } = await matricesOf(insideLastModel(name));
  assert.ok(drawn.length > 0, "the view fits the body as a matrix");
  for (const one of drawn) {
    const run = /** @type {any} */ (one.figure.runs.find(({ value }) => value === name));
    const end = run.x + typefaces.measure(name, run.style);
    assert.ok(
      run.x >= FIELD.x && end <= FIELD.x + FIELD.width,
      `step ${one.step}: ${run.x} to ${end}`,
    );
  }
  // A name that stands within the field neither way leaves no step at which a matrix fits.
  const { drawn: none } = await matricesOf(insideLastModel("a-long-repository-name-".repeat(12)));
  assert.deepEqual(none, []);
});
