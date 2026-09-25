import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { noSymlinkAncestors, regularBytes } from '../source/files.mjs';
import { fail, hasExactFields as exact } from '../source/manifest.mjs';
import { EDITION_PROVIDER_LIMITS } from './limits.mjs';
import { normalizeSelectedContributions, readSelectedProviderManifest } from './manifest.mjs';
import { editionProviderPackageDigest, selectProviderPackage } from './package.mjs';
import { runProviderWorker } from './supervisor.mjs';

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const replyFields = ['derived', 'schema'];
const outputFields = ['contentBase64', 'id'];

function selectedDerived(reply, expected) {
  if (
    !exact(reply, replyFields) ||
    reply.schema !== 'architecture.edition-provider-reply/v2' ||
    !Array.isArray(reply.derived) ||
    reply.derived.length !== expected.length
  )
    fail('edition_provider_v2_reply_invalid');
  const expectedById = new Map(expected.map((item) => [item.id, item]));
  const contents = new Map();
  for (const item of reply.derived) {
    if (
      !exact(item, outputFields) ||
      !expectedById.has(item.id) ||
      contents.has(item.id) ||
      typeof item.contentBase64 !== 'string' ||
      /[^A-Za-z0-9+/=]/u.test(item.contentBase64)
    )
      fail('edition_provider_v2_reply_invalid');
    const content = Buffer.from(item.contentBase64, 'base64');
    if (content.toString('base64') !== item.contentBase64)
      fail('edition_provider_v2_reply_invalid');
    const selected = expectedById.get(item.id);
    if (content.length !== selected.bytes) fail('edition_provider_v2_output_size_mismatch');
    if (sha(content) !== selected.sha256) fail('edition_provider_v2_output_digest_mismatch');
    contents.set(item.id, content);
  }
  return contents;
}

/** Execute one exact installed v2 Provider and retain only checked selected bytes. */
export async function readExecutableSelectedInputs(file, expectedSha256, packageRoot) {
  return materializeSelectedExecutableInputs(
    await readSelectedProviderManifest(file, expectedSha256),
    expectedSha256,
    packageRoot,
  );
}

/** Reuse one verified manifest while preserving package and reply checks. */
export async function materializeSelectedExecutableInputs(
  { manifest, root },
  expectedSha256,
  packageRoot,
) {
  if (manifest.delivery.kind !== 'executable') fail('edition_provider_v2_delivery_unsupported');
  const packageSelection = await selectProviderPackage(packageRoot, manifest.delivery.package);
  const inputContents = new Map();
  const requestInputs = [];
  for (const item of manifest.delivery.inputs) {
    const selectedFile = path.resolve(root, ...item.path.split('/'));
    await noSymlinkAncestors(selectedFile);
    const content = await regularBytes(selectedFile, EDITION_PROVIDER_LIMITS.inputBytes);
    if (content.length !== item.bytes) fail('edition_provider_v2_input_size_mismatch');
    if (sha(content) !== item.sha256) fail('edition_provider_v2_input_digest_mismatch');
    inputContents.set(item.id, content);
    requestInputs.push({
      id: item.id,
      mediaType: item.mediaType,
      bytes: item.bytes,
      sha256: item.sha256,
      contentBase64: content.toString('base64'),
    });
  }
  const request = {
    schema: 'architecture.edition-provider-request/v2',
    provider: manifest.provider,
    inputs: requestInputs,
  };
  const selectedContents = new Map();
  for (const binding of manifest.delivery.nativeInputs)
    selectedContents.set(`native:${binding.item}`, inputContents.get(binding.input));
  if (manifest.selected.edition !== null)
    selectedContents.set(
      `edition:${manifest.selected.edition.id}`,
      inputContents.get(manifest.delivery.editionInput),
    );
  for (const binding of manifest.delivery.editionResourceInputs)
    selectedContents.set(`edition-resource:${binding.ref}`, inputContents.get(binding.input));

  const temporaryRoot = await fs.realpath(os.tmpdir());
  const scratch = await fs.mkdtemp(
    path.join(temporaryRoot, `architecture-provider-${process.pid}-`),
  );
  const started = performance.now();
  try {
    for (const directory of ['config', 'cache', 'data', 'tmp'])
      await fs.mkdir(path.join(scratch, directory));
    const requestPath = path.join(scratch, 'request.json');
    await fs.writeFile(requestPath, JSON.stringify(request), { flag: 'wx', mode: 0o600 });
    const result = await runProviderWorker({
      entrypoint: packageSelection.entrypoint,
      requestPath,
      scratch,
      limits: {
        timeoutMs: EDITION_PROVIDER_LIMITS.timeoutMs,
        replyBytes: EDITION_PROVIDER_LIMITS.replyBytes,
      },
      validateReply: (reply) => selectedDerived(reply, manifest.selected.derived),
    });
    if (
      (await editionProviderPackageDigest(packageSelection.packageIdentity.root)) !==
      manifest.delivery.package.contentSha256
    )
      fail('edition_provider_package_content_mismatch');
    for (const [id, content] of result.reply) selectedContents.set(`derived:${id}`, content);
    const selectedJson = JSON.stringify(normalizeSelectedContributions(manifest));
    const invocationJson = JSON.stringify({
      provider: manifest.provider,
      delivery: 'executable',
      manifestSha256: expectedSha256,
      packageContentSha256: manifest.delivery.package.contentSha256,
      requestSha256: sha(Buffer.from(JSON.stringify(request))),
      durationMs: Math.max(0, Math.round(performance.now() - started)),
    });
    return Object.freeze({
      closure: 'selected-provider-inputs-and-outputs-only',
      limits: Object.freeze([
        'path-confinement-under-concurrent-mutation-unproved',
        'provider-dependencies-unobserved',
        'provider-execution-not-sandboxed',
        ...manifest.selected.derived.map((item) => `adapter-code-unverified:${item.id}`),
      ]),
      get selected() {
        return JSON.parse(selectedJson);
      },
      get invocation() {
        return JSON.parse(invocationJson);
      },
      read(kind, id) {
        const content = selectedContents.get(`${kind}:${id}`);
        if (!content) fail('edition_provider_v2_item_unselected');
        return Buffer.from(content);
      },
    });
  } finally {
    await fs.rm(scratch, { recursive: true, force: true });
  }
}
