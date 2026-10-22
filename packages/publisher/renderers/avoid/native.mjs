/** The unchanged official router owns complete paths; callers only supply measured obstacles. */
export function routeObstacleGraph(graph, A, reserves) {
  const router = new A.Router(A.OrthogonalRouting);
  const shapes = new Map();
  const connectors = [];
  const refs = [];
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const rectangle = (box, margin) => {
    const first = new A.Point(box.x - margin, box.y - margin);
    const last = new A.Point(box.x + box.width + margin, box.y + box.height + margin);
    const polygon = new A.Rectangle(first, last);
    const shape = new A.ShapeRef(router, polygon);
    A.destroy(polygon);
    A.destroy(first);
    A.destroy(last);
    refs.push(shape);
    return shape;
  };
  const endpoint = (identity, point, classId) => {
    const node = byId.get(identity);
    const side = [
      [A.ConnDirLeft, Math.abs(point.x - node.x)],
      [A.ConnDirRight, Math.abs(point.x - node.x - node.width)],
      [A.ConnDirUp, Math.abs(point.y - node.y)],
      [A.ConnDirDown, Math.abs(point.y - node.y - node.height)],
    ].sort((left, right) => left[1] - right[1])[0][0];
    new A.ShapeConnectionPin(
      shapes.get(identity),
      classId,
      point.x - node.x + reserves.node,
      point.y - node.y + reserves.node,
      false,
      0,
      side,
    ).setExclusive(true);
    return new A.ConnEnd(shapes.get(identity), classId);
  };
  try {
    router.setRoutingParameter(A.shapeBufferDistance, 0);
    router.setRoutingParameter(A.idealNudgingDistance, reserves.stub);
    router.setRoutingParameter(A.segmentPenalty, reserves.stub);
    router.setRoutingParameter(A.crossingPenalty, reserves.stub * 4);
    router.setRoutingOption(A.nudgeOrthogonalSegmentsConnectedToShapes, true);
    router.setRoutingOption(A.nudgeSharedPathsWithCommonEndPoint, true);
    router.setRoutingOption(A.penaliseOrthogonalSharedPathsAtConnEnds, true);
    for (const node of graph.nodes) shapes.set(node.id, rectangle(node, reserves.node));
    for (const group of graph.groups) if (group.label) rectangle(group.label, reserves.text);
    for (const relation of graph.relations)
      for (const line of relation.label?.baselines ?? []) rectangle(line.box, reserves.text);
    for (const [index, relation] of graph.relations.entries()) {
      const first = endpoint(relation.source, relation.points[0], index * 2 + 1);
      const last = endpoint(relation.target, relation.points.at(-1), index * 2 + 2);
      const connector = new A.ConnRef(router, first, last);
      connector.setHateCrossings(true);
      connector.setRoutingType(A.ConnType_Orthogonal);
      A.destroy(first);
      A.destroy(last);
      connectors.push(connector);
    }
    router.processTransaction();
    return graph.relations.map((relation, index) => {
      const route = connectors[index].displayRoute();
      return {
        id: relation.id,
        points: Array.from({ length: route.size() }, (_, at) => {
          const point = route.get_ps(at);
          return { x: Math.round(point.x * 1e6) / 1e6, y: Math.round(point.y * 1e6) / 1e6 };
        }),
      };
    });
  } finally {
    for (const connector of connectors) router.deleteConnector(connector);
    for (const shape of refs) router.deleteShape(shape);
    A.destroy(router);
  }
}
