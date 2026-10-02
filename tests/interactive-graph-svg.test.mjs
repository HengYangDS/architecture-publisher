import assert from 'node:assert/strict';
import test from 'node:test';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { createBundledTextMeasurer } from '../packages/publisher/renderers/resvg/measurement.mjs';
import { layoutInteractivePages } from '../packages/publisher/renderers/elk/layout.mjs';
import { interactiveLabelRequests } from '../packages/publisher/renderers/elk/text.mjs';

test('the painter emits exact graph paths and glyph positions without a second geometry engine', async () => {
  const painter = await import('../packages/publisher/renderers/interactive/graph-svg.mjs').catch(
    () => null,
  );
  assert.equal(typeof painter?.renderGraphSvg, 'function', 'the exact SVG painter must exist');
  const page = {
    nodes: [
      { id: 'n-0', label: 'Input <exact>' },
      { id: 'n-1', label: 'Output' },
    ],
    relations: [
      {
        id: 'r-0',
        source: 'n-0',
        target: 'n-1',
        graphLabel: 'selects & binds',
        direction: 'bidirectional',
      },
    ],
    groups: [{ id: 'g-0', label: 'Reading boundary', nodeIds: ['n-0', 'n-1'] }],
  };
  const measure = await createBundledTextMeasurer(
    await loadBundledFonts(),
    interactiveLabelRequests([page]),
  );
  page.geometry = (await layoutInteractivePages([page], measure)).layouts[0];
  const original = structuredClone(page);
  const html = painter.renderGraphSvg(page, 0);
  assert.deepEqual(page, original);
  assert.match(html, /<svg[^>]+viewBox="0 0 /u);
  assert.match(html, /class="graph-viewport"/u);
  assert.match(html, /Input &lt;exact&gt;/u);
  assert.match(html, /selects &amp; binds/u);
  for (const node of page.geometry.nodes) {
    assert.equal(html.split(`data-graphic-id="${node.id}"`).length - 1, 1);
    for (const line of node.label.baselines)
      assert(html.includes(`x="${line.x}" y="${line.baseline}"`));
  }
  const relation = page.geometry.relations[0];
  const expected = relation.points
    .map(({ x, y }, index) => `${index ? 'L' : 'M'}${x} ${y}`)
    .join(' ');
  assert(html.includes(`d="${expected}"`));
  assert.match(html, /marker-start="url\(#graph-0-arrow-start\)"/u);
  assert.match(html, /marker-end="url\(#graph-0-arrow-end\)"/u);
  assert.doesNotMatch(html, /canvas|cytoscape|bezier|<foreignObject/iu);
  assert.doesNotMatch(html, /class="graph-node"[^>]*><rect[^>]* rx=/u);
  assert.equal(html.split('data-graphic-id="r-0"').length - 1, 1);
  assert.equal(html.split('data-graphic-id="g-0"').length - 1, 1);
});
