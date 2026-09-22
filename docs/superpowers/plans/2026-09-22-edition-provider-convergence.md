# Edition Provider Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release Architecture Publisher `0.3.0-alpha.0` with one source-owned,
provider-neutral Edition Provider contract, prove declarative and executable
delivery through the same downstream compiler, and freeze exact migration
inputs for separate AIGW and ETHOS repository Changes.

**Architecture:** `archpub edition build` accepts an exact direct-or-provider
plan union. A provider manifest selects either closed declarative files or one
installed package export; both materialize the existing Source Bundle, Claim
Model, Edition, and optional evolution values before the unchanged compiler.
Provider provenance is bound by an outer materialization receipt and never
changes semantic, Edition, scene, or Candidate digests.

**Tech Stack:** Node.js 22+, ECMAScript modules, Node test runner, c8, ESLint,
TypeScript checked JavaScript, Prettier, Knip, OpenSpec 1.13.1, npm package
packing, existing Architecture Publisher renderer and qualification stack.

**Spec:**
`openspec/changes/edition-provider-convergence/design.md` and
`openspec/changes/edition-provider-convergence/specs/edition-provider/spec.md`

## Global Constraints

- Preserve `v0.2.0-alpha.0` and every historical alpha.7 byte and tag.
- Retain the sole public command root `archpub`; do not add a provider command
  root, registry, daemon, marketplace, or ambient discovery.
- Provider selection is exact and product-neutral; generic modules may not name
  or branch on ETHOS, AIGW, repository paths, or provider package names.
- Executable providers run in a bounded child process and never in the
  long-lived Publisher process.
- The child boundary is portability and failure containment, not an
  adversarial operating-system sandbox.
- Source products retain meaning, acceptance, repository transition, and
  release authority; Architecture Publisher owns transformation mechanics.
- Static and interactive media remain sibling compilers and may not share
  coordinates, DOM, screenshots, or approval.
- No new runtime dependency is admitted; use Node core and existing public
  Architecture Publisher contracts.
- One OpenSpec Change and `tasks.md` remain the sole progress ledger for this
  repository.
- Every tracked mutation requires fresh ETHOS status and exact-path prewrite
  admission with the current actor, Change, HEAD, and Work Lane lease.

## Review Focus

1. A manifest whose mode, package root, or selected input is ambiguous must fail
   before any provider code runs.
2. A provider reply containing a Candidate, qualification, acceptance,
   publication, repository transition, unknown field, or malformed byte value
   must fail closed.
3. Direct and provider plans over identical semantic bytes must retain identical
   Claim Model, Edition, scene, and Candidate digests.
4. Relocated installed execution with an empty HOME, empty configuration, no
   Git, and a misleading adjacent checkout must produce the same result.
5. Timeout, oversized output, child crash, partial JSON, signal interruption,
   and cleanup failure must leave no accepted receipt or reusable partial
   output.

---

### Task 1: Provider manifest and protocol contracts

**Files:**

- Create: `packages/publisher/src/provider/contract.mjs`
- Create: `packages/publisher/src/provider/protocol.mjs`
- Create: `packages/publisher/src/provider/index.mjs`
- Modify: `packages/publisher/src/index.mjs`
- Modify: `packages/publisher/package.json`
- Test: `tests/edition-provider-contract.test.mjs`
- Test: `tests/package-boundaries.test.mjs`
- Test: `tests/product-identity.test.mjs`

**Interfaces:**

- Produces:
  `validateEditionProvider(value) -> EditionProvider`,
  `editionProviderDigest(value) -> sha256`,
  `validateProviderRequest(value) -> ProviderRequest`,
  `validateProviderReply(value) -> ProviderReply`, and
  `validateProviderMaterialization(value) -> MaterializationReceipt`.
- Exports the provider API only from `architecture-publisher/provider` and the
  root namespace `provider`.

- [ ] **Step 1: Write the failing manifest and protocol tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  editionProviderDigest,
  validateEditionProvider,
  validateProviderReply,
} from '../packages/publisher/src/provider/index.mjs';

test('provider manifest is an exact tagged union', () => {
  const manifest = fixture('declarative');
  assert.equal(validateEditionProvider(manifest).delivery.kind, 'declarative');
  assert.match(editionProviderDigest(manifest), /^[0-9a-f]{64}$/u);
  assert.throws(() => validateEditionProvider({ ...manifest, executable: {} }), {
    code: 'edition_provider_fields_invalid',
  });
});

test('provider reply rejects later-stage authority', () => {
  assert.throws(
    () => validateProviderReply({ ...replyFixture(), publication: { state: 'accepted' } }),
    { code: 'edition_provider_reply_fields_invalid' },
  );
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run:
`node --test tests/edition-provider-contract.test.mjs`

Expected: FAIL because `packages/publisher/src/provider/index.mjs` does not
exist.

- [ ] **Step 3: Implement exact-field contracts**

Implement these public constants and functions:

```js
export const EDITION_PROVIDER_LIMITS = Object.freeze({
  inputs: 256,
  inputBytes: 128 * 1024 * 1024,
  replyBytes: 128 * 1024 * 1024,
  timeoutMs: 30_000,
});

export function validateEditionProvider(value) {}
export function editionProviderDigest(value) {}
export function validateProviderRequest(value) {}
export function validateProviderReply(value) {}
export function validateProviderMaterialization(value) {}
```

The manifest schema is `architecture.edition-provider/v1`; request, reply, and
receipt schemas are respectively
`architecture.edition-provider-request/v1`,
`architecture.edition-provider-reply/v1`, and
`architecture.edition-provider-materialization/v1`. Use exact key sets,
structured clones, canonical JSON, the existing digest style, strict base64
round trips, duplicate-ID rejection, and fixed Publisher ceilings.

- [ ] **Step 4: Export the narrow public surface**

Add `./provider` to `packages/publisher/package.json`; import the namespace from
`src/index.mjs`; export only the five contract functions and fixed limits from
`src/provider/index.mjs`. Do not export worker or process-runner internals.

- [ ] **Step 5: Run focused and package-boundary GREEN**

Run:

```bash
node --test tests/edition-provider-contract.test.mjs \
  tests/package-boundaries.test.mjs tests/product-identity.test.mjs
npm run check:types
```

Expected: all tests and checked JavaScript contracts pass.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/publisher/src/provider packages/publisher/src/index.mjs \
  packages/publisher/package.json tests/edition-provider-contract.test.mjs \
  tests/package-boundaries.test.mjs tests/product-identity.test.mjs
git commit -S -m "feat(provider): define edition provider contracts"
```

### Task 2: Declarative materialization

**Files:**

- Create: `packages/publisher/src/provider/declarative.mjs`
- Create: `packages/publisher/src/provider/input.mjs`
- Create: `tests/edition-provider-declarative.test.mjs`
- Create: `tests/fixtures/providers/declarative/valid/provider.json`
- Create: `tests/fixtures/providers/declarative/valid/source/manifest.json`
- Create: `tests/fixtures/providers/declarative/valid/source/semantic.json`
- Create: `tests/fixtures/providers/declarative/valid/edition.json`

**Interfaces:**

- Consumes: `validateEditionProvider`, existing `readFileEnvelope`,
  `readSourceBundle`, `claimModelDigest`, `editionDigest`, and
  `compileEditionEvolution` validation paths.
- Produces:
  `readEditionProviderInput(file, digest) -> { manifest, root, sha256 }` and
  `materializeDeclarativeProvider(selection) -> MaterializedEditionInput`.

- [ ] **Step 1: Write RED tests for closure and identity**

```js
test('declarative provider materializes exact ordinary inputs', async () => {
  const result = await materializeDeclarativeProvider(validSelection());
  assert.equal(result.sourceSha256, expected.sourceManifestSha256);
  assert.equal(result.semanticDigest, expected.claimModelDigest);
  assert.equal(result.editionDigest, expected.editionDigest);
});

for (const scenario of ['changed-byte', 'extra-file', 'escape', 'symlink']) {
  test(`declarative provider rejects ${scenario}`, async () => {
    await assert.rejects(materializeDeclarativeProvider(fixture(scenario)));
  });
}
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/edition-provider-declarative.test.mjs`

Expected: FAIL because declarative materialization is absent.

- [ ] **Step 3: Implement exact provider-manifest selection**

`readEditionProviderInput` must read one digest-selected JSON file, forbid
symlink ancestors, require every delivery path to remain below the manifest
directory, and return verified bytes before any provider payload is opened.

- [ ] **Step 4: Implement declarative materialization**

Read the selected Source Bundle and Edition with existing owners, select the
semantic member, validate Claim Model and Edition, validate optional evolution,
compare every computed identity with `manifest.expected`, and return ordinary
absolute compiler inputs plus a receipt value. Do not copy, rediscover, or
rewrite the source product.

- [ ] **Step 5: Run focused, source, and semantic GREEN**

Run:

```bash
node --test tests/edition-provider-declarative.test.mjs \
  tests/source-bundle.test.mjs tests/claim-model.test.mjs \
  tests/edition-contract.test.mjs tests/edition-evolution.test.mjs
```

Expected: all tests pass; changed or unselected bytes fail before compilation.

- [ ] **Step 6: Commit Task 2**

```bash
git add packages/publisher/src/provider/declarative.mjs \
  packages/publisher/src/provider/input.mjs \
  tests/edition-provider-declarative.test.mjs tests/fixtures/providers/declarative
git commit -S -m "feat(provider): materialize declarative editions"
```

### Task 3: Executable provider process boundary

**Files:**

- Create: `packages/publisher/src/provider/executable.mjs`
- Create: `packages/publisher/src/provider/worker.mjs`
- Create: `tests/edition-provider-executable.test.mjs`
- Create: `tests/fixtures/providers/executable/package/package.json`
- Create: `tests/fixtures/providers/executable/package/provider.mjs`
- Create: `tests/fixtures/providers/executable/inputs/source.json`

**Interfaces:**

- Consumes: provider contract/protocol validators and existing file-integrity
  helpers.
- Produces:
  `materializeExecutableProvider(selection) -> MaterializedEditionInput`.
- The selected package export is exactly
  `materializeEditionProvider(request) -> reply | Promise<reply>`.

- [ ] **Step 1: Write RED tests for selected execution and containment**

```js
test('executable provider runs only the selected export in a child', async () => {
  const result = await materializeExecutableProvider(validSelection());
  assert.equal(result.receipt.delivery.kind, 'executable');
  assert.equal(globalThis.__providerExecuted, undefined);
});

test('executable provider fails on timeout without accepting partial output', async () => {
  await assert.rejects(materializeExecutableProvider(timeoutSelection()), {
    code: 'edition_provider_timeout',
  });
  await assert.rejects(fs.access(partialReceiptPath));
});
```

Cover package name/version/package-json digest mismatch, export escape,
symlinked root, duplicate/changed inputs, empty HOME and XDG config, misleading
adjacent checkout, crash, signal, malformed/partial/oversized stdout, nonempty
stderr policy, nondeterministic second reply, forbidden reply fields, and
scratch cleanup.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/edition-provider-executable.test.mjs`

Expected: FAIL because executable materialization is absent.

- [ ] **Step 3: Implement package and input selection**

Require an absolute `providerPackageRoot` only for executable delivery. Verify
its real directory, package manifest digest, exact name/version, and selected
public export; resolve the export below the package root. Read only manifest
listed inputs and pass their identifiers, media types, sizes, digests, and
base64 bytes in the versioned request.

- [ ] **Step 4: Implement the child worker and parent runner**

Use `process.execPath`, an owned scratch `cwd`, empty user configuration, closed
stdin after one JSON request, stdout byte accounting, a hard timeout no greater
than 30 seconds, explicit child termination, and a single JSON reply. The worker
imports only the resolved entrypoint URL and calls only
`materializeEditionProvider`.

- [ ] **Step 5: Materialize ordinary inputs and verify determinism**

Decode the reply, reconstruct a Source Bundle and Edition in parent-owned
scratch space, validate all ordinary contracts and expected identities, execute
the same request twice in conformance mode, compare exact replies, and remove
scratch state in `finally` on success or failure.

- [ ] **Step 6: Run focused and interruption GREEN**

Run:

```bash
node --test tests/edition-provider-executable.test.mjs
node --test tests/runtime.test.mjs tests/installed-cli.test.mjs
```

Expected: all tests pass with no residual child process or scratch directory.

- [ ] **Step 7: Commit Task 3**

```bash
git add packages/publisher/src/provider/executable.mjs \
  packages/publisher/src/provider/worker.mjs \
  tests/edition-provider-executable.test.mjs tests/fixtures/providers/executable
git commit -S -m "feat(provider): isolate executable materialization"
```

### Task 4: Edition build union and provenance receipt

**Files:**

- Modify: `packages/publisher/src/provider/input.mjs`
- Create: `packages/publisher/src/provider/materialize.mjs`
- Modify: `packages/publisher/src/compiler/edition.mjs`
- Modify: `packages/publisher/src/cli/commands.mjs`
- Modify: `packages/publisher/src/compiler/candidate.mjs`
- Create: `tests/edition-provider-build.test.mjs`
- Modify: `tests/cli.test.mjs`
- Modify: `tests/edition-candidate.test.mjs`

**Interfaces:**

- Consumes: direct plan and provider selection union.
- Produces:
  `withMaterializedEditionProvider(selection, callback)`, an ordinary compiler
  plan, and `provider.json` in the outer output bundle only when provider mode
  is selected.

- [ ] **Step 1: Write RED direct/provider union and digest-parity tests**

```js
test('provider plan preserves candidate identity', async () => {
  const direct = await compileEditionCandidateInput(directPlan, directSha);
  const provided = await compileEditionCandidateInput(providerPlan, providerSha);
  for (const key of [
    'candidateSha256',
    'semanticDigest',
    'editionDigest',
    'staticSceneDigest',
    'interactiveSceneDigest',
  ])
    assert.equal(provided[key], direct[key]);
  assert.match(provided.providerMaterializationSha256, /^[0-9a-f]{64}$/u);
});
```

Also assert that mixed direct/provider fields, missing executable package root,
declarative package root, and unknown keys fail before materialization.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:
`node --test tests/edition-provider-build.test.mjs tests/cli.test.mjs`

Expected: FAIL because provider build plans are rejected.

- [ ] **Step 3: Implement the exact build-plan union**

Keep the current six-field direct plan unchanged. Add a four-field provider
plan: `providerManifest`, `providerManifestSha256`, optional
`providerPackageRoot`, and `output`. Dispatch only on exact fields, never on
product or repository identity.

- [ ] **Step 4: Bind provenance outside semantic identity**

Pass materialized ordinary inputs into the existing compiler. Add canonical
`provider.json` bytes to the outer bundle and return
`providerMaterializationSha256`; do not add provider fields to Claim Model,
Edition, scene, or Candidate digest functions.

- [ ] **Step 5: Keep CLI identity and help stable**

Retain the exact public form
`archpub edition build <request.json> --sha256 <digest>`. Update only its help
description to state that the request selects direct inputs or one Edition
Provider. Assert no `archpub provider` route exists.

- [ ] **Step 6: Run focused and compiler GREEN**

Run:

```bash
node --test tests/edition-provider-build.test.mjs tests/cli.test.mjs \
  tests/edition-candidate.test.mjs tests/semantic-atlas.test.mjs
```

Expected: direct behavior remains green and provider parity passes.

- [ ] **Step 7: Commit Task 4**

```bash
git add packages/publisher/src/provider packages/publisher/src/compiler \
  packages/publisher/src/cli/commands.mjs tests/edition-provider-build.test.mjs \
  tests/cli.test.mjs tests/edition-candidate.test.mjs
git commit -S -m "feat(provider): integrate edition build materialization"
```

### Task 5: Dependency rules and common conformance

**Files:**

- Create: `conformance/journeys/provider/run.mjs`
- Create: `conformance/fixtures/provider-contract-matrix.json`
- Create: `tests/edition-provider-conformance.test.mjs`
- Modify: `tests/module-boundaries.test.mjs`
- Modify: `tests/package-boundaries.test.mjs`
- Modify: `eslint.config.mjs`
- Modify: `knip.json`

**Interfaces:**

- Consumes: installed `architecture-publisher/provider`, direct and provider
  Edition build, provider fixtures.
- Produces: one conformance report whose predicates are identical for both
  delivery modes and explicitly non-authorizing.

- [ ] **Step 1: Write RED dependency and conformance tests**

Add fixture packages that import `architecture-publisher/renderers/archify`,
`architecture-publisher/qualification`, `architecture-publisher/publication`,
Git, and a sibling checkout. Assert the report names the exact forbidden import
or path. Add generic-kernel fixtures containing `ETHOS`, `AIGW`, and provider
package names; assert module-boundary rejection.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
node --test tests/edition-provider-conformance.test.mjs \
  tests/module-boundaries.test.mjs tests/package-boundaries.test.mjs
```

Expected: FAIL because provider boundaries are not enforced.

- [ ] **Step 3: Implement one conformance predicate set**

The report must include manifest closure, input identity, output schema,
determinism, relocation, empty configuration, no adjacent checkout, dependency
direction, resource bounds, later-stage rejection, and explicit
`acceptance: not-performed`, `publication: not-performed`, and
`independentVerification: not-performed`.

- [ ] **Step 4: Extend static ownership gates**

Make provider source depend only on Node core and public source, semantics,
Edition, and renderer-neutral Scene exports. Make generic source reject adopter
names and source-product loaders. Scan real package exports rather than text-only
filename assumptions.

- [ ] **Step 5: Run focused and static GREEN**

Run:

```bash
node --test tests/edition-provider-conformance.test.mjs \
  tests/module-boundaries.test.mjs tests/package-boundaries.test.mjs
npm run check:lint
npm run check:types
npm run check:dead-code
```

Expected: all provider modes cross one predicate set and invalid fixtures fail
for their named reason.

- [ ] **Step 6: Commit Task 5**

```bash
git add conformance/journeys/provider conformance/fixtures/provider-contract-matrix.json \
  tests/edition-provider-conformance.test.mjs tests/module-boundaries.test.mjs \
  tests/package-boundaries.test.mjs eslint.config.mjs knip.json
git commit -S -m "test(provider): enforce common conformance"
```

### Task 6: Self-hosted declarative migration

**Files:**

- Modify: `conformance/journeys/self-host/build.mjs`
- Modify: `conformance/journeys/self-host/README.md`
- Modify: `tests/self-hosted-adopter.test.mjs`
- Modify: `tests/first-party-matrix.test.mjs`
- Modify: `conformance/fixtures/first-party-contract-matrix.json`
- Create: `tests/fixtures/providers/self/provider.json`

**Interfaces:**

- Consumes: the existing self-authored Source Bundle and Edition values.
- Produces: a declarative provider manifest and provider build plan before the
  ordinary Edition build.

- [ ] **Step 1: Freeze the current self parity baseline**

Run the current self-host journey and record its Source Bundle, Claim Model,
Edition, static scene, interactive scene, and Candidate digests in the focused
test fixture. Treat outer bundle identity as intentionally changeable because it
will gain `provider.json`.

- [ ] **Step 2: Write the RED self-provider test**

Assert the journey emits `provider.json`, uses the provider form of the build
plan, and retains every frozen semantic/Candidate digest. Assert no self product
branch enters generic provider code.

- [ ] **Step 3: Run the focused test and confirm RED**

Run:
`node --test tests/self-hosted-adopter.test.mjs tests/first-party-matrix.test.mjs`

Expected: FAIL because self still hands a direct plan to the compiler.

- [ ] **Step 4: Generate and select the declarative provider**

After self authoring produces the ordinary Source Bundle and Edition, write one
exact provider manifest and provider-form build plan. Keep self authoring in the
self Edition owner; the provider is only the portable boundary.

- [ ] **Step 5: Run relocated installed self GREEN**

Pack core and self Edition, install them into an isolated temporary directory,
set an empty HOME and configuration roots, remove Git from the child PATH, place
a misleading checkout beside the installation, and run build, qualification,
publication replacement, and recovery. Compare every frozen digest and provider
receipt.

- [ ] **Step 6: Commit Task 6**

```bash
git add conformance/journeys/self-host tests/self-hosted-adopter.test.mjs \
  tests/first-party-matrix.test.mjs conformance/fixtures/first-party-contract-matrix.json \
  tests/fixtures/providers/self/provider.json
git commit -S -m "refactor(self): cross declarative provider boundary"
```

### Task 7: Migration packets, ownership, and DR decision contract

**Files:**

- Create: `docs/migration/aigw-edition-provider.md`
- Create: `docs/migration/ethos-edition-provider.md`
- Create: `docs/reference/edition-provider.md`
- Create: `docs/reference/disaster-recovery-decision-contract.md`
- Modify: `docs/edition-contract.md`
- Modify: `docs/product-contract.md`
- Modify: `README.md`
- Modify: `skills/architecture-publisher/SKILL.md`
- Modify: `conformance/fixtures/aigw-source-owned-handoff.json`
- Modify: `conformance/fixtures/ethos-source-owned-handoff.json`

**Interfaces:**

- Produces exact handoff inputs for separate AIGW and ETHOS Changes; these files
  do not authorize mutation in either repository.
- Produces the decision-ready, explicitly unproved off-host DR contract.

- [ ] **Step 1: Write RED documentation and ownership assertions**

Extend ecosystem projection tests to require one provider term, one CLI root,
separate subject/producer/authorization-owner/custodian identities, and explicit
non-authority language. Reject workstation paths, adjacent checkout imports,
central mutable Editions, copied progress ledgers, and compatibility aliases.

- [ ] **Step 2: Run the documentation tests and confirm RED**

Run:

```bash
node --test tests/ecosystem-projections.test.mjs \
  tests/aigw-adopter.test.mjs tests/ethos-source-owned-handoff.test.mjs
```

Expected: FAIL until provider-specific migration packets exist.

- [ ] **Step 3: Write the provider reference and migration packets**

AIGW packet: move four current values to one product-owned provider root,
preserve two immutable history values as history, add a declarative manifest,
prove parity/relocation, delete the mutable `docs` owner, and retain AIGW
acceptance/publication authority.

ETHOS packet: create one minimal executable provider package, retain only source
adaptation and Edition authorship, prove parity before removing renderer,
browser, raster, qualification, review, publication, Git/forge, and governance
mechanics, and retain ETHOS lane/proof/CAS/acceptance authority.

- [ ] **Step 4: Write the DR decision contract**

State the required operator choices: independent destination, custody owner,
retention, encryption, bounded credential, restore environment, and exact
restore acceptance. Mark off-host recovery `unproved`; do not treat GitLab,
packages, CI, Documents, or same-disk copies as an independent recovery domain.

- [ ] **Step 5: Run documentation and projection GREEN**

Run:

```bash
npm run check:docs
node --test tests/ecosystem-projections.test.mjs \
  tests/aigw-adopter.test.mjs tests/ethos-source-owned-handoff.test.mjs
```

Expected: all guidance is precise, portable, source-owned, and non-authorizing.

- [ ] **Step 6: Commit Task 7**

```bash
git add README.md docs skills/architecture-publisher/SKILL.md \
  conformance/fixtures/aigw-source-owned-handoff.json \
  conformance/fixtures/ethos-source-owned-handoff.json \
  tests/ecosystem-projections.test.mjs tests/aigw-adopter.test.mjs \
  tests/ethos-source-owned-handoff.test.mjs
git commit -S -m "docs(provider): publish source-owned migration contracts"
```

### Task 8: Full qualification and `0.3.0-alpha.0` release

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `packages/publisher/package.json`
- Modify: `editions/self/package.json`
- Modify: `.ethos/release.toml`
- Modify: `openspec/changes/edition-provider-convergence/tasks.md`
- Create: exact evidence under the repository's existing governed evidence
  owner selected by the release workflow.

**Interfaces:**

- Consumes: the frozen implementation and all prior task evidence.
- Produces: signed `v0.3.0-alpha.0`, exact release/package assets, hosted CI and
  remote readback, accepted branches, archived Change, retired Work Lane, and
  source-owned follow-on inputs.

- [ ] **Step 1: Run the complete local quality graph**

Run:

```bash
npm run check
git diff --check
npx openspec validate --all --strict --no-interactive
```

Expected: format, lint, types, imports, dead code, docs, OpenSpec, behavior,
coverage, and package validity all pass at one exact HEAD.

- [ ] **Step 2: Run installed, browser, accessibility, publication, and recovery journeys**

Execute the existing installed-product, semantic browser, accessibility,
pair-replacement, interruption-recovery, self-hosted, and provider-conformance
journeys from freshly packed packages in relocated offline directories. Preserve
exact commands, HEAD, archive digest, content-tar digest, candidate digests,
provider receipt digest, browser observations, and cleanup results.

- [ ] **Step 3: Review the frozen diff and evidence**

Generate the whole-branch review package from the merge base, check every Review
Focus item, inspect all `Ruling:` lines in the execution ledger, and resolve all
P0/P1 findings plus any P2 finding that contradicts the spec or public contract.

- [ ] **Step 4: Version the successor without rewriting history**

Set workspace, core, and self Edition versions to `0.3.0-alpha.0`; update the
lockfile and release policy; verify `v0.2.0-alpha.0` and every alpha.7 tag, source
object, and release asset remain unchanged.

- [ ] **Step 5: Complete governed lifecycle and remote publication**

Use current ETHOS `status`, exact-path prewrite, `plan --changed`, proof, land,
accepted-source integration, OpenSpec archive, publication, and closeout
transitions. Sign the release tag and assets, wait for hosted CI, read back exact
remote refs/assets/package bytes, and test a fresh installation from the
published package.

- [ ] **Step 6: Perform bounded housekeeping**

Enumerate owned scratch directories, child processes, package caches, temporary
evidence, Work Lane state, proposal refs, and worktrees. Remove only proved
disposable owned residue; preserve immutable release evidence, foreign state,
and `0.2` history. Verify clean accepted worktrees and no active owned Change or
Work Lane remains.

- [ ] **Step 7: Commit the final release preparation**

```bash
git add package.json package-lock.json packages/publisher/package.json \
  editions/self/package.json .ethos/release.toml \
  openspec/changes/edition-provider-convergence/tasks.md
git commit -S -m "chore(release): prepare architecture publisher 0.3"
```

## Follow-on repository plans

After the exact Architecture Publisher package and Provider contract are
published and read back, create independent written specs and implementation
plans in AIGW and ETHOS. Each repository must obtain its own current native
admission, OpenSpec Change, Work Lane, tests, acceptance, publication, and
closeout. The migration packets from Task 7 are inputs, not cross-repository
write authority. Durable SDD/COMET/SpecD/semantic and formal-method research is
owned by the ETHOS follow-on because it changes ETHOS product direction rather
than Architecture Publisher mechanics.
