import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { spawnNativeSync, parseNpmPackRecord } from './fixtures/npm-pack-report.mjs';
import { editionDigest, validateEdition } from '../packages/publisher/src/edition/contract.mjs';
import { compareEditionInput } from '../packages/publisher/src/edition/input.mjs';
import {
  claimModelDigest,
  validateClaimModel,
} from '../packages/publisher/src/semantics/document.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { assertPackageSourceReplay, npmPackageIdentity } from './fixtures/package-identity.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const publisher = path.join(root, 'packages/publisher');
const handoffPath = path.join(root, 'conformance/fixtures/aigw-source-owned-handoff.json');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function json(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function run(command, args, options = {}) {
  const result = spawnNativeSync(command, args, {
    encoding: 'utf8',
    timeout: 120_000,
    ...options,
  });
  assert.equal(
    result.status,
    0,
    `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`,
  );
  return result.stdout;
}

async function copyHandoffFiles(source, destination, files) {
  for (const relative of Object.keys(files)) {
    const input = path.join(source, ...relative.split('/'));
    const output = path.join(destination, ...relative.split('/'));
    const stat = await fs.lstat(input);
    assert(stat.isFile() && !stat.isSymbolicLink(), relative);
    const bytes = await fs.readFile(input);
    assert.equal(sha(bytes), files[relative], relative);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, bytes, { flag: 'wx' });
  }
}

test('Publisher retains only immutable AIGW source-ownership evidence', async (t) => {
  const handoff = await json(handoffPath);
  assert.equal(handoff.schema, 'aigw.architecture-publisher-handoff/v3');
  assert.equal(handoff.publisher.package.name, 'architecture-publisher');
  assert.deepEqual(handoff.publisher.successor, {
    state: 'release-candidate',
    targetTag: 'v0.3.0-alpha.1',
    source: {
      repository: 'dig/research/human-agent-stewardship/architecture-publisher',
      commit: '7e82da7816e461f135076a6f984490d978a3a515',
      path: 'packages/publisher',
      objectType: 'tree',
      oid: '336d0e58058ba2b04b90208582bd4b3fb1f052f0',
    },
    package: {
      name: 'architecture-publisher',
      version: '0.3.0-alpha.1',
      file: 'architecture-publisher-0.3.0-alpha.1.tgz',
      archiveSha256: 'c2707bcffc9ba0cea277cb3b6f4fb6f04f2755996781f92c035fa9cadb4dcc37',
      contentTarSha256: '6b0a925f85879ea7a576c5153849e2741d2e54fcd83bf068cfb5a473b8c7d682',
    },
    evidenceBoundary:
      'Exact source tree and reproducible package candidate; tag, Forge release, installation, and AIGW migration remain separate facts.',
  });
  assert.equal(handoff.aigw.source.editionPath, 'docs/architecture/client-projection');
  assert.equal(handoff.aigw.governance.ownerState, 'candidate');
  assert.deepEqual(handoff.aigw.governance.acceptedRefs, []);
  assert.equal(handoff.aigw.governance.remotePublication, 'unproved');
  assert.deepEqual(handoff.aigw.providerMigration, {
    schema: 'architecture.edition-provider-migration/v1',
    status: 'proposed-not-authorized',
    mode: 'declarative',
    targetRoot: 'architecture/edition-provider',
    mutableInputs: ['README.md', 'claim-model.json', 'edition.json', 'evolution.json'],
    immutableHistory: ['history/registry-v1-claim-model.json', 'history/registry-v1-edition.json'],
    subject: 'AIGW',
    producer: 'Architecture Publisher',
    authorizationOwner: 'AIGW',
    custodian: 'AIGW release target',
    parity: 'required-before-removal',
    relocation: 'required-before-removal',
    rollback: 'required-before-removal',
    baseline: 'aigw.candidate',
    conformancePredicates: [
      'manifest-closure',
      'input-identity',
      'output-schema',
      'determinism',
      'relocation',
      'empty-configuration',
      'adjacent-checkout-immunity',
      'dependency-direction',
      'resource-bounds',
      'later-stage-rejection',
    ],
    removalCriteria: [
      'provider-conformance-pass',
      'candidate-parity-pass',
      'relocated-installed-pass',
      'rollback-rehearsed',
      'aigw-accepted',
    ],
    feedback: 'non-authorizing-source-proposal',
    centralMutableOwner: 'forbidden',
  });
  for (const value of [
    handoff.publisher.source.commit,
    handoff.publisher.source.oid,
    handoff.publisher.package.archiveSha256,
    handoff.publisher.package.contentTarSha256,
    handoff.publisher.successor.source.commit,
    handoff.publisher.successor.source.oid,
    handoff.publisher.successor.package.archiveSha256,
    handoff.publisher.successor.package.contentTarSha256,
    handoff.aigw.source.ownerCommit,
    handoff.aigw.source.ownerTree,
    handoff.aigw.source.editionTree,
    handoff.aigw.source.semanticRevision,
    ...Object.values(handoff.aigw.files),
    ...Object.values(handoff.aigw.candidate),
  ])
    if (typeof value === 'string') assert.match(value, /^[0-9a-f]{40}$|^[0-9a-f]{64}$/u);

  await assert.rejects(fs.access(path.join(root, 'migration/aigw')), { code: 'ENOENT' });
  const tracked = run('git', ['ls-files'], { cwd: root }).trim().split('\n');
  assert.equal(
    tracked.some((file) => file.startsWith('migration/aigw/')),
    false,
  );

  const historical = await fs.mkdtemp(path.join(os.tmpdir(), 'aigw-publisher-handoff-'));
  t.after(() => fs.rm(historical, { recursive: true, force: true }));
  const source = path.join(historical, 'source');
  await fs.mkdir(source);
  const archived = spawnSync(
    'git',
    [
      'archive',
      '--format=tar',
      `${handoff.publisher.source.commit}:${handoff.publisher.source.path}`,
    ],
    { cwd: root, encoding: null, maxBuffer: 32 * 1024 * 1024 },
  );
  assert.equal(archived.status, 0, archived.stderr?.toString());
  const extracted = spawnSync('tar', ['-xf', '-', '-C', source], {
    input: archived.stdout,
    encoding: null,
  });
  assert.equal(extracted.status, 0, extracted.stderr?.toString());
  const packed = parseNpmPackRecord(
    run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', historical], {
      cwd: source,
    }),
  );
  assert.equal(packed.filename, handoff.publisher.package.file);
  if (process.platform !== 'win32')
    assert.equal(
      npmPackageIdentity(await fs.readFile(path.join(historical, packed.filename)))
        .contentTarSha256,
      handoff.publisher.package.contentTarSha256,
    );
  const unpacked = spawnSync(
    'tar',
    ['-xzf', path.join(historical, packed.filename), '-C', historical],
    {
      encoding: 'utf8',
      timeout: 30_000,
    },
  );
  assert.equal(unpacked.status, 0, unpacked.stderr);
  await assertPackageSourceReplay({
    repository: root,
    tree: handoff.publisher.source.oid,
    root: path.join(historical, 'package'),
    files: packed.files.map(({ path: file }) => file),
  });
});

const aigwEditionRoot = process.env.AIGW_EDITION_ROOT;
const aigwSourceRoot = process.env.AIGW_SOURCE_ROOT;
const browserExecutable = process.env.ARCHPUB_BROWSER_EXECUTABLE;
const externalSelection =
  path.isAbsolute(aigwEditionRoot ?? '') && path.isAbsolute(aigwSourceRoot ?? '');

test(
  'packed Publisher reproduces the source-owned AIGW Edition and evolution offline',
  { skip: externalSelection ? false : 'explicit AIGW_EDITION_ROOT and AIGW_SOURCE_ROOT required' },
  async (t) => {
    const handoff = await json(handoffPath);
    const temporary = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'aigw-source-owned-edition-')),
    );
    t.after(() => fs.rm(temporary, { recursive: true, force: true }));

    const editionRoot = path.join(temporary, 'edition');
    await fs.mkdir(editionRoot);
    await copyHandoffFiles(aigwEditionRoot, editionRoot, handoff.aigw.files);

    const modelPath = path.join(editionRoot, 'claim-model.json');
    const editionPath = path.join(editionRoot, 'edition.json');
    const modelBytes = await fs.readFile(modelPath);
    const editionBytes = await fs.readFile(editionPath);
    const model = validateClaimModel(JSON.parse(modelBytes));
    const edition = validateEdition(model, JSON.parse(editionBytes));
    assert.equal(claimModelDigest(model), handoff.aigw.candidate.semanticDigest);
    assert.equal(editionDigest(model, edition), handoff.aigw.candidate.editionDigest);

    const evolutionPath = path.join(editionRoot, 'evolution.json');
    const evolution = await compareEditionInput(
      evolutionPath,
      sha(await fs.readFile(evolutionPath)),
    );
    assert.equal(evolution.delta.hasChanges, true);
    assert.deepEqual(evolution.delta.added.entities, handoff.aigw.evolution.addedEntities);
    assert.deepEqual(evolution.delta.removed.entities, handoff.aigw.evolution.removedEntities);
    assert.deepEqual(evolution.editions.changed, handoff.aigw.evolution.changedEditions);
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(evolution.obligations).map(([kind, obligations]) => [
          kind,
          obligations.length,
        ]),
      ),
      handoff.aigw.evolution.obligations,
    );

    const archive = parseNpmPackRecord(
      run('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], {
        cwd: publisher,
      }),
    );
    const archivePath = path.join(temporary, archive.filename);
    assert.equal(archive.name, handoff.publisher.successor.package.name);
    assert.equal(archive.version, handoff.publisher.successor.package.version);
    const packageIdentity = npmPackageIdentity(await fs.readFile(archivePath));
    assert.equal(packageIdentity.archiveSha256, handoff.publisher.successor.package.archiveSha256);
    assert.equal(
      packageIdentity.contentTarSha256,
      handoff.publisher.successor.package.contentTarSha256,
    );

    const consumer = path.join(temporary, 'consumer');
    const home = path.join(temporary, 'home');
    const cache = path.join(temporary, 'npm-cache');
    await fs.mkdir(consumer);
    await fs.mkdir(home);
    await fs.writeFile(
      path.join(consumer, 'package.json'),
      JSON.stringify({ private: true, type: 'module' }),
    );
    run(
      'npm',
      [
        'install',
        '--offline',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
        archivePath,
      ],
      {
        cwd: consumer,
        env: {
          ...process.env,
          HOME: home,
          npm_config_cache: cache,
          npm_config_offline: 'true',
          npm_config_registry: 'https://registry.invalid/',
          npm_config_update_notifier: 'false',
        },
      },
    );
    const resolve = createRequire(path.join(consumer, 'package.json')).resolve;
    const importPublic = async (specifier) => import(pathToFileURL(resolve(specifier)).href);
    const cli = resolve('architecture-publisher/package.json').replace(
      /package\.json$/u,
      'src/cli/main.mjs',
    );

    const selected = [];
    for (const [id, source] of Object.entries(model.sources)) {
      const relative = source.locator.replace(/^source\//u, '');
      const input = path.join(aigwSourceRoot, ...relative.split('/'));
      const stat = await fs.lstat(input);
      assert(stat.isFile() && !stat.isSymbolicLink(), id);
      const bytes = await fs.readFile(input);
      assert.equal(sha(bytes), source.sha256, id);
      selected.push({ input, path: source.locator, bytes: bytes.length, sha256: source.sha256 });
    }
    const semanticInput = path.join(editionRoot, 'claim-model.json');
    selected.unshift({
      input: semanticInput,
      path: 'semantic.json',
      bytes: modelBytes.length,
      sha256: sha(modelBytes),
    });
    const sourcePlan = {
      schema: 'architecture.pack-input/v1',
      source: {
        id: handoff.aigw.source.repository,
        revision: handoff.aigw.source.semanticRevision,
      },
      files: selected,
      output: path.join(temporary, 'source-bundle'),
    };
    const sourcePlanBytes = Buffer.from(`${JSON.stringify(sourcePlan, null, 2)}\n`);
    const sourcePlanPath = path.join(temporary, 'source-pack.json');
    await fs.writeFile(sourcePlanPath, sourcePlanBytes);
    const runtimeEnv = { HOME: home, PATH: home, LANG: 'C.UTF-8' };
    const sourceResult = JSON.parse(
      run(
        process.execPath,
        [cli, 'source', 'pack', sourcePlanPath, '--sha256', sha(sourcePlanBytes)],
        { cwd: consumer, env: runtimeEnv },
      ),
    );
    assert.equal(sourceResult.manifestSha256, handoff.aigw.candidate.sourceManifestSha256);

    const output = path.join(temporary, 'candidate');
    const buildPlan = {
      sourceManifest: sourceResult.manifestPath,
      sourceSha256: sourceResult.manifestSha256,
      semanticMember: 'semantic.json',
      edition: editionPath,
      editionSha256: sha(editionBytes),
      output,
    };
    const buildPlanBytes = Buffer.from(`${JSON.stringify(buildPlan, null, 2)}\n`);
    const buildPlanPath = path.join(temporary, 'edition-build.json');
    await fs.writeFile(buildPlanPath, buildPlanBytes);
    const result = JSON.parse(
      run(
        process.execPath,
        [cli, 'edition', 'build', buildPlanPath, '--sha256', sha(buildPlanBytes)],
        { cwd: consumer, env: runtimeEnv },
      ),
    );
    assert.deepEqual(
      {
        manifestSha256: result.manifestSha256,
        candidateSha256: result.candidateSha256,
        semanticDigest: result.semanticDigest,
        editionDigest: result.editionDigest,
        staticSceneDigest: result.staticSceneDigest,
        interactiveSceneDigest: result.interactiveSceneDigest,
      },
      {
        manifestSha256: handoff.aigw.candidate.manifestSha256,
        candidateSha256: handoff.aigw.candidate.candidateSha256,
        semanticDigest: handoff.aigw.candidate.semanticDigest,
        editionDigest: handoff.aigw.candidate.editionDigest,
        staticSceneDigest: handoff.aigw.candidate.staticSceneDigest,
        interactiveSceneDigest: handoff.aigw.candidate.interactiveSceneDigest,
      },
    );
    assert.equal(
      sha(await fs.readFile(path.join(output, 'overview.png'))),
      handoff.aigw.candidate.pngSha256,
    );
    assert.equal(
      sha(await fs.readFile(path.join(output, 'overview.svg'))),
      handoff.aigw.candidate.svgSha256,
    );
    assert.equal(
      sha(await fs.readFile(path.join(output, 'views/overview.html'))),
      handoff.aigw.candidate.overviewHtmlSha256,
    );
    const bundle = await readSourceBundle(
      path.join(output, 'manifest.json'),
      result.manifestSha256,
    );
    for (const member of bundle.members) {
      assert.equal(member.content.includes(Buffer.from(aigwEditionRoot)), false, member.path);
      assert.equal(member.content.includes(Buffer.from(aigwSourceRoot)), false, member.path);
      assert.equal(member.content.includes(Buffer.from(root)), false, member.path);
    }

    const candidate = await json(path.join(output, 'candidate.json'));
    let browserObserved = false;
    if (path.isAbsolute(browserExecutable ?? '')) {
      const server = http.createServer(async (request, response) => {
        try {
          const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
          const selected = path.resolve(output, `.${pathname}`);
          if (selected !== output && !selected.startsWith(`${output}${path.sep}`)) {
            response.writeHead(404);
            response.end();
            return;
          }
          const bytes = await fs.readFile(selected);
          response.writeHead(200, {
            'Content-Type': selected.endsWith('.html')
              ? 'text/html; charset=utf-8'
              : 'application/octet-stream',
            'Cache-Control': 'no-store',
          });
          response.end(bytes);
        } catch {
          response.writeHead(404);
          response.end();
        }
      });
      await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
      const browser = await chromium.launch({
        executablePath: browserExecutable,
        headless: true,
        chromiumSandbox: true,
        timeout: 15_000,
      });
      try {
        const port = server.address().port;
        for (const artifact of candidate.media.interactive.artifacts) {
          const context = await browser.newContext({
            viewport: { width: 1440, height: 1000 },
            reducedMotion: 'reduce',
            serviceWorkers: 'block',
          });
          try {
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await page.route('**/*', (route) => {
              const url = new URL(route.request().url());
              if (url.origin === `http://127.0.0.1:${port}`) return route.continue();
              errors.push(`external-request:${url.origin}`);
              return route.abort();
            });
            const response = await page.goto(
              `http://127.0.0.1:${port}/${artifact.path}?theme=light`,
              { waitUntil: 'load', timeout: 20_000 },
            );
            assert.equal(response.status(), 200, artifact.path);
            await page.evaluate(async () => document.fonts.ready);
            assert.deepEqual(errors, [], artifact.path);
            assert.equal(
              await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
              true,
            );
            assert.equal((await page.title()).length > 0, true, artifact.path);
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
              ),
              true,
              artifact.path,
            );
            const theme = page.locator('#btn-theme');
            await theme.focus();
            await page.keyboard.press('Enter');
            assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
            const firstNode = page.locator('.diagram-container [data-node-id]').first();
            await firstNode.focus();
            await page.keyboard.press('Enter');
            assert.equal(
              await page.locator('.diagram-container > svg').getAttribute('data-focus-active'),
              await firstNode.getAttribute('data-node-id'),
            );
          } finally {
            await context.close();
          }
        }
        browserObserved = true;
      } finally {
        await browser.close();
        await new Promise((resolveClose, rejectClose) =>
          server.close((error) => (error ? rejectClose(error) : resolveClose())),
        );
      }
    }
    const qualificationApi = await importPublic('architecture-publisher/qualification');
    const verifierSha256 = sha(Buffer.from('aigw-source-owned-conformance/v1'));
    const records = candidate.obligations.map(({ kind, predicate }, index) => {
      const observed = !['interactive', 'accessibility'].includes(kind) || browserObserved;
      return qualificationApi.bindQualificationRecord(candidate, {
        id: `aigw.${kind}.${index}`,
        kind,
        verifier: {
          kind: 'machine',
          id: 'aigw-source-owned-conformance',
          implementationSha256: verifierSha256,
        },
        predicate,
        scope: { kind: 'conformance', value: `aigw-${kind}` },
        environment: { kind: 'runtime', value: 'relocated-offline-empty-home' },
        observations: [
          {
            name: 'result',
            value: observed ? 'verified' : 'not-observed-by-this-test',
          },
        ],
        verdict: observed ? 'PASS' : 'UNKNOWN',
        limitations: observed
          ? []
          : ['Browser execution and accessibility observation require their own verifier.'],
      });
    });
    const qualification = qualificationApi.bindQualificationSet(candidate, records);
    const admission = qualificationApi.admitQualificationSet(
      model,
      edition,
      candidate,
      qualification,
    );
    assert.equal(admission.complete, true);
    assert.equal(admission.verdict, browserObserved ? 'PASS' : 'UNKNOWN');
    assert.equal(admission.admitted, browserObserved);
    assert.deepEqual(admission.missing, []);

    const overview = await fs.readFile(path.join(output, 'views/overview.html'), 'utf8');
    assert.match(overview, /data-node-id="configuration"/u);
    assert.match(overview, /data-node-id="transaction"/u);
    assert.doesNotMatch(overview, /data-preset-badge-|architecture-publisher\/plate/iu);

    const publicationApi = await importPublic('architecture-publisher/publication');
    const destinations = {
      native: path.join(temporary, 'delivery', 'native'),
      atlas: path.join(temporary, 'delivery', 'atlas'),
    };
    await fs.mkdir(path.dirname(destinations.native));
    const payload = [];
    for (const [candidateMedium, publicationMedium] of [
      ['static', 'native'],
      ['interactive', 'atlas'],
    ])
      for (const artifact of candidate.media[candidateMedium].artifacts)
        payload.push({
          medium: publicationMedium,
          path: artifact.path,
          source: path.join(output, ...artifact.path.split('/')),
          bytes: artifact.bytes,
          sha256: artifact.sha256,
        });
    const publicationInput = {
      options: {
        sourceRoots: [output],
        destinations,
        recoveryRoot: path.join(temporary, 'recovery'),
      },
      source: {
        id: edition.id,
        revision: handoff.aigw.source.semanticRevision,
        candidateSha256: result.candidateSha256,
        qualification: admission.verdict,
      },
      payload,
      entries: {
        native: {
          'index.html': '<p>Open overview.png</p>',
          'README.md': 'AIGW static candidate; semantic acceptance is not granted.\n',
        },
        atlas: {
          'index.html': '<p>Open views/overview.html</p>',
          'README.md': 'AIGW interactive candidate; browser acceptance remains unproved.\n',
        },
      },
      dependencies: [
        {
          file: path.join(output, 'candidate.json'),
          sha256: sha(await fs.readFile(path.join(output, 'candidate.json'))),
        },
      ],
    };
    const publication = await publicationApi.planPairFiles(publicationInput);
    const authorization = { decision: 'AUTHORIZED', planSha256: publication.sha256 };
    const installed = await publicationApi.installPairFiles(publication, authorization);
    assert.equal(installed.status, 'INSTALLED');
    assert.equal(installed.globalAtomicity, false);
    assert.equal(
      (await publicationApi.recoverPairFiles(publication, authorization)).status,
      'ALREADY_INSTALLED',
    );
    for (const item of payload)
      assert.equal(
        sha(await fs.readFile(path.join(destinations[item.medium], ...item.path.split('/')))),
        item.sha256,
        item.path,
      );

    const replacementInput = structuredClone(publicationInput);
    replacementInput.entries.native['README.md'] =
      'AIGW static candidate revalidated through the same exact package.\n';
    replacementInput.entries.atlas['README.md'] =
      'AIGW interactive candidate revalidated; browser acceptance remains unproved.\n';
    replacementInput.replacement = { plan: publication, authorization };
    const replacement = await publicationApi.planPairFiles(replacementInput);
    const replacementAuthorization = {
      decision: 'AUTHORIZED',
      planSha256: replacement.sha256,
    };
    assert.equal(
      (await publicationApi.installPairFiles(replacement, replacementAuthorization)).status,
      'INSTALLED',
    );
    assert.equal(
      (await publicationApi.recoverPairFiles(replacement, replacementAuthorization)).status,
      'ALREADY_INSTALLED',
    );

    const interruptedInput = structuredClone(publicationInput);
    interruptedInput.options.destinations = {
      native: path.join(temporary, 'interrupted-delivery', 'native'),
      atlas: path.join(temporary, 'interrupted-delivery', 'atlas'),
    };
    interruptedInput.options.recoveryRoot = path.join(temporary, 'interrupted-recovery');
    await fs.mkdir(path.dirname(interruptedInput.options.destinations.native));
    const interrupted = await publicationApi.planPairFiles(interruptedInput);
    const interruptedAuthorization = {
      decision: 'AUTHORIZED',
      planSha256: interrupted.sha256,
    };
    const interruptRequest = path.join(temporary, 'interrupt-request.json');
    const interruptDriver = path.join(consumer, 'interrupt-publication.mjs');
    await fs.writeFile(
      interruptRequest,
      JSON.stringify({ plan: interrupted, authorization: interruptedAuthorization }),
    );
    await fs.writeFile(
      interruptDriver,
      [
        "import fs from 'node:fs/promises';",
        `import { installPairFiles } from ${JSON.stringify(
          pathToFileURL(resolve('architecture-publisher/publication')).href,
        )};`,
        "const request=JSON.parse(await fs.readFile(process.argv[2],'utf8'));",
        'const rename=fs.rename;',
        'fs.rename=async(source,target)=>{',
        '  const result=await rename(source,target);',
        "  if(target===request.plan.options.destinations.native)process.kill(process.pid,'SIGKILL');",
        '  return result;',
        '};',
        'await installPairFiles(request.plan,request.authorization);',
        '',
      ].join('\n'),
    );
    const terminated = spawnSync(process.execPath, [interruptDriver, interruptRequest], {
      cwd: consumer,
      env: runtimeEnv,
      encoding: 'utf8',
      timeout: 30_000,
    });
    assert.equal(terminated.signal, 'SIGKILL', terminated.stdout + terminated.stderr);
    assert.equal(
      (await publicationApi.recoverPairFiles(interrupted, interruptedAuthorization)).status,
      'ROLLED_BACK',
    );
    for (const target of Object.values(interrupted.options.destinations))
      await assert.rejects(fs.stat(target), { code: 'ENOENT' });
    assert.equal(
      (await publicationApi.recoverPairFiles(interrupted, interruptedAuthorization)).status,
      'ALREADY_ROLLED_BACK',
    );
    const resumedInput = structuredClone(interruptedInput);
    resumedInput.source.revision = `${handoff.aigw.source.semanticRevision}:recovered`;
    const resumed = await publicationApi.planPairFiles(resumedInput);
    const resumedAuthorization = { decision: 'AUTHORIZED', planSha256: resumed.sha256 };
    assert.equal(
      (await publicationApi.installPairFiles(resumed, resumedAuthorization)).status,
      'INSTALLED',
    );
  },
);
