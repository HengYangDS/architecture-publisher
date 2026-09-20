import test from 'node:test';
import assert from 'node:assert/strict';
import { claimModelDigest } from '../src/semantics/document.mjs';
import { editionFixture } from './fixtures/edition.mjs';

async function api() {
  const module = await import('../src/edition/evolution.mjs').catch(() => ({}));
  assert.equal(
    typeof module.compileEditionEvolution,
    'function',
    'Edition evolution compiler must exist',
  );
  return module;
}

function pair() {
  const before = editionFixture(),
    after = editionFixture();
  return { before, after };
}

function rebind(value, source = false) {
  value.edition.claimModel.digest = claimModelDigest(value.model);
  if (source) value.edition.source.manifestSha256 = 'e'.repeat(64);
  return value;
}

function compile(compiler, before, after, correspondences = []) {
  return compiler({
    before: { claimModel: before.model, editions: [before.edition] },
    after: { claimModel: after.model, editions: [after.edition] },
    correspondences,
  });
}

const obligationKeys = Object.freeze([
  'rebuild',
  'semanticVerification',
  'mediumVerification',
  'humanReview',
  'acceptance',
  'publication',
]);

test('no-op comparison retains exact identities and six empty obligation classes', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair(),
    result = compile(compileEditionEvolution, before, after);
  assert.equal(result.schema, 'architecture.semantic-change/v2');
  assert.deepEqual(Object.keys(result.obligations), obligationKeys);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(result.obligations).map(([key, value]) => [key, value.length]),
    ),
    Object.fromEntries(obligationKeys.map((key) => [key, 0])),
  );
  assert.deepEqual(result.editions, {
    added: [],
    removed: [],
    changed: [],
    affected: [],
  });
  assert.equal(result.before.claimModel, result.after.claimModel);
  assert.deepEqual(result.before.editions, result.after.editions);
  assert.equal(Object.hasOwn(result, 'acceptance'), false);
  assert.equal(Object.hasOwn(result.obligations, 'verify'), false);
  assert.equal(Object.hasOwn(result.obligations, 'review'), false);
});

test('claim qualifier-only changes propagate through Edition scenes and separate obligations', async () => {
  const { compileEditionEvolution } = await api();
  for (const [claim, field, value] of [
    ['intended', 'plane', 'observed'],
    ['intended', 'condition', { authorization: 'reconfirmed' }],
    ['intended', 'scope', { environment: 'remote' }],
    ['intended', 'maturity', 'implemented'],
    ['intended', 'validity', 'refuted'],
    ['observed', 'value', 'unhealthy'],
    ['observed', 'dependsOn', [
      { section: 'entities', id: 'client' },
      { section: 'sources', id: 'contract' },
    ]],
  ]) {
    const { before, after } = pair();
    after.model.claims[claim][field] = value;
    rebind(after);
    const result = compile(compileEditionEvolution, before, after),
      affected = result.editions.affected[0];
    assert.deepEqual(result.delta.changed.claims, [claim]);
    assert(result.delta.changedFields.claims[claim].includes(field));
    assert(affected.claims.includes(claim));
    assert.equal(affected.static, true);
    assert(affected.interactive.includes('overview'));
    assert(result.obligations.rebuild.length > 0);
    assert.equal(result.obligations.semanticVerification.length, 1);
    assert(result.obligations.mediumVerification.length > 0);
    assert.deepEqual(result.obligations.humanReview, []);
    assert.equal(result.obligations.acceptance.length, 1);
    assert.equal(result.obligations.publication.length, 1);
  }

  const { before, after } = pair();
  after.model.sources.second = {
    sha256: '2'.repeat(64),
    locator: 'second.md',
    authority: 'Second source',
  };
  after.model.claims.observed.provenance.push('second');
  rebind(after);
  const provenance = compile(compileEditionEvolution, before, after);
  assert(
    provenance.delta.changedFields.claims.observed.includes('provenance'),
  );
});

test('source-only changes rebind the Edition without unnecessary scene rebuild', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.model.sources.contract.sha256 = '2'.repeat(64);
  rebind(after, true);
  const result = compile(compileEditionEvolution, before, after),
    affected = result.editions.affected[0];
  assert.deepEqual(result.delta.changed.sources, ['contract']);
  assert.equal(affected.static, false);
  assert.deepEqual(affected.interactive, []);
  assert.deepEqual(
    result.obligations.rebuild.map((item) => item.target),
    ['publication-bundle'],
  );
  assert.equal(result.obligations.semanticVerification.length, 1);
  assert.deepEqual(
    result.obligations.mediumVerification.map((item) => item.medium),
    ['installed-use'],
  );
  assert.equal(result.obligations.acceptance.length, 1);
  assert.equal(result.obligations.publication[0].action, 'replace');
});

test('flagship source-only changes do not fabricate visual review', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  for (const value of [before, after]) {
    value.edition.class = 'flagship';
    value.edition.qualification.human = [
      'faithful',
      'intelligible',
      'restrained',
    ];
  }
  after.model.sources.contract.sha256 = '2'.repeat(64);
  rebind(after, true);
  const result = compile(compileEditionEvolution, before, after);
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, []);
  assert.deepEqual(result.obligations.humanReview, []);
});

test('Edition set ordering cannot change the serialized compiled result', async () => {
  const { compileEditionEvolution } = await api(),
    first = pair(),
    second = pair();
  for (const value of [first.before, first.after, second.before, second.after]) {
    const copy = structuredClone(value.edition);
    copy.id = 'zeta-system';
    value.editions = [value.edition, copy];
  }
  second.before.editions.reverse();
  second.after.editions.reverse();
  const input = (value) => ({
    before: {
      claimModel: value.before.model,
      editions: value.before.editions,
    },
    after: {
      claimModel: value.after.model,
      editions: value.after.editions,
    },
    correspondences: [],
  });
  assert.equal(
    JSON.stringify(compileEditionEvolution(input(first))),
    JSON.stringify(compileEditionEvolution(input(second))),
  );
});

test('Edition ordering does not depend on host locale comparison', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  for (const value of [before, after]) {
    const copy = structuredClone(value.edition);
    copy.id = 'zeta-system';
    value.editions = [copy, value.edition];
  }
  const localeCompare = String.prototype.localeCompare;
  String.prototype.localeCompare = () => {
    throw new Error('host locale comparison invoked');
  };
  try {
    const result = compileEditionEvolution({
      before: { claimModel: before.model, editions: before.editions },
      after: { claimModel: after.model, editions: after.editions },
      correspondences: [],
    });
    assert.deepEqual(Object.keys(result.before.editions), [
      'example-system',
      'zeta-system',
    ]);
  } finally {
    String.prototype.localeCompare = localeCompare;
  }
});

test('Edition-only changes preserve medium locality and invalidate acceptance explicitly', async () => {
  const { compileEditionEvolution } = await api();

  const staticOnly = pair();
  staticOnly.after.edition.scenes.static.label = 'Recomposed static overview';
  let result = compile(
    compileEditionEvolution,
    staticOnly.before,
    staticOnly.after,
  );
  assert.equal(result.editions.affected[0].static, true);
  assert.deepEqual(result.editions.affected[0].interactive, []);
  assert.deepEqual(
    result.obligations.rebuild.map((item) => item.target),
    ['publication-bundle', 'static'],
  );

  const interactiveOnly = pair();
  interactiveOnly.after.edition.scenes.interactive.runtime.label =
    'Recomposed runtime view';
  result = compile(
    compileEditionEvolution,
    interactiveOnly.before,
    interactiveOnly.after,
  );
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, ['runtime']);
  assert.deepEqual(
    result.obligations.rebuild.map((item) => [item.target, item.scene]),
    [
      ['publication-bundle', null],
      ['interactive', 'runtime'],
    ],
  );

  const qualificationOnly = pair();
  qualificationOnly.after.edition.qualification.static.push('new-static-check');
  result = compile(
    compileEditionEvolution,
    qualificationOnly.before,
    qualificationOnly.after,
  );
  assert.deepEqual(
    result.obligations.rebuild.map((item) => item.target),
    ['publication-bundle'],
  );
  assert.deepEqual(
    result.obligations.mediumVerification
      .filter((item) => item.medium === 'static')
      .map((item) => item.predicates),
    [[
      'keyboard-and-reduced-motion',
      'new-static-check',
      'painted-geometry',
    ]],
  );
  assert.equal(result.obligations.acceptance.length, 1);
  assert.equal(result.obligations.publication.length, 1);
});

test('title, narrative and visual grammar changes affect only their real media', async () => {
  const { compileEditionEvolution } = await api();

  const title = pair();
  title.after.edition.title = 'Changed title';
  let result = compile(compileEditionEvolution, title.before, title.after);
  assert.equal(result.editions.affected[0].static, true);
  assert.deepEqual(result.editions.affected[0].interactive, [
    'overview',
    'runtime',
  ]);

  const grammar = pair();
  grammar.after.edition.visualGrammar.relationTypes.calls.label = 'invokes';
  result = compile(compileEditionEvolution, grammar.before, grammar.after);
  assert.equal(result.editions.affected[0].static, true);
  assert.deepEqual(result.editions.affected[0].interactive, ['overview']);

  const narrative = pair();
  for (const value of [narrative.before, narrative.after]) {
    value.edition.questions.delivery = {
      audience: 'maintainer',
      prompt: 'How is delivery represented?',
      claims: ['implemented'],
      detail: 'mechanism',
      risk: 'Omission would hide delivery.',
    };
    value.edition.scenes.interactive.delivery = {
      label: 'Delivery',
      purpose: 'mechanism',
      questions: ['delivery'],
      claims: ['implemented'],
      composition: {
        groups: [
          { id: 'delivery', label: 'Delivery', entities: ['client', 'server'] },
        ],
        relations: [
          {
            id: 'request',
            fromSide: 'right',
            toSide: 'left',
            route: 'orthogonal-h',
          },
        ],
      },
    };
    value.edition.narrative = ['overview', 'runtime', 'delivery'];
  }
  narrative.after.edition.narrative = ['overview', 'delivery', 'runtime'];
  result = compile(
    compileEditionEvolution,
    narrative.before,
    narrative.after,
  );
  assert.equal(result.editions.affected[0].interactiveAtlas, true);
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, []);
  assert.deepEqual(
    result.obligations.mediumVerification
      .filter((item) => item.medium === 'interactive')
      .map(({ medium, scene }) => [medium, scene]),
    [['interactive', null]],
  );
});

test('unknown omissions remain conservative without fabricating scene work', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  for (const value of [before, after]) {
    value.edition.requiredClaims = value.edition.requiredClaims.filter(
      (id) => id !== 'published',
    );
    value.edition.questions.system.claims =
      value.edition.questions.system.claims.filter((id) => id !== 'published');
    value.edition.scenes.static.claims =
      value.edition.scenes.static.claims.filter((id) => id !== 'published');
    value.edition.scenes.interactive.overview.claims =
      value.edition.scenes.interactive.overview.claims.filter(
        (id) => id !== 'published',
      );
    value.edition.omissions.published = {
      disposition: 'out-of-scope',
      reason: 'Opaque release prose is outside this bounded view.',
      view: null,
    };
  }
  after.model.claims.published.value.text = 'Changed opaque release prose.';
  rebind(after);
  const result = compile(compileEditionEvolution, before, after);
  assert.equal(result.editions.affected[0].scope, 'complete');
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, []);
  assert.deepEqual(
    result.obligations.rebuild.map((item) => item.target),
    ['publication-bundle'],
  );
  assert.deepEqual(
    result.obligations.mediumVerification.map((item) => item.medium),
    ['installed-use'],
  );
});

test('unchanged unknown dependencies broaden only scenes that carry them', async () => {
  const { compileEditionEvolution } = await api(),
    represented = pair();
  for (const value of [represented.before, represented.after]) {
    value.model.claims.published.dependsOn = [];
    value.edition.questions.runtime.claims.push('published');
    value.edition.scenes.interactive.runtime.claims.push('published');
    rebind(value);
  }
  represented.after.model.entities.server.label = 'Changed server';
  rebind(represented.after);
  let result = compile(
    compileEditionEvolution,
    represented.before,
    represented.after,
  );
  assert(result.delta.unknownClaims.includes('published'));
  assert.equal(result.editions.affected[0].scope, 'complete');
  assert.deepEqual(result.editions.affected[0].interactive, [
    'overview',
    'runtime',
  ]);

  const excluded = pair();
  for (const value of [excluded.before, excluded.after]) {
    value.model.claims.published.dependsOn = [];
    value.edition.requiredClaims = value.edition.requiredClaims.filter(
      (id) => id !== 'published',
    );
    value.edition.questions.system.claims =
      value.edition.questions.system.claims.filter((id) => id !== 'published');
    value.edition.scenes.static.claims =
      value.edition.scenes.static.claims.filter((id) => id !== 'published');
    value.edition.scenes.interactive.overview.claims =
      value.edition.scenes.interactive.overview.claims.filter(
        (id) => id !== 'published',
      );
    value.edition.omissions.published = {
      disposition: 'out-of-scope',
      reason: 'Opaque release prose is outside this bounded view.',
      view: null,
    };
    rebind(value);
  }
  excluded.after.model.entities.server.label = 'Changed server';
  rebind(excluded.after);
  result = compile(
    compileEditionEvolution,
    excluded.before,
    excluded.after,
  );
  assert(result.delta.unknownClaims.includes('published'));
  assert.deepEqual(result.editions.affected[0].interactive, ['overview']);
});

test('represented-by omissions bind the named interactive scene', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  for (const value of [before, after]) {
    value.edition.requiredClaims = value.edition.requiredClaims.filter(
      (id) => id !== 'published',
    );
    value.edition.questions.system.claims =
      value.edition.questions.system.claims.filter((id) => id !== 'published');
    value.edition.scenes.static.claims =
      value.edition.scenes.static.claims.filter((id) => id !== 'published');
    value.edition.scenes.interactive.overview.claims =
      value.edition.scenes.interactive.overview.claims.filter(
        (id) => id !== 'published',
      );
    value.edition.scenes.interactive.runtime.claims.push('published');
    value.edition.questions.runtime.claims.push('published');
    value.edition.omissions.published = {
      disposition: 'represented-by',
      reason: 'Release prose is explained in the runtime mechanism.',
      view: 'runtime',
    };
  }
  after.model.claims.published.value.text = 'Changed opaque release prose.';
  rebind(after);
  const result = compile(compileEditionEvolution, before, after);
  assert.equal(result.editions.affected[0].static, false);
  assert.deepEqual(result.editions.affected[0].interactive, ['runtime']);
});

test('added and removed Editions produce publish and withdraw obligations', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  let result = compileEditionEvolution({
    before: { claimModel: before.model, editions: [] },
    after: { claimModel: after.model, editions: [after.edition] },
    correspondences: [],
  });
  assert.deepEqual(result.editions.added, ['example-system']);
  assert.deepEqual(result.obligations.publication.map((item) => item.action), [
    'publish',
  ]);
  assert(result.obligations.rebuild.length >= 4);

  result = compileEditionEvolution({
    before: { claimModel: before.model, editions: [before.edition] },
    after: { claimModel: after.model, editions: [] },
    correspondences: [],
  });
  assert.deepEqual(result.editions.removed, ['example-system']);
  assert.deepEqual(result.obligations.rebuild, []);
  assert.deepEqual(result.obligations.publication.map((item) => item.action), [
    'withdraw',
  ]);
});

test('removed interactive scenes require explicit withdrawal beside Edition replacement', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.edition.narrative = ['overview'];
  delete after.edition.scenes.interactive.runtime;
  delete after.edition.questions.runtime;
  const result = compile(compileEditionEvolution, before, after);
  assert.deepEqual(
    result.obligations.publication.map(({ action, scene }) => [action, scene]),
    [
      ['replace', null],
      ['withdraw', 'runtime'],
    ],
  );
  assert.equal(result.editions.affected[0].interactiveAtlas, true);
  assert.deepEqual(
    result.obligations.mediumVerification
      .filter((item) => item.medium === 'interactive')
      .map(({ medium, scene }) => [medium, scene]),
    [['interactive', null]],
  );
});

test('flagship changes require exact human review while structural changes do not fabricate it', async () => {
  const { compileEditionEvolution } = await api();
  for (const flagship of [false, true]) {
    const { before, after } = pair();
    if (flagship)
      for (const value of [before, after]) {
        value.edition.class = 'flagship';
        value.edition.qualification.human = [
          'faithful',
          'intelligible',
          'restrained',
        ];
      }
    after.edition.title = 'Changed title';
    const result = compile(compileEditionEvolution, before, after);
    assert.equal(result.obligations.humanReview.length, flagship ? 1 : 0);
    if (flagship)
      assert.deepEqual(result.obligations.humanReview[0].predicates, [
        'faithful',
        'intelligible',
        'restrained',
      ]);
  }
});

test('unrepresented structural meaning broadens every scene explicitly', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.model.entities.detached = {
    type: 'component',
    label: 'Detached meaning',
    qualifiers: {},
    provenance: ['contract'],
  };
  rebind(after);
  const result = compile(compileEditionEvolution, before, after),
    affected = result.editions.affected[0];
  assert.deepEqual(affected.unrepresented, ['entities:detached']);
  assert.equal(affected.scope, 'complete');
  assert.equal(affected.static, true);
  assert.deepEqual(affected.interactive, ['overview', 'runtime']);
  assert(affected.reasons.includes('unrepresented-change:entities:detached'));
});

test('after Edition must classify every newly introduced claim', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.model.claims['new-claim'] = {
    ...structuredClone(after.model.claims.tagged),
    value: 'newly introduced meaning',
  };
  rebind(after);
  assert.throws(
    () => compile(compileEditionEvolution, before, after),
    /edition_claim_classification_incomplete/,
  );
});

test('rename split and merge propagate both old and new Edition references without approval reuse', async () => {
  const { compileEditionEvolution } = await api();
  for (const kind of ['rename', 'split', 'merge']) {
    const { before, after } = pair();
    const original = structuredClone(before.model.claims.tagged);
    delete after.model.claims.tagged;
    const from = kind === 'merge' ? ['tagged', 'published'] : ['tagged'];
    const to = kind === 'split' ? ['tagged-stable', 'tagged-supported'] : ['renamed-tag'];
    if (kind === 'merge') delete after.model.claims.published;
    for (const [index, id] of to.entries())
      after.model.claims[id] = {
        ...structuredClone(original),
        value: index ? 'supported' : 'stable',
      };
    for (const edition of [after.edition]) {
      edition.requiredClaims = edition.requiredClaims.filter(
        (id) => !from.includes(id),
      );
      edition.requiredClaims.push(...to);
      for (const scene of [
        edition.scenes.static,
        ...Object.values(edition.scenes.interactive),
      ]) {
        const had = scene.claims.some((id) => from.includes(id));
        scene.claims = scene.claims.filter((id) => !from.includes(id));
        if (had) scene.claims.push(...to);
      }
      for (const question of Object.values(edition.questions)) {
        const had = question.claims.some((id) => from.includes(id));
        question.claims = question.claims.filter((id) => !from.includes(id));
        if (had) question.claims.push(...to);
      }
    }
    rebind(after);
    const mapping = {
      kind,
      section: 'claims',
      from,
      to,
      evidence: [
        {
          version: 'after',
          source: 'contract',
          sha256: after.model.sources.contract.sha256,
          locator: '#claim-lineage',
        },
      ],
    };
    const result = compile(
      compileEditionEvolution,
      before,
      after,
      [mapping],
    );
    assert.deepEqual(result.delta.correspondences[0].from, [...from].sort());
    assert.deepEqual(result.delta.correspondences[0].to, [...to].sort());
    assert.equal(result.delta.correspondences[0].kind, kind);
    assert.equal(result.obligations.acceptance.length, 1);
    assert.equal(result.obligations.publication[0].action, 'replace');
    assert(result.editions.affected[0].claims.some((id) => to.includes(id)));
  }
});

test('invalid contradictory inputs fail before actionable obligations exist', async () => {
  const { compileEditionEvolution } = await api(),
    { before, after } = pair();
  after.model.claims.contradiction = {
    ...structuredClone(after.model.claims.intended),
    validity: 'refuted',
  };
  assert.throws(
    () => compile(compileEditionEvolution, before, after),
    /semantic_contradiction/,
  );
});
