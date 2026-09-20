import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { writeSourceBundle } from '../packages/publisher/src/source/write.mjs';
import { readEthosSource } from '../packages/extensions/ethos/src/adapter/projection.mjs';
import { createMetricReader } from '../packages/publisher/renderers/svg/metrics.mjs';
import { composeNaturalOverview } from '../packages/extensions/ethos/src/edition/static/natural-overview.mjs';
import {
  compileTraceScene,
  renderTraceSvg,
} from '../packages/extensions/ethos/src/edition/static/trace-scene.mjs';
import { auditNaturalSemantics } from '../packages/extensions/ethos/src/edition/static/natural-semantics.mjs';
import { auditScene, auditCanvasEnvelope } from '../packages/publisher/src/qualification/static/scene.mjs';
import { auditEmittedEdges } from '../packages/publisher/src/qualification/static/emitted-path.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const sourceSha256 =
  '58121ad168a314af94b55f557435ffb7d9828ca7c476411f18467731ae9d1db0';
const projectionDigest =
  '4ea40f421434106948f1e1d2d9ae5ee6c8b9868edc5538ff755876fd01d37ef8';
async function api() {
  const entry = new URL('../packages/extensions/ethos/src/edition/poster.mjs', import.meta.url);
  await assert.doesNotReject(
    fs.access(entry),
    'source-bound poster implementation exists',
  );
  return (await import(entry)).renderEthosPoster;
}
async function setup(t, mutate) {
  const base = path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  const dir = await fs.mkdtemp(path.join(base, 'poster '));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const authoring = path.join(root, 'packages/extensions/ethos/src/edition/static/authoring');
  const members = await Promise.all(
    ['edition.json', 'metrics.json'].map(async (p) => ({
      path: p,
      content: await fs.readFile(path.join(authoring, p)),
    })),
  );
  if (mutate) mutate(members);
  const bundle = await writeSourceBundle(
    path.join(dir, 'edition'),
    { id: 'ethos:poster', revision: 'selected' },
    members,
  );
  return {
    dir,
    plan: {
      sourceManifest: path.join(
        root,
        'tests/fixtures/ethos-source/manifest.json',
      ),
      sourceSha256,
      projectionDigest,
      editionManifest: bundle.manifestPath,
      editionSha256: bundle.manifestSha256,
      output: path.join(dir, 'publication'),
    },
  };
}
test('rebuilds the complete accepted SVG from selected source and recorded measurements', async (t) => {
  const render = await api(),
    f = await setup(t),
    result = await render(f.plan);
  const svg = await fs.readFile(path.join(f.plan.output, 'terminal.svg'));
  assert.equal(result.status, 'rendered');
  assert.equal(
    hash(svg),
    '87594199a5b3182860d6ed1a16b446082a2862cc52b8ed8c1731111f3e600bfa',
  );
  assert.equal(result.labels, 180);
  assert.equal(result.measurement, 'recorded');
  assert.equal(result.browserAcceptance, 'not-performed');
  assert.equal(result.semanticAcceptance, 'not-performed');
  assert.deepEqual(Object.keys(result.checks).sort(), [
    'canvas',
    'emittedEdges',
    'geometry',
    'separation',
    'sourceBindings',
  ]);
  assert(Object.values(result.checks).every((x) => x.failures.length === 0));
  const manifest = JSON.parse(
    await fs.readFile(path.join(f.plan.output, 'manifest.json')),
  );
  for (const file of manifest.files)
    assert.equal(
      hash(await fs.readFile(path.join(f.plan.output, file.path))),
      file.sha256,
    );
  assert.match(
    await fs.readFile(path.join(f.plan.output, 'text.txt'), 'utf8'),
    /Reliable repository evolution/,
  );
});
for (const [name, mutate] of [
  [
    'source substitution',
    (m) => {
      const e = JSON.parse(m[0].content);
      e.source.commit = '0'.repeat(40);
      m[0].content = Buffer.from(JSON.stringify(e));
    },
  ],
  [
    'changed metric bytes',
    (m) => {
      const e = JSON.parse(m[1].content);
      e.records[0][1].width += 1;
      m[1].content = Buffer.from(JSON.stringify(e));
    },
  ],
  [
    'undeclared executable adapter',
    (m) => {
      const e = JSON.parse(m[0].content);
      e.adapter = './code.mjs';
      m[0].content = Buffer.from(JSON.stringify(e));
    },
  ],
  [
    'changed expected SVG',
    (m) => {
      const e = JSON.parse(m[0].content);
      e.expected.svgSha256 = '0'.repeat(64);
      m[0].content = Buffer.from(JSON.stringify(e));
    },
  ],
])
  test(`poster rejects ${name} before reserving output`, async (t) => {
    const render = await api(),
      f = await setup(t, mutate);
    await assert.rejects(render(f.plan));
    await assert.rejects(fs.stat(f.plan.output), { code: 'ENOENT' });
  });
test('poster preserves an occupied destination', async (t) => {
  const render = await api(),
    f = await setup(t);
  await fs.mkdir(f.plan.output);
  await fs.writeFile(path.join(f.plan.output, 'keep'), 'owned');
  await assert.rejects(render(f.plan), { code: 'output_exists' });
  assert.equal(
    await fs.readFile(path.join(f.plan.output, 'keep'), 'utf8'),
    'owned',
  );
});

test('retained checks detect changed meaning, actual emitted edges and painted overlaps', async () => {
  const source = await readEthosSource(
    path.join(root, 'tests/fixtures/ethos-source/manifest.json'),
    sourceSha256,
    projectionDigest,
  );
  const metrics = createMetricReader(
    JSON.parse(
      await fs.readFile(
        path.join(root, 'packages/extensions/ethos/src/edition/static/authoring/metrics.json'),
      ),
    ),
  );
  const input = source.projection,
    quality = JSON.parse(input.documents.quality_contract);
  const view = composeNaturalOverview(input, metrics.measure, quality);
  const scene = compileTraceScene(view.document, metrics.measure),
    svg = renderTraceSvg(scene);
  const geometry = quality.hard_gates.geometry_each_scale;
  const limits = {
    minimumFont:
      quality.hard_gates.typography_and_accessibility
        .effective_font_px_min_at_reference,
    ownerClearance:
      geometry.inside_glyph_to_owner_inner_stroke_px_at_reference_min,
    textClearance:
      geometry.text_to_nonowner_geometry_clearance_px_at_reference_min,
    endpointTolerance: geometry.arrow_tip_error_px_max,
    minimumTerminal: geometry.arrow_terminal_straight_run_px_at_reference_min,
    widthGrowth: geometry.font_width_growth_fraction,
    heightGrowth: geometry.font_height_growth_fraction,
  };
  assert.equal(auditScene(scene, limits).failures.length, 0);
  const overlapping = structuredClone(scene);
  overlapping.texts[1].box = { ...overlapping.texts[0].box };
  assert(
    auditScene(overlapping, limits).failures.some(
      (x) => x.code === 'text-overlap',
    ),
  );
  const outside = structuredClone(scene);
  outside.texts[0].box.x = -10;
  assert(
    auditCanvasEnvelope(outside, quality).failures.some(
      (x) => x.code === 'canvas-clearance',
    ),
  );
  const missingEdge = svg.replace(/<path\b[^>]*data-edge="align"[^>]*\/>/, '');
  assert.notEqual(missingEdge, svg);
  assert.throws(
    () => auditEmittedEdges(missingEdge, scene, limits),
    /identity set mismatch/,
  );
  const shifted = svg.replace(
    /(data-edge="align"[^>]* d=")M [\d.]+ [\d.]+/,
    '$1M 0 0',
  );
  assert.notEqual(shifted, svg);
  assert(
    auditEmittedEdges(shifted, scene, limits).failures.some(
      (x) => x.code === 'emitted-endpoint-mismatch',
    ),
  );
  const misbound = structuredClone(view);
  misbound.witnesses.relations.align = [];
  assert(auditNaturalSemantics(misbound, input).failures.length > 0);
});
