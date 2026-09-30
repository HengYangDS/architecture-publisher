import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { materializeBuildRequestInput } from '../packages/publisher/src/compiler/build-input.mjs';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/edition.mjs';
import { compileEditionMeaning } from '../packages/publisher/src/compiler/meaning.mjs';
import { composeInteractiveEditionScene } from '../packages/publisher/src/scene/interactive/edition.mjs';
import { composeStaticEditionScene } from '../packages/publisher/src/scene/static/edition.mjs';
import { projectInteractivePage } from '../packages/publisher/renderers/cytoscape/model.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';

async function responsibilityFixture(t, medium = 'interactive') {
  const selected = await selectedNativeEdition(t, { media: [medium], width: 800 });
  const original = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const members = original.native.selections[0].members.elements.map(({ namespace, id }) => ({
    namespace,
    id,
  }));
  assert.equal(members.length, 2);
  const view = selected.project.presentation[medium].views[0];
  view.groups = members.map((member, index) => ({
    id: index === 0 ? 'first-role' : 'second-role',
    label: index === 0 ? 'First responsibility' : 'Second responsibility',
    elements: [member],
  }));
  view.form = {
    schema: 'architecture.visual-form/v1',
    kind: 'responsibility',
    roles: [
      { group: 'first-role', basis: 'first-basis' },
      { group: 'second-role', basis: 'second-basis' },
    ],
    handoffs: [{ from: 'first-role', to: 'second-role', basis: 'handoff-basis' }],
  };
  selected.project.editorialAssertions = [
    {
      id: 'first-basis',
      statement: 'The first component has the first responsibility.',
      proponent: selected.project.editor,
      basis: ['overview'],
      questions: ['shape'],
    },
    {
      id: 'second-basis',
      statement: 'The second component has the second responsibility.',
      proponent: selected.project.editor,
      basis: ['overview'],
      questions: ['shape'],
    },
    {
      id: 'handoff-basis',
      statement: 'The first component hands control to the second.',
      proponent: selected.project.editor,
      basis: ['overview'],
      questions: ['shape'],
    },
  ];
  const writeProject = async () => {
    await fs.writeFile(
      path.join(selected.root, 'edition/project.json'),
      JSON.stringify(selected.project) + '\n',
    );
  };
  await writeProject();
  return { selected, view, members, writeProject };
}

test('attributed responsibility roles and handoff survive pre-layout selection', async (t) => {
  const { selected, view } = await responsibilityFixture(t);
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  assert.deepEqual(meaning.editorial.presentation.interactive.views[0].form, view.form);
  assert.equal(
    meaning.assertions.find(({ id }) => id === 'handoff-basis').semanticStatus,
    'editor-attributed-unverified',
  );
});

test('a bare structural view cannot become responsibility authority', async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.form.roles[0].basis = 'overview';
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, 'edition_visual_form_basis_unsupported');
      assert.deepEqual(
        (({ editionSha256, ...subject }) => subject)(error.diagnostics?.[0]?.subject),
        {
          kind: 'edition-visual-form-role',
          editionId: selected.project.id,
          medium: 'interactive',
          viewId: 'overview',
          questionId: 'shape',
          groupId: 'first-role',
          basisAssertionId: 'overview',
        },
      );
      assert.match(error.diagnostics[0].subject.editionSha256, /^[a-f0-9]{64}$/u);
      return true;
    },
  );
});

test('a selected responsibility form builds an independent interactive role work', async (t) => {
  const { selected } = await responsibilityFixture(t);
  const output = path.join(selected.root, 'responsibility-candidate');
  const result = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(result.status, 'built');
  const html = await fs.readFile(path.join(output, 'interactive/architecture.html'), 'utf8');
  assert.match(html, /class="responsibility-work"/u);
  assert.match(html, /First responsibility/u);
  assert.match(html, /Second responsibility/u);
  assert.match(html, /The first component hands control to the second/u);
  assert.match(html, /Alpha/u);
  assert.match(html, /Beta/u);
  assert.doesNotMatch(html, /id="graph-0"/u);
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json'), 'utf8'));
  assert.equal(candidate.qualification, 'unqualified');
  assert.deepEqual(Object.keys(candidate.media), ['interactive']);
});

test('interactive projection retains only bound responsibility roles and handoffs', async (t) => {
  const { selected } = await responsibilityFixture(t);
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const page = composeInteractiveEditionScene(meaning).pages[0];
  const projected = projectInteractivePage(page, 0).publicPage;
  assert.equal(projected.form.roles.length, 2);
  assert.equal(projected.form.handoffs.length, 1);
  assert.equal(projected.form.roles[0].basis.kind, 'editorial');
  assert.equal(projected.form.handoffs[0].basis.kind, 'editorial');

  for (const [name, mutate] of [
    ['schema substitution', (copy) => (copy.visualForm.schema = 'other-form/v1')],
    ['missing role', (copy) => copy.visualForm.roles.pop()],
    ['missing groups', (copy) => delete copy.groups],
    ['duplicate group', (copy) => (copy.visualForm.roles[1].group = 'first-role')],
    ['unknown group', (copy) => (copy.visualForm.roles[1].group = 'unknown-role')],
    ['unknown basis', (copy) => (copy.visualForm.roles[0].basis = 'unknown-basis')],
    ['non-Claim source basis', (copy) => (copy.visualForm.roles[0].basis = 'overview')],
    ['same-group handoff', (copy) => (copy.visualForm.handoffs[0].to = 'first-role')],
    ['unknown handoff group', (copy) => (copy.visualForm.handoffs[0].to = 'unknown-role')],
    ['unknown handoff basis', (copy) => (copy.visualForm.handoffs[0].basis = 'unknown-basis')],
  ]) {
    const copy = structuredClone(page);
    mutate(copy);
    assert.throws(
      () => projectInteractivePage(copy, 0),
      {
        code: 'render_responsibility_form_invalid',
      },
      name,
    );
  }
});

test('a static responsibility form cannot silently borrow the structural renderer', async (t) => {
  const { selected } = await responsibilityFixture(t, 'static');
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  assert.throws(() => composeStaticEditionScene(meaning, null), {
    code: 'edition_visual_form_renderer_unavailable',
  });
});

test('each responsibility group needs exactly one role binding', async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.form.roles.pop();
  await writeProject();
  await assert.rejects(materializeBuildRequestInput(selected.file, selected.digest), (error) => {
    assert.equal(error.code, 'edition_visual_form_authoring_invalid');
    assert.equal(error.diagnostics[0].subject.questionId, 'shape');
    assert.equal(error.diagnostics[0].subject.groupId, 'second-role');
    return true;
  });
});

test('a duplicate responsibility role cannot borrow a passing group set', async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.form.roles.push({ ...view.form.roles[0] });
  await writeProject();
  await assert.rejects(materializeBuildRequestInput(selected.file, selected.digest), (error) => {
    assert.equal(error.code, 'edition_visual_form_authoring_invalid');
    assert.deepEqual(error.diagnostics?.[0]?.subject, {
      kind: 'edition-visual-form-role',
      editionId: selected.project.id,
      medium: 'interactive',
      viewId: view.id,
      questionId: 'shape',
      groupId: 'first-role',
      basisAssertionId: 'first-basis',
    });
    return true;
  });
});

test('a role basis for another question reports the exact editorial input gap', async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  selected.project.questions.push({
    id: 'other',
    audience: 'maintainer',
    text: 'What is outside this responsibility?',
  });
  selected.project.presentation.static.views[0].questions.push('other');
  selected.project.editorialAssertions[0].questions = ['other'];
  await writeProject();
  await assert.rejects(materializeBuildRequestInput(selected.file, selected.digest), (error) => {
    assert.equal(error.code, 'edition_visual_form_authoring_invalid');
    assert.deepEqual(error.diagnostics?.[0]?.subject, {
      kind: 'edition-visual-form-role',
      editionId: selected.project.id,
      medium: 'interactive',
      viewId: view.id,
      questionId: 'shape',
      groupId: 'first-role',
      basisAssertionId: 'first-basis',
    });
    return true;
  });
});

test('handoff references are distinct, bound, and non-duplicated', async (t) => {
  for (const [name, change] of [
    ['same group', (handoff) => (handoff.to = handoff.from)],
    ['unknown group', (handoff) => (handoff.to = 'unknown-role')],
    ['duplicate', (handoff, form) => form.handoffs.push({ ...handoff })],
  ]) {
    await t.test(name, async (child) => {
      const { selected, view, writeProject } = await responsibilityFixture(child);
      change(view.form.handoffs[0], view.form);
      await writeProject();
      await assert.rejects(
        materializeBuildRequestInput(selected.file, selected.digest),
        (error) => {
          assert.equal(error.code, 'edition_visual_form_authoring_invalid');
          assert.equal(error.diagnostics[0].subject.kind, 'edition-visual-form-handoff');
          assert.equal(error.diagnostics[0].subject.questionId, 'shape');
          assert.equal(error.diagnostics[0].subject.fromGroup, 'first-role');
          return true;
        },
      );
    });
  }
});

test('an editorial role basis must cover its selected group members', async (t) => {
  const { selected, view, members, writeProject } = await responsibilityFixture(t);
  selected.project.scope.selections.push({
    id: 'first-member',
    namespace: members[0].namespace,
    kind: 'reference',
    reference: `element:${members[0].id}`,
    questions: ['shape'],
  });
  selected.project.editorialAssertions[1].basis = ['first-member'];
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, 'edition_visual_form_membership_unsupported');
      assert.equal(error.diagnostics[0].subject.groupId, view.form.roles[1].group);
      return true;
    },
  );
});

test('an unselected group member reports its form question and group before layout', async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.groups[0].elements[0].id = 'unselected-member';
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, 'edition_visual_form_group_unbound');
      assert.equal(error.diagnostics[0].subject.questionId, 'shape');
      assert.equal(error.diagnostics[0].subject.groupId, 'first-role');
      assert.equal(error.diagnostics[0].subject.member.id, 'unselected-member');
      return true;
    },
  );
});

test('a handoff basis must cross its selected responsibility groups', async (t) => {
  const { selected, view, members, writeProject } = await responsibilityFixture(t);
  selected.project.scope.selections.push({
    id: 'first-member',
    namespace: members[0].namespace,
    kind: 'reference',
    reference: `element:${members[0].id}`,
    questions: ['shape'],
  });
  selected.project.editorialAssertions[2].basis = ['first-member'];
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, 'edition_visual_form_handoff_unsupported');
      assert.equal(error.diagnostics[0].subject.kind, 'edition-visual-form-handoff');
      assert.equal(error.diagnostics[0].subject.fromGroup, view.form.handoffs[0].from);
      assert.equal(error.diagnostics[0].subject.toGroup, view.form.handoffs[0].to);
      return true;
    },
  );
});

test('an editorial handoff cannot reverse the selected source direction', async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  view.form.handoffs[0].from = 'second-role';
  view.form.handoffs[0].to = 'first-role';
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    (error) => {
      assert.equal(error.code, 'edition_visual_form_handoff_unsupported');
      assert.equal(error.diagnostics[0].subject.fromGroup, 'second-role');
      assert.equal(error.diagnostics[0].subject.toGroup, 'first-role');
      return true;
    },
  );
});

test('a role cannot borrow an omitted source assertion from another selection', async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  selected.project.scope.selections.push({
    ...structuredClone(selected.project.scope.selections[0]),
    id: 'second-overview',
  });
  selected.project.omissions.push({
    selection: 'overview',
    question: 'shape',
    medium: 'interactive',
    disposition: 'explicit-limit',
    view: view.id,
    reason: 'This selected reference is not used for the visual role.',
  });
  view.form.roles[0].basis = 'overview';
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    { code: 'edition_visual_form_basis_unsupported' },
  );
});

test('an editorial role cannot borrow its omitted source basis', async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t);
  selected.project.scope.selections.push({
    ...structuredClone(selected.project.scope.selections[0]),
    id: 'second-overview',
  });
  selected.project.omissions.push({
    selection: 'overview',
    question: 'shape',
    medium: 'interactive',
    disposition: 'explicit-limit',
    view: view.id,
    reason: 'This selected reference is not used for the visual role.',
  });
  await writeProject();
  await assert.rejects(
    compileEditionMeaning(await materializeBuildRequestInput(selected.file, selected.digest)),
    { code: 'edition_visual_form_basis_unsupported' },
  );
});

test('a typed source Claim can remain an attributed responsibility basis', async (t) => {
  const root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'archpub-form-claim-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'edition'));
  await fs.mkdir(path.join(root, 'source'));
  const source = Buffer.from(JSON.stringify(claimModel()) + '\n');
  await fs.writeFile(path.join(root, 'source/model.json'), source);
  const address = (id) => ({ namespace: 'fixture/claims', id });
  const project = {
    schema: 'architecture.edition-project/v1',
    id: 'source-claim-form',
    editor: 'fixture-editor',
    title: 'Responsibility claim',
    audiences: [{ id: 'maintainer', label: 'Maintainers' }],
    questions: [{ id: 'shape', audience: 'maintainer', text: 'Who calls whom?' }],
    scope: {
      sourceNamespaces: ['fixture/claims'],
      selections: [
        {
          id: 'selected-claim',
          namespace: 'fixture/claims',
          kind: 'reference',
          reference: 'claim:intended',
          questions: ['shape'],
        },
        {
          id: 'selected-client',
          namespace: 'fixture/claims',
          kind: 'reference',
          reference: 'entity:client',
          questions: ['shape'],
        },
        {
          id: 'selected-server',
          namespace: 'fixture/claims',
          kind: 'reference',
          reference: 'entity:server',
          questions: ['shape'],
        },
        {
          id: 'selected-relation',
          namespace: 'fixture/claims',
          kind: 'reference',
          reference: 'relation:request',
          questions: ['shape'],
        },
      ],
      limits: [],
    },
    omissions: [],
    narrative: { summary: 'A selected source claim remains attributed.' },
    presentation: {
      static: { views: [{ id: 'overview', questions: ['shape'] }] },
      interactive: {
        views: [
          {
            id: 'overview',
            questions: ['shape'],
            groups: [
              { id: 'client', label: 'Client', elements: [address('client')] },
              { id: 'server', label: 'Server', elements: [address('server')] },
            ],
            form: {
              schema: 'architecture.visual-form/v1',
              kind: 'responsibility',
              roles: [
                { group: 'client', basis: 'selected-claim' },
                { group: 'server', basis: 'selected-claim' },
              ],
              handoffs: [{ from: 'client', to: 'server', basis: 'selected-claim' }],
            },
          },
        ],
      },
    },
    visualPolicy: { profile: 'neutral' },
  };
  await fs.writeFile(path.join(root, 'edition/project.json'), JSON.stringify(project) + '\n');
  const request = {
    schema: 'architecture.build-request/v1',
    edition: { kind: 'direct', root: 'edition', manifest: 'project.json' },
    sources: [
      {
        id: 'model',
        namespace: 'fixture/claims',
        format: { id: 'architecture.claim-model', version: '2' },
        claimant: 'fixture-maintainer',
        revision: { kind: 'content', algorithm: 'sha256' },
        input: { kind: 'pin', path: 'source/model.json', sha256: sha(source) },
      },
    ],
    providers: [],
    media: ['interactive'],
    toolchain: { profile: 'portable' },
  };
  const bytes = Buffer.from(JSON.stringify(request) + '\n');
  const file = path.join(root, 'build-request.json');
  await fs.writeFile(file, bytes);
  const meaning = await compileEditionMeaning(await materializeBuildRequestInput(file, sha(bytes)));
  assert.equal(meaning.native.selections[0].members.claims[0].condition.authorization, 'granted');
  assert.equal(meaning.assertions[0].semanticStatus, 'attributed-source-unproved');
  const page = composeInteractiveEditionScene(meaning).pages[0];
  const projected = projectInteractivePage(page, 0).publicPage;
  assert.equal(projected.form.roles[0].basis.kind, 'source-claim');
  assert.equal(projected.form.handoffs[0].basis.kind, 'source-claim');
  assert.equal(projected.form.roles[0].basis.claimGraphicId, projected.claims[0].graphicId);
});
