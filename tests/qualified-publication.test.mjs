import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import { filePublication } from '../packages/publisher/src/publication/input.mjs';
import { verifyQualificationInput } from '../packages/publisher/src/qualification/index.mjs';
import { canonical } from '../packages/publisher/src/semantics/document.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { installCoreAndSelf } from './fixtures/installed-packages.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

async function fixture(t, { media, claimants } = {}) {
  const selected = await selectedNativeEdition(t, { width: 1800, ...(media ? { media } : {}) });
  if (claimants) {
    assert.equal(claimants.length, selected.request.sources.length);
    selected.request.sources.forEach((source, index) => {
      source.claimant = claimants[index];
    });
    const bytes = Buffer.from(JSON.stringify(selected.request) + '\n');
    await fs.writeFile(selected.file, bytes);
    selected.digest = sha(bytes);
  }
  const built = await compileEditionCandidateInput(
    selected.file,
    selected.digest,
    path.join(selected.root, 'candidate'),
  );
  const bundle = await readSourceBundle(built.manifestPath, built.manifestSha256);
  const members = new Map(bundle.members.map(({ path: name, content }) => [name, content]));
  const candidate = JSON.parse(members.get('candidate.json'));
  const requirements = Object.keys(candidate.media).flatMap((medium) =>
    candidate.obligations[medium].views.flatMap((view) =>
      view.questionIds.map((question) => ({
        predicate: 'visible-question',
        scope: { kind: 'question', medium, view: view.id, question },
        verifier: {
          kind: 'machine',
          id: 'fixture-checker',
          implementationSha256: sha(Buffer.from('fixture-checker')),
        },
        method: 'carrier-inspection/v1',
        allowedLimitations: [],
      })),
    ),
  );
  const policy = {
    schema: 'architecture.qualification-policy/v1',
    id: 'fixture-policy',
    accepter: selected.project.editor,
    candidateSha256: built.candidateSha256,
    acceptedCandidateLimits: candidate.limits,
    requirements,
  };
  const records = requirements.map((requirement, index) => ({
    id: `question-${index}`,
    predicate: requirement.predicate,
    subject: {
      kind: 'medium',
      sha256: sha(Buffer.from(canonical(candidate.media[requirement.scope.medium]))),
    },
    scope: requirement.scope,
    verifier: requirement.verifier,
    method: requirement.method,
    observations: [{ name: 'visible', value: true }],
    verdict: 'PASS',
    limitations: [],
  }));
  const set = {
    schema: 'architecture.qualification-set/v2',
    candidateSha256: built.candidateSha256,
    inputLockSha256: built.lockSha256,
    records,
  };
  const write = async (name, value) => {
    const bytes = Buffer.from(JSON.stringify(value) + '\n');
    const file = path.join(selected.root, name);
    await fs.writeFile(file, bytes);
    return { file, sha256: sha(bytes) };
  };
  const selectedSet = await write('qualification-set.json', set);
  const selectedPolicy = await write('qualification-policy.json', policy);
  const qualificationInput = await write('qualification-input.json', {
    schema: 'architecture.qualification-input/v2',
    request: { path: 'build-request.json', sha256: selected.digest },
    candidate: { path: 'candidate/manifest.json', sha256: built.manifestSha256 },
    qualification: { path: 'qualification-set.json', sha256: selectedSet.sha256 },
  });
  const report = await verifyQualificationInput(
    qualificationInput.file,
    qualificationInput.sha256,
    [],
    { file: selectedPolicy.file, sha256: selectedPolicy.sha256 },
  );
  assert.equal(report.submittedVerdict, 'PASS');
  assert.equal(report.admitted, false);
  const selectedReport = await write('qualification-report.json', report);
  await fs.mkdir(path.join(selected.root, 'delivery'));
  const request = {
    schema: 'architecture.qualified-file-publication/v1',
    candidate: { manifest: 'candidate/manifest.json', sha256: built.manifestSha256 },
    qualifications: {
      set: { file: 'qualification-set.json', sha256: selectedSet.sha256 },
      policy: { file: 'qualification-policy.json', sha256: selectedPolicy.sha256 },
      report: { file: 'qualification-report.json', sha256: selectedReport.sha256 },
    },
    roles: {
      releaseOwner: null,
      custodian: 'fixture-custodian',
      effectAuthorizer: 'fixture-operator',
    },
    options: {
      destinations: { static: 'delivery/static', interactive: 'delivery/interactive' },
      recoveryRoot: 'recovery',
    },
    entries: {
      static: { 'index.html': '<p>Static Edition</p>', 'README.md': 'Static Edition\n' },
      interactive: {
        'index.html': '<p>Interactive Edition</p>',
        'README.md': 'Interactive Edition\n',
      },
    },
  };
  return { selected, built, candidate, bundle, policy, report, request, write };
}

function authorizationFor(f, plan) {
  return {
    schema: 'architecture.qualified-file-authorization/v1',
    planSha256: plan.sha256,
    acceptance: {
      decision: 'ACCEPTED',
      accepter: f.policy.accepter,
      candidateSha256: f.built.candidateSha256,
      qualificationSetDigest: f.report.qualificationSetDigest,
      policySha256: f.report.policySha256,
    },
    effect: { decision: 'AUTHORIZED', authorizer: f.request.roles.effectAuthorizer },
  };
}

test('one qualified plan requires external acceptance and separate local authorization before recoverable effects', async (t) => {
  const f = await fixture(t);
  const request = await f.write('publication-request.json', f.request);
  const planned = await filePublication('plan', request.file);
  assert.equal(planned.status, 'PLANNED');
  assert.equal(planned.scope, 'qualified-edition-local-file-effect');
  assert.equal(planned.semanticAcceptance, 'pending-external-decision');
  assert.equal(planned.plan.source.candidateSha256, f.built.candidateSha256);
  assert.equal(planned.plan.source.inputLockSha256, f.built.lockSha256);
  assert.equal(planned.plan.source.roles.editor, f.selected.project.editor);
  assert.equal(planned.plan.source.roles.custodian, f.request.roles.custodian);
  assert.deepEqual(
    new Set(planned.plan.payload.map(({ medium, path: name }) => `${medium}:${name}`)),
    new Set(['native:architecture.svg', 'native:architecture.png', 'atlas:architecture.html']),
  );

  const plan = await f.write('publication-plan.json', planned.plan);
  const authorization = authorizationFor(f, planned.plan);
  const unaccepted = structuredClone(authorization);
  unaccepted.acceptance.decision = 'PENDING';
  const denied = await f.write('denied.json', unaccepted);
  await assert.rejects(filePublication('apply', plan.file, denied.file));
  await assert.rejects(fs.access(path.join(f.selected.root, 'delivery/static')), {
    code: 'ENOENT',
  });

  const approved = await f.write('approved.json', authorization);
  const installed = await filePublication('apply', plan.file, approved.file);
  assert.equal(installed.status, 'INSTALLED');
  assert.equal(installed.semanticAcceptance, 'externally-declared');
  const receipt = JSON.parse(
    await fs.readFile(path.join(f.selected.root, 'delivery/static/delivery-manifest.json')),
  );
  assert.equal(receipt.source.roles.accepter, f.policy.accepter);
  assert.equal(receipt.authorization.effect.authorizer, f.request.roles.effectAuthorizer);

  await fs.rm(path.join(f.selected.root, 'candidate'), { recursive: true });
  await fs.rm(path.join(f.selected.root, 'qualification-set.json'));
  await fs.rm(path.join(f.selected.root, 'qualification-policy.json'));
  await fs.rm(path.join(f.selected.root, 'qualification-report.json'));
  const recovered = await filePublication('recover', plan.file, approved.file);
  assert.equal(recovered.status, 'ALREADY_INSTALLED');
  await fs.access(path.join(f.selected.root, 'delivery/static/architecture.svg'));
  await fs.access(path.join(f.selected.root, 'delivery/interactive/architecture.html'));
});

test('a forged policy-complete report cannot make an empty Qualification Set publishable', async (t) => {
  const f = await fixture(t);
  const set = JSON.parse(
    await fs.readFile(path.join(f.selected.root, 'qualification-set.json'), 'utf8'),
  );
  set.records = [];
  const selectedSet = await f.write('empty-set.json', set);
  const forged = {
    ...f.report,
    records: 0,
    qualificationSetDigest: sha(Buffer.from(canonical(set))),
  };
  const selectedReport = await f.write('forged-report.json', forged);
  const request = structuredClone(f.request);
  request.qualifications.set = { file: 'empty-set.json', sha256: selectedSet.sha256 };
  request.qualifications.report = { file: 'forged-report.json', sha256: selectedReport.sha256 };
  const selectedRequest = await f.write('forged-request.json', request);
  await assert.rejects(filePublication('plan', selectedRequest.file), {
    code: 'qualified_report_invalid',
  });
  assert.deepEqual(await fs.readdir(path.join(f.selected.root, 'delivery')), []);
});

test('qualified authorization, evidence, and target prestate remain exact before effects', async (t) => {
  const f = await fixture(t);
  const request = await f.write('publication-request.json', f.request);
  const planned = await filePublication('plan', request.file);
  const plan = await f.write('publication-plan.json', planned.plan);
  const authorization = authorizationFor(f, planned.plan);
  for (const [name, mutate] of [
    ['another-plan', (value) => (value.planSha256 = '0'.repeat(64))],
    ['another-candidate', (value) => (value.acceptance.candidateSha256 = '0'.repeat(64))],
    ['another-policy', (value) => (value.acceptance.policySha256 = '0'.repeat(64))],
    ['another-actor', (value) => (value.effect.authorizer = 'someone-else')],
  ]) {
    const changed = structuredClone(authorization);
    mutate(changed);
    const file = await f.write(`${name}.json`, changed);
    await assert.rejects(filePublication('apply', plan.file, file.file));
    assert.deepEqual(await fs.readdir(path.join(f.selected.root, 'delivery')), []);
  }
  const approved = await f.write('approved.json', authorization);
  const policyPath = path.join(f.selected.root, 'qualification-policy.json');
  const policyBytes = await fs.readFile(policyPath);
  await fs.appendFile(policyPath, '\n');
  await assert.rejects(filePublication('apply', plan.file, approved.file));
  await assert.rejects(fs.access(path.join(f.selected.root, 'delivery/static')), {
    code: 'ENOENT',
  });
  await assert.rejects(fs.access(path.join(f.selected.root, 'delivery/interactive')), {
    code: 'ENOENT',
  });
  await fs.writeFile(policyPath, policyBytes);
  await fs.mkdir(path.join(f.selected.root, 'delivery/static'));
  await fs.writeFile(path.join(f.selected.root, 'delivery/static/user.txt'), 'keep\n');
  await assert.rejects(filePublication('apply', plan.file, approved.file));
  assert.equal(
    await fs.readFile(path.join(f.selected.root, 'delivery/static/user.txt'), 'utf8'),
    'keep\n',
  );
  await assert.rejects(fs.access(path.join(f.selected.root, 'delivery/interactive')), {
    code: 'ENOENT',
  });
});

test('a single-medium Candidate remains available for preview but cannot invent a publication pair', async (t) => {
  const f = await fixture(t, { media: ['static'] });
  const request = await f.write('publication-request.json', f.request);
  await assert.rejects(filePublication('plan', request.file), {
    code: 'qualified_candidate_incomplete',
  });
  await fs.access(path.join(f.selected.root, 'candidate/static/architecture.svg'));
  assert.deepEqual(await fs.readdir(path.join(f.selected.root, 'delivery')), []);
});

test('multi-source claimants remain distinct from one editor and an unselected release owner', async (t) => {
  const f = await fixture(t, { claimants: ['ETHOS', 'AIGW'] });
  const request = await f.write('publication-request.json', f.request);
  const planned = await filePublication('plan', request.file);
  assert.deepEqual(
    new Set(planned.plan.source.roles.claimants.map(({ claimant }) => claimant)),
    new Set(['ETHOS', 'AIGW']),
  );
  assert.equal(planned.plan.source.roles.editor, f.selected.project.editor);
  assert.equal(planned.plan.source.roles.releaseOwner, null);
  assert.equal(Object.hasOwn(planned.plan.source, 'endorsement'), false);
});

test('relocated offline package uses the same public qualified plan, apply, and recover commands', async (t) => {
  const f = await fixture(t);
  const packageDirectory = path.join(f.selected.root, 'installed');
  await fs.mkdir(packageDirectory);
  const { consumer, coreRoot } = await installCoreAndSelf(root, packageDirectory);
  const home = path.join(f.selected.root, 'home');
  await fs.mkdir(home);
  const invoke = (args) => {
    const result = spawnSync(
      process.execPath,
      [path.join(coreRoot, 'src/cli/main.mjs'), 'publish', ...args],
      {
        cwd: consumer,
        env: { HOME: home, PATH: home, LANG: 'C.UTF-8' },
        encoding: 'utf8',
        timeout: 30_000,
      },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  const request = await f.write('publication-request.json', f.request);
  const planned = invoke(['plan', request.file]);
  const plan = await f.write('publication-plan.json', planned.plan);
  const authorization = await f.write('authorization.json', authorizationFor(f, planned.plan));
  assert.equal(invoke(['apply', plan.file, authorization.file]).status, 'INSTALLED');
  await fs.rm(path.join(f.selected.root, 'candidate'), { recursive: true });
  await fs.rm(path.join(f.selected.root, 'qualification-set.json'));
  await fs.rm(path.join(f.selected.root, 'qualification-policy.json'));
  await fs.rm(path.join(f.selected.root, 'qualification-report.json'));
  assert.equal(invoke(['recover', plan.file, authorization.file]).status, 'ALREADY_INSTALLED');
  await fs.access(path.join(f.selected.root, 'delivery/static/architecture.png'));
  await fs.access(path.join(f.selected.root, 'delivery/interactive/architecture.html'));
});

test('a local custodian can select explicit absolute delivery and recovery targets', async (t) => {
  const f = await fixture(t);
  const request = structuredClone(f.request);
  request.options.destinations.static = path.join(f.selected.root, 'delivery/static');
  request.options.destinations.interactive = path.join(f.selected.root, 'delivery/interactive');
  request.options.recoveryRoot = path.join(f.selected.root, 'recovery');
  const selected = await f.write('absolute-targets.json', request);
  const planned = await filePublication('plan', selected.file);
  assert.equal(planned.plan.options.destinations.native, request.options.destinations.static);
  assert.equal(planned.plan.options.destinations.atlas, request.options.destinations.interactive);
  assert.equal(planned.plan.options.recoveryRoot, request.options.recoveryRoot);
  request.options.destinations.static = path.join(f.selected.root, 'candidate');
  const overlapping = await f.write('overlapping-target.json', request);
  await assert.rejects(filePublication('plan', overlapping.file), /Source\/destination overlap/);
});
