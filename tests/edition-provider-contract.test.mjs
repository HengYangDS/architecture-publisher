import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  EDITION_PROVIDER_LIMITS,
  editionProviderDigest,
  validateEditionProvider,
  validateProviderMaterialization,
  validateProviderReply,
  validateProviderRequest,
} from '../packages/publisher/src/provider/index.mjs';

const digest = (value) => createHash('sha256').update(value).digest('hex');
const A = 'a'.repeat(64);
const B = 'b'.repeat(64);
const C = 'c'.repeat(64);
const D = 'd'.repeat(64);

function identity(id) {
  return { id, revision: `${id}:revision` };
}

function manifest(kind = 'declarative') {
  const delivery =
    kind === 'declarative'
      ? {
          kind,
          sourceManifest: 'source/manifest.json',
          sourceManifestSha256: A,
          semanticMember: 'semantic.json',
          edition: 'edition.json',
          editionSha256: B,
          evolution: null,
          evolutionSha256: null,
        }
      : {
          kind,
          package: {
            name: '@example/architecture-provider',
            version: '1.2.3',
            packageJsonSha256: A,
            contentSha256: B,
            entrypoint: './provider',
          },
          inputs: [
            {
              id: 'repository-facts',
              path: 'inputs/repository.json',
              mediaType: 'application/json',
              bytes: 3,
              sha256: digest('{}\n'),
            },
          ],
        };
  return {
    schema: 'architecture.edition-provider/v1',
    provider: identity('example-provider'),
    subject: identity('example-product'),
    contracts: {
      sourceBundle: 'architecture.source-bundle/v1',
      claimModel: 'architecture.claim-model/v2',
      edition: 'architecture.edition/v1',
      evolution: null,
    },
    delivery,
    expected: {
      sourceManifestSha256: A,
      claimModelDigest: C,
      editionDigest: D,
      evolutionSha256: null,
    },
    limits: {
      inputs: 16,
      inputBytes: 1024 * 1024,
      replyBytes: 2 * 1024 * 1024,
      timeoutMs: 10_000,
    },
  };
}

function requestFixture() {
  const content = Buffer.from('{}\n');
  return {
    schema: 'architecture.edition-provider-request/v1',
    provider: identity('example-provider'),
    subject: identity('example-product'),
    inputs: [
      {
        id: 'repository-facts',
        mediaType: 'application/json',
        bytes: content.length,
        sha256: digest(content),
        contentBase64: content.toString('base64'),
      },
    ],
  };
}

function replyFixture() {
  return {
    schema: 'architecture.edition-provider-reply/v1',
    source: {
      id: 'example-product',
      revision: 'example-product:revision',
      members: [
        {
          path: 'semantic.json',
          contentBase64: Buffer.from('{}\n').toString('base64'),
        },
      ],
    },
    semanticMember: 'semantic.json',
    edition: { contentBase64: Buffer.from('{}\n').toString('base64') },
    evolution: null,
  };
}

function receiptFixture() {
  return {
    schema: 'architecture.edition-provider-materialization/v1',
    provider: identity('example-provider'),
    subject: identity('example-product'),
    delivery: 'declarative',
    inputs: [{ id: 'provider-manifest', bytes: 1024, sha256: A }],
    materialized: {
      sourceManifestSha256: A,
      claimModelDigest: C,
      editionDigest: D,
      evolutionSha256: null,
    },
    producer: { name: 'architecture-publisher', version: '0.3.0-alpha.1' },
    execution: { kind: 'declarative', durationMs: 0, deterministic: true },
  };
}

test('provider manifest is an immutable exact tagged union', () => {
  for (const kind of ['declarative', 'executable']) {
    const value = manifest(kind);
    const before = structuredClone(value);
    const selected = validateEditionProvider(value);
    assert.deepEqual(selected, before);
    assert.deepEqual(value, before);
    assert.equal(Object.isFrozen(selected), true);
    assert.equal(selected.delivery.kind, kind);
    assert.match(editionProviderDigest(value), /^[0-9a-f]{64}$/u);
  }

  const extra = manifest();
  extra.executable = {};
  assert.throws(() => validateEditionProvider(extra), {
    code: 'edition_provider_fields_invalid',
  });

  const ambiguous = manifest();
  ambiguous.delivery = { ...ambiguous.delivery, package: {} };
  assert.throws(() => validateEditionProvider(ambiguous), {
    code: 'edition_provider_delivery_fields_invalid',
  });
});

test('provider manifest binds portable inputs and fixed resource ceilings', () => {
  for (const mutate of [
    (value) => (value.delivery.sourceManifest = '../manifest.json'),
    (value) => (value.delivery.edition = '/tmp/edition.json'),
    (value) => (value.expected.editionDigest = 'not-a-digest'),
    (value) => (value.limits.inputs = EDITION_PROVIDER_LIMITS.inputs + 1),
    (value) => (value.limits.inputBytes = EDITION_PROVIDER_LIMITS.inputBytes + 1),
    (value) => (value.limits.replyBytes = EDITION_PROVIDER_LIMITS.replyBytes + 1),
    (value) => (value.limits.timeoutMs = EDITION_PROVIDER_LIMITS.timeoutMs + 1),
  ]) {
    const value = manifest();
    mutate(value);
    assert.throws(() => validateEditionProvider(value), /edition_provider_/u);
  }

  const duplicate = manifest('executable');
  duplicate.delivery.inputs.push(structuredClone(duplicate.delivery.inputs[0]));
  assert.throws(() => validateEditionProvider(duplicate), {
    code: 'edition_provider_input_duplicate',
  });

  const duplicatePath = manifest('executable');
  duplicatePath.delivery.inputs.push({
    ...structuredClone(duplicatePath.delivery.inputs[0]),
    id: 'second-input',
  });
  assert.throws(() => validateEditionProvider(duplicatePath), {
    code: 'edition_provider_input_duplicate',
  });

  const excessiveTotal = manifest('executable');
  excessiveTotal.limits.inputBytes = 5;
  excessiveTotal.delivery.inputs[0].bytes = 6;
  assert.throws(() => validateEditionProvider(excessiveTotal), {
    code: 'edition_provider_input_size_invalid',
  });

  const reserved = manifest('executable');
  reserved.delivery.inputs[0].id = 'provider-package';
  assert.throws(() => validateEditionProvider(reserved), {
    code: 'edition_provider_input_id_reserved',
  });
});

test('executable provider identity is exact and product-neutral', () => {
  const value = manifest('executable');
  assert.doesNotThrow(() => validateEditionProvider(value));
  for (const mutate of [
    (candidate) => (candidate.delivery.package.name = ''),
    (candidate) => (candidate.delivery.package.version = ''),
    (candidate) => (candidate.delivery.package.entrypoint = '../provider.mjs'),
    (candidate) => (candidate.delivery.package.packageJsonSha256 = '0'),
    (candidate) => (candidate.delivery.package.contentSha256 = '0'),
    (candidate) => (candidate.delivery.inputs[0].bytes = -1),
    (candidate) => (candidate.delivery.inputs[0].mediaType = ''),
  ]) {
    const candidate = manifest('executable');
    mutate(candidate);
    assert.throws(() => validateEditionProvider(candidate), /edition_provider_/u);
  }

  const unsupportedContract = manifest('executable');
  unsupportedContract.contracts.evolution = 'architecture.edition-evolution-input/v2';
  assert.throws(() => validateEditionProvider(unsupportedContract), {
    code: 'edition_provider_contract_unsupported',
  });

  const unknown = manifest('executable');
  unknown.delivery = { kind: 'remote' };
  assert.throws(() => validateEditionProvider(unknown), {
    code: 'edition_provider_delivery_kind_invalid',
  });
});

test('declarative evolution selection and expected identity agree', () => {
  const value = manifest();
  value.contracts.evolution = 'architecture.edition-evolution-input/v1';
  value.delivery.evolution = 'evolution.json';
  value.delivery.evolutionSha256 = C;
  value.expected.evolutionSha256 = C;
  assert.doesNotThrow(() => validateEditionProvider(value));

  value.expected.evolutionSha256 = null;
  assert.throws(() => validateEditionProvider(value), {
    code: 'edition_provider_evolution_identity_invalid',
  });
});

test('provider request validates exact selected bytes', () => {
  const request = requestFixture();
  assert.deepEqual(validateProviderRequest(request), request);

  const changed = requestFixture();
  changed.inputs[0].contentBase64 = Buffer.from('[]\n').toString('base64');
  assert.throws(() => validateProviderRequest(changed), {
    code: 'edition_provider_input_digest_mismatch',
  });

  const malformed = requestFixture();
  malformed.inputs[0].contentBase64 = '***';
  assert.throws(() => validateProviderRequest(malformed), {
    code: 'edition_provider_base64_invalid',
  });

  const duplicate = requestFixture();
  duplicate.inputs.push(structuredClone(duplicate.inputs[0]));
  assert.throws(() => validateProviderRequest(duplicate), {
    code: 'edition_provider_input_duplicate',
  });
});

test('provider protocol rejects malformed envelopes with stable diagnostics', () => {
  const unsupportedRequest = requestFixture();
  unsupportedRequest.schema = 'architecture.edition-provider-request/v2';
  assert.throws(() => validateProviderRequest(unsupportedRequest), {
    code: 'edition_provider_request_schema_unsupported',
  });

  const unsupportedReply = replyFixture();
  unsupportedReply.schema = 'architecture.edition-provider-reply/v2';
  assert.throws(() => validateProviderReply(unsupportedReply), {
    code: 'edition_provider_reply_schema_unsupported',
  });

  const emptyReply = replyFixture();
  emptyReply.source.members = [];
  assert.throws(() => validateProviderReply(emptyReply), {
    code: 'edition_provider_members_invalid',
  });

  const unsupportedReceipt = receiptFixture();
  unsupportedReceipt.schema = 'architecture.edition-provider-materialization/v2';
  assert.throws(() => validateProviderMaterialization(unsupportedReceipt), {
    code: 'edition_provider_materialization_schema_unsupported',
  });

  const unknownDelivery = receiptFixture();
  unknownDelivery.delivery = 'remote';
  assert.throws(() => validateProviderMaterialization(unknownDelivery), {
    code: 'edition_provider_delivery_kind_invalid',
  });

  const invalidInputs = receiptFixture();
  invalidInputs.inputs = {};
  assert.throws(() => validateProviderMaterialization(invalidInputs), {
    code: 'edition_provider_receipt_inputs_invalid',
  });

  const invalidReceiptInput = receiptFixture();
  invalidReceiptInput.inputs[0].bytes = -1;
  assert.throws(() => validateProviderMaterialization(invalidReceiptInput), {
    code: 'edition_provider_receipt_input_invalid',
  });

  const foreignProducer = receiptFixture();
  foreignProducer.producer.name = 'example-publisher';
  assert.throws(() => validateProviderMaterialization(foreignProducer), {
    code: 'edition_provider_producer_invalid',
  });

  const invalidRequestInput = requestFixture();
  invalidRequestInput.inputs[0].bytes = -1;
  assert.throws(
    () => validateProviderRequest(invalidRequestInput),
    (error) => {
      assert.equal(error.code, 'edition_provider_input_size_invalid');
      assert.equal(error.message, 'edition_provider_input_size_invalid:0');
      return true;
    },
  );
});

test('provider reply accepts only source and Edition values', () => {
  const reply = replyFixture();
  assert.deepEqual(validateProviderReply(reply), reply);

  for (const field of ['candidate', 'qualification', 'acceptance', 'publication', 'transition']) {
    assert.throws(() => validateProviderReply({ ...replyFixture(), [field]: {} }), {
      code: 'edition_provider_reply_fields_invalid',
    });
  }

  const duplicate = replyFixture();
  duplicate.source.members.push(structuredClone(duplicate.source.members[0]));
  assert.throws(() => validateProviderReply(duplicate), {
    code: 'edition_provider_member_duplicate',
  });

  const escape = replyFixture();
  escape.source.members[0].path = '../semantic.json';
  assert.throws(() => validateProviderReply(escape), {
    code: 'edition_provider_member_path_invalid',
  });

  const missing = replyFixture();
  missing.semanticMember = 'missing.json';
  assert.throws(() => validateProviderReply(missing), {
    code: 'edition_provider_semantic_member_missing',
  });

  const invalidSemantic = replyFixture();
  invalidSemantic.source.members[0].contentBase64 = Buffer.from('{').toString('base64');
  assert.throws(() => validateProviderReply(invalidSemantic), {
    code: 'edition_provider_semantic_json_invalid',
  });

  const invalidEdition = replyFixture();
  invalidEdition.edition.contentBase64 = Buffer.from('{').toString('base64');
  assert.throws(() => validateProviderReply(invalidEdition), {
    code: 'edition_provider_edition_json_invalid',
  });

  const invalidEvolution = replyFixture();
  invalidEvolution.evolution = { contentBase64: Buffer.from('{').toString('base64') };
  assert.throws(() => validateProviderReply(invalidEvolution), {
    code: 'edition_provider_evolution_json_invalid',
  });
});

test('materialization receipt is closed and binds execution to identities', () => {
  const receipt = receiptFixture();
  assert.deepEqual(validateProviderMaterialization(receipt), receipt);

  const stale = receiptFixture();
  stale.execution.kind = 'child-process';
  assert.throws(() => validateProviderMaterialization(stale), {
    code: 'edition_provider_execution_invalid',
  });

  const extra = { ...receiptFixture(), accepted: true };
  assert.throws(() => validateProviderMaterialization(extra), {
    code: 'edition_provider_materialization_fields_invalid',
  });

  const executable = receiptFixture();
  executable.delivery = 'executable';
  executable.execution.kind = 'child-process';
  executable.execution.durationMs = 17;
  assert.doesNotThrow(() => validateProviderMaterialization(executable));

  const duplicate = receiptFixture();
  duplicate.inputs.push(structuredClone(duplicate.inputs[0]));
  assert.throws(() => validateProviderMaterialization(duplicate), {
    code: 'edition_provider_input_duplicate',
  });
});
