import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright-core';
import { materializeBuildRequestInput } from '../packages/publisher/src/compiler/build-input.mjs';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/edition.mjs';
import { compileEditionMeaning } from '../packages/publisher/src/compiler/meaning.mjs';
import { validateVisibleSelection } from '../packages/publisher/src/compiler/coverage.mjs';
import { composeInteractiveEditionScene } from '../packages/publisher/src/scene/interactive/edition.mjs';
import { composeStaticResponsibilityScene } from '../packages/publisher/src/scene/static/responsibility.mjs';
import { projectInteractivePage } from '../packages/publisher/renderers/cytoscape/model.mjs';
import { composeStaticResponsibilitySvg } from '../packages/publisher/renderers/svg/responsibility.mjs';
import { claimModel } from './fixtures/claim-model.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';

const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;

async function paintedContactCounts(page, textPng, marksPng) {
  return page.evaluate(
    async ([textBase64, marksBase64]) => {
      const pixels = async (base64) => {
        const image = new globalThis.Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = globalThis.document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return {
          width: canvas.width,
          height: canvas.height,
          data: context.getImageData(0, 0, canvas.width, canvas.height).data,
        };
      };
      const text = await pixels(textBase64);
      const marks = await pixels(marksBase64);
      if (text.width !== marks.width || text.height !== marks.height)
        throw Error('painted_mask_dimensions_mismatch');
      let contact = 0;
      let withinTwoPixels = 0;
      for (let y = 0; y < text.height; y++)
        for (let x = 0; x < text.width; x++) {
          if (text.data[(y * text.width + x) * 4 + 3] <= 16) continue;
          if (marks.data[(y * marks.width + x) * 4 + 3] > 16) contact++;
          let near = false;
          for (let dy = -2; dy <= 2 && !near; dy++)
            for (let dx = -2; dx <= 2; dx++) {
              const xx = x + dx;
              const yy = y + dy;
              if (
                xx >= 0 &&
                yy >= 0 &&
                xx < marks.width &&
                yy < marks.height &&
                marks.data[(yy * marks.width + xx) * 4 + 3] > 16
              ) {
                near = true;
                break;
              }
            }
          if (near) withinTwoPixels++;
        }
      return { contact, withinTwoPixels };
    },
    [textPng.toString('base64'), marksPng.toString('base64')],
  );
}

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

test('a static responsibility form paints its own source-bound visual argument', async (t) => {
  const { selected } = await responsibilityFixture(t, 'static');
  const output = path.join(selected.root, 'static-responsibility-candidate');
  const result = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(result.status, 'built');
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  const png = await fs.readFile(path.join(output, 'static/architecture.png'));
  const visibleText = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/gu)]
    .map((match) => match[1])
    .join(' ');
  assert.match(svg, /data-form="responsibility"/u);
  assert.match(visibleText, /Selected architecture/u);
  assert.match(visibleText, /First responsibility/u);
  assert.match(visibleText, /Second responsibility/u);
  assert.match(visibleText, /The first component hands control to the second/u);
  assert.match(visibleText, /First responsibility → Second responsibility/u);
  assert.match(visibleText, /Alpha/u);
  assert.match(visibleText, /Beta/u);
  assert.match(svg, /data-source-relation="r-0"/u);
  assert.doesNotMatch(svg, /SOURCE RELATIONS/u);
  const wrappedTitleBaseline = Number(
    svg.match(/<text[^>]* y="([0-9.]+)"[^>]*>responsibility<\/text>/u)?.[1],
  );
  const roleRule = Number(svg.match(/<line data-role-rule="g-1"[^>]* y1="([0-9.]+)"/u)?.[1]);
  assert(Number.isFinite(wrappedTitleBaseline) && Number.isFinite(roleRule));
  assert(roleRule - wrappedTitleBaseline >= 12);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const candidate = JSON.parse(await fs.readFile(path.join(output, 'candidate.json'), 'utf8'));
  assert.deepEqual(Object.keys(candidate.media), ['static']);
  const repeat = path.join(selected.root, 'static-responsibility-repeat');
  await compileEditionCandidateInput(selected.file, selected.digest, repeat);
  for (const member of [
    'input-lock.json',
    'candidate.json',
    'manifest.json',
    'static/architecture.svg',
    'static/architecture.png',
  ])
    assert.deepEqual(
      await fs.readFile(path.join(output, member)),
      await fs.readFile(path.join(repeat, member)),
      member,
    );
});

test(
  'painted responsibility text clears paths and a controlled collision is detected',
  { skip: !path.isAbsolute(browserExecutable ?? ''), timeout: 35_000 },
  async (t) => {
    const { selected } = await responsibilityFixture(t, 'static');
    const output = path.join(selected.root, 'painted-responsibility-candidate');
    await compileEditionCandidateInput(selected.file, selected.digest, output);
    const browser = await chromium.launch({
      executablePath: browserExecutable,
      headless: true,
      chromiumSandbox: true,
      timeout: 15_000,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1600 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    await page.goto(pathToFileURL(path.join(output, 'static/architecture.svg')).href, {
      waitUntil: 'load',
      timeout: 15_000,
    });
    await page.evaluate(() => globalThis.document.fonts.ready);
    const size = await page.evaluate(() => {
      const box = globalThis.document.documentElement.viewBox.baseVal;
      return { width: Math.ceil(box.width), height: Math.ceil(box.height) };
    });
    await page.setViewportSize(size);
    await page.evaluate(() => {
      const style = globalThis.document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.id = 'mask-mode';
      globalThis.document.documentElement.append(style);
      style.textContent =
        'rect,path,line,polyline,polygon,circle,ellipse,image {visibility:hidden !important}';
    });
    const text = await page.screenshot({ omitBackground: true });
    await page.evaluate(() => {
      globalThis.document.getElementById('mask-mode').textContent =
        'rect,text,image {visibility:hidden !important}';
    });
    const marks = await page.screenshot({ omitBackground: true });
    const analysis = await browser.newPage();
    assert.deepEqual(await paintedContactCounts(analysis, text, marks), {
      contact: 0,
      withinTwoPixels: 0,
    });
    await page.evaluate(() => {
      const svg = globalThis.document.documentElement;
      const box = svg.querySelector('text').getBBox();
      const line = globalThis.document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(box.x));
      line.setAttribute('x2', String(box.x + box.width));
      line.setAttribute('y1', String(box.y + box.height / 2));
      line.setAttribute('y2', String(box.y + box.height / 2));
      line.setAttribute('stroke', '#24362e');
      line.setAttribute('stroke-width', '3');
      svg.append(line);
    });
    const controlled = await page.screenshot({ omitBackground: true });
    const detected = await paintedContactCounts(analysis, text, controlled);
    assert(detected.contact > 0);
    assert(detected.withinTwoPixels >= detected.contact);
  },
);

test('static responsibility coverage rejects a substituted role basis or group carrier', async (t) => {
  const { selected } = await responsibilityFixture(t, 'static');
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const rendered = composeStaticResponsibilitySvg(composeStaticResponsibilityScene(meaning));
  assert.doesNotThrow(() =>
    validateVisibleSelection(meaning, 'static', rendered.scene, rendered.carriers),
  );
  const substituted = structuredClone(rendered.scene);
  substituted.visualForm.roles[0].basis = 'second-basis';
  assert.throws(() => validateVisibleSelection(meaning, 'static', substituted, rendered.carriers), {
    code: 'edition_visible_coverage_mismatch',
  });
  const forgedMap = structuredClone(rendered.carriers);
  forgedMap.groups[0].editorialId = 'second-role';
  assert.throws(() => validateVisibleSelection(meaning, 'static', rendered.scene, forgedMap), {
    code: 'edition_visible_coverage_mismatch',
  });
});

test('form role order, not group record order, owns the static reading order', async (t) => {
  const { selected, view, writeProject } = await responsibilityFixture(t, 'static');
  view.groups.reverse();
  await writeProject();
  const output = path.join(selected.root, 'role-order-candidate');
  const result = await compileEditionCandidateInput(selected.file, selected.digest, output);
  assert.equal(result.status, 'built');
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert(svg.indexOf('First responsibility') < svg.indexOf('Second'));
});

test('a static form refuses a header that would enter the role graph', async (t) => {
  const { selected, writeProject } = await responsibilityFixture(t, 'static');
  selected.project.title = 'Responsibility boundaries across two selected components';
  await writeProject();
  const output = path.join(selected.root, 'crowded-header-candidate');
  await assert.rejects(compileEditionCandidateInput(selected.file, selected.digest, output), {
    code: 'static_responsibility_header_unrepresentable',
  });
  await assert.rejects(fs.access(output), { code: 'ENOENT' });
});

test('a static responsibility map refuses unsupported roles, routes, and labels', async (t) => {
  const { selected } = await responsibilityFixture(t, 'static');
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const original = composeStaticResponsibilityScene(meaning);
  const cases = [
    [
      'wrong form',
      (scene) => (scene.visualForm.schema = 'other/v1'),
      'static_responsibility_scene_invalid',
    ],
    [
      'missing basis',
      (scene) => (scene.visualForm.roles[0].basis = 'absent'),
      'static_responsibility_basis_invalid',
    ],
    [
      'duplicate role',
      (scene) => (scene.visualForm.roles[1].group = 'first-role'),
      'static_responsibility_group_invalid',
    ],
    [
      'duplicate member',
      (scene) => (scene.groups[1].elements = scene.groups[0].elements),
      'static_responsibility_group_invalid',
    ],
    [
      'self handoff',
      (scene) => (scene.visualForm.handoffs[0].to = 'first-role'),
      'static_responsibility_handoff_invalid',
    ],
    [
      'reversed relation',
      (scene) =>
        ([scene.relations[0].from, scene.relations[0].to] = [
          scene.relations[0].to,
          scene.relations[0].from,
        ]),
      'static_responsibility_graph_unrepresentable',
    ],
    [
      'missing endpoint',
      (scene) => (scene.relations[0].to.id = 'absent'),
      'static_responsibility_relation_endpoint_missing',
    ],
    [
      'long relation label',
      (scene) => (scene.relations[0].kind = 'unrepresentably-long-source-relation-predicate'),
      'static_responsibility_relation_label_unrepresentable',
    ],
    [
      'long node label',
      (scene) => (scene.nodes[0].label = 'unrepresentablylongsourceentitylabelwithoutspaces'),
      'static_responsibility_text_unrepresentable',
    ],
    [
      'invalid raster width',
      (scene) => (scene.requestedWidth = 200),
      'static_responsibility_width_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const scene = structuredClone(original);
    mutate(scene);
    assert.throws(() => composeStaticResponsibilitySvg(scene), { code }, name);
  }
});

test('an internal source relation places its caption beside, not across, its route', async (t) => {
  const { selected } = await responsibilityFixture(t, 'static');
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const scene = structuredClone(composeStaticResponsibilityScene(meaning));
  const first = scene.nodes[0];
  const sibling = { ...structuredClone(first), id: 'sibling', label: 'Sibling' };
  scene.nodes.push(sibling);
  scene.groups[0].elements.push({ namespace: sibling.namespace, id: sibling.id });
  scene.relations.push({
    ...structuredClone(scene.relations[0]),
    id: 'internal',
    kind: 'maintains',
    from: { namespace: first.namespace, id: first.id },
    to: { namespace: sibling.namespace, id: sibling.id },
  });
  const svg = composeStaticResponsibilitySvg(scene).bytes.toString('utf8');
  assert.match(
    svg,
    /data-source-relation="r-1"[\s\S]*?<text[^>]*text-anchor="(?:start|end)"[^>]*>maintains<\/text>/u,
  );
});

test('a bidirectional static relation reverses its start arrowhead', async (t) => {
  const { selected } = await responsibilityFixture(t, 'static');
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const scene = structuredClone(composeStaticResponsibilityScene(meaning));
  scene.relations[0].direction = 'bidirectional';
  const svg = composeStaticResponsibilitySvg(scene).bytes.toString('utf8');
  assert.match(svg, /marker-start="url\(#source-arrow\)"/u);
  assert.match(svg, /orient="auto-start-reverse"/u);
});

test('four responsibility domains compose a branching map and reject an internal cycle', async (t) => {
  const { selected } = await responsibilityFixture(t, 'static');
  const meaning = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const scene = structuredClone(composeStaticResponsibilityScene(meaning));
  const template = scene.nodes[0];
  const makeNode = (id, label) => ({ ...structuredClone(template), id, label });
  scene.nodes = [
    makeNode('operator', 'Operator'),
    makeNode('controller', 'Controller'),
    makeNode('config', 'Configuration'),
    makeNode('adapter', 'Adapter'),
    makeNode('projection', 'Projection'),
    makeNode('client', 'Client'),
    makeNode('external', 'Endpoint'),
  ];
  const address = (id) => ({ namespace: template.namespace, id });
  scene.groups = [
    { id: 'operator', label: 'Operator', elements: [address('operator')] },
    {
      id: 'control',
      label: 'Control',
      elements: ['controller', 'config', 'adapter', 'projection'].map(address),
    },
    { id: 'client', label: 'Client', elements: [address('client')] },
    { id: 'external', label: 'External', elements: [address('external')] },
  ];
  scene.visualForm.roles = scene.groups.map(({ id }, index) => ({
    group: id,
    basis: index % 2 ? 'second-basis' : 'first-basis',
  }));
  scene.visualForm.handoffs = [{ from: 'control', to: 'client', basis: 'handoff-basis' }];
  const makeRelation = (id, from, to) => ({
    ...structuredClone(scene.relations[0]),
    id,
    kind: id,
    from: address(from),
    to: address(to),
  });
  scene.relations = [
    makeRelation('invokes', 'operator', 'controller'),
    makeRelation('maintains', 'controller', 'config'),
    makeRelation('dispatches', 'controller', 'adapter'),
    makeRelation('applies', 'adapter', 'projection'),
    makeRelation('configures', 'projection', 'client'),
    makeRelation('requests', 'client', 'external'),
  ];
  const rendered = composeStaticResponsibilitySvg(scene);
  assert.equal(rendered.carriers.nodes.length, 7);
  assert.equal(rendered.carriers.relations.length, 6);
  assert.match(rendered.bytes.toString('utf8'), /data-source-relation="r-5"/u);
  assert(rendered.scene.layout.height < 1500);
  const cycle = structuredClone(scene);
  cycle.relations.push(makeRelation('cycle', 'projection', 'controller'));
  assert.throws(() => composeStaticResponsibilitySvg(cycle), {
    code: 'static_responsibility_graph_unrepresentable',
  });
});

test('static responsibility Scene rejects missing or conflicting selected meaning', async (t) => {
  const { selected } = await responsibilityFixture(t, 'static');
  const original = await compileEditionMeaning(
    await materializeBuildRequestInput(selected.file, selected.digest),
  );
  const cases = [
    [
      'incomplete meaning',
      (m) => (m.completeness = 'partial'),
      'static_responsibility_input_invalid',
    ],
    [
      'second static view',
      (m) => m.media.static.views.push(structuredClone(m.media.static.views[0])),
      'static_responsibility_input_invalid',
    ],
    [
      'wrong view identity',
      (m) => (m.editorial.presentation.static.views[0].id = 'other'),
      'static_responsibility_input_invalid',
    ],
    [
      'missing form',
      (m) => delete m.editorial.presentation.static.views[0].form,
      'static_responsibility_input_invalid',
    ],
    [
      'duplicate selection',
      (m) => m.native.selections.push(structuredClone(m.native.selections[0])),
      'static_responsibility_identity_ambiguous',
    ],
    [
      'ambiguous native view',
      (m) =>
        m.native.selections.push({
          ...structuredClone(m.native.selections[0]),
          selectionId: 'other-view',
        }),
      'static_responsibility_source_unadmitted',
    ],
    [
      'missing assertion',
      (m) => m.media.static.views[0].assertionIds.push('absent'),
      'static_responsibility_assertion_unbound',
    ],
    [
      'unsupported assertion',
      (m) => (m.assertions.find((a) => a.kind === 'source').kind = 'other'),
      'static_responsibility_assertion_unbound',
    ],
    [
      'missing selected source',
      (m) => (m.assertions.find((a) => a.kind === 'source').selection = 'absent'),
      'static_responsibility_assertion_unbound',
    ],
    [
      'malformed members',
      (m) => delete m.native.selections[0].members.relations,
      'static_responsibility_assertion_unbound',
    ],
    [
      'contradictory source member',
      (m) => {
        const other = structuredClone(m.native.selections[0]);
        other.selectionId = 'contradiction';
        other.target.kind = 'entity';
        other.members.elements[0].label = 'Contradictory label';
        m.native.selections.push(other);
        const assertion = structuredClone(m.assertions.find((a) => a.kind === 'source'));
        assertion.id = 'contradiction';
        assertion.selection = 'contradiction';
        m.assertions.push(assertion);
        m.media.static.views[0].assertionIds.push(assertion.id);
      },
      'static_responsibility_semantic_conflict',
    ],
    [
      'duplicate group',
      (m) => (m.editorial.presentation.static.views[0].groups[1].id = 'first-role'),
      'static_responsibility_group_invalid',
    ],
    [
      'unselected member',
      (m) => (m.editorial.presentation.static.views[0].groups[1].elements[0].id = 'absent'),
      'static_responsibility_group_invalid',
    ],
    [
      'unrepresented source member',
      (m) =>
        m.native.selections[0].members.elements.push({
          ...structuredClone(m.native.selections[0].members.elements[0]),
          id: 'extra',
        }),
      'static_responsibility_group_invalid',
    ],
    [
      'missing role',
      (m) => m.editorial.presentation.static.views[0].form.roles.pop(),
      'static_responsibility_group_invalid',
    ],
    [
      'missing relation endpoint',
      (m) => (m.native.selections[0].members.relations[0].to.id = 'absent'),
      'static_responsibility_relation_endpoint_missing',
    ],
    [
      'missing question',
      (m) => (m.media.static.views[0].questionIds[0] = 'absent'),
      'static_responsibility_question_unbound',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const meaning = structuredClone(original);
    mutate(meaning);
    assert.throws(() => composeStaticResponsibilityScene(meaning), { code }, name);
  }
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
  project.scope.selections.push({
    id: 'selected-observed',
    namespace: 'fixture/claims',
    kind: 'reference',
    reference: 'claim:observed',
    questions: ['shape'],
  });
  project.presentation.static.views = [structuredClone(project.presentation.interactive.views[0])];
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
    media: ['static', 'interactive'],
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
  const output = path.join(root, 'claim-responsibility-candidate');
  const result = await compileEditionCandidateInput(file, sha(bytes), output);
  assert.equal(result.status, 'built');
  const svg = await fs.readFile(path.join(output, 'static/architecture.svg'), 'utf8');
  assert.match(svg, /data-form="responsibility"/u);
  assert.match(svg, /authorization: granted/u);
  assert.match(svg, /Selected source Claim; editorial interpretation/u);
  assert.match(svg, /CLAIM ON client → server/u);
  assert.match(svg, />CLAIM ON client<\/text>/u);
  const selectedScene = composeStaticResponsibilityScene(meaning);
  const missingClaim = structuredClone(selectedScene);
  missingClaim.claimCards = [];
  assert.throws(() => composeStaticResponsibilitySvg(missingClaim), {
    code: 'static_responsibility_basis_invalid',
  });
  const missingFacts = structuredClone(selectedScene);
  missingFacts.claimCards[0].facts = [];
  assert.throws(() => composeStaticResponsibilitySvg(missingFacts), {
    code: 'static_responsibility_claim_invalid',
  });
  const unlinkedRelation = structuredClone(selectedScene);
  unlinkedRelation.claimRelationLinks = [];
  const unlinkedSvg = composeStaticResponsibilitySvg(unlinkedRelation).bytes.toString('utf8');
  assert.match(unlinkedSvg, /Unlinked relations show source topology only/u);
});
