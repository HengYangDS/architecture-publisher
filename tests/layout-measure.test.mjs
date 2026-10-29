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
  const measured = measureLayout(
    geometry({
      paths: [
        path("near-a", [0, 0], [0, 100]),
        path("near-b", [12, 0], [12, 100]),
        path("end-a", [200, 0], [200, 50]),
        path("end-b", [200, 60], [200, 120]),
        path("labelled", [400, 0], [400, 100]),
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
      "route_arrows_close head-a head-b",
      "route_label_near_wire other labelled",
    ],
  );
});
