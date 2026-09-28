import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { compileEditionCandidateInput } from '../packages/publisher/src/compiler/index.mjs';
import { planPairFiles } from '../packages/publisher/src/publication/files.mjs';
import { filePublication } from '../packages/publisher/src/publication/input.mjs';
import { verifyQualificationInput } from '../packages/publisher/src/qualification/index.mjs';
import { canonical } from '../packages/publisher/src/semantics/document.mjs';
import { readSourceBundle } from '../packages/publisher/src/source/bundle.mjs';
import { writeSourceBundle } from '../packages/publisher/src/source/write.mjs';
import { installCoreAndSelf } from './fixtures/installed-packages.mjs';
import { selectedNativeEdition, sha } from './fixtures/selected-native-edition.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

async function fixture(t, { media, claimants, title } = {}) {
  const selected = await selectedNativeEdition(t, {
    width: 1800,
    ...(media ? { media } : {}),
    ...(title ? { title } : {}),
  });
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
    new Set([
      'static:architecture.svg',
      'static:architecture.png',
      'interactive:architecture.html',
    ]),
  );
  assert.deepEqual(Object.keys(planned.plan.options.destinations).sort(), [
    'interactive',
    'static',
  ]);

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
  assert.deepEqual(Object.keys(installed.destinations).sort(), ['interactive', 'static']);
  assert.deepEqual(Object.keys(installed.recovery).sort(), ['interactive', 'static']);
  const receipt = JSON.parse(
    await fs.readFile(path.join(f.selected.root, 'delivery/static/delivery-manifest.json')),
  );
  const interactiveReceipt = JSON.parse(
    await fs.readFile(path.join(f.selected.root, 'delivery/interactive/delivery-manifest.json')),
  );
  const journal = JSON.parse(
    await fs.readFile(path.join(path.dirname(installed.recovery.static), 'operation.json')),
  );
  assert.equal(receipt.medium, 'static');
  assert.equal(interactiveReceipt.medium, 'interactive');
  assert.deepEqual(Object.keys(journal.destinations).sort(), ['interactive', 'static']);
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

test('qualified and raw plans cannot exchange media slot names', async (t) => {
  const f = await fixture(t);
  const request = await f.write('publication-request.json', f.request);
  const plan = (await filePublication('plan', request.file)).plan;
  const qualifiedWithRawSlots = structuredClone(plan);
  qualifiedWithRawSlots.options.destinations = {
    native: plan.options.destinations.static,
    atlas: plan.options.destinations.interactive,
  };
  qualifiedWithRawSlots.payload = plan.payload.map((item) => ({
    ...item,
    medium: item.medium === 'static' ? 'native' : 'atlas',
  }));
  qualifiedWithRawSlots.entries = {
    native: plan.entries.static,
    atlas: plan.entries.interactive,
  };
  await assert.rejects(
    planPairFiles(qualifiedWithRawSlots),
    /Publication media do not match source/,
  );

  const rawWithQualifiedSlots = { ...plan, source: { schema: 'fixture.raw-source/v1' } };
  await assert.rejects(
    planPairFiles(rawWithQualifiedSlots),
    /Publication media do not match source/,
  );
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

test('qualified publication rejects malformed selectors and roles before local effects', async (t) => {
  const f = await fixture(t);
  const cases = [
    [
      'absolute-candidate',
      (request) =>
        (request.candidate.manifest = path.join(f.selected.root, 'candidate/manifest.json')),
      'qualified_path_invalid',
    ],
    [
      'escaping-candidate',
      (request) => (request.candidate.manifest = '../candidate/manifest.json'),
      'qualified_path_invalid',
    ],
    [
      'malformed-set-reference',
      (request) => (request.qualifications.set.extra = true),
      'qualified_reference_invalid',
    ],
    [
      'changed-set-reference',
      (request) => (request.qualifications.set.sha256 = '0'.repeat(64)),
      'qualified_reference_changed',
    ],
    [
      'directory-as-set',
      (request) => {
        request.qualifications.set.file = 'delivery';
        request.qualifications.set.sha256 = '0'.repeat(64);
      },
      'qualified_reference_invalid',
    ],
    [
      'blank-release-owner',
      (request) => (request.roles.releaseOwner = ' '),
      'qualified_input_invalid',
    ],
    ['blank-custodian', (request) => (request.roles.custodian = ''), 'qualified_input_invalid'],
    [
      'empty-target',
      (request) => (request.options.destinations.static = ''),
      'qualified_path_invalid',
    ],
    [
      'missing-medium-entry',
      (request) => delete request.entries.interactive,
      'qualified_input_invalid',
    ],
  ];
  for (const [name, mutate, code] of cases) {
    const request = structuredClone(f.request);
    mutate(request);
    const selected = await f.write(`invalid-${name}.json`, request);
    await assert.rejects(filePublication('plan', selected.file), { code }, name);
    assert.deepEqual(await fs.readdir(path.join(f.selected.root, 'delivery')), [], name);
  }
});

test('qualified publication rejects altered Candidate containers before local effects', async (t) => {
  const f = await fixture(t);
  const forge = async (name, mutate, code) => {
    const source = structuredClone(f.bundle.source);
    const members = f.bundle.members.map(({ path: member, content }) => ({
      path: member,
      content: Buffer.from(content),
    }));
    await mutate(source, members);
    const output = `forged-${name}`;
    const written = await writeSourceBundle(path.join(f.selected.root, output), source, members);
    const request = structuredClone(f.request);
    request.candidate = { manifest: `${output}/manifest.json`, sha256: written.manifestSha256 };
    const selected = await f.write(`${name}-request.json`, request);
    await assert.rejects(filePublication('plan', selected.file), { code }, name);
    assert.deepEqual(await fs.readdir(path.join(f.selected.root, 'delivery')), [], name);
  };
  const rewriteLock = (source, members, update, format = canonical) => {
    const lockMember = members.find(({ path: member }) => member === 'input-lock.json');
    const lock = JSON.parse(lockMember.content);
    update(lock);
    lockMember.content = Buffer.from(format(lock));
    const candidateMember = members.find(({ path: member }) => member === 'candidate.json');
    const candidate = JSON.parse(candidateMember.content);
    candidate.input.lockSha256 = sha(lockMember.content);
    candidateMember.content = Buffer.from(JSON.stringify(candidate, null, 2) + '\n');
    source.revision = candidate.input.lockSha256;
  };
  await forge(
    'invalid-lock',
    (source, members) => rewriteLock(source, members, (lock) => (lock.edition.editor = '')),
    'qualified_input_lock_invalid',
  );
  await forge(
    'noncanonical-lock',
    (source, members) =>
      rewriteLock(
        source,
        members,
        () => {},
        (lock) => JSON.stringify(lock, null, 2) + '\n',
      ),
    'qualified_input_lock_invalid',
  );
  await forge(
    'missing-lock',
    (_source, members) => {
      members.splice(
        members.findIndex(({ path: member }) => member === 'input-lock.json'),
        1,
      );
    },
    'qualified_candidate_incomplete',
  );
  await forge(
    'changed-artifact',
    (_source, members) => {
      const member = members.find(({ path: selected }) => selected === 'static/architecture.svg');
      member.content = Buffer.concat([member.content, Buffer.from('\n')]);
    },
    'qualified_candidate_artifact_mismatch',
  );
  await forge(
    'extra-member',
    (_source, members) => members.push({ path: 'surplus.txt', content: Buffer.from('surplus') }),
    'qualified_candidate_members_invalid',
  );

  const malformedSet = JSON.parse(
    await fs.readFile(path.join(f.selected.root, 'qualification-set.json'), 'utf8'),
  );
  malformedSet.schema = 'unselected-schema';
  const set = await f.write('malformed-set.json', malformedSet);
  const request = structuredClone(f.request);
  request.qualifications.set = { file: 'malformed-set.json', sha256: set.sha256 };
  const selected = await f.write('malformed-set-request.json', request);
  await assert.rejects(filePublication('plan', selected.file), {
    code: 'qualified_evidence_invalid',
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
  assert.equal(planned.plan.options.destinations.static, request.options.destinations.static);
  assert.equal(
    planned.plan.options.destinations.interactive,
    request.options.destinations.interactive,
  );
  assert.equal(planned.plan.options.recoveryRoot, request.options.recoveryRoot);
  request.options.destinations.static = path.join(f.selected.root, 'candidate');
  const overlapping = await f.write('overlapping-target.json', request);
  await assert.rejects(filePublication('plan', overlapping.file), /Source\/destination overlap/);
});

test('qualified replacement changes only the prior managed Candidate and preserves foreign files', async (t) => {
  const first = await fixture(t);
  const firstRequest = await first.write('publication-request.json', first.request);
  const firstPlan = (await filePublication('plan', firstRequest.file)).plan;
  const firstPlanFile = await first.write('publication-plan.json', firstPlan);
  const firstAuthorization = authorizationFor(first, firstPlan);
  const firstAuthorizationFile = await first.write(
    'publication-authorization.json',
    firstAuthorization,
  );
  assert.equal(
    (await filePublication('apply', firstPlanFile.file, firstAuthorizationFile.file)).status,
    'INSTALLED',
  );
  for (const medium of ['static', 'interactive'])
    await fs.writeFile(path.join(first.selected.root, `delivery/${medium}/keep.txt`), 'keep\n');

  const second = await fixture(t, { title: 'Revised system architecture' });
  assert.notEqual(second.built.candidateSha256, first.built.candidateSha256);
  const nextRequest = structuredClone(second.request);
  nextRequest.options.destinations.static = path.join(first.selected.root, 'delivery/static');
  nextRequest.options.destinations.interactive = path.join(
    first.selected.root,
    'delivery/interactive',
  );
  nextRequest.options.recoveryRoot = path.join(first.selected.root, 'recovery');
  nextRequest.replacement = { plan: firstPlan, authorization: firstAuthorization };
  const nextRequestFile = await second.write('publication-request.json', nextRequest);
  const managedSvg = path.join(first.selected.root, 'delivery/static/architecture.svg');
  const priorSvg = await fs.readFile(managedSvg);
  await fs.writeFile(managedSvg, 'user edit\n');
  await assert.rejects(filePublication('plan', nextRequestFile.file));
  assert.equal(await fs.readFile(managedSvg, 'utf8'), 'user edit\n');
  await fs.writeFile(managedSvg, priorSvg);
  const nextPlan = (await filePublication('plan', nextRequestFile.file)).plan;
  assert.equal(nextPlan.replacement.plan.sha256, firstPlan.sha256);
  const nextPlanFile = await second.write('publication-plan.json', nextPlan);
  const nextAuthorizationFile = await second.write(
    'publication-authorization.json',
    authorizationFor(second, nextPlan),
  );
  assert.equal(
    (await filePublication('apply', nextPlanFile.file, nextAuthorizationFile.file)).status,
    'INSTALLED',
  );
  assert.equal(
    (await filePublication('recover', nextPlanFile.file, nextAuthorizationFile.file)).status,
    'ALREADY_INSTALLED',
  );
  const nextSvg = second.bundle.members.find(
    ({ path: name }) => name === 'static/architecture.svg',
  );
  assert.deepEqual(
    await fs.readFile(path.join(first.selected.root, 'delivery/static/architecture.svg')),
    nextSvg.content,
  );
  for (const medium of ['static', 'interactive'])
    assert.equal(
      await fs.readFile(path.join(first.selected.root, `delivery/${medium}/keep.txt`), 'utf8'),
      'keep\n',
    );
});
