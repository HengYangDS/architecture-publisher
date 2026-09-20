import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import sax from '../assets/raster/sax/sax.cjs';
import { parse as parseFont } from '../assets/raster/opentype/opentype.mjs';
import { auditScene } from '../src/geometry/scene.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const examples = [
  ['service-topology', 'architecture'],
  ['job-lifecycle', 'lifecycle'],
];

async function checkGeometry(svg) {
  const fonts = new Map();
  for (const [weight, name] of [[400, 'Regular'], [700, 'Bold']]) {
    const b = await fs.readFile(path.join(root, 'assets/fonts',
      'JetBrainsMono-' + name + '.ttf'));
    fonts.set(weight, parseFont(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)));
  }
  const scene = { nodes: [], texts: [], edges: [], decorations: [], requiredSemanticIds: [] };
  const parser = sax.parser(true), stack = [];
  parser.onopentag = ({ name, attributes: a }) => {
    for (const key of ['transform', 'display', 'visibility', 'opacity', 'style'])
      assert(!Object.hasOwn(a, key), 'Unexpected authored visibility or transform');
    const owner = a['data-node-id'] ?? stack.at(-1)?.owner;
    const entry = { name, a, owner, text: '' };
    stack.push(entry);
    if (name === 'svg') {
      scene.width = Number(a.width);
      scene.height = Number(a.height);
      scene.referenceWidth = scene.width;
    }
    if (a['data-node-box']) scene.nodes.push({
      id: a['data-node-box'], strokeWidth: Number(a['stroke-width']),
      box: Object.fromEntries(['x', 'y', 'width', 'height'].map((k) => [k, Number(a[k])])),
    });
    if (a['data-edge-id']) {
      // These examples deliberately use only explicit orthogonal M/H/V routes.
      assert.match(a.d, /^M \d+ \d+(?: [HV] \d+)+$/);
      const tokens = a.d.split(' '), points = [{ x: Number(tokens[1]), y: Number(tokens[2]) }];
      for (let i = 3; i < tokens.length; i += 2) {
        const p = { ...points.at(-1) };
        p[tokens[i] === 'H' ? 'x' : 'y'] = Number(tokens[i + 1]);
        points.push(p);
      }
      scene.edges.push({ id: a['data-edge-id'], source: a['data-from'],
        target: a['data-to'], points, strokeWidth: Number(a['stroke-width']),
        arrowGeometry: { length: 8, halfWidth: 4, strokeWidth: 0.1 } });
    }
    if (name === 'line') scene.decorations.push({
      id: 'rule-' + scene.decorations.length, strokeWidth: Number(a['stroke-width']),
      points: [{ x: Number(a.x1), y: Number(a.y1) }, { x: Number(a.x2), y: Number(a.y2) }],
    });
  };
  parser.ontext = (text) => { for (const e of stack) e.text += text; };
  parser.onclosetag = () => {
    const e = stack.pop();
    if (e.name !== 'text') return;
    assert.match(e.text, /^[\x20-\x7e]+$/);
    const font = fonts.get(Number(e.a['font-weight'])), size = Number(e.a['font-size']);
    assert(font);
    const scale = size / font.unitsPerEm;
    let cursor = Number(e.a.x), x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    for (const ch of e.text) {
      const g = font.charToGlyph(ch), b = g.getBoundingBox();
      assert.notEqual(g.index, 0, 'Missing glyph');
      if (ch !== ' ') {
        x1 = Math.min(x1, cursor + b.x1 * scale);
        x2 = Math.max(x2, cursor + b.x2 * scale);
        y1 = Math.min(y1, Number(e.a.y) - b.y2 * scale);
        y2 = Math.max(y2, Number(e.a.y) - b.y1 * scale);
      }
      cursor += g.advanceWidth * scale;
    }
    scene.texts.push({ id: 'text-' + scene.texts.length, text: e.text,
      owner: e.owner, visible: true, semanticIds: [], fontSize: size,
      box: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } });
  };
  parser.write(svg).close();
  // Unshaped ASCII glyph envelopes are an analytic check, not browser paint.
  const result = auditScene(scene, { widthGrowth: 0, heightGrowth: 0,
    minimumFont: 14, ownerClearance: 12, textClearance: 8,
    endpointTolerance: 0.01, minimumTerminal: 24 });
  assert.deepEqual(result.failures, []);
}

// Checks these authored examples, not arbitrary SVG semantics or painted text.
function compareMeaning(diagram, svg) {
  const parser = sax.parser(true), stack = [], nodes = [], edges = [], texts = [];
  parser.onopentag = (tag) => {
    const owner = tag.attributes['data-node-id'] ?? stack.at(-1)?.owner;
    const entry = { name: tag.name, attrs: tag.attributes, owner, text: '' };
    stack.push(entry);
    if (tag.attributes['data-node-id']) nodes.push(entry);
    if (tag.attributes['data-edge-id']) edges.push(entry);
  };
  parser.ontext = (text) => {
    for (const entry of stack) entry.text += text;
  };
  parser.onclosetag = () => {
    const entry = stack.pop();
    if (entry.name === 'text') texts.push(entry);
  };
  parser.write(svg).close();
  const sourceNodes = diagram.components ?? diagram.states;
  assert.deepEqual(
    nodes.map((n) => n.owner).sort(),
    sourceNodes.map((n) => n.id).sort(),
    'Every source node appears once',
  );
  for (const node of sourceNodes) {
    const visible = texts.filter((t) => t.owner === node.id).map((t) => t.text);
    assert(visible.includes(node.label), 'Missing node label: ' + node.id);
    if (node.sublabel)
      assert(visible.includes(node.sublabel), 'Missing node condition: ' + node.id);
  }
  const sourceEdges = [...(diagram.connections ?? diagram.transitions)];
  if (diagram.diagram_type === 'lifecycle') {
    const phase = diagram.states.filter((s) => s.lane === 'main')
      .toSorted((a, b) => a.col - b.col);
    for (let i = 1; i < phase.length; i++)
      sourceEdges.push({ id: 'phase-' + phase[i].id,
        from: phase[i - 1].id, to: phase[i].id });
  }
  assert.deepEqual(
    edges.map((e) => e.attrs['data-edge-id']).sort(),
    sourceEdges.map((e) => e.id).sort(),
    'Authored transitions and the native phase rail remain explicit',
  );
  for (const edge of sourceEdges) {
    const actual = edges.find((e) => e.attrs['data-edge-id'] === edge.id);
    assert.equal(actual.attrs['data-from'], edge.from);
    assert.equal(actual.attrs['data-to'], edge.to);
    assert.equal(actual.name, 'path');
    assert.match(actual.attrs.d, /^M /);
    assert.match(actual.attrs['marker-end'], /^url\(#.+\)$/);
    if (edge.label)
      assert(texts.some((t) => t.text === edge.label), 'Missing edge label');
  }
  const copy = texts.map((t) => t.text);
  assert(copy.includes(diagram.meta.title));
  for (const card of diagram.cards ?? []) {
    assert(copy.includes(card.title));
    for (const item of card.items) assert(copy.includes(item), 'Missing condition');
  }
  for (const view of diagram.meta.views ?? [])
    if (view.note) assert(copy.includes(view.note), 'Missing view condition');
}

function compareInteractiveMeaning(diagram, html) {
  const start = html.indexOf('<svg');
  const end = html.indexOf('</svg>', start);
  assert(start >= 0 && end > start, 'Rendered SVG is required');
  const svg = html.slice(start, end + 6);
  const parser = sax.parser(true), stack = [], nodes = [], edges = [];
  parser.onopentag = ({ name, attributes: a }) => {
    const item = { name, a, text: '' };
    stack.push(item);
    if (a['data-node-id']) nodes.push(item);
    if (name === 'path' && a['data-edge-id']) edges.push(item);
  };
  parser.ontext = text => { for (const item of stack) item.text += text; };
  parser.onclosetag = () => { stack.pop(); };
  parser.write(svg).close();
  const selectedNodes = diagram.components ?? diagram.states;
  assert.deepEqual(nodes.map(n => n.a['data-node-id']).sort(), selectedNodes.map(n => n.id).sort());
  for (const source of selectedNodes) {
    const actual = nodes.find(n => n.a['data-node-id'] === source.id);
    assert(actual.text.includes(source.label), 'Missing visible interactive node label');
    if (source.sublabel) assert(actual.text.includes(source.sublabel), 'Missing visible interactive condition');
  }
  const selectedEdges = diagram.connections ?? diagram.transitions;
  assert.deepEqual(edges.map(e => e.a['data-edge-id']).sort(), selectedEdges.map(e => e.id).sort());
  for (const source of selectedEdges) {
    const actual = edges.find(e => e.a['data-edge-id'] === source.id);
    assert.equal(actual.a['data-edge-from'], source.from);
    assert.equal(actual.a['data-edge-to'], source.to);
    assert.match(actual.a.d, /^M /);
    assert.match(actual.a['marker-end'], /^url\(#.+\)$/);
  }
}

function assertSemanticUpdate(name, original, updated) {
  assert.equal(updated.meta.title, original.meta.title, 'Semantic update is not a title change');
  const nodes = d => (d.components ?? d.states).map(n => n.id).sort();
  const edges = d => (d.connections ?? d.transitions).map(e => [e.id, e.from, e.to]);
  assert.notDeepEqual(nodes(updated), nodes(original), 'Node membership must change');
  assert.notDeepEqual(edges(updated), edges(original), 'Directed relationships must change');
  assert.notDeepEqual(updated.cards, original.cards, 'Visible semantic conditions must change');
  if (name === 'service-topology') {
    assert(updated.components.some(n => n.id === 'audit'));
    assert(updated.connections.some(e => e.from === 'events' && e.to === 'audit'));
  } else {
    assert(!updated.states.some(n => n.id === 'ready'));
    assert.equal(updated.states.find(n => n.id === 'accepted').sublabel, 'Capacity reserved');
    assert(updated.transitions.some(e => e.id === 'transient' && e.from === 'result' && e.to === 'wait'));
    assert.match(updated.meta.views[0].note, /attempts remain/);
  }
}

for (const [name] of examples)
  test('authored semantic update is complete in both views: ' + name, async () => {
    const original = JSON.parse(await fs.readFile(path.join(root, 'examples', name + '.json')));
    const file = path.join(root, 'examples', name + '-updated.json');
    assert.equal(await fs.access(file).then(() => true, () => false), true,
      'An authored semantic update is required; title-only substitution is insufficient');
    const updated = JSON.parse(await fs.readFile(file));
    const svg = await fs.readFile(path.join(root, 'examples', name + '-updated.svg'), 'utf8');
    assertSemanticUpdate(name, original, updated);
    compareMeaning(updated, svg);
    await checkGeometry(svg);
    assert.throws(() => compareMeaning(original, svg), 'Changed views must not pass as the original source');
  });

for (const [name] of examples)
  test('static example preserves source meaning: ' + name, async () => {
    const diagram = JSON.parse(await fs.readFile(path.join(root, 'examples', name + '.json')));
    const svg = await fs.readFile(path.join(root, 'examples', name + '.svg'), 'utf8');
    compareMeaning(diagram, svg);
    await checkGeometry(svg);
    assert.throws(() => compareMeaning(diagram,
      svg.replace(/data-to="[^"]+"/, 'data-to="wrong"')));
    assert.throws(() => compareMeaning(diagram,
      svg.replace(diagram.cards[0].items[0], 'Condition removed')));
    await assert.rejects(checkGeometry(svg.replace(/(<text )/, '$1visibility="hidden" ')));
    await assert.rejects(checkGeometry(svg.replace(/(data-edge-id="[^"]+"[^>]*d="M )\d+ /,
      '$1' + '0 ')));
  });

test('installed non-ETHOS examples support both media, updates and local bundles', async (t) => {
  const base = process.env.ARCHITECTURE_EXAMPLE_EVIDENCE
    ? path.resolve(process.env.ARCHITECTURE_EXAMPLE_EVIDENCE)
    : path.join(root, 'build/test-work');
  await fs.mkdir(base, { recursive: true });
  assert.equal(await fs.realpath(base), base);
  const dir = await fs.mkdtemp(path.join(base, 'example journeys '));
  if (!process.env.ARCHITECTURE_EXAMPLE_EVIDENCE)
    t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const run = (cmd, args, cwd = root, env = process.env) => {
    const r = spawnSync(cmd, args, {
      cwd,
      env,
      encoding: 'utf8',
      timeout: 60000,
    });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r.stdout;
  };
  const pack = JSON.parse(
    run('npm', [
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      dir,
    ]),
  )[0];
  const consumer = path.join(dir, 'independent consumer'),
    home = path.join(dir, 'empty home');
  await fs.mkdir(consumer);
  await fs.mkdir(home);
  run(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--prefix',
      consumer,
      path.join(dir, pack.filename),
    ],
    consumer,
  );
  const pkg = path.join(consumer, 'node_modules/architecture-publisher');
  for (const p of ['editions', 'src/integrations'])
    await fs.rm(path.join(pkg, p), { recursive: true });
  const invoke = (args) =>
    JSON.parse(
      run(
        process.execPath,
        [path.join(pkg, 'src/cli/main.mjs'), ...args],
        home,
        { HOME: home, PATH: home },
      ),
    );
  const fontFiles = ['Regular', 'Bold'].map((weight) => ({
    path: weight + '.ttf',
    input: path.join(pkg, 'assets/fonts/JetBrainsMono-' + weight + '.ttf'),
  }));
  async function packFiles(output, source, selected) {
    const files = [];
    for (const item of selected) {
      const bytes = await fs.readFile(item.input);
      files.push({
        input: path.relative(path.dirname(output), item.input),
        path: item.path,
        bytes: bytes.length,
        sha256: sha(bytes),
      });
    }
    const plan = Buffer.from(
      JSON.stringify({
        schema: 'architecture.pack-input/v1',
        source,
        files,
        output: path.basename(output),
      }),
    );
    const planPath = output + '-pack.json';
    await fs.writeFile(planPath, plan);
    const result = invoke(['source', 'pack', planPath, '--sha256', sha(plan)]);
    assert.equal(result.status, 'packed');
    assert.equal(result.semanticAcceptance, 'not-performed');
    return result;
  }
  const observations = [];
  for (const [name, type] of examples) {
    const workspace = path.join(dir, name);
    await fs.mkdir(workspace);
    const source = await fs.readFile(
      path.join(pkg, 'examples', name + '.json'),
    );
    const svg = await fs.readFile(path.join(pkg, 'examples', name + '.svg'));
    const diagram = JSON.parse(source);
    compareMeaning(diagram, svg.toString());
    const revisions = [];
    for (const update of [false, true]) {
      const revision = update ? 'updated' : 'original';
      const selected = update
        ? JSON.parse(
            await fs.readFile(
              path.join(pkg, 'examples', name + '-updated.json'),
            ),
          )
        : structuredClone(diagram);
      const staticInput = update
        ? await fs.readFile(path.join(pkg, 'examples', name + '-updated.svg'))
        : Buffer.from(svg);
      if (update) assertSemanticUpdate(name, diagram, selected);
      const input = Buffer.from(JSON.stringify(selected, null, 2) + '\n');
      compareMeaning(selected, staticInput.toString());
      await checkGeometry(staticInput.toString());
      const file = path.join(workspace, revision + '.json');
      await fs.writeFile(file, input);
      const staticFile = path.join(workspace, revision + '.svg');
      await fs.writeFile(staticFile, staticInput);
      const html = path.join(workspace, revision + '.html');
      const interactive = invoke([
        'render',
        type,
        file,
        '--sha256',
        sha(input),
        '--output',
        html,
      ]);
      assert.equal(interactive.nativeValidation.checksPassed, 9);
      assert.equal(interactive.browserAcceptance, 'not-performed');
      const repeatedHtml = path.join(workspace, revision + '-repeat.html');
      const repeated = invoke([
        'render',
        type,
        file,
        '--sha256',
        sha(input),
        '--output',
        repeatedHtml,
      ]);
      assert.equal(repeated.artifact.sha256, interactive.artifact.sha256);
      const bundle = await packFiles(
        path.join(workspace, revision + '-input'),
        { id: 'example:' + name, revision },
        [{ path: 'diagram.svg', input: staticFile }, ...fontFiles],
      );
      const planFile = path.join(workspace, revision + '-raster.json');
      await fs.writeFile(
        planFile,
        JSON.stringify({
          manifest: revision + '-input/manifest.json',
          manifestSha256: bundle.manifestSha256,
          svg: 'diagram.svg',
          fonts: [
            { path: 'Regular.ttf', family: 'JetBrains Mono', weight: 400 },
            { path: 'Bold.ttf', family: 'JetBrains Mono', weight: 700 },
          ],
          width: 2400,
          output: revision + '.png',
        }),
      );
      const staticResult = invoke(['raster', planFile]);
      assert.equal(staticResult.width, 2400);
      assert.equal(staticResult.semanticAcceptance, 'not-performed');
      const png = await fs.readFile(path.join(workspace, revision + '.png'));
      assert.equal(sha(png), staticResult.artifact.sha256);
      const htmlBytes = await fs.readFile(html);
      assert.equal(sha(htmlBytes), interactive.artifact.sha256);
      compareInteractiveMeaning(selected, htmlBytes.toString());
      assert.throws(() =>
        compareInteractiveMeaning(
          selected,
          htmlBytes
            .toString()
            .replace(/data-node-id="[^"]+"/, 'data-node-id="missing"'),
        ),
      );
      assert.throws(() =>
        compareInteractiveMeaning(
          selected,
          htmlBytes
            .toString()
            .replace(/data-edge-to="[^"]+"/, 'data-edge-to="wrong"'),
        ),
      );
      assert(!htmlBytes.toString().includes(root), 'No checkout path in HTML');
      const plan = JSON.parse(await fs.readFile(planFile));
      const repeatPlan = path.join(workspace, revision + '-repeat-raster.json');
      await fs.writeFile(
        repeatPlan,
        JSON.stringify({ ...plan, output: revision + '-repeat.png' }),
      );
      assert.equal(
        invoke(['raster', repeatPlan]).artifact.sha256,
        staticResult.artifact.sha256,
      );
      const publication = await packFiles(
        path.join(workspace, revision + '-publication'),
        { id: 'example:' + name, revision },
        [
          { path: 'diagram.json', input: file },
          { path: 'diagram.svg', input: staticFile },
          {
            path: 'diagram.png',
            input: path.join(workspace, revision + '.png'),
          },
          { path: 'diagram.html', input: html },
          ...fontFiles,
          {
            path: 'FONT-LICENSE.txt',
            input: path.join(pkg, 'assets/fonts/OFL.txt'),
          },
        ],
      );
      const verified = invoke([
        'source',
        'verify',
        publication.manifestPath,
        '--sha256',
        publication.manifestSha256,
      ]);
      assert.equal(verified.status, 'verified');
      assert.equal(verified.members.length, 7);
      const relocated = path.join(workspace, revision + '-relocated');
      await fs.cp(path.dirname(publication.manifestPath), relocated, {
        recursive: true,
        errorOnExist: true,
      });
      const replayPlan = path.join(workspace, revision + '-replay.json');
      await fs.writeFile(
        replayPlan,
        JSON.stringify({
          ...plan,
          manifest: revision + '-relocated/manifest.json',
          manifestSha256: publication.manifestSha256,
          output: revision + '-replayed.png',
        }),
      );
      assert.equal(
        invoke(['raster', replayPlan]).artifact.sha256,
        staticResult.artifact.sha256,
      );
      assert.equal(
        invoke([
          'render',
          type,
          path.join(relocated, 'diagram.json'),
          '--sha256',
          sha(input),
          '--output',
          path.join(workspace, revision + '-replayed.html'),
        ]).artifact.sha256,
        interactive.artifact.sha256,
      );
      revisions.push({ png: sha(png), html: sha(htmlBytes) });
      observations.push({
        name,
        revision,
        semanticUpdate: update,
        nodeIds: (selected.components ?? selected.states).map((n) => n.id),
        relationIds: (selected.connections ?? selected.transitions).map(
          (e) => e.id,
        ),
        inputSha256: sha(input),
        svgSha256: sha(staticInput),
        pngSha256: sha(png),
        htmlSha256: sha(htmlBytes),
        publicationSha256: publication.manifestSha256,
        repeatedBytesIdentical: true,
      });
    }
    assert.notEqual(revisions[0].png, revisions[1].png);
    assert.notEqual(revisions[0].html, revisions[1].html);
  }
  const result = {
    node: process.version,
    platform: process.platform,
    packageSha256: sha(await fs.readFile(path.join(dir, pack.filename))),
    observations,
    scope:
      'Installed rendering, source-bound example checks and bundle integrity only; no browser execution, visual approval or recoverable installation.',
  };
  await fs.writeFile(
    path.join(dir, 'result.json'),
    JSON.stringify(result, null, 2) + '\n',
  );
  t.diagnostic(JSON.stringify(result));
  if (process.env.ARCHITECTURE_EXAMPLE_EVIDENCE)
    t.diagnostic('Retained at ' + dir);
});
