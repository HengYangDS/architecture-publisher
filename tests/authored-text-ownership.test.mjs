import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { parseSelectedSceneRefinement } from '../packages/publisher/src/edition/refinement.mjs';
import { validateInteractiveArchitectureScene } from '../packages/publisher/src/scene/interactive/architecture.mjs';
import { renderArchitectureScene } from '../packages/publisher/renderers/archify/index.mjs';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import { assertAuthoredCanvasScene } from '../packages/publisher/src/scene/static/audit.mjs';
import { composeAuthoredStaticCanvas } from '../packages/publisher/src/scene/static/authored-canvas.mjs';
import {
  importClaimModel,
  resolveClaimModelSelection,
} from '../packages/publisher/src/semantics/native-claim-model.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { validateAuthoredTextOwners } from '../packages/publisher/src/scene/text-ownership.mjs';

const reference = JSON.stringify(['example', 'entity', 'client']);
const otherReference = JSON.stringify(['example', 'entity', 'server']);

function scene() {
  return {
    schema: 'architecture.interactive-scene/v1',
    id: 'overview',
    title: 'Owned text',
    subtitle: 'Source labels retain their declared component',
    viewport: { width: 900, height: 460 },
    nodes: [
      {
        id: 'client',
        position: { x: 180, y: 180 },
        size: { width: 300, height: 100 },
        semanticIds: [reference],
        primitives: [
          {
            kind: 'rect',
            box: { x: 0, y: 0, width: 300, height: 100 },
            fill: 'paper',
            stroke: 'ink',
            strokeWidth: 1.2,
          },
        ],
      },
    ],
    texts: [
      {
        id: 'client-label',
        text: 'Source client',
        owner: 'client',
        fontSize: 14,
        weight: '400',
        anchor: 'start',
        tone: 'ink',
        x: 200,
        baseline: 226,
        visible: true,
        semanticIds: [reference],
        box: { x: 200, y: 212, width: 110, height: 14 },
      },
    ],
    edges: [],
    groups: [],
    requiredSemanticIds: [reference],
  };
}

test('authored schema and interactive reader retain one explicit text owner', () => {
  const value = scene();
  const refinement = {
    schema: 'architecture.scene-refinement/v1',
    media: {
      interactive: {
        kind: 'authored-architecture',
        pages: [
          {
            id: 'overview',
            label: value.subtitle,
            purpose: 'overview',
            scene: value,
          },
        ],
      },
    },
  };
  assert.equal(
    parseSelectedSceneRefinement(
      Buffer.from(JSON.stringify(refinement)),
      ['interactive'],
      '1'.repeat(64),
    ).media.interactive.pages[0].scene.texts[0].owner,
    'client',
  );
  assert.equal(validateInteractiveArchitectureScene(value).texts[0].owner, 'client');
});

test('text owner must resolve to a source-bearing local node', () => {
  for (const edit of [
    (value) => {
      value.texts[0].owner = 'absent';
    },
    (value) => {
      value.texts[0].owner = '__proto__';
    },
    (value) => {
      value.nodes[0].adornment = true;
      value.nodes[0].semanticIds = [];
    },
  ]) {
    const value = scene();
    edit(value);
    assert.throws(() => validateInteractiveArchitectureScene(value), {
      code: 'authored_text_owner_invalid',
    });
  }
});

test('interior text cannot borrow another node structural identity', () => {
  const value = scene();
  value.texts[0].semanticIds = [otherReference];
  assert.throws(() => validateInteractiveArchitectureScene(value), {
    code: 'authored_text_owner_binding_invalid',
  });
});

test('ownerless inputs do not acquire inferred ownership', () => {
  const value = scene();
  delete value.texts[0].owner;
  const admitted = validateInteractiveArchitectureScene(value);
  assert.equal(Object.hasOwn(admitted.texts[0], 'owner'), false);
});

test('owned text references retain exact canonical nonempty identity parts', () => {
  for (const invalid of [
    'not-json',
    JSON.stringify(['', 'claim', 'statement']),
    JSON.stringify(['example', 'claim', '']),
    JSON.stringify(['example', 'claim', 1]),
    JSON.stringify(['example', 'claim', 'statement', 'extra']),
    JSON.stringify(['example', 'unknown', 'statement']),
    '["example", "claim", "statement"]',
  ]) {
    const value = scene();
    value.texts[0].semanticIds = [invalid];
    assert.throws(() => validateInteractiveArchitectureScene(value), {
      code: 'authored_text_owner_binding_invalid',
    });
  }
});

test('owner identity refuses invalid values and duplicate scene-local allocations', () => {
  for (const owner of [null, 1, '', 'Client', 'constructor']) {
    const value = scene();
    value.texts[0].owner = owner;
    assert.throws(() => validateAuthoredTextOwners(value.texts, value.nodes), {
      code: 'authored_text_owner_invalid',
    });
  }
  const value = scene();
  value.nodes.push(structuredClone(value.nodes[0]));
  assert.throws(() => validateAuthoredTextOwners(value.texts, value.nodes), {
    code: 'authored_text_owner_invalid',
  });
});

test('claim and editorial text keep separate statement membership from node allocation', () => {
  const value = scene();
  value.texts[0].semanticIds = [
    JSON.stringify(['example', 'claim', 'statement']),
    JSON.stringify(['owned-reading', 'editorial', 'decision']),
  ];
  assert.doesNotThrow(() => validateInteractiveArchitectureScene(value));
});

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-owned-text-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const value = scene();
  const fonts = await loadBundledFonts();
  const measurer = await createBundledTextMeasurer(fonts, value.texts);
  for (const label of value.texts) label.box = measurer.box(label);
  return { root, value };
}

function staticScene(value) {
  return {
    schema: 'architecture.authored-static-scene/v1',
    title: value.title,
    subtitle: value.subtitle,
    width: value.viewport.width,
    height: value.viewport.height,
    referenceWidth: value.viewport.width,
    spine: [],
    paint: { paper: '#f3f0e8', ink: '#26362f' },
    nodes: value.nodes.map(({ id, position, size, semanticIds, primitives }) => ({
      id,
      box: { ...position, ...size },
      semanticIds,
      primitives,
    })),
    texts: value.texts,
    edges: [],
    decorations: [],
    requiredSemanticIds: value.requiredSemanticIds,
  };
}

function crossingPrimitive(value) {
  value.nodes[0].primitives.push({
    kind: 'line',
    start: { x: 0, y: 40 },
    end: { x: 300, y: 40 },
    fill: null,
    stroke: 'ink',
    strokeWidth: 1.2,
  });
}

test('static authored schema and source composition retain the declared text owner', () => {
  const model = claimModel();
  const bytes = Buffer.from(JSON.stringify(model));
  const imported = importClaimModel(
    {
      namespace: 'example',
      format: { id: 'architecture.claim-model', version: '2' },
      sha256: createHash('sha256').update(bytes).digest('hex'),
      claimant: model.owner,
    },
    bytes,
    'native',
  );
  const selection = resolveClaimModelSelection(imported, {
    id: 'client',
    namespace: 'example',
    kind: 'reference',
    reference: 'entity:client',
  });
  const value = staticScene(scene());
  const refinement = {
    schema: 'architecture.scene-refinement/v1',
    media: { static: { kind: 'authored-canvas', scene: value } },
  };
  assert.equal(
    parseSelectedSceneRefinement(
      Buffer.from(JSON.stringify(refinement)),
      ['static'],
      '1'.repeat(64),
    ).media.static.scene.texts[0].owner,
    'client',
  );
  const meaning = {
    edition: { id: 'owned-reading', editor: 'example:editor', sha256: '1'.repeat(64) },
    editorial: { title: value.title },
    assertions: [{ id: 'client', kind: 'source', selection: 'client' }],
    native: { selections: [selection] },
    media: { static: { views: [{ id: 'overview', assertionIds: ['client'] }] } },
    refinement,
  };
  const composed = composeAuthoredStaticCanvas(meaning);
  assert.equal(composed.scene.texts[0].owner, 'client');
  const rejected = structuredClone(meaning);
  rejected.refinement.media.static.scene.texts[0].semanticIds = [otherReference];
  assert.throws(() => composeAuthoredStaticCanvas(rejected), {
    code: 'authored_text_owner_binding_invalid',
  });
});

test('static owner inset uses the independent reference coordinate frame', async (t) => {
  const { value } = await fixture(t);
  const selected = staticScene(value);
  selected.referenceWidth = selected.width * 2;
  assert.doesNotThrow(() => assertAuthoredCanvasScene(selected));
  const shift = 183 - selected.texts[0].box.x;
  selected.texts[0].x += shift;
  selected.texts[0].box.x += shift;
  assert.throws(() => assertAuthoredCanvasScene(selected), {
    code: 'authored_canvas_geometry_invalid',
  });
});

test('static text ownership cannot waive an internal primitive crossing its glyphs', async (t) => {
  const { value } = await fixture(t);
  crossingPrimitive(value);
  assert.throws(() => assertAuthoredCanvasScene(staticScene(value)), {
    code: 'authored_canvas_geometry_invalid',
  });
});

test('static owned text clears every painted primitive boundary, not a node envelope', async (t) => {
  const { value } = await fixture(t);
  const box = value.texts[0].box;
  const local = (x, y) => ({ x: x - 180, y: y - 180 });
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const valid = [
    {
      kind: 'circle',
      center: { x: 150, y: 50 },
      radius: 180,
      fill: 'paper',
      stroke: 'ink',
      strokeWidth: 1.2,
    },
    {
      kind: 'rect',
      box: { x: 0, y: 0, width: 300, height: 100 },
      fill: 'paper',
      stroke: null,
      strokeWidth: 0,
    },
    {
      kind: 'polyline',
      points: [
        { x: 0, y: 0 },
        { x: 300, y: 0 },
        { x: 300, y: 100 },
        { x: 0, y: 100 },
      ],
      closed: true,
      fill: 'paper',
      stroke: 'ink',
      strokeWidth: 1.2,
    },
    {
      kind: 'polyline',
      points: [
        { x: 0, y: 80 },
        { x: 300, y: 80 },
      ],
      closed: false,
      fill: null,
      stroke: 'ink',
      strokeWidth: 1.2,
    },
  ];
  for (const primitive of valid) {
    const selected = structuredClone(value);
    selected.nodes[0].primitives = [primitive];
    assert.doesNotThrow(() => assertAuthoredCanvasScene(staticScene(selected)));
  }
  const invalid = [
    {
      kind: 'circle',
      center: local(box.x + box.width, middle.y),
      radius: box.width / 2,
      fill: 'paper',
      stroke: 'ink',
      strokeWidth: 1.2,
    },
    {
      kind: 'rect',
      box: { ...local(middle.x, box.y - 10), width: 30, height: box.height + 20 },
      fill: 'ink',
      stroke: null,
      strokeWidth: 0,
    },
    {
      kind: 'polyline',
      points: [local(box.x - 20, middle.y), local(box.x + box.width + 20, middle.y)],
      closed: false,
      fill: null,
      stroke: 'ink',
      strokeWidth: 1.2,
    },
  ];
  for (const primitive of invalid) {
    const selected = structuredClone(value);
    selected.nodes[0].primitives.push(primitive);
    assert.throws(() => assertAuthoredCanvasScene(staticScene(selected)), {
      code: 'authored_canvas_geometry_invalid',
    });
  }
});

test('static owned text cannot waive a neighboring component', async (t) => {
  const { value } = await fixture(t);
  value.nodes.push({
    ...structuredClone(value.nodes[0]),
    id: 'neighbor',
    semanticIds: [otherReference],
  });
  assert.throws(() => assertAuthoredCanvasScene(staticScene(value)), {
    code: 'authored_canvas_geometry_invalid',
  });
});

test('native owned text cannot waive a neighboring component', async (t) => {
  const { root, value } = await fixture(t);
  value.nodes.push({
    ...structuredClone(value.nodes[0]),
    id: 'neighbor',
    semanticIds: [otherReference],
  });
  await assert.rejects(
    renderArchitectureScene({ scene: value, output: path.join(root, 'architecture.html') }),
    /collision/u,
  );
});

test('owned text cannot exempt a filled interior decoration that covers its glyphs', async (t) => {
  const { root, value } = await fixture(t);
  const box = value.texts[0].box;
  value.nodes[0].primitives.push({
    kind: 'rect',
    box: { x: box.x - 190, y: box.y - 190, width: box.width + 20, height: box.height + 20 },
    fill: 'ink',
    stroke: null,
    strokeWidth: 0,
  });
  assert.throws(() => assertAuthoredCanvasScene(staticScene(value)), {
    code: 'authored_canvas_geometry_invalid',
  });
  await assert.rejects(
    renderArchitectureScene({ scene: value, output: path.join(root, 'architecture.html') }),
    /collision/u,
  );
});

test('a first interior fill is not the containing owner paint', async (t) => {
  const { root, value } = await fixture(t);
  const box = value.texts[0].box;
  value.nodes[0].primitives = [
    {
      kind: 'rect',
      box: { x: box.x - 190, y: box.y - 190, width: box.width + 20, height: box.height + 20 },
      fill: 'ink',
      stroke: null,
      strokeWidth: 0,
    },
  ];
  assert.throws(() => assertAuthoredCanvasScene(staticScene(value)), {
    code: 'authored_canvas_geometry_invalid',
  });
  await assert.rejects(
    renderArchitectureScene({ scene: value, output: path.join(root, 'architecture.html') }),
    /collision/u,
  );
});

test('native component labels remain obstacles for additional owned text', async (t) => {
  const { root, value } = await fixture(t);
  value.nodes[0] = {
    id: 'client',
    label: 'Native label',
    visualRole: 'frontend',
    position: { x: 180, y: 180 },
    size: { width: 300, height: 100 },
    semanticIds: [reference],
  };
  value.texts[0].x = 280;
  value.texts[0].baseline = 234;
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), value.texts);
  value.texts[0].box = measurer.box(value.texts[0]);
  await assert.rejects(
    renderArchitectureScene({ scene: value, output: path.join(root, 'architecture.html') }),
    /collision/u,
  );
});

test('owned text has no exemption from native component paint even away from its label', async (t) => {
  const { root, value } = await fixture(t);
  value.nodes[0] = {
    id: 'client',
    label: 'Native label',
    visualRole: 'frontend',
    position: { x: 180, y: 180 },
    size: { width: 300, height: 100 },
    semanticIds: [reference],
  };
  value.texts[0].x = 200;
  value.texts[0].baseline = 210;
  const measurer = await createBundledTextMeasurer(await loadBundledFonts(), value.texts);
  value.texts[0].box = measurer.box(value.texts[0]);
  await assert.rejects(
    renderArchitectureScene({ scene: value, output: path.join(root, 'architecture.html') }),
    /collision/u,
  );
});

test('native owned text cannot waive crossing source routes', async (t) => {
  const { root, value } = await fixture(t);
  const box = value.texts[0].box;
  value.edges.push({
    id: 'crossing',
    from: 'client',
    to: 'client',
    points: [
      { x: 180, y: box.y + box.height / 2 },
      { x: 480, y: box.y + box.height / 2 },
    ],
    adornment: true,
    semanticIds: [],
    strokeWidth: 1.5,
    strokeTone: 'ink',
    arrow: true,
    arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 1.2 },
  });
  await assert.rejects(
    renderArchitectureScene({ scene: value, output: path.join(root, 'architecture.html') }),
    { code: 'authored_route_paint_geometry_invalid' },
  );
});

test('native owned text cannot waive arrowheads clear of their center line', async (t) => {
  const { root, value } = await fixture(t);
  const shift = 430 - value.texts[0].box.x - value.texts[0].box.width / 2;
  value.texts[0].x += shift;
  value.texts[0].box.x += shift;
  const box = value.texts[0].box;
  value.edges.push({
    id: 'arrowhead-crossing',
    from: 'client',
    to: 'client',
    points: [
      { x: 180, y: box.y + box.height + 10 },
      { x: 480, y: box.y + box.height + 10 },
    ],
    adornment: true,
    semanticIds: [],
    strokeWidth: 1.5,
    strokeTone: 'ink',
    arrow: true,
    arrowGeometry: { length: 100, halfWidth: 40, strokeWidth: 1.2 },
  });
  await assert.rejects(
    renderArchitectureScene({ scene: value, output: path.join(root, 'architecture.html') }),
    { code: 'authored_route_paint_geometry_invalid' },
  );
});

test('native text ownership cannot waive an internal primitive crossing its glyphs', async (t) => {
  const { root, value } = await fixture(t);
  crossingPrimitive(value);
  const output = path.join(root, 'architecture.html');
  await assert.rejects(renderArchitectureScene({ scene: value, output }), /collision/u);
  await assert.rejects(fs.access(output), { code: 'ENOENT' });
});

test('public native renderer paints exact measured text inside its declared owner', async (t) => {
  const { root, value } = await fixture(t);
  const output = path.join(root, 'architecture.html');
  const result = await renderArchitectureScene({ scene: value, output });
  assert.equal(result.status, 'rendered');
  const html = await fs.readFile(output, 'utf8');
  assert.match(html, /data-text-id="client-label"/u);
  assert.match(html, /Source client/u);
  assert.equal(result.nativeValidation.warnings, 0);
});

test('native text owner does not waive its inner inset', async (t) => {
  const { root, value } = await fixture(t);
  const shift = 183 - value.texts[0].box.x;
  value.texts[0].x += shift;
  value.texts[0].box.x += shift;
  const output = path.join(root, 'architecture.html');
  await assert.rejects(renderArchitectureScene({ scene: value, output }), /owner/u);
  await assert.rejects(fs.access(output), { code: 'ENOENT' });
});

test('declared owner leaves other texts as collision obstacles', async (t) => {
  const { root, value } = await fixture(t);
  value.texts.push({ ...structuredClone(value.texts[0]), id: 'overlapping-label' });
  const output = path.join(root, 'architecture.html');
  await assert.rejects(renderArchitectureScene({ scene: value, output }), /collision/u);
  await assert.rejects(fs.access(output), { code: 'ENOENT' });
});

test('ownerless text inside a node still fails instead of receiving an inferred exemption', async (t) => {
  const { root, value } = await fixture(t);
  delete value.texts[0].owner;
  await assert.rejects(
    renderArchitectureScene({ scene: value, output: path.join(root, 'architecture.html') }),
    /collision/u,
  );
});
