import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  installCoreAndEthos,
} from './fixtures/installed-packages.mjs';
import {
  sha256,
  stableStringify,
} from '../packages/extensions/ethos/src/adapter/projection.mjs';

const root = path.resolve(import.meta.dirname, '..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

test('installed evolution uses the ETHOS extension, then continues through the core alone', async (t) => {
  const temporary = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'installed-evolution-')),
  );
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const { consumer } = await installCoreAndEthos(root, temporary);
  const inputRoot = path.join(temporary, 'input');
  await fs.mkdir(inputRoot);
  await fs.cp(
    path.join(root, 'tests/fixtures/ethos-source'),
    path.join(inputRoot, 'source'),
    { recursive: true, errorOnExist: true },
  );
  const projection = JSON.parse(
    await fs.readFile(path.join(inputRoot, 'source/projection-input.json')),
  );
  const interactiveEditionRoot = path.join(inputRoot, 'interactive-edition'),
    staticEditionRoot = path.join(inputRoot, 'static-edition');
  await fs.cp(
    path.join(
      consumer,
      'node_modules/@architecture-publisher/ethos/src/edition/authoring',
    ),
    interactiveEditionRoot,
    { recursive: true, errorOnExist: true },
  );
  await fs.cp(
    path.join(
      consumer,
      'node_modules/@architecture-publisher/ethos/src/edition/static/authoring',
    ),
    staticEditionRoot,
    { recursive: true, errorOnExist: true },
  );
  const edition = JSON.parse(
    await fs.readFile(path.join(interactiveEditionRoot, 'edition.json')),
  );
  const page = edition.pages.find(({ id }) => id === 'verification');
  const diagram = JSON.parse(
    await fs.readFile(
      path.join(
        interactiveEditionRoot,
        page.spec,
      ),
    ),
  );
  const verifier = diagram.components.find(
    ({ id }) => id === 'independent-verifier',
  );
  const authoring = {
    schema: 'architecture.ethos-authored-edits/v1',
    static: {},
    interactive: {
      order: edition.pages.map(({ id }) => id),
      pages: [
        {
          id: 'verification',
          edits: [
            {
              carrier: 'nodes/independent-verifier/tag',
              before: verifier.tag,
              after: 'Selected by explicit policy',
            },
          ],
          meaning: [
            {
              kind: 'node',
              id: 'independent_verifier',
              sha256: sha256(
                stableStringify(projection.semantics.nodes.independent_verifier),
              ),
              carriers: ['nodes/independent-verifier/tag'],
            },
          ],
        },
      ],
    },
    scope: 'Installed authoring-only evolution fixture; no acceptance claim',
  };
  const authoringBytes = Buffer.from(JSON.stringify(authoring, null, 2) + '\n');
  await fs.writeFile(path.join(inputRoot, 'authoring.json'), authoringBytes);
  const sourceManifest = await fs.readFile(
    path.join(inputRoot, 'source/manifest.json'),
  );
  const interactiveManifest = await fs.readFile(
      path.join(interactiveEditionRoot, 'manifest.json'),
    ),
    staticManifest = await fs.readFile(
      path.join(staticEditionRoot, 'manifest.json'),
    ),
    previousStatic = Buffer.from('Previous static artifact.\n'),
    previousInteractive = Buffer.from(
      '<!doctype html><title>Previous interactive artifact</title>\n',
    );
  await fs.writeFile(path.join(inputRoot, 'previous-static.txt'), previousStatic);
  await fs.writeFile(
    path.join(inputRoot, 'previous-interactive.html'),
    previousInteractive,
  );
  const fontRoot = path.join(inputRoot, 'fonts');
  await fs.mkdir(fontRoot);
  const font = path.join(fontRoot, 'selected.ttf');
  await fs.copyFile(
    path.join(
      consumer,
      'node_modules/architecture-publisher/assets/fonts/JetBrainsMono-Regular.ttf',
    ),
    font,
  );
  const outlinedSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#f5f3ed"/><path d="M100 450 H1500" stroke="#29372f" stroke-width="8"/></svg>';
  const referencePng = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(referencePng);
  referencePng.writeUInt32BE(1600, 16);
  referencePng.writeUInt32BE(900, 20);
  const renderer = path.join(inputRoot, 'outline-renderer.cjs'),
    fontList = path.join(inputRoot, 'font-list.cjs');
  await fs.writeFile(
    renderer,
    `#!${process.execPath}\nconst fs=require('node:fs'),crypto=require('node:crypto');\nconst input=fs.readFileSync(0);\nif(crypto.createHash('sha256').update(input).digest('hex')!=='87594199a5b3182860d6ed1a16b446082a2862cc52b8ed8c1731111f3e600bfa')process.exit(3);\nfs.writeSync(1,process.argv.includes('svg')?${JSON.stringify(outlinedSvg)}:Buffer.from(${JSON.stringify(referencePng.toString('base64'))},'base64'));\n`,
    { mode: 0o755 },
  );
  await fs.writeFile(
    fontList,
    `#!${process.execPath}\nprocess.stdout.write(${JSON.stringify(font + '\n')});\n`,
    { mode: 0o755 },
  );
  await fs.writeFile(
    path.join(inputRoot, 'input.json'),
    JSON.stringify(
      {
        schema: 'architecture.installed-evolution-input/v1',
        previous: {
          source: {
            sourceManifest: 'source/manifest.json',
            sourceSha256: sha(sourceManifest),
            projectionDigest: projection.digest,
          },
          edition: {
            manifest: 'interactive-edition/manifest.json',
            sha256: sha(interactiveManifest),
          },
        },
        source: {
          sourceManifest: 'source/manifest.json',
          sourceSha256: sha(sourceManifest),
          projectionDigest: projection.digest,
        },
        authoring: {
          path: 'authoring.json',
          sha256: sha(authoringBytes),
        },
        staticEdition: {
          manifest: 'static-edition/manifest.json',
          sha256: sha(staticManifest),
        },
        outline: {
          renderer: {
            path: 'outline-renderer.cjs',
            sha256: sha(await fs.readFile(renderer)),
          },
          fontList: {
            path: 'font-list.cjs',
            sha256: sha(await fs.readFile(fontList)),
          },
          fonts: [
            {
              path: 'fonts/selected.ttf',
              sha256: sha(await fs.readFile(font)),
            },
          ],
          reference: {
            width: 1600,
            height: 900,
            pngSha256: sha(referencePng),
          },
        },
        expected: {
          changedNodes: [],
          changedDocuments: [],
          affectedInteractiveScenes: ['verification'],
          staticAffected: false,
          pages: 13,
        },
        previousArtifacts: {
          static: {
            path: 'previous-static.txt',
            sha256: sha(previousStatic),
          },
          interactive: {
            path: 'previous-interactive.html',
            sha256: sha(previousInteractive),
          },
        },
        rasterWidths: [1600],
      },
      null,
      2,
    ) + '\n',
  );

  const result = spawnSync(
    process.execPath,
    [
      path.join(root, 'tools/qualification/installed-evolution.mjs'),
      inputRoot,
      consumer,
    ],
    {
      cwd: temporary,
      env: { HOME: temporary, PATH: temporary, LANG: 'C.UTF-8' },
      encoding: 'utf8',
      timeout: 180000,
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'PASS');
  assert.equal(report.pages, 13);
  assert.deepEqual(report.affectedInteractiveScenes, ['verification']);
  assert.equal(report.staticAffected, false);
  assert.equal(report.extensionRemovedBeforeCorePublication, true);
  assert.equal(report.installation, 'INSTALLED');
  assert.equal(report.recovery, 'ALREADY_INSTALLED');
  assert.equal(report.foreignEditsPreserved, true);
  await assert.rejects(
    fs.access(
      path.join(
        consumer,
        'node_modules/@architecture-publisher/ethos',
      ),
    ),
  );
  assert.equal(
    JSON.parse(await fs.readFile(path.join(inputRoot, 'report.json'))).status,
    'PASS',
  );
});
