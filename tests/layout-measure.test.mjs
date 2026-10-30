import assert from "node:assert/strict";
import test from "node:test";
import { measureLayout } from "../packages/publisher/src/layout/measure.mjs";

const relation = (id) => [{ id }];
const path = (id, ...points) => ({ relations: relation(id), points });
const label = (id, x, y, width = 40, height = 20) => ({
  relations: relation(id),
  x,
  y,
  width,
  height,
});
const geometry = (parts) => ({ cards: new Map(), paths: [], labels: [], boundary: null, ...parts });
const codes = (measured) => measured.defects.map(({ code, relations }) => `${code} ${relations}`);

test("clean geometry reports its crossings and bends", () => {
  const measured = measureLayout(
    geometry({
      paths: [
        path("a", [0, 0], [0, 100]),
        path("b", [-50, 50], [50, 50]),
        path("c", [100, 0], [100, 40], [200, 40], [200, 100]),
      ],
      labels: [label("c", 130, 30)],
    }),
  );
  assert.deepEqual(measured, { crossings: 1, bends: 2, defects: [], routes: [] });
});

test("diagonal, shared and card-crossing wires are defects", () => {
  const measured = measureLayout(
    geometry({
      cards: new Map([["card", { x: 300, y: 0, width: 100, height: 60 }]]),
      paths: [
        path("diagonal", [0, 0], [10, 10]),
        path("v1", [50, 0], [50, 100]),
        path("v2", [50, 50], [50, 150]),
        path("h1", [100, 200], [200, 200]),
        path("h2", [150, 200], [250, 200]),
        path("through", [350, -10], [350, 70]),
      ],
    }),
  );
  assert.deepEqual(codes(measured), [
    "layout_wire_diagonal diagonal",
    "layout_wire_shared v1 v2",
    "layout_wire_shared h1 h2",
    "layout_wire_through_card through",
  ]);
  assert.equal(measured.defects.at(-1).card, "card");
});

test("labels may not overlap labels, cards, other wires or the boundary edge", () => {
  const measured = measureLayout(
    geometry({
      cards: new Map([["card", { x: 0, y: 0, width: 100, height: 60 }]]),
      paths: [path("wire", [300, 0], [300, 200]), path("own", [500, 0], [500, 100])],
      labels: [
        label("one", 150, 100),
        label("two", 160, 105),
        label("on-card", 80, 10),
        label("on-wire", 290, 50),
        label("own", 490, 50),
        label("edge", 595, 50),
      ],
      boundary: { x: 600, y: 0, width: 200, height: 200 },
    }),
  );
  assert.deepEqual(codes(measured), [
    "layout_label_collision one two",
    "layout_label_collision on-card",
    "layout_label_collision on-wire wire",
    "layout_label_collision edge",
  ]);
  assert.equal(measured.defects[1].card, "card");
});

test("route defects are counted, not refused", () => {
  const connecting = (id, from, ...points) => ({ relations: [{ id, from, to: "far" }], points });
  const measured = measureLayout(
    geometry({
      cards: new Map([["beside", { x: 1000, y: 100, width: 100, height: 60 }]]),
      paths: [
        path("near-a", [0, 0], [0, 100]),
        path("near-b", [12, 0], [12, 100]),
        path("end-a", [200, 0], [200, 50]),
        path("end-b", [200, 60], [200, 120]),
        path("labelled", [400, 0], [400, 100]),
        // 30 apart for 200: beyond the parallel spacing, but long enough to read as one.
        path("bus-a", [800, 0], [800, 200]),
        path("bus-b", [830, 0], [830, 200]),
        // Each turns 30 above or below the card; only one connects it.
        connecting("by-card", "near", [1050, 0], [1050, 70], [1200, 70]),
        connecting("owned", "beside", [1080, 160], [1080, 190], [1200, 190]),
      ],
      labels: [label("other", 410, 40)],
      arrows: [
        { relations: relation("head-a"), x: 600, y: 100 },
        { relations: relation("head-b"), x: 610, y: 100 },
      ],
      arrow: 9,
    }),
  );
  assert.deepEqual(measured.defects, []);
  assert.deepEqual(
    measured.routes.map(({ code, relations }) => `${code} ${relations}`),
    [
      "route_wires_close near-a near-b",
      "route_wire_continued end-a end-b",
      "route_wires_alongside bus-a bus-b",
      "route_turn_by_card by-card beside",
      "route_arrows_close head-a head-b",
      "route_label_near_wire other labelled",
    ],
  );
});

test("runs in line across another wire and wires that hook past each other are route defects", () => {
  const between = (id, from, to, ...points) => ({ relations: [{ id, from, to }], points });
  const measured = measureLayout(
    geometry({
      paths: [
        // Two runs in line on one row, 150 apart, with a third relation's wire
        // crossing between them: read as one line that jumps it.
        between("left", "a", "b", [0, 0], [0, 50], [200, 50], [200, 100]),
        between("right", "c", "d", [350, 0], [350, 50], [600, 50], [600, 100]),
        between("down", "e", "f", [275, 0], [275, 100]),
        // The same runs out of one card are its fan, which reads true in line.
        between("fan-a", "g", "h", [0, 300], [0, 350], [200, 350], [200, 400]),
        between("fan-b", "g", "i", [350, 300], [350, 350], [600, 350], [600, 400]),
        between("fan-c", "j", "k", [275, 300], [275, 400]),
        // 24 apart, each turning inside the other's length: they hook past each other.
        between("hook-a", "l", "m", [890, 584], [996, 584], [996, 640]),
        between("hook-b", "n", "o", [1020, 480], [1020, 608], [1356, 608]),
      ],
    }),
  );
  assert.deepEqual(measured.defects, []);
  assert.deepEqual(
    measured.routes.map(({ code, relations }) => `${code} ${relations}`),
    ["route_wire_jumps left right", "route_wires_interlock hook-a hook-b"],
  );
});
