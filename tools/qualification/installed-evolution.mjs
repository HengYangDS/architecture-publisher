import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Explicit installed-package acceptance. No developer checkout or credentials.
const root = path.resolve(process.argv[2]),
  pkg = path.resolve(process.argv[3]);
const hash = (b) => createHash('sha256').update(b).digest('hex');
const cli = path.join(pkg, 'src/cli/main.mjs');
const config = JSON.parse(await fs.readFile(path.join(root, 'input.json')));
const work = path.join(root, 'run');
await fs.mkdir(work);
const home = path.join(work, 'empty-home');
await fs.mkdir(home);
const write = async (name, data) => {
  const file = path.join(work, name);
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', {
    flag: 'wx',
  });
  return file;
};
const resolveSelection = (s) =>
  Object.fromEntries(
    Object.entries(s).map(([k, v]) => [
      k,
      k.endsWith('Manifest') ? path.resolve(root, v) : v,
    ]),
  );
const invoke = (args) => {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: work,
    env: { HOME: home, PATH: home, LANG: 'C.UTF-8' },
    timeout: 90000,
    maxBuffer: 32 * 1024 * 1024,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
};
const source = resolveSelection(config.source),
  previous = resolveSelection(config.previous);
const preparation = {
  previous,
  source,
  authoring: path.join(pkg, 'editions/ethos/refresh.json'),
  authoringSha256: hash(
    await fs.readFile(path.join(pkg, 'editions/ethos/refresh.json')),
  ),
  output: path.join(work, 'candidate'),
};
const prepared = invoke([
  'atlas',
  'ethos',
  'prepare',
  await write('prepare.json', preparation),
]);
assert.equal(prepared.pages, 13);
assert.deepEqual(prepared.delta.changed.nodes, ['candidate_base_stale']);
const rendered = invoke([
  'atlas',
  'ethos',
  await write('render.json', {
    ...prepared.atlas,
    output: path.join(work, 'atlas'),
  }),
]);
assert.equal(rendered.manifestSha256, config.atlasManifestSha256);
const atlas = {
  ...prepared.atlas,
  outputManifest: path.join(work, 'atlas/manifest.json'),
  outputSha256: rendered.manifestSha256,
};
const standalone = invoke([
  'atlas',
  'ethos',
  'standalone',
  await write('standalone.json', {
    atlas,
    output: path.join(work, 'standalone.html'),
  }),
]);
assert.equal(standalone.sha256, config.standaloneSha256);
const poster = {
  ...source,
  editionManifest: path.resolve(root, config.poster.editionManifest),
  editionSha256: config.poster.editionSha256,
  output: path.join(work, 'poster'),
};
const staticResult = invoke([
  'poster',
  'ethos',
  await write('poster.json', poster),
]);
assert.equal(staticResult.svg.sha256, config.poster.svgSha256);
const outline = path.resolve(root, config.outline.manifest);
const rasters = [];
for (const width of [1600, 2400, 6000]) {
  const result = invoke([
    'raster',
    await write(`raster-${width}.json`, {
      manifest: outline,
      manifestSha256: config.outline.manifestSha256,
      svg: 'outlined.svg',
      fonts: [],
      width,
      output: path.join(work, `poster-${width}.png`),
    }),
  ]);
  assert.equal(result.artifact.sha256, config.rasters[String(width)]);
  rasters.push({ width, sha256: result.artifact.sha256 });
}
const destinations = {
  native: path.join(work, 'delivery-native'),
  atlas: path.join(work, 'delivery-atlas'),
};
for (const dir of Object.values(destinations)) {
  await fs.mkdir(dir);
  await fs.writeFile(
    path.join(dir, 'personal.txt'),
    'Preserve this foreign original.\n',
  );
}
const oldModule = await import(
  pathToFileURL(path.resolve(root, config.priorInstaller)).href
);
async function payloadFrom(base, paths, medium) {
  return Promise.all(
    paths.map(async (name) => {
      const source = path.join(base, name),
        bytes = await fs.readFile(source);
      return {
        medium,
        path: (medium === 'native' ? 'terminal/' : 'atlas/') + name,
        source,
        bytes: bytes.length,
        sha256: hash(bytes),
      };
    }),
  );
}
const oldStaticRoot = path.resolve(root, config.priorStatic),
  oldAtlasRoot = path.resolve(root, config.priorAtlas);
const oldPages = JSON.parse(
  await fs.readFile(path.join(oldAtlasRoot, 'manifest.json')),
).files.map((f) => f.path);
const staticNames = [
  'native/terminal.svg',
  'native/terminal.html',
  ...[1600, 2400, 6000].map((w) => `native/terminal-${w}.png`),
];
const entries = (label) =>
  Object.fromEntries(
    ['native', 'atlas'].map((m) => [
      m,
      {
        'index.html': `<p>${label} ${m}</p>`,
        'README.md': 'Bounded installed evolution acceptance.\n',
      },
    ]),
  );
const prior = await oldModule.planPairFiles({
  options: {
    sourceRoots: [oldStaticRoot, oldAtlasRoot],
    destinations,
    recoveryRoot: path.join(work, 'recovery'),
  },
  source: { id: 'ethos', revision: 'v0.1.0-alpha.0' },
  payload: [
    ...(await payloadFrom(oldStaticRoot, staticNames, 'native')),
    ...(await payloadFrom(oldAtlasRoot, oldPages, 'atlas')),
  ],
  entries: entries('previous'),
  dependencies: [],
});
const priorAuthorization = { decision: 'AUTHORIZED', planSha256: prior.sha256 };
assert.equal(
  (await oldModule.installPairFiles(prior, priorAuthorization)).status,
  'INSTALLED',
);
for (const dir of Object.values(destinations))
  await fs.writeFile(
    path.join(dir, 'personal.txt'),
    'Preserve the later user edit.\n',
  );
const staticRoot = path.resolve(root, config.currentStatic);
const files = JSON.parse(
  await fs.readFile(path.join(work, 'atlas/manifest.json')),
).files.map((f) => f.path);
const replacement = {
  options: {
    sourceRoots: [staticRoot, path.join(work, 'atlas')],
    destinations,
    recoveryRoot: path.join(work, 'recovery'),
  },
  source: { id: 'ethos', revision: source.projectionDigest },
  payload: [
    ...(await payloadFrom(staticRoot, staticNames, 'native')),
    ...(await payloadFrom(path.join(work, 'atlas'), files, 'atlas')),
  ],
  entries: entries('current'),
  dependencies: [],
  replacement: { plan: prior, authorization: priorAuthorization },
};
// Prove file publication remains usable without any ETHOS edition/integration.
await fs.rename(path.join(pkg, 'editions'), path.join(pkg, 'editions-removed'));
await fs.rename(
  path.join(pkg, 'src/integrations'),
  path.join(pkg, 'integrations-removed'),
);
const planned = invoke([
  'publish',
  'files',
  'plan',
  await write('replacement-input.json', replacement),
]).plan;
const planFile = await write('replacement-plan.json', planned),
  authFile = await write('replacement-authorization.json', {
    decision: 'AUTHORIZED',
    planSha256: planned.sha256,
  });
assert.equal(
  invoke(['publish', 'files', 'apply', planFile, authFile]).status,
  'INSTALLED',
);
assert.equal(
  invoke(['publish', 'files', 'recover', planFile, authFile]).status,
  'ALREADY_INSTALLED',
);
assert.equal(
  invoke(['publish', 'files', 'apply', planFile, authFile]).status,
  'ALREADY_INSTALLED',
);
for (const dir of Object.values(destinations))
  assert.equal(
    await fs.readFile(path.join(dir, 'personal.txt'), 'utf8'),
    'Preserve the later user edit.\n',
  );
for (const row of planned.payload)
  assert.equal(
    hash(await fs.readFile(path.join(destinations[row.medium], row.path))),
    row.sha256,
  );
const report = {
  status: 'PASS',
  node: process.version,
  platform: process.platform,
  pages: prepared.pages,
  semanticChange: prepared.delta.changed.nodes,
  svgSha256: staticResult.svg.sha256,
  atlasManifestSha256: rendered.manifestSha256,
  standaloneSha256: standalone.sha256,
  rasters,
  previousInstaller: config.previousInstallerRevision,
  installation: 'INSTALLED',
  recovery: 'ALREADY_INSTALLED',
  replay: 'ALREADY_INSTALLED',
  foreignEditsPreserved: true,
  installedPayload: planned.payload.length,
  scope:
    'Actual source semantic evolution and real successive edition files through installed commands; not browser or hosted proof',
};
await fs.writeFile(
  path.join(root, 'report.json'),
  JSON.stringify(report, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify(report));
