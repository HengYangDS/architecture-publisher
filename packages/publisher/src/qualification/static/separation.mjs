/** Measures declared grouping. This does not infer visual groups, judge taste,
 * or grant semantic acceptance. Numeric minima belong only to source quality. */
export function auditNaturalSeparation(scene, groups, quality) {
  const q = quality.hard_gates.geometry_each_scale;
  const values = [
    q.major_section_gap_px_at_reference_min,
    q.semantic_peer_group_gap_px_at_reference_min,
    q.font_width_growth_fraction,
    q.font_height_growth_fraction,
  ];
  if (values.some((n) => !Number.isFinite(n) || n < 0))
    throw Error('Source grouping values required');
  const texts = new Map(scene.texts.map((t) => [t.id, t]));
  const box = (id) => {
    const t = texts.get(id);
    if (!t) throw Error('Unmeasured label ' + id);
    const b = t.box;
    return {
      left: b.x,
      right: b.x + b.width * (1 + q.font_width_growth_fraction),
      top: b.y - (b.height * q.font_height_growth_fraction) / 2,
      bottom: b.y + b.height * (1 + q.font_height_growth_fraction / 2),
    };
  };
  const nodes = new Map((scene.nodes ?? []).map((n) => [n.id, n])),
    edges = new Map((scene.edges ?? []).map((e) => [e.id, e]));
  const seen = new Set();
  const bands = groups.bands.map((g) => {
    if (!g.labels.length) throw Error('Empty group');
    const b = g.labels.map(box);
    for (const id of g.marks ?? []) {
      if (seen.has('mark:' + id)) throw Error('Duplicate grouped mark');
      seen.add('mark:' + id);
      const n = nodes.get(id);
      if (!n) throw Error('Unmeasured mark ' + id);
      // The scene mark box includes its semantic radius. Two reference pixels
      // conservatively cover current trace mark strokes; not a new clearance rule.
      b.push({
        left: n.box.x - 2,
        right: n.box.x + n.box.width + 2,
        top: n.box.y - 2,
        bottom: n.box.y + n.box.height + 2,
      });
    }
    for (const id of g.paths ?? []) {
      if (seen.has('path:' + id)) throw Error('Duplicate grouped path');
      seen.add('path:' + id);
      const e = edges.get(id);
      if (!e || !e.points.length) throw Error('Unmeasured path ' + id);
      const pad = Math.max(
        (e.strokeWidth ?? 1) / 2,
        e.arrowGeometry
          ? e.arrowGeometry.halfWidth + e.arrowGeometry.strokeWidth / 2
          : 0,
      );
      b.push({
        left: Math.min(...e.points.map((p) => p.x)) - pad,
        right: Math.max(...e.points.map((p) => p.x)) + pad,
        top: Math.min(...e.points.map((p) => p.y)) - pad,
        bottom: Math.max(...e.points.map((p) => p.y)) + pad,
      });
    }
    return {
      id: g.id,
      top: Math.min(...b.map((b) => b.top)),
      bottom: Math.max(...b.map((b) => b.bottom)),
      labels: g.labels.length,
      marks: g.marks?.length ?? 0,
      paths: g.paths?.length ?? 0,
    };
  });
  if (
    groups.bands.some((b) => b.marks !== undefined || b.paths !== undefined)
  ) {
    for (const id of nodes.keys())
      if (!seen.has('mark:' + id)) throw Error('Ungrouped mark ' + id);
    for (const id of edges.keys())
      if (!seen.has('path:' + id)) throw Error('Ungrouped path ' + id);
  }
  const gaps = bands.slice(1).map((b, i) => ({
    from: bands[i].id,
    to: b.id,
    actual: b.top - bands[i].bottom,
    minimum: q.major_section_gap_px_at_reference_min,
  }));
  const tableGaps = groups.tables.flatMap((t) =>
    t.rows.map(([left, right]) => ({
      table: t.id,
      left,
      right,
      actual: box(right).left - box(left).right,
      minimum: q.semantic_peer_group_gap_px_at_reference_min,
    })),
  );
  const peerGaps = (groups.peers ?? []).flatMap((p) => {
    if (!['x', 'y'].includes(p.axis) || p.groups.length < 2)
      throw Error('Invalid local reading group');
    const bounds = p.groups.map((g) => {
      if (!g.labels.length) throw Error('Empty local reading group');
      const b = g.labels.map(box);
      return {
        id: g.id,
        start: Math.min(...b.map((b) => (p.axis === 'x' ? b.left : b.top))),
        end: Math.max(...b.map((b) => (p.axis === 'x' ? b.right : b.bottom))),
      };
    });
    return bounds.slice(1).map((b, i) => ({
      group: p.id,
      axis: p.axis,
      from: bounds[i].id,
      to: b.id,
      actual: b.start - bounds[i].end,
      minimum: q.semantic_peer_group_gap_px_at_reference_min,
    }));
  });
  const failures = [
    ...gaps
      .filter((g) => g.actual < g.minimum)
      .map((g) => 'group-gap:' + g.from + '/' + g.to),
    ...tableGaps
      .filter((g) => g.actual < g.minimum)
      .map((g) => 'table-gap:' + g.table + ':' + g.left + '/' + g.right),
    ...peerGaps
      .filter((g) => g.actual < g.minimum)
      .map((g) => 'peer-gap:' + g.group + ':' + g.from + '/' + g.to),
  ];
  const alignments = (groups.alignments ?? []).map((group) => {
    if (
      !['left', 'right', 'baseline'].includes(group.edge) ||
      group.labels.length < 2
    )
      throw Error('Invalid alignment group');
    const values = group.labels.map((id) => {
      const t = texts.get(id);
      if (!t) throw Error('Unmeasured alignment label ' + id);
      return group.edge === 'baseline'
        ? t.baseline
        : t.box.x + (group.edge === 'right' ? t.box.width : 0);
    });
    const residual = Math.max(...values) - Math.min(...values);
    if (!Number.isFinite(residual) || residual > 1e-6)
      failures.push('alignment:' + group.id);
    return { id: group.id, edge: group.edge, residual };
  });
  const adjacencies = (groups.adjacencies ?? []).map((group) => {
    if (group.labels.length !== 2) throw Error('Invalid adjacency group');
    const [left, right] = group.labels;
    const gap = box(right).left - box(left).right;
    const expected = q.semantic_peer_group_gap_px_at_reference_min;
    const sameBaseline = texts.get(left).baseline === texts.get(right).baseline;
    if (Math.abs(gap - expected) > 1e-6 || !sameBaseline)
      failures.push('adjacency:' + group.id);
    return { id: group.id, gap, expected, sameBaseline };
  });
  const cellTables = (groups.cellTables ?? []).map((t) => {
    if (
      t.columns.length < 2 ||
      !t.rows.length ||
      t.columns.some(
        (c, i) =>
          !Number.isFinite(c.x) ||
          !Number.isFinite(c.width) ||
          c.width <= 0 ||
          (i > 0 && c.x < t.columns[i - 1].x + t.columns[i - 1].width),
      )
    )
      throw Error('Invalid cell-table columns');
    const used = new Set(),
      rowIds = new Set();
    const rows = t.rows.map((r) => {
      if (!r.id || rowIds.has(r.id) || r.cells.length !== t.columns.length)
        throw Error('Invalid cell-table row');
      rowIds.add(r.id);
      const cells = r.cells.map((ids, i) => {
        if (!ids.length) throw Error('Empty cell');
        const bounds = ids.map((id) => {
          if (used.has(id)) throw Error('Duplicate cell label');
          used.add(id);
          return { id, ...box(id) };
        });
        const c = t.columns[i];
        for (const b of bounds)
          if (b.left < c.x || b.right > c.x + c.width)
            failures.push(
              'cell-overflow:' + t.id + ':' + r.id + ':' + i + ':' + b.id,
            );
        for (let k = 1; k < bounds.length; k++)
          if (bounds[k].top < bounds[k - 1].bottom)
            failures.push('cell-line-overlap:' + t.id + ':' + r.id + ':' + i);
        return {
          labels: ids,
          left: Math.min(...bounds.map((b) => b.left)),
          right: Math.max(...bounds.map((b) => b.right)),
          top: Math.min(...bounds.map((b) => b.top)),
          bottom: Math.max(...bounds.map((b) => b.bottom)),
        };
      });
      for (let i = 1; i < cells.length; i++)
        if (
          cells[i].left - cells[i - 1].right <
          q.semantic_peer_group_gap_px_at_reference_min
        )
          failures.push(
            'cell-gap:' + t.id + ':' + r.id + ':' + (i - 1) + '/' + i,
          );
      return {
        id: r.id,
        cells,
        top: Math.min(...cells.map((c) => c.top)),
        bottom: Math.max(...cells.map((c) => c.bottom)),
      };
    });
    for (let i = 1; i < rows.length; i++)
      if (rows[i].top < rows[i - 1].bottom)
        failures.push(
          'row-overlap:' + t.id + ':' + rows[i - 1].id + '/' + rows[i].id,
        );
    return {
      id: t.id,
      rows,
      rowGaps: rows.slice(1).map((r, i) => ({
        from: rows[i].id,
        to: r.id,
        actual: r.top - rows[i].bottom,
      })),
    };
  });
  return {
    sourceQualitySchema: quality.schema,
    bands,
    gaps,
    tableGaps,
    peerGaps,
    ...(groups.alignments ? { alignments } : {}),
    ...(groups.adjacencies ? { adjacencies } : {}),
    cellTables,
    failures,
    scope:
      'Declared bands include grown text, mark extents and conservative stroke/arrow envelopes. Tables check all declared cell lines against column bounds and grown peer-column clearance; intra-cell and inter-row overlap is prohibited. Not browser paint, undeclared grouping, perceptual or semantic acceptance.',
  };
}
