import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Installed-product acceptance. Inputs are explicit; no checkout is discovered.
const inputRoot = await fs.realpath(path.resolve(process.argv[2])),
  consumer = await fs.realpath(path.resolve(process.argv[3])),
  work = path.join(inputRoot, 'run'),
  home = path.join(work, 'empty-home'),
  artifactRoot = path.join(inputRoot, 'artifacts'),
  effectRoot = path.join(path.dirname(inputRoot), 'effects'),
  coreRoot = path.join(consumer, 'node_modules/architecture-publisher'),
  extensionRoot = path.join(
    consumer,
    'node_modules/@architecture-publisher/ethos',
  ),
  cli = path.join(coreRoot, 'src/cli/main.mjs'),
  config = JSON.parse(await fs.readFile(path.join(inputRoot, 'input.json')));

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const exact = (value, keys) =>
  value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const digest = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const selected = (value) => {
  assert(exact(value, ['sourceManifest', 'sourceSha256', 'projectionDigest']));
  assert(digest(value.sourceSha256));
  assert(digest(value.projectionDigest));
  return {
    ...value,
    sourceManifest: path.resolve(inputRoot, value.sourceManifest),
  };
};
const edition = (value) => {
  assert(exact(value, ['manifest', 'sha256']));
  assert(digest(value.sha256));
  return {
    editionManifest: path.resolve(inputRoot, value.manifest),
    editionSha256: value.sha256,
  };
};
const artifact = async (value) => {
  assert(exact(value, ['path', 'sha256']));
  assert(digest(value.sha256));
  const file = path.resolve(inputRoot, value.path);
  assert.equal(hash(await fs.readFile(file)), value.sha256);
  return file;
};

assert(
  exact(config, [
    'schema',
    'previous',
    'source',
    'authoring',
    'staticEdition',
    'outline',
    'expected',
    'previousArtifacts',
    'rasterWidths',
  ]),
);
assert.equal(config.schema, 'architecture.installed-evolution-input/v1');
assert(exact(config.authoring, ['path', 'sha256']));
assert(digest(config.authoring.sha256));
assert(
  exact(config.expected, [
    'changedNodes',
    'changedDocuments',
    'affectedInteractiveScenes',
    'staticAffected',
    'pages',
  ]),
);
assert(
  [
    config.expected.changedNodes,
    config.expected.changedDocuments,
    config.expected.affectedInteractiveScenes,
  ].every(Array.isArray),
);
assert.equal(typeof config.expected.staticAffected, 'boolean');
assert(Number.isSafeInteger(config.expected.pages));
assert(config.expected.pages > 0);
assert(exact(config.previousArtifacts, ['static', 'interactive']));
assert(
  exact(config.outline, [
    'renderer',
    'fontList',
    'fonts',
    'reference',
  ]),
);
assert(
  Array.isArray(config.rasterWidths) &&
    config.rasterWidths.length > 0 &&
    config.rasterWidths.every((width) => Number.isSafeInteger(width) && width > 0),
);

await fs.mkdir(work);
await fs.mkdir(home);
await fs.mkdir(artifactRoot);
await fs.mkdir(effectRoot);

const write = async (name, data) => {
  const file = path.join(work, name);
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', {
    flag: 'wx',
  });
  return file;
};
const environment = { HOME: home, PATH: home, LANG: 'C.UTF-8' };
const result = (run) => {
  assert.equal(run.error, undefined);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  return JSON.parse(run.stdout);
};
const invokeCli = (args) =>
  result(
    spawnSync(process.execPath, [cli, ...args], {
      cwd: work,
      env: environment,
      timeout: 120000,
      maxBuffer: 64 * 1024 * 1024,
      encoding: 'utf8',
    }),
  );
const extensionMethods = new Set([
  'prepareEthosCandidateInput',
  'renderEthosAtlasInput',
  'renderStandaloneAtlasInput',
  'renderEthosPosterInput',
  'outlineEthosPosterInput',
]);
const invokeExtension = (name, args) => {
  assert(extensionMethods.has(name));
  const program = `import * as api from '@architecture-publisher/ethos/edition';
try {
  const value = await api[process.argv[1]](...JSON.parse(process.argv[2]));
  process.stdout.write(JSON.stringify(value) + '\\n');
} catch (error) {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
}`;
  return result(
    spawnSync(process.execPath, ['--input-type=module', '-e', program, name, JSON.stringify(args)], {
      cwd: consumer,
      env: environment,
      timeout: 120000,
      maxBuffer: 64 * 1024 * 1024,
      encoding: 'utf8',
    }),
  );
};

assert(exact(config.previous, ['source', 'edition']));
const source = selected(config.source),
  previous = {
    ...selected(config.previous.source),
    ...edition(config.previous.edition),
  },
  authoring = path.resolve(inputRoot, config.authoring.path);
assert.equal(hash(await fs.readFile(authoring)), config.authoring.sha256);
const prepared = invokeExtension('prepareEthosCandidateInput', [
  await write('prepare.json', {
    previous,
    source,
    authoring,
    authoringSha256: config.authoring.sha256,
    output: path.join(artifactRoot, 'candidate'),
  }),
]);
assert.equal(prepared.pages, config.expected.pages);
assert.deepEqual(
  prepared.evolution.ethos.changed.nodes,
  config.expected.changedNodes,
);
assert.deepEqual(
  prepared.evolution.ethos.changed.documents,
  config.expected.changedDocuments,
);
assert.deepEqual(
  prepared.evolution.editions.affected[0].interactive,
  config.expected.affectedInteractiveScenes,
);
assert.equal(
  prepared.evolution.editions.affected[0].static,
  config.expected.staticAffected,
);

const rendered = invokeExtension('renderEthosAtlasInput', [
  await write('atlas.json', {
    ...prepared.atlas,
    output: path.join(artifactRoot, 'atlas'),
  }),
]);
const atlas = {
  ...prepared.atlas,
  outputManifest: path.join(artifactRoot, 'atlas/manifest.json'),
  outputSha256: rendered.manifestSha256,
};
const standalone = invokeExtension('renderStandaloneAtlasInput', [
  await write('standalone.json', {
    atlas,
    output: path.join(artifactRoot, 'architecture.html'),
  }),
]);
const posterSelection = edition(config.staticEdition);
const poster = invokeExtension('renderEthosPosterInput', [
  await write('poster.json', {
    ...source,
    ...posterSelection,
    output: path.join(artifactRoot, 'poster'),
  }),
]);
const outline = structuredClone(config.outline);
for (const key of ['renderer', 'fontList'])
  outline[key].path = path.resolve(inputRoot, outline[key].path);
for (const font of outline.fonts)
  font.path = path.resolve(inputRoot, font.path);
const outlined = invokeExtension('outlineEthosPosterInput', [
  await write('outline.json', {
    poster: { ...source, ...posterSelection },
    ...outline,
    output: path.join(artifactRoot, 'outlined'),
  }),
]);

// Everything below is generic product work. Removing the domain extension now
// makes any accidental reverse dependency observable in this installed journey.
const removedExtension = path.join(work, 'removed-ethos-extension');
await fs.rename(extensionRoot, removedExtension);
await assert.rejects(fs.access(extensionRoot));

const rasterInputs = [
  {
    input: path.join(artifactRoot, 'outlined/outlined.svg'),
    path: 'poster/outlined.svg',
  },
];
for (const item of rasterInputs) {
  const bytes = await fs.readFile(item.input);
  item.bytes = bytes.length;
  item.sha256 = hash(bytes);
}
const packFile = await write('raster-source.json', {
  schema: 'architecture.pack-input/v1',
  source: {
    id: 'ethos:installed-evolution-static',
    revision: source.projectionDigest,
  },
  files: rasterInputs,
  output: path.join(artifactRoot, 'raster-source'),
});
const packed = invokeCli([
  'source',
  'pack',
  packFile,
  '--sha256',
  hash(await fs.readFile(packFile)),
]);

const rasters = [];
for (const width of config.rasterWidths) {
  const output = path.join(artifactRoot, `architecture-${width}.png`);
  const renderedRaster = invokeCli([
    'render',
    'raster',
    await write(`raster-${width}.json`, {
      manifest: packed.manifestPath,
      manifestSha256: packed.manifestSha256,
      svg: 'poster/outlined.svg',
      fonts: [],
      width,
      output,
    }),
  ]);
  rasters.push({ width, output, ...renderedRaster.artifact });
}

const destinations = {
  native: path.join(effectRoot, 'delivery-static'),
  atlas: path.join(effectRoot, 'delivery-interactive'),
};
for (const directory of Object.values(destinations)) {
  await fs.mkdir(directory);
  await fs.writeFile(
    path.join(directory, 'personal.txt'),
    'Preserve this foreign original.\n',
  );
}
const payload = async (medium, sourcePath, target) => {
  const bytes = await fs.readFile(sourcePath);
  return {
    medium,
    path: target,
    source: sourcePath,
    bytes: bytes.length,
    sha256: hash(bytes),
  };
};
const entries = (label) => ({
  native: {
    'index.html': `<p>${label} static</p>`,
    'README.md': 'Installed evolution acceptance; not semantic approval.\n',
  },
  atlas: {
    'index.html': `<p>${label} interactive</p>`,
    'README.md': 'Installed evolution acceptance; not semantic approval.\n',
  },
});
const previousStatic = await artifact(config.previousArtifacts.static),
  previousInteractive = await artifact(config.previousArtifacts.interactive);
const priorInput = {
  options: {
    sourceRoots: [inputRoot],
    destinations,
    recoveryRoot: path.join(effectRoot, 'recovery-prior'),
  },
  source: { id: 'ethos:prior-edition', revision: previous.projectionDigest },
  payload: [
    await payload('native', previousStatic, 'edition/architecture.txt'),
    await payload('atlas', previousInteractive, 'edition/architecture.html'),
  ],
  entries: entries('Previous'),
  dependencies: [],
};
const priorPlan = invokeCli([
  'publish',
  'plan',
  await write('prior-publication.json', priorInput),
]).plan;
const priorPlanFile = await write('prior-plan.json', priorPlan),
  priorAuthorization = {
    decision: 'AUTHORIZED',
    planSha256: priorPlan.sha256,
  },
  priorAuthorizationFile = await write(
    'prior-authorization.json',
    priorAuthorization,
  );
assert.equal(
  invokeCli(['publish', 'apply', priorPlanFile, priorAuthorizationFile]).status,
  'INSTALLED',
);
for (const directory of Object.values(destinations))
  await fs.writeFile(
    path.join(directory, 'personal.txt'),
    'Preserve the later user edit.\n',
  );

const atlasManifest = JSON.parse(
  await fs.readFile(path.join(artifactRoot, 'atlas/manifest.json')),
);
const currentPayload = [
  await payload(
    'native',
    path.join(artifactRoot, 'outlined/outlined.svg'),
    'terminal/terminal.svg',
  ),
  ...(await Promise.all(
    rasters.map(({ width, output }) =>
      payload('native', output, `terminal/terminal-${width}.png`),
    ),
  )),
  await payload(
    'atlas',
    path.join(artifactRoot, 'architecture.html'),
    'atlas/standalone.html',
  ),
  await payload(
    'atlas',
    path.join(artifactRoot, 'atlas/manifest.json'),
    'atlas/manifest.json',
  ),
  ...(await Promise.all(
    atlasManifest.files.map((member) =>
      payload(
        'atlas',
        path.join(artifactRoot, 'atlas', member.path),
        'atlas/' + member.path,
      ),
    ),
  )),
];
const currentInput = {
  options: {
    sourceRoots: [artifactRoot],
    destinations,
    recoveryRoot: path.join(effectRoot, 'recovery-interrupted'),
  },
  source: { id: 'ethos:edition', revision: source.projectionDigest },
  payload: currentPayload,
  entries: entries('Current'),
  dependencies: [],
  replacement: { plan: priorPlan, authorization: priorAuthorization },
};

let planned = invokeCli([
  'publish',
  'plan',
  await write('replacement-input.json', currentInput),
]).plan;
let planFile = await write('interrupted-plan.json', planned),
  authorizationFile = await write('interrupted-authorization.json', {
    decision: 'AUTHORIZED',
    planSha256: planned.sha256,
  });
const interruptionProgram = `import fs from 'node:fs/promises';
import { installPairFiles } from 'architecture-publisher/publication';
const plan=JSON.parse(await fs.readFile(process.argv[1]));
const authorization=JSON.parse(await fs.readFile(process.argv[2]));
await installPairFiles(plan,authorization,{rename:async(from,to)=>{
  await fs.rename(from,to);
  if(to===plan.options.destinations.native)process.kill(process.pid,'SIGKILL');
}});`;
const interrupted = spawnSync(
  process.execPath,
  [
    '--input-type=module',
    '-e',
    interruptionProgram,
    planFile,
    authorizationFile,
  ],
  {
    cwd: consumer,
    env: environment,
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024,
    killSignal: 'SIGKILL',
  },
);
assert.equal(interrupted.signal, 'SIGKILL', interrupted.stderr);
assert.equal(
  invokeCli(['publish', 'recover', planFile, authorizationFile]).status,
  'ROLLED_BACK',
);

currentInput.options.recoveryRoot = path.join(effectRoot, 'recovery-final');
planned = invokeCli([
  'publish',
  'plan',
  await write('final-replacement-input.json', currentInput),
]).plan;
planFile = await write('final-plan.json', planned);
authorizationFile = await write('final-authorization.json', {
  decision: 'AUTHORIZED',
  planSha256: planned.sha256,
});
assert.equal(
  invokeCli(['publish', 'apply', planFile, authorizationFile]).status,
  'INSTALLED',
);
assert.equal(
  invokeCli(['publish', 'recover', planFile, authorizationFile]).status,
  'ALREADY_INSTALLED',
);
assert.equal(
  invokeCli(['publish', 'apply', planFile, authorizationFile]).status,
  'ALREADY_INSTALLED',
);
for (const directory of Object.values(destinations))
  assert.equal(
    await fs.readFile(path.join(directory, 'personal.txt'), 'utf8'),
    'Preserve the later user edit.\n',
  );
for (const member of planned.payload)
  assert.equal(
    hash(await fs.readFile(path.join(destinations[member.medium], member.path))),
    member.sha256,
  );

const report = {
  status: 'PASS',
  node: process.version,
  platform: process.platform,
  pages: prepared.pages,
  semanticChange: prepared.evolution.ethos.changed,
  affectedInteractiveScenes:
    prepared.evolution.editions.affected[0].interactive,
  staticAffected: prepared.evolution.editions.affected[0].static,
  svgSha256: poster.svg.sha256,
  outlinedSvgSha256: outlined.outlined.sha256,
  atlasManifestSha256: rendered.manifestSha256,
  standaloneSha256: standalone.sha256,
  rasters: rasters.map(({ width, bytes, sha256 }) => ({ width, bytes, sha256 })),
  extensionRemovedBeforeCorePublication: true,
  installation: 'INSTALLED',
  recovery: 'ALREADY_INSTALLED',
  interruptedRecovery: 'ROLLED_BACK',
  replay: 'ALREADY_INSTALLED',
  foreignEditsPreserved: true,
  installedPayload: planned.payload.length,
  scope:
    'Installed ETHOS authoring and rendering followed by extension-free core rasterization, replacement, interrupted recovery, and exact replay; not browser, semantic, visual, hosted, or release acceptance.',
};
await fs.writeFile(
  path.join(inputRoot, 'report.json'),
  JSON.stringify(report, null, 2) + '\n',
  { flag: 'wx' },
);
process.stdout.write(JSON.stringify(report) + '\n');
