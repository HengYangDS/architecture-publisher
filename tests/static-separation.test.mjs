import assert from "node:assert/strict";
import test from "node:test";
import { auditNaturalSeparation } from "../packages/publisher/src/qualification/static/separation.mjs";

function fixture() {
  const label = (id, x, y, baseline) => ({
    id,
    box: { x, y, width: 10, height: 10 },
    baseline,
  });
  return {
    scene: {
      texts: [
        label("a", 0, 0, 8),
        label("b", 18, 0, 8),
        label("c", 0, 40, 48),
        label("d", 18, 40, 48),
      ],
      nodes: [{ id: "mark", box: { x: 35, y: 0, width: 5, height: 5 } }],
      edges: [
        {
          id: "path",
          points: [
            { x: 42, y: 0 },
            { x: 45, y: 4 },
          ],
          strokeWidth: 2,
          arrowGeometry: { halfWidth: 2, strokeWidth: 2 },
        },
      ],
    },
    groups: {
      bands: [
        { id: "first", labels: ["a", "b"], marks: ["mark"], paths: ["path"] },
        { id: "second", labels: ["c", "d"] },
      ],
      tables: [
        {
          id: "table",
          rows: [
            ["a", "b"],
            ["c", "d"],
          ],
        },
      ],
      peers: [
        {
          id: "peer",
          axis: "x",
          groups: [
            { id: "left", labels: ["a"] },
            { id: "right", labels: ["b"] },
          ],
        },
      ],
      alignments: [
        { id: "left-edge", edge: "left", labels: ["a", "c"] },
        { id: "right-edge", edge: "right", labels: ["b", "d"] },
        { id: "baseline", edge: "baseline", labels: ["a", "b"] },
      ],
      adjacencies: [{ id: "pair", labels: ["a", "b"] }],
      cellTables: [
        {
          id: "cells",
          columns: [
            { x: 0, width: 12 },
            { x: 18, width: 12 },
          ],
          rows: [
            { id: "r1", cells: [["a"], ["b"]] },
            { id: "r2", cells: [["c"], ["d"]] },
          ],
        },
      ],
    },
    quality: {
      schema: "source-quality/v1",
      hard_gates: {
        geometry_each_scale: {
          major_section_gap_px_at_reference_min: 10,
          semantic_peer_group_gap_px_at_reference_min: 8,
          font_width_growth_fraction: 0,
          font_height_growth_fraction: 0,
        },
      },
    },
  };
}

function audit(input) {
  return auditNaturalSeparation(input.scene, input.groups, input.quality);
}

test("declared text, marks, paths, peers, alignment and table cells form one measured audit", () => {
  const report = audit(fixture());
  assert.deepEqual(report.failures, []);
  assert.deepEqual(
    report.bands.map(({ id, labels, marks, paths }) => ({ id, labels, marks, paths })),
    [
      { id: "first", labels: 2, marks: 1, paths: 1 },
      { id: "second", labels: 2, marks: 0, paths: 0 },
    ],
  );
  assert.equal(report.gaps[0].actual, 30);
  assert.deepEqual(
    report.tableGaps.map(({ actual }) => actual),
    [8, 8],
  );
  assert.equal(report.peerGaps[0].actual, 8);
  assert(report.alignments.every(({ residual }) => residual === 0));
  assert.deepEqual(report.adjacencies[0], {
    id: "pair",
    gap: 8,
    expected: 8,
    sameBaseline: true,
  });
  assert.deepEqual(report.cellTables[0].rowGaps, [{ from: "r1", to: "r2", actual: 30 }]);
  assert.match(report.scope, /Not browser paint/);
});

test("small gaps and cell overflow are reported without granting visual acceptance", () => {
  const input = fixture();
  input.scene.texts.find(({ id }) => id === "c").box.y = 14;
  input.scene.texts.find(({ id }) => id === "d").box.y = 14;
  input.scene.texts.find(({ id }) => id === "b").box.x = 25;
  const failures = audit(input).failures;
  assert(failures.includes("group-gap:first/second"));
  assert(failures.includes("cell-overflow:cells:r1:1:b"));
  assert(failures.includes("adjacency:pair"));
});

test("incomplete or contradictory grouping fails before a passing audit", () => {
  const invalidQuality = fixture();
  invalidQuality.quality.hard_gates.geometry_each_scale.font_width_growth_fraction = -1;
  assert.throws(() => audit(invalidQuality), /Source grouping values required/);

  const missingMark = fixture();
  missingMark.groups.bands[0].marks = [];
  assert.throws(() => audit(missingMark), /Ungrouped mark mark/);

  const duplicatePath = fixture();
  duplicatePath.groups.bands[1].paths = ["path"];
  assert.throws(() => audit(duplicatePath), /Duplicate grouped path/);

  const invalidCell = fixture();
  invalidCell.groups.cellTables[0].rows[1].id = "r1";
  assert.throws(() => audit(invalidCell), /Invalid cell-table row/);
});

test("grouping rejects missing and duplicated measured carriers", () => {
  const cases = [
    ["empty band", (v) => (v.groups.bands[0].labels = []), /Empty group/],
    ["missing label", (v) => (v.groups.bands[0].labels = ["absent"]), /Unmeasured label absent/],
    ["duplicate mark", (v) => (v.groups.bands[1].marks = ["mark"]), /Duplicate grouped mark/],
    ["missing mark", (v) => (v.groups.bands[0].marks = ["absent"]), /Unmeasured mark absent/],
    ["ungrouped path", (v) => (v.groups.bands[0].paths = []), /Ungrouped path path/],
    ["duplicate path", (v) => (v.groups.bands[1].paths = ["path"]), /Duplicate grouped path/],
    ["missing path", (v) => (v.groups.bands[0].paths = ["absent"]), /Unmeasured path absent/],
    ["empty path", (v) => (v.scene.edges[0].points = []), /Unmeasured path path/],
  ];
  for (const [name, mutate, error] of cases) {
    const input = fixture();
    mutate(input);
    assert.throws(() => audit(input), error, name);
  }
});

test("local reading, alignment and adjacency rules reject contradictory declarations", () => {
  const cases = [
    ["peer axis", (v) => (v.groups.peers[0].axis = "diagonal"), /Invalid local reading group/],
    ["peer cardinality", (v) => (v.groups.peers[0].groups = []), /Invalid local reading group/],
    ["empty peer", (v) => (v.groups.peers[0].groups[0].labels = []), /Empty local reading group/],
    ["alignment edge", (v) => (v.groups.alignments[0].edge = "center"), /Invalid alignment group/],
    [
      "alignment cardinality",
      (v) => (v.groups.alignments[0].labels = ["a"]),
      /Invalid alignment group/,
    ],
    [
      "missing aligned label",
      (v) => (v.groups.alignments[0].labels[0] = "absent"),
      /Unmeasured alignment label/,
    ],
    [
      "adjacency cardinality",
      (v) => (v.groups.adjacencies[0].labels = ["a"]),
      /Invalid adjacency group/,
    ],
  ];
  for (const [name, mutate, error] of cases) {
    const input = fixture();
    mutate(input);
    assert.throws(() => audit(input), error, name);
  }
  const vertical = fixture();
  vertical.groups.peers[0] = {
    id: "vertical",
    axis: "y",
    groups: [
      { id: "top", labels: ["a"] },
      { id: "bottom", labels: ["c"] },
    ],
  };
  assert.equal(audit(vertical).peerGaps[0].actual, 30);

  const misaligned = fixture();
  misaligned.scene.texts.find(({ id }) => id === "c").box.x = 2;
  misaligned.scene.texts.find(({ id }) => id === "b").baseline = 9;
  assert(audit(misaligned).failures.includes("alignment:left-edge"));
  assert(audit(misaligned).failures.includes("adjacency:pair"));
});

test("cell tables reject invalid columns, rows, cells and duplicated labels", () => {
  const cases = [
    [
      "one column",
      (v) => (v.groups.cellTables[0].columns = [{ x: 0, width: 12 }]),
      /Invalid cell-table columns/,
    ],
    [
      "overlapping columns",
      (v) => (v.groups.cellTables[0].columns[1].x = 8),
      /Invalid cell-table columns/,
    ],
    ["empty rows", (v) => (v.groups.cellTables[0].rows = []), /Invalid cell-table columns/],
    [
      "missing row identity",
      (v) => (v.groups.cellTables[0].rows[0].id = ""),
      /Invalid cell-table row/,
    ],
    [
      "wrong cell count",
      (v) => (v.groups.cellTables[0].rows[0].cells = [["a"]]),
      /Invalid cell-table row/,
    ],
    ["empty cell", (v) => (v.groups.cellTables[0].rows[0].cells[0] = []), /Empty cell/],
    [
      "duplicated label",
      (v) => (v.groups.cellTables[0].rows[0].cells[1] = ["a"]),
      /Duplicate cell label/,
    ],
  ];
  for (const [name, mutate, error] of cases) {
    const input = fixture();
    mutate(input);
    assert.throws(() => audit(input), error, name);
  }

  const overlapping = fixture();
  overlapping.scene.texts.push({
    id: "extra",
    box: { x: 18, y: 5, width: 10, height: 10 },
    baseline: 13,
  });
  overlapping.groups.cellTables[0].rows[0].cells[1].push("extra");
  assert(audit(overlapping).failures.includes("cell-line-overlap:cells:r1:1"));

  const rows = fixture();
  rows.scene.texts.find(({ id }) => id === "c").box.y = 5;
  rows.scene.texts.find(({ id }) => id === "d").box.y = 5;
  assert(audit(rows).failures.includes("row-overlap:cells:r1/r2"));
});

test("labels-only grouping and optional carriers keep their declared scope explicit", () => {
  const labelsOnly = fixture();
  delete labelsOnly.scene.nodes;
  delete labelsOnly.scene.edges;
  delete labelsOnly.groups.bands[0].marks;
  delete labelsOnly.groups.bands[0].paths;
  delete labelsOnly.groups.peers;
  delete labelsOnly.groups.alignments;
  delete labelsOnly.groups.adjacencies;
  delete labelsOnly.groups.cellTables;
  const report = audit(labelsOnly);
  assert.deepEqual(report.failures, []);
  assert.equal(Object.hasOwn(report, "alignments"), false);
  assert.equal(Object.hasOwn(report, "adjacencies"), false);

  const plainPath = fixture();
  delete plainPath.scene.edges[0].strokeWidth;
  delete plainPath.scene.edges[0].arrowGeometry;
  assert.deepEqual(audit(plainPath).failures, []);
});
