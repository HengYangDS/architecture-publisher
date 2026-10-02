import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSelectedSceneRefinement } from '../packages/publisher/src/edition/refinement.mjs';
import {
  validateAuthoredRouteGeometry,
  bindAuthoredRoutes,
} from '../packages/publisher/src/scene/routes.mjs';
import {
  sha,
  ref,
  editorialRef,
  arrowGeometry,
  meaningFor,
  sceneFor,
  compose,
  composedScene,
  rejected,
} from './fixtures/authored-routes.mjs';

for (const medium of ['static', 'interactive']) {
  test(`${medium} literal geometry rejects duplicate identity and impossible segment contacts at its own boundary`, () => {
    for (const mutate of [
      (scene) => scene.edges.push(structuredClone(scene.edges[0])),
      (scene) => (scene.edges[0][medium === 'static' ? 'source' : 'from'] = 'absent'),
      (scene) => (scene.edges[0][medium === 'static' ? 'target' : 'to'] = 'absent'),
      (scene) => scene.edges[0].points.splice(1, 0, { ...scene.edges[0].points[0] }),
      (scene) => scene.edges[0].points.splice(1, 0, { x: 250, y: 220 }),
      (scene) => (scene.edges[0].strokeTone = 'paper'),
      (scene) => {
        const node = structuredClone(scene.nodes[0]);
        node.id = 'unrelated-ink';
        node.paintBox = { x: 230, y: 190, width: 30, height: 20 };
        scene.nodes.push(node);
      },
    ]) {
      const scene = sceneFor(meaningFor(medium), medium);
      mutate(scene);
      assert.throws(() => validateAuthoredRouteGeometry(scene, medium), /authored_route_/u);
    }
    const geometryOnly = sceneFor(meaningFor(medium), medium);
    delete geometryOnly.texts;
    assert.equal(validateAuthoredRouteGeometry(geometryOnly, medium).length, 2);
  });

  test(`${medium} literal point budgets apply before route and carrier deduplication`, () => {
    const scene = sceneFor(meaningFor(medium), medium);
    scene.routes = [];
    const bridge = scene.edges[1];
    scene.edges = Array.from({ length: 17 }, (_, index) => ({
      ...structuredClone(bridge),
      id: `dense-${index}`,
      points: Array.from({ length: 2048 }, (_, point) => ({ x: point % 2 ? 432 : 400, y: 200 })),
    }));
    assert.throws(() => validateAuthoredRouteGeometry(scene, medium), {
      code: 'authored_route_budget_exceeded',
    });
  });

  test(`${medium} route binding cannot borrow source membership from a missing endpoint`, () => {
    const scene = sceneFor(meaningFor(medium), medium);
    assert.throws(
      () =>
        bindAuthoredRoutes(scene, {
          medium,
          entities: new Map(),
          relations: new Map(),
          editorials: new Map(),
          selections: new Map(),
        }),
      /authored_route_/u,
    );
  });

  test(`${medium} exact routes preserve independent relations on each shared segment`, () => {
    const result = compose(meaningFor(medium), medium);
    assert.equal(composedScene(result, medium).edges.length, 3);
    const occurrences =
      medium === 'static'
        ? new Map(result.carriers.relationGraphics)
        : new Map(
            ['request', 'telemetry'].map((id) => [
              ref('relation', id),
              result.pages[0].facts
                .filter((fact) => fact.reference === ref('relation', id))
                .map(({ graphicId }) => graphicId),
            ]),
          );
    for (const id of ['request', 'telemetry'])
      assert.deepEqual(
        occurrences.get(ref('relation', id)),
        medium === 'static'
          ? ['edge:approach', 'edge:bridge', 'edge:terminal']
          : ['approach', 'bridge', 'terminal'],
      );
    assert.equal(JSON.stringify(result).includes('fixture/routes","entity","junction'), false);
  });

  test(`${medium} a second valid shared route never excuses wrong source endpoint identity`, () => {
    const meaning = meaningFor(medium);
    sceneFor(meaning, medium).routes[0].source = 'server';
    rejected(meaning, medium);
  });

  test(`${medium} identical junction IDs never bridge different geometric contacts`, () => {
    const meaning = meaningFor(medium);
    const scene = sceneFor(meaning, medium);
    scene.edges[1].points[0].x = 432;
    scene.edges[1].points[1].x = 400;
    rejected(meaning, medium);
  });

  test(`${medium} reversing an arrow-bearing traversal never reverses its paint`, () => {
    const meaning = meaningFor(medium);
    const scene = sceneFor(meaning, medium);
    scene.edges[1].arrow = true;
    const invalidMeaning = structuredClone(meaning);
    sceneFor(invalidMeaning, medium).routes[0].traversals[1].direction = 'reverse';
    rejected(invalidMeaning, medium);
  });

  test(`${medium} ordered metadata without a terminal painted arrow is refused`, () => {
    const meaning = meaningFor(medium);
    sceneFor(meaning, medium).edges[2].arrow = false;
    rejected(meaning, medium);
  });

  test(`${medium} an invalid explicit route declaration never silently becomes an absent route collection`, () => {
    for (const value of [null, undefined, {}]) {
      const meaning = meaningFor(medium);
      sceneFor(meaning, medium).routes = value;
      rejected(meaning, medium);
    }
  });

  test(`${medium} prototype-named physical segments retain their own inspection records`, () => {
    const meaning = meaningFor(medium);
    const scene = sceneFor(meaning, medium);
    scene.edges[1].id = 'constructor';
    for (const route of scene.routes) route.traversals[1].edge = 'constructor';
    const result = compose(meaning, medium);
    const occurrences =
      medium === 'static'
        ? new Map(result.carriers.relationGraphics).get(ref('relation', 'request'))
        : result.pages[0].facts.filter(({ graphicId }) => graphicId === 'constructor');
    assert.equal(
      medium === 'static' ? occurrences.includes('edge:constructor') : occurrences.length === 2,
      true,
    );
  });

  test(`${medium} zero-sized arrow paint cannot provide direction evidence`, () => {
    const meaning = meaningFor(medium);
    sceneFor(meaning, medium).edges[2].arrowGeometry.length = 0;
    rejected(meaning, medium);
  });

  for (const defect of [
    'duplicate-route',
    'missing-segment',
    'repeated-segment',
    'mixed-fields',
    'invented-relation',
  ]) {
    test(`${medium} exact route refuses ${defect}`, () => {
      const meaning = meaningFor(medium);
      const scene = sceneFor(meaning, medium);
      if (defect === 'duplicate-route') scene.routes[1].id = scene.routes[0].id;
      if (defect === 'missing-segment') scene.routes[0].traversals[0].edge = 'absent';
      if (defect === 'repeated-segment')
        scene.routes[0].traversals.splice(1, 0, { ...scene.routes[0].traversals[0] });
      if (defect === 'mixed-fields') scene.edges[0].route = 'auto';
      if (defect === 'invented-relation')
        scene.routes[0].reference = ref('relation', 'client-to-transitive-target');
      rejected(meaning, medium);
    });
  }

  test(`${medium} repeated references are bounded before semantic deduplication`, () => {
    const meaning = meaningFor(medium);
    const scene = sceneFor(meaning, medium);
    scene.routes = Array.from({ length: 2049 }, (_, index) => ({
      ...structuredClone(scene.routes[0]),
      id: `route-${index}`,
    }));
    rejected(meaning, medium);
  });

  test(`${medium} an exact editorial route remains separately inspectable on source segments`, () => {
    const meaning = meaningFor(medium, true);
    const scene = sceneFor(meaning, medium);
    scene.routes.push({
      ...structuredClone(scene.routes[0]),
      id: 'editorial-route',
      reference: editorialRef,
      editionSha256: meaning.edition.sha256,
    });
    const result = compose(meaning, medium);
    if (medium === 'static')
      assert.deepEqual(
        result.carriers.assertions.find(({ assertionId }) => assertionId === 'conditional')
          .graphicIds,
        ['text:editorial-label', 'edge:approach', 'edge:bridge', 'edge:terminal'],
      );
    else
      assert.deepEqual(
        result.pages[0].facts
          .filter((fact) => fact.reference === editorialRef)
          .map(({ graphicId }) => graphicId),
        ['editorial-label', 'approach', 'bridge', 'terminal'],
      );
  });

  for (const defect of [
    'changed-edition',
    'missing-statement',
    'unbound-basis',
    'copied-source-digest',
  ]) {
    test(`${medium} editorial route refuses ${defect}`, () => {
      const meaning = meaningFor(medium, true);
      const scene = sceneFor(meaning, medium);
      scene.routes.push({
        ...structuredClone(scene.routes[0]),
        id: 'editorial-route',
        reference: editorialRef,
        editionSha256: meaning.edition.sha256,
      });
      if (defect === 'changed-edition') scene.routes.at(-1).editionSha256 = '8'.repeat(64);
      if (defect === 'missing-statement') scene.texts.pop();
      if (defect === 'unbound-basis') meaning.assertions.at(-1).basis = ['unselected'];
      if (defect === 'copied-source-digest') scene.routes[0].editionSha256 = meaning.edition.sha256;
      rejected(meaning, medium);
    });
  }

  test(`${medium} editorial routes do not force unrelated valid legacy source carriers to migrate`, () => {
    const meaning = meaningFor(medium, true);
    const scene = sceneFor(meaning, medium);
    scene.routes = [
      {
        ...structuredClone(scene.routes[0]),
        id: 'editorial-route',
        reference: editorialRef,
        editionSha256: meaning.edition.sha256,
      },
    ];
    scene.edges.push(
      medium === 'static'
        ? {
            id: 'legacy-requests',
            kind: 'flow',
            source: 'client',
            target: 'server',
            points: [
              { x: 152, y: 200 },
              { x: 688, y: 200 },
            ],
            strokeWidth: 1.5,
            strokeTone: 'ink',
            arrow: true,
            arrowGeometry: { ...arrowGeometry },
            semanticIds: [ref('relation', 'request'), ref('relation', 'telemetry')],
          }
        : {
            id: 'legacy-requests',
            from: 'client',
            to: 'server',
            label: 'Source requests',
            visualRole: 'default',
            fromSide: 'right',
            toSide: 'left',
            route: 'straight',
            semanticIds: [ref('relation', 'request'), ref('relation', 'telemetry')],
          },
    );
    assert.doesNotThrow(() => compose(meaning, medium));
    const invalidMeaning = structuredClone(meaning);
    sceneFor(invalidMeaning, medium).routes[0].traversals[1].direction = 'reverse';
    rejected(invalidMeaning, medium);
  });

  for (const defect of ['wide-stroke-text', 'arrow-wing-text', 'stroke-outside-canvas']) {
    test(`${medium} selected literal paint refuses ${defect}`, () => {
      const meaning = meaningFor(medium);
      const scene = sceneFor(meaning, medium);
      if (defect === 'wide-stroke-text') {
        scene.edges[2].strokeWidth = 100;
        scene.texts.push({
          ...structuredClone(scene.texts[0]),
          id: 'stroke-obstacle',
          semanticIds: [],
          text: 'Obstacle',
          x: 540,
          baseline: 160,
          box: { x: 540, y: 150, width: 40, height: 15 },
        });
      }
      if (defect === 'arrow-wing-text') {
        scene.edges[2].arrowGeometry.halfWidth = 80;
        scene.texts.push({
          ...structuredClone(scene.texts[0]),
          id: 'arrow-obstacle',
          semanticIds: [],
          text: 'Obstacle',
          x: 677,
          baseline: 140,
          box: { x: 677, y: 126, width: 8, height: 16 },
        });
      }
      if (defect === 'stroke-outside-canvas') {
        for (const edge of scene.edges) for (const point of edge.points) point.y -= 187;
        for (const node of scene.nodes) (medium === 'static' ? node.box : node.position).y = 1;
        scene.edges[2].strokeWidth = 100;
      }
      assert.throws(() => compose(meaning, medium), /authored_.*paint|authored_.*geometry/u);
    });
  }

  test(`${medium} an editorial return between two occurrences never creates a source self-loop`, () => {
    const meaning = meaningFor(medium, true);
    const scene = sceneFor(meaning, medium);
    const returned = structuredClone(scene.nodes[0]);
    returned.id = 'client-return';
    (medium === 'static' ? returned.box : returned.position).y = 348;
    scene.nodes.push(returned);
    scene.texts.at(-1).x = 400;
    scene.texts.at(-1).box.x = 400;
    scene.edges.push({
      ...structuredClone(scene.edges[0]),
      id: 'return',
      ...(medium === 'static'
        ? { source: 'client', target: 'client-return' }
        : { from: 'client', to: 'client-return' }),
      points: [
        { x: 140, y: 212 },
        { x: 140, y: 348 },
      ],
      arrow: true,
    });
    scene.routes.push({
      id: 'conditional-return',
      reference: editorialRef,
      source: 'client',
      target: 'client-return',
      editionSha256: meaning.edition.sha256,
      traversals: [{ edge: 'return', direction: 'forward' }],
    });
    const result = compose(meaning, medium);
    if (medium === 'interactive') {
      const records = result.pages[0].facts.filter(({ graphicId }) => graphicId === 'return');
      assert.equal(records.length, 1);
      assert.equal(records[0].reference, editorialRef);
      assert.equal(Object.hasOwn(records[0], 'sourceSha256'), false);
      assert.equal(records[0].editionSha256, meaning.edition.sha256);
    } else
      assert.equal(
        new Map(result.carriers.relationGraphics)
          .get(ref('relation', 'request'))
          .includes('edge:return'),
        false,
      );
  });

  test(`${medium} opposite source routes share an unarrowed bridge with independent terminal arrows`, () => {
    const meaning = meaningFor(medium, true);
    const forward = meaning.native.selections[0];
    const reverse = structuredClone(forward);
    reverse.selectionId = 'response';
    reverse.target.id = 'response';
    reverse.members.relations[0].id = 'response';
    reverse.members.relations[0].from.id = 'server';
    reverse.members.relations[0].to.id = 'client';
    meaning.native.selections.push(reverse);
    meaning.assertions.push({ id: 'response', kind: 'source', selection: 'response' });
    meaning.media[medium].views[0].assertionIds.push('response');
    const scene = sceneFor(meaning, medium);
    scene.requiredSemanticIds.push(ref('relation', 'response'));
    scene.texts.at(-1).semanticIds = [ref('relation', 'response'), editorialRef];
    scene.texts.push({
      ...structuredClone(scene.texts.at(-1)),
      id: 'own-editorial',
      x: 500,
      baseline: 390,
      box: { x: 500, y: 378, width: 120, height: 14 },
      semanticIds: [editorialRef],
    });
    const back = {
      ...structuredClone(scene.edges[2]),
      id: 'response-terminal',
      ...(medium === 'static'
        ? { source: 'junction', target: 'client' }
        : { from: 'junction', to: 'client' }),
      points: [...scene.edges[0].points].reverse(),
    };
    const approach = {
      ...structuredClone(scene.edges[2]),
      id: 'response-approach',
      ...(medium === 'static'
        ? { source: 'server', target: 'junction' }
        : { from: 'server', to: 'junction' }),
      points: [...scene.edges[2].points].reverse(),
      arrow: false,
    };
    scene.edges.push(approach, back);
    scene.routes.push({
      id: 'response-route',
      reference: ref('relation', 'response'),
      source: 'server',
      target: 'client',
      traversals: [
        { edge: 'response-approach', direction: 'forward' },
        { edge: 'bridge', direction: 'reverse' },
        { edge: 'response-terminal', direction: 'forward' },
      ],
    });
    const result = compose(meaning, medium);
    const records =
      medium === 'static'
        ? new Map(result.carriers.relationGraphics).get(ref('relation', 'response'))
        : result.pages[0].facts
            .filter(({ reference }) => reference === ref('relation', 'response'))
            .map(({ graphicId }) => graphicId);
    assert.equal(records.length, 3);
    assert.equal(records.includes(medium === 'static' ? 'edge:bridge' : 'bridge'), true);
  });

  test(`${medium} bounded duplicate routes count every traversal before carrier deduplication`, () => {
    const meaning = meaningFor(medium);
    const scene = sceneFor(meaning, medium);
    const junction = scene.nodes[1];
    (medium === 'static' ? junction.box : junction.size).width = 72;
    junction.primitives[0].box.width = 72;
    const bridge = scene.edges[1];
    bridge.points = [
      { x: 400, y: 200 },
      { x: 400, y: 188 },
      { x: 436, y: 188 },
    ];
    scene.edges[2].points[0].x = 472;
    scene.edges.push(
      {
        ...structuredClone(bridge),
        id: 'bridge-middle',
        points: [
          { x: 436, y: 188 },
          { x: 436, y: 212 },
        ],
      },
      {
        ...structuredClone(bridge),
        id: 'bridge-end',
        points: [
          { x: 436, y: 212 },
          { x: 472, y: 212 },
          { x: 472, y: 200 },
        ],
      },
    );
    const route = {
      ...scene.routes[0],
      traversals: ['approach', 'bridge', 'bridge-middle', 'bridge-end', 'terminal'].map((edge) => ({
        edge,
        direction: 'forward',
      })),
    };
    scene.routes = Array.from({ length: 1639 }, (_, index) => ({
      ...structuredClone(route),
      id: `shared-${index}`,
    }));
    assert.throws(() => compose(meaning, medium), { code: 'authored_route_budget_exceeded' });
  });
}

test('one generated refinement schema admits exact routes in both independent media', () => {
  const refinement = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      static: meaningFor('static').refinement.media.static,
      interactive: meaningFor('interactive').refinement.media.interactive,
    },
  };
  const bytes = Buffer.from(JSON.stringify(refinement));
  assert.equal(
    parseSelectedSceneRefinement(bytes, ['static', 'interactive'], sha(bytes)).media.static.scene
      .routes.length,
    2,
  );
});
