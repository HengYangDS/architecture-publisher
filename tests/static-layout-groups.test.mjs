import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createMetricReader } from '../src/static/metrics.mjs';
import { composeNaturalOverview } from '../editions/ethos/static/natural-overview.mjs';
import { compileTraceScene } from '../editions/ethos/static/trace-scene.mjs';
import { auditNaturalSeparation } from '../src/geometry/separation.mjs';
import { auditNaturalSemantics } from '../editions/ethos/static/natural-semantics.mjs';
import {
  sha256,
  stableStringify,
} from '../src/integrations/ethos/projection.mjs';

async function selected() {
  const read = async (p) =>
    JSON.parse(await fs.readFile(new URL(p, import.meta.url)));
  const source = await read(
    './fixtures/ethos-source/projection-input.json',
  );
  const metrics = await read(
    '../editions/ethos/static/authoring/metrics.json',
  );
  const added = await read('./fixtures/refresh-metrics.json');
  const reader = createMetricReader({
    ...metrics,
    records: [...metrics.records, ...added.records],
  });
  const quality = JSON.parse(source.documents.quality_contract);
  const refresh = {
    sha256: sha256(
      stableStringify(source.semantics.nodes.candidate_base_stale),
    ),
    replay: 'Unpublished: replay; then re-prove',
    merge: 'Preserve history: merge; then re-prove',
    pending: 'Merge: exact continuation or preserved rollback',
  };
  const view = composeNaturalOverview(source, reader.measure, quality, {
    refresh,
  });
  return {
    source,
    view,
    scene: compileTraceScene(view.document, reader.measure),
    quality,
  };
}

test('refresh alternatives form one continuous text run aligned to the value column', async () => {
  const { view, scene, quality } = await selected();
  const text = (id) => scene.texts.find((t) => t.id === id);
  assert.equal(
    text('refresh-options')?.text,
    'Unpublished: replay; then re-prove · Preserve history: merge; then re-prove',
  );
  assert.equal(text('refresh-replay'), undefined);
  assert.equal(text('refresh-merge'), undefined);
  assert.equal(text('refresh-key').box.x, text('runtime-key').box.x);
  assert.equal(text('refresh-options').box.x, text('runtime-0').box.x);
  assert.equal(
    text('refresh-options').baseline,
    text('refresh-key').baseline,
  );
  assert.equal(text('refresh-pending-key')?.text, 'Pending');
  assert.equal(
    text('refresh-pending-key').box.x,
    text('runtime-upgrade-key').box.x,
  );
  assert.equal(
    text('refresh-pending').box.x,
    text('runtime-upgrade-0').box.x,
  );
  assert.equal(
    text('refresh-options').baseline,
    text('refresh-pending').baseline,
  );
  assert.deepEqual(
    auditNaturalSeparation(scene, view.separation, quality).failures,
    [],
  );
});

test('pending recovery keeps its visible semantic field name', async () => {
  const { source, view } = await selected();
  view.document.labels.find(
    (label) => label.id === 'refresh-pending-key',
  ).text = '';
  assert(
    auditNaturalSemantics(view, source).failures.includes(
      'refresh-meaning-visible',
    ),
  );
});

test('proposal retirement shares the header right edge and preserves review baseline', async () => {
  const { view, scene, quality } = await selected();
  const text = (id) => scene.texts.find((t) => t.id === id);
  const right = (t) => t.box.x + t.box.width;
  assert(
    Math.abs(right(text('maturity')) - right(text('kernel-scope'))) < 0.01,
  );
  assert(
    Math.abs(right(text('review-exit')) - right(text('maturity'))) < 0.01,
  );
  const gap =
    text('review-exit').box.x -
    (text('review').box.x +
      text('review').box.width *
        (1 +
          quality.hard_gates.geometry_each_scale
            .font_width_growth_fraction));
  assert(
    gap >=
      quality.hard_gates.geometry_each_scale
        .semantic_peer_group_gap_px_at_reference_min,
  );
  assert.equal(text('review').baseline, text('review-exit').baseline);
  const wrong = structuredClone(scene);
  wrong.texts.find((t) => t.id === 'review-exit').box.x += 40;
  assert(
    auditNaturalSeparation(
      wrong,
      view.separation,
      quality,
    ).failures.includes('alignment:header-scope'),
  );
  const unaligned = structuredClone(scene);
  unaligned.texts.find((t) => t.id === 'maturity').box.x -= 16;
  assert(
    auditNaturalSeparation(
      unaligned,
      view.separation,
      quality,
    ).failures.includes('alignment:header-scope'),
  );
});
