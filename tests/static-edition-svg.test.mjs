import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { loadBundledFonts } from '../packages/publisher/renderers/fonts/index.mjs';
import { rasterize, validateSvg } from '../packages/publisher/renderers/resvg/public.mjs';
import * as svg from '../packages/publisher/renderers/svg/index.mjs';
import { staticEditionScene } from './fixtures/static-edition-scene.mjs';
import { writeSourceBundle } from '../packages/publisher/src/source/write.mjs';

test('a neutral static SVG shows the selected structure and authored limits', () => {
  assert.equal(typeof svg.composeStaticEditionSvg, 'function');
  const rendered = svg.composeStaticEditionSvg(staticEditionScene());
  const content = rendered.bytes.toString('utf8');

  assert.equal(rendered.rasterWidth, 6000);
  assert(rendered.width >= 420);
  assert(rendered.height > 80);
  assert.match(content, /<svg[^>]+role="img"/u);
  assert.match(content, /Selected architecture/u);
  assert.match(content, /Alpha &amp; one/u);
  assert.match(content, /Beta/u);
  assert.match(content, /calls/u);
  assert.match(content, /What is connected\?/u);
  assert.match(content, /Runtime was not observed\./u);
  assert.match(content, /domain-metadata-opaque/u);
  assert.match(content, /data-graphic-id="n-0"/u);
  assert.match(content, /data-graphic-id="r-0"/u);
  assert.doesNotMatch(content, /backend|archify|privateNote/u);
});

test('static publication bytes expose graphic carriers, not private source identities', () => {
  const result = svg.composeStaticEditionSvg(staticEditionScene());
  const content = result.bytes.toString('utf8');
  assert.match(content, /data-graphic-id="n-0"/u);
  assert.match(content, /data-graphic-id="r-0"/u);
  assert.doesNotMatch(content, /example\/model|example\/views|relation:4:2|data-node-id/u);
  assert.deepEqual(result.carriers.nodes[0], {
    graphicId: 'n-0',
    source: { namespace: 'example/model', id: 'a', sha256: 'a'.repeat(64) },
  });
  assert.deepEqual(result.carriers.relations[0], {
    graphicId: 'r-0',
    source: { namespace: 'example/model', reference: 'relation:4:2', sha256: 'a'.repeat(64) },
  });
});

test('small source structure and reading notes occupy distinct landscape regions', () => {
  const rendered = svg.composeStaticEditionSvg(staticEditionScene());
  const content = rendered.bytes.toString('utf8');
  const reading = /<text x="([\d.]+)"[^>]*>READER QUESTIONS<\/text>/u.exec(content);
  assert(reading);
  assert(Number(reading[1]) > rendered.width / 2);
  assert(rendered.height / rendered.width < 0.65);
});

test('fractional native geometry is not rejected by serialization rounding', () => {
  const input = staticEditionScene();
  input.nodes[1].x = 260.125;
  input.edges[0].points[1][0] = 260.125;
  input.bounds.width = 420.125;
  const output = svg.composeStaticEditionSvg(input);
  assert.match(output.bytes.toString('utf8'), /260\.13/u);
});

test('a bidirectional source relation retains both directions and its kind', () => {
  const input = staticEditionScene();
  input.edges[0].relations[0].direction = 'bidirectional';
  input.edges[0].relations[0].label = null;
  input.edges[0].relations[0].kind = 'peer';
  const output = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  assert.match(output, /marker-start="url\(#source-arrow\)"/u);
  assert.match(output, /Alpha &amp; one ↔ Beta · peer/u);
});

test('malformed editorial and relation collections fail with a named diagnostic', () => {
  const cases = [
    ['missing limit map', (input) => (input.limitsByQuestion = null)],
    ['missing relation members', (input) => (input.edges[0].relations = null)],
  ];
  for (const [name, mutate] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(
      () => svg.composeStaticEditionSvg(input),
      { code: 'static_edition_scene_invalid' },
      name,
    );
  }
});

test('the renderer refuses unsupported scene authority and dimensions', () => {
  const cases = [
    ['absent scene', () => null, 'static_edition_scene_invalid'],
    ['wrong schema', (input) => ({ ...input, schema: 'other' }), 'static_edition_scene_invalid'],
    [
      'wrong completeness',
      (input) => ({ ...input, completeness: 'qualified' }),
      'static_edition_scene_invalid',
    ],
    [
      'unselected profile',
      (input) => ({ ...input, visualPolicy: { profile: 'flagship' } }),
      'static_edition_scene_invalid',
    ],
    [
      'unselected override',
      (input) => ({ ...input, visualPolicy: { profile: 'neutral', override: 'art.css' } }),
      'static_edition_scene_invalid',
    ],
    ['missing nodes', (input) => ({ ...input, nodes: null }), 'static_edition_scene_invalid'],
    ['missing edges', (input) => ({ ...input, edges: null }), 'static_edition_scene_invalid'],
    [
      'missing questions',
      (input) => ({ ...input, questions: null }),
      'static_edition_scene_invalid',
    ],
    [
      'missing editorials',
      (input) => ({ ...input, editorialAssertions: null }),
      'static_edition_scene_invalid',
    ],
    ['missing limits', (input) => ({ ...input, limits: null }), 'static_edition_scene_invalid'],
    [
      'array limit map',
      (input) => ({ ...input, limitsByQuestion: [] }),
      'static_edition_scene_invalid',
    ],
    [
      'nonintegral width',
      (input) => ({ ...input, requestedWidth: 6000.5 }),
      'static_edition_width_invalid',
    ],
    ['too narrow', (input) => ({ ...input, requestedWidth: 319 }), 'static_edition_width_invalid'],
    ['too wide', (input) => ({ ...input, requestedWidth: 12001 }), 'static_edition_width_invalid'],
    [
      'forged bounds',
      (input) => ({ ...input, bounds: { ...input.bounds, width: 421 } }),
      'static_edition_bounds_mismatch',
    ],
  ];
  for (const [name, alter, code] of cases)
    assert.throws(() => svg.composeStaticEditionSvg(alter(staticEditionScene())), { code }, name);
});

test('the renderer rejects infeasible geometry without cropping selected meaning', () => {
  const cases = [
    [
      'nonfinite node',
      (input) => (input.nodes[0].x = Number.NaN),
      'static_edition_geometry_invalid',
    ],
    [
      'unbounded node',
      (input) => (input.nodes[0].x = 11_000_000),
      'static_edition_geometry_invalid',
    ],
    ['negative width', (input) => (input.nodes[0].width = -1), 'static_edition_geometry_invalid'],
    ['negative height', (input) => (input.nodes[0].height = -1), 'static_edition_geometry_invalid'],
    ['missing route', (input) => (input.edges[0].points = null), 'static_edition_geometry_invalid'],
    [
      'one route point',
      (input) => (input.edges[0].points = [[160, 40]]),
      'static_edition_geometry_invalid',
    ],
    [
      'malformed point',
      (input) => (input.edges[0].points[0] = [160]),
      'static_edition_geometry_invalid',
    ],
    [
      'absent endpoint',
      (input) => (input.edges[0].to.id = 'absent'),
      'static_edition_relation_endpoint_missing',
    ],
    [
      'unsupported direction',
      (input) => (input.edges[0].relations[0].direction = 'inverse'),
      'static_edition_direction_unrepresentable',
    ],
    [
      'mixed directions',
      (input) => {
        const relation = {
          ...input.edges[0].relations[0],
          reference: 'relation:5:2',
          direction: 'bidirectional',
        };
        input.edges[0].relations.push(relation);
        input.sourceAssertionCarriers[0].relationRefs.push({
          namespace: relation.namespace,
          reference: relation.reference,
          sha256: relation.sha256,
        });
      },
      'static_edition_direction_unrepresentable',
    ],
    ['narrow node', (input) => (input.nodes[0].width = 95), 'static_edition_node_unrepresentable'],
    ['short node', (input) => (input.nodes[0].height = 63), 'static_edition_node_unrepresentable'],
    [
      'huge canvas',
      (input) => {
        input.nodes[1].x = 11_500;
        input.edges[0].points[1][0] = 11_500;
        input.bounds.width = 11_660;
      },
      'static_edition_geometry_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(() => svg.composeStaticEditionSvg(input), { code }, name);
  }
});

test('source carriers cannot duplicate, forge, or omit visible graph members', () => {
  const cases = [
    [
      'duplicate node identity',
      (input) => input.nodes.push(structuredClone(input.nodes[0])),
      'static_edition_carrier_ambiguous',
    ],
    [
      'duplicate relation identity',
      (input) => input.edges[0].relations.push(structuredClone(input.edges[0].relations[0])),
      'static_edition_carrier_ambiguous',
    ],
    [
      'duplicate claim identity',
      (input) => {
        const claim = {
          namespace: 'fixture/claims',
          id: 'same',
          sha256: 'a'.repeat(64),
          facts: [{ label: 'Claim plane', value: 'implemented' }],
        };
        input.claimCards = [claim, structuredClone(claim)];
      },
      'static_edition_carrier_ambiguous',
    ],
    [
      'empty assertion identity',
      (input) => (input.sourceAssertionCarriers[0].assertionId = ''),
      'static_edition_carrier_invalid',
    ],
    [
      'duplicate assertion identity',
      (input) =>
        input.sourceAssertionCarriers.push(structuredClone(input.sourceAssertionCarriers[0])),
      'static_edition_carrier_invalid',
    ],
    [
      'unbound assertion',
      (input) => {
        input.sourceAssertionCarriers[0].nodeRefs = [];
        input.sourceAssertionCarriers[0].relationRefs = [];
      },
      'static_edition_carrier_invalid',
    ],
    [
      'malformed node reference',
      (input) => (input.sourceAssertionCarriers[0].nodeRefs[0] = null),
      'static_edition_carrier_invalid',
    ],
    [
      'invented node reference',
      (input) => (input.sourceAssertionCarriers[0].nodeRefs[0].id = 'invented'),
      'static_edition_carrier_invalid',
    ],
    [
      'malformed relation reference',
      (input) => (input.sourceAssertionCarriers[0].relationRefs[0] = null),
      'static_edition_carrier_invalid',
    ],
    [
      'invented relation reference',
      (input) => (input.sourceAssertionCarriers[0].relationRefs[0].reference = 'invented'),
      'static_edition_carrier_invalid',
    ],
    [
      'malformed claim reference',
      (input) => (input.sourceAssertionCarriers[0].claimRefs = [null]),
      'static_edition_carrier_invalid',
    ],
    [
      'invented claim reference',
      (input) =>
        (input.sourceAssertionCarriers[0].claimRefs = [
          { namespace: 'fixture/claims', reference: 'invented', sha256: 'a'.repeat(64) },
        ]),
      'static_edition_carrier_invalid',
    ],
    [
      'unclaimed node',
      (input) => input.sourceAssertionCarriers[0].nodeRefs.pop(),
      'static_edition_carrier_unclaimed',
    ],
    [
      'unclaimed relation',
      (input) => (input.sourceAssertionCarriers[0].relationRefs = []),
      'static_edition_carrier_unclaimed',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(() => svg.composeStaticEditionSvg(input), { code }, name);
  }
});

test('long text wraps without truncating source language or hiding editorial scope', () => {
  const input = staticEditionScene();
  input.title = `${'x'.repeat(52)} Y`;
  input.nodes[0].label = 'Alpha service one';
  input.nodes[0].kind = null;
  input.editorialAssertions.push({
    id: 'editorial-note',
    kind: 'editorial',
    statement: 'Editorial judgment remains attributed.',
    proponent: 'fixture-editor',
    semanticStatus: 'editor-attributed-unverified',
  });
  input.limits.push('view-membership-upstream-computed-unqualified');
  const result = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  assert.match(result, /Alpha service/u);
  assert.match(result, /one/u);
  assert.match(result, /Editorial judgment remains attributed/u);
  assert.match(result, /view-membership-/u);
  assert.match(result, /upstream-computed-/u);
  assert.match(result, /<text[^>]*>Y<\/text>/u);
});

test('two label lines cannot collide with a kind label inside a short node', () => {
  const input = staticEditionScene();
  input.nodes[0].height = 64;
  input.nodes[0].label = 'Alpha service one';
  assert.throws(() => svg.composeStaticEditionSvg(input), {
    code: 'static_edition_node_unrepresentable',
  });
});

test('unspaced source labels wrap without changing characters or inventing relation qualifiers', () => {
  const input = staticEditionScene();
  input.limits.push('x'.repeat(100));
  input.edges[0].relations[0].label = null;
  input.edges[0].relations[0].kind = null;
  const result = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  const pieces = [...result.matchAll(/<text[^>]*>(x+)<\/text>/gu)].map((match) => match[1]);
  assert.equal(pieces.join(''), 'x'.repeat(100));
  assert.match(result, /Alpha &amp; one → Beta<\/text>/u);
  assert.doesNotMatch(result, /Alpha &amp; one → Beta ·/u);
});

test('absence of a width selects a generic default, not a named adopter preset', () => {
  const input = staticEditionScene();
  input.requestedWidth = null;
  assert.equal(svg.composeStaticEditionSvg(input).rasterWidth, 1800);
});

test('missing or excessive text and an overlong poster fail rather than truncate', () => {
  const cases = [
    ['missing title', (input) => (input.title = ''), 'static_edition_text_unrepresentable'],
    [
      'missing node label',
      (input) => (input.nodes[0].label = null),
      'static_edition_text_unrepresentable',
    ],
    [
      'too many title lines',
      (input) => (input.title = 'word '.repeat(500)),
      'static_edition_text_unrepresentable',
    ],
    [
      'too many method notes',
      (input) => (input.limits = Array.from({ length: 600 }, (_, index) => `limit ${index}`)),
      'static_edition_geometry_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const input = staticEditionScene();
    mutate(input);
    assert.throws(() => svg.composeStaticEditionSvg(input), { code }, name);
  }
});

test('an editorial-only scene remains truthful and does not manufacture structure', () => {
  const input = staticEditionScene();
  input.nodes = [];
  input.edges = [];
  input.bounds = null;
  input.sourceAssertionCarriers = [];
  input.editorialAssertions = [
    {
      id: 'editorial-note',
      kind: 'editorial',
      statement: 'No source graph was selected.',
      proponent: 'fixture-editor',
      semanticStatus: 'editor-attributed-unverified',
    },
  ];
  const result = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  assert.match(result, /No source graph was selected/u);
  assert.match(result, /fixture-editor/u);
  assert.match(result, /unverified/u);
  assert.match(result, /SOURCE STRUCTURE/u);
  assert.doesNotMatch(result, /SOURCE CLAIMS/u);
  assert.doesNotMatch(result, /data-graphic-id/u);
  for (const field of ['proponent', 'semanticStatus']) {
    const invalid = structuredClone(input);
    delete invalid.editorialAssertions[0][field];
    assert.throws(() => svg.composeStaticEditionSvg(invalid), {
      code: 'static_edition_editorial_invalid',
    });
  }
});

test('static claims factor only exact shared context while retaining each claim anchor', () => {
  const input = staticEditionScene();
  input.nodes = [];
  input.edges = [];
  input.bounds = null;
  input.claimCards = [
    {
      namespace: 'fixture/claims',
      id: 'first',
      sha256: 'a'.repeat(64),
      facts: [
        { label: 'Claim plane', value: 'implemented' },
        { label: 'Subject', value: 'Client' },
        { label: 'Predicate', value: 'calls' },
        { label: 'Object', value: 'Server' },
        { label: 'Condition', value: 'none declared' },
        { label: 'Scope', value: 'local' },
      ],
    },
    {
      namespace: 'fixture/claims',
      id: 'second',
      sha256: 'a'.repeat(64),
      facts: [
        { label: 'Claim plane', value: 'implemented' },
        { label: 'Subject', value: 'Gateway' },
        { label: 'Predicate', value: 'routes' },
        { label: 'Object', value: 'Worker' },
        { label: 'Condition', value: 'none declared' },
        { label: 'Scope', value: 'remote' },
      ],
    },
  ];
  input.sourceAssertionCarriers = input.claimCards.map(({ namespace, id, sha256 }) => ({
    assertionId: id,
    selectionId: id,
    kind: 'claim',
    nodeRefs: [],
    relationRefs: [],
    claimRefs: [{ namespace, reference: id, sha256 }],
  }));

  const first = svg.composeStaticEditionSvg(input);
  const content = first.bytes.toString('utf8');
  assert.match(content, /COMMON TO ALL SELECTED CLAIMS/u);
  assert.equal((content.match(/Claim plane: implemented/gu) ?? []).length, 1);
  assert.equal((content.match(/Condition: none declared/gu) ?? []).length, 1);
  for (const value of ['Subject: Client', 'Subject: Gateway', 'Scope: local', 'Scope: remote'])
    assert.match(content, new RegExp(value, 'u'));
  assert.equal(first.carriers.claims.length, 2);

  const sameAnchors = structuredClone(input);
  sameAnchors.claimCards[1].facts.find(({ label }) => label === 'Subject').value = 'Client';
  sameAnchors.claimCards[1].facts.find(({ label }) => label === 'Scope').value = 'local';
  const anchored = svg.composeStaticEditionSvg(sameAnchors).bytes.toString('utf8');
  assert.equal((anchored.match(/Subject: Client/gu) ?? []).length, 2);
  assert.equal((anchored.match(/Scope: local/gu) ?? []).length, 2);

  input.claimCards[1].facts[0].value = 'observed';
  const changed = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  assert.equal((changed.match(/Claim plane: implemented/gu) ?? []).length, 1);
  assert.equal((changed.match(/Claim plane: observed/gu) ?? []).length, 1);
});

function linkedMixedScene() {
  const input = staticEditionScene();
  input.claimCards = [
    {
      namespace: 'fixture/claims',
      id: 'claim',
      sha256: 'a'.repeat(64),
      facts: [{ label: 'Claim plane', value: 'implemented' }],
    },
  ];
  input.sourceAssertionCarriers.push({
    assertionId: 'claim',
    selectionId: 'claim',
    kind: 'claim',
    nodeRefs: [],
    relationRefs: [],
    claimRefs: [{ namespace: 'fixture/claims', reference: 'claim', sha256: 'a'.repeat(64) }],
  });
  input.sourceAssertionCarriers[0].kind = 'relation';
  input.claimRelationLinks = [{ claimAssertionId: 'claim', relationAssertionId: 'source-shape' }];
  return input;
}

test('a mixed graph and claim plate require exact source-bound links', () => {
  const input = linkedMixedScene();
  delete input.claimRelationLinks;
  assert.throws(() => svg.composeStaticEditionSvg(input), {
    code: 'static_edition_claim_relation_invalid',
  });
});

test('mixed neutral composition flows graph and claims beside longer reader notes', () => {
  const input = linkedMixedScene();
  input.limits = Array.from({ length: 15 }, (_, index) => `method-${index}`);
  const output = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  const at = (label) => {
    const match = new RegExp(`<text x="([\\d.]+)" y="([\\d.]+)"[^>]*>${label}<\\/text>`, 'u').exec(
      output,
    );
    assert(match, label);
    return { x: Number(match[1]), y: Number(match[2]) };
  };
  const claims = at('SOURCE CLAIMS');
  const lastNote = at('method-14');
  const notes = at('READER QUESTIONS');
  const transform = /<g transform="translate\(([\d.-]+) ([\d.-]+)\)">/u.exec(output);
  assert(transform);
  const card = /<g data-graphic-id="c-0">\s*<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"/u.exec(
    output,
  );
  assert(card);
  assert(claims.y > Number(transform[2]) + input.bounds.height + 40);
  assert(claims.y < lastNote.y);
  assert(Number(card[1]) + Number(card[3]) < notes.x - 20);
});

test('an infeasible side candidate cannot discard a readable full-width claim', () => {
  const input = linkedMixedScene();
  input.limits = Array.from({ length: 15 }, (_, index) => `method-${index}`);
  input.claimCards[0].facts = [{ label: 'Description', value: 'x'.repeat(700) }];
  const output = svg.composeStaticEditionSvg(input).bytes.toString('utf8');
  assert.match(output, /SOURCE CLAIMS/u);
  assert.match(output, /Description:/u);
  const pieces = [...output.matchAll(/<text[^>]*>(x+)<\/text>/gu)].map((match) => match[1]);
  assert.equal(pieces.join(''), 'x'.repeat(700));
});

test('the static Edition SVG is admitted by the pinned raster profile', async () => {
  const output = svg.composeStaticEditionSvg(staticEditionScene());
  const supply = await loadBundledFonts();
  const selected = supply.fonts
    .filter(({ weight }) => [400, 600].includes(weight))
    .map(({ bytes, weight }) => ({ bytes, weight, family: 'JetBrains Mono' }));
  const validated = validateSvg(output.bytes, selected, output.rasterWidth);
  assert.equal(validated.width, 6000);
  assert(validated.height > 0);
  assert.equal(validated.fontCount, 2);
});

test('the selected-width PNG is rendered from the static SVG, not from HTML', async (t) => {
  const root = path.resolve('build/test-work');
  await fs.mkdir(root, { recursive: true });
  const work = await fs.mkdtemp(path.join(root, 'static-edition-'));
  t.after(() => fs.rm(work, { recursive: true, force: true }));
  const output = svg.composeStaticEditionSvg(staticEditionScene());
  const supply = await loadBundledFonts();
  const selected = supply.fonts.filter(({ weight }) => [400, 600].includes(weight));
  const members = [
    { path: 'edition.svg', content: output.bytes },
    ...selected.map(({ weight, bytes }) => ({ path: `fonts/${weight}.ttf`, content: bytes })),
  ];
  const bundle = await writeSourceBundle(
    path.join(work, 'input'),
    { id: 'static:edition', revision: 'selected' },
    members,
  );
  const png = path.join(work, 'edition.png');
  const result = await rasterize({
    manifest: bundle.manifestPath,
    manifestSha256: bundle.manifestSha256,
    svg: 'edition.svg',
    fonts: selected.map(({ weight }) => ({
      path: `fonts/${weight}.ttf`,
      family: 'JetBrains Mono',
      weight,
    })),
    width: output.rasterWidth,
    output: png,
  });
  assert.equal(result.status, 'rendered');
  assert.equal(result.width, 6000);
  assert.deepEqual(
    (await fs.readFile(png)).subarray(0, 8),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
});
