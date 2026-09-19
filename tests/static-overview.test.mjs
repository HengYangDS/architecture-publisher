import test from 'node:test';
import assert from 'node:assert/strict';
import { composeStaticOverview } from '../src/composition/static-overview.mjs';

function fixture() {
  return {
    document: {
      entities: Object.fromEntries(['left', 'center', 'right', 'target'].map(
        (id) => [id, { label: id, type: 'component' }],
      )),
      relations: Object.fromEntries(['left', 'center', 'right'].map(
        (id) => [id, { subject: id, object: 'target', type: 'calls' }],
      )),
    },
    authoring: {
      title: 'Converging calls',
      entityTypes: { component: 'backend' },
      relationTypes: { calls: { label: 'calls', variant: 'default' } },
    },
    view: {
      label: 'Three distinct callers',
      groups: [
        { id: 'inputs', label: 'Callers', entities: ['left', 'center', 'right'] },
        { id: 'output', label: 'Target', entities: ['target'] },
      ],
      relations: ['left', 'center', 'right'].map((id) => ({
        id, fromSide: 'bottom', toSide: 'top', route: 'orthogonal-v',
      })),
    },
  };
}

test('converging relations retain distinct target ports and unmasked labels', () => {
  const { document, authoring, view } = fixture();
  const svg = composeStaticOverview(document, authoring, view).bytes.toString();
  const ends = [...svg.matchAll(/data-edge-to="target" d="([^"]+)"/g)]
    .map((match) => match[1].split(' L ').at(-1));
  assert.equal(ends.length, 3);
  assert.equal(new Set(ends).size, 3);
  assert.doesNotMatch(svg, /data-edge-label="[^"]+"><rect/);
});

test('a relation through an unrelated node is rejected before publication', () => {
  const { document, authoring } = fixture();
  document.relations = { skip: { subject: 'left', object: 'right', type: 'calls' } };
  const view = {
    label: 'Invalid skipped neighbor',
    groups: [{ id: 'row', label: 'Peers', entities: ['left', 'center', 'right'] }],
    relations: [{ id: 'skip', fromSide: 'right', toSide: 'left', route: 'straight' }],
  };
  assert.throws(() => composeStaticOverview(document, authoring, view), {
    code: 'semantic_publication_static_route_infeasible',
  });
});
