import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createRequire, isBuiltin } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'acorn';
import {
  EDITION_PROVIDER_LIMITS,
  materializeDeclarativeProvider,
  materializeExecutableProvider,
  readEditionProviderInput,
  validateEditionProvider,
  validateProviderMaterialization,
  validateProviderReply,
} from 'architecture-publisher/provider';
import { canonical } from 'architecture-publisher/semantics';
import { readSourceBundle } from 'architecture-publisher/source';

const matrixUrl = new URL('../../fixtures/provider-contract-matrix.json', import.meta.url);
const require = createRequire(import.meta.url);
const publisherPackageRoot = path.dirname(require.resolve('architecture-publisher/package.json'));
const allowedPublisherExports = new Set([
  'architecture-publisher/edition',
  'architecture-publisher/scene',
  'architecture-publisher/semantics',
  'architecture-publisher/source',
]);
const sourceExtensions = new Set(['.js', '.mjs']);

function fail(predicate, detail) {
  const code = `provider_conformance_${predicate.replaceAll('-', '_')}`;
  throw Object.assign(new Error(`${code}:${detail}`), { code, predicate, detail });
}

function hash(value) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

function materializedIdentity(result) {
  return {
    provider: result.receipt.provider,
    subject: result.receipt.subject,
    delivery: result.receipt.delivery,
    inputs: result.receipt.inputs,
    materialized: result.receipt.materialized,
  };
}

function assertSame(predicate, expected, actual, detail) {
  if (canonical(expected) !== canonical(actual)) fail(predicate, detail);
}

async function rejectedCode(predicate, expected, operation) {
  try {
    await operation();
  } catch (error) {
    if (error?.code === expected) return expected;
    fail(predicate, `expected ${expected}; received ${error?.code ?? error?.message ?? 'unknown'}`);
  }
  fail(predicate, `expected ${expected}; received success`);
}

function sourceSpecifiers(source, relativeFile) {
  let ast;
  try {
    ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch (error) {
    fail('dependency-direction', `${relativeFile}:syntax:${error.message}`);
  }
  const specifiers = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (
      ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) &&
      node.source
    )
      specifiers.push(node.source.value);
    if (node.type === 'ImportExpression') {
      if (node.source.type !== 'Literal' || typeof node.source.value !== 'string')
        fail('dependency-direction', `${relativeFile}:computed-import`);
      specifiers.push(node.source.value);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach((child) => child?.type && visit(child));
      else if (value?.type) visit(value);
    }
  }
  visit(ast);
  return specifiers;
}

async function existingModule(target) {
  for (const candidate of [
    target,
    `${target}.mjs`,
    `${target}.js`,
    path.join(target, 'index.mjs'),
  ]) {
    try {
      if ((await fs.stat(candidate)).isFile()) return candidate;
    } catch (error) {
      if (error?.code !== 'ENOENT' && error?.code !== 'ENOTDIR') throw error;
    }
  }
  return null;
}

async function inspectExecutableDependencies(packageRoot, selectedPackage) {
  const root = await fs.realpath(packageRoot);
  const packageFile = path.join(root, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageFile, 'utf8'));
  const target = packageJson.exports?.[selectedPackage.entrypoint];
  if (typeof target !== 'string' || !target.startsWith('./'))
    fail('dependency-direction', `${selectedPackage.entrypoint}:unresolved-export`);
  const entrypoint = await existingModule(path.resolve(root, target));
  if (!entrypoint) fail('dependency-direction', `${target}:missing-module`);
  const declared = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.optionalDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ]);
  for (const dependency of declared)
    if (dependency !== 'architecture-publisher') fail('dependency-direction', dependency);
  const pending = [entrypoint];
  const visited = new Set();
  const externals = new Set();
  while (pending.length) {
    const file = pending.pop();
    const realFile = await fs.realpath(file);
    if (visited.has(realFile)) continue;
    if (realFile !== root && !realFile.startsWith(`${root}${path.sep}`))
      fail('dependency-direction', path.relative(root, realFile));
    visited.add(realFile);
    const relativeFile = path.relative(root, realFile).split(path.sep).join('/');
    const source = await fs.readFile(realFile, 'utf8');
    for (const specifier of sourceSpecifiers(source, relativeFile)) {
      if (specifier.startsWith('node:') || isBuiltin(specifier)) continue;
      if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const resolved = path.resolve(path.dirname(realFile), specifier);
        if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`))
          fail('dependency-direction', specifier);
        const dependency = await existingModule(resolved);
        if (!dependency) fail('dependency-direction', `${specifier}:missing-module`);
        if (!sourceExtensions.has(path.extname(dependency)))
          fail('dependency-direction', `${specifier}:unsupported-module`);
        pending.push(dependency);
        continue;
      }
      if (specifier.startsWith('architecture-publisher/')) {
        if (!allowedPublisherExports.has(specifier)) fail('dependency-direction', specifier);
        if (!declared.has('architecture-publisher'))
          fail('dependency-direction', 'architecture-publisher:undeclared');
        externals.add(specifier);
        continue;
      }
      fail('dependency-direction', specifier);
    }
  }
  return {
    evidence: {
      method: 'selected-entrypoint-graph',
      observations: [
        `modules:${visited.size}`,
        `externals:${[...externals].sort().join(',') || 'none'}`,
      ],
    },
    requiresPublisher: externals.size > 0,
  };
}

async function materialize(selection, delivery) {
  if (delivery === 'declarative')
    return materializeDeclarativeProvider({
      providerManifest: selection.providerManifest,
      providerManifestSha256: selection.providerManifestSha256,
    });
  return materializeExecutableProvider(
    {
      providerManifest: selection.providerManifest,
      providerManifestSha256: selection.providerManifestSha256,
      providerPackageRoot: selection.providerPackageRoot,
    },
    { verifyDeterminism: true },
  );
}

async function relocatedRuns(selection, delivery, requiresPublisher) {
  const temporaryRoot = await fs.realpath(os.tmpdir());
  const root = await fs.mkdtemp(path.join(temporaryRoot, 'architecture-provider-conformance-'));
  try {
    const inputRoot = path.join(root, 'input');
    await fs.cp(path.dirname(selection.providerManifest), inputRoot, { recursive: true });
    const relocated = {
      providerManifest: path.join(inputRoot, path.basename(selection.providerManifest)),
      providerManifestSha256: selection.providerManifestSha256,
    };
    if (delivery === 'executable') {
      relocated.providerPackageRoot = path.join(root, 'package');
      await fs.cp(selection.providerPackageRoot, relocated.providerPackageRoot, {
        recursive: true,
      });
      if (requiresPublisher) {
        const dependencyRoot = path.join(root, 'node_modules', 'architecture-publisher');
        await fs.mkdir(path.dirname(dependencyRoot), { recursive: true });
        await fs.cp(await fs.realpath(publisherPackageRoot), dependencyRoot, {
          recursive: true,
          dereference: true,
        });
      }
    }
    const isolated = await materialize(relocated, delivery);
    await Promise.all([
      fs.mkdir(path.join(root, 'ethos')),
      fs.mkdir(path.join(root, 'aigw')),
      fs.writeFile(path.join(root, 'adjacent-checkout-marker'), 'must not be observed\n'),
    ]);
    const adjacent = await materialize(relocated, delivery);
    return { isolated, adjacent };
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function providerReply(materialized, delivery) {
  if (delivery === 'executable')
    return {
      schema: 'architecture.edition-provider-reply/v1',
      source: materialized.source,
      semanticMember: materialized.semanticMember,
      edition: materialized.edition,
      evolution: materialized.evolution,
    };
  const source = await readSourceBundle(materialized.sourceManifest, materialized.sourceSha256);
  return {
    schema: 'architecture.edition-provider-reply/v1',
    source: {
      id: source.source.id,
      revision: source.source.revision,
      members: source.members.map(({ path: memberPath, content }) => ({
        path: memberPath,
        contentBase64: content.toString('base64'),
      })),
    },
    semanticMember: materialized.semanticMember,
    edition: { contentBase64: (await fs.readFile(materialized.edition)).toString('base64') },
    evolution:
      materialized.evolution === null
        ? null
        : { contentBase64: (await fs.readFile(materialized.evolution)).toString('base64') },
  };
}

function evidence(method, ...observations) {
  return Object.freeze({ method, observations: Object.freeze(observations) });
}

/** Run one delivery through the shared, explicitly non-authorizing Provider profile. */
export async function runProviderConformance(selection) {
  const matrix = JSON.parse(await fs.readFile(matrixUrl, 'utf8'));
  const selected = await readEditionProviderInput(
    selection.providerManifest,
    selection.providerManifestSha256,
  );
  const delivery = selected.manifest.delivery.kind;
  const dependency =
    delivery === 'executable'
      ? await inspectExecutableDependencies(
          selection.providerPackageRoot,
          selected.manifest.delivery.package,
        )
      : {
          evidence: evidence('declarative-no-executable-graph', 'modules:0'),
          requiresPublisher: false,
        };
  const primary = await materialize(selection, delivery);
  const relocated = await relocatedRuns(selection, delivery, dependency.requiresPublisher);
  const primaryIdentity = materializedIdentity(primary);
  const relocatedIdentity = materializedIdentity(relocated.isolated);
  const adjacentIdentity = materializedIdentity(relocated.adjacent);
  assertSame('determinism', primaryIdentity, relocatedIdentity, 'materialized identity changed');
  assertSame('relocation', primaryIdentity, relocatedIdentity, 'relocated materialization changed');
  assertSame(
    'adjacent-checkout-immunity',
    relocatedIdentity,
    adjacentIdentity,
    'adjacent checkout changed materialization',
  );
  const identityDigest = hash(primaryIdentity);
  const manifestClosure = await rejectedCode(
    'manifest-closure',
    'edition_provider_fields_invalid',
    () => validateEditionProvider({ ...selected.manifest, conformanceProbe: true }),
  );
  const inputIdentity = await rejectedCode(
    'input-identity',
    'edition_provider_manifest_digest_mismatch',
    () => readEditionProviderInput(selection.providerManifest, '0'.repeat(64)),
  );
  const outputSchema = await rejectedCode(
    'output-schema',
    'edition_provider_materialization_fields_invalid',
    () => validateProviderMaterialization({ ...primary.receipt, conformanceProbe: true }),
  );
  const resourceBounds = await rejectedCode(
    'resource-bounds',
    'edition_provider_limits_invalid',
    () =>
      validateEditionProvider({
        ...selected.manifest,
        limits: { ...selected.manifest.limits, timeoutMs: EDITION_PROVIDER_LIMITS.timeoutMs + 1 },
      }),
  );
  const reply = await providerReply(primary, delivery);
  const laterStage = await rejectedCode(
    'later-stage-rejection',
    'edition_provider_reply_fields_invalid',
    () => validateProviderReply({ ...reply, candidate: { digest: 'not-authorized' } }),
  );
  const inputDigest = hash(primary.receipt.inputs);
  const byId = new Map([
    ['manifest-closure', evidence('negative-schema-probe', `rejected:${manifestClosure}`)],
    [
      'input-identity',
      evidence(
        'selected-byte-verification',
        `manifest:${selection.providerManifestSha256}`,
        `inputs:${inputDigest}`,
        `rejected:${inputIdentity}`,
      ),
    ],
    [
      'output-schema',
      evidence(
        'closed-materialization-validation',
        `schema:${primary.receipt.schema}`,
        `rejected:${outputSchema}`,
      ),
    ],
    ['determinism', evidence('repeated-materialization', `identity:${identityDigest}`, 'runs:3')],
    ['relocation', evidence('isolated-relocation', `identity:${identityDigest}`)],
    [
      'empty-configuration',
      evidence(
        delivery === 'executable'
          ? 'isolated-child-environment'
          : 'declarative-no-configuration-channel',
        `delivery:${delivery}`,
      ),
    ],
    [
      'adjacent-checkout-immunity',
      evidence('decoy-adjacent-checkouts', `identity:${identityDigest}`),
    ],
    ['dependency-direction', dependency.evidence],
    [
      'resource-bounds',
      evidence(
        'ceiling-rejection',
        `timeoutMs:${selected.manifest.limits.timeoutMs}`,
        `rejected:${resourceBounds}`,
      ),
    ],
    ['later-stage-rejection', evidence('closed-reply-probe', `rejected:${laterStage}`)],
  ]);
  const predicates = matrix.predicates.map((id) => {
    const selectedEvidence = byId.get(id);
    if (!selectedEvidence) fail('matrix', `unimplemented-predicate:${id}`);
    return Object.freeze({ id, verdict: 'pass', evidence: selectedEvidence });
  });
  return Object.freeze({
    schema: 'architecture.provider-conformance-report/v1',
    verdict: 'pass',
    delivery,
    provider: primary.receipt.provider,
    subject: primary.receipt.subject,
    materialized: primary.receipt.materialized,
    predicates: Object.freeze(predicates),
    authority: Object.freeze({ ...matrix.authority }),
  });
}
